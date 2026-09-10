# Design system

Everything that was decided, with its value, where it lives and where
it came from.

The README tells **what** was decided and why. This document is the
reference: the tokens, their values at each viewport, and the rules
that govern how the missing ones get added.

---

## How to read this

Every value carries its evidence grade. They are not decoration. The
grade says how much you can trust the number and what it would take to
change it.

| | what it means |
|---|---|
| **MEASURED** | read from the code a reference serves and verified against its rendered HTML, not only against its style sheet |
| **CHOSEN** | decided by eye on the real page with a scrubber or a picker, because there was nothing to copy |
| **INHERITED** | comes from the `DESIGN.md` of Carousels. **It cannot be verified**, because that file is not in the repo and not on the disk. They are decisions already taken and they are respected, but their source is a blind quotation |
| **SCAFFOLDING** | a value from the initial scaffolding that nobody has decided yet |

The complete measurements are in `.context/recon/`:
`TYPE-SYSTEMS.md`, `RESPONSIVE.md`, `NAVIGATION.md`.

---

## The four rules of the system

They came out of measuring the references and they hold for everything
added from here on.

### 1 · Encode what cannot be seen; comment what can

The `calc` in `--section-content-gap` exists because it corrects half a
line box, an **invisible** artifact. Without it you choose 32 and the
screen gives you 41.5. The grouping invariant, on the other hand,
carries no `calc`, because if it breaks **you see it at once**.

It is benji's practice, verified across his 130 KB of CSS: he writes
literally what he chooses, he uses a variable only for what repeats in
two places, and he saves `calc` for geometry, like centering a 9px
circle against a box of 20. **Zero spacings derived from another one by
proportion.**

Deriving also fights the ×4 rule: any ratio over an arbitrary base
gives dirty numbers.

### 2 · ×4 in layout, free inside components

Every layout spacing is a multiple of 4. Inside a component it does not
apply.

That is his split. He uses 2, 3, 5, 6 and 10 (the 6px shows up **28
times**) but only in `.Toolbar_*`, `.BarSlider_field`, `.submitButton`
and `[data-size=sm]` variants. Not one single time in a page layout.

> Today we have nothing internal: the card is empty and the only
> component is the detail's arrow, which is scaffolding. The fine scale
> gets defined with the first real piece, not before.

### 3 · Never a jump smaller than 40 between two levels of the same hierarchy

It holds for the weights. The full count of his `font-weight` gives
`100·200·400·430·450·460·500·560·600·620·700·800`, so he does have
small jumps. But **430** is for italics (the italic looks heavier and
he compensates by dropping 30) and **450** is for component internals.
Optical compensation and one-offs, never steps.

### 4 · The name is the role; the value is contextual

A token is not named after its value but after what it belongs to, and
the same name can be worth something different depending on the
context.

Measured across 1.3 MB of CSS served by apple, linear and openai:
**none of the three has a token named after its value.** There is not
one single `--space-4` in the three bundles.

```
linear   --button-gap · --kbd-gap · --button-icon-size
openai   --page-top-gap · --tabs-sticky-gap · --bottom-content-padding
apple    --buystrip-content-padding
         --media-gallery-bottom-content-padding-left
```

linear's `--button-gap` is worth 4, 6 or 8 depending on the size of the
button; apple's paddings change with the breakpoint. Ours move at 768.

**Shape of the names: owner → part → property → side**, in apple's
manner. The typography uses `--type-<role>-<property>`, which is
openai's (`--type-caption-size`, `--type-meta-size`).

---

## Typography

**benji's system: one size, hierarchy by weight, one gray.** Chosen
with a picker against josh's on the real page. Josh does the opposite
in his subpages (five sizes, 30·20·16·14·12, two weights, five grays)
and his cost was competing with the pieces.

### Base: MEASURED

| token | value | where from |
|---|---|---|
| `--fs` | `14px` | his `0.875rem`, the only size on his site |
| `--lh` | `1.428571` | his `1.25rem` over 14px = **20px** |
| `--tracking` | `-0.00563rem` | in **all** of his 14px rules, with no exception |
| `--fw-body` | `460` | his workhorse, 38 appearances |

The leading goes in **px** in the roles, not as a ratio. It is his way
(an absolute `1.25rem`, which does not scale if the size changes) and
it lets the calculation of the label gap consume it directly.

### Roles: MEASURED

| token | fs | lh | fw | color |
|---|---|---|---|---|
| `--type-h1-*`, title of the page and of the detail | 14 | 20 | **500** | `--ink` |
| `--type-h2-*`, section label `Web`/`App` | 14 | 20 | **600** | `--ink` |
| `--type-h3-*`, piece title | 14 | 20 | **500** | `--ink` |
| `--type-body-*`, subtitle, description | 14 | 20 | 460 | `--text-secondary` |
| `--type-meta-*`, the platform, in the detail | 14 | 20 | 460 | `--text-secondary` |
| `--type-nav-*`, side index, label and links | 13 | 16 | 460 | `rgba(18,18,18,.4)` |

They all carry `ls: -0.00563rem`, except the index, which uses
`-0.0025rem`.

### The weight scale, 460 · 500 · 600: MEASURED

**Three weights, not four.** The 560 was left out.

What it claims: **the title of the page is not the heaviest thing; the
section labels are.** It is what he does, verified end to end.
`.article > header h1` is 500, and the separator of `/liveline` is an
`h1` **inside** `<article class="article">`, so it falls under
`.article h1{font-weight:600}` (confirmed by position in the served
HTML, not assumed).

His reason is functional: a title gets read once and its rank is
already given by its position, alone at the top and surrounded by air.
Section headings get looked for many times, in the middle of content,
while the eye jumps. **The weight goes where the work is, and the work
is scanning.**

