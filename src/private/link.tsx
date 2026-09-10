import { useEffect, useState } from "react";
import css from "./link.module.css";
import { tarjetaDeLink, type Tarjeta } from "./clips";
import { etiquetaDe, hostDe } from "./links";

/* ═══════════════════════════════════════════════════════════════
   UN LINK, DIBUJADO COMO LO DIBUJA NOTION: el favicon del sitio y una
   etiqueta corta, en vez de la URL entera.

   EL PROBLEMA QUE RESUELVE ES DE ESPACIO Y ES REAL, no estético. Una
   URL de GitHub a un archivo mide 101 caracteres; en la columna de la
   ficha —280px— eso son CUATRO renglones de ruido monolítico donde la
   nota entera son dos. Medido sobre una captura del caso real.

   SIGUE SIENDO UN LINK Y NO UNA PASTILLA. Sin caja, sin fondo, sin
   borde: se subraya, y el subrayado usa los tokens que el sistema ya
   tenía decididos para esto —--link-underline y su hover— esperando
   desde el día uno con la nota "hoy la página no tiene ningún <a>".
   Éste es el primero. Un chip con fondo habría inventado una
   superficie nueva en un producto que tiene exactamente una —la del
   menú flotante— y que define todo lo demás por contraste.

   Y ES TEXTO EN LÍNEA, no un bloque: un link puede caer en medio de
   una frase ("mirá https://… para el código") y tiene que fluir con
   ella, envolverse con ella y sentarse en su misma línea base.
   ═══════════════════════════════════════════════════════════════ */

/* ─── EL CACHÉ, EN EL MÓDULO ───
   Vive afuera de React porque tiene que sobrevivir al desmontaje: al
   cambiar de clip la ficha entera se vuelve a montar, y sin esto cada
   ida y vuelta entre dos clips redispara el pedido de los mismos
   links.

   Guarda TAMBIÉN los fracasos (como null), por lo mismo: un sitio que
   no contesta tarda seis segundos en no contestar, y reintentarlo en
   cada render deja la etiqueta parpadeando entre el host y el título.

   `volando` es la otra mitad: dos notas con el mismo link montadas a
   la vez comparten UN pedido en vez de hacer dos. */
const cache = new Map<string, Tarjeta | null>();
const volando = new Map<string, Promise<Tarjeta | null>>();

function useTarjeta(url: string): Tarjeta | null {
  const [tarjeta, setTarjeta] = useState<Tarjeta | null>(
    () => cache.get(url) ?? null,
  );

  useEffect(() => {
    if (cache.has(url)) {
      setTarjeta(cache.get(url) ?? null);
      return;
    }
    let vivo = true;
    let p = volando.get(url);
    if (!p) {
      p = tarjetaDeLink(url).then((t) => {
        cache.set(url, t);
        volando.delete(url);
        return t;
      });
      volando.set(url, p);
    }
    p.then((t) => {
      if (vivo) setTarjeta(t);
    });
    return () => {
      vivo = false;
    };
  }, [url]);

  return tarjeta;
}

export function Enlace({ url }: { url: string }) {
  const tarjeta = useTarjeta(url);
  /* PARA NOMBRARLO se usa la URL FINAL —la de después de los
     redirects— y no la que está escrita en la nota. La diferencia es
     todo el asunto de los acortadores: un link copiado de X es un
     t.co/xxxx, y `t.co` como etiqueta no dice ni qué es ni de dónde
     salió. Con la final, ese mismo link se etiqueta con el sitio y el
     título de a dónde lleva.

     PARA NAVEGAR se sigue usando la escrita. Son dos preguntas
     distintas —cómo se llama y a dónde va— y sólo la primera necesita
     haber salido a la red. */
  const nombrable = tarjeta?.final ?? url;
  /* Mientras la tarjeta viaja, la etiqueta YA es el host: nunca hay un
     hueco ni un esqueleto pulsando. Cuando llega el título cambia el
     texto y nada más — y si la URL termina en un nombre de archivo ni
     siquiera cambia, porque ése le gana al título. Ver etiquetaDe. */
  const etiqueta = etiquetaDe(nombrable, tarjeta?.titulo ?? undefined);

  return (
    <a
      className={css.enlace}
      href={url}
      target="_blank"
      rel="noreferrer"
      /* La URL entera no se pierde: vive en el tooltip del sistema. Es
         el mismo trato que ya hace la fila de Source, que la recorta
         contra el borde y deja la flecha para abrirla.

         Va la FINAL cuando la hay: el tooltip contesta "¿a dónde me
         lleva esto?", y para un t.co la respuesta útil es el destino y
         no el acortador. */
      title={nombrable}
      /* EL CLIC NO TIENE QUE LLEGAR A LA NOTA. La vista de lectura
         entra en edición cuando la tocás; sin esto, abrir un link
         abría también el editor debajo. */
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ─── EL FAVICON ───
          El hueco está reservado SIEMPRE, con ícono o sin él: si
          apareciera recién al cargar, cada link empujaría su renglón
          un instante después de dibujarse. Es la misma regla que el
          hueco de la ficha en el detalle del clip, que está reservado
          esté abierta o cerrada.

          Lo pide el navegador directo al sitio, sin pasar por el
          servidor: una imagen no necesita CORS para dibujarse, y
          proxearla sería cachear binarios para nada. `no-referrer`
          evita contarle a ese CDN desde qué localhost salió. */}
      <span className={css.icono} aria-hidden="true">
        {tarjeta?.icono && (
          <img
            src={tarjeta.icono}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            /* Un favicon que da 404 —o un .ico que el navegador no
               sabe decodificar— deja el hueco vacío en vez de la
               imagen rota. El link no depende de él para funcionar. */
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
      </span>
      <span className={css.etiqueta}>{etiqueta}</span>
      {/* Para lector de pantalla: la etiqueta puede ser
          "tab-layout.tsx", y eso no dice a dónde lleva. El sitio se
          agrega acá y no en el texto visible, que es justamente lo que
          se está acortando. */}
      <span className={css.oculto}> — {hostDe(nombrable)}</span>
    </a>
  );
}
