import { useEffect, useRef, useState } from "react";
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

export type Donde = { x: number; y: number } | null;

/* Dónde se abre el menú. Si no entra hacia abajo o hacia la derecha, se
   da vuelta — y el ORIGEN DE LA ESCALA se da vuelta con él, para que
   siga creciendo desde el punto donde apretaste y no desde una esquina
   que quedó del otro lado. */
function ubicar(d: { x: number; y: number }, ancho: number, alto: number) {
  const margen = 8;
  const derecha = d.x + ancho + margen > window.innerWidth;
  const abajo = d.y + alto + margen > window.innerHeight;
  return {
    left: derecha ? Math.max(margen, d.x - ancho) : d.x,
    top: abajo ? Math.max(margen, d.y - alto) : d.y,
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
export function Menu({
  donde,
  etiqueta,
  items,
  onCerrar,
}: {
  donde: Donde;
  /* Para quien lo escucha en vez de verlo: sobre qué se abrió. */
  etiqueta: string;
  items: [string, () => void][];
  onCerrar: () => void;
}) {
  const caja = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ left: 0, top: 0, origen: "top left" });

  /* Se mide DESPUÉS de montar y antes de pintar: el alto depende de
     cuántos ítems tenga, y sin eso no se sabe si entra hacia abajo. */
  useEffect(() => {
    const el = caja.current;
    if (!el || !donde) return;
    const r = el.getBoundingClientRect();
    setPos(ubicar(donde, r.width, r.height));
  }, [donde]);

  /* Cerrar con Escape, con un clic afuera, y al scrollear: un menú
     anclado a un punto de la pantalla que se queda mientras el
     contenido se mueve deja de estar anclado a nada. */
  useEffect(() => {
    if (!donde) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    const fuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) onCerrar();
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

  if (!donde) return null;

  return (
    <div
      ref={caja}
      className={css.menu}
      data-abierto=""
      role="menu"
      aria-label={etiqueta}
      style={{ left: pos.left, top: pos.top, transformOrigin: pos.origen }}
    >
      {items.map(([et, hacer]) => (
        <button
          key={et}
          className={css.item}
          role="menuitem"
          onClick={() => {
            onCerrar();
            hacer();
          }}
        >
          {et}
        </button>
      ))}
    </div>
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
  onPlayground: () => void;
  onRenombrar: () => void;
  onPapelera: () => void;
}) {
  /* EL ORDEN ES POR CONSECUENCIA, de la más liviana a la más pesada:
     mandar el clip a un lienzo no lo toca, renombrarlo cambia el
     archivo, y la papelera se lo lleva. Así lo destructivo queda
     siempre último y lejos del cursor cuando el menú se abre hacia
     abajo. */
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
        ["Open in playground", onPlayground],
        ["Rename", onRenombrar],
        ["Move to Trash", onPapelera],
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
  return (
    <dialog
      className={`${dlg.dialogo} ${css.corto}`}
      ref={ref}
      onClose={onCerrar}
    >
      {abierto && children}
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

export function DialogoPapelera({
  clip,
  abierto,
  onCerrar,
  onListo,
}: {
  clip: Clip;
  abierto: boolean;
  onCerrar: () => void;
  onListo: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [yendo, setYendo] = useState(false);
  useEffect(() => {
    if (abierto) setError(null);
  }, [abierto]);

  const mandar = async () => {
    if (yendo) return;
    setYendo(true);
    setError(null);
    try {
      await aPapelera(clip.ruta);
      onListo();
      onCerrar();
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setYendo(false);
    }
  };

  return (
    <Dialogo abierto={abierto} onCerrar={onCerrar}>
      <h2 className={css.titulo}>Move “{clip.nombre}” to Trash?</h2>
      {/* Se dice a dónde va, porque eso es lo que hace la diferencia
          entre una decisión reversible y una que no. */}
      <p className={css.dice}>
        It goes to your system Trash, so you can put it back from Finder. Its
        notes are removed from the vault.
      </p>
      {error && <p className={css.error}>{error}</p>}
      <div className={css.pie}>
        <button className={css.accion} onClick={onCerrar}>
          Cancel
        </button>
        <button
          className={css.accion}
          data-fuerte=""
          disabled={yendo}
          onClick={mandar}
        >
          Move to Trash
        </button>
      </div>
    </Dialogo>
  );
}
