// THE PILL'S HIGHLIGHTS, GENERATED — not drawn by hand.
//
//   swift generate.swift       (from this folder; it writes the @3x files next to it)
//
// Every PNG is a MEASURED profile of the reference clip
// (`VAULT_DIR/nativo/Hold to commit.mp4`, 2.709 px/pt), converted to RGBA
// over the pill's real background. Every number's receipt is above its
// function and, in points, in `../measurements.ts`. There is no CIFilter
// and no real blur: the falloffs are gaussians/erfcs worked out pixel by
// pixel, which is what a blur would produce, but deterministic and with no
// dependency.
//
// Why PNGs and not views: a smooth gradient with a soft edge does not
// exist in React Native without a native module (linear-gradient, Skia,
// masked-view), and this workshop also runs in Expo Go, where Skia is not
// there. A translated texture is the cheapest thing there is for the
// compositor.
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let SCALE = 3.0                       // @3x: the iPhone 17 Pro Max
let PILL_WIDTH = 382.0, PILL_HEIGHT = 52.0
let RIM = 11.0                        // pt of pale green edge above/below the blob (RUNTIME: f151, x=400)
let PALE_GREEN = (218.0, 255.0, 228.0)  // RUNTIME: derived from (215,252,227) over (31,36,34) at alpha .986

typealias Pixel = (r: Double, g: Double, b: Double, a: Double)

func write(_ name: String, width: Int, height: Int, pixel: (Double, Double) -> Pixel) {
    var data = [UInt8](repeating: 0, count: width * height * 4)
    for y in 0..<height {
        for x in 0..<width {
            let p = pixel((Double(x) + 0.5) / SCALE, (Double(y) + 0.5) / SCALE)
            let a = max(0, min(1, p.a))
            let i = (y * width + x) * 4
            // premultiplied: it is what kCGImageAlphaPremultipliedLast asks for
            data[i] = UInt8(max(0, min(255, p.r * a)).rounded())
            data[i + 1] = UInt8(max(0, min(255, p.g * a)).rounded())
            data[i + 2] = UInt8(max(0, min(255, p.b * a)).rounded())
            data[i + 3] = UInt8((a * 255).rounded())
        }
    }
    let cs = CGColorSpaceCreateDeviceRGB()
    let ctx = CGContext(data: &data, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    let img = ctx.makeImage()!
    let url = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent(name)
    let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
    CGImageDestinationAddImage(dest, img, nil)
    CGImageDestinationFinalize(dest)
    print("wrote \(name) \(width)×\(height)")
}

func gauss(_ d: Double, _ sigma: Double) -> Double { exp(-(d * d) / (2 * sigma * sigma)) }
func lerp(_ a: Double, _ b: Double, _ t: Double) -> Double { a + (b - a) * max(0, min(1, t)) }
func smooth(_ t: Double) -> Double { let u = max(0, min(1, t)); return u * u * (3 - 2 * u) }
/// Numerical erfc (Abramowitz-Stegun 7.1.26), more than enough for a profile.
func erfc(_ x: Double) -> Double {
    let z = abs(x), t = 1 / (1 + 0.5 * z)
    let r = t * exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))))
    return x >= 0 ? r : 2 - r
}

/// The blob's green edge: white in the middle, pale green in the first
/// `RIM` pt from the top and from the bottom. RUNTIME: f151 x=400, rows
/// 1218..1248 go from (231,255,237) to (255,255,255) in ~30 px.
func rimColor(_ y: Double) -> (Double, Double, Double) {
    let d = min(y, PILL_HEIGHT - y)              // distance to the nearest edge
    let t = smooth(d / RIM)                      // 0 at the edge → 1 at RIM pt
    return (lerp(PALE_GREEN.0, 255, t), lerp(PALE_GREEN.1, 255, t), lerp(PALE_GREEN.2, 255, t))
}

