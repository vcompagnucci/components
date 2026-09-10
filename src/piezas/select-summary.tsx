/* ═══════════════════════════════════════════════════════════════
   SELECT SUMMARY — el resumen de una selección múltiple.

   PIEZA WEB, y corre viva: el archivo de este lado de la frontera es el
   canónico (ver AGENTS.md › La library). Es AUTOCONTENIDO a propósito —
   no importa nada de src/privado/ ni de ninguna otra pieza— y por eso
   las cuatro personas y su chip viven acá adentro y no en un módulo
   aparte.
   ═══════════════════════════════════════════════════════════════ */

/* ─── DE DONDE SALE CADA VALOR ───
   La referencia, reconstruida desde la medición.

   Referencia: VAULT_DIR/web/Select summary.mp4 (X, @abjt14). Todo lo
   que sigue se midió
   cuadro a cuadro sobre el máster de 1322×1058 a 60 fps, no a ojo.

   LA UNIDAD ES EL ALTO DEL DISPARADOR. La grabación tiene zoom
   variable, así que un ancho en píxeles de video no es un ancho en
   píxeles de CSS: lo único que sobrevive es la RAZÓN contra el alto del
   botón. Cada número de abajo lleva su razón medida al lado. El alto
   —40 px— es LA ÚNICA DECISIÓN nuestra: la medición lo acota entre 38 y
   44 (el anillo de 1 px mide 4.8 px de video) y adentro de esa banda no
   hay nada que medir.

   LO QUE SE MUEVE Y LO QUE NO. La referencia gasta todo su presupuesto
   de motion en el resumen y nada en el resto: la casilla y el relleno
   de la fila cambian en UN cuadro (≤17 ms, medido). Eso no es
   descuido, es la pieza: se llama Select summary porque el sumario es
   lo que se anima.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import type { Montaje } from '../demos'

/* Las cuatro personas de la pieza, y el chip que las contiene.

   ─── DE DÓNDE SALE CADA FOTO ───
   Son fotos de perfil de X de cuatro personas conocidas, bajadas el
   2026-09-10 y guardadas en public/piezas/select-summary/. Cada una se
   miró antes de entrar: una foto que uno no verificó es una foto
   equivocada.

     karri      @karrisaarinen   Karri Saarinen, CEO de Linear
     john       @johnternus      John Ternus, CEO de Apple desde el
                                 2026-09-01
     elon       @elonmusk        Elon Musk
     guillermo  @rauchg          Guillermo Rauch, CEO de Vercel

   LA DE ELON NO ES UNA CARA, y queda dicho: su avatar de hoy es un
   lanzamiento de Starship. Es su foto de perfil de verdad; si tiene que
   ser una cara, se cambia la foto o se cambia la persona.

   ENTERAS Y SIN TOCAR. Los cuatro archivos son los bytes que sirve X,
   copiados tal cual: 400 × 400, entre 20 y 33 KB, sha256 idéntico al de
   la descarga. Ni recorte ni reescala ni un segundo JPEG encima de otro
   JPEG — cada una de esas tres cosas cuesta calidad y ninguna hace
   falta.

   400 es el máximo que publica X y sobra: el chip más grande mide 21 px
   de CSS, así que ni en una pantalla de 3× —63 px— llega a pedir un
   sexto de lo que hay. Quien reduce es el navegador, que lo hace mejor
   que un reencodeo nuestro y sin dejarlo escrito en el archivo.

   Y no se recortan aunque tengan de más: la de Guillermo lleva un búho
   apoyado en el hombro, y encuadrarle la cara le come la cabeza. El
   círculo del chip ya recorta lo que sobra.

   ANTES ACÁ HUBO DOS VERSIONES, y las dos pedían encuadre a mano.
   Logotipos de marcas (simple-icons, CC0) costaron tres vueltas —caja,
   tinta y centroide, las tres medían bien y ninguna se veía bien—, y
   las iniciales sobre discos de color costaron medir dónde cae la letra
   en un tipo variable. Una cara no pide nada de eso, y a 10 px sigue
   siendo una persona cuando una letra ya no es nadie. */

type Persona = {
  id: string
  nombre: string
  /* La foto, servida desde public/. Una pieza Web es autocontenida en
     cuanto a CÓDIGO —no importa nada de otra pieza ni del área privada—
     y esto no es un import: es una URL, igual que el video de una pieza
     App. */
  foto: string
}

const PERSONAS: Persona[] = [
  { id: 'karri', nombre: 'Karri', foto: '/piezas/select-summary/karri.jpg' },
  { id: 'john', nombre: 'John', foto: '/piezas/select-summary/john.jpg' },
  { id: 'elon', nombre: 'Elon', foto: '/piezas/select-summary/elon.jpg' },
  { id: 'guillermo', nombre: 'Guillermo', foto: '/piezas/select-summary/guillermo.jpg' },
]

/* Un chip: la foto recortada en círculo, al tamaño que le toque.

   El círculo lo hace el border-radius del propio <svg> y no un
   clip-path: el SVG ya recorta lo que se sale de su caja, así que con
   la caja redonda la foto sale redonda. La misma esquina redondeada
   dibuja el aro exterior con box-shadow. */
function Chip({
  persona,
  tamano,
  aro,
}: {
  persona: Persona
  /* en rem, como todo lo que tiene que crecer con el texto */
  tamano: number
  /* El anillo del color de la SUPERFICIE que separa un chip del que
     tiene debajo cuando se superponen; la referencia lo usa con dos
     elegidas. Va afuera y no adentro, que es donde vive el contorno de
     la foto. En rem, ya dividido por la escala del chip para que mida
     un píxel de pantalla y no uno del chip. */
  aro?: number
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      style={{
        width: `${tamano}rem`,
        height: `${tamano}rem`,
        flex: 'none',
        borderRadius: '50%',
        boxShadow: aro ? `0 0 0 ${aro}rem var(--pieza-superficie)` : undefined,
      }}
      aria-hidden
    >
      <image href={persona.foto} width="40" height="40" preserveAspectRatio="xMidYMid slice" />
      {/* El contorno, 1 px hacia adentro de los 40. Lo necesita la foto
          clara sobre superficie clara —la de Karri tiene fondo blanco—:
          sin esta línea el chip no termina en ningún lado. */}
      <circle cx="20" cy="20" r="19.5" fill="none" stroke="var(--pieza-contorno)" />
    </svg>
  )
}

/* ─── EL MODELO: "TODAS" ES LA AUSENCIA DE FILTRO ───
   La referencia hace otra cosa: ahí "All Chains" es una quinta fila que
   se tilda y apaga a las otras cuatro (medido en el cuadro: con el modo
   puesto, las filas de cada cadena tienen el aro vacío). O sea un radio
   disfrazado de casilla, y un estado "todas" que hay que elegir.

   Acá no. `todas` es CERO tildes, y la fila de arriba deja de ser un
   estado para ser la acción que limpia. Los recibos, leídos de la API
   de documentación de Apple el 2026-09-09:

   · La página de los toggles cuenta cómo resuelve esto su propio
     teléfono: el filtro de Recents alterna entre todas las llamadas y
     las opciones de filtro, y el botón se dibuja con fondo detrás del
     símbolo cuando hay un filtro puesto y SIN nada detrás cuando se
     vuelve a la vista principal. "Todas" es el estado sin marca.
   · La de los menús recomienda ofrecer un ítem que quite todos los
     atributos conmutados de una vez —su ejemplo es "Plain"—, y pedir
     un verbo en el rótulo cuando no se distingue una acción de un
     estado (su ejemplo: "Turn HDR On", no "HDR On"). De ahí sale
     "Show all people" y no "All people".
   · La de los menús contextuales resume una selección múltiple con la
     cuenta de lo elegido, que es lo que hace el disparador con
     "3 people".

   Estas guías explican, no autorizan: son de las plataformas de Apple
   y esto corre en la web. Lo que aportan es que el modelo no es un
   invento nuestro, y que la referencia se apartó de él. */
