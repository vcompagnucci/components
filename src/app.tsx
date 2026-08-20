import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react'
import css from './app.module.css'
import { Detail, Item, Masthead, baseDeTexto, slug } from './parts'
import { PIECES, type Piece, type Platform } from './pieces'
import { Lab } from './proto/lab'
import { NotFound } from './not-found'

const PLATFORMS = ['Web', 'App'] as const
const by = (pl: Platform) => PIECES.filter((p) => p.platform === pl)

/* ═══════════ LAS RUTAS PRIVADAS ═══════════
   El vault y el playground. NO SE PUBLICAN: existen sólo mientras corre
   el servidor de desarrollo, y no porque el host las bloquee sino
   porque el código no llega al build.

   Son DOS PLIEGUES, y hacen falta los dos:

     1. la lista        import.meta.env.DEV ? [...] : []
     2. el componente   import.meta.env.DEV ? lazy(() => import(…)) : null

   Vite reemplaza import.meta.env.DEV por `false` al construir, los dos
   ternarios se pliegan a su rama vacía, y con eso desaparecen tanto las
   cadenas "/vault" y "/playground" como el import dinámico entero —
   Rollup no genera el chunk de algo que nadie alcanza. Sin el pliegue 1
   las rutas quedarían escritas en el bundle; sin el 2 quedaría el
   código. Verificado contando ocurrencias en dist/.

   La lista vive acá y no adentro de src/privado/ por la misma razón:
   importarla del otro lado la ataría al bundle. Acá es el router el que
   sabe qué rutas hay —que ya es su trabajo, igual que con las piezas— y
   src/privado/ sólo sabe dibujarlas.

   Y como en producción la lista queda vacía, desdeUrl nunca devuelve
   'privado' y /vault cae en la misma rama que cualquier URL inventada:
   404, sin ninguna regla especial. */
export type Privada = { ruta: string; nombre: string }

/* Lo que viene DESPUÉS de la ruta privada: /vault/nativo/sheet.mov deja
   "nativo/sheet.mov". Existe porque el detalle de un clip tiene que
   vivir en el HISTORIAL y no en un estado local.

   Vivía en un useState, y eso producía un bug que se sentía como un
   error del navegador: abrías un clip, hacías el gesto de atrás en el
   trackpad, y en vez de cerrar el clip te sacaba del vault entero —
   aterrizabas en /playground, porque era la entrada anterior de
   verdad. El detalle no estaba en la pila, así que no había nada que
   deshacer.

   De paso cada clip queda linkeable, que es lo que querés cuando le
   pasás una referencia a un agente. */
export type Vista2 = { privada: Privada; resto: string }

const PRIVADAS: Privada[] = import.meta.env.DEV
  ? [
      { ruta: '/vault', nombre: 'Vault' },
      { ruta: '/playground', nombre: 'Playground' },
    ]
  : []

const Privado = import.meta.env.DEV ? lazy(() => import('./privado/privado')) : null

/* Rutas sin router: son TRES vistas. `/` es la lista, `/button` la
   pieza, y cualquier otra cosa es una ruta que no existe.

   Las tres respuestas son las de benji y josh, que coinciden exactas —
   medido con curl contra las dos:

     /drawesome     200            la pieza
     /no-existe     404            la URL SE QUEDA, no redirige
     /Drawesome     404            la mayúscula NO se normaliza
     /drawesome/    308 → sin barra  redirect permanente al canónico

   La barra final se resuelve acá con replaceState —el equivalente de
   cliente de un 308: no agrega entrada al historial, así que el botón
   de atrás no queda atrapado rebotando— y en el host con la config de
   verdad. El resto no se toca: una ruta inválida se queda donde está.

   Y el título NO cambia en el 404. También medido: el de benji sigue
   diciendo "Benji Taylor" y el de josh "Josh Puckett".

   El status HTTP real lo tiene que dar el host, porque un SPA que ya
   cargó no puede cambiarlo. Como las 18 rutas se conocen en build, el
   host puede servir index.html sólo para ésas y devolver un 404 de
   verdad para todo lo demás — que es exactamente lo que hacen los dos.
   Está en vercel.json. */
type Vista =
  | { tipo: 'lista' }
  | { tipo: 'pieza'; piece: Piece }
  | { tipo: 'privado'; privada: Privada; resto: string }
  | { tipo: 'nada' }

