import { useCallback, useEffect, useRef, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════
   LAS VISTAS DEL PLAYGROUND — cada una es un lienzo.

   Al revés que los clips, esto NO se deriva del disco: un clip existe
   porque soltaste un archivo en una carpeta, y una vista existe porque
   la creaste. Así que sí hay algo que mantener, y vive en
   .lima-playground.json en la raíz del vault, al lado de las fichas.

   POR QUÉ EN EL VAULT Y NO EN localStorage: una vista referencia clips
   por su ruta, así que pertenece al mismo lugar que ellos. En
   localStorage se perdería al limpiar el navegador y no se podría mirar
   desde otro, y las dos cosas serían raras para algo que es tan tuyo
   como los clips.

   EL SERVIDOR NO CONFÍA EN ESTO. Todo lo que se manda se sanea del otro
   lado —campos conocidos, números acotados, tipos de frame de una
   lista— así que este archivo puede quedarse con la parte cómoda.
   ═══════════════════════════════════════════════════════════════ */

export type TipoFrame = 'pieza' | 'clip' | 'boceto'

/* Un frame es UNA cosa puesta en el lienzo, y hay tres:

     clip     una referencia del vault. `ref` es su ruta
     boceto   un componente que estás escribiendo. `ref` es el nombre de
              su archivo en src/privado/bocetos/, sin extensión
     pieza    una pieza publicada. `ref` es su nombre. Todavía no se
              dibuja: ver el hueco en playground.tsx

   Los tres guardan una REFERENCIA y no una copia, a propósito: si le
   cambiás la ficha a un clip o escribís en un boceto, el frame que lo
   muestra ya está actualizado. Nada del contenido vive acá adentro. */
export type Frame = {
  id: string
  tipo: TipoFrame
  ref: string
  x: number
  y: number
  ancho: number
  alto: number
}

export type Vista = {
  id: string
  nombre: string
  creada: number
  frames: Frame[]
}

export type EstadoVistas =
  | { cargando: true }
  | { cargando: false; conectado: false; motivo: string }
  | { cargando: false; conectado: true; vistas: Vista[] }

/* randomUUID pide un contexto seguro. localhost cuenta como seguro, así
   que en desarrollo siempre está — pero el respaldo evita que abrir esto
   desde la IP de la máquina en el teléfono tire una excepción en vez de
   crear la vista. */
export const nuevoId = () =>
  typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

/* CUÁNTO SE ESPERA ANTES DE GUARDAR.

   Arrastrar un frame dispara un evento por cuadro: a 60fps, un arrastre
   de dos segundos son 120 escrituras al disco. Con esto son una.

   400 y no más: es cortito para una mano —soltás el frame y para cuando
   volvés a mirar ya está guardado— y largo comparado con los 16ms de un
   cuadro, que es lo que hay que absorber. */
const ESPERA = 400

/* Sin nombre y sin diálogo. La vista nace con un nombre puesto y se
   renombra después, que es lo que hace Figma: un modal antes de ver nada
   te obliga a decidir cómo se llama algo que todavía no existe.

   VIVE ACÁ Y NO EN playground.tsx porque lo usan DOS caminos: el botón
   "New view" y el helper de abajo, que crea una vista sin que haya
   ninguna interfaz montada. Dos constantes con el mismo texto en dos
   archivos se separan solas el día que una cambie. */
export const SIN_NOMBRE = 'Untitled'

/* ═══════════════════════════════════════════════════════════════
   DESHACER Y REHACER — ⌘Z y ⇧⌘Z.

   ─── POR QUÉ SNAPSHOTS Y NO UN PATRÓN DE COMANDOS ───
   Cada paso guarda una COPIA ENTERA del array de vistas. Suena caro y no
   lo es: son unas pocas vistas con unos pocos frames planos —siete
   números y dos strings cada uno— así que un paso pesa lo que pesa el
   JSON, o sea nada.

   Y a cambio se lleva la propiedad que de verdad importa acá: NO PUEDE
   DESINCRONIZARSE. Un patrón de comandos obliga a escribir el inverso de
   cada acción, y el día que alguien agrega una acción nueva y se olvida
   del inverso —o lo escribe mal— deshacer deja el documento en un estado
   que nunca existió, en silencio. Con snapshots eso es imposible por
   construcción: deshacer es volver a un estado que YA fue verdadero.

   ─── EL HISTORIAL ES DE LA SESIÓN ───
   Vive en memoria y no se persiste. Recargar la página lo vacía, y está
   bien: deshacer es para arreglar lo que acabás de hacer, no para
   arqueología. Guardarlo en el vault convertiría un archivo de datos en
   un archivo de datos MÁS un registro de todo lo que probaste.

   ─── DESHACER GUARDA EN EL ACTO ───
   Sin debounce. Es la única escritura que se descarga ya, y por una
   razón concreta: si deshacés y recargás dentro de los 400ms, el disco
   todavía tiene lo que deshiciste y la app te lo devuelve. Deshacer algo
   y que vuelva es de las pocas cosas que rompen la confianza de verdad.

   ─── LA SELECCIÓN NO ES DESHACIBLE ───
   Ni la de un frame ni la vista abierta: es dónde estás mirando, no lo
   que hiciste. Es lo que hacen todos los editores, y meterla en la pila
   obligaría a apretar ⌘Z tres veces para deshacer un movimiento.
   ═══════════════════════════════════════════════════════════════ */

/* CUÁNTOS PASOS SE RECUERDAN. 100 es holgado para una sesión de tablero
   y acota la memoria: cien copias de un documento de este tamaño no
   llegan a un megabyte. */
const PILA = 100

/* CUÁNTO DURA UNA "MISMA ACCIÓN" para juntarla en un solo paso.

   Sin esto la pila se llena de basura: escribir seis letras en el nombre
   de una vista serían seis pasos de deshacer, y cinco flechazos serían
   cinco. Con esto, los eventos consecutivos que traen la MISMA etiqueta
   —el mismo campo, el mismo frame— dentro de esta ventana no abren un
   paso nuevo: el primero ya guardó el estado de antes, que es el único
   que hace falta para volver.

   800ms: más largo que la pausa entre dos teclas escribiendo de corrido
   (unos 150) y más corto que una pausa para pensar. Es también el doble
   de los 400 del debounce de guardado, así que un paso nunca se parte
   entre dos escrituras al disco. */
const JUNTAR = 800

/* Un paso de la pila: cómo estaba TODO antes, y qué lo cambió. La
   etiqueta no se muestra en ningún lado — sólo sirve para decidir si el
   evento que viene es "lo mismo" y hay que juntarlo. */
type Paso = { vistas: Vista[]; etiqueta: string }

/* ─── LA SEMILLA DE "OPEN IN PLAYGROUND" ───
   Ese camino corre FUERA de React (ver alPlayground, abajo) y termina
   navegando: el vault se desmonta y el lienzo se monta de cero, así que
   no hay ningún estado de React donde dejar el paso previo. El módulo sí
   sobrevive —la navegación es del cliente, no recarga nada— así que el
   snapshot de antes se deja acá y el hook lo levanta al cargar.

   Con eso, el primer ⌘Z en el lienzo al que acabás de llegar deshace el
   clip que lo trajo, que es exactamente lo que esperás. */
let semilla: Vista[] | null = null

export function useVistas() {
  const [estado, setEstado] = useState<EstadoVistas>({ cargando: true })

  /* El temporizador y lo último que hay para mandar, fuera del estado:
     que cambien no tiene que redibujar nada. */
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendiente = useRef<Vista[] | null>(null)

  /* EL PRESENTE, TAMBIÉN EN UN REF. El historial tiene que leer "cómo
     está ahora" para apilarlo ANTES de cambiarlo, y leerlo de `estado`
     obligaría a hacerlo adentro del updater de setState —que React puede
     llamar dos veces— y a empujar la pila dos veces por acción. Con el
     ref, apilar pasa una sola vez y fuera de todo render. */
  const presente = useRef<Vista[]>([])

  /* Las dos pilas y la marca de la última acción, para juntar. Nada de
     esto redibuja: por eso son refs y no estado. */
  const atras = useRef<Paso[]>([])
  const adelante = useRef<Vista[][]>([])
  const ultimo = useRef<{ etiqueta: string; cuando: number } | null>(null)

  const mandar = useCallback(() => {
    const v = pendiente.current
    pendiente.current = null
    timer.current = null
    if (!v) return
    fetch('/vault-media/__vistas', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ vistas: v }),
    }).catch(() => {})
  }, [])

  useEffect(() => {
    let vivo = true
    fetch('/vault-media/__vistas')
      .then((r) => r.json())
      .then((d) => {
        if (!vivo) return
        if (!d.conectado) {
          setEstado({ cargando: false, conectado: false, motivo: d.motivo })
          return
        }
        presente.current = d.vistas
        /* Si llegaste desde "Open in playground", el paso previo espera
           en el módulo. Se levanta una sola vez. */
        if (semilla) {
          atras.current = [{ vistas: semilla, etiqueta: '' }]
          semilla = null
        }
        setEstado({ cargando: false, conectado: true, vistas: d.vistas })
      })
      .catch((e) => {
        if (vivo) setEstado({ cargando: false, conectado: false, motivo: String(e) })
      })
    return () => {
      vivo = false
    }
  }, [])

  /* AL DESMONTAR SE MANDA LO QUE HAYA QUEDADO. Sin esto, mover un frame
     y salir del playground antes de los 400ms pierde el movimiento — y
     se sentiría como que la app olvida cosas al azar. */
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current)
        mandar()
      }
    },
    [mandar],
  )

  /* La escritura es OPTIMISTA: la pantalla se actualiza ya y el disco
     después. Un frame que se arrastra tiene que seguir al puntero sin
     esperar a nadie.
     `ya` salta el debounce, y lo usan deshacer y rehacer. */
  const aplicar = useCallback(
    (vistas: Vista[], ya = false) => {
      presente.current = vistas
      pendiente.current = vistas
      setEstado((e) => (e.cargando || !e.conectado ? e : { ...e, vistas }))
      if (timer.current) clearTimeout(timer.current)
      if (ya) mandar()
      else timer.current = setTimeout(mandar, ESPERA)
    },
    [mandar],
  )

  /* TODA mutación pasa por acá, y por eso el historial no se puede
     olvidar de ninguna: no hay forma de cambiar el documento sin apilar
     el estado de antes.

     La etiqueta tiene TRES valores y cada uno es una clase de cambio:

       undefined   una acción discreta: agregar, borrar, traer al
                   frente. Cada llamada es un paso
       un string   una acción continua: tipear un nombre, mover con las
                   flechas. Dos llamadas seguidas con la misma etiqueta,
                   dentro de JUNTAR, son un solo paso
       null        NO ES UNA ACCIÓN TUYA. Se guarda al disco pero no
                   entra al historial ni corta la rama de rehacer

     El tercero existe por las CORRECCIONES AUTOMÁTICAS: el frame que
     nace con la proporción provisional y se arregla cuando el video
     termina de cargar, y el que estaba guardado fuera de una tela más
     chica y se acomoda al montar. Las dos son la app arreglándose sola,
     y meterlas en la pila hacía que el primer ⌘Z después de agregar un
     clip deshiciera la corrección en vez de el clip — medido, y era
     exactamente lo que se sentía roto. Deshacer tiene que deshacer lo
     que hiciste VOS.
     Si un ⌘Z las revierte igual, se vuelven a aplicar solas: son
     idempotentes y su disparador vuelve a correr. */
  const guardar = useCallback(
    (siguiente: (v: Vista[]) => Vista[], etiqueta?: string | null) => {
      const antes = presente.current
      const despues = siguiente(antes)
      /* Un cambio que no cambia nada no es un paso. Es lo que evita que
         un clic sobre el frame que ya está al frente ensucie la pila. */
      if (despues === antes) return

      if (etiqueta !== null) {
        const junta =
          etiqueta !== undefined &&
          ultimo.current?.etiqueta === etiqueta &&
          Date.now() - ultimo.current.cuando < JUNTAR
        if (!junta) {
          atras.current.push({ vistas: antes, etiqueta: etiqueta ?? '' })
          if (atras.current.length > PILA) atras.current.shift()
        }
        ultimo.current = etiqueta === undefined ? null : { etiqueta, cuando: Date.now() }

        /* UNA ACCIÓN NUEVA CORTA LA RAMA DE REHACER. Es el
           comportamiento de todos los editores: si deshacés tres pasos y
           hacés algo distinto, el futuro que habías descartado deja de
           existir — mantenerlo obligaría a un árbol y a una interfaz
           para navegarlo.
           Una corrección automática NO corta nada: no es una decisión
           tuya, así que no puede tirar a la basura la que sí lo era. */
        adelante.current = []
      }
      aplicar(despues)
    },
    [aplicar],
  )

  const deshacer = useCallback(() => {
    const paso = atras.current.pop()
    if (!paso) return false
    adelante.current.push(presente.current)
    /* Se corta la juntada: lo próximo que escribas abre un paso nuevo,
       aunque sea sobre el mismo campo. */
    ultimo.current = null
    aplicar(paso.vistas, true)
    return true
  }, [aplicar])

  const rehacer = useCallback(() => {
    const v = adelante.current.pop()
    if (!v) return false
    atras.current.push({ vistas: presente.current, etiqueta: '' })
    ultimo.current = null
    aplicar(v, true)
    return true
  }, [aplicar])

  const crear = useCallback(
    (nombre: string) => {
      const vista: Vista = { id: nuevoId(), nombre, creada: Date.now(), frames: [] }
      /* La nueva va PRIMERA, igual que el clip más reciente en el vault:
         acabás de crearla, es lo que estás por abrir. */
      guardar((v) => [vista, ...v])
      return vista
    },
    [guardar],
  )

  const borrar = useCallback(
    (id: string) => guardar((v) => v.filter((x) => x.id !== id)),
    [guardar],
  )

  const cambiar = useCallback(
    (id: string, f: (v: Vista) => Vista, etiqueta?: string | null) =>
      guardar((v) => {
        const i = v.findIndex((x) => x.id === id)
        if (i < 0) return v
        const siguiente = f(v[i])
        /* Se compara la VISTA y no el array: así un cambio que devuelve
           la misma vista —el acomodo que no tenía nada que acomodar— no
           llega a apilar un paso. */
        if (siguiente === v[i]) return v
        return v.map((x, k) => (k === i ? siguiente : x))
      }, etiqueta),
    [guardar],
  )

  return { estado, crear, borrar, cambiar, deshacer, rehacer }
}

