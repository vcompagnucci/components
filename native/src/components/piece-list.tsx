import { Link, type Href } from 'expo-router'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { SLUGS } from './pieces/registry'

/* ═══════════════════════════════════════════════════════════════
   THE LIST OF PIECES — the index of the workshop, drawn.

   It is react-native-motion's `animation-list.tsx`: the index route
   (`src/app/index.tsx`) decides whether there is a list and this draws
   it. The pieces come out of the registry, derived from the folders of
   `components/pieces/` (see `pieces/registry.ts`), so there is no list
   to maintain: you add a folder and it shows up.

   What you read is the SLUG as a phrase, not the title in the
   exhibition: the workshop does not read `pieces.ts` from the web repo,
   and the slug is what the two of them share.
   ═══════════════════════════════════════════════════════════════ */

/* "sheet-that-stretches" → "Sheet that stretches". The SAME arithmetic
   as `toPhrase` in src/private/clips.ts of the web repo: only the first
   letter uppercased, because the name of a piece is a phrase and not a
   title. */
const toPhrase = (s: string) => {
  const clean = s.replace(/-+/g, ' ').trim()
  return clean ? clean[0].toUpperCase() + clean.slice(1) : s
}

export function PieceList() {
  return (
    <SafeAreaView style={css.screen}>
      <ScrollView contentContainerStyle={css.column}>
        <Text style={css.title}>Pieces</Text>
        {SLUGS.length === 0 ? (
          /* The dash, not a phrase. It is the answer this house already
             gave for a missing value (see .noClips in the playground). */
          <Text style={css.empty}>—</Text>
        ) : (
          SLUGS.map((slug) => (
            /* THE ONLY `as` IN THE WORKSHOP, and it is confined to this
               line. `typedRoutes` generates the union of the routes that
               exist and catches any mistyped link, which is worth
               keeping on. But THIS link is dynamic by design: its
               destination comes out of the same registry that drew the
               list, so the screen exists by construction. Turning the
               check off for the whole project because of the one place
               where it does not apply would be paying a lot for very
               little. */
            <Link key={slug} href={`/${slug}` as Href} style={css.row}>
              {toPhrase(slug)}
            </Link>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

/* The workshop is a TOOL, not the product: it does not inherit the
   tokens of the exhibition and it does not try to look like it. The
   system typeface and the minimum for it to be readable. All the design
   goes inside the pieces, which are the only thing that gets recorded. */
const css = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  column: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48, gap: 16 },
  title: { fontSize: 28, fontWeight: '600', color: '#111', marginBottom: 8 },
  row: { fontSize: 17, color: '#111' },
  empty: { fontSize: 17, color: '#999' },
})