Three is where the consensus of design systems sits
([EightShapes](https://medium.com/eightshapes-llc/typography-in-design-systems-6ed771432f1e):
*"some systems can get away with as few as two or three weights"*), and
the 460 cannot be removed because it is the body.

**Two accepted costs, written down and not hidden:**

1. `--type-h1-fw` and `--type-h3-fw` **tie at 500**. What tells
   "Interface exhibition" and the piece name apart is the position and
   the context, not the weight.
2. The word **"Web" appears twice**: 600 in the separator and 460 at
   40% in the index. It was open and it got closed by accepting it.
   They are not two weights that almost tie. They are a heading and a
   row of a list, and they look different because they are different
   things. The whole index uses one single set of tokens, label and
   links identical, which is benji's thing. His `nav h2` and his `nav
   ul li a` share every property and only the air separates them.

### The font: self-hosted

`InterVariable`, **the official file from rsms.me**, subset and served
from our own origin. Four files split by `unicode-range` the way benji
and Google do it, so the browser downloads only the alphabet it needs.
With the page in English that is **one 102 KB file** against the 343 KB
of the original.

| | | |
|---|---|---|
| `InterVariable-latin` | 102 KB | always, and it goes with `preload` |
| `InterVariable-latin-ext` | 137 KB | only if a character that asks for it shows up |
| `InterVariable-Italic-latin` | 112 KB | only if text in italics shows up |
| `InterVariable-Italic-latin-ext` | 151 KB | the same |

Both axes survive the subset, verified by reading the `fvar` of each
file (**`opsz` 14-32, `wght` 100-900**), and that is what makes 460 and
560 real weights and not fake interpolations. Keeping `opsz` costs
**36 KB** (102 against 66 if you pin it at 14). It gets paid on purpose
because the `body` uses `font-optical-sizing: auto`.

**It is not the Google Fonts one, and the difference is concrete.**
Asking it explicitly for `family=Inter:opsz,wght@14..32,100..900`
returns CSS with **zero** mentions of `opsz`: it ignores the axis and
sends weights only. Benji uses Google's through `next/font` (his 8
subsets match the `unicode-range` of Google Fonts exactly), so **he
does not have `opsz` and we do**.

The italic ships even though nothing uses it today. The `body` carries
`font-synthesis: none`, so without a real italic an `<em>` would render
upright and nobody would notice. Thanks to `unicode-range` it does not
get downloaded until one shows up.

> **The risk this closed.** Before, it was a blocking `<link>` to
> `rsms.me`, the author's personal site, not a production CDN. If it
> did not load, the CSS matching turned 460→500 and 560→600 and the
> hierarchy collapsed. Served from our own origin, if the font fails it
> is because everything else already failed.

**To regenerate:** download from `rsms.me/inter/font-files/` and run
`fontTools subset` with
`--flavor=woff2 --layout-features='*' --no-hinting`.

---

## Color

### Canvas and text: VERIFIED

```css
--canvas: #fdfdfc;
--ink:    #111111;
```

They came inherited from the `DESIGN.md` of Carousels with no way to
verify them. **Now they are verified**: they are literally benji's,
read from his declared variables (`--body-bg: #fdfdfc` and
`--body-color: #111`) and confirmed in the painted pixel.

### The text grays: ONE ALPHA, TWO BASES

```css
--ink:              #111111;                                          /* 18.55:1 */
--secondary-alpha:  37%;
--text-secondary:   color-mix(in srgb, #000        var(--secondary-alpha), transparent);  /* → 160 */
--type-nav-c:       color-mix(in srgb, var(--ink)  var(--secondary-alpha), transparent);  /* → 166 */
```

**The system has ONE secondary level, not two grays.** It is benji's
structure, verified in the CSS he serves: he declares one single text
color token (`--body-color:#111`) and **no** gray token. Everything
that looks gray is his black or his ink at an alpha, and the alpha
rules (`.4` shows up in 40 declarations, the next one, `.5`, in 8). His
two values come out of that same 40% written from two bases:

| | base | alpha | composites | where |
|---|---|---|---|---|
| benji · annotation | pure black | .4 | 152 | date, "Index", captions, footnotes |
| benji · nav | his ink (7%) | .4 | 159 | his page index |
| **ours · annotation** | **pure black** | **.37** | **160** | masthead subtitle, the platform in the detail |
| **ours · nav** | **`--ink`** | **.37** | **166** | index labels and links |

Here his rule is taken and the number is changed. The 37% was chosen in
**two steps**, and both matter because they look at different things.

**First the neighborhood**, with a slider on the annotation alone,
against four marks measured and composited on our background:

| | | contrast |
|---|---|---|
| emil · secondary for prose | 99 | 5.91:1 |
| emil · 12px captions | 130 | 3.78:1 |
| what was here, from Carousels | 138 | 3.39:1 |
| benji · date, captions, footnotes | 152 | 2.84:1 |
| **the slider's** | **163** | **2.48:1** |

That slider moved **one line** of the page, the masthead subtitle,
because at that moment the nav was still a separate number. It served
to locate the zone, not to fix the number.

**Then the number**, over a sweep of six alphas where the two move
together, looked at in three ways: the ramp run end to end, the two
derived values **in contact** (where the step either shows as a seam or
does not show) and the real text at 13/16 against 14/20.

| α | annotation | nav | gap | Lc |
|---|---|---|---|---|
| 30% | 176 | 181 | 5 | 41 / 39 |
| 32.5% | 170 | 176 | 6 | 45 / 41 |
| 35.5% | 163 | 169 | 6 | 48 / 45 |
| **37%** | **160** | **166** | **6** | **50 / 47** |
| 40% · benji dead on | 152 | 159 | 7 | 54 / 50 |
| 45% | 139 | 147 | 8 | 60 / 56 |

All of it measured by pixel, not calculated, and the sweep validates
the model on its own: with `α=.4` the two bases reproduce his 152 and
159 dead on. The annotation ends up 3 darker than the slider's 163
(ΔL .006, inside the noise). The neighborhood was respected; the sweep
set the number.

**Two consequences, both of them wanted.** The nav **moves** from 159
to 166. It came copied from his `hsla(0,0%,7%,.4)` from the moment the
typography of the index was baked in, and it was never chosen. Under
this rule it does not get chosen, it gets derived. And the order
**fixes itself**: before, the annotation ended up lighter than the nav
(163 against 159), the other way around from him; now the nav is the
lighter of the two, and not by decision but because `--ink` is lighter
than pure black. The gap comes out 6; his is 7.

The alpha lives in a token of its own so the rule is **one single
thing** and not two numbers that have to be kept in sync, which is
exactly how the previous ones fell out of sync. And it goes as an alpha
and not as a solid because that way it composites over any background:
the day there is secondary text on the card, it comes out right without
touching anything.

> Every contrast here is calculated by **compositing the alpha over the
> background**. Without that, `rgba(0,0,0,.4)` scores as pure black and
> gives 20:1 instead of 2.84:1.
>
> Under APCA both of them land **below the floor** (Lc 50 and 47
> against the 60 it asks for text that is not body). Benji too: 54 and
> 50. It is a decision taken on purpose, not an oversight. What goes in
> gray here annotates, it does not get read. Crossing the floor asked
> for `α=45%`, which in the sweep looked too dark for the role.

**Emil splits the gray in two where benji has one single one**: 99 for
secondary prose and 130 for captions. His canvas is `(253,253,252)` to
the pixel, the same as benji's and ours.

> `raphaelsalaja.com` could not be measured: the network returns a
> FortiGate block page instead of the site.

### How the color gets USED: MEASURED, benji's way

The complete map is in `.context/recon/COLOR.md`. What rules here:

**1 · Everything that gets READ goes in ink.** Paragraphs, headings of
the three levels, `strong`, list items. Reading content never gets
grayed out; the weight makes the hierarchy and the color takes no part.

