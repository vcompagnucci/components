import * as Haptics from 'expo-haptics'
import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, {
  Easing,
  ReduceMotion,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets'

import { Barra, MOVIMIENTO, type Tab, type Tramo } from './barra'
import { BARRA, CABECERA } from './medidas'
import { PliegueContext, opacidadPlegada, type Pliegue } from './pliegue'
import { usePaleta } from './tema'

/* ═══════════════════════════════════════════════════════════════
   EL MECANISMO — el pager, y el `Tramo` que le pasa a la barra.

   De dónde sale la transición, a dónde va y cuánto se avanzó (0..1), en
   un solo valor. La barra no tiene estado propio y dibuja todo a partir
   de eso. Que sea UN valor y no tres es lo que arregló el titileo de los
   íconos: el recibo está arriba de `Tramo`, en `barra.tsx`.

   ARRASTRAR Y TOCAR NO SON EL MISMO CAMINO, y no por comodidad: la
   referencia los trata distinto y está medido cuadro a cuadro.

   ARRASTRANDO, EL PAGER ES UN ScrollView CON `pagingEnabled`. Se midió
   y el subrayado va pegado al contenido cuadro a cuadro, así que la
   curva con la que frena el subrayado ES la deceleración del
   UIScrollView de iOS — no un easing que alguien eligió. Rehacer el
   gesto a mano con Gesture Handler obligaría a re-derivar esa física
   para volver al mismo lugar. Ahí `t` es la parte decimal de la página.
   La fila de tabs se mueve —o no— con este mismo `t`, tocando y
   arrastrando por igual; la regla la elige `BARRA.fila` y el recibo
   está arriba de `objetivo` en `barra.tsx`.

   TOCANDO, DOS COSAS CAMBIAN:

   1. La animación la maneja Reanimated y no UIKit. `scrollTo({ animated:
      true })` tarda cerca de 400 ms con una curva simétrica: arranca
      lento justo cuando el usuario ya decidió y está mirando. Se sentía
      pesado y lo era. Acá va un `withTiming` con la curva ajustada
      contra los toques de la referencia (abajo).
   2. El contenido viaja UNA página aunque el salto sea de cinco tabs —
      ver `alTocar`. Por eso `t` no puede salir del scroll y el toque
      trae el suyo.
   ═══════════════════════════════════════════════════════════════ */

/* ═══ LA CURVA DEL TOQUE, AJUSTADA CONTRA LOS TOQUES DEL USUARIO ═══

   Esta curva ya dio dos vueltas enteras, y las dos veces el error fue
   del instrumento, no del ajuste:

   1. easeOutCubic a 333 ms — ajustada contra el settle del clip del
      vault... cuyas transiciones resultaron ser ARRASTRES: era la
      deceleración del UIScrollView aplicada a un toque.
   2. bezier(.4,.9,.72,1) a 283 ms — ajustada contra "siete toques" de
      una grabación vieja de X. Con esa curva el usuario sintió el
      toque ABRUPTO ("en X se hace mucho más clean", 2026-09-01), y las
      grabaciones nuevas de su propia cuenta le dan la razón.

   El ajuste vigente sale de los TRES toques de esas grabaciones nuevas
   (For you→Tech, Tech→Following, For you→Design), subrayado cuadro a
   cuadro, con búsqueda sobre duración y fase de cuadro:

                                    Fy→Tech   Tech→Fol   Fy→Design
     easeOutCubic                    0.0081     0.0123     0.0179   ✓
     bezier(.4,.9,.72,1) (anterior)  0.0153     0.0068     0.0250
     easeOutQuart                    0.0225     0.0693     0.0230

   easeOutCubic gana dos de tres y en el tercero queda a nada. La
   diferencia perceptual está en el arranque: la cúbica parte con
   pendiente 3 —el subrayado responde al dedo en el primer cuadro— y
   frena monótona; el bezier arrancaba con 2.25 y quedaba con una
   panza a mitad de camino, que es el "tirón" reportado.

   La duración medida es ~18 cuadros a 60 fps: los mejores ajustes caen
   en 18–19 (300–317 ms), no en los 17 de la grabación vieja. */
const EASE_SETTLE = Easing.out(Easing.cubic)
const TOQUE = 300

/* Las tres cosas que se mueven en un toque —el contenido, el avance de la
   barra y el scroll de la fila— comparten la misma config, que es la
   única forma de garantizar que salgan y lleguen juntas. */
const CFG = { duration: TOQUE, easing: EASE_SETTLE, reduceMotion: ReduceMotion.System }

/* LA HÁPTICA DEL CAMBIO DE TAB, en un solo lugar porque es la perilla
   que más se va a tocar y no se puede medir desde acá: el clip de
   referencia es video y no tiene pista háptica.

   NO HAY INTENSIDAD CONTINUA, y no es una limitación de iOS sino de
   `expo-haptics`. iOS tiene `impactOccurred(intensity:)` desde iOS 13,
   que toma un número de 0 a 1, y encima tiene Core Haptics para armar
   patrones a mano. Pero el módulo llama al `impactOccurred()` SIN
   argumento — está en su Swift, `HapticsModule.swift`, seis líneas:

       let generator = UIImpactFeedbackGenerator(style: ...)
       generator.prepare()
       generator.impactOccurred()

   Así que desde acá hay cinco escalones y nada en el medio. Llegar a la
   intensidad continua pide un módulo nativo propio, y eso rompe Expo Go
   —la pieza dejaría de abrirse en el teléfono— y obliga a reconstruir
   el dev client. No vale para una perilla de una pieza.

   La escalera, de menos a más:

     selectionAsync()            el tick más suave
     impactAsync(Soft)           blando, difuso
     impactAsync(Light)       ←  acá estamos
     impactAsync(Rigid)          la amplitud de Medium con un ataque más
                                 corto y seco
     impactAsync(Medium)         se sentía de más
     impactAsync(Heavy)          el techo, y demasiado para algo que
                                 pasa cincuenta veces por sesión

   El recorrido, porque la conclusión sola no sirve: arrancó en
   `selectionAsync` y se sentía casi nada, pero eso fue un bocado en
   falso — el helper estaba escrito y las dos llamadas seguían yendo
   directo a `selectionAsync`, así que la prueba con Medium nunca llegó
   al teléfono. Ya cableado: Heavy demasiado, Medium un poco de más.
   Entre los dos candidatos que quedaban se probó Light, que es el que
   baja la AMPLITUD. `Rigid` es la otra opción y baja otra cosa: `soft`
   y `rigid` no son escalones de fuerza sino de DUREZA —cuánto se
   comprime lo que choca— así que Rigid pega parecido a Medium pero
   termina antes. Si Light queda corto, ese es el escalón de al lado.

   Esto es lo único de la pieza sin recibo: el clip es video y no tiene
   pista háptica. Se ajusta con el teléfono en la mano y nada más. */
const golpe = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

/* Centinela: el pager lo está manejando el dedo, no un toque. */
const NADIE = -1

type Props = {
  tabs: Tab[]
  /** El contenido de cada página. Se llama una vez por tab. */
  pagina: (tab: Tab, indice: number) => ReactNode
  /** Lo que va arriba de la barra de tabs y se pliega con ella. */
  cabecera?: ReactNode
  /** El alto de la barra de estado: el bloque plegable la incluye y la
      tapa que queda cuando se fue mide exactamente eso. */
  arriba: number
  /** Coreografía one-shot para grabar (Stocks lento → resto rápido). */
  demo?: boolean
}

export function TabsDeslizables({ tabs, pagina, cabecera, arriba, demo = false }: Props) {
  const { width } = useWindowDimensions()
  const paleta = usePaleta()

  /* ═══ EL PLIEGUE — el bloque de arriba sube con el scroll de la página.
     El mecanismo y su recibo están en `pliegue.tsx`. Acá vive el estado
     porque acá se sabe qué página está activa. */
  const subida = useSharedValue(0)
  const posiciones = useSharedValue<number[]>(tabs.map(() => 0))
  const alto = arriba + CABECERA.alto + BARRA.alto + StyleSheet.hairlineWidth
  /* El bloque frena con el divisor pegado al borde de la barra de
     estado: el recorrido es su alto menos esa barra. Se probó el
     recorrido entero (los labels saliendo por arriba, como en X) y el
     usuario lo rechazó en el teléfono — ver `pliegue.tsx`. */
  const recorrido = alto - arriba
  const pliegue = useMemo<Pliegue>(
    () => ({ alto, recorrido, subida, posiciones }),
    [alto, recorrido, subida, posiciones],
  )
  const pager = useAnimatedRef<Animated.ScrollView>()
  /* SONDA: en demo el pager nace en Following (ver `contentOffset`) y
     la barra tiene que nacer ahí también, o el primer cuadro muestra
     el tab de Following con el contenido de For you. */
  const scrollX = useSharedValue(demo ? width : 0)
  const destino = useSharedValue(NADIE)

  /* Qué está moviendo el contenido. La barra lo necesita para saber si
     le toca comandar su fila o dejársela al usuario. */
  const movimiento = useSharedValue<number>(MOVIMIENTO.quieto)

  const alScrollear = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.set(e.contentOffset.x)
    },
    /* Si el dedo entra en escena, corta cualquier animación de toque que
       esté corriendo — el gesto siempre gana. */
    onBeginDrag: () => {
      destino.set(NADIE)
      movimiento.set(MOVIMIENTO.arrastre)
    },
    /* Recién con el momentum terminado: entre soltar y frenar el
       contenido sigue moviéndose, y la fila tiene que seguir atada a él. */
    onMomentumEnd: () => {
      if (destino.get() === NADIE) movimiento.set(MOVIMIENTO.quieto)
    },
  })

  const progreso = useDerivedValue(() => (width > 0 ? scrollX.get() / width : 0))

  /* Los extremos y el avance del toque en curso. Los escribe `alTocar`
     una sola vez, y sólo se leen mientras `destino` no sea el centinela. */
  const toqueDesde = useSharedValue(0)
  const toqueHasta = useSharedValue(0)
  const avanceToque = useSharedValue(0)

  /* ───────────────────────────────────────────────────────────────
     LA TRANSICIÓN EN CURSO, ENTERA Y EN UN SOLO VALOR.

     ── Qué son `d` y `h` ──
     La barra no interpola sobre los n estados: interpola entre DOS, el
     de donde viene y el de a dónde va. La diferencia sólo aparece
     cuando esos dos no son vecinos.

     Arrastrando siempre son vecinos —`floor(p)` y el que sigue.

     Tocando, no. Un toque del tab 2 al 6 barre `progreso` por 3, 4 y 5,
     y con la interpolación sobre todos los estados cada uno de esos
     abría su ícono al pasar y volvía a cerrarlo. Se veía como un
     manoteo. Fijando los extremos en 2 y 6 mientras dura el toque, el
     layout va del estado 2 al 6 de una, y los únicos dos íconos que se
     mueven son los de las puntas.

     ── Qué es `t`, y por qué no alcanza con mirar el scroll ──
     Arrastrando sí alcanza: los dos extremos son vecinos y el avance es
     la parte decimal de la página. Pero un TOQUE LEJANO mueve el
     contenido UNA SOLA PÁGINA aunque el salto sea de cuatro tabs (ver
     `alTocar`), así que ahí el scroll recorre 1/4 de lo que recorre la
     barra. Por eso el toque trae su propio avance.

     ── Y POR QUÉ ES UN VALOR Y NO TRES ──
     Porque los tres tienen que ser ciertos AL MISMO TIEMPO, y con tres
     shared values no lo eran: el recibo del titileo que eso causaba está
     arriba de `Tramo`, en `barra.tsx`. Un `useDerivedValue` declara su
     salida, así que el orden topológico de Reanimated lo corre antes que
     todos sus lectores; un `useAnimatedReaction` no declara ninguna.
     ─────────────────────────────────────────────────────────────── */
  const ultimo = tabs.length - 1
  const tramo = useDerivedValue<Tramo>(() => {
    /* El tramo del toque vale MIENTRAS HAY UN TOQUE, y el toque es
       `movimiento === toque`, no `destino !== NADIE`: cualquier otra
       cosa que mueva el pager por `destino` (una sonda de grabación,
       2026-09-04) dejaba a la barra leyendo `toqueDesde`/`toqueHasta`
       viejos y el subrayado quedaba clavado en For you mientras el
       contenido viajaba. */
    if (destino.get() !== NADIE && movimiento.get() === MOVIMIENTO.toque) {
      return { d: toqueDesde.get(), h: toqueHasta.get(), t: avanceToque.get() }
    }
    const p = progreso.get()
    const d = Math.max(0, Math.min(Math.floor(p), ultimo))
    const h = Math.min(d + 1, ultimo)
    /* `h` es siempre `d + 1` salvo en el último tab, donde no hay a dónde
       ir y los dos extremos son el mismo. Ahí `t` no significa nada. */
    return { d, h, t: h === d ? 0 : Math.min(1, Math.max(0, p - d)) }
  })

  /* La página que está prestada, a qué lugar, y cuál es la que vivía ahí
     —esa se apaga mientras dure el préstamo, o las dos se dibujan una
     encima de la otra y el texto queda pisado. Ver `alTocar`. */
  const prestadaIndice = useSharedValue(NADIE)
  const prestadaX = useSharedValue(0)
  const tapadaIndice = useSharedValue(NADIE)

  /* El pager no acepta el dedo mientras dura un toque lejano. Cambia dos
     veces por toque lejano, no por cuadro. */
  const [quieto, setQuieto] = useState(false)

  /* De quién es el toque en curso. Ver `alTocar`. */
  const generacion = useSharedValue(0)

  /* El único puente entre la animación y el ScrollView, y corre entero
     en el hilo de UI: ni un render de React por cuadro. */
  useAnimatedReaction(
    () => destino.get(),
    (x) => {
      if (x !== NADIE) scrollTo(pager, x, 0, false)
    },
  )

  /* ───────────────────────────────────────────────────────────────
     EL TICK AL CAMBIAR DE TAB.

     Esto es lo que hace que arrastrar se sienta como un control con
     posiciones y no como una tela. El subrayado es continuo, así que no
     hay ningún salto visual que marque el momento — pero la IDENTIDAD
     del tab activo sí salta, justo en la mitad. Ahí va el tick.

     ADVERTENCIA DE EVIDENCIA: esto NO está medido contra la referencia.
     El clip es un video y no tiene pista háptica; no hay forma de sacar
     de ahí si X vibra, cuándo, ni con qué intensidad. El patrón sale del
     skill `animate-expo` —"a value ticks past a step"— y la intensidad
     se ajustó a mano, con el teléfono. Es lo único de la pieza sin
     recibo.

     La condición del `prepare` es lo que lo hace barato: se redondea
     `progreso` y Reanimated sólo llama al cuerpo cuando ese entero
     cambia. Nunca hay un `scheduleOnRN` por cuadro, que es la forma
     clásica de arruinar el hilo de JS con hápticas.
     ─────────────────────────────────────────────────────────────── */
  useAnimatedReaction(
    () => Math.round(progreso.get()),
    (tab, anterior) => {
      if (anterior === null || tab === anterior) return
      /* Un toque ya dio su tick al apretar. Sin esto, saltar del tab 0
         al 3 haría vibrar tres veces mientras la animación pasa por el
         medio — y la regla es una háptica por acción del usuario, no
         una por cosa que se mueve. */
      if (destino.get() !== NADIE) return
      scheduleOnRN(golpe)
    },
  )

  const alTocar = useCallback((indice: number) => {
    /* LA HÁPTICA VA EN EL TOQUE CONSUMADO, no en el apretón. Estuvo en
       `onPressIn` ("el tick tiene que llegar cuando decidís") y el
       teléfono mostró el costo: arrancar a ARRASTRAR la fila apoya el
       dedo sobre un tab, así que cada arrastre de la lista sonaba
       ("saca el haptic", 2026-09-01). El scroll cancela el press y
       `onPress` no dispara — el tick queda solo en los toques.

       Y sólo si el tab cambia: vibrar sobre el tab ya activo es ruido —
       la háptica marca un cambio de selección, y ahí no hay ninguno. */
    if (Math.round(progreso.get()) !== indice) golpe()
    /* Un toque lejano bloquea el arrastre mientras dura, y es por la
       página prestada de abajo: si el dedo entra en el medio hay que
       devolverla, y devolverla con media pantalla adentro se ve como un
       salto. 333 ms de pager quieto es más barato que eso. */
    const lejano = Math.abs(indice - Math.round(progreso.get())) > 1
    if (lejano) setQuieto(true)

    /* LAS ASIGNACIONES VAN JUNTAS EN EL HILO DE UI, y no es un detalle:
       escribir un shared value desde JS se encola, así que dos
       escrituras seguidas en el mismo tick pueden llegar como una sola.
       Si eso pasara, el `withTiming` arrancaría desde el valor viejo de
       `destino` —que después de un arrastre es el centinela— y el pager
       saltaría. Adentro de un worklet corren en orden. */
    scheduleOnUI(
      (i: number, ancho: number) => {
        'worklet'
        /* ═══ UN TOQUE CANCELA AL ANTERIOR, Y HAY QUE CERRARLO BIEN ═══

           Regla de la casa: cancelá lo que está corriendo antes de
           arrancar otra animación sobre el mismo shared value. Acá no
           alcanza con eso, porque el toque deja algo prendido además de
           la animación — la página prestada.

           Si llega un segundo toque, el primero se termina AL INSTANTE:
           el pager salta a donde iba y la página prestada vuelve a su
           lugar. Recién ahí `Math.round(progreso)` vuelve a leer una
           página de verdad y no un punto a mitad de camino. */
        if (destino.get() !== NADIE) {
          scrollTo(pager, toqueHasta.get() * ancho, 0, false)
          scrollX.set(toqueHasta.get() * ancho)
          prestadaIndice.set(NADIE)
          prestadaX.set(0)
          tapadaIndice.set(NADIE)
        }

        const d = Math.round(progreso.get())
        if (i === d) return
        const dir = i > d ? 1 : -1

        /* El turno de este toque. El callback del `withTiming` se dispara
           igual cuando lo cancelan, así que sin esto la limpieza del
           toque viejo le borraría la página prestada al nuevo. */
        const turno = generacion.get() + 1
        generacion.set(turno)

        /* ═══ EL CONTENIDO VIAJA UNA SOLA PÁGINA ═══

           Tocar el tab 4 estando en el 0 NO scrollea cuatro pantallas de
           contenido. La referencia lo hace así y está medido: en el
           toque For you → Tech —dos tabs de por medio— hay UN SOLO
           empalme en el video. La página de For you sale y la de Tech
           entra, pegadas. Ni Following ni Stocks aparecen.

           Cómo: la página de ORIGEN se presta al lugar de al lado del
           destino, y el scroll salta ahí en el mismo cuadro. En pantalla
           no cambia nada —la página de origen sigue ocupando todo— pero
           el viaje pasó a ser de una página. Al terminar se devuelve, y
           ahí ya está fuera de pantalla: tampoco se ve.

           El orden importa. `destino` se fija PRIMERO para cerrarle la
           puerta al tick háptico y al cálculo de `desde`/`hasta`, que si
           no leerían el salto del scroll como un cambio de tab. */
        const vecino = i - dir
        destino.set(vecino * ancho)
        movimiento.set(MOVIMIENTO.toque)
        toqueDesde.set(d)
        toqueHasta.set(i)

        if (vecino !== d) {
          prestadaIndice.set(d)
          prestadaX.set((vecino - d) * ancho)
          tapadaIndice.set(vecino)
          scrollTo(pager, vecino * ancho, 0, false)
          /* A mano y no esperando el evento de scroll: `progreso` tiene
             que estar en el lugar nuevo YA, o el cuadro siguiente lo lee
             viejo. */
          scrollX.set(vecino * ancho)
        }

        /* La barra recorre de `desde` a `hasta` completo aunque el
           contenido recorra una página: por eso el toque trae su propio
           avance en vez de derivarlo del scroll. */
        avanceToque.set(0)
        avanceToque.set(withTiming(1, CFG))
        destino.set(
          withTiming(i * ancho, CFG, () => {
            /* Si mientras tanto entró otro toque, este callback llega
               tarde y no le corresponde limpiar nada: el turno ya es de
               otro. */
            if (generacion.get() !== turno) return
            /* Y si no, limpia sin mirar si la animación terminó o la
               cancelaron: en los dos casos hay que devolver la página
               prestada y soltar el centinela, o el tick del arrastre
               queda mudo para siempre. */
            prestadaIndice.set(NADIE)
            prestadaX.set(0)
            tapadaIndice.set(NADIE)
            destino.set(NADIE)
            movimiento.set(MOVIMIENTO.quieto)
            scheduleOnRN(setQuieto, false)
          }),
        )
      },
      indice,
      width,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width])

  /* ═══ LAS PÁGINAS SE MEMOIZAN, Y NO ES MICRO-OPTIMIZACIÓN ═══

     `quieto` y `planFila` son estado de React, así que cambiarlos
     re-renderiza este componente. Sin esto, ese render vuelve a crear
     los elementos de las SIETE páginas —doce filas de texto cada una— y
     eso cae justo en el cuadro en que arranca la animación del toque.

     Estaba medido: en la grabación a 60 fps de un toque lejano, el
     primer cuadro después del toque no se movía y el segundo saltaba
     0.195 de golpe (el ease pedía 0.128 y 0.252). Un cuadro entero
     perdido, y se veía como un tirón.

     `pagina` viene de la ruta, que no re-renderiza cuando cambia el
     estado de acá, así que su identidad aguanta y este `useMemo` no se
     recalcula nunca en la práctica. */
  const hojas = useMemo(
    () => tabs.map((tab, indice) => ({ id: tab.id, contenido: pagina(tab, indice) })),
    [tabs, pagina],
  )

  /* Cambiando de tab, el bloque no puede quedar más plegado que lo que
     scrolleó la página que llega: se interpola entre las dos páginas del
     tramo mientras el contenido viaja, y al asentarse la subida se
     clampea a la página nueva para que el próximo delta arranque de lo
     que se ve. DECISIÓN NUESTRA (ver `pliegue.tsx`). */
  const plegado = useDerivedValue(() => {
    const { d, h, t } = tramo.get()
    const p = posiciones.get()
    const desde = p[d] ?? 0
    const scroll = desde + ((p[h] ?? 0) - desde) * t
    return Math.min(subida.get(), Math.max(0, scroll))
  })
  /* Dos capas: el bloque entero se traslada con fondo opaco; sólo lo
     que va encima (cabecera y barra) se desvanece. El divisor queda con
     el fondo: es la línea que viaja y frena bajo la barra de estado. */
  const estiloBloque = useAnimatedStyle(() => ({ transform: [{ translateY: -plegado.get() }] }))
  const estiloFrente = useAnimatedStyle(() => ({ opacity: opacidadPlegada(plegado.get(), recorrido) }))
  useAnimatedReaction(
    () => movimiento.get(),
    (m, anterior) => {
      if (m !== MOVIMIENTO.quieto || anterior === null || anterior === MOVIMIENTO.quieto) return
      const p = posiciones.get()
      subida.set(Math.min(subida.get(), Math.max(0, p[Math.round(progreso.get())] ?? 0)))
    },
  )


  /* ═══ SONDA DE GRABACIÓN (?demo=1) — no forma parte de la pieza ═══
     Una coreografía one-shot para grabar el video, con gestos
     sintéticos que van por los caminos reales de la pieza: los
     arrastres mueven el offset del pager cuadro a cuadro con
     `movimiento` en `arrastre` (la barra sigue al contenido como con un
     dedo) y los toques son `alTocar`. Se borra antes de cerrar, como
     todas las sondas.

     Lo que pidió el usuario sobre la toma anterior (2026-09-04): que la
     entrada a Following no se trabe (era un salto instantáneo), que
     Following → Stocks sea LENTO, y que la parte rápida no pase tan
     rápido (eran toques cada 600 ms).

       0.0  nace en Following, barra y contenido (contentOffset)
       1.5  arrastre lento Following → Stocks: 1.7 s, seno in-out —un
            dedo que acelera y frena— (X, medido: 1.73 s)
       4.1  toque a For you
       5.1  cinco flicks de un tab, cada 1.0 s: 15 % del viaje en 110 ms
            (easeInQuad) y el resto en 430 ms (easeOutCubic), el perfil
            ajustado contra los arrastres medidos de X
      10.1  en Design, dos flicks atrás (AI, Tech), cada 1.0 s
      12.1  quieto en Tech hasta el final */
  useEffect(() => {
    if (!demo || width <= 0) return
    let cancel = false
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
    /* Los arrastres van por `destino`, el mismo puente que usa el toque
       (su reacción hace `scrollTo` por cuadro y el `onScroll` alimenta
       `scrollX`): una reacción propia sobre otro shared value dejó la
       toma anterior con saltos en vez de arrastres. */
    const arrastre = (desde: number, hasta: number, lento: boolean) =>
      scheduleOnUI(
        (a: number, b: number, ancho: number, esLento: boolean) => {
          'worklet'
          movimiento.set(MOVIMIENTO.arrastre)
          destino.set(a * ancho)
          const fin = (terminado?: boolean) => {
            'worklet'
            if (!terminado) return
            destino.set(NADIE)
            movimiento.set(MOVIMIENTO.quieto)
          }
          if (esLento) {
            destino.set(withTiming(b * ancho, { duration: 1700, easing: Easing.inOut(Easing.sin) }, fin))
          } else {
            destino.set(
              withSequence(
                withTiming((a + (b - a) * 0.15) * ancho, { duration: 110, easing: Easing.in(Easing.quad) }),
                withTiming(b * ancho, { duration: 430, easing: Easing.out(Easing.cubic) }, fin),
              ),
            )
          }
        },
        desde,
        hasta,
        width,
        lento,
      )
    ;(async () => {
      await wait(1500)
      if (cancel) return
      arrastre(1, 2, true)
      await wait(1700 + 900)
      if (cancel) return
      alTocar(0)
      await wait(300 + 700)
      for (const i of [1, 2, 3, 4, 5]) {
        if (cancel) return
        arrastre(i - 1, i, false)
        await wait(1000)
      }
      /* Llegado al último tab, dos flicks atrás y ahí termina
         (pedido del usuario, 2026-09-04). */
      for (const i of [4, 3]) {
        if (cancel) return
        arrastre(i + 1, i, false)
        await wait(1000)
      }
    })()
    return () => {
      cancel = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot de grabación
  }, [demo, width])

  return (
    <View style={[css.pieza, { backgroundColor: paleta.fondo }]}>
      {/* El pager ocupa la pantalla ENTERA, barra de estado incluida: el
          contenido pasa por debajo del bloque cuando el bloque se fue.
          Cada página deja libre `alto` arriba (ver `useScrollPlegable`). */}
      <PliegueContext.Provider value={pliegue}>
        <Animated.ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          scrollEnabled={!quieto}
          showsHorizontalScrollIndicator={false}
          onScroll={alScrollear}
          scrollEventThrottle={16}
          /* SONDA: nacer en Following de verdad. Un `scrollTo` en el
             primer efecto no movía el pager (el contenido todavía no
             estaba) y quedaba la barra en Following con el contenido
             de For you. */
          contentOffset={demo ? { x: width, y: 0 } : undefined}
        >
          {hojas.map((hoja, indice) => (
            <Hoja
              key={hoja.id}
              indice={indice}
              ancho={width}
              prestadaIndice={prestadaIndice}
              prestadaX={prestadaX}
              tapadaIndice={tapadaIndice}
            >
              {hoja.contenido}
            </Hoja>
          ))}
        </Animated.ScrollView>
      </PliegueContext.Provider>

      {/* EL BLOQUE QUE SE PLIEGA: barra de estado + cabecera + tabs +
          divisor. Se traslada entero con el fondo opaco; frena con el
          divisor pegado al borde de la barra de estado, y entonces su
          fondo ES lo que tapa la barra de estado — no hace falta una
          tapa aparte (hubo una, y su filete asomaba a través del bloque
          mientras se desvanecía; ver `pliegue.tsx`). */}
      <Animated.View style={[css.bloque, { paddingTop: arriba, backgroundColor: paleta.fondo }, estiloBloque]}>
        <Animated.View style={estiloFrente}>
          {cabecera}
          <Barra tabs={tabs} tramo={tramo} movimiento={movimiento} viewport={width} alTocar={alTocar} />
        </Animated.View>
        <View style={[css.divisor, { backgroundColor: paleta.divisor }]} />
      </Animated.View>
    </View>
  )
}

/* Una página del pager. Está en su propio componente sólo para que cada
   una tenga su `useAnimatedStyle`: el 99% del tiempo devuelve 0 y no
   cuesta nada, y en el 1% es la que se presta.

   `memo` porque el contenido ya viene memoizado de arriba: sin esto, un
   cambio de `quieto` volvería a renderizar las siete igual. */
const Hoja = memo(function Hoja({
  indice,
  ancho,
  prestadaIndice,
  prestadaX,
  tapadaIndice,
  children,
}: {
  indice: number
  ancho: number
  prestadaIndice: SharedValue<number>
  prestadaX: SharedValue<number>
  tapadaIndice: SharedValue<number>
  children: ReactNode
}) {
  const estilo = useAnimatedStyle(() => ({
    opacity: tapadaIndice.get() === indice ? 0 : 1,
    transform: [{ translateX: prestadaIndice.get() === indice ? prestadaX.get() : 0 }],
  }))
  return <Animated.View style={[{ width: ancho }, estilo]}>{children}</Animated.View>
})

const css = StyleSheet.create({
  pieza: { flex: 1 },
  bloque: { position: 'absolute', top: 0, left: 0, right: 0 },
  /* 1 px en la referencia, que a 3x es exactamente `hairlineWidth`. El
     subrayado se apoya justo encima. El color viene de la paleta. */
  divisor: { height: StyleSheet.hairlineWidth },
})