/// RUNTIME · fraction of the G peak in row y=1340 of the clip, every 22 pt
/// from the pill's left tip (x = 0 .. 382).
let ENVELOPE: [(Double, Double)] = [(0, 0.05), (22, 0.14), (44, 0.38), (66, 0.58), (89, 0.74), (111, 0.81), (133, 0.82), (155, 0.91), (177, 0.98), (199, 1.0), (221, 0.94), (244, 0.86), (266, 0.83), (288, 0.74), (310, 0.59), (332, 0.34), (354, 0.14), (382, 0.04)]
/// RUNTIME (2026-09-03, f40, rows at 10 and 14 pt from the TOP edge, base 30):
/// up top the sheen is more "square": even (.85–1) from 25 to 75 % of the
/// width and completely out before 10 % and after 95 %, whereas at the
/// bottom it falls off gradually towards the tips (.12 / .24 at 5 / 10 %).
/// With the bottom envelope in every row, the top row in a capture gave
/// 34/38/40/43/45/46/44/43/40/33 against 30/41/44/43/44/45/44/39/33 in the
/// clip: 4 too many at the tips, 3–4 too few in the middle.
let TOP_ENVELOPE: [(Double, Double)] = [(0, 0), (38, 0), (57, 0.33), (76, 0.72), (96, 0.87), (115, 0.95), (134, 0.95), (153, 0.90), (172, 0.95), (191, 0.97), (210, 1.0), (229, 1.0), (248, 0.97), (267, 0.97), (286, 0.85), (306, 0.67), (325, 0.37), (344, 0.23), (363, 0.03), (382, 0)]
func interpolate(_ table: [(Double, Double)], _ x: Double) -> Double {
    if x <= table[0].0 { return table[0].1 }
    for i in 1..<table.count {
        let (x0, v0) = table[i - 1], (x1, v1) = table[i]
        if x <= x1 { return lerp(v0, v1, (x - x0) / (x1 - x0)) }
    }
    return table.last!.1
}
func envelope(_ x: Double) -> Double { interpolate(ENVELOPE, x) }
/// The envelope per row: the bottom one up to 8 pt from the bottom edge,
/// the top one from 40 on, and a soft step between the two (the middle
/// rows are covered by the text in the clip: there is no measurement).
func envelopeAt(_ x: Double, d: Double) -> Double {
    lerp(envelope(x), interpolate(TOP_ENVELOPE, x), smooth((d - 8) / 32))
}

// ── 1. sheen.png — the ambient sheen at rest ────────────────────────
// A teal→green blob hugging the pill's BOTTOM edge. Two vertical gaussians
// (one narrow and bright, one wide and faint) because a single one does not
// fit the measured profile; one horizontal gaussian of σ=100 pt.
//   RUNTIME (x=600, alpha over #1E1E1E read off the G channel, d in pt from the bottom):
//     1.5 .54  3.7 .52  5.9 .49  8.1 .45  10.3 .42  12.5 .38  14.8 .33  17 .31
//     34.7 .10  36.9 .09  39 .076  41.3 .067  43.6 .053  45.8 .04  48 .027
//   .40·g(d,13) + .18·g(d,30) gives .50/.32/.10/.063 at 8.1/17/34.7/43.6.
//   (With σ=11 the bottom half came out 20 % dark on screen.)
//   RUNTIME (2026-09-03, columns of clip f40 at x = 30/50/70 % against a
//   capture, at the same distance in pt from the top edge): .42·g(13) +
//   .18·g(28) gave an rms of 4.9 of luminance and the 18–34 pt band came
//   out 5–12 dark; the grid-search fit gives .32·g(12) + .28·g(26),
//   rms 4.4 — the wide gaussian weighs more and the narrow one less.
//   RUNTIME (y=1340, horizontally from the center, alpha relative to the peak):
//     0: 1.0  ±74: .80  ±120: .57  ±144: .36  ±170: .14
//   It is NOT a gaussian and not a plateau: it rises fast on the left, has a
//   shoulder at ~90–130 pt, the peak past the center (~200) and falls slowly
//   on the right. Two symmetric models (σ=100; plateau ±36 + σ=76) gave ±13
//   of luminance at the shoulders. So the envelope IS the table measured in
//   the row of the clip's bottom edge (y=1340), as a fraction of the peak,
//   interpolated. The vertical one normalizes it (at 2.7 pt from the edge
//   the vertical is worth .92 of the peak):
//   THE COLORS, solving for alpha over (30,30,30) in the bottom edge row,
//   normalized to G=255 (t = x / width of the pill):
//     t .13 (.72,1,.93)  .30 (.66,1,.92)  .475 (.69,1,.87)   ← teal up to the center
//     t .53 (.71,1,.76)  .59 (.72,1,.70)  .71 (.73,1,.63)  .82 (.72,1,.66)  ← green-yellow
//   The turn is short (≈15 % of the width) and it sits just past the center.
write("sheen@3x.png", width: Int(PILL_WIDTH * SCALE), height: Int(PILL_HEIGHT * SCALE)) { x, y in
    let d = PILL_HEIGHT - y                      // pt above the bottom edge
    let vertical = 0.32 * gauss(d, 12) + 0.28 * gauss(d, 26)
    let horizontal = envelopeAt(x, d: d)
    let t = x / PILL_WIDTH
    // teal (B≈G) up to the center; the turn to green-yellow is short and
    // starts past the halfway mark (RUNTIME: at half height the center
    // gives (74,99,97), B≈G; the edge row turns between t=.47 and .59).
    let v = smooth((t - 0.44) / 0.10)
    let c: (Double, Double, Double) = (lerp(170, 186, v), 255, lerp(236, 150, v))
    return (c.0, c.1, c.2, vertical * horizontal)
}

