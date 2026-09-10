import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import css from "./details.module.css";
import menu from "./actions.module.css";
import { guardarFicha, type Clip, type Ficha } from "./clips";
import { Enlace } from "./link";
import { partir, type Tramo } from "./links";

/* ═══════════════════════════════════════════════════════════════
   LA FICHA TÉCNICA. Siempre visible, cuatro datos, editar es tocar y
   escribir. Ver ficha.module.css para por qué ya no se pliega.
   ═══════════════════════════════════════════════════════════════ */

/* Las cuatro clases de dispositivo. Es un SELECTOR y no un campo libre
   porque el dato sirve para filtrar y comparar, y "iPhone", "iphone" y
   "mobile" a mano son tres valores distintos que significan lo mismo. */
/* ─── EL RESORTE ───
   El de siempre: bounce 0 —críticamente amortiguado, sin impulso que
   devolver porque el disparador es un botón— y 0.35 de respuesta. Un
   resorte arranca del valor ACTUAL, así que revertir a mitad de camino
   es continuo. Lo usan el panel y el relleno del glifo, para que los
   dos se lean como una sola cosa. */
export const RESORTE = { type: "spring" as const, bounce: 0, duration: 0.35 };

/* ─── EL GLIFO DEL PANEL ───
   Un rectángulo con el tercio derecho separado: es la pantalla, y ese
   tercio es la ficha. Se rellena cuando está abierta. Sin rotación y
   sin espejo — un relleno que sube y baja no tiene ningún cuadro
   intermedio que pueda leerse mal. 16×16 y trazo 1.5, las medidas del
   + de la grilla. */
export function BotonFicha({
  abierta,
  onToggle,
}: {
  abierta: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={css.boton}
      onClick={onToggle}
      aria-expanded={abierta}
      aria-label={abierta ? "Hide details" : "Show details"}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="2"
          y="3"
          width="12"
          height="10"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {/* De filo interno a filo interno: el color es semitransparente
            y donde el divisor se metía en el trazo el alfa se sumaba. */}
        <path d="M9.5 3.75V12.25" stroke="currentColor" strokeWidth="1.5" />
        {/* El relleno TRAZA el compartimento con el radio interno del
            marco (2.5 − 0.75 de medio trazo): un rect suelto dejaba
            muescas donde cortaba la curva. */}
        <motion.path
          d="M10.25 3.75 H11.5 A1.75 1.75 0 0 1 13.25 5.5 V10.5 A1.75 1.75 0 0 1 11.5 12.25 H10.25 Z"
          fill="currentColor"
          /* Mismo motivo que la hoja: al montar el ícono tiene que
             aparecer ya en su estado, no vaciarse a la vista. */
          initial={false}
          animate={{ opacity: abierta ? 1 : 0 }}
          transition={RESORTE}
        />
      </svg>
    </button>
  );
}

const DISPOSITIVOS = [
  "Mobile web",
  "Mobile app",
  "Desktop web",
  "Desktop app",
] as const;

/* Si lo que escribiste en Source es una URL, se puede abrir. */
const esLink = (v: string) => /^https?:\/\//i.test(v.trim());

/* ─── GUARDAR ───
   Escribís y se guarda solo: 400ms sin teclear, el mismo debounce que
   las vistas del playground. Y se descarga al desmontar, porque cerrar
   el detalle es exactamente cuando estás por perder lo último. */
const ESPERA = 400;

