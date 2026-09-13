import { useCallback, useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   THE CLIPS. What the bridge finds in your folder.

   The server returns FACTS FROM THE FILE SYSTEM and nothing else: what
   it is, how big it is, when it arrived. Meaning is given here, and
   everything derived comes out of the file itself. There is no
   database and no JSON to keep by hand: you drop the clip in the
   folder and it shows up.

     the name       comes from the file name
     native or web  comes from which folder you dropped it in
     the date       comes from the file system

   That is on purpose. A hand-written manifest goes out of sync the day
   you drag a file in and forget to edit it, and then the vault lies.
   Here it cannot: the folder IS the manifest.
   ═══════════════════════════════════════════════════════════════ */

/* What the server sends, as it comes. */
export type RawClip = {
  path: string;
  file: string;
  folder: string;
  ext: string;
  medium: "video" | "image";
  bytes: number;
  created: string;
  modified: string;
  /* Read out of the container by the bridge. They come as null when it
     is an image or when the file could not be parsed, and that has to
     be handled: without an exact frame, stepping with the arrow keys
     stops being a frame and becomes an estimate, and then counting
     frames to get a duration is useless. See scripts/frames.mjs. */
  frameStep: number | null;
  fps: number | null;
  frameCount: number | null;
  variableFrameRate: boolean | null;
  /* WHAT YOU WRITE about the clip. It comes as null when you wrote
     nothing, not as an empty object, because the server deletes the
     whole details entry if you empty every field.

     The server had been sending it since the endpoint existed and it
     was NOT declared here, so the data reached the browser and got
     thrown away in silence: the `.map` below copies what it knows
     about, and this was not on the list. Half a feature lost to a
     missing field in a type. */
  details: Details | null;
};

/* Four fields, and they are the same ones the server validates. If one
   gets added here, it has to be added over there or it gets dropped on
   save without a word: the first three go in DETAILS_FIELDS and the
   fourth has its own check, because it is the only one that is not
   free text.

   `piece` is the slug of the piece this clip produced, and it is what
   turns the clip into a two-way door: from the vault you open the
   piece it became, and from the piece you come back to the reference.
   It gets written on its own when you publish an App piece from the
   clip, and by hand in the details panel for the clips whose piece was
   published before the field existed. */
export type Details = {
  notes?: string;
  source?: string;
  device?: string;
  piece?: string;
};

/* Which of the two vault folders the clip lives in. Not to be confused
   with `details.source`, which is where you wrote down that the
   recording came from. */
export type Source = "native" | "web";

/* What the interface uses. */
export type Clip = RawClip & {
  name: string;
  source: Source | null;
  date: Date;
  url: string;
};

export type Status =
  | { loading: true }
  | { loading: false; connected: false; reason: string }
  | { loading: false; connected: true; folder: string; clips: Clip[] };

/* "sheet-that-stretches" → "Sheet that stretches".

   Only the first letter capitalized, not every word: a clip's name is
   a phrase, "Sheet that stretches when you drag it", and not a title.
   It is what both references do with theirs. */
const toSentence = (s: string) => {
  const clean = s.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return clean ? clean[0].toUpperCase() + clean.slice(1) : s;
};

/* "web/sheet-that-stretches.png" → "Sheet that stretches".

   IT IS THE SAME COUNT AS `name`, but starting from the path instead
   of the index, and it exists for ONE case: the playground canvas
   stores the clip's PATH in each frame, so when the file is no longer
   there, because you renamed it or sent it to the trash, that path is
   the only thing left to show. And a raw path on screen is a fact
   about a disk, not a name.

   With this, the clip that is missing is still called what it was
   called. */
export const nameOfPath = (path: string) =>
  toSentence((path.split("/").pop() ?? path).replace(/\.[^.]+$/, ""));

/* The folder classifies. The first level and nothing else:
   "native/2026/x.mp4" is still native. Anything that falls in none of
   them stays unclassified instead of getting one invented for it, so
   you can see there is a loose clip at the root and go tidy it up.

   BOTH SPELLINGS ARE ACCEPTED, "native" and "nativo". The interface is
   in English, but the folder is one you named on your own disk, and if
   the vault is your Obsidian it can keep the name it already had.
   Having the app force you to rename a folder of yours before it can
   read it would be the dependency pointing the wrong way. */
const FOLDERS: Record<string, Source> = {
  native: "native",
  nativo: "native",
  web: "web",
};

const sourceOf = (folder: string): Source | null =>
  FOLDERS[folder.split("/")[0].toLowerCase()] ?? null;

/* UPLOAD A CLIP. The bytes go raw in the body and the metadata in the
   query: `fetch` accepts a File as a body and streams it, so a 400MB
   video does not pass through memory on this side either.

   The source is the FOLDER it lands in, which is the same thing as
   saying whether the clip is native or web. That is why you have to
   pick one when you drop it: it cannot be guessed from the shape of
   the video. */
export async function uploadClip(
  file: File,
  source: Source,
): Promise<string> {
  const q = new URLSearchParams({ source, name: file.name });
  const r = await fetch(`/vault-media/__upload?${q}`, {
    method: "POST",
    body: file,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? `error ${r.status}`);
  return d.path as string;
}

/* SAVE THE DETAILS. Returns the ones that ended up stored, which can
   be null if you emptied every field. */
export async function saveDetails(
  path: string,
  details: Details,
): Promise<Details | null> {
  const r = await fetch("/vault-media/__details", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path, details }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? `error ${r.status}`);
  return d.details ?? null;
}

/* PUBLISH a recording as an App piece. It is fired from the BOARD, the
   right click on the frame, because publishing is the end of the
   workshop and not a gesture of the vault. The server copies the video
   to public/pieces/ and writes the entry in pieces.ts, both or
   neither. It returns the slug, which is where to navigate: the piece
   is already in the exhibition. */
export async function publishClip(
  path: string,
  name: string,
  desc: string,
): Promise<string> {
  const r = await fetch("/vault-media/__publish", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind: "clip", path, name, desc }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? `error ${r.status}`);
  return d.slug as string;
}

