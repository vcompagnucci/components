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
}
