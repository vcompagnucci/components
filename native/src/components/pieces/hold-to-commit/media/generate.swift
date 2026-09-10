// LOS BRILLOS DEL PILL, GENERADOS — no dibujados a mano.
//
//   swift generar.swift        (desde esta carpeta; escribe los @3x al lado)
//
// Cada PNG es un perfil MEDIDO del clip de referencia
// (`VAULT_DIR/nativo/Hold to commit.mp4`, 2.709 px/pt), convertido a RGBA
// sobre el fondo real del pill. El recibo de cada número está arriba de
// cada función y, en puntos, en `../medidas.ts`. No hay CIFilter ni blur
// de verdad: las caídas son gaussianas/erfc calculadas píxel a píxel, que
// es lo que un blur produciría, pero determinista y sin dependencia.
//
// Por qué PNG y no vistas: un degradé suave con borde difuso no existe en
// React Native sin un módulo nativo (linear-gradient, Skia, masked-view),
// y este taller corre también en Expo Go, donde Skia no está. Una textura
// trasladada es lo más barato que hay para el compositor.
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let ESCALA = 3.0                      // @3x: el iPhone 17 Pro Max
let PILL_ANCHO = 382.0, PILL_ALTO = 52.0
let RIM = 11.0                        // pt de borde verde pálido arriba/abajo del blob (RUNTIME: f151, x=400)
let VERDE_PALIDO = (218.0, 255.0, 228.0)  // RUNTIME: derivado de (215,252,227) sobre (31,36,34) a alpha .986

typealias Pixel = (r: Double, g: Double, b: Double, a: Double)

func escribir(_ nombre: String, ancho: Int, alto: Int, pixel: (Double, Double) -> Pixel) {
    var datos = [UInt8](repeating: 0, count: ancho * alto * 4)
    for y in 0..<alto {
        for x in 0..<ancho {
            let p = pixel((Double(x) + 0.5) / ESCALA, (Double(y) + 0.5) / ESCALA)
            let a = max(0, min(1, p.a))
            let i = (y * ancho + x) * 4
            // premultiplicado: es lo que pide kCGImageAlphaPremultipliedLast
            datos[i] = UInt8(max(0, min(255, p.r * a)).rounded())
            datos[i + 1] = UInt8(max(0, min(255, p.g * a)).rounded())
            datos[i + 2] = UInt8(max(0, min(255, p.b * a)).rounded())
            datos[i + 3] = UInt8((a * 255).rounded())
        }
    }
    let cs = CGColorSpaceCreateDeviceRGB()
    let ctx = CGContext(data: &datos, width: ancho, height: alto, bitsPerComponent: 8, bytesPerRow: ancho * 4, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    let img = ctx.makeImage()!
    let url = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent(nombre)
    let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
    CGImageDestinationAddImage(dest, img, nil)
    CGImageDestinationFinalize(dest)
    print("escrito \(nombre) \(ancho)×\(alto)")
}

func gauss(_ d: Double, _ sigma: Double) -> Double { exp(-(d * d) / (2 * sigma * sigma)) }
func lerp(_ a: Double, _ b: Double, _ t: Double) -> Double { a + (b - a) * max(0, min(1, t)) }
func smooth(_ t: Double) -> Double { let u = max(0, min(1, t)); return u * u * (3 - 2 * u) }
/// erfc numérica (Abramowitz-Stegun 7.1.26), alcanza de sobra para un perfil.
func erfc(_ x: Double) -> Double {
    let z = abs(x), t = 1 / (1 + 0.5 * z)
    let r = t * exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))))
    return x >= 0 ? r : 2 - r
}

/// El borde verde del blob: blanco en el centro, verde pálido en las
/// primeras `RIM` pt desde arriba y desde abajo. RUNTIME: f151 x=400, las
/// filas 1218..1248 van de (231,255,237) a (255,255,255) en ~30 px.
func colorRim(_ y: Double) -> (Double, Double, Double) {
    let d = min(y, PILL_ALTO - y)               // distancia al borde más cercano
    let t = smooth(d / RIM)                      // 0 en el borde → 1 a RIM pt
    return (lerp(VERDE_PALIDO.0, 255, t), lerp(VERDE_PALIDO.1, 255, t), lerp(VERDE_PALIDO.2, 255, t))
}

