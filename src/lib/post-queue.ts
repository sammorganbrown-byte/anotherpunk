/** The Instagram posting queue.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  TO CHANGE A POST: edit the caption below, save, commit, push. The next
 *  deploy picks it up. Anything already posted is ignored, so editing an
 *  entry that has gone out changes nothing — it will not be posted twice.
 *
 *  TO DROP A POST: delete its block, or push its `due` date into the future.
 *  TO REORDER: change the dates. The queue posts by date, not by position.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Plain data in the repo rather than a database, on purpose: you can read it,
 * reorder it, rewrite a caption or delete an entry in a text editor, and the
 * change is reviewable in git like anything else. At three posts a week a
 * database would be machinery for its own sake.
 *
 * Every image here was checked against the sweep in SOCIAL-IMAGES.md on
 * 2026-09-01 — no Tongue Box typo, no back prints, no garbled micro-text.
 * Anything added later must be checked the same way. The image folder holds
 * rejected mockups too, and a filename is not evidence: two files named
 * "-FIXED" were never fixed.
 */

export type QueuedPost = {
  /** Stable id. Appears in the email you get and in the logs. */
  id: string;
  /** Filename under /img. Must be a photograph cleared by the sweep. */
  image: string;
  /** Exactly what appears under the post. Newlines survive. */
  caption: string;
  /** ISO date this is due. The cron posts the earliest thing that is due. */
  due: string;
};

/** Four weeks, three a week, Tuesday / Thursday / Saturday.
 *
 * Ordered for rhythm rather than by product. Your existing grid is a run of
 * portraits facing camera, so this alternates action, detail, location and
 * portrait — the aim is that three consecutive squares never look like the
 * same photograph twice. */
export const POST_QUEUE: QueuedPost[] = [
  {
    // Opens the run because it is the only image that makes someone laugh,
    // and an account being built needs to be likeable before it is admired.
    id: "football",
    image: "143-jersey-black-football.jpg",
    caption: "He was told to stay on his feet.\n\nWestwood 69. Pink or black.",
    due: "2026-09-03",
  },
  {
    // Second on purpose: no person, no face. Breaks the portrait pattern
    // immediately rather than three weeks in.
    id: "hem",
    image: "11-macro-rawhem-ink.jpg",
    caption: "Cracked ink. Raw hem.\n\nIt starts looking like this. It only gets better.",
    due: "2026-09-05",
  },
  {
    id: "launderette",
    image: "41-leopard-night-launderette.jpg",
    caption: "Spin cycle. Nothing else open.",
    due: "2026-09-08",
  },
  {
    id: "skate",
    image: "66-bwblack-skate-kick.jpg",
    caption: "Level four. Nobody parks up here after ten.",
    due: "2026-09-10",
  },
  {
    // Almost entirely black. Sits between two busy frames and makes both
    // of them louder.
    id: "raking",
    image: "03-wordmark-chest-raking.jpg",
    caption: "Lights off. Still red.",
    due: "2026-09-12",
  },
  {
    id: "jesus",
    image: "35-jesus-night-rain.jpg",
    caption: "Wet crossing. Red light. No notes.",
    due: "2026-09-15",
  },
  {
    id: "kerb",
    image: "62-wordmark-jump-kerb.jpg",
    caption: "Nobody saw it. Went for it anyway.",
    due: "2026-09-17",
  },
  {
    id: "fireescape",
    image: "122-bodysuit-fireescape.jpg",
    caption: "Fourth floor. Better view than the flat.",
    due: "2026-09-19",
  },
  {
    id: "dorothy",
    image: "59-dorothy-spin.jpg",
    caption: "She is not surrendering.\n\nSurrender Dorothy.",
    due: "2026-09-22",
  },
  {
    // Replaces the post that was deleted for carrying the TOUNGE typo.
    // Corrected artwork, and a better frame than the one that went out.
    id: "tonguebox",
    image: "72-tonguebox-night-neon.jpg",
    caption: "Wind it up. See what happens.",
    due: "2026-09-24",
  },
  {
    id: "wordmark",
    image: "145-anotherpunk-chest-flash.jpg",
    caption: "The whole brief, on one shirt.",
    due: "2026-09-26",
  },
  {
    // Closes the run with the most composed photograph in the set.
    id: "subway",
    image: "77-wordmark-night-subway-REDO.jpg",
    caption: "Last train. Green light. Nobody coming.",
    due: "2026-09-29",
  },
];
