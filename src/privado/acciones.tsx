import { Fragment, useEffect, useRef, useState } from "react";
import css from "./acciones.module.css";
import dlg from "./vault.module.css";
import { aPapelera, renombrarClip, type Clip } from "./clips";

/* ═══════════════════════════════════════════════════════════════
   RENOMBRAR Y MANDAR A LA PAPELERA, con el clic derecho.

   Antes de esto las dos cosas vivían en el Finder. La señal de que
   faltaban era literal: en una captura del detalle se veía el tooltip
   de "click to rename" del SISTEMA OPERATIVO encima del video.

   BORRAR MUEVE A LA PAPELERA. Ver el endpoint __papelera: desde una app
   de estudio un unlink no tiene undo que lo salve.
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   DE DÓNDE SALE UN MENÚ — las dos formas, y por qué son dos.

   El clic derecho lo abre en un PUNTO: el menú aparece donde apretaste
   y no hay nada más a lo que engancharse.

   El ··· de la barra lo abre desde un BOTÓN, y ahí el punto no alcanza:
   un popover tiene que crecer desde su disparador y quedar alineado con
   él, no con el píxel exacto donde cayó el cursor adentro del botón.

   Están escritas como dos casos y no como uno con un rectángulo de
   tamaño cero a propósito: el hueco al disparador es 4 y el hueco al
   cursor es 0, así que colapsarlas obligaría a un parámetro más para
   distinguir justo lo que las distingue.
   ═══════════════════════════════════════════════════════════════ */
export type Donde =
  | { x: number; y: number }
  /* `alinear` es POR QUÉ BORDE se pega el menú al botón. El ··· vive
     contra el riel derecho, así que su menú se alinea a la derecha y
     cae para adentro; alineado a la izquierda se saldría de la página. */
  | { ancla: DOMRect; alinear: 'izq' | 'der' }
  | null;

/* ═══════════════════════════════════════════════════════════════
   MIENTRAS ALGO SE VA, TODAVÍA HAY QUE SABER QUÉ ERA.

   Todas las salidas del área privada estaban escritas y NINGUNA corría.
   Medido cuadro a cuadro: el menú desaparecía del DOM en el primer
   cuadro después del clic, y el diálogo pasaba de opacity 1 a no
   existir. Los 120ms del menú y los 180 del diálogo nunca existieron.

   La causa no estaba en el CSS —que está bien— sino en quién lo
   monta. La capa de menús y diálogos se renderiza sólo si hay sujeto:

     const sujeto = menu?.clip ?? renombrando ?? borrando
     const capa = sujeto ? (<><Menu …/><Dialogo …/></>) : null

   y el sujeto se vuelve null EXACTAMENTE en el instante en que la
   salida tendría que empezar. React arranca el nodo, y un nodo que no
   está no puede animarse. Es la misma trampa que ya había resuelto a
   mano el diálogo de subir, con su lista `mostrados`: "lo último que
   hubo se queda hasta que llegue otra cosa".

   Esto es esa idea, una sola vez y para todos: devuelve lo que hay, y
   si no hay nada, lo último que hubo. El sujeto sobrevive a su propia
   salida y recién ahí se puede animar.

   Se ajusta el estado DURANTE el render —el patrón que documenta React
   para derivar de props— y no en un efecto: en un efecto habría un
   cuadro con el sujeto ya en null, que es el respingo que venimos a
   sacar.

   LO QUE LE ENTRA TIENE QUE SER ESTABLE ENTRE RENDERS mientras no
   cambie de verdad: compara por identidad. Un valor que viene de
   useState —que es el caso de los tres que lo usan— lo es. Un objeto
   armado en el render no, y ahí React corta con "Too many re-renders";
   falla fuerte y a la vista, no en silencio. */
export function useUltimo<T>(v: T | null | undefined): T | null {
  const [ultimo, setUltimo] = useState<T | null>(v ?? null);
  if (v != null && v !== ultimo) setUltimo(v);
  return v ?? ultimo;
}