// ── 2. body.png — the body of the fill, vertical profile only ───────
// 3 px wide; React Native stretches it across the width (resizeMode 'stretch').
// Opaque, with the pale green rim from `rimColor`.
write("body@3x.png", width: 3, height: Int(PILL_HEIGHT * SCALE)) { _, y in
    let c = rimColor(y); return (c.0, c.1, c.2, 1)
}

// ── 3. front.png — the leading edge of the fill ──────────────────────
// The front's falloff is an erfc of σ=19 pt CENTERED ON THE GEOMETRIC EDGE
// (the body's right edge), and it is shaped like a capsule: in the rows
// near the top and bottom edges the front recedes like the pill's round
// tip (radius 26).
//   RUNTIME (f151, y=1283): from 90 % to 10 % of coverage there are 139 px
//   = 51 pt → σ = 51 / 2.56 ≈ 19. (A first reading gave 13 by taking the
//   wrong stretch; on screen the front came out hard and 8 % ahead.)
//   RUNTIME (f122, row 10 pt from the top edge): the 50 % point falls 9 pt
//   behind the one at half height, which a tip of radius 26 explains (it
//   recedes 5.5 pt at 10 pt from the edge) together with the σ.
// The image spans 3σ + R = 83 pt ahead of the geometric edge and 3σ behind
// it: [−83, +57]. The body ends 83 pt before the geometric edge and the
// front continues it opaquely up to the falloff.
// The color turns pale green where the alpha drops below ~.97: in the
// reference, pure white only exists well inside the blob.
let FRONT_SIGMA = 19.0
let FRONT_BEFORE = 3 * FRONT_SIGMA + PILL_HEIGHT / 2  // 83
let FRONT_AFTER = 3 * FRONT_SIGMA                     // 57
/// How far a round tip of radius r recedes in row y, and with what σ it
/// blurs there. RUNTIME (f151, left tip): at 10 pt from the top edge the
/// ramp is ~1.5× wider than at half height (0.80 of coverage at +36 pt
/// against 0.96) — the blur of a curved edge widens towards the corners.
/// σ = σ0 + 8·√(recede / r) reproduces it.
func tip(_ y: Double, _ sigma0: Double) -> (recede: Double, sigma: Double) {
    let r = PILL_HEIGHT / 2
    let dy = min(max(y - r, -r), r)
    let recede = r - (r * r - dy * dy).squareRoot()
    return (recede, sigma0 + 8 * (recede / r).squareRoot())
}
let FRONT_WIDTH = FRONT_BEFORE + FRONT_AFTER          // 140
write("front@3x.png", width: Int(FRONT_WIDTH * SCALE), height: Int(PILL_HEIGHT * SCALE)) { x, y in
    let (recede, sigma) = tip(y, FRONT_SIGMA)
    let a = 0.5 * erfc((x - (FRONT_BEFORE - recede)) / (sigma * 2.0.squareRoot()))
    let rim = rimColor(y)
    let t = smooth((a - 0.90) / 0.09)             // 1 = white (a≥.99), 0 = pale green (a≤.90)
    return (lerp(PALE_GREEN.0, rim.0, t), lerp(PALE_GREEN.1, rim.1, t), lerp(PALE_GREEN.2, rim.2, t), a)
}

