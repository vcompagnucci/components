# Interface exhibition

**Read [`AGENTS.md`](AGENTS.md) before touching anything.** That is where
how everything works is written: the journey of a piece (vault →
playground → exhibition), the map of the repo, the dev/production
boundary and the working method.

**If you are here to build a piece**, the numbered procedure is in
[AGENTS.md › The process, step by step](AGENTS.md#the-process-step-by-step):
one path for **Web** (a sketch in the playground, published running) and
another for **App** (Expo in `native/`, published on video). The first
thing to decide is which one: where does the thing you are showing run?

This file is a pointer on purpose. It does not repeat content, so that it
cannot go stale.

| file | what it is |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | how the product works and how the work is done around here |
| [`LOG.md`](LOG.md) | the log: every decision, its value and where it came from |
| [`DESIGN.md`](DESIGN.md) | the reference: tokens, values per viewport, the four rules |

What is not negotiable, and is spelled out in `AGENTS.md`:

1. **Nothing is claimed without measuring it**, neither your own values
   nor anyone else's. A rule that exists in a stylesheet is not a rule on
   the screen.
2. **One mini-decision at a time**, explored with the `prototype` skill on
   the real page. Whatever is not under study stays frozen.
3. **`src/private/` is not imported from the product.** The dependency
   goes in one direction only, or the private area ends up in the bundle.
4. **The why is written at the top of the file** and in the log. A value
   with no receipt is a value someone is going to change without knowing
   what it breaks.
5. **Every name uses precise professional vocabulary** (files, functions,
   variables, commits, branches, whatever it is): the word an IBM engineer
   would write in a specification in 1972. No jargon, no funny or clever
   names. `deploy_dashboards.sh`, not `push_dashboards.sh`; and in the
   public text (title, description, notes), "tap to select", not "tap to
   jump".
6. **A comment says what the code cannot, and failure is loud.** The
   rules for the code itself are in
   [AGENTS.md › The code](AGENTS.md#the-code): what a comment has to
   earn, why no `catch` hides a failure and no cast silences the
   compiler, and the four commands of the gate. The fix for almost
   everything in there is deletion.
