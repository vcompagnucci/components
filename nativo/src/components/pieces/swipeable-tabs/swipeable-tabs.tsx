import * as Haptics from 'expo-haptics'
import { memo, useCallback, useEffect, useMemo, type ReactNode } from 'react'
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
import { usePaleta } from './theme'

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
   única forma de garantizar que salgan y lleguen juntas.

   `ReduceMotion.System` SALTA TODO AL FINAL, y se queda así. Lo estudié
   el 2026-09-08 porque `animate-expo` § 9 pide "fewer and gentler, not
   zero: keep opacity and color changes that explain a state change, drop
   translation", y acá se va también el fundido. La conclusión es que la
   regla no aplica a esta pieza, por dos razones:

   · CUMPLIRLA ROMPERÍA LO QUE EVITA EL TITILEO. Todo deriva de UN valor,
     `Tramo`: la posición del subrayado y el color del label salen del
     mismo `t`. Animar el color y saltar la posición pide DOS avances que
     bajo motion normal tienen que ser idénticos — que es exactamente la
     trampa que está documentada como la novena cosa que muerde en
     `nativo/AGENTS.md` ("si dos valores tienen que ser ciertos AL MISMO
     TIEMPO, son un valor, no dos") y la causa medida del titileo de los
     símbolos. Y dejaría de ser cierta la frase de Performance.
   · Y NO HAY NADA QUE EXPLICAR. La regla existe para cuando sacar el
     movimiento deja el cambio de estado sin explicación —algo que
     aparece de la nada—. Acá el estado lo dicen propiedades estáticas:
     el label activo en blanco, el subrayado debajo, la página nueva en
     pantalla. Saltando se ve todo eso, instantáneo y completo.

   O sea que un cambio de tab instantáneo bajo reduced motion es el
   comportamiento correcto, no una deuda. El texto público dice "Reduced
   motion is respected", que es cierto en las dos lecturas. Si algún día
   se revisa: el cambio real es partir `Tramo` en dos, y hay que medirlo
   en el teléfono con el ajuste prendido, no razonarlo. */
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

export function SwipeableTabs({ tabs, pagina, cabecera, arriba, demo = false }: Props) {
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
  /* La página que está prestada, a qué lugar, y cuál es la que vivía ahí
     —esa se apaga mientras dure el préstamo, o las dos se dibujan una
     encima de la otra y el texto queda pisado. Ver `alTocar`. */
  const prestadaIndice = useSharedValue(NADIE)
  const prestadaX = useSharedValue(0)
  const tapadaIndice = useSharedValue(NADIE)

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
    /* El toque lejano que el dedo interrumpió: el préstamo sigue vivo,
       así que la barra sigue yendo de `desde` a `hasta`, con el avance
       leído del scroll entre el lugar prestado y el destino (el recibo
       está arriba de `asentarPrestamo`). */
    if (prestadaIndice.get() !== NADIE) {
      const d = toqueDesde.get()
      const h = toqueHasta.get()
      const dir = h > d ? 1 : -1
      return { d, h, t: Math.min(1, Math.max(0, (progreso.get() - (h - dir)) * dir)) }
    }
    const p = progreso.get()
    const d = Math.max(0, Math.min(Math.floor(p), ultimo))
    const h = Math.min(d + 1, ultimo)
    /* `h` es siempre `d + 1` salvo en el último tab, donde no hay a dónde
       ir y los dos extremos son el mismo. Ahí `t` no significa nada. */
    return { d, h, t: h === d ? 0 : Math.min(1, Math.max(0, p - d)) }
  })

  /* De quién es el toque en curso. Ver `alTocar`. */
  const generacion = useSharedValue(0)

  /* El tab al que el scroll va a saltar SIN que cambie nada en pantalla
     (ver `asentarPrestamo`): ese cruce no vibra. */
  const hapticaSuprimida = useSharedValue(NADIE)

  /* ═══ EL DEDO GANA, TAMBIÉN DURANTE UN TOQUE LEJANO ═══

     Hasta el 2026-09-07 el pager rechazaba el dedo mientras duraba un
     toque lejano (`scrollEnabled={!quieto}`, un estado de React que
     cambiaba dos veces por toque), por la página prestada: devolverla
     con media pantalla adentro se veía como un salto. Eso rompía la
     regla que `animate-expo` pone como piso —la interrupción no es
     pulido, es la base— y el usuario pidió cumplirla sin tocar la
     animación del toque, para no regrabar el video.

     Cómo: el préstamo SIGUE VIVO mientras el dedo arrastra. La geometría
     que ve el usuario —la página de origen en el lugar vecino, el
     destino al lado— se mantiene, y la barra sigue yendo de `desde` a
     `hasta` con el avance leído del scroll (ver `tramo`). El préstamo se
     devuelve recién cuando no se puede ver:
       · si el contenido llega al destino, ahí mismo: el lugar prestado
         queda fuera de pantalla;
       · si el dedo vuelve y el pager frena sobre la página prestada, se
         devuelve y en el MISMO cuadro el scroll salta al lugar real de
         esa página. El contenido es idéntico antes y después, y la
         háptica de ese salto se silencia porque no cambió nada.
     Lo que queda mal, y es una esquina de una esquina: arrastrar hacia
     ATRÁS más allá de la página prestada dentro de esos 300 ms muestra
     el lugar vacío de donde salió, o una página que no es su vecina; se
     arregla solo al soltar, por el mismo camino. No hay forma de
     evitarlo sin mover el scroll con el dedo apoyado, y UIScrollView
     no lo respeta. SIN RECIBO EN PANTALLA TODAVÍA: probar en el
     teléfono tocando lejos y arrastrando enseguida, en las dos
     direcciones. */
  const devolver = () => {
    'worklet'
    prestadaIndice.set(NADIE)
    prestadaX.set(0)
    tapadaIndice.set(NADIE)
  }
  const asentarPrestamo = () => {
    'worklet'
    if (prestadaIndice.get() === NADIE || width <= 0) return
    const d = toqueDesde.get()
    const h = toqueHasta.get()
    const vecino = h - (h > d ? 1 : -1)
    if (Math.round(progreso.get()) === vecino) {
      hapticaSuprimida.set(d)
      scrollTo(pager, d * width, 0, false)
      scrollX.set(d * width)
    }
    devolver()
  }
  const alScrollear = useAnimatedScrollHandler(
    {
      onScroll: (e) => {
        scrollX.set(e.contentOffset.x)
        /* Con el préstamo vivo y el dedo al mando: al llegar al destino
           el lugar prestado ya no se ve, y se devuelve ahí mismo. */
        if (prestadaIndice.get() !== NADIE && movimiento.get() === MOVIMIENTO.arrastre && width > 0) {
          const h = toqueHasta.get()
          const dir = h > toqueDesde.get() ? 1 : -1
          if ((progreso.get() - h) * dir >= 0) devolver()
        }
      },
      /* Si el dedo entra en escena, corta cualquier animación de toque que
         esté corriendo — el gesto siempre gana. Con una página prestada el
         turno pasa al dedo: el callback del toque, que llega cancelado, ya
         no es de nadie y no limpia. */
      onBeginDrag: () => {
        if (prestadaIndice.get() !== NADIE) {
          generacion.set(generacion.get() + 1)
          avanceToque.set(avanceToque.get())
        }
        destino.set(NADIE)
        movimiento.set(MOVIMIENTO.arrastre)
      },
      /* Recién con el momentum terminado: entre soltar y frenar el
         contenido sigue moviéndose, y la fila tiene que seguir atada a él. */
      onMomentumEnd: () => {
        if (destino.get() !== NADIE) return
        asentarPrestamo()
        movimiento.set(MOVIMIENTO.quieto)
      },
      /* Soltar justo en un borde de página y sin velocidad no trae
         momentum, así que `onMomentumEnd` no llega: se asienta acá. */
      onEndDrag: (e) => {
        if (destino.get() !== NADIE || width <= 0) return
        const p = e.contentOffset.x / width
        if (Math.abs(e.velocity?.x ?? 0) > 0.001 || Math.abs(p - Math.round(p)) > 0.001) return
        asentarPrestamo()
        movimiento.set(MOVIMIENTO.quieto)
      },
    },
    [width],
  )

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
      /* El scroll asentándose en el lugar real de la página prestada no
         cambia lo que se ve, y no vibra (ver `asentarPrestamo`). */
      if (tab === hapticaSuprimida.get()) {
        hapticaSuprimida.set(NADIE)
        return
      }
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
    /* Ningún estado de React acá: un toque, lejano o no, no renderiza.
       El pager acepta el dedo siempre, también durante un toque lejano
       (ver `asentarPrestamo`). */

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
        } else {
          /* Un préstamo que el dedo interrumpió y todavía no se asentó
             (el pager sigue frenando): se asienta ahora, o el nuevo
             toque leería una página que no es la que se ve. */
          asentarPrestamo()
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
          }),
        )
      },
      indice,
      width,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width])

  /* ═══ LAS PÁGINAS SE MEMOIZAN, Y NO ES MICRO-OPTIMIZACIÓN ═══

     Hoy este componente no tiene estado de React: ni un toque ni un
     arrastre lo renderizan. Lo tuvo hasta el 2026-09-07 (`quieto`, el
     bloqueo del pager durante un toque lejano), y ese render volvía a
     crear los elementos de las SEIS páginas —doce filas de texto cada
     una— justo en el cuadro en que arrancaba la animación del toque. El
     memo se queda: un render del padre (el tema, por ejemplo) haría lo
     mismo, y la medición de abajo es el recibo de lo que cuesta.

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
   render del pager volvería a renderizar las seis igual. */
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