**2 · The gray is for what ANNOTATES.** What it has left is the
masthead subtitle and the platform in the detail. **The description of
the detail moved to ink** when this rule was taken: it is prose.

**3 · The active one of the index does not reach the ink.** It stops at
65 (`rgba(18,18,18,.8)`), the same as its hover. It is one single
declaration of his for both states. The piece you are looking at stands
out without being the darkest thing on the screen: that is left for the
titles.

**4 · The links have no color of their own.**

```css
a { color: inherit; text-decoration: underline;
    text-decoration-color: #d9d9d9; text-decoration-thickness: 1px }
a:hover { text-decoration-color: #666 }
```

They inherit the color of their block; what marks them is an underline
in a separate tone. **Two of the three references do exactly this**:
benji with a 1px `#d9d9d9` pseudo-element, emil with
`text-decoration-color: #bcbbb5` at 1.5px. Here emil's mechanism is
used, which needs neither `position:relative` nor a `::before`, with
benji's values, because our text is 14px and not 16.

**The hover moves the underline, not the text.** The transition runs on
`text-decoration-color` and nothing else.

> Today the page has no `<a>` at all. It is the rule ready for when the
> detail carries text; the links of the index and the back button are
> `<button>` and do not touch it.

**5 · The focus does not animate.**

```css
:focus-visible { outline: 2px solid #005fcc; outline-offset: 2px; transition: none }
```

`transition:none` is benji's: it is the only thing on his page that
appears instantly, against the 200ms everything else has.

**The color is Chromium's default focus ring, measured from the
engine.** The three engines give three different blues, read by
focusing an unstyled button and sampling the painted pixel:

| engine | `-webkit-focus-ring-color` | how it paints it |
|---|---|---|
| **Chromium** | `#005fcc` | solid |
| WebKit | `#0067f4` | at **50% alpha**, the Aqua glow |
| Firefox | does not support the keyword | `#007aff` solid |

Chromium's was chosen: the deepest of the three and the one with the
most contrast, **|Lc| 77.8 in light, 34.8 in dark**, above the floor of
30 that APCA asks for components. Its dark counterpart `#347ee5` comes
from raising its L by the ΔL benji and josh apply to their accents; the
same calculation on Firefox's blue gives `#3f9aff` against the
`#3d9bff` measured from benji, one unit apart.

> Two things that came out of measuring them: the blue that used to be
> here, `rgba(0,122,255,.5)` inherited from benji, **is exactly
> Firefox's**; and WebKit paints its own at 50% dead on, which means the
> mechanism of Safari's old ring was the one we already had.

**The `outline-offset: 2px` is josh's, and it is not decoration.**
Without it the ring *cuts* the letters of the index links, which are
text with no padding. It replaces the `padding:0 2px / margin:0 -2px`
benji uses to lift his off: it does the same thing without touching the
layout. On the card the outline follows the radius of 8 by itself.

And it asked for a layout fix you only see while focusing: the flex
stretched every index link to the **89px** of the longest one while the
words measure 31 to 62, so the ring drew up to **58px of emptiness**.
With `align-items: flex-start` each one measures its word, which is
what benji has by nature, because his links are inline `<a>`.

**6 · The selection promotes to ink.**

```css
--selection-bg:    #ededed;
--selection-color: var(--ink);
::selection { background: var(--selection-bg); color: var(--selection-color) }
```

The three references all have a global rule and they do not say the
same thing:

| | rule | background | text color | secondary selected |
|---|---|---|---|---|
| **benji** | `color` + `background`, by tokens | `#ededed` | **forced to `#111`** | 16.13:1 |
| josh | `color:#fff; background:#000` | black | forced to white | 21.00:1 |
| emil | **only** `background` | `#e2e1de` | **does not touch it** | **2.00:1** |

benji's is the one taken, and **what decides it is forcing the color**.
Emil can get away without it because his secondary for prose sits at
99; ours sits at 160, and 160 on his `#e2e1de` gives **2.00:1**. The
masthead subtitle would turn illegible exactly while you select it.

And it is not a new rule. It is **rule 1** applied to a state.
Everything that gets read goes in ink, and selecting a text is the act
of reading it.

> His `#ededed` is copied **literally**, something that never happened
> in this system. His canvas is `#fdfdfc` and so is ours, and emil's
> too: his `--color-gray-100` is `#fdfdfc`. On the card, on the hover
> and on the grays the *delta* had to be carried over because the
> backgrounds did not match. Here they do match, so copying the hex
> copies the contrast.
>
> No `::-moz-selection`: benji and emil both ship it, but that is their
> autoprefixer. Firefox supports `::selection` with no prefix since 62.

### Dark mode: FOUR NUMBERS AND TWO RULES

```css
html { color-scheme: light dark }

@media (prefers-color-scheme: dark) {
  :root {
    --canvas: #090908;  --surface: #0e0e0d;  --surface-hover: #121211;
    --ink: #fafaf9;
    --secondary-alpha: 59.2%;  --nav-alpha: 55%;
    --hairline: rgba(255,255,255,.051);  --a1: rgba(255,255,255,.04);
    --selection-bg: #191918;
    --link-underline: #2d2d2b;  --link-underline-hover: #a0a09e;
    --focus-outline: 2px solid #347ee5;
  }
}
```

It fires with the system and nothing else, **like josh**, with no
toggle. Of the five references measured only he has a dark theme for
the page: benji and emil have dark palettes in their CSS but only for
embedded components, and linear forces `data-theme="dark"` and ignores
the system.

**There is no palette written by hand.** There is one point chosen in a
space and the rest falls out of two rules.

| | | |
|---|---|---|
| depth | **9** | the gray of the canvas. linear 9 · vercel 10 · emil 17 · benji 19 |
| warmth | **.003** | chroma in OKLCH on H 106.4, the measured hue of the light `--canvas` |
| ink | **250** | josh's (`--foreground:#fafafa`) |
| hue | **106.4** | the same one in both modes |

**Rule 1 · the text keeps the contrast.** It has a floor of legibility
that the surfaces do not have, so what is held is the Lc and not the
number.

| | light | dark | how |
|---|---|---|---|
| ink | 104.1 | **104.4** | ink 250 |
| annotation | 50.3 | **48.1** | white @ 59.2% |
| nav | 46.7 | **42.5** | white @ 55% |
| active | 92.9 | **93.4** | ink @ 93% |

The 59.2% comes from the **×1.6** benji applies in his two tokens with
alpha (`.28→.45` and `.10→.16`, the same factor twice). The 93% does
not keep the alpha but the **position** of the active one between the
nav and the ink: in light the 80% leaves it at 80.4% of that run, and
in dark it takes 93% to land on the same point, because above the nav
there is less room.

**Rule 2 · everything else keeps the distance and inverts the
direction.**

```
light    card −5 · hover −9 · selection −16 · underline −36 · its hover −151
dark     card +5 · hover +9 · selection +16 · underline +36 · its hover +151
alphas   .051 and .04 → the same number, base turned over
```