/* Dónde se abre el menú. Si no entra hacia abajo o hacia la derecha, se
   da vuelta — y el ORIGEN DE LA ESCALA se da vuelta con él, para que
   siga creciendo desde el punto donde apretaste y no desde una esquina
   que quedó del otro lado.

   Las dos formas de `Donde` se resuelven acá y en ningún otro lado: el
   que llama pasa de dónde salió y no dónde va. */
const MARGEN = 8;
/* Lo que separa el menú de su disparador. Es el mismo hueco con el que
   el selector de Device se despega de su valor, en ficha.tsx. */
const HUECO = 4;

/* ─── SE ALINEA LA TINTA, NO LA CAJA ───
   El menú se pegaba al borde del disparador y se veía corrido. Medido:
   el título arranca en 208, el menú en 208 — y el TEXTO del primer ítem
   en 222. Los 14 son el relleno del menú más el del ítem, o sea blanco
   que el ojo no cuenta pero el layout sí.

   Es exactamente el error que ya arreglan .play con su margen negativo y
   el chevron del título con el suyo: "lo que el ojo alinea es la TINTA".
   Acá el número no se escribe, se mide del DOM, así que si mañana cambia
   el relleno del ítem esto se corrige solo. */
function sangriaDe(menu: HTMLElement): number {
  const item = menu.querySelector<HTMLElement>('[role="menuitem"]');
  if (!item) return 0;
  return item.offsetLeft + parseFloat(getComputedStyle(item).paddingLeft);
}

function ubicar(d: NonNullable<Donde>, ancho: number, alto: number, sangria = 0) {
  if ("ancla" in d) {
    const r = d.ancla;
    /* Debajo del botón; si no entra, arriba. Alineado por el borde que
       pidió el llamador, y descontando la sangría para que lo que quede
       a plomo sea el texto. */
    const arriba = r.bottom + HUECO + alto + MARGEN > window.innerHeight;
    const izquierda =
      d.alinear === "der" ? r.right - ancho + sangria : r.left - sangria;
    return {
      left: Math.max(MARGEN, Math.min(izquierda, window.innerWidth - MARGEN - ancho)),
      top: arriba ? Math.max(MARGEN, r.top - HUECO - alto) : r.bottom + HUECO,
      /* EL ORIGEN TAMBIÉN VA SOBRE LA TINTA. El menú escala desde su
         disparador —lo piden /animate y /apple-design— y el disparador
         es la palabra, no el blanco que la rodea. Sin esto crecería
         desde una esquina 14px afuera del título.

         EL ORDEN ES `x y` Y NO AL REVÉS. La primera versión decía
         `top 14px` y era DECLARACIÓN INVÁLIDA: cuando uno de los dos
         valores no es palabra clave, el primero tiene que ser el
         horizontal, y `top` no lo es. El navegador la descartaba entera
         y el origen volvía al default. */
      origen: `${d.alinear === "der" ? ancho - sangria : sangria}px ${
        arriba ? "bottom" : "top"
      }`,
    };
  }
  const derecha = d.x + ancho + MARGEN > window.innerWidth;
  const abajo = d.y + alto + MARGEN > window.innerHeight;
  return {
    left: derecha ? Math.max(MARGEN, d.x - ancho) : d.x,
    top: abajo ? Math.max(MARGEN, d.y - alto) : d.y,
    origen: `${abajo ? "bottom" : "top"} ${derecha ? "right" : "left"}`,
  };
}

/* ═══════════════════════════════════════════════════════════════
   EL MENÚ, SIN SABER SOBRE QUÉ SE ABRIÓ.

   Acá vive TODO lo que hace que un menú flotante sea un menú flotante:
   dónde se ubica, hacia dónde se da vuelta cuando no entra, desde qué
   esquina crece, y las tres formas de cerrarlo. Lo que NO sabe es qué
   dicen sus ítems ni sobre qué objeto son — eso lo pone el que lo usa.

   Se separó cuando apareció el segundo cliente: el clic derecho sobre
   una card del PLAYGROUND quiere el mismo menú con otras dos palabras.
   Copiarlo habría dejado dos superficies que se parecen hasta el día en
   que una se toque.
   ═══════════════════════════════════════════════════════════════ */
