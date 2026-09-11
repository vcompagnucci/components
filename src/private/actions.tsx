import { Fragment, useEffect, useRef, useState } from "react";
import css from "./actions.module.css";
import dlg from "./vault.module.css";
import { trashClip, renameClip, type Clip } from "./clips";

/* ═══════════════════════════════════════════════════════════════
   RENAME AND MOVE TO THE TRASH, with the right click.

   Before this the two of them lived in the Finder. The sign that they
   were missing was literal: in a capture of the detail you could see
   the OPERATING SYSTEM's "click to rename" tooltip on top of the video.

   DELETE MOVES TO THE TRASH. See the __trash endpoint: from a studio
   app an unlink has no undo to save it.
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   WHERE A MENU COMES FROM: the two forms, and why they are two.

   The right click opens it at a POINT: the menu appears where you
   pressed and there is nothing else to hook onto.

   The ··· in the bar opens it from a BUTTON, and there the point is not
   enough: a popover has to grow from its trigger and end up aligned
   with it, not with the exact pixel where the cursor landed inside the
   button.

   They are written as two cases and not as one with a zero-sized
   rectangle on purpose: the gap to the trigger is 4 and the gap to the
   cursor is 0, so collapsing them would force one more parameter to
   tell apart exactly what tells them apart.
   ═══════════════════════════════════════════════════════════════ */
export type Where =
  | { x: number; y: number }
  /* `align` is BY WHICH EDGE the menu sticks to the button. The ··· sits
     against the right rail, so its menu aligns to the right and falls
     inward; aligned to the left it would run off the page. */
  | { anchor: DOMRect; align: 'left' | 'right' }
  | null;

/* ═══════════════════════════════════════════════════════════════
   WHILE SOMETHING LEAVES, YOU STILL HAVE TO KNOW WHAT IT WAS.

   Every exit in the private area was written and NONE of them ran.
   Measured frame by frame: the menu disappeared from the DOM on the
   first frame after the click, and the dialog went from opacity 1 to
   not existing. The menu's 120ms and the dialog's 180 never existed.

   The cause was not in the CSS (which is fine) but in what mounts it.
   The layer of menus and dialogs renders only if there is a subject:

     const subject = menu?.clip ?? renaming ?? deleting
     const layer = subject ? (<><Menu …/><Dialog …/></>) : null

   and the subject becomes null EXACTLY at the instant the exit would
   have to start. React pulls the node, and a node that is not there
   cannot animate. It is the same trap the upload dialog had already
   solved by hand, with its `shown` list: "the last thing there was
   stays until something else arrives".

   This is that idea, once and for everyone: it returns what there is,
   and if there is nothing, the last thing there was. The subject
   outlives its own exit and only then can it animate.

   The state is adjusted DURING the render (the pattern React documents
   for deriving from props) and not in an effect: in an effect there
   would be one frame with the subject already null, which is the flinch
   we came to take out.

   WHAT GOES IN HAS TO BE STABLE BETWEEN RENDERS while it does not
   really change: it compares by identity. A value coming from useState
   (which is the case for all three that use it) is. An object built in
   the render is not, and there React cuts in with "Too many
   re-renders"; it fails loudly and visibly, not in silence. */
export function useLast<T>(v: T | null | undefined): T | null {
  const [last, setLast] = useState<T | null>(v ?? null);
  if (v != null && v !== last) setLast(v);
  return v ?? last;
}

/* Where the menu opens. If it does not fit downward or rightward, it
   flips, and THE SCALE'S ORIGIN flips with it, so it keeps growing from
   the point where you pressed and not from a corner that ended up on
   the other side.

   The two forms of `Where` are resolved here and nowhere else: the
   caller passes where it came from, not where it goes. */
const MARGIN = 8;
/* What separates the menu from its trigger. It is the same gap the
   Device picker uses to come off its value, in details.tsx. */
const GAP = 4;