/// RUNTIME · fracción del pico de G en la fila y=1340 del clip, cada 22 pt
/// desde la punta izquierda del pill (x = 0 .. 382).
let ENVOLVENTE: [(Double, Double)] = [(0, 0.05), (22, 0.14), (44, 0.38), (66, 0.58), (89, 0.74), (111, 0.81), (133, 0.82), (155, 0.91), (177, 0.98), (199, 1.0), (221, 0.94), (244, 0.86), (266, 0.83), (288, 0.74), (310, 0.59), (332, 0.34), (354, 0.14), (382, 0.04)]
/// RUNTIME (2026-09-03, f40, filas a 10 y 14 pt del borde SUPERIOR, base 30):
/// arriba el brillo es más "cuadrado": parejo (.85–1) del 25 al 75 % del
/// ancho y apagado del todo antes del 10 % y después del 95 %, mientras
/// que abajo cae gradual hacia las puntas (.12 / .24 a 5 / 10 %). Con la
/// envolvente de abajo en todas las filas, la fila de arriba en captura
/// daba 34/38/40/43/45/46/44/43/40/33 contra 30/41/44/43/44/45/44/39/33
/// del clip: 4 de más en las puntas, 3–4 de menos en el medio.
let ENVOLVENTE_ARRIBA: [(Double, Double)] = [(0, 0), (38, 0), (57, 0.33), (76, 0.72), (96, 0.87), (115, 0.95), (134, 0.95), (153, 0.90), (172, 0.95), (191, 0.97), (210, 1.0), (229, 1.0), (248, 0.97), (267, 0.97), (286, 0.85), (306, 0.67), (325, 0.37), (344, 0.23), (363, 0.03), (382, 0)]
func interpolar(_ tabla: [(Double, Double)], _ x: Double) -> Double {
    if x <= tabla[0].0 { return tabla[0].1 }
    for i in 1..<tabla.count {
        let (x0, v0) = tabla[i - 1], (x1, v1) = tabla[i]
        if x <= x1 { return lerp(v0, v1, (x - x0) / (x1 - x0)) }
    }
    return tabla.last!.1
}
func envolvente(_ x: Double) -> Double { interpolar(ENVOLVENTE, x) }
/// La envolvente por fila: la de abajo hasta 8 pt del borde inferior, la
/// de arriba desde 40, y un paso suave entre las dos (las filas del
/// medio están tapadas por el texto en el clip: no hay medida).
func envolventeEn(_ x: Double, d: Double) -> Double {
    lerp(envolvente(x), interpolar(ENVOLVENTE_ARRIBA, x), smooth((d - 8) / 32))
}

