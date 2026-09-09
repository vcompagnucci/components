/* ═══════════════════════════════════════════════════════════════
   BUTTONS SEPARATE — una sola forma de vidrio que se abre en cuatro
   botones redondos al pasar el puntero, y se vuelve a cerrar al salir.

   La referencia es el Spotlight de macOS 26 Tahoe (VAULT_DIR/web/
   "Buttons separate.mp4"). Todo número que sigue está MEDIDO sobre el
   original de 3420×2214 —2 px físicos por punto, verificado contra el
   ascendente de la barra de menú— y la tabla completa, con los scripts
   que la reproducen, está en .context/buttons-separate/MEDICION.md.

   Lo que la grabación deja probado, y por eso está acá:

   1. FUNDIDO ES UNA PÍLDORA, no cuatro círculos pegados. El perfil de
      altura da 56.0 pt constante de un extremo al otro, sin una sola
      hondonada entre botones.
   2. EL PRIMER BOTÓN NO SE MUEVE. Su borde izquierdo está en 929 desde
      los 200 ms y sigue ahí en reposo. Lo que se abre es el PASO entre
      botones, de 0 a 64: salen en abanico desde la primera ranura.
   3. SON DOS RESORTES, no uno. El ancho del campo se cierra en 365 ms y
      el paso se abre en 532 ms, 42 ms más tarde. Ajustados por mínimos
      cuadrados sobre la respuesta al escalón de un oscilador de segundo
      orden: 1.57 y 1.42 pt de error sobre 64 cuadros, y los dos ciclos
      limpios de la grabación dan lo mismo por separado.
   4. MIENTRAS ESTÁN CERCA, EL VIDRIO LAS UNE con un cuello. Medido: dos
      centros a 61 pt de distancia dan un cuello de 25 pt de alto, que
      con el modelo de desenfoque y umbral es σ ≈ 6.6 pt; el puente se
      corta en un hueco de ~9 y en reposo el hueco es 10.

   QUÉ NO SE COPIÓ, Y POR QUÉ. En la grabación el puntero nunca sube a
   la barra: entra por abajo, se para a 200 pt del campo y ahí se queda,
   y las tres esperas entre abrir y separar son distintas (733, 217 y
   933 ms). O sea que la grabación no dice qué dispara la separación.
   Acá la dispara el hover, que es lo que pidió el usuario (2026-09-09).

   LA VERIFICACIÓN. Con la pieza corriendo se muestreó cuadro a cuadro el
   borde derecho del conjunto y se comparó contra la misma traza de la
   grabación: 4.95 pt de error cuadrático medio y 18.7 de máximo sobre el
   primer segundo, sin latencia que descontar (el mejor desfase da −2 ms).
   El máximo cae justo en el mínimo de la curva, donde la medición del
   video es menos confiable porque el goo ensancha la silueta.

   CORRECCIÓN, 2026-09-09: acá decía 2.35 pt. Ese número salía de una
   sonda que modelaba el borde del botón en r = 19.58 —el radio
   compensado que tenía el goo— cuando lo que se dibuja mide 19. Con las
   formas nítidas encima, el modelo y lo dibujado coinciden, y el número
   honesto es 4.95. Lo que se mueve no cambió: cambió la sonda.
   La sonda está en .context/buttons-separate/.

   EL CAMPO NO ES UN <input>. En la lista, el preview vive adentro del
   <a> de la card: un campo de texto ahí adentro es un link que contiene
   un control de texto, y un lector de pantalla lo anuncia así. Los
   cuatro botones sí son <button>, con el mismo freno que el botón de
   velocidad del reproductor —preventDefault y stopPropagation— que es
   el precedente que ya existe en parts.tsx.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

/* ─────────────────────────────────────────────────────────
 * STORYBOARD — cada tiempo es ms desde que entra el puntero
 *
 *     0ms   el campo empieza a acortarse, 456 → 276
 *    42ms   los botones empiezan a abrirse en abanico, paso 0 → 45
 *   ~90ms   el campo pasa por su ancho final y sigue de largo
 *   ~140ms  asoma el cuarto botón por el extremo derecho
 *   ~200ms  empiezan a aparecer los iconos, y terminan a los ~460
 *   ~400ms  el paso pasa por 45 y rebota un 6 %
 *   ~730ms  todo quieto
 *
 * Al salir el puntero, lo mismo al revés y con el retraso del otro
 * lado: primero se juntan los botones, después los tapa el campo.
 * ───────────────────────────────────────────────────────── */

/* LA GEOMETRÍA, en px de pantalla. Es la referencia por 5/7: el campo
   de 56 pt de alto entraría crudo en la card de 544, pero 640 de largo
   no, y encogerlo sólo a lo ancho rompería la proporción que hace que
   esto se lea como un control y no como una barra. Cada valor lleva al
   lado el punto del que salió. */