/* ─── THE INK GETS ALIGNED, NOT THE BOX ───
   The menu stuck to the trigger's edge and looked shifted. Measured:
   the title starts at 208, the menu at 208, and the first item's TEXT
   at 222. The 14 is the menu's padding plus the item's, that is,
   whitespace the eye does not count but the layout does.

   It is exactly the mistake .play already fixes with its negative
   margin and the title's chevron with its own: "what the eye aligns is
   the INK". Here the number is not written, it is measured from the
   DOM, so if tomorrow the item's padding changes this corrects itself. */
function indentOf(menu: HTMLElement): number {
  const item = menu.querySelector<HTMLElement>('[role="menuitem"]');
  if (!item) return 0;
  return item.offsetLeft + parseFloat(getComputedStyle(item).paddingLeft);
}

function place(w: NonNullable<Where>, width: number, height: number, indent = 0) {
  if ("anchor" in w) {
    const r = w.anchor;
    /* Below the button; if it does not fit, above. Aligned by the edge
       the caller asked for, and subtracting the indent so what ends up
       plumb is the text. */
    const above = r.bottom + GAP + height + MARGIN > window.innerHeight;
    const left =
      w.align === "right" ? r.right - width + indent : r.left - indent;
    return {
      left: Math.max(MARGIN, Math.min(left, window.innerWidth - MARGIN - width)),
      top: above ? Math.max(MARGIN, r.top - GAP - height) : r.bottom + GAP,
      /* THE ORIGIN ALSO GOES ON THE INK. The menu scales from its
         trigger (/animate and /apple-design both ask for it) and the
         trigger is the word, not the whitespace around it. Without this
         it would grow from a corner 14px outside the title.

         THE ORDER IS `x y` AND NOT THE OTHER WAY AROUND. The first
         version said `top 14px` and it was an INVALID DECLARATION: when
         one of the two values is not a keyword, the first one has to be
         the horizontal, and `top` is not. The browser discarded the
         whole thing and the origin went back to the default. */
      origin: `${w.align === "right" ? width - indent : indent}px ${
        above ? "bottom" : "top"
      }`,
    };
  }
  const flipX = w.x + width + MARGIN > window.innerWidth;
  const flipY = w.y + height + MARGIN > window.innerHeight;
  return {
    left: flipX ? Math.max(MARGIN, w.x - width) : w.x,
    top: flipY ? Math.max(MARGIN, w.y - height) : w.y,
    origin: `${flipY ? "bottom" : "top"} ${flipX ? "right" : "left"}`,
  };
}

/* ═══════════════════════════════════════════════════════════════
   THE MENU, WITHOUT KNOWING WHAT IT OPENED OVER.

   Here lives EVERYTHING that makes a floating menu a floating menu:
   where it sits, which way it flips when it does not fit, from which
   corner it grows, and the three ways to close it. What it does NOT
   know is what its items say or what object they are about. Whoever
   uses it puts that in.

   It got separated when the second client showed up: the right click
   over a card in the PLAYGROUND wants the same menu with two other
   words. Copying it would have left two surfaces that look alike until
   the day one of them gets touched.
   ═══════════════════════════════════════════════════════════════ */
/* An item in the menu. `destructive` is not only a color: besides
   painting the item in --destructive, it makes the menu put a hairline
   in front of it. Both things are the same decision (see
   .item[data-destructive] in actions.module.css) so they are asked for
   together with a single flag and not with two. */
export type MenuItem = {
  text: string;
  action: () => void;
  destructive?: boolean;
};