/* RENAME. The server only accepts a name TO READ: it puts the
   extension on itself, copying it from the file, so renaming cannot
   change the type. It returns the new path, which is a different one,
   because the path IS the name. */
export async function renameClip(
  path: string,
  name: string,
): Promise<string> {
  const r = await fetch("/vault-media/__rename", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path, name }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? `error ${r.status}`);
  return d.path as string;
}

/* TO THE TRASH, not deleted. The server moves the file to the system
   trash instead of calling unlink: from a studio app a delete has no
   undo to save it, and this way you get it back from Finder. */
export async function trashClip(path: string): Promise<void> {
  const r = await fetch("/vault-media/__trash", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path }),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d.error ?? `error ${r.status}`);
  }
}

/* ─── THE CARD FOR A LINK ───
   The title and the favicon of a URL pasted into a note. The server
   looks it up because the browser cannot: reading github.com over
   fetch runs into CORS. The whole reason, the guards and the measured
   icon order are in scripts/link-card.mjs.

   IT NEVER THROWS. A link that could not be resolved still gets drawn
   and still opens, with the host as its label, so failure comes back
   here as null and not as an exception: there is no decision to make
   with the reason, and forcing every caller to wrap this in a try
   would be asking for ceremony over something that already has an
   answer. */
export type LinkCard = {
  title: string | null;
  icon: string | null;
  /* Where it ended up after the redirects. It is good for NAMING a
     shortener, since a t.co from X says nothing, and never for
     navigating: the anchor always points at what you wrote. */
  final: string | null;
};

export async function linkCardOf(url: string): Promise<LinkCard | null> {
  try {
    const r = await fetch(`/vault-media/__link?url=${encodeURIComponent(url)}`);
    const d = await r.json();
    if (!r.ok) return null;
    return {
      title: d?.title ?? null,
      icon: d?.icon ?? null,
      final: d?.final ?? null,
    };
  } catch {
    return null;
  }
}