// ── 1. sheen.png — el brillo ambiente en reposo ─────────────────────
// Un blob teal→verde pegado al borde INFERIOR del pill. Dos gaussianas
// verticales (una angosta y brillante, una ancha y tenue) porque una sola
// no ajusta el perfil medido; una gaussiana horizontal de σ=100 pt.
//   RUNTIME (x=600, alfa sobre #1E1E1E leído del canal G, d en pt desde abajo):
//     1.5 .54  3.7 .52  5.9 .49  8.1 .45  10.3 .42  12.5 .38  14.8 .33  17 .31
//     34.7 .10  36.9 .09  39 .076  41.3 .067  43.6 .053  45.8 .04  48 .027
//   .40·g(d,13) + .18·g(d,30) da .50/.32/.10/.063 en 8.1/17/34.7/43.6.
//   (Con σ=11 la mitad inferior salía 20 % apagada en pantalla.)
//   RUNTIME (2026-09-03, columnas del clip f40 en x = 30/50/70 % contra
//   captura, a la misma distancia en pt del borde superior): .42·g(13) +
//   .18·g(28) daba rms 4.9 de luminancia y la banda de 18–34 pt quedaba
//   5–12 apagada; el ajuste por búsqueda en grilla da .32·g(12) +
//   .28·g(26), rms 4.4 — la gaussiana ancha pesa más y la angosta menos.
//   RUNTIME (y=1340, horizontal desde el centro, alfa relativa al pico):
//     0: 1.0  ±74: .80  ±120: .57  ±144: .36  ±170: .14
//   NO es una gaussiana ni una meseta: sube rápido por la izquierda, tiene
//   un hombro en ~90–130 pt, el pico pasando el centro (~200) y baja lento
//   por la derecha. Dos modelos simétricos (σ=100; meseta ±36 + σ=76)
//   dieron ±13 de luminancia en los hombros. Así que la envolvente ES la
//   tabla medida en la fila del borde inferior del clip (y=1340), en
//   fracción del pico, interpolada. El vertical la normaliza (a 2.7 pt del
//   borde el vertical vale .92 del pico):
//   LOS COLORES, despejando alfa sobre (30,30,30) en la fila del borde
//   inferior, normalizados a G=255 (t = x / ancho del pill):
//     t .13 (.72,1,.93)  .30 (.66,1,.92)  .475 (.69,1,.87)   ← teal hasta el centro
//     t .53 (.71,1,.76)  .59 (.72,1,.70)  .71 (.73,1,.63)  .82 (.72,1,.66)  ← verde-amarillo
//   El viraje es corto (≈15 % del ancho) y está justo pasando el centro.
escribir("sheen@3x.png", ancho: Int(PILL_ANCHO * ESCALA), alto: Int(PILL_ALTO * ESCALA)) { x, y in
    let d = PILL_ALTO - y                        // pt por encima del borde inferior
    let vertical = 0.32 * gauss(d, 12) + 0.28 * gauss(d, 26)
    let horizontal = envolventeEn(x, d: d)
    let t = x / PILL_ANCHO
    // teal (B≈G) hasta el centro; el viraje a verde-amarillo es corto y
    // arranca pasando la mitad (RUNTIME: a mitad de altura el centro da
    // (74,99,97), B≈G; la fila del borde vira entre t=.47 y .59).
    let v = smooth((t - 0.44) / 0.10)
    let c: (Double, Double, Double) = (lerp(170, 186, v), 255, lerp(236, 150, v))
    return (c.0, c.1, c.2, vertical * horizontal)
}

// ── 2. body.png — el cuerpo del relleno, sólo perfil vertical ───────
// 3 px de ancho; React Native lo estira a lo ancho (resizeMode 'stretch').
// Opaco, con el rim verde pálido de `colorRim`.
escribir("body@3x.png", ancho: 3, alto: Int(PILL_ALTO * ESCALA)) { _, y in
    let c = colorRim(y); return (c.0, c.1, c.2, 1)
}