export function Menu({
  where,
  label,
  items,
  onClose,
}: {
  where: Where;
  /* For whoever hears it instead of seeing it: what it opened over. */
  label: string;
  items: MenuItem[];
  onClose: () => void;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ left: 0, top: 0, origin: "top left" });

  /* It is measured AFTER mounting and before painting: the height
     depends on how many items it has, and without that you do not know
     whether it fits downward.

     WITH offsetWidth/Height AND NOT WITH getBoundingClientRect: the
     menu at rest is at scale(0.96), and the rect returns the box
     ALREADY SCALED, 4% small. With the right-click menu you almost
     could not tell, because its left edge is the cursor and nothing
     gets subtracted; the bar's menu aligns by subtracting the width
     from the button's edge, so there the 4% is 7px of menu hanging
     outside. Measured.

     offsetWidth is layout: it ignores transforms by definition, so
     nothing has to be turned off and no reflow forced to read it. */
  useEffect(() => {
    const el = box.current;
    if (!el || !where) return;
    setPos(place(where, el.offsetWidth, el.offsetHeight, indentOf(el)));
  }, [where]);

  /* Close with Escape, with a click outside, and on scroll: a menu
     anchored to a point on the screen that stays while the content
     moves stops being anchored to anything. */
  useEffect(() => {
    if (!where) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const outside = (e: MouseEvent) => {
      const t = e.target as Element;
      /* THE TRIGGER DOES NOT COUNT AS OUTSIDE. Without this, pressing
         the ··· with the menu open closes it on the pointerdown and the
         click behind it opens it again: it closes and opens in the same
         gesture, and nothing happens on screen. The toggle belongs to
         the trigger's click; this handler looks at the rest of the page.

         It is the same line the Device picker already had in
         details.tsx, with the other popup role. The right click has no
         trigger, so for it this does not exist. */
      if (t.closest?.('[aria-haspopup="menu"]')) return;
      if (!box.current?.contains(t)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", outside, true);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", outside, true);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [where, onClose]);

  /* IT DOES NOT UNMOUNT ON CLOSE: it turns off. It used to be `if
     (!where) return null` and that is why the 120ms of exit written in
     the CSS never ran, the node was already gone. Now what rules is
     `data-open`, which is what the CSS was already written against.
     `pos` is not touched on close (the effect above returns early if
     there is no `where`) so the menu leaves from where it was and does
     not jump to the corner. */
  return (
    <div
      ref={box}
      className={css.menu}
      data-open={where ? "" : undefined}
      role="menu"
      aria-label={label}
      style={{ left: pos.left, top: pos.top, transformOrigin: pos.origin }}
    >
      {items.map((it) => (
        /* The Fragment exists for the hairline: it is the item's
           sibling, not part of it, because it separates TWO items and
           belongs to neither. With a ::before inside the button the
           hover would paint it too. */
        <Fragment key={it.text}>
          {it.destructive && <div className={css.separator} aria-hidden="true" />}
          <button
            className={css.item}
            role="menuitem"
            data-destructive={it.destructive ? "" : undefined}
            onClick={() => {
              onClose();
              it.action();
            }}
          >
            {it.text}
          </button>
        </Fragment>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   THE ↗ IN THE BAR: the only clip action promoted to an icon.

   The three things you can do with a clip lived only in the right
   click, that is, they did not exist: a context menu announces nothing,
   you have to know it is there. Two of the three got solved by putting
   the menu in the title; this one goes up to a permanent control.

   ─── WHY THIS ONE AND NOT ANOTHER ───
   It is the only one that is not about the file's identity or its
   existence: renaming and the trash belong to the document, and that is
   why they live in its menu. This one TAKES YOU somewhere else, and it
   is also the only one of the three with no consequence. Sending it a
   thousand times breaks nothing. A permanent icon is for what you press
   without thinking.

   ─── THE TRAILING EDGE ───
   Next to the inspector toggle, and it is not a reading of ours:
   Apple's HIG lists what lives there (Toolbars › Item groupings,
   "Trailing edge"), the important items that have to stay available and
   the buttons that open nearby inspectors. The two things that are
   there are in that sentence, and they are also the only ones that do
   NOT collapse into the overflow menu when the window shrinks.

   The toggle goes last, against the rail: that same page anchors the
   sidebar one to the "far leading edge", and this is its mirror. And it
   is the one you press repeatedly, so it is the one that cannot move.

   ─── THE DRAWING ───
   arrow.up.forward.square: a box open at the corner and an arrow
   leaving. It says the two things the action does, take the clip and
   take you. With no border around it, which is what the HIG asks for
   because the section already acts as a container.
   ═══════════════════════════════════════════════════════════════ */
export function PlaygroundButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      className={css.trigger}
      aria-label="Open in playground"
      title="Open in playground"
      onClick={onOpen}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <g
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 9.25v2.25A1.5 1.5 0 0 1 11.5 13h-7A1.5 1.5 0 0 1 3 11.5v-7A1.5 1.5 0 0 1 4.5 3H6.75" />
          <path d="M9.75 3H13v3.25" />
          <path d="M13 3 8.25 7.75" />
        </g>
      </svg>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   THE SECOND WAY OUT: the piece this clip produced.

   It sits next to the playground's arrow and it is drawn as the
   DESTINATION, not as a departure. The two would be confusable with an
   arrow each, and they are not the same gesture: the playground's takes
   the clip WITH you and puts it on a canvas, while this one takes you
   to something already finished, with nothing travelling.

   ─── THE DRAWING ───
   Not an SF Symbol: it is a card of the exhibition, which is a shape
   this product owns. The showcase on top and the name underneath, the
   anatomy of every card in the list. Same box, same 1.5 stroke and same
   round joins as the arrow beside it.

   It only exists when the clip HAS a piece. There is no disabled
   state: a control you cannot press is a question you cannot answer,
   and the answer lives in the details panel, one row above.
   ═══════════════════════════════════════════════════════════════ */
export function ExhibitionButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      className={css.trigger}
      aria-label="Open in exhibition"
      title="Open in exhibition"
      onClick={onOpen}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <g
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2.75" y="2.75" width="10.5" height="7" rx="1.5" />
          <path d="M2.75 12.75h6.5" />
        </g>
      </svg>
    </button>
  );
}

export function ClipMenu({
  clip,
  where,
  onClose,
  onPlayground,
  onExhibition,
  onRename,
  onTrash,
}: {
  clip: Clip;
  where: Where;
  onClose: () => void;
  /* OPTIONAL, and its absence is what takes the item out. There is no
     separate boolean because they would be two truths about the same
     thing: if there is nobody to call, there is nothing to offer.

     Who does not pass it: the detail, where sending to the playground is
     already a permanent button in the bar (see PlaygroundButton).
     Repeating it in the menu would be offering the same thing twice ten
     pixels apart. The grid does pass it: there is no bar there, and the
     right click is the only way. */
  onPlayground?: () => void;
  /* OPTIONAL FOR ANOTHER REASON than onPlayground's. That one is absent
     where the same action is already a button ten pixels away; this one
     is absent when the action does not EXIST, because the clip has no
     piece written down. So the menu of a clip that produced nothing is
     the menu it always was. */
  onExhibition?: () => void;
  onRename: () => void;
  onTrash: () => void;
}) {
  /* THE ORDER IS BY CONSEQUENCE, from the lightest to the heaviest:
     sending the clip to a canvas does not touch it, renaming it changes
     the file, and the trash takes it away. That way the destructive one
     is always last and far from the cursor when the menu opens
     downward. The hairline that separates it is put there by the Menu,
     from the flag.

     ADD TO EXHIBITION IS NOT HERE, and it was: publishing lived in this
     menu for a day and moved to the board. The vault is what is
     EXTERNAL (references you look at) and publishing is the end of the
     workshop, so the gesture lives where your work is: the right click
     over a frame in the playground. See PublishDialog, below. */
  return (
    <Menu
      where={where}
      label={clip.name}
      onClose={onClose}
      items={[
        /* "Open in playground" and not "Add to playground": what it
           really does is TAKE YOU there, with the clip already placed.
           Promising only half the gesture would make the navigation
           feel like a jump you did not ask for. */
        ...(onPlayground
          ? [{ text: "Open in Playground", action: onPlayground }]
          : []),
        /* THE SECOND WAY OUT, and it goes right after the first
           because they are the same class of thing: both take you
           somewhere and neither touches the file. Between the two, this
           one is the lighter, since the playground's also PLACES the
           clip on a canvas and this one only navigates. The order of
           the menu is by consequence, so the one that changes nothing
           at all comes first of the two.

           Same wording as the other: "Open in", not "Go to". It says
           where you end up, and it says it the way the item above it
           does. */
        ...(onExhibition
          ? [{ text: "Open in Exhibition", action: onExhibition }]
          : []),
        /* NO ELLIPSIS, AND IT IS A CONSCIOUS DIVERGENCE.
           Menus › Labels asks for it: "Append an ellipsis to a menu
           item's label when the action requires more information before
           it can complete". Renaming opens a dialog that asks for the
           name, so it would qualify.

           It is withdrawn anyway, by the owner's decision (2026-08-25).
           What the ellipsis buys (warning that one more step is going
           to be needed) is worth little here: this menu has TWO items
           and both are obvious, so the mark adds typographic noise
           without settling any doubt.

           Written down because it is the only thing in this bar that we
           know departs from the HIG on purpose, along with nothing
           else. */
        { text: "Rename", action: onRename },
        { text: "Move to Trash", action: onTrash, destructive: true },
      ]}
    />
  );
}

/* A native <dialog>: trapped focus, Escape, the inert background and the
   ::backdrop come free. The animation is the upload dialog's, overlay
   and display with allow-discrete plus @starting-style.

   Exported for the same reason as Menu: the playground view's dialogs
   are this box with other content inside. The surface lives here; what
   it says, in each one. */
export function Dialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  /* What the dialog SAYS also has to outlive its exit. With `{open &&
     children}` the content left on the first frame and the box faded
     out empty: 180ms of a blank card. */
  const inside = useLast(open ? children : null);

  return (
    <dialog
      className={`${dlg.dialog} ${css.narrow}`}
      ref={ref}
      /* A CLICK OUTSIDE CLOSES. It is the browser's light dismiss
         (`closedby="any"`, Chrome 134 / Safari 26 / Firefox 141) and
         not a listener of ours: the platform already knows that a click
         that STARTS outside and ENDS outside closes, and that one that
         starts inside and gets dragged outside (selecting text past the
         edge) does not. Written by hand that always comes out wrong.

         And it closes by the same path as Escape and as the Cancel
         button: it fires `close`, which is what onClose listens to. One
         single exit for the four ways of closing, and the animation is
         the same for all of them. */
      closedby="any"
      onClose={onClose}
    >
      {inside}
    </dialog>
  );
}

export function RenameDialog({
  clip,
  open,
  onClose,
  onDone,
}: {
  clip: Clip;
  open: boolean;
  onClose: () => void;
  onDone: (path: string) => void;
}) {
  const [name, setName] = useState(clip.file);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setName(clip.file);
      setError(null);
    }
  }, [open, clip.file]);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      onDone(await renameClip(clip.path, name));
      onClose();
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <h2 className={css.title}>Rename clip</h2>
      {/* The extension is neither shown nor edited: the server puts it
          there copying it from the file, so renaming cannot change the
          type. Showing a field that does nothing would be lying. */}
      <p className={css.message}>
        The file keeps its {clip.ext.replace(".", "")} extension.
      </p>
      <input
        className={css.field}
        value={name}
        autoFocus
        aria-label="New name"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
      />
      {error && <p className={css.error}>{error}</p>}
      <div className={css.footer}>
        <button className={css.action} onClick={onClose}>
          Cancel
        </button>
        <button
          className={css.action}
          data-primary=""
          disabled={busy || !name.trim() || name === clip.file}
          onClick={save}
        >
          Rename
        </button>
      </div>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PUBLISH: the "this one is done" part of the path.

   It lives on the BOARD, not in the vault: the vault is what is
   external (what you look at) and what gets published is yours, which
   is what is in the playground. The right click over a frame offers Add
   to Exhibition, and which piece comes out is said by the frame: a
   sketch publishes a live Web one, a recording publishes an App one.
   That is why there is NO platform picker.

   The form is the piece's mold and nothing else: a name and one line of
   description, exactly the two lines of the public detail. The name
   arrives filled in (the sketch's or the clip's); the description
   starts empty on purpose, it is the only value the file does not know
   about itself.

   WHEN IT FINISHES IT TAKES YOU TO THE PIECE. There is no toast in this
   system; the confirmation is the real exhibition page with the demo
   running. A hard navigation on purpose: pieces.ts has just changed on
   disk and reloading is how ALL the modules see it, without depending
   on what order the hot update arrives in.

   This component does not know WHAT it publishes: it gets the verb by
   prop, the way Menu gets its items. What changes between the two
   branches (the endpoint and the sentence that says in advance what is
   going to happen) is put there by the board. */