The alpha part is **linear's**: their `--color-border-translucent` is
`#0000000d` in light and `#ffffff0d` in dark, ×1.00, and that
`#0000000d` is 5.098%, our `--hairline` to three decimals.

> **Why the distance and not the ΔL.** It is a compromise, not a law.
> OKLab says an equal ΔL looks equal, and keeping the 8 bit distance
> gives ~1.5× of ΔL: the card **is** somewhat more noticeable in dark.
> But keeping the exact ΔL would leave it at +3 and it disappears, and
> the two references with a scale of their own enlarge much more (emil
> ×3.00, linear ×4.48) for how they hold up across screens and not for
> appearance: near black OLED and IPS diverge, there is ambient light
> and there is 8 bit banding.
>
> **APCA cannot arbitrate it**: it returns 0.0 for every surface
> option. It is made for text.

The ramp is generated in **OKLCH with constant chroma and hue**, which
is linear's method: one single hue in both modes, with the tint living
in the whole scale and not only in the background.

**What made the ink of 250 possible** was rewriting the secondary level
as *one base and two alphas* instead of *one alpha and two bases*.
Deriving the nav from `--ink` trapped the ink: it had to come in ~17
units from the extreme or the two bases flattened against each other.
With two alphas it is free. The value in light did not move
(`black@34.4%` gives the same 166 that `ink@37%` gave) and it is the
structure benji uses for his nav at rest and active
(`hsla(0,0%,7%,.4)` and `.8`).

> None of the five references declares `color-scheme`. Without it the
> browser auto-darkens native controls and scroll bars and the page
> ends up half and half.
>
### High contrast: THE FIRST ONE WITH NO REFERENCE AT ALL

```css
@media (prefers-contrast: more) and (prefers-color-scheme: light) {
  :root { --secondary-alpha: 57.4%;  --nav-alpha: 57.4%;
          --surface: #f3f3f0;  --surface-hover: #ebebe6;
          --selection-bg: #dddddd;  --link-underline: #b5b5b5;
          --link-underline-hover: var(--ink);
          --hairline: rgba(0,0,0,.102);  --a1: rgba(0,0,0,.08);
          --focus-outline: 2px solid #0042ad; }
}
@media (prefers-contrast: more) and (prefers-color-scheme: dark) {
  :root { --secondary-alpha: 78.8%;  --nav-alpha: 78.8%;
          --surface: #131312;  --surface-hover: #1b1b1a;
          --selection-bg: #292927;  --link-underline: #51514f;
          --link-underline-hover: var(--ink);
          --hairline: rgba(255,255,255,.102);  --a1: rgba(255,255,255,.08);
          --focus-outline: 2px solid #589cfe; }
}
```

`prefers-contrast: more` is when someone turned on **"Increase
contrast"** in their system. It is not an aesthetic preference like
dark mode. It is accessibility, and whoever turns it on is asking
explicitly for the faint grays to stop being faint.

**Zero occurrences of `prefers-contrast` in the five bundles
measured.** The only neighboring thing is an
`@media (forced-colors:active)` in animations.dev, which is a Tailwind
utility and not a decision about a palette. So here the rule is set by
`/better-colors`: widen the gap of L by **≥0.15** and verify against
APCA's **preferred** thresholds, Lc 90 for body and 75 for non-body.

| | light | dark | asks for | |
|---|---|---|---|---|
| ink | 104.1 | 104.4 | 90 | **passes**, not touched |
| annotation | 50.3 | 48.1 | 75 | **no** |
| nav | 46.7 | 42.5 | 75 | **no** |

**And there is a convergence that decides by itself:** the alpha it
takes to reach Lc 75 comes out **the same** for the annotation and for
the nav (57.4% in light, 78.8% in dark), because both of them aim at
the same number. Which means that in high contrast **the two grays
collapse into one.**

It is not a loss, it is the correct answer: that distinction was 3.6 Lc
at its best moment, and it is exactly the kind of subtlety that someone
asking for more contrast wants gone. The hierarchy that survives, ink
against secondary, is the one that carries meaning.

Reaching Lc 75 widens the gap to between **0.153 and 0.194** in the
four cases, which is more than the 0.15 the skill asks for. The
threshold rules and no second calculation is needed.

**The rest is not asked for by the skill, it is our criterion.** Under
high contrast the structure has to be read too, so **all the distances
that are not text double**. It is one rule and not four loose numbers:

```
card −5→−10 · hover −9→−18 · selection −16→−32 · underline −36→−72
line alphas doubled: .051→.102 and .04→.08
```

The hover of the underline goes straight to `--ink`: doubling its 151
goes out of range. And the focus ring runs one more accent step in each
direction, with the same ΔL its pair was derived with: light |Lc| 77.8
→ **87.9**, dark 34.8 → **48.7**.

> Both blocks carry an explicit `(prefers-color-scheme)` instead of
> depending on the order in the cascade. `light` also matches when
> there is no declared preference, so no hole is left.

### The surface: josh's rule

```css
--surface:       #f8f8f6;   /* −5 from the canvas */
--surface-hover: #f3f3f0;   /* −10 */
```

**The card is DARKER than the page, and it carries neither ring nor
shadow: the contrast does all the work.**

The two references solve this in two whole, coupled ways, and measuring
them is what let us see that ours was neither of the two:

| | canvas | card | difference | ring |
|---|---|---|---|---|
| josh | `#ffffff` | `#fafaf9` | **−5** | **none** |
| benji | `#fdfdfc` | `#fcfcfc` | −1 | `0 0 0 1px #f2f2f2` |
| what was here | `#fdfdfc` | `#ffffff` | **+2** | `inset 1px rgba(0,0,0,.11)` |

Josh carries no ring because his 5 units are enough. Benji does carry
one because his difference is 1 unit, which is nothing, and what
defines his card is the line, not the fill. What was here was a card
**lighter** than the background **plus** a ring almost twice his: the
two signals pulling in opposite directions.

> ⚠ The `--background: #fafafa` josh declares is a dead letter: his
> `<main class="bg-white">` covers it. The real pixel of his background
> is `(255,255,255)`.

**What gets carried over is his DELTA, not his value.** His card is
`#fafaf9` on pure white; our canvas already starts 2 units below, so
copying his hex would give only −3. Copying his color and copying his
contrast are two different decisions.

−5 was chosen out of a ramp of five: **−3 · −5 · −8 · −12 · −16**.
Across the whole ramp the blue drops 6/5 of what red and green drop,
which is his own channel relation. Without it the gray goes cold as it
deepens.

### The radius: MEASURED

```css
--card-radius: 8px;
```

Census of the 7 pages. For big boxes there are **two numbers and there
is no third one**:

| | radius | uses |
|---|---|---|
| benji | **8** | 50 in family-values, 4 in liveline |
| benji | 14 | 3, only the hero frame of `/drawesome`, and it is not ×4 |
| josh | **12** | 11 on his home, 5 in pasito, 2 in bloom |
| josh | 16 | 6, his `<img>` boxes |
| josh | 32 | **1**, the cover demo of `/bloom` |

**8** was chosen: the most repeated of the two put together, the only
one **both** of them use on big boxes, and a multiple of 4. The rest
are one-offs from a single page.

On small controls the two references agree on **4 and 6**, so when
there is a real piece there, there will be nothing to decide.

### The hover: CHOSEN on top of a MEASURED rule

```css
--surface-hover: #f4f4f1;   /* a step of −4 from rest */
```

It darkens the fill **and nothing else**: no shadow, no scale, no
movement, no opacity. That one is josh's, and so is the 150ms
transition: it is the same `--dur-surface` we already had.

**His demo boxes are no use as a reference here: they do not react to
hover because they are not clickable.** The only two hovers he has
across the 7 measured pages are:

```
cards on the home   #fafafa → #f5f5f5    neutral-50 → neutral-100
button on /bloom    #44403c → #57534e    stone-700  → stone-600
```

Both of them **one step** of his ramp, and the button's **lightens**,
so his rule is a step and not a direction.

The step here is **4**, chosen by eye out of three: −3 (what copying
his literal hex gives, because his page starts at 250 and ours at 253),
−4, and −5 (his real step). Half a step, then. With the radius at 8 the
card reads more contained than at 12 and asks for less hover.

> This used to say his hover falls −10 with respect to his page. That
> delta came from measuring against the white of `/pasito`, and the
> hover happens on his home, which is `#fafafa`.

### The press: there is none, and it is a result of counting

```css
.streamItem:hover .streamPreview { background: var(--surface-hover); }
/* and nothing else: there is no :active rule */
```

**23 pages** of the two highest references were swept (9 from benji, 14
from josh) looking for `:active`. There is **one single live one**, and
it is not what you would expect:

```
benji.org/honkish · 40×40 button
  rest     box-shadow spread 0px
  hover    box-shadow spread 1px      ← it gains a ring of its own color
  press    box-shadow spread 0px  ·  transition-duration 0.02s
```

His press **does not add a state: it removes the hover**, fast. And his
two lists, which are the same object this card is, have no press:
measured live, the `:active` paints **identical** to the `:hover` on
both.

The `active:scale-[0.94]`, `[0.96]` and `[0.98]` utilities are in
josh's bundle and **zero elements use them**. What he does use is
`hover:scale`, and that is where the curve that decides lives:

```
 44×44   ( 1,936 px²)  →  1.03
 48×48   ( 2,304 px²)  →  1.03
 60×60   ( 3,600 px²)  →  1.03
420×124  (52,080 px²)  →  1.01      ← he lowered this one
```

Our card measures 560×292 = **163,520 px²**, 3× his largest element.
`/better-ui` asks for `scale(0.96)` always ("never less than 0.95") but
its rule talks about **buttons**. It was looked at in the prototype and
discarded.

`--surface-press: #f0f0ec` (with its dark and high contrast branches)
and `--dur-press: 20ms` were both withdrawn. They were linear's
`--color-bg-level-3`, which lands exactly on our next step, and benji's
asymmetry. The 20ms were measured right and **applied backwards**: on
his button they serve to *remove* the hover, not to deepen it.

### Why not benji's mechanism: A QUESTION OF SCALE

His list does the opposite of josh's. It never fills anything (the
background of the `<a>` is `rgba(0,0,0,0)` in every state) and what
happens on hover is that **the siblings dim**.

```css
@media screen and (min-width: 520px) {
  .styles_postList__HT8dk > ul:hover > li > ul > li > a h2,
  .styles_postList__HT8dk > ul:hover > li > ul > li > a time span { opacity: .3 }
  .styles_postList__HT8dk > ul:hover > li > ul > li > a time span:last-child { opacity: 1 }
}
```

Two things about that rule. It dims **text**, the `h2` and the `span`s
of the `time`, never a surface, because it has none. And the exempt
`span:last-child` is **the year**: the list loses the content and keeps
the skeleton.

It does not get adopted, and the reason is geometric:

```
              items  size         gap   whole list     visible at 1440×900
benji            7   550×41       0px   286px = 0.3 screens            7
ours            18   560×292     48px   7,211px = 8.0 screens          2
```

His rows **touch each other** and the list **fits in a third of a
screen**: the dimming is a gesture over an object you see whole, 7 go
out and 1 is left. Ours can never be seen whole, so "the rest goes out"
would literally be *the other one*. The gesture does not survive the
change of scale.

> The 0px gap also explains why he could write `ul:hover` without
> `:has()`: in his geometry there is no dead zone possible. In ours
> there is. The prototype with his literal rule gave `0.3 / 0.3 / 0.3`
> with the pointer between two cards.

### And benji, for contrast: MEASURED

His CSS has **65 `:hover` rules**. What they touch, by frequency:
`color` 26 · `background` 16 · **`transform` 15** · `opacity` 8.

**He does use `transform`, but never on a box.** The 15 are controls:
`Toolbar_tool` rises `translateY(-1px)`, `Toolbar_chip` scales 1.1,
`Toolbar_custom` 1.14, the slider's knob 1.14, a link 1.05.

**And his clickable box trades, it does not add:**

```css
.styles_container__joqXD             { --border:#ebebeb; --color:#111 }
.styles_container__joqXD[href]:hover { --background:#f6f6f6; --border:transparent }
```

It only reacts when it has `href`, which is the same case as ours,
where the card is a button. At rest a **line** defines it; on hover the
line goes out and the **fill** appears.

His three fill depths, against our canvas:

| | | where |
|---|---|---|
| `#f6f6f6` | −7 | surfaces: his clickable callout, his nav trigger |
| `#f2f2f2` | −11 | controls: secondary button, `.styles_controls` |
| `#e5e5e5` | −24 | tertiary button |

The five mechanics were tried on our page (his surface, a step of −2;
his control, −6; his trade, which changes the rest state too; and fill
plus lift) and what was already there stayed. Two reasons: his
`#f6f6f6` gives a step of only −2 because he starts from zero and we
already start from −5 (again, his value ≠ his contrast), and he never
mixes the lift with a fill: one belongs to controls and the other to
boxes.

### What went away

`--card-ring` and `--a4` existed only for the card's ring. With this
rule chosen there is no line to paint, so they were deleted instead of
being left as tokens with no owner.

## Spacing

### The vertical gaps

Each one named after **the block that claims it**, because the air is
claimed by the one below and not pushed by the one above. It is benji's
way, verified on his real page where the container of his chart carries
`style="margin-top:2rem"`.

