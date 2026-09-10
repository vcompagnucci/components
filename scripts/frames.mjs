/* ═══════════════════════════════════════════════════════════════
   HOW LONG A FRAME LASTS. Read from the container, not estimated.

   It is the part that makes frame by frame possible. Without the exact
   number, pressing an arrow moves "roughly one frame" and counting
   frames to get a duration stops being useful, which is exactly what
   the vault is for: you take the inspiration to the frame where the
   gesture starts, you count to where it ends, and that gives you the
   milliseconds.

   THERE IS NO ffprobe ON THIS MACHINE and no dependency gets added for
   this. An mp4 and a .mov are the same format of nested boxes
   (ISO-BMFF / QuickTime) and the number lives in two of them:

     mdhd  the TIMESCALE of the track: how many units per second
     stts  the table of durations: how many units each sample lasts

     duration of one frame = sample_delta / timescale

   The VIDEO track is the one that gets read, not the first one that
   turns up: the audio track has its own timescale (48000) and would
   give a meaningless number. Which one is which is told by the `hdlr`
   box, which in the video one declares 'vide'.

   VARIABLE RATE: if stts brings more than one entry with different
   deltas, the video does not have a frame of fixed duration. In that
   case the MOST FREQUENT delta is returned and `variable: true` says
   so, so that whoever uses it knows the step is approximate instead of
   believing it is exact.

   Only the boxes that are needed get read and the rest is skipped by
   its size, so the whole file never loads into memory: a 2 MB clip is
   resolved by reading a few kilobytes of header.
   ═══════════════════════════════════════════════════════════════ */
import fs from 'node:fs'

/* The boxes that have to be OPENED to keep going down. The rest gets
   skipped whole: mdat, which is the video itself and is 99% of it. */
const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl'])

/* Walks the boxes of a range and calls `visit` with each one. The boxes
   are [size:4][type:4][content], and a size of 1 means the real one
   comes in 8 more bytes after the type. */
function boxes(buf, start, end, visit) {
  let p = start
  while (p + 8 <= end) {
    let size = buf.readUInt32BE(p)
    const type = buf.toString('latin1', p + 4, p + 8)
    let body = p + 8
    if (size === 1) {
      if (p + 16 > end) break
      /* 64 bits. It is read as Number and not as BigInt on purpose: a
         file of more than 9 petabytes is not a case of this vault. */
      size = Number(buf.readBigUInt64BE(p + 8))
      body = p + 16
    } else if (size === 0) {
      size = end - p /* to the end */
    }
    if (size < 8 || p + size > end) break
    visit(type, body, p + size)
    p += size
  }
}

/* The header of the track: the timescale is at byte 12 (version 0) or
   at 20 (version 1, with 64-bit times). */
function readMdhd(buf, start) {
  const version = buf[start]
  return version === 1 ? buf.readUInt32BE(start + 20) : buf.readUInt32BE(start + 12)
}

/* The table of durations. Returns the most frequent delta and whether
   there is more than one. */
function readStts(buf, start, end) {
  const n = buf.readUInt32BE(start + 4)
  const counts = new Map()
  let total = 0
  for (let i = 0; i < n; i++) {
    const off = start + 8 + i * 8
    if (off + 8 > end) break
    const samples = buf.readUInt32BE(off)
    const delta = buf.readUInt32BE(off + 4)
    if (!delta) continue
    counts.set(delta, (counts.get(delta) || 0) + samples)
    total += samples
  }
  if (!counts.size) return null
  let best = 0
  let bestCount = 0
  for (const [delta, m] of counts) {
    if (m > bestCount) {
      bestCount = m
      best = delta
    }
  }
  return { delta: best, samples: total, variable: counts.size > 1 }
}

export function frameStepOf(path) {
  let fd
  try {
    fd = fs.openSync(path, 'r')
    const total = fs.fstatSync(fd).size

    /* Find moov without reading everything: the top level boxes get
       walked reading only their 16 bytes of header. moov can be at the
       beginning (optimized for streaming) or at the end. */
    let moovStart = -1
    let moovEnd = -1
    {
      const header = Buffer.alloc(16)
      let p = 0
      while (p + 8 <= total) {
        if (fs.readSync(fd, header, 0, 16, p) < 8) break
        let size = header.readUInt32BE(0)
        const type = header.toString('latin1', 4, 8)
        let body = p + 8
        if (size === 1) {
          size = Number(header.readBigUInt64BE(8))
          body = p + 16
        } else if (size === 0) {
          size = total - p
        }
        if (size < 8) break
        if (type === 'moov') {
          moovStart = body
          moovEnd = p + size
          break
        }
        p += size
      }
    }
    if (moovStart < 0) return null

    /* moov does get read whole: it is the tables, not the video. In a
       2 MB clip that is tens of kilobytes. */
    const moov = Buffer.alloc(moovEnd - moovStart)
    fs.readSync(fd, moov, 0, moov.length, moovStart)

    let result = null
    /* Each trak is examined on its own and only the video one is kept. */
    boxes(moov, 0, moov.length, (type, start, end) => {
      if (type !== 'trak' || result) return
      let isVideo = false
      let timescale = 0
      let stts = null
      const descend = (b, from, to) => {
        boxes(b, from, to, (t, childStart, childEnd) => {
          if (t === 'hdlr') {
            /* handler_type is 8 bytes after the start of the body:
               version+flags (4) and pre_defined (4). */
            if (b.toString('latin1', childStart + 8, childStart + 12) === 'vide') isVideo = true
          } else if (t === 'mdhd') {
            timescale = readMdhd(b, childStart)
          } else if (t === 'stts') {
            stts = readStts(b, childStart, childEnd)
          } else if (CONTAINERS.has(t)) {
            descend(b, childStart, childEnd)
          }
        })
      }
      descend(moov, start, end)
      if (!isVideo || !timescale || !stts) return
      result = {
        fps: +(timescale / stts.delta).toFixed(6),
        /* What the player really uses: how much to advance. */
        step: +(stts.delta / timescale).toFixed(9),
        samples: stts.samples,
        timescale,
        delta: stts.delta,
        variable: stts.variable,
      }
    })
    return result
  } catch {
    return null
  } finally {
    if (fd !== undefined) fs.closeSync(fd)
  }
}
