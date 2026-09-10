import { useEffect, useState } from "react";
import css from "./link.module.css";
import { linkCardOf, type LinkCard } from "./clips";
import { labelOf, hostOf } from "./links";

/* ═══════════════════════════════════════════════════════════════
   A LINK, DRAWN THE WAY NOTION DRAWS IT: the site's favicon and a short
   label, instead of the whole URL.

   THE PROBLEM IT SOLVES IS ONE OF SPACE AND IT IS REAL, not aesthetic.
   A GitHub URL to a file is 101 characters; in the details column
   (280px) that is FOUR lines of monolithic noise where the whole note
   is two. Measured over a capture of the real case.

   IT IS STILL A LINK AND NOT A PILL. No box, no background, no border:
   it gets underlined, and the underline uses the tokens the system had
   already decided for this (--link-underline and its hover) waiting
   since day one with the note "today the page has no <a> at all". This
   is the first one. A chip with a background would have invented a new
   surface in a product that has exactly one (the floating menu's) and
   that defines everything else by contrast.

   AND IT IS INLINE TEXT, not a block: a link can land in the middle of
   a sentence ("look at https://… for the code") and it has to flow with
   it, wrap with it and sit on its same baseline.
   ═══════════════════════════════════════════════════════════════ */

/* ─── THE CACHE, IN THE MODULE ───
   It lives outside React because it has to outlive the unmount: on
   changing clips the whole details panel mounts again, and without this
   every round trip between two clips fires the request for the same
   links again.

   It ALSO keeps the failures (as null), for the same reason: a site
   that does not answer takes six seconds not to answer, and retrying it
   on every render leaves the label flickering between the host and the
   title.

   `inFlight` is the other half: two notes with the same link mounted at
   the same time share ONE request instead of making two. */
const cache = new Map<string, LinkCard | null>();
const inFlight = new Map<string, Promise<LinkCard | null>>();

function useLinkCard(url: string): LinkCard | null {
  const [card, setCard] = useState<LinkCard | null>(
    () => cache.get(url) ?? null,
  );

  useEffect(() => {
    if (cache.has(url)) {
      setCard(cache.get(url) ?? null);
      return;
    }
    let alive = true;
    let p = inFlight.get(url);
    if (!p) {
      p = linkCardOf(url).then((c) => {
        cache.set(url, c);
        inFlight.delete(url);
        return c;
      });
      inFlight.set(url, p);
    }
    p.then((c) => {
      if (alive) setCard(c);
    });
    return () => {
      alive = false;
    };
  }, [url]);

  return card;
}

export function NoteLink({ url }: { url: string }) {
  const card = useLinkCard(url);
  /* TO NAME IT we use the FINAL URL (the one after the redirects) and
     not the one written in the note. The difference is the whole point
     of shorteners: a link copied from X is a t.co/xxxx, and `t.co` as a
     label says neither what it is nor where it came from. With the
     final one, that same link gets labeled with the site and the title
     of where it leads.

     TO NAVIGATE we still use the written one. They are two different
     questions (what it is called and where it goes) and only the first
     one needs to have gone out to the network. */
  const destination = card?.final ?? url;
  /* While the card travels, the label ALREADY is the host: there is
     never a hole and never a pulsing skeleton. When the title arrives
     the text changes and nothing else, and if the URL ends in a file
     name it does not even change, because that beats the title. See
     labelOf. */
  const label = labelOf(destination, card?.title ?? undefined);

  return (
    <a
      className={css.link}
      href={url}
      target="_blank"
      rel="noreferrer"
      /* The whole URL is not lost: it lives in the system tooltip. It is
         the same deal the Source row already makes, clipping it against
         the edge and leaving the arrow to open it.

         The FINAL one goes in when there is one: the tooltip answers
         "where does this take me?", and for a t.co the useful answer is
         the destination and not the shortener. */
      title={destination}
      /* THE CLICK MUST NOT REACH THE NOTE. The reading view goes into
         edit when you touch it; without this, opening a link also
         opened the editor underneath. */
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ─── THE FAVICON ───
          The slot is reserved ALWAYS, with an icon or without one: if
          it appeared only on load, every link would push its line an
          instant after being drawn. It is the same rule as the details
          panel's slot in the clip detail, which is reserved whether it
          is open or closed.

          The browser asks the site for it directly, without going
          through the server: an image does not need CORS to be drawn,
          and proxying it would mean caching binaries for nothing.
          `no-referrer` avoids telling that CDN which localhost it came
          from. */}
      <span className={css.icon} aria-hidden="true">
        {card?.icon && (
          <img
            src={card.icon}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            /* A favicon that gives a 404 (or an .ico the browser cannot
               decode) leaves the slot empty instead of a broken image.
               The link does not depend on it to work. */
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
      </span>
      <span className={css.label}>{label}</span>
      {/* For the screen reader: the label can be "tab-layout.tsx", and
          that does not say where it leads. The site gets added here and
          not in the visible text, which is exactly what is being
          shortened. */}
      <span className={css.hidden}>, {hostOf(destination)}</span>
    </a>
  );
}
