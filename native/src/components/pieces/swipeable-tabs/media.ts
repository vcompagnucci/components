/* ═══════════════════════════════════════════════════════════════
   THE MOCK'S IMAGES: assigned by hand by the user (2026-09-01), one
   list per tab, IN ITS ORDER. There is nothing to derive here: it is
   editorial content, not mechanism.

   · In Stocks, the three Berry ones go FIRST (explicit request: "the
     Berry ones first").
   · The Lex Fridman card arrived with no tab in the message; it was
     assigned to `tech` by subject, and that is the only decision of
     ours.
   · `ai` arrived last (2026-09-02, four attachments): three different
     photos. The third and the fourth were THE SAME file, byte for byte
     (sha256 28d61a40…), so it goes in once. All three are 904×1200
     verticals (0.7533, just above the 3:4 floor).
   · REORDERED on 2026-09-02, request by request: For you opens with the
     blue sketch on a light background; Following with the rider
     carrying the flag; Stocks with the Figma chart and the "pre-market"
     one second; Tech with the three blue engravings (the cypresses one
     first) and then the two cards; Design with the Empire State. The
     files were not renamed: the number is the order they arrived in,
     the feed's order is the one in this list.

   The `ratio` (width/height) comes measured from each file when it was
   converted (ffmpeg, max width 1300 px ≈ the width of the media block
   at 3x) and it travels here so the layout does not have to wait for
   the image to decode to know its height. The page CLAMPS it to
   [3:4, 16:9], which is our decision, NO RECEIPT from X: X's real crop
   changed between versions and it is not measured; 3:4 keeps the feed
   browsable with the vertical screenshots (the tallest is 9:16).
   ═══════════════════════════════════════════════════════════════ */

export type Photo = { source: number; ratio: number }

export const MEDIA: Record<string, Photo[]> = {
  'for-you': [
    { source: require('./media/for-you-2.jpg'), ratio: 1.3274 },
    { source: require('./media/for-you-1.jpg'), ratio: 1.0 },
    { source: require('./media/for-you-3.jpg'), ratio: 1.7808 },
  ],
  following: [
    { source: require('./media/following-4.jpg'), ratio: 1.7804 },
    { source: require('./media/following-1.jpg'), ratio: 1.7804 },
    { source: require('./media/following-2.jpg'), ratio: 1.7804 },
    { source: require('./media/following-3.jpg'), ratio: 1.7751 },
  ],
  stocks: [
    { source: require('./media/stocks-2.jpg'), ratio: 0.8 },
    { source: require('./media/stocks-1.jpg'), ratio: 1.3333 },
    { source: require('./media/stocks-3.jpg'), ratio: 1.3333 },
    { source: require('./media/stocks-4.jpg'), ratio: 0.6667 },
    { source: require('./media/stocks-5.jpg'), ratio: 0.5625 },
  ],
  tech: [
    { source: require('./media/tech-5.jpg'), ratio: 1.776 },
    { source: require('./media/tech-3.jpg'), ratio: 1.776 },
    { source: require('./media/tech-4.jpg'), ratio: 1.776 },
    { source: require('./media/tech-1.jpg'), ratio: 1.4254 },
    { source: require('./media/tech-2.jpg'), ratio: 1.7751 },
  ],
  design: [
    { source: require('./media/design-3.jpg'), ratio: 0.7483 },
    { source: require('./media/design-1.jpg'), ratio: 1.3274 },
    { source: require('./media/design-2.jpg'), ratio: 2.0619 },
  ],
  ai: [
    { source: require('./media/ai-1.jpg'), ratio: 0.7533 },
    { source: require('./media/ai-2.jpg'), ratio: 0.7533 },
    { source: require('./media/ai-3.jpg'), ratio: 0.7533 },
  ],
}