/* ═══════════ THE INDEX SURVIVES THE UNMOUNT ═══════════
   The last answer the server gave, held in the module and not in the
   component. It is what the hook STARTS from, so coming back to the
   vault paints the clips you already had in the first frame and the
   fetch only corrects them if something changed.

   Without it the hook was born in `loading` on every mount, and the
   vault draws nothing while it loads (`if (status.loading) return
   null`): measured on the round trip from a piece back to its clip,
   ONE FULLY WHITE FRAME between the two pages. The trip is the thing
   this journey is for, so a blank frame in the middle of it is the
   whole cost.

   It is a cache of ONE and it never gets invalidated on purpose: the
   fetch always runs, so what is on screen is at most one round trip
   old and never wrong for longer than that. `annotate` writes through
   it for the same reason, or editing a field and leaving would come
   back showing the old value for a frame.

   It is a module variable and not a context because the only thing
   that would change with a provider is where it is written down: there
   is one vault, one server and one index. */
let lastIndex: Status | null = null;

/* The request and the shape it lands in, in one place, because two
   callers need it now: the hook and the warm-up below. */
async function fetchIndex(): Promise<Status> {
  try {
    const d = await (await fetch("/vault-media/__index")).json();
    if (!d.connected) {
      return { loading: false, connected: false, reason: d.reason };
    }
    const clips: Clip[] = d.clips.map((c: RawClip) => ({
      ...c,
      name: toSentence(c.file),
      source: sourceOf(c.folder),
      date: new Date(c.created),
      url: "/vault-media/" + c.path.split("/").map(encodeURIComponent).join("/"),
    }));
    /* Newest first, which is the order you asked for and the one both
       references have. */
    clips.sort((a, b) => b.date.getTime() - a.date.getTime());
    return { loading: false, connected: true, folder: d.folder, clips };
  } catch (e) {
    return { loading: false, connected: false, reason: String(e) };
  }
}

/* The index, asked for BEFORE anyone needs it. In the exhibition there
   is no vault on screen, but the way back to a reference is one click
   away, and the round trip has to be instant. Calling it twice costs
   nothing: the second one finds the answer already in `lastIndex`. */
export function warmClips() {
  if (lastIndex) return;
  void fetchIndex().then((s) => {
    lastIndex = s;
  });
}

export function useClips() {
  const [status, setStatus] = useState<Status>(lastIndex ?? { loading: true });
  /* Bumped to ask for the index again. It is what makes a clip you
     just uploaded show up without reloading the page. */
  const [round, setRound] = useState(0);

  /* IT ALWAYS ASKS, even when it started from the cache. What is drawn
     in the first frame is at most one round trip old, and this is what
     corrects it. Nothing flashes when the answer is the same, because
     the state that lands is equal to the one already there. */
  useEffect(() => {
    let alive = true;
    void fetchIndex().then((s) => {
      lastIndex = s;
      if (alive) setStatus(s);
    });
    return () => {
      alive = false;
    };
  }, [round]);

  /* The details are updated IN PLACE and not by asking for the whole
     index again: the server already returned the ones that ended up
     stored, and re-reading 16 clips to change three fields of one
     would make the grid flicker. */
  const annotate = useCallback((path: string, details: Details | null) => {
    /* THROUGH THE CACHE TOO. Without this, editing a field and leaving
       the vault came back showing the value from before the edit until
       the fetch answered, which is the same flash this cache came to
       take out, only with the wrong content instead of none. */
    const apply = (s: Status): Status =>
      s.loading || !s.connected
        ? s
        : {
            ...s,
            clips: s.clips.map((c) => (c.path === path ? { ...c, details } : c)),
          };
    if (lastIndex) lastIndex = apply(lastIndex);
    setStatus(apply);
  }, []);

  return { status, reload: () => setRound((n) => n + 1), annotate };
}

/* There was a date formatter here once, "Aug 18, 2026", the one both
   references use, and it left with the caption: the card shows only
   the name. `date` stays because it still ORDERS the grid, newest
   first; what no longer exists is showing it. */
