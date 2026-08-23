import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { createPortal } from "react-dom";
import css from "./vault.module.css";
import { Volver, clicDeLink } from "../parts";
import { Reproductor } from "./reproductor";
import { useClips, subirClip, type Clip, type Fuente } from "./clips";
import { BotonFicha, FichaTecnica } from "./ficha";
import {
  DialogoPapelera,
  DialogoRenombrar,
  MenuClip,
  type Donde,
} from "./acciones";

/* ═══════════════════════════════════════════════════════════════
   EL VAULT — la pared de referencias.

   La card es la de benji en family-values, medida y horneada. El
   porqué de cada número está en vault.module.css y lo medido en
   .context/recon/vault/GRILLA.md.

   EL CLIP ABIERTO VIVE EN LA URL, no en un useState. Estaba en estado
   local y eso producía un bug que se sentía como un error del
   navegador: abrías un clip, hacías el gesto de atrás en el trackpad, y
   en vez de cerrarlo te sacaba del vault entero. Ahora /vault/<ruta> es
   una entrada de historial de verdad, así que atrás cierra el clip —
   y de paso cada referencia queda linkeable.
   ═══════════════════════════════════════════════════════════════ */

/* El valor es DATO —"native" y "web" son las carpetas del vault— y la
   etiqueta es lo que se lee. Separados porque no tienen por qué
   coincidir, y de hecho no coinciden: el filtro "all" no es una
   carpeta. */
const FILTROS = [
  { valor: "all", etiqueta: "All" },
  { valor: "native", etiqueta: "Native" },
  { valor: "web", etiqueta: "Web" },
] as const;
type Filtro = (typeof FILTROS)[number]["valor"];

/* ─── POR QUÉ EL FILTRO VIVE EN LA BARRA ───
   Antes había DOS FILAS —las solapas arriba, el filtro abajo— y se
   leían como lo mismo dos veces: los dos eran texto suelto, del mismo
   peso, con el mismo par gris → activo, y a 13 contra 14 la diferencia
   de tamaño no se ve.

   Se fue a buscar cómo lo resuelven las referencias y la respuesta fue
   que NO LO TIENEN: en 7 páginas, benji nunca tiene más de una nav por
   página y josh tampoco, y ninguno usa tabs ni pills como navegación
   (los 25 tabs y 21 pills de /pasito son de un demo embebido, no de su
   chrome). Lo evitan en vez de resolverlo.

   El único que lo tiene es linear en /now, y su mecanismo es doble: su
   nav es una BANDA física —fixed, 73px, backdrop blur(20), border-bottom
   de 1px— y su título mide 48 contra los 16 del filtro. Tres veces. Sus
   filtros, para que quede dicho, son TEXTO PELADO: radio 0, sin fondo,
   sin padding, así que las pills tampoco salen de ahí.

   Y eso nombra la causa de fondo: las dos referencias que resuelven
   esto lo resuelven con un TAMAÑO, y nuestro sistema tiene uno solo.

   LA SALIDA ELEGIDA, mirando cuatro: una sola fila con uno en cada
   punta. Deja de haber dos filas parecidas porque deja de haber dos
   filas, y la POSICIÓN hace todo el trabajo — a la izquierda dónde
   estás, a la derecha qué estás filtrando. Sin tocar la escala.

   Se descartaron: la banda de linear, el título grande (que habría
   abierto la escala tipográfica), y las pills. */

/* El primer cuadro y nada más. Un <video> con preload="metadata" no
   decodifica ninguna imagen y la caja queda negra; el fragmento #t=
   obliga al navegador a buscar ahí y pintar ESE cuadro. 0.1 y no 0
   porque en 0 algunos contenedores todavía no tienen un cuadro clave. */
const primerCuadro = (url: string) => `${url}#t=0.1`;

/* LA MISMA LISTA BLANCA QUE EL SERVIDOR, escrita para el selector de
   archivos: filtra lo que se puede elegir en vez de dejarte elegir un
   .md y rebotarlo después.

   Está repetida a propósito y no importada: el servidor vive en
   scripts/ y no puede publicar nada al bundle sin arrastrarse a
   producción. Si acá se agrega una extensión, allá hay que agregarla a
   TIPOS o el servidor la rechaza. */