/* Un ítem del menú. `destructivo` no es sólo un color: además de pintar
   el ítem en --destructivo, hace que el menú le ponga una hairline
   delante. Las dos cosas son la misma decisión —ver .item[data-
   destructivo] en acciones.module.css— así que se piden juntas con una
   sola bandera y no con dos. */
export type ItemMenu = {
  texto: string;
  hacer: () => void;
  destructivo?: boolean;
};

export function Menu({
  donde,
  etiqueta,
  items,
  onCerrar,
}: {
  donde: Donde;
  /* Para quien lo escucha en vez de verlo: sobre qué se abrió. */
  etiqueta: string;
  items: ItemMenu[];
  onCerrar: () => void;
}) {
  const caja = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ left: 0, top: 0, origen: "top left" });

  /* Se mide DESPUÉS de montar y antes de pintar: el alto depende de
     cuántos ítems tenga, y sin eso no se sabe si entra hacia abajo.

     CON offsetWidth/Height Y NO CON getBoundingClientRect: el menú en
     reposo está en scale(0.96), y el rect devuelve la caja YA ESCALADA
     —un 4% chico—. Con el menú del clic derecho casi no se notaba
     porque su borde izquierdo es el cursor y no se resta nada; el de la
     barra se alinea restando el ancho al borde del botón, así que ahí el
     4% son 7px de menú colgando afuera. Medido.

     offsetWidth es de layout: ignora los transforms por definición, así
     que no hay que apagar nada ni forzar un reflow para leerlo. */
  useEffect(() => {
    const el = caja.current;
    if (!el || !donde) return;
    setPos(ubicar(donde, el.offsetWidth, el.offsetHeight, sangriaDe(el)));
  }, [donde]);

  /* Cerrar con Escape, con un clic afuera, y al scrollear: un menú
     anclado a un punto de la pantalla que se queda mientras el
     contenido se mueve deja de estar anclado a nada. */
  useEffect(() => {
    if (!donde) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    const fuera = (e: MouseEvent) => {
      const t = e.target as Element;
      /* EL DISPARADOR NO CUENTA COMO AFUERA. Sin esto, apretar el ···
         con el menú abierto lo cierra en el pointerdown y el click que
         viene atrás lo vuelve a abrir: se cierra y se abre en el mismo
         gesto, y a la vista no pasa nada. El toggle es del click del
         disparador; este handler mira el resto de la página.

         Es la misma línea que ya tenía el selector de Device en
         ficha.tsx, con el otro rol de popup. El clic derecho no tiene
         disparador, así que para él esto no existe. */
      if (t.closest?.('[aria-haspopup="menu"]')) return;
      if (!caja.current?.contains(t)) onCerrar();
    };
    document.addEventListener("keydown", tecla);
    document.addEventListener("pointerdown", fuera, true);
    window.addEventListener("scroll", onCerrar, true);
    window.addEventListener("resize", onCerrar);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.removeEventListener("pointerdown", fuera, true);
      window.removeEventListener("scroll", onCerrar, true);
      window.removeEventListener("resize", onCerrar);
    };
  }, [donde, onCerrar]);

  /* NO SE DESMONTA AL CERRAR: se apaga. Antes era `if (!donde) return
     null` y por eso los 120ms de salida que están escritos en el CSS no
     corrían nunca —el nodo ya no estaba—. Ahora el que manda es
     `data-abierto`, que es contra lo que el CSS ya estaba escrito.
     `pos` no se toca al cerrar (el efecto de arriba sale temprano si no
     hay `donde`), así que el menú se va desde donde estaba y no salta
     a la esquina. */
  return (
    <div
      ref={caja}
      className={css.menu}
      data-abierto={donde ? "" : undefined}
      role="menu"
      aria-label={etiqueta}
      style={{ left: pos.left, top: pos.top, transformOrigin: pos.origen }}
    >
      {items.map((it) => (
        /* El Fragment existe para la hairline: es hermana del ítem, no
           parte de él, porque separa DOS ítems y no pertenece a
           ninguno. Con un ::before adentro del botón el hover la
           pintaría también. */
        <Fragment key={it.texto}>
          {it.destructivo && <div className={css.regla} aria-hidden="true" />}
          <button
            className={css.item}
            role="menuitem"
            data-destructivo={it.destructivo ? "" : undefined}
            onClick={() => {
              onCerrar();
              it.hacer();
            }}
          >
            {it.texto}
          </button>
        </Fragment>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EL ↗ DE LA BARRA — la única acción del clip que se promueve a ícono.

   Las tres cosas que se pueden hacer con un clip vivían sólo en el clic
   derecho, o sea que no existían: un menú contextual no anuncia nada,
   hay que saber que está. Dos de las tres se resolvieron poniendo el
   menú en el título; ésta sube a control permanente.

   ─── POR QUÉ ÉSTA Y NO OTRA ───
   Es la única que no es sobre la identidad ni la existencia del
   archivo: renombrar y la papelera son del documento, y por eso viven
   en su menú. Ésta te LLEVA a otro lado, y además es la única de las
   tres que no tiene consecuencia — mandarla mil veces no rompe nada.
   Un ícono permanente es para lo que se aprieta sin pensar.

   ─── EL BORDE FINAL ───
   Al lado del toggle del inspector, y no es una lectura nuestra: la HIG
   de Apple lista qué vive ahí —Toolbars › Item groupings, "Trailing
   edge"—, los ítems importantes que tienen que seguir disponibles y los
   botones que abren inspectores cercanos. Las dos cosas que hay ahí
   están en esa oración, y son además las únicas que NO se colapsan al
   menú de desborde cuando la ventana se achica.

   El toggle va último, contra el riel: la misma página ancla el de
   sidebar al "far leading edge", y éste es su espejo. Y es el que se
   aprieta repetido, así que es el que no puede moverse de lugar.

   ─── EL DIBUJO ───
   arrow.up.forward.square: una caja abierta por la esquina y una flecha
   que se va. Dice las dos cosas que hace la acción — llevar el clip y
   llevarte a vos. Sin borde alrededor, que es lo que pide la HIG porque
   la sección ya hace de contenedor.
   ═══════════════════════════════════════════════════════════════ */
export function BotonPlayground({ onIr }: { onIr: () => void }) {
  return (
    <button
      className={css.disparador}
      aria-label="Open in playground"
      title="Open in playground"
      onClick={onIr}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <g
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 9.25v2.25A1.5 1.5 0 0 1 11.5 13h-7A1.5 1.5 0 0 1 3 11.5v-7A1.5 1.5 0 0 1 4.5 3H6.75" />
          <path d="M9.75 3H13v3.25" />
          <path d="M13 3 8.25 7.75" />
        </g>
      </svg>
    </button>
  );
}

export function MenuClip({
  clip,
  donde,
  onCerrar,
  onPlayground,
  onRenombrar,
  onPapelera,
}: {
  clip: Clip;
  donde: Donde;
  onCerrar: () => void;
  /* OPCIONAL, y su ausencia es la que saca el ítem. No hay un booleano
     aparte porque serían dos verdades sobre lo mismo: si no hay a quién
     llamar, no hay nada que ofrecer.

     Quién no lo pasa: el detalle, donde mandar al playground ya es un
     botón permanente de la barra —ver BotonPlayground—. Repetirlo en el
     menú sería ofrecer dos veces lo mismo a diez píxeles de distancia.
     La grilla sí lo pasa: ahí no hay barra, y el clic derecho es el
     único camino. */
  onPlayground?: () => void;
  onRenombrar: () => void;
  onPapelera: () => void;
}) {
  /* EL ORDEN ES POR CONSECUENCIA, de la más liviana a la más pesada:
     mandar el clip a un lienzo no lo toca, renombrarlo cambia el
     archivo, y la papelera se lo lleva. Así lo destructivo queda
     siempre último y lejos del cursor cuando el menú se abre hacia
     abajo. La hairline que lo separa la pone el Menu, por la bandera.

     ADD TO LIBRARY NO ESTÁ, y estuvo: publicar vivió un día en este
     menú y se movió al tablero. El vault es lo EXTERNO —referencias que
     mirás— y publicar es el final del taller, así que el gesto vive
     donde está tu trabajo: el clic derecho sobre un frame del
     playground. Ver DialogoPublicar, abajo. */
  return (
    <Menu
      donde={donde}
      etiqueta={clip.nombre}
      onCerrar={onCerrar}
      items={[
        /* "Open in playground" y no "Add to playground": lo que hace de
           verdad es LLEVARTE ahí, con el clip ya puesto. Prometer sólo
           la mitad del gesto haría que la navegación se sintiera un
           salto que no pediste. */
        ...(onPlayground
          ? [{ texto: "Open in Playground", hacer: onPlayground }]
          : []),
        /* SIN ELIPSIS, Y ES UNA DIVERGENCIA CONSCIENTE.
           Menus › Labels la pide: "Append an ellipsis to a menu item's
           label when the action requires more information before it can
           complete". Renombrar abre un diálogo que pide el nombre, así
           que le correspondería.

           Se retira igual, por decisión del dueño (2026-08-25). Lo que
           la elipsis compra —avisar que va a hacer falta un paso más—
           acá vale poco: este menú tiene DOS ítems y los dos son
           evidentes, así que el signo agrega ruido tipográfico sin
           resolver ninguna duda.

           Queda anotado porque es lo único de esta barra que sabemos
           que se aparta de la HIG a propósito, junto con nada más. */
        { texto: "Rename", hacer: onRenombrar },
        { texto: "Move to Trash", hacer: onPapelera, destructivo: true },
      ]}
    />
  );
}

/* Un <dialog> nativo: el foco atrapado, Escape, el fondo inerte y el
   ::backdrop salen gratis. La animación es la misma del diálogo de
   subir — overlay y display con allow-discrete más @starting-style.

   Exportado por la misma razón que Menu: los diálogos de la vista del
   playground son esta caja con otro contenido adentro. La superficie
   vive acá; lo que dice, en cada uno. */
export function Dialogo({
  abierto,
  onCerrar,
  children,
}: {
  abierto: boolean;
  onCerrar: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);
  /* Lo que el diálogo DICE también tiene que sobrevivir a su salida.
     Con `{abierto && children}` el contenido se iba en el primer cuadro
     y la caja se desvanecía vacía: 180ms de tarjeta en blanco. */
  const dentro = useUltimo(abierto ? children : null);

  return (
    <dialog
      className={`${dlg.dialogo} ${css.corto}`}
      ref={ref}
      /* CLIC AFUERA CIERRA. Es el light dismiss del navegador
         —`closedby="any"`, Chrome 134 / Safari 26 / Firefox 141— y no
         un listener nuestro: la plataforma ya sabe que un clic que
         EMPIEZA afuera y TERMINA afuera cierra, y que uno que empieza
         adentro y se arrastra afuera (seleccionar texto hasta pasarse
         del borde) no. Escrito a mano eso siempre sale mal.

         Y cierra por el mismo camino que Escape y que el botón Cancel:
         dispara `close`, que es lo que escucha onClose. Una sola salida
         para las cuatro formas de cerrar, y la animación es la misma
         para todas. */
      closedby="any"
      onClose={onCerrar}
    >
      {dentro}
    </dialog>
  );
}

export function DialogoRenombrar({
  clip,
  abierto,
  onCerrar,
  onListo,
}: {
  clip: Clip;
  abierto: boolean;
  onCerrar: () => void;
  onListo: (ruta: string) => void;
}) {
  const [nombre, setNombre] = useState(clip.archivo);
  const [error, setError] = useState<string | null>(null);
  const [yendo, setYendo] = useState(false);
  useEffect(() => {
    if (abierto) {
      setNombre(clip.archivo);
      setError(null);
    }
  }, [abierto, clip.archivo]);

  const guardar = async () => {
    if (yendo) return;
    setYendo(true);
    setError(null);
    try {
      onListo(await renombrarClip(clip.ruta, nombre));
      onCerrar();
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setYendo(false);
    }
  };

  return (
    <Dialogo abierto={abierto} onCerrar={onCerrar}>
      <h2 className={css.titulo}>Rename clip</h2>
      {/* La extensión no se muestra ni se edita: la pone el servidor
          copiándola del archivo, así que renombrar no puede cambiar el
          tipo. Enseñar un campo que no hace nada sería mentir. */}
      <p className={css.dice}>
        The file keeps its {clip.ext.replace(".", "")} extension.
      </p>
      <input
        className={css.campo}
        value={nombre}
        autoFocus
        aria-label="New name"
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && guardar()}
      />
      {error && <p className={css.error}>{error}</p>}
      <div className={css.pie}>
        <button className={css.accion} onClick={onCerrar}>
          Cancel
        </button>
        <button
          className={css.accion}
          data-fuerte=""
          disabled={yendo || !nombre.trim() || nombre === clip.archivo}
          onClick={guardar}
        >
          Rename
        </button>
      </div>
    </Dialogo>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PUBLICAR — la parte de "esto ya está" del recorrido.

   Vive en el TABLERO, no en el vault: el vault es lo externo —lo que
   mirás— y lo que se publica es lo tuyo, que es lo que está en el
   playground. El clic derecho sobre un frame ofrece Add to Library, y
   qué pieza sale lo dice el frame: un boceto publica Web viva, una
   grabación publica App. Por eso NO hay selector de plataforma.

   El formulario es el molde de la pieza y nada más: nombre y una línea
   de descripción, exactamente los dos renglones del detalle público. El
   nombre llega puesto —el del boceto o el del clip—; la descripción
   arranca vacía a propósito, es el único dato que el archivo no sabe de
   sí mismo.

   AL TERMINAR TE LLEVA A LA PIEZA. No hay toast en este sistema; la
   confirmación es la página real de la library con el demo andando.
   Navegación dura a propósito: pieces.ts acaba de cambiar en el disco
   y recargar es la forma de que TODOS los módulos la vean, sin
   depender de en qué orden llegue el hot update.

   Este componente no sabe QUÉ publica: recibe el verbo por prop, como
   Menu recibe sus ítems. Lo que cambia entre las dos ramas —el endpoint
   y la oración que anticipa qué va a pasar— lo pone el tablero. */
export function DialogoPublicar({
  abierto,
  nombreInicial,
  dice,
  hacer,
  onCerrar,
}: {
  abierto: boolean;
  nombreInicial: string;
  /* La oración bajo el título: qué va a pasar, dicho antes. */
  dice: string;
  hacer: (nombre: string, desc: string) => Promise<string>;
  onCerrar: () => void;
}) {
  const [nombre, setNombre] = useState(nombreInicial);
  const [desc, setDesc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [yendo, setYendo] = useState(false);
  useEffect(() => {
    if (abierto) {
      setNombre(nombreInicial);
      setDesc("");
      setError(null);
    }
  }, [abierto, nombreInicial]);

  const listo = !yendo && !!nombre.trim() && !!desc.trim();
  const publicar = async () => {
    if (!listo) return;
    setYendo(true);
    setError(null);
    try {
      const slug = await hacer(nombre.trim(), desc.trim());
      location.assign("/" + slug);
    } catch (e) {
      setError(String((e as Error).message));
      setYendo(false);
    }
  };

  return (
    <Dialogo abierto={abierto} onCerrar={onCerrar}>
      <h2 className={css.titulo}>Add to Library</h2>
      <p className={css.dice}>{dice}</p>
      <input
        className={css.campo}
        value={nombre}
        autoFocus
        aria-label="Piece name"
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && publicar()}
      />
      {/* La descripción es el subtítulo del detalle, y el placeholder
          empuja hacia la regla del copy del sistema: decir qué es o
          para quién es, nunca lo bien hecha que está. */}
      <input
        className={css.campo}
        value={desc}
        aria-label="Description"
        placeholder="What it does"
        onChange={(e) => setDesc(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && publicar()}
      />
      {error && <p className={css.error}>{error}</p>}
      <div className={css.pie}>
        <button className={css.accion} onClick={onCerrar}>
          Cancel
        </button>
        <button className={css.accion} data-fuerte="" disabled={!listo} onClick={publicar}>
          Add
        </button>
      </div>
    </Dialogo>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MANDAR A LA PAPELERA — SIN PREGUNTAR.

   ─── ACÁ HABÍA UNA CONFIRMACIÓN Y SE RETIRÓ ───
   Era un <dialog> con "Move «X» to Trash?" y sus dos botones. Lo tira
   abajo Alerts › Best practices, que es explícito y usa NUESTRO caso de
   ejemplo: no muestres un alert para acciones destructivas COMUNES Y
   REVERSIBLES — su ejemplo es borrar un archivo, porque la gente lo hace
   con la intención de descartar y lo puede deshacer.

   El clip va a la papelera del SISTEMA (ver el endpoint __papelera): no
   se pierde, se mueve. La premisa se cumple, y la pregunta era un peaje
   sin causa.

   Y LA ADVERTENCIA NO DESAPARECIÓ, CAMBIÓ DE MOMENTO: antes llegaba
   después del clic; ahora llega antes, porque el ítem se ve rojo en el
   menú. Eso es lo que hace que sacar el diálogo no sea sacar el aviso.

   ─── LO QUE NO ES CEREMONIA Y SE QUEDA ───
   El error. La misma página dice que un alert SÍ sirve para contar un
   problema, y aPapelera puede fallar —permisos, el archivo movido por
   abajo, el servidor caído—. Sin esto un fallo sería silencioso, que es
   peor que preguntar de más: creerías que borraste algo que sigue ahí.

   Por eso lo que queda NO es el diálogo de confirmación con otro texto:
   es otra cosa, con un solo botón y sin decisión que tomar.

   ─── DÓNDE NOS QUEDAMOS CORTOS, DICHO ───
   El criterio de Apple es "¿lo pueden deshacer?", y acá se deshace en
   el FINDER, no en la app. El patrón completo sería borrar sin preguntar
   Y ofrecer un undo adentro — que hoy no tiene dónde vivir, porque este
   sistema no tiene toast ni barra de estado. Cuando exista esa
   superficie, éste es su primer cliente.
   ═══════════════════════════════════════════════════════════════ */
export function AvisoPapelera({
  error,
  onCerrar,
}: {
  error: string | null;
  onCerrar: () => void;
}) {
  return (
    <Dialogo abierto={!!error} onCerrar={onCerrar}>
      {/* EL TÍTULO DICE QUÉ PASÓ, no "Error": la HIG pide describir la
          situación y advierte contra los títulos que no informan nada
          —"Error", "Error 329347 occurred"—. */}
      <h2 className={css.titulo}>Couldn't move the clip to Trash</h2>
      <p className={css.dice}>{error}</p>
      <div className={css.pie}>
        {/* Un solo botón, y dice Done y no OK: la HIG pide Done cuando
            hay una sola salida y nada que decidir. */}
        <button className={css.accion} data-fuerte="" onClick={onCerrar}>
          Done
        </button>
      </div>
    </Dialogo>
  );
}

/* El gesto en sí. Vive acá y no en el vault porque es de este archivo
   —lo que se puede hacer con un clip— y porque el que llama sólo
   necesita saber una cosa: si hubo error. Nunca tira. */
export async function mandarAPapelera(clip: Clip): Promise<string | null> {
  try {
    await aPapelera(clip.ruta);
    return null;
  } catch (e) {
    return String((e as Error).message);
  }
}
