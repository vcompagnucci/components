import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as EventoPuntero,
} from 'react'
import { createPortal } from 'react-dom'
import css from './playground.module.css'
import dlg from './vault.module.css'
import { Volver, clicDeLink } from '../parts'
import { nombreDeRuta, publicarClip, useClips, type Clip } from './clips'
import { Dialogo, DialogoPublicar, Menu, useUltimo, type Donde } from './acciones'
import acc from './acciones.module.css'
import { SIN_NOMBRE, nuevoId, useVistas, type Frame, type Vista } from './vistas'
import {
  BOCETOS,
  Boceto,
  crearBoceto,
  nombreDeBoceto,
  publicarBoceto,
  refLibre,
} from './bocetos'

/* ═══════════════════════════════════════════════════════════════
   EL PLAYGROUND — donde se construye.

   SON VARIAS VISTAS, como entrar a distintos diseños en Figma. Ésta de
   acá es la lista de todas; cada una es un lienzo.

   Vive en la URL igual que el clip abierto del vault, y por la misma
   razón: sin eso, el gesto de atrás del trackpad te saca del playground
   entero en vez de cerrar la vista. /playground/<id>.
   ═══════════════════════════════════════════════════════════════ */

export function Playground({
  abierta,
  ir,
  acciones,
}: {
  abierta: string
  ir: (ruta: string) => void
  acciones: HTMLElement | null
}) {
  const { estado, crear, borrar, cambiar, deshacer, rehacer } = useVistas()
  /* El índice del vault se pide ACÁ ARRIBA, antes de cualquier return
     condicional, y lo usan las dos vistas: la lista para dibujar los
     previews y el lienzo para resolver cada frame. Es también la única
     forma de que ningún hook quede detrás de un `if` — eso ya rompió
     esta página una vez. */
  const clips = useClips()
  /* El menú del clic derecho y sus dos diálogos, ACÁ ARRIBA y antes del
     primer return condicional. Ponerlos abajo ya rompió la página
     hermana una vez —cinco hooks al cargar y seis después es "Rendered
     more hooks than during the previous render"— y la grilla dejaba de
     dibujar. */
  const [menu, setMenu] = useState<{ vista: Vista; donde: Donde } | null>(null)
  const [renombrando, setRenombrando] = useState<Vista | null>(null)
  const [borrando, setBorrando] = useState<Vista | null>(null)

  /* UNA sola capa para el menú y sus dos diálogos. El sujeto sale del
     estado —la vista sobre la que se abrió el menú, o la que está en un
     diálogo— igual que en el vault.

     Y con useUltimo por lo mismo que allá: este valor cae a null en el
     mismo cuadro en que la salida tendría que arrancar, así que sin él
     la capa se desmonta y no hay nada que animar. Sube acá arriba por
     la misma razón que los tres useState de arriba —es un hook, y abajo
     hay tres returns condicionales—. */
  const sujeto = useUltimo(menu?.vista ?? renombrando ?? borrando)

  /* ─── ⌘Z Y ⇧⌘Z, EN TODO EL PLAYGROUND ───
     Acá arriba y no adentro del lienzo: deshacer vale igual en la grilla
     —donde se crean, se renombran y se borran vistas— que adentro de
     una. Es el mismo documento.

     EN CAPTURA, y eso es lo único fino de este efecto. El área privada
     ya tenía un ⌘Z que hacía `history.back()` (ver privado.tsx, que lo
     dejó anotado para el día en que el playground tuviera acciones de
     verdad: es hoy). Los dos escuchan en `document`, así que quién gana
     dependería del orden en que montaron — y el orden de los efectos de
     React no es algo sobre lo que se pueda construir. En captura este
     corre SIEMPRE primero, marca el evento con preventDefault, y el de
     allá se aparta al verlo marcado.

     Y SE QUEDA CON LA TECLA aunque no haya nada que deshacer: adentro
     del playground ⌘Z significa "deshacer lo que hice", y que con la
     pila vacía te saque de la página sería la peor sorpresa posible. */
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return
      /* EN UN CAMPO DE TEXTO MANDA EL NAVEGADOR. Ahí ⌘Z es deshacer lo
         que estás escribiendo, letra por letra, y lo hace mejor que
         nosotros — además de que pisarlo dejaría el nombre de una vista
         sin ninguna forma de corregir un tipeo. Nuestro deshacer del
         renombre actúa cuando el foco está afuera. */
      const t = e.target as HTMLElement | null
      if (t?.closest?.('input, textarea') || t?.isContentEditable) return
      e.preventDefault()
      if (e.shiftKey) rehacer()
      else deshacer()
    }
    document.addEventListener('keydown', tecla, true)
    return () => document.removeEventListener('keydown', tecla, true)
  }, [deshacer, rehacer])

  if (estado.cargando) return null

  if (!estado.conectado) {
    return (
      <div className={css.playground}>
        <p className={css.aviso}>
          Vault not connected: {estado.motivo}. Views are stored next to your clips.
        </p>
      </div>
    )
  }

  const vista = abierta ? estado.vistas.find((v) => v.id === abierta) : null

  if (vista)
    return (
      <Lienzo
        /* LA KEY ES LA VISTA. Cambiar de lienzo tiene que tirar la
           selección, el diálogo y cualquier gesto a medio hacer: son
           estado de ESE lienzo y no del playground. Con la key, React
           lo desmonta y lo vuelve a montar, así que no hay ni un
           `useEffect` de limpieza que mantener. */
        key={vista.id}
        vista={vista}
        cambiar={cambiar}
        borrar={borrar}
        ir={ir}
        clips={clips.estado.cargando || !clips.estado.conectado ? null : clips.estado.clips}
      />
    )

  const nueva = () => {
    const v = crear(SIN_NOMBRE)
    ir('/playground/' + v.id)
  }

  /* ─── EL + Y NO LA PALABRA ───
     Era un botón de texto que decía "New view". Ahora es EL MISMO + que
     el vault usa para subir clips: el círculo de 32 con el glifo de 16 y
     trazo 1.5, sus dos rellenos y su hover, todo copiado de .mas (ver
     vault.module.css, y acá abajo en el CSS con la cita).

     Es UNA acción, así que es UN control: tener la palabra y el círculo
     para lo mismo sería decirlo dos veces. Y el + ya significa "agregar
     contenido" en esta casa —es el único glifo del chrome, y se acepta
     porque no necesita traducción ni contexto—, así que en la vista que
     lista cosas creables significa exactamente lo que tiene que
     significar. El aria-label sí es una palabra, para quien lo escucha
     en vez de verlo. */
  const accion = (
    <button className={css.mas} aria-label="New view" onClick={nueva}>
      <Mas />
    </button>
  )

  const capa = sujeto ? (
    <>
      <Menu
        donde={menu?.donde ?? null}
        etiqueta={sujeto.nombre}
        onCerrar={() => setMenu(null)}
        /* Mayúsculas de título, que es lo que pide Menus › Labels: "use
           title-style capitalization... capitalizes every word except
           articles, coordinating conjunctions, and short prepositions".
           Sin elipsis, igual que el menú del clip y por el mismo motivo
           —ver MenuClip en acciones.tsx. */
        items={[
          { texto: 'Rename View', hacer: () => setRenombrando(sujeto) },
          /* Borrar una vista es lo mismo que mandar un clip a la
             papelera, así que se marca igual: rojo y con la hairline
             delante. La regla vive en el Menu, no acá. */
          { texto: 'Delete View', hacer: () => setBorrando(sujeto), destructivo: true },
        ]}
      />
      <DialogoRenombrarVista
        vista={sujeto}
        abierto={renombrando?.id === sujeto.id}
        onCerrar={() => setRenombrando(null)}
        onNombre={(n) => cambiar(sujeto.id, (v) => ({ ...v, nombre: n }))}
      />
      <DialogoBorrarVista
        vista={sujeto}
        abierto={borrando?.id === sujeto.id}
        onCerrar={() => setBorrando(null)}
        onBorrar={() => borrar(sujeto.id)}
      />
    </>
  ) : null

  return (
    <div className={css.playground}>
      {capa}
      {acciones && createPortal(accion, acciones)}
      {estado.vistas.length === 0 ? (
        <p className={css.aviso}>No views yet.</p>
      ) : (
        <div className={css.grillaVistas}>
          {estado.vistas.map((v) => (
            <Card
              key={v.id}
              vista={v}
              clips={clips.estado.cargando || !clips.estado.conectado ? null : clips.estado.clips}
              ir={ir}
              onMenu={(x, d) => setMenu({ vista: x, donde: d })}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   EL LIENZO — LAS REGLAS DEL TABLERO

   Es un TABLERO DE ESTUDIO y no un documento: las cosas están donde las
   dejaste, y moverlas es agarrarlas. De ahí salen las tres decisiones
   que gobiernan todo lo de abajo.

   ─── 1. RESPUESTA INSTANTÁNEA, Y 1:1 ───
   Durante un gesto NO PASA NADA POR EL ESTADO DE REACT. El puntero se
   mueve, y lo que se escribe es el `style` del nodo, directo. Un
   `setState` por cuadro son dos renders y un diff de árbol dentro de un
   presupuesto de 16ms, y es exactamente el error que la regla de
   performance nombra: se anima con React en vez de animar con el
   compositor. Al soltar —una sola vez— se hace el commit al modelo.

   Y el desplazamiento va en `transform`, que es la única propiedad que
   el navegador puede componer sin volver a hacer layout. `left`/`top`
   por cuadro reflowean la tela entera.

   ─── 2. SIN MOMENTUM ───
   Soltar deja el frame DONDE ESTÁ. La inercia es para listas que
   scrollean, donde el contenido sigue existiendo más allá del borde;
   acá el frame es un objeto sobre una mesa y una mesa no tiene inercia.

   ─── 3. NADA DE ANIMAR EL LAYOUT ───
   No hay transición en `left`, `top`, `width` ni `height`. Mover un
   frame con las flechas tiene que caer en el píxel que pediste, no
   deslizarse hasta él: si el movimiento tarda, dejás de poder contar
   cuántas veces apretaste.
   ═══════════════════════════════════════════════════════════════ */

/* ─── EL FRAME ENTERO ENTRA EN LA TELA, SIEMPRE ───
   Los cuatro bordes, en todo momento: mientras lo arrastrás, mientras lo
   redimensionás, al agregarlo, y al montar coordenadas guardadas que
   hayan quedado afuera (las corrige y las guarda corregidas).

   Hubo acá un margen blando —"que queden 48px visibles"— con banda
   elástica de iOS y un resorte que la recogía al soltar. SE FUE, y por
   una razón que se ve en una captura: la tela recorta (`overflow:
   hidden`), así que la parte que se salía no se estiraba, DESAPARECÍA
   bajo la sidebar, y las manijas de esa esquina quedaban pintando sobre
   el chrome. Una banda elástica necesita que se vea el exceso; en un
   lienzo recortado no hay dónde mostrarlo.

   El tope duro además hace que soltar no corrija NADA: la posición ya
   está acotada en cada cuadro del arrastre, así que no hay ningún salto
   que amortiguar al final. Ése es el motivo por el que este gesto no
   tiene ni un resorte: no hay ninguna corrección que suavizar.

   CUÁNTO HAY QUE MOVERSE PARA QUE SEA UN ARRASTRE. Debajo de esto el
   gesto fue un CLIC —que selecciona— y no un movimiento. Sin umbral, el
   temblor de la mano al hacer clic corre el frame uno o dos píxeles y
   la selección deja de poder ser gratis. */
const UMBRAL = 6

/* EL LADO MAYOR NO BAJA DE ACÁ. Más chico que esto un clip deja de ser
   mirable y pasa a ser una estampilla, y como la proporción se preserva,
   acotar el lado mayor acota los dos. */
const LADO_MINIMO = 80

/* Y EL SERVIDOR ACOTA CADA LADO entre 40 y 8000 (ver sanearVistas). Se
   respeta de este lado también: un frame que se guarda distinto de como
   se ve vuelve movido al recargar. */
const LADO_SERVIDOR = { min: 40, max: 8000 }

/* CON QUÉ TAMAÑO NACE UN FRAME. 480 el lado mayor, preservando la
   proporción del clip: es el tamaño en el que una grabación se sigue
   leyendo al lado de otras dos y todavía entran varias en la tela. */
const LADO_INICIAL = 480

/* LA MEDIDA PROVISIONAL, para cuando todavía no se pudo medir el clip
   —el elemento no cargó, o el frame lo agregó el vault, que no tiene
   ninguno montado—. Es 16/9, la proporción más común de lo que hay en
   el vault, y se corrige sola: ver `corregir`. Tiene que coincidir con
   la de vistas.ts, que es el otro camino por el que nace un frame. */
const PROVISIONAL = { ancho: 480, alto: 270 }

/* LA CASCADA. Un frame nuevo va al centro de la tela, y cada uno que ya
   estaba lo corre 24 hacia abajo y a la derecha para que no se tapen.
   Vuelve a empezar cada 8 —24×8 = 192, media pantalla— porque sin el
   módulo el frame número 40 nace fuera de la tela. */
const CASCADA = 24
const VUELTAS = 8

/* CUÁNTO DURA LA SALIDA DE UN FRAME, en milisegundos, para el lado de
   JavaScript. El valor de verdad es --dur-text (100ms) y lo aplica el
   CSS; acá está el mismo número porque el frame tiene que seguir montado
   mientras dura. Si uno cambia hay que cambiar el otro — está dicho en
   los dos lados. */
const SALIDA = 100

/* EL PASO DEL TECLADO. 1 para acomodar y 10 con Shift para recorrer, que
   es la escala de todos los editores. */
const PASO = 1
const PASO_LARGO = 10

const FLECHAS: Record<string, { x: number; y: number }> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
}

/* Las cuatro esquinas, en el orden en que se dibujan. La letra dice qué
   BORDE agarrás: 'n' arriba, 's' abajo, 'w' izquierda, 'e' derecha. El
   ancla es siempre la esquina de enfrente. */
const ESQUINAS = ['nw', 'ne', 'sw', 'se'] as const
type Esquina = (typeof ESQUINAS)[number]

/* Para quien las escucha. En inglés, como todo el texto de interfaz. */
const ESQUINA_NOMBRE: Record<Esquina, string> = {
  nw: 'Top left',
  ne: 'Top right',
  sw: 'Bottom left',
  se: 'Bottom right',
}

const acotar = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

/* DÓNDE PUEDE ESTAR LA ESQUINA DE ARRIBA A LA IZQUIERDA para que la caja
   entera quede adentro. El `max(0, …)` cubre el caso degenerado de un
   frame más grande que la tela: ahí el rango se cierra en 0 y el frame
   se pega a la esquina en vez de invertirse. */
function encajar(x: number, y: number, ancho: number, alto: number, tela: DOMRect) {
  return {
    x: Math.round(acotar(x, 0, Math.max(0, tela.width - ancho))),
    y: Math.round(acotar(y, 0, Math.max(0, tela.height - alto))),
  }
}

/* Y EL TAMAÑO MÁS GRANDE QUE ENTRA, con la proporción intacta. Hace
   falta en dos momentos: al agregar un clip en una ventana chica, y al
   montar una vista guardada en una ventana más chica que aquella en la
   que la armaste. Encoger es la única salida honesta — recortar
   escondería la mitad del clip sin decirlo. */
function caber(ancho: number, alto: number, tela: DOMRect) {
  const k = Math.min(tela.width / ancho, tela.height / alto, 1)
  return k >= 1 ? { ancho, alto } : desdeMedida(ancho, alto, Math.floor(Math.max(ancho, alto) * k))
}

/* UN FRAME ACOMODADO A LA TELA: primero entra, después se ubica.
   Devuelve el MISMO objeto si no había nada que corregir, y de eso
   depende que el efecto que la llama no programe una escritura al disco
   en cada render. */
function acomodar(f: Frame, tela: DOMRect): Frame {
  const c = caber(f.ancho, f.alto, tela)
  const p = encajar(f.x, f.y, c.ancho, c.alto, tela)
  const igual = c.ancho === f.ancho && c.alto === f.alto && p.x === f.x && p.y === f.y
  return igual ? f : { ...f, ...c, ...p }
}

/* EL TAMAÑO SALE DEL LADO MAYOR Y LA PROPORCIÓN, siempre. Deformar un
   clip es mentir sobre lo que grabaste, así que el ancho y el alto nunca
   son dos valores independientes: hay uno solo, y el otro se deriva. */
function desdeMedida(w: number, h: number, lado = LADO_INICIAL) {
  if (!w || !h) return PROVISIONAL
  return w >= h
    ? { ancho: lado, alto: Math.round((lado * h) / w) }
    : { ancho: Math.round((lado * w) / h), alto: lado }
}

/* HASTA DÓNDE PUEDE ENCOGERSE Y CRECER, expresado todo en ancho porque
   el alto se deriva de él. Las dos cotas de abajo son la traducción de
   las dos reglas:

     el lado MAYOR no baja de 80   →  r ≥ 1: ancho ≥ 80
                                      r < 1: alto ≥ 80, o sea ancho ≥ 80r
     ningún lado sale del rango del servidor (40 … 8000)

   Con la proporción atada, las dos se resuelven en un solo par. */
function anchoAcotado(ancho: number, r: number, techo = Infinity) {
  const min = Math.max(LADO_MINIMO * Math.min(1, r), LADO_SERVIDOR.min * Math.max(1, r))
  const max = Math.min(LADO_SERVIDOR.max, LADO_SERVIDOR.max * r, techo)
  /* El mínimo gana si los dos se cruzan: en una tela más chica que 80px
     preferimos un frame que asome a uno de 3px. Es un caso que sólo
     existe encogiendo la ventana hasta casi nada. */
  return acotar(ancho, min, Math.max(min, max))
}

/* Lo que un gesto tiene que recordar mientras dura. Vive en un ref y no
   en el estado: nada de esto redibuja nada. */
type Gesto = {
  puntero: number
  /* null es arrastrar; una esquina es redimensionar. */
  esquina: Esquina | null
  /* Dónde empezó el puntero y cómo estaba el frame en ese momento. Todo
     se calcula contra ESTO y no contra el cuadro anterior: acumular
     deltas cuadro a cuadro arrastra el error de redondeo y el frame
     termina corrido de donde está la mano. */
  px: number
  py: number
  x: number
  y: number
  ancho: number
  alto: number
  tela: DOMRect
  movio: boolean
  /* Lo último dibujado, que es lo que se va a guardar al soltar. */
  ultimo: { x: number; y: number; ancho: number; alto: number }
}

/* REDIMENSIONAR CON LA PROPORCIÓN ATADA.

   El ancla es la esquina OPUESTA a la que agarraste, y no se mueve: es
   lo que hace que redimensionar se sienta como estirar una foto sobre la
   mesa y no como que el frame se escape.

   Como la proporción manda, el puntero casi nunca cae justo sobre la
   esquina: hay que elegir cuál de los dos ejes gana. Gana EL QUE PIDE
   MÁS —el máximo de los dos— así que el frame siempre alcanza al
   puntero en al menos un eje, y nunca se queda corto en los dos. */
function redimensionado(g: Gesto, cx: number, cy: number) {
  const r = g.ancho / g.alto
  const oeste = g.esquina === 'nw' || g.esquina === 'sw'
  const norte = g.esquina === 'nw' || g.esquina === 'ne'
  const ax = oeste ? g.x + g.ancho : g.x
  const ay = norte ? g.y + g.alto : g.y
  /* El puntero en coordenadas de la tela, que es el sistema en el que
     viven x/y. */
  const px = cx - g.tela.left
  const py = cy - g.tela.top
  /* HASTA DÓNDE PUEDE CRECER SIN CRUZAR UNA PARED. El ancla no se mueve,
     así que lo que hay de tela de su lado es todo el techo que existe —
     y como la proporción está atada, el techo del alto se traduce a
     ancho multiplicándolo por r. Gana el más chico de los dos.

     Sin esto, estirar desde una esquina baja empujaba el frame fuera de
     la tela y el acotador terminaba corrigiéndole la posición: la
     esquina que estabas sosteniendo se escapaba sola. */
  const techoX = oeste ? ax : g.tela.width - ax
  const techoY = norte ? ay : g.tela.height - ay

  /* ─── LA PROYECCIÓN VA CON SIGNO, NO EN VALOR ABSOLUTO ───
     Acá había un `Math.abs(px - ax)` y era un bug que se veía: pasando
     la manija MÁS ALLÁ del ancla, la distancia volvía a crecer y el
     frame se agrandaba en espejo. Medido por la crítica arrastrando la
     manija `se` hacia la izquierda: a −395 el frame llegaba a su piso de
     80×45, y a −600 ya medía 200×113 y a −900, 500×281. Empujar más
     lejos AGRANDABA.

     El signo lo arregla de raíz. Cada eje se proyecta en la dirección en
     la que ese ancla deja crecer —hacia la derecha si el ancla es el
     borde izquierdo, hacia la izquierda si es el derecho— así que
     cruzarla da negativo. El `max(0, …)` lo lleva a cero y el piso de 80
     hace el resto: pasado el ancla el frame se queda en su mínimo, que
     es lo único que puede significar "más chico que nada". */
  const haciaX = oeste ? -1 : 1
  const haciaY = norte ? -1 : 1
  const pedido = Math.max(0, (px - ax) * haciaX, (py - ay) * haciaY * r)
  const ancho = Math.round(anchoAcotado(pedido, r, Math.min(techoX, techoY * r)))
  const alto = Math.round(ancho / r)
  /* El redondeo puede dejar la caja un píxel por fuera del techo, así
     que la posición pasa igual por el acotador: la garantía de que nada
     sale de la tela no puede depender de un `round`. */
  return {
    ...encajar(oeste ? ax - ancho : ax, norte ? ay - alto : ay, ancho, alto, g.tela),
    ancho,
    alto,
  }
}

/* ─── EL MEDIO DE UN FRAME ───
   El clip llena el frame entero, con el radio del sistema. No hay caja,
   ni aire, ni epígrafe: en un tablero lo que estudiás es el movimiento y
   todo lo demás sería marco.

   ─── EL VIDEO ARRANCA QUIETO, Y LO DESPIERTA UN CLIC ───
   No autoreproduce. Un tablero se arma con seis u ocho clips a la vez y
   ocho videos en loop a la vez no son una pared de referencias: son ocho
   cosas peleando por tu atención mientras intentás mirar UNA. Reproducir
   pasa a ser una decisión, y la decisión es el clic que ya estabas
   haciendo para seleccionar.

   SIN BOTÓN, SIN CONTROLES, SIN OVERLAY. Lo que se mira es el clip; un
   triángulo de play encima sería la primera cosa del tablero que no es
   contenido. El frame ES el control.

   Y EL ESTADO DE REPRODUCCIÓN ES EFÍMERO: no entra al modelo, no se
   guarda en el vault y ⌘Z no lo toca nunca. Es dónde estás mirando, no
   lo que hiciste — la misma razón por la que la selección tampoco se
   deshace. Recargar deja todo quieto de nuevo, que es el estado con el
   que se entra a mirar. */
function Medio({
  frame,
  clip,
  sabido,
  onMedida,
}: {
  frame: Frame
  clip: Clip | null
  /* Si el índice del vault todavía no llegó, no se sabe si el clip
     existe: no es lo mismo "no está" que "todavía no sé". */
  sabido: boolean
  onMedida: (w: number, h: number) => void
}) {
  /* UN BOCETO ES CÓDIGO TUYO Y SE DIBUJA SOLO. Va antes que todo lo
     demás porque no tiene clip y caería en el hueco de abajo. Todo lo
     suyo —cargarlo, recargarlo al guardar, y no tirar el tablero cuando
     está a medias— vive en bocetos.tsx. */
  if (frame.tipo === 'boceto') return <Boceto ref_={frame.ref} />

  /* EL HUECO. Una pieza nuestra —que todavía no se dibuja— o un clip que
     ya no está en el vault, porque lo renombraste o lo mandaste a la
     papelera. En los dos casos el frame SE QUEDA y dice a qué apuntaba:
     desaparecer sin avisar rompería el tablero sin que nadie lo note, y
     con el `ref` a la vista se puede volver a poner. Quieto: no hay nada
     que reproducir. */
  if (frame.tipo === 'pieza' || (!clip && sabido)) {
    /* SE MUESTRA EL NOMBRE, NO LA RUTA. Un frame guarda
       "web/sheet-que-se-estira.png" y eso es un dato de disco: lo que
       hay que leer es "Sheet que se estira", que es como se llamaba el
       clip cuando estaba. Lo resuelve la misma función que nombra las
       cards del vault (nombreDeRuta, en clips.ts), así que las dos
       vistas dicen el mismo nombre.

       NO SE INTENTA ADIVINAR una ruta nueva. Si el archivo se renombró,
       la referencia se rompió y punto: buscar "algo parecido" en el
       índice puede acertar y puede poner otro clip, y un tablero que se
       reescribe solo es peor que uno que avisa.

       Y debajo, UNA PALABRA que dice por qué está vacío. Sin ella el
       frame se lee como un clip que todavía carga. */
    const pieza = frame.tipo === 'pieza'
    return (
      <div className={css.hueco}>
        <span className={css.huecoNombre}>{pieza ? frame.ref : nombreDeRuta(frame.ref)}</span>
        {/* "Piece" y no "Missing" cuando es una pieza nuestra: no falta
            nada, es que el lienzo todavía no las dibuja. Hoy nada crea
            frames de ese tipo — el modelo los contempla y la interfaz
            todavía no—, así que esta rama es el andamio de esa función y
            queda dicho acá. */}
        <span className={css.huecoFalta}>{pieza ? 'Piece' : 'Missing'}</span>
      </div>
    )
  }

  /* Todavía no se sabe: la superficie sola, sin texto. Poner el "no
     está" antes de tiempo haría parpadear el nombre del archivo en cada
     recarga. */
  if (!clip) return <div className={css.hueco} />

  if (clip.clase === 'video') {
    return (
      <video
        className={css.medio}
        /* EL PRIMER CUADRO, QUIETO. `preload="metadata"` no decodifica
           ninguna imagen y la caja queda negra; el fragmento #t= obliga
           al navegador a buscar ahí y pintar ESE cuadro. 0.1 y no 0
           porque en 0 algunos contenedores todavía no tienen un cuadro
           clave. Es el mismo truco que usan la card del vault y los
           thumbnails de la grilla de vistas. */
        src={primerCuadro(clip.url)}
        preload="metadata"
        /* Los tres se quedan para cuando SÍ reproduzca: sin `muted` un
           play() disparado por un clic puede rebotar contra la política
           de autoplay, y `loop` es lo que hace que un gesto de dos
           segundos se pueda mirar veinte veces sin tocar nada. */
        muted
        loop
        playsInline
        /* La medida real llega con los metadatos, y es lo que corrige un
           frame que nació con la proporción provisional. */
        onLoadedMetadata={(e) => onMedida(e.currentTarget.videoWidth, e.currentTarget.videoHeight)}
      />
    )
  }
  return (
    <img
      className={css.medio}
      src={clip.url}
      alt=""
      /* El arrastre NATIVO de una imagen le roba el gesto al nuestro: el
         navegador levanta un fantasma y deja de mandar pointermove. */
      draggable={false}
      onLoad={(e) => onMedida(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
    />
  )
}

/* ─── UN FRAME EN LA TELA ───
   Se dibuja donde dice el modelo y se mueve escribiendo el nodo. Todo el
   gesto —bajar, mover, soltar— vive acá adentro: es la única cosa que
   sabe dónde está su propio nodo.

   LO QUE SE ANIMA Y LO QUE NO, dicho de una vez porque es la decisión
   que gobierna todo este componente:

     el arrastre y el redimensionado   NO, ni un milisegundo. Son
       manipulación directa: el frame está pegado al puntero y cualquier
       curva ahí es latencia disfrazada de suavidad. Y como el tope es
       duro, soltar tampoco corrige nada: no hay ni un snap que
       amortiguar
     aparecer, irse, y la selección    SÍ, y en CSS, porque son cambios
       de estado y no gestos. Viven en el hijo del frame (.medio) y en
       las manijas, o sea en nodos que el gesto nunca escribe: por eso
       las dos cosas no pueden pelearse por el mismo `transform`
   */
function Marco({
  frame,
  clip,
  etiqueta,
  sabido,
  elegido,
  nuevo,
  saliendo,
  capa,
  medirTela,
  onElegir,
  onMover,
  onMedida,
  onMenu,
}: {
  frame: Frame
  clip: Clip | null
  /* Cómo se llama esto para quien lo escucha en vez de verlo. */
  etiqueta: string
  sabido: boolean
  elegido: boolean
  nuevo: boolean
  saliendo: boolean
  capa: number
  medirTela: () => DOMRect | null
  onElegir: (id: string) => void
  onMover: (id: string, a: { x: number; y: number; ancho: number; alto: number }) => void
  onMedida: (id: string, w: number, h: number) => void
  /* El clic derecho: qué se puede hacer con ESTE frame. El menú y sus
     diálogos viven en el Lienzo —son uno solo para el tablero, como la
     capa del vault— y acá sólo se avisa dónde se abrió. */
  onMenu: (id: string, x: number, y: number) => void
}) {
  const caja = useRef<HTMLDivElement | null>(null)
  const gesto = useRef<Gesto | null>(null)
  const bajar = (e: EventoPuntero<HTMLElement>, esquina: Esquina | null) => {
    /* Sólo el botón principal. El derecho abre menús y el del medio
       pega: ninguno de los dos arrastra. */
    if (e.button !== 0) return

    /* ─── ADENTRO DE UN BOCETO ELEGIDO MANDA EL BOCETO ───
       Un boceto es TU componente y hay que poder apretarle los botones.
       Pero este manejador hace `preventDefault` y toma el puntero, así
       que si el gesto empezara acá el clic nunca llegaría adentro.

       El reparto es por SELECCIÓN, que es lo que hacen los editores de
       tablero: sin elegir, el boceto no recibe el puntero (lo apaga el
       CSS) y el frame se arrastra como cualquier otro; elegido, el
       puntero pasa y el tablero se aparta. Para volver a moverlo,
       Escape —que deselecciona— y a arrastrar.

       Las manijas quedan afuera de la excepción a propósito: son del
       frame, no del boceto, y redimensionar tiene que andar siempre. */
    if (!esquina && (e.target as HTMLElement).closest?.('[data-boceto]')) return

    const el = caja.current
    const tela = medirTela()
    if (!el || !tela) return
    /* Que la tela no lo lea como "clic en el vacío", que deselecciona. */
    e.stopPropagation()
    /* Y que el navegador no empiece una selección de texto ni un
       arrastre nativo con lo que haya adentro. */
    e.preventDefault()

    /* NADA ESTÁ NUNCA "OCUPADO". Un gesto tiene que poder empezar en
       cualquier instante, y acá eso sale gratis: la posición del frame
       no la anima nadie —el tope es duro, así que soltar no corrige nada
       y no hay resorte que interrumpir— así que el valor del modelo ES
       el valor de presentación. Lo que sí anima al entrar y al salir es
       el HIJO del frame, y el hijo no participa del gesto. */

    /* LA CAPTURA VA SOBRE EL FRAME, también cuando el gesto empezó en una
       manija: a partir de acá todos los eventos de este puntero llegan
       acá aunque la mano se salga del nodo —o de la ventana— y el gesto
       no se corta a mitad de camino. */
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* Tira NotFoundError si el puntero ya no existe —se levantó entre
         que el evento se despachó y este cuadro—. Sin captura el gesto
         sigue andando mientras la mano no salga del nodo, así que se
         sigue de largo en vez de romper el arrastre entero. */
    }
    /* EL CLIC TAMBIÉN ENFOCA. `preventDefault` de arriba apaga el foco
       que el navegador daría solo, así que se lo devuelve a mano: sin
       esto, tocar un frame lo seleccionaría sin enfocarlo y el lector de
       pantalla se quedaría hablando de otra cosa.
       `preventScroll` porque el foco no tiene por qué mover la página. */
    el.focus({ preventScroll: true })

    gesto.current = {
      puntero: e.pointerId,
      esquina,
      px: e.clientX,
      py: e.clientY,
      x: frame.x,
      y: frame.y,
      ancho: frame.ancho,
      alto: frame.alto,
      tela,
      movio: false,
      ultimo: { x: frame.x, y: frame.y, ancho: frame.ancho, alto: frame.alto },
    }

    /* SE SELECCIONA AL BAJAR y no al soltar: si esperás al clic, empezar
       a arrastrar un frame que no estaba seleccionado lo mueve sin
       seleccionarlo, y soltás sin manijas. Un clic sin movimiento pasa
       igual por acá, así que el clic pelado también selecciona. */
    onElegir(frame.id)
  }

  const mover = (e: EventoPuntero<HTMLElement>) => {
    const g = gesto.current
    const el = caja.current
    if (!g || !el || g.puntero !== e.pointerId) return
    const dx = e.clientX - g.px
    const dy = e.clientY - g.py
    /* EL UMBRAL. Debajo de esto todavía no se decidió nada: puede ser un
       clic con pulso. Una vez pasado, el arrastre se compromete y ya no
       vuelve a preguntar. */
    if (!g.movio && Math.hypot(dx, dy) < UMBRAL) return
    g.movio = true

    if (!g.esquina) {
      /* 1:1 CONTRA EL PUNTO DONDE AGARRASTE, no contra el centro del
         frame: el delta se mide desde px/py, así que el punto del clip
         que tenías bajo el dedo se queda bajo el dedo todo el arrastre. */
      const p = encajar(g.x + dx, g.y + dy, g.ancho, g.alto, g.tela)
      g.ultimo = { ...g.ultimo, ...p }
      /* TRANSFORM, no left/top: es la única de las cuatro que el
         navegador compone sin volver a hacer layout de la tela. Y se
         escribe el nodo directo, sin pasar por React.
         Contra la pared el transform deja de crecer y el frame se
         queda: adentro de los límites el seguimiento es 1:1 exacto, y
         afuera no hay nada que seguir. */
      el.style.transform = `translate3d(${p.x - g.x}px, ${p.y - g.y}px, 0)`
      return
    }

    /* Redimensionar SÍ cambia la caja, así que no hay transform que
       valga: escalar el nodo escalaría el video con él y lo que se ve
       dejaría de tener los píxeles del archivo. Se escriben las cuatro
       propiedades, igual de directo. */
    const s = redimensionado(g, e.clientX, e.clientY)
    g.ultimo = s
    el.style.left = `${s.x}px`
    el.style.top = `${s.y}px`
    el.style.width = `${s.ancho}px`
    el.style.height = `${s.alto}px`
  }

  const soltar = (e: EventoPuntero<HTMLElement>) => {
    const g = gesto.current
    const el = caja.current
    if (!g || !el || g.puntero !== e.pointerId) return
    gesto.current = null
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    /* ─── UN CLIC LIMPIO ALTERNA LA REPRODUCCIÓN ───
       No hay nada que guardar —la selección ya pasó en el pointerdown—
       pero sí algo que hacer: si el gesto no llegó a los 6px del umbral,
       fue un clic, y un clic sobre un video lo despierta o lo duerme.

       QUE VIVA ACÁ Y NO EN UN onClick es la razón por la que funciona:
       `movio` es el mismo bit que decide si hubo arrastre, así que
       soltar después de mover NO puede alternar nada. Un onClick aparte
       dispararía igual al final de un arrastre —el navegador emite click
       después de un pointerup en el mismo elemento— y cada vez que
       acomodaras un clip se te prendería o apagaría.

       Nada de esto toca el modelo: play/pausa no se guarda ni se
       deshace. Ver el bloque de Medio. */
    if (!g.movio) {
      const video = el.querySelector('video')
      if (video) {
        /* play() devuelve una promesa que WebKit RECHAZA si el elemento
           se desmonta o se pausa antes de que arranque —borrar el frame
           en el mismo cuadro, por ejemplo—. Sin el catch eso llega a la
           consola como un error no atrapado. */
        if (video.paused) video.play().catch(() => {})
        else video.pause()
      }
      return
    }

    /* EL NODO SE DEJA EN EL VALOR FINAL, no se limpia. Es sutil y es la
       diferencia entre que ande y que parpadee: React sólo escribe una
       propiedad de `style` cuando su valor CAMBIÓ respecto del render
       anterior, así que borrar `left` a mano deja al nodo sin `left` en
       todos los casos en que el commit no lo movió. Escribiendo el valor
       final, el nodo ya está donde el modelo va a decir y el render que
       viene escribe lo mismo o no escribe nada. Las dos ramas terminan
       igual. */
    const f = g.ultimo
    /* El transform sí se limpia: React nunca lo escribe, así que sacarlo
       no puede dejar nada colgado. */
    el.style.transform = ''
    el.style.left = `${f.x}px`
    el.style.top = `${f.y}px`
    el.style.width = `${f.ancho}px`
    el.style.height = `${f.alto}px`
    onMover(frame.id, f)
  }

  return (
    <div
      ref={caja}
      className={css.marco}
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.ancho,
        height: frame.alto,
        /* EL APILADO SALE DEL ORDEN DEL ARRAY, pero por z-index y no
           reordenando el DOM. Ver `dibujo` en el Lienzo. */
        zIndex: capa,
      }}
      /* ─── SE PUEDE LLEGAR SIN PUNTERO ───
         Antes de esto el tablero era literalmente inoperable con
         teclado: los frames eran <div> pelados sin rol, sin nombre y sin
         tabIndex, así que tabular en el lienzo saltaba de la sidebar al
         body y volvía. Medido por la crítica: `frameEnfocable: false`.

         `option` dentro de un `listbox` es el único par de roles del
         estándar donde `aria-selected` significa algo, y seleccionar es
         justamente lo que se hace acá. Se acepta una desviación del
         patrón canónico —que quiere UNA sola parada de tabulación y
         moverse entre opciones con las flechas— porque en un lienzo las
         flechas ya tienen un trabajo más importante: MOVER el frame, que
         es la razón de ser de la pantalla. Con una parada por frame se
         llega a todos con Tab y las flechas quedan libres para eso.

         El nombre es el del clip, no su ruta: es lo mismo que se lee en
         la card del vault y en el hueco de un clip que falta. */
      role="option"
      tabIndex={0}
      aria-selected={elegido}
      aria-label={etiqueta}
      data-elegido={elegido ? '' : undefined}
      data-nuevo={nuevo ? '' : undefined}
      data-saliendo={saliendo ? '' : undefined}
      /* EL FOCO ES LA SELECCIÓN. No son dos estados que hay que
         sincronizar: llegar con Tab a un frame lo selecciona, y por eso
         `bajar` también lo enfoca al hacer clic. Un anillo del sistema
         sobre un frame no elegido serían dos cosas señalando distinto. */
      onFocus={() => onElegir(frame.id)}
      onPointerDown={(e) => bajar(e, null)}
      onPointerMove={mover}
      onPointerUp={soltar}
      onPointerCancel={soltar}
      /* El clic derecho es del frame, no del navegador ni de la tela.
         Funciona igual adentro de un boceto elegido: el evento burbujea
         desde el contenido hasta acá. */
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onMenu(frame.id, e.clientX, e.clientY)
      }}
    >
      <Medio
        frame={frame}
        clip={clip}
        sabido={sabido}
        onMedida={(w, h) => onMedida(frame.id, w, h)}
      />
      {/* LAS MANIJAS ESTÁN SIEMPRE EN EL DOM y lo que cambia es si se
          ven. Montarlas y desmontarlas con la selección obligaría a
          animar la entrada con @starting-style y la salida no existiría
          —el nodo se va antes—; con una transición sobre un atributo,
          seleccionar y deseleccionar rápido se cruza en el aire en vez
          de reiniciarse. Apagadas no reciben puntero, así que no le
          roban un píxel de blanco al frame. */}
      {ESQUINAS.map((q) => (
        <span
          key={q}
          className={css.manija}
          data-esquina={q}
          /* Nombradas, pero FUERA del orden de tabulación: cuatro
             paradas más por frame convertirían Tab en un laberinto, y
             redimensionar con teclado todavía no existe. Queda dicho
             como deuda: el día que exista, esto pasa a tabIndex 0. */
          role="button"
          tabIndex={-1}
          aria-label={`${ESQUINA_NOMBRE[q]} resize handle`}
          onPointerDown={(e) => bajar(e, q)}
        />
      ))}
    </div>
  )
}

/* EL + DE LA CASA. El mismo glifo que el vault usa para subir clips:
   dos trazos, currentColor, y trazo de 1.5 porque el ícono lleva el peso
   óptico del texto que tiene al lado.

   ES SVG Y NO EL CARÁCTER "+": un glifo se apoya en la línea de base,
   así que dentro de un círculo nunca queda centrado. Está medido en
   vault.tsx — así el trazo cae a 0.00px del centro de la caja.
   `linecap: round` porque el resto del sistema no tiene una sola esquina
   viva. */
function Mas() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════
   LO QUE SE PUEDE HACER CON UNA VISTA — el clic derecho sobre su card.

   Es el mismo menú y los mismos diálogos del vault, y eso NO es un
   parecido: son literalmente Menu y Dialogo de acciones.tsx, con la
   superficie, la entrada que escala desde la esquina del cursor, el
   volteo contra los bordes y las tres formas de cerrar. Acá se pone
   nada más que lo que dicen.

   Que sea el mismo menú es la razón por la que existe: el clic derecho
   ya significaba "qué puedo hacer con esto" sobre un clip, y una vista
   es la otra cosa que hay en esta app.
   ═══════════════════════════════════════════════════════════════ */
function DialogoRenombrarVista({
  vista,
  abierto,
  onCerrar,
  onNombre,
}: {
  vista: Vista
  abierto: boolean
  onCerrar: () => void
  onNombre: (n: string) => void
}) {
  const [nombre, setNombre] = useState(vista.nombre)
  /* El borrador arranca de cero cada vez que se abre: si cancelaste y
     volvés a entrar, lo que ves es el nombre que hay, no lo que habías
     tipeado la vez pasada. */
  useEffect(() => {
    if (abierto) setNombre(vista.nombre)
  }, [abierto, vista.nombre])

  const guardar = () => {
    const n = nombre.trim()
    if (!n) return
    onNombre(n)
    onCerrar()
  }

  return (
    <Dialogo abierto={abierto} onCerrar={onCerrar}>
      <h2 className={acc.titulo}>Rename view</h2>
      {/* El campo SE VE como campo acá y no en la sidebar, y la
          diferencia no es capricho: en la sidebar escribís sobre un
          título que ya está en su lugar; acá el diálogo existe SÓLO para
          que escribas, así que el cursor tiene que saber dónde caer
          antes de que empieces. Es la nota de .campo en
          acciones.module.css. */}
      <input
        className={acc.campo}
        value={nombre}
        autoFocus
        aria-label="View name"
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && guardar()}
      />
      <div className={acc.pie}>
        <button className={acc.accion} onClick={onCerrar}>
          Cancel
        </button>
        <button
          className={acc.accion}
          data-fuerte=""
          disabled={!nombre.trim() || nombre === vista.nombre}
          onClick={guardar}
        >
          Rename
        </button>
      </div>
    </Dialogo>
  )
}

function DialogoBorrarVista({
  vista,
  abierto,
  onCerrar,
  onBorrar,
}: {
  vista: Vista
  abierto: boolean
  onCerrar: () => void
  onBorrar: () => void
}) {
  return (
    <Dialogo abierto={abierto} onCerrar={onCerrar}>
      <h2 className={acc.titulo}>Delete “{vista.nombre}”?</h2>
      {/* ACÁ NO HAY PAPELERA, PERO SÍ HAY ⌘Z, y el texto dice las dos
          cosas. Este comentario decía antes que borrar una vista era
          definitivo — era verdad cuando se escribió y dejó de serlo el
          día que el playground tuvo historial. La crítica lo midió: ⌘Z
          la devuelve entera, con sus frames y sus posiciones.

          Y dice hasta cuándo. El historial vive en memoria, así que la
          resurrección dura lo que dura la sesión: prometer "se puede
          deshacer" a secas haría que alguien recargara tranquilo y
          perdiera el trabajo. El límite es parte de la promesa.

          Lo otro que se aclara es lo que de verdad da miedo: los clips
          no se tocan. Lo que se pierde es el arreglo. */}
      <p className={acc.dice}>
        This deletes the view and its arrangement. The clips stay in your vault. Cmd+Z brings it
        back until you reload.
      </p>
      <div className={acc.pie}>
        <button className={acc.accion} onClick={onCerrar}>
          Cancel
        </button>
        <button
          className={acc.accion}
          data-fuerte=""
          onClick={() => {
            onBorrar()
            onCerrar()
          }}
        >
          Delete view
        </button>
      </div>
    </Dialogo>
  )
}

/* ═══════════════════════════════════════════════════════════════
   LA CARD DE UNA VISTA — la lista del playground.

   LA GRILLA ES LA DEL VAULT, que es la de openai.com/news medida entera
   con /web-clone: tope 1440 y riel 32 (los pone el marco), canaleta 24,
   y los cortes de 3 → 2 → 1 columna en 767 y 560. Los números, sus
   recibos y el porqué de cada uno están en vault.module.css, en .grilla
   y en .vault; acá se reusan sin volver a discutirlos, porque es la
   misma clase de contenido —una pared de cosas mirables— en la misma
   app.

   Y LA CARD ES LA CARD DEL VAULT: la proporción de benji
   (--vault-proporcion), el radio del sistema, el fondo --surface, y el
   nombre debajo con su mismo hueco. Lo único distinto es qué hay
   adentro de la caja.

   ─── EL PREVIEW ES LA COMPOSICIÓN, NO UN CLIP ───
   Se dibuja la vista entera en chiquito, como el thumbnail de un
   archivo de Figma: el bounding box de todos los frames se encaja en la
   caja de la card, y cada frame se dibuja escalado en su lugar
   relativo. Así la card dice CÓMO ESTÁ ARMADA la vista y no cuál fue el
   último clip que le pusiste.

   NADA SE REPRODUCE ACÁ. Los videos van con el primer cuadro quieto
   —preload="metadata" y el fragmento #t=0.1, el mismo truco que usan la
   card del vault y el diálogo de subir—. Cinco vistas de seis clips
   serían treinta videos decodificando en loop para elegir en cuál
   entrar: el movimiento es lo que se viene a mirar ADENTRO del lienzo,
   no en el pasillo.
   ═══════════════════════════════════════════════════════════════ */

/* El primer cuadro y nada más. Un <video> con preload="metadata" no
   decodifica ninguna imagen y la caja queda negra; el fragmento #t=
   obliga al navegador a buscar ahí y pintar ESE cuadro. 0.1 y no 0
   porque en 0 algunos contenedores todavía no tienen un cuadro clave.
   Es el mismo de vault.tsx, y está repetido y no importado porque son
   cuatro caracteres: traerlo ataría este archivo al módulo entero de la
   grilla del vault. */
const primerCuadro = (url: string) => `${url}#t=0.1`

/* La caja que contiene a TODOS los frames, en coordenadas de la tela.
   Es lo que se encaja en la card: sin esto habría que asumir un tamaño
   de tela —que cambia con la ventana— y la miniatura mentiría sobre
   dónde quedaron las cosas. */
function envolvente(frames: Frame[]) {
  const x0 = Math.min(...frames.map((f) => f.x))
  const y0 = Math.min(...frames.map((f) => f.y))
  const x1 = Math.max(...frames.map((f) => f.x + f.ancho))
  const y1 = Math.max(...frames.map((f) => f.y + f.alto))
  return { x: x0, y: y0, ancho: Math.max(x1 - x0, 1), alto: Math.max(y1 - y0, 1) }
}

function Preview({ vista, clips }: { vista: Vista; clips: Clip[] | null }) {
  /* Una vista vacía deja la superficie pelada. Una card quieta está
     bien: dice "no hay nada acá" sin escribirlo, que es lo que ya hace
     la caja vacía de un clip que no cargó. */
  if (vista.frames.length === 0) return null

  const caja = envolvente(vista.frames)
  return (
    /* SE ENCAJA CON `contain`, hecho a mano y no con object-fit: lo que
       se escala no es una imagen sino un grupo de nodos, así que la
       escala la hace el layout. El truco es dibujar el envolvente como
       un bloque con la MISMA proporción que tiene en la tela y dejar que
       el navegador lo centre — así un tablero apaisado y uno vertical
       usan el mismo código y los dos quedan centrados en los dos ejes. */
    <div className={css.previo}>
      <div
        className={css.previoCaja}
        /* La proporción del envolvente viaja como CUSTOM PROPERTY y no
           como `aspect-ratio` directo porque el CSS la necesita dos
           veces: para la proporción de la caja y adentro del calc() que
           decide cuál de los dos lados manda. Un `aspect-ratio` en
           línea sólo sirve para lo primero. */
        style={{ ['--previo-razon' as string]: caja.ancho / caja.alto }}
      >
        {vista.frames.map((f) => {
          const clip = clips?.find((c) => c.ruta === f.ref) ?? null
          /* Los porcentajes son contra el envolvente, así que la
             miniatura no necesita saber cuántos píxeles mide: el mismo
             preview sirve en una card de 443 y en una de 240. */
          const pos = {
            left: `${((f.x - caja.x) / caja.ancho) * 100}%`,
            top: `${((f.y - caja.y) / caja.alto) * 100}%`,
            width: `${(f.ancho / caja.ancho) * 100}%`,
            height: `${(f.alto / caja.alto) * 100}%`,
          }
          /* Sin clip, un rectángulo y nada más. A esta escala un nombre
             sería tres píxeles de alto: ruido con forma de texto. El
             tono es --surface-hover, un escalón sobre el fondo de la
             card, que es lo mínimo para que se vea que ahí HAY un frame
             sin decir nada más. */
          if (!clip) return <span className={css.previoHueco} key={f.id} style={pos} />
          return (
            <div className={css.previoFrame} key={f.id} style={pos}>
              {clip.clase === 'video' ? (
                <video src={primerCuadro(clip.url)} preload="metadata" muted playsInline />
              ) : (
                <img src={clip.url} alt="" loading="lazy" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Card({
  vista,
  clips,
  ir,
  onMenu,
}: {
  vista: Vista
  clips: Clip[] | null
  ir: (ruta: string) => void
  onMenu: (v: Vista, d: { x: number; y: number }) => void
}) {
  return (
    /* Es un <a href> de verdad, con el mismo interceptor que la card del
       vault y que la pieza del producto: el clic pelado navega del lado
       del cliente y cmd-click abre la vista en una pestaña nueva. Sin
       esto no hay cmd-click, ni clic del medio, ni "copiar dirección" en
       el menú contextual. Ver clicDeLink en parts.tsx. */
    <a
      className={css.card}
      href={'/playground/' + vista.id}
      onClick={clicDeLink(() => ir('/playground/' + vista.id))}
      /* El clic derecho abre lo que se puede HACER con la vista. Va en
         la card entera y no en la caja del preview, por lo mismo que el
         clic normal: el nombre de abajo también es la vista, y dejarlo
         muerto obligaría a apuntarle a la imagen. */
      onContextMenu={(e) => {
        e.preventDefault()
        onMenu(vista, { x: e.clientX, y: e.clientY })
      }}
    >
      <div className={css.cardMedia}>
        <Preview vista={vista} clips={clips} />
      </div>
      <div className={css.cardNombre}>{vista.nombre}</div>
    </a>
  )
}

/* ═══════════════════════════════════════════════════════════════
   EL LIENZO DE UNA VISTA — la sidebar y la tela.

   ES LA ÚNICA PANTALLA A SANGRE DE TODA LA APP. No lleva el riel de
   1440, ni la barra de solapas, ni el aire de 80 arriba: un lienzo es
   todo lo que hay, y cada píxel que le saques es un píxel menos de
   tablero. Por eso privado.tsx apaga su barra en esta ruta —ver
   `enLienzo` allá— y por eso acá no hay ningún max-width.

   TODO EL CHROME VIVE EN LA SIDEBAR, ninguna palabra flota sobre la
   tela. Es la misma razón por la que las manijas son lo único que se
   dibuja encima de un frame: lo que está sobre el tablero es contenido,
   y lo que es de la aplicación está al costado. Flotando, además,
   ninguna palabra puede garantizar contraste — abajo puede haber un
   clip de cualquier color.

   Este componente es el dueño de la selección, del teclado y de qué se
   agrega: las tres cosas que valen para el tablero entero y no para un
   frame. */
function Lienzo({
  vista,
  cambiar,
  borrar,
  ir,
  clips,
}: {
  vista: Vista
  /* La etiqueta es la del historial: dos llamadas seguidas con la misma
     se juntan en un solo paso de deshacer. Ver JUNTAR en vistas.ts. */
  cambiar: (id: string, f: (v: Vista) => Vista, etiqueta?: string | null) => void
  borrar: (id: string) => void
  ir: (ruta: string) => void
  /* Los clips salen del mismo índice que el vault: un frame guarda la
     RUTA y nada más, así que lo que se dibuja siempre es el archivo de
     ahora y no una copia vieja. Llega por prop y no por hook propio
     porque el Playground ya lo pidió para los previews de la lista:
     dos `useClips()` serían dos veces el mismo pedido. `null` es
     "todavía no sé", que no es lo mismo que "no está". */
  clips: Clip[] | null
}) {
  const tela = useRef<HTMLDivElement | null>(null)
  const [elegido, setElegido] = useState<string | null>(null)
  /* ─── QUÉ FRAMES ACABAN DE APARECER ───
     Se compara el conjunto de ids de este render contra el del anterior.
     Todo lo que no estaba ANTES entra fundiendo, venga de donde venga:
     un clip que agregaste, y también uno que ⌘Z acaba de devolver.

     Antes esto era un solo id que ponía `agregar`, y por eso deshacer un
     borrado no tenía llegada: borrar se despedía en 100ms y el frame
     volvía de golpe. Ahora las dos mitades del gesto están completas y
     no hay una lista de caminos que mantener — cualquier forma futura de
     hacer aparecer un frame la hereda sola.

     SE LEE EN EL RENDER Y SE ACTUALIZA EN UN EFECTO, que es el patrón de
     "el valor anterior". Tiene que ser así: `@starting-style` sólo mira
     el PRIMER render del nodo, así que marcarlo un render después —desde
     el estado— llegaría tarde y no animaría nada. El doble render de
     StrictMode no lo rompe: la comparación es contra el mismo ref y da
     lo mismo las dos veces.
     `null` la primera vez significa "todavía no vi nada", y con eso los
     frames que ya estaban al abrir la vista NO funden. */
  const vistos = useRef<Set<string> | null>(null)
  /* EL FRAME QUE SE ESTÁ YENDO. Sigue en el modelo y en el DOM mientras
     dura su salida: sin esto, borrar lo saca en el mismo cuadro y no hay
     nada que animar — un elemento desmontado no puede despedirse. La
     baja de verdad la hace `quitar`, cuando la transición terminó. */
  const [yendose, setYendose] = useState<string | null>(null)
  const [eligiendo, setEligiendo] = useState(false)
  /* La confirmación de borrar ESTA vista. Es el mismo diálogo que usa la
     grilla desde su clic derecho: había dos niveles de protección para el
     mismo rótulo —allá te preguntaba, acá borraba y navegaba— y la
     diferencia no la decidió nadie. */
  const [borrando, setBorrando] = useState(false)
  /* ─── EL CLIC DERECHO SOBRE UN FRAME: PUBLICAR ───
     Acá vive Add to Exhibition, y no en el vault, porque acá está TU
     trabajo: el vault es lo externo. Qué pieza sale lo dice el frame —
     un boceto publica Web viva, una grabación publica App— así que el
     diálogo no pregunta plataforma. Una capa para el tablero entero,
     con useUltimo para que la salida tenga qué animar, igual que la
     del vault. */
  const [menuFrame, setMenuFrame] = useState<{ frame: Frame; donde: Donde } | null>(null)
  const [publicando, setPublicando] = useState<Frame | null>(null)
  const framePub = useUltimo(menuFrame?.frame ?? publicando)
  /* ─── LA SIDEBAR SE PLIEGA, Y SÓLO POR TECLADO ───
     No hay control a la vista y es a propósito: pedido explícito de que
     el chrome del lienzo no cambie. El panel se dibuja igual que
     siempre; lo único nuevo es que puede irse.

     ARRANCA VISIBLE Y NO SE RECUERDA. Lo primero es de Apple —Sidebars
     dice no ocultarla por defecto, para que siga siendo descubrible— y
     lo segundo cae solo: `key={vista.id}` remonta el Lienzo al cambiar
     de vista, así que cada lienzo abre entero. Sin persistencia no hay
     forma de quedarse encerrado sin panel y sin saber por qué. */
  const [panel, setPanel] = useState(true)

  const medirTela = () => tela.current?.getBoundingClientRect() ?? null
  /* El ancestro que mueve la tela al plegar. Hace falta para escuchar
     el FIN de su transición — ver el efecto de acomodar, más abajo. */
  const lienzo = useRef<HTMLDivElement | null>(null)

  const ids = vista.frames.map((f) => f.id)
  const aparecidos = vistos.current === null ? [] : ids.filter((id) => !vistos.current!.has(id))
  useEffect(() => {
    vistos.current = new Set(ids)
  })

  /* Un frame se dibuja SIEMPRE en el mismo lugar del DOM. El orden del
     array es el orden de apilado, pero traducirlo moviendo nodos tiene
     dos costos: reordenar un nodo es sacarlo y volver a meterlo —lo que
     suelta la captura del puntero a mitad de un arrastre— y obliga al
     navegador a repintar todo lo que se movió. Con el DOM quieto y el
     apilado por z-index no pasa ninguna de las dos.
     El orden de dibujo es por id: es arbitrario, pero es ESTABLE, que es
     lo único que se le pide. */
  const capas = new Map(vista.frames.map((f, i) => [f.id, i]))
  const dibujo = [...vista.frames].sort((a, b) => (a.id < b.id ? -1 : 1))
  /* El frame elegido como DATO, no como id: lo leen la acción de
     publicar de la sidebar y nada más. Derivado en cada render — la
     fuente de verdad sigue siendo `elegido`. */
  const frameElegido = vista.frames.find((f) => f.id === elegido) ?? null

  /* SELECCIONAR SUBE AL FRENTE. Es lo que hace que "tocá lo que querés
     mirar" alcance para desapilar dos frames superpuestos, sin un menú
     de ordenar. Va al final del array, que es lo que dibuja arriba. */
  const elegir = (id: string | null) => {
    /* ─── TOCAR LA TELA SACA EL FOCO DEL NOMBRE ───
       Un <div> no es enfocable, así que hacer clic en un frame NO le
       saca el foco al campo de la sidebar: se queda ahí, invisible, y
       entonces el teclado del tablero deja de funcionar en silencio
       —Backspace borra una letra del nombre en vez del frame elegido, y
       las flechas mueven el cursor de texto—. Medido: pasa siempre que
       renombrás una vista y después tocás un clip.

       El guardia del teclado hace lo correcto y no se toca; lo que
       faltaba era esto, que es lo que hace cualquier lienzo: mirar algo
       en la mesa es dejar de escribir. */
    const foco = document.activeElement
    if (foco instanceof HTMLElement && foco.closest('input, textarea')) foco.blur()

    setElegido(id)
    if (!id) return
    /* Si ya está arriba no se toca nada: sin esta guarda, cada clic
       programaría una escritura al disco idéntica a la anterior. */
    if (vista.frames[vista.frames.length - 1]?.id === id) return
    cambiar(
      vista.id,
      (v) => {
        const i = v.frames.findIndex((f) => f.id === id)
        if (i < 0) return v
        return { ...v, frames: [...v.frames.slice(0, i), ...v.frames.slice(i + 1), v.frames[i]] }
      },
      /* SE GUARDA PERO NO GASTA UN PASO DE DESHACER. Traer al frente es
         consecuencia de mirar, no una acción con la que hiciste algo: la
         crítica midió que tres clics de selección dejaban tres ⌘Z que no
         cambiaban nada a la vista, y una pila llena de pasos invisibles
         es peor que no tener pila.
         Sigue persistiendo —el apilado es parte del documento— y sigue
         siendo el mismo que ves al recargar. Ver el tercer valor de
         `etiqueta` en vistas.ts. */
      null,
    )
  }

  /* BORRAR EN DOS TIEMPOS. Primero se marca —el frame se apaga y encoge
     con la misma curva y el mismo camino con el que entró, pero más
     corto: al salir ya decidiste— y recién después se saca del modelo.

     LA ESPERA ES LA DURACIÓN DE LA SALIDA Y ESTÁ ESCRITA DOS VECES, acá
     y en el CSS. Es la única duplicación del archivo y se acepta a
     cambio de no tener que escuchar `transitionend` sobre un elemento
     que puede tener el puntero encima o la pestaña en segundo plano —
     los dos casos en los que ese evento no llega y el frame se quedaría
     para siempre a medio irse.

     Y LA ESPERA TAMBIÉN CORRE CON MOVIMIENTO REDUCIDO. Acá había un
     atajo que desmontaba en el acto, y era justo lo contrario de lo que
     dice la regla: reducido significa MÁS SUAVE, no cero. Medido por la
     crítica: el frame desaparecía a los 2ms mientras el comentario de al
     lado prometía un fundido. Lo que se apaga con la preferencia es el
     MOVIMIENTO —la escala, y eso lo hace el CSS—; el fundido se queda,
     porque es lo que evita que algo desaparezca de golpe del medio de la
     pantalla. */
  const quitar = (id: string) => {
    setElegido((e) => (e === id ? null : e))
    setYendose(id)
    window.setTimeout(() => {
      setYendose((y) => (y === id ? null : y))
      cambiar(vista.id, (v) => ({ ...v, frames: v.frames.filter((f) => f.id !== id) }))
    }, SALIDA)
  }

  const mover = (id: string, a: { x: number; y: number; ancho: number; alto: number }) =>
    cambiar(vista.id, (v) => ({
      ...v,
      frames: v.frames.map((f) => (f.id === id ? { ...f, ...a } : f)),
    }))

  /* LA PROPORCIÓN SE CORRIGE SOLA cuando el medio termina de cargar, y
     SÓLO si el frame sigue en la medida provisional. Es la condición
     entera: no hace falta recordar si lo redimensionaste, porque
     redimensionarlo lo saca de esos dos números exactos. El precio es
     que un frame dejado a mano justo en 480×270 se recalcula al
     recargar — y termina en la proporción correcta, que es lo que
     querías igual. */
  const medida = (id: string, w: number, h: number) => {
    if (!w || !h) return
    cambiar(
      vista.id,
      (v) => {
        const i = v.frames.findIndex((f) => f.id === id)
        if (i < 0) return v
        const f = v.frames[i]
        if (f.ancho !== PROVISIONAL.ancho || f.alto !== PROVISIONAL.alto) return v
        const m = desdeMedida(w, h)
        if (m.ancho === f.ancho && m.alto === f.alto) return v
        return { ...v, frames: v.frames.map((x, k) => (k === i ? { ...x, ...m } : x)) }
      },
      /* SIN HISTORIAL. Esto no lo hiciste vos: es el frame acomodándose
         a la forma real del clip cuando termina de cargar. Con paso, el
         primer ⌘Z después de agregar un clip deshacía la corrección en
         vez del clip. Ver los tres valores de `etiqueta` en vistas.ts. */
      null,
    )
  }

  /* PONER ALGO EN LA TELA. Es el mismo trabajo para las tres cosas que
     entran —un clip, un boceto, y algún día una pieza— así que la
     posición, el encaje y la cascada se escriben UNA vez y lo único que
     cambia es qué se pone.

     La medida llega del elemento que estabas mirando en el diálogo —ya
     cargado, así que su proporción es un hecho y no una estimación— y si
     no se pudo medir se cae en la provisional. Un boceto no tiene
     proporción natural: nace provisional siempre, y lo que lo define es
     el tamaño que le des arrastrando. */
  const poner = (
    tipo: Frame['tipo'],
    ref: string,
    m: { ancho: number; alto: number } | null,
  ) => {
    const r = medirTela()
    /* Si no entra en la tela a su tamaño de arranque —una ventana chica,
       un clip muy vertical— nace más chico en vez de nacer cortado. */
    const pedido = m ?? PROVISIONAL
    const { ancho, alto } = r ? caber(pedido.ancho, pedido.alto, r) : pedido
    const salto = (vista.frames.length % VUELTAS) * CASCADA
    const centro = r
      ? { x: (r.width - ancho) / 2 + salto, y: (r.height - alto) / 2 + salto }
      : { x: CASCADA + salto, y: CASCADA + salto }
    const p = r
      ? encajar(centro.x, centro.y, ancho, alto, r)
      : { x: Math.round(centro.x), y: Math.round(centro.y) }
    const id = nuevoId()
    cambiar(vista.id, (v) => ({
      ...v,
      frames: [...v.frames, { id, tipo, ref, ...p, ancho, alto }],
    }))
    setElegido(id)
    setEligiendo(false)
  }

  const agregar = (clip: Clip, m: { ancho: number; alto: number } | null) =>
    poner('clip', clip.ruta, m)

  /* EL ARCHIVO PRIMERO, EL FRAME DESPUÉS. Si el servidor no lo pudo
     escribir no se pone nada: un frame apuntando a un archivo que no
     existe sería un hueco que no se puede arreglar desde acá.

     El frame se pone SIN ESPERAR a que Vite avise que el archivo
     existe. No hace falta: mientras el glob no lo tenga, el frame dibuja
     su hueco con el nombre, y cuando el hot update llega —un par de
     cuadros— se dibuja solo. Esperar sería quedarse mirando un diálogo
     abierto por nada. */
  const nuevoBoceto = async () => {
    const ref = await crearBoceto(refLibre())
    if (ref) poner('boceto', ref, null)
  }

  /* ─── LO GUARDADO SE ACOMODA A LA TELA QUE HAY HOY ───
     Una vista se arma en una ventana y se abre en otra. Sin esto, un
     frame guardado a x=1100 en una pantalla grande aparece medio metido
     bajo la sidebar en un portátil, o directamente fuera de la vista, y
     no hay forma de alcanzarlo — el arrastre no puede empezar sobre algo
     que no se ve.

     LA CORRECCIÓN SE GUARDA, no se dibuja y ya: si sólo se dibujara
     acomodado, el modelo seguiría diciendo 1100 y el problema volvería
     en el próximo render que no pase por acá.

     Sin lista de dependencias, igual que el teclado de abajo y que el
     Escape de app.tsx: corre después de cada render y es un no-op salvo
     que algo esté afuera. `acomodar` devuelve EL MISMO objeto cuando no
     hay nada que corregir, y de eso depende que no programe una
     escritura al disco por render. */
  useEffect(() => {
    const revisar = () => {
      const r = medirTela()
      if (!r) return
      const frames = vista.frames.map((f) => acomodar(f, r))
      if (frames.every((f, i) => f === vista.frames[i])) return
      cambiar(
        vista.id,
        (v) => {
          const arreglados = v.frames.map((f) => acomodar(f, r))
          /* Se devuelve LA MISMA vista si no había nada que corregir:
             un objeto nuevo con el mismo contenido igual contaría como
             cambio y programaría una escritura al disco por render. */
          return arreglados.every((f, i) => f === v.frames[i]) ? v : { ...v, frames: arreglados }
        },
        /* Sin historial, por lo mismo que la corrección de proporción:
           es la app acomodándose a la ventana que hay, no vos. */
        null,
      )
    }
    revisar()
    /* Y al cambiar el tamaño de la ventana, que es el otro momento en
       que la tela se achica debajo de los frames. */
    window.addEventListener('resize', revisar)

    /* ─── Y AL VOLVER LA SIDEBAR, que es el tercero ───
       Plegarla agranda la tela y no rompe nada; DESplegarla se la come
       240px de vuelta, y un frame que hayas dejado en esa franja queda
       afuera. Sin esto no se notaría hasta el próximo `resize` de
       ventana, que lo movería de golpe mucho después y sin relación
       aparente con lo que hiciste.

       SE ESCUCHA EL FIN DE LA TRANSICIÓN Y NO EL CAMBIO DE ESTADO. Este
       efecto ya corre después de cada render —o sea que también corre al
       apretar ⌥⌘S— pero ahí la tela TODAVÍA MIDE LO DE ANTES: el padding
       recién arranca su transición. Medir en ese momento es medir la
       ventana vieja.

       Se filtra por propiedad y por target porque `transitionend`
       burbujea: el transform del panel también llega hasta acá. */
    const marco = lienzo.current
    const alPlegar = (e: TransitionEvent) => {
      if (e.target === marco && e.propertyName === 'padding-left') revisar()
    }
    marco?.addEventListener('transitionend', alPlegar)
    return () => {
      window.removeEventListener('resize', revisar)
      marco?.removeEventListener('transitionend', alPlegar)
    }
  })

  /* ─── EL TECLADO ───
     Va en el documento y no en la tela: para que un keydown llegue a un
     div hay que hacerlo enfocable, y un tabIndex en la tela mete una
     parada de tabulación que no lleva a ningún lado. Lo que gobierna es
     la SELECCIÓN, que ya es el sujeto de todo esto. */
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      /* ─── ⌥⌘S PLIEGA LA SIDEBAR, Y VA ANTES QUE EL GUARDIA ───
         EL ATAJO ES EL DE APPLE, NO UNO NUESTRO. SOURCE:
         support.apple.com/en-us/102650 (Mac keyboard shortcuts),
         "Option-Command-S: Hide or show the Sidebar in Finder windows".
         Es el mismo en Mail, Notes y Xcode. Sin control a la vista, el
         atajo tiene que ser EL que ya sabés, no uno que haya que
         descubrir.

         SE MIRA `code` Y NO `key`, y esto es la trampa del asunto: en un
         teclado Mac ⌥+S no produce "s" sino "ß", así que `e.key === 's'`
         no entra nunca. `code` nombra la TECLA FÍSICA y no depende de la
         distribución.

         VA ARRIBA DEL GUARDIA a propósito. El guardia de abajo aparta
         todo lo que llega desde un campo de texto o un diálogo porque no
         es del tablero — y tiene razón para las flechas y el Backspace.
         Pero esto no es una tecla del tablero: es un comando de la
         ventana, y en Finder anda con el foco donde esté. Escribiendo el
         nombre de la vista también tiene que andar.

         Y ctrl además de cmd, como el ⌘Z de privado.tsx: la misma
         cortesía para un teclado que no es de Mac. */
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.code === 'KeyS') {
        e.preventDefault()
        setPanel((v) => !v)
        return
      }

      /* ─── EL GUARDIA VA PRIMERO, ANTES QUE NINGUNA TECLA ───
         Estaba después de resolver Escape, y eso hacía que Escape
         hiciera DOS cosas de una: con el diálogo de "Add clip" abierto,
         cerraba el diálogo —eso lo hace el <dialog> nativo— y de paso
         mataba la selección del tablero, que no tenía nada que ver.
         Medido por la crítica: `seleccionSobrevive: false`.

         Una tecla que llega desde un campo de texto o desde adentro de
         un diálogo NO ES DEL TABLERO, y eso vale para todas por igual,
         Escape incluida. Escribir no puede borrar un frame, y cerrar un
         diálogo no puede deseleccionar. */
      const t = e.target as HTMLElement | null
      if (t?.closest?.('input, textarea, select, dialog') || t?.isContentEditable) return

      if (e.key === 'Escape') {
        /* Deselecciona Y suelta el foco. Si el frame se quedara
           enfocado, `aria-selected` diría false mientras el anillo del
           sistema lo sigue señalando: dos respuestas para la misma
           pregunta. */
        const f = document.activeElement
        if (f instanceof HTMLElement && f.closest('[role="option"]')) f.blur()
        setElegido(null)
        return
      }
      if (!elegido) return

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        quitar(elegido)
        return
      }

      const d = FLECHAS[e.key]
      if (!d) return
      /* Sin esto la página scrollea debajo del frame que estás moviendo. */
      e.preventDefault()
      const paso = e.shiftKey ? PASO_LARGO : PASO
      const r = medirTela()
      cambiar(
        vista.id,
        (v) => ({
          ...v,
          frames: v.frames.map((f) => {
            if (f.id !== elegido) return f
            const x = f.x + d.x * paso
            const y = f.y + d.y * paso
            return { ...f, ...(r ? encajar(x, y, f.ancho, f.alto, r) : { x, y }) }
          }),
        }),
        /* Cinco flechazos seguidos sobre el mismo frame son UN paso de
           deshacer: la etiqueta los junta. Sobre otro frame, o después
           de una pausa, empieza uno nuevo. */
        'flechas:' + elegido,
      )
    }
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  })

  /* LA CUENTA EN PALABRAS ES SÓLO PARA QUIEN ESCUCHA. Se ve una vez en
     todo el lienzo —el aria-live del pie, recortado— desde que el hueco
     de la lista lo dice con un guion (ver más abajo). Un guion no se
     puede anunciar: "—" leído en voz alta no es nada, así que la frase
     tiene que seguir existiendo para el otro canal.

     Singular y plural, y "No clips" en vez de "0 clips": un cero se lee
     como un dato roto y la palabra dice lo mismo mejor. */
  const n = vista.frames.length
  const cuenta = n === 0 ? 'No clips' : n === 1 ? '1 clip' : `${n} clips`

  return (
    <div
      className={css.lienzo}
      ref={lienzo}
      /* Plegada, el atributo lo dice y el CSS hace el resto: el panel se
         va en transform y la tela se queda con el lugar. La sidebar se
         sigue dibujando igual — no cambia ni un valor suyo. */
      data-sin-panel={panel ? undefined : ''}
    >
      {/* ─── LA SIDEBAR ───
          Todo lo que la aplicación tiene para decir sobre esta vista, en
          una columna: de dónde volvés, cómo se llama, y qué se puede
          hacer. Se lee de arriba abajo en ese orden, que es el orden en
          que se necesita. */}
      {/* `inert` plegada, la misma receta que la ficha del vault: un
          panel que se fue no puede seguir recibiendo el tabulador ni el
          puntero. Sin esto, tabular desde la tela caía adentro de una
          columna que no está en pantalla y el foco desaparecía. */}
      <aside className={css.panel} inert={!panel}>
        <div className={css.panelTitulo}>
          {/* Con la barra de solapas apagada en esta ruta, ÉSTA ES LA
              ÚNICA SALIDA. Se vuelve por el historial —lo mismo que hacen
              el gesto de atrás del trackpad y ⌘Z, así que hay una sola
              forma de cerrar— y si no hay historial propio, porque
              entraste directo por link, se empuja la lista: la flecha no
              puede sacarte de la app. */}
          <Volver onClick={() => (history.length > 1 ? history.back() : ir('/playground'))} />
          {/* El nombre se edita en el lugar. No hay un modo "renombrar":
              es el título, y escribís encima. */}
          <input
            className={css.nombre}
            value={vista.nombre}
            aria-label="View name"
            /* LA COLUMNA CORTA LOS NOMBRES LARGOS Y NO LO DISIMULA. Un
               input de una línea recorta sin puntos suspensivos —no hay
               `text-overflow` que valga en un campo editable— así que la
               única señal honesta es el tooltip nativo, que muestra el
               nombre entero sin sacarte de donde estás.
               Medido: la columna son 176px, o sea ~24 caracteres a 14px.
               Un nombre de 40 esconde unos 245px. Queda dicho como
               límite aceptado: un lienzo se nombra corto, y el nombre
               completo se ve y se edita acá mismo moviendo el cursor. */
            title={vista.nombre}
            /* Tipear el nombre es UN paso de deshacer, no uno por
               letra: la etiqueta junta las pulsaciones seguidas sobre
               esta misma vista. Ver JUNTAR en vistas.ts. */
            onChange={(e) =>
              cambiar(vista.id, (v) => ({ ...v, nombre: e.target.value }), 'nombre:' + vista.id)
            }
          />
        </div>
        {/* ─── EL ÍNDICE DEL TABLERO ───
            La sidebar decía "Add clip" y "1 clip" y nada más: el lienzo
            tenía contenido y su chrome no sabía NOMBRARLO. Esto es la
            lista de lo que hay, con la misma anatomía que el índice del
            producto —un rótulo que pesa lo mismo que sus renglones, 16
            de aire, 8 entre líneas— porque es el mismo trabajo.

            Tocar un renglón es `elegir`: exactamente lo que hace tocar
            el frame en la tela — selecciona, sube al frente, y le saca
            el foco al nombre si estabas escribiendo. Un solo verbo para
            el mismo hecho, venga del índice o de la tela, y por eso los
            dos lados quedan sincronizados sin más estado.

            El + va PELADO, sin el círculo del vault, y no es un
            capricho: en un encabezado de sección el glifo desnudo es lo
            que hacen las dos referencias medidas — "Pages +" en Paper
            (SOURCE: captura oficial del app en paper.design) y
            "Pages"/"Layers" en el sidebar nuevo de Figma (SOURCE:
            help.figma.com, art. 360039831974). El círculo queda para
            las BARRAS (el vault y la grilla de vistas), que es otro
            contexto: allá el + convive con palabras de nav y necesita
            cuerpo propio; acá cuelga de un rótulo que ya lo ancla.
            Reemplaza a "Add clip", que era una palabra gris que pesaba
            MENOS que el nombre de la vista siendo la acción más
            frecuente del tablero. Elegido en prototipo (ronda 2,
            "Filo") contra la línea de zonas de las referencias y
            contra la cabecera-menú. */}
        <div className={css.clips}>
          <div className={css.clipsCabecera}>
            <span className={css.clipsRotulo}>Clips</span>
            <button
              className={css.masPelado}
              aria-label="Add clip"
              onClick={() => setEligiendo(true)}
            >
              <Mas />
            </button>
          </div>
          {n > 0 ? (
            <ul className={css.filas} aria-label="Clips in this view">
              {dibujo.map((f) => {
                /* El mismo nombre que ya muestra el frame en la tela
                   (`etiqueta`, más abajo): una pieza se llama por su ref
                   y un clip por su nombre de archivo sin carpeta. */
                const nombre = f.tipo === 'pieza' ? f.ref : nombreDeRuta(f.ref)
                return (
                  <li key={f.id} className={css.renglon}>
                    <button
                      className={css.fila}
                      /* `aria-current` y no `aria-selected`: las opciones
                         del listbox son los frames de la tela. Esto es su
                         índice, y la fila del elegido es "la actual". */
                      aria-current={elegido === f.id || undefined}
                      data-elegido={elegido === f.id ? '' : undefined}
                      data-nuevo={aparecidos.includes(f.id) ? '' : undefined}
                      data-saliendo={yendose === f.id ? '' : undefined}
                      /* La columna corta con puntos suspensivos; el
                         tooltip nativo muestra el nombre entero. La misma
                         señal que ya da el nombre de la vista arriba. */
                      title={nombre}
                      onClick={() => elegir(f.id)}
                    >
                      {nombre}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            /* ─── EL HUECO ES UN GUION, NO UNA FRASE ───
               Acá decía "No clips", y eran dos problemas en una línea.
               El primero es que la frase ya está dicha: el aria-live del
               pie anuncia esa misma cuenta, así que el vacío se contaba
               dos veces. El segundo es dónde estaba dicha — un rótulo
               gris en el lugar exacto de los renglones se lee como un
               renglón más, o sea que la lista vacía mostraba un ítem
               para avisar que no hay ninguno.

               EL GUION ES LA RESPUESTA QUE ESTA CASA YA DIO PARA UN DATO
               AUSENTE, y no una decisión nueva: es el placeholder de
               Source y de Notes en la ficha técnica de un clip (ver
               ficha.tsx, y su color en .campo::placeholder). Viene con su
               mismo par tipográfico —--type-meta al --text-secondary, que
               es lo que .sinClips ya usaba— así que no hay ningún valor
               que elegir. No compite con el rótulo de arriba, no pide
               traducción, y ocupa un renglón: cuando entra el primer clip
               la lista no salta.

               `aria-hidden` porque para quien escucha no dice nada: un
               guion es tipografía, no información. La cuenta en palabras
               sigue viva en el aria-live del pie, que es donde tiene que
               estar — ver la nota de `cuenta`. */
            <p className={css.sinClips} aria-hidden="true">
              —
            </p>
          )}
          {/* ─── LA ACCIÓN DE LA SELECCIÓN, VISIBLE ───
              Publicar estuvo sólo en el clic derecho y es la lección ya
              aprendida en el vault: un menú contextual no anuncia nada.
              El patrón de referencia es el panel derecho de Figma —una
              zona que muestra las acciones de lo elegido— pero UNA
              acción no paga una superficie nueva, así que la zona nace
              adentro de la sidebar que ya existe: aparece con la
              selección, debajo del índice que la nombra. El día que las
              acciones de selección se acumulen, este bloque es el que
              se muda al inspector (queda en el README como pendiente).

              A 16 del índice —el aire de GRUPO del sistema, el doble
              del 8 entre renglones— para que no se lea como un frame
              más: los renglones son sustantivos y esto es un verbo. El
              clic derecho sigue ofreciéndola, como atajo. */}
          {frameElegido && frameElegido.tipo !== 'pieza' && (
            <button className={css.publicar} onClick={() => setPublicando(frameElegido)}>
              Add to Exhibition
            </button>
          )}
        </div>

        {/* ─── EL PIE: LO QUE SE LLEVA TODO ───
            "Delete view" vive solo, al fondo. En esta casa no hay
            colores de estado —ni un rojo en todo el producto— así que la
            protección de la única acción destructiva se pone en el
            ESPACIO: toda la columna de distancia entre ella y lo que se
            usa todo el tiempo. Con la confirmación que pide después, son
            dos capas: llegar hasta acá, y decir que sí. */}
        <div className={css.panelPie}>
          <button className={css.accion} onClick={() => setBorrando(true)}>
            Delete view
          </button>
          {/* LA CUENTA YA NO SE VE: el índice de arriba ES la cuenta
              para quien mira. Pero sigue en el DOM, recortada con la
              receta de .oculto del vault, porque `aria-live` es la ÚNICA
              confirmación de que un Backspace borró algo sin puntero.
              Antes era visible y se apagaba con display:none en ≤560,
              o sea que en ese ancho borrar no se anunciaba — quedaba
              anotado como deuda. Recortada en vez de apagada, anuncia en
              todos los anchos. `polite` para no interrumpir. */}
          <p className={css.cuenta} aria-live="polite">
            {cuenta}
          </p>
        </div>
      </aside>

      <div
        className={css.tela}
        ref={tela}
        /* El contenedor del rol `option` de cada frame. Sin él los
           frames serían opciones sin lista y `aria-selected` no
           significaría nada. */
        role="listbox"
        aria-label="Canvas"
        aria-multiselectable={false}
        /* EL VACÍO DESELECCIONA. Va en pointerdown y no en click porque
           es la misma fase en la que un frame se selecciona: con los dos
           en la misma fase, empezar un arrastre y terminarlo sobre la
           tela no puede deseleccionar lo que acabás de mover. */
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) elegir(null)
        }}
      >
        {dibujo.map((f) => (
          <Marco
            key={f.id}
            frame={f}
            clip={clips?.find((c) => c.ruta === f.ref) ?? null}
            /* El mismo nombre que se ve: el del clip si está, y el que
               tenía si ya no está. Nunca la ruta cruda. */
            etiqueta={f.tipo === 'pieza' ? f.ref : nombreDeRuta(f.ref)}
            sabido={clips !== null}
            elegido={elegido === f.id}
            nuevo={aparecidos.includes(f.id)}
            saliendo={yendose === f.id}
            capa={capas.get(f.id) ?? 0}
            medirTela={medirTela}
            onElegir={elegir}
            onMover={mover}
            onMedida={medida}
            onMenu={(id, x, y) => {
              const frame = vista.frames.find((f) => f.id === id)
              if (frame) setMenuFrame({ frame, donde: { x, y } })
            }}
          />
        ))}
      </div>

      {/* El menú del frame y el diálogo de publicar. framePub es el
          último frame sobre el que se abrió algo — sobrevive al cierre
          para que la salida tenga qué animar. */}
      {framePub && (
        <>
          <Menu
            donde={menuFrame?.donde ?? null}
            etiqueta={framePub.tipo === 'pieza' ? framePub.ref : nombreDeRuta(framePub.ref)}
            onCerrar={() => setMenuFrame(null)}
            items={[
              /* Sólo lo publicable: un boceto o un clip. Un frame de
                 pieza ya está publicado — su menú no ofrece nada aún. */
              ...(framePub.tipo !== 'pieza'
                ? [{ texto: 'Add to Exhibition', hacer: () => setPublicando(framePub) }]
                : []),
            ]}
          />
          <DialogoPublicar
            abierto={publicando?.id === framePub.id}
            nombreInicial={
              framePub.tipo === 'boceto'
                ? nombreDeBoceto(framePub.ref)
                : nombreDeRuta(framePub.ref)
            }
            /* La oración dice a dónde va el archivo, que es lo único que
               cambia entre las dos ramas. */
            dice={
              framePub.tipo === 'boceto'
                ? 'The sketch joins the product and the piece goes live as Web.'
                : 'The recording joins the repo and the piece goes live as App.'
            }
            hacer={(nombre, desc) =>
              framePub.tipo === 'boceto'
                ? publicarBoceto(framePub.ref, nombre, desc)
                : publicarClip(framePub.ref, nombre, desc)
            }
            onCerrar={() => setPublicando(null)}
          />
        </>
      )}

      <Elegir
        abierto={eligiendo}
        clips={clips ?? []}
        onElegir={agregar}
        onBoceto={(ref) => poner('boceto', ref, null)}
        onNuevoBoceto={nuevoBoceto}
        onCerrar={() => setEligiendo(false)}
      />

      <DialogoBorrarVista
        vista={vista}
        abierto={borrando}
        onCerrar={() => setBorrando(false)}
        onBorrar={() => {
          borrar(vista.id)
          history.length > 1 ? history.back() : ir('/playground')
        }}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   QUÉ CLIP AGREGAR — el diálogo.

   Es el <dialog> del vault, la misma clase y por lo tanto la misma
   receta: showModal, foco atrapado, Escape, ::backdrop, y la salida con
   `overlay`/`display` en allow-discrete más @starting-style. Lo único
   propio es el ancho y la grilla de adentro.

   ELEGÍS MIRANDO, no leyendo una lista de nombres de archivo: es la
   misma decisión que hace que el diálogo de subir muestre las dos cards
   en vez de preguntar "¿native o web?" a secas.
   ═══════════════════════════════════════════════════════════════ */

/* LA PROPORCIÓN SE MIDE DEL ELEMENTO QUE ESTÁS MIRANDO. La miniatura ya
   cargó —está en pantalla— así que su tamaño natural es un hecho
   disponible en el mismo evento del clic, sin ningún pedido de red y sin
   esperar a que el frame monte. Si todavía no cargó devuelve null y el
   frame nace provisional. */
function medirOpcion(el: HTMLElement) {
  const m = el.querySelector('video, img')
  if (m instanceof HTMLVideoElement) return desdeMedida(m.videoWidth, m.videoHeight)
  if (m instanceof HTMLImageElement) return desdeMedida(m.naturalWidth, m.naturalHeight)
  return null
}

function Elegir({
  abierto,
  clips,
  onElegir,
  onBoceto,
  onNuevoBoceto,
  onCerrar,
}: {
  abierto: boolean
  clips: Clip[]
  onElegir: (c: Clip, m: { ancho: number; alto: number } | null) => void
  onBoceto: (ref: string) => void
  onNuevoBoceto: () => void
  onCerrar: () => void
}) {
  const caja = useRef<HTMLDialogElement | null>(null)
  /* La grilla se monta la PRIMERA vez que se abre y ya no se
     desmonta. Las dos razones son opuestas y las dos importan: montada
     desde el arranque, trece videos pedirían sus metadatos cada vez que
     abrís un lienzo aunque nunca toques "Add clip"; desmontada al
     cerrar, el diálogo se vacía en el primer cuadro de la salida y lo
     que se ve irse es una caja en blanco. */
  const [montada, setMontada] = useState(false)

  /* LOS DOS EFECTOS SON DE LAYOUT, y de eso depende que no se vea el
     anillo azul del sistema. `showModal()` enfoca el PROPIO <dialog>
     cuando nada adentro pide el foco, y un <dialog> enfocado dibuja el
     anillo alrededor de sus 936px — la crítica lo capturó en dos temas.
     Con efectos de layout, montar la grilla y mover el foco a la primera
     opción pasan los dos antes de que el navegador pinte, así que el
     anillo nunca llega a existir. Con `useEffect` habría un cuadro con
     el diálogo entero enmarcado.
     Es la misma solución que los diálogos del vault, que enfocan su
     campo de texto: en un diálogo, el foco arranca DENTRO. */
  useLayoutEffect(() => {
    const d = caja.current
    if (!d) return
    if (abierto) setMontada(true)
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])

  useLayoutEffect(() => {
    if (!abierto || !montada) return
    caja.current?.querySelector<HTMLElement>('button')?.focus()
  }, [abierto, montada])

  return (
    <dialog
      className={`${dlg.dialogo} ${css.elegir}`}
      ref={caja}
      /* El clic afuera cierra. Elegir un clip es la decisión más
         liviana de la app —no borra ni escribe nada— así que salirse
         tiene que costar lo mismo que entrar. Lo hace el navegador con
         `closedby="any"`, que dispara `close` y sale por el mismo
         onClose que Escape. */
      closedby="any"
      onClose={onCerrar}
    >
      {/* "Add" y no "Add clip": desde que también se agregan bocetos, el
          título nombraba una de las dos cosas que hay adentro. */}
      <h2 className={css.elegirTitulo}>Add</h2>
      {montada && (
        <>
          <div className={css.grilla}>
            {/* ─── EMPEZAR UN COMPONENTE DESDE CERO ───
                Va PRIMERO y con la misma caja que todo lo demás: es una
                opción más de la grilla, no un botón aparte, así que no
                hay una segunda geometría que decidir. El + adentro del
                hueco del medio ocupa el lugar de la miniatura, que es
                exactamente lo que esta opción no tiene todavía.

                Crea el archivo y lo pone en la tela. No pregunta el
                nombre: es la regla que ya usa "New view" — un modal
                antes de ver nada te obliga a bautizar algo que todavía
                no existe. */}
            <button className={`${dlg.card} ${css.opcion}`} onClick={onNuevoBoceto}>
              <div className={css.opcionCaja}>
                <Mas />
              </div>
              <div className={dlg.titulo}>New sketch</div>
            </button>
            {/* Los que ya escribiste. Sin miniatura: dibujar el boceto
                acá adentro lo montaría trece veces por abrir el diálogo,
                y un componente a medias puede hacer cualquier cosa. La
                palabra dice qué es. */}
            {BOCETOS.map((ref) => (
              <button
                className={`${dlg.card} ${css.opcion}`}
                key={ref}
                onClick={() => onBoceto(ref)}
              >
                <div className={css.opcionCaja}>Sketch</div>
                <div className={dlg.titulo}>{nombreDeBoceto(ref)}</div>
              </button>
            ))}
            {clips.map((c) => (
              /* ─── ES LA CARD DEL VAULT, NO UNA MINIATURA PROPIA ───
                 Las mismas clases: su proporción (550/528, la de benji),
                 su radio, su fondo, su hover y su rótulo. Y sobre todo
                 su `data-fuente`, que es lo que hace que un clip de
                 teléfono entre ENTERO con el aire proporcional y una
                 grabación de pantalla llene la caja.

                 Acá había una caja 16/9 con `cover`, y recortaba: de los
                 13 clips del vault, 5 son verticales y en el diálogo
                 quedaban como rectángulos casi vacíos —la crítica midió
                 que escondía el 74% de la imagen—. Elegir un clip
                 mirándolo deja de funcionar cuando lo que mostrás no es
                 el clip.

                 El problema ya estaba resuelto del otro lado, y con una
                 decisión medida: la card de benji es casi cuadrada
                 JUSTAMENTE porque aguanta las dos orientaciones. Reusarla
                 es heredar esa decisión en vez de tomar otra peor. */
              <button
                className={`${dlg.card} ${css.opcion}`}
                key={c.ruta}
                data-fuente={c.fuente ?? undefined}
                onClick={(e) => onElegir(c, medirOpcion(e.currentTarget))}
              >
                <div className={dlg.media}>
                  {c.clase === 'video' ? (
                    <video src={primerCuadro(c.url)} preload="metadata" muted playsInline />
                  ) : (
                    <img src={c.url} alt="" loading="lazy" />
                  )}
                </div>
                <div className={dlg.titulo}>{c.nombre}</div>
              </button>
            ))}
          </div>
          {/* El aviso queda DEBAJO de la grilla y ya no la reemplaza: con
              el vault vacío igual se puede empezar un boceto, así que
              cambiar la grilla entera por un renglón de texto escondería
              la única acción disponible. */}
          {clips.length === 0 && <p className={css.aviso}>Nothing in the vault yet.</p>}
        </>
      )}
    </dialog>
  )
}