// ── 3. front.png — el borde de ataque del relleno ────────────────────
// La caída del frente es una erfc de σ=19 pt CENTRADA EN EL BORDE
// GEOMÉTRICO (el borde derecho del cuerpo), y tiene forma de cápsula: en
// las filas cercanas al borde superior e inferior el frente recede como
// la punta redonda del pill (radio 26).
//   RUNTIME (f151, y=1283): del 90 % al 10 % de cobertura hay 139 px =
//   51 pt → σ = 51 / 2.56 ≈ 19. (Una primera lectura dio 13 por tomar mal
//   el tramo; en pantalla el frente salía duro y 8 % adelantado.)
//   RUNTIME (f122, fila a 10 pt del borde superior): el punto al 50 %
//   cae 9 pt detrás del de media altura, lo que una punta de radio 26
//   explica (recede 5.5 pt a 10 pt del borde) junto con el σ.
// La imagen abarca 3σ + R = 83 pt por delante del borde geométrico y 3σ
// por detrás: [−83, +57]. El cuerpo termina 83 pt antes del borde
// geométrico y el frente lo continúa opaco hasta la caída.
// El color se vuelve verde pálido donde el alfa baja de ~.97: en la
// referencia el blanco puro sólo existe bien adentro del blob.
let FRENTE_SIGMA = 19.0
let FRENTE_ANTES = 3 * FRENTE_SIGMA + PILL_ALTO / 2   // 83
let FRENTE_DESPUES = 3 * FRENTE_SIGMA                 // 57
/// Cuánto recede una punta redonda de radio r en la fila y, y con qué σ
/// se desenfoca ahí. RUNTIME (f151, punta izq): a 10 pt del borde
/// superior la rampa es ~1.5× más ancha que a media altura (0.80 de
/// cobertura a +36 pt contra 0.96) — el desenfoque de un borde curvo se
/// ensancha hacia las esquinas. σ = σ0 + 8·√(recede / r) lo reproduce.
func punta(_ y: Double, _ sigma0: Double) -> (recede: Double, sigma: Double) {
    let r = PILL_ALTO / 2
    let dy = min(max(y - r, -r), r)
    let recede = r - (r * r - dy * dy).squareRoot()
    return (recede, sigma0 + 8 * (recede / r).squareRoot())
}
let FRENTE_ANCHO = FRENTE_ANTES + FRENTE_DESPUES      // 140
escribir("front@3x.png", ancho: Int(FRENTE_ANCHO * ESCALA), alto: Int(PILL_ALTO * ESCALA)) { x, y in
    let (recede, sigma) = punta(y, FRENTE_SIGMA)
    let a = 0.5 * erfc((x - (FRENTE_ANTES - recede)) / (sigma * 2.0.squareRoot()))
    let rim = colorRim(y)
    let t = smooth((a - 0.90) / 0.09)             // 1 = blanco (a≥.99), 0 = verde pálido (a≤.90)
    return (lerp(VERDE_PALIDO.0, rim.0, t), lerp(VERDE_PALIDO.1, rim.1, t), lerp(VERDE_PALIDO.2, rim.2, t), a)
}