| token | value | what it separates | |
|---|---|---|---|
| `--masthead-subtitle-gap` | **4** | the subtitle, from its title | MEASURED |
| `--section-rule-gap` | **8** | the section label, from its hairline | MEASURED |
| `--piece-card-gap` | **12** | the card, from its name | CHOSEN |
| `--section-content-gap` | **40** | the first piece, from the label | MEASURED |
| `--piece-gap` | **48** | a piece, from the previous one | MEASURED |
| `--section-first-gap` | **60** | the first section, from the masthead | CHOSEN |
| `--section-gap` | **64** | a section, from the previous one | MEASURED |

Sorted by size they read their own scale: **4 · 8 · 12 · 40 · 48 · 60 · 64.**
All of them ×4.

**Invariants**, commented and not encoded, because if they break you
see it:

- `--section-content-gap` (40) < `--piece-gap` (48), or the label comes
  unstuck from its group and reads as floating between two sections. It
  already happened: it used to be 56.
- `--piece-card-gap` (12) ≪ `--section-content-gap` (40), or the name
  comes unstuck from its card and reads as part of the section.

### The frame

| token | value | |
|---|---|---|
| `--page-padding-top` | **80 → 32** at 768 | MEASURED |
| `--page-padding-bottom` | **80 → 32** at 768 | CHOSEN |
| `--page-padding-inline` | **16 → 24** at 768 | MEASURED |
| `--page-content-max-width` | **592** = 37rem | CHOSEN |

The side padding of 16 above 768 and 24 below is not an inconsistency.
**Above 768 the rail is centered with air to spare and the padding is
vestigial**, it only narrows the column. **Below 592 the rail IS the
viewport** and that same padding becomes the only distance to the edge
of the screen. One number doing two jobs depending on the width.

### The index

| token | value | |
|---|---|---|
| `--index-offset-left` | **80** | MEASURED |
| `--index-offset-top` | **80** as a base, then measured → 237 | see below |
| `--index-item-gap` | **8** | MEASURED, the two references agree |
| `--index-label-gap` | **16** | MEASURED |
| `--index-group-gap` | **32** | CHOSEN |

**The label asks for twice what a link asks for.** From benji, SOURCE
and RUNTIME:

```css
.styles_container__MZ8RH nav h2 { padding: 0 0 1rem }   /* 16 */
.styles_container__MZ8RH nav ul { gap: .5rem }          /* 8  */
```

His index arrives empty in the HTML (`<h2></h2><ul></ul>`) and JS fills
it, so the CSS alone proves nothing. Measured on his page, the box of
the `h2` gives 31.59 with a text of 15.60 → **16.00** of gap, and
**8.00** dead on between link and link, five times in a row.

**The label carries the air, not the list.** The group is a flat block;
if it had a `gap` it would add to the label's `padding` and the number
written down would stop being the number you see (8 + 16 = 24, and no
token would say 24). Each gap has a single owner. It is his structure,
`nav > h2 + ul`.

**The jump between groups does not come from him.** His index is flat,
one title and one list, so for "group → group" there is no evidence. It
is the same doubling one more time: **8 · 16 · 32**.

### Where the index starts

**"Web" sits on the same line as "Button".** The first label of the
index against the title of the first piece. It gives a `top` of **237**
at 1440 of width.

It was chosen by looking, with red rulers on top, against two other
pairs:

| | what with what | starts at | |
|---|---|---|---|
| | first link ↔ first piece | 205 | discarded |
| | label ↔ section separator | 186 | discarded |
| **✓** | **label ↔ first piece** | **237** | **chosen** |

Two more were tried and discarded: label ↔ masthead (82) and the raw 80
with no measuring, which is what benji does. His `aside` sits at
`top:5rem` and his `<article>` does too, which means he **aligns
containers and not texts**: his "Liveline" in the index lands at 138
and the one in the article at 80, and it does not bother him. The two
of them ended up 2px from each other.

**It aligns by the BASELINE of the text**, the line the letters sit on,
not by the middle of the boxes: the lines of the index are 13/16 and
those of the page 14/20. It gets measured with a probe (an
`inline-block` of zero height with `vertical-align:baseline`) because
there is no API that gives it.

> Baseline and center differ by `(ascender − descender) / 2` per em,
> which between 13px and 14px gives **0.60px**. Here the rounding to an
> integer eats it and the result is identical. It is written this way
> anyway because it stops being identical the moment the two sizes move
> further apart.

**And the `top` gets measured, not calculated.** The correct number
would be the sum of the whole vertical stack of the page, and writing
it as a `calc` would duplicate the entire structure in a formula nobody
would update if tomorrow an element comes in the middle: it would be
wrong and nothing would say so. By measuring it corrects itself, and
that already happened. When the label got its 16px of air, the index
repositioned itself.

In `useLayoutEffect`, before painting, so the jump is not seen. And
rounded to an integer: half a pixel of misalignment is less visible
than a text at a fractional position.

**The cost, written down:** it is the lowest start of the three, so it
is the first one to run out of room. The index measures 512 with
today's 19 pieces and its ceiling is `100vh − top − 32`; in a window
800 tall that is 531, which leaves **19px to spare**. Past that it
scrolls inside itself, with no bar, which is what the `overflow` is
there for.

---

## The box of the piece

### The rule, from six measured cases

The two references answer the same thing, and it does not depend on
taste but on **what is inside**. The detail is in
`.context/recon/CARDS.md`.

| | page | content | what rules the height |
|---|---|---|---|
| benji | /liveline | live canvas | a fixed height chosen by hand, 180-300 |
| benji | /drawesome | live SVG | a fixed height chosen by hand, 400 |
| benji | /family-values | a still capture | **the content** |
| josh | /bloom | live demo | a fixed height chosen by hand, 480 |
| josh | /pasito · media | `<img>` | **the content**, through `4/3` |
| josh | /pasito · code | text | **the content** |

**Alive → a fixed height, by hand. Still → the content rules.** Never
the other way around. Neither of the two uses `aspect-ratio` for
something that runs.

Our two platforms fall one on each side: **Web runs live, App is a
video that already brings its proportion.**

### App: MEASURED

```css
--card-app-padding: 40px 60px;
--card-app-slot-width: 228px;
--card-app-slot-ratio: 228 / 448;
```

From benji · family-values, the variant he uses most (17 of 45): box
550×532.42, radius 8, `#fcfcfc`, `box-shadow: 0 0 0 1px #f2f2f2`,
padding 40/60, phone 228×448 (natural 762×1502).

**It carries no height.** It reserves the phone slot and the height
comes out of that plus the padding: it gives **528** as long as the
slot fits. His 532.42 is `40 + 448 + 4.42 + 40`, where the 4.42 is the
line gap left by the phone's `display:inline-block`, layout garbage and
not a chosen number.