const G = {
  alto: 40, //          56 pt · 5/7 = 40.0
  campo: 276, //       384 pt        = 274.3, redondeado para cerrar en 456
  boton: 38, //         54 pt        = 38.6
  hueco: 7, //          10 pt        =  7.1
  /* LA CAJA de la lupa, no el glifo. El glifo ocupa 14.5 de las 16
     unidades del viewBox, o sea 0.906 de la caja: 18 × 0.906 = 16.3 px,
     que son los 23 pt medidos en la referencia por 5/7 (16.4). Estaba
     en 16 con un glifo que llenaba 0.71 y salía de 11.35 px, la mitad
     del que hay que copiar. */
  lupa: 18, //          23 pt de glifo = 16.4 px; la caja, 18
  lupaSangria: 14, //   20.5 pt = 14.6 del borde del campo al glifo, y el
  //                    glifo entra 0.86 en su caja
  lupaTexto: 12, //     18 pt = 12.9 del glifo a la primera letra
  texto: 18, //         26 pt        = 18.6, sacado de la altura de x (13.5 pt)
  icono: 22, //         22 pt de 54 = 0.407 del diámetro; acá 15.1 de 38 = 0.398
  //                     (los cuatro glifos ocupan 11 de la caja de 16, o sea 0.6875)
}
const PASO = G.boton + G.hueco //  45 — 64 pt · 5/7 = 45.7
const TOTAL = G.campo + G.hueco + 4 * G.boton + 3 * G.hueco // 456 — 640 pt
/* La primera ranura: el centro del primer botón, y el punto del que
   salen los otros tres. No se mueve nunca (nota 2 de arriba). */
const RANURA = G.campo + G.hueco + G.boton / 2

/* Cuánto se sale el degradado de la escena por cada lado. El vidrio es
   una copia desenfocada de ese degradado, y un desenfoque se come el
   borde de su propia capa: si las dos capas terminan donde termina la
   escena, la mitad izquierda del vidrio muestra el desvanecido en vez
   del fondo. Las dos se dibujan sobre la misma caja agrandada, así que
   siguen coincidiendo píxel a píxel. */
const DESBORDE = 96

/* El aire mínimo a cada lado de la barra. Por debajo de 456 + 2·44 la
   barra se achica en bloque, con un solo factor que va al transform de
   las formas y al del contenido. */
const AIRE = 44

/* EL MOVIMIENTO, en la parametrización de Apple: `duración` fija la
   frecuencia (ω = 2π/duración) y `rebote` la amortiguación (1 − rebote).
   Los dos pares están MEDIDOS sobre la grabación por mínimos cuadrados,
   y se ajustaron con ESTE modelo puesto: el campo arrancando en su ancho
   de reposo y el abanico en la primera ranura, sin desfase libre. Con el
   desfase suelto el ajuste da 395 ms para el campo y 0.58 pt de error,
   pero se los come un t0 de −8 ms que acá no existe: el resorte arranca
   cuando entra el puntero. 1.57 y 1.42 pt de error sobre 64 cuadros. */
const CAMPO = { duracion: 0.365, rebote: 0.38 } //   365 ms, rms 1.57 pt
const ABANICO = { duracion: 0.532, rebote: 0.32 } // 532 ms, rms 1.42 pt
const RETRASO = 0.042 //                             s, medido

/* LOS ICONOS TIENEN SU PROPIO TRAMO, y no una ventana sobre el abanico.
   En la grabación el primer glifo se distingue a los 200 ms y termina de
   aparecer a los 500. El abanico ya vale ~1 a los 300, así que colgado de
   él el tramo no puede durar 300 ms: terminaba a los 307 y entraba un
   40 % más rápido que la referencia. Un resorte sin rebote de 300 ms que
   arranca a los 158 después del abanico llega lleno a los ~460. */
const ICONO = { duracion: 0.3, rebote: 0 }
const RETRASO_ICONO = 0.158

/* LA SALIDA NO ES LA ENTRADA AL REVÉS, y por tres razones que se ven
   posando el cierre cuadro a cuadro (Vito, 2026-09-09: "la salida sobre
   todo, no me convence"):

   1. LOS ICONOS QUEDABAN DE FANTASMA. Los botones se tocan cuando el
      paso baja de 38 —el diámetro—, a los ~55 ms, y con el tramo de 300
      los glifos todavía valían 0.28 a los 120: cuatro iconos apilados
      encima del campo. Se van en 110 ms, antes de que las formas se
      pisen.
   2. EL CAMPO SE PASABA 14 px de su largo de reposo a los 300 ms. Ese
      rebote está MEDIDO, pero en la contracción de la apertura: al
      cerrar no hay nada que lo justifique y se lee como un temblor. Al
      cerrar, sin rebote.
   3. ERA TAN LARGA COMO LA ENTRADA. El que se va ya decidió irse. Un
      cuarto más corta, que es la regla.

   La entrada se queda EXACTA como la referencia: lo de acá es sólo el
   cierre, que la grabación no muestra. */
const CAMPO_SALIDA = { duracion: 0.28, rebote: 0 }
const ABANICO_SALIDA = { duracion: 0.4, rebote: 0.1 }
const ICONO_SALIDA = { duracion: 0.11, rebote: 0 }