// ── 4. veil.png — the blob's left tip ───────────────────────────────────
// The blob is ONE blurred capsule whose left end stays inside the pill's
// tip and whose right end is the front. The white body cannot have that
// end (it travels with the front), so the tip is made with a VEIL the
// color of the pill on top of the body, with alpha = 1 − the capsule's
// coverage: it turns on and off along with the blob and, once finished,
// the white veil at 75 % lets it show through as it does in the clip.
//
// THE TIP DARKENS AND WIDENS AS THE FRONT MOVES AWAY (2026-09-03,
// `evolucion.py`, row 10 pt from the top edge, at 38 pt from the tip): 249
// in f88 (p .22) · 248 f100 · 240 f118 (.47) · 228 f130 · 213 f142 · 207
// f148 (.72) · 199 f160 · 192 f172 · 183 f181 (.99). And at 19 pt: 201 →
// 165 → 145 → 128. A fixed veil cannot do that; a single texture SCALED in
// x from the tip can: with the texture from the end (f181) and a scale
// s(p) = .25 + .75·p, the profile V(x/s) reproduces f88 (s .4: 53/5 of
// darkening at 19/38 pt against 50/2), f124 (s .6: 89/19 against 89/20),
// f151 (s .8: 109/47 against 112/50) and f166 (s .9: 119/60/20 against
// 120/63/21). The scale lives in `VEIL.scale` in measurements.ts and the
// button applies it.
//
// THE TEXTURE IS THE ONE FROM THE END. RUNTIME (f181, coverage of the body
// from the tip): at half height .57 / .88 / .98 at 19 / 38 / 57 pt → an
// erfc centered at 15 pt with σ 20; at 10 pt from the edge .44 / .68 / .86
// / .96 at 19 / 38 / 57 / 76 → centered at 24 with σ 30. Which means that
// at 10 pt from the edge the tip recedes 9 pt more and widens 10 more than
// at half height — more than the pill's round tip of radius 26 (5.5 and
// 3.7): the blob is more "pointed" than the pill. `veilTip` models it with
// a recede of 42 pt at the corner (against 26) and a spread of
// 10·√(recede/9). Verified backwards against f151 at half height with
// s = .8: .50/.65/.77/.87/.93/.97 at 12/18/24/30/36/42 pt against
// .53/.66/.78/.89/.96/.98 measured.
let TIP_SIGMA = 20.0, TIP_INSIDE = 15.0
let TIP_RECEDE = 42.0, TIP_SPREAD = 10.0
func veilTip(_ y: Double) -> (recede: Double, sigma: Double) {
    let r = PILL_HEIGHT / 2
    let dy = min(max(y - r, -r), r)
    let recede = TIP_RECEDE * (1 - (1 - (dy / r) * (dy / r)).squareRoot())
    return (recede, TIP_SIGMA + TIP_SPREAD * (recede / 9).squareRoot())
}
let VEIL_WIDTH = TIP_INSIDE + TIP_RECEDE + 3 * (TIP_SIGMA + 10)   // 147
// THE VEIL IS INVERTED PER CHANNEL. What you see at the clip's tip is
// coverage × the color of the blob's edge (pale green) + (1 − coverage) ×
// the pill: (150,172,156) at 18 pt, (211,246,222) at 36. A NEUTRAL dark
// veil over the white body gives grey, never that green (it cannot lower R
// without lowering G). So for each pixel the TARGET color is worked out and
// the veil (alpha, color) that, composited over what it has underneath (the
// body, with its rim), produces it exactly is solved for: alpha = max
// channel of (below − target)/below, color = below − (below − target)/alpha.
write("veil@3x.png", width: Int(VEIL_WIDTH * SCALE), height: Int(PILL_HEIGHT * SCALE)) { x, y in
    let (recede, sigma) = veilTip(y)
    let c = 0.5 * erfc(-(x - TIP_INSIDE - recede) / (sigma * 2.0.squareRoot()))
    let rim = rimColor(y)
    let t = smooth((c - 0.90) / 0.09)
    let edge = (lerp(PALE_GREEN.0, rim.0, t), lerp(PALE_GREEN.1, rim.1, t), lerp(PALE_GREEN.2, rim.2, t))
    let target = (lerp(30, edge.0, c), lerp(30, edge.1, c), lerp(30, edge.2, c))
    let below = rim
    let d = (max(0, below.0 - target.0), max(0, below.1 - target.1), max(0, below.2 - target.2))
    let alpha = max(d.0 / below.0, d.1 / below.1, d.2 / below.2)
    if alpha < 0.002 { return (30, 30, 30, 0) }
    return (below.0 - d.0 / alpha, below.1 - d.1 / alpha, below.2 - d.2 / alpha, alpha)
}

