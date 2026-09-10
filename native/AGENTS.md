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
