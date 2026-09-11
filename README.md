# Interface exhibition

An exhibition of interface pieces, web and native, each one belonging to one
platform, shown on a single page. No code on screen, nothing to install.

**[components-three-pi.vercel.app](https://components-three-pi.vercel.app)**

```bash
pnpm install
pnpm dev        # localhost:3000
pnpm build
pnpm typecheck
```

Node 24 and pnpm. Versions go in exact, with no `^` and no `~`.

## The four documents

| | |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | how the product works and how the work gets done. Read this one first |
| [`LOG.md`](LOG.md) | every decision, its value and where it came from |
| [`DESIGN.md`](DESIGN.md) | the reference: tokens, values per viewport, the four rules |
| [`native/AGENTS.md`](native/AGENTS.md) | the Expo workshop, where an App piece gets built |

## What is where

`src/` is the product. `src/components/pieces/<slug>/` is one folder per piece,
with the piece, its `index.tsx` and its notes. `src/private/` is the vault and
the playground, and it exists only while the dev server runs: the build folds
it out, so `/vault` in production is a 404 like any made-up URL. `native/` is
the Expo workshop and `mockup/` renders the video for X.

The clips live in a folder of yours outside the repo, named by `VAULT_DIR` in
`.env.local`. Not one of them goes into git.

## The rules

1. **Nothing is claimed without measuring it**, yours or anyone else's. A rule
   that exists in a stylesheet is not a rule on the screen.
2. **One mini-decision at a time.** Whatever is not under study stays frozen.
3. **`src/private/` is not imported from the product.** The dependency goes one
   way, or the private area ends up in the bundle.
4. **The why goes at the top of the file and in the log.** A value with no
   receipt is one someone changes without knowing what it breaks.
5. **Every name uses precise professional vocabulary**, in code and in the
   public text: "tap to select", not "tap to jump".
