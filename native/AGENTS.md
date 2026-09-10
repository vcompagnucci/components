# The native workshop

**Read the [root `AGENTS.md`](../AGENTS.md) first.** The whole journey
(vault → playground → exhibition), the evidence rule and the working
method are there. This is only the workshop where the **App** pieces
get built.

> **The numbered procedure is
> [Path B](../AGENTS.md#path-b-an-app-piece-expo--react-native)**, in
> the root AGENTS: from `pnpm new` to the published piece. This file
> explains how the workshop works on the inside and what to do when
> something fails.

> **Expo changed.** Before writing code, read the docs of the exact
> version: <https://docs.expo.dev/versions/v57.0.0/>

## What this is

An Expo app that lives inside the repo but with its own toolchain. It
is the native equivalent of the playground's canvas: here you iterate a
piece against the simulator, and when it is ready you **record** it.
That recording is what goes into the vault and gets published.

**One workshop app, one folder per piece.** Not one repo per piece: it
is measured against what the references do (Mangano holds 127
animations in a single app; Candillon one folder per episode; Gitter
one file per interface), and a repo of its own is the prize for the
piece that turned into a library, never the starting point. The recon
is in `.context/recon/TALLER-NATIVO.md` at the root, gitignored, so its
conclusions live here and in the AGENTS above.

## The commands

```bash
pnpm install                  # once per worktree
pnpm ios:build                # ONCE per machine: builds the dev client
pnpm ios                      # day to day: Metro + the app in the simulator
pnpm phone                    # Metro for Expo Go, with a QR: see "on your real iPhone"
pnpm new "Swipe to pay"       # creates src/components/pieces/swipe-to-pay/
pnpm record swipe-to-pay      # records into the vault and closes the loop
pnpm mockup swipe-to-pay --verify   # first: does the bezel slot stay full through the whole camera?
pnpm mockup swipe-to-pay            # the recording in a black iPhone, neutral background, camera, for X
```

`pnpm ios:build` builds the **dev client**, the `Workshop` app that
ends up installed in the simulator, and it only has to be repeated when
a new NATIVE dependency comes in. The rest of the time `pnpm ios` is
enough: it starts Metro and opens the app that is already installed.
Everything that is TypeScript hot reloads.

**It is not Expo Go.** Expo Go is fine to get going, but it does not
carry `@shopify/react-native-skia` (a third-party native module) and
Skia is precisely one of the reasons this workshop exists.

### The `expo-modules-jsi` patch, and why it exists

`pnpm ios:build` fails out of the box with **Xcode 26.2**:
`expo-modules-jsi` 57.0.5 annotates two constructors of
`RuntimeScheduler` with `SWIFT_RETURNS_RETAINED`, but the class is only
declared `SWIFT_SHARED_REFERENCE` at its closing brace. Clang reads the
header in order, so inside the constructor the type is not a shared
reference yet and it rejects the annotation. Issue
[expo/expo#49426](https://github.com/expo/expo/issues/49426) was closed
by an Expo maintainer on 2026-08-27 with *"Upgrade Xcode to 26.4 or
newer which is required for SDK 57"*.

**Updating Xcode was not necessary.** The two annotations **came in
with 57.0.5**: 57.0.0 through 57.0.4 do not have them, and the diff of
that header between 57.0.4 and 57.0.5 is exactly those two lines and
nothing else (verified by reading both files from unpkg, without
installing them). So `patches/expo-modules-jsi@57.0.5.patch` takes them
out, and the header ends up **byte for byte identical to 57.0.4's**, a
version Expo published and that compiles. It is not an invented patch:
it is going back to the last thing that worked.

Dropping the package to 57.0.4 was not an option: `expo-modules-core`
asks for `~57.0.5`.

**When to take it out:** when this machine has Xcode 26.4 or newer.
Then you delete the patch, take `patchedDependencies` out of
`pnpm-workspace.yaml`, and rebuild. The patch travels with the repo, so
any worktree compiles the same in the meantime.

### The other step that is not obvious

Skia needs to download its binaries **before** `pod install` runs:

```bash
npx install-skia
```

With pnpm the postinstall does not do it on its own. If
`pnpm ios:build` complains about *"Skia prebuilt binaries not found"*,
this is it.

`pnpm new` is the `New sketch` of this side: it creates the folder and
nothing else. **The index is derived from the folders**
(`require.context` in `src/components/pieces/registry.ts`), so there is
no list to keep up to date, the same decision that keeps the vault from
lying.

`pnpm record` does the three things of the closing step: it pins the
status bar at 9:41 with the battery and the signal full, records with
`--codec h264` (the default of `simctl` is **HEVC**, and an HEVC may
not play in the exhibition's `<video>`, which is the most expensive
trap on the way because it does not fail while recording, it fails in
the piece that is already published), and writes **straight into
`VAULT_DIR/native/`**. You stop the recording and the clip is already
in the `/vault` grid: from there, Open in Playground → Add to
Exhibition.

## The shape of a piece

```
src/app/
├── _layout.tsx          the Stack, with no header on any screen
├── index.tsx            the index: decides whether there is a list and mounts it
└── [slug].tsx           ONE route for all of them: looks the screen up in the registry
src/components/
├── piece-list.tsx       the index's list, drawn
└── pieces/
    ├── registry.ts      slug → screen, DERIVED from the folders below
    ├── open.ts          the knob: open the workshop straight into a piece
    └── <slug>/
        ├── index.tsx            exports the screen by default, and nothing else
        ├── <slug>-screen.tsx    the piece mounted: data, palette, knobs,
        │                        composition and the "Do not touch without
        │                        measuring again" block at the foot
        ├── <slug>.tsx           the mechanism: what moves
        ├── <part>.tsx           its parts, in files by responsibility
        ├── measurements.ts      every value with its receipt, and the palettes
        ├── theme.ts             the palette's context
        └── <data>.ts, media/    the mock's content, if there is any
```

**The slug is the same string in the three places**: the folder here,
the name of the recording's file, and the URL of the published piece.
That is why `pnpm new` uses the same arithmetic as `slug()` in
`src/pieces.ts` of the web repo. If they diverged, the published piece
would not point at its workshop. And it is assigned once: the
exhibition's title can change later (on 2026-09-10 all four of them
changed) and the folder does not, because the slug is a field of
`PIECES` and not a computation over the name.

**The route is a single one and the piece lives in
`src/components/pieces/<slug>/`.** It is not a matter of taste: Expo
Router turns **every** `.tsx` hanging off `src/app/` into a route (its
docs: *"Non-navigation components live outside the src/app
directory"*), so a `tab-bar.tsx` next to a route would be
`/swipeable-tabs/tab-bar`. The folder has the shape and the names of a
[react-native-motion](https://github.com/SchroederNathan/react-native-motion/tree/main/apps/expo/components/animations)
component (`index.tsx` exporting the screen, `<slug>-screen.tsx`,
`<slug>.tsx` with the mechanism, `theme.ts`, and the parts and the data
next to them) and its registry too, with one difference: over there it
is written by hand and here `registry.ts` is DERIVED from the folders
with `require.context`, for the same reason the vault cannot lie, and
because with several worktrees building in parallel a central file is
one conflict per new piece. `src/app/[slug].tsx` looks there and
mounts. Until 2026-09-10 there was one pointer per piece in
`src/app/<slug>/index.tsx` and the index came out of those folders.

**Verified end to end** on 2026-08-27: `pnpm new` created a piece, the
dev build drew it with **Skia** in the simulator, `pnpm record` wrote
the clip into the vault, and `scripts/frames.mjs` of the web repo
parsed it (fixed rate, 40 units per frame), which means the player can
go frame by frame over what comes out of here.

**With two pieces or more there is an index, and for measuring it gets
in the way.** A piece's probes and `pnpm record` need the app to start
in the piece; `simctl openurl` with the dev client's scheme asks for
confirmation on iOS 26. `src/components/pieces/open.ts` is the knob:
the slug goes there and the index redirects. It stays `undefined` in
the repo (the other worktree has its own piece).

**No header, and that is how it gets recorded.** A piece takes the
whole screen: anything that is not the piece would end up inside the
video. To get back to the index, **swipe from the left edge**, the
stack's native gesture, which draws nothing. If your piece needs that
edge, turn it off in its own screen with
`<Stack.Screen options={{ gestureEnabled: false }} />`.

### At the foot of the piece goes what belongs to the piece

When you finish, close `<slug>-screen.tsx` with a block of invariants:
the values somebody would have to measure again before touching them,
and why. One per line, with its evidence grade.

```
/*
 * Do not touch without measuring again
 *
 * - The long press lasts 500 ms, and the pan starts with
 *   activateAfterLongPress(500). It is the same number on purpose: if
 *   they come apart, the menu opens but the finger never gets to drag.
 *   SOURCE: both gestures read LONG_PRESS_MS.
 *
 * - The overlay comes in over 210 ms and goes out over 170 ms,
 *   ease-in-out.
 *   RUNTIME: measured frame by frame over the reference recording.
 *
 * - The release is followed with a counter that increments, not with a
 *   boolean.  NO RECEIPT: what breaks with the boolean is not written
 *   down.
 */
```

That last line is the most important one in the block. **A value with
no receipt at least warns that it is missing one**; an invented reason
that sounds good warns of nothing.

And watch what goes in here: only what belongs to this piece. Whatever
holds for any other one goes in the section below, once.

## What holds for every piece

These rules do not belong to any particular piece. They are how the
stack is used here. They are written **once, in this file**.

It is not a mania for order. In `SchroederNathan/react-native-motion`
the same rule is copied by hand into four briefs, and in the fourth one
it went stale: the radial menu's says to use `runOnJS`, but its own
code uses `scheduleOnRN` thirteen times and `runOnJS` none. It was
copied to four places and three of them were updated.

### Calling JS from a worklet: `scheduleOnRN`

```ts
import { scheduleOnRN } from 'react-native-worklets'
```

`runOnJS` **is deprecated**. SOURCE: `react-native-worklets@0.10.1`,
`lib/typescript/threads.native.d.ts:103`: *"@deprecated Use
`scheduleOnRN` instead."* It still works and it is still exported from
`react-native-reanimated`, so nothing breaks; it just does not get
written any more.

**It is not a textual replacement.** The way you call it changes:

| | |
| --- | --- |
| old | `runOnJS(fn)(a, b)`: it returns a function, and that one is called |
| new | `scheduleOnRN(fn, a, b)`: the arguments go straight in |

### Shared values: `.get()` / `.set()`

`.value` is **not** deprecated: the three of them live together in
`SharedValue` and none is marked (SOURCE:
`react-native-reanimated@4.5.1`,
`lib/typescript/commonTypes.d.ts:129-136`). We chose `.get()`/`.set()`
so the workshop is one single thing, not because the other one is
wrong. If one day Reanimated's docs say otherwise, this changes in one
place.

## What we already know bites

Thirty-one things that are not obvious and cost an afternoon each. The
first eight came out of reading `SchroederNathan/react-native-motion`
on 2026-08-28. Over there they are written as rules for one specific
piece, but none of them is. The ninth came out of measuring it here, in
swipeable-tabs, and the tenth was written by the two pieces separately,
each with its own receipt; the rest were left behind by
hold-to-commit, Android and the performance measurement.

They come from a repo where the constants are taken frame by frame off
the reference and every decision has its comment above it. **Treat them
as rules, not as suggestions**: if one of them looks wrong to you,
measure before changing it.

**Gestures and animation**

1. **Cancel whatever is running before starting another animation** on
   the same shared value. Two springs stacked on the same value fight
   each other. It shows up most in press and in effects that follow the
   finger, where the triggers step on each other.

2. **When you release a pan, project the velocity before rounding.** If
   you decide which item a carousel lands on by position alone, a short
   fast flick stays where it was and feels sticky. What gets rounded is
   `position + velocity × factor`, not the position on its own.

3. **Two gestures that have to match come out of a single constant.** A
   500 ms long press with a pan that activates at 500 ms has to read
   the same variable: if they come apart, somebody touches one and the
   gesture opens but does not drag.

**Render**

4. **Primitive props if you want `memo` to actually cut.** A new object
   or a new function on every render makes the comparison come out
   different every time and `memo` saves nothing. Same rule as on the
   web side, but here it is paid in frames.

**Skia**

5. **Text layout comes out of the glyph advances, not the bounds.** The
   bounds measure the drawn ink, so an `o` and an `l` give different
   widths and the text dances. The advance is how far the cursor moves:
   it is what typography uses to lay text out.

6. **Set the `origin` if you want a glyph to scale from its center.**
   By default it scales from the baseline and the letter drops
   downward.

**Composing views**

7. **The `BlurView` goes outside the `MaskedView`, not inside.** It
   comes from his carousel, which has a blurred background behind a
   mask, so from having built it the right way round and the wrong way
   round. The brief does not say what breaks; what we do know is where
   a blur samples from (point 8), and inside the mask what it finds is
   not the screen.

8. **A `BlurView` only sees what is in its own window.** On Android, a
   sheet hosted over the keyboard lives in another window: the blur
   finds nothing behind it and the tint comes out on its own. If your
   piece depends on the blur, on Android you have to fall back to a
   flat color, and that color gets measured too, not chosen.

**Consistency between shared values**

9. **If two values have to be true AT THE SAME TIME, they are one
   value, not two.** Reanimated orders its mappers topologically, but
   it builds the edges out of the **declared outputs**, and
   `useAnimatedReaction` calls `startMapper(fun, inputs)` without any
   (SOURCE: reanimated 4.5.1, `src/hook/useAnimatedReaction.ts:68`,
   against `useDerivedValue.ts:71`, which does pass one). Which means
   **nothing guarantees that a reaction runs before whoever reads what
   it writes**, and its own `mappers.ts` warns about it: *"the updated
   value can be read by mappers that run later in the same frame but
   previous mappers would access the old value"*.

   What it looks like when it bites: a pair of values that cross each
   other stays inconsistent for one frame and the property that depends
   on both jumps. In swipeable-tabs it was `from`/`to` (from a
   reaction) plus `progress` (derived): every page crossing left the
   styles with the new ends and the old progress, saturated at 1, and
   **every icon lit all the way up one frame before doing its fade**.
   Measured: the six tabs of a sweep did `0.000 → 1.000 → 0.008`.

   The fix is not reordering anything: it is one single
   `useDerivedValue` that returns the whole object. There is no order
   left to get wrong, and since it is a derived value it declares its
   output and the sort puts it before all of its readers.

   **And the instrument matters as much as the rule.** This is
   invisible to a recording looked at one frame at a time: you see it
   by writing down, from inside the style's own mapper, the value that
   gets painted each frame. Watch out for `simctl recordVideo` too,
   which writes at a **variable rate**: running it through `fps=60`
   before looking at it frame by frame invents frames and manufactures
   glitches that do not exist.

**Symbols**

10. **`SymbolView`'s `size` is not the size of the glyph.** Both pieces
    ran into this on their own, so it comes with both receipts. SOURCE:
    `expo-symbols/ios/SymbolView.swift:127` builds the configuration
    with `pointSize: UIFont.systemFontSize` (14) ALWAYS, and the
    `contentMode` scales the image to the view's BOX; with
    `resizeMode: 'center'` every symbol comes out at 14 pt, whatever
    `size` says. So the number you pass it is not the one you would use
    in a font and there is no way to guess it right.

    Two ways to size it properly, and both of them are measuring. In
    hold-to-commit: box = the symbol's natural box at the size you want
    (`NSImage(systemSymbolName:).size` in a Swift script prints it),
    `scaleAspectFit` (the default) and `scale: 'large'` so the scaling
    goes downward. In swipeable-tabs: measure the INK against the
    reference. `size: 17` paints 13.0 pt of ink, which is exactly what
    the `+` of the original measures (`EDGE.plusSymbol` in its
    `measurements.ts`). Never by the size of the label next to it.

    And `SymbolView` is a **native view**: iOS reconfigures it when its
    props change, so reserve its box with a fixed width and animate the
    box, not the symbol (`css.chevronSlot` and `symbolStyle` in
    swipeable-tabs' `tab-bar.tsx`). A symbol that appears and
    disappears changing the row's layout is the short road to flicker.

### What hold-to-commit left behind (2026-09-02)

11. **`simctl`'s recording is no good for measuring small points or
    times.** It crushes the 1 to 4 pt details into gray dust, and it
    puts 60 fps pts on frames it captures at about 33: time comes out
    compressed about 1.8×. To measure, capture losslessly with a
    fixed-state probe (the piece's `probe.ts`), and use the recording
    only to see the order of things.

12. **`CI=1` turns off Metro's watch mode.** `CI=1 pnpm ios` starts,
    but "reloads are disabled": no change reaches the app. Leave the
    variable out.

13. **Two worktrees, two simulators.** The dev client is nailed to
    `localhost:8081` (trap 8 of the project's memory). If the other
    worktree has the simulator, you do not take it away from it: you
    create another iPhone of the same type and install the same
    `Workshop.app` on it:
    ```bash
    APP=$(xcrun simctl get_app_container <udid-of-the-other> com.anonymous.nativo)
    UDID=$(xcrun simctl create "Pro Max B" com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro-Max com.apple.CoreSimulator.SimRuntime.iOS-26-2)
    xcrun simctl boot $UDID && xcrun simctl install $UDID "$APP"
    ```
    And when you are done, `shutdown` + `delete`: `pnpm record` talks
    to `booted` and with two of them running it picks whichever.

14. **A worklet does not capture a module namespace.** Two SIGABRTs in
    `worklets::toOptimizedObject` while a worklet called
    `scheduleOnRN(haptics.tick)` with `import * as haptics`. It moved
    to named imports and the functions are declared BEFORE the worklet
    that uses them. NO exact RECEIPT (it was not reproduced in
    isolation); it stands as a well-founded suspicion.

15. **A probe that parks two values with one parameter lies.** With
    `crossfade=q` (Hold at 1−q, Keep at q) the captures showed the two
    labels overlapping in states the animation never produces: the one
    leaving goes in 48 ms and the one arriving takes 360. The probe
    goes in MILLISECONDS and puts each shared value where the animation
    would have it at that instant, with the same curves and delays, to
    compare it against the frame of the clip at the same instant.

16. **The capture waits for the screen to settle.** A `sleep 4` after
    writing `probe.ts` took the first photo stale, after a reload.
    `sondas.sh` compares the hash of the bottom third of the screen
    (the clock in the bar changes on its own) until two captures in a
    row match and differ from the previous probe. And if Metro threw an
    error in the middle of an edit (a half-written `measurements.ts`),
    Fast Refresh can end up serving old modules without warning:
    `simctl terminate` + `launch` and then check in the bundle
    (`curl localhost:8081/...entry.bundle | grep value`).

17. **The montages get looked at at full resolution.** Sixteen rows of
    text at 3× are shown shrunk to half and a blur of σ 1 pt
    disappears: an "incoming label too blurry" that did not exist got
    corrected. Eight rows per image, at 2×, and only then do you
    compare.

18. **Simulator B shuts itself down.** Three times in one session
    `(Shutdown)` showed up between two captures (probably when its
    window was closed). Before capturing,
    `simctl list devices | grep <udid>`, and if you need to, `boot` +
    `launch` + 10 s.

19. **Reanimated turns animations off with Reduce Motion, and the
    progress too.** `withTiming`, `withDelay` and `withSequence` come
    with `reduceMotion: System` by default: with Reduce Motion on in
    iOS they jump to the final value on the first frame (SOURCE:
    `react-native-reanimated/src/animation/util.ts:506`), and the
    modifiers pass it on to their children. A `withTiming` that IS the
    gesture (the 2 s fill of the hold) or that counts a state with
    opacity carries `reduceMotion: ReduceMotion.Never`, and reduce
    motion is applied by hand: opacity and color stay, scale and
    translation go (animate-expo § 9). RUNTIME: the pill went from 64
    to 182 of luminance in one frame and stayed there for the 2 s. To
    test it in the simulator: `xcrun simctl spawn <udid> defaults write
    com.apple.Accessibility ReduceMotionEnabled -bool true` and
    relaunch the app (`useReducedMotion` reads the value at startup).
    Dynamic Type: `xcrun simctl ui <udid> content_size
    accessibility-extra-extra-extra-large`, and `large` to go back.

20. **A probe leaves the piece parked until something unparks it.**
    `probe.ts` set back to `undefined` did nothing, so the piece stayed
    in its last state: a `commit` left the finished flag at true and a
    later `auto` did not press (the burst of captures gave a flat 221.5
    and it looked like the `skill` recipe was not working). Now the
    `undefined` probe returns it to rest. Even so, a round of `auto` is
    done after relaunching.

21. **A live Dynamic Type change does not re-measure the `Text`.** With
    the app open, switching to AX5 made the glyphs bigger but the
    label's box stayed the 17 pt one: clipped text. The label remounts
    with `key={factor}` when `useWindowDimensions().fontScale` changes.

### What Android and the performance measurement left behind (2026-09-07)

22. **`PlatformColor` with UIKit names is TRANSPARENT on Android, with
    no error.** `PlatformColor('systemFillColor')` is a
    `resource_paths` on Android, which only resolves
    `@android:color/…` and `?attr/…`; if nothing resolves,
    `FabricUIManager.getColor` returns 0 (SOURCE: react-native 0.86,
    `FabricUIManager.java:573`). The `stock` background came out with
    no background and no bars. System colors get written with their
    values (the ones from the UIKit table) and `useColorScheme`
    switches them.

23. **`SymbolView` with a string name draws NOTHING on Android.**
    SOURCE: `expo-symbols/src/SymbolView.tsx:32`: without
    `props.name.android` it returns `props.fallback`. With the name as
    an object (`{ ios: 'checkmark', android: 'check' }`) it draws the
    Material Symbols glyph with the font from
    `@expo-google-fonts/material-symbols`, and the weight for Android
    is an object `{ name, font }` you have to build yourself (the ones
    in `expo-symbols/src/android/weights` are not exported). On Android
    `size` is the size (it is a `Text` with `fontSize`), the other way
    round from iOS (trap 10).

24. **The `filter` blur exists on Android from API 31, and on iOS it
    does not.** SOURCE: `BaseViewManager.java:558` (`RenderEffect`,
    only with `SDK_INT >= S`). The blurred copies of the label are PNGs
    of SF Pro on iOS and the same `Text` with `filter: [{ blur: σ }]`
    on Android: a smudge of SF over a sharp Roboto looks doubled.

25. **A worklet that calls a `const` declared further down captures it
    as `undefined`.** The callback of the reset's `withTiming` called
    `reset`, defined after `complete`: "undefined is not a function"
    only at 5 s, in production and in dev. The functions a worklet
    calls go BEFORE the worklet (trap 14 already said it for the
    namespace case).

26. **`modify` on a shared value from JS sends the modifier to UI as a
    worklet.** A closure created in JS is not one: "[Worklets] Tried to
    synchronously call a Remote Function" in the animation queue, and
    on top of that it broke whatever came next in that queue. If a
    piece of data is written from both threads, one store per thread: a
    `makeMutable` that only UI touches (and JS reads at the end with
    `.get()`, which is synchronous) and a JS object for the JS side.

27. **On the Android emulator the DEVELOPMENT bundle drops frames that
    the production one does not.** RUNTIME (Pixel 9 / Android 16, Expo
    Go 57.0.9, `meter.tsx`): in dev, 47 frames dropped out of 372 in
    the sequence with no load at all (17 out of 44 during the hold); in
    production (`expo start --no-dev --minify`), 0 to 2. Before
    optimizing an animation for what an emulator shows in dev, measure
    it in production. And with `--no-dev` the app's `console.log` does
    NOT reach Metro: the meter sends the report by POST to `RECEIVER`
    (`probe.ts`).

28. **Android composites the children of a view with opacity one by
    one.** During the reset's fade, the 1 px overlap between the fill's
    two textures showed up as a light line. The view that fades carries
    `needsOffscreenAlphaCompositing` (Android; iOS does it on its own
    with `allowsGroupOpacity`).

29. **A function a worklet calls carries `'worklet'` even if all it
    does is build an object.** `timing()` and `spring()` (`recipe.ts`)
    built the `Movement` that `move()` consumes; called from `press` or
    `complete`, "[Worklets] Tried to synchronously call a Remote
    Function. Called 'tiempo' on the UI Runtime" (the function is now
    `timing`). The typecheck does not see it and on the JS thread it
    works: it shows up in Metro's log, not on the screen.

30. **The ink measured is not the opacity if the thing also scales.**
    To compare whether two elements come in together you measure the
    INK, Σ (255 − luminance) over the light background, which the blur
    preserves because all it does is spread it, but an element that
    grows contributes ink in proportion to its AREA: the factor is
    scale², not scale. hold-to-commit's contextual checkmark, at the
    same opacity as the text, measures 34 % against 74 % at q = .30
    only because it is at 63 % of its size (0.63² = 0.40). Before
    reading a delay into the difference, divide by scale². And the band
    being integrated has to have 3σ of the widest blur to spare on each
    side: with less, the spread ink falls outside and every
    intermediate state measures short. The piece's `tilde.py` does both
    things.

31. **To measure a state of the button, the window goes INSIDE the
    control, not around it.** To align two takes of the same
    choreography, a band of 1080×200 px around the pill was averaged.
    In dark mode it worked; in light, the white card around the button
    dominates the average and the event gets detected 200 ms off. The
    two takes came out out of sync and in the video for X each
    appearance showed a different instant. With the window inside the
    control (800×70 px, which is all pill in both modes) they agree
    within 33 ms. And the symptom did not show up in any number: it was
    seen by putting the four frames of the same instant side by side.

## The glass

`expo-glass-effect` is already installed (57.0.1) and it has traps you
do not see coming. The main one is that **a `GlassView` under an
animated opacity draws nothing**. It is all in [`GLASS.md`](GLASS.md).

## The stack, and why these are NOT the latest versions

| | installed | latest on npm |
| --- | --- | --- |
| react-native-reanimated | 4.5.1 | 4.6.0 |
| react-native-gesture-handler | 2.32.0 | 3.2.1 |
| @shopify/react-native-skia | 2.6.2 | 2.11.1 |
| expo-haptics | 57.0.1 | 57.0.2 |

**The first three are chosen by `expo install`, and that is the right
thing here.** In React Native a dependency brings native code that gets
compiled against the SDK's runtime: installing the latest from npm
against SDK 57 is installing a combination nobody tested, and it breaks
the native build, not the typecheck, the build. The repo's rule
(*always the latest stable*) is met all the same, in the one place
where it means something here: **the SDK is the latest**, 57. Inside an
SDK, "the latest" is the one it verified.

`expo-haptics` is another case: 57.0.2 came out on 2026-08-26 and the
system's 24h cooldown blocked it on purpose. 57.0.1 was installed. When
the window passes, `npx expo install --fix` bumps it.

The versions go in **exact**, with no `~`, the same as in the web repo.

## Testing on your real iPhone

**Today it works, with the Expo Go from the App Store**, and with no
build: on 2026-09-02 the store published Expo Go 57.0.9 and the workshop
is SDK 57. Before you send anyone off to sign anything, measure which
version is up there, because the store lags behind (it sat on SDK 54 from
September 2025 until that day):

```bash
curl -s "https://itunes.apple.com/lookup?id=982107779" | grep -o '"version":"[^"]*"'
```

### When the store lags behind: sign.expo.dev

This happened from September 2025 until 2026-09-02, and it can happen
again. **The App Store's Expo Go was version 54.0.2, published on
2025-09-23**, verified on 2026-08-27 in the App Store listing and in four
stores, with this workshop on **SDK 57** and the manifest Metro serves
asking for `runtimeVersion: exposdk:57.0.0`. Expo Go on iOS implements
**one SDK at a time**, so the SDK 54 one does not open an SDK 57 project,
and updating was not a matter of pressing a button.

What happened: **Apple did not approve Expo Go for SDK 55 onwards** for
months, and the store stayed nailed to 54. Expo tells it in
`expo.dev/changelog/expo-go-and-app-store-may-2026`. The phone said *"you
need a newer version"* and it was right. The update button did not exist,
because nothing newer had been published there.

**The way out is <https://sign.expo.dev>**, which is Expo's own: it signs
the Expo Go of whatever version you ask for with **your free Apple ID**
and installs it on the phone. Expo's docs say it in so many words, in
`troubleshooting/expo-go-version-mismatch`:

> "This installer uses your Apple ID's free developer provisioning, so it
> does not require a paid Apple Developer Program membership. The
> certificate is valid for about seven days."

The binary exists and it is public: Expo's API
(`api.expo.dev/v2/versions/latest`) gives client **57.0.9** for SDK 57, in
`github.com/expo/expo-go-releases`.

**The procedure, once:**

1. At <https://sign.expo.dev>: pick SDK **57**, sign in with your Expo
   account, pick the device and enter your Apple ID. (Expo says it uses
   those credentials as a session proxy and does not store them.)
2. On the iPhone: **Settings › Privacy & Security › Developer Mode**, turn
   it on and restart. Without that, iOS does not run an app signed for
   development.
3. Here: `pnpm phone`, which is `expo start --go`, and scan the QR. Same
   Wi-Fi as the Mac. If the network does not cooperate (guest Wi-Fi, VPN),
   `pnpm phone --tunnel`.

**It expires after 7 days.** When iOS says that "Expo Go" is no longer
available, that is what happened, and you go back to step 1. Nothing in
the project has to be redone: the app gets re-signed and that is all.

**And watch what Expo Go does not carry.** It is Expo's runtime, not this
workshop's dev client: if a piece uses `@shopify/react-native-skia` it
will not run there, and it will fail on the phone even though it runs in
the simulator. Everything else is there: reanimated, gesture-handler,
expo-symbols, expo-haptics.

**The alternatives with no expiry cost money.** `eas go` compiles your own
Expo Go and uploads it to YOUR TestFlight, and EAS Build does the same
with the app: both need the **paid Apple Developer Program**, because iOS
ad hoc distribution demands a profile that lists the UDID of every phone.
It is in `build/internal-distribution` of Expo's docs. And one detail that
bites: a phone just registered with `eas device:create` takes **24 to 72
hours** to process on Apple's side.

With either Expo Go: the same Wi-Fi as the Mac, `pnpm phone` (`expo start
--go`) with an `EXPO_TOKEN` from the SAME account as the phone's Expo Go,
because a logged-in Expo Go does not open anonymous projects, and scan the
QR. Before starting, `REACT_NATIVE_PACKAGER_HOSTNAME=<en0's ip>`: if the
Mac has a VPN or changed IP (four times in one week), the manifest points
at the wrong place. The Mac's Bonjour name did not work from the iPhone;
the IP did. An invalid `EXPO_TOKEN` does not fail at startup: the manifest
returns 500 (`The bearer token is invalid`), so check it first with `curl
-H "Authorization: Bearer $T" https://api.expo.dev/v2/auth/userInfo`. The
`--tunnel` (`@expo/ngrok` is in the project) works on a normal network,
but NOT on the university's: it intercepts TLS and the ngrok agent rejects
it (`x509: certificate signed by unknown authority`). That network does
not isolate clients, so the LAN by IP is enough. The same holds as in the
simulator: everything except Skia.

It is worth it even when the simulator works: **the simulator has no
haptics and no 120Hz screen**, which are exactly two of the things this
vault studies. A gesture that feels good in the simulator can feel wrong
in the hand.

**Recording from the phone is different** from recording from the
simulator (see "Recording the piece", further down). `pnpm record` uses
`simctl`, which only talks to simulators: against a real iPhone it is no
use. There you record with iOS's screen recording (Control Center) and
move the file to `VAULT_DIR/native/` by hand, over AirDrop or by cable
with QuickTime. The rest of the path does not change: the grid picks it up
the same way.

Written down for when it starts to hurt: if recording from the phone
becomes frequent, the step to automate is that transfer, not the
recording.

## Testing on Android

**What is on this Mac since 2026-09-07** (installed with Homebrew, no
Android Studio): `openjdk@21` (keg-only: `JAVA_HOME=$(brew --prefix
openjdk@21)/libexec/openjdk.jdk/Contents/Home`), the cask
`android-commandlinetools`, and with `sdkmanager --sdk_root=$HOME/Library/
Android/sdk` the packages `platform-tools`, `emulator`,
`platforms;android-36` and `system-images;android-36;google_apis;arm64-v8a`.
An AVD called `taller` (Pixel 9). None of this travels with the repo.

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
$ANDROID_HOME/emulator/emulator -avd taller -no-snapshot-load -no-boot-anim -gpu auto &
adb() { $ANDROID_HOME/platform-tools/adb "$@"; }
adb shell getprop sys.boot_completed        # 1 once it has booted (~35 s)
```

**Expo Go, not the dev client**: the dev client is iOS. The Expo Go
version for the SDK comes out of the versions API, with the APK's URL:

```bash
curl -s https://exp.host/--/api/v2/versions/latest | python3 -c \
  "import sys,json; s=json.load(sys.stdin)['data']['sdkVersions']['57.0.0']; print(s['androidClientVersion'], s['androidClientUrl'])"
adb install -r Expo-Go-57.0.9.apk
adb shell am start -a android.intent.action.VIEW -d "exp://<en0's ip>:8083"
```

The server is the same `pnpm phone` as the iPhone's (with `EXPO_TOKEN` and
`REACT_NATIVE_PACKAGER_HOSTNAME`); the emulator reaches the Mac over the
LAN's IP. An Expo Go with no session opens the project all the same: the
CLI only signs the manifest when the app asks it to. The first time, the
dev menu's sheet shows up on top of the piece, and it closes with its ✕.
Watch out for tapping blind: a tap that lands in the menu turns Fast
Refresh off.

```bash
adb shell input swipe 540 2271 540 2271 1400   # a 1.4 s hold on the button
adb exec-out screencap -p > capture.png
adb shell cmd uimode night yes                 # dark mode (no: light)
adb shell am force-stop host.exp.exponent      # relaunch clean
```

The usual holds: everything except Skia. And so does trap 27: the frames
get measured with `--no-dev --minify`, not with the dev bundle.

## Recording the piece, and the mockup for X

What recording the first piece taught (2026-09-03), in the order in which
it bites:

**`simctl` records at a variable rate.** While something moves it writes
60 frames per second (deltas of 17 ms, measured); with the screen still it
writes none. The `<video>` plays it back fine, but **normalize with
`fps=60` BEFORE trimming**: a `-ss` over the raw file lands on the first
frame written after the cut point and the opening rest disappears
entirely. The right order is `fps=60,trim=start=…,setpts=PTS-STARTPTS`,
plus `tpad` to hold the last frame, which was not recorded either.

**The blue nut is Expo Go**, the floating button of its development menu.
On the phone it does not appear, and the dev client does not have it. In
the simulator it goes away with an Expo Go preference, without killing
anything:

```bash
xcrun simctl spawn booted defaults write host.exp.Exponent EXDevMenuShowFloatingActionButton -bool false
```

and relaunch Expo Go. It stays off for that simulator.

**hold-to-commit's recording probe** lives in its `hold-to-commit.tsx`,
branch `probe === 'demo'`, with its timeline above it. It calls the SAME
worklets the finger calls (`press`, `complete`, `reset`), so the curves,
the timings, the haptics and the sound are the ones of the real path. Two
things cost a round each: the opening rest has to be generous (at 1800 ms
the light take loaded more slowly and the 1.2 s cut before the gesture
landed BEFORE the piece had finished mounting), and the reset is brought
forward to 2 s because the workshop's 5 s are three seconds of nothing in
a video. So that the 5 s clock does not fire afterwards over the rest,
`reset` cancels `wait`.

**And if the piece looks different in light and in dark, that is TWO
takes**, the same probe with `simctl ui <udid> appearance light|dark`.
They get cut aligned by the same event, the commit and not the first
gesture, or the two videos show different instants of the choreography.
Watch where you measure to find that event: see trap 31.

**Look at the status bar BEFORE you spend the takes.** `status_bar
override` nails the time, the signal and the battery, but it does not
touch the breadcrumb iOS leaves at the top left, "◀ Safari", after opening
the app from a link. It shows up on its own, the script does not put it
there, and a take with that in it shows in the video for X, where the
camera opens and shows the whole phone. An extra `terminate` plus `launch`
gets rid of it. Checking costs fifteen seconds (`simctl io <udid>
screenshot` and look at the first 180 px) and fixing it afterwards costs
two takes.

**The recording probe (`?demo=1`), to copy.** This is what recorded
swipeable-tabs' video and it does not travel with the piece. It stays here
for the next one. Three rules that came out of three failed takes:

1. **Be born on the real starting tab:** `contentOffset={{ x: width, y: 0 }}`
   on the pager and `scrollX` born at `width`. A `scrollTo` in the first
   effect does not reach the pager and leaves the bar on one tab with
   another tab's content.
2. **The drags go through the bridge that already exists** (`target`,
   whose reaction does a `scrollTo` per frame and whose `onScroll` feeds
   `scrollX`), with `motion` set to `drag` and `target` back to `NONE`
   when it ends. A reaction of its own over another shared value jumped
   instead of dragging.
3. **The taps are `onTap`.** And the bar has to take "there is a tap" from
   `motion === tap`, not from `target !== NONE`, or it reads the tap's
   segment during a synthetic drag.

```tsx
const drag = (a: number, b: number, slow: boolean) =>
  scheduleOnUI((a: number, b: number, width: number, slow: boolean) => {
    'worklet'
    motion.set(MOTION.drag)
    target.set(a * width)
    const done = (t?: boolean) => { 'worklet'; if (t) { target.set(NONE); motion.set(MOTION.still) } }
    target.set(slow
      ? withTiming(b * width, { duration: 1700, easing: Easing.inOut(Easing.sin) }, done)
      : withSequence(
          withTiming((a + (b - a) * 0.15) * width, { duration: 110, easing: Easing.in(Easing.quad) }),
          withTiming(b * width, { duration: 430, easing: Easing.out(Easing.cubic) }, done)))
  }, a, b, width, slow)
// wait 1500 · drag(1, 2, true) · wait 2600 · onTap(0) · wait 1000
// · flicks 0→5 every 1000 · two back every 1000
```

The take: `status_bar override --time 9:41 … --batteryState discharging
--batteryLevel 100`, `terminate host.exp.Exponent`, `recordVideo --codec
h264`, `openurl exp://127.0.0.1:8082/--/<slug>?demo=1`, 25 to 30 s; measure
the gestures with the difference between frames at 60 fps and cut 1.2 s
before the first one. The master goes to `.context/mockup/master/`.

**The agent can record on its own.** There is no way to send a finger to
the simulator, but the piece drives itself from the inside with a
temporary probe: the taps are `onTap(i)`, the real path; the drags get
synthesized by moving the pager's offset frame by frame with
`withSequence(withTiming(15 % of the trip, 110 ms, easeInQuad), withTiming(target, 430 ms, easeOutCubic))`,
a finger that speeds up and lets go, fitted by eye against X's measured
drags, with `motion` set by hand to `drag` and `still`. The probe gets
deleted before closing, like all of them.

**A piece's master does not have to be in the vault.** The vault is what
belongs to other people. `swipeable-tabs` was taken out of there on
request and its master lives in `.context/mockup/master/<slug>.mp4`
(gitignored). It gets handed to the mockup with `--clip=…`. And the video
that goes to the exhibition comes in with `pnpm piece:video <slug> <file>`
from the root, not with Add to Exhibition (see the root `AGENTS.md`, path
B).

**The video gets built in `mockup/` (Remotion), not here.** The same
numbers, the measured bezel, the background, the shadow, the camera and
the curves, live in `mockup/src/parameters.ts` as Remotion Studio
controls: they get iterated live and it renders once (2160² at 60 fps in a
couple of minutes). The ffmpeg script below stays as the receipt for how
each number was measured, and as a path with no Chrome. Asking it for
iterations means re-encoding for every adjustment. See `mockup/AGENTS.md`.

**`pnpm mockup <slug>`** puts the vault's recording inside Apple's
official bezel, over a neutral background, with a camera that comes in and
goes out, at 2160² and 60 fps. **The reference is @nater02's clip**
(x.com/nater02/status/2092952884987957708) and it is measured frame by
frame: flat RGB (235, 230, 232) background; black phone at 95.3 % of the
height, centered; shadow only to the right and below, two layers (one
tight and one wide) fitted against the luma profile; the camera comes in
to 1.576× over 0.65 s, stays, and goes out to 1.161× over 0.62 s, with
both curves fitted to a cubic bézier (rms 0.005). The phone is the
**iPhone 17 in Black**, the reference's one by proportion and color, since
the Pro Max does not come in black, and the Pro Max recording goes into
its slot scaled (same proportion to 0.1 %). The receipts, one per number,
are at the top of `scripts/mockup.mjs`.

Knobs: `--wait` (seconds with the whole phone before coming in), `--until`
(when to go out: the end of the first gesture), `--focus` (where the
entrance points, as a fraction of the body's height; 0.145 is this piece's
row of tabs), `--camera=still`, `--model`, `--color`, `--background`,
`--side`. With an image (`pnpm mockup <slug> <image>`) the canvas comes out
of the image, the largest whole multiple that fits, with nearest neighbor,
pixel by pixel, and the camera stays still unless you ask for it
(`--blur`, `--light` and `--canvas` are still there).

**Before you look at the result, `pnpm mockup <slug> --verify`.** It puts
a solid red in instead of the recording, renders the whole camera with no
loss and checks pixel by pixel that the bezel's slot is full in twelve
states of the camera. It exists because the first version of the camera
sat the screen 15×20 px off, and the background showed through at the top
left corner. In the whole frame you could not see it; in the user's zoom
you could ("look at the edges, they are not filled", 2026-09-04). Each
layer positions itself on its own and rounds to the pixel per frame: an
origin taken wrong does not fail, it shows. The bezel's PNGs live in
`.context/mockup/`, gitignored: Apple's license allows using them for
mockups of interfaces on their platforms and not redistributing them. They
get downloaded from <https://developer.apple.com/design/resources/>
(Bezel-iPhone-17.dmg).

**What this pipeline does not give, and what would give it.** The gestures
are synthetic, the probe moves the pager with measured curves, not a
finger. If you want the feel of a real finger, the recording gets done on
the phone with Expo Go and a tool that records over USB with a frame:
Screen Studio does it but with no auto-zoom on iOS (it does not see the
taps); Matte records simulator or iPhone with a frame and zoom. The rest,
background, camera and shadow, is already here, measured, and free.

## The agent beside the simulator

The MCPs that give it eyes, `expo-mcp` for screenshots and simulator
automation and XcodeBuildMCP for the Xcode side, are surveyed in the recon
and **are not connected here yet**. In the meantime the agent writes the
files and you watch the simulator, which is the mode that already works:
Metro hot reloads and the piece updates without losing its state.

## What does not travel

`node_modules/`, `.expo/`, `/ios` and `/android` are gitignored. What
travels is **the pieces' code**, which is the point of having it inside
the repo: a new worktree runs `pnpm install` and has the whole workshop.

**The dev client gets built once per machine, not per worktree.** The
native dependencies live in the app installed on the simulator, so as long
as a piece is only TypeScript, the normal case, any worktree feeds it from
its own Metro. Only when a new native dependency comes in do you have to
rebuild.

## One worktree at a time against the simulator

But **one at a time**: two worktrees cannot use the simulator at once, and
the way it fails is treacherous.

The dev client is compiled with `expo run:ios`, and that build **does not
include `expo-dev-client`**. It is not in `package.json`, and it is
verified: inside `Workshop.app` there is no `EXDevLauncher` and nothing
else of the launcher. With no launcher there is no screen for picking a
server, so the app asks for the bundle **always at `localhost:8081`**, the
port `expo run:ios` baked into it.

So the second `pnpm ios` finds 8081 taken and offers 8082, and in
non-interactive mode not even that, it stops. If you bring it up anyway,
the app keeps reading from the first one. Nobody warns you, because on
your side everything compiles. **The symptom is the worst possible one:
the workshop's index shows up without your piece**, as if
`require.context` had not found it.

Ten seconds rule it out:

```bash
lsof -nP -iTCP:8081 -sTCP:LISTEN     # whose port is it?
```

If that pid is not your Metro, it is another worktree's, and the only way
out is to kill it and bring yours up on 8081. There is no shortcut. The
two that looked obvious were both tried and neither works: `simctl
openurl` with the dev client's scheme (the app does not understand that
URL, it has no launcher) and forcing `RCT_jsLocation` in the app's plist
(Expo overwrites it with the build's port on every start).

If this starts to hurt often, what has to get added is `expo-dev-client`.
It is a native dependency: it forces `pnpm ios:build` again, and that is
why it is a decision and not a fix in passing.