// ── 4. veil.png — la punta izquierda del blob ───────────────────────────
// El blob es UNA cápsula desenfocada cuyo extremo izquierdo queda adentro
// de la punta del pill y cuyo extremo derecho es el frente. El cuerpo
// blanco no puede tener ese extremo (viaja con el frente), así que la
// punta se hace con un VELO del color del pill encima del cuerpo, con
// alfa = 1 − cobertura de la cápsula: se prende y apaga junto con el
// blob y, terminado, el velo blanco al 75 % lo deja asomar como en el
// clip.
//
// LA PUNTA SE OSCURECE Y SE ENSANCHA A MEDIDA QUE EL FRENTE SE ALEJA
// (2026-09-03, `evolucion.py`, fila a 10 pt del borde superior, a 38 pt
// de la punta): 249 en f88 (p .22) · 248 f100 · 240 f118 (.47) · 228
// f130 · 213 f142 · 207 f148 (.72) · 199 f160 · 192 f172 · 183 f181
// (.99). Y a 19 pt: 201 → 165 → 145 → 128. Un velo fijo no puede hacer
// eso; una sola textura ESCALADA en x desde la punta sí: con la textura
// del final (f181) y escala s(p) = .25 + .75·p, el perfil V(x/s)
// reproduce f88 (s .4: 53/5 de oscurecimiento a 19/38 pt contra 50/2),
// f124 (s .6: 89/19 contra 89/20), f151 (s .8: 109/47 contra 112/50) y
// f166 (s .9: 119/60/20 contra 120/63/21). La escala vive en
// `VELO.escala` de medidas.ts y la aplica el botón.
//
// LA TEXTURA ES LA DEL FINAL. RUNTIME (f181, cobertura del cuerpo desde
// la punta): a media altura .57 / .88 / .98 en 19 / 38 / 57 pt → erfc
// centrada a 15 pt con σ 20; a 10 pt del borde .44 / .68 / .86 / .96 en
// 19 / 38 / 57 / 76 → centrada a 24 con σ 30. O sea que a 10 pt del borde
// la punta recede 9 pt más y se ensancha 10 más que a media altura —
// más que la punta redonda de radio 26 del pill (5.5 y 3.7): el blob es
// más "puntudo" que el pill. `puntaVelo` lo modela con un recede de 42 pt
// en la esquina (contra 26) y un ensanche de 10·√(recede/9).
// Verificado hacia atrás contra f151 a media altura con s = .8:
// .50/.65/.77/.87/.93/.97 en 12/18/24/30/36/42 pt contra .53/.66/.78/
// .89/.96/.98 medidos.
let PUNTA_SIGMA = 20.0, PUNTA_ADENTRO = 15.0
let PUNTA_RECEDE = 42.0, PUNTA_ENSANCHE = 10.0
func puntaVelo(_ y: Double) -> (recede: Double, sigma: Double) {
    let r = PILL_ALTO / 2
    let dy = min(max(y - r, -r), r)
    let recede = PUNTA_RECEDE * (1 - (1 - (dy / r) * (dy / r)).squareRoot())
    return (recede, PUNTA_SIGMA + PUNTA_ENSANCHE * (recede / 9).squareRoot())
}
let VELO_ANCHO = PUNTA_ADENTRO + PUNTA_RECEDE + 3 * (PUNTA_SIGMA + 10)   // 147
// EL VELO SE INVIERTE POR CANAL. Lo que se ve en la punta del clip es
// cobertura × color del borde del blob (verde pálido) + (1 − cobertura) ×
// pill: (150,172,156) a 18 pt, (211,246,222) a 36. Un velo oscuro NEUTRO
// sobre el cuerpo blanco da gris, nunca ese verde (no puede bajar R sin
// bajar G). Así que para cada píxel se calcula el color OBJETIVO y se
// despeja el velo (alfa, color) que, compuesto sobre lo que tiene abajo
// —el cuerpo, con su rim—, lo produce exacto: alfa = máx canal de
// (abajo − objetivo)/abajo, color = abajo − (abajo − objetivo)/alfa.
escribir("veil@3x.png", ancho: Int(VELO_ANCHO * ESCALA), alto: Int(PILL_ALTO * ESCALA)) { x, y in
    let (recede, sigma) = puntaVelo(y)
    let c = 0.5 * erfc(-(x - PUNTA_ADENTRO - recede) / (sigma * 2.0.squareRoot()))
    let rim = colorRim(y)
    let t = smooth((c - 0.90) / 0.09)
    let borde = (lerp(VERDE_PALIDO.0, rim.0, t), lerp(VERDE_PALIDO.1, rim.1, t), lerp(VERDE_PALIDO.2, rim.2, t))
    let objetivo = (lerp(30, borde.0, c), lerp(30, borde.1, c), lerp(30, borde.2, c))
    let abajo = rim
    let d = (max(0, abajo.0 - objetivo.0), max(0, abajo.1 - objetivo.1), max(0, abajo.2 - objetivo.2))
    let alfa = max(d.0 / abajo.0, d.1 / abajo.1, d.2 / abajo.2)
    if alfa < 0.002 { return (30, 30, 30, 0) }
    return (abajo.0 - d.0 / alfa, abajo.1 - d.1 / alfa, abajo.2 - d.2 / alfa, alfa)
}

