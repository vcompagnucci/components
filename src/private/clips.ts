import { useCallback, useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   LOS CLIPS — lo que el puente encuentra en tu carpeta.

   El servidor devuelve HECHOS DEL SISTEMA DE ARCHIVOS y nada más: qué
   es, cuánto pesa, cuándo entró. Acá se le da SIGNIFICADO, y todo lo
   que se deriva sale del archivo mismo. No hay una base de datos ni un
   JSON que mantener a mano: soltás el clip en la carpeta y aparece.

     el nombre     sale del nombre del archivo
     nativo o web  sale de en qué carpeta lo soltaste
     la fecha      sale del sistema de archivos

   Eso es a propósito. Un manifiesto escrito a mano se desincroniza el
   día que arrastrás un archivo sin acordarte de editarlo, y entonces el
   vault miente. Acá no puede: la carpeta ES el manifiesto.
   ═══════════════════════════════════════════════════════════════ */

/* Lo que manda el servidor, tal cual. */
export type ClipCrudo = {
  ruta: string;
  archivo: string;
  carpeta: string;
  ext: string;
  clase: "video" | "imagen";
  bytes: number;
  creado: string;
  modificado: string;
  /* Leídos del contenedor por el puente. Van en null cuando es una
     imagen o cuando el archivo no se pudo parsear, y hay que
     contemplarlo: sin cuadro exacto el paso con las flechas deja de ser
     un cuadro y pasa a ser una estimación, y entonces contar cuadros
     para sacar una duración no sirve. Ver scripts/cuadros.mjs. */
  cuadro: number | null;
  fps: number | null;
  cuadros: number | null;
  cuadroVariable: boolean | null;
  /* LO QUE ESCRIBÍS VOS sobre el clip. Va en null cuando no escribiste
     nada — no en un objeto vacío— porque el servidor borra la ficha
     entera si vaciás todos los campos.

     El servidor lo viene mandando desde que existe el endpoint y acá
     NO estaba declarado, así que el dato llegaba al navegador y se
     tiraba en silencio: el `.map` de abajo copia lo que conoce y esto
     no estaba en la lista. Media función perdida por un campo faltante
     en un tipo. */
  ficha: Ficha | null;
};

/* Los tres campos, y son los mismos que valida el servidor. Si acá se
   agrega uno, allá hay que agregarlo a FICHA_CAMPOS o se descarta al
   guardar sin decir nada. */
export type Ficha = {
  notes?: string;
  source?: string;
  device?: string;
};

export type Fuente = "native" | "web";

/* Lo que usa la interfaz. */
export type Clip = ClipCrudo & {
  nombre: string;
  fuente: Fuente | null;
  fecha: Date;
  url: string;
};

export type Estado =
  | { cargando: true }
  | { cargando: false; conectado: false; motivo: string }
  | { cargando: false; conectado: true; carpeta: string; clips: Clip[] };

/* "sheet-que-se-estira" → "Sheet que se estira".

   Sólo la primera en mayúscula, no cada palabra: un nombre de clip es
   una frase —"Sheet que se estira al arrastrar"— y no un título. Es lo
   que hacen las dos referencias con los suyos. */
const aFrase = (s: string) => {
  const limpio = s.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return limpio ? limpio[0].toUpperCase() + limpio.slice(1) : s;
};

/* "web/sheet-que-se-estira.png" → "Sheet que se estira".

   ES LA MISMA CUENTA QUE `nombre`, pero partiendo de la ruta en vez del
   índice, y existe para UN caso: el lienzo del playground guarda en cada
   frame la RUTA del clip, así que cuando el archivo ya no está —lo
   renombraste, lo mandaste a la papelera— lo único que queda para
   mostrar es esa ruta. Y una ruta cruda en pantalla es un dato de disco,
   no un nombre.

   Con esto el clip que falta se sigue llamando como se llamaba. */
export const nombreDeRuta = (ruta: string) =>
  aFrase((ruta.split("/").pop() ?? ruta).replace(/\.[^.]+$/, ""));

/* La carpeta clasifica. El primer nivel y nada más: "native/2026/x.mp4"
   sigue siendo native. Lo que no cae en ninguna queda sin clasificar en
   vez de inventarle una — así se ve que hay un clip suelto en la raíz y
   se puede acomodar.

   Se aceptan LAS DOS ORTOGRAFÍAS, "native" y "nativo". La interfaz está
   en inglés, pero la carpeta la nombrás vos en tu disco —y si el vault
   es tu Obsidian, puede llamarse como ya se llamaba—. Que la app te
   obligue a renombrar una carpeta tuya para poder leerla sería el
   sentido equivocado de la dependencia. */
const CARPETAS: Record<string, Fuente> = {
  native: "native",
  nativo: "native",
  web: "web",
};

const fuenteDe = (carpeta: string): Fuente | null =>
  CARPETAS[carpeta.split("/")[0].toLowerCase()] ?? null;

/* SUBIR UN CLIP. Los bytes van crudos en el cuerpo y los metadatos en
   la query: `fetch` acepta un File como body y lo manda en streaming, así
   que un video de 400MB no pasa por memoria de este lado tampoco.

   La fuente es la CARPETA donde cae, que es lo mismo que dice si el clip
   es nativo o web. Por eso al soltar hay que elegir una: no se adivina
   mirando la forma del video. */
export async function subirClip(
  archivo: File,
  fuente: Fuente,
): Promise<string> {
  const q = new URLSearchParams({ fuente, nombre: archivo.name });
  const r = await fetch(`/vault-media/__subir?${q}`, {
    method: "POST",
    body: archivo,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error ?? `error ${r.status}`);
  return d.ruta as string;
}

/* GUARDAR UNA FICHA. Devuelve la que quedó — que puede ser null, si
   vaciaste todos los campos. */
export async function guardarFicha(
  ruta: string,
  ficha: Ficha,
): Promise<Ficha | null> {
  const r = await fetch("/vault-media/__ficha", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ruta, ficha }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error ?? `error ${r.status}`);
  return d.ficha ?? null;
}

/* PUBLICAR una grabación como pieza App. Se dispara desde el TABLERO
   —el clic derecho sobre el frame— porque publicar es el final del
   taller, no un gesto del vault. El servidor copia el video a
   public/piezas/ y anota la entrada en pieces.ts, las dos cosas o
   ninguna. Devuelve el slug, que es a dónde navegar: la pieza ya está
   en la exhibition. */
export async function publicarClip(
  ruta: string,
  nombre: string,
  desc: string,
): Promise<string> {
  const r = await fetch("/vault-media/__publicar", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tipo: "clip", ruta, nombre, desc }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error ?? `error ${r.status}`);
  return d.slug as string;
}