/* EL PRESS. Achica el círculo del vidrio, no el glifo: antes escalaba
   sólo el <svg> y se leía "se achicó el ícono", no "se hundió el botón".
   0.96 y no menos, que abajo de 0.95 se ve exagerado. */
const PRESION = { duracion: 0.16, rebote: 0 }
const PRESION_ESCALA = 0.96

/* Con movimiento reducido no se apaga la separación —es el contenido de
   la pieza, no un adorno— pero sí el rebote y el retraso: un solo tramo
   corto y sin sobrepasar. */
const SIN_REBOTE = { duracion: 0.15, rebote: 0 }

/* EL INTEGRADOR. Dos resortes de segundo orden, masa 1, en un solo lazo
   de cuadro. Es la pieza entera que se traía `motion`: catorce kilobytes
   comprimidos de librería para mover dos números, y en producción esta
   pieza era su único lector.

   Euler semi-implícito con sub-paso fijo de 1/240 s: a 60 Hz un paso de
   16.7 ms con ω = 16 rad/s ya se pasa de largo, y con la pestaña en
   segundo plano el navegador entrega saltos de cientos de ms. El sub-
   paso los parte; el tope de 50 ms descarta lo que quedó atrás.

   La interrupción sale gratis y es la mitad del asunto: entrar y salir
   rápido con el puntero sólo cambia el destino, y la posición y la
   velocidad siguen siendo las que había. */
const SUBPASO = 1 / 240
const SALTO_MAXIMO = 0.05

type Resorte = {
  x: number //       posición, 0 cerrado y 1 abierto
  v: number //       velocidad, por segundo
  destino: number
  desde: number //   cuándo empieza a moverse, en segundos de reloj
  k: number //       rigidez
  c: number //       amortiguamiento
}

type Ajuste = { duracion: number; rebote: number }

function afinar(r: Resorte, { duracion, rebote }: Ajuste) {
  const w = (2 * Math.PI) / duracion
  r.k = w * w
  r.c = 2 * (1 - rebote) * w
}

function nace(x: number, ajuste: Ajuste): Resorte {
  const r: Resorte = { x, v: 0, destino: x, desde: 0, k: 0, c: 0 }
  afinar(r, ajuste)
  return r
}

/* Devuelve true mientras al resorte le quede algo por hacer. El reposo
   se toma en 1/2000 de recorrido —0.09 px sobre los 180 que viaja el
   campo— y en 1/200 por segundo. */
function avanzar(r: Resorte, ahora: number, dt: number) {
  if (ahora < r.desde) return true
  let queda = Math.min(dt, SALTO_MAXIMO)
  while (queda > 0) {
    const h = Math.min(SUBPASO, queda)
    r.v += (-r.k * (r.x - r.destino) - r.c * r.v) * h
    r.x += r.v * h
    queda -= h
  }
  if (Math.abs(r.x - r.destino) < 0.0005 && Math.abs(r.v) < 0.005) {
    r.x = r.destino
    r.v = 0
    return false
  }
  return true
}

/* EL GOO. σ = 6.6 pt medido · 5/7 = 4.7 px. El umbral del feColorMatrix
   está en alfa 0.5, que es donde vale la cuenta del cuello.

   EL GOO SÓLO PONE LOS CUELLOS. El borde de cada forma lo pone la forma
   misma, dibujada otra vez encima y sin filtro. No es cinturón y
   tirantes: la especificación de SVG deja implementar feGaussianBlur
   como TRES desenfoques de caja, y Chrome lo hace; con un umbral duro
   detrás, las curvas de nivel de esa aproximación se ven, y un círculo
   de 38 sale como un polígono redondeado. Se veía al 4× (Vito,
   2026-09-09: "que terminen redondos bien, al 100").

   El umbral encoge lo curvo en σ²/2R —0.58 px en un círculo de 19—, así
   que la capa del goo queda ADENTRO de la nítida y no asoma ninguna
   faceta. Por eso el radio ya no se compensa. */
const SIGMA = 4.7

/* LOS CUATRO BOTONES. Iconos de trazo, 16×16: son ámbitos de búsqueda,
   que es lo que son los cuatro de la referencia. */
