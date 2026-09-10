/* THE BUTTON'S MATERIAL: what the pill is made of.
 *
 * Vito asked (2026-09-04) to "see an option for how this would look with
 * a liquid glass button". Like the background and the recipe, it is a
 * VARIANT behind a selector: you look at it live, in the simulator and
 * on the phone, and when there is a decision it gets written here and
 * the selector goes away.
 *
 *   'opaque'  the pill measured from the Opal clip: a #1E1E1E capsule
 *             with the resting sheen and the veiled tip, and a
 *             two-layer shadow that lifts it off light pages. (The clip
 *             also has a 1 pt ring and we do not draw it: the receipt
 *             is where `COLOR.ring` used to be, in `measurements.ts`.)
 *   'glass'   the same capsule in native Liquid Glass
 *             (`expo-glass-effect` over `UIGlassEffect`), shipped the
 *             way a serious app would: `regular` with no tint (the
 *             glass of controls, the one that refracts), INTERACTIVE
 *             (it answers the finger with its own bulge, so it does not
 *             carry Opal's press scale), floating over the content,
 *             which scrolls underneath, and nothing of Opal's on top:
 *             no resting sheen, no veiled tip. The white fill of the
 *             hold sweeps over it all the same: that is the gesture.
 *             The label follows the color scheme, like every glass
 *             control: black in light, white in dark.
 *
 * There was a third one, 'light' (the same glass with Apple's `clear`
 * style, more transparent), added and removed on 2026-09-07: it came in
 * while asking whether the glass had an intensity (it does not: two
 * styles and a tint) and it went out on request ("drop the light
 * option"). If it is ever needed again, it is `glassEffectStyle="clear"`
 * on the capsule in `hold-to-commit.tsx`.
 *
 * What does NOT change between materials: the gesture, the curves, the
 * fill, the label, the sparks, the burst and the haptics. The glass
 * traps are in `native/GLASS.md`; the one that matters here: nobody
 * clips it, neither it nor its ancestors, so the glass is the CONTAINER
 * of the pill and the view that clips the textures goes inside it,
 * transparent.
 */
export type Material = 'opaque' | 'glass'
export const MATERIALS: readonly Material[] = ['opaque', 'glass']
export const MATERIAL: Material | 'choose' = 'opaque'