export function PublishDialog({
  open,
  initialName,
  message,
  publish,
  onClose,
}: {
  open: boolean;
  initialName: string;
  /* The sentence under the title: what is going to happen, said
     beforehand. */
  message: string;
  publish: (name: string, desc: string) => Promise<string>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [desc, setDesc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setName(initialName);
      setDesc("");
      setError(null);
    }
  }, [open, initialName]);

  const ready = !busy && !!name.trim() && !!desc.trim();
  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const slug = await publish(name.trim(), desc.trim());
      location.assign("/" + slug);
    } catch (e) {
      setError(String((e as Error).message));
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <h2 className={css.title}>Add to Exhibition</h2>
      <p className={css.message}>{message}</p>
      <input
        className={css.field}
        value={name}
        autoFocus
        aria-label="Piece name"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      {/* The description is the subtitle of the detail, and the
          placeholder pushes toward the system's copy rule: say what it
          is or who it is for, never how well made it is. */}
      <input
        className={css.field}
        value={desc}
        aria-label="Description"
        placeholder="What it does"
        onChange={(e) => setDesc(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      {error && <p className={css.error}>{error}</p>}
      <div className={css.footer}>
        <button className={css.action} onClick={onClose}>
          Cancel
        </button>
        <button className={css.action} data-primary="" disabled={!ready} onClick={submit}>
          Add
        </button>
      </div>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOVE TO THE TRASH: WITHOUT ASKING.

   ─── THERE WAS A CONFIRMATION HERE AND IT WAS WITHDRAWN ───
   It was a <dialog> with "Move «X» to Trash?" and its two buttons. What
   knocks it down is Alerts › Best practices, which is explicit and uses
   OUR case as the example: do not show an alert for destructive actions
   that are COMMON AND REVERSIBLE. Its example is deleting a file,
   because people do it meaning to discard and they can undo it.

   The clip goes to the SYSTEM trash (see the __trash endpoint): it is
   not lost, it is moved. The premise holds, and the question was a toll
   with no cause.

   AND THE WARNING DID NOT DISAPPEAR, IT CHANGED MOMENT: before it
   arrived after the click; now it arrives before, because the item
   looks red in the menu. That is what makes taking the dialog out not
   the same as taking the warning out.

   ─── WHAT IS NOT CEREMONY AND STAYS ───
   The error. That same page says an alert IS good for telling you about
   a problem, and trashClip can fail (permissions, the file moved
   underneath, the server down). Without this a failure would be silent,
   which is worse than asking too much: you would believe you deleted
   something that is still there.

   That is why what stays is NOT the confirmation dialog with different
   text: it is another thing, with one button and no decision to take.

   ─── WHERE WE FALL SHORT, SAID OUT LOUD ───
   Apple's criterion is "can they undo it?", and here you undo it in the
   FINDER, not in the app. The complete pattern would be deleting
   without asking AND offering an undo inside, which today has nowhere
   to live, because this system has no toast and no status bar. When
   that surface exists, this is its first client.
   ═══════════════════════════════════════════════════════════════ */
export function TrashNotice({
  error,
  onClose,
}: {
  error: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!error} onClose={onClose}>
      {/* THE TITLE SAYS WHAT HAPPENED, not "Error": the HIG asks you to
          describe the situation and warns against titles that inform
          nothing ("Error", "Error 329347 occurred"). */}
      <h2 className={css.title}>Couldn't move the clip to Trash</h2>
      <p className={css.message}>{error}</p>
      <div className={css.footer}>
        {/* One button, and it says Done and not OK: the HIG asks for
            Done when there is a single way out and nothing to decide. */}
        <button className={css.action} data-primary="" onClick={onClose}>
          Done
        </button>
      </div>
    </Dialog>
  );
}

/* The gesture itself. It lives here and not in the vault because it
   belongs to this file (what you can do with a clip) and because the
   caller only needs to know one thing: whether there was an error. It
   never throws. */
export async function sendToTrash(clip: Clip): Promise<string | null> {
  try {
    await trashClip(clip.path);
    return null;
  } catch (e) {
    return String((e as Error).message);
  }
}