Fixing it at 528 was wrong and it got corrected. Sweep of 13 widths on
his page: **532.42 dead on from 1920 down to 430**, and there it starts
to drop: 521.6 at 390, 462.5 at 360, 383.6 at 320. With a fixed height
our card stayed planted and at 320 it had **144px of emptiness** left
over.

**And it does it without one single media query**: his classes have
none. What happens is that the usable width (box − 120 of padding)
falls below the 228 of the phone, the phone shrinks on its own and
drags the box with it.

The threshold comes out of the same arithmetic on both pages. The box
measures `viewport − 48`, so it gives when `viewport − 48 − 120 < 228`:

| viewport | 396 | **395** | 394 | 392 |
|---|---|---|---|---|
| benji | 532.4 | 531.4 | 529.5 | 525.5 |
| ours | 528 | 526 | 524.1 | 520.1 |

**Both of them give at exactly 395**, without having copied any
breakpoint. The constant difference of 4.4 to 5.4 across the whole
range is his inline-block gap, which we do not drag along.

### Web: MEASURED

```css
--card-height: 260px;         /* in the list */
--card-height-detail: 400px;  /* when the piece opens */
```

Both are benji's and so is the relation between them: inside a long
page his `/liveline` demos measure **260**, his second most used value,
×4 out of 21, and when the demo **is** the page, the frame of
`/drawesome` measures **400**. We have those same two situations.

**They do not change with the viewport, and that is his too.** His 20
demos measure 180-300 identically at 1440, 768, 500, 390 and 320. The
only thing that moves is the width, so the card goes from 2.12:1 to
1.05:1 on its own.

### Both go as `min-height`, not as `height`

They are a **floor**. If a piece needs more, it pushes and the card
follows. With the card empty the two forms give the same thing; the
difference is all in the future, and it is what avoids arguing about
the number again the first time a component does not fit.

### What it gives, measured at six widths

| | 1920 · 1440 | 768 | 500 | 390 | 320 |
|---|---|---|---|---|---|
| list · Web | 260 | 260 | 260 | 260 | 260 |
| list · App | 528 | 528 | 528 | 516.2 | 378.7 |
| detail · Web | 400 | 400 | 400 | 400 | 400 |
| detail · App | 706.8 | 706.8 | 706.8 | 516.2 | 378.7 |

**Below 396 the App detail stops being bigger than the list.** There
the available width is already below the 228 of the small phone, so the
two slots hit the same width and give the same height. It is not a bug:
it is the same reason his card gives at 395.

And part of this is our own composition, not his: the **319** is his
big phone, but he shows it bare (`phoneContainer`, with no background
and no radius) or cropped inside a shorter box, thanks to his
`overflow: hidden`. Putting it in a card that contains it whole, 707
tall, is a decision from here.

---

## The five viewports

Everything the page measures, resolved. Only the five marked rows
change; **the seven vertical gaps are constant at every width**, the
same as benji's.

| | **1920** | **1280** | **1080** | **768** | **390** |
|---|---|---|---|---|---|
| rail | 592 | 592 | 592 | 592 | **390** |
| **column** | **560** | **560** | **560** | **544** | **342** |
| to the edge | 680 | 360 | 260 | 112 | 24 |
| side padding | 16 | 16 | 16 | **24** | **24** |
| air top / bottom | 80 | 80 | 80 | **32** | **32** |
| index | **yes** | **yes** | no | no | no |
| · | | | | | |
| subtitle | 4 | 4 | 4 | 4 | 4 |
| label ↔ hairline | 8 | 8 | 8 | 8 | 8 |
| name → card | 12 | 12 | 12 | 12 | 12 |
| label → piece | 40 | 40 | 40 | 40 | 40 |
| between pieces | 48 | 48 | 48 | 48 | 48 |
| masthead → section | 60 | 60 | 60 | 60 | 60 |
| between sections | 64 | 64 | 64 | 64 | 64 |

**Two steps and nothing else.** There is no `clamp()` and no `vw`
anywhere: it steps or it does not step, it never interpolates. It is
benji's thing; josh steps nothing (672·24·64 from 320 up to 2560, zero
responsive classes in his frame).

- **1080**, the index goes away. It is his number.
- **768**, the frame and the air. Verified to the pixel on his page: at
  769 the air is 80, at 768 it is 32.

> **An observation, not a decision.** At 1080 there are still 260px of
> air on the side and the index takes ~200 from the edge: geometrically
> it would hold down to ~960. The 1080 is benji's, and his rail is
> different from ours. It is conservative by about 120px.

> ⚠ **The proportion of the card is not decided.** A fixed height of
> `280px` and a fluid width: 560×280 = **2.00:1** on desktop, 544×280 =
> 1.94 at 768, and 342×280 = **1.22:1** on a phone. At 320px it would
> be taller than wide. And the detail uses **another mechanism**,
> `aspect-ratio: 16/9` instead of a fixed height. Two parts of the same
> page dimension the same rectangle in two different ways.

---

## Motion

**The page has no entrance animation.** Opening a piece and coming back
animate nothing. And there is not one single transition of position:
the four places where there is a `transition` **cross a color**.

| family | curve | duration | what it animates |
|---|---|---|---|
| **surface** | `--ease-surface: cubic-bezier(.23,1,.32,1)` | `--dur-surface: 150ms` | `background-color` |
| **text** | `--ease-text: ease` | `--dur-text: 100ms` | `color`, `text-decoration-color` |

```
.indexLink      color                     100ms  ease
.streamPreview  background-color          150ms  quint
.back           background-color          150ms  quint      ← the pair wins
.back           color                     150ms  quint      ← over the property
a               text-decoration-color     100ms  ease
```

**Everything splits by PROPERTY and not by component**, which is the
cut you read in linear's CSS.

**With one exception, and it is the back arrow.** It animates
background *and* color at once, so if each property took its own pair
they would finish at different moments (150 the background, 100 the
color) and it would read as two things. The paired elements rule of
animations.dev is explicit: *"elements that animate together must use
the same easing and duration… if they move as a unit, they have to feel
like a unit."* There the **element** wins.

> **The complete rule:** the property rules, except when a single
> element animates both families, and there the element rules.

### The duration splits, and this one is our own composition

**Neither of the two references splits the duration.** Measured at
runtime over 3 pages of each:

```
benji   background-color 100ms ×10   ·   color 100ms ×23
josh    background-color 150ms ×11   ·   color 150ms ×21 (by hand)
                                         color 250ms ×17
```

benji uses 100 for both families; josh uses 150 for both. Here
**benji's number is taken for the text and josh's for the surface**, a
combination neither of them ships, chosen by looking: at 100ms the
hover of the card is 6 frames instead of 9, and with a delta of 4 units
that leaves it almost like a dry switch-on; on the text, where the
delta is 101 units, the 100ms read just right.

### The surface goes in ease-out

It is what the **three** cards with hover of linear do, with no
exception:

```
.Dc5tqa_customerCard   filter .16s  --ease-out-quad
.do0YxW_card           filter .2s   ease-out (the keyword)
.rWdRxW_card           all   .15s   --ease-out-cubic
```

And the value is the one `/review-animations` prescribes in its
catalog, line 32: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, with
the comment *"strong ease-out for UI"*.

> **A conscious divergence.** Linear uses ease-out on its cards but
> **never this value**: its three use quad, the keyword and cubic. It
> declares the quint among its 18 Penner curves and uses it **once** in
> the whole site. The family comes from linear measured and the number
> comes from the skill, and they do not match. If tomorrow what they
> ship is preferred, quad is `cubic-bezier(.25,.46,.45,.94)` and it is
> their workhorse with 60 uses.

### The text goes in `ease`

| source | what it uses | grade |
|---|---|---|
| benji | **every** transition of his bundle, with no single custom curve, at .14 · .15 · .2s | SOURCE |
| josh, by hand | `.company-link` `color 0.15s ease` ×18 · `.role-text` the same ×3 | RUNTIME |
| linear | 25 of its 46 color transitions, **54%**: 21 with no curve declared (which in CSS is `ease`) plus 4 explicit ones | SOURCE |
| `/review-animations` line 23, `/animate`, `/web-animation-design` | *"hover or color change → ease"* | · |

### There used to be two curves and both were wrong

By accident, not by allocation. `--ease-fill` was baked in as *"josh's
curve"* and it was not: the **21** appearances of
`cubic-bezier(.4,0,.2,1)` across his three pages all come from a
Tailwind utility (`transition-colors`, `-all`, `-transform`,
`-opacity`) and **none** from his CSS. And the old `--ease-out` was the
quint applied to all four, the three text ones included.

### The hover is symmetrical, and it stays that way

150 going in and 150 going out. **There was a walk-back here**: it had
been written that three sources asked for asymmetry, and that was
false.

Linear's asymmetric rule does exist in their CSS (`.rWdRxW_card` with
`:hover { transition-duration: var(--speed-highlightFadeIn) }`, where
`FadeIn` is `0s`) but it lives in `ContactLink.BDqMG6gX.css` and
renders **zero** elements. It is the same mistake as josh's
`active:scale` utilities: it is in the bundle and nobody uses it. The
card that **does** render, `.Dc5tqa_customerCard` ×24 on its home, is
symmetrical.

```
linear · 5 pages     21 hoverable elements with a transition · 0 asymmetric
benji  · his list    opacity 0.14s ease → 0.14s ease      symmetrical
josh   · his row     0.15s              → 0.15s           symmetrical
```

And the other two "agreements" were not about hover: benji's 20ms
belong to an `:active`, and Apple's *"respond on pointer-down"* is
about the press. Standard 9 of `/review-animations` names, word for
word, *"a press, a hold, a destructive confirm"* and *"press-and-release
or hold"*, never hover.

And it makes sense that they are different. A press is a **deliberate**
act and deserves an instant acknowledgement; a hover is **incidental**,
the pointer crosses things you did not want to touch. With the entrance
at 0ms, sweeping the list makes every card flash at full intensity. The
150ms work in fact as a damper.

The asymmetry stays noted for the **press**, which will exist with the
Button piece. There the three sources do apply.

**There is no `prefers-reduced-motion` block** and none is needed:
there is no movement left to reduce. Verified with
`reduced-motion: reduce`, the card declares
`transition-property: background-color` and nothing else. The smooth
scroll of the index does consult it, in `app.tsx`.

It stops being true the day a scale or a displacement comes in, and
then it has to be written down.

> There used to be `enterFwd` / `enterBack` in the list and an entrance
> for the detail. `enterBack` **never fired**: `data-dir` was written by
> hand as `"fwd"`, so entering a piece and coming back looked
> identical. All three were taken out instead of fixing the one that
> was missing.

---

## Render: MEASURED

```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

**Both of them, not one.** Here the hierarchy *is* the stroke (460 ·
500 · 600, all at 14px), so if Firefox on macOS draws the three steps
heavier and closer together, it does not look "a bit different": it
looks like **less hierarchy**. Benji has the two of them in a row in
his `body`.

His `body` also carries three things we do not have:
`-webkit-tap-highlight-color: rgba(0,0,0,0)` (the blue flash when you
touch on iOS), `text-size-adjust: none` and
`text-rendering: optimizeLegibility`. Undecided.

---

## Elevation: there is none, and it is a decision

Zero `box-shadow` in the whole product. The card is defined by
**contrast** against the canvas: it is josh's rule, chosen over
benji's, who defines it with a 1px line. There is no shadow token
because there is not one single shadow to name.

Measured across four reference pages, and the result is stronger than
expected:

| page | shadows | z-index |
|---|---|---|
| benji · home | **0** | · |
| benji · family-values | 52 | yes |
| josh · home | **0** | · |
| josh · interface-craft | **0** | · |

benji's 52 are **all** `0px 0px 0px 1px`: zero blur, zero offset. They
are borders drawn with `box-shadow`, not elevation. **Across the four
pages there is not one single shadow with blur.** Elevation as a visual
language does not exist in either of the two.

> `/better-ui` asks for the opposite ("shadows for elevation, borders
> for structure") and benji does exactly that backwards: he uses shadow
> syntax for structure. The references get followed, which is where all
> the rest of the system came from.

## z-index: zero, and it is not decidable yet

Today nothing overlaps. The index is `fixed` but it lives in the margin
and steps on nothing, so not even it needs one.

The only `z-index` in the code is the one for the lab's picker, which
is scaffolding. josh has none in his two pages; benji has them only in
`family-values`, his only page with interactive demos. It is exactly
our split: **the chrome of the page does not need stacking; the pieces
do.**

Five of the 18 are layers (Dialog, Sheet, Tooltip, Context Menu, Action
Sheet) and the scale gets decided when the first one exists. Inventing
it now would be choosing numbers with nothing to order.

## What is missing

**Not decidable yet, it needs a real piece inside the rectangle:**

- empty state and loading
- the stacking scale (above)
- the fine scale of internal spacing inside components, although there
  the two references already agree: radii of 4 and 6 for small controls

**Decidable now:**

- whether the system adds one bigger size and one smaller one
- the data: 18 invented names, and their descriptions claim motion
  values nobody measured. One of them **contradicts** what was
  measured: the `desc` of Button says `Press to scale(0.96)` and the
  press was discarded with 23 pages of evidence

**Another stage:** the whole detail, its layout, the `←` arrow that
today is a raw character, copy-URL.

> What this section used to say and is no longer true: it listed "focus
> visible on the card" and "active" as pending, and both of them are
> baked in. The ring was measured across the three engines, and the
> press was decided as *there is none*. It also called the radius
> pending, and it is `--card-radius: 8px` since the census of the 7
> pages.
