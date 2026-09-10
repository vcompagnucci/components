/* THE BACKGROUND — what is behind the button.
 *
 * The button is the piece; what is behind it is context. On 2026-09-03
 * Vito asked to drop the Opal screen and leave a plain, neutral
 * background, without deciding yet which one. So the background is a
 * VARIANT, not a value, and you pick it by looking: with `'choose'` the
 * piece shows a selector at the top to go from one to another live (on
 * the phone too). When there is a winner, it gets written here and the
 * selector disappears; the variants that lose get deleted, except
 * `'opal'`, which is the measured screen from the clip and stays
 * recoverable.
 *
 *   'plain'     nothing but the button, where the clip has it (at the foot)
 *   'centered'  nothing but the button, in the middle of the screen
 *   'blocks'    the Opal screen as a skeleton: same grid and heights,
 *               gray bars for text, silhouettes for controls. The
 *               context without the content. CHOSEN on 2026-09-03 over
 *               the board of all four.
 *   'opal'      the measured screen from the clip, with its blotches
 *   'stock'     the detail page of an asset in a finance app, as a
 *               skeleton: title, price, change, chart and range,
 *               measured from Robinhood's official screenshot; the
 *               button becomes "Hold to Buy". CHOSEN on 2026-09-04
 *               ("Robinhood style, all skeletons").
 *
 * Each one is a different direction, not a shade of the same one: empty
 * at the foot / empty centered / mute context / the faithful copy.
 *
 * The SPILL, the light that escapes under the pill, measured on the
 * Opal screen, is only drawn with `'opal'`: over a neutral background it
 * reads as a box behind the button (Vito, 2026-09-04, on the phone).
 */
export type Background = 'plain' | 'centered' | 'blocks' | 'opal' | 'stock'
export const BACKGROUNDS: readonly Background[] = ['plain', 'centered', 'blocks', 'opal', 'stock']
export const BACKGROUND: Background | 'choose' = 'stock'
