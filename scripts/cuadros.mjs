/* ═══════════════════════════════════════════════════════════════
   CUÁNTO DURA UN CUADRO — leído del contenedor, no estimado.

   Es la pieza que hace posible el cuadro a cuadro. Sin el número
   exacto, apretar una flecha mueve "más o menos un cuadro" y contar
   cuadros para sacar una duración deja de servir, que es justamente
   para lo que existe el vault: llevás la inspo al cuadro donde arranca
   el gesto, contás hasta donde termina, y eso te da los milisegundos.

   NO HAY ffprobe EN ESTA MÁQUINA y no se agrega una dependencia para
   esto. Un mp4 y un .mov son el mismo formato de cajas anidadas
   (ISO-BMFF / QuickTime) y el dato está en dos de ellas:

     mdhd  el TIMESCALE de la pista: cuántas unidades por segundo
     stts  la tabla de duraciones: cuántas unidades dura cada muestra

     duración de un cuadro = sample_delta / timescale

   Se lee la pista de VIDEO y no la primera que aparezca: la de audio
   tiene su propio timescale (48000) y daría un número sin sentido. Cuál
   es cuál lo dice la caja `hdlr`, que en la de video declara 'vide'.

   TASA VARIABLE: si stts trae más de una entrada con deltas distintos,
   el video no tiene un cuadro de duración fija. En ese caso se devuelve
   el delta MÁS FRECUENTE y se avisa con `variable: true`, para que
   quien lo use sepa que el paso es aproximado en vez de creer que es
   exacto.

   Sólo se leen las cajas que hacen falta y se saltea el resto por su
   tamaño, así que no se carga el archivo entero en memoria: un clip de
   2 MB se resuelve leyendo unos pocos kilobytes de cabecera.
   ═══════════════════════════════════════════════════════════════ */
import fs from 'node:fs'

/* Las cajas que hay que ABRIR para seguir bajando. El resto —mdat, que
   es el video en sí y pesa el 99%— se saltea entero. */
const CONTENEDORAS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl'])

/* Recorre las cajas de un rango y llama a `ver` con cada una. Las cajas
   son [tamaño:4][tipo:4][contenido], y un tamaño de 1 significa que el
   real viene en 8 bytes más después del tipo. */
function cajas(buf, inicio, fin, ver) {
  let p = inicio
  while (p + 8 <= fin) {
    let tam = buf.readUInt32BE(p)
    const tipo = buf.toString('latin1', p + 4, p + 8)
    let cuerpo = p + 8
    if (tam === 1) {
      if (p + 16 > fin) break
      /* 64 bits. Se lee como Number y no como BigInt a propósito: un
         archivo de más de 9 petabytes no es un caso de este vault. */
      tam = Number(buf.readBigUInt64BE(p + 8))
      cuerpo = p + 16
    } else if (tam === 0) {
      tam = fin - p /* hasta el final */
    }
    if (tam < 8 || p + tam > fin) break
    ver(tipo, cuerpo, p + tam)
    p += tam
  }
}

/* La cabecera de la pista: el timescale está en el byte 12 (versión 0)
   o en el 20 (versión 1, con tiempos de 64 bits). */
function leerMdhd(buf, ini) {
  const version = buf[ini]
  return version === 1 ? buf.readUInt32BE(ini + 20) : buf.readUInt32BE(ini + 12)
}

/* La tabla de duraciones. Devuelve el delta más frecuente y si hay más
   de uno. */
function leerStts(buf, ini, fin) {
  const n = buf.readUInt32BE(ini + 4)
  const cuenta = new Map()
  let total = 0
  for (let i = 0; i < n; i++) {
    const off = ini + 8 + i * 8
    if (off + 8 > fin) break
    const muestras = buf.readUInt32BE(off)
    const delta = buf.readUInt32BE(off + 4)
    if (!delta) continue
    cuenta.set(delta, (cuenta.get(delta) || 0) + muestras)
    total += muestras
  }
  if (!cuenta.size) return null
  let mejor = 0
  let mejorN = 0
  for (const [delta, m] of cuenta) if (m > mejorN) ((mejorN = m), (mejor = delta))
  return { delta: mejor, muestras: total, variable: cuenta.size > 1 }
}

export function cuadroDe(ruta) {
  let fd
  try {
    fd = fs.openSync(ruta, 'r')
    const total = fs.fstatSync(fd).size

    /* Encontrar moov sin leer todo: se recorren las cajas de nivel
       superior leyendo sólo sus 16 bytes de cabecera. moov puede estar
       al principio (optimizado para streaming) o al final. */
    let moovIni = -1
    let moovFin = -1
    {
      const cab = Buffer.alloc(16)
      let p = 0
      while (p + 8 <= total) {
        if (fs.readSync(fd, cab, 0, 16, p) < 8) break
        let tam = cab.readUInt32BE(0)
        const tipo = cab.toString('latin1', 4, 8)
        let cuerpo = p + 8
        if (tam === 1) {
          tam = Number(cab.readBigUInt64BE(8))
          cuerpo = p + 16
        } else if (tam === 0) {
          tam = total - p
        }
        if (tam < 8) break
        if (tipo === 'moov') {
          moovIni = cuerpo
          moovFin = p + tam
          break
        }
        p += tam
      }
    }
    if (moovIni < 0) return null

    /* moov sí se lee entero: son las tablas, no el video. En un clip de
       2 MB son decenas de kilobytes. */
    const moov = Buffer.alloc(moovFin - moovIni)
    fs.readSync(fd, moov, 0, moov.length, moovIni)

    let salida = null
    /* Cada trak se examina por separado y sólo se queda con la de video. */
    cajas(moov, 0, moov.length, (tipo, ini, fin) => {
      if (tipo !== 'trak' || salida) return
      let esVideo = false
      let timescale = 0
      let stts = null
      const bajar = (b, i, f) => {
        cajas(b, i, f, (t, ci, cf) => {
          if (t === 'hdlr') {
            /* handler_type está 8 bytes después del inicio del cuerpo:
               versión+flags (4) y pre_defined (4). */
            if (b.toString('latin1', ci + 8, ci + 12) === 'vide') esVideo = true
          } else if (t === 'mdhd') {
            timescale = leerMdhd(b, ci)
          } else if (t === 'stts') {
            stts = leerStts(b, ci, cf)
          } else if (CONTENEDORAS.has(t)) {
            bajar(b, ci, cf)
          }
        })
      }
      bajar(moov, ini, fin)
      if (!esVideo || !timescale || !stts) return
      salida = {
        fps: +(timescale / stts.delta).toFixed(6),
        /* Lo que de verdad usa el reproductor: cuánto avanzar. */
        cuadro: +(stts.delta / timescale).toFixed(9),
        cuadros: stts.muestras,
        timescale,
        delta: stts.delta,
        variable: stts.variable,
      }
    })
    return salida
  } catch {
    return null
  } finally {
    if (fd !== undefined) fs.closeSync(fd)
  }
}