/* ═══════════════════════════════════════════════════════════════
   MANDAR UN CLIP AL PLAYGROUND DESDE EL VAULT.

   ES UN HELPER Y NO UN HOOK a propósito: lo dispara un ítem del menú
   del clic derecho, o sea un lugar donde el playground NO está montado
   y no hay ningún estado suyo del cual colgarse. Un hook obligaría al
   vault a suscribirse a las vistas —y a pedirlas en cada render— para
   usarlas una vez cada tanto.

   VA A LA VISTA MÁS RECIENTE, la de `creada` más alta, y no a la
   primera del array: el array lo ordena `crear` poniendo la nueva
   adelante, pero eso es una decisión de presentación y no un hecho del
   dato. Si no hay ninguna, se crea una — porque "mandar esto al
   playground" tiene que funcionar la primera vez que lo apretás, sin
   obligarte a ir a crear una vista antes.

   El documento se lee y se vuelve a escribir ENTERO, que es el mismo
   contrato que tiene useVistas con el servidor. Devuelve el id de la
   vista para que el que llama navegue, o null si el vault no está.
   ═══════════════════════════════════════════════════════════════ */

/* La medida de arranque cuando NO hay de dónde medir la proporción del
   clip. Desde el vault no hay ningún elemento cargado —el menú vive
   sobre la card, no sobre el lienzo— así que el frame nace en 16/9 y el
   lienzo lo corrige cuando el medio termina de cargar. Ver PROVISIONAL
   en playground.tsx: son el mismo par de números y el mismo trato. */