/* RENOMBRAR. El servidor sólo acepta un nombre PARA LEER: la extensión
   la pone él, copiándola del archivo, así que renombrar no puede
   cambiar el tipo. Devuelve la ruta nueva, que es distinta — la ruta ES
   el nombre. */
export async function renombrarClip(
  ruta: string,
  nombre: string,
): Promise<string> {
  const r = await fetch("/vault-media/__renombrar", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ruta, nombre }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error ?? `error ${r.status}`);
  return d.ruta as string;
}

/* A LA PAPELERA, no borrar. El servidor mueve el archivo a la papelera
   del sistema en vez de hacer unlink: desde una app de estudio un
   borrado no tiene undo que lo salve, y así se recupera desde Finder. */
export async function aPapelera(ruta: string): Promise<void> {
  const r = await fetch("/vault-media/__papelera", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ruta }),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d?.error ?? `error ${r.status}`);
  }
}

/* ─── LA TARJETA DE UN LINK ───
   El título y el favicon de una URL pegada en una nota. Lo busca el
   servidor porque desde el navegador no se puede: leer github.com por
   fetch choca contra CORS. El porqué completo, las guardas y el orden
   de ícono medido están en scripts/tarjeta-link.mjs.

   NUNCA TIRA. Un link que no se pudo resolver igual se dibuja y se
   abre — con el host como etiqueta— así que acá el fracaso vuelve como
   null y no como excepción: no hay ninguna decisión que tomar con el
   motivo, y obligar a cada llamador a envolver esto en un try sería
   pedir ceremonia por algo que ya tiene respuesta. */
export type Tarjeta = {
  titulo: string | null;
  icono: string | null;
  /* A dónde llegó después de los redirects. Sirve para NOMBRAR un
     acortador —un t.co de X no dice nada— y nunca para navegar: el
     ancla siempre apunta a lo que escribiste. */
  final: string | null;
};

export async function tarjetaDeLink(url: string): Promise<Tarjeta | null> {
  try {
    const r = await fetch(`/vault-media/__link?url=${encodeURIComponent(url)}`);
    const d = await r.json();
    if (!r.ok) return null;
    return {
      titulo: d?.titulo ?? null,
      icono: d?.icono ?? null,
      final: d?.final ?? null,
    };
  } catch {
    return null;
  }
}

export function useClips() {
  const [estado, setEstado] = useState<Estado>({ cargando: true });
  /* Se incrementa para volver a pedir el índice. Es lo que hace aparecer
     un clip recién subido sin recargar la página. */
  const [ronda, setRonda] = useState(0);

  useEffect(() => {
    let vivo = true;
    fetch("/vault-media/__indice")
      .then((r) => r.json())
      .then((d) => {
        if (!vivo) return;
        if (!d.conectado) {
          setEstado({ cargando: false, conectado: false, motivo: d.motivo });
          return;
        }
        const clips: Clip[] = d.clips.map((c: ClipCrudo) => ({
          ...c,
          nombre: aFrase(c.archivo),
          fuente: fuenteDe(c.carpeta),
          fecha: new Date(c.creado),
          url:
            "/vault-media/" +
            c.ruta.split("/").map(encodeURIComponent).join("/"),
        }));
        /* De la más reciente a la menos, que es el orden que pediste y
           el que tienen las dos referencias. */
        clips.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
        setEstado({
          cargando: false,
          conectado: true,
          carpeta: d.carpeta,
          clips,
        });
      })
      .catch((e) => {
        if (vivo)
          setEstado({ cargando: false, conectado: false, motivo: String(e) });
      });
    return () => {
      vivo = false;
    };
  }, [ronda]);

  /* La ficha se actualiza EN EL LUGAR y no volviendo a pedir el índice
     entero: el servidor ya devolvió la que quedó, y releer 16 clips para
     cambiar tres campos de uno haría parpadear la grilla. */
  const anotar = useCallback((ruta: string, ficha: Ficha | null) => {
    setEstado((e) =>
      e.cargando || !e.conectado
        ? e
        : {
            ...e,
            clips: e.clips.map((c) => (c.ruta === ruta ? { ...c, ficha } : c)),
          },
    );
  }, []);

  return { estado, recargar: () => setRonda((n) => n + 1), anotar };
}

/* Hubo acá un formateador de fecha —"Aug 18, 2026", el de las dos
   referencias— y se fue con el epígrafe: la card muestra sólo el
   nombre. `fecha` se queda igual porque sigue ORDENANDO la grilla, de
   la más reciente a la menos; lo que ya no existe es mostrarla. */