type Seleccion = 'todas' | string[]

function alternar(s: Seleccion, id: string): Seleccion {
  if (s === 'todas') return [id]
  const proxima = s.includes(id) ? s.filter((otro) => otro !== id) : [...s, id]
  /* LOS DOS EXTREMOS VUELVEN A "todas", y por el mismo motivo: un filtro
     que no filtra. Sin nada elegido es evidente; con las cuatro puestas
     también, y ahí además hay una casilla que lo dice —la de "All"—, así
     que dejarla apagada mientras el filtro no filtra sería mentir sobre
     el estado. Es el parent checkbox de Carbon.

     Hubo una versión sin el colapso de arriba, con el argumento de que
     hacer desaparecer las cuatro tildes de golpe se lee como un error.
     Cayó cuando "All" pasó de ser un comando a ser un estado: un comando
     no refleja nada, una casilla sí. */
  if (proxima.length === 0 || proxima.length === PERSONAS.length) return 'todas'
  return proxima
}

const elegidas = (s: Seleccion): Persona[] =>
  s === 'todas' ? PERSONAS : PERSONAS.filter((p) => s.includes(p.id))

/* ─── EL ROTULO ES UNA CADENA, Y CAMBIA EN UN CUADRO ───
   Sin fundido y sin partir en palabras, que son las dos cosas que hace
   la referencia y las dos que se descartaron mirándolas correr.

   Ella lo anima POR TOKEN: yendo de "3 Chains" a "All Chains" la palabra
   "Chains" no se funde —su cuenta de píxeles claros no baja en ningún
   cuadro— y sólo cambia el de adelante. Reproducirlo pide que el token
   que se va quede fuera de flujo, y ahí, cuando es más ancho que el que
   entra, se monta encima de la palabra de al lado durante los 200 ms del
   cruce. Las dos salidas —recortar la palabra que se va, o correr la de
   al lado y devolverla— son peores que el defecto.

   Y el fundido entero tampoco: el cambio de estado ya lo cuentan TRES
   cosas —la casilla que se marca, el color de la fila y el racimo—, así
   que fundir sólo retrasa la lectura y deja uno o dos cuadros donde el
   rótulo no dice nada.

   Queda dicho lo que se pierde, que está medido: la referencia funde el
   rótulo en ~110 ms al salir y ~133 al entrar, en secuencia y sin
   solape. Es una diferencia deliberada, no un olvido. */
function rotulo(s: Seleccion): string {
  if (s === 'todas') return 'All people'
  if (s.length === 1) return elegidas(s)[0].nombre
  return `${s.length} people`
}


/* ─── EL RACIMO ───
   Medido: el cuadrado del racimo mide SIEMPRE 0.523 del alto del botón,
   con 1, 2, 3 o 4 personas adentro, y los círculos se anclan a sus
   esquinas.

   Se dibuja con transform y nada más: cada chip nace del tamaño del
   cuadrado entero y se lleva a su lugar con translate + scale desde su
   esquina superior izquierda — que es de donde escala en la referencia
   (medido: el borde superior izquierdo del chip que persiste no se
   mueve un píxel mientras el chip pasa de 100 a 64). */
/* El lado del racimo, en rem: 21 px sobre la raíz de 16. Es el MISMO 21
   que --ss-racimo, y tienen que seguir siéndolo: el ancho del disparador
   se suma con la variable y el racimo se dibuja con esta constante, así
   que si una se mueve sin la otra el botón queda con el aire cambiado. */
const RACIMO = 21 / 16

/* ─── CUÁNTO SE PISAN LOS CHIPS ───
   Con dos, medido: diámetro 0.643 del cuadrado y centros a 0.357 en cada
   eje. La distancia entre centros es 0.357·√2 = 0.505 y la suma de
   radios 0.643, así que se PISAN 0.138 del cuadrado, que es el 21.5 %
   de un diámetro.

   Con tres se conserva ESA PROPORCIÓN, no el diámetro. No es lo mismo:
   en una pirámide dentro del mismo cuadrado, tres círculos de 0.643 se
   comen 44 % del vecino —el doble— y el chip de abajo tapa a los dos de
   arriba. Con la pirámide los vecinos quedan a (1−k) y se pisan (2k−1),
   así que (2k−1)/k = 0.215 da k = 0.56. */
const APILADO_2 = 0.643
const APILADO_3 = 0.56

function plaza(n: number, i: number): { x: number; y: number; k: number } {
  if (n <= 1) return { x: 0, y: 0, k: 1 }
  if (n === 2) {
    const k = APILADO_2
    return i === 0 ? { x: 0, y: 0, k } : { x: 1 - k, y: 1 - k, k }
  }
  /* ─── CON TRES, PIRAMIDE Y SE PISAN ───
     Dos arriba y una centrada abajo, apiladas como el estado de dos y
     con el mismo aro de 1 px del color de la superficie.

     Acá la referencia hace otra cosa: deja las tres chicas en la
     rejilla de cuatro y dibuja la cuarta celda vacía, un círculo del
     color del hover. Se descartó mirándolo. Un hueco no es una persona, y
     puesto al lado de tres que sí lo son se lee como una cuarta foto que
     no cargó. Y con el diámetro de la rejilla —0.47— la pirámide
     quedaba suelta: tres puntos chicos separados por una canaleta, que
     es la misma lectura de "acá falta algo". Apiladas se leen como un
     grupo.

     El cuadrado no se toca: sigue midiendo 0.523 H en los cuatro
     estados, que es el invariante medido de la referencia. */
  if (n === 3) {
    const k = APILADO_3
    return i < 2 ? { x: i * (1 - k), y: 0, k } : { x: (1 - k) / 2, y: 1 - k, k }
  }
  const k = 0.47 /* medido: 47.5 sobre 101, con canaleta de 1 px */
  return { x: i % 2 === 0 ? 0 : 1 - k, y: i < 2 ? 0 : 1 - k, k }
}

/* `lado` va en REM, no en píxeles: el racimo crece con el tamaño de
   texto del sistema igual que el resto de la pieza. */
function Racimo({ personas, lado }: { personas: Persona[]; lado: number }) {
  const n = personas.length
  /* El primer pintado no anima: los chips que ya están cuando la pieza
     aparece están en reposo, no acaban de entrar. El atributo se pone
     después del primer cuadro y a partir de ahí @starting-style
     encuentra el selector. */
  const [montado, setMontado] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <span
      className="ss-racimo"
      data-montado={montado ? '' : undefined}
      style={{ width: `${lado}rem`, height: `${lado}rem` }}
    >
      {personas.map((persona, i) => {
        const celda = plaza(n, i)
        return (
          <span
            key={persona.id}
            className="ss-chip"
            style={{
              width: `${lado}rem`,
              height: `${lado}rem`,
              transform: `translate(${celda.x * lado}rem, ${celda.y * lado}rem) scale(${celda.k})`,
              zIndex: i,
            }}
          >
            {/* el aro va donde los chips se pisan: con dos y con tres */}
            <Chip persona={persona} tamano={lado} aro={n === 2 || n === 3 ? 1 / 16 / celda.k : undefined} />
          </span>
        )
      })}
    </span>
  )
}

