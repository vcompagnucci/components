import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { createPortal } from "react-dom";
import css from "./vault.module.css";
import { Back, linkClick } from "../parts";
import { Player } from "./player";
import { useClips, uploadClip, type Clip, type Source } from "./clips";
import { toPlayground } from "./views";
import { DetailsButton, ClipDetails } from "./details";
import {
  TrashNotice,
  PlaygroundButton,
  ExhibitionButton,
  RenameDialog,
  ClipMenu,
  sendToTrash,
  useLast,
  type Where,
} from "./actions";

/* ═══════════════════════════════════════════════════════════════
   THE VAULT: the wall of references.

   The card is the measured one, baked in. The why
   of every number is in vault.module.css and what was measured in
   .context/recon/vault/GRILLA.md.

   THE OPEN CLIP LIVES IN THE URL, not in a useState. It was in local
   state and that produced a bug that felt like a browser error: you
   opened a clip, made the back gesture on the trackpad, and instead of
   closing it it threw you out of the whole vault. Now /vault/<path> is
   a real history entry, so back closes the clip, and along the way
   every reference becomes linkable.
   ═══════════════════════════════════════════════════════════════ */

/* The value is DATA ("native" and "web" are the vault's folders) and
   the label is what you read. They are separate because they do not
   have to match, and in fact they do not: the "all" filter is not a
   folder. */
/* "App" AND NOT "Native". The cut is the same as the exhibition's (does
   it run in a browser or in an installed app?) and there it is already
   called App, with its reason written in pieces.ts: under App, SwiftUI
   and Expo live together. "Native" is the developer's word; "App" the
   word of whoever is looking. The VALUE is still "native" because it is
   the name of the vault's folder. */