const BOTONES = [
  {
    nombre: 'Files',
    trazo:
      'M9.5 2.5H5.1A1.6 1.6 0 0 0 3.5 4.1v7.8a1.6 1.6 0 0 0 1.6 1.6h5.8a1.6 1.6 0 0 0 1.6-1.6V5.5zM9.5 2.5v2.2a.8.8 0 0 0 .8.8h2.2',
  },
  {
    nombre: 'Images',
    trazo:
      'M2.5 5.3a1.8 1.8 0 0 1 1.8-1.8h7.4a1.8 1.8 0 0 1 1.8 1.8v5.4a1.8 1.8 0 0 1-1.8 1.8H4.3a1.8 1.8 0 0 1-1.8-1.8zM2.9 11.5 5.7 8.9a1.3 1.3 0 0 1 1.8 0l2.3 2.4M9.6 10l.8-.9a1.3 1.3 0 0 1 1.8 0l1.3 1.2M6.4 6.5a.8.8 0 1 1-1.6 0 .8.8 0 0 1 1.6 0',
  },
  {
    nombre: 'People',
    trazo: 'M10.7 5.7a2.7 2.7 0 1 1-5.4 0 2.7 2.7 0 0 1 5.4 0M3.3 13.4a4.9 4.9 0 0 1 9.4 0',
  },
  {
    nombre: 'Messages',
    trazo:
      'M12.9 8.05c0 2.6-2.2 4.75-4.9 4.75a5.4 5.4 0 0 1-1.6-.24l-3.1 1.24.8-2.42A4.55 4.55 0 0 1 3.1 8.05c0-2.6 2.2-4.75 4.9-4.75s4.9 2.15 4.9 4.75',
  },
] as const

/* Un puntero fino que no puede hacer hover —un dedo— no tiene cómo
   pedir la separación, así que la pieza arranca abierta y se queda. Es
   lo mismo que hace el botón de velocidad del reproductor. */
const sinHover = () => typeof matchMedia === 'function' && !matchMedia('(hover: hover)').matches

/* La misma consulta que el resto del sitio, escuchada para que un cambio
   del sistema se vea sin recargar. */
function useMovimientoReducido() {
  const [reducido, setReducido] = useState(
    () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const consulta = matchMedia('(prefers-reduced-motion: reduce)')
    const alCambiar = (e: MediaQueryListEvent) => setReducido(e.matches)
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [])
  return reducido
}

type Asiento = { x: number; y: number; escala: number; ancho: number; alto: number }