const desdeUrl = (): Vista => {
  let ruta: string
  try {
    ruta = decodeURIComponent(location.pathname)
  } catch {
    return { tipo: 'nada' }
  }
  if (ruta.length > 1 && ruta.endsWith('/')) {
    ruta = ruta.replace(/\/+$/, '')
    history.replaceState(history.state, '', ruta + location.search + location.hash)
  }
  if (ruta === '' || ruta === '/') return { tipo: 'lista' }
  /* En producción PRIVADAS está vacío, así que este find nunca acierta y
     /vault cae en 'nada' como cualquier URL inventada.

     Matchea la ruta exacta Y sus subrutas: /vault y /vault/lo/que/sea.
     El separador en el startsWith importa — sin él "/vaultimpostor"
     también entraría. */
  const privada = PRIVADAS.find((p) => ruta === p.ruta || ruta.startsWith(p.ruta + '/'))
  if (privada) {
    return { tipo: 'privado', privada, resto: ruta.slice(privada.ruta.length + 1) }
  }
  const encontrada = PIECES.find((p) => slug(p.name) === ruta.slice(1))
  return encontrada ? { tipo: 'pieza', piece: encontrada } : { tipo: 'nada' }
}

/* 80px de descuento: el mismo aire superior de la página, así el título
   de la pieza no queda pegado al borde al llegar. */
const goTo = (name: string) => {
  const el = document.getElementById(slug(name))
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({
    top: el.getBoundingClientRect().top + window.scrollY - 80,
    behavior: reduce ? 'auto' : 'smooth',
  })
}

/* "Web", el primer rótulo del índice, se apoya en la misma línea que
   "Button", el título de la primera pieza. Los dos extremos del par que
   se eligió mirando; el cómo está en el efecto que lo mide. */
const ALINEAR = { desde: '[data-primer-rotulo]', hasta: '[data-primera-pieza]' }

/* Cuál pieza está activa: la ÚLTIMA cuyo borde superior ya pasó una
   línea a --index-spy-line del tope del viewport.

   Es la regla de benji, que en su bundle minificado parece más compleja
   de lo que es:

     punto     = scrollY + 128 + 0.5·altoVentana
     condición = punto > topAbsoluto + 0.5·altoVentana

   El medio viewport está de los dos lados y se cancela, así que queda
   `topAbsoluto < scrollY + 128`, o sea `rect.top < 128`. */
const LINEA_SPY = 128

function piezaActiva(): string | null {
  let activa: string | null = null
  for (const p of PIECES) {
    const el = document.getElementById(slug(p.name))
    if (el && el.getBoundingClientRect().top < LINEA_SPY) activa = slug(p.name)
  }
  /* Al final del documento gana la última sí o sí: la que queda abajo de
     todo puede ser demasiado corta para llegar nunca a la línea. También
     es de él. */
  const d = document.documentElement
  if (d.scrollHeight - window.scrollY - window.innerHeight < 24) {
    activa = slug(PIECES[PIECES.length - 1].name)
  }
  return activa
}

