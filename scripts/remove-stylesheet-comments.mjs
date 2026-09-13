/* ═══════════════════════════════════════════════════════════════
   THE COMMENTS OF A PIECE'S STYLESHEET DO NOT GET PUBLISHED.

   A piece carries its CSS in a template literal, `const STYLESHEET`,
   handed to a <style> element. That is a STRING as far as the bundler is
   concerned, and a minifier does not touch the inside of a string: the
   JS around it comes out with its identifiers mangled and its comments
   gone, and the CSS comes out verbatim, comment for comment.

   Measured on production before this plugin existed
   (components-three-pi.vercel.app, 2026-09-13):

     buttons-separate-Ntzj-RDl.js   27 comments   8 755 bytes   38 % of the chunk
     select-summary-ClzGkoHY.js     62 comments  27 212 bytes   71 % of the chunk

   And what is in them is not implementation. It is the METHOD: the
   SwiftUI probe, the least-squares fit with its rms, the levels read off
   the reference, the path to .context/. A minified bundle tells you the
   veil is at 0.675; the comment next to it tells you it came from
   `output = 0.325 · background + 159` fitted over three ramps of known
   value. The first one is visible on the screen anyway. The second is
   the work.

   So the comments stay where rule 4 wants them, at the top of the value
   in the repo, and they do not travel to the browser.

   apply:'build' is the gate, the mirror of the apply:'serve' in
   vault-media.mjs: in development the CSS arrives whole, because while
   you are working the comment in devtools IS the documentation. What
   gets removed is only what gets published.

   ─── AND THERE IS A GATE ON THE ARTIFACT, NOT ONLY ON THE SOURCE ───

   The transform below knows one name, `STYLESHEET`. A piece that calls
   its stylesheet something else would sail past it in silence, which is
   exactly how the leak got published in the first place: nobody was
   looking at the emitted file. So `generateBundle` reads what is ABOUT
   TO BE WRITTEN and fails the build if a CSS comment survived anywhere
   in it. That check does not depend on a name, on a file, or on this
   plugin having recognized anything.
   ═══════════════════════════════════════════════════════════════ */

/* The declaration the transform looks for. A piece's stylesheet is
   named this, and the gate on the artifact is what enforces it. */
const DECLARATION = /\bconst STYLESHEET\s*=\s*`/g

/* Marks where a comment was, so that the line it lived on can be
   judged afterwards. NUL and not a space: a space is legal in CSS, and
   with a space the collapsing below could not tell a line THIS removal
   emptied from a blank line the author wrote. It never survives: every
   one of them is gone before the chunk is returned. */
const MARK = '\u0000'

/* ─── THE LEGAL COMMENT IS THE ONE EXCEPTION ───
   `/*!` is the marker a minifier is required to preserve: a license
   that a dependency ships inside its own code. Removing it would strip
   a copyright notice, which is not ours to strip. It is the only shape
   the gate lets through, and it is spelled out so that nobody widens
   the hole by accident. */
const LEGAL = '/*!'

/* Walks a template literal starting at the backtick and returns the
   index just past its closing backtick, plus the ranges of literal text
   in it: everything that is NOT inside a ${...}.

   It is a scan and not a regular expression because both things nest. A
   ${} can hold a string holding a brace, and a template literal holding
   another template literal; a regex that matches to the first backtick
   or the first closing brace cuts the stylesheet in half and emits
   broken CSS. Returns null if the literal never closes, which means the
   file does not parse and is not this plugin's to report. */
function scanTemplate(src, backtick) {
  const chunks = []
  let literalStart = backtick + 1
  let i = literalStart

  while (i < src.length) {
    const c = src[i]

    if (c === '\\') {
      i += 2
      continue
    }

    if (c === '`') {
      chunks.push([literalStart, i])
      return { end: i + 1, chunks }
    }

    if (c === '$' && src[i + 1] === '{') {
      chunks.push([literalStart, i])
      const close = scanInterpolation(src, i + 2)
      if (close === null) return null
      i = close + 1
      literalStart = i
      continue
    }

    i++
  }

  return null
}

/* From just past the `${`, returns the index of the `}` that closes it.
   Counts braces and skips over anything where a brace does not mean a
   brace: the three kinds of quote, and a nested template literal, which
   can hold another interpolation and so recurses. */
function scanInterpolation(src, start) {
  let depth = 1
  let i = start

  while (i < src.length) {
    const c = src[i]

    if (c === '\\') {
      i += 2
      continue
    }

    if (c === '`') {
      const inner = scanTemplate(src, i)
      if (inner === null) return null
      i = inner.end
      continue
    }

    if (c === "'" || c === '"') {
      i = skipQuoted(src, i)
      if (i === null) return null
      continue
    }

    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return i
    }

    i++
  }

  return null
}

/* From the opening quote, returns the index just past the closing one.
   Null if the line ends first, which for a single or double quote means
   the file does not parse. */
function skipQuoted(src, start) {
  const quote = src[start]
  let i = start + 1
  while (i < src.length) {
    const c = src[i]
    if (c === '\\') {
      i += 2
      continue
    }
    if (c === quote) return i + 1
    if (c === '\n') return null
    i++
  }
  return null
}