// ═══ 5. LOS LABELS DESENFOCADOS — para el cruce `.blurReplace` ═══════
//
// React Native 0.86 trae `filter: blur()` en iOS, pero detrás de la bandera
// nativa `enableSwiftUIBasedFilters` (SOURCE: `ReactNativeFeatureFlagsDefaults.h`,
// devuelve false), que Expo no prende: en el Taller.app instalado el blur
// no existe. Un BlurView desenfoca lo que hay DETRÁS, no un texto, y Skia
// no está linkeado en el binario. Así que el cruce de labels se arma con
// copias desenfocadas de cada texto, rasterizadas acá con la MISMA
// tipografía que dibuja el teléfono: el system font de macOS es el mismo
// SF Pro Text que el de iOS a 17 pt, con su tabla de tracking. Se dibujan
// en blanco sobre transparente y React Native las tiñe con `tintColor`.
//
// DOS NIVELES DE BLUR POR LABEL, no uno. Con una sola copia (σ 2.5) el
// cruce era "nítido → fantasma → nítido": un salto de foco, no un enfoque.
// Con dos (σ 2.5 ancho y σ 1.0 angosto) el label entrante recorre
// ancho → angosto → nítido y el ojo lo lee como un enfoque continuo — la
// escalera de opacidades está en `etiqueta.tsx`. RUNTIME (clip, asta de
// la "i" de Holding): el entrante aparece borroso a los 33 ms del press,
// legible a los 67, al 90 % a los 133, y el pico sigue subiendo hasta los
// ~380 ms: el enfoque tiene cola larga. El σ máximo, 2.5 pt, es el de las
// tiras ampliadas (CRUCE.blur en medidas.ts): las astas de ~2 pt quedan
// en ~3.5 y las letras apenas legibles.
import AppKit
import CoreImage

let NIVELES_BLUR: [(String, Double)] = [("a", 2.5), ("b", 1.0)]   // sufijo, σ en pt
/// Margen en px para que el halo no se corte: 3σ del σ mayor de la tanda,
/// igual en todos los niveles de un mismo label (así se apilan centrados).
func margen(_ niveles: [(String, Double)]) -> Int { Int((niveles.map { $0.1 }.max()! * ESCALA * 3).rounded(.up)) }

func fuente(_ peso: NSFont.Weight) -> NSFont { NSFont.systemFont(ofSize: 17, weight: peso) }

/// Ancho de la tinta (no del avance): lo comparable con el clip.
func medir(_ s: String, _ f: NSFont) -> (ancho: Double, alto: Double) {
    let a = NSAttributedString(string: s, attributes: [.font: f])
    let r = a.boundingRect(with: NSSize(width: 10000, height: 1000), options: [.usesLineFragmentOrigin])
    return (r.width, r.height)
}

// La verificación de peso y tamaño contra el clip, ANTES de decidir nada:
// el ancho de tinta medido en el clip (px/2.709) contra el que da SF acá.
print("— anchos de tinta en pt (clip → SF) —")
for (s, ref) in [("Hold to Commit", 121.1), ("Keep Holding...", 104.2), ("Keep Holding…", 104.2), ("Committed", 86.7)] {
    let sb = medir(s, fuente(.semibold)), b = medir(s, fuente(.bold)), m = medir(s, fuente(.medium))
    print(String(format: "  %@: clip %.1f · medium %.1f · semibold %.1f · bold %.1f", s, ref, m.ancho, sb.ancho, b.ancho))
}
for (s, ref) in [("No unblocks allowed", 151.0), ("10:00 PM", 62.4), ("Everyday", 64.2), ("5 Apps", 40.2), ("Apps are blocked", 137.7)] {
    var linea = "  \(s): clip \(ref)"
    for pt in [15.0, 16.0, 17.0] {
        let r = medir(s, NSFont.systemFont(ofSize: pt, weight: .regular)); let sb = medir(s, NSFont.systemFont(ofSize: pt, weight: .semibold)); let b = medir(s, NSFont.systemFont(ofSize: pt, weight: .bold))
        linea += String(format: " · %.0fpt reg %.1f sb %.1f b %.1f", pt, r.ancho, sb.ancho, b.ancho)
    }
    print(linea)
}