function Index({ activa }: { activa: string | null }) {
  return (
    <nav className={css.index} aria-label="Pieces">
      {PLATFORMS.map((pl) => (
        <div className={css.indexGroup} key={pl}>
          {/* El primer rótulo es el que se alinea con la primera pieza. */}
          <div className={css.indexLabel} data-primer-rotulo={pl === PLATFORMS[0] ? '' : undefined}>
            {pl}
          </div>
          <div className={css.indexList}>
            {by(pl).map((p) => (
              <button
                className={css.indexLink}
                key={p.name}
                data-active={activa === slug(p.name) ? '' : undefined}
                onClick={() => goTo(p.name)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function App() {
  const [vista, setVista] = useState<Vista>(desdeUrl)
  const [activa, setActiva] = useState<string | null>(null)
  /* La lista es la única vista con índice y scrollspy; las otras dos
     comparten "no es la lista". */
  const selected = vista.tipo === 'pieza' ? vista.piece : null
  const esLista = vista.tipo === 'lista'
  const listScroll = useRef(0)
  const first = useRef(true)

  /* ALINEACIÓN DEL ÍNDICE — "Web", el primer rótulo, se apoya en la misma
     línea que "Button", el título de la primera pieza.

     El par se eligió mirando, contra otros dos: primer link ↔ primera
     pieza, y rótulo ↔ separador de sección. Ganó éste.

     Se alinea por la BASE del texto y no por el medio de las cajas: los
     renglones del índice son 13/16 y los de la página 14/20, así que
     centrarlos deja las letras apoyadas en dos alturas distintas. (Acá
     la diferencia entre las dos formas es 0.60px y el redondeo a píxel
     entero se la come — pero el que la fórmula sea la correcta deja de
     ser un detalle apenas los dos tamaños se separen más.)

     Y se MIDE en vez de calcularse. El número correcto sería la suma de
     todo el apilado vertical de la página, y escribir esa suma como calc
     duplicaría la estructura entera en una fórmula que nadie
     actualizaría si mañana se agrega un elemento en el medio: quedaría
     mal y nada lo diría. Midiendo, se corrige sola — como ya pasó al
     meterle 16px de aire al rótulo.

     En useLayoutEffect, antes de pintar, para que no se vea el salto. */
  useLayoutEffect(() => {
    if (!esLista) return
    const alinear = () => {
      const nav = document.querySelector<HTMLElement>('[aria-label="Pieces"]')
      const desde = document.querySelector<HTMLElement>(ALINEAR.desde)
      const hasta = document.querySelector<HTMLElement>(ALINEAR.hasta)
      if (!nav || !desde || !hasta) return
      const actual = parseFloat(getComputedStyle(nav).top) || 0
      const delta = baseDeTexto(hasta) - baseDeTexto(desde)
      nav.style.setProperty('--index-offset-top', `${Math.round(actual + delta)}px`)
    }
    alinear()
    window.addEventListener('resize', alinear)
    return () => window.removeEventListener('resize', alinear)
  }, [esLista])

  /* La pieza activa necesita el scroll, porque la respuesta cambia de
     forma continua y no en un borde. Se calcula en rAF para no hacer
     layout más de una vez por cuadro. */
  useEffect(() => {
    if (!esLista) return
    let pedido = 0
    const leer = () => {
      pedido = 0
      setActiva(piezaActiva())
    }
    const onScroll = () => {
      if (!pedido) pedido = requestAnimationFrame(leer)
    }
    leer()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (pedido) cancelAnimationFrame(pedido)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [esLista])

  useEffect(() => {
    const onPop = () => setVista(desdeUrl())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  /* Las rutas privadas llevan su propio nombre y no el del producto: no
     son el producto, y con dos pestañas abiertas el nombre es lo único
     que las distingue. El resto —la lista y la ruta que no existe— sigue
     diciendo "Library", igual que antes. */
  useEffect(() => {
    if (vista.tipo === 'pieza') document.title = `${vista.piece.name} — Library`
    else if (vista.tipo === 'privado') document.title = vista.privada.nombre
    else document.title = 'Library'
  }, [vista])

  /* Volver a la lista devuelve el scroll donde estabas. Sin esto la
     lista reaparece arriba de todo y perdés el lugar, que con 18 piezas
     es media pantalla de scroll. El primer render se saltea para no
     pisar la restauración del navegador al recargar. */
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    window.scrollTo(0, esLista ? listScroll.current : 0)
  }, [vista])

  /* Navegación de cliente genérica: empuja la URL y relee la vista de
     ella. Que la vista salga de desdeUrl() y no de un argumento es a
     propósito — así llegar a /vault por link, por barra de direcciones o
     por el botón de atrás pasa siempre por el mismo camino. */
  const ir = (ruta: string) => {
    history.pushState({}, '', ruta)
    setVista(desdeUrl())
  }

  const open = (p: Piece) => {
    listScroll.current = window.scrollY
    history.pushState({ fromList: true }, '', `/${slug(p.name)}`)
    setVista({ tipo: 'pieza', piece: p })
  }

  /* Si llegaste desde la lista, volvés por el historial y la pila no
     crece. Si entraste directo por link no hay a dónde volver, así que
     se empuja la lista. */
  const back = () => {
    if (history.state?.fromList) {
      history.back()
      return
    }
    history.pushState({}, '', '/')
    setVista({ tipo: 'lista' })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selected) back()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  /* El `&& Privado` no es defensivo, es lo que le dice a TypeScript que
     en producción esto no existe. Y no puede darse el caso de una vista
     privada sin componente: las dos salen del mismo import.meta.env.DEV. */
  if (vista.tipo === 'privado' && Privado) {
    return (
      /* fallback en null y no en un cartel: el chunk está en disco, a un
         fetch del servidor local, y cualquier cosa que se dibuje sería un
         parpadeo de un cuadro. */
      <Suspense fallback={null}>
        <Privado vistas={PRIVADAS} actual={vista.privada.ruta} resto={vista.resto} ir={ir} />
        {/* El toggle de tema también acá: el área privada usa los mismos
            tokens, así que hay que poder mirarla en oscuro. Vive abajo;
            las opciones de cada vista van arriba, para no pisarse. */}
        <Lab />
      </Suspense>
    )
  }

  if (vista.tipo === 'nada') {
    return <NotFound />
  }

  if (selected) {
    return (
      <div className={css.page}>
        <Detail piece={selected} onBack={back} />
        <Lab />
      </div>
    )
  }

  return (
    <div className={css.page}>
      <Index activa={activa} />
      <Masthead />
      <div className={css.content}>
        {PLATFORMS.map((pl) => (
          <section className={css.group} key={pl} data-plataforma={pl}>
            <div className={css.groupHead}>
              <div className={css.groupLabel}>{pl}</div>
              <span className={css.groupLine} aria-hidden />
            </div>
            {by(pl).map((p, i) => (
              <Item piece={p} onOpen={open} primera={pl === PLATFORMS[0] && i === 0} key={p.name} />
            ))}
          </section>
        ))}
      </div>
      <Lab />
    </div>
  )
}
