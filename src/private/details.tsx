import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import css from "./details.module.css";
import menu from "./actions.module.css";
import { saveDetails, type Clip, type Details } from "./clips";
import { NoteLink } from "./link";
import { split, type Segment } from "./links";

/* ═══════════════════════════════════════════════════════════════
   THE DETAILS. Always visible, four values, editing is touching and
   typing. See details.module.css for why it no longer collapses.
   ═══════════════════════════════════════════════════════════════ */

/* The four classes of device. It is a PICKER and not a free field
   because the value is used to filter and compare, and "iPhone",
   "iphone" and "mobile" typed by hand are three different values that
   mean the same thing. */
/* ─── THE SPRING ───
   The usual one: bounce 0 (critically damped, with no impulse to give
   back because the trigger is a button) and 0.35 of response. A spring
   starts from the CURRENT value, so reverting halfway is continuous.
   The panel and the glyph's fill use it, so the two read as one thing. */
export const SPRING = { type: "spring" as const, bounce: 0, duration: 0.35 };

/* ─── THE PANEL'S GLYPH ───
   A rectangle with the right third separated: it is the screen, and
   that third is the details panel. It fills in when the panel is open.
   No rotation and no mirror: a fill that rises and falls has no
   intermediate frame that can be misread. 16×16 and stroke 1.5, the
   measurements of the grid's +. */
export function DetailsButton({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={css.button}
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? "Hide details" : "Show details"}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="2"
          y="3"
          width="12"
          height="10"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {/* From inner edge to inner edge: the color is semitransparent
            and where the divider crossed into the stroke the alpha
            added up. */}
        <path d="M9.5 3.75V12.25" stroke="currentColor" strokeWidth="1.5" />
        {/* The fill TRACES the compartment with the frame's inner radius
            (2.5 − 0.75 of half a stroke): a loose rect left notches
            where it cut across the curve. */}
        <motion.path
          d="M10.25 3.75 H11.5 A1.75 1.75 0 0 1 13.25 5.5 V10.5 A1.75 1.75 0 0 1 11.5 12.25 H10.25 Z"
          fill="currentColor"
          /* Same reason as the panel: on mount the icon has to appear
             already in its state, not empty itself in front of you. */
          initial={false}
          animate={{ opacity: open ? 1 : 0 }}
          transition={SPRING}
        />
      </svg>
    </button>
  );
}

const DEVICES = [
  "Mobile web",
  "Mobile app",
  "Desktop web",
  "Desktop app",
] as const;

/* If what you wrote in Source is a URL, it can be opened. */
const isLink = (v: string) => /^https?:\/\//i.test(v.trim());

/* ─── SAVING ───
   You type and it saves itself: 400ms without typing, the same debounce
   as the playground views. And it flushes on unmount, because closing
   the detail is exactly when you are about to lose the last of it. */
const SAVE_DELAY = 400;

function useSavedDetails(
  clip: Clip,
  annotate: (path: string, d: Details | null) => void,
) {
  const [local, setLocal] = useState<Details>(clip.details ?? {});
  const timer = useRef<number | null>(null);
  const pending = useRef<{ path: string; details: Details } | null>(null);

  /* Changing clips discards the previous draft: they are the details of
     different files and mixing them would mean writing into the wrong
     one. */
  useEffect(() => {
    setLocal(clip.details ?? {});
  }, [clip.path, clip.details]);

  const send = () => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    saveDetails(p.path, p.details)
      .then((q) => annotate(p.path, q))
      .catch(() => {
        /* What you wrote stays on screen: losing text to a network
           failure would be worse than being out of sync for a while. */
      });
  };

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      send();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const change = (d: Details) => {
    setLocal(d);
    pending.current = { path: clip.path, details: d };
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(send, SAVE_DELAY);
  };

  return [local, change] as const;
}

/* ═══════════════════════════════════════════════════════════════
   THE NOTE — you read it with the links drawn, you edit it in plain
   text.

   ─── WHY THERE ARE TWO VIEWS AND NOT A RICH EDITOR ───
   A textarea cannot draw anything: it is plain text and that is that.
   For a link to look like a link there were two paths, and the other
   one was a contentEditable, that is, a rich text editor, with its
   document model, its IME handling, its own undo stack and its new way
   of breaking on paste. For a three-line notes field that is bringing a
   submarine to a puddle.

   Here the note IS STILL A STRING everywhere (on disk, in the details,
   in the textarea) and what changes is how it gets drawn when you are
   not editing it. There is no second model that can go out of sync,
   because there is no second model.

   ─── THE SWAP ONLY EXISTS IF THERE IS A LINK ───
   With no links, this is exactly the usual textarea. It is the property
   that makes the feature cheap: 90% of the notes change neither their
   behavior nor their tree.

   ─── EDITING IS TOUCHING AND TYPING, HERE TOO ───
   Touching the reading view opens the editor WITH THE CURSOR WHERE YOU
   TOUCHED, not at the end. Without that count, fixing a word in the
   middle of a note forces you to navigate with the arrow keys from the
   end, and that feels like the field is fighting you.
   ═══════════════════════════════════════════════════════════════ */