const ACEPTA = ".mp4,.m4v,.mov,.webm,.png,.jpg,.jpeg,.webp,.avif,.gif";

/* El + dibujado, no escrito. Dos trazos, currentColor, y trazo de 1.5
   porque "el ícono lleva el peso óptico del texto que tiene al lado:
   1.5px junto a regular".

   ES SVG Y NO EL CARÁCTER "+", y eso no es capricho: un glifo se apoya en
   la línea de base, así que dentro de un círculo nunca queda centrado.
   Medido: así el trazo cae a 0.00px del centro de la caja.

   `linecap: round` porque el resto del sistema no tiene una sola esquina
   viva. */
/* El + dibujado, no escrito. Dos trazos, currentColor, y el mismo grosor
   que el peso del texto de al lado. `linecap: round` porque el resto del
   sistema no tiene una sola esquina viva. */
function Mas() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 3.5v9M3.5 8h9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* La ruta de un clip, codificada segmento por segmento: encodeURI
   entero dejaría pasar un "#" o un "?" en el nombre del archivo y
   partiría la URL. */
export const rutaDeClip = (ruta: string) =>
  "/vault/" + ruta.split("/").map(encodeURIComponent).join("/");

function Tarjeta({
  clip,
  onAbrir,
  onMenu,
}: {
  clip: Clip;
  onAbrir: (c: Clip) => void;
  onMenu: (c: Clip, d: { x: number; y: number }) => void;
}) {
  const video = useRef<HTMLVideoElement | null>(null);

  /* EL CLIP SE REPRODUCE AL PASAR EL PUNTERO. Medido en linear.app/now,
     que es lo mismo que hace benji con sus 53 videos de family-values —
     él los arranca al entrar en pantalla, linear al hover.

     Su comportamiento exacto, los cuatro puntos:

       en reposo       paused, mostrando el primer cuadro
       al hover        play(), y loop
       AL SALIR        pause() y SE QUEDA donde estaba: medido en t=2.18
                       después de salir, y al volver a entrar siguió en
                       3.09. No rebobina
       reduced-motion  NO reproduce. Verificado: con la preferencia
                       puesta, su video se queda en paused t=0

     Que retome en vez de volver a cero es el detalle que vale: en una
     pared de referencias el puntero se te va todo el tiempo, y rebobinar
     te haría empezar de nuevo cada vez.

     Es también lo que convierte esto en un vault de MOVIMIENTO: sin
     esto es un álbum de primeros cuadros congelados, y lo que se viene a
     mirar acá es cómo se mueven las cosas. */
  const reduce = () =>
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  const entrar = () => {
    if (reduce()) return;
    video.current?.play().catch(() => {});
  };
  const salir = () => video.current?.pause();

  return (
    /* Es un <a href> de verdad, igual que la pieza del producto: el clic
       pelado abre el detalle, y cmd-click abre el clip en una pestaña
       nueva. Mismo interceptor.

       El disparador es la CARD entera y no el video: el hueco es de 405
       de ancho y el clip puede medir 228, así que apuntarle sólo al
       video dejaría media card muerta. */
    <a
      className={css.card}
      href={rutaDeClip(clip.ruta)}
      data-fuente={clip.fuente ?? undefined}
      onClick={clicDeLink(() => onAbrir(clip))}
      onMouseEnter={entrar}
      onMouseLeave={salir}
      /* Y también con el teclado: si podés llegar tabulando, tenés que
         poder ver lo mismo que con el puntero. */
      onFocus={entrar}
      onBlur={salir}
      /* El clic derecho abre lo que se puede HACER con el clip. Va en la
         card entera y no en el video, por lo mismo que el clic normal:
         media card quedaría muerta. */
      onContextMenu={(e) => {
        e.preventDefault();
        onMenu(clip, { x: e.clientX, y: e.clientY });
      }}
    >
      <div className={css.media}>
        {clip.clase === "video" ? (
          <video
            ref={video}
            src={primerCuadro(clip.url)}
            preload="metadata"
            muted
            loop
            playsInline
          />
        ) : (
          <img src={clip.url} alt="" loading="lazy" />
        )}
      </div>
      <div className={css.titulo}>{clip.nombre}</div>
    </a>
  );
}