/* ─── EN LA LISTA TAMBIÉN SE USA ───
   La pieza no reproduce nada: no hay guion, no hay bucle y no hay un
   estado que avance solo. En la lista es el mismo control que en el
   detalle y contesta al puntero, que es como se comporta la otra pieza
   Web de la library.

   Acá vivía un guion de cuatro estados que corría cada 1500 ms mientras
   el puntero estuviera sobre la card. Se leía como una grabación, que es
   justo lo que una pieza Web no es. */
export default function SelectSummary({ modo = 'detalle' }: { modo?: Montaje } = {}) {
  /* EN LA LISTA NO SE TABULA, PERO SÍ SE TOCA. Ahí el demo es un preview
     adentro de una card que promete abrir el detalle: seis paradas más
     de tabulador por card la ensucian, así que los controles salen del
     orden de tabulación y el clic de cada uno se frena para que no
     navegue. Con el puntero la pieza funciona entera, que es lo que un
     preview vivo tiene que hacer. */
  const esPreview = modo === 'lista'
  const [vista, setVista] = useState<Seleccion>('todas')
  /* EL FRENO DEL CLIC. En la lista la card entera navega al detalle, y
     el clic de un control de la pieza sube hasta ella. `preventDefault`
     alcanza: el manejador de la card sale si el evento ya fue atendido
     (clicDeTarjeta, en parts.tsx). En el detalle no hay card y el
     preventDefault no le saca nada a un <button type="button">, así que
     es el mismo código para los dos. */
  const frenar = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  /* ARRANCA ABIERTO, y es de la pieza y no del control: lo que hay que
     ver es de dónde sale el resumen, y con el panel cerrado la card
     muestra una píldora sola sin nada que la explique. En un producto
     el estado inicial sería el contrario. */
  const [abierto, setAbierto] = useState(true)
  const raiz = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()

  /* Cerrar al tocar afuera, que es lo que hace cualquier menú y lo que
     la referencia hace al final del clip. */
  useEffect(() => {
    if (!abierto) return
    const afuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('pointerdown', afuera)
    return () => document.removeEventListener('pointerdown', afuera)
  }, [abierto])

  /* ─── ESCAPE LO CONSUME EL PANEL, NO LA PÁGINA ───
     Cierra y DEVUELVE EL FOCO al disparador: sin eso el foco se queda en
     una fila que pasa a visibility hidden y el tabulador vuelve a
     arrancar desde el principio del documento.

     VA EN LA RAÍZ DE LA PIEZA Y NO EN EL DOCUMENTO, y eso es lo que
     arregla un choque medido. La página también cierra con Escape —el
     detalle vuelve a la lista, app.tsx— y su listener vive en
     `document`. Con los dos escuchando ahí, una sola tecla hacía las dos
     cosas: medido, el foco llegaba al disparador y 300 ms después
     estabas en la home con la pieza remontada. Escuchando en la raíz, el
     stopPropagation corta el evento ANTES de que salga de la pieza —el
     listener de React vive en el contenedor de la app, que está por
     debajo de document— y la página no se entera.

     Sólo consume la tecla si el panel está abierto y el foco está
     adentro. Con el panel cerrado, o con el foco en otro lado, Escape
     vuelve a ser de la página: es su tecla, y un menú que no tiene el
     foco no tiene por qué quedársela. */
  const alTecladoRaiz = (e: React.KeyboardEvent) => {
    if (e.key !== 'Escape' || !abierto) return
    e.stopPropagation()
    setAbierto(false)
    raiz.current?.querySelector<HTMLElement>('.ss-disparador')?.focus()
  }

  const personas = elegidas(vista)
  const texto = rotulo(vista)

  /* ─── "All" ES UNA CASILLA MÁS, Y VA ABAJO ───
     La posición sale de shadcn/ui: primero el contenido, después lo que
     habla del contenido, y las personas quedan pegadas al disparador de
     donde venís. La forma —una casilla que se marca sola cuando no hay
     filtro— es el parent checkbox de Carbon (IBM).

     Se probaron y se descartaron otras dos, mirándolas correr. Una era
     un COMANDO arriba, sin casilla, atenuado cuando no había nada que
     limpiar: es lo que pide la guía de menús de Apple, y medido no lo
     hace ninguno de los productos que miré —Apple y shadcn esconden ese
     control en vez de atenuarlo—. La otra era no tener la fila: el
     modelo no la necesita, porque cero tildes ya es "todas", pero se
     pierde volver ahí en un toque.

     Con "All" siendo un estado y no una acción, TODAS las filas son
     casillas y el panel tiene un solo rol. */
  const filaTodas = {
    id: 'todas',
    nombre: 'All',
    personas: PERSONAS,
    puesta: vista === 'todas',
    todas: true,
  }
  const filas = [
    ...PERSONAS.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      personas: [p],
      puesta: vista !== 'todas' && vista.includes(p.id),
      todas: false,
    })),
    filaTodas,
  ]

  /* La fila dice de qué fila se trata; el id es sólo su clave. */
  const tocar = (fila: (typeof filas)[number]) => {
    setVista((s) => (fila.todas ? 'todas' : alternar(s, fila.id)))
  }

  const filasDom = () =>
    Array.from(panel.current?.querySelectorAll<HTMLElement>('.ss-fila') ?? [])

  /* i negativo cuenta desde el final, como un slice. */
  const enfocarFila = (i: number) => {
    const nodos = filasDom()
    nodos[i < 0 ? nodos.length + i : i]?.focus()
  }

  /* Flechas dentro de la lista, que es lo que espera un listbox. */
  const alTeclado = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const nodos = filasDom()
    const i = nodos.indexOf(document.activeElement as HTMLElement)
    const j = e.key === 'ArrowDown' ? i + 1 : i - 1
    nodos[(j + nodos.length) % nodos.length]?.focus()
  }

  /* ─── DEL DISPARADOR AL PANEL, CON LAS FLECHAS ───
     El patrón de menú de WAI-ARIA pide que un botón con aria-haspopup
     abra Y deje el foco en el primer ítem cuando se baja la flecha.
     Medido antes de esto: seis ArrowDown seguidas y el foco no se movía
     del botón. Se llegaba igual con Tab, así que no era un control
     inalcanzable, pero sí un menú que no se maneja como un menú.

     El foco no se puede pedir en el mismo cuadro: las filas están en
     visibility hidden mientras el panel está cerrado, y un elemento
     invisible no toma foco. Por eso la intención se guarda y la cobra el
     efecto de abajo, ya con el panel abierto. */
  const focoAlAbrir = useRef<number | null>(null)

  const alTecladoDisparador = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const destino = e.key === 'ArrowDown' ? 0 : -1
    if (abierto) return enfocarFila(destino)
    focoAlAbrir.current = destino
    setAbierto(true)
  }

  useEffect(() => {
    if (!abierto || focoAlAbrir.current === null) return
    enfocarFila(focoAlAbrir.current)
    focoAlAbrir.current = null
  })

  return (
    <div
      className="ss"
      ref={raiz}
      data-lista={esPreview ? '' : undefined}
      onKeyDown={alTecladoRaiz}
    >
      <style href="select-summary" precedence="default">
        {CSS}
      </style>

      <button
        className="ss-disparador"
        type="button"
        tabIndex={esPreview ? -1 : undefined}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={`${id}-panel`}
        onClick={(e) => {
          frenar(e)
          setAbierto((v) => !v)
        }}
        onKeyDown={alTecladoDisparador}
      >
        <span className="ss-contenido">
          <Racimo personas={personas} lado={RACIMO} />
          <span className="ss-rotulo">
            <span className="ss-rotulo-texto">{texto}</span>
          </span>
          <svg className="ss-chevron" viewBox="0 0 8 13" aria-hidden>
            <path
              d="M1 5.2 4 2l3 3.2M1 7.8 4 11l3-3.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      <div
          className="ss-popover"
          data-abierto={abierto ? '' : undefined}
          id={`${id}-panel`}
          /* Un MENU, no un listbox: cuatro conmutadores y una acción no
             son una lista de opciones. Es el mapeo ARIA del pull-down
             button de Apple, que es el componente que admite elegir
             varias. */
          role="menu"
          aria-label="People"
          ref={panel}
          onKeyDown={alTeclado}
        >
          {filas.map((f) => (
            <button
              key={f.id}
              className="ss-fila"
              type="button"
              tabIndex={esPreview ? -1 : undefined}
              role="menuitemcheckbox"
              aria-checked={f.puesta}
              data-puesta={f.puesta ? '' : undefined}
              data-pie={f.todas ? '' : undefined}
              onClick={(e) => {
                frenar(e)
                tocar(f)
              }}
            >
              {/* Medido: las cinco filas alinean su casilla, su racimo y
                  su nombre en un solo x, 0.00 px de diferencia. */}
              <span className="ss-casilla" data-puesta={f.puesta ? '' : undefined}>
                <svg className="ss-tilde" viewBox="0 0 20 20" aria-hidden>
                  <path
                    d="m5.4 10.4 3.1 3.1 6.1-6.6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <Racimo personas={f.personas} lado={RACIMO} />
              <span className="ss-nombre">{f.nombre}</span>
            </button>
          ))}
        </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Las razones medidas están al lado de cada número. H = 40 px.
   ═══════════════════════════════════════════════════════════════ */
const CSS = `
/* La pieza es autocontenida: no hereda el box-sizing de la página. */
.ss, .ss *, .ss *::before, .ss *::after {
  box-sizing: border-box;
}

.ss {
  /* ─── TODO EN REM, MENOS LAS LINEAS ───
     Si alguien sube el tamaño de texto del navegador, la pieza tiene
     que crecer entera y no sólo las letras: por eso cada medida va en
     rem contra la raíz de 16 px. Lo único que se queda en píxeles son
     las líneas de 1 px —el anillo del botón, el anillo del popover, el
     separador y el aro que despega un chip del que tiene debajo—:
     una línea existe para verse fina, y multiplicarla la convierte en
     una barra. Los comentarios llevan el valor en píxeles a 100 % y su
     razón medida contra el alto. */
  --ss-h: 2.5rem;            /* 40 px · LA DECISIÓN. Todo cae de acá. */
  --ss-pad: 0.875rem;        /* 14 · 0.342 H = 13.7 */
  --ss-racimo: 1.3125rem;    /* 21 · 0.523 H = 20.9 · el mismo 21 que RACIMO */
  --ss-hueco: 0.5625rem;     /* 9 · 0.233 H = 9.3 */
  --ss-hueco-casilla: 0.625rem;  /* 10 · 0.241 H = 9.6 */
  --ss-tipo: 0.9375rem;      /* 15 · altura de mayúscula 0.269 H = 10.8 */
  --ss-hueco-chevron: 1rem;  /* 16 · 0.41 H, mínimo: el chevron va a la derecha */
  --ss-hueco-popover: 1rem;  /* 16 · 0.389 H = 15.6 */
  --ss-radio: 0.8125rem;     /* 13 · 0.332 H = 13.3 */
  --ss-casilla: 1.25rem;     /* 20 · 0.491 H = 19.6 */
  --ss-aro: 0.09375rem;      /* 1.5 · 0.041 H = 1.6 */
  --ss-chevron-ancho: 0.5rem;     /* 8 · 0.197 H */
  --ss-chevron-alto: 0.8125rem;   /* 13 · 0.332 H */
  --ss-aire: 2.5rem;         /* 40 · UN ALTO DE BOTÓN de aire arriba y abajo */
  /* Acá vivían un resorte muestreado a linear() y su duración de
     355 ms, los dos sólo para el relleno de la casilla. Se fueron con
     la coreografía: ver LA CASILLA, más abajo. */
  /* ─── EL ANCHO DEL DISPARADOR: LA SUMA DE SUS PARTES ───
     Es fijo —no se anima y no se mide en tiempo de ejecución— y no se
     escribe como número suelto: se SUMA, con las mismas variables que
     dibujan el botón. Lo único que se elige es la RANURA DEL RÓTULO.
     Así el ancho no puede quedar incoherente con lo que tiene adentro:
     si mañana cambia el padding, el racimo o el chevron, el ancho los
     sigue en vez de recortar el texto.

        28  padding      --ss-pad × 2
        21  racimo       --ss-racimo
         9  hueco        --ss-hueco
        76  RANURA       --ss-rotulo-ancho
        16  al chevron   --ss-hueco-chevron
         8  chevron      --ss-chevron-ancho
       ───
       158  más el anillo, que no ocupa lugar

     Y son 160 con el redondeo a 4 H, la unidad de toda la pieza: la
     ranura del rótulo se lleva los 2 px que sobran. Todo está en rem, así
     que a raíz 20 px el botón mide 200 clavados.

     LA RANURA ENTRA EL MÁS ANCHO DE LOS SIETE RÓTULOS POSIBLES. Medidos
     en la página, InterVariable a 15 px: "All people" 69.59 ·
     "Guillermo" 67.25 · "2 people" y "3 people" 61.61 · "John" 35.06 ·
     "Karri" 33.61 · "Elon" 30.28. Con 76 el más ancho tiene 6.4 px de
     aire, y el nombre más largo 8.75. El rótulo no lleva ese ancho
     escrito: es flex y se queda con lo que sobra, que por la cuenta de
     arriba es exactamente la ranura.

     NI MÁS FINO NI MÁS GORDO, y está mirado a cuatro anchos, no
     razonado: a 148 el botón corta la "e" de "All people" —el piso
     exacto es 153.59—; a 176 el rótulo flota y se lee como un botón a
     medio llenar. 160 es el valor redondo adentro de esa banda.

     Y COMO EL ANCHO NO SIGUE AL RÓTULO, con un nombre corto sobra aire
     hasta el chevron —46 px con "Elon" contra 22 con "All people"—. Es
     el precio del ancho fijo y es lo que hace cualquier select: el
     texto queda anclado a la izquierda y el chevron a la derecha, y lo
     que no se mueve nunca es el control.

     Que sea fijo cuesta la transición medida de la referencia, y el
     porqué está entero abajo, en .ss-disparador. */
  --ss-rotulo-ancho: 4.875rem;   /* 78 · el rótulo más ancho + 8.4 */
  --ss-disparador-ancho: calc(
    var(--ss-pad) * 2 + var(--ss-racimo) + var(--ss-hueco) +
    var(--ss-rotulo-ancho) + var(--ss-hueco-chevron) + var(--ss-chevron-ancho)
  );                             /* 160 · 4 H */
  --ss-fila: 2.5rem;         /* 40 · 1.013 H */

  /* ─── LAS SUPERFICIES: LAS PONE EL SISTEMA ───
     Antes esto trasladaba el ESCALÓN de la referencia. La referencia es
     oscura y sus tres niveles son #0f0f0f la página, #191919 el control
     y #232323 la fila con el puntero: +5.2, +6.3 y +4.5 de ΔL*. Copiar
     los hex no servía —quince unidades de gris cerca del blanco no se
     ven como quince cerca del negro—, así que cada nivel se calculaba
     para reproducir esos mismos ΔL* contra la card de cada tema. Doce
     porcentajes escritos a mano en cuatro ramas.

     Eso se cambió por la escalera que el sistema ya tiene. Medido, con
     la card en --surface como cero:

       token            claro  oscuro  claro+C  oscuro+C
       --canvas          +1.8    -1.5     +3.5      -3.5
       --surface          0.0     0.0      0.0       0.0
       --surface-hover   -1.4    +1.5     -2.9      +3.8
       --hairline        -4.5    +5.3     -8.8     +11.6
       lo de antes       -5.2    +4.3     -5.3      +4.8   (el control)

     Cualquiera de esos dos escalones cambia de signo solo con el tema y
     se agranda solo en contraste alto, que es exactamente lo que hacían
     a mano los doce porcentajes. --hairline hace lo mismo con las
     líneas, y ya trae su propio 5.1 % → 10.2 %. Cuál de los dos va lo
     decide el párrafo de abajo.

     Lo que se pierde, dicho: el control ya NO reproduce el escalón de la
     referencia. Es un control mucho más claro y mucho más plano que el
     del video, y es a propósito: la referencia es oscura y esta library
     es clara, y acá manda la library.

     --selection-bg quedó descartado y vale la pena anotar por qué: en
     oscuro mide #fafaf9, L* 98.2. Es el fondo de selección de TEXTO, y
     es casi blanco en las dos ramas. Leído en la hoja parecía una
     superficie más; medido, no lo es.

     ─── Y ES --canvas, NO --surface-hover ───
     Acá decía --surface-hover, y colisionaba. La card de la library se
     pinta --surface y pasa a --surface-hover con el puntero encima, que
     es EXACTAMENTE cuando la pieza corre en la home: el bucle sólo
     avanza con el puntero sobre la card. Medido en la home, con el
     puntero puesto:

       card     rgb(244,244,241)      claro    rgb(18,18,17)   oscuro
       control  rgb(244,244,241)               rgb(18,18,17)
       panel    rgb(244,244,241)               rgb(18,18,17)

     El mismo color los tres. El control y el panel desaparecían dentro
     de la card justo mientras la pieza se mostraba, y lo único que
     quedaba era su línea de 1 px.

     --canvas es el otro escalón que el sistema ya tiene, y queda a
     distancia de la card EN SUS DOS ESTADOS: 5 unidades en reposo y 9
     con el puntero, en las dos ramas. Y cae del lado correcto sin que
     haya que escribir nada — en claro el control queda MÁS CLARO que la
     card y en oscuro MÁS OSCURO, que es como se comportan los controles
     en los dos temas. Lo hace solo porque el sistema ya invierte la
     dirección de sus distancias en oscuro. */
  --pieza-superficie: var(--canvas);
  /* Los dos escalones de arriba del control salen de acá y no de un
     token del sistema: el hairline encima de la superficie de la pieza,
     resuelto como color opaco y no como capa —la fila cruza esta
     propiedad con una transición, y background-image no interpola—. El
     5.1 % es el alfa del propio --hairline. */
  --pieza-superficie-hover: color-mix(in srgb, var(--ink) 5.1%, var(--pieza-superficie));
  /* El press es el hairline DOBLADO, que es el mismo salto que el
     sistema hace entre su rama normal y la de contraste alto. Así los
     tres escalones son parejos —panel, hover, press— en vez de que el
     último sea tres veces el anterior. */
  --pieza-superficie-press: color-mix(in srgb, var(--ink) 10.2%, var(--pieza-superficie));
  --pieza-borde: var(--hairline);
  --pieza-separador: var(--hairline);
  /* ─── LA CASILLA PUESTA VA EN TINTA, NO EN UN COLOR ───
     Acá vivía el violeta de la referencia, medido: #867df9 en oscuro y
     #5b4fe0 en claro para que el blanco encima llegara a contraste.

     Se fue porque esta library NO TIENE COLOR DE ACENTO. Su sistema
     entero es un texto, tres superficies y una línea; los únicos dos
     colores que existen son el rojo de lo destructivo y el azul del
     anillo de foco, y los dos tienen su motivo escrito. Un violeta que
     viene de la grabación de otro producto era el único color de la
     página, y se veía como tal.

     Tinta sobre canvas es lo que ya hace el sistema cuando algo se
     promueve: es su regla de selección de texto en oscuro, inversión
     total. Y se da vuelta solo con el tema, así que la rama oscura se
     quedó sin una sola línea escrita. */
  --pieza-acento: var(--ink);
  --pieza-acento-glifo: var(--canvas);
  /* ─── EL CONTORNO DE LA FOTO: NEGRO O BLANCO PUROS, AL 10 % ───
     Una línea de 1 px hacia adentro del chip. Quien la necesita es la
     foto CLARA sobre superficie clara —la de Karri tiene el fondo
     blanco—: sin ella el chip no termina en ningún lado.

     Y no es el --hairline del sistema, que es lo que había. El contorno
     de una imagen es el único color de la pieza que NO se elige: negro
     puro al 10 % en claro, blanco puro al 10 % en oscuro, nunca un
     neutro teñido, porque un neutro con tinte recoge la superficie de
     atrás y se lee como mugre en el borde de la foto. Mirado a los dos
     valores sobre la foto de Karri: con el 5.1 % del hairline el disco
     se funde con el panel, con el 10 % termina.

     light-dark() en vez de una consulta de tema: la raíz ya declara
     color-scheme light dark, así que la pieza sigue sin un solo bloque
     de color por tema. */
  --pieza-contorno: light-dark(rgb(0 0 0 / 0.1), rgb(255 255 255 / 0.1));

  position: relative;
  display: flex;
  flex-direction: column;
  /* SE ALINEAN POR LA IZQUIERDA. El popover se pega al borde izquierdo
     del disparador —medido, la sangría es 0 en los cinco estados—.
     Cuando el disparador todavía cambiaba de ancho esto además evitaba
     29 px de vaivén lateral por vuelta; con el ancho fijo los dos miden
     lo mismo y ninguno se mueve. Lo que se centra en la card es el par.
     Verificado: pieza, disparador y panel, un solo valor en los siete
     estados. */
  align-items: flex-start;
  /* El aire alrededor. La card de la library no trae padding para una
     pieza Web: lo pone la pieza, que es la que sabe cuánto necesita. Es
     un alto de botón a cada lado, o sea el mismo H del que cae toda la
     geometría, y con eso la card de la lista pasa de su piso de 260 a
     338. */
  padding: var(--ss-aire) 0;
  box-sizing: content-box;
  font-size: var(--ss-tipo);
  line-height: 1;
  letter-spacing: -0.006em;
}

/* ─── CONTRASTE ALTO ───
   Las superficies siguen solas a la rama: --canvas y --hairline ya
   cambian, y los dos escalones derivan de --ink. Lo único que queda
   escrito es el alfa del velo, y acompaña al hairline del sistema en su
   propio salto de 5.1 % a 10.2 %. */
@media (prefers-contrast: more) {
  .ss {
    --pieza-superficie-hover: color-mix(in srgb, var(--ink) 10.2%, var(--pieza-superficie));
    --pieza-superficie-press: color-mix(in srgb, var(--ink) 20.4%, var(--pieza-superficie));
  }
}

/* ─── OSCURO ───
   NO HAY BLOQUE, y eso es el resultado. Acá vivían el violeta del acento
   y el contorno acromático dado vuelta a mano. Con el acento en tinta
   sobre canvas y el contorno en el hairline del sistema, los cuatro
   colores de la pieza se invierten solos con el tema y no queda una
   sola línea que mantener sincronizada. */

/* ─── EL DISPARADOR ─────────────────────────────────────────── */
.ss-disparador {
  display: flex;
  align-items: center;
  height: var(--ss-h);
  padding: 0 var(--ss-pad);
  border: 0;
  /* ─── EL BORDE ES UN ANILLO, NO UN BORDE ───
     Un box-shadow inset de 1 px dibuja la misma línea en el mismo
     lugar, y no ocupa una sola unidad de layout. Dos cosas se
     arreglan con eso:

     · La cuenta del ancho deja de tener un término en píxeles. Con
       border, los 2 px del borde eran lo único de la suma que no
       escalaba con el rem, y el botón medía 199.5 en vez de 200 con la
       raíz en 20. Ahora la suma es proporcional entera.
     · El anillo es translúcido y compone sobre lo que tenga debajo, que
       es la razón por la que un color de borde sólido no sirve: está
       afinado contra un fondo y sólo contra ése. El --hairline del
       sistema ya era translúcido; lo que cambia es que ahora tampoco
       empuja el contenido.

     Va INSET y no afuera: afuera la píldora se vería 2 px más ancha que
     su caja, y acá el ancho es la decisión de la que cae todo. */
  box-shadow: inset 0 0 0 1px var(--pieza-borde);
  /* Píldora: verificado contra el círculo en 48 filas del cuadro, con
     error menor a 1 px. No es un radio grande, es la mitad del alto. */
  border-radius: 999px;
  background: var(--pieza-superficie);
  color: var(--ink);
  font: inherit;
  letter-spacing: inherit;
  cursor: pointer;
  /* Sin esto el navegador reserva el doble toque para hacer zoom y
     retrasa el primero para ver si viene el segundo. En un control que
     se abre y se cierra, ese retraso es lo único que se siente. */
  touch-action: manipulation;
  width: var(--ss-disparador-ancho);
  /* ─── EL ANCHO NO SE ANIMA, Y ES UNA DECISIÓN CONTRA LA REFERENCIA ───
     Acá vivía la transición firma de la pieza: 370 ms con
     cubic-bezier(.19,1,.22,1), el mejor ajuste de 14 curvas × 39
     duraciones sobre 18 muestras de dos transiciones de la referencia,
     RMSE 0.034.

     Se cayó al elegir que el rótulo cambie en un cuadro. Las dos cosas
     no conviven: con el texto cambiando de golpe y la píldora creciendo
     370 ms, el rótulo nuevo queda RECORTADO mientras el botón lo
     alcanza. Medido, de "Ana" a "All people": 42 px cortados al arranque
     y unos 200 ms hasta que entra. Fotografiado se lee "All p" →
     "All pec" → "All peop": no parece una revelación, parece un rótulo
     truncado, porque el chevron queda pegado al corte.

     El fundido de la referencia existe justamente para eso — sale en
     ~110 ms, hay un cuadro sin nada, entra en ~133 — y la píldora se
     redimensiona mientras no hay texto que cortar. Sin fundido, lo único
     que evita el recorte es que el ancho llegue en el mismo cuadro.

     Y con el ancho quieto no queda nada que animar acá: el disparador
     no tiene transición. El acuse del apretar es el de abajo, que
     tampoco se mueve. */
}
/* ─── EL ACUSE VA EN EL APRETAR, Y NO MUEVE EL BOTÓN ───
   La pseudoclase :active de CSS dispara al bajar el puntero, no al
   levantarlo, así que el acuse llega en el mismo cuadro que el toque.
   Esperar al clic deja el control muerto durante el gesto, y es lo
   primero que se nota.

   LO QUE ACUSA ES EL RELLENO, NO LA ESCALA. Acá había un scale de 0.985
   afinado en píxeles —la píldora es ancha, así que un mismo scale corre
   los lados 4.6 veces más que el techo: 0.97 metía los lados 2.74 px,
   0.985 los metía 1.37 y el techo 0.30—. Medido en pantalla, apretando
   sin soltar, el borde izquierdo del botón se corría 1.20 px y el de
   arriba 0.30.

   Se fue porque el control NO SE MUEVE DE LUGAR, y eso vale para todo:
   ni el ancho, ni la posición, ni al apretarlo. El relleno dice lo
   mismo sin correr nada, es lo que ya hacen las cinco filas del panel
   —con el argumento escrito ahí abajo— y es lo que la pieza ya hacía
   con movimiento reducido. Ahora las dos ramas hacen lo mismo.

   Y no queda contra las referencias: DESIGN.md › El press cuenta que se
   barrieron 23 páginas de benji y josh buscando :active, que hay uno
   solo vivo y que las utilidades active:scale del bundle de josh las
   usa CERO elementos. El scale de press es una regla de guía, no algo
   que se vea en las páginas que miramos.

   Sin transición, como las filas: medido en la referencia, este tipo de
   relleno aparece y desaparece en un cuadro (≤17 ms). Y la asimetría
   que había —90 ms bajando, 160 subiendo— se va con la escala: no hay
   nada que volver. */
.ss-disparador:active {
  background: var(--pieza-superficie-press);
}
.ss-disparador:focus-visible {
  outline: var(--focus-outline);
  outline-offset: var(--focus-outline-offset);
}

.ss-contenido {
  display: flex;
  align-items: center;
  gap: var(--ss-hueco);
  width: 100%;
}

.ss-rotulo {
  display: flex;
  align-items: center;
  /* ─── LA CAJA DEL ROTULO ES LA RANURA, Y RECORTA ───
     flex: 1 la hace ocupar todo lo que sobra entre el racimo y el
     chevron: con el ancho del botón fijo, eso ES la ranura de 76 px de
     la cuenta de arriba —medido, 76.00 en los siete estados— y el
     chevron queda clavado contra el padding derecho.

     El recorte es la última defensa: si algún día un rótulo no entra en
     la ranura, la caja lo corta en vez de empujar al chevron afuera del
     botón. Hoy no corta a ninguno de los siete, y eso también está
     medido.

     Va clip y no hidden porque hidden fuerza el otro eje a auto, y hay
     variantes que mueven el rótulo en vertical. Y el hueco hasta el
     chevron va en MARGIN y no en padding: el recorte ocurre en la caja
     de relleno, así que con padding la palabra podría llegar a tocar el
     ícono. */
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: clip;
  overflow-y: visible;
  margin-right: calc(var(--ss-hueco-chevron) - var(--ss-hueco));
  white-space: nowrap;
}

/* Las dos medidas salen de las variables y no de un px escrito acá: el
   ancho del botón las suma, y un chevron que no crece con el resto
   dejaría esa cuenta corta apenas alguien suba el tamaño de texto. */
.ss-chevron {
  width: var(--ss-chevron-ancho);   /* 8 · 0.197 H */
  height: var(--ss-chevron-alto);   /* 13 · 0.332 H */
  flex: none;
  color: var(--text-secondary);
}

/* ─── EL ROTULO ─────────────────────────────────────────────── */
.ss-rotulo-texto {
  white-space: nowrap;
  /* El rótulo lleva un número que cambia —"2 people", "3 people"— y el
     texto está anclado a la izquierda, así que lo que se movería es la
     palabra que sigue al dígito. Medido en InterVariable: con cifras
     proporcionales los dos rótulos miden 61.11 y 61.27, o sea 0.16 px
     de corrimiento; con tabulares miden 61.61 los dos. Es una
     diferencia que no se ve —antes, con nombres de empresa, era 0.60—
     y se queda igual porque no cuesta nada y porque acá hay un número
     que cambia. */
  font-variant-numeric: tabular-nums;
}
/* ─── EL RACIMO ─────────────────────────────────────────────── */
.ss-racimo {
  position: relative;
  flex: none;
  /* Los chips se apilan con z-index 0..3 para decidir cuál tapa a cuál.
     Sin esto no hay contexto de apilamiento propio —position: relative
     con z-index auto no lo crea— y esos números compiten con el resto
     de la página en vez de quedarse acá adentro. */
  isolation: isolate;
}
.ss-chip {
  position: absolute;
  top: 0;
  left: 0;
  /* Escala desde su esquina superior izquierda: es de donde escala en
     la referencia (el borde del chip que persiste no se mueve). */
  transform-origin: 0 0;
  transition: transform 370ms var(--ease-dialogo);
}

/* ─────────────────────────────────────────────────────────────
   EL CHIP QUE ENTRA
     0 ms   nace en scale 0, centrado en la celda que le toca
    90 ms   llega a su tamaño, ease-out
   Mientras tanto, y en paralelo, los que ya estaban viajan a su
   nueva celda con la transición de arriba, que es más larga.
   ─────────────────────────────────────────────────────────────

   DOS CAJAS PORQUE SON DOS ORÍGENES. El chip que se reacomoda escala
   desde su esquina superior izquierda —medido: ese borde no se mueve
   mientras el chip pasa de 100 a 64 px—. El que entra escala desde su
   CENTRO: medido, su centro se queda en (0.245, 0.767) del racimo
   mientras el diámetro va de 0.059 a 0.475. Un solo elemento no puede
   tener dos orígenes, así que el de afuera pone el lugar y el tamaño
   de la celda, y el de adentro pone la entrada.

   EL PAR ESTÁ MEDIDO. Tres tomas de la referencia con umbral de
   detección bajado a 0.02 —hace falta para ver el chip cuando todavía
   mide 6 px— barridas contra ocho curvas × 73 duraciones, con la fase
   ajustada por toma porque la cámara no cae en el cuadro del arranque:

     ease-out    cubic-bezier(0,0,.58,1)     90 ms   RMSE 0.056
     out-quad    cubic-bezier(.25,.46,.45,.94)  105   0.060
     out-cubic   cubic-bezier(.33,1,.68,1)     135   0.064
     --ease-surface                            205   0.068
     --ease-dialogo                            255   0.073

   Las dos curvas del sistema son las que PEOR ajustan: necesitan 205 y
   255 ms y aun así puntúan último. Son curvas de arranque brutal para
   superficies que aparecen, y esto es más suave y mucho más corto. Por
   eso el valor va escrito acá con su recibo y no sale de un token, que
   es lo mismo que ya hacen los 370 del ancho y los 67 del popover.

   ARRANCA EN 0, Y ESO CONTRADICE UNA REGLA. "Nunca entrar desde
   scale(0)" existe porque nada aparece de la nada. Acá no se aplica por
   aritmética: el chip mide 11.8 px, así que arrancar en 0.95 son 0.6 px
   de recorrido y la animación no existiría. O crece desde chico o no
   anima. Medido, la referencia arranca en 0.059 del racimo sobre un
   final de 0.475 —el 12 %— y la curva ajustada extrapola a 0.

   SIMÉTRICA, y no más rápida al salir. Es la misma discusión que la
   caja que se abría, resuelta igual: DESIGN.md dice que su motion es
   simétrico y reserva la asimetría para el press.

   NO HAY SALIDA, Y NO ES UN OLVIDO. La referencia nunca saca un chip
   solo: va de cuatro a uno de golpe y después suma de a uno. La salida
   no se puede medir ahí, y animarla pide mantener vivo un chip que
   React ya desmontó. Queda pendiente y dicho. */
.ss-chip > span {
  scale: 1;
  transition: scale 90ms ease-out;
}
@starting-style {
  .ss-racimo[data-montado] .ss-chip > span {
    scale: 0;
  }
}

/* ─── EL POPOVER ────────────────────────────────────────────── */
/* ─── DONDE CAE EL POPOVER ───
   Pegado al borde IZQUIERDO del disparador, no centrado bajo él:
   medido en cinco estados distintos, la sangría es 0 en los cinco. Con
   el ancho fijo los dos bordes izquierdos coinciden solos y no hay nada
   que corregir; la pieza los alinea por la izquierda y el popover no se
   desplaza nunca. */
.ss-popover {
  /* EN FLUJO, NO FLOTANDO. Así el alto de la pieza sale solo —antes era
     un calc a mano que había que mantener— y el ancho de la pieza es el
     del popover, que es lo que se centra en la card. Sigue presente
     cuando está cerrado: si se desmontara, la card cambiaría de alto al
     abrir y cerrar. */
  margin-top: var(--ss-hueco-popover);
  /* NUNCA MAS ANGOSTO QUE EL CONTROL QUE LO ABRE, y es esta línea la que
     lo sostiene: medido, el panel pide 157.25 por su cuenta —su fila más
     ancha es casilla, racimo y "Guillermo"— contra los 160 del
     disparador. Sin el mínimo saldría 2.75 px más angosto que su botón,
     que se lee como un recorte y no como su continuación. Con nombres
     más cortos la diferencia era de 39 px. */
  min-width: var(--ss-disparador-ancho);
  /* El mismo anillo del disparador, por lo mismo: ver .ss-disparador. */
  border: 0;
  box-shadow: inset 0 0 0 1px var(--pieza-borde);
  border-radius: var(--ss-radio);
  background: var(--pieza-superficie);
  overflow: hidden;
  transform-origin: 0 0;
  /* Medido: 67ms —cuatro cuadros a 60 fps— y casi lineal, en los dos
     sentidos. La escala arranca en 0.98 desde la esquina superior
     izquierda; el popover no se desplaza. La visibilidad lo saca del
     árbol de accesibilidad y del tabulador cuando está cerrado, y su
     transición sin duración se difiere para que el fundido se vea. */
  opacity: 0;
  scale: 0.98;
  visibility: hidden;
  transition:
    opacity 67ms linear,
    scale 67ms linear,
    visibility 0s linear 67ms;
}
.ss-popover[data-abierto] {
  opacity: 1;
  scale: 1;
  visibility: visible;
  transition:
    opacity 67ms linear,
    scale 67ms linear,
    visibility 0s;
}

.ss-fila {
  display: flex;
  align-items: center;
  gap: var(--ss-hueco);
  width: 100%;
  height: var(--ss-fila);
  padding: 0 var(--ss-pad);
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  letter-spacing: inherit;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  /* el mismo motivo que en el disparador: sin esto, el doble toque
     queda reservado para el zoom y el primero llega tarde */
  touch-action: manipulation;
  /* EL NOMBRE SE ENCIENDE, Y NO EN UN CUADRO. Medido en la referencia:
     el color del rótulo de la fila cruza en ~67 ms con ease-out. Va con
     el par de TEXTO del sistema, que es el que DESIGN.md asigna a lo que
     cruza un color; son 100 ms contra los 67 medidos, y gana el sistema
     como en el resto de la pieza.

     Sólo se nombra color: el relleno del hover NO lleva transición, y
     eso también está medido —aparece y desaparece en un cuadro—. */
  transition: color var(--dur-text) var(--ease-text);
}
/* ─── LA FILA DE "All", ABAJO ───
   Separador arriba y nada más. La guía de los menús pide separador
   entre grupos, y "All" es su propio grupo: habla de las otras cuatro,
   no es una quinta empresa.

   Y va a la misma altura que las demás. En la referencia esa fila mide
   1.202 H contra 1.013 —48 contra 40— pero ahí es un ENCABEZADO de
   sección, arriba del todo. Abajo y siendo una casilla igual a las
   otras, la altura de más no la explicaba nada y la dejaba como la
   única fila distinta de cinco. */
.ss-fila[data-pie] {
  box-shadow: 0 -1px 0 var(--pieza-separador);
}
/* EL HOVER SÓLO DONDE HAY PUNTERO. Sin la consulta, tocar una fila en
   una pantalla táctil dispara :hover y el relleno QUEDA PEGADO hasta
   que se toca otra cosa: el dedo no se va a ningún lado, así que nada
   apaga el estado. El :active de abajo no necesita la guardia —dura lo
   que dura el toque— y el foco tampoco. */
@media (hover: hover) and (pointer: fine) {
  .ss-fila:hover {
    /* Sin transición, y es una medición: el relleno aparece y
       desaparece en un cuadro (≤17 ms). */
    background: var(--pieza-superficie-hover);
  }
}
/* Y el apretar pinta un escalón más, en el mismo cuadro del toque. Una
   fila no escala —es un rectángulo al ancho del panel y encogerlo se
   lee como un error—: lo que acusa es el relleno. */
.ss-fila:active {
  background: var(--pieza-superficie-press);
}
.ss-fila:focus-visible {
  outline: var(--focus-outline);
  outline-offset: calc(var(--focus-outline-offset) * -1);
}
.ss-fila[data-puesta] {
  color: var(--ink);
}


/* ─── LA CASILLA: UN CUADRADO CON UNA TILDE ───
   Antes era un aro con un punto adentro, o sea un RADIO. La guía de
   Apple, leída de su API de documentación el 2026-09-08, es explícita
   en las dos direcciones:

     "A radio button is a small, circular button… radio buttons present
      a set of mutually exclusive choices."
     "If you need to let people choose multiple options in a set, use
      checkboxes instead."
     "A checkbox is a small, square button that's empty when the button
      is off, contains a checkmark when the button is on."

   Este control elige VARIAS, así que va cuadrado y con tilde. El radio
   prometía lo contrario de lo que hace.

   El radio del cuadrado es 0.3 de su lado: no es un número suelto, es
   lo que mantiene la curva del contorno interior concéntrica con la
   del chip redondo que tiene al lado.

   ─── COMO SE ANIMA: UN SOLO TIEMPO PARA UN SOLO BOOLEANO ───
   Borde, relleno y tilde cruzan juntos, todos con --dur-surface y
   --ease-surface. Nada tiene retraso y nada tiene su propia duración.

   ANTES ERA UNA COREOGRAFÍA DE TRES ACTOS, y medida en pantalla duraba
   374 ms:

     6 ms    relleno en scale 0.4, tilde sin empezar
    74 ms    la tilde SIGUE sin empezar (llevaba 70 de retraso)
    91 ms    recién ahí arranca a dibujarse con stroke-dashoffset
   257 ms    la tilde termina
   374 ms    el relleno recién llega a 1

   Tres problemas, y el primero es el que se ve. La confirmación llegaba
   TARDE: durante los primeros cinco cuadros después del clic la tilde
   no existía, en un control cuyo único trabajo es decir "sí, ésta".
   Segundo, cuatro duraciones distintas para un solo cambio de estado
   —140, 374, 107 y 70+200— cuando la regla del sistema es que lo que se
   mueve como una unidad comparte tiempo. Tercero, 374 ms es más del
   doble del presupuesto de un acuse.

   Y sobre todo: MEDIDO, LA REFERENCIA NO ANIMA ESTO. La casilla cambia
   en un cuadro, ≤17 ms, sin transición. Toda la coreografía era
   invención nuestra sobre la interacción que más se repite en la pieza.

   Lo que queda es el punto medio entre esa medición y no tener nada:
   un cruce corto y de una sola pieza. El relleno arranca en 0.8 y no en
   0.4 —12 px de recorrido pasan a 4— y la tilde se funde en vez de
   dibujarse. Se pierde el trazo, que era lo lindo; se gana que el
   control conteste en el cuadro en que lo tocás.

   Simétrico al desmarcar, como todo lo demás de la pieza. */
.ss-casilla {
  position: relative;
  display: grid;
  place-items: center;
  width: var(--ss-casilla);
  height: var(--ss-casilla);
  margin-right: calc(var(--ss-hueco-casilla) - var(--ss-hueco));
  border: var(--ss-aro) solid var(--pieza-borde);
  border-radius: calc(var(--ss-casilla) * 0.3);
  flex: none;
  color: var(--pieza-acento-glifo);
  transition: border-color var(--dur-surface) var(--ease-surface);
}
/* el relleno, en su propia capa para poder escalarlo sin mover el borde */
.ss-casilla::before {
  content: '';
  position: absolute;
  inset: calc(var(--ss-aro) * -1);
  border-radius: inherit;
  background: var(--pieza-acento);
  scale: 0.8;
  opacity: 0;
  transition:
    scale var(--dur-surface) var(--ease-surface),
    opacity var(--dur-surface) var(--ease-surface);
}
.ss-tilde {
  position: relative;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity var(--dur-surface) var(--ease-surface);
}
.ss-casilla[data-puesta] {
  border-color: var(--pieza-acento);
}
.ss-casilla[data-puesta]::before {
  scale: 1;
  opacity: 1;
}
.ss-casilla[data-puesta] .ss-tilde {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  /* Movimiento reducido: se va lo único que se mueve, el crecimiento
     del relleno. El fundido se queda: explica el cambio sin desplazar
     nada en la pantalla. */
  .ss-casilla::before,
  .ss-casilla[data-puesta]::before {
    scale: 1;
  }
}

.ss-nombre {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── MOVIMIENTO REDUCIDO ───────────────────────────────────────
   Queda mucho menos que antes, porque la pieza ya casi no se mueve: el
   ancho es fijo, el rótulo cambia en un cuadro y el acuse del apretar
   es un relleno. Lo que se va acá es lo único que viaja —los chips del
   racimo, que se reacomodan y crecen— y la escala con la que aparece el
   panel. El fundido se queda: la opacidad no corre nada en la pantalla.

   El acuse del apretar NO se toca: ya no tiene movimiento que sacarle y
   es comprensión, no decoración. */
@media (prefers-reduced-motion: reduce) {
  .ss-chip,
  .ss-chip > span {
    transition: none;
  }
  .ss-popover {
    scale: 1;
  }
}
`