/* Chrome and Firefox have caretPositionFromPoint; Safari only has the
   old caretRangeFromPoint. Both answer the same thing (which text node
   and which character a point on the screen fell on) in two different
   shapes. */
type WithCaret = Document & {
  caretPositionFromPoint?: (
    x: number,
    y: number,
  ) => { offsetNode: Node; offset: number } | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
};

function characterAt(x: number, y: number): { node: Node; offset: number } | null {
  const d = document as WithCaret;
  const p = d.caretPositionFromPoint?.(x, y);
  if (p) return { node: p.offsetNode, offset: p.offset };
  const r = d.caretRangeFromPoint?.(x, y);
  if (r) return { node: r.startContainer, offset: r.startOffset };
  return null;
}

/* From a point on the screen to the index in the RAW text.

   The translation is needed because the two views do not measure the
   same: a 101-character link is drawn as a 14-character label, so
   character 12 of what you see is not character 12 of what there is.
   Each segment carries its `offset` (its position in the raw text) and
   each <span> carries its index, so the count is a sum and not an
   estimate.

   When the click does not land on any segment (the air to the right of
   the last line, which is where you click to "get into" a field) the
   cursor goes to the end, which is exactly what you expect there. */
function positionOf(
  e: React.MouseEvent<HTMLElement>,
  segments: Segment[],
  length: number,
): number {
  const p = characterAt(e.clientX, e.clientY);
  if (!p) return length;
  const element =
    p.node.nodeType === Node.TEXT_NODE
      ? p.node.parentElement
      : (p.node as Element);
  const box = element?.closest<HTMLElement>("[data-segment]");
  if (!box) return length;
  const s = segments[Number(box.dataset.segment)];
  if (!s) return length;
  return s.offset + Math.min(p.offset, s.text.length);
}