function useGuardado(
  clip: Clip,
  anotar: (ruta: string, f: Ficha | null) => void,
) {
  const [local, setLocal] = useState<Ficha>(clip.ficha ?? {});
  const reloj = useRef<number | null>(null);
  const ultima = useRef<{ ruta: string; ficha: Ficha } | null>(null);

  /* Cambiar de clip descarta el borrador anterior: son fichas de
     archivos distintos y mezclarlas sería escribir en el equivocado. */
  useEffect(() => {
    setLocal(clip.ficha ?? {});
  }, [clip.ruta, clip.ficha]);

  const mandar = () => {
    const p = ultima.current;
    if (!p) return;
    ultima.current = null;
    guardarFicha(p.ruta, p.ficha)
      .then((q) => anotar(p.ruta, q))
      .catch(() => {
        /* Lo escrito se queda en pantalla: perder texto por un fallo de
           red sería peor que quedar desincronizado un rato. */
      });
  };

  useEffect(() => {
    return () => {
      if (reloj.current) window.clearTimeout(reloj.current);
      mandar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambiar = (f: Ficha) => {
    setLocal(f);
    ultima.current = { ruta: clip.ruta, ficha: f };
    if (reloj.current) window.clearTimeout(reloj.current);
    reloj.current = window.setTimeout(mandar, ESPERA);
  };

  return [local, cambiar] as const;
}

/* ═══════════════════════════════════════════════════════════════
   LA NOTA — se lee con los links dibujados, se edita en texto plano.

   ─── POR QUÉ HAY DOS VISTAS Y NO UN EDITOR RICO ───
   Un textarea no puede dibujar nada: es texto plano y punto. Para que
   un link se vea como un link había dos caminos, y el otro era un
   contentEditable — o sea un editor de texto rico, con su modelo de
   documento, su manejo de IME, su pila de deshacer propia y su forma
   nueva de romperse al pegar. Para un campo de notas de tres renglones
   eso es traer un submarino a un charco.

   Acá la nota SIGUE SIENDO UN STRING en todos lados —en el disco, en
   la ficha, en el textarea— y lo que cambia es cómo se dibuja cuando
   no la estás editando. No hay un segundo modelo que pueda quedar
   desincronizado, porque no hay un segundo modelo.

   ─── EL INTERCAMBIO SÓLO EXISTE SI HAY UN LINK ───
   Sin links, esto es exactamente el textarea de siempre. Es la
   propiedad que hace la función barata: el 90% de las notas no cambia
   de comportamiento ni de árbol.

   ─── EDITAR ES TOCAR Y ESCRIBIR, TAMBIÉN ACÁ ───
   Tocar la vista de lectura abre el editor CON EL CURSOR DONDE
   TOCASTE, no al final. Sin esa cuenta, corregir una palabra en el
   medio de una nota obliga a navegar con las flechas desde el final, y
   eso se siente como que el campo te pelea.
   ═══════════════════════════════════════════════════════════════ */

/* Chrome y Firefox tienen caretPositionFromPoint; Safari sólo tiene el
   caretRangeFromPoint viejo. Los dos contestan lo mismo —qué nodo de
   texto y en qué carácter cayó un punto de la pantalla— con dos formas
   distintas. */
type ConCaret = Document & {
  caretPositionFromPoint?: (
    x: number,
    y: number,
  ) => { offsetNode: Node; offset: number } | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
};

function caracterEn(x: number, y: number): { nodo: Node; offset: number } | null {
  const d = document as ConCaret;
  const p = d.caretPositionFromPoint?.(x, y);
  if (p) return { nodo: p.offsetNode, offset: p.offset };
  const r = d.caretRangeFromPoint?.(x, y);
  if (r) return { nodo: r.startContainer, offset: r.startOffset };
  return null;
}

/* De un punto de la pantalla al índice en el texto CRUDO.

   La traducción hace falta porque las dos vistas no miden lo mismo: un
   link de 101 caracteres se dibuja como una etiqueta de 14, así que el
   carácter 12 de lo que ves no es el carácter 12 de lo que hay. Cada
   tramo lleva su `desde` —su posición en el crudo— y cada <span> lleva
   su índice, así que la cuenta es una suma y no una estimación.

   Cuando el clic no cae sobre ningún tramo —el aire a la derecha del
   último renglón, que es donde uno hace clic para "entrar" a un campo—
   el cursor va al final, que es exactamente lo que se espera ahí. */
function posicionDe(
  e: React.MouseEvent<HTMLElement>,
  tramos: Tramo[],
  largo: number,
): number {
  const p = caracterEn(e.clientX, e.clientY);
  if (!p) return largo;
  const desde =
    p.nodo.nodeType === Node.TEXT_NODE
      ? p.nodo.parentElement
      : (p.nodo as Element);
  const caja = desde?.closest<HTMLElement>("[data-tramo]");
  if (!caja) return largo;
  const t = tramos[Number(caja.dataset.tramo)];
  if (!t) return largo;
  return t.desde + Math.min(p.offset, t.texto.length);
}

function Nota({
  valor,
  onValor,
}: {
  valor: string;
  onValor: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [editando, setEditando] = useState(false);
  /* Dónde arranca el cursor al abrir el editor. null = al final. */
  const cursor = useRef<number | null>(null);

  const tramos = useMemo(() => partir(valor), [valor]);
  const conLinks = tramos.some((t) => t.tipo === "link");
  const leyendo = conLinks && !editando;

  /* La nota crece con lo que escribís: describir un gesto no entra en
     un alto fijo de tres líneas. Corre también al entrar en edición,
     porque ahí el textarea acaba de montarse con el texto ya adentro y
     todavía mide un renglón. */
  useEffect(() => {
    const el = ref.current;
    if (!el || leyendo) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [valor, leyendo]);

  /* El foco y el cursor se ponen DESPUÉS de montar el textarea, que es
     cuando existe. Va en un efecto y no en el manejador del clic por
     eso mismo: ahí todavía no hay dónde poner el cursor. */
  useEffect(() => {
    if (leyendo) return;
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    const i = cursor.current ?? valor.length;
    cursor.current = null;
    el.focus();
    el.setSelectionRange(i, i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leyendo]);

  const aEditar = (i: number | null) => {
    cursor.current = i;
    setEditando(true);
  };

  if (leyendo)
    return (
      <div
        className={`${css.nota} ${css.lectura}`}
        /* CON EL ANILLO DE FOCO PUESTO, y es una excepción razonada a
           la regla del área privada. Esa regla dice que donde se edita
           texto sin caja el anillo se apaga porque lo reemplaza el
           caret — y acá, leyendo, no hay caret que lo reemplace. La
           premisa no se cumple, así que la excepción tampoco aplica.
           Al entrar en edición el textarea sí lo apaga, como siempre. */
        tabIndex={0}
        role="group"
        aria-label="Notes — press Enter to edit"
        onClick={(e) => {
          /* Arrastrar para seleccionar y copiar NO abre el editor: si
             hay algo seleccionado, el gesto era otro. Sin esto, copiar
             un pedazo de la nota la reemplazaba por su versión cruda a
             mitad del gesto. */
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed) return;
          aEditar(posicionDe(e, tramos, valor.length));
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          /* Enter ABRE, no escribe: el salto de línea lo pone el
             textarea recién cuando está adentro. */
          e.preventDefault();
          aEditar(null);
        }}
      >
        {tramos.map((t, i) =>
          t.tipo === "link" ? (
            <Enlace key={i} url={t.url} />
          ) : (
            /* data-tramo es lo que hace posible devolver el cursor al
               carácter que tocaste. Ver posicionDe. */
            <span key={i} data-tramo={i}>
              {t.texto}
            </span>
          ),
        )}
      </div>
    );

  return (
    <textarea
      ref={ref}
      className={css.nota}
      value={valor}
      placeholder="—"
      aria-label="Notes"
      rows={1}
      onChange={(e) => onValor(e.target.value)}
      /* Salir del campo vuelve a lectura. Si no hay ningún link, esto
         no cambia nada visible: `leyendo` sigue siendo false. */
      onBlur={() => setEditando(false)}
    />
  );
}

/* ─── EL SELECTOR DE DEVICE ───
   La misma superficie flotante que el menú del clic derecho —la única
   caja del área privada— con su misma entrada: escala desde la esquina
   del valor que lo abrió, 0.96 → 1, nada aparece de la nada. Escape,
   clic afuera y scroll lo cierran, igual que el menú. */
function Selector({
  valor,
  onElegir,
  onCerrar,
  ancla,
}: {
  valor: string;
  onElegir: (v: string) => void;
  onCerrar: () => void;
  ancla: DOMRect;
}) {
  const caja = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{
    left: number;
    top: number;
    origen: string;
  } | null>(null);

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    /* Debajo del valor y alineado a su derecha; si no entra, arriba. El
       origen de la escala acompaña, para crecer desde el valor. */
    const abajo = ancla.bottom + 4 + r.height > window.innerHeight - 8;
    setPos({
      left: Math.max(8, ancla.right - r.width),
      top: abajo ? ancla.top - 4 - r.height : ancla.bottom + 4,
      origen: `${abajo ? "bottom" : "top"} right`,
    });
  }, [ancla]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    const fuera = (e: MouseEvent) => {
      const t = e.target as Node;
      /* El disparador NO cuenta como afuera. Sin esto, apretar el valor
         con la lista abierta la cerraba en el pointerdown y el click
         que venía atrás la volvía a abrir: se cerraba y se abría en el
         mismo gesto. El toggle es del click del disparador; este
         handler sólo mira el resto de la página. */
      if ((t as Element).closest?.('[aria-haspopup="listbox"]')) return;
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
  }, [onCerrar]);

  /* "—" sólo cuando hay algo elegido: sin valor no hay nada que
     limpiar, y una opción muerta es ruido. */
  const opciones = valor ? ["—", ...DISPOSITIVOS] : [...DISPOSITIVOS];

  return (
    <div
      ref={caja}
      className={menu.menu}
      data-abierto=""
      role="listbox"
      aria-label="Device"
      style={
        pos
          ? { left: pos.left, top: pos.top, transformOrigin: pos.origen }
          : { visibility: "hidden", left: 0, top: 0 }
      }
    >
      {opciones.map((o) => {
        const elegida = o === valor;
        return (
          <button
            key={o}
            className={`${menu.item} ${css.opcion}`}
            role="option"
            aria-selected={elegida}
            autoFocus={elegida || (o === opciones[0] && !valor)}
            onClick={() => {
              onElegir(o === "—" ? "" : o);
              onCerrar();
            }}
          >
            {o}
            {elegida && <span className={css.elegido} aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

export function FichaTecnica({
  clip,
  abierta,
  anotar,
}: {
  clip: Clip;
  abierta: boolean;
  anotar: (ruta: string, f: Ficha | null) => void;
}) {
  const [ficha, cambiar] = useGuardado(clip, anotar);
  const [selector, setSelector] = useState<DOMRect | null>(null);
  const source = ficha.source ?? "";

  return (
    <div className={css.hoja}>
      {/* LO ÚNICO QUE SE ANIMA AL PLEGAR: la ficha funde y se corre 8px
          — crossfade con insinuación de dirección, no un barrido, porque
          los valores van contra el borde y un recorte los come primero.
          El clip no participa: su espacio está reservado siempre.
          `inert` apaga foco y punteros del panel oculto de una vez. */}
      <motion.div
        /* `initial={false}` porque al ENTRAR al clip la ficha tiene que
           estar ya donde va, no animarse hasta ahí. Sin esto motion toma
           el estilo pintado —opacidad 1, sin correr— como punto de
           partida y se veía la ficha abrirse y cerrarse sola: 365 ms
           medidos. Plegarla a mano sigue animando igual. */
        initial={false}
        animate={{ opacity: abierta ? 1 : 0, x: abierta ? 0 : 8 }}
        transition={RESORTE}
        inert={!abierta}
      >
        <div className={css.tabla}>
          {/* De dónde salió la animación. Texto libre —robinhood, apple—
            y si pegás la URL, la flecha la abre: tocar el texto edita,
            así que navegar tiene su propio blanco. */}
          <div className={css.fila}>
            <span className={css.rotulo}>Source</span>
            <input
              className={`${css.valor} ${css.campo}`}
              value={source}
              placeholder="—"
              aria-label="Source"
              onChange={(e) => cambiar({ ...ficha, source: e.target.value })}
            />
            {esLink(source) && (
              <a
                className={css.abrir}
                href={source.trim()}
                target="_blank"
                rel="noreferrer"
                aria-label="Open source"
              >
                ↗
              </a>
            )}
          </div>

          <div className={css.fila}>
            <span className={css.rotulo}>Device</span>
            <button
              className={`${css.valor} ${css.disparador}`}
              {...(ficha.device ? {} : { "data-vacio": "" })}
              aria-label="Device"
              aria-haspopup="listbox"
              aria-expanded={!!selector}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setSelector((s) => (s ? null : r));
              }}
            >
              {/* Un popup DICE que es un popup: palabra cuando está vacío
                —no un guion, que es un dato ausente, y esto es una
                acción— y el chevron que anuncia la lista, colgado en el
                margen como el ↗ de Source para no romper la columna. */}
              {ficha.device || "Choose"}
              <span className={css.indicador} aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6.5 4.5L10 8l-3.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </div>
          {/* POR PORTAL, a body. Adentro de la tabla su div —aunque es
            position:fixed— se metía entre la fila de Device y el bloque
            de Notes y rompía los selectores de hermanos que reparten
            los márgenes: al abrir el menú la ficha se recomponía. Un
            popup no puede vivir en el flujo de lo que tapa. */}
          {selector &&
            createPortal(
              <Selector
                valor={ficha.device ?? ""}
                ancla={selector}
                onCerrar={() => setSelector(null)}
                onElegir={(v) => cambiar({ ...ficha, device: v })}
              />,
              document.body,
            )}

          <div className={css.bloque}>
            <span className={css.rotulo}>Notes</span>
            <Nota
              valor={ficha.notes ?? ""}
              onValor={(v) => cambiar({ ...ficha, notes: v })}
            />
          </div>

          {/* Del archivo, no tuyo: no se edita. */}
          <div className={`${css.fila} ${css.pie}`}>
            <span className={css.rotulo}>Added</span>
            <span className={css.valor}>
              {clip.fecha.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
