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
  /** One to ten filenames under /img. The first is the one that shows in the
   * grid, so it carries the post; the rest are the swipe. */
  images: string[];
  /** Exactly what appears under the post. Newlines survive. */
  caption: string;
  /** ISO date this is due. The cron posts the earliest thing that is due. */
  due: string;
  /** Set once this has actually gone out. The cron then skips it outright,
   * whatever the captions on the account say.
   *
   * ── WHY THIS EXISTS: A POST WENT OUT TWICE ────────────────────────────
   * The duplicate check reads the account's recent captions and compares
   * their first line against the queue's. That is sound right up until a
   * caption is EDITED here after its post has gone out — the first line
   * stops matching anything on the grid, and the cron concludes it was
   * never published. On 3 Sep the queue was rewritten so every caption
   * opens with the product name; "jesus" had already been posted under its
   * old opening line, so it published a second time on 4 Sep.
   *
   * The original design said a local "sent" flag would only be the story we
   * tell ourselves and that Instagram is the source of truth. That is still
   * true about Instagram — but it assumed our captions were immutable, and
   * they are not. So this flag is the belt and the caption check is the
   * braces: the flag catches the case where our own text has moved, the
   * caption check still catches a post published by any other route.
   *
   * TWO RULES, AND THE FIRST ONE IS THE IMPORTANT ONE.
   * 1. NEVER edit the caption of a post that has already gone out. Instagram
   *    will not let us edit the live one anyway, so all an edit here can do
   *    is break the match.
   * 2. If a post is ever published by hand, set this — otherwise the cron
   *    will post it again the moment the caption is touched. */
  posted?: string;
};

/** ── CAPTION CONVENTION ────────────────────────────────────────────────────
 * Product name, then the colour and cut, then the link. Nothing else.
 *
 * These were written as one-line jokes and Sam replaced them with this: it
 * matches what he had already posted by hand, and it does the job a shop
 * account is actually for. A caption that says "Nobody parks up here after
 * ten" is a nicer sentence and tells a stranger nothing — not what the
 * garment is, not that it is for sale, not where. The name and the fabric do
 * both, and the link means every post is a way in rather than a dead end.
 *
 * Middots become full stops. The shop's eyebrow reads "Washed black · raw
 * hem" and the brand's voice does not use middots, so it lands here as
 * "Washed black. Raw hem."
 *
 * Shop titles carry a variant suffix — "Saucer — Oversized, Black" — which
 * exists to disambiguate a grid and reads as clutter under a photograph. The
 * name is trimmed to what precedes the dash and the variant moves into the
 * second line, where it was always the more natural fit.
 *
 * The founder post is the deliberate exception and keeps its own words.
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Two months, three a week, Tuesday / Thursday / Saturday.
 *
 * Ordered for rhythm rather than by product: the aim is that three
 * consecutive squares never look like the same photograph twice, so action,
 * location, detail and portrait alternate. The lead image is different every
 * time — the second and third are allowed to repeat a look, because nobody
 * scrolling a grid sees the inside of a carousel twice. */