/// Rasteriza en blanco sobre transparente, a 3x, y escribe una copia por
/// nivel de blur: `<nombre>-a@3x.png` (ancho) y `<nombre>-b@3x.png` (angosto).
/// Todas miden lo mismo (el margen es el del σ mayor), así se apilan centradas.
func labelBorroso(_ nombre: String, niveles: [(String, Double)] = NIVELES_BLUR, dibujar: (CGContext, Double, Double) -> Void, anchoPt: Double, altoPt: Double) {
    let PAD = margen(niveles)
    let w = Int((anchoPt * ESCALA).rounded(.up)) + 2 * PAD, h = Int((altoPt * ESCALA).rounded(.up)) + 2 * PAD
    let cs = CGColorSpaceCreateDeviceRGB()
    let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.scaleBy(x: ESCALA, y: ESCALA)
    let gc = NSGraphicsContext(cgContext: ctx, flipped: false)
    NSGraphicsContext.saveGraphicsState(); NSGraphicsContext.current = gc
    dibujar(ctx, Double(PAD) / ESCALA, Double(PAD) / ESCALA)
    NSGraphicsContext.restoreGraphicsState()
    let nitido = ctx.makeImage()!
    let ci = CIImage(cgImage: nitido)
    for (sufijo, sigmaPt) in niveles {
        let filtro = CIFilter(name: "CIGaussianBlur")!
        filtro.setValue(ci, forKey: kCIInputImageKey); filtro.setValue(sigmaPt * ESCALA, forKey: kCIInputRadiusKey)
        let salida = filtro.outputImage!.cropped(to: ci.extent)
        let cg = CIContext(options: [.workingColorSpace: cs, .outputColorSpace: cs]).createCGImage(salida, from: ci.extent)!
        let archivo = sufijo.isEmpty ? "\(nombre)@3x.png" : "\(nombre)-\(sufijo)@3x.png"
        let url = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent(archivo)
        let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
        CGImageDestinationAddImage(dest, cg, nil); CGImageDestinationFinalize(dest)
        print("escrito \(archivo) \(w)×\(h)  σ \(sigmaPt) pt  (contenido \(anchoPt)×\(altoPt) pt + \(PAD) px de margen)")
    }
}

// LOS TEXTOS DEL BOTÓN cambiaron el 2026-09-04 (Vito: "que el botón de abajo
// sea para comprar"): "Hold to Buy" / "Keep Holding..." / "✓ Order Placed".
// Los de Opal eran "Hold to Commit" / "Keep Holding..." / "✓ Committed", y
// siguen en la verificación de arriba: la medida de peso (semibold) es de
// ellos y vale igual, porque la fuente, el tamaño y el peso no cambian.
// Para volver: cambiar estos tres strings y `LABEL` en medidas.ts.
let blanco: [NSAttributedString.Key: Any] = [.foregroundColor: NSColor.white]
for (nombre, texto, peso) in [("hold-borroso", "Hold to Buy", NSFont.Weight.semibold), ("keep-borroso", "Keep Holding...", NSFont.Weight.semibold)] {
    let f = fuente(peso)
    let a = NSAttributedString(string: texto, attributes: blanco.merging([.font: f]) { $1 })
    let m = a.size()
    labelBorroso(nombre, dibujar: { _, ox, oy in a.draw(at: NSPoint(x: ox, y: oy)) }, anchoPt: Double(m.width), altoPt: Double(m.height))
}

// "✓ Committed": el símbolo `checkmark` a 15 heavy (tinta 14.1×13.2, trazo ~2.6), un
// hueco, y el texto en semibold (86.7 pt de tinta en el clip = semibold, no bold).
// Los dos tamaños se imprimen para que la fila de React Native use la
// misma caja para el símbolo y el mismo hueco (LABEL.tildeATexto).
let TILDE_HUECO = 9.0
let simbolo = NSImage(systemSymbolName: "checkmark", accessibilityDescription: nil)!
    .withSymbolConfiguration(NSImage.SymbolConfiguration(pointSize: 15, weight: .heavy))!