/* ─── THE REMOVAL ITSELF ───
   Over one chunk of literal CSS text. Two things it has to get right:

   1. A `/*` INSIDE A CSS STRING IS NOT A COMMENT. `content: '/*'` is
      legal CSS, and cutting from there to the next comment terminator would eat the
      rules in between. No piece has one today (checked), and the day one
      does, this must not be the thing that breaks. So quotes are
      skipped, the same as in the scan above.

   2. AN UNCLOSED COMMENT IS NOT REMOVED. `/*` with no terminator after it
      comments out the whole rest of the stylesheet in a real CSS
      parser, so removing it would CHANGE what the page renders instead
      of only shrinking it. It is left alone and the gate on the
      artifact fails the build, which is the right outcome: the
      stylesheet is broken and somebody has to look at it. */
function removeComments(css) {
  let out = ''
  let i = 0

  while (i < css.length) {
    const c = css[i]

    if (c === "'" || c === '"') {
      const end = skipQuoted(css, i)
      /* An unterminated quote inside CSS: copied through untouched,
         same reasoning as the unclosed comment. */
      if (end === null) {
        out += css.slice(i)
        return out
      }
      out += css.slice(i, end)
      i = end
      continue
    }

    if (c === '/' && css[i + 1] === '*') {
      if (css.startsWith(LEGAL, i)) {
        const end = css.indexOf('*/', i + LEGAL.length)
        if (end === -1) {
          out += css.slice(i)
          return out
        }
        out += css.slice(i, end + 2)
        i = end + 2
        continue
      }
      const end = css.indexOf('*/', i + 2)
      if (end === -1) {
        out += css.slice(i)
        return out
      }
      out += MARK
      i = end + 2
      continue
    }

    out += c
    i++
  }

  return out
}

/* The line a removed comment lived on goes with it WHEN THE COMMENT WAS
   THE WHOLE LINE. Otherwise the 27 comments of buttons-separate leave 27
   blank lines behind and the bytes come back.

   Only the lines that the removal emptied: a blank line that was
   already in the stylesheet is left where the author put it, so the
   diff between what is published and what is in the repo is exactly the
   comments and nothing else. That is what makes this verifiable. */
function collapseEmptiedLines(css) {
  const lines = css.split('\n')
  const kept = []
  for (const line of lines) {
    if (line.includes(MARK) && line.replaceAll(MARK, '').trim() === '') continue
    kept.push(line.replaceAll(MARK, ''))
  }
  return kept.join('\n')
}

/* Exported for the test beside this file. Takes the source of a module
   and returns it with the comments of every `const STYLESHEET` removed,
   plus how many came out, so the caller can report a number instead of
   claiming success. */
export function withoutStylesheetComments(src) {
  let out = ''
  let cursor = 0
  let removed = 0
  let bytes = 0

  DECLARATION.lastIndex = 0
  let m
  while ((m = DECLARATION.exec(src)) !== null) {
    const backtick = m.index + m[0].length - 1
    const scanned = scanTemplate(src, backtick)
    if (scanned === null) break

    out += src.slice(cursor, backtick + 1)

    let inner = backtick + 1
    for (const [from, to] of scanned.chunks) {
      /* What sits between two literal chunks is an interpolation, copied
         through byte for byte. */
      out += src.slice(inner, from)
      const before = src.slice(from, to)
      const marked = removeComments(before)
      removed += marked.length - marked.replaceAll(MARK, '').length
      const after = collapseEmptiedLines(marked)
      bytes += before.length - after.length
      out += after
      inner = to
    }
    out += src.slice(inner, scanned.end)

    cursor = scanned.end
    DECLARATION.lastIndex = scanned.end
  }

  out += src.slice(cursor)
  return { code: out, removed, bytes }
}

/* A piece's component file is the one named after its folder:
   src/components/pieces/<slug>/<slug>.tsx. `notes.tsx` is public text
   that nobody is hiding, and `index.tsx` only re-exports. */
function pieceSlugOf(id) {
  const m = /\/src\/components\/pieces\/([^/]+)\/([^/]+)\.tsx$/.exec(id.split('?')[0])
  return m && m[1] === m[2] ? m[1] : null
}

/* Everything left in an emitted chunk that looks like a CSS comment.
   It reads the chunk as text and not as CSS on purpose: the point is
   that NOTHING shaped like a comment goes out, whichever string it was
   hiding in. */
function survivingComments(code) {
  const found = []
  let i = 0
  while ((i = code.indexOf('/*', i)) !== -1) {
    if (!code.startsWith(LEGAL, i)) found.push(code.slice(i, i + 80))
    i += 2
  }
  return found
}

export function removeStylesheetComments() {
  let removed = 0
  let bytes = 0

  return {
    name: 'remove-stylesheet-comments',
    apply: 'build',

    transform(code, id) {
      const slug = pieceSlugOf(id)
      if (!slug) return null
      const r = withoutStylesheetComments(code)
      if (!r.removed) return null
      removed += r.removed
      bytes += r.bytes
      /* No source map is returned, and none is needed: this project
         publishes none (verified, the .map is a 404), and the comments
         are removed before esbuild, which rewrites every position
         anyway. */
      return r.code
    },

    generateBundle(_options, bundle) {
      for (const [name, out] of Object.entries(bundle)) {
        if (out.type !== 'chunk') continue
        const left = survivingComments(out.code)
        if (!left.length) continue
        /* The build FAILS. It does not warn: a warning in a deploy log
           is a comment that got published. */
        this.error(
          `${name} still carries ${left.length} CSS comment(s) after the strip. ` +
            `A stylesheet that is not named STYLESHEET is not recognized by ` +
            `scripts/remove-stylesheet-comments.mjs. First one:\n  ${left[0]}`,
        )
      }
      this.info(`removed ${removed} stylesheet comment(s), ${bytes} bytes`)
    },
  }
}