// ═══ 5. THE BLURRED LABELS — for the `.blurReplace` crossfade ════════
//
// React Native 0.86 ships `filter: blur()` on iOS, but behind the native
// flag `enableSwiftUIBasedFilters` (SOURCE: `ReactNativeFeatureFlagsDefaults.h`,
// returns false), which Expo does not turn on: in the installed Workshop.app
// the blur does not exist. A BlurView blurs what is BEHIND it, not a text,
// and Skia is not linked into the binary. So the label crossfade is built
// out of blurred copies of each text, rasterized here with the SAME
// typeface the phone draws: macOS's system font is the same SF Pro Text as
// iOS's at 17 pt, with its tracking table. They are drawn in white over
// transparent and React Native tints them with `tintColor`.
//
// TWO BLUR LEVELS PER LABEL, not one. With a single copy (σ 2.5) the
// crossfade was "sharp → ghost → sharp": a jump of focus, not a focusing.
// With two (σ 2.5 wide and σ 1.0 narrow) the incoming label runs
// wide → narrow → sharp and the eye reads it as a continuous focusing —
// the opacity staircase is in `label.tsx`. RUNTIME (clip, the stem of the
// "i" in Holding): the incoming one appears blurred 33 ms after the press,
// legible at 67, at 90 % by 133, and the peak keeps rising to ~380 ms: the
// focusing has a long tail. The maximum σ, 2.5 pt, is the one from the
// magnified strips (CROSSFADE.blur in measurements.ts): the ~2 pt stems end
// up at ~3.5 and the letters barely legible.
import AppKit
import CoreImage

let BLUR_LEVELS: [(String, Double)] = [("a", 2.5), ("b", 1.0)]   // suffix, σ in pt
/// Margin in px so that the halo does not get cut off: 3σ of the largest σ
/// in the batch, the same for every level of one label (so they stack up
/// centered).
func margin(_ levels: [(String, Double)]) -> Int { Int((levels.map { $0.1 }.max()! * SCALE * 3).rounded(.up)) }

func font(_ weight: NSFont.Weight) -> NSFont { NSFont.systemFont(ofSize: 17, weight: weight) }

/// Width of the ink (not of the advance): the comparable one against the clip.
func measure(_ s: String, _ f: NSFont) -> (width: Double, height: Double) {
    let a = NSAttributedString(string: s, attributes: [.font: f])
    let r = a.boundingRect(with: NSSize(width: 10000, height: 1000), options: [.usesLineFragmentOrigin])
    return (r.width, r.height)
}

// The check of weight and size against the clip, BEFORE deciding anything:
// the ink width measured in the clip (px/2.709) against the one SF gives here.
print("— ink widths in pt (clip → SF) —")
for (s, ref) in [("Hold to Commit", 121.1), ("Keep Holding...", 104.2), ("Keep Holding…", 104.2), ("Committed", 86.7)] {
    let sb = measure(s, font(.semibold)), b = measure(s, font(.bold)), m = measure(s, font(.medium))
    print(String(format: "  %@: clip %.1f · medium %.1f · semibold %.1f · bold %.1f", s, ref, m.width, sb.width, b.width))
}
for (s, ref) in [("No unblocks allowed", 151.0), ("10:00 PM", 62.4), ("Everyday", 64.2), ("5 Apps", 40.2), ("Apps are blocked", 137.7)] {
    var line = "  \(s): clip \(ref)"
    for pt in [15.0, 16.0, 17.0] {
        let r = measure(s, NSFont.systemFont(ofSize: pt, weight: .regular)); let sb = measure(s, NSFont.systemFont(ofSize: pt, weight: .semibold)); let b = measure(s, NSFont.systemFont(ofSize: pt, weight: .bold))
        line += String(format: " · %.0fpt reg %.1f sb %.1f b %.1f", pt, r.width, sb.width, b.width)
    }
    print(line)
}