/* LA GRILLA ES LA DE OPENAI /news, medida con /web-clone en once
   ventanas y verificada contra la suya en las once: tres columnas,
   canaleta 24, fila 80, riel de 32 con tope en 1440, la caja sin aire y
   el clip llenándola con `cover`.

   LO ÚNICO QUE NO SE LE COPIA SON DOS COSAS, y las dos por la misma
   razón —hay una decisión nuestra que ya estaba tomada—:

     la proporción   él usa 1/1; acá va la de la card de BENJI, 550/528,
                     que es la que está dimensionada para que un teléfono
                     entre parado con aire
     el radio        él la deja en 0; acá va --card-radio, que ya
                     gobierna la card del producto

   TODAS LAS CARDS MIDEN LO MISMO, y esa es la restricción que manda: por
   eso la proporción es una sola y no una por fuente. Adentro, cada
   fuente se comporta distinto — el teléfono va como benji, entero y con
   aire; el de web llena la card.

   Los recibos están en .context/recon/vault/grillas/ y cada número
   anotado en vault.module.css. */

export function Vault({
  abierto,
  ir,
  acciones,
}: {
  abierto: string;
  ir: (ruta: string) => void;
  /* El hueco que la barra deja para el control de la vista. Llega en
     null en el primer render, antes de que el nodo exista. */
  acciones: HTMLElement | null;
}) {
  const { estado, recargar, anotar } = useClips();
  const [filtro, setFiltro] = useState<Filtro>("all");
  const [subiendo, setSubiendo] = useState<string | null>(null);
  /* Los archivos esperando destino, vengan del + o de un arrastre. Que
     haya alguno es lo que abre el diálogo — no hay un `abierto` aparte,
     porque serían dos verdades sobre lo mismo. */
  const [pendientes, setPendientes] = useState<File[]>([]);
  const entrada = useRef<HTMLInputElement | null>(null);
  /* El menú del clic derecho y sus dos diálogos. Van ACÁ, con el resto
     de los hooks y antes del primer return condicional: ponerlos abajo
     ya rompió esta página una vez —cinco hooks al cargar y seis después
     es "Rendered more hooks than during the previous render"— y la
     grilla dejaba de dibujar. */
  /* EL CLIP ABIERTO SE DERIVA ACÁ ARRIBA, antes de los returns
     condicionales, para que ningún hook futuro quede detrás de uno —
     eso ya rompió esta página una vez.

     Si la ruta no existe —un link viejo, un archivo que mandaste a la
     papelera— queda en null y se vuelve a la grilla, en vez de dejar la
     pantalla en blanco. */
  const clip =
    !estado.cargando && estado.conectado && abierto
      ? (estado.clips.find((c) => c.ruta === abierto) ?? null)
      : null;
  /* La ficha arranca abierta: casi ningún clip tiene nada escrito, y
     cerrada de entrada no habría cómo descubrirla. Plegarla NO mueve el
     clip: su espacio queda reservado igual. */
  const [fichaAbierta, setFichaAbierta] = useState(true);
  const [menu, setMenu] = useState<{ clip: Clip; donde: Donde } | null>(null);
  const [renombrando, setRenombrando] = useState<Clip | null>(null);
  const [borrando, setBorrando] = useState<Clip | null>(null);

  if (estado.cargando) return null;

  if (!estado.conectado) {
    return (
      <div className={css.vault}>
        <p className={css.aviso}>
          Vault not connected: {estado.motivo}. Set the folder in{" "}
          <code>.env.local</code> as <code>VAULT_DIR=/path/to/your/folder</code>{" "}
          and restart the server.
        </p>
      </div>
    );
  }

  /* Después de renombrar la RUTA cambia, y la ruta es la URL: si no se
     reemplaza la entrada de historial, el detalle queda apuntando a un
     archivo que ya no existe y se vuelve solo a la grilla. */
  const trasRenombrar = (nueva: string) => {
    if (clip && abierto === clip.ruta)
      history.replaceState({}, "", rutaDeClip(nueva));
    recargar();
  };
  const trasPapelera = () => {
    if (clip && abierto === clip.ruta) history.back();
    recargar();
  };

  /* UNA sola capa para las dos vistas. El sujeto sale del estado —el
     clip sobre el que se abrió el menú, o el que está en un diálogo— así
     que la grilla y el detalle comparten el mismo código en vez de tener
     cada uno el suyo. */
  const sujeto = menu?.clip ?? renombrando ?? borrando;
  const capa = sujeto ? (
    <>
      <MenuClip
        clip={sujeto}
        donde={menu?.donde ?? null}
        onCerrar={() => setMenu(null)}
        onRenombrar={() => setRenombrando(sujeto)}
        onPapelera={() => setBorrando(sujeto)}
      />
      <DialogoRenombrar
        clip={sujeto}
        abierto={renombrando?.ruta === sujeto.ruta}
        onCerrar={() => setRenombrando(null)}
        onListo={trasRenombrar}
      />
      <DialogoPapelera
        clip={sujeto}
        abierto={borrando?.ruta === sujeto.ruta}
        onCerrar={() => setBorrando(null)}
        onListo={trasPapelera}
      />
    </>
  ) : null;

  if (clip) {
    return (
      <div
        className={css.detalle}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ clip, donde: { x: e.clientX, y: e.clientY } });
        }}
      >
        {capa}
        <div className={css.detalleCabeza}>
          {/* Atrás y ⌘Z hacen lo mismo que esta flecha porque los tres
              son history.back(): una sola forma de cerrar. */}
          <Volver onClick={() => history.back()} />
          {/* El título y el toggle comparten fila: el botón en la otra
              punta, lejos de los valores de la ficha — pegado a ellos
              fue una queja — y en el lugar clásico del inspector. */}
          <div className={css.detalleFila}>
            <h1 className={css.detalleTitulo}>{clip.nombre}</h1>
            <BotonFicha
              abierta={fichaAbierta}
              onToggle={() => setFichaAbierta((v) => !v)}
            />
          </div>
        </div>
        {/* La ficha está SIEMPRE: el espacio que devolvería al cerrarse
            no lo puede usar ningún clip —todos están atados por el
            alto— así que un toggle sólo movía las cosas de lugar y
            había que volver a abrirla cada vez. El hueco lo reserva el
            padding del escenario, en CSS. Acá no se anima nada. */}
        <div className={css.escenario}>
          {clip.clase === "video" ? (
            <Reproductor clip={clip} />
          ) : (
            <img className={css.foto} src={clip.url} alt="" />
          )}
          <FichaTecnica clip={clip} abierta={fichaAbierta} anotar={anotar} />
        </div>
      </div>
    );
  }

  const visibles = estado.clips.filter(
    (c) => filtro === "all" || c.fuente === (filtro as Fuente),
  );

  const subir = async (archivos: File[], fuente: Fuente) => {
    if (!archivos.length) return;
    /* De a uno y en orden, no en paralelo: son videos, y diez subidas
       compitiendo por el disco tardan lo mismo pero no dejan decir por
       cuál vas. */
    for (let i = 0; i < archivos.length; i++) {
      setSubiendo(
        archivos.length > 1
          ? `${archivos[i].name} · ${i + 1}/${archivos.length}`
          : archivos[i].name,
      );
      try {
        await subirClip(archivos[i], fuente);
      } catch (err) {
        setSubiendo(`${archivos[i].name} — ${String((err as Error).message)}`);
        await new Promise((r) => setTimeout(r, 2500));
      }
    }
    setSubiendo(null);
    /* Recién ahora se vuelve a pedir el índice: una vez, y no una por
       archivo. */
    recargar();
  };

  /* Sólo los ARCHIVOS. Arrastrar texto seleccionado o un link también
     dispara estos eventos, y ahí no hay nada para subir.

     preventDefault en dragover es lo que HABILITA el drop. Sin esto el
     navegador abre el archivo en la pestaña y te saca de la app. */
  const encima = (e: DragEvent) => {
    if (Array.from(e.dataTransfer?.items ?? []).some((i) => i.kind === "file"))
      e.preventDefault();
  };

  /* SOLTAR NO ELIGE CARPETA: junta los archivos y abre el diálogo, que es
     el mismo que abre el +. Los dos caminos hacen exactamente lo mismo
     desde acá en adelante, así que la pregunta vive en UN solo lugar. */
  const soltar = (e: DragEvent) => {
    e.preventDefault();
    setPendientes(Array.from(e.dataTransfer?.files ?? []));
  };

  /* Elegidos con el +: quedan esperando y abren el diálogo, igual que al
     soltar. */
  const elegidos = (lista: FileList | null) => {
    setPendientes(Array.from(lista ?? []));
    /* El input se vacía para que elegir DOS VECES EL MISMO archivo vuelva
       a disparar el change. Sin esto, cancelar una subida y reintentar
       con el mismo archivo no hace nada. */
    if (entrada.current) entrada.current.value = "";
  };

  /* EL + Y EL FILTRO VIVEN JUNTOS, en la misma punta de la barra. El
     filtro dice qué estás mirando y el + agrega a lo mismo: son la misma
     familia de control sobre el mismo conjunto.

     Es el único glifo del chrome —todo lo demás son palabras— y se
     acepta porque "+" no necesita traducción ni contexto. El aria-label
     sí es una palabra, para quien lo escucha en vez de verlo.

     VA DESPUÉS DEL FILTRO Y NO ANTES. Estuvo antes y la fila se leía
     "+ All Native Web", donde las dos primeras palabras forman una
     frase que quiere decir otra cosa: "agregar todo". Al final queda
     "…Native Web +", y "Web +" no se lee como nada. */
  const filtros = (
    <div className={css.filtros}>
      {FILTROS.map((f) => (
        <button
          className={css.filtro}
          key={f.valor}
          data-activo={filtro === f.valor ? "" : undefined}
          aria-pressed={filtro === f.valor}
          onClick={() => setFiltro(f.valor)}
        >
          {f.etiqueta}
        </button>
      ))}
      <button
        className={css.mas}
        aria-label="Add clips"
        onClick={() => entrada.current?.click()}
      >
        <Mas />
      </button>
    </div>
  );

  return (
    <div className={css.vault} onDragOver={encima} onDrop={soltar}>
      {/* La misma capa que en el detalle: el menú del clic derecho y sus
          dos diálogos. */}
      {capa}

      {/* El filtro se dibuja DENTRO de la barra, en la otra punta de su
          fila. Por portal y no por coordenadas: adentro, flexbox lo
          acomoda y el ancho chico se resuelve solo. */}
      {acciones && createPortal(filtros, acciones)}

      {/* El selector de verdad. Va escondido y lo dispara el +: un
          <input type=file> no se puede maquillar sin pelearse con cada
          navegador, así que se usa el nativo y se le pone adelante un
          control que sí es nuestro.
          `accept` filtra con la misma lista blanca del servidor, así que
          lo que no se puede subir no se puede ni elegir. */}
      <input
        className={css.oculto}
        ref={entrada}
        type="file"
        multiple
        accept={ACEPTA}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => elegidos(e.target.files)}
      />

      <Donde
        archivos={pendientes}
        onElegir={(f) => {
          const a = pendientes;
          setPendientes([]);
          subir(a, f);
        }}
        onCerrar={() => setPendientes([])}
      />

      {/* Mientras sube. */}
      {subiendo && <p className={css.subiendo}>{subiendo}</p>}

      {visibles.length === 0 ? (
        <p className={css.aviso}>Nothing here.</p>
      ) : (
        <div className={css.grilla}>
          {visibles.map((c) => (
            <Tarjeta
              clip={c}
              onAbrir={(x) => ir(rutaDeClip(x.ruta))}
              onMenu={(x, d) => setMenu({ clip: x, donde: d })}
              key={c.ruta}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DÓNDE VA EL CLIP — el diálogo.

   Es un <dialog> nativo abierto con showModal(), no un div con
   position:fixed. Eso trae gratis y bien hechas cuatro cosas que a mano
   se hacen mal: el foco queda atrapado adentro, Escape cierra, el resto
   de la página queda inerte para el teclado y el lector de pantalla, y
   el ::backdrop existe sin agregar un nodo.

   LO ABREN LOS DOS CAMINOS. El + junta los archivos del selector y
   soltar los junta del arrastre; de ahí en adelante es el mismo
   diálogo, así que la pregunta se hace en un solo lugar.
   ═══════════════════════════════════════════════════════════════ */
/* EL MEDIO del archivo que estás por subir, sin caja: la caja la pone la
   card, que es la misma del vault. */
function Medio({ archivo, url }: { archivo: File; url: string }) {
  if (archivo.type.startsWith("video")) {
    /* El primer cuadro y quieto, igual que la card en reposo: el
       fragmento #t= obliga al navegador a pintar ESE cuadro en vez de
       dejar la caja negra. */
    return <video src={`${url}#t=0.1`} preload="metadata" muted playsInline />;
  }
  return <img src={url} alt="" />;
}

function Donde({
  archivos,
  onElegir,
  onCerrar,
}: {
  archivos: File[];
  onElegir: (f: Fuente) => void;
  onCerrar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (archivos.length && !d.open) d.showModal();
    if (!archivos.length && d.open) d.close();
  }, [archivos.length]);

  /* LO QUE EL DIÁLOGO MUESTRA SOBREVIVE AL VACIADO DE LA LISTA.

     `archivos` se vacía en el instante en que elegís, pero el diálogo
     tarda 150ms en irse y durante ese rato se sigue dibujando. Leyendo
     `archivos` directo, el object URL se revocaba en el primer cuadro de
     la salida y la imagen moría a la vista — WebKit lo gritaba con un
     "WebKitBlobResource error 1" por cada card.

     Con esto lo último que hubo se queda hasta que llegue otra cosa. */
  const [mostrados, setMostrados] = useState<File[]>([]);
  useEffect(() => {
    if (archivos.length) setMostrados(archivos);
  }, [archivos]);

  /* Un object URL vive hasta que se lo revoca: sin el cleanup cada
     archivo que mirás queda en memoria hasta recargar la página, y acá se
     miran videos. Se crea UNO solo y lo usan las dos cards. */
  /* LA DEPENDENCIA ES EL ARCHIVO Y NO EL ARRAY, y la diferencia importa:
     un array nuevo con el MISMO File adentro es otra identidad, así que
     dependiendo del array el efecto revocaría y recrearía la URL sin que
     el archivo haya cambiado. Con el File como dependencia eso no puede
     pasar. */
  const archivo = mostrados[0];

  /* LA URL SE CREA EN EL RENDER, con useMemo, y NO en un efecto. Es la
     diferencia entre que ande y que no:

     con un efecto, `url` se setea un render DESPUÉS de que cambió el
     archivo, así que existe un cuadro en el que el <img> todavía apunta
     a la URL vieja —ya revocada por el cleanup— y WebKit tira
     "WebKitBlobResource error 1". Apareció dos veces mientras se
     miraban los diseños, una vez por render.

     Con useMemo, el archivo y su URL cambian en el MISMO render, y el
     cleanup revoca la anterior recién cuando el nuevo render ya está
     pintado. */
  const url = useMemo(
    () => (archivo ? URL.createObjectURL(archivo) : null),
    [archivo],
  );
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  return (
    /* onClose cubre TODAS las formas de cerrar —Escape, el botón, y
       close() desde acá— así que el estado se limpia en un solo lugar y
       no en tres. */
    <dialog className={css.dialogo} ref={dialogo} onClose={onCerrar}>
      <p className={css.dialogoQue}>
        {mostrados.length === 1
          ? mostrados[0]?.name
          : `${mostrados[0]?.name} + ${mostrados.length - 1} more`}
      </p>

      {/* ─── LAS DOS OPCIONES SON LA CARD ───
          No se elige una carpeta: se elige CUÁL DE LAS DOS SE VE BIEN. La
          pregunta pasa de ser sobre el archivo —que es lo que el usuario
          no sabe— a ser sobre el resultado, que está a la vista.

          Y no es una imitación de la card: son las MISMAS clases, así que
          el teléfono aparece entero con el aire de benji y la pantalla
          llena la caja con cover, exactamente como van a quedar en la
          grilla. Si mañana cambia la card, esto cambia con ella y no hay
          nada que sincronizar. */}
      <div className={css.dialogoOpciones}>
        {(["native", "web"] as const).map((f) => (
          <button
            className={`${css.card} ${css.dialogoCard}`}
            key={f}
            data-fuente={f}
            onClick={() => onElegir(f)}
          >
            <div className={css.media}>
              {archivo && url && <Medio archivo={archivo} url={url} />}
            </div>
            <div className={css.titulo}>
              {f === "native" ? "Native" : "Web"}
            </div>
          </button>
        ))}
      </div>
    </dialog>
  );
}