const FILTERS = [
  { value: "all", label: "All" },
  { value: "native", label: "App" },
  { value: "web", label: "Web" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

/* ─── WHY THE FILTER LIVES IN THE BAR ───
   There used to be TWO ROWS (the tabs above, the filter below) and they
   read as the same thing twice: both were loose text, of the same
   weight, with the same gray → active pair, and at 13 against 14 the
   difference in size is not visible.

   We went looking for how the references solve it and the answer was
   that THEY DO NOT HAVE IT: across 7 measured pages there is never more
   than one nav per page, and neither site uses tabs or
   pills as navigation (the 25 tabs and 21 pills on one measured page belong to an
   embedded demo, not to his chrome). They avoid it instead of solving
   it.

   The only one who has it is linear on /now, and its mechanism is
   double: its nav is a physical BAND (fixed, 73px, backdrop blur(20), a
   1px border-bottom) and its title is 48 against the filter's 16. Three
   times. Its filters, for the record, are BARE TEXT: radius 0, no
   background, no padding, so the pills do not come from there either.

   And that names the underlying cause: the two references that solve
   this solve it with a SIZE, and our system has only one.

   THE WAY OUT CHOSEN, looking at four: a single row with one at each
   end. There stop being two similar rows because there stop being two
   rows, and the POSITION does all the work: on the left where you are,
   on the right what you are filtering. Without touching the scale.

   Dropped: linear's band, the large title (which would have opened up
   the type scale), and the pills. */

/* The first frame and nothing else. A <video> with preload="metadata"
   decodes no image and the box stays black; the #t= fragment forces the
   browser to seek there and paint THAT frame. 0.1 and not 0 because at
   0 some containers do not have a key frame yet. */
const firstFrame = (url: string) => `${url}#t=0.1`;

/* THE SAME ALLOW LIST AS THE SERVER, written for the file picker: it
   filters what you can choose instead of letting you choose a .md and
   bouncing it afterwards.

   It is repeated on purpose and not imported: the server lives in
   scripts/ and cannot publish anything to the bundle without dragging
   itself into production. If an extension gets added here, over there
   it has to be added to TYPES or the server rejects it. */
const ACCEPT = ".mp4,.m4v,.mov,.webm,.png,.jpg,.jpeg,.webp,.avif,.gif";

/* The + drawn, not typed. Two strokes, currentColor, and a stroke of
   1.5 because "the icon carries the optical weight of the text next to
   it: 1.5px next to regular".

   IT IS SVG AND NOT THE "+" CHARACTER, and that is not a whim: a glyph
   sits on the baseline, so inside a circle it is never centered.
   Measured: this way the stroke lands 0.00px from the center of the
   box.

   `linecap: round` because the rest of the system does not have one
   single sharp corner.

   It is exported because the playground's chrome draws the same glyph
   in three places, and a second copy of a measured drawing is a second
   thing to keep in step. */
export function Plus() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 3.5v9M3.5 8h9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   THE TITLE IS THE DOCUMENT MENU.

   ─── WHAT IS WITHDRAWN, AND WHY ───
   Up to here the title was edited in place: click, cursor, you type. It
   was less ceremony than a dialog and that is why it had been chosen.
   What knocks it down is not the ceremony but that THAT CLICK IS NO
   LONGER ENOUGH for everything you have to be able to do: with rename
   and the trash and the playground living only in the right click, all
   three were invisible. A title that gets edited when you touch it
   keeps the gesture and leaves room for nothing else.

   Now the gesture opens the DOCUMENT MENU, which is what the HIG calls
   this: "Next to the title, the toolbar can include a document menu
   that contains standard and app-specific commands that affect the
   document as a whole, such as Duplicate, Rename, Move, and Export"
   (Toolbars › Item groupings, leading edge). Our three actions all fall
   under that description; none of them is a leftover from the bar,
   which is what the More menu on the other edge exists for.

   Rename goes back to the dialog, which never left: the grid was still
   using it, where there is no title to touch. Now both paths come in
   through the same place.

   ─── THE TITLE AND THE ARROW ARE ONE BUTTON ───
   Not a text with a handle next to it. The chevron is the signal that
   there is something underneath, but the padding box you press is the
   whole word. If they were two, touching the title would do nothing and
   that is exactly the gesture people try first.

   IT SHOWS THE FILE NAME and not the card's capitalized phrase. What
   you see has to be what gets saved; the phrase lives in the grid,
   which is where you read it and do not touch it.

   ─── THE CONVENTION: UNDER 15 CHARACTERS ───
   It is the HIG's maximum (Toolbars › Titles) and its reason is
   functional: leaving room for the bar's other controls. Here that room
   is literal, the row is arrow · title · playground · inspector.

   And what makes 15 enough is not compressing: it is not repeating. THE
   TITLE SAYS WHAT THE GESTURE IS; `Source` SAYS WHERE IT CAME FROM. The
   model is in the vault: "Swipe to pay", 12 characters, without naming
   the app.

   IT IS NOT VALIDATED IN CODE, on purpose: the name IS the name of the
   file on your disk, and a tool that stops you from calling your files
   what you want has the dependency backwards. The convention lives in
   the log and it is applied by writing, not by failing.
   ═══════════════════════════════════════════════════════════════ */
function TitleMenu({
  clip,
  open,
  onOpen,
}: {
  clip: Clip;
  open: boolean;
  /* It returns ITS OWN rectangle. It is the same deal as the Device
     trigger in the details panel: the one that knows where it is is the
     button. */
  onOpen: (anchor: DOMRect | null) => void;
}) {
  /* ─── THE MENU HANGS OFF THE WORD, NOT OFF THE PADDING ───
     The button starts 6px before the text: that is the padding that
     grows its click area, given back to the layout with a negative
     margin. Anchoring the menu to the button left it at 202 and the
     title at 208, six pixels off the rail, which is the same kind of
     mistake .play's optical margin and the details panel's toggle fix.
     So the anchor is built by hand: the x and the width come from the
     TEXT, the height from the whole button so the menu falls below the
     entire click area and not below the line of text.

     The first element child IS the text: the button renders the span
     and then the chevron, in that order, ten lines below. */
  const anchorOnWord = (button: HTMLButtonElement) => {
    const b = button.getBoundingClientRect();
    const t = button.firstElementChild!.getBoundingClientRect();
    return new DOMRect(t.left, b.top, t.width, b.height);
  };

  return (
    /* The button lives INSIDE the h1: the detail cannot be left without
       a heading just because its title now opens a menu. */
    <h1 className={css.detailTitleFrame}>
      <button
        className={css.detailTitle}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => onOpen(open ? null : anchorOnWord(e.currentTarget))}
      >
        <span className={css.detailTitleText}>{clip.file}</span>
        {/* The same chevron that announces the Device list in the
            details panel, for the same reason: a popup SAYS it is a
            popup. */}
        <svg
          className={css.detailTitleChevron}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4.5 6.5 8 10l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </h1>
  );
}

export const clipPath = (path: string) =>
  "/vault/" + path.split("/").map(encodeURIComponent).join("/");

function Card({
  clip,
  onOpen,
  onMenu,
}: {
  clip: Clip;
  onOpen: (c: Clip) => void;
  onMenu: (c: Clip, d: { x: number; y: number }) => void;
}) {
  const video = useRef<HTMLVideoElement | null>(null);

  /* THE CLIP PLAYS WHEN THE POINTER GOES OVER IT. Measured on
     one of the measured pages, which is the same thing another does with its 53
     measured videos. They start when they enter the screen,
     linear on hover.

     Its exact behavior, the four points:

       at rest         paused, showing the first frame
       on hover        play(), and loop
       ON LEAVING      pause() and IT STAYS where it was: measured at
                       t=2.18 after leaving, and on entering again it
                       carried on at 3.09. It does not rewind
       reduced-motion  it does NOT play. Verified: with the preference
                       set, their video stays at paused t=0

     That it resumes instead of going back to zero is the detail that is
     worth it: on a wall of references the pointer wanders off all the
     time, and rewinding would make you start over every time.

     It is also what turns this into a vault of MOVEMENT: without it,
     this is an album of frozen first frames, and what you come here to
     look at is how things move. */
  const reduceMotion = () =>
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  const enter = () => {
    if (reduceMotion()) return;
    video.current?.play().catch(() => {});
  };
  const leave = () => video.current?.pause();

  return (
    /* It is a real <a href>, the same as the product's piece: a plain
       click opens the detail, and cmd-click opens the clip in a new tab.
       Same interceptor.

       The trigger is the WHOLE CARD and not the video: the slot is 405
       wide and the clip can measure 228, so aiming only at the video
       would leave half the card dead. */
    <a
      className={css.card}
      href={clipPath(clip.path)}
      data-source={clip.source ?? undefined}
      onClick={linkClick(() => onOpen(clip))}
      onMouseEnter={enter}
      onMouseLeave={leave}
      /* And with the keyboard too: if you can get there by tabbing, you
         have to be able to see the same as with the pointer. */
      onFocus={enter}
      onBlur={leave}
      /* The right click opens what you can DO with the clip. It goes on
         the whole card and not on the video, for the same reason as the
         normal click: half the card would be dead. */
      onContextMenu={(e) => {
        e.preventDefault();
        onMenu(clip, { x: e.clientX, y: e.clientY });
      }}
    >
      <div className={css.media}>
        {clip.medium === "video" ? (
          <video
            ref={video}
            src={firstFrame(clip.url)}
            preload="metadata"
            muted
            loop
            playsInline
          />
        ) : (
          <img src={clip.url} alt="" loading="lazy" />
        )}
      </div>
      <div className={css.title}>{clip.name}</div>
    </a>
  );
}

/* THE GRID IS OPENAI /news's, measured with /web-clone in eleven
   windows and verified against theirs in all eleven: three columns,
   gutter 24, row 80, a rail of 32 with a maximum at 1440, the box with
   no air and the clip filling it with `cover`.

   THE ONLY TWO THINGS NOT COPIED FROM THEM, and both for the same
   reason (there is a decision of ours that was already taken):

     the ratio    they use 1/1; here it is the measured card ratio, 550/528,
                  which is the one sized so a phone fits standing up
                  with air around it
     the radius   they leave it at 0; here it is --card-radius, which
                  already governs the product's card

   EVERY CARD MEASURES THE SAME, and that is the constraint that rules:
   that is why there is one ratio and not one per source. Inside, each
   source behaves differently. The phone goes like the measured one, whole and
   with air; the web one fills the card.

   The receipts are in .context/recon/vault/grillas/ and every number is
   written down in vault.module.css. */

export function Vault({
  open,
  go,
  actionsSlot,
}: {
  open: string;
  go: (path: string) => void;
  /* The slot the bar leaves for the view's control. It arrives null on
     the first render, before the node exists. */
  actionsSlot: HTMLElement | null;
}) {
  const { status, reload, annotate } = useClips();
  const [filter, setFilter] = useState<Filter>("all");
  const [uploading, setUploading] = useState<string | null>(null);
  /* The files waiting for a destination, whether they come from the +
     or from a drag. That there is one is what opens the dialog. There
     is no separate `open`, because they would be two truths about the
     same thing. */
  const [pending, setPending] = useState<File[]>([]);
  const input = useRef<HTMLInputElement | null>(null);
  /* THE OPEN CLIP IS DERIVED UP HERE, before the conditional returns, so
     no future hook ends up behind one. That already broke this page
     once.

     If the path does not exist (an old link, a file you sent to the
     trash) it stays null and you go back to the grid, instead of
     leaving the screen blank. */
  const clip =
    !status.loading && status.connected && open
      ? (status.clips.find((c) => c.path === open) ?? null)
      : null;
  /* The details panel starts CLOSED. It used to start open when almost
     no clip had anything written and there was otherwise no way to
     discover it; now that the vault's videos come with a source and
     notes, an open panel from the start eats the width before you ask
     for it. Collapsing it does NOT move the clip: its space stays
     reserved anyway. */
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [menu, setMenu] = useState<{ clip: Clip; where: Where } | null>(null);
  const [renaming, setRenaming] = useState<Clip | null>(null);
  /* Moving to the trash IS NO LONGER A STATE: it is a call. `deleting`
     used to live here, the clip waiting for confirmation, and it left
     with the dialog (see TrashNotice in actions.tsx). The only thing
     left is what can go wrong. */
  const [trashError, setTrashError] = useState<string | null>(null);

  /* ONE single layer for both views. The subject comes from the state
     (the clip the menu was opened over, or the one in a dialog) so the
     grid and the detail share the same code instead of each having its
     own.

     And WITH useLast, because this value becomes null at the same
     instant the exit would have to start: without it the whole layer
     unmounts and the menu and the dialog disappear all at once instead
     of leaving. See the hook in actions.tsx.

     It goes UP HERE and not where it is used: it is a hook, and below
     there are two early `return`s, loading and not connected. A hook
     after a conditional return gets skipped in some renders and breaks
     the order. */
  const subject = useLast(menu?.clip ?? renaming);

  if (status.loading) return null;

  if (!status.connected) {
    return (
      <div className={css.vault}>
        <p className={css.notice}>
          Vault not connected: {status.reason}. Set the folder in{" "}
          <code>.env.local</code> as <code>VAULT_DIR=/path/to/your/folder</code>{" "}
          and restart the server.
        </p>
      </div>
    );
  }

  /* After renaming, the PATH changes, and the path is the URL: if the
     history entry is not replaced, the detail is left pointing at a
     file that no longer exists and it goes back to the grid on its
     own. */
  const afterRename = (path: string) => {
    if (clip && open === clip.path) {
      /* replaceState and NOT pushState: renaming is not navigating, and
         a new entry would leave the back button pointing at a name that
         no longer exists.

         But replaceState does NOT fire popstate, so the router stayed
         with the old path while the address bar showed the new one:
         reload() brought the renamed clip, the old path matched
         nobody, and the detail emptied out. The synthetic event is what
         tells it, and it is the only thing app.tsx listens to. */
      history.replaceState({}, "", clipPath(path));
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
    reload();
  };
  /* THE CLIP LEAVES, AND IF IT FAILS IT GETS SAID. This used to be the
     confirmation dialog's "onDone"; now it is the whole gesture,
     because there is nothing to confirm.

     If the clip that left is the one you are looking at, it goes back
     to the grid on its own: staying in the detail of a file that no
     longer exists would be looking at a hole. */
  const moveToTrash = async (c: Clip) => {
    const error = await sendToTrash(c);
    if (error) {
      setTrashError(error);
      return;
    }
    if (open === c.path) history.back();
    reload();
  };

  /* SEND THE CLIP TO THE PLAYGROUND. The vault knows nothing about
     views (it neither has them loaded nor needs them) so all the work
     is done by the helper in views.ts: it looks for the most recent
     view or creates one, adds the frame, saves, and returns where to
     go. What is left here is the navigation, which does belong to the
     vault.

     If the vault is not connected it returns null and you do not go
     anywhere: it is the same screen that already told you so. */
  const openInPlayground = async (c: Clip) => {
    const id = await toPlayground(c.path);
    if (id) go("/playground/" + id);
  };

  /* THE OTHER WAY OUT, and it needs no helper: the slug IS the URL, so
     there is nothing to look up and nothing to write. It is the whole
     point of storing the slug and not the title.

     IT TAKES THE SLUG AND NOT THE CLIP, so the two callers cannot
     offer the way out without having the slug in hand: each one reads
     it and guards on it before drawing its control. Taking the clip
     needed an optional chain here, and that one navigates to
     "/undefined" the day the invariant breaks.

     There is no guard for the piece not existing, because there cannot
     be one: the server refuses a slug that names nothing, and the
     picker only offers the pieces there are. If a piece gets deleted
     from pieces.ts by hand its clips keep pointing at it, and what you
     get is the 404 of the exhibition, which is the honest answer. */
  const openInExhibition = (piece: string) => go("/" + piece);

  /* THE FAILURE NOTICE NEEDS NO SUBJECT and that is why it stays
     outside the guard: when the clip left cleanly, `subject` is the
     last one there was; when it failed, what matters is the message and
     not what it was about. */
  const subjectPiece = subject?.details?.piece;
  const layer = (
    <>
      {subject && (
        <>
          <ClipMenu
            clip={subject}
            where={menu?.where ?? null}
            onClose={() => setMenu(null)}
            /* ONLY IN THE GRID. In the detail, sending to the playground
               is already a button in the bar, so the menu does not
               repeat it; in the grid there is no bar and the right click
               is the only way. It is the same layer for both views, so
               the difference is decided by the only value that separates
               them: whether there is a clip open. */
            onPlayground={clip ? undefined : () => openInPlayground(subject)}
            /* IT IS OFFERED IN BOTH VIEWS, unlike the playground's.
               That one is a permanent button in the detail's bar, so
               repeating it in the menu would be the same thing twice
               ten pixels apart; this one is only a button when the clip
               HAS a piece, so the menu is not repeating a command that
               may not be there. And the grid has no bar at all. */
            onExhibition={
              subjectPiece ? () => openInExhibition(subjectPiece) : undefined
            }
            onRename={() => setRenaming(subject)}
            /* WITHOUT ASKING: it leaves and that is it. The why is in
               actions.tsx, above TrashNotice. The HIG advises against
               the alert for a reversible destructive action, and this
               one is reversible because the clip goes to the system
               trash. The warning now arrives BEFORE, with the item in
               red. */
            onTrash={() => moveToTrash(subject)}
          />
          <RenameDialog
            clip={subject}
            open={renaming?.path === subject.path}
            onClose={() => setRenaming(null)}
            onDone={afterRename}
          />
        </>
      )}
      <TrashNotice error={trashError} onClose={() => setTrashError(null)} />
    </>
  );

  if (clip) {
    const piece = clip.details?.piece;
    return (
      <div
        className={css.detail}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ clip, where: { x: e.clientX, y: e.clientY } });
        }}
      >
        {layer}
        {/* ONE ROW: arrow · title · [··· inspector]. The order and the
            split are the HIG's (Toolbars › Item groupings); the full
            why, what it cost and what was dropped are in .detailHeader,
            in vault.module.css, and the ···'s in ActionsButton.

            Back and ⌘Z do the same thing as this arrow because all
            three are history.back(): one single way to close. */}
        <div className={css.detailHeader}>
          <Back onClick={() => history.back()} extraClass={css.backInRow} />
          {/* IT IS THE SAME MENU AS THE RIGHT CLICK'S, with the same
              three items. That `Open in playground` is also there as an
              icon does not take it out of here: the HIG asks for every
              bar item to exist as a command too, because the bar can be
              hidden. Here the icon is the shortcut and the menu is the
              list. */}
          <TitleMenu
            clip={clip}
            open={menu?.where != null && "anchor" in menu.where}
            onOpen={(anchor) =>
              setMenu(anchor ? { clip, where: { anchor, align: "left" } } : null)
            }
          />
          <div className={css.detailActions}>
            {/* FIRST IN THE ROW SO THAT NOTHING ELSE MOVES. The group
                is pushed against the rail with `margin-left: auto`, so
                it grows LEFTWARD: a button added at the head leaves the
                arrow and the details toggle exactly where they were,
                and one added at the tail would shift both. Measured in
                the served detail, with and without the button: the
                arrow stays at the same x to the pixel.

                Absent when the clip produced nothing, which is most of
                the vault. */}
            {piece && <ExhibitionButton onOpen={() => openInExhibition(piece)} />}
            <PlaygroundButton onOpen={() => openInPlayground(clip)} />
            <DetailsButton
              open={detailsOpen}
              onToggle={() => setDetailsOpen((v) => !v)}
            />
          </div>
        </div>
        <div className={css.stage}>
          {clip.medium === "video" ? (
            <Player clip={clip} />
          ) : (
            <img className={css.photo} src={clip.url} alt="" />
          )}
          <ClipDetails clip={clip} open={detailsOpen} annotate={annotate} />
        </div>
      </div>
    );
  }

  const visible = status.clips.filter(
    (c) => filter === "all" || c.source === filter,
  );

  const upload = async (files: File[], source: Source) => {
    if (!files.length) return;
    /* One at a time and in order, not in parallel: they are videos, and
       ten uploads competing for the disk take the same time but leave
       no way to say which one you are on. */
    for (let i = 0; i < files.length; i++) {
      setUploading(
        files.length > 1
          ? `${files[i].name} · ${i + 1}/${files.length}`
          : files[i].name,
      );
      try {
        await uploadClip(files[i], source);
      } catch (err) {
        setUploading(`${files[i].name}: ${String(err)}`);
        await new Promise((r) => setTimeout(r, 2500));
      }
    }
    setUploading(null);
    /* Only now does it ask for the index again: once, and not once per
       file. */
    reload();
  };

  /* FILES only. Dragging selected text or a link also fires these
     events, and there is nothing to upload there.

     preventDefault on dragover is what ENABLES the drop. Without this
     the browser opens the file in the tab and takes you out of the
     app. */
  const dragOver = (e: DragEvent) => {
    if (Array.from(e.dataTransfer?.items ?? []).some((i) => i.kind === "file"))
      e.preventDefault();
  };

  /* DROPPING DOES NOT PICK A FOLDER: it gathers the files and opens the
     dialog, which is the same one the + opens. Both paths do exactly
     the same thing from here on, so the question lives in ONE place. */
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setPending(Array.from(e.dataTransfer?.files ?? []));
  };

  /* Chosen with the +: they stay waiting and open the dialog, the same
     as on drop. */
  const chosen = (list: FileList | null) => {
    setPending(Array.from(list ?? []));
    /* The input is emptied so that choosing THE SAME file TWICE fires
       the change again. Without this, canceling an upload and retrying
       with the same file does nothing. */
    if (input.current) input.current.value = "";
  };

  /* THE + AND THE FILTER LIVE TOGETHER, at the same end of the bar. The
     filter says what you are looking at and the + adds to that same
     thing: they are the same family of control over the same set.

     It is the only glyph in the chrome (everything else is words) and
     it is accepted because "+" needs neither translation nor context.
     The aria-label is a word, for whoever hears it instead of seeing
     it.

     IT GOES AFTER THE FILTER AND NOT BEFORE. It was before and the row
     read as "+ All Native Web", where the first two words form a phrase
     that means something else: "add everything". At the end it reads
     "…Native Web +", and "Web +" does not read as anything. */
  const filters = (
    <div className={css.filters}>
      {FILTERS.map((f) => (
        <button
          className={css.filter}
          key={f.value}
          data-active={filter === f.value ? "" : undefined}
          aria-pressed={filter === f.value}
          onClick={() => setFilter(f.value)}
        >
          {f.label}
        </button>
      ))}
      <button
        className={css.plus}
        aria-label="Add clips"
        onClick={() => input.current?.click()}
      >
        <Plus />
      </button>
    </div>
  );

  return (
    <div className={css.vault} onDragOver={dragOver} onDrop={drop}>
      {/* The same layer as in the detail: the right-click menu and its
          two dialogs. */}
      {layer}

      {/* The filter is drawn INSIDE the bar, at the other end of its
          row. By portal and not by coordinates: inside, flexbox arranges
          it and the small width solves itself. */}
      {actionsSlot && createPortal(filters, actionsSlot)}

      {/* The real picker. It goes hidden and the + fires it: an <input
          type=file> cannot be dressed up without fighting every browser,
          so the native one is used and a control that is ours is put in
          front of it.
          `accept` filters with the server's same allow list, so what
          cannot be uploaded cannot even be chosen. */}
      <input
        className={css.hidden}
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => chosen(e.target.files)}
      />

      <WhereDialog
        files={pending}
        onChoose={(f) => {
          const list = pending;
          setPending([]);
          upload(list, f);
        }}
        onClose={() => setPending([])}
      />

      {/* While it uploads. */}
      {uploading && <p className={css.uploading}>{uploading}</p>}

      {visible.length === 0 ? (
        <p className={css.notice}>Nothing here.</p>
      ) : (
        <div className={css.grid}>
          {visible.map((c) => (
            <Card
              clip={c}
              onOpen={(x) => go(clipPath(x.path))}
              onMenu={(x, d) => setMenu({ clip: x, where: d })}
              key={c.path}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WHERE THE CLIP GOES: the dialog.

   It is a native <dialog> opened with showModal(), not a div with
   position:fixed. That brings four things free and done right that come
   out wrong by hand: focus stays trapped inside, Escape closes, the
   rest of the page is inert for the keyboard and the screen reader, and
   the ::backdrop exists without adding a node.

   BOTH PATHS OPEN IT. The + gathers the files from the picker and
   dropping gathers them from the drag; from there on it is the same
   dialog, so the question gets asked in one place.
   ═══════════════════════════════════════════════════════════════ */
/* THE MEDIUM of the file you are about to upload, with no box: the box
   is put there by the card, which is the vault's own. */
function Medium({ file, url }: { file: File; url: string }) {
  if (file.type.startsWith("video")) {
    /* The first frame and still, the same as the card at rest: the #t=
       fragment forces the browser to paint THAT frame instead of
       leaving the box black. */
    return <video src={`${url}#t=0.1`} preload="metadata" muted playsInline />;
  }
  return <img src={url} alt="" />;
}

function WhereDialog({
  files,
  onChoose,
  onClose,
}: {
  files: File[];
  onChoose: (f: Source) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (files.length && !d.open) d.showModal();
    if (!files.length && d.open) d.close();
  }, [files.length]);

  /* WHAT THE DIALOG SHOWS OUTLIVES THE EMPTYING OF THE LIST.

     `files` empties at the instant you choose, but the dialog takes
     150ms to leave and during that while it goes on being drawn.
     Reading `files` directly, the object URL was revoked on the first
     frame of the exit and the image died in front of you. WebKit
     shouted it with a "WebKitBlobResource error 1" for each card.

     With this, the last thing there was stays until something else
     arrives. */
  const [shown, setShown] = useState<File[]>([]);
  useEffect(() => {
    if (files.length) setShown(files);
  }, [files]);

  /* An object URL lives until it gets revoked: without the cleanup
     every file you look at stays in memory until you reload the page,
     and here you look at videos. ONE is created and both cards use it. */
  /* THE DEPENDENCY IS THE FILE AND NOT THE ARRAY, and the difference
     matters: a new array with the SAME File inside is another identity,
     so depending on the array the effect would revoke and recreate the
     URL without the file having changed. With the File as the
     dependency that cannot happen. */
  const file = shown[0];

  /* THE URL IS CREATED IN THE RENDER, with useMemo, and NOT in an
     effect. It is the difference between working and not:

     with an effect, `url` gets set one render AFTER the file changed,
     so there is a frame in which the <img> still points at the old URL
     (already revoked by the cleanup) and WebKit throws
     "WebKitBlobResource error 1". It showed up twice while the designs
     were being looked at, once per render.

     With useMemo, the file and its URL change in the SAME render, and
     the cleanup revokes the previous one only once the new render is
     already painted. */
  const url = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  return (
    /* onClose covers EVERY way of closing (Escape, the button, and
       close() from here) so the state gets cleaned in one place and not
       in three. */
    <dialog
      className={css.dialog}
      ref={dialog}
      /* A click outside closes, the same as the other three. Here it
         discards the files you were about to upload, but Escape already
         did that, and it leaves through this same `close`, so no new way
         of losing something appears: the same one appears, with the
         gesture people already try first. */
      closedby="any"
      onClose={onClose}
    >
      <p className={css.dialogWhat}>
        {shown.length === 1
          ? shown[0]?.name
          : `${shown[0]?.name} + ${shown.length - 1} more`}
      </p>

      {/* ─── THE TWO OPTIONS ARE THE CARD ───
          You do not choose a folder: you choose WHICH OF THE TWO LOOKS
          RIGHT. The question goes from being about the file (which is
          what the user does not know) to being about the result, which
          is right there in front of you.

          And it is not an imitation of the card: they are THE SAME
          CLASSES, so the phone shows up whole with the measured air and the
          screen fills the box with cover, exactly as they are going to
          end up in the grid. If tomorrow the card changes, this changes
          with it and there is nothing to keep in sync. */}
      <div className={css.dialogOptions}>
        {(["native", "web"] as const).map((f) => (
          <button
            className={`${css.card} ${css.dialogCard}`}
            key={f}
            data-source={f}
            onClick={() => onChoose(f)}
          >
            <div className={css.media}>
              {file && url && <Medium file={file} url={url} />}
            </div>
            <div className={css.title}>
              {f === "native" ? "App" : "Web"}
            </div>
          </button>
        ))}
      </div>
    </dialog>
  );
}
