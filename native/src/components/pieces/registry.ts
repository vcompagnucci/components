import type { ComponentType } from 'react'

/* ═══════════════════════════════════════════════════════════════
   THE REGISTRY OF PIECES: slug → screen, derived from the folders.

   It is react-native-motion's `registry.tsx` (components/animations/),
   with one difference that matters here: over there the map is written
   by hand, one import and one line per animation, and here it is
   DERIVED. A list written by hand falls out of sync the day you add a
   folder and forget to write it down, and then the index lies; it is
   the same decision that keeps the vault from lying and that makes the
   sketches of the playground come off the disk. And with several
   worktrees building pieces in parallel, a central file that everyone
   edits is one conflict per new piece; a folder per piece collides with
   nobody.

   `require.context` is Metro's and Expo enables it by default. It is
   the same mechanism Expo Router is built on. The pattern only matches
   `<slug>/index.tsx` in lowercase and hyphens, which is exactly the
   shape a piece has to have: its folder is named after its slug, and
   that slug is the one it carries in the exhibition (the `slug` of its
   entry in `src/pieces.ts` of the web repo) and in the URL of the
   workshop.

   Each `index.tsx` exports its screen BY DEFAULT, and nothing else:
   that is the only thing the registry needs to know about a piece. The
   route (`src/app/[slug].tsx`) looks here, and the index
   (`piece-list.tsx`) lists the keys. The pieces load at startup, like
   the imports in the registry of the reference: there are few of them
   and the workshop has no loading screen to save.
   ═══════════════════════════════════════════════════════════════ */
const CONTEXT = require.context('./', true, /^\.\/[a-z0-9-]+\/index\.tsx$/)

const slugOf = (key: string) => key.slice('./'.length, -'/index.tsx'.length)

export const PIECES: Readonly<Record<string, ComponentType>> = Object.fromEntries(
  CONTEXT.keys()
    .sort()
    .map((key) => [slugOf(key), CONTEXT(key).default]),
)

/* The slugs in alphabetical order: the index has no editorial order. It
   is a tool, not the exhibition. */
export const SLUGS: readonly string[] = Object.keys(PIECES)

/* Without this TypeScript does not know `require.context`: it is an
   extension of Metro's, not of the runtime. It goes down here and not
   in a loose .d.ts so that it lives next to its only use. */
declare const require: {
  context(
    dir: string,
    recursive: boolean,
    pattern: RegExp,
  ): { keys(): string[]; (key: string): { default: ComponentType } }
}
