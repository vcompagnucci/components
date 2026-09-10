/* OPEN STRAIGHT INTO A PIECE: a development knob of the workshop.
 *
 * With a single piece the index does not exist: the workshop opens into
 * it. With two or more the list shows up, and that is the right thing
 * for choosing, but not for measuring: the probes (`probe.ts` of each
 * piece) and `pnpm record` need the app to start in the piece without
 * anyone touching anything, and `simctl openurl` with the scheme of the
 * dev client asks for confirmation on iOS 26 (which cannot be tapped
 * from the terminal). So the slug is written HERE, Fast Refresh applies
 * it, and the index redirects. It has to stay `undefined` in the repo:
 * the other worktree has its own piece.
 *
 * It lives outside `src/app/` on purpose: Expo Router turns every file
 * hanging off there into a route.
 */
export const OPEN_IN: string | undefined = undefined