export default function ButtonsSeparate() {
  /* Sin los dos puntos: `useId` los devolvía en versiones anteriores de
     React y un id con `:` no se puede escribir en un `url(#…)`. */
  const id = useId().replace(/:/g, '')
  const escena = useRef<HTMLDivElement>(null)
  const campo = useRef<SVGRectElement>(null)
  const circulos = useRef<(SVGCircleElement | null)[]>([])
  const contenido = useRef<HTMLDivElement>(null)
  const botones = useRef<(HTMLButtonElement | null)[]>([])

  /* Se decide ANTES del primer render y no en un efecto: con un efecto,
     un teléfono pintaría un cuadro con la forma cerrada y la abriría
     después. */
  const [abierto, setAbierto] = useState(sinHover)
  const reducido = useMovimientoReducido()

  /* LOS RESORTES VIVEN EN UN REF y no en estado: los toca el lazo de
     cuadro, y un estado por cuadro volvería a renderizar la pieza
     sesenta veces por segundo para mover un puñado de números. */
  const resortes = useRef({
    campo: nace(abierto ? 1 : 0, CAMPO),
    abanico: nace(abierto ? 1 : 0, ABANICO),
    icono: nace(abierto ? 1 : 0, ICONO),
    presion: BOTONES.map(() => nace(0, PRESION)),
  })
  const todos = (r: typeof resortes.current) => [r.campo, r.abanico, r.icono, ...r.presion]

  /* DÓNDE CAE LA BARRA DENTRO DE LA ESCENA. Las máscaras se dibujan en
     el espacio de la escena, así que el origen y la escala tienen que
     ser UN solo par de números: el mismo transform los aplica a las
     formas y a la capa del contenido. Se recalculan cuando la escena
     cambia de tamaño, no por cuadro. */
  const [caja, setCaja] = useState<Asiento>({ x: 0, y: 0, escala: 1, ancho: 0, alto: 0 })
  useLayoutEffect(() => {
    const el = escena.current
    if (!el) return
    const medir = () => {
      const { width, height } = el.getBoundingClientRect()
      const escala = Math.min(1, (width - 2 * AIRE) / TOTAL)
      setCaja({
        x: Math.round(width - TOTAL * escala) / 2,
        y: Math.round(height - G.alto * escala) / 2,
        escala,
        ancho: Math.ceil(width),
        alto: Math.ceil(height),
      })
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  /* EL LAZO DE CUADRO, FUERA DE REACT. Escribe atributos y estilos
     directo en el DOM. La opacidad va en cada botón y no en una
     variable CSS del padre: una variable obliga a recalcular el estilo
     de todo el subárbol por cuadro, y esto son cuatro escrituras. */
  const pintar = useCallback(() => {
    const { campo: rc, abanico: ra, icono: ri, presion } = resortes.current
    campo.current?.setAttribute('width', String(TOTAL + (G.campo - TOTAL) * rc.x))
    const paso = PASO * ra.x
    const visible = String(Math.max(0, Math.min(1, ri.x)))
    for (let i = 0; i < BOTONES.length; i++) {
      const encogido = 1 - (1 - PRESION_ESCALA) * presion[i].x
      circulos.current[i]?.setAttribute('cx', String(RANURA + paso * i))
      circulos.current[i]?.setAttribute('r', String((G.boton / 2) * encogido))
      const boton = botones.current[i]
      if (boton) {
        boton.style.transform = `translateX(${paso * i}px) scale(${encogido})`
        boton.style.opacity = visible
      }
    }
  }, [])
  useLayoutEffect(() => {
    pintar()
  }, [pintar, caja])

  /* UN SOLO LAZO PARA TODO, y sólo mientras algo se mueve: en reposo no
     hay cuadro pedido, que es lo que hace que ocho de estas piezas en
     una lista no cuesten nada (medido: ocho montadas, scrolleando a 20×
     de CPU, cero cuadros perdidos). */
  const cuadro = useRef(0)
  const reloj = useRef(0)
  const animar = useCallback(() => {
    if (cuadro.current) return
    reloj.current = performance.now() / 1000
    const paso = (ms: number) => {
      const t = ms / 1000
      const dt = t - reloj.current
      reloj.current = t
      let vivo = false
      for (const r of todos(resortes.current)) vivo = avanzar(r, t, dt) || vivo
      pintar()
      cuadro.current = vivo ? requestAnimationFrame(paso) : 0
    }
    cuadro.current = requestAnimationFrame(paso)
  }, [pintar])
  useEffect(() => () => cancelAnimationFrame(cuadro.current), [])

  /* EL RETRASO CAMBIA DE LADO. Al abrir, el campo va primero y los
     botones lo siguen; al cerrar, primero se juntan los botones y
     después los tapa el campo. Si no, el campo crecería por encima de
     cuatro botones todavía abiertos y saldrían de adentro.

     Va en un efecto de LAYOUT y no en uno normal: con useEffect el
     primer cuadro del resorte cae después de pintar, y eso son 16 ms
     sobre una separación de 730. */
  useLayoutEffect(() => {
    const { campo: rc, abanico: ra, icono: ri } = resortes.current
    const salida = !abierto
    afinar(rc, reducido ? SIN_REBOTE : salida ? CAMPO_SALIDA : CAMPO)
    afinar(ra, reducido ? SIN_REBOTE : salida ? ABANICO_SALIDA : ABANICO)
    afinar(ri, reducido ? SIN_REBOTE : salida ? ICONO_SALIDA : ICONO)

    /* Al montar, el destino ya es el que hay: no hay nada que integrar y
       pedir cuadros sería tenerlos girando por el retraso. */
    const destino = abierto ? 1 : 0
    if (rc.x === destino && ra.x === destino && ri.x === destino) return

    const ahora = performance.now() / 1000
    rc.destino = ra.destino = ri.destino = destino
    /* Al abrir sigue el abanico; al cerrar, el campo. Los iconos entran
       tarde y se van enseguida: al cerrar no hay nada que esperar. */
    rc.desde = ra.desde = ri.desde = ahora
    ;(abierto ? ra : rc).desde = ahora + (reducido ? 0 : RETRASO)
    if (abierto && !reducido) ri.desde = ahora + RETRASO + RETRASO_ICONO
    animar()
  }, [abierto, reducido, animar])

  const apretar = (i: number, hundido: boolean) => {
    const r = resortes.current.presion[i]
    afinar(r, reducido ? SIN_REBOTE : PRESION)
    r.destino = hundido ? 1 : 0
    r.desde = performance.now() / 1000
    animar()
  }

  const asiento = `translate(${caja.x}px, ${caja.y}px) scale(${caja.escala})`
  const mascara = (cual: 'relleno' | 'halo' | 'anillo') => {
    const url = `url(#mascara-${cual}-${id})`
    return { maskImage: url, WebkitMaskImage: url }
  }
  /* La región de una máscara es la caja del elemento que enmascara, y
     las tres capas cubren la escena entera. Sin esto, el valor por
     defecto se resuelve contra el <svg> de las definiciones, que mide
     cero, y la máscara sale vacía. */
  const cajaMascara = {
    maskUnits: 'userSpaceOnUse' as const,
    x: 0,
    y: 0,
    width: caja.ancho,
    height: caja.alto,
  }

  return (
    <div className="pieza" data-pieza="buttons-separate">
      <style href="pieza-buttons-separate" precedence="medium">
        {HOJA}
      </style>

      <div className="escena" ref={escena}>
        <div className="fondo" aria-hidden="true" />

        <svg className="definiciones" aria-hidden="true" focusable="false">
          <defs>
            {/* EL GOO: desenfocar y volver a endurecer el alfa. El
                umbral queda en 0.5 con 24/−12, que es donde vale la
                cuenta del cuello. sRGB explícito: por defecto un filtro
                SVG trabaja en linearRGB y el umbral se corre. */}
            <filter id={`goo-${id}`} {...REGION} colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation={SIGMA * caja.escala} result="difuso" />
              <feColorMatrix in="difuso" type="matrix" values={UMBRAL} />
            </filter>
            {/* LA SOMBRA DE CONTACTO: la silueta ablandada MENOS la
                silueta. Sólo queda el halo de afuera, así que el negro
                no se cuela por debajo del vidrio, que es translúcido.
                Medida en la referencia: simétrica alrededor de la forma
                y apagada a los 3 pt. */}
            <filter id={`halo-${id}`} {...REGION} colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation={1.4 * caja.escala} result="blanda" />
              <feComposite in="blanda" in2="SourceGraphic" operator="out" />
            </filter>
            {/* EL BORDE: la silueta menos la silueta comida un punto. Da
                el anillo de 1 pt medido en la referencia, y sigue el
                cuello del goo igual que el relleno. */}
            <filter id={`anillo-${id}`} {...REGION} colorInterpolationFilters="sRGB">
              <feMorphology operator="erode" radius={caja.escala} result="comida" />
              <feComposite in="SourceGraphic" in2="comida" operator="out" />
            </filter>

            {/* UN solo juego de formas y UNA sola pasada de goo. Las
                tres máscaras parten de la misma silueta: la sombra y el
                borde la reciben ya fundida, así que sus cuellos son
                exactamente los del relleno. */}
            <g id={`formas-${id}`} transform={`translate(${caja.x} ${caja.y}) scale(${caja.escala})`}>
              <rect ref={campo} x="0" y="0" width={TOTAL} height={G.alto} rx={G.alto / 2} fill="#fff" />
              {BOTONES.map((b, i) => (
                <circle
                  key={b.nombre}
                  ref={(el) => {
                    circulos.current[i] = el
                  }}
                  cx={RANURA}
                  cy={G.alto / 2}
                  r={G.boton / 2}
                  fill="#fff"
                />
              ))}
            </g>
            <g id={`silueta-${id}`}>
              <g filter={`url(#goo-${id})`}>
                <use href={`#formas-${id}`} />
              </g>
              <use href={`#formas-${id}`} />
            </g>

            {/* El prefijo de las máscaras NO es decorativo: un <mask> y
                un <filter> con el mismo id son un id duplicado, y
                url(#…) resuelve al primero de los dos — lo que deja la
                capa entera en blanco sin decir nada. */}
            <mask id={`mascara-relleno-${id}`} {...cajaMascara}>
              <use href={`#silueta-${id}`} />
            </mask>
            <mask id={`mascara-halo-${id}`} {...cajaMascara}>
              <g filter={`url(#halo-${id})`}>
                <use href={`#silueta-${id}`} />
              </g>
            </mask>
            <mask id={`mascara-anillo-${id}`} {...cajaMascara}>
              <g filter={`url(#anillo-${id})`}>
                <use href={`#silueta-${id}`} />
              </g>
            </mask>
          </defs>
        </svg>

        <div className="sombra" style={mascara('halo')} aria-hidden="true" />
        <div className="vidrio" style={mascara('relleno')} aria-hidden="true">
          <div className="refraccion" />
          <div className="velo" />
        </div>
        <div className="borde" style={mascara('anillo')} aria-hidden="true" />

        {/* LA CAJA QUE ESCUCHA AL PUNTERO ES LA BARRA VISIBLE, no la
            escena: sobre una card de 544×400 el puntero está siempre
            adentro y no se vería nunca la forma cerrada, que es la
            mitad de la pieza. */}
        <div
          className="contenido"
          ref={contenido}
          data-abierto={abierto ? '' : undefined}
          style={{ transform: asiento }}
          onPointerEnter={() => setAbierto(true)}
          onPointerLeave={() => setAbierto(sinHover)}
          onFocus={() => setAbierto(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setAbierto(sinHover)
          }}
        >
          <div className="campo" aria-hidden="true">
            {/* El glifo llena la caja de 0.75 a 15.25; el trazo de 1.27
                da los 2 pt medidos en la referencia (1.43 px). */}
            <svg className="lupa" viewBox="0 0 16 16" fill="none">
              <circle cx="6.4" cy="6.4" r="5" stroke="currentColor" strokeWidth="1.27" />
              <path
                d="M9.95 9.95 14.8 14.8"
                stroke="currentColor"
                strokeWidth="1.27"
                strokeLinecap="round"
              />
            </svg>
            <span className="marcador">Search</span>
          </div>
          {BOTONES.map((b, i) => (
            <button
              key={b.nombre}
              type="button"
              ref={(el) => {
                botones.current[i] = el
              }}
              className="boton"
              style={{ left: RANURA - G.boton / 2 }}
              aria-label={b.nombre}
              onPointerDown={() => apretar(i, true)}
              onPointerUp={() => apretar(i, false)}
              onPointerCancel={() => apretar(i, false)}
              onPointerLeave={() => apretar(i, false)}
              onClick={(e) => {
                /* El mismo freno que el botón de velocidad del
                   reproductor: en la lista este demo vive adentro del
                   <a> de la card, y sin esto un clic acá navega. */
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d={b.trazo}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* La región de los tres filtros. Por defecto un filtro pinta apenas un
   10 % afuera de la caja de la forma, y sobre una barra de 456×40 eso
   son 4 px arriba y abajo: el desenfoque y la sombra quedarían
   cortados. */
const REGION = { x: '-10%', y: '-80%', width: '120%', height: '260%' } as const
/* Alfa por 24 menos 12: un escalón con el umbral en 0.5. */
const UMBRAL = '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -12'

/* La hoja va adentro del archivo porque una pieza publicada es UN
   archivo en src/piezas/: no puede traerse un .module.css al lado. El
   href la deduplica —React 19 la iza una sola vez aunque la lista y el
   detalle monten dos— y el data-pieza la encierra, así que los nombres
   cortos de adentro no chocan con nadie. */
const HOJA = `
/* Los DOS: en la card el alto lo pone un min-height heredado y el 100 %
   no resuelve; en el lienzo del playground el frame tiene alto fijo y
   entonces el que no resuelve es el min-height. */
[data-pieza='buttons-separate'] {
  width: 100%;
  height: 100%;
  min-height: inherit;
  display: grid;
}
[data-pieza='buttons-separate'] .escena {
  position: relative;
  min-height: inherit;
  isolation: isolate;
  overflow: hidden;
  /* El mismo radio que la card. Va escrito con respaldo porque una
     pieza no importa nada del producto: si el token está, manda. */
  border-radius: var(--card-radio, 8px);
  --fondo:
    radial-gradient(118% 150% at 20% 8%, #f2f5fa 0%, #cdd6e5 38%, #9aa7bd 76%, #8492aa 100%),
    linear-gradient(160deg, #e8edf5 0%, #7f8da5 100%);
  /* EL VELO Y EL DESENFOQUE SALEN DEL MATERIAL NATIVO, medidos en esta
     misma Mac con una sonda de SwiftUI: .glassEffect() sobre tres rampas
     de valor conocido, capturado con screencapture y ajustado por
     mínimos cuadrados. La ley es LINEAL en sRGB:

       claro   salida = 0.325 · fondo + 159   (rms 4.5 niveles)
       oscuro  salida = 0.444 · fondo +  31   (rms 10.4)

     Y eso es exactamente un velo: 1 − ganancia es el alfa, y el offset
     dividido por el alfa es el color. Nada de saturate ni de brightness:
     el ajuste con un saturate libre no mejora. Ver
     .context/buttons-separate/vidrio/. */
  --velo: rgba(235, 235, 235, 0.675);
  /* EL ANILLO, medido en la referencia: sube el relleno 40 niveles y no
     más —de rgb(178,197,230) a rgb(218,241,255)—, y es un blanco FRÍO,
     no blanco puro. Con el relleno de acá, 40 niveles son 0.42 de alfa. */
  --anillo: rgba(255, 255, 255, 0.85);
  --sombra: 0.16;
  /* El realce del hover TIÑE, no aclara: en claro el vidrio ya está
     casi en blanco y un velo blanco encima no se ve. */
  --realce: rgba(46, 68, 97, 0.1);
  /* UNA SOLA TINTA. En la referencia el placeholder, la lupa y los
     cuatro glifos miden lo mismo —rgb(47,69,99), rgb(48,69,97) y
     rgb(44,65,95)—: no hay un gris de marcador aparte. */
  --tinta: #2e4461;
}
@media (prefers-color-scheme: dark) {
  [data-pieza='buttons-separate'] .escena {
    --fondo:
      radial-gradient(118% 150% at 20% 8%, #5b74a2 0%, #35486d 38%, #1a2338 76%, #131a2b 100%),
      linear-gradient(160deg, #3d5075 0%, #0c1120 100%);
    /* Más velo que en claro: el vidrio de la referencia sube el fondo
       unos 120 niveles en los tres canales, y sobre un fondo oscuro eso
       pide más blanco para llegar al mismo lugar. */
    /* EL VELO NO CAMBIA CON EL TEMA. La ley oscura del nativo también
       está medida —salida = 0.444 · fondo + 31, o sea un velo de
       rgb(55,55,55) al 55.6 %— y da un vidrio MÁS OSCURO que el fondo,
       que es lo que hace macOS en oscuro. Acá no se usa: la referencia
       es la apariencia clara, un vidrio claro sobre un cielo oscuro, y
       eso es exactamente lo que pasa en el tema oscuro de la pieza
       cuando la escena baja y el velo se queda. Poner la ley oscura deja
       forma oscura sobre fondo oscuro y la tinta ilegible; probado. */
    --anillo: rgba(226, 246, 255, 0.42);
    --sombra: 0.42;
    --realce: rgba(255, 255, 255, 0.2);
    --tinta: #2b405c;
  }
}
[data-pieza='buttons-separate'] .fondo,
[data-pieza='buttons-separate'] .refraccion {
  position: absolute;
  inset: -${DESBORDE}px;
  background: var(--fondo);
}
[data-pieza='buttons-separate'] .definiciones {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

/* EL VIDRIO ES UNA SEGUNDA COPIA DEL FONDO, desenfocada y aclarada, no
   un backdrop-filter. Dos razones y las dos importan: el desenfoque de
   la referencia es enorme —sobre la nube clara el vidrio da casi
   neutro, o sea que promedia un vecindario del ancho de la nube— y un
   backdrop-filter recortado por una máscara SVG no está garantizado en
   todos los motores. Acá el fondo es nuestro, así que copiarlo es
   exacto, y además sale más barato: la capa desenfocada no cambia
   nunca, lo único que se mueve es la máscara.

   El desenfoque va en el hijo y la máscara en el padre porque el orden
   de CSS es filtro y DESPUÉS máscara: con los dos en la misma capa, el
   velo blanco entraría también al saturate y al brightness. */
[data-pieza='buttons-separate'] .vidrio,
[data-pieza='buttons-separate'] .sombra,
[data-pieza='buttons-separate'] .borde {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
/* σ = 4.0 pt, medido sobre un borde duro de negro a blanco bajo el
   vidrio nativo: el 10 al 90 % cruza en 10.2 pt, y para una gaussiana
   eso es 2.563 σ. Por 5/7 son 2.9 px. Estaba en 20, siete veces de más:
   el error venía de leer el desenfoque en el video, donde el vidrio
   sobre la nube da casi neutro — pero eso no es desenfoque, es que la
   ley del material comprime el rango. */
[data-pieza='buttons-separate'] .refraccion {
  filter: blur(2.9px);
}
[data-pieza='buttons-separate'] .velo {
  position: absolute;
  inset: 0;
  background: var(--velo);
}
/* La sombra de contacto medida: el fondo por ~0.65 pegado al borde y
   apagada a los 3 pt. Va negra y corta, no una sombra proyectada: en la
   referencia es igual arriba que abajo. */
[data-pieza='buttons-separate'] .sombra {
  background: #000;
  opacity: var(--sombra);
}
[data-pieza='buttons-separate'] .borde {
  background: var(--anillo);
}

[data-pieza='buttons-separate'] .contenido {
  position: absolute;
  top: 0;
  left: 0;
  width: ${TOTAL}px;
  height: ${G.alto}px;
  transform-origin: 0 0;
  z-index: 1;
  color: var(--tinta);
}
[data-pieza='buttons-separate'] .campo {
  position: absolute;
  inset: 0 auto 0 ${G.lupaSangria}px;
  display: flex;
  align-items: center;
  gap: ${G.lupaTexto}px;
  pointer-events: none;
  user-select: none;
}
[data-pieza='buttons-separate'] .lupa {
  width: ${G.lupa}px;
  height: ${G.lupa}px;
  flex: none;
  color: var(--tinta);
}
[data-pieza='buttons-separate'] .marcador {
  font-size: ${G.texto}px;
  line-height: 1;
  letter-spacing: -0.01em;
  color: var(--tinta);
}
[data-pieza='buttons-separate'] .boton {
  position: absolute;
  top: ${(G.alto - G.boton) / 2}px;
  width: ${G.boton}px;
  height: ${G.boton}px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--tinta);
  /* La escribe el lazo de cuadro. Acá va el valor de arranque para que
     el primer pintado no muestre los cuatro apilados. */
  opacity: 0;
  transform-origin: 50% 50%;
  display: grid;
  place-items: center;
  cursor: pointer;
  isolation: isolate;
  /* Cerrado están los cuatro apilados y transparentes: sin esto, un
     clic ahí le pega al último de la pila. */
  pointer-events: none;
}
[data-pieza='buttons-separate'] .contenido[data-abierto] .boton {
  pointer-events: auto;
}
/* El área de toque llega a 44 sin tocar la del vecino: el hueco es de
   7, y 3 de cada lado dejan 1 entre las dos. */
[data-pieza='buttons-separate'] .boton::before {
  content: '';
  position: absolute;
  inset: -3px;
}
[data-pieza='buttons-separate'] .boton svg {
  position: relative;
  width: ${G.icono}px;
  height: ${G.icono}px;
}
/* EL HOVER ENCIENDE EL VIDRIO, no el glifo. El relleno del botón lo
   dibuja la capa enmascarada, que es una sola para las cinco formas: un
   velo redondo del tamaño exacto del círculo, encima, es la única forma
   de aclarar UNO. El press ya no vive acá: achica el CÍRCULO de la
   máscara, en el lazo de cuadro, así que se hunde el botón entero y no
   sólo el glifo. */
[data-pieza='buttons-separate'] .boton::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--realce);
  opacity: 0;
  transition-property: opacity;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
/* Un dedo dispara :hover al tocar y lo deja pegado. */
@media (hover: hover) and (pointer: fine) {
  [data-pieza='buttons-separate'] .boton:hover::after {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  [data-pieza='buttons-separate'] .boton::after {
    transition-duration: 0s;
  }
}
[data-pieza='buttons-separate'] .boton:focus-visible {
  outline: var(--focus-outline, 2px solid #005fcc);
  outline-offset: var(--focus-outline-offset, 2px);
}
`
