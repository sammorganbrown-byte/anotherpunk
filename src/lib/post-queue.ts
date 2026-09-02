/** The Instagram posting queue.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  TO CHANGE A POST: edit the caption below, save, commit, push. The next
 *  deploy picks it up. Anything already posted is ignored, so editing an
 *  entry that has gone out changes nothing — it will not be posted twice.
 *
 *  TO DROP A POST: delete its block, or push its `due` date into the future.
 *  TO REORDER: change the dates. The queue posts by date, not by position.
 *  IMAGES: one posts as a single photo, two or three as a carousel.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Plain data in the repo rather than a database, on purpose: you can read it,
 * reorder it, rewrite a caption or delete an entry in a text editor, and the
 * change is reviewable in git like anything else.
 *
 * Every image here is one the site already uses, or one cleared by the sweep
 * in SOCIAL-IMAGES.md. Anything added later must be checked the same way. The
 * image folder holds rejected mockups too, and a filename is not evidence:
 * two files named "-FIXED" were never fixed.
 */

export type QueuedPost = {
  /** Stable id. Appears in the email you get and in the logs. */
  id: string;
  /** One to three filenames under /img. The first is the one that shows in
   * the grid, so it carries the post; the rest are the swipe. */
  images: string[];
  /** Exactly what appears under the post. Newlines survive. */
  caption: string;
  /** ISO date this is due. The cron posts the earliest thing that is due. */
  due: string;
};

/** Two months, three a week, Tuesday / Thursday / Saturday.
 *
 * Ordered for rhythm rather than by product: the aim is that three
 * consecutive squares never look like the same photograph twice, so action,
 * location, detail and portrait alternate. The lead image is different every
 * time — the second and third are allowed to repeat a look, because nobody
 * scrolling a grid sees the inside of a carousel twice. */