const PROVISIONAL = { ancho: 480, alto: 270 }

/* Y ARRANCA ARRIBA A LA IZQUIERDA, no centrado como el que se agrega
   desde el lienzo. No es una preferencia: desde el vault no se puede
   saber cuánto mide la tela —no está montada— y centrar contra un
   tamaño inventado deja el frame en cualquier lado. 24 y la misma
   cascada de 24 que usa el lienzo, así que dos clips seguidos no se
   tapan. */
const ESQUINA = 24
const CASCADA = 24
const VUELTAS = 8

export async function alPlayground(ruta: string): Promise<string | null> {
  const r = await fetch('/vault-media/__vistas')
  const d = await r.json().catch(() => null)
  if (!d?.conectado) return null

  const vistas: Vista[] = Array.isArray(d.vistas) ? d.vistas : []
  const reciente = vistas.reduce<Vista | null>((a, b) => (a && a.creada >= b.creada ? a : b), null)
  const destino: Vista = reciente ?? {
    id: nuevoId(),
    nombre: SIN_NOMBRE,
    creada: Date.now(),
    frames: [],
  }

  const n = destino.frames.length
  const salto = ESQUINA + (n % VUELTAS) * CASCADA
  const frame: Frame = {
    id: nuevoId(),
    tipo: 'clip',
    ref: ruta,
    x: salto,
    y: salto,
    ...PROVISIONAL,
  }
  const conFrame: Vista = { ...destino, frames: [...destino.frames, frame] }

  /* Cómo estaba TODO antes de esto, para que el ⌘Z del lienzo al que
     estás por llegar pueda deshacerlo. Ver `semilla`, arriba. */
  semilla = vistas

  /* Si la vista ya existía se reemplaza en su lugar; si es nueva va
     primera, igual que en `crear`. */
  const siguiente = reciente
    ? vistas.map((v) => (v.id === conFrame.id ? conFrame : v))
    : [conFrame, ...vistas]

  await fetch('/vault-media/__vistas', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ vistas: siguiente }),
  })

  return conFrame.id
}
