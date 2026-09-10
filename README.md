# Interface exhibition: the log

Playground/exhibition of components in the design-engineer style: web,
web-mobile and native pieces, each one belonging to ONE platform, shown
on a single page. No code in sight, nothing to install. It is an
exhibition, not an installable library.

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build
pnpm typecheck
```

**How all of it works** (the trip a clip takes from the vault to the
playground and from there to the public exhibition, the map of the repo,
the boundary between what is private and what gets published, and what
you need to get going in a fresh worktree) is in
**[AGENTS.md](AGENTS.md)**. It is the first thing to read.

The complete system (every token, its value across the five viewports,
its evidence grade and the rules that govern what is missing) is in
**[DESIGN.md](DESIGN.md)**. This file is the record of every decision
and why it was taken the way it was.

## Decisions taken, and where they come from

| Decision | Value | Source |
| --- | --- | --- |
| Format | One-page exhibition; every piece has its **own URL** (`/button`). **No router**: there are two views, `history.pushState` is enough. The browser's back button returns to the list **and to the scroll position you were at**; arriving straight from a link works too | the original decision was "state, no routes", taken when the detail was an empty rectangle. Once it was settled that the detail carries notes, not being able to link to them turned into a real loss |
| ↳ deploy condition | The host has to serve `index.html` for unknown routes (SPA fallback). Vite already does it in dev and in preview | it is the only thing that having real routes instead of hash routes imposes |
| ↳ the item is an `<a href>`, not a button | A plain click navigates on the client side; cmd-click and middle click open a new tab | **measured on benji:** his list item is `<a href="/drawesome">`, the click makes **0 document requests** and cmd-click opens a tab. Ours was a `<button>` with `pushState`, and that cost cmd-click, middle click, *"open in new tab"* and *"copy address"* from the context menu, plus a screen reader announcing **"button"**. The interceptor lets every modifier key through, and every button that is not the primary one; only the bare click becomes client navigation |
| ↳ and we keep what he does not do | **it restores the scroll on the way back** | benji returns to the list at scrollY 0, measured. We save the position and hand it back, verified at 1500 → 1500 |
| ↳ what is left to check | Tab in a real Safari | in Chromium the focus reaches the anchor with its 2px ring and radius 8, and Enter navigates. In Playwright's WebKit, Tab reaches **neither the anchor nor a `<button>`** (I measured both), so the environment cannot answer it. Safari has a preference (*"Press Tab to highlight each item on a webpage"*) that governs whether links enter the tab order, and that one has to be seen in the real browser |
| Display | Segmented: one piece per row, title on top, large preview | same |
| The piece's box | **Fixed height, never a ratio** | six cases measured across the two of them (`.context/recon/CARDS.md`): what runs carries a height picked by hand, what sits still lets the content decide. Neither of them uses `aspect-ratio` for anything alive |
| ↳ Web | **260** in the list, **400** when opened. As `min-height`, so a floor | both of benji's, and the relation between them too: inside a long page his demos measure 260 (×4 out of 21), and when the demo **is** the page the frame of /drawesome measures 400. His 20 demos do not change height at any viewport, measured at 1440, 768, 500, 390, 320 |
| ↳ App | **No height**: it reserves the phone slot (**228**×448 in the list, **319** when opened) and the height comes out of that plus 40/60 of padding. Gives 528 and 707 | from benji · family-values, which also declares no height and does not have a single media query in those classes. Sweep of 13 widths: his and ours give way at **exactly 395**, without copying any breakpoint |
| ↳ the cost | Below 396 the App detail stops being bigger than the list | at that point the usable width is already under 228, the two slots top out at the same number and give the same height |
| The card's skin | **Darker than the page, no ring and no shadow**: the contrast does all the work. `--surface: #f8f8f6`, −5 from the canvas | it is josh's rule, measured (`#fafaf9` on pure white, −5) and chosen over benji's, which is the opposite: card flush with the background (−1) defined by a 1px line. What was there was a card **lighter** than the background **plus** a ring at twice his. Both signals against |
| ↳ the delta transfers, not the value | Copying his hex `#fafaf9` onto our canvas would give **−3**, not −5 | his page is pure white and ours starts 2 units below. Copying his color and copying his contrast are different decisions and they land on different steps |
| ↳ radius | **8** | census of the 7 pages: for large boxes there are two numbers and there is no third. benji **8** (50 uses in family-values, 4 in liveline) and josh **12** (11 on his home). The rest are one-offs from a single page: his 14 hero, the 16 of the `<img>` boxes, bloom's lone 32. The 8 is the most repeated across the two of them, the only one **both** use on large boxes, and a multiple of 4, which 14 is not. On small controls the two agree on 4 and 6 |
| ↳ hover | It darkens the fill and nothing else: no shadow, no scale, no movement. A step of **−4** from rest, to `#f4f4f1`, picked among −3, −4 and −5, which is half a step of his | his demo boxes do not react because **they are not clickable**. His rule is **one step** of his ramp, and it shows in the only two hovers he has: home cards `neutral-50 → neutral-100`, bloom's button `stone-700 → stone-600`. The button's hover **lightens**, so the rule is one step and not a direction. This used to say −10 against his page: that delta came from measuring against the white of /pasito, and the hover happens on his home, which is `#fafafa` |
| ↳ press | **There is none.** `:active` paints identical to `:hover`, in all four modes | across the **23 pages** of the two highest references (9 of benji's, 14 of josh's) there is **one single live `:active`**: a 40×40 button on `/honkish` that neither drops nor scales. It takes away the 1px ring the hover put on it (`box-shadow` spread 1px→0px, `transition-duration .02s` read at runtime). His press does not add a state, it **removes** the hover. The lists of both of them, the same object as this card, have no press. And `active:scale-[0.94/0.96/0.98]` exists in josh's bundle and **zero** elements use it |
| ↳ what was withdrawn when this was decided | --surface-press: #f0f0ec with its three branches, and --dur-press: 20ms | they were linear's `--color-bg-level-3` (which lands exactly on our next step) and benji's asymmetry. The 20ms were measured correctly but applied **backwards**: on his button they serve to take the hover away, not to deepen it. When the Button piece needs a press it gets measured for a button, which is where that evidence does apply |
| ↳ and benji's mechanism was dropped | dimming the siblings to `opacity .3` | **it is a matter of scale, not of taste.** His list is 7 rows of 41px that **touch each other** (0px gap), 286px in total = 0.3 screens: you see all of it at once and the gesture is about *the list*. Ours is **8 screens** and at 1440×900 you see **2 cards**, so "the rest dims" would literally be *the other one*. Our card is 7.3× the area of one of his rows. On top of that he dims **text**, the `h2` and the `span`s of the `time`, with `span:last-child` exempt so the column of years stays lit, and never a surface: he does not have one |
| ↳ curve and duration | **All of it split by property.** Surface: `--ease-surface: cubic-bezier(.23,1,.32,1)` + `--dur-surface: 150ms`. Text: `--ease-text: ease` + `--dur-text: 100ms` | **linear does not pick a curve, it picks by what is being animated.** Its three cards with hover use ease-out without exception and 25 of its 46 color transitions end in `ease` (54%). The ease-out value is the one from `/review-animations`, catalog line 32, *"strong ease-out for UI"*; the text one is backed by four sources: benji (every transition in his bundle), josh by hand (`.company-link` ×18), linear (54%) and the three skills |
| ↳ the split duration is our own composition | 100 for text, 150 for surface | **no reference splits the duration**: benji uses 100ms for both families (`background-color` ×10, `color` ×23) and josh 150 for both (`background-color` ×11, `color` ×21 by hand). We take benji's number for the text and josh's for the surface. Chosen by looking: at 100ms the card's hover is 6 frames instead of 9 and with Δ4 it comes out almost like a dry switch-on; on the text, with Δ101, 100ms reads just right |
| ↳ and the back arrow is the exception | It goes with the **surface** pair on both of its properties | it animates background **and** color, so with the split by property they would finish at different moments (150 the background, 100 the color) and it would read as two things. It is animations.dev's rule for paired elements: *"what moves together has to feel like one unit"*. **The full rule: the property decides, except when one element animates both families. There the element decides** |
| ↳ a deliberate divergence in the value | The family comes from linear; the number comes from the skill, and **they do not match** | linear uses ease-out on its cards but never this value: its three use quad, the keyword and cubic. It declares the quint among its 18 Penner curves and uses it **once** in the whole site. If tomorrow we prefer what they ship, quad is `cubic-bezier(.25,.46,.45,.94)`, their workhorse with 60 uses |
| ↳ and the hover stays **symmetric** | 150 going in and 150 going out | **a reversal:** I had written that three sources called for asymmetry and it was false. Linear's asymmetric rule does exist (`.rWdRxW_card` with `:hover{transition-duration:var(--speed-highlightFadeIn)}`, FadeIn `0s`) but it lives in `ContactLink.css` and renders **zero** elements, the same mistake as josh's `active:scale` utilities. The card that does render, `.Dc5tqa_customerCard` ×24, is symmetric. Live sweep over 5 pages of linear: **21 hoverable elements with a transition, 0 asymmetric**; benji's list and josh's row too. And the other two agreements were not about hover: benji's 20ms are from an `:active`, and Apple's *pointer-down* is about the press. Standard 9 says it word for word, *"press-and-release or hold"*. A press is deliberate and deserves an instant acknowledgment; a hover is incidental, and 150ms works as a damper. The asymmetry is noted down for the press, with the Button piece |
| ↳ and the two that were there were wrong | --ease-fill and --ease-out are gone | --ease-fill was baked in as *"josh's curve"* and **it was not**: the **21** appearances of `cubic-bezier(.4,0,.2,1)` across his three pages all come from a Tailwind utility (`transition-colors`, `-all`, `-transform`, `-opacity`) and **none** from his CSS. It is the framework's default. And --ease-out was a quint-out inherited from Carousels, which is the curve for **entering and leaving**, something that never happens on this page. The quint is not kept just in case, a token with no reader is dead code, but its value stays written in DESIGN.md for the day a piece enters or leaves |
| ↳ and the two of them changed name | --dur-fill → --dur-color, and the curve to --ease-color | **rule 4** of the system itself asks for it, the name is the role. `fill` was the role when the only reader was the card's fill; today there are four readers and three of them fill nothing |
| ↳ the title does NOT go inside the fill | Only the rectangle gets painted; the title stays outside, on the canvas | **one single reference did it, not three.** Josh's counts: his `<a class="block rounded-xl px-4 py-3">` of 580×76 carries the title inside and the hover paints the whole block. The other two I had cited do not apply and are withdrawn: agentation's `.demo-card` has **zero `:hover` rules**, `transition: all 0s`, `cursor: auto` and is not inside any link. It is a static drawing, and that it is a filled box with a title inside says nothing about hover. And benji **never fills anything**, the background of his row is `rgba(0,0,0,0)` in every state. And josh's block contains **only text**: title plus description. Ours would contain an empty 260px frame, which is not the same object |
| ↳ what was tried and dropped | A block that bleeds 16px outwards (592×292, concentric radius 24) with title and card fused into a single surface | it was built in the prototype and it works: the title does not move a pixel, the card is still at 560 and the vertical rhythm survives with the three bleeds. It was not dropped for failing to work, it was dropped for lack of backing |
| ↳ stuck hover on touch | The index's hover goes behind `@media (hover: hover)`. **It is the only pointer gate in the system** | the artifact shows up where the tap **leaves the element on screen**: tapping a link in the index only scrolls, so the `:hover` sticks to it, and since hover and active paint the same color the stuck one is indistinguishable from the real one. Measured on an iPad Pro in landscape: tapping "Switch" and scrolling far away left **two** links painted. The card does not need it because tapping it unmounts it, the back arrow does not either, and in WebKit a single tap is enough on both. The cut falls exactly right: the index shows above 1080px and the only measured device that gets there without a mouse is the iPad Pro in landscape (1194px, `(hover:hover)` false). Neither reference gates anything by pointer, zero `(hover:`, `(pointer:` and `(any-hover:` in the two bundles |
| ↳ canvas and ink, now verified | `#fdfdfc` and `#111111` | they came from Carousels' design.md with no way to verify them. They are literally benji's: his declared variables say `--body-bg:#fdfdfc` and `--body-color:#111` |
| Text grays | **ONE secondary level: one alpha, two bases.** `--secondary-alpha: 37%`, applied from pure black (annotation → **160**) and from `--ink` (nav → **166**) | it is benji's structure, verified in his served CSS: he declares **one single** text color token (`--body-color:#111`) and **no** gray token. Everything gray is his black or his ink at an alpha, and `.4` dominates with 40 declarations against 8 for the next one. His "two grays" (152 and 159) are that same 40% from two bases. It is not a step, it is the leak from writing the rule in two files. With `α=.4` our two bases reproduce his 152 and 159 dead on: that validates the model |
| ↳ the alpha was chosen in two steps | **the ballpark** with a slider on the annotation alone (163), **the number** with a sweep of six alphas where both move together (37%) | the slider moved **one line** of the page, because back then the nav was still a separate number: it was good for locating the zone. The sweep was looked at three ways (a continuous ramp, the two derived values **touching each other**, and the real text at 13/16 against 14/20) because a jump of 6 units at 13px is invisible if you look at them apart. The annotation ended up 3 darker than the slider's 163: ΔL .006, inside the noise |
| ↳ the nav moved from 159 to 166 | an intended consequence of the rule | it had been copied from his `hsla(0,0%,7%,.4)` while baking in the index's typography and **it was never chosen**. Under this rule it does not get chosen, it gets derived |
| ↳ and the order fixed itself | the nav ends up **lighter** than the annotation, as on his page | before it was the other way round (163 annotation against 159 nav). Now it is not a decision: it falls out of `--ink` being lighter than pure black. Gap 6; his is 7 |
| ↳ both come out under APCA | Lc **50** and **47**, against the 60 it asks for on text that is not body | benji too: 54 and 50. Accepted knowingly, what goes in gray here **annotates**, it is not read. Crossing the floor called for `α=45%`, which in the sweep looked too dark for the role |
| ↳ contrast is measured by compositing | `rgba(0,0,0,.4)` gives **2.84:1**, not 20:1 | you have to composite the alpha over the background before calculating. Without that it scores as pure black and every number comes out wrong |
| How color gets used | **Everything that gets READ goes in ink**; gray is only for what **annotates** | benji's rule, measured on four of his pages. That is why **the detail's description moved to ink**: it is prose. What is left for gray is the masthead's subtitle and the detail's platform, which is the role of his `<time>` under the `h1` |
| ↳ the index's active state | It does not reach the ink: it stops at **65** | his CSS puts hover and active in the same declaration, `hsla(0,0%,7%,.8)`. The piece you are looking at stands out without being the darkest thing on the screen |
| Text selection | benji's: `#ededed` background and the text **forced to ink** | all three have a global rule and they do not say the same thing. Josh inverts (`#fff` on `#000`), emil sets **only the background** (`#e2e1de`) and does not touch the color. What decides it is the forcing: emil can go without it because his secondary sits at 99; ours sits at 160 and on his background that gives **2.00:1**, unreadable exactly while you are selecting it. Forced to ink, 16.13:1. And it is not a new rule: it is "everything that gets read goes in ink" applied to a state |
| ↳ here the hex does get copied literally | `#ededed` as is, with no delta transferred | the first time in the whole system. His canvas is `#fdfdfc` and so is ours, and so is emil's (`--color-gray-100:#fdfdfc`). On the card, the hover and the grays the delta had to be transferred because the backgrounds did not match; here they do |
| Dark mode | **Yes, triggered by the system like josh.** And it is not a hand-written palette: it is **four numbers** (depth 9 · warmth .003 · ink 250 · hue 106.4) and everything else falls out of two rules | of the five measured references only josh has a **page-level** dark theme: benji and emil have dark palettes in their CSS but for embedded components, and linear forces `data-theme="dark"` and ignores the system. The canvas 9 is linear's (`--color-bg-level-0:#08090a`), the ink 250 is josh's (`--foreground:#fafafa`) |
| ↳ rule 1 · text keeps its **contrast** | ink 104.1→**104.4** · annotation 50.3→48.1 · nav 46.7→42.5 · active 92.9→**93.4** | it has a legibility floor that surfaces do not have, so what is held is the Lc and not the number. The secondary's 59.2% comes from the **×1.6** benji applies to his two tokens with alpha (`.28→.45` and `.10→.16`, the same factor twice). The active's 93% does not keep the alpha but its **position** between the nav and the ink: in light, 80% falls at 80.4% of that run, and in dark it takes 93% to fall in the same place |
| ↳ rule 2 · everything else keeps the **distance** and flips the direction | light `−5 −9 −16 −36 −151` → dark `+5 +9 +16 +36 +151`; the alphas, same number with the base turned around | the alpha part is **linear's**: their `--color-border-translucent` is `#0000000d` in light and `#ffffff0d` in dark, ×1.00, and `#0000000d` is 5.098%, our `--hairline` to three decimals. It is a compromise and not a law: keeping the distance gives ~1.5× of ΔL, so the card **is** somewhat more noticeable in dark; keeping the exact ΔL left it at +3 and invisible, and emil (×3.00) and linear (×4.48) enlarge it much more so it holds up across screens. **APCA cannot arbitrate it**: it returns 0.0 for every surface |
| ↳ what made the ink of 250 possible | rewriting the secondary as **one base and two alphas** instead of one alpha and two bases | deriving the nav from `--ink` left the ink trapped: it had to come in ~17 units from the end or the two bases flattened into each other. That forced an ink of 238 and left the text 7.5 Lc below the light one. The light value did not move, `black@34.4%` gives the same 166 as `ink@37%`, and it is the structure benji uses for his nav at rest and active |
| ↳ `color-scheme: light dark` | none of the five references declares it | without it the browser auto-darkens native controls and scrollbars and the page ends up half and half |
| High contrast | `prefers-contrast: more` covered in both modes. **The two grays collapse into one** (alpha 57.4% light, 78.8% dark) and every distance that is not text doubles | **the first color decision with no reference at all**: zero occurrences of `prefers-contrast` in the five bundles. The rule comes from `/better-colors`: widen the L gap to ≥0.15 and check against APCA's **preferred** thresholds (90 body, 75 non-body). The ink already passed with 104; the annotation (50) and the nav (47) did not |
| ↳ the arithmetic decides the collapse | the alpha that reaches Lc 75 comes out **the same** for both roles | the two aim at the same number, so they converge. And that is fine: that distinction was 3.6 Lc at its best moment, exactly the kind of subtlety someone asking for more contrast wants gone. What survives is the hierarchy that carries meaning, ink against secondary |
| ↳ the gap widens more than was asked | **0.153 to 0.194** against the 0.15 minimum | reaching APCA's threshold already covers it in all four cases, so the threshold decides and a second calculation is not needed |
| ↳ and the non-text part doubles | card −5→−10 · hover −9→−18 · selection −16→−32 · underline −36→−72 · line alphas at double | the skill does **not** ask for this, it is our own call: under high contrast the structure has to read too. One rule instead of four numbers. The underline's hover goes to `--ink` because doubling its 151 runs off the range, and the ring moves one accent step (\|Lc\| 77.8→87.9 light, 34.8→48.7 dark) |
| ↳ links | **No color of their own**: they inherit the block's, and a 1px `#d9d9d9` underline marks them, which on hover goes to `#666`. The text does not move | **two of the three references do this**, benji with a pseudo-element, emil with `text-decoration-color #bcbbb5` at 1.5px. We used emil's mechanism with benji's values: our text is 14px, not 16 |
| Focus | `2px solid #005fcc`, **offset 2px**, no transition | the color is **Chromium's** default ring, **measured off the engine**: I focused an unstyled button in all three and read the painted pixel. Chromium `#005fcc` solid, WebKit `#0067f4` **at 50%** (the Aqua glow), Firefox `#007aff` solid. Chromium wins for being the deepest and the one with the most contrast, \|Lc\| **77.8** light and **34.8** dark over APCA's floor of 30. Its dark counterpart `#347ee5` comes from raising its L by the ΔL benji and josh apply to their accents; the same calculation on Firefox's blue gives `#3f9aff` against benji's measured `#3d9bff`, **one unit apart**. The `transition:none` is benji's |
| ↳ two things that came out of measuring them | the blue we had **was Firefox's**; and WebKit paints its own **at exactly 50%** | `rgba(0,122,255,.5)`, inherited from benji, is `#007aff`, the one Firefox paints. And WebKit's composite gives `(127,179,249)` to the unit, which means the mechanism of Safari's old ring was the one we already had |
| ↳ `outline-offset: 2px`, from josh | and it is not decoration | without it the ring **cuts the letters** of the index's links, which are text with no padding. It replaces the `padding:0 2px / margin:0 -2px` benji uses to push his own clear, without touching the layout. On the card the outline follows the radius 8 on its own |
| ↳ and it uncovered a layout bug | the flex was stretching every index link to the **89px** of the longest one | the words measure 31 to 62, so the ring was drawing up to **58px of emptiness**. With `align-items: flex-start` each one measures its own word, which is what benji has by nature, because his links are inline `<a>` |
| Nav | **Fixed index on the left** with every piece grouped. No tabs. At 80 from the edge, 13px/460 at 40%, 8px between links, width fitted to the longest label | 13 pages of the two references walked through: **neither uses tabs**, both navigate with a fixed index. Measured in `.context/recon/NAVIGATION.md` |
| ↳ the `Web`/`App` labels | **Always visible**, and they weigh **the same as their links**. They are not headings, they are the first line of their group. The only thing that separates them is the air: **16px**, double the 8 there is between links | it is benji's, `nav h2` and `nav ul li a` identical property by property, with `padding:0 0 1rem` on the label and `gap:.5rem` on the list. Measured on his page, not just in his CSS: his index arrives empty in the HTML and JS fills it |
| ↳ where it starts | **"Web" sits on the same line as "Button"**, the title of the first piece. Gives 237 at 1440 of width. It aligns on the text **baseline** and it **gets measured**, not calculated | chosen by looking, with red rulers on top, against four other pairings (link↔piece 205 · label↔separator 186 · label↔masthead 82 · benji's raw 80). It gets measured because the number is the sum of the whole vertical stack of the page: as a `calc` it would be a formula nobody would update |
| ↳ **with** scrollspy | The piece you are looking at gets painted (at **65**, see above). The active one is the last whose top edge has already crossed a line **128px** from the top, plus a guard at the end of the document | it is benji's rule, taken out of his bundle: his formula carries half a viewport on both sides and cancels out. This used to say "no scrollspy", and it was reversed |
| Section separator | Label 14px/600/#111 + hairline out to the edge of the rail; 8px gap, 64px above, 56px below | benji's separator on /liveline and /drawesome, measured live. His `<hr>` is empty; what paints is the div React wraps it in |
| What the detail exists for | For **the notes and the air**: the why, the decisions and the numbers, plus the piece alone on the screen and bigger. The list shows, the detail explains. It is not just an enlarged piece | with a live preview in the list, the detail does not contribute the piece (you already had it): it contributes what surrounds it |
| ↳ and the description goes **below** the piece | At the top what stays is `title + platform`; the prose comes in after the preview, at **24** | Vito's request on 2026-09-04, and it is reading order and not a value: first you see the thing, then you read what it is. What it wins along the way is that the top is **exactly** benji's measured pair, his `h1` with his `time` at 4px, with no third line that he does not have. The 24 was not chosen by looking: it reuses the `margin-bottom` of the block above so there are not two numbers for the same relation (text against the piece). It is still owed a pass with the scrubber |
| List spacing | Air above/below **80 → 32** · masthead→section **60** · label→piece **40** · name→card **12** · between pieces **48** · between sections **64** · label↔hairline **8** · subtitle **4**. **All multiples of 4** | chosen with the scrubber on the real page. The 40, 48 and 64 are benji's, measured; the rest was decided here. Detail in `.context/recon/NAVIGATION.md` |
| ↳ the names of the tokens | **Owner → part → property**, apple's way: `--page-padding-top`, `--section-content-gap`, `--piece-card-gap`, `--index-group-gap`. **The whole --space scale was deleted** | measured across 1.3 MB of served CSS from apple, linear and openai. Apple: `--buystrip-content-padding`, `--media-gallery-bottom-content-padding-left`. Linear shorter: `--button-gap`, `--kbd-gap`. OpenAI in between: `--page-top-gap`, `--tabs-sticky-gap`. **None of the three has a token named after its value**, there is not one single --space-4 in the three bundles. And the three share that the name is the ROLE and the value is contextual: linear's `--button-gap` is worth 4, 6 or 8 depending on the size |
| ↳ ×4 in layout, free inside components | Every **layout** spacing is a multiple of 4. **Inside a component it does not apply** | it is what benji does: he uses 2, 3, 5, 6 and 10, and 6px shows up 28 times, but **only** in `.Toolbar_*`, `.BarSlider_field`, `.submitButton` and `[data-size=sm]` variants. Not a single one in page layout. Same shape as his rule for weights: the dirty values exist for optical compensation and for internals, never for the structure. Today we have nothing internal, the card is empty and the only component is the detail's arrow, which is provisional |
| ↳ the number is the gap you can see | `--section-content-gap` goes from the line to the first text, not the `margin-bottom`. The line sits centered in the box of the label, so the CSS discounts that half box by working it out from `--fs` and `--lh` | the margin said 32 when the real gap was 41.5: two numbers for the same distance. The one that decides is the one you see |
| ↳ grouping | label→piece (40) has to be smaller than between pieces (48), or the label comes unstuck from its group and reads as floating between the two | it came from 56, which was larger: the grouping was inverted |
| ↳ masthead title → subtitle | **4**, and 8 of air below the whole masthead | it is benji's and here the analogy is **exact**: his `<header>` is the same pair as ours, an `h1` and a secondary line, both 14px with a line height of 20, with `display:flex; flex-direction:column; gap:.25rem; padding:0 0 .5rem`. Verified in the served HTML of his home, not just in the sheet. Since the two texts are the same size the line height already separates them: the 4 is a nudge. The 8 below we already had. Josh uses 16, but his `h1` is 30px against a paragraph of 16 |
| ↳ piece title → card | **12**, constant at every width. The name goes **above** the card. The air is **claimed by the block below** (`margin-top`), the title does not push it. **Chosen by eye with a scrubber on the real page, not copied** | no reference has our structure, a list of pairs [short name + large card] repeated 19 times. Benji on /liveline makes ONE block out of each section; his home is a list of text rows with no block. The closest is josh on /pasito: an `h2` of 20px/500 followed **directly** by a code card, at **16** (`mt-4`), under "Usage" and "Autoplay Usage", the two cases where he goes from the title to the block with nothing in between. Where he shows the component **visually** he puts a description between the two, which is not our case. 12 and 16 were tried with the 19 pieces stacked and 12 won; his `h2` is also 20px and ours is 14, so his 16 hangs off a bigger title. The **shape** is copied and verified on his real page: the container of his chart carries `style="margin-top:2rem"`, which means the block claims its margin instead of the title pushing it |
| ↳ a retraction worth keeping | The 12 had been justified with benji's timeline (`h2` 14/500 + block at `.75rem`). **It was false**: `timeline` does not appear once in the HTML of /liveline, it is CSS from another page. That also brought down a supposed caveat about a vertical line with circles that never existed | I read rules that exist and took for granted that they were visible. Same mistake as with the `<hr>`. A rule in the CSS is not a rule on the screen: if the conclusion depends on what gets rendered, you have to look at the served HTML, not just the style sheet |
| Categories | **Web** and **App**, both always visible (there is no filter). The cut is browser vs installed app, which is the line that really costs something to cross. Under App, SwiftUI and Expo/React Native live together (both render real native views) | the runtime is the honest property: "iOS" under-declared the Expo pieces, which also run on Android |
| ↳ App, not Mobile | **App** cuts on the same axis as Web (where does it run?); **Mobile** answers a different question (on what screen?), and mixing two axes is what already broke `Web / Web Mobile / Native`. The decider: a web sheet designed for a phone is *web and mobile* at once. With Mobile the cut breaks and you have to invent a rule; with App that piece is Web and that is that. Mobile is understood half a second faster, but next to "Web" the contrast disambiguates on its own | the collision is not hypothetical: Vaul (Emil Kowalski, one of this project's references) is exactly a mobile-first drawer that runs in the browser |
| Native demos | **`platform` decides it, and nothing else.** Web goes live in the browser, App goes in video, **Expo included** | it used to be decided piece by piece because Expo *could* go live via react-native-web. When Expo moved to video as well, the rule **collapsed into the category** and the `runtime` field that held it up stopped making sense: the type was deleted. The original fact is still true, `expo-haptics` maps to the Web Vibration API, which Safari does not support, but there is nothing left to decide per piece |
| Elevation | **There is none, and it is a decision.** Zero `box-shadow` in the whole product: the card is defined by contrast against the canvas | measured on four reference pages. benji home **0** shadows, josh home **0**, josh interface-craft **0**, and the **52** in benji/family-values are *all* `0px 0px 0px 1px`, zero blur, zero offset: borders drawn with `box-shadow`, not elevation. **Across the four there is not a single shadow with blur.** `/better-ui` asks for the opposite ("shadows for elevation, borders for structure") and benji does exactly that backwards; we follow the references, which is where everything else came from |
| z-index | **Zero, and it is not decidable yet** | today nothing overlaps, the index is `fixed` but it lives in the margin. josh has none across his two pages; benji only in `family-values`, his one page with interactive demos. It is the same split as ours: the chrome does not need stacking, the pieces do. Five of the 18 are layers (Dialog, Sheet, Tooltip, Context Menu, Action Sheet) and the scale gets decided with the first one, not before |
| The back arrow | **It paints the glyph, not the square**, and it reaches `--active-c` (65 light / 233 dark) in 100ms `ease`. The 34×34 square stays invisible as the click area, and the radius of 8 because the focus `outline` follows the `border-radius` | **unanimous across the two references**, measured live: benji `.styles_backButton` 122×28, radius 0, `transition: color 0.1s`, `rgba(0,0,0,.4)` → `rgba(0,0,0,.8)`; josh `"Home"` on /melt-effect 62×20, neutral-400 → neutral-900. Both of them: **they do not paint a background, they change the color, they do not move**. And benji's 0.1s is exactly the `--dur-text` we already had |
| ↳ the destination is the 80%, not the ink | 65, not 17 | it is benji's, and he **does not reach his ink**: he stops at 51 over his canvas. We stop at 65 because the 80% is written from our ink base and not from pure black, the same *one alpha, two bases* structure that governs the text grays. The ink was dropped (17, what josh does) and so was the text hover level (102, `--link-underline-hover`): the second would unify everything that reacts to the pointer into one color, but in dark it lands on 160 against a rest of 155, **five units, invisible** |
| ↳ and the token lost the component's name | `--index-active-c` → **`--active-c`** | it had the index as its only reader; today there are **three**, the index's active state, its hover and the arrow's hover, across two components. By **rule 4** the name is the role, and the role is the level that marks *"this one"*: because you are pointing at it, or because it is where you are. That the two things share a color is his: he writes `nav ul li a:hover` and `nav ul li[data-active=true] a` in **one single declaration** |
| ↳ and the exception for the pair fell away | it no longer exists | the arrow was the only element that animated surface **and** text, and that is why it took the surface pair on both properties. Now it animates a single family: the rule goes back to being **the property decides, full stop**. Along the way --a1 died, whose only reader was that background. It left all four branches, and the comment that said *"the focus uses it"* was never true |
| Motion | **The page has no entrance animation.** Opening a piece and going back animates nothing. The only thing that moves is the hover, and those are changes of color and of ring, not of position | there were enterFwd/enterBack and an entrance for the detail. On top of that enterBack **never fired**: data-dir was written by hand as "fwd". All three were taken out instead of fixing the one that was missing |
| ↳ no reduced-motion block | It is not needed: **there is no movement left to reduce**. The index's smooth scroll does consult it, in `app.tsx` | the four places with a transition cross a color (index, the card's fill, the back button, the links' underline) and none of them displaces, scales or rotates. Verified with `reduced-motion: reduce`: the card declares only `transition-property: background-color`. It stops being true the day a scale comes in, and that is when it has to be written |
| ↳ the font | **InterVariable, self-hosted**, the official file from rsms.me subset to latin. Four files by `unicode-range`: **102 KB** is all an English page loads, against 343 for the original. It keeps both axes, `opsz` 14 to 32 and `wght` 100 to 900 | **it is not the Google Fonts one**, and the difference is concrete: asking it for `family=Inter:opsz,wght@14..32,100..900` returns CSS with **zero** mentions of `opsz`, it ignores the axis. Our `body` uses `font-optical-sizing:auto`, which without that axis does nothing. Benji uses the Google one via `next/font`, so **he does not have `opsz` and we do**. Keeping it costs 36 KB and it is paid on purpose |
| ↳ why it stopped coming from a CDN | It was a blocking `<link>` to `rsms.me`, the author's personal site, not a production CDN | if it did not load, CSS matching turned **460→500 and 560→600** and the hierarchy fell apart. From our own origin, if the font fails then everything has already failed. And both references self-host: neither one loads from a CDN |
| ↳ font smoothing | `-webkit-font-smoothing: antialiased` **and** `-moz-osx-font-smoothing: grayscale`, both of them | here the hierarchy **is** the stroke, 460 · 500 · 600, all at 14px, so if Firefox draws the three steps heavier it does not look "a bit different": it looks like **less hierarchy**. Benji has both in his `body` (SOURCE) |
| Typography | **benji's system**: one single size (14px), hierarchy by weight **460 · 500 · 600**, three and not four. Tracking **−0.00563rem**, line height **20px** (his `1.25rem`, absolute and not a ratio). Index 13px/460, tracking −0.0025rem, lh 16 | chosen with a picker against josh's system on the real page. Every value from benji.org's served CSS: his 14px text carries `line-height:1.25rem` and `letter-spacing:-.00563rem` in **all** of his rules, without exception. The two systems measured in `.context/recon/TYPE-SYSTEMS.md` |
| ↳ why not josh | Josh uses the opposite on his subpages: **five sizes** (30·20·16·14·12), **two weights** (400/500) and a ladder of **five grays** (23·64·82·115·163). His cost was competing with the pieces, and he forced a redo of all the vertical spacing, tuned for 14px text | measured from the served markup of `/bloom`, `/dialkit`, `/melt-effect`, `/on-being-an-elder` and `/pasito`: his `h1` is the same string in all five |
| ↳ the ladder of weights | **Interface exhibition 500 · section 600 · piece 500**, body 460. The page title is **not** the heaviest thing: the section labels are | it is what benji does, verified end to end. `.article > header h1` is 500 and the separator on /liveline is an `h1` **inside** `<article class="article">`, so it falls under `.article h1{font-weight:600}` (confirmed by position in the served HTML). His reason is functional: the title is read once and its rank is already given by position, alone at the top and surrounded by air; section headings get searched for many times in the middle of content, and there the weight is what makes them findable. **The weight goes where the work is, and the work is scanning** |
| ↳ three weights, not four | The **560 was left out**. The scale in use is 460 · 500 · 600 | three is where the consensus among design systems sits ([EightShapes](https://medium.com/eightshapes-llc/typography-in-design-systems-6ed771432f1e): *"some systems can get away with as few as two or three weights"*). The 460 cannot be removed because it is the body. And the 560 we had came from `.article h2`, a sub-heading inside the article, and not from the separator we copied, which is the `h1` at 600 |
| ↳ never a jump smaller than 40 | Two levels of the same hierarchy are separated by **40 or more**. Intermediate weights (520, 540) were dropped over this | the full count of his `font-weight` gives 100·200·400·430·450·460·500·560·600·620·700·800, so he does have small jumps, but **430** is for italics (`\.article em`: the italic looks heavier and he compensates by dropping 30) and **450** is for component internals. They are optical compensation and one-offs, never steps of hierarchy |
| ↳ the accepted cost | "Interface exhibition" and the piece name **tie at 500**. And the word "Web" comes out twice: 600 in the separator, 460 at 40% in the index | the tie is the price of coming down to three weights: those two are told apart by position and context. The "Web" one was left open and closed by accepting it: they are not two weights that almost tie, they are a heading and a line of a list |
| ↳ what was corrected while baking it in | The tracking was **−0.004rem**, which is nobody's. There were **three line heights**, two written by hand (`1.3` on the titles, which does not exist in benji's CSS; `1.2` in the index, which is his). The section label was at **600** when benji's `h2` is **560** | the page was a hybrid nobody had decided |
| ↳ tokens by role | Typography stopped living hardcoded per class: each role (`--type-h1-*`, `--type-h2-*`, `--type-h3-*`, `--type-body-*`, `--type-meta-*`, `--type-nav-*`) is a set of tokens. Line heights go in **px**, not as a ratio | it was needed to be able to mount the two candidate systems, because they are not variants of the same one: benji shares a single size across every role and josh gives each one its own. It stays because it is where each role's weight lives, and otherwise it goes back to hiding inside its class |
| How it responds to the viewport | **It steps, it does not interpolate**, benji's way. A single step at **768** that moves two things together: top air 80→32 and margin 16→24. The index leaves at **1080**. Zero `clamp()`, zero `vw` | measured from benji's four served CSS files and from the markup of five of josh's subpages (`.context/recon/RESPONSIVE.md`). Josh is the opposite: **zero steps in the frame**, 142 classes on `/bloom`, none with a responsive prefix, 672·24·64 from 320 up to 2560. We preferred the page to respond rather than stay the same at every width |
| ↳ the margin does two jobs | **16** above 768, **24** below. Above 768 the rail is centered with air to spare and the padding is vestigial: it only narrows the column. Below 582 the rail *is* the viewport and that same padding becomes the only distance to the edge of the screen | it is exactly what benji does (`padding: 5rem 1rem 2.5rem` → `2rem 1.5rem 2.5rem`), and it explains why the number is not constant without being incoherent |
| ↳ the index at 1080 | It hides below **1080**, not below 1200 | 1080 is benji's (`@media(max-width:1080px){…{display:none}}`), and his index is fixed at 80/80, which is where ours came from. The previous 1200 did not come from either reference: it was ours and nobody had decided it |
| Top air | 80px, and **32 below 768px** | benji.org's CSS (`padding: 5rem`). Measured to the pixel: at 769 it is 80, at 768 it is 32. Before it sat at 640, inherited from Carousels' DESIGN.md |
| Masthead | "Interface exhibition" (600) + a gray line below. The subtitle does not change size: only weight and color | benji (`h1` 500 ink / `time` 460 at 40%) and josh (name and description at the same size, only the color changes) |
| The subtitle's copy | *Components that feel right, for web and native apps.* "Feel right" is the quality standard Emil uses (animations.dev's h1: *"How do you craft animations that feel right?"*) and Josh too (*"Software that feels right"*). Neither of them uses "crafted" as an adjective: for them *craft* is a verb or a noun, and they name the quality with *feel right*, *care* or *taste*. It states the result, not the effort. **The word order was wrong until 2026-09-10** and Vito caught it: it read *Components for web and native apps that feel right*, where the relative clause lands on the nearest noun, so what felt right were the apps. The components are the subject of this page. Fixing it turned up three hand-written copies of the sentence and five of the name, so both moved to `src/site.ts` and `index.html` gets them filled in by `siteMeta` in `vite.config.ts`. The meta tags are exactly the copy nobody ever looks at | copy measured from animations.dev and interfacecraft.dev |
| Rail | **592** = exactly 37rem. With the margin of 16, the column comes out at **560** = 35rem | chosen with the scrubber on the real page, between benji's (582, his 36.375rem) and josh's (672, 42rem). Both numbers land on whole rems, which did not happen with either extreme. The previous one was 832, from Carousels' DESIGN.md, and it had never been looked at against this page |
| Bottom air | **80**, the same number as the top. It **does not step** at 768 the way the top one does | it does not come from the references: both of them close short (benji 40, josh 64) because they have a footer down there and we are not going to have one, so that air is the end of the page and not a separation. It does not step on purpose: the 80 at the top gets trimmed because on a phone it is dead screen before you read anything, and the one at the bottom is only seen if you scrolled to the very end. Benji does the same, he steps the top one and leaves the bottom one alone |
| Colors/spacing | Tokens inherited from Carousels' DESIGN.md (typography, colors and sizes only) | `src/tokens.css` |
| Stack | Vite + React 19, exact versions, plain CSS + CSS Modules | no source |

## The private area: vault and playground

Two things in the same place with different responsibilities: the
**vault** is the wall of references you look at, the **playground** is
where you build. Neither one gets published.

What was measured off the references is in `.context/recon/vault/GRILLA.md`.

| Decision | Value | Source |
| --- | --- | --- |
| It does not get published | `/vault` and `/playground` exist **only in dev**, and not because the host blocks them but because **the code never reaches the build** | two folds over `import.meta.env.DEV`: the list of routes folds to `[]` and the component to `null`. Verified: **0** occurrences of `vault`, `playground` and `private`-as-a-route in `dist/`, **0** dynamic imports, one single chunk. In production `/vault` falls into the same branch as any made-up URL: 404, with no special rule |
| ↳ the edge is a folder | everything hanging off `src/private/` inherits the gate | a flag spread across files gets forgotten; a directory does not. The dependency goes **one way only**: the private side can import from the product, never the other way round |
| Where the clips live | In a folder **of yours, outside the repo**. It can be your Obsidian. `VAULT_DIR` in `.env.local`, gitignored | not one clip goes into git. No `VITE_` prefix, on purpose: with it, Vite would bake the path on your disk into the client bundle |
| ↳ the bridge | a Vite plugin with `apply:'serve'` that serves that folder at `/vault-media/` | in `vite build` it is not even instantiated. **38 HTTP checks** green |
| ↳ three guards | an **allow** list of video and image extensions · nothing that starts with a dot · `realpath` on both sides | the allow list really matters if you point this at your Obsidian: an `.md` is never served, and not because a rule blocks it but because it is not on the list of what is. The dot one closes `.obsidian/` and `.trash/`. The realpath one stops a symlink from walking outside |
| ↳ a guard that was missing | the realpath one was **only on serving**, and the index got as far as listing a symlink to `/etc/hosts` as a 213-byte mp4 | you could not download it, but its size and its date were already published. Now it is written once and both paths use it. The test vault caught it, the one that has hostile cases on purpose |
| ↳ Range requests | implemented in the bridge, not in the player | they are a property of the **transport**: without them Chrome cannot seek inside the video and Safari does not play at all, and reaching the exact frame is the whole point. Real Chrome and WebKit load, seek to the exact middle and step 1/60s |
| ↳ a note about the environment | the video tests run with **WebKit or `channel:'chrome'`** | the Chromium Playwright ships is compiled without H.264 and fails with code 4 on bytes the other two play fine |
| The folder is the manifest | name, source and date get **derived** from the file and from where you dropped it. There is no JSON to maintain | a hand-written manifest falls out of sync the day you drag a file in without editing it, and then the vault lies. This way it cannot |
| The grid | 3 columns · gutter **32** · rows **64** · title→caption **8** | rows and title→caption are where **linear.app/now and figma's archive match exactly**, so they get taken without argument |
| ↳ the rail | **80** on each side, dropping to `--page-padding-inline` below 768 | it is not a new number: it is the same 80 as the top air and the side index. At 1440 it leaves the grid at **1280**, which is exactly linear's container. Convergence, not a search |
| ↳ the gutter goes clean | 32 with no line, figma's, against linear's 64-with-a-line | their 1px line exists **because their cards have no background**: without it nothing would separate one column from the next. Ours is a painted surface with its own edge, and a line on top would compete with it |
| **The shape of the box** | **benji**'s card in family-values: `padding 40/60`, radius 8, centered flex, the clip inside with an explicit width and the **height commanded by the content** | his clips and figma's are **all landscape**; ours run from **0.46** (a phone recording) to **1.60** (a desktop capture). There is no reference to copy, so the three obvious answers were tried with `/prototype` and all three fail: 16:9 containing leaves the vertical one as a strip between two empty fields, 16:9 cropping cuts it top and bottom (where the sheet and the tab bar live) and letting the box follow the clip gives 881px against 253 |
| ↳ what he does, measured | 45 cards **in a single column**, 550 of fixed width and **five heights**: 532 ×17 · 475 ×12 · 443 ×8 · 346 ×7 · 368 ×1 | his answer to different shapes is **to impose none**. `532.42 = 40 + 448.42 + 40 + 4`, the height is commanded by the content. Having one column lets him do it |
| ↳ and they were already tokens of ours | `--card-app-padding` and `--card-app-slot-width` came out of measuring **this same card** for the pieces page | nothing gets added to the system, it gets reused |
| ↳ **all of them the same height**, and it is **against** him | **574px** | he lets the content command (that is why his 45 cards have **five heights**) and he can because he has **one column**. In three, the variable height leaves rows uneven by up to **209px** and that reads as a mistake, not as variety. The 574 is the point where **our** vertical clip reaches the exact **228** he gives his: below that the phone shrinks for lack of height. Chosen against 418 (his proportion over our column) and 532 (his literal height); what separates them is how much of the slot the image fills. **574: vertical 100%, landscape 36%** · 532: 91/39 · 418: 68/53 |
| ↳ below 768 the content commands again | the fixed height gets released | with one column there is no neighbor to line up with, so pinning it would only add air. And with one column, that is benji's case exactly |
| **No caption** | below the card goes **only the name**: no date and no category | both references carry one (linear author and date, figma category and date) and it goes anyway: in a vault neither of the two annotates anything. The category is already said by the filter, which is where you use it, and the date tells nothing apart because **every clip comes in the day you drag it**. On their pages these are articles with an author and a publication date, and there they do say something. The date **still orders** the grid; what went away is showing it |
| **No arrow on the hover** | the surface darkens and nothing else | the arrow was linear's, measured, but **their** card needs it because nothing else changes on it when the pointer goes over: without it there would be no sign that it is clickable. Ours darkens the whole surface (josh's rule, already in the system), so the arrow was a second signal saying the same thing |
| ↳ the edge does not get copied | no ring and no shadow | josh's rule is already decided in `tokens.css`: the card is defined by contrast. The geometry gets copied, what was decided gets respected |
| ↳ an explicit width, always | the phone at **228**, the rest at 100% of the box | not one of his 45 cards lets the file decide its size. Without this a clip smaller than the box draws at its natural size: a 1×1 image gave a box **81px** tall |
| **A card is three layers** | the component · **its** background, which comes from the file · and `--surface` around it, **always present**. And the slot is **a single one for every source** | Vito, looking at the grid: *"that size of component, plus its background that comes from the video, and then our background always present"*. With two rules (web filling the card, native with air) the third layer was missing in web (RUNTIME at 1440: `Shelf to card` painted 442.64×424.94 in a card of 442.66×424.94, **air 0.01 × 0**) and the trays could not measure the same. There was back and forth: it got unified, it got reverted because nobody had asked for it and it shrank the web clips, and it came back when it was asked for |
| ↳ **the width drops to 2/3** | from **78.1818%** (430/550, benji) to **66.6667%**. The height does not get touched: **84.8485%** = 448/528, his | the 78.18% only bound when the file is wider than it is tall, and **6 of 8** clips in `nativo/` are square or nearly: they all came out at the same ceiling, **346.06**, with 48.3 of air at the side against 39.4 above. At 2/3 the ceiling is **295.11** and the side air **73.78**. There is no reference behind the number and it gets said: it is the round one that shrinks what is square and does not touch what is shaped like a phone, because that one is bound by the height (`Floating bar` 1320×2868 → 165.85, untouched). Verified at 1440, 900, 700, 500 and 390 |
| ↳ **the trays measure the same because the files are 1:1** | the rule alone is not enough: with `contain` the size is decided by the **file's ratio** | the clips with a tray that were not square got filled with **their own background** up to 1:1: `Shelf to card` 1800×1728 → 1800×1800, `Floating bar` 1320×2868 → 2868×2868. The fill is not a painted color but their own rows and columns of edge extended: painting a color landed **2 levels** off because of the RGB→YUV conversion and the seam showed. Result: **seven trays at exactly 295.11×295.11**. The price: in `Floating bar` the phone goes from 166 to 136px wide, and `Copy text` stops filling the card (295×283 with surface around it) |
| ↳ an ffmpeg trap, written down | `scale` **preserves the display aspect** and `vstack`/`hstack` inherit the SAR of the first input | stretching a 2-row strip to 36 (1800×2 → 1800×36) puts **SAR 18:1** on it, and the whole file comes out marked that way: the browser saw it as 32400×1800 and drew it 16px tall. `setsar=1` after the stacking, always |
| ↳ what it breaks, written down | the upload dialog shows **Native** and **Web** with the same classes so you can pick *which one looks better*, and now **they look the same** | `source` still decides the folder and the filter's tab; what it stopped deciding is the framing, which is what that dialog put in front of you. It is left unresolved on purpose: going back to telling the frame apart, or turning the dialog into asking about the folder in words, is a separate decision |
| ↳ the grid's order gets touched on the disk | `birthtime`, with `SetFile -d` | the grid orders by `created` and the folder is the manifest, so there is no order field to add: you change the file's date. The original ones stay written down in `.context/marco-vault/originales/fechas.txt`, with the original files next to each re-encode |
| **The active state of the filter and the tabs: contrast only, confirmed** | ink vs gray, same weight, no underline and no pill | it was tried on the real page with `prototype` against four alternatives: weight 600 (HIG sidebar), a 1px underline (Vercel/Stripe), a pill (Apple.com/Dribbble) and inverted, with eleven light-mode references captured alongside. Vito chose "as it is". What it costs is measured and accepted: in light the inactive one sits at **2.39:1** from the background (WCAG asks for 4.5:1 on text); in dark the two states sit at **2.62:1** from each other (it asks for 3:1 with no second signal). Same bet as Linear. The filter's label went from "Native" to **"App"**, the name the exhibition already uses |
| The hover | **the surface darkens and nothing else**: the image does not move, does not scale and does not darken on its own | measured on linear: across their whole card the only thing that changes is `opacity 0→1` and `translateX(−2→0)` in 100ms, an arrow. Here that arrow was taken out, see above |
| **Correction: benji's zoom does not exist** | `react-medium-image-zoom` is in his served CSS but renders **0 elements** on `/`, `/family-values`, `/liveline`, `/drawesome`, `/honkish` and `/pixelmelt` | same case as josh's `active:scale` utilities. There is no hover with a scale either: the only `scale` that touches a card is **static** (`1.06`, so the capture bleeds under the phone's bezel) |
| ↳ what he does do on every card | a speed toggle **1x / 0.5x** at the top right, 45 in family-values, 34 in honkish | 28×20, 12px/460, radius 38, `#989897`, two `<span>`s that cross by opacity, `all .2s ease`. It is direct evidence for the player |
| ↳ a note about method | a probe returned *"0 `:hover` rules on the whole page"* and it was **false**: the real number is 68 | his sheets come from another origin, `sheet.cssRules` throws and the probe was skipping them in silence. Against CSS from another origin you have to capture the **text** of the response, not read the CSSOM |
| **The canvas sidebar collapses with `⌥⌘S`** | and **there is no control in sight**: the canvas chrome does not change at all | the shortcut is Apple's, not one of ours. [Mac keyboard shortcuts](https://support.apple.com/en-us/102650): *Option-Command-S* hides or shows the sidebar in Finder, and it is the same in Mail, Notes and Xcode. It looks at `e.code === 'KeyS'` and not `e.key`, because on a Mac keyboard ⌥+S produces `ß`. It starts **visible** and it is not remembered between views ([Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars): do not hide it by default). **Verified**: open, the geometry is identical to the pixel to the one before, panel `0..240`, chevron `31..47`, name `26..201`; collapsed, the canvas goes to `0..1440` |
| ↳ who pays for the layout | a `padding-left` on `.canvas`; the panel leaves the flow and travels on `transform`, with a **CSS** transition | it is GitLab's architecture. Of four production sidebars measured under load (the naive one, Notion, Linear and this one) it is the only one that stays at 60fps with the CPU **throttled 6×**. Notion animates `transform` and Linear animates `left` and **they drop frames alike**: both use `requestAnimationFrame`. What decides is the **driver**, not the property. And collapsing a panel happens exactly when the main thread is busy |
| ↳ and the frames rearrange on the way **back** | it listens for the `transitionend` of `padding-left`, not for the change of state | opening it eats 240px of the canvas, and a frame left in that band ends up outside. When you press the key the canvas **still measures what it did before**, so measuring there sees nothing. It filters by property **and by target** because `transitionend` bubbles: verified, the canvas also gets the `color` of an `input` and the `transform` of the `aside` |

### The player

It exists for one thing: to reach the exact frame where a gesture
starts, count to where it ends, and get the duration in milliseconds.
What was measured is in `.context/recon/vault/REPRODUCTOR.md`.

| Decision | Value | Source |
| --- | --- | --- |
| Play button | **38×38**, a **20×20** glyph, `opacity 100ms linear` + `transform .2s ease`, disabled at **.32** | **apple**, from their `inline-media-ui`. It renders on **28 videos** of `/apple-vision-pro`, it is not a dead rule. The icon's color carries **no** transition in their player (it changes at once) and it carries none here either |
| ↳ the icons are ours | two trivial shapes with `currentColor` | what gets copied from them is the **measurements**, not the art. `currentColor` does the same as their `mask` + `background-color` (the icon's color is a CSS property) with one piece less |
| Speed | **28×20**, 12px/460, radius 38, `all .2s ease`. **Two states (1x · 0.5x), not a menu** | **benji**, and it renders on **45** elements of family-values and 34 of honkish |
| ↳ the cross-fade | two overlaid `<span>`s with `inset:0` that cross by opacity | his, and it is not decoration: *"1x"* and *"0.5x"* do not measure the same, so without this the button changes width and everything next to it jumps |
| **Where the controls go** | a **row below the video** | chosen by looking, and **it belongs to neither of the two**: apple anchors bottom right *on top of* the video, benji top right, and the two of them measured cannot both be right. Below, nothing covers the clip, and sitting on the canvas it needs no scrim and no blur: it uses the system colors as they are. The "corners" variant was tried with apple's exact scrim and it lost |
| **The track** | a **2px** rail, no knob | **no measurable reference**, and it gets said that way: Safari has the shadow root **closed** in both engines, `apple-events` does not mount its controls headless, and Podcasts and x.com ask for a login. It is ours. Thin, medium and hidden were tried and thin won: at that thickness it stops being a control that competes and becomes a reading. It uses `--hairline` and `--ink`, with no new color |
| **No frame buttons** | the step lives **only in the keyboard arrows** | they were there, two 24px arrows next to the play button, and they were taken out. The keyboard is more precise and you can hold it down. Aiming at a small button while you are looking at something else is the work this player has to save you |
| ↳ the modifiers | on its own **1 frame** · **option 10** · **command to the edges** (start / end). `shift` still does the same as `option` | they are the three distances you actually ask for: the exact frame, crossing a whole gesture, and going back to the start to count it again. **Verified on `Reminders App.mov` (256 frames)**: 0→1→2, option 2→12→22→12, command→255, command→0, and it clamps at both ends without overshooting |
| ↳ and command+arrow carries a real `preventDefault` | without it, the browser's back/forward | it is the native history shortcut: without cutting it, "go to the end of the clip" takes you off the page. **Verified: the URL does not change in either direction** |
| ↳ and that uncovered a real bug | the listener listens on the **document**, not on the player's focus | it was tied to the focus and it failed in the most common case: you click the video to pause it, the click lands on the `<video>` and the frame never takes focus, so from there the arrows do nothing. **Verified: after clicking to pause, `activeElement` is `BODY`.** Now it only exists while a clip is open |
| ↳ but the focus **does** matter for the arrows | in a **text field** the player does not touch them; in a **button** it does | the details next to it have a title, a source and notes, and there `option+arrow` is jump by word and `command+arrow` is go to the edge of the line: stealing them breaks what on a mac you do without thinking. Buttons do not use arrows, so after pressing play you keep going frame by frame. **Verified with the caret inside the title: the arrow moves the cursor and the frame does not move.** The space bar does get skipped in any control, buttons included, because there the browser already activates it |
| The frame step | from the **container**, not estimated | `scripts/frames.mjs` reads `mdhd` (timescale) and `stts` (deltas) from the mp4/mov. No `ffprobe` and no dependencies. **Validated 9/9**: frames × frame-duration reproduces the duration the browser reports |
| ↳ it seeks the **middle** of the frame | `(target + 0.5) · frame` | asking for exactly `N·frame` falls on the boundary between two frames and the browser can resolve to either of them |
| ↳ variable rate | it returns the most frequent delta **with `variable: true`** | so whoever uses it knows the step is approximate, instead of believing it is exact |
| The time gets read per screen frame | `requestAnimationFrame`, not `timeupdate` | `timeupdate` fires about **4 times a second**: with that the track advances in jumps and the frame number lies almost always |
| What could not be measured | Safari's native controls · the full apple-events player · Apple Podcasts · x.com | shadow root closed in both engines · `.controls-container` renders 0×0 headless · the last two ask for a login |

## Error 404

| Decision | Value | Source |
| --- | --- | --- |
| Composition | A single ring with `ERROR 404 · PAGE NOT FOUND` repeated; no controls and no extra visible text | a simplification Vito chose after the sound workshop |
| Physics | A rigid circular body, with gravity, spin, drag and throw. Restitution of **0.90** on the sides and the ceiling and **0.86** on the floor | it recovers the dry response from before, with no deformation when you press the edge |
| Sound | One single soft voice, fired only when the complete ring bounces | the Letter, Word and Double variants were removed, and so was every sound triggered by pressing |
| Gestures dropped | No deformation, no press, no explosion, no particles and no reassembly | the scene has to read as one single rigid object |
| Reduced motion | The ring stays still; the drag is still direct and generates no inertia | the movement that runs on its own is decorative |

## Pending (marked as such in `src/tokens.css`)

- **The `--space-*` scale does not cover what the page uses.** It goes
  4·8·12·16·20·24·32·40·48·64, but 56, 60 and 80 are in use and not in
  it; today they live as semantic tokens (`--gap-masthead`, `--index-top`).
  Nobody has decided yet whether the scale grows at the top or those
  values stay semantic. `--space-2`, `--space-6` and `--space-10` are
  spare too and they break the rule of multiples of 4; the first two are unused
- Radii, elevation, z-index: they get defined from the first piece built
- **`Swipeable tabs` is published with no video.** The final clip is
  being made in another session; when it exists it comes in with
  `pnpm piece:video swipeable-tabs <file>`. Still to decide WHAT goes in
  the slot: the raw recording (the phone's silhouette, which is what the
  slot reserves) or the mockup for X (square, with a bezel and a
  background: in the slot you would see a small phone inside a square)
- **`pnpm record` writes to the vault by design**, but the first piece
  was pulled out of the vault on request: the vault is what is external.
  If that rule generalizes, `record` should write to `.context/mockup/master/`
  and the mockup read from there (today it is passed with `--clip=`)
- The first piece to build inside the stage
- Footer / signature: the name "Vito Compagnucci" is not anywhere yet
- **`Reminders App`** is the only clip that says WHERE instead of WHAT, and
  repeats its `Source` (`Apple Reminders App`) word for word. It fits in 15,
  so it is not urgent; what is missing is knowing which gesture it shows so
  it can be named.
- **The playground's canvas did not enter the bar's model.** It has a `←`
  and a name in its sidebar, which is leading + title wearing other clothes.
  It stays as a documented exception until it gets decided whether it joins.
- **The SwiftUI native workshop.** The Expo one already exists (`native/`,
  see its `AGENTS.md`); the Xcode project is waiting for the first piece
  that asks for it. A View per piece + `#Preview`, iOS 17 springs, Inject
  for hot reload.
- **The `expo-modules-jsi` patch is temporary.** It exists because this
  machine has Xcode 26.2 and SDK 57 asks for 26.4+. When Xcode updates:
  delete `native/patches/`, take `patchedDependencies` out of
  `native/pnpm-workspace.yaml`, rebuild.
- **The MCPs that give the agent eyes are not connected.** They are
  surveyed in the recon (`expo-mcp` on the RN side, XcodeBuildMCP on the
  Xcode side, and Xcode 26.3+ exposes a native MCP; this machine has
  26.2). Meanwhile the agent writes files and you watch the simulator,
  which is the mode that already works.
- **Record to verify, not only to publish.** `pnpm record` makes the final
  clip (bar at 9:41, h264, straight to the vault). The other one is
  missing: a short recording during the iteration, so the agent sees what
  it did. It is the only thing `react-native-motion` has and we do not (see
  [What we brought back from reading another repo](#what-we-brought-back-from-reading-another-repo)).
  It goes together with the point above: with no eyes, recording is of no
  use to anyone but you.
- **`expo-haptics` is one version behind** (57.0.1 against 57.0.2), and
  not by accident: 57.0.2 came out on 2026-08-26 and the 24h cooldown
  blocked it. `npx expo install --fix` bumps it once the window passes.
- **The canvas's selection inspector, when there is something to put in
  it.** Today the only action of a chosen frame (`Add to Exhibition`)
  lives in the sidebar, below the index. The day more of them pile up
  (duplicate, measurements, order) that block is the one that moves to a
  right-hand panel Figma-style, decided with `/prototype`. Opening the
  surface now would be chrome for one single word.
- **The bar is still three mechanisms for four screens**: the anonymous
  portal of `.actions`, the detail's row and the canvas's sidebar. It is
  still to be decided whether it becomes a component with zones
  (`leading` / `trailing`).
- **There is no undo inside the app, and that is the most concrete hole left.**
  Since 2026-08-25 `Move to Trash` does not ask, following
  [Alerts › Best practices](https://developer.apple.com/design/human-interface-guidelines/alerts#Best-practices):
  you do not alert for a destructive action that is common and
  **reversible**. But Apple's literal test is *"can they undo it?"*, and today
  you undo it in the **Finder**, not here. The complete pattern is to delete
  without asking **and** offer the undo on the spot.

  **The medium decided on is [Sonner](https://sonner.emilkowal.ski/)**, by Emil
  Kowalski, who is also one of this system's measured references. It is also
  what `/pick-ui-library` picks for toasts instead of writing one by hand, and
  the repo already has the `ask-sonner` skill for the wiring.

  **What it opens up, said before opening it:** it would be the project's
  **first UI dependency**. Today there is none, everything is built from
  measured references. And it would bring in a surface the system declares it
  does not have: `playground.module.css` says "zero reds in the whole product"
  and there is no toast and no status bar anywhere. So there are two things to
  decide, not one: whether the library comes in, and what place a toast takes
  in a chrome that until today is only words over the canvas.

  Postponed on purpose. When it exists, `sendToTrash` in `vault.tsx` is its
  first client and `TrashNotice` probably goes with it.

- **The back arrow is already the standard chevron** (settled on 2026-08-25).
  What stays written down is what changing it uncovered: the `←` that was
  there **did not come from the recon**. The README attributed it to benji
  and josh, and the two of them use words (`Index`, `Home`). It was a
  decision of ours with no receipt, and a borrowed citation on top. It is
  worth keeping as a reminder that an attribution gets verified too.

## The top air is 80, on every screen

**One single distance, not one per view.** It is benji's rule and it got
measured live again for this, at 1728×900: his `.styles_container__YJPlC`
carries `padding: 80px 16px 40px` and it is **the same container on all of his
pages**, verified on his home and on `/liveline`, `/drawesome` and `/honkish`.
The first thing there is falls at **top 80** in all four: on the home his
`<h1>`, on a detail his `Index` link. He does not have one air for the list
and another for the detail.

On our side three out of four already met it:

| screen | first element | top |
|---|---|---:|
| Interface exhibition | `<h1>` Interface exhibition | 80 |
| A piece's detail | the arrow | 80 |
| Vault, the grid | the `Vault` tab | 80 |
| **Vault, a clip open** | the arrow | ~~120~~ → **80** |

The clip's detail carried a `margin-top: 40` to separate itself from the tab
bar, but **in the detail the bar is not rendered** (`noTabs`, in
`private.tsx`), so it was separating from nothing. It was withdrawn.

**The clip did not change size**, and that was deliberate. Freeing the 40 at
the top left the clip keeping them: measured, 536×536 → 576×576. They were
given back at the bottom (`.stage` went from `padding-bottom: 56` to `96`)
because that value **is not a bottom margin but the control of the clip's
size**: its job is to hold the size that was chosen by looking. The page's
total air did not move a pixel; it only changed ends.

## The detail's header

`← · Photo picker ⌄ ·········· ↗ · ▮▯`

**The title IS the document menu.** Tapping the name (or its chevron, which
are one single button) opens `Rename` and `Move to Trash`. It is the *document
menu* that [Toolbars › Item groupings](https://developer.apple.com/design/human-interface-guidelines/toolbars#Item-groupings)
describes for the leading edge: commands that affect the whole document. Our
actions all fall there; not one of them is a leftover from the bar, which is
what the *More* menu on the other edge exists for.

**Renaming in place was withdrawn.** The title got edited when you tapped it
and it was less ceremony than a dialog. What brings it down is not the
ceremony: it is that that click was not enough for everything you had to be
able to do, so renaming, the trash and the playground lived only in the right
click, which is to say invisible. A title that gets edited when you tap it
keeps the gesture for itself.

**Only one action rises to an icon: the playground.** It is the only one that
is not about the file's identity or its existence, and the only one with no
consequence, since sending it a thousand times breaks nothing. A permanent
icon is for what you press without thinking. That is why it is **not in the
menu**: repeating it ten pixels away would be offering the same thing twice.
In the grid it is in the right click, because there is no bar there.

**The inspector's toggle goes last, against the rail.** The same page anchors
the sidebar one to the *far leading edge*; this one is its mirror. And it is
the one you press over and over, so it is the one that cannot move from its
place. The gap between the two icons is **8**, the one for system controls
(this row, the player's `--player-gap`, the `--index-item-gap`). There was a
version with 16 and it was misread: 16 is the gap between **words** of the
chrome, not between controls.

**The name never gets truncated.** Here the title IS the name of the file on
your disk, and a half name is no use for the only thing you do with it. If it
does not fit, it pushes, and there the convention of 15 characters stops being
a note and becomes visible.

These were dropped: **Exposed** (each action a glyph; the playground one
cannot be read without a tooltip and the trash sits a permanent click away),
**Panel** (the actions inside the inspector, which starts closed), **Edge**
(the `···` menu on the trailing edge; it was implemented and reverted: its
menu falls on top of the inspector when it is open), **Popover** (the title
opens a surface with the name field inside) and **Clean** (the detail cannot
delete).

### Audit against the HIG

**No icons on the items, and it is not an omission.**
[Menus › Icons](https://developer.apple.com/design/human-interface-guidelines/menus#Icons)
asks to use them sparingly and closes the door on the mixed case: the items of
one group carry an icon **all of them or none**. Today none. Giving one only
to `Move to Trash` (which is what the Carousels log does, with `#e5352b`)
would force giving one to `Rename…` too, and to the grid's menu and the
playground's. It is a whole decision about language, not a detail of one row.

**Title case** in every label: `Open in Playground`, `Rename View`,
`Delete View`. The same section asks for it.

**Deleting does not ask.**
[Alerts › Best practices](https://developer.apple.com/design/human-interface-guidelines/alerts#Best-practices)
says to avoid the alert for destructive actions that are **common and
reversible**, and its example is deleting a file. The whole trash dialog was
withdrawn. Verified end to end with a test file: the clip leaves the vault and
turns up in the macOS trash, which means the premise really holds and not by
assumption. What is left is `TrashNotice`, which is **not** the same dialog
with other words: it has one single button, there is nothing to decide, and it
exists because the same page says an alert is good for telling you about a
problem. Without it, a server failure would be silent.

**The warning did not disappear, it changed moment:** before it arrived after
the click; now it arrives before, with the item in red.

**The back arrow is a chevron**, the standard symbol
[Toolbars › Navigation](https://developer.apple.com/design/human-interface-guidelines/toolbars#Navigation)
asks for. It was `←`, and the README went as far as attributing it to the
recon of benji and josh, but the two use **words** (`Index`, `Home`), so
neither of them backed it. It was ours and with no receipt. It goes drawn and
not written, for the same reason as the `+` of the grid: a glyph sits on the
baseline and never ends up centered.

**The only thing that departs on purpose:** `Rename` carries no ellipsis.
*Menus › Labels* asks for it when the action needs more information before it
completes, and this one opens a dialog that asks for the name. Withdrawn by
the owner's decision (2026-08-25): the menu has two items and both are
obvious, so the sign adds noise without settling any doubt.

**What we are missing for the complete pattern:** Apple's test is *"can they
undo it?"*, and here you undo it in the **Finder**, not in the app. The
complete version would be to delete without asking **and** offer an undo
inside, which today has nowhere to live, because this system has no toast and
no status bar. When that surface exists, this is its first client.

**One detail that does match Apple's literal example:** the red goes on the
**menu item** and not on the dialog's button. Alerts says that when the person
already chose the destructive action deliberately (their example is
`Empty Trash`) the button that confirms it does **not** carry the destructive
style. Ours goes in `--ink`.

## The destructive red

`Move to Trash` gets painted in `--destructive`, with a hairline in front.
**The opposite decision was written here** in `actions.module.css`: *"there is
not one state color, and putting in the first would be inventing a whole
level"*. The premise was false: the level had been decided before this repo,
in the Carousels log (`docs/design-research/design-decisions.md`, line 374),
and its case is literally this one. The family is Apple `#ff3b30`, chosen
there against benji's `#ff0052`.

Measured over **our** backgrounds, which is what had to be checked:

| | value | over `--canvas` | WCAG |
|---|---|---:|---:|
| light | `#c81e14` | Lc 75.5 | 5.65 |
| dark | `#ff6b60` | Lc −48.8 | 7.14 |

The light one transfers dead on and not by luck: Carousels' canvas is this
same `#fdfdfc`, both of them came out of agentation. And 75.5 falls right on
APCA's **preferred** threshold for text that is not body.

**Where the rule bends.** This system's dark mode demands that text keep its
contrast, and this one does not. What it would take was calculated: keeping
hue and chroma, the red that gives Lc −75.5 over `#090908` is `#ffbcb1`,
chroma 0.204 → 0.080, a pale pink. There the token stops doing its one job.
**The word already reads**, in ink, at Lc 104; the red does not carry the
reading, it carries the warning. It is the first text token that does not meet
the rule and it goes said, not hidden.

## Sketches: writing a component from scratch on the canvas

The playground had the references and had nowhere to build: its frames could
only point at a clip in the vault. Since 2026-08-26 there is a third kind of
frame, `sketch`, and it is **a real file** in `src/private/sketches/` that
exports a default component.

| Decision | Value | Source |
| --- | --- | --- |
| What a sketch is | A `.tsx` in `src/private/sketches/`, resolved with `import.meta.glob`. `New sketch` creates the file and puts it on the canvas | the frame was already keeping a **reference** and not a copy for the clips; a sketch uses exactly the same deal, with the `ref` pointing at the file's name |
| **There is no editor in the browser** | you write in your editor and Vite reloads the frame | Monaco or CodeMirror plus a transformer on the client would be a big dependency to give you an editor **worse** than the one you already have open next to it. And above all: **an agent writes files, it does not type into a textarea**. If the sketch is a file, the two ways of working (you in the editor, an agent in the terminal) are the SAME one and neither needs an interface |
| ↳ verified live | editing the file changes the frame **without reloading the page** | measured: `performance.getEntriesByType('navigation')[0].type` is still `navigate` after three edits, and the frame's content changed all three times |
| **A broken sketch does not take the board down** | each one inside an error boundary; only its own frame goes dark, with the name and the word `Error` | writing freely means that half the time the file is half done. Without this a `null.map()` unmounts the whole canvas and you lose the other frames, the selection and the gesture you were half through. **Verified**: with the sketch broken the board stayed mounted and the frame said `Error` |
| ↳ and it recovers on its own | the boundary clears on the next hot update, which is when you fixed the file | otherwise the frame would stay red forever and you would have to reload, which is to say lose exactly what this component came to save. It clears **only if there is an error**: overwriting the state on every save would remount every sketch on the board every time you touch any file |
| **The pointer gets split by selection** | without choosing the frame it drags; chosen, the sketch receives the clicks | you have to be able to press the buttons of what you are building, but the frame's gesture calls `preventDefault` and takes the pointer: if it started there, the click would never reach inside. It is what board editors do. **Verified**: chosen, three clicks gave three increments; deselected, `pointer-events` computes to `none` |
| ↳ the price, said out loud | a chosen sketch does not move by dragging it from the middle: Escape and it goes back to being a frame | it stays written down as a candidate to look at with `/prototype` if it gets annoying |
| The dialog is now called `Add` | and `New sketch` is the first option in the grid, with the same box as the rest | it was `Add clip`, and since sketches get added too it was naming one of the two things inside. The new option is one more card and not a separate button, so there is no second geometry to decide |
| ↳ it does not ask for the name | it is born `sketch`, `sketch-2`… and it gets renamed by renaming the file | it is the rule `New view` already uses: a modal before you see anything forces you to christen something that does not exist yet |
| The endpoint writes **inside the repo** | `POST /vault-media/__sketch`, the bridge's only exception | a sketch is code: it has to be where Vite compiles it and where your editor and an agent can open it. The folder is fixed and comes out of `import.meta.url`, and of the name only letters, numbers and hyphens survive. With that alphabet there is no `..` to build. **Verified**: `?name=../../etc/passwd` wrote `etc-passwd.tsx` inside the folder, and nothing outside |
| ↳ it overwrites nothing | it writes with `wx`, and if it exists it returns 409 | the check and the write are the same operation, so there is no window between "it is not there" and "I write it". **Verified**: the second POST with the same name gives 409 |
| **And it still does not reach production** | `dist/` does not mention `sketch` even once | the edge is the folder: all of this hangs off `src/private/` and inherits the gate. Verified after `pnpm build` |

**The playground is web only, and it is a decision.** An App piece does not
get built here: you write it with the agent next to you while you watch it
run on the **iOS simulator**, and it enters the exhibition as a **screen
recording**, which is what `platform` already said about how a piece gets
demonstrated, now also about where it gets built. Putting the phone inside
the canvas was considered and dropped: `react-native-web` would draw the
shape and would lie about exactly what this vault studies, the gesture and
the haptics (the same argument that moved Expo to video), and a streamed
simulator (`simctl io booted screenshot` plus `idb ui tap`) gives the image
but not the *feel*, which is the only thing you cannot judge any other way.

## Publishing: from the playground to the exhibition

The trip closes as of 2026-08-26, and it closes **on the board**:
`Add to Exhibition` is the right click on a frame of the playground. A
sketch comes out as a **live Web** piece; a recording, as an **App**
piece in video.

**It spent a day in the vault and it moved**, and the correction is about
the model, not about the place: the vault is what is EXTERNAL, the wall of
references you look at, and what gets published is YOURS, which lives in
the playground. The whole flow ended up: vault (external) → playground
(you iterate on your piece, with the references next to it) → exhibition.
Publishing is the end of the workshop, so the gesture lives where the work is.

| Decision | Value | Source |
| --- | --- | --- |
| **The action is visible, not just a right click** | you choose the frame and `Add to Exhibition` shows up in the sidebar, below the index, at **16** (the group air, measured) so it does not read as one more line: the lines are nouns and this is a verb | the lesson already learned in the vault: *a context menu announces nothing*. The reference pattern is Figma's right-hand panel, the actions of what is chosen, but ONE action does not pay for a new surface: the zone is born inside the sidebar that already exists. The right click stays as a shortcut |
| **The frame says the platform**, with no selector | a `sketch` frame publishes Web; a `clip` frame publishes App | it is the rule that already existed (*App gets demonstrated in video, Web goes live*) read backwards. A selector would offer combinations the system already declared invalid |
| The form is the mold of the piece | two fields: name and one line of description, exactly the two lines of the public detail. The name arrives filled in; the description starts empty because it is the one thing the file does not know about itself | the vault's folder-is-the-manifest, applied to publishing: nothing gets asked for that is already known |
| **How a Web piece lives** | its folder at `src/components/pieces/<slug>/` (since 2026-09-10; before that one file, `src/piezas/<slug>.tsx`), resolved **by slug** in `demos.tsx`, a lazy glob, a cache by ref, the same trio as the sketches | the slug is the map, so there is no registry to maintain by hand, the folder-manifest decision now on the public side. In the build each piece comes out as its own chunk (**verified**: `press-counter-….js`, 0.44 kB) |
| ↳ publishing is a COPY, not a move | the sketch stays on the board; the piece gets edited in its published file | moving the file would break the frames that reference it. The cost, two files that can diverge, gets said: from the moment you publish, the canonical one is `src/piezas/` |
| ↳ and it really crosses the boundary | from `src/private/sketches/` to `src/components/pieces/` | `src/private/` does not reach the build, so a published piece needs its file on the public side. For the same reason, a piece cannot import anything from `src/private/`. It was true for the sketch (it is born self-contained) and it has to stay true |
| Both writes or neither | the demo's file gets copied and the entry goes into `pieces.ts`; if the second one fails, the first is undone | the vault and `src/private/` live outside the deploy; without the copy the piece would point at something production does not have |
| Nothing ever gets overwritten | a repeated name or file → **409**, not a replacement | the same rule as uploading a clip and creating a sketch: `COPYFILE_EXCL`, check and copy in one single operation. **Verified**: the same slug with a different name returns 409 |
| The confirmation is the page | when you publish you navigate to `/<slug>` and you see the demo running | this system has no toast (Sonner's undo is still postponed); the real exhibition is a better confirmation than any sign. A hard navigation on purpose: `pieces.ts` has just changed on disk and reloading guarantees that every module sees it |
| The Web demo runs live in BOTH views | list and detail, the same component, centered in the box with the inherited floor (`min-height: inherit`) | the decision was already taken: *"with a live preview in the list, the detail does not contribute the piece, it contributes what surrounds it"*. **Verified**: the test button counted 3 clicks on `/press-counter` |
| The recording takes the phone slot | the `::before` that reserved the silhouette goes off (`:has`) and the video uses the same width through the same token, 228 in the list, 319 in the detail | the slot existed for this: it was the reservation for a content that has now arrived. **Verified**: 228 and 319 measured |
| ↳ autoplays, muted, on loop | `autoplay muted loop playsinline` | the movement IS the content, and it is what benji's demos do in family-values, 45 videos turning at once. The playground's opposite rule (it starts still) belongs to a study board; an exhibition exists to show itself on its own |
| **The slug ended up being ONE** | it lives in `pieces.ts` and the page, `routes.mjs` and the bridge share it | there were two accounts that agreed by chance, spaces→hyphen in `parts.tsx` and everything-non-alphanumeric→hyphen in `routes.mjs`, and with the first name carrying a punctuation mark they would diverge. Publishing names the demo's file with the slug, so a third copy was unacceptable |
| ↳ and `routes.mjs` dropped the regex | it really imports `PIECES` and `slug` from `pieces.ts` | Node ≥24 (which `engines` already required) runs TypeScript with no executable types. The "empty on purpose" guard died with the regex it was protecting: if `pieces.ts` does not compile, the build stops there, the same stop with no heuristic |
| Verified end to end, twice | **Web**: New sketch → write the file → right click → `/press-counter` with the button counting clicks. **App**: the clip branch publishes, the video plays in its slot, `vercel.json` regenerated | done with test material and **reverted**: the inventory only carries pieces that were really built |

## How a clip is named

**Under 15 characters.** It is the ceiling in Apple's HIG at
[Toolbars › Titles](https://developer.apple.com/design/human-interface-guidelines/toolbars#Titles),
and the reason it gives itself is functional: so there is room left for the
bar's other controls. Since the detail's header is ONE row (arrow · title ·
inspector) that room is literal.

**The title says WHAT the gesture is. `Source` says WHERE it came from.** The
two fields exist and they do different things, and taking that repetition out
is what makes 15 characters enough: you do not have to compress anything, you
have to stop saying the same thing twice.

The model already existed in the vault: **`Swipe to pay`** is 12 characters,
it does not name the app, and it says exactly what you are going to see. The
rest were written against that one.

**Applied on 2026-08-24.** Five of seven clips went over; in three of them the
only thing to spare was the name of the app, which their own `Source` already
said:

| before | | after | |
|---|---:|---|---:|
| Bottom accessory like Apple Music mini player | 45 | Mini player | 11 |
| Copy text animation from Apple Passwords | 40 | Copy text | 9 |
| ~~Berry~~ Floating Bar ~~Bug~~ | 22 | Floating bar | 12 |
| ~~ChatGPT~~ photo selector | 22 | Photo picker | 12 |
| ~~X App's~~ Swipeable Tabs | 22 | Swipeable tabs | 14 |

Median 22 → **12**. The details travel with the file in the same step that
renames it, so not one of them was left orphaned.

It is not enforced by code, on purpose: the name is the name of the file on
your disk, and an app that stops you from calling your files what you want
has the dependency backwards.

## Hold to commit: Opal's button, an App piece

**On 2026-09-02** the first piece built against a vault clip landed in
the native workshop: `native/src/components/pieces/hold-to-commit/` (the
screen and the mechanism; since 2026-09-10 the route is one for all of
them). The reference is `VAULT_DIR/nativo/Hold to commit.mp4`, the
**Opal** button (Screen Time Control, Apple Design Award 2025), posted by
@60fpsdesign on X and cataloged on
[60fps.design](https://60fps.design/shots/opal-hold-to-commit-button-interaction)
as "Opal Hold to Commit Button Interaction"; 60 fps, a crop out of a
2160×2160. It was measured whole, frame by frame, reading raw pixels
(ffmpeg → rgb24 → Python), with the scale fixed by the screen of the
phone in the clip: 1192 px = 440 pt (iPhone 17 Pro Max) → 2.709 px/pt.
Every value carries its receipt above it in
`components/pieces/hold-to-commit/measurements.ts`; the spreadsheets and
the scripts live in `.context/hold-to-commit/`, which does not travel.
What the clip does not show (the head of the screen, the haptics, the
reset) is marked ASSUMED.

| Decision | Value | Source |
| --- | --- | --- |
| **No Skia and no new native modules** | Views, Reanimated, Gesture Handler, expo-symbols, expo-haptics, and **four PNGs** for the sheen | the piece has to open on the phone with Expo Go, where Skia is not, and the haptics can only be felt there. A gradient with a soft edge does not exist in RN without a native module: it gets generated as a texture (`media/generate.swift`, with the measured profiles) and translated, which is the cheapest thing for the compositor |
| **One single clock for the gesture and the fill** | `LongPress.minDuration` and the progress's linear `withTiming` both read `HOLD.duration` = 2000 | RUNTIME: the clip's front advances linearly at 7.75 px/frame, and from the press to the burst there are 121 frames. Rule 3 of the workshop's AGENTS |
| The fill | a white body with a pale green rim + a front in a capsule with an **erfc falloff of σ = 19 pt centered on the geometric edge** + a left tip 6 pt inside with σ 20 | RUNTIME f151: 10 %→90 % over 51 pt; f122, a row 10 pt from the edge: the 50 % falls 9 pt behind the one at half height (a round tip). **Verified on screen**: the profile within ±6 of luminance at every 5 % of the width |
| ↳ the tip cannot be done with a neutral veil | the veil is inverted per channel against the target color (pale green × coverage + pill) | a gray darkener over white does not lower R without lowering G; the clip gives (150,172,156) at 18 pt. Verified exactly on screen |
| The pill shrinks on press | scale **0.953**, 250 ms quadratic ease-out; it comes back in 250 on release and in 120 on complete | RUNTIME: edges 157→182 and 1194→1169; 16/52/80/96 % at 1/4/8/13 frames. With the skill's strong bezier it closed twice as fast (workshop recording) |
| The label | three texts, each with its own **presence** (0..1); a `.blurReplace` crossfade made of **two blurred copies per text** (σ 2.5 and σ 1.0, rasterized in Swift with the same SF Pro, tinted with `tintColor`) plus the sharp one, handed out by a staircase that is a **partition of the opacity**; the color travels with the progress (white → greenish gray at 55 % → black at 96.5 %) | `filter: blur` exists in RN 0.86 but behind the native flag `enableSwiftUIBasedFilters`, off and with no way to turn it on from Expo; Skia is not in the binary. Enlarged strips: the two texts blur and cross centered, with no scale. **The crossfade is not symmetric**: the one leaving goes in 4 frames (67 ms) and the one entering shows up blurred at 33, legible at 67, at 90 % by 133 and finishes coming into focus at ~380. The timings (`CROSSFADE`): press 360 ease-out / 48; release 600 linear from 150 / 250 from 80; commit 450 linear from 210 / 280 from 40. Verified with probes in ms against the clip frame from the same instant (`cmp/press-*.png`, `commit-*.png`, `suelta*.png`) |
| ↳ why a partition and not stacked layers | wide + narrow + sharp = o(q) | with two blurred copies lit at once the text came out fatter and brighter than the sharp one; a real blur conserves the mass. Capture `crossfade=0.35` against f63: fattened where the clip loses ink |
| ↳ "✓ Committed" comes in growing | scale 0.9 → 1 following its presence with ease-out | ASSUMED, requested on 2026-09-03 ("smaller, from the back, and have it grow"): SwiftUI's `.blurReplace(.downUp)`. The clip does not scale; `COMMIT.enterScale = 1` gives back the faithful one |
| ↳ everything is semibold 17 | "Hold to Commit", "Keep Holding...", "Committed" | ink widths against the same SF on macOS: 121.1 / 118.9 / 86.7 pt land on semibold (medium and bold sit 2 to 4 % away). "Committed" *looked* bold because "Keep Holding..." is shrunk by the press |
| The burst | 46 pre-mounted dots, one shared value, a deterministic table; they are born on the capsule's normal (tips included) at 2.2 pt; travel 2 to 17 pt (uniform^1.5, median 7.3) + **expansion from the center** (dx = 0.075 × distance to the center, ±4 of noise), ease-out 350 to 550 ms; their own brightness .75 to 1 with τ = 330 ms and a soft close from 40 % of a life of 700 ms; 1.5 to 4 pt (uniform^1.4) | RUNTIME (`rastro.py`, 58 tracks linked frame by frame): d0 2.0 to 2.6 pt; final Δdist p10 1.5 to 2.3, median 7.6 to 8.7, p90 14 to 17; **final dx ∝ (x₀ − center)**: −18.7 at the left tip, +14.3 at the right one, ~0 in the middle. The cloud opens, it does not shake, and that is what is "clean" about the reference (before there was ±3 at random). There are tracks born at x = −0.9 and 383.7: the arcs of the tips emit too. The short life is ASSUMED: "have them disappear a touch earlier" than the Committed (in the clip they live 1.2 s) |
| The sparks | 12 images with 3 lives each (36 per hold), a function of the progress: they are born 8 to 100 pt ahead of the front (uniform^2.5, median 24), travel to the right at 50 to 75 % of the front's speed, live 250 to 450 ms, drift 0 to −25 pt/s in y; a white gaussian of σ 1.4 pt scaled to .5 to .7, alpha .2 to .38 | RUNTIME (`chispas.py`, `chispas2.py`: 24 tracks of ≥3 frames in f64 to f182): 3 alive at a time (max 7), +18..+59 of luminance over backgrounds of 60 to 110, 1.65 to 2.5 pt/frame against the front's 3.18, median life 12 frames. The front catches them and absorbs them (white at 30 % over white). They go inside the clip path, above the fill and below the white veil |
| The SF Symbols | box = the glyph's natural box at the size you want, `scaleAspectFit`, `scale: 'large'` | SOURCE `expo-symbols/ios/SymbolView.swift:127`: the `size` is not the pointSize. It is always 14 pt and the contentMode scales it to the box. With `resizeMode: 'center'` everything came out at 80 % |
| The cards | 400 pt, margins 20, padding 21 / 23, **continuous corners of 33** | RUNTIME: the profile of the clip's corner departs from a circle at the tail; a continuous 26 gave half the inset at every depth |
| The resting sheen | two vertical gaussians (σ 13 and 28) stuck to the bottom edge, horizontal envelope = the measured table, teal up to the center and a short turn to yellow-green | three symmetric models failed at the shoulders; the clip's table is the asset |
| Reset at 5 s | it goes back to rest with the same crossfade | ASSUMED, requested on 2026-09-02 so it could be tried over and over |
| The haptics | `selectionAsync` on twelve detents that speed up (300→60 ms) and Success on complete; press and release do not vibrate. **Changed on 2026-09-04** to animate-expo's table: it used to be Light on press, twelve impacts from Soft to Medium, and Soft on release | NO RECEIPT: the clip is video. It is the only knob you tune with the phone in your hand, and it sits in `haptics.ts` on its own |

**Two simulators for two worktrees.** The dev client is nailed to
`localhost:8081`, and the other worktree had the simulator with Expo Go
on 8082. Instead of fighting over the screen, a second iPhone 17 Pro Max
went up ("Pro Max B"), copying the installed `Workshop.app` with
`simctl get_app_container` + `simctl install`: each Metro feeds its own
simulator and nobody steals focus from anybody. It gets shut down when
you finish, because `pnpm record` talks to "booted" and with two of them
on it picks whichever.

**The probe is measured in milliseconds, not in fractions.**
`crossfade=q` parked both labels with the same parameter, and in the real
animation the one leaving is already gone (48 ms) when the one entering
is halfway through (360): the capture showed overlaps that never happen.
`crossfade=25`, `crossfade-commit=308` and `crossfade-release=217` put
every shared value where the animation would have it at that instant,
with the same curves and delays, and they get compared against the clip
frame from the same instant. And the capture waits for the screen to
change and then hold still (`sondas.sh`): with a fixed `sleep 4`, the
first probe after a reload came out stale.

**The montages get looked at in full resolution.** A 16-row montage
shows up shrunk to half and a blur of σ 1 disappears: I read "sharp"
where there was blur and corrected something that was not wrong. Eight
rows per image, at 2×, and only then do you decide.

**The background is a variant, not a value.** Vito asked (2026-09-03)
to take Opal's screen out from behind the button and leave something
plain and neutral, without deciding which. Instead of choosing for him,
`background.ts` holds four directions: `plain` (only the button, at the
foot), `centered` (only the button, in the middle), `blocks` (the
silhouette of Opal's screen in mute blocks) and `opal` (the measured
copy). With `'choose'` the piece shows a selector at the top to move
from one to another live, on the phone too. The button does not know
which one is in. When there is a winner it gets written into
`BACKGROUND`, the selector goes away and the losers get deleted, except
`opal`, which stays recoverable.

**`blocks` won, and it got redone** (2026-09-03, "much better and
tidier, and don't let them overlap the button"). The first version was
four loose rectangles that ended up stuck to the pill. The second is
Opal's screen as a skeleton: the same grid and the same measured
heights, a gray bar of 14 pt centered in each line box of 20.3 where
there was text, seven discs where there were days, the toggle's
silhouette where there was a toggle; three neutral grays (background,
card, bar) and not one stain. The last block ends `SECTION.toPill`
(32 pt, measured) away from the button, the same distance as Opal's last
card. Board before and after in
`.context/hold-to-commit/cmp/bloques-tablero.png`.

**The fine review of the fill (2026-09-03, "give it a detailed pass to
match the behavior").** Every system in the button got measured against
the clip frame from the same instant, with probes in ms and luminance
profiles (`perfil.py`, `evolucion.py`, `vertical.py`), and six things
came out that the previous model did not have. All with a receipt in
`measurements.ts`:

| What | Before | Now | Measurement |
| --- | --- | --- | --- |
| The front does not go tip to tip | 0 → 100 % in 2 s | **4.5 → 95.5 %** (174 pt/s); after the burst it slides to 101 % with a 250 ms delay | the front's 50 % every 100 ms, f76…f181; at f181 it is at 93.5 % with the right tip at 124 |
| The left tip darkens and widens | a fixed veil (the one from f151) | the texture from the end (f181) **scaled in x from the tip**, s = .25 + .75·p | 38 pt from the tip: 249 (p .22) → 235 (.52) → 207 (.72) → 183 (.99); verified within ±5 at four progresses |
| The front is narrower at the start | a fixed σ | a scale in x around the geometric edge, .66 + .36·p | width 90→10 %: 51 to 53 pt up to p .42, 58 to 60 at .72 to .82, 62 to 64 after that; capture 49 / 58 / 60 / 51 against 51 / 55 / 58 / 55 |
| The turn-on starts slow | ease-out 300 ms | **ease-in-out 330** | peak over the background 8 / 17 / 26 / 65 / 100 % at 75 / 108 / 142 / 208 / 308 ms; capture within ±7 at eight instants |
| On release it fades more than it retreats | retreat 180 ms strong bezier + fade 150 | retreat **400 ease-out** + **exponential fade, τ 60 ms** (`Easing.out(exp)`, 420) | the peak drops .81 / .61 / .44 / .32 / .25 / .17 / .13 at 17…125 ms while the front's 50 % goes 13.5 → 9.5 %; with the bezier the front was at 3.5 % by 83 ms |
| The scale comes back in 200 ms on complete | 120 ms ease-out | a jump of 25 % in one frame + 220 ease-out | width 364 → 369 → 374 → 378 → 380 → 382 (f182…f195); capture within ±1.3 pt at five instants |
| The resting sheen is "square" at the top | one envelope for every row | a top envelope (even from 25 to 75 %, off before 10 %) blended with the bottom one by height; vertical .32·g(12) + .28·g(26) | row at 10 pt: 30/41/45/45/46/46/45/40/33 against 30/41/44/43/44/45/44/39/33 |

What got measured and did NOT change: the pill does not radiate light
outwards during the hold (the background 3 to 18 pt from the edge stays
at 20.0 in every frame), the press's scale matches to the point at all
eight instants, and the spill underneath is constant.

**What the skill `animate-expo` asked for (2026-09-04, "follow the
skill and fix what we don't comply with in haptics, reduce motion and
accessibility; the rest I want to try without losing what we have").**
The piece went rule by rule against the skill: 30 green and 10 red, of
which seven were on purpose (the reference rules over the skill's table,
and every departure has its measurement) and three were debt. What
changed:

| What | Before | Now | Source / measurement |
| --- | --- | --- | --- |
| The haptics follow the skill's table | Light on press, Soft on release, twelve impacts from Soft to Medium on the detents | `selectionAsync` on the twelve detents (same cadence, 300 → 60 ms) and Success on complete; press and release do not vibrate | animate-expo § 8: "a value ticks past a step → `selectionAsync`"; press and release are not in the table. Still NO RECEIPT (the clip is video) and it gets tuned with the phone in your hand |
| Reduce motion for real | `useReducedMotion` turned off the burst, the sparks, the blur and the Committed's scale… but Reanimated's default `reduceMotion: System` made EVERY `withTiming` jump to the end in one frame: the fill filled up whole on press and the twelve ticks fired together | every `withTiming` in the button goes through `move`, with `ReduceMotion.Never`, and the policy is written by hand (§ 9): no press scale, no sweep (the whole fill, with the progress as opacity), no sparks, no burst and no blurred copies; opacity and color are what is left | SOURCE `reanimated/src/animation/util.ts:506`. RUNTIME on simulator B with `com.apple.Accessibility ReduceMotionEnabled`: mean luminance of the pill 64.2 → **182.0 in one frame** and nailed there for the 2 s (before); 64 / 87 / 123 / 148 / 166 / 185 / 207 across the 2 s (now). `lum.py`, `sim/rm-auto-*` and `rm2-auto-*` |
| The label follows Dynamic Type | `allowFontScaling={false}` on the three texts | `maxFontSizeMultiplier` = 1.786 (AX1), and the blurred copies, the checkmark and its slot scale by the same factor; the label remounts when the factor changes | SOURCE RCTAccessibilityManager.mm:267; line box 20.3 × 1.786 = 36.3 pt inside 52. Capture at AX5 (`sim/dt-*`): the three texts fit and the crossfade still lines up. Without remounting, a live change left the large text clipped in the 17 pt box |
| The curves and the timings are a recipe | loose constants in `hold-to-commit.tsx` | `recipe.ts`: `clip` (the measured one, every value with a receipt in `measurements.ts`) and `skill` (the skill's tables to the letter, with the section quoted on each value); with `'choose'`, a live selector next to the background one. The probes measure `clip` | regression: seven probes before and after the change, **0 different pixels** in the pill's band (`dif.py`). What does not change between recipes: the linear 2 s fill, the color by progress, the sparks and the burst, the geometry, the haptics |

What stays red on purpose, to be looked at with the `skill` recipe in:
the curves (the skill's bezier against the measured quadratic ease-out),
the label's linear entrances, the press at 250 ms and .953 (against 120
and .97), and the crossfades longer than 300 ms. And what is still debt:
nobody has judged the piece on a phone or in a release build, and Expo
Go is no good for that.

**On the phone, at last (2026-09-04).** The App Store published Expo Go
57.0.9 on September 2 (until that day it was on SDK 54 and you had to
sign your own every 7 days) and Vito saw the piece on his iPhone. Two
requests out of that, and both of them are about taking things out:

| What | Before | Now | Why |
| --- | --- | --- | --- |
| "There's something behind the button, take it out" | the spill, the light that escapes under the pill, measured on Opal's screen (`SPILL`), was always drawn | only with the `opal` background; the screen passes it down to the button as a boolean | over a neutral background it does not read as light but as a box peeking out behind the button. In the faithful copy it stays, with its receipt |
| "Take out what's there to put something in" | the row of `clip \| skill` chips at the top, scaffolding for trying the skill's recipe live | `RECIPE = 'clip'`: no selector. To try `skill`, `'choose'` in `recipe.ts` or `?recipe=skill` | the selector belongs to the exploration, not to the piece; on the phone it was noise. The `skill` recipe is still there whole, one line away |

**A button to buy with, in a finance app (2026-09-04, "improve the
skeleton background a lot more, make it look like a finance app like
Robinhood and make the button at the bottom a buy button"; later: "not
much detail either way, all skeletons").** The reference was not
remembered, it was measured: Robinhood's official App Store screenshot
(2026.35.0, an asset's page: title, price, change, chart and range
selector), pulled through the iTunes API at 1242 × 2208 and measured
with `.context/hold-to-commit/robinhood/medir.py`. The mockup is a
402 pt iPhone (2.415 px/pt), and the scale closes from the other side:
the "C" of the title is 24 pt of cap height, which is a 34 pt font, iOS's
Large Title.

| Decision | Value | Source |
| --- | --- | --- |
| The `stock` background (the chosen one) | pure black and a single gray, `#2A2A2A`, for everything: bars, the chart's curve and the range pill (with a black bar inside). No color | RUNTIME off the screenshot: background (0,0,0); the line and the pill are lime (204,255,0), and it got measured but is NOT used: the first version had them in lime and Vito asked "don't add colors to the background and make it much more skeleton". Nothing competes with the button |
| The head | title 97 × 28 and price 152 × 28 on two lines of 41; the (i) of 20 pt at 12 from the price; the change 8 pt below: 147 pt in lime + 40 in gray, bars of 14 | RUNTIME: "Crypto" 96.9 pt of ink, "$1,500.00" 152, ⓘ 20.7; the price starts 39.7 pt under the title; everything 33.5 to 34 pt from the edge |
| The chart | one Catmull-Rom through eight control points, no noise, sampled at 43 points: 42 segments of 3 pt rotated from their end, from 2 % to 72.6 % of the width, in a band of 76 pt; 68 pt under the change and 42 above the range; a marker of 8 at the maximum | RUNTIME: the line runs from 8.3 pt to 292 out of 402, height 76.6, thickness ~2 pt (in the skeleton it goes to 3). The first version followed the clip's jagged shape with noise; "much more skeleton" smoothed it out. No Skia and no SVG: still views, nothing per frame |
| The range selector | seven bars between 47 and 363 pt spread evenly, the second one inside a lime pill of 31 × 22 with radius 7 | RUNTIME: segments at 47 / 95 / 149 / 197 / 245 / 294 / 349; pill 30.6 × 21.5, corner ~7; caps of 8.3 pt → bars of 9 |
| What goes below the range | a section header and a data grid in two columns (three rows of 44 with a hairline to the margin), and a second section of three lines of running text; all inside a container that gets clipped on shorter screens | ASSUMED: the screenshot ends at the selector. The button sits outside the container that gets clipped. The first capture had the price and the change centered: a `justifyContent: center` on a row centers across, not down |
| The buy button | "Hold to Buy" / "Keep Holding..." / "✓ Order Placed", the same semibold 17 and the same blurred copies regenerated | the ink widths that fixed the weight come from Opal's texts and hold just the same: no change of font, size or weight. `generate.swift` keeps the originals so you can go back |
| The reset is a fade, not a sweep | at 5 s: (1) the white veil and the fill go out in 400 ms with ease-out while "✓ Order Placed" leaves in 250; (2) with the fill already invisible, the progress snaps back to 0 and "Hold to Buy" comes in over 300, in white | Vito (2026-09-04): "make the transition back to the initial state clean, right now it's terrible". Before, the progress went back to 0 in 300 ms and you saw the fill retreat whole while the white went out and the label crossed, all at once. RUNTIME (simctl video at 15 fps, `cmp/reinicio-tira.png`): the inside of the pill drops 217 → 177 → 141 → 104 → 74 → 58 evenly across the whole capsule, with no front; the resting label only comes in after that. The same trick as reduce motion: the geometry changes only when it cannot be seen |
| Light and dark mode in the `stock` background | three iOS system colors through `PlatformColor`, dynamic: `systemBackground` (background), `systemFill` (bars, curve and pill) and `separator` (hairlines). The status bar on `auto` with this background | requested on 2026-09-04 ("add light mode and dark mode to the background"). SOURCE: UIKit's system color table: systemFill is (120,120,128) at 36 % in dark and at 20 % in light. RUNTIME in the simulator (`cmp/modos-tablero.png`): dark background (0,0,0) and bar (43,43,46), the gray measured for `blocks` to the level, so dark did not change; light background (255,255,255) and bar (228,228,230). Without a single scheme `if`: the colors change on their own, live. The opaque button does not change with the mode: the measured pill is dark always |
| The button in Liquid Glass, as an option | `material.ts`: `opaque` (the measured pill), `glass`, and since 2026-09-07 also a third one, clear, the same glass with Apple's `clear` style, more transparent and with the lens more visible (asked for when the question came up of whether the glass had an intensity: it does not, it has two styles and a tint; what changes how much you notice it is the contrast of what passes underneath). `glass`: `GlassView` from `expo-glass-effect` over `UIGlassEffect`, **`regular`, untinted and interactive**, as the CONTAINER of the pill; inside it, the view that clips the textures, transparent. Nothing from Opal on top: no resting sheen, no veiled tip, no ring, and no press scale (the material brings its own bulge under the finger). The hold's white fill still sweeps over it. Black label in light and white in dark. Selector on (`'choose'`) to look at it live | requested on 2026-09-04, in two steps. The first one ("I want to see an option with a liquid glass button") gave a glass behind the clip path with Opal's sheen on top, over a flat background and not responding to the finger: the native material, but indistinguishable from a painted capsule. Vito: "I want Apple's native liquid glass, well done, the way one of the best apps in the world would ship it". What makes the material show and feel, according to Apple's guide (HIG › Materials, WWDC25): `regular` glass with no tint (the prominent tint turns it almost opaque), interactive, and CONTENT PASSING UNDERNEATH, because the glass only reads when it refracts something. So the `stock` background started scrolling under the button, which floats. Traps from `GLASS.md` respected: no animated opacity on top and no clipping on the glass or its ancestors (the child clips itself). The module is asked for with a `require` inside a try: without it, it falls back to a flat translucent capsule. RUNTIME (`cmp/glass-tablero.png`, `cmp/glass-bandas.png`): in light and in dark, the list's bars show through the glass with the lens at the edge; rest, halfway through the hold and "✓ Order Placed" |
| The `stock` background scrolls under the button | a full-screen `ScrollView`, longer than the screen (two grids, a paragraph and a list of rows with a thumbnail, all ASSUMED), with a `paddingBottom` the height of the button's zone; the button floats at the same distance from the edge as before | that is how a primary button floats in iOS 26 and that is how the glass shows. With the opaque pill, the content passes underneath and the pill covers it, like any iOS bar |
| The hold lasts 1000 ms | `HOLD.duration` = 1000; the LongPress reads the same number | requested on 2026-09-07, in two steps ("make it take 1500 ms in total", then "cut the time down to 1 s"). What was measured in the clip is 2000 (121 frames from the press to the burst) and it stays in the receipt so you can go back. The front goes from 174 to 348 pt/s; sparks, haptic detents and the label's color are a function of the progress and compress on their own |
| Apple Pay's sound on complete, timed right | `sound.ts` + `media/purchase.wav`: `payment_success.caf` from the iOS 26.2 runtime, Apple Pay's success sound (paying, confirming a purchase or an App Store install), turned into WAV 44.1 kHz mono and raised from −11 to −1 dBFS of peak; player warmed up at volume 1, fired 60 ms before the end of the hold from the same clock as the fill (`LEAD_MS`), so the first note lands on the burst's frame and the second one, the "ding", 120 ms later while the pill whitens; it respects the silent switch and does not pause other apps | requested on 2026-09-07 ("leave Apple's one from downloading an app, timed right"), at the end of ten rounds: an arpeggio, a bell, a coin, this one, Berry's little bird in three versions, a voice in two, and "take out sound of any kind". RUNTIME (`.context/hold-to-commit/audio/medir-sonido.py`): D6 (1176 Hz) 120 ms and D7 (2352 Hz) decaying 1.1 dB every 20 ms up to 700 ms. **It is an Apple asset and it does not get redistributed**: if the repo goes public, it does not travel. What I learned along the way: reusing a player with `seekTo(0)` + `play()` drops hits; creating it on the spot takes too long, so it gets warmed up; a modulation between 20 and 150 Hz, or two nearby frequencies, sound harsh; the level is measured in LUFS. `expo-audio` 57.0.4, with a `require` inside a try because the simulator's dev client does not carry it |
| ↳ clear goes out | `material.ts` goes back to two materials, `opaque` and `glass`; the glass capsule is always `regular` | requested on 2026-09-07 ("take out the clear option"), the same day it came in. What was seen: over the `stock` background, gray and flat, `clear` is barely distinguishable from `regular` and loses the frosting that makes the label legible; it is the style Apple reserves for photos and video. How to go back stays in the file's receipt: `glassEffectStyle="clear"` on the capsule |
| Light mode for real, and nothing painted on the button's background | the screen decides the SCHEME (only `stock` follows the system; Opal's backgrounds are dark always) and the button, the chips and the status bar receive it. In light: the pill stays dark (#1E1E1E, the black primary button of iOS and of Robinhood) but with no resting sheen and no veiled tip; a black ring at 10 % (it shows over the commit's white pill, not over the dark one); a burst in the pill's color; chips with iOS's `systemFill` and `secondaryLabel`. Receipt in `LIGHT` (measurements.ts) | requested on 2026-09-07 while looking at the simulator in light: "adapt it properly to light mode, it all looks awful to me, even the picker, and everything about the button" and "take the things out of the button's background". What you saw: white chips at 6 % over white (invisible), gray text from the dark screen, and a dark pill with Opal's teal→green sheen as the only color on a screen that, by request, has none. All ASSUMED (the clip is dark), derived from the system colors. RUNTIME (`cmp/claro-tablero.png`): rest, halfway through the hold, commit and burst in light; commit and rest in dark, which did not change (Opal's sheen is still there) |
| Android, exactly like iOS | four things that were iOS only: (1) the `stock` background's system colors stop being asked for with `PlatformColor` and get written with their UIKit values per scheme (`PALETTE`); (2) the label's blurred copies on Android are the same `Text` with `filter: [{ blur: σ }]` (σ 2.5 and 1.0, the ones from `generate.swift`) from API 31 on, and before that the sharp ones crossfade; (3) the checkmark is Material Symbols' `check` at 700 (`@expo-google-fonts/material-symbols` 0.4.44, exact); (4) `includeFontPadding: false` on the text and `needsOffscreenAlphaCompositing` on the fill that fades | requested on 2026-09-07 ("make it work exactly the way it works on Android and iOS"). SOURCE for each trap in `native/AGENTS.md` 22 to 24 and 28: `PlatformColor` with UIKit names returns 0 = transparent on Android (`FabricUIManager.java:573`); `SymbolView` with a string name draws nothing (`SymbolView.tsx:32`); `filter`'s blur is `RenderEffect` from API 31 (`BaseViewManager.java:558`); Android composites the children of a view with opacity one by one. On iOS the pixels do not change: the values written are the ones `PlatformColor` was giving (bar (43,43,46) in dark, (228,228,230) in light). RUNTIME on a Pixel 9 / Android 16 emulator with Expo Go 57.0.9 installed on purpose (`cmp/android-tablero.png`): rest, hold, commit with the blurred copy coming into focus, settled and reset; and `sim/android-oscuro.png` in dark. This Mac did not have Android: the JDK and the command-line tools went in with Homebrew (how, in `native/AGENTS.md › Testing on Android`) |
| Performance: measured under the load of a real app | two new tools, scaffolding for the piece: `load.tsx` (JS busy 60 % of the time parsing a 40 KB JSON every 20 ms; the detail page re-rendering at 10 Hz; both; or JS blocked 150 ms at a time) and `meter.tsx` (UI thread frames per phase of the sequence, JS thread lag, and marks on both threads that give the real latency of the haptics and the sound). Knobs in `probe.ts` (`LOAD`, `MEASURE`, `RECEIVER`) or through the URL. And one change in the button: the RESET moves from JS's `setTimeout` to a `withDelay` on UI | requested on 2026-09-07 ("improve the performance a whole lot [...] simulate the load of a real app to test its performance"). RUNTIME, the whole `auto` sequence (press → commit → 5 s → reset), 60 Hz: **iOS** (simulator, dev bundle): 0 frames dropped out of ~416 under `all` and under `heavy`; hold 1000 to 1004 ms; reset at 5030 ± 4 ms from the commit with JS blocked (before, on JS, it waited for JS to free up). **Android** (emulator, production bundle): 0 dropped under `all`, 1 out of 416 under `heavy`, hold 999 to 1003. What does wait is whatever crosses to JS: under `heavy` the first haptic tick arrives 66 to 92 ms late and the sound 50 ms (the detents and the sound leave the UI clock at exactly the right instant; JS attends to them when it can). Without a native module that cannot be moved in Expo Go, and no plausible load (`all`) delays it by more than 12 ms. The measurement uncovered two bugs of our own that are gone (AGENTS 25 and 26): the reset on UI captured a `const` from further down, and the marks from JS threw an error in the animation queue. And one emulator trap (AGENTS 27): in dev it drops 47 frames out of 372 with no load; in production, 0 to 2 |
| Only transform and opacity: the label's color is opacity too | "Hold to Buy" and "Keep Holding..." exist three times over, in the three measured inks (rest, greenish gray #202B24, black), each batch with a fixed color and an opacity that is the PARTITION derived from the progress (white 1−t₁, dark t₁(1−t₂), black t₂). No view animates `color` or `tintColor` | requested on 2026-09-07 ("is there any chance of getting the same thing animating only transform and opacity?"). Two identical texts stacked and crossfaded by opacity give exactly the interpolation of the color in the covered pixels: white·(1−t) + dark·t. Each batch carries `needsOffscreenAlphaCompositing` so that Android does not composite its three layers one by one (trap 28). RUNTIME (`cmp/tilde-contextual-tablero.png`, last row): at p = .62 the label comes out greenish gray as before; the whole sequence under `heavy`, 0 frames dropped on iOS (`meter.tsx`) |
| Springs, with Apple's two parameters, in the `skill` recipe | `recipe.ts`: a `Movement` is either by time with a curve or a spring with DURATION and BOUNCE, the parameters of SwiftUI's `Spring(duration:bounce:)` (WWDC23 "Animate with springs"), which Reanimated takes as `duration` + `dampingRatio` (= 1 − bounce). A spring wherever there was a finger: press 150 bounce 0, return 400 bounce 0, the front's retreat 400 bounce 0 clamped at 0, commit 400 bounce 0. What has no finger (labels, veil, fade) stays by time with the table's beziers. `RECIPE` moves to `skill`; the measured `clip` one stays whole, one `?recipe=clip` away | requested on 2026-09-07 ("can a spring be implemented? how would Apple do it?"). SOURCE: animate-expo § 5 ("If a finger was involved, use a spring"; table "Default settle, no overshoot: {duration: 400, dampingRatio: 1}"; "bounce only when the gesture carried momentum"); Apple: bounce 0 is `.smooth`, the default of their controls, and a hold carries no momentum. `overshootClamping` where the value has an edge (§ 5: "must not pass a hard edge"). One receipt from the implementation: the constructors `timing()` and `spring()` get called from worklets and carry `'worklet'` (trap 29). RUNTIME (`auto`, iOS, `skill` recipe): hold 1002 to 1004 ms, reset at 5028 to 5031, 0 frames dropped under `heavy`, 2 out of 414 with no load (one in the burst, one in the fade) |
| The checkmark of "Order Placed" comes in with better-ui's contextual icon technique | in the `skill` recipe the checkmark comes in ON ITS OWN: opacity 0 → 1, scale .25 → 1 and blur 4 → 0 over a 300 ms spring with bounce 0; the blur is two layers, the PNG at σ 4 pt (`checkmark-blurred@3x.png`, or the `filter` on Android) and the sharp one, with the opacity split q(1−q) and q². The text keeps its blur-replace, with new PNGs that have no checkmark (`placed-blurred-*`). So that the checkmark falls where the sharp row puts it, its layer is that same row with the text invisible | requested on 2026-09-07 ("use better-ui's contextual icon technique"). SOURCE: better-ui "Contextual icon animations": "scale 0.25 to 1, opacity 0 to 1, blur 4px to 0px", "spring, duration 0.3, bounce 0". The `clip` recipe does not change: there the checkmark comes in glued to the text, as in Opal. RUNTIME: `cmp/tilde-contextual-tablero.png` (probe `checkmark=` at .25, .5, .75 and 1: the checkmark grows and comes into focus without moving the text) and `cmp/android-skill-tablero.png` (a real hold on the emulator with Material's `check`) |
| A storyboard above the button, and one single stage | `hold-to-commit.tsx` opens with interface-craft's ASCII storyboard (ms → event, the `skill` recipe with the `clip` one in brackets) and the button's state is ONE integer, `stage` (rest, hold, sounding, commit, reset): every worklet reads it to know whether it is its turn. Before there were two flags, done and sounded | requested on 2026-09-07 ("comply with everything interface-craft has in yellow"): a readable storyboard, a single state, spring-first (the row above). Along the way, `components/pieces/open.ts`: with two pieces in the workshop the index no longer redirects, and the probes and `pnpm record` need to start on the piece; the slug gets written there and the index redirects (it stays `undefined` in the repo). And VoiceOver's hint said "two seconds" with a hold of one: now it comes out of `HOLD.duration` |
| ↳ the text and the ending go back to the measured timings | the `skill` recipe takes from `CROSSFADE`, `COMMIT` and `RESET` the label's crossfades (press 360/48; release 600 linear +150 / 250 +80; commit 450 linear +210 / 280 +40; reset 300/250), the veil (330), the slide (250 + 400) and the fade (400), with the measured curve; it keeps the springs where there is a finger and the contextual checkmark. The § 5 values (200/150 with no delays, 250, 200, 200) stay written down in `recipe.ts` | Vito, 2026-09-07, with the `skill` recipe just switched on: "I don't like how the animation turned out now, the text changes too abruptly and the animation at the end is too fast". The abruptness was exactly what the table prescribes for a "small state change"; what had been approved before were the clip's timings. The reference is a floor: you touch the knobs he named, not the architecture |
| ↳ and the active recipe goes back to `clip` | `RECIPE = 'clip'`: the measured one, the one from commit `679b0db`. The `skill` one (springs, contextual checkmark) stays whole, one `?recipe=skill` away | Vito, 2026-09-07: "it's different from before, especially the ending, check it and leave it the way it was". With `skill` the pill comes back on complete with a 400 ms spring instead of the measured 25 % jump plus 220 ms, and the checkmark comes in on its own. RUNTIME: with `clip` active, the four state probes (rest, 0.5, commit, crossfade-commit=150) give infinite PSNR against `sim/b-claro-*.png`, captured that morning with the previous code: pixel for pixel the same, whole screen. The label with three inks and the single stage change nothing visible: it is the same choreography by another road |
| ↳ the checkmark and "Order Placed" go hand in hand, guaranteed | the contextual checkmark loses its own clock: it reads `pPlaced`, the text's presence, and its two layers carry the SAME partition of the staircase (the sharp one, `sharp`; the blurred one, `wide + narrow`). better-ui's scale .25 → 1 stays, with the same ease-out as the text's. In the active recipe, `clip`, the checkmark was already inside the row: they are literally the same layers | Vito, 2026-09-07: "do the icon and the Order Placed go hand in hand at the same time? Make sure of it". There were TWO ways to come apart and both are closed: a 300 ms spring of its own against the text's 450 + 210 (the checkmark arrived first), and then, with the clock already shared, a different opacity ramp (q against the staircase, which saturates at q = .4: the checkmark arrived last). RUNTIME (`cmp/tilde-de-la-mano.png`, probe `checkmark=` at .10/.20/.30/.40/.60/1, measured with `tilde.py` as ink, Σ 255−luminance, over the white pill, normalized against the one at q = 1): in `clip` the checkmark and the text run within ±1.5 percentage points at every q; in `skill` they used to run 13 % against 74 % at q = .30, and now 34 % against 74 %, which is exactly the area the checkmark is missing for being at 63 % of its size. The difference that is left is the prescribed growth, not a delay. And `clip` did not move a pixel: commit, `crossfade-commit=150` and progress .5 give infinite PSNR against the same state pulled out of the code at `898eece` |
| The piece recorded and published in the exhibition, in light and in dark | two masters in `.context/mockup/master/hold-to-commit-{oscuro,claro}.mp4`, 5.45 s each; four videos for X (`mockup/out/hold-to-commit-<appearance>-<background>.mp4`) and two pairs with alpha for the card. The choreography is the `demo` probe (`hold-to-commit.tsx`), which calls the SAME worklets as the gesture (`press`, `complete`, `reset`), so curves, timings, haptics and sound are the ones from the real path. `MATERIAL = 'opaque'`, which along the way closes the decision that had been open since 2026-09-07 and takes the chips off the screen | requested on 2026-09-08 ("record it and upload it to library, I want dark and light mode, in opaque mode, respecting zooms"). The mode comes out of `useColorScheme`, so the two takes are the same code with `simctl ui appearance`. RUNTIME: the two takes aligned BY THE COMMIT end up 33 ms apart (`cortar.py`) |
| ↳ the cut gets measured INSIDE the pill, not in the band | `cortar.py` averages an 800×70 px window that is all pill in both modes | RUNTIME: with the 1080×200 band that was used first, in light the white detail page around the button dominates it and the cut came out 200 ms off from the dark one; in the video for X the two appearances were showing different instants of the choreography. It showed up in a board of the four commit frames, not in the numbers |
| ↳ the camera looks at the pill, and the framing is measured | `parameters.ts`, `HOLD_TO_COMMIT`: `focus` 0.9105 (the center of the pill sits at 2650 of the screen's 2868 px, which is 91.05 % of the BODY with the bezel measured in `geometry.ts`) and `focusOnCanvas` 0.58 for X. Everything else (bezel, size, shadow, zooms, curves) is what was measured in @nater02's reference and it was not touched | the criterion for the framing is not taste: leave the same air below that the reference leaves above (`airAbove`, 7.2 %). RUNTIME: the shadow ends at 84.4 / 89.4 / 92.5 / 96.4 / 99.9 % of the canvas with focusOnCanvas 0.50 / 0.55 / 0.58 / 0.62 / 0.67; 0.58 leaves 7.5 % |
| ↳ in the exhibition the phone fills the box: `focusOnCanvas` 0.85 | the exhibition's video IS the card's whole box, so the zoom's cut falls on its edge | RUNTIME: with X's 0.58 the body reached 70.9 % of the box and left 29.1 % of empty card under the phone; with 0.85 it reaches 97.9 % and the pill fits whole |
| ↳ the card serves the recording of the reader's theme | `Piece` adds `videoDark` and `videoHevcDark`; `parts.tsx` picks them with `prefers-color-scheme` and remounts the `<video>` with `key`, because moving the `src` of a `<source>` that is already mounted reloads nothing without a `load()`. `piece:video … --dark` writes that pair | it does not contradict the decision of 2026-09-05 ("let there be only one background, the one the exhibition gives the place"): that one is about the card's BACKGROUND, which is still a single one, and this one is about what you see inside the phone. Hold to commit is the first piece whose content changes with the system's appearance, and the difference is not cosmetic: in light the pill loses the sheen that fills it in dark |
| ↳ the recording is a single gesture | the `demo` probe used to be rest, a hold abandoned at 700 ms, a full hold and reset; now it is rest, a full hold and reset, and the master went from 6.65 to 4.65 s plus 0.8 of tail | Vito, 2026-09-08: "make the recording run everything in one go, take out that part at the beginning where the button is pressed and it cuts halfway". The retreat is still in the piece and in the notes, told as a property of the button: cutting itself in half before having shown once what happens at the end reads as a bug |
| ↳ the video ends when the animation ends | the master stays whole (5.45 s, with the reset); what gets cut is the DELIVERY, at 4.10 s, and it gets cut ONCE: `pnpm assets --duration=4.10` leaves the clip already cut in `public/` and the six videos come out of there, the four for X and the two pairs for the exhibition | Vito, 2026-09-08: "make the video cut earlier, meaning when the animation ends and that's it, nice and natural, don't wait for it to go back", and later "let there be more time after it ends". RUNTIME (`quietud.py`, the difference between consecutive frames across the whole bottom strip, which is where the burst comes out): the two appearances go still at 2.73 and 2.78 s ("✓ Order Placed" in focus and the burst out) and stay still until **4.333 in both**, which is when the reset moves. 4.10 leaves 1.35 s with the result on screen and 0.23 of margin. The measurement fixes the ceiling; the air was his pick |
| ↳ and the cut happens BEFORE rendering, not after | at first it rendered whole and the WebM and the .mov got cut with `-c copy`; now the cut is in the clip | a `-c copy` can only cut on a key frame, and it left the WebM at 4.121 against the .mov's 4.100: the two formats of the same video lasted different amounts. Cutting the clip, both give exactly 246 frames, 25 % less gets rendered and one step disappears. `pnpm assets`'s `--duration` carries the receipt |
| The piece's notes | `src/components/pieces/hold-to-commit/notes.tsx`: Anatomy, Performance and Use cases, 12 paragraphs. No description line, which is the first rule: the title already says what the gesture is | the whole procedure is AGENTS.md › How the line and the notes are written. The sources were read as served on 2026-09-08: josh puckett (19 of his paragraphs give a median of 25 words and 2 sentences), benji, and Apple's interface guide through its documentation API, which goes in as explanation and without being named |
| ↳ what the notes do NOT claim | that the hold measures one second with 4 ms of error, even though the performance row has it | that measurement comes out of the `auto` probe, which fires `press` and `complete` with two JavaScript `setTimeout`s: it measures how well those timers aim, not the gesture recognizer's clock. What does get claimed is what the measurement proves: that the recognizer and the fill read the same constant, and the dropped frames. And nothing about a real phone, which the section spells out |
| The button revised against the interface guides | the button departs from the clip in three things: the 1 pt ring does not get drawn and in its place goes a shadow of two transparent layers; "✓ Order Placed" moves 6.6 pt to the left (`LABEL.opticalCorrection`); and the page goes from pure white to iOS's grouped gray | requested on 2026-09-08 ("fix all of this to comply exactly with what better-ui says") |
| ↳ and the knob that decided it got deleted | the two versions lived together behind a chip (the file finish.ts, with the values reference and revised) until one was chosen. On 2026-09-09 the whole file got deleted, and with it the type, the chip, the ?finish= parameter, the prop that came down through three components and the ring's code | first the chip was pinned to revised, and that made it a knob with one position: half the code existed for a branch nobody picks any more. The argument for keeping it was that reference is "the record of what the clip says", and that record does not need code: the three numbers are in this log and the receipts, above `LABEL.opticalCorrection` and where COLOR.ring used to be, in `measurements.ts`. A measured value gets kept written down, not executable |
| ↳ the ring was a drawn outline, not a border | RUNTIME (`optico.py`, eight points of the top edge, at rest): the ring pulls **+54.5** away from what it has 2 pt outside and **+16** from what it has 2 pt inside; in the clip, **+4** and **−2**. Which means that in Opal the edge is a ramp and in ours it was a light line above both of its neighbors | interface-craft's test ("do outlines add structure or noise?") gets answered by the measurement, and better-ui gives the replacement: "where a border exists only to create depth, prefer layered transparent box-shadow values". Watch out for the shadow: **`boxShadow` follows the shape of the VIEW**, and without `borderRadius` it drew a box with sharp corners around the capsule ("you can see the component's whole box, really ugly") |
| ↳ the label with an icon was not centered for the eye | RUNTIME (`optico.py`, ink per column over the commit's white pill; Δ against the pill's center): the row's box falls at +0.83, but the TEXT sits at **+13.67 pt** and the ink centroid at +6.60. In the clip, +0.74 / +13.84 / +8.35: we were reproducing Opal to within 0.2 pt, and Opal does not correct it either | Vito, 2026-09-08: "check whether it respects what better-ui says about something being centered for the eye, when there's an icon I get that feeling". The correction is the centroid's Δ canceled out, −6.6 pt, and it only moves the label that has a checkmark. Verified: Δ −0.06. Centering the text was tried too (−13.7, Δ 0.00) and dropped: the checkmark ends up hanging off the margin |
| ↳ the white in light mode gets fixed on the page, not on the button | RUNTIME: in light, on complete, the inside of the pill measured 229.9 against a detail page of 245.5, which is **15.6 of contrast**: it stopped existing as a surface. The first solution was a dark veil over the fill, which took the contrast to 40.9 | Vito, 2026-09-08: "I don't like how you solved the color thing, if it comes to it change the background color a bit, since it isn't the main thing here". He was right: it was dirtying the protagonist to fix the set. The veil came out entirely, the button goes back to full white like the reference, and the page moved to `systemGroupedBackground`. It holds as a rule: **when the protagonist and the set do not separate, you move the set** |
| ↳ the background ends ABOVE the button | `backgrounds/stock.tsx`: the `paddingBottom` was on the content, which only adds air at the end; now it bounds the `ScrollView`'s VIEWPORT. And the content ends before that edge: the list with thumbnails and the last grid came out | Vito, 2026-09-08: "the bottom part of the button lines up exactly with something below it, making the button look bigger". It was a row of the skeleton crossing the pill's bottom edge. RUNTIME: with one list row the content ended at 830.7 pt with the edge at 831, cut flush; without it, it ends at 742 and 89 pt are left over. There are 121 pt of breathing room up to the pill, on purpose: a whole row does not fit |
| The notes, much shorter | `src/components/pieces/hold-to-commit/notes.tsx`: from 750 words and 12 paragraphs to **396 and 9**, 47 % less, in two passes and adding three facts along the way. Out went the reset (it belongs to the workshop), how the fill and the label are built (implementation), the latency broken down, and the list of example actions | requested on 2026-09-08 ("make it far shorter, and faithful to the code"). From the skills, only what a reader can see gets in: the UI thread, only transform and opacity, reduce motion, Dynamic Type, the haptics never being the only feedback, the recognizer and the fill reading a single constant, the interruption and better-interface's optical alignment, and the shadow instead of the outline, which is what answers interface-craft's critique lens. What does NOT get in is the craft of the code (storyboard, single stage, data-driven) because it talks about the source and not about the piece |
| ↳ the two facts the notes gained | "The capsule has no outline: its edge is its own shape, lifted by a shadow on light backgrounds" and "The checkmark and the words are centered by eye, not by box" | they are the two corrections to the finish, told from what you can see. The sentence about the shadow is CONDITIONAL on purpose: a black shadow over dark mode's black background is not visible, so saying that the shadow carries the edge would be false in half the cases |
| ↳ the haptics stopped being called "tick" | now they are "detents", which is the name the code was already using (`DETENTS` in `haptics.ts`) | with the checkmark named in the public text, "tick" was naming two things: the glyph (which in English is a tick) and the haptic pulse. `precise-naming` caught it. "Detent" is the specification term, a mechanical stop you can feel, and the glyph keeps "checkmark" |
| ↳ the dropped frames came out of the text | they were true (0 on iOS, 1 out of 416 on Android with the thread blocked) but they come from a simulator and an emulator | counting them invites you to read them as if they came from a phone. What stays is the fact that holds up: what you see does not depend on the JavaScript thread. The numbers are still in this log |
| ↳ the phone goes in as a test, not as a measurement | on 2026-09-08 there was a request to say that it had been tested on a phone and it was NOT written, because there was nothing to back it with. On 2026-09-09 Vito confirmed it ("already tested on a real phone") and it went in: "Measured on the iOS Simulator and an Android emulator, and tested on a phone, where the haptic can be felt" | **the two verbs are different on purpose.** The numbers are still attributed to where they were measured; out of the phone comes the one thing you can only know there. The simulator does not vibrate (it is in the header of `haptics.ts`, and that is why that whole track is marked NO RECEIPT), so the haptics are the part of the piece you cannot judge any other way. What still does not get written is a frame rate or a latency measured on a phone: those do not exist |
| ↳ two of the workshop's receipts had gone stale | `haptics.ts` said that the last detent falls just before the label's jump to black; the last one is 0.985 and the jump starts at 0.965, so the one that falls there is the SECOND TO LAST (0.955). And `hold-to-commit.tsx` reported the front's travel as 3 % → 94 % in three places, when `measurements.ts` says `start` .045 and `travel` .91, which is 4.5 % → 95.5 % | both are comments, not code: nothing looked wrong on screen. It is the way a receipt fails (the value gets corrected on one side and the explanation stays behind on the other) and that is why auditing the comments against the code is part of closing a piece, not a luxury |
| The naming rule, as a skill | `~/.claude/skills/precise-naming/`: the rule about the vocabulary of a 1972 IBM specification, with the three questions for applying it, the table of corrections, the public-text part, and when it does NOT apply (`useEffect`, `stdin`, `SIGKILL` stay) | requested on 2026-09-08. Run over what had been written that same day, it found three names of mine: look.ts → finish.ts ("look" is design jargon, and in English inside a folder that named things in Spanish), polished | faithful → revised | reference ("polished" names a feeling), and OPTICAL_NUDGE → OPTICAL_CORRECTION. And one collision: `RECIPES` existed twice in the same folder, for two different things |
| It got recorded again, and the six videos are new | two new simulator takes with the revised button, two masters, the four for X and the two pairs with alpha for the exhibition | the published videos came from before the revised finish: they showed the ring, the white page and the uncorrected label, and the skeleton crossing the pill's bottom edge. A video that does not show the piece that is published is worse than having no video. The two new takes agree on the commit to within **16 ms** (1.483 and 1.467 s from the cut, against the minimum of 1.2 the workshop asks for) |
| ↳ and you look at the status bar before spending two takes | the first control capture carried the "◀ Safari" that iOS leaves after you open the app from a link; it goes away with one extra `terminate` + `launch` | none of the old masters had it, so it came from the simulator's state and not from the script. It costs 15 seconds to check and a whole take to fix afterwards |
| The how-to had not traveled with the change | the decisions were all in this log and the three `AGENTS.md` files still described the path for a single appearance. The one at the root said, in so many words, that **"there are no per-theme versions"** | and there are, as of this piece. The log keeps what was decided; the `AGENTS.md` is where somebody looks when they want to DO it, and there the old sentence is not an omission, it is a wrong instruction. Closed in all three: the distinction between the card's background (one) and the recording (two), `pnpm piece:video` in its two-appearance form, `--duration` with its receipt, and the breadcrumb about the status bar in the recording section |
| ↳ `--until` got renamed to `--duration` | the `pnpm assets` flag that cuts the delivery | until was already naming two other instants on the same path: the start of the camera's way out in `parameters.ts` (3.00, and `9999` for "it does not leave") and `pnpm mockup`'s `--until` in the workshop. Three instants under one word is exactly what the naming rule forbids, and on top of that this is not an instant: it is a duration, the one that goes into ffmpeg's `-t`. Verified after the rename: 246 frames, 4.100 s |

## What we brought back from reading another repo

**On 2026-08-28** we read
[SchroederNathan/react-native-motion](https://github.com/SchroederNathan/react-native-motion)
end to end (seven Expo/RN animations, a separate docs site) looking for
what of somebody else's method was useful here. It has no license: the
only `LICENSE` is the Expo MIT that `create-expo-app` leaves behind. So
**no code traveled**, conclusions did.

**What we did bring back.** They close every animation with a list of
invariants, `Do not change these behaviors`, and that is our receipt rule
in a format another agent can execute. I classified the 28 lines of their
four lists:

| | how many | what was done |
|---|---:|---|
| Specific to their implementation | 13 | nothing, they do not apply |
| General traps dressed up as a rule about a piece | 8 | → `native/AGENTS.md` › *What we already know bites* |
| API convention of the stack | 7 | → `native/AGENTS.md` › *What holds for every piece* |

The 8 went in **as rules, not as suggestions**. They come from a repo
where the constants are pulled frame by frame out of the reference and
every decision carries its comment above it: whoever disagrees with one
of them should measure before touching it.

**And the format of the block**, with an addition of our own: every line
carries its evidence grade, `SOURCE` if the code says so, `RUNTIME` if it
was measured running. Without that, "500 ms" and "210 ms" look like the
same kind of number and they are not: one is a decision, the other is a
reading off the reference.

**Why the conventions live in one single place.** They copied the same
rule by hand into their four briefs, and in the fourth one it went stale:
the radial menu's brief orders you to use `runOnJS`, but their own code
uses `scheduleOnRN` thirteen times and `runOnJS` not once. Three out of
four got updated. Verified against our own `node_modules`: `runOnJS` is
`@deprecated` in `react-native-worklets@0.10.1`
(`lib/typescript/threads.native.d.ts:103`).

**`native/GLASS.md`** came out of the same reading: `expo-glass-effect`
was already installed and it has traps you do not see coming. A
`GlassView` under an animated opacity **draws nothing**, and clipping it
kills the material's bulge under the finger. And one rule that gets
forgotten: the `BlurView` of the fallback does have to be clipped, which
means the two branches of the same component carry opposite rules.

**With `expo-blur` 57.0.2 installed the same day**, even though there is
no piece using it yet. It is the whole ladder or it is not a ladder:
below iOS 26 the material does not exist, and finding that out when the
piece is already half built costs you a `pnpm ios:build` at the worst
moment. The dev client got rebuilt in the same step.

**What we did not bring back**, and why:

| | |
|---|---|
| Their skill `make-interfaces-feel-better` | it is pure CSS for their Next.js site, zero mentions of React Native in its 959 lines. And `~/.claude/skills/better-ui` is the same family with four more files |
| Their registry written by hand | ours is derived from the folders. Theirs has already gone out of sync: `linear-tab-bar` is loaded in `data/animations.ts` and has neither a folder nor an entry in the registry |
| The monorepo with a separate docs site | it solves a problem we do not have. They build a display window for other people to copy from; here the product is the exhibition |

**The one thing we are missing and they have:** they record the
simulator *during* the iteration, not only when publishing. Ten `.mp4`
files slipped into their repo in `.argent/recordings/` (it is not in their
`.gitignore`) and went in with the same commits as the animations.
Measured with `ffprobe`: h264, 30 fps, 1206×2622 and 1320×2868, which is
two different simulators by the UDID in the name. Our `pnpm record`
records to **publish**; this would be to **verify**, and that is another
thing. It stays in Pending, along with the MCPs that give the agent
eyes.

## The detail's notes: benji's lines, josh's tone

**The detail existed for this** and it was empty: *"the list shows, the
detail explains"*. Since 2026-09-04 a piece can carry a long text under
its preview, split into sections: where it came from, what got measured,
what fought back. It lives in `src/components/pieces/<slug>/notes.tsx`,
with the same mechanism as the demos (a lazy glob by slug, no registry to
maintain) and a piece with no notes draws nothing.

**The `PIECES` line was not touched, and they are two different
things.** That one is what you write when you publish and what gets read
straight through under the piece; the notes are what comes after. Putting
the prose into the inventory would have bloated the file that the page,
`routes.mjs` and the bridge that publishes all read.

**The lines are benji's and the tone is josh's, and it is worth saying
which half belongs to whom** because the mix is ours:

- The separator **is the same object** that splits the list into Web and
  App (`.groupHead`: a 14/600 label + a hairline out to the edge of the
  rail, 8 of gap), which was already measured off `/liveline` and
  `/drawesome`. A second line was not written: one single line on the
  page is one single rule.
- **Josh has none**: zero `<hr>` on `/melt-effect` (SOURCE, 2026-09-04,
  over the served HTML). What is his are the **labels**, short, in
  sentence case, sometimes a question: *"1. What's a displacement
  map?"*, *"Shaping with frequencies"*, *"The filter"*, *"Apply it"*.
  And the **prose**: first person plural for the method, short
  sentences, the mechanism named precisely, the warning stated without
  drama (*"A note on performance. Animating filter attributes
  re-evaluates the entire filter graph every frame"*) and his own
  mistakes admitted. No self-praise: that was already the copy rule
  here.

**It is written in the first person singular.** *"I didn't start from a
memory of how X feels. I started from X."* In here there is one single
person and the plural sounded like a team that does not exist. It is
also what josh does when he tells his own story (*"I've applied an SVG
filter to it"*, *"I'll never forget"*), leaving the `we` for walking the
reader through a method. The `you` for the reader stays, which is his
too.

**The two gaps are tokens that already existed**, 64 above each label
(`--section-gap`) and 40 from the line to the first text
(`--section-content-gap`), and **they were not chosen again**: they get
reused so there is one number per relation. Whether they are the right
ones *for prose* is **unmeasured**, and so is the line of air between
paragraphs (today the body's line height). All three get decided with
the scrubber on this page, and they are marked as pending in the CSS.

## The first App piece: X's tabs, measured against the real app

**Swipeable tabs** (`native/src/components/pieces/swipeable-tabs/`) is
the first piece to come out of the native workshop, and it fixes how one
gets built: **nothing gets claimed without measuring**. The reference was
not an idea of how X moves but X itself, the vault clip and then four
recordings of the user's own account, on his phone (1320×2868, 60 fps),
read frame by frame with ffmpeg scripts and not by eye. Out of that came
the tab bar's six resting positions to a tenth of a point, the lean rule
(`TAB_BAR.lean`), the tap's curve (easeOutCubic, 300 ms, fitted against
three taps), the header's collapse with the scroll (translation = scroll
to the tenth, linear fade) and **the two palettes**, the dark one and the
light one, by the same method. Every number carries its receipt above it
in `measurements.ts`, and the whole spreadsheet lives in
`.context/recon/swipeable-tabs/MEDICIONES.md`.

**What was decided against the reference got written down too**, with
the proof that the reference does something else: the tab row only
shifts when the target tab does not fit on screen
(`TAB_BAR.row = 'visible'`), even though the recording shows X centering
every time; the block at the top stops with its divider stuck to the
status bar instead of leaving entirely. Both are the user's requests,
tried on the phone, and the faithful variants are one word away. And
the ones that were tried and rejected (the block fading out whole, the
collapse's full travel) were written down above the code so that nobody
repeats them.

**The shape of the folder** is that of a
[react-native-motion](https://github.com/SchroederNathan/react-native-motion/tree/main/apps/expo/components/animations)
component: a self-contained screen, an `index.tsx` that exports it, the
mechanism in files by responsibility, the theme and the data alongside.
The route in `src/app/` is a pointer. Their hand-written registry did not
travel, for the usual reason: the workshop's index is derived from the
folders. (That was how it worked until 2026-09-10: since then the route
is one for all of them and the registry does exist, derived from the
pieces' folders. See *The structure of react-native-motion*, further
down.)

**What we learned about the method**, more than about the piece: a
deterministic probe is ONE state per reload, not a timeline of timers;
the simulator cannot receive a tap, so the tap's path gets tried on the
phone; and when the user says "it feels abrupt", you touch a knob or ask
which one, not the geometry. The big rework was rejected on the spot.

## The video for X, measured against @nater02's clip

The piece was already running and already recorded; what was missing was
the video you publish. The user brought the exact reference (a clip by
@nater02 on X: 720² at 60 fps, 24.6 s) and four words: the zoom at the
start, the neutral background, that exact phone in the middle, the
fluidity. It got measured frame by frame before anything was touched, as
with the piece:

| what | measured | where from |
| --- | --- | --- |
| background | RGB (235, 230, 232), flat | the four corners and the edges, the same in every frame |
| phone | black, body 335×686 in 720² → 95.3 % of the height, centered | the body's edge by row and by column in frame 0 |
| shadow | only to the right and below; two layers, one tight (α .60, σ 8, offset 12) and one wide (α .20, σ 30, offset 70) | a least-squares fit over the luma profile every 6 px, with the shadowless sides as a constraint |
| camera | it comes in to 1.576× in 0.65 s, holds 0.18 s, leaves to 1.161× in 0.62 s and does not move again | the body's width frame by frame (335 → 528 → 389) |
| curves | way in bézier (0.30, 0.05, 0.40, 0.90), way out (0.25, 0.25, 0.20, 0.90) | a search over the four control points, rms 0.005; no known CSS curve gets below 0.03 |

**The phone is the iPhone 17 in Black.** The proportion of the
reference's body (2.05) is closer to the 17 (2.066) than to the Pro Max
(2.095), and the Pro Max does not come in black. The Pro Max recording
fits into the 17's slot scaled: the proportion is the same to 0.1 %.
There are now two models measured in the script and the camera moves each
layer per frame from its own source, without re-scaling the composed
frame: at 1.58× the bezel grows 20 % over the PNG and the recording fits
almost 1:1.

**The camera points at the action of THIS piece, not at the reference's.**
There the action is at the bottom (a menu that unfolds from the keyboard)
and the zoom leaves the top edge cut off; here it is at the top (the tab
row), so the way in points at the row, at 33 % of the height, and the way
out leaves the top edge at 7.2 % of the canvas with the bottom one cut
off. It is the mirror image, with the same numbers.

**The edges, and why there is a `--verify` now.** The first version had
the screen off by 15×20 px (the screen's x was in the PNG's coordinates
and it was being added to an origin that was the body) and in the top
left corner the background peeked through the slot. In the whole frame
you could not see it; the user saw it in a zoom: "you have to be much
more detail-oriented, look at the edges, they don't get filled". With
layers that position themselves and round to the pixel in every frame, a
wrongly taken origin does not fail: it shows. So
`pnpm mockup <slug> --verify` puts solid red in place of the recording,
renders the whole camera losslessly (RGB, ffv1: in yuv420p the chroma
gets averaged 2 px at a time and a red stuck to the bezel stops being red
without there being any gap at all) and checks pixel by pixel that the
bezel's slot is full in twelve states of the camera. It runs before you
look at anything.

**The first App piece entered the exhibition by its own road**: the clip
in the vault, `Add to Exhibition` (its endpoint, the same one the sidebar
uses), the entry in `PIECES` and `vercel.json` regenerated by the build.
The vault keeps the master (1320×2868, 25 MB: that is what the simulator
records) and that is what publishing copies as it is; for the exhibition
it got re-encoded to 720×1564 (5.6 MB), twice the detail's 319 slot.
**Pending:** publishing ought to transcode on its own (the master is for
the mockup, the web does not need it), and the time in the status bar
comes out as "09:41" because the simulator is in 24-hour format; the next
recording changes it with `AppleICUForce12HourTime` before recording.

**Tools, for next time.** What this pipeline does (official bezel,
background, shadow, camera) is also done by Screen Studio (it records the
iPhone over USB with a frame, but it does not see the taps: no auto-zoom
on iOS) and Matte (it records a simulator or an iPhone with a frame and
zoom). What no tool fixes is the source: the gestures in this recording
are synthetic, the probe moves the pager with measured curves. A real
finger on the phone with Expo Go is the other half of "the fluidity", and
that is a different recording, not an adjustment to the mockup.

**Addendum, the same day.** The video that was in the exhibition was the
interim one, the simulator recording re-encoded, and the final clip is
being made in another session. The decision was to leave the piece
**published with an empty slot** (the card reserves it on its own: it is
the `::before` of `.streamPreview`) and to have the video come in
afterwards with a command, `pnpm piece:video <slug> <file>`: it
re-encodes for the web at the slot's width, keeps the file's proportion,
writes `public/pieces/<slug>.mp4` and fills in `video` in `PIECES`. And
the piece **left the vault**: the vault is the wall of other people's
work, and a piece of our own has no reason to pass through there to reach
the exhibition. Its master ended up in `.context/mockup/master/`
(gitignored), which is where the mockup takes it from with `--clip=`.

## The mockup in Remotion: the same numbers, iterated live

The ffmpeg pipeline made the video correctly, but every adjustment was a
re-encode of several minutes, and the video's brief asked for the
opposite: watch the look live and render once. So `mockup/` went up, a
Remotion (React) composition with **exactly the measured numbers** (the
bezel over the PNG's alpha, the background, the shadow in two layers,
the three-moment camera and its two béziers) as props with a schema,
which Remotion Studio shows as controls. What changed with respect to
the pipeline, and why:

| what | ffmpeg | Remotion |
| --- | --- | --- |
| the curves | a degree-7 polynomial fitted to the bézier (ffmpeg does not evaluate béziers) | the bézier itself, by bisection |
| the camera | (zoom, aim point) | (zoom, position of the body): the edge of the phone travels in one direction only |
| each layer | scaled per frame with `scale … eval=frame` | drawn at its size in each frame, with no `transform: scale` |
| the intermediate | none | PNG between the frame and the encoder, not JPEG: it is what gets uploaded |
| the guard | `--verify` | `pnpm verify`, with the same geometry it draws |
| iterating | a re-encode per adjustment | Studio, live; `pnpm render` at the end |

Where the brief departed from the reference, on purpose and noted next
to the number: the phone at 75 % of the height instead of 95.3 % (more
air) and a heavier shadow (α .82 σ 7 + α .32 σ 36 in px of 720; the
offsets stay the measured ones, which are the only ones there are). And
one measured decision about the new recording: the camera stays closed
until 3.9 s, not the 2.6 of the brief, because the drag to Stocks ends
at 3.80 and the burst of tabs starts at 5.37: the way in covers the two
slow gestures and the burst is seen whole from the final framing.

**Verified before looking:** the twelve states of the camera with the
slot full (0 pixels that are not red), and the corners at 3× in the
frames of the zoom and of the final framing.

**Second take, with what the user saw.** About the first video he said
three things: that from For you to Following it "sticks", that the fast
part goes by too fast, and that between Following and Stocks it has to
go slow. Measured on the recording: the entry into Following was an
instant jump (a single frame), Following → Stocks was a tap of 0.27 s
and the burst was taps every 600 ms. The new take starts in Following,
drags to Stocks in 1.65 s with an in-out sine (X, measured: 1.73), taps
For you and does five one-tab flicks, one every 1.0 s, with the finger
profile fitted against X (15 % in 110 ms, the rest in 430). The gestures
go along the piece's real paths, with a `?demo=1` probe that lives in
the working tree and does not travel.

**And a bug in the piece that the probe uncovered.** Moving the pager by
`target` with `motion` set to drag, the tab bar read the tap's segment
(`target !== NONE` was its condition) and the underline stayed nailed to
For you while the content traveled ("the whole tab animation is
bugged… the animation is never halfway"). The correct condition is
`motion === tap`: for a real tap it is the same thing, and for anything
else that uses `target` the tab bar follows the content. Verified in the
frame strip of the slow drag: the underline travels continuously from
Following to Stocks and the inks cross.

**Third take: two back at the end, and really starting in Following.**
Two more requests about the video: that on reaching the last tab it go
two back and end there, and that the first frame show Following with
Following's content. It was showing the Following tab with For you's
content. The second one was the probe: a `scrollTo` in the first effect
did not move the pager (the content was not there yet) and only
`scrollX` changed, so the tab bar and the content started out of step.
Now the pager starts with `contentOffset` in Following and `scrollX`
starts there too. The clip comes out at 12.9 s: slow drag at 1.20, tap
to For you at 3.80, five flicks up to Design and two back to Tech, each
one 1.0 s after the last.

**Sixteen shadows, side by side.** Before choosing the mockup's shadow I
measured what the references do, with the same method as with @nater02
(luma around the edge of the phone, two gaussians with an offset). The
vault's clips split into three families: **no shadow, or almost none**
(Floating bar and Photo picker: zero levels outside the edge; solarn:
eight), **a single wide, faint layer, barely offset** (Swipe to pay
α .20 σ 60; Pill to button α .15 σ 75; Shelf to card, below), and **two
layers, contact plus ambient, offset to the right and down**, which is
only the reference video. With that, plus the design systems (Material
elevation 24, Comeau's layers) and the known styles (long and hard,
floating, contact, halo, dramatic), the mockup's `Shadows` grid shows
sixteen variants of the same frame with its receipt underneath. The
shadow model grew so it could draw them: each layer has an offset in x
and in y, a color and a spread, and the single diagonal offset from
before is the particular case.

**Two backgrounds per video, and the whole process written down.** New
rule: every video comes out twice, over the measured light background
and over a dark one (`pnpm render:both`). The dark one has no reference
in the vault. The clips that looked dark, Mini player and Hold to
commit, measure white in the corners: that was the phone filling the
frame. So it is the neutral taken down to 11 % with the same tint,
#1C181A, and the shadow stays as it is because black over almost black
cannot be seen; the phone is set apart by the edge of the bezel. And the
whole line, from the probe in the piece to the double render, went into
`mockup/AGENTS.md`, with every mini-decision and its why, plus the
recording probe to copy into `native/AGENTS.md`.

**Both videos go into the exhibition, and the card chooses.** Swipeable
tabs no longer has the slot empty: it carries the light mockup in
`video` and the dark one in `videoDark`, both at 1080² (twice the
detail's slot and then some) through `pnpm piece:video … --dark`. The
card chooses between them with `prefers-color-scheme`, which is the only
thing the exhibition follows (there is no theme switch), with a
`useSyncExternalStore` over `matchMedia` and a `key` per src so the
`<video>` starts from zero when it changes. With no `videoDark`, the
light one goes in both modes.

**The mockup in the exhibition, large and the color of the card.** Two
complaints about the first attempt: the phone looked small inside the
square and the mockup's background was not the exhibition's. I tried
drawing the phone with CSS around the raw recording, the way benji.org
does (his video is the screen alone and the page puts a phone.png over
it; measured: a frame of 4.3 % of the width, the slot's corner at
14.4 %) and it was rejected: "the iPhone mockup should be like it was
before". What stayed: the exhibition carries **its own pair of renders**
of the same mockup, with the background equal to the card's `--surface`
in each theme, the phone at 86 % of the frame (benji: 85 %, measured on
his card) and the camera's way out at 1× so the phone ends up whole and
centered. And the showcase is sized by the HEIGHT of the slot: a raw
recording still falls into 228×448, and the square fills what the box
leaves, 440. Measured in the browser: in light the video decodes to
(248, 248, 246), the exact surface; in dark it decodes to (14, 14, 14)
against the surface's (14, 14, 13), one level of blue that h264's 4:2:0
cannot give (10 through 14 of blue tested: none lands on 13). It cannot
be seen, and a token does not get touched for a codec.

**One background only: the exhibition's.** The pair with the card's
color baked in was not liked either: "let there be only one background,
the one the place the library gives, and no shadow, the way Family does
it". So the exhibition carries **a transparent video with no shadow**
(the phone at 86 % of the frame and the camera ending at 1×) and the
card puts the background in whichever theme it is; the tokens rule, the
video brings no color. It is what Family does on benji.org: the page
puts the background and the phone goes in clean. The alpha travels in
two files because no codec carries it to every browser: WebM VP9 with
alpha for Chrome and Firefox, and HEVC with alpha in .mov for Safari,
which comes out of the ProRes 4444 master with macOS's VideoToolbox
encoder. The card offers them with two `<source>`, the .mov first:
Safari is the only one that opens it, and the other way round it would
take the WebM and draw it over black. With this, `videoDark` and the
color scheme hook went away: there is nothing left to choose by theme.

**Closer, and the zoom's cut on the edge of the box.** With the
transparent video, the mockup's square lived centered in the card's box
with the 40/60 padding around it, and when the camera came in the phone
was cut against that invisible square, 60 px inside the edge of the box:
a cut that came from nothing. Now the video IS the box (560 a side, no
padding) and the cut falls on the edge of the space the exhibition
gives, which is where an eye expects a limit. And the phone goes to 92 %
of the frame, 515 px instead of 378, because the user asked for it
closer. The 228×448 slot is still alive for the card with no video.

**In the exhibition the camera stays.** "Make it all exactly the same
except that once it zooms in, it stays there until the end, so you can
see what I am showing, which is the tabs." So the exhibition's render
comes into the row of tabs and does not come out: `--until` outside the
clip. The video for X keeps the way out measured on the reference. And a
bug that nearly traveled: the ProRes 4444 master was coming out with no
alpha (corner 255, measured) because Remotion needs
`--pixel-format=yuva444p10le` on top of the profile; Safari's .mov would
have had a black background. The script measures it now before going on
and stops if the alpha is not zero.

**The speed, as in Family Values.** Moving the mouse over the video
brings up a button at the top right that toggles 1x and 0.5x and writes
`playbackRate`. It is measured in benji.org's code: 1rem of padding from
the corner, 0.75rem/460, height 1.25rem, pill radius, color #989897,
width 1.75rem at 1x and 2.5rem at 0.5x, the two labels stacked and
crossed by opacity, hover with a #f2f2f2 background, all with
`transition: all .2s ease`. Here the colors are the tokens that already
say the same thing (`--text-secondary` and `--surface-hover`), the type
is nav's (13/460, the smallest in the system) and the motion is
`--dur-surface` with `--ease-surface`. One difference on purpose: in
benji the button is always there; here it is revealed with the mouse
over the video (the user asked for it) and it stays always visible where
there is no hover. The speed is written again on `loadedmetadata`,
because a change of source returns it to 1. Verified in Chrome: 1 → 0.5
→ 1 in `playbackRate`, the width 28 → 40, the label crossed, opacity 0
without the mouse and 1 with it.

**An adjustment to the speed button.** Always visible in the detail, as
in benji; in the exhibition's hub only with the mouse over the video,
because there it is a list and one control per card is noise. No
background and no color change on hover: the label is enough. And the
label is "1x", not "1.0x".

**The quality at 0.5×, measured before touching anything.** "At 0.5 it
looks like bad quality, kind of laggy." In Chrome, with
`getVideoPlaybackQuality`: 240 frames presented in 4 s at 1× and 119 at
0.5×, zero dropped in both cases. That is, the browser loses nothing: at
0.5× it shows 30 unique frames per second because the recording has 60,
and that is a ceiling of the source, not of the codec. I tried raising
it by interpolating to 120 with `minterpolate` and dropped it with
evidence: in the slow drag it leaves ghosts at the edges of the text,
and in the flicks it duplicates whole letters. What does improve the
quality was done: the video goes from 1280² to **1120², which is 1:1
with the 560 box on retina** (each pixel of the video lands on one of
the screen, with no resampling) and decodes 23 % less; the VP9 goes to
an explicit crf 18 and Safari's HEVC goes up from quality 70 to 85
without prioritizing speed. A real 120 would ask for recording at
120 Hz, and the simulator delivers 60.

**The 60 fps, end to end, measured.** Three places where frames could be
lost, and what each one gave:

| where | measurement | result |
| --- | --- | --- |
| the recording | frames written inside each gesture against the duration of the gesture × 60, in three takes | 100.7 %, 101.1 % and 100.2 %: not one is missing. The deltas of 20 to 30 ms between timestamps are jitter from the recorder, not lost frames (if any were missing, completeness would drop) |
| the render | Remotion draws every frame by number, not by clock | by construction, 776 of 776 |
| the browser | `getVideoPlaybackQuality` in Chrome, 4 s at 1× and 4 s at 0.5× | 240 and 119 presented, 0 dropped |

What was left to do was not to fix a loss but to keep it from showing up
when the list grows: a VP9 with alpha decodes in software in Chrome
(there is no hardware path for the alpha), and that is two decodes per
frame. So **the player only plays what can be seen** (it pauses and
resumes with IntersectionObserver, like benji, who mounts his player
only once it is on screen), it preloads everything visible in full, and
it does not round the corners of the transparent video: that was a mask
over a 1120² layer per frame in exchange for changing nothing. If some
weak machine ever drops frames, the next step down is an opaque h264
with the card's color baked in, which decodes in hardware everywhere; it
was dropped for now because the dark one lands one level of blue away
from the surface.

**The notes of the piece, in Josh Puckett's tone.** I read his pages
(Bloom, Pasito, Melt Effect) and benji's Family Values sections. Josh: a
line under the title that says what it is, short sections with plain
titles ("Anatomy", "A note on performance"), two or three sentences
each, "you" when he talks to you, and one part per sentence when he
takes the component apart. Benji writes long essays by principle and the
only thing taken from him is the one-line caption under each demo. The
Swipeable tabs notes go from an essay of five long sections to six
sections of 252 words in total: what it does, anatomy, where the numbers
come from, what I changed on purpose, a note on the recording and trying
it in your hand. The detail's line: "X’s home tabs for Expo. Swipe
between feeds, tap to jump, and the header folds away as you scroll."

**In the list, the video starts with the pointer, as in the vault.** The
whole card is the trigger (pointing only at the video would leave half
the card dead), it comes in with the mouse or with keyboard focus, it
pauses on the way out and resumes where it was, without rewinding; with
reduced-motion it does not start. No autoplay, and `preload="metadata"`
plus the `#t=0.1` fragment, which forces the first frame to be painted
(the vault's trick: at 0 some containers do not have a key frame yet).
The detail keeps autoplay and full preload: it is the piece you came to
see. Verified in Chrome: paused at 0.1 on load, plays with the card
under the pointer, pauses on the way out keeping the time.

**Every name uses precise professional vocabulary.** A rule the user
brought on 2026-09-07 (from another `CLAUDE.md`, in a screenshot), and
it holds for the whole repo: files, scripts, folders, functions,
variables, classes, commits, branches, whatever, with the word an IBM
engineer would have written in a specification in 1972. No jargon, no
casual abbreviations, no funny or clever names, no words from the chat.
`deploy_dashboards.sh`, not `push_dashboards.sh`, and that is an
illustration, not the scope. It lives in `AGENTS.md › Working method`
and as the fifth point of `CLAUDE.md`. It was applied first to the
public text: the description of Swipeable tabs says "collapses" where it
said "folds away", and the parts of the anatomy are called "Header",
"Tab bar", "Pager" and "Page", not "the fold".

**The anatomy, in named parts, like josh in /bloom.** The single
paragraph of "Anatomy" mixed four things in six sentences and the user
asked for it to be explained "the way benji taylor or josh puckett would
do it, nice and simple" (2026-09-07). Measured on /bloom (API Reference,
on the served page): each part is an `h3` with the name (16/500/24, the
title's ink) and, 8 px below, a paragraph of one or two sentences
(16/400/24, gray); the parts sit 64 from one another ("Container: The
morphing element. Automatically sizes to fit the trigger content, then
animates to the menu dimensions"). In /drawesome benji does the same in
prose: he lists the tools and then tells what each one does ("Each pen
behaves like the thing it's named after"). Here it is a Part component
in `src/notes.tsx`: the name in `--type-h3` (14/500, the piece title:
same role, a short name heading something), the paragraph in body and in
ink like all the prose, 8 from name to paragraph (a --note-part-gap
token) and between parts the paragraph gap (20; josh's 64 is his section
gap and that one here is already `--section-gap`), chosen by looking.
Four parts from top to bottom (Header, Tab bar, Pager, Page), each one
with what it is and then what it does, in two to four sentences and with
no adjectives; the sentence about the row that only moves when the tab
does not fit went from Performance to Tab bar, because it is behavior
and not performance. Every claim comes out of the piece's code and its
receipts: the block that moves whole, the stateless bar that draws from
a single value, the tap that moves the content one page only, the haptic
per tab change, the 1:1 collapse until the divider touches the status
bar.

**The anatomy goes back to being prose: the subhead per part was
rejected.** With the page served the user said "I don't like this
structure" (2026-09-07) about the four h3s (Header, Tab bar, Pager,
Page). The Part component, its CSS rules and the --note-part-gap token
were withdrawn; the content of that round stayed, in three paragraphs
that name each part in passing (which parts there are and how they form
a block; how the bar and the pager share a single value; how the list's
scroll collapses the header) with benji's "How it works" in /liveline as
the model of form: running prose of short sentences ("One <canvas>, one
requestAnimationFrame loop. When a new value arrives, nothing jumps.").
It is noted in `src/notes.tsx` so that nobody proposes the h3 again.

**The description line and the title, under the naming rule.** The user
asked to use the same rule "for the description and for the titles"
(2026-09-07). The line goes from "Swipe between feeds, tap to jump" to
"Swipe between tabs, tap to select one": the pages are tabs (two feeds
and four topics), and "select" is the specification verb where "jump"
was the colloquial one. Audited against the rule and unchanged: the
title Swipeable tabs (the SDKs' term: `Swipeable` in gesture-handler,
"swipe" in the HIG), the masthead `Interface exhibition`, the labels
`Web` and `App`, and the notes' titles `Anatomy`, `Performance` and
`Use cases`. `AGENTS.md › How a piece is named` writes it down for the
pieces to come.

**Anatomy talks only about the animation the piece is named after.** The
user, with the prose on screen: "in anatomy talk only about the tabs
animation, not the other things" (2026-09-07). The header that
collapses, the lists and the avatar left the section (they are still in
the recording and in the description line) and two paragraphs about the
tabs stayed, plus the closing about the measurement: the row of labels
with its underline over a paged ScrollView, the stateless bar that draws
the underline, the label colors and the symbols from a single value; the
drag as native scroll with the iOS curve, the tap in 300 ms that moves
the content one page only, the tab that grows for its symbol while the
neighboring labels move aside, the row that only moves when the next
tab does not fit, and the haptic per change. It is the rule for the
notes to come and it is written in `src/notes.tsx`: the section takes
the animation apart, not the screen.

**The description line does not name the app; the reference is told in
Anatomy.** "In the main description don't put X's tabs, mention it while
explaining the process or in anatomy, that the reference was taken from
there" (2026-09-07). The line ends up as "A tab bar with paged content,
for Expo. Swipe between tabs, tap to select one, and the header
collapses as you scroll.", what it is and what it does, like the title,
which does not name the app either. And the closing of Anatomy says
where it came from and how it was measured: "The reference is the home
tabs of X on iOS. Every value is measured from there: four recordings at
60 fps, read frame by frame, each number next to its receipt in the
code." Written in `AGENTS.md › How a piece is named` for the pieces to
come.

**Anatomy and the line, written for someone who has just seen the
video.** The user, with the previous version on screen: "say React
Native, not Reanimated, people don't usually say that, and I don't like
anatomy and the description all that much, I don't feel they're useful"
(2026-09-07). What was useless was the point of view: they told the
implementation (a derived value, the pager handing a segment to the bar,
worklets) to someone who saw twelve seconds of video and wants to know
what they looked at and what it is made with. Now the line says what it
is and the three details to look at ("Top tabs for React Native. The
underline follows the drag, the active tab widens to show its symbol,
and a tap moves the content one page, however far the tab is."), and it
stopped mentioning the header that collapses, which the recording does
not show. Anatomy goes from what you see to the how: the underline bound
to the scroll, which goes with the content and stops with it; the tap
that activates the tab in 300 ms, widens it for its symbol, moves the
other labels aside and crosses a single page; the row that only moves
when the tab does not fit; the haptic per change; what it is made with
(SF Symbols, Expo's haptics) and where it came from (X on iOS, four
recordings at 60 fps). Performance says the same as before in plain
words: "on the UI thread, not in JavaScript", without naming the
library. The three rules (from what you see, only the animation the
piece is named after, no library names) are in `src/notes.tsx` and in
`AGENTS.md › How a piece is named`.

**The line, much shorter.** "Much, much shorter, this one" (user,
2026-09-07) about the three-detail line. It ends up as "Top tabs for
React Native. The underline follows the drag.": what it is and the
detail you see first; the other two, the tab that widens and the tap
that crosses a single page, are already in Anatomy and there they stay.
It is josh's measure: one line under the title ("A tiny,
fully-themeable, and dependency-free fluid stepper component"). Rule in
`AGENTS.md › How a piece is named`: what it is and one detail, one line.

**The line, only what it is and for which platform.** "Make it tabs,
React Native, Expo, well written" (user, 2026-09-07). It ends up as "Top
tabs for React Native and Expo.": React Navigation's term for this bar,
and the two platforms as the ecosystem names them ("React Native &
Expo"). The underline detail the previous version carried is in the
first sentence of Anatomy and it was not needed twice. Rule in
`AGENTS.md › How a piece is named`.

**"&" in the line, not "and".** The user's request (2026-09-07). It ends
up as "Top tabs for React Native & Expo.", which is how the ecosystem
writes the pair. The "for" stayed: it is the preposition of both
references in their line under the title ("a drawing toolbar for React",
benji, /drawesome; "a real-time animated line chart component for
React", benji, /liveline; "An iOS inspired pull down menu for the web",
josh, /bloom), read on their served pages the same day.

**Anatomy lists the motion rules the piece meets, and only those.** The
user's request (2026-09-07): "spell out rules that follow /animate-expo
and /interface-craft and /better-ui if the code meets them", and not to
say where the symbols come from. The code was audited against the three
skills before a word was written; eight rules came in with a receipt in
file and line (the detail is at the top of
`src/components/pieces/swipeable-tabs/notes.tsx`): only transform and
opacity, with the underline as the only animated width and inside the
exception (an absolute child with no children); the gesture interrupts
the animation; ease-out, never ease-in; one haptic per action, on the
frame of the change and never as the only signal; reduced motion in the
animation itself; 120 fps enabled on ProMotion (SOURCE, `app.json`);
every value a constant with its source and a single value driving the
transition; movement never as the only signal. One thing was left out on
purpose, animate-expo's gate "tab switches never slide": the piece
slides because the reference slides, measured frame by frame, and the
rule is aimed at the tabs at the bottom. In the public text the rules do
not carry the skills' names (they are local files the reader does not
know) but "the library's rules for motion"; the attribution lives in the
file's comment.

**The rules, with no sentence to announce them.** "It follows the
library's rules for motion" was rejected ("I don't like this sentence",
2026-09-07). The paragraph starts with the first rule ("Only transform
and opacity animate") like benji's "How it works", which does not
announce either: it says.

**A writing pass over the public text, with `better-writing` and the
vocabulary rule.** The user's request (2026-09-07): "check that
everything respects the '73 IBM engineer vocabulary rule, and improve
the writing a bit the way benji or josh would; look at better-writing".
What fell: the idioms ("mid-flight", "tied to", "runs ahead or lags
behind", "in step", "cue") go to the specification word ("in progress",
"bound to", "synchronized", "feedback"); "absolute element" to
"absolutely positioned"; "ProMotion screens" to "ProMotion displays", as
Apple calls them; "first-level filters" to "top-level sections"; "React
never renders a frame" to "React does not render"; the measurement said
plainly ("the recording holds 60 fps through every gesture"); and a
sentence that was in Anatomy and in Performance stayed only where it
explains something. The complete list of changes is at the top of
`src/components/pieces/swipeable-tabs/notes.tsx`.

**Performance, with Anatomy's method.** The user's request (2026-09-07):
improve it "following all the same rules of better-ui, animate-expo,
interface-craft, today's rule and better-writing". Every claim was
verified in the code before writing it and it came out in three
paragraphs, from what you notice towards the how: (1) everything on the
UI thread and no trip back to JavaScript per frame, only at the start or
the end of an action, locking and releasing the pager on a distant tap,
and the haptic; (2) zero layout while the content moves, since the row
is not a flex row and the positions and widths of each resting state are
computed once and each frame interpolates between two, plus the memoized
pages with the measurement of the stutter they avoid; (3) a single value
from which the underline, the labels and the symbols derive in the same
frame, and what was measured: 60 fps in every gesture and a trace of 492
frames with no flicker. No library name; "moves as one object" is
better-ui's cohesion rule said plainly. The receipts, file and symbol,
are at the top of `src/components/pieces/swipeable-tabs/notes.tsx`.

**Truth check of Performance and Anatomy.** The user's request
(2026-09-07): "check that all that information is true and correct".
Every claim was re-read against the code and the measurement tables;
three were imprecise and were corrected in the public text: a drag only
interrupts a tap to the neighboring tab, because a distant tap locks
the pager for as long as it lasts; React does not render during the
DRAG, but a distant tap renders twice and the drag's haptic falls in the
middle of the gesture, so the sentence says "during a drag" and
"discrete moments"; and the measured stutter is a whole frame lost, not
a second frame that "catches up" (it jumped 0.195 where the ease asked
for 0.252). A fourth was adjusted in scope: "no layout runs" is for the
tabs, because the underline's width is layout of its own node.
Everything else was confirmed with its receipt: the row moves from a
worklet, the precomputed layout depends only on the measured labels, the
pages are memoized, completeness was 100.7 %, 101.1 % and 100.2 %, and
the trace of 492 frames is the one in `swipeable-tabs-screen.tsx`.

**The finger interrupts a distant tap too.** From the audit against the
skills (2026-09-07) one single rule came out against: `animate-expo`
puts interruption as the floor, and the pager rejected the finger during
the 300 ms of a tap to two or more tabs away (`scrollEnabled={!still}`),
because of the borrowed page. The user chose to meet it without touching
the tap's animation, so as not to record again: the recording has a
single distant tap (Stocks → For you at 4.1 s) and the next gesture
starts at 5.1 s, so not one frame changes. How: the loan stays alive
while the finger drags, with the tab bar still going from the segment's
`d` to its `h` with the progress read off the scroll, and it is given
back only when it cannot be seen, on arriving at the target or on
stopping over the borrowed page, jumping in the same frame to its real
place with the haptic of that jump silenced. A new tap over a loan that
has not settled settles it first. The still state went away: the pager
no longer has React state, and the pages stay memoized against any
render of the parent. The corner that is left: dragging backwards past
the borrowed page inside those 300 ms shows the empty place it came
from; it fixes itself on release. NO RECEIPT on screen: you test it on
the phone by tapping far away and dragging right afterwards, in both
directions. The public notes were updated: "A drag interrupts a tap at
any point, however far the tab is" and "React does not render during a
gesture or a tap".

**The procedure for the line and the notes is written down.** The user's
request (2026-09-07): keep the whole process for the pieces to come. It
is in `AGENTS.md › What applies to both › How the line and the notes are
written`, in nine steps: for whom, the form, the tone, the vocabulary,
the motion rules, the writing, the truthfulness, the verification on
screen and the record. Each step comes out of a round from today and
from what was rejected in it. In the same pass, the second re-reading of
Anatomy and Performance left three precisions: the underline in a tap
does carry its own animation, with the same config as the content ("a
tap moves both with the same timing"); the haptic is one per tab
CROSSING, not one per action, since going and coming back over the same
boundary in one gesture vibrates each time, the way the label changes (a
drag does not get to cross two tabs: the second crossing is a screen and
a half of finger travel away, and with paging the momentum only reaches
the neighboring page); and "JavaScript takes part only twice" read as a
count ("at two moments only").

**A correction to an example of mine.** Explaining the above I said that
"a three-tab drag vibrates three times". It cannot happen, and the user
pointed it out (2026-09-07): the haptic's reaction did not change all
day, it vibrates when `Math.round(progress)` changes and there is no tap
in progress, the same as always, and one gesture crosses at most one
boundary going forward. What does vibrate more than once is going and
coming back over the same boundary without letting go, one per crossing,
exactly the way the active label changes.

**The paragraph of rules, split in two.** It had seven sentences and the
form `AGENTS.md` fixes asks for two to four per paragraph, like josh,
who never goes past three. Anatomy ends up in five paragraphs: what it
is and the underline; the tap; what animates and how (properties,
underline, interruption, curve); what goes with it (haptic, reduced
motion, 120 fps, constants with a source); the reference. The user's
request (2026-09-07), after the final audit against the skills.

**No description line: the title is enough.** "Delete this description,
let there be nothing there, the one above already says swipeable tabs"
(user, 2026-09-07), about "Top tabs for React Native & Expo.". The line
becomes OPTIONAL in the model (`desc?` in `pieces.ts`); with no line the
detail does not draw the paragraph, because drawing it empty would leave
its 24 px of margin, and the notes go straight on to the preview with
the usual section air. Publishing still accepts a description, but if it
comes in empty it does not write the field. The rules for when there is
a line are in `AGENTS.md › How a piece is named`, with the new first
rule: if the title already says what it is, there is no line.

**The notes' section label rendered 12 px lower than the list's.** The
user's question (2026-09-07): "is the distance between the component and
the Anatomy line right?". Measured on the served page: 76 from the
preview to the label where `--section-gap` says 64, and 53 from the line
to the first text where `--section-content-gap` says 40. The cause: in
the list the label is a `div`; in the notes, `Section` draws it as an
`h2`, and the browser gives it 0.83em of margin above and below that
`.groupLabel` was not resetting. Josh uses the same 64 from a demo to
the next title (measured on /bloom the same day). Fix: `margin: 0` in
`.groupLabel`; the list does not change. Verified afterwards: 64, 40 and
64 between sections.

**From the preview to the notes, benji's 112.** "Shouldn't it be 40
then? What does benji use in our case?" (user, 2026-09-07). It is not
40, which is from the line to the first text, nor 64, which is from
prose to separator. Measured on /liveline on the served page: after a
demo benji leaves 112 up to the separator's line, in the ten sections
that end in a demo, with a caption or without one; after prose, 64. And
112 = 48 + 64, his gap under a piece plus the section one. Here it goes
with the same two tokens: `.detailPreview + .notes` adds `--piece-gap`
(48) and the first section puts in its 64. Only when the notes follow
straight after the preview: with a description line it is prose that
comes before, and there the 64 stays.

**Use cases, with the same rules as Anatomy.** The user's request
(2026-09-07): "the use cases part is missing, a better explanation,
following all the rules". Three paragraphs, in the HIG's vocabulary:
when yes, sections of the same rank, each one a list, more of them than
fit in a segmented control, switched so often that the swipe has to be
worth as much as the tap, with X as the model; the examples, lists with
more than one first-level cut; and when not, hierarchy, two to four
options, the app's sections; plus the condition of the short labels,
which comes out of the piece. The user is thinking of adding a video per
case: they will go with a one-line caption, like benji's in /liveline,
and the section is prose until then.

**The notes' wrap, with better-typography.** "Are good wrap rules being
used?" (user, 2026-09-07). Measured in production: the paragraphs went
with `text-wrap: wrap` and the first one of Performance ended in
"frame." alone on its line; and number and unit ("300 ms", "60 fps",
"120 fps", "492 frames") went with a normal space, not falling on a
break yet but one text change away from splitting. Fix: `text-wrap:
pretty` in `.notes p` and in `.detailDesc`, since the rule is for
descriptions and not for long text, and a non-breaking space between
number and unit in the note. What departs from the guide and stays,
because of the reference: the measure (80 to 84 characters per line; the
guide asks for 60 to 75, but benji gives 85 and josh 80, and the 560
column was chosen between the two) and the leading (20/14 = 1.43; the
guide prefers 1.5, and it is benji's 14/20, measured). Fine and
unchanged: `lang="en"`, antialiasing at the root, weight 460,
typographic apostrophes, labels with `nowrap`.

**"Two to five", not "two to four".** Re-reading Use cases with the HIG
in view (2026-09-07, the user's question: "did it come out right and
real?"): Apple says "no more than about five segments on iPhone" for a
segmented control, so the text said one less. Corrected, and the
quotation stayed in the note's comment along with the one about tab bars
("A tab bar lets people navigate between top-level sections of your
app"), which holds up the other half of the paragraph.

**Performance, re-read the way a senior engineer would read it.** The
user's request (2026-09-07). Four precisions: "not in JavaScript"
becomes "not the JavaScript thread", because worklets are JavaScript
too; it says that the scroll is native, which is the main reason the
gesture costs nothing; the memoization is told by its cost, six lists of
twelve rows, mounted from the start so that a swipe never mounts a list
in the middle of the gesture, and not as history; and the "one derived
value" with its mechanism: no style can read part of the previous
frame's transition. The measurement says where: on the phone, 60 fps in
every gesture, measured by the user; the completeness of the simulator's
recording stays as the receipt of the take. The piece's comment said
"seven pages" from when there was one tab more: six.

**Use cases said in Apple's words.** The user's request (2026-09-08):
"in use cases use what Apple resources would put". The three HIG pages
were read served that day through the documentation API
(`developer.apple.com/tutorials/data/design/human-interface-guidelines/<slug>.json`,
because the HTML page is built with JavaScript and `curl` and WebFetch
only return the title), and every sentence of the text was tied to its
quotation in the note's comment. What changed: "sections of the same
rank" becomes "closely related lists", which is Apple's word; the rule
that was missing comes in, "Panes are mutually exclusive, so ensure
they're fully self-contained", said plainly ("what happens in one does
not change what the others show"); "two to five options" becomes "About
five lists or fewer", keeping Apple's "about", which is not a hard cap;
and "labels have to stay short" stops leaning only on the piece, because
a tab bar ("Use single words whenever possible") and a segmented control
("Use nouns or noun phrases") ask for the same thing.

A vocabulary collision that had been there from the start was fixed too:
the second paragraph said "more than one top-level division" and the
third one sent "the app's own sections" to the tab bar. Apple reserves
"top-level" for the tab bar, so the second paragraph now says "wherever
one section of an app holds several lists of equal standing", which is
also truer, because in X these tabs live inside a section, not at the
top level.

And a fourth paragraph at the close, short like the reference one in
Anatomy: "On the Mac, Apple's guidelines call this a tab view […]. There
is no tab view on iPhone, and for the same job the guidelines point to a
segmented control." It corrects what I told the user on 2026-09-07 ("in
Apple's vocabulary ours is a tab view"): that holds for macOS, which was
the screenshot he sent, but the tab views page itself says "Not
supported in iOS, iPadOS, tvOS, or visionOS" and points to a segmented
control, which caps at five. That gap is the reason for the piece. "Avoid
providing more than six tabs in a tab view" was not quoted, even though
X has six: it is macOS guidance and using it for iPhone would be
stretching it.

**Second `better-writing` pass, over the three sections.** Same request
(2026-09-08): "check that everything meets /better-writing". The rule
that found everything was "one voice": a single name per thing across
the whole page. "The bar" becomes "the row" in Performance, since the
row was "row" in Anatomy and in Use cases and "bar" only there, the
file's internal name (`tab-bar.tsx`) leaking into the public text; "the
chosen tab doesn't fit" becomes "the active tab does not fit", which
fixes two things at once, "chosen" and "active" for the same thing in
the same paragraph and the only contraction on the page; and "its offset
is read" becomes "the scroll offset is read", because the nearest "its"
pointed at "deceleration". Reviewed and not changed: "however far the
tab is" repeats two paragraphs apart in Anatomy, but the two clauses say
different things and deleting either one loses a claim that cost a code
change. Verified on the served page: twelve paragraphs, none ends with
fewer than three words on its last line, and the measure stays between
77 and 86 characters.

**The label color animates too, and the text denied it.** Re-reading the
three sections against the code at the user's request (2026-09-08: "are
all the descriptions right?"), the inventory of the piece's thirteen
`useAnimatedStyle` gave transform ×6, opacity ×5, width ×1 (the
underline) and **color ×1** (`labelStyle` in `tab-bar.tsx`, applied to
the label). So "Only transform and opacity animate" was false, and false
right on the piece's own finding: the active label is not thicker, it is
whiter. Now it says "Only transform, opacity and the label color
animate".

**The code does not change, and the question was answered by measuring
the skill, not from memory.** The user asked first about taking the
color out ("make only transform and opacity animate, which is what
/animate-expo recommends I think, check it") and then about the
substance of it ("but is color a good practice?"). `animate-expo` does
not ask for that: its § 4 and the *Never Ship* table list **layout**
properties, width, height, margin, padding, flex, top, gap, the ones
that re-run Yoga, and `color` is in neither of the two; it is there as a
use case in § 3 ("press, toggle, color, a value flipping") and in § 9 as
what has to be **kept** under reduced motion ("keep opacity and color
changes that explain a state change"). Color is not free either, since
transform and opacity are compositing and color is paint and with text
it re-rasterizes the glyphs, but the standard way out for that, the one
the skill itself prescribes for Android's shadows and for blur, is to
stack two static layers and cross opacities: here, a gray label and a
white one. That would break the measurement, because two antialiased
texts on top of each other add coverage at the edge of every glyph and
read thicker in the middle of the cross, exactly what X does not do (the
stem of the same letter measures 5.03 px in both states). It would trade
a cost you do not notice for an artifact you do. And the cost is
bounded: six short labels, only while a transition lasts, 60 fps
measured on the phone and the trace of 492 frames with no flicker.

The other two the same re-reading found were left uncorrected, by the
user's decision: "four recordings at 60 fps" counts short (the record
says the vault clip **and then** four recordings of his own: that is
five), and "The row scrolls only when the active tab does not fit on
screen" is true of what the piece does on its own but leaves out that
the row is a `ScrollView` that gets dragged with the finger
(`onBeginDrag` gives it back to the user: "the finger on the row always
wins").

**The three sections, 17 % shorter, with the same claims.** The user's
request (2026-09-08): "now that everything is there, using good
practices, leave it all much more concise, keep respecting the '73 IBM
engineer language thing and /better-writing". From 703 to 583 words, the
same twelve paragraphs, not one claim fewer: it is `better-writing`'s
rule "delete every word that does no work" applied word by word, not a
cut of content.

Three kinds of cut. **Internal redundancy**: "one value that describes
the whole transition […] It is one derived value" said the same thing
twice; "not the JavaScript thread […] at two moments only […] Never per
frame" were three forms of one idea; "always agree, and the row moves as
one object", two. **Redundancy between sections**: "the row scrolls only
when a tab does not fit" was in Anatomy and in Use cases, and stays in
Anatomy; "however far the tab is" was in two paragraphs of Anatomy and
stays in the one that needs it. **Periphrasis replaced by the verb**:
"Tap a tab and it becomes the active one" → "A tap makes a tab active";
"When one did, the recording showed the first frame after a tap standing
still" → "Unmemoized, the first frame after a tap stood still"; "several
lists of equal standing" → "several peer lists", which is
`animate-expo`'s term ("peers, not a hierarchy") and hooks into the next
paragraph's hierarchy; "so the drag and its deceleration run natively" →
"the system runs the drag and its deceleration", which also says who.

And the cut fixed one of the two imprecisions that had been left open on
its own: the close of Anatomy said "from four recordings at 60 fps" and
now says "at 60 fps". The record says the vault clip **and then** four
recordings by the user, five, so "four" counted short. The other one is
still open, "The row scrolls only when the active tab does not fit on
screen", which leaves out that the row gets dragged with the finger.

**No dash in the public text.** The user's request (2026-09-08): "don't
use the dash". The concision pass had put in two em dashes, both in
Performance, and both came out without losing anything. "React does not
render during a gesture or a tap [dash] the JavaScript thread takes part
only at the tap and at the haptic" was split into two sentences, which
is plainer and one word shorter as well; and "stood still [dash] a whole
frame lost" becomes a colon, which is the mark already doing that job in
the other eleven paragraphs. Compound-word hyphens stay (ease-out,
ease-in, six-page, top-level). The rule went into `AGENTS.md › How the
line and the notes are written`, step 6, for every piece; it holds for
the public text and not for the comments in Spanish, where the dash is
normal punctuation.

**The HIG explains, it does not authorize, and it is not named.** The
user's request (2026-09-08), after reading the close of Use cases:
"don't mention Apple guidelines and that part is wrong, use them but to
explain something better, not to say something that isn't so". The
fourth paragraph was deleted whole. It said: "On the Mac, Apple's
guidelines call this a tab view: mutually exclusive panes of content in
one area, switched with a row of tabs. There is no tab view on iPhone;
for the same job the guidelines point to a segmented control." It lived
a few hours, and it was wrong in two ways.

**"There is no tab view on iPhone" is false for anyone who writes
code.** The HIG's "Not supported in iOS" talks about the macOS design
component, the box with tabs along the top; but `TabView` exists in
SwiftUI on iOS, it is the tab bar's container, and with
`.tabViewStyle(.page)` it is literally a pager that swipes, that is, the
closest thing in the system to this piece.

**And "for the same job the guidelines point to a segmented control"
contradicted the paragraph above it**, which says a segmented control is
for five lists or fewer. The two of them together claimed that this
piece ought to be a segmented control, which is the opposite of what the
whole section argues.

What the paragraph was trying to add, that the pattern lives between a
segmented control and a tab bar, the third paragraph already says
without naming anyone. The guide's concepts and numbers stay where they
are useful, said plainly as our own, with the quotation in the file's
comment: "closely related", the self-contained panes, "about five",
"top-level sections", the short labels. The word "Apple" no longer
appears in the public text. The rule went into `AGENTS.md`, step 4: if a
sentence needs the name of whoever wrote the guide to stand up, the
claim does not stand on its own.

**Audit of what travels with the repo.** The user's question
(2026-09-08), closing Swipeable tabs: "is the whole process documented
for future agents with other components?". What was learned with this
piece was crossed against what is written in versioned files, and four
gaps appeared, all of them things that lived only in the log or in the
agent's memory, which belongs to this machine and does not travel. All
four were closed:

- **`AGENTS.md`, step 6**, the `better-writing` rule that finds the most
  here and that no reading by section detects: **one name per thing
  across the whole page**. With this piece's three concrete failures as
  the example, plus how to decide who "you" is.
- **`AGENTS.md`, step 6**, the **concision pass at the end**: when it is
  done, what it always finds and in what order, and that the on-screen
  verification has to be run again because the wrap changed.
- **`AGENTS.md`, step 7**, the re-reading of `Performance` **"like a
  senior engineer"**, with the four imprecisions typical of a template:
  the JavaScript thread, saying what the system does, telling an
  optimization by its cost, and saying where it was measured.
- **`native/AGENTS.md`**, the tenth thing that bites: **`SymbolView`'s
  `size` is not a `pointSize`**. It was in three comments of
  `tab-bar.tsx` and nowhere that someone starting a different piece
  would find it.

**What still does not travel, and that is on purpose:** the sheets in
`.context/recon/` are gitignored. The mitigation was already written and
it was confirmed: the receipt of every number also lives next to the
number in `measurements.ts`, and the conclusions of each recon live in
the `AGENTS.md` that corresponds. An agent who clones the repo has the
whys, not the raw pixels.

**The open items closed, and one closed by saying no.** The user's
request (2026-09-08): "fix everything so I can file you away".

- **silence becomes `hapticSuppressed`** (`swipeable-tabs.tsx`, four
  uses). It was the only word in the new code that did not pass the
  repo's naming rule: a metaphor instead of a specification.
- **"The row scrolls only when the active tab does not fit" becomes "The
  row moves on its own only when the active tab does not fit."** It was
  true of what the piece does on its own, but the row is a `ScrollView`
  and it gets dragged with the finger: the code gives it back to the
  user explicitly (`onBeginDrag`, "the finger on the row always wins").
  The "only" was excluding something that exists. One word more, and it
  stops saying too much.
- **The sheet is annotated**: the two tables measured with seven tabs
  now carry the note that today there are six and why "Sports" came out.
  The numbers were not touched; they are the record of what was measured
  that day.

**And reduce motion was NOT changed, which is what I myself had
proposed.** Studying it seriously, `animate-expo`'s § 9 rule ("fewer and
gentler, not zero: keep opacity and color changes… drop translation")
does not apply here, for two reasons. Meeting it asks for TWO progress
values, one that jumps the position and another that animates the color,
which under normal motion have to be identical, and that is exactly the
trap documented as the ninth thing that bites in `native/AGENTS.md` and
the measured cause of the symbols' flicker; on top of that the sentence
in Performance would stop being true. And there is nothing to explain:
the rule exists for when taking the movement out leaves a state change
with no explanation, and here the state is told by static properties,
the white label, the underline below, the new page, all of them visible
in the jump. An instant tab change under reduced motion is the correct
behavior, not a debt. The whole reasoning went above `CFG`, with the
way out in case it ever gets revisited: split `Segment` in two, and
measure it on the phone with the setting turned on, not reason about it.

## Buttons separate: the Spotlight of macOS Tahoe, the first Web piece

**On 2026-09-09** the first piece that runs live in the browser came in:
`src/components/pieces/buttons-separate/buttons-separate.tsx`, with no `desc` and no video. The reference
is `VAULT_DIR/web/Buttons separate.mp4`, the Spotlight of **macOS 26
Tahoe**, a screen recording of my own, and it was measured on the
original at 3420×2214 and 60 fps, reading raw pixels (ffmpeg → rgb24 →
Python). The scripts and the whole table are in
`.context/buttons-separate/`, which does not travel; the conclusions are
here and at the top of the file.

**The scale of the reference: 2 physical pixels per point.** The logical
panel is 1710×1107. Verified with the menu bar: the ascender of the
13 pt type measures 20 px, and for SF Pro that is 2.05 px/pt. Without
this number none of the measurements below mean a thing.

**And the recording is VFR.** The container declares 60 fps and carries
535 frames for 9.61 s; 22 steps are 33 ms and one is 350. Decoded to a
constant 60 it gives 577 and the index IS the time. The trap: ffmpeg's
`select` counts frames of the SOURCE, so an `eq(n,120)` does not land in
the same place as index 120 of the array. You have to transcode to CFR
before pulling strips.

| Decision | Value | Source |
| --- | --- | --- |
| **Fused is ONE pill**, not four circles stuck together | a capsule of 640 × 56 | RUNTIME: the height profile gives a constant 56.0 from x=880 to x=1140, without a single dip between buttons. With circles fused by a goo there would be scalloping |
| **The first button does not move** | the four fan out from the first slot; what opens is the STEP, from 0 to 64 | RUNTIME: the left edge of the first one is at 929 from frame 92 and it is still there at rest. And with the four sitting in their slot the right end could not go below 1175, and it goes down to 1010 |
| **They are two springs** | field 365 ms / bounce 0.38; fan 532 ms / bounce 0.32, 42 ms later | RUNTIME: least squares over the step response of a second order oscillator, 1.57 and 1.42 pt of error over 64 frames. The two clean cycles of the video give the same thing on their own |
| ↳ 365 and not 395 | the fit with a free offset gives 395 ms and 0.58 pt | that fit eats a t0 of -8 ms: frame 80 is the first one where the edge HAS already moved, not the instant it started. In the piece the spring starts when the pointer comes in, so you have to fit with that model in place |
| The geometry | field 384 × 56 (radius 28), button 54, gap 10, step 64, set 640 × 56 | RUNTIME with subpixel over frame 150: the field measures 55.93 and the buttons 53.95, the five centered at y = 292.76 |
| ↳ on screen, times 5/7 | height 40, field 276, button 38, gap 7, step 45, total 456 | 640 raw do not fit in the card of 544, and shrinking only the width breaks the proportion that makes this read as a control |
| **The goo** | blur σ = 4.7 px and threshold at alpha 0.5 | RUNTIME: two centers 61 pt apart give a neck 25 pt tall, and with the blur plus threshold model (neck = 2√((r+0.674σ)² - d²/4)) that is σ ≈ 6.6 pt of the reference. The bridge breaks at a gap of ~9 and at rest the gap is 10 |
| ↳ why not a fillet of constant radius | to give that neck it needs k ≈ 9, and with that k the bridge would hold up to a gap of 16 | the reference breaks it at 9 |
| The material | a fill that raises the background by ~120 levels, a **1 pt** ring at +40 and a contact shadow of ~3 pt, symmetric | RUNTIME, radial samples over the fourth button: fill rgb(178,197,230) almost constant, edge rgb(218,241,255) the same in all four orientations, and outside it the background by 0.62 to 0.9 |
| ↳ the blur is BIG | over the light cloud the glass comes out almost neutral | rgb(186,152,137) behind → rgb(219,217,228) in front: the glass does not show what is right behind it but the average of a neighborhood as wide as the cloud |
| One single ink for text, magnifier and glyphs | rgb(46,68,97) | RUNTIME: placeholder (47,69,99), magnifier (48,69,97), glyph (44,65,95). There is no separate placeholder gray |
| The trigger is the **hover** | the user's request, 2026-09-09 | and the recording does not say otherwise: the pointer never goes up to the bar, it stops 200 pt below, and the three waits between opening and separating are 733, 217 and 933 ms. There is no fixed delay to copy |

**The glass is not a `backdrop-filter`.** It is a second copy of the same
background, blurred once, with the goo's mask on top. Three reasons: the
reference's blur is enormous and `backdrop-filter` with an SVG mask is
not guaranteed in every engine; the background here is ours, so copying
it is exact; and it comes out cheaper, because the blurred layer never
changes and the only thing that moves is the mask. The two copies are
drawn over the SAME box, grown by 96 px on each side: a blur eats the
edge of its own layer, and if they ended where the scene ends, the left
half of the glass would show the fade instead of the background.

**A `<mask>` and a `<filter>` with the same id are a duplicate id.** It
cost an hour: `url(#halo-…)` resolved to the filter and the whole layer
came out white, without an error anywhere. The masks carry a `mask-`
prefix. And a mask referenced from CSS needs explicit `x`, `y`, `width`
and `height`: the default values resolve against the `<svg>` of the
definitions, which measures zero, and the mask comes out empty.

**`motion` left the bundle.** The piece used `useSpring` and brought in
14 compressed kilobytes of library to move two numbers; in production it
was its only reader (the other one is in `src/private/`, which does not
reach the build). In its place there is a semi-implicit Euler integrator
with a fixed substep of 1/240 s, 40 lines, with the cap of 50 ms for
when the tab comes back from the background. The chunk went from 36.8 kB
to 13.6 (13.95 → 5.26 compressed), and the interruption comes for free:
going in and out fast with the pointer only changes the target, and the
position and the velocity stay the ones there were.

**Verified against the reference with the piece running.** The right
edge of the set was sampled frame by frame and compared against the same
trace from the video: **4.95 pt of root mean square error and 18.7 of
maximum over the first second**, with no latency to discount. The
maximum falls at the minimum of the curve, which is where the video
measurement is least reliable, because that is where the goo widens the
silhouette.

**Correction of 2026-09-09.** This paragraph said 2.35 pt. The probe
modeled the edge of the button at r = 19.58, the compensated radius the
goo had, when what is drawn measures 19; with the sharp shapes on top,
the model and what is drawn coincide and the honest number is 4.95. What
moves did not change: the probe changed.

**Frames:** 62 in one second, median 16.7 ms, none above 20, with the
processor four times slower and two copies of the piece on the page
(Chrome, 2026-09-09).

**The exit is not the entrance in reverse** (2026-09-09, Vito: "the exit
above all, it does not convince me"). Posing the close frame by frame in
seven instances at once, you see the three failures, and none of them is
visible by reasoning about it: the buttons touch when the step drops
below 38, the diameter, at ~55 ms, and with the segment of 300 ms the
icons were still worth **0.28 at 120**, that is, four glyphs stacked on
top of the field; the field went **14 px** past its resting length at
300 ms, a bounce that is measured but in the CONTRACTION of the opening
and that has no cause when closing; and it lasted the same as the
entrance, against the rule that the exit runs a quarter shorter. Now the
close has a set of its own: field 280 ms with no bounce, fan 400 with
0.1, icons 110. It ends in ~300 ms. **The entrance was not touched**: it
is still the measured one.

**The press now presses.** It scaled only the `<svg>` to 0.94 and it
read as "the icon got smaller". Now it shrinks the **circle of the mask**
in the same frame loop, with a spring of its own per button, so the
whole glass sinks; and at 0.96, because under 0.95 it looks exaggerated.
Verified by reading the attribute: the radius goes from 19 to 18.24 and
comes back.

**The frames, measured with the worst case that can really happen.** In
Chrome, with the processor **twenty times** slower and **eight copies**
of the piece on the page: scrolling drops 1 of 59, and with one opening
and the other seven at rest it drops 2 of 54. At 4× it drops none. The
eight animating at once do fall to 30 frames, and that cannot happen:
there is a single pointer. What makes the ones sitting still cost
nothing is that the loop **does not ask for a frame at rest**.

**And three details that only show up by measuring.** The icons' opacity
went in a CSS variable on the parent, which forces the browser to
recompute the style of the whole subtree per frame: now they are four
direct writes. The `:hover` of the highlight was not behind
`(hover: hover) and (pointer: fine)`, so a finger left it stuck on touch.
And with reduced motion the CSS transitions were still running.

**The potholes of path A, which was the first time.** The height asks
for `100%` AND `min-height: inherit`: in the card an inherited min-height
sets it and the 100% does not resolve; on the playground canvas the
frame has a fixed height and the one that does not resolve is the
min-height. And React 19's `<style href>` is hoisted **once and only
once**: when you edit a piece's CSS, Vite reloads the module but the old
sheet stays, so you have to reload the page. *(That last one no longer
happens; the fix is further down, in the writable field.)*

### A picker of three chose the trigger

**On 2026-09-09**, after seeing that on Apple the bar opens by itself
when you move the cursor, the question was whether that works in an
exhibition. A picker was built with the `prototype` skill: **three
triggers, the same piece underneath**, a copy of the production file
generated by script, patching only the state and the handlers, so the
shapes, the goo, the material and the two springs are the same bytes,
and the two real boxes, the detail of 544×400 and the list card of
544×260.

| | axis | when it wins | what it costs |
| --- | --- | --- | --- |
| **Now** | opens when the pointer enters the bar | the reader controls when to see it | you have to aim at a strip 40 px tall, and sweeping the mouse across opens and closes it without you looking |
| **Apple** | opens when the pointer moves inside the card | it asks for no aim, and it rearms itself on the way out | going past a list fires the animation of every card you cross |

It is called **Apple** because of what Vito saw on his Mac, Spotlight
opens when you move the cursor, and **not because of the recording**:
there the pointer never goes up to the bar and the three waits between
opening and separating are different, so the recording says nothing
about the trigger. The name is the picker's, not a receipt.
| **Rest** | opens when the pointer stops moving | it does not fire when you go past | at 700 ms the wait is already felt; at 2 s it looks broken |

**He chose Apple, with the threshold at 20 px.** The dial exists because
zero does not work: it fires with the tremor of one pixel and with the
first event the browser sends on entry. With 20, entering the card and
carrying on opens it; resting the pointer still on the edge does not.
Verified on the piece already published: a single event does not open it,
8 px do not open it, 25 px do, leaving closes it, keyboard focus opens it
and losing focus closes it.

**The rest one started at 700 ms and not at the 2 s of the request.**
Both were tried, and at 2 s the piece looks broken before it opens. It
stayed as a dial so the decision would be his and not the number I
picked.

**Production was not touched during the exploration**, which is the
skill's rule: `proto/` was in `.gitignore` and `git status` stayed clean
until the chosen one was promoted.

### The glyphs do not fade in: they arrive out of focus

**Vito, looking at the four icons: "you can tell when they load, that
has to be better, look at how the reference does it and copy it exactly".**
He was right and the mechanism was wrong, not the timing: the piece faded
them, opacity from 0 to 1, and **the reference sharpens them**. Cropping
the inside of a button frame by frame and blowing it up, at 267 ms there
is a smear closing in; at 500 it is a sharp drawing.

**The first measurement said the opposite and it was the probe, not the
piece.** Projecting each frame against the SHARP glyph at rest, a smear
correlates poorly and reads as "little opacity": out came a fade of
310 ms of delay and 350 of duration, tidy and false. The blur does not
show up if the template cannot represent it.

**The estimator that works, and the three that do not.** The final model
is linear and unfiltered: `L(t) ≈ cubic background + α · gauss(glyph at
rest, σ)`. For a given σ it comes out of a single least squares; σ is
swept on a grid. Before believing a single figure of it, it was
calibrated with **synthetic frames of known α and σ**, and that
calibration threw out three earlier estimators:

1. **Maximizing α** instead of minimizing the residual: α grows without a
   ceiling when the blur is free, and σ pinned itself to the top even in
   frames that were already still.
2. **Blurring the whole frame** in the template: the glyph is drawn ON TOP
   of the glass, so the blur goes over the glyph and not over the
   background. With this, a real α of 0.4 at 2 pt of σ read **0.87**, and
   that is where the false conclusion came from, that the opacity barely
   moved.
3. **Working at high frequency with the template already filtered**: the
   high-pass applied twice leaves a smooth residual that α absorbs. A real
   α of 0.2 read **2.54**.

The good one returns α and σ **exactly** up to 4 pt of σ, and above that
it saturates (6 pt reads the same as 4), so those frames do not go into
any fit.

**What the reference does**, two cycles and the four buttons, with the
clock anchored to the same zero as `DELAY` (the fit of the right end of
the set, 2.01 pt of error in the clean cycle):

| | delay | duration | bounce | rms |
| --- | --- | --- | --- | --- |
| **α, the opacity** | 270 ms | 260 ms | 0.14 | 0.043 |
| **σ, the blur** | 290 ms | 350 ms | 0 | 0.122 pt |

σ starts at **3.0 pt** and closes at zero. The spring beats the ramp and
the ease in both cases. **They are two segments and not one**: with α
already pinned to 1 (0.93 at 417 ms) σ keeps coming down from 1.02 to
0.30, so σ is not a function of α. And **there is no scale**: the fit
returns 1.00 over the whole measurable segment, meaning the glyph does
not grow.

**There is no offset between buttons.** With the bad probe it looked like
the first one came in 27 ms before the other three, consistent across the
three cycles. With the good one, the order changes from frame to frame: it
was noise. The four come in together.

**Why you could tell.** The old segment started at 200 ms and lasted 300:
at 300 the glyphs were already worth **0.62** and in the reference they
are worth **0.14**. They showed up while the buttons were still flying,
and sharp from the first frame. That is exactly the reading of "they are
loading".

**CSS's `blur()`, measured and not assumed.** Over a hard edge with a ramp
of values: on a Retina screen `blur(N px)` gives a gaussian of σ = N px
with 8% of error, and **below 0.5 px it rounds it to zero** (they are
three box blurs, not a gaussian). At 1× the quantization is much coarser:
`blur(0.75px)` does not blur anything. That is why the tail is not written
and the filter goes back to the empty chain: a filter that does nothing
still forces the glyph to be rasterized on its own.

**The two delays were joined at 280 ms** (20 ms is a little over one
frame) until the piece was measured against the reference with the same
estimator: joined, the opacity ran a frame behind and the blur a frame
ahead. Separated, both errors go away.

**And it does not cost frames.** With the processor 40 times slower and
eight copies mounted, one opening drops 14 of 55 frames **with the blur
and without it**: the same number. At 20× none is dropped in any of the
three scenarios. The cost of that scene is in the masks, not in the four
glyphs.

**The piece against the reference, with the same estimator on both
sides**, recording the opening with `Page.screencast`, which is the only
thing that hands over the frame WITH its timestamp: over three runs and 46
frames between 356 and 554 ms, **0.039 of root mean square error in the
opacity** (0.133 of maximum) and **0.228 pt in the blur** (0.448). The
blur figure is of the order of the method's noise: two runs read the same
instant with 0.25 pt of difference, because Chrome's `blur()` quantizes
and the screencast frames go through PNG.

**Three ways of pulling the strip that did not work, all of them because
of the clock.** Four photos in a row, one per button: between the first
and the fourth ~200 ms go by, so the same spring comes out sharp at the
bottom and blurred at the top. Waiting on the page for the right frame and
only then asking for the photo: the round trip adds up, different every
time, and at 267 ms you see less than at 200. And CDP's virtual time,
which freezes the clock and advances it exactly, but with the load inside
the budget it does not let the piece mount. The timestamp has to come WITH
the frame.

### The field is writable, and it does nothing else

**Vito's request on 2026-09-09**: to be able to type in the search bar,
with nothing unfolding, with a character limit, with the text lasting as
long as you are on the page, and with the placeholder coming back when you
delete it.

**The limit is 24 and it comes from measuring the box.** The open field is
276 px; taking away the 44 of inset up to the glyph and the 14 on the
other side leaves **218 px of text**, and with the site's type at 18 px an
average character measures 8.69, measured with `measureText` over the real
type, not estimated, meaning 25 fit. The limit is 24: the box fills up and
not one more. With wide capitals (a W measures 17.6) the box fills sooner
and the text scrolls inside the input, which is what any field does. What
cannot happen is that it pushes something, and it cannot: the width is
fixed.

**It does not survive a reload, on purpose.** It is component state and
nothing else. Without `localStorage` there is nothing to restore on load,
so there is not one frame with the old text nor a layout jump;
`autoComplete="off"` also turns off the browser's form restoration, which
is the other path by which a value comes back on its own. Verified: on
reload the value is `""` and the scroll sits at 0.

**In the list you do NOT type, and it is the same decision as always.**
There the demo lives inside the card's `<a>` and an `<a>` cannot contain
interactive content: a reader would announce a text box inside a link,
tabbing through the list would stop at each one and the click would fight
with the navigation. In the list it is a `<span>` and the click opens the
piece (verified: `/` → `/buttons-separate`); in the detail, which has no
link, it is an `<input>`. The piece works it out by looking at the tree
(`closest('a')`) and not with a prop, because a published piece is ONE
self-contained file and `demos.tsx` passes it nothing.

**The field became the whole pill.** It was a flex of two, glyph and text,
whose width was set by the word: with an input inside, that would be a
field that grows as you type. Now the box measures what the open field
measures, the glyph goes absolute at its measured position and the input
takes up everything, so **the click lands anywhere on the pill, including
the magnifier**. The text did not move: the pixel by pixel comparison of
the "Search" before and after gives **0 different pixels** out of 192,000.
What makes it line up is the line height equal to the height of the bar:
the half leading leaves the baseline where the `<span>`'s `line-height: 1`
left it, and along the way it gives room for the tails of the g and the y,
which an input does clip.

**And it does not close while you type.** Taking the mouse off the card
with the cursor placed, the bar closed and the field grew over the
buttons. Now `pointerleave` does not close if the focus is inside; closing
is the job of `blur`, which was already there.

**React 19's `<style href>`, solved.** This pothole took the first test of
the writable field: with the old sheet still in place, the `<input>` looks
like an unstyled system control inside the pill, and it looks like a bug
in the piece. Now **in development the sheet goes inline, without `href`**:
React does not hoist it, it rewrites its text on every render and the
change shows up at once, and undoing it too. In production it is still
hoisted and deduplicated, which is what it exists for;
`import.meta.env.DEV` takes the branch out of the bundle (verified: zero
`import.meta.env` in the built file, and a single sheet in the build's
`<head>`).

Before that we tried putting **the sheet's fingerprint in the `href`**, and
it has to be written down because it looks like the obvious solution and it
is not: it fixes the way out but breaks the way back. The old sheet is
already inserted higher up, so going back to an earlier CSS still loses to
the last one that came in. Measured with the page open, editing the file
from the probe: with the fingerprint, `-0.18px → -0.9px → -0.9px`; with the
sheet inline, `-0.18px → -0.9px → -0.18px`.

**The field has no focus ring, and it is not an oversight.** I put the
site's token on it and it was wrong for three reasons, all three visible in
the capture Vito sent ("that blue border is horrible, it must not happen
again"):

1. **It came out with the mouse**, not only with the keyboard. In a text
   field Chrome matches `:focus-visible` **always**, because the element
   accepts keys, so a normal click to type drew the ring. That is not a
   focus indicator: it is a permanent border.
2. **It was a rectangle over a pill.** The field's radius is drawn by the
   mask and not by that element, so `border-radius: inherit` inherited 0
   and the ring came out square around a round shape.
3. **It is browser chrome on top of the glass.** The token's blue is the
   site's and has nothing to do with this material.

The indicator is **the caret**, which in a text field is always there when
the field has focus, with the mouse and with the tab key, and it goes with
the piece's ink (`caret-color`), not the browser's. It is what the
reference does: Spotlight's field has no ring. The four buttons do carry
one and they stay as they are: a button has no caret, and without a ring
there would be no way to know where the focus is when tabbing. Verified:
with a click, `:focus-visible` matches but the outline is `none` and the
caret is `rgb(43,64,92)`; the button is still at `solid 2px`.

From the same family, and that is why it goes here:
`-webkit-tap-highlight-color: transparent`, which takes away the gray
rectangle Android and iOS paint on top when you touch.

### The background comes out of the design system

**Vito, 2026-09-10: "the background, can you not put the ones from the
design system according to the theme?".** It was a blue-gray gradient
written by hand, with a palette of its own, inside a card that is
`--surface`. Now every stop is `--canvas` with `--ink` mixed in, so it
follows the theme without bringing colors of its own. The geometry is not
touched: the same radial and the same linear, in the same positions.

**The percentages are not by eye.** Each one is the mix that matches the
**luminance (L\*)** of the stop that was there, searched over
`color-mix(in srgb, …)`, which is linear per channel:

| | light | dark |
| --- | --- | --- |
| radial 0% | `#f2f5fa` → **3.5%** of ink | `#5b74a2` → **44.2%** |
| radial 38% | `#cdd6e5` → **16.8%** | `#35486d` → **26.2%** |
| radial 76% | `#9aa7bd` → **36.8%** | `#1a2338` → **10.9%** |
| radial 100% | `#8492aa` → **45.7%** | `#131a2b` → **7.2%** |
| linear 0% → 100% | **7.0%** → **47.8%** | **29.4%** → **3.6%** |

Matching the luminance and not the color matters because **the glass is a
blurred copy of this background** and its veil is measured against the
native material: if the background changes lightness, the glass changes.
The HUE is lost, the blue of the reference's sky, and the light is kept,
which is what the material reads.

**Measured before and after, with the old background put back to have the
pair:**

| | glass against the background | ink over the glass |
| --- | --- | --- |
| light, old background | 1.06:1 | **7.88:1** |
| light, from the system | **1.06:1** | **7.88:1** |
| dark, old background | 1.05:1 | 5.77:1 |
| dark, from the system | **1.02:1** | **5.81:1** |

So: the material reads the same and so does the ink. The only thing that
moved is the hue.

**Why in light the background cannot be plain `--surface`.** The glass is
light: over a card of `#f8f8f6` it would be an almost white shape on almost
white and nothing would be visible. The gradient goes down to L\* 58, which
is the same floor it had, and there the glass lifts off. With the system in
dark what happens is the natural thing: an almost black background and light
glass on top, which is literally the reference. If the gray of the light
theme weighs too much, the knob is the last percentage of the radial and the
one of the linear; raising the floor shrinks the glass's contrast in the same
proportion.

**The ink was NOT touched.** It is still `#2e4461`, which is the measurement
of the reference. What is left is a cold ink over a neutral background, which
is the only seam the change left.

### The five loose ends, closed

**Vito, 2026-09-10: "fix absolutely all of them".** They were the five that
had been written down as open. Three were fixed, two were closed by
measuring and the result was that the failure did not exist. They go one by
one, because two of them end in "the earlier finding does not hold" and that
has to be said with the same detail as a fix.

**1. The neck of the goo: the finding did not survive the measurement.** It
said that at the same gap the reference's necks are deeper than mine
(0.40-0.63 against 0.35). That "same gap" assumed the three gaps are worth
the same in every frame, which is what the model of ONE spring does.
Measuring the whole series, two things showed up:

- With the threshold set properly (the glass RAISES the luminance, so the
  cut goes over the rise and not over the difference; with the difference
  the contact shadow gets in and gives a neck at rest, where there is no
  bridge) the three necks break at different gaps: the first one near 5 pt,
  the third one near 13.
- And the distance between neighboring necks, which is a direct measurement
  with no model, gives 57.8 and 46.0 in the same frame.

Which means **the four buttons do not open with a single step**, or the model
has a large error. I could not decide which: to separate the four centers you
have to chain `c_{k+1} = 2·neck_k - c_k`, and that multiplies the error by 2,
4 and 8. Against the known truth at rest (10, 10 and 10) the method returns
**8.8, 10.2 and 11.9**. With ±1.5 pt of error you cannot assert an offset of
a few pt.

So what gets corrected is the claim: there is no evidence that my necks are
flatter than the reference's, because the comparison was being made against a
gap that was never measured. What does stay written down, and is bigger, is
the doubt about the fan of a single spring. The scripts are `cuellos.py`,
`pasos.py` and `abanico.py`.

**2. The refraction: correct, and its effect here is of 1 level out of 255.**
The layer is not decoration, it is the glass: the copy of the background you
see through the material. What was in doubt was the 2.9 px blur on top.
Measured by rendering the same gradient with and without it: **mean 0.25
levels, maximum 1.00, zero subpixels above 1**, over a gradient with 78
levels of travel. It is exactly what has to happen: a blur of a smooth
gradient is the same gradient. And it does not cost anything measurable (see
point 5). It stays, because it is a measured property of the native material
and the day the background has texture it is the only thing that will show
it. It stops being written down as a problem: it is quantified.

**3. The `<a>` with four `<button>` inside: actually fixed.** An `<a>` cannot
contain interactive content. The card is no longer the anchor: it is an
`<article>`, the anchor wraps **only the title** and stretches over the card
with an `::after`, and the preview comes after it in the document, so it
paints on top of that layer and the demo stays alive. The click on the
preview is picked up by the `<article>` with the same rule as `linkClick`.
Verified on the page: **zero interactive elements inside an `<a>`**, the tab
order went from stopping at every button of every card to one anchor per
card, and the click opens the piece from the title as well as from the
preview.

What is lost, said here so it is not discovered later: **on the preview there
is no cmd-click and no context menu**, because there the anchor is not under
the pointer. On the title and on the rest of the card there is.

And along the way a mistake of mine showed up: the piece knew whether it was
a preview by looking at `closest('a')`, and that fix broke it, because taking
the demo out of the anchor made the list render the `<input>` again. Now a
**prop** says it, `mode`, coming down from `demos.tsx`. It is the only prop a
piece receives and it is optional. That the piece depended on the product's
MARKUP was the underlying problem, not a detail: the markup is not its own.

**4. The cold ink over a neutral background: it comes from the system, like
the background.** Same method and same receipt: the mix that matches the
LUMINANCE of the measured ink. `#2e4461` sits at L\* 28.32 and
`color-mix(in srgb, --ink 78.9%, --canvas)` gives L\* 28.32; in dark, 22.4%
gives L\* 26.6. Legibility did not move: **7.88 → 7.85 in light** and
**5.81 → 5.81 in dark**. The hue is lost, the weight is kept, and the piece
sits whole on the system's neutral axis.

**5. The frames: measured again in a real Chrome, five times.** The published
figure (1 of 59, 2 of 54) came out of a single run with another tool, and my
new measurement gave 0. They were not contradictory: it is the same
measurement with its noise. Measured again with the chrome-devtools MCP, a
real Chrome with a GPU, at 20× and with eight copies, five runs of the same
rAF counter:

| | dropped |
| --- | --- |
| at rest | 0, 0, 0, 0, 0 |
| scrolling | 0, 0, 0, 0, 0 |
| one opening | 1, 0, 1, 0, 0 (of ~55) |

The public text becomes **"scrolling drops no frames, and one copy opening
while the other seven rest drops at most 1 in 55"**. "At most" and five runs:
it is the only thing you can defend with a figure that varies.

### The audit of touch, accessibility and performance

**2026-09-10, with `emil-touch-and-accessibility` and `emil-performance`.**
All of it measured on the page, not read off the code. The probes stayed in
`.context/buttons-separate/sonda/` (`a11y.cjs`, `perf.cjs`, `teclado.cjs`).

**What was fixed:**

| | before | now |
| --- | --- | --- |
| the writable field | 276×**40** of white | 276×**44**, and the text did not move (0 pixels of difference) |
| the back arrow | 34×34 | 34×34 in sight, **44×44** of white |
| the speed button | 28×20 | 28×20 in sight, **52×44** of white |
| `touch-action` | on no control | `manipulation` on `button, a, input, select, textarea, summary`, one single rule in tokens.css |

The 44 of the field come out without moving the text because the line height
rises with the box, from 40 to 44: the half leading recenters it and the
baseline stays where it was. The 2 px that stick out of the pill land on the
scene, which does not listen for the click.

`touch-action: manipulation` takes double-tap zoom off the controls and keeps
pan and pinch. The surfaces with a gesture of their own (the playground
canvas, the private area's player, the 404) put `touch-action: none` in their
class and win by specificity.

**Three findings that were closed by measuring, not by touching:**

1. **The four buttons are focusable at opacity 0.** Tabbing towards something
   invisible is a defect, unless the focus reveals it: here the `onFocus`
   lives in the content and focusin bubbles, so **the focus OPENS the bar**.
   Verified by really tabbing: the focus reaches the field first, which
   already opens it, so none of the four receives the invisible focus; and
   coming in from behind, the one that receives it opens the bar in the same
   frame. Hiding them with `visibility: hidden` would close the only path the
   keyboard has.
2. **Each card's anchor measured 112×17.** A false positive of the probe: its
   `::after` covers the whole card. Measured: **560×292** and **560×592**.
3. **The speed button starts at opacity 0.** With `.focus()` it is not
   revealed, but with the Tab key it is: `:focus-visible` only matches
   keyboard focus, which is the case that matters. Verified with real keyboard
   events. And on touch it is shown by `@media (hover: none)`.

**What stays written down and was not touched:** the index links measure
104×16. It is a decision written in `.indexList` ("each link measures its
word… the cost is a smaller click area, and it is accepted") and the index
only shows above 1080 px, where the only device measured without a mouse is a
horizontal iPad Pro. Growing their white to 44 would step on the white
between them.

**Performance, measured:**

- **React does not re-render while the piece moves**: zero changes of children
  in 1.2 s of opening, with a MutationObserver in place.
- **At rest not a single frame is asked for**, neither in the list nor in the
  detail: 0 rAF in 1.5 s. The opening asks for 61.
- **The opening does not run layout**: CLS 0.
- **No long tasks** when loading either of the two pages.
- **The frames with the new background**: at 20× with eight copies, 0 dropped
  scrolling and 1 of 55 in the worst case when opening. At 40×, 17 of 55, the
  same number as before the background change: the gradient's `color-mix`
  resolves once, not per frame.
- Zero `transition: all` and zero `will-change` in the product. The two that
  exist live in `src/private/`, which does not go into the build.

**A performance finding that is NOT this piece's: CLS in the list.** Five
loads give `0.0516  0  0.0294  0  0.0516`. That it is zero in two of five says
it is a race, not a broken layout: the gap reserved for the silhouette of the
phone (`::before` with `aspect-ratio`) turns off when the `<video>` comes in,
and the height becomes the file's, which is only known with the metadata.
**The anchor's overlay does not cause it**: taking it out, the CLS goes up to
0.0516. The Web piece's detail gives **0**, and the Buttons separate card is
the first of the list, so it does not move.

The fix is to declare the ratio of each recording so the box is reserved
before the file arrives. It is a change of data and of CSS on the path of the
App cards, with decisions of its own written down, and it waits for its own
turn: 0.05 is well under the 0.1 that Google calls good.

### The code audit

**2026-09-10, with `emil-unslop-code`.** This repo writes the why at the top
of the file, so comment density is NOT the problem: the skill asks to "match
the room". The problem is the other one, and the skill names it the same way:
**comments that talk about the diff**, names that lie and defense that does
not defend. Six things:

1. **The notes' comment block had turned into a changelog.** 164 lines, and
   part of it was chronology: "the first attempt went from 434 words to 433",
   the two fixes by ear. That goes in this README, which IS the log.
   **164 → 133 lines.**

   **And on the first attempt I cut too much**, applying the skill above the
   repo's rule. The rule is "the why is written at the top of the file AND in
   the log", and the receipt exists to PROTECT A VALUE: that is the test, not
   whether the sentence talks about the past. Three came back that pass it:
   which paragraphs were cut from the text and why (otherwise someone adds
   them back), that you must not go back to 1 of 59 and 2 of 54, and that the
   synthetic worst case of 30 frames is not published because there is a
   single pointer.

   And **"no longer" and "used to" are the language of the house**, not a
   tell: they are in `tokens.css:20` ("the radius is NO LONGER pending"), in
   `:403` ("REWRITTEN: the nav NO LONGER comes out of --ink"), in
   `app.module.css:187` and in the piece itself twice, all of them from before
   today. The skill says "match the room" and that IS the room: a receipt that
   names the previous state is what stops anyone going back to it. The three I
   had rewritten in the present, the card, the anchor and the field, went back
   to the language.
2. **dentroDeLink became `isPreview`.** The name came from when the piece
   looked at whether it had an `<a>` above it. Since a prop decides it, that
   name names something that no longer exists.
3. **Three comments stacked over `Item`, two of them on the same subject**,
   and the first one ("the whole piece is the button") was already false: the
   card is an `<article>`. One was left, saying the structure and its two
   whys.
4. **The same explanation lived twice**, why the mount is said by a prop and
   not by a query to the DOM, in `demos.tsx` and in the piece. Now it is where
   the type is defined, and the piece points there. The other three comments
   against the previous state were left in the present, keeping the whole why.
5. **The comparison `glyph.style.filter !== …` was padding**, and the line
   above it, the one that writes `button.style.opacity`, does not have one.
   The loop does not run at rest, so it saved nothing.
6. **A component called HojaIzada existed to hold two lines.** A component that
   only forwards is indirection without policy: the branch goes inline in the
   JSX.

**What was reviewed and was fine:** zero `console.log`, zero TODO, zero
commented-out code, zero `as any` or `@ts-ignore`, zero `catch` that swallows
anything, zero silent fallback. `noUnusedLocals` is on, so neither an import
nor a dead variable survives. And the guards that remain (`if (!el) return`
over a ref, `if (button)` over the array of refs) are the same ones the file
was already using.

The public text ended at 381 words; the comment at the top said 386 and that
was corrected too.

### The four points that were left, closed

**2026-09-10.** Two were fixed, one was closed by measuring and the fourth
goes from debt to a written decision.

**The neck of the goo: the recording CANNOT answer it, and now we know why.**
Three methods failed, each one for a different reason, until the third gave
the real answer: **the window in which the gaps could differ falls entirely
inside the fused state.** The shapes only separate into five at **368 ms**
after the trigger, and by then the fan has already traveled **1.048** of its
path, meaning it finished, and the glyphs are already worth 0.75 of opacity.
While the gaps matter, the silhouette is a single shape: it does not contain
four separable buttons, so there is nothing to measure there. And the glyphs,
which are the other channel, show up when the fan has already settled.

It is closed: it is not that I could not, it is that the data is not in the
recording. The three methods and their why are in `cuellos.py`, `pasos.py`,
`abanico.py` and `centros.py`.

**The list's CLS: from a varying 0.0516 to a fixed 0.0149.** The cause I
diagnosed was real and it is fixed: the `<video>` had no height until its
metadata arrived, and when it arrived the card changed height. Now `.demo`
carries **`aspect-ratio: auto 1`**. The file's real ratio rules as soon as it
is known, and the 1 covers the gap until then. Both recordings are 1120×1120,
so the 1 gets it right. Five loads give **0.0149 all five**: the race is over.

What is left **is not this piece's and I did not touch it**: the Select
summary preview measures **336** against a card's floor of 260, so when its
chunk arrives the card grows 76 px and pushes what is below. Buttons separate
measures exactly 260 and moves nothing. Fixing it means deciding between
making the piece fit the floor, reserving its height in the registry, or
taking the `lazy` out of demos.tsx, which would add ~20 compressed kB to a
bundle of 66 to save 0.015 of CLS, and it is not worth it.

**The index links: 16 → 24 of white.** Apple's 44 do not fit, because the
links sit 8 px apart and stretching them that far would make their whites
overlap. The **24 of the norm** (WCAG 2.5.8, AA) do fit: 4 px on each side,
and the whites TOUCH without overlapping. Measured on the page: 99×24, 104×24,
94×24 and 93×24, no overlap. The text did not move, because the `::before`
takes up no layout and the gap of 8 measured against benji is still the one
you see.

**Cmd-click on the preview becomes a decision.** I tried both ways out and
both are worse. Putting the anchor ON TOP of the preview gives cmd-click back
and kills what the preview has inside: the four buttons of Buttons separate,
the five rows of Select summary and the video's speed button, which are
exactly what you come to try. And redoing cmd-click by hand with
`window.open` contradicts the rule of `linkClick`, let through everything the
browser does better, and even then it does not give the context menu back. On
the title and on the rest of the card both still work.

## What was slow to load was the cache, not the weight

Vito, 2026-09-10: *"it cannot be that I reload and the mockups take time to
load"*. The obvious suspect was the weight of the videos, and it was **the
second cause, not the first**.

**The first: production cached nothing.** Measured with `curl -I` against
`components-three-pi.vercel.app`, the four resources I tried (the WebM, the
font, the hashed JS and the document) all answered the same:
`public, max-age=0, must-revalidate`. Without `headers` in `vercel.json`,
that is the default, and it means **every reload downloads the 33 MB again**.
No cut in size fixes that.

Three policies were left, and **the difference between them is whether the
file name carries a content hash**. That is the whole rule: a name that
changes when the file changes can be cached forever; a stable one cannot.

**They go in `scripts/routes.mjs` and not in `vercel.json`.** I tried twice to
edit the JSON directly and both times it disappeared on its own, which looked
like a watcher or a session stepping on the file. It was neither:
`vercel.json` **is a generated file**, and the `prebuild` that rewrites it
whole ran inside the same `pnpm build` I was verifying the change with. The
test that closed it was writing it from the terminal and looking at it after
0, 1, 3, 6 and 10 seconds: it survived. It only died on a build.

| route | policy | why |
| --- | --- | --- |
| `/assets/*` | `max-age=31536000, immutable` | Vite gives them a content hash (`index-Q3GrExxQ.js`): a change changes the name, so caching them forever cannot serve anything old |
| `/fonts/*` | `max-age=31536000, immutable` | the name is stable, but a font does not change. **If one ever does change the file has to be renamed**, or whoever already has it keeps the old one for a year |
| `/pieces/*` | `max-age=86400, stale-while-revalidate=2592000` | the videos also have a stable name and they do get re-recorded. One day of cache (the reload comes out instant) and thirty of revalidation in the background |

**The second: the videos were encoded as masters.** The two parameters and
their receipt are at the top of each one in `mockup/scripts/exhibition.mjs`;
the summary is that the WebM came out at `--crf=18` and the HEVC at `-q:v 85`,
archive quality, for something served over the network. They went to CRF 32
and a fixed bitrate of 4000k.

| | before | after | |
| --- | --- | --- | --- |
| `swipeable-tabs.mov` | 20.60 MB | 6.84 MB | -67% |
| `swipeable-tabs.webm` | 8.89 MB | 4.75 MB | -47% |
| the six together | 32.78 MB | 13.7 MB | -58% |
| `/swipeable-tabs` in Chrome | 9.07 MB | 4.92 MB | -46% |

**What was NOT touched, and why.** The resolution: the drawn size was measured
and the video is already exact (560 px of CSS × 2 of DPR = 1120, and the file
is 1120×1120), so there was nothing to cut. And the 60 fps: they are the
content of the piece.

**Two traps that cost one round each.**

The first one, of the method: the CRF sweep with SSIM over the whole frame
gave 0.997 to 0.999 for *everything*, CRF 38 included. The metric did not
discriminate because a good part of the frame is transparent. What worked was
looking for the 80×80 block with the largest difference, searched for and not
picked by hand, and looking at it at 200%: there you do see where the grain of
the illustration's paper is lost, and there is where it was chosen.

The second one, of ffmpeg, and it was about to publish six broken videos: **to
re-encode a WebM with alpha you have to ask for `-c:v libvpx-vp9` on the
INPUT.** The default VP9 decoder drops the alpha layer without saying
anything, and the output comes out opaque even if you ask for `yuva420p`. It
was given away by the verification (corner 255 instead of 0) that runs over
the six files before replacing them. The test that is NOT enough is looking at
the PNG's `color_type`: it gives 6 (RGBA) all the same, with the alpha at 255.

### The goo widens with the movement

**Comparing frame by frame against the recording, at the same scale.** It is
what Vito said on 2026-09-10: "fix it to match the reference even more, now
that you have these images". The images are in `.context/buttons-separate/`:
`montaje.png` (the whole bar at ten instants) and `montaje-cuellos.png` (the
end of the buttons).

**From 430 ms on, the two sides are the same thing.** The pill, the four
circles, their sizes and their separation lie on top of each other. What did
not match was before that.

**At 300 ms the reference still has three buttons in a single lump and the
piece already had four clean circles.** My goo broke too early, and that
forces a correction to what this same README said yesterday, that the
recording could not answer for the neck. It could not answer for the CENTERS,
which is another thing. For the neck it does answer, and two frames of the
same cycle are enough, with no model in between:

| | gap | neck |
| --- | --- | --- |
| at 360 ms | **12.9 pt** | 17.0 → **fused** |
| at 700 ms | **9.9 pt** | 0.0 → separated |

**A bigger gap cannot be more fused.** With σ fixed the bridge breaks at one
gap and that is that. The only thing that changes between those two frames is
that in the first one the buttons are moving and in the second they are still,
so **σ grows with the movement**. Solving for it frame by frame over the
recording, it goes from 6.87 to 8.90 pt while they open.

**The trigger is the speed of the fan, saturated**, and the value was fitted
against the NECK and not against the arithmetic. Chrome implements
`feGaussianBlur` as three box blurs and delivers about 83% of the σ you ask
for, so what is asked and what you see are not the same. Measured on the piece
running, with the same estimator as the recording and in points of the
reference:

| gap | the reference | 6.3 px asked for | 7.7 px asked for |
| --- | --- | --- | --- |
| 8.4-8.8 | 20.0 | 8.4 | **21.1** |
| 11.3-11.5 | 8.0 | 0 | **5.6** |

The resting one is **not touched**: at 4.7 the bridge dies at 7.3 pt of gap and
at rest the gap is 10, which is exactly why the shapes separate completely. And
a bigger σ SHRINKS the goo layer more (σ²/2R), so it tucks further inside the
sharp shape: there is no risk of a facet peeking out again.

**It does not cost frames.** σ is written per frame like everything else, and
at 20× with eight copies none is dropped; at 40×, 15 of 55, the same number as
before this change.

**AND IN THE END IT IS NOT IN THE PIECE.** At 3.0 the necks came out like
Spotlight's, and looking at it: *"I liked it better the way it was"*, which was
without necks. So a ladder was built with 0, 1.0, 1.6, 2.2 and 3.0, captured at
the same instant and at the same scale as the recording
(`.context/buttons-separate/escalera.png`), and it landed on 1.6. Looking at it
again: *"I still liked it the way it was"*. It went back to a constant σ.

I write the whole thing down anyway, and this is the reason: **the measurement
is still true**. The reference fuses more than this piece fuses, and the next
person who compares frame by frame is going to find it and implement it. That
it is not there is a decision about how it looks, taken twice over images, not
a gap.

And the procedure was the right one for what was being discussed: a knob and a
ladder of images. What was not right on my part was the first thing I did with
"I liked it better the way it was", proposing a middle value, when the answer
had already been given.

**What still cannot be measured** is the other thing: whether the four buttons
open with a single step. For that you need the centers one by one, and the
window where they could differ falls entirely inside the fused state.

## Oxlint: the config is half the work

**2026-09-10.** The linter came in with 39 errors over today's code, and
turning off the linter or turning off the code were the two easy answers. The
rule that was followed is the one from the criterion itself: *a linter that
shouts about everything gets ignored*, so first the config was tuned and then
what was left was fixed.

**Why it mattered that it end at zero.** The `PostToolUse` hook runs oxlint
over every edited file and does `exit 2`: with a single error present, **that
file cannot be edited**. With 39 errors spread across `parts.tsx`, the two Web
pieces and almost all of `src/private/`, turning the linter on was the same as
jamming the repo. It happened for real in the middle of this work: the hook
blocked an edit of mine.

**What was turned off, and why it is turning it off and not fixing it.**

| rule | n | reason |
| --- | --- | --- |
| `jsx-a11y/prefer-tag-over-role` | 7 | it asks to change `role="listbox"` for `<select>`, `role="slider"` for `<input>`. Here the product IS building controls by hand: the ARIA role is the correct form, not the error |
| `jsx-a11y/media-has-caption` | 2 | the videos are decorative demos and MUTE. A `<track>` with the subtitles of nothing is not accessibility |
| three of `jsx-a11y` in `src/private/**` | 4 | the private area only exists in development and does not reach the bundle (0 appearances in `dist/`). Nobody who is not us sees it |

**What was actually fixed**: three dead variables and a useless escape in
`mockup.mjs`, a comma expression used as a statement in `frames.mjs`, a regex
with `$` that was an `endsWith`, a ternary as a statement and a spread over an
array that contained only that spread, since `[...(c ? [x] : [])]` is
`c ? [x] : []`.

**What was silenced IN PLACE, with the why next to it**, because the rule is
good and the case is a false positive:

- `react/static-components` in the three `<C />` of deferred loading. The
  `lazy()` is cached in a module-level Map, so the reference is stable; the
  rule does not see through the cache. The comment that was already in
  `sketches.tsx` said the cache exists precisely so the state is not thrown
  away.
- `react/purity` in `buttons-separate`: the `performance.now()` lives inside an
  event handler, not in the render.
- The two in `parts.tsx`: the keyboard path is not missing, it is in the inner
  `<a href>`, which carries the same handler. Duplicating it above would give
  two activations per Enter.
- The two in `select-summary`: the root only DELEGATES the keyboard, and in a
  menu the focus lives in the items (ARIA APG), which here are native
  `<button>`. Putting `tabIndex` on the container would let a click steal the
  focus from the button.

**What is left pending and is written down as such.** Six
`set-state-in-effect` and two `refs` in `src/private/`. They are real findings
(`set-state-in-effect` is literally the rule oxlint is in this project for) but
they ask for a refactor, not one line, and they live in the workshop. They stay
at `warn` **only inside `src/private/**`**: they still come out in `pnpm lint`
and they jam nobody. In everything that gets published they stay at `error`.

Final state: **0 errors, 59 warnings**.

## The description has to hold, and now a probe says whether it does

**2026-09-10.** *"Make sure the description delivers everything the component
says, and put it above Select summary."* Two requests, and the first one
uncovered a problem of method: **these notes were written against the code as
read, and reading is not measuring.** The repo's rule number one holds for
prose too.

### One probe per sentence

`.context/buttons-separate/sonda/texto.cjs` has one `ok` per claim in the
public text. If the piece stops delivering one, it fails. Twenty-seven checks;
the first run found **two sentences that did not hold**.

**"A search field, and beside it a single shape of glass" described two shapes
and at rest there is one.** The four circles are in the same slot (cx 302,
measured) and that slot falls *inside* the field, which measures 456. What you
see on arrival is a single pill: the buttons come out of the inside of the
field when the field shortens to 276. The capture closed it in a second, after
two months of text written from memory.

**"The field settles in 365 ms" was false.** `duration`, in Apple's
parametrization, sets the frequency (ω = 2π/duration), not the moment the
thing goes still. Integrating the piece's spring:

| | 90% of the travel | overshoot | below ½ px |
| --- | --- | --- | --- |
| field (365 ms) | 138 ms | **7.6%** at 229 | 537 ms |
| fan (532 ms) | 217 ms | 4.9% at 358 | 625 ms |

No column is 365. The text now says *"365 ms for the field"*, which is what the
number is. It is the same trap this README had already set for itself with the
settling of the set, and it came in again through another door.

### What was missing: four things you can see that the text did not say

The old rule was *Anatomy talks only about the separation*. It left out the
hover highlight, the sink of the press, that focus in the field keeps the bar
open with the pointer outside, and that the background comes out of the page's
tokens and follows the theme. **None of them is implementation: all four are
looked at.** The new rule is the one from today's request: what you see gets
said.

And the **close** came in, which was missing on purpose and was wrong to be
missing. Not because you cannot see it, but because the paragraph next to it
claims the opening was measured against the recording, and without the
clarification that claim spilled over onto a close the recording **does not
show**. Anatomy is left in three paragraphs, one per subject: the gesture,
what was measured, what was decided.

### The close, measured with the piece running

`sonda/salida.cjs`, which did not exist either:

| | |
| --- | --- |
| the fan starts | first frame |
| the field starts | **49 ms** (the delay changed sides) |
| the shapes touch again | 49 ms, with the glyphs at **0.25** |
| the glyphs reach 0.02 | 115 ms |
| the field goes back to 456 | without going past it once |

And with that, **a claim in the piece that was false**: above `FIELD_CLOSE` it
said the icons *"leave in 110 ms, before the shapes overlap"*. No: when the
shapes touch, the glyphs are still worth 0.25. The true thing is the other one,
and it is enough. They leave **before everything else**, and that is why four
of them are not left stacked over the field, which is what happened with the
segment of 300 (0.28 at 120).

### The 44 is not promised

Each button draws 38 px and answers to 44, with 1 px free against its
neighbor. But below **544 px of scene**, not of window (the scale is
`min(1, (width - 88) / 456)`), the set shrinks as a block and the area shrinks
with it. At 372 px the scale is 0.623 and **27.4 px** are left: it passes the
WCAG 2.5.8 AA minimum (24) and does not reach Apple's 44. That is why the last
sentence of Use cases exists. Without it, the 44 would read as a guarantee the
piece does not give.

### The form, after the facts

With the text already true came a pass of `emil-unslop-writing`, which is
another problem: not *what* it says but whether it sounds like a machine wrote
it. It found three things, all three in the new paragraphs.

**Pile-ups of subordinate clauses, one per paragraph.** The worst one opened
Anatomy with 34 words and three clauses hanging off two "and"s and a semicolon.
Split into short sentences they follow the order of the interaction: *"Move the
pointer over this area."* and only then what happens.

**A passive with the actor hidden**, "The background under all of it is mixed
from…", and on top of that a loose synonym, "all of it", for something that
already had a name. And **"come out of the end it leaves behind"**, which asked
you to reconstruct a geometry to understand a phrase: they come out of the
field, and that is what it says now.

**Sentence length gets looked at, and it is not a fixation.** A whole page of
fifteen-word sentences is one of the things that gives a generated text away
the most. This one runs from 3 to 40: *"Nothing is hidden"* next to the
paragraph of the measurement.

Three that a quick read flags anyway were not touched: the 40-word sentence in
Performance, which carries the whole measurement and whose colon does work; the
27-word one in Use cases; and the *"same glass, same place, same size"*, which
is a real three and not rhythmic padding: they are three different facts and
each one can be denied on its own.

The text ended at 517 words against 341. It is longer, and it is the first
version that can be verified whole.

### The order of the list is editorial

Buttons separate above Select summary, by request. **The order of `PIECES` did
not sort itself**: Select summary opened the showcase by the accident of having
been merged first (PR #26 against #27), not by a decision. Now the first of the
list is the one that opens the showcase and Vito picks it, and that is written
above the fix.

As a bonus, measured A/B with the same Chrome and the same viewport:
**CLS 0.0092 → 0.0029**. The Select summary card is the tallest of the four and
its preview arrived late; further down, what pushes weighs less. Both numbers
are miles away from 0.1, so that is not the reason for the change. It is only
what happened.

## The structure of react-native-motion, and the names as a mountain

2026-09-10. Two requests in one: that "the whole structure of this components
repo follow the structure" of `apps/expo/components` in
[react-native-motion](https://github.com/SchroederNathan/react-native-motion/tree/main/apps/expo/components),
and that the four titles go through the naming rule and, "without changing the
order", draw a mountain in the index: "the longest one in the middle and at the
ends the short names on purpose".

### One folder per piece, with the reference's names

The reference is one folder per animation under `components/animations/`, and
inside it always the same: `index.tsx` that exports, `<slug>-screen.tsx` with
the screen, `<slug>.tsx` with the mechanism, `theme.ts`, the data and the parts
alongside (subfolders when there are many), plus a `registry` that goes from
the slug to the screen and a single route `[slug].tsx` that reads it. The
workshop already had the shape, its own `AGENTS.md` said so, but with other
names and without the registry; the web side had the pieces loose in two flat
folders (`src/piezas/`, `src/notas/`). Now:

| before | now |
| --- | --- |
| `src/piezas/<slug>.tsx` | `src/components/pieces/<slug>/<slug>.tsx`, with an `index.tsx` that re-exports it |
| `src/notas/<slug>.tsx` | `src/components/pieces/<slug>/notes.tsx`, the same folder, and for the App pieces too |
| `nativo/src/piezas/<slug>/pantalla.tsx` | `native/src/components/pieces/<slug>/<slug>-screen.tsx` |
| boton.tsx · tabs-deslizables.tsx | `hold-to-commit.tsx` · `swipeable-tabs.tsx`, and their components `HoldToCommit` · `SwipeableTabs` |
| tema.ts | `theme.ts` |
| fondo-accion.tsx · fondo-bloques.tsx · fondo-opal.tsx · cards.tsx | `backgrounds/stock.tsx` · `blocks.tsx` · `opal.tsx` · `cards.tsx` |
| `nativo/src/app/<slug>/index.tsx`, one pointer per piece | `native/src/app/[slug].tsx`, one route, and `components/pieces/registry.ts` |
| the index drawn inside `app/index.tsx` | `components/piece-list.tsx`, the `animation-list.tsx` from over there |
| nativo/src/piezas/abrir.ts | `native/src/components/pieces/open.ts` |

**What was copied with one difference: the registry is derived, not written.**
Over there it is an import and a line per animation, by hand. Here
`registry.ts` does `require.context` over `./<slug>/index.tsx` and builds the
map on its own, for the usual reason (a list kept by hand falls out of sync the
day you add a folder without writing it down) and for a reason they do not have
over there: here it is built in several worktrees at once, and a central file
everybody edits is one conflict per new piece. The route `[slug].tsx` looks
there; a slug that does not exist goes back to the index. Each `index.tsx`
exports its screen **by default**, which is the only thing the registry needs
to know. The knobs of hold-to-commit (`?park=`, `?background=`…) are now read
by its own screen, like the pieces over there, which are self-contained; the
route does not know which piece it mounts. The "Do not touch without measuring
again" block of hold-to-commit, which lived in the route, moved to the foot of
the screen, where swipeable-tabs' block already was.

**What was not copied, and why.** `data/animations.ts` is our `src/pieces.ts`
and it stays where it is: three scripts import it and it is not a component.
The theme system over there (`theme/`) is not needed: each piece brings its
measured palette. And **the identifiers inside the pieces stayed in Spanish**
(Etiqueta, BARRA, usePaleta): the naming rule is about precision, not about
language; they are some 6,000 lines with a receipt, and the log,
`native/AGENTS.md` and the comments name them at every step. Only the files the
reference names by convention were renamed, plus the two components that carry
the folder's name.

**What got touched along the way.** `demos.tsx` and `notes.tsx` glob
`./components/pieces/*/index.tsx` and `*/notes.tsx`; Add to Exhibition writes
the folder with both files and undoes both if the entry does not go in;
`pnpm new` creates `<slug>-screen.tsx` + `index.tsx`. In this worktree
`expo-audio` was missing from the workshop's `node_modules` (the typecheck
failed in `sound.ts` before anything was touched): `pnpm install
--frozen-lockfile` and done.

**Verified.** `pnpm typecheck && pnpm lint && pnpm build` (the four routes in
`vercel.json`, the chunks are now called `notes-*.js` and `<slug>-*.js`);
`pnpm --dir native typecheck`; `pnpm references` at zero dead ones after
sweeping the log, both `AGENTS.md`, `GLASS.md` and the comments;
`npx expo export --platform ios` packages both pieces (3.7 MB of Hermes, with
swipeable-tabs' 24 images inside, meaning the registry found them); and a
headless Chrome over CDP walked `/`, the four pieces and `/no-existe`: each
detail with its `h1`, its three sections, its live demo or its video
(hold-to-commit's dark one under `prefers-color-scheme: dark`), and the 404
intact.

**The cost that stays outside this worktree.** The branch
`vcompagnucci/title-to-actions-glass` adds `src/piezas/title-to-actions.tsx`
and an entry in `PIECES` with no `slug`. On rebase it has to move the file to
`src/components/pieces/title-to-actions/title-to-actions.tsx`, write the
`index.tsx` beside it and give the entry `slug: 'title-to-actions'`; with the
new glob, in the old place the demo is not drawn and the typecheck complains
about the missing field. Since the section at the end of this log, it also
arrives with its comments and identifiers in Spanish, in a repo where nothing
else is: translating that one file is part of the rebase.

### The slug is a field, not a calculation

Until today the URL, the workshop folder, the video files and the demo's came
out of `slug(name)` on every read, and that tied the title to everything else:
changing "Hold to commit" would have renamed `/hold-to-commit`,
`public/pieces/hold-to-commit.webm`, the workshop folder, the masters in
`.context/mockup/master/`, the spreadsheets in `.context/hold-to-commit/` and
the vault's reference clip, which is named after the piece. Now `Piece` carries
`slug`, assigned ONCE (Add to Exhibition computes it from that day's name and
writes it; `pnpm new` uses the same calculation) and the title is free. It is
exactly the shape of `data/animations.ts` in the reference:
`title: 'Stack Toast', slug: 'spring-toast'`. The page, the scrollspy,
`routes.mjs`, `piece-video.mjs` and the duplicate check when publishing read
the field; `slug()` is left for whoever assigns it. The four production URLs
still open.

### The names, as a mountain

Every title went through the naming rule (`AGENTS.md › How a piece is named`:
the technical term of the part, the specification verb), with two more
conditions: that it be a phrase that is **already in its piece's notes**, so
that the title and the page name the thing the same way, which is the rule of
one name per thing; and that its length be decided by its place in the index.
The order was not touched: it is editorial and Vito fixed it that same day
(Buttons separate opens the showcase; the capture in the request showed the
previous order).

| | before | now | characters | ink in the index |
| --- | --- | ---: | ---: | ---: |
| Web | Buttons separate | Fan out | 7 | 45.7 px |
| | Select summary | Selection summary | 17 | 117.9 px |
| App | Swipeable tabs | Swipe between tabs | 18 | 124.7 px |
| | Hold to commit | Hold to buy | 11 | 70.6 px |

RUNTIME: the text width of each index link (Inter 13 px, weight 460), measured
with headless Chrome over CDP on the page served at `localhost:3100`, after
`document.fonts.ready`. The ink rises from 45.7 to 124.7 and comes down to
70.6: a mountain with its peak at the third one.

- **Fan out** (was Buttons separate, 16). "The four buttons fan out from where
  the first one sits", says its Anatomy; it is the specification verb of the
  gesture and the shortest one that says it whole. "Hover to open" (13, not
  short) and "Split buttons" (13, *split button* is already another control:
  the one that carries a menu beside it) were discarded.
- **Selection summary** (was Select summary, 14). What the button summarizes is
  the selection: the noun where there was a verb used as a noun, and three more
  characters for the middle of the list.
- **Swipe between tabs** (was Swipeable tabs, 14). It is the line Vito approved
  on 2026-09-07 ("Swipe between tabs, tap to select one") with the HIG's term;
  it says the action instead of the adjective. The Use cases sentence that
  starts "Swipeable tabs fit one screen…" stays: there it describes the class
  of control, it does not name the piece.
- **Hold to buy** (was Hold to commit, 14). "Commit" is a specification word,
  the one from transactions, and it was the name in the 60fps.design catalog;
  but the button has said "Hold to Buy" ever since Vito asked for it as a
  purchase button (2026-09-04), and the title says what the button says. Eleven
  characters to close the list.

**The cap of 15 characters** (Toolbars › Titles in the HIG) was born in the
vault, where the title shares a row with the arrow and the inspector; the
exhibition's detail puts it alone in its `h1`. It holds for the ends; in the
middle it is exceeded on purpose, and that is said in `AGENTS.md`. A new piece
comes in with whatever length its place gives it.

**What did not change.** The slugs and the URLs (previous section); the titles
of the notes' sections; the notes' prose, because the four names came out of
it. The native workshop still lists the slug as a phrase ("Hold to commit"): it
does not read `pieces.ts` from the web repo, and it is a tool.

## Absolutely everything in English

2026-09-10, right after the section above: "absolutely everything in English,
and using /emil-unslop-writing". Not only the docs. The comments, the
identifiers, the string literals, the console messages, the commit messages.
About forty thousand lines of Spanish written over three weeks.

**It has two halves and only the first one is mechanical.** The files and the
folders moved with `git mv` in one commit, src/privado/ to `src/private/`,
ficha.tsx to `details.tsx`, nativo/ to `native/`, and that half is safe:
the compiler catches every import you forget. The second half is the CONTENT,
and there is no compiler for prose. It went to subagents, a disjoint set of
files each, all reading the same brief in `.context/i18n/PREAMBLE.md`: the
fixed vocabulary (la pieza is the piece and never the component, la muestra is
the showcase, el recibo is the receipt), what must NOT change even though it
looks Spanish (`VAULT_DIR`, `com.anonymous.nativo`, the Expo `scheme`, the
vault's own subfolders, the keys of the JSON on your disk), and the rule that
a name in backticks promises it exists.

### What the token limit taught, which was not about translating

Three sessions ran out of tokens mid-flight. The first two lost every file
that was in progress, because an agent handed a whole file builds the
translation in its head and writes it once at the end. Relaunched with one
sentence added to the brief, translate in chunks of about 120 lines and apply
each chunk as soon as it is ready, a third cutoff still left 40 to 60 % of
each file on disk. That sentence is worth more than any glossary.

**And the check I was using was blind to it.** A file cut in half reads ZERO
Spanish words, because what is missing is not there to be counted. Three
truncations went through that filter:

| file | looked like | actually was |
| --- | --- | --- |
| `native/AGENTS.md` | 593 lines, no Spanish | missing 334: seven sections from the phone to the simulator |
| `src/private/playground.tsx` | 1686 lines, no Spanish | missing 422, and `tsc` only said `'}' expected` at the end |
| `.context/i18n/readme-1.md` | 130 lines, no Spanish | missing 424: the whole body of "The private area" and nine sections |

What catches it is COVERAGE, not language: the same number of headings as the
original, and a last line that corresponds to the source's last line. With
that, an audit of the 118 tracked files against the commit before the
translation found no others. Repairing is cheap when the prefix is kept: pull
the tail out with `git show <commit>:<file> | sed -n 'A,Bp'` and translate only
that.

Repairing `playground.tsx` turned up a real bug, hidden as long as the file did
not parse: the call site passed `remove=` to a `Canvas` that declares
`deleteView`, and `tsc` cannot typecheck a file it cannot read.

### The dash, swept for real this time

The writing skill forbids the em dash, and the Spanish uses it constantly. In
the source there were 197, in `src`, `native`, `scripts` and `mockup`. Fifteen
are left, and each one is the character itself and not punctuation: the
placeholder for an empty value in a clip's details, the dash the empty clip
list draws, `mdash` in the entity table of `scripts/link-card.mjs`, the
separator class of the title parser, the `document.title` separator, and the
comments that quote a sentence about the dash. Of the rest, the list markers
took a hyphen, the ALL-CAPS box titles took a colon, and the 46 prose ones were
rewritten one at a time, because swapping the dash for parentheses keeps the
exact rhythm that made it wrong.

Spelling went American in two passes, and the second one is the interesting
one: the first swept the words I had seen (color, behavior, center, gray) and
an agent found the ones I had not (traveled, neighbor, cataloged, modeled,
canceled, license). 130 occurrences in total, every one inside a comment or
prose. Before each pass, a check that none of them sat in an identifier, a CSS
custom property or a string literal.

### What stayed in Spanish, and why

The vault's subfolders (`nativo/`, `web/`) and the keys of
`.lima-vault.json` and `.lima-playground.json`: they are files on Vito's disk
and this repo does not get to rename them. `com.anonymous.nativo`, and the
Expo `scheme` and `slug`, which are baked into the installed dev client. The
Python scripts under `.context/`, which is scratch. The AVD called `taller`.
And two names inside two commit messages, `pieza-video` and `referencias`,
because those messages describe the commit that renamed them.

**Verified**: `pnpm typecheck`, `pnpm lint`, `pnpm build`, the workshop's and
the mockup's typechecks, `pnpm references` at zero dead, a Metro export with
both pieces inside, and headless Chrome over CDP walking the index, the four
pages, the 404, the vault, the playground and `/vault-media/__index` with no
console errors. The mountain still holds, measured in the served index: 45.7,
117.9, 124.7, 70.6.

## The vault becomes a two-way door

2026-09-10. The vault had one way out: right click → `Open in Playground`,
and the ↗ in a clip's header, both calling `toPlayground(path)`. The request
was the second one, and its round trip: from a clip, go to the piece that came
out of it; from the piece, come back to the reference I studied.

**One field carries both directions.** A fourth entry in `.lima-vault.json`,
`piece`, with the slug. The slug and not the title, because the slug IS the
URL: there is nothing to look up and nothing that breaks when a title changes,
which is the same reason `Piece` got a `slug` field two sections above.

**The gotcha was written down before it bit**, in `AGENTS.md`: three fields
here, three fields in the server, "adding one here without adding it there
discards it on save, silently". So the field went in on both sides in the same
change. But it does not go in the same way on each side, and that is the part
worth keeping:

| | the three | the fourth |
| --- | --- | --- |
| what it is | whatever you typed | a slug that has to name a piece that exists |
| a bad value | there is no bad value | 400, `no piece has that slug` |
| an unknown field | dropped in silence | it cannot be unknown |

Dropping a bad slug in silence is exactly what the loop does with an unknown
field, and it is the one thing this field cannot afford: you would save, see
nothing, and have no link. A link you cannot follow is worse than no link. So
it answers 400 and the control that writes it is a picker over the pieces that
exist, which cannot express the mistake in the first place.

**It writes itself when the fact comes into being.** Publishing an App piece
from a clip is the moment the clip produces a piece, so that is where the link
gets written, in the same request. Asking you to write down afterwards what the
server just did is asking you to keep two copies in step. If the write fails
the piece stays published and the answer says `linked: false` with its reason:
a piece that got published is not undone by a link that did not. By hand in the
details panel is for the clips whose piece was published before the field
existed, which today is all four.

**The icon goes first in the row, and that is measured.** The actions group is
pushed against the rail with `margin-left: auto`, so it grows leftward: a
button added at the head leaves the arrow and the details toggle exactly where
they were. Measured in the served detail, with the button and without it, the
arrow stays at **x = 1368** and the toggle at **1408**, and the new one appears
at 1328. Added at the tail it would have shifted both, and a control that moves
because a neighbour appeared is a control you have to find again.

It is drawn as the destination and not as a departure: a card of the
exhibition, the showcase on top and the name underneath. Two arrows side by
side would be two departures, and they are not the same gesture. The
playground's takes the clip WITH you and puts it on a canvas; this one takes
you to something already finished, with nothing travelling.

**The way back is dev-only, and that is the whole constraint.** The exhibition
is published and the vault is not, so a link from the product to a clip on your
disk cannot exist in production: it would 404 for everyone and the path of a
file of yours would travel inside the bundle. `src/private/reference-link.tsx`
is lazily loaded from `parts.tsx` behind `import.meta.env.DEV`, the same two
folds that keep the whole private area out of the build. Verified by grepping
`dist/`: neither the component nor the string `/vault` is in there.

And it asks the VAULT, not the piece. `pieces.ts` is product code and a
reference is a private note, so the search runs the other way: over the vault's
index, with the same `useClips` the vault itself uses, so there is no second
request. With no clip naming the piece it draws nothing, because a dev-only row
that appears empty is a thing you have to explain on a page you are recording.

**Measured end to end**, on the served page: the grid's menu comes out
`Open in Playground · Open in Exhibition · Rename · Move to Trash`, the clip
with a piece shows three buttons in its bar and the one without shows two, the
piece's foot reads *"Measured against Hold to commit"* and links to
`/vault/nativo/Hold to commit.mp4`, and the click routes without reloading
(`pushState` plus a `popstate`, which is what `app.tsx` already listens to).
Zero console errors on both ends.