let tildeTam = (ancho: Double(simbolo.size.width), alto: Double(simbolo.size.height))
let commitFuente = fuente(.semibold)
let commitTexto = NSAttributedString(string: "Order Placed", attributes: blanco.merging([.font: commitFuente]) { $1 })
let commitTam = (ancho: Double(commitTexto.size().width), alto: Double(commitTexto.size().height))
print(String(format: "  checkmark 15 heavy: caja %.2f×%.2f pt · Committed: %.2f×%.2f pt", tildeTam.ancho, tildeTam.alto, commitTam.ancho, commitTam.alto))
let filaAncho: Double = tildeTam.ancho + TILDE_HUECO + commitTam.ancho
let filaAlto: Double = max(tildeTam.alto, commitTam.alto)
labelBorroso("committed-borroso", dibujar: { ctx, ox, oy in
    // el símbolo en blanco: se dibuja como máscara con sourceAtop
    let r = NSRect(x: ox, y: oy + (filaAlto - tildeTam.alto) / 2, width: tildeTam.ancho, height: tildeTam.alto)
    let tinte = NSImage(size: NSSize(width: tildeTam.ancho, height: tildeTam.alto), flipped: false) { rect in
        simbolo.draw(in: rect); NSColor.white.set(); rect.fill(using: .sourceAtop); return true
    }
    tinte.draw(in: r)
    commitTexto.draw(at: NSPoint(x: ox + tildeTam.ancho + TILDE_HUECO, y: oy + (filaAlto - commitTam.alto) / 2))
}, anchoPt: filaAncho, altoPt: filaAlto)

// LA RECETA `skill` (2026-09-07) separa el tilde del texto: "Order Placed"
// entra con el blur-replace de siempre y el tilde entra aparte con la
// técnica de ícono contextual de better-ui —"scale 0.25 to 1, opacity 0
// to 1, blur 4px to 0px"—. Así que hacen falta el texto solo, en los dos
// niveles de siempre, y el tilde solo desenfocado a σ 4 pt (un nivel).
// El margen de cada PNG es 3σ del σ mayor de su tanda: 23 px (7.67 pt)
// para los textos y 36 px (12 pt) para el tilde; `etiqueta.tsx` los
// descuenta con márgenes negativos para que la caja de layout de la
// copia borrosa sea la del contenido.
labelBorroso("placed-borroso", dibujar: { _, ox, oy in
    commitTexto.draw(at: NSPoint(x: ox, y: oy))
}, anchoPt: commitTam.ancho, altoPt: commitTam.alto)
labelBorroso("checkmark-blurred", niveles: [("", 4.0)], dibujar: { _, ox, oy in
    let tinte = NSImage(size: NSSize(width: tildeTam.ancho, height: tildeTam.alto), flipped: false) { rect in
        simbolo.draw(in: rect); NSColor.white.set(); rect.fill(using: .sourceAtop); return true
    }
    tinte.draw(in: NSRect(x: ox, y: oy, width: tildeTam.ancho, height: tildeTam.alto))
}, anchoPt: tildeTam.ancho, altoPt: tildeTam.alto)


// ═══ 6. LA CHISPA — el punto de luz que viaja adentro del pill ═══════
//
// RUNTIME (clip, f64–f182, `chispas.py`/`chispas2.py`): puntos de 1.5–2 pt
// de tinta (área 8–24 px² a 2.709 px/pt) y +18..+59 de luminancia sobre
// fondos de 60–110 — blanco a un 25–45 % de opacidad, sin borde duro. Un
// círculo nítido de 1.5 pt a 3x son 4.5 px con escalón; una gaussiana
// chica se ve como en el clip. Caja de 8 pt, σ = 1.4 pt: en el borde queda
// exp(−4.1) ≈ 2 %, así la textura no se corta.
let CHISPA_CAJA = 8.0, CHISPA_SIGMA = 1.4
escribir("spark@3x.png", ancho: Int(CHISPA_CAJA * ESCALA), alto: Int(CHISPA_CAJA * ESCALA)) { x, y in
    let r = ((x - CHISPA_CAJA / 2) * (x - CHISPA_CAJA / 2) + (y - CHISPA_CAJA / 2) * (y - CHISPA_CAJA / 2)).squareRoot()
    return (255, 255, 255, gauss(r, CHISPA_SIGMA))
}
