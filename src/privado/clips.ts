import { useEffect, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════
   LOS CLIPS — lo que el puente encuentra en tu carpeta.

   El servidor devuelve HECHOS DEL SISTEMA DE ARCHIVOS y nada más: qué
   es, cuánto pesa, cuándo entró. Acá se le da SIGNIFICADO, y todo lo
   que se deriva sale del archivo mismo. No hay una base de datos ni un
   JSON que mantener a mano: soltás el clip en la carpeta y aparece.

     el nombre     sale del nombre del archivo
     nativo o web  sale de en qué carpeta lo soltaste
     la fecha      sale del sistema de archivos

   Eso es a propósito. Un manifiesto escrito a mano se desincroniza el
   día que arrastrás un archivo sin acordarte de editarlo, y entonces el
   vault miente. Acá no puede: la carpeta ES el manifiesto.
   ═══════════════════════════════════════════════════════════════ */

/* Lo que manda el servidor, tal cual. */
export type ClipCrudo = {
  ruta: string
  archivo: string
  carpeta: string
  ext: string
  clase: 'video' | 'imagen'
  bytes: number
  creado: string
  modificado: string
  /* Leídos del contenedor por el puente. Van en null cuando es una
     imagen o cuando el archivo no se pudo parsear, y hay que
     contemplarlo: sin cuadro exacto el paso con las flechas deja de ser
     un cuadro y pasa a ser una estimación, y entonces contar cuadros
     para sacar una duración no sirve. Ver scripts/cuadros.mjs. */
  cuadro: number | null
  fps: number | null
  cuadros: number | null
  cuadroVariable: boolean | null
}

export type Fuente = 'nativo' | 'web'

/* Lo que usa la interfaz. */
export type Clip = ClipCrudo & {
  nombre: string
  fuente: Fuente | null
  fecha: Date
  url: string
}

export type Estado =
  | { cargando: true }
  | { cargando: false; conectado: false; motivo: string }
  | { cargando: false; conectado: true; carpeta: string; clips: Clip[] }

/* "sheet-que-se-estira" → "Sheet que se estira".

   Sólo la primera en mayúscula, no cada palabra: un nombre de clip es
   una frase —"Sheet que se estira al arrastrar"— y no un título. Es lo
   que hacen las dos referencias con los suyos. */
const aFrase = (s: string) => {
  const limpio = s.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
  return limpio ? limpio[0].toUpperCase() + limpio.slice(1) : s
}

/* La carpeta clasifica. El primer nivel y nada más: "nativo/2026/x.mp4"
   sigue siendo nativo. Lo que no cae en ninguna de las dos queda sin
   clasificar en vez de inventarle una — así se ve que hay un clip
   suelto en la raíz y se puede acomodar. */
const fuenteDe = (carpeta: string): Fuente | null => {
  const primera = carpeta.split('/')[0].toLowerCase()
  return primera === 'nativo' || primera === 'web' ? primera : null
}

export function useClips(): Estado {
  const [estado, setEstado] = useState<Estado>({ cargando: true })

  useEffect(() => {
    let vivo = true
    fetch('/vault-media/__indice')
      .then((r) => r.json())
      .then((d) => {
        if (!vivo) return
        if (!d.conectado) {
          setEstado({ cargando: false, conectado: false, motivo: d.motivo })
          return
        }
        const clips: Clip[] = d.clips.map((c: ClipCrudo) => ({
          ...c,
          nombre: aFrase(c.archivo),
          fuente: fuenteDe(c.carpeta),
          fecha: new Date(c.creado),
          url: '/vault-media/' + c.ruta.split('/').map(encodeURIComponent).join('/'),
        }))
        /* De la más reciente a la menos, que es el orden que pediste y
           el que tienen las dos referencias. */
        clips.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
        setEstado({ cargando: false, conectado: true, carpeta: d.carpeta, clips })
      })
      .catch((e) => {
        if (vivo) setEstado({ cargando: false, conectado: false, motivo: String(e) })
      })
    return () => {
      vivo = false
    }
  }, [])

  return estado
}

/* El formato de las dos referencias: "Aug 18, 2026". */
export const enFecha = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
