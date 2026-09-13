# The glass

How to use `expo-glass-effect` without crashing into it. This is a
reference, not a procedure: the order of work is in the
[root `AGENTS.md`](../AGENTS.md), in the section on the process step by
step.

**Where it came from.** Read on 2026-08-28 from the
`chatgpt-attachments` implementation in
[SchroederNathan/react-native-motion](https://github.com/SchroederNathan/react-native-motion),
and checked against the types of the package we have installed. His repo
has no license, so there is no code of his here: there is what I learned
reading it, written again.

It is a serious implementation. The ChatGPT attachments are 2913 lines
with every color taken from watching the reference frame by frame and
the why written above it. What follows are his conclusions, not my
hypotheses.

---

## The central trap: it cannot be animated by opacity

Put a `GlassView` under an animated opacity and **it draws nothing, not
even at `1`**. It does not look faint: it disappears.

It has its own native transition for exactly this. The pattern is to
mount the surface at a fixed opacity and **change its style**, `regular`
⇄ `none`, with its `animationDuration`, instead of fading it.

One detail you have to know beforehand: **the first render has to start
at `none`** even if what you want is `regular`, so the transition has
somewhere to come from. Mount straight into `regular` and there is no
transition, there is a jump.

When what you need to fade is something *on top of* the glass, that does
fade normally: an ordinary view resting above, carrying the glass's
radius.

## Do not clip it

No `overflow: 'hidden'` over a `GlassView` **or over any of its
ancestors**. The native view rounds itself with its `borderRadius`, and
clipping it is exactly what kills the bulge the material makes under a
finger. What goes on top carries its own radius.

Corollary: the `borderCurve: 'continuous'` goes on the glass view, not
on a container that clips it.

**And the other way around with the fallback:** a `BlurView` does have to
be clipped. It is a blur, not a native material, and it does not round
itself. The two branches of the same component carry opposite rules, and
that is the one people forget.

## `isInteractive`: yes on a control, no on a container

| | |
| --- | --- |
| **Control**, a button, a pill | on: the material answers the finger like every iOS 26 control |
| **Container**, a panel with things inside | off, or the panel bulges when the finger was going to something inside it |

With one consequence worth keeping in mind: an interactive panel **gets
in the way of the touch**, so a tap on its own padding stops falling
through to the backdrop behind. If your panel closes when you tap
outside, that is what you want and not a side effect.

## The ladder down

`isLiquidGlassAvailable()` says whether the material is available. Below
iOS 26 you have to put something else.

The step down is a `BlurView` from `expo-blur` with a measured tint on
top to reach the same color; and on Android, where the blur sees nothing
(see item 8 of [`AGENTS.md`](AGENTS.md#what-we-already-know-bites)), a
flat color.

**`expo-blur` 57.0.2 is installed** since 2026-08-28, and the dev client
was rebuilt to take it in. It came in without a piece asking for it,
and that is the reason: without it the ladder has no last step, and
finding that out on the day you need it costs a `pnpm ios:build` at the
worst moment. (It is not the only one in the manifest with no importer.
`@expo/ui`, `expo-device` and `expo-image` are there too, from the
workshop's first install, and nothing uses them yet.)

## Two more flags

**1. `isLiquidGlassAvailable()` does not look at accessibility.** It
returns `true` all the same if the user has *Reduce transparency* on.
SOURCE: the package's own docs,
`build/isLiquidGlassAvailable.d.ts`:

> *"The value may also be `true` if the user has enabled accessibility
> settings that limit the Liquid Glass effect."*

and it sends you to check
`AccessibilityInfo.isReduceTransparencyEnabled()` separately. If a piece
depends on the glass for something to be readable, this is not optional.

**2. `isGlassEffectAPIAvailable()`** is exported too (SOURCE:
`expo-glass-effect@57.0.1`, `build/index.d.ts:6`). Worth a look before
assuming one flag is enough.

## The color is not chosen, it is measured

The most copyable thing in all of this is not the code, it is the
method: every color of the material came out of watching the reference
frame by frame. His panel measured over black gives `rgb(30,30,30)`; the
blur alone only reaches 19, so the tint on top exists **to close the 11
that are missing**. It is not an `rgba` that happened to look nice. It
is a subtraction.

It is the first of our four rules, found in another repo without our
having agreed on anything. A good sign for both sides.

## How the hold-to-commit button uses it (2026-09-04)

The `glass` variant
(`src/components/pieces/hold-to-commit/material.ts`) is the same button
with the capsule in a `GlassView` with style `regular`. Three decisions
come out of the traps above:

- **The glass is the container, and the child clips itself.** The fill's
  textures are clipped to the capsule with `overflow: 'hidden'`, and
  that cannot wrap the glass. So the `GlassView` is the parent,
  `absoluteFill`, with its circular `borderRadius` (like the measured
  pill; no `continuous`) and `isInteractive`, and INSIDE it goes the
  view that clips, with a transparent background. An
  `overflow: hidden` on a child does not touch the glass. It was first
  tried the other way around, with the glass as a sibling behind the
  clip, and it worked, but the finger landed on the textures and not on
  the material, which did not react.
- **Interactive, and with no press scale.** A glass control answers the
  finger with its own bulge; adding Opal's measured scale on top was
  double feedback. With `glass`, `ownScale` is false.
- **Content that passes underneath.** Over a flat background the glass
  is indistinguishable from a painted capsule: the background scrolls
  under the button, which floats.
- **Nothing of its own fades by opacity.** The only animated ancestor is
  the press scale, which is a transform. What does fade, the fill, the
  white veil, the labels, sits on top, in ordinary views.
- **The module is asked for with a `require` inside a `try`.** A static
  `import` runs `requireNativeViewManager` at load time and, if the
  binary does not link it, brings the whole piece down. With no module
  or without iOS 26 the option falls back to a flat translucent capsule.

And one that is not above: **nothing of Opal's on top of the glass**. The
resting sheen tints the material (the texture has alpha, 0..153, mean
42) and it was left in for the first version; but a glass shipped
properly carries no ornaments: no sheen, no ring (it brings its own
border), no veiled tip (that one is the color of the opaque pill). Only
the white fill of the hold, which is the gesture. In light mode the
resting label starts black (`useColorScheme`), like the label of every
glass control.