/// Rasterizes in white over transparent, at 3x, and writes one copy per
/// blur level: `<name>-a@3x.png` (wide) and `<name>-b@3x.png` (narrow).
/// They all measure the same (the margin is the largest σ's), so they stack up centered.
func blurredLabel(_ name: String, levels: [(String, Double)] = BLUR_LEVELS, draw: (CGContext, Double, Double) -> Void, widthPt: Double, heightPt: Double) {
    let PAD = margin(levels)
    let w = Int((widthPt * SCALE).rounded(.up)) + 2 * PAD, h = Int((heightPt * SCALE).rounded(.up)) + 2 * PAD
    let cs = CGColorSpaceCreateDeviceRGB()
    let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.scaleBy(x: SCALE, y: SCALE)
    let gc = NSGraphicsContext(cgContext: ctx, flipped: false)
    NSGraphicsContext.saveGraphicsState(); NSGraphicsContext.current = gc
    draw(ctx, Double(PAD) / SCALE, Double(PAD) / SCALE)
    NSGraphicsContext.restoreGraphicsState()
    let sharp = ctx.makeImage()!
    let ci = CIImage(cgImage: sharp)
    for (suffix, sigmaPt) in levels {
        let filter = CIFilter(name: "CIGaussianBlur")!
        filter.setValue(ci, forKey: kCIInputImageKey); filter.setValue(sigmaPt * SCALE, forKey: kCIInputRadiusKey)
        let output = filter.outputImage!.cropped(to: ci.extent)
        let cg = CIContext(options: [.workingColorSpace: cs, .outputColorSpace: cs]).createCGImage(output, from: ci.extent)!
        let file = suffix.isEmpty ? "\(name)@3x.png" : "\(name)-\(suffix)@3x.png"
        let url = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent(file)
        let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
        CGImageDestinationAddImage(dest, cg, nil); CGImageDestinationFinalize(dest)
        print("wrote \(file) \(w)×\(h)  σ \(sigmaPt) pt  (content \(widthPt)×\(heightPt) pt + \(PAD) px of margin)")
    }
}

// THE BUTTON'S TEXTS changed on 2026-09-04 (Vito: "make the button at the
// bottom a buy button"): "Hold to Buy" / "Keep Holding..." / "✓ Order
// Placed". Opal's were "Hold to Commit" / "Keep Holding..." / "✓
// Committed", and they are still in the check above: the weight measurement
// (semibold) is from those and holds just the same, because the font, the
// size and the weight do not change. To go back: change these three strings
// and `LABEL` in measurements.ts.
let white: [NSAttributedString.Key: Any] = [.foregroundColor: NSColor.white]
for (name, text, weight) in [("hold-blurred", "Hold to Buy", NSFont.Weight.semibold), ("keep-blurred", "Keep Holding...", NSFont.Weight.semibold)] {
    let f = font(weight)
    let a = NSAttributedString(string: text, attributes: white.merging([.font: f]) { $1 })
    let m = a.size()
    blurredLabel(name, draw: { _, ox, oy in a.draw(at: NSPoint(x: ox, y: oy)) }, widthPt: Double(m.width), heightPt: Double(m.height))
}

// "✓ Committed": the `checkmark` symbol at 15 heavy (ink 14.1×13.2, stroke
// ~2.6), a gap, and the text in semibold (86.7 pt of ink in the clip =
// semibold, not bold). Both sizes get printed so that React Native's row
// uses the same box for the symbol and the same gap (LABEL.checkmarkToText).
let CHECKMARK_GAP = 9.0
let symbol = NSImage(systemSymbolName: "checkmark", accessibilityDescription: nil)!
    .withSymbolConfiguration(NSImage.SymbolConfiguration(pointSize: 15, weight: .heavy))!