export const POST_QUEUE: QueuedPost[] = [
  {
    // Opens the run because it is the only image that makes someone laugh,
    // and an account being built needs to be likeable before it is admired.
    id: "football",
    images: [
      "143-jersey-black-football.jpg",
      "142-jersey-black-chest-flash.jpg",
      "144-jersey-black-slide.jpg",
    ],
    caption: "He was told to stay on his feet.\n\nWestwood 69. Pink or black.",
    due: "2026-09-03",
  },
  {
    // Second on purpose: no person, no face. Breaks the portrait pattern
    // immediately rather than three weeks in. Single image — a texture shot
    // does not want a swipe.
    id: "hem",
    images: ["11-macro-rawhem-ink.jpg"],
    caption: "Cracked ink. Raw hem.\n\nIt starts looking like this. It only gets better.",
    due: "2026-09-05",
  },
  {
    id: "launderette",
    images: ["41-leopard-night-launderette.jpg", "76-leopard-midturn.jpg"],
    caption: "Spin cycle. Nothing else open.",
    due: "2026-09-08",
  },
  {
    id: "skate",
    images: ["66-bwblack-skate-kick.jpg", "28-bwblack-chest.jpg"],
    caption: "Level four. Nobody parks up here after ten.",
    due: "2026-09-10",
  },
  {
    // Almost entirely black. Sits between two busy frames and makes both
    // of them louder. Single, deliberately.
    id: "raking",
    images: ["03-wordmark-chest-raking.jpg"],
    caption: "Lights off. Still red.",
    due: "2026-09-12",
  },
  {
    id: "jesus",
    images: ["35-jesus-night-rain.jpg", "23-jesus-chest.jpg", "74-jesus-kerb-night.jpg"],
    caption: "Wet crossing. Red light. No notes.",
    due: "2026-09-15",
  },
  {
    id: "kerb",
    images: ["62-wordmark-jump-kerb.jpg", "146-anotherpunk-night-neon.jpg"],
    caption: "Nobody saw it. Went for it anyway.",
    due: "2026-09-17",
  },
  {
    id: "fireescape",
    images: ["122-bodysuit-fireescape.jpg", "151-bodysuit-tight-cut.jpg"],
    caption: "Fourth floor. Better view than the flat.",
    due: "2026-09-19",
  },
  {
    id: "dorothy",
    images: ["59-dorothy-spin.jpg", "53-dorothy-chest-crop.jpg"],
    caption: "She is not surrendering.\n\nSurrender Dorothy.",
    due: "2026-09-22",
  },
  {
    // Replaces the post deleted for carrying the TOUNGE typo. Corrected
    // artwork, and a better frame than the one that went out.
    id: "tonguebox",
    images: [
      "72-tonguebox-night-neon.jpg",
      "70-tonguebox-chest-flash.jpg",
      "71-tonguebox-threequarter.jpg",
    ],
    caption: "Wind it up. See what happens.",
    due: "2026-09-24",
  },
  {
    id: "bats-neon",
    images: ["33-bats-night-neon.jpg", "24-bats-chest-redo.jpg", "44-bats-jump-flash.jpg"],
    caption: "This is bat country. Obviously.",
    due: "2026-09-26",
  },
  {
    // Closes September with the most composed photograph in the set.
    id: "subway",
    images: ["77-wordmark-night-subway-REDO.jpg", "147-anotherpunk-night-shopphone.jpg"],
    caption: "Last train. Green light. Nobody coming.",
    due: "2026-09-29",
  },

  // ── October ───────────────────────────────────────────────────────────
  {
    id: "cami-cafe",
    images: ["121-cami-cafe.jpg", "81-cami-chest-crop.jpg"],
    caption: "Coffee at two. Nobody asked why.",
    due: "2026-10-01",
  },
  {
    id: "saucer-carpark",
    images: ["37-saucer-night-carpark.jpg", "25-saucer-chest.jpg"],
    caption: "Car park. No cars. One saucer.",
    due: "2026-10-03",
  },
  {
    id: "alley",
    images: ["39-bwwhite-night-alley.jpg", "08-bwwhite-midturn.jpg"],
    caption: "Shortcut. Regretted it.",
    due: "2026-10-06",
  },
  {
    id: "mesh",
    images: ["07-mesh-walking-blur.jpg", "27-mesh-chest.jpg"],
    caption: "See-through. On purpose.",
    due: "2026-10-08",
  },
  {
    id: "sprint",
    images: ["60-bats-sprint-night.jpg"],
    caption: "Late for nothing.",
    due: "2026-10-10",
  },
  {
    id: "busstop",
    images: ["75-leopard-night-busstop.jpg", "06-leopard-threequarter-night.jpg"],
    caption: "Bus at ten past. Never comes.",
    due: "2026-10-13",
  },
  {
    id: "diner",
    images: ["92-bodysuit-night-diner.jpg", "130-bodysuit-onepiece-standing.jpg"],
    caption: "Diner. Third coffee. Still here.",
    due: "2026-10-15",
  },
  {
    id: "shelter",
    images: ["38-bwblack-night-busshelter.jpg", "43-bwblack-night-wide.jpg"],
    caption: "Shelter. Not from anything.",
    due: "2026-10-17",
  },
  {
    id: "leather",
    images: ["86-cami-leather-jacket.jpg", "89-cami-strap-detail.jpg"],
    caption: "Borrowed the jacket. Keeping it.",
    due: "2026-10-20",
  },
  {
    id: "dance",
    images: ["64-bwwhite-dance.jpg"],
    caption: "No music. Still dancing.",
    due: "2026-10-22",
  },
  {
    // The jerseys post. Pink only for now — there is no back shot of the
    // black one, so the pair cannot be shown properly yet.
    id: "jersey-pink",
    images: ["140-jersey-pink-chest-flash.jpg", "141-jersey-pink-back-69.jpg"],
    caption: "Front says Another Punk. Back says Westwood 69.",
    due: "2026-10-24",
  },
  {
    id: "saucer-turn",
    images: ["63-saucer-turn.jpg", "05-saucer-profile.jpg"],
    caption: "Turn around. Something followed you home.",
    due: "2026-10-27",
  },
];