export const POST_QUEUE: QueuedPost[] = [
  {
    // Leads the account. Urban, wet, cinematic — the register the brand
    // actually lives in. The footballer is funnier but it is a joke, and a
    // joke is the wrong first impression for a shop nobody knows yet.
    id: "jesus",
    images: ["35-jesus-night-rain.jpg", "23-jesus-chest.jpg", "74-jesus-kerb-night.jpg"],
    caption: "The Jesus\n340gsm. Washed black. Raw hem.\n\nanotherpunk.com",
    due: "2026-09-03",
    /* Went out 3 Sep, then AGAIN on 4 Sep after the caption rewrite broke the
       first-line match. Sam deleted the second one — which means the copy
       still on the grid carries the OLD caption, so the first-line check will
       keep failing and this would have posted a third time. This flag is what
       stops that. */
    posted: "2026-09-03",
  },
  {
    // The pair, front and back, both colourways. Only possible now the black
    // back shot exists — before this it was one jersey pretending to be two.
    id: "jerseys",
    images: [
      "152-jersey-pair-night.jpg",
      "142-jersey-black-chest-flash.jpg",
      "148-jersey-black-back-69.jpg",
      "140-jersey-pink-chest-flash.jpg",
      "141-jersey-pink-back-69.jpg",
    ],
    caption: "Westwood 69\nPink or black.\n\nanotherpunk.com",
    due: "2026-09-05",
  },
  {
    id: "launderette",
    images: ["41-leopard-night-launderette.jpg", "76-leopard-midturn.jpg"],
    caption: "Leopard Crop\nPink leopard. Cropped.\n\nanotherpunk.com",
    due: "2026-09-08",
  },
  {
    id: "skate",
    images: ["66-bwblack-skate-kick.jpg", "28-bwblack-chest.jpg"],
    caption: "Saucer\nSnow-washed black. Sleeve hit.\n\nanotherpunk.com",
    due: "2026-09-10",
  },
  {
    // The only post with a real person in it rather than a model, and the
    // only one shot on a phone. Both are the point: after five polished
    // campaign frames, the fifth thing a new follower sees should be that a
    // person makes these on a floor.
    //
    // Ordered lead-first by face, not by information. The armchair shot has
    // the attitude and the paintings behind it; the working shot is the proof;
    // the blurry one is there because every real account has one.
    id: "punkiest-punk",
    images: ["158-sam-armchair.jpg", "159-sam-drawing.jpg", "160-sam-blur.jpg"],
    // WRITTEN TO BE PINNED. That changes the job: it is not a post that
    // scrolls past, it is the first thing every new visitor to the account
    // reads, so it has to introduce the shop and not only the man. Hence the
    // middle paragraph, which the feed version did not need.
    //
    // That paragraph originally sold print-to-order — no warehouse, no dead
    // stock, no sale rail. Sam cut it, rightly: those are logistics, and
    // every drop-shipper can claim them. That the drawing exists before the
    // printing does not transfer, and it is the only part a competitor
    // cannot copy by changing supplier.
    //
    // The first two lines carry it. Instagram truncates at about 125
    // characters behind a "more" link, and the joke lands at 72 — so anyone
    // who never expands it still gets the whole gag, and what follows is
    // reward for tapping rather than the price of understanding.
    //
    // Self-deprecating on purpose. The claim underneath — one person draws,
    // prints, packs and replies — is the shop's real advantage over anything
    // else printed to order, and the joke about the title is what stops it
    // reading as a boast.
    caption:
      "Sam. Punkiest Punk.\n\nSelf-appointed title. There were no other nominations.\n\nEvery graphic here started as ink on paper, on that floor. Drawn first. Printed second.\n\nHe draws them, packs them and answers the emails. Usually the same day.\n\nanotherpunk.com",
    due: "2026-09-12",
  },
  {
    // Moved off the front. Still the funniest thing here, just not the
    // opening statement.
    id: "football",
    images: ["143-jersey-black-football.jpg", "144-jersey-black-slide.jpg"],
    caption: "Westwood 69\nFootball jersey. Black.\n\nanotherpunk.com",
    due: "2026-09-15",
  },
  {
    id: "kerb",
    images: ["62-wordmark-jump-kerb.jpg", "146-anotherpunk-night-neon.jpg"],
    caption: "Another Punk\nSnow-washed. Oversized.\n\nanotherpunk.com",
    due: "2026-09-17",
  },
  {
    id: "fireescape",
    images: ["122-bodysuit-fireescape.jpg", "151-bodysuit-tight-cut.jpg"],
    caption: "Bodysuit\nMineral wash. Ribbed. Fitted.\n\nanotherpunk.com",
    due: "2026-09-19",
  },
  {
    id: "dorothy",
    images: ["59-dorothy-spin.jpg", "53-dorothy-chest-crop.jpg"],
    caption: "Surrender Dorothy\n340gsm. Washed black. Raw hem.\n\nanotherpunk.com",
    due: "2026-09-22",
  },
  {
    // Replaces the post deleted for carrying the TOUNGE typo.
    id: "tonguebox",
    images: [
      "72-tonguebox-night-neon.jpg",
      "70-tonguebox-chest-flash.jpg",
      "71-tonguebox-threequarter.jpg",
    ],
    caption: "Tongue Box\n340gsm. Washed black. Raw hem.\n\nanotherpunk.com",
    due: "2026-09-24",
  },
  {
    id: "bats-neon",
    images: ["33-bats-night-neon.jpg", "24-bats-chest-redo.jpg", "44-bats-jump-flash.jpg"],
    caption: "Bat Country\n340gsm. Washed black. Raw hem.\n\nanotherpunk.com",
    due: "2026-09-26",
  },
  {
    id: "subway",
    images: ["77-wordmark-night-subway-REDO.jpg", "147-anotherpunk-night-shopphone.jpg"],
    caption: "Another Punk\nSnow-washed. Oversized.\n\nanotherpunk.com",
    due: "2026-09-29",
  },

  // ── October ───────────────────────────────────────────────────────────
  {
    // Was the Cami, which Sam pulled for quality. Same slot, its replacement.
    id: "crop-tank",
    images: ["167-tank-alley.jpg", "168-tank-crop.jpg"],
    caption: "Crop Tank\nBlack. Cropped. Wide strap.\n\nanotherpunk.com",
    due: "2026-10-01",
  },
  {
    id: "saucer-carpark",
    images: ["37-saucer-night-carpark.jpg", "25-saucer-chest.jpg"],
    caption: "Saucer\n340gsm. Washed black. Raw hem.\n\nanotherpunk.com",
    due: "2026-10-03",
  },
  {
    id: "alley",
    images: ["39-bwwhite-night-alley.jpg", "08-bwwhite-midturn.jpg"],
    caption: "Saucer\nSnow-washed bone. Sleeve hit.\n\nanotherpunk.com",
    due: "2026-10-06",
  },
  {
    id: "mesh",
    images: ["07-mesh-walking-blur.jpg", "27-mesh-chest.jpg"],
    caption: "Mesh\nOpen-weave net. Boxy.\n\nanotherpunk.com",
    due: "2026-10-08",
  },
  {
    id: "sprint",
    images: ["60-bats-sprint-night.jpg"],
    caption: "Bat Country\n340gsm. Washed black. Raw hem.\n\nanotherpunk.com",
    due: "2026-10-10",
  },
  {
    id: "busstop",
    images: ["75-leopard-night-busstop.jpg", "06-leopard-threequarter-night.jpg"],
    caption: "Leopard Crop\nPink leopard. Cropped.\n\nanotherpunk.com",
    due: "2026-10-13",
  },
  {
    id: "diner",
    images: ["92-bodysuit-night-diner.jpg", "130-bodysuit-onepiece-standing.jpg"],
    caption: "Bodysuit\nMineral wash. Ribbed. Fitted.\n\nanotherpunk.com",
    due: "2026-10-15",
  },
  {
    id: "shelter",
    images: ["38-bwblack-night-busshelter.jpg", "43-bwblack-night-wide.jpg"],
    caption: "Saucer\nSnow-washed black. Sleeve hit.\n\nanotherpunk.com",
    due: "2026-10-17",
  },
  {
    // Also freed up by dropping the Cami. Given to the other new piece.
    id: "big-pussy",
    images: ["166-bigpussy-cat.jpg", "165-bigpussy-night.jpg"],
    caption: "Big Pussy\nGrey leopard. Cropped. Runs true to size.\n\nanotherpunk.com",
    due: "2026-10-20",
  },
  {
    id: "dance",
    images: ["64-bwwhite-dance.jpg"],
    caption: "Saucer\nSnow-washed bone. Sleeve hit.\n\nanotherpunk.com",
    due: "2026-10-22",
  },
  {
    id: "corridor",
    images: ["61-jesus-walking-corridor.jpg", "03-wordmark-chest-raking.jpg"],
    caption: "The Jesus\n340gsm. Washed black. Raw hem.\n\nanotherpunk.com",
    due: "2026-10-24",
  },
  {
    id: "saucer-turn",
    images: ["63-saucer-turn.jpg", "05-saucer-profile.jpg"],
    caption: "Saucer\n340gsm. Washed black. Raw hem.\n\nanotherpunk.com",
    due: "2026-10-27",
  },
  {
    // Displaced from 12 September by the founder post. No person, no face —
    // it breaks the portrait pattern, and it is a single deliberately: a
    // texture shot does not want a swipe attached to it.
    id: "hem",
    images: ["11-macro-rawhem-ink.jpg"],
    caption: "Raw hem.\nOn every tee.\n\nanotherpunk.com",
    due: "2026-10-29",
  },
];
