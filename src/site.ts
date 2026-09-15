/* ═══════════════════════════════════════════════════════════════
   THE NAME AND THE ONE LINE, WRITTEN ONCE.

   Five copies of the name and three of the sentence lived by hand
   until 2026-09-10, when Vito asked why there were three. They are
   read from here by the masthead, by the tab's title, and by the four
   meta tags in index.html, which `siteMeta` in vite.config.ts fills in
   from this file. It is the same reason vercel.json is generated from
   pieces.ts: a second copy is a copy that goes stale in silence, and
   the meta tags are the copy nobody looks at.

   The masthead's H1 and the tab's title are THE SAME string, whole.
   Leaving "Exhibition" in the tab and the full one in the page was
   tried, leaning on the subtitle to say what the exhibition is about;
   it was dropped, because a product whose name changes length
   depending on where you read it has two names.
   ═══════════════════════════════════════════════════════════════ */
export const SITE = {
  name: 'Interface exhibition',
  /* The relative clause goes beside "Components", not at the end. At
     the end it lands on the nearest noun, "apps", and what feels right
     are the components. It read the wrong way round until 2026-09-10.
     "Feel right" is the quality standard the two references name, and
     it states the result and not the effort. The why is in the log. */
  description: 'Components that feel right, for web and native apps.',
  /* THE ADDRESS, and it is a subdomain on purpose. The apex is kept for
     the personal site, where this is one item in a list of projects,
     and a project in that list points at a separate origin in all three
     references (see `LOG.md` › The exhibition gets its own origin).
     Bought on 2026-09-15.

     It is here and not in index.html for two reasons. The one the two
     fields above already give, that the meta tags are the copy nobody
     looks at. And a second one, found the day this was written: an
     HTML comment SHIPS. The build strips the comments of a piece's
     stylesheet on purpose (see removeStylesheetComments) and nothing
     does that to index.html, so every word written there is published.
     This paragraph is in a .ts file, where the minifier eats it.

     IT IS THE ROOT ON EVERY PAGE, AND THAT IS A LIMIT AND NOT AN
     OVERSIGHT. There is one static index.html and the routing is on
     the client, so a crawler that does not run JavaScript sees this
     same head at /buttons-separate. Filling og:url per piece needs
     prerendering, which this site does not do. `og:title` and
     `og:description` already describe the site and not the piece for
     the same reason, so a shared piece link previews as the exhibition.
     Worth knowing before wondering why a card does not name the piece.

     THE TRAILING SLASH IS PART OF IT. `og:url` is an absolute URL and
     the crawlers that canonicalise treat the host with and without the
     slash as the same page only after a redirect, so the value that
     travels is the one the server actually serves. */
  url: 'https://exhibition.vitocompagnucci.com/',
}