let checkmarkSize = (width: Double(symbol.size.width), height: Double(symbol.size.height))
let commitFont = font(.semibold)
let commitText = NSAttributedString(string: "Order Placed", attributes: white.merging([.font: commitFont]) { $1 })
let commitSize = (width: Double(commitText.size().width), height: Double(commitText.size().height))
print(String(format: "  checkmark 15 heavy: box %.2f×%.2f pt · Committed: %.2f×%.2f pt", checkmarkSize.width, checkmarkSize.height, commitSize.width, commitSize.height))
let rowWidth: Double = checkmarkSize.width + CHECKMARK_GAP + commitSize.width
let rowHeight: Double = max(checkmarkSize.height, commitSize.height)
blurredLabel("committed-blurred", draw: { ctx, ox, oy in
    // the symbol in white: it is drawn as a mask with sourceAtop
    let r = NSRect(x: ox, y: oy + (rowHeight - checkmarkSize.height) / 2, width: checkmarkSize.width, height: checkmarkSize.height)
    let tinted = NSImage(size: NSSize(width: checkmarkSize.width, height: checkmarkSize.height), flipped: false) { rect in
        symbol.draw(in: rect); NSColor.white.set(); rect.fill(using: .sourceAtop); return true
    }
    tinted.draw(in: r)
    commitText.draw(at: NSPoint(x: ox + checkmarkSize.width + CHECKMARK_GAP, y: oy + (rowHeight - commitSize.height) / 2))
}, widthPt: rowWidth, heightPt: rowHeight)

// THE `skill` RECIPE (2026-09-07) separates the checkmark from the text:
// "Order Placed" comes in with the usual blur-replace and the checkmark
// comes in separately with better-ui's contextual icon technique — "scale
// 0.25 to 1, opacity 0 to 1, blur 4px to 0px". So the text alone is needed,
// at the usual two levels, and the checkmark alone blurred at σ 4 pt (one
// level). Each PNG's margin is 3σ of the largest σ in its batch: 23 px
// (7.67 pt) for the texts and 36 px (12 pt) for the checkmark; `label.tsx`
// subtracts them with negative margins so that the blurred copy's layout
// box is the content's.
blurredLabel("placed-blurred", draw: { _, ox, oy in
    commitText.draw(at: NSPoint(x: ox, y: oy))
}, widthPt: commitSize.width, heightPt: commitSize.height)
blurredLabel("checkmark-blurred", levels: [("", 4.0)], draw: { _, ox, oy in
    let tinted = NSImage(size: NSSize(width: checkmarkSize.width, height: checkmarkSize.height), flipped: false) { rect in
        symbol.draw(in: rect); NSColor.white.set(); rect.fill(using: .sourceAtop); return true
    }
    tinted.draw(in: NSRect(x: ox, y: oy, width: checkmarkSize.width, height: checkmarkSize.height))
}, widthPt: checkmarkSize.width, heightPt: checkmarkSize.height)


// ═══ 6. THE SPARK — the dot of light that travels inside the pill ════
//
// RUNTIME (clip, f64–f182, `chispas.py`/`chispas2.py`): dots of 1.5–2 pt of
// ink (area 8–24 px² at 2.709 px/pt) and +18..+59 of luminance over
// backgrounds of 60–110 — white at 25–45 % opacity, with no hard edge. A
// sharp circle of 1.5 pt at 3x is 4.5 px with a step in it; a small
// gaussian looks like it does in the clip. Box of 8 pt, σ = 1.4 pt: at the
// edge it comes to exp(−4.1) ≈ 2 %, so the texture does not get cut off.
let SPARK_BOX = 8.0, SPARK_SIGMA = 1.4
write("spark@3x.png", width: Int(SPARK_BOX * SCALE), height: Int(SPARK_BOX * SCALE)) { x, y in
    let r = ((x - SPARK_BOX / 2) * (x - SPARK_BOX / 2) + (y - SPARK_BOX / 2) * (y - SPARK_BOX / 2)).squareRoot()
    return (255, 255, 255, gauss(r, SPARK_SIGMA))
}