function Note({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [editing, setEditing] = useState(false);
  /* Where the cursor starts when the editor opens. null = at the end. */
  const cursor = useRef<number | null>(null);

  const segments = useMemo(() => split(value), [value]);
  const hasLinks = segments.some((s) => s.kind === "link");
  const reading = hasLinks && !editing;

  /* The note grows with what you type: describing a gesture does not
     fit in a fixed height of three lines. It also runs on entering
     edit, because there the textarea has just mounted with the text
     already inside and still measures one line. */
  useEffect(() => {
    const el = ref.current;
    if (!el || reading) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, reading]);

  /* The focus and the cursor are set AFTER mounting the textarea, which
     is when it exists. It goes in an effect and not in the click
     handler for that same reason: there is nowhere to put the cursor
     yet. */
  useEffect(() => {
    if (reading) return;
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    const i = cursor.current ?? value.length;
    cursor.current = null;
    el.focus();
    el.setSelectionRange(i, i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reading]);

  const startEditing = (i: number | null) => {
    cursor.current = i;
    setEditing(true);
  };

  if (reading)
    return (
      <div
        className={`${css.note} ${css.reading}`}
        /* WITH THE FOCUS RING ON, and it is a reasoned exception to the
           private area's rule. That rule says that where you edit text
           with no box the ring turns off because the caret replaces it,
           and here, reading, there is no caret to replace it. The
           premise does not hold, so the exception does not apply
           either. On entering edit the textarea does turn it off, as
           always. */
        tabIndex={0}
        role="group"
        aria-label="Notes — press Enter to edit"
        onClick={(e) => {
          /* Dragging to select and copy does NOT open the editor: if
             something is selected, the gesture was another one. Without
             this, copying a piece of the note replaced it with its raw
             version halfway through the gesture. */
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed) return;
          startEditing(positionOf(e, segments, value.length));
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          /* Enter OPENS, it does not type: the line break is put in by
             the textarea only once you are inside. */
          e.preventDefault();
          startEditing(null);
        }}
      >
        {segments.map((s, i) =>
          s.kind === "link" ? (
            <NoteLink key={i} url={s.url} />
          ) : (
            /* data-segment is what makes it possible to give the cursor
               back to the character you touched. See positionOf. */
            <span key={i} data-segment={i}>
              {s.text}
            </span>
          ),
        )}
      </div>
    );

  return (
    <textarea
      ref={ref}
      className={css.note}
      value={value}
      placeholder="—"
      aria-label="Notes"
      rows={1}
      onChange={(e) => onChange(e.target.value)}
      /* Leaving the field goes back to reading. If there is no link,
         this changes nothing visible: `reading` is still false. */
      onBlur={() => setEditing(false)}
    />
  );
}

/* ─── THE DEVICE PICKER ───
   The same floating surface as the right-click menu (the only box in
   the private area) with its same entrance: it scales from the corner
   of the value that opened it, 0.96 → 1, nothing appears out of
   nothing. Escape, a click outside and scroll close it, the same as the
   menu. */
function DevicePicker({
  value,
  onChoose,
  onClose,
  anchor,
}: {
  value: string;
  onChoose: (v: string) => void;
  onClose: () => void;
  anchor: DOMRect;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{
    left: number;
    top: number;
    origin: string;
  } | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    /* Below the value and aligned to its right; if it does not fit,
       above. The scale's origin follows, so it grows from the value. */
    const above = anchor.bottom + 4 + r.height > window.innerHeight - 8;
    setPos({
      left: Math.max(8, anchor.right - r.width),
      top: above ? anchor.top - 4 - r.height : anchor.bottom + 4,
      origin: `${above ? "bottom" : "top"} right`,
    });
  }, [anchor]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const outside = (e: MouseEvent) => {
      const t = e.target as Node;
      /* The trigger does NOT count as outside. Without this, pressing
         the value with the list open closed it on the pointerdown and
         the click behind it opened it again: it closed and opened in
         the same gesture. The toggle belongs to the trigger's click;
         this handler only looks at the rest of the page. */
      if ((t as Element).closest?.('[aria-haspopup="listbox"]')) return;
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
  }, [onClose]);

  /* "—" only when something is chosen: with no value there is nothing
     to clear, and a dead option is noise. */
  const options = value ? ["—", ...DEVICES] : [...DEVICES];

  return (
    <div
      ref={box}
      className={menu.menu}
      data-open=""
      role="listbox"
      aria-label="Device"
      style={
        pos
          ? { left: pos.left, top: pos.top, transformOrigin: pos.origin }
          : { visibility: "hidden", left: 0, top: 0 }
      }
    >
      {options.map((o) => {
        const selected = o === value;
        return (
          <button
            key={o}
            className={`${menu.item} ${css.option}`}
            role="option"
            aria-selected={selected}
            autoFocus={selected || (o === options[0] && !value)}
            onClick={() => {
              onChoose(o === "—" ? "" : o);
              onClose();
            }}
          >
            {o}
            {selected && <span className={css.selected} aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

export function ClipDetails({
  clip,
  open,
  annotate,
}: {
  clip: Clip;
  open: boolean;
  annotate: (path: string, d: Details | null) => void;
}) {
  const [details, change] = useSavedDetails(clip, annotate);
  const [picker, setPicker] = useState<DOMRect | null>(null);
  const source = details.source ?? "";

  return (
    <div className={css.panel}>
      {/* THE ONLY THING THAT ANIMATES ON COLLAPSE: the panel fades and
          shifts 8px, a crossfade with a hint of direction, not a wipe,
          because the values run against the edge and a clip would eat
          them first. The clip does not take part: its space is always
          reserved. `inert` turns off focus and pointers on the hidden
          panel in one go. */}
      <motion.div
        /* `initial={false}` because on ENTERING the clip the panel has
           to already be where it goes, not animate its way there.
           Without this motion takes the painted style (opacity 1, not
           shifted) as its starting point and you saw the panel open and
           close on its own: 365 ms measured. Collapsing it by hand
           still animates the same. */
        initial={false}
        animate={{ opacity: open ? 1 : 0, x: open ? 0 : 8 }}
        transition={SPRING}
        inert={!open}
      >
        <div className={css.table}>
          {/* Where the animation came from. Free text (robinhood, apple)
            and if you paste the URL, the arrow opens it: touching the
            text edits, so navigating gets its own padding box. */}
          <div className={css.row}>
            <span className={css.label}>Source</span>
            <input
              className={`${css.value} ${css.field}`}
              value={source}
              placeholder="—"
              aria-label="Source"
              onChange={(e) => change({ ...details, source: e.target.value })}
            />
            {isLink(source) && (
              <a
                className={css.openLink}
                href={source.trim()}
                target="_blank"
                rel="noreferrer"
                aria-label="Open source"
              >
                ↗
              </a>
            )}
          </div>

          <div className={css.row}>
            <span className={css.label}>Device</span>
            <button
              className={`${css.value} ${css.trigger}`}
              {...(details.device ? {} : { "data-empty": "" })}
              aria-label="Device"
              aria-haspopup="listbox"
              aria-expanded={!!picker}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setPicker((p) => (p ? null : r));
              }}
            >
              {/* A popup SAYS it is a popup: a word when it is empty
                (not a dash, which is an absent value, and this is an
                action) and the chevron that announces the list, hanging
                in the margin like Source's ↗ so the column does not
                break. */}
              {details.device || "Choose"}
              <span className={css.indicator} aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6.5 4.5L10 8l-3.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </div>
          {/* BY PORTAL, to body. Inside the table its div (even though
            it is position:fixed) got in between the Device row and the
            Notes block and broke the sibling selectors that hand out
            the margins: opening the menu recomposed the panel. A popup
            cannot live in the flow of what it covers. */}
          {picker &&
            createPortal(
              <DevicePicker
                value={details.device ?? ""}
                anchor={picker}
                onClose={() => setPicker(null)}
                onChoose={(v) => change({ ...details, device: v })}
              />,
              document.body,
            )}

          <div className={css.block}>
            <span className={css.label}>Notes</span>
            <Note
              value={details.notes ?? ""}
              onChange={(v) => change({ ...details, notes: v })}
            />
          </div>

          {/* From the file, not yours: it is not edited. */}
          <div className={`${css.row} ${css.footer}`}>
            <span className={css.label}>Added</span>
            <span className={css.value}>
              {clip.date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
