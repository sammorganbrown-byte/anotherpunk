// Another Punk's real catalogue.
//
// These are actual Another Punk garments with real artwork, photographed via
// generated model mockups built from each design's own print-ready reference
// (see Desktop/AP/Shirts for mockups for the source files). This replaced the
// earlier placeholder catalogue that borrowed Deadstock's tee colorways.
//
// FULFILLMENT: Tapstitch, reached through a headless Shopify bridge (see
// tapstitch-fulfillment.server.ts). `shopifyProductId` is the product in the
// backend Shopify store that Tapstitch's app watches; `shopifyVariantIds`
// maps our size labels onto that product's real Shopify variant ids, which
// is what a draft order line item actually needs. A product with
// `shopifyProductId: null` has NOT been pushed into Tapstitch/Shopify yet and
// therefore cannot be fulfilled — it still renders on the site, but
// tapstitch-fulfillment.server.ts must refuse to build an order for it rather
// than silently taking money for something nobody can make.
//
// Deliberately NOT merged into products.ts/tee.ts: Deadstock's shop and merch
// grids read those files directly, so an Another Punk product can never leak
// into Deadstock's listings, or vice versa.

export type ApSize = "XS" | "S" | "M" | "L" | "XL" | "2XL" | "3XL";

export type AnotherPunkProduct = {
  /** How many times this product's images repeat in the field.
   *
   * The field interleaves one image per product per round, so a product with
   * few photographs turns up rarely — it is under-represented for a reason
   * that has nothing to do with how much it matters. Raising this repeats its
   * images across more rounds, which the interleave then spreads out rather
   * than clumping. Product pages ignore it entirely. */
  fieldRepeat?: number;
  /** Images that belong on the product page but NOT in the field.
   *
   * The field is a campaign: photographs of people wearing the thing. A flat
   * packshot on a plain ground is useful to a customer deciding on a purchase
   * and dead weight floating among the rest, so it can be listed here and the
   * field will skip it. Paths must match `images` exactly. */
  notInField?: string[];
  slug: string;
  title: string;
  /** Short editorial kicker shown above the title. */
  eyebrow: string;
  /** EUR. Flat across the range for now, revisited once real unit costs
   * and shipping are confirmed against Tapstitch's actual invoices. */
  price: number;
  /** What the blank plus printing costs, from Shopify's cost-per-item field.
   * Display never uses it; it exists so a code can price at cost.
   *
   * OPTIONAL, because a product can go live before anyone has looked its unit
   * cost up. Leaving it out is safe in the only direction that matters: the
   * cost-price code falls back to charging the full price for that line
   * rather than guessing, so an unknown cost can never sell at a loss. Fill
   * it in when you have the real figure. */
  cost?: number;
  /** Every shot of this garment. images[0] is the hero — it's what the
   * shop grid, homepage tiles and cart thumbnail use, so it should be the
   * frame that reads the garment most clearly. The rest fill the
   * product-page gallery in order. Never empty. */
  images: string[];
  /** Product-page body copy. Falls back to DEFAULT_DESCRIPTION, which
   * describes the heavyweight boxy raw-hem tee most of the range uses —
   * override it for anything cut differently (crop, mesh, oversized). */
  description?: string;
  /** Sizing note. Falls back to DEFAULT_FIT. */
  fit?: string;
  /** The line the graphic came from, quoted exactly, plus the film it's
   * from. Only the designs that actually reference a film carry these —
   * the rest render without a quote block rather than inventing one. */
  quote?: string;
  quoteSource?: string;
  sizes: ApSize[];
  /** Backend Shopify product this maps to, null when not yet pushed. */
  shopifyProductId: string | null;
  /** size label -> Shopify variant id. Empty until the product is pushed. */
  shopifyVariantIds: Partial<Record<ApSize, string>>;
};

/** Body copy for the five tees that carry no description of their own.
 *
 * ── THE BLANK CHANGED ON 5 SEP AND THE COPY HAD TO FOLLOW ─────────────────
 * These moved from Snow Wash Raw-Hem (RT0058, 340gsm) to Vintage Wash Boxy
 * Distressed Hem (RT0077, 240gsm) when the first blank went out of stock.
 *
 * THE OLD SELLING LINE IS GONE, AND THAT IS THE POINT TO UNDERSTAND. Sam
 * asked for "ultra-heavyweight 340gsm lux feel" and it was true: 340gsm is
 * genuinely heavy, and the weight was the argument for fifty euros. 240gsm
 * is a good mid-weight and nothing more. Repeating the old words on the new
 * cloth would be a lie a customer discovers by holding it, which is the
 * worst way to be caught.
 *
 * So the copy sells what this blank actually is: washed soft, broken in,
 * and distressed at the hem rather than cut raw. That is a real garment
 * with real appeal, just a different one.
 *
 * NEVER describe any of this as screen-printed. It is printed to order by
 * Tapstitch, and screen-print language would be a lie about the process. */
export const DEFAULT_DESCRIPTION =
  "240gsm washed cotton, soft and already broken in. Boxy through the body, hem torn and distressed. Drawn by hand, printed after you order.";

export const DEFAULT_FIT =
  "Runs oversized. Your normal size for the fit shown. One down if you want it closer.";

const FOUR: ApSize[] = ["S", "M", "L", "XL"];
/** The cropped tank runs smaller and starts at XS — the only piece that does. */
const XS_TO_L: ApSize[] = ["XS", "S", "M", "L"];
const SIX: ApSize[] = ["S", "M", "L", "XL", "2XL", "3XL"];
/** The jersey stops at 2XL — there is no 3XL variant in Shopify, so offering
 * one would sell a size that cannot be fulfilled. */
const FIVE: ApSize[] = ["S", "M", "L", "XL", "2XL"];

/** Retail, set so that after the garment, the postage and the card fee, half
 * of what the customer pays is profit. Every price below is derived from that
 * product's actual cost — see scripts/margin-sheet.mjs, which solves for it.
 *
 * Grouped by cost, not by blank: Saucer Oversized and Another Punk are
 * printed on the same shirt but do not cost the same to make, so they do not
 * carry the same price. */
export const TEE_PRICE = 50;
export const SAUCER_OVERSIZED_PRICE = 40;
export const ANOTHER_PUNK_PRICE = 35;
export const MESH_PRICE = 45;
export const JERSEY_PRICE = 40;
export const WOMENS_PRICE = 35;
export const BODYSUIT_PRICE = 40;

export const ANOTHER_PUNK_PRODUCTS: AnotherPunkProduct[] = [
  {
    slug: "westwood-69-pink",
    description:
      "Boxy football jersey, striped jacquard, navy collar. Saucer on the front, WESTWOOD 69 across the back.",
    fit: "Boxy and oversized. Your normal size.",
    title: "Westwood 69 — Pink",
    eyebrow: "Football jersey · pink",
    price: JERSEY_PRICE,
    cost: 15.07,
    images: [
      "/img/140-jersey-pink-chest-flash.jpg",
      "/img/141-jersey-pink-back-69.jpg",
      "/img/152-jersey-pair-night.jpg",
      "/img/214-westwood-pink-fulllength.png",
      "/img/218-westwood-pink-chest-raking.png",
    ],
    // The pair shot belongs to both jerseys, so it would otherwise float in
    // the field twice — the one photograph on the homepage that visibly
    // repeats. It is kept on this product page and shown in the field under
    // the black jersey only, which is the figure facing the camera and so the
    // one somebody clicking it is asking about.
    notInField: ["/img/152-jersey-pair-night.jpg"],
    // Only two photographs of its own, so it barely surfaced in the field.
    // Doubled there.
    fieldRepeat: 2,
    sizes: FIVE,
    shopifyProductId: "15966414274891",
    shopifyVariantIds: {
      S: "58321109549387",
      M: "58321109582155",
      L: "58321109614923",
      XL: "58321109647691",
      "2XL": "58321109680459",
    },
  },
  {
    slug: "westwood-69-black",
    description:
      "Boxy football jersey, striped jacquard, white collar. Saucer on the front, WESTWOOD 69 across the back.",
    fit: "Boxy and oversized. Your normal size.",
    title: "Westwood 69 — Black",
    eyebrow: "Football jersey · black",
    price: JERSEY_PRICE,
    cost: 15.07,
    images: [
      "/img/142-jersey-black-chest-flash.jpg",
      "/img/148-jersey-black-back-69.jpg",
      "/img/143-jersey-black-football.jpg",
      "/img/144-jersey-black-slide.jpg",
      "/img/152-jersey-pair-night.jpg",
    ],
    sizes: FIVE,
    shopifyProductId: "15966414274891",
    shopifyVariantIds: {
      S: "58321109713227",
      M: "58321109745995",
      L: "58321109778763",
      XL: "58321109811531",
      "2XL": "58321109844299",
    },
  },
  {
    slug: "bat-country",
    quote: "We can't stop here. This is bat country.",
    quoteSource: "Fear and Loathing in Las Vegas, 1998",
    title: "Bat Country",
    eyebrow: "240gsm · washed black · distressed hem",
    price: TEE_PRICE,
    cost: 14.69,
    /* 178 is the SHARED back shot for all five raw-hem tees. The backs of
       these are genuinely identical — plain washed black, no print, raw torn
       hem — so five separate photographs would be five copies of the same
       information. Sam approved reusing one. It goes LAST in each gallery:
       it answers "what does the back look like" for anyone who swipes that
       far, without displacing a frame that sells the shirt.

       If a back print is ever added to any of these, that product needs its
       own shot and must stop pointing here. */
    images: [
      "/img/219-batcountry-hero.png",
      "/img/24-bats-chest-redo.jpg",
      "/img/33-bats-night-neon.jpg",
      "/img/09-bats-wide-negativespace.jpg",
      "/img/44-bats-jump-flash.jpg",
      "/img/58-bats-chest-daylight.jpg",
      "/img/60-bats-sprint-night.jpg",
      "/img/178-rawhem-back-shared.png",
    ],
    notInField: ["/img/178-rawhem-back-shared.png"],
    sizes: FIVE,
    shopifyProductId: "15975454835019",
    shopifyVariantIds: {
      S: "58366321819979",
      M: "58366321852747",
      L: "58366321885515",
      XL: "58366321918283",
      "2XL": "58366321951051",
    },
  },
  {
    slug: "tongue-box",
    quote: "I better adjust my tongue box.",
    quoteSource: "Barbarella, 1968",
    title: "Tongue Box",
    eyebrow: "240gsm · washed black · distressed hem",
    price: TEE_PRICE,
    cost: 14.69,
    // Reshot 2026-09-01. Every previous image showed the garment misspelled
    // TOUNGE; the artwork was corrected and these three are the only shots of
    // the real product. The old five are still on disk but must not be listed
    // — a customer scrolling to image four and finding a different spelling
    // is worse than a product with three photographs.
    images: [
      "/img/70-tonguebox-chest-flash.jpg",
      "/img/71-tonguebox-threequarter.jpg",
      "/img/72-tonguebox-night-neon.jpg",
      "/img/178-rawhem-back-shared.png",
      "/img/230-tonguebox-crosswalk-240.png",
      "/img/231-macro-distressed-hem.png",
    ],
    notInField: ["/img/178-rawhem-back-shared.png"],
    sizes: FIVE,
    shopifyProductId: "15975453720907",
    shopifyVariantIds: {
      S: "58366320148811",
      M: "58366320181579",
      L: "58366320214347",
      XL: "58366320247115",
      "2XL": "58366320279883",
    },
  },
  {
    slug: "the-jesus",
    quote: "Nobody fucks with the Jesus.",
    quoteSource: "The Big Lebowski, 1998",
    title: "The Jesus",
    eyebrow: "240gsm · washed black · distressed hem",
    price: TEE_PRICE,
    cost: 14.69,
    images: [
      "/img/220-jesus-hero.png",
      "/img/23-jesus-chest.jpg",
      "/img/35-jesus-night-rain.jpg",
      "/img/61-jesus-walking-corridor.jpg",
      "/img/74-jesus-kerb-night.jpg",
      "/img/178-rawhem-back-shared.png",
    ],
    notInField: ["/img/178-rawhem-back-shared.png"],
    sizes: FIVE,
    shopifyProductId: "15975453425995",
    shopifyVariantIds: {
      S: "58366319690059",
      M: "58366319722827",
      L: "58366319755595",
      XL: "58366319788363",
      "2XL": "58366319821131",
    },
  },
  {
    slug: "surrender-dorothy",
    quote: "Surrender Dorothy.",
    quoteSource: "After Hours, 1985",
    title: "Surrender Dorothy",
    eyebrow: "240gsm · washed black · distressed hem",
    price: TEE_PRICE,
    cost: 14.69,
    images: [
      "/img/221-dorothy-hero.png",
      "/img/53-dorothy-chest-crop.jpg",
      "/img/178-rawhem-back-shared.png",
      "/img/200-dorothy-chest-crop.png",
      "/img/212-dorothy-forecourt.png",
      "/img/215-dorothy-daylight.png",
    ],
    notInField: ["/img/178-rawhem-back-shared.png"],
    sizes: FIVE,
    shopifyProductId: "15975454376267",
    shopifyVariantIds: {
      S: "58366321230155",
      M: "58366321262923",
      L: "58366321295691",
      XL: "58366321328459",
      "2XL": "58366321361227",
    },
  },
  {
    slug: "saucer",
    title: "Saucer",
    eyebrow: "240gsm · washed black · distressed hem",
    price: TEE_PRICE,
    cost: 14.69,
    images: [
      "/img/222-saucer-hero.png",
      "/img/25-saucer-chest.jpg",
      "/img/05-saucer-profile.jpg",
      "/img/37-saucer-night-carpark.jpg",
      "/img/56-saucer-chest-raking.jpg",
      "/img/63-saucer-turn.jpg",
      "/img/178-rawhem-back-shared.png",
    ],
    notInField: ["/img/178-rawhem-back-shared.png"],
    sizes: FIVE,
    shopifyProductId: "15975453098315",
    shopifyVariantIds: {
      S: "58366319198539",
      M: "58366319231307",
      L: "58366319264075",
      XL: "58366319296843",
      "2XL": "58366319329611",
    },
  },
  {
    slug: "saucer-oversized-black",
    description:
      "Snow-washed heavyweight cotton. Oversized through the body, hem finished clean. Drawn by hand on the chest, mark on the sleeve.",
    title: "Saucer — Oversized, Black",
    eyebrow: "Snow-washed black · sleeve hit",
    price: SAUCER_OVERSIZED_PRICE,
    cost: 15.07,
    images: [
      "/img/223-saucer-oversized-black-hero.png",
      "/img/28-bwblack-chest.jpg",
      "/img/38-bwblack-night-busshelter.jpg",
      "/img/43-bwblack-night-wide.jpg",
      "/img/57-bwblack-chest-night.jpg",
      "/img/66-bwblack-skate-kick.jpg",
      "/img/181-snowwash-black-back.png",
    ],
    notInField: ["/img/181-snowwash-black-back.png"],
    sizes: SIX,
    shopifyProductId: "15972246094155",
    shopifyVariantIds: {
      S: "58349182353739",
      M: "58349182386507",
      L: "58349182419275",
      XL: "58349182452043",
      "2XL": "58349182484811",
      "3XL": "58349182517579",
    },
  },
  {
    // "Bone" is ours and Shopify calls the same colourway "Apricot". The
    // divergence is deliberate — bone is the better name for it — but it is
    // exactly the kind of thing that mis-maps a variant later, so: the
    // APRICOT ids in Shopify are the BONE ones here. Black is black in both.
    slug: "saucer-oversized-bone",
    description:
      "Snow-washed heavyweight cotton in bone. Oversized through the body, hem finished clean. Drawn by hand on the chest, mark on the sleeve.",
    title: "Saucer — Oversized, Bone",
    eyebrow: "Snow-washed bone · sleeve hit",
    price: SAUCER_OVERSIZED_PRICE,
    cost: 15.07,
    images: [
      "/img/224-saucer-oversized-bone-hero.png",
      "/img/08-bwwhite-midturn.jpg",
      "/img/39-bwwhite-night-alley.jpg",
      "/img/54-bwwhite-chest-crop.jpg",
      "/img/64-bwwhite-dance.jpg",
      "/img/182-snowwash-bone-back.png",
    ],
    notInField: ["/img/182-snowwash-bone-back.png"],
    sizes: SIX,
    // Same Shopify product as the black colourway above, different colour
    // option, hence the same product id but the Apricot variant ids.
    shopifyProductId: "15972246094155",
    shopifyVariantIds: {
      S: "58349182157131",
      M: "58349182189899",
      L: "58349182222667",
      XL: "58349182255435",
      "2XL": "58349182288203",
      "3XL": "58349182320971",
    },
  },
  {
    slug: "another-punk",
    description:
      "Snow-washed heavyweight cotton. Oversized through the body, hem finished clean. The mark, large across the chest.",
    title: "Another Punk",
    eyebrow: "Snow-washed · oversized",
    price: ANOTHER_PUNK_PRICE,
    cost: 12.47,
    images: [
      "/img/147-anotherpunk-night-shopphone.jpg",
      "/img/146-anotherpunk-night-neon.jpg",
      "/img/181-snowwash-black-back.png",
      "/img/211-anotherpunk-launderette.png",
      "/img/213-anotherpunk-chest-raking.png",
    ],
    /* Kept off the field. A back shot is reference rather than campaign: the
       field is a mood board of people wearing the things, and a row of
       identical shoulders reads as a fault in the page.

       The flat packshot that used to sit here is gone entirely, product page
       included. It was the last flat lay in the range and Sam's rule on those
       is standing: every image is on a body. */
    notInField: ["/img/181-snowwash-black-back.png"],
    sizes: SIX,
    shopifyProductId: "15942019613003",
    shopifyVariantIds: {
      S: "58204707291467",
      M: "58204707324235",
      L: "58204707357003",
      XL: "58204707389771",
      "2XL": "58204707422539",
      "3XL": "58204707455307",
    },
  },
  {
    // The plain one. No graphic at all beyond a wordmark on the sleeve, which
    // is the whole idea: a shop of loud shirts still needs the thing you put
    // on when you do not want to say anything.
    //
    // ── €35 IS DELIBERATE, AND NOW IT IS ALSO THE BEST MARGIN HERE ───────
    // Priced as a way in: the thing somebody buys when they are not yet sure
    // they want to buy anything. That reasoning has not changed.
    //
    // What changed is the blank. This ran on a 400gsm shirt costing €16.93 —
    // the worst margin in the shop at 43% — until Sam replaced it because
    // 400gsm is simply too thick for a t-shirt, closer to sweatshirt weight.
    // The 300gsm that replaced it costs €9.93, so an entry price that used to
    // be the thinnest thing here is now the fattest at 59%.
    //
    // Worth keeping the order of those straight: the blank changed because
    // the shirt was wrong, and the margin followed. Not the other way round.
    // ─────────────────────────────────────────────────────────────────────
    //
    // Not in the field — every image here is either a flat packshot or reads
    // at a glance as a blank white tee, and the field is a campaign of
    // photographs that carry a graphic. Sam asked for it to stay out, and it
    // would have looked like an empty frame in there anyway.
    slug: "staple",
    title: "Staple — White",
    eyebrow: "White · 300gsm · sleeve print",
    description:
      "300gsm cotton, heavy enough to hang and light enough to wear. Boxy and oversized, ribbed crew. Blank front, blank back, one mark on the sleeve.",
    fit: "Boxy and oversized. Your normal size.",
    price: 35,
    cost: 9.93,
    // The sleeve close-up took three attempts and the fix was a second
    // reference element: a crop of the real wordmark off 145, so the model had
    // the actual letterforms to copy instead of inventing them. A garment
    // reference is not an artwork reference — given only the shirt, it drew a
    // thin evenly-spaced marker at twice the size, which passed a glance and
    // was a different shirt.
    // NO FLAT PACKSHOTS HERE. Tapstitch's front and back flats were images
    // three and four and looked terrible on the page: a white garment on a
    // white ground, run through the gallery's tint, renders as a blank pink
    // slab with a fragment of red lettering adrift in it. That is a problem
    // specific to a white product — the same flats would read fine on a black
    // one — and it is the reason this piece is carried entirely by
    // photographs of it being worn.
    images: [
      "/img/163-plainwhite-night-street.jpg",
      "/img/164-plainwhite-sleeve.jpg",
      "/img/183-staple-white-back.png",
      "/img/195-staple-white-night.png",
      "/img/210-staple-white-daylight.png",
    ],
    notInField: [
      "/img/163-plainwhite-night-street.jpg",
      "/img/164-plainwhite-sleeve.jpg",
      "/img/183-staple-white-back.png",
    ],
    sizes: FIVE,
    shopifyProductId: "15972281844043",
    shopifyVariantIds: {
      S: "58349633175883",
      M: "58349633208651",
      L: "58349633241419",
      XL: "58349633274187",
      "2XL": "58349633306955",
    },
  },
  {
    // The black half of the same 300gsm blank. Split into its own entry the
    // way Westwood 69 and the Saucer Oversized are, so the grid shows the
    // colour you would actually be buying rather than one swatch standing in
    // for two.
    slug: "staple-black",
    title: "Staple — Black",
    eyebrow: "Black · 300gsm · sleeve print",
    description:
      "300gsm cotton, heavy enough to hang and light enough to wear. Boxy and oversized, ribbed crew. Blank front, blank back, one mark on the sleeve.",
    fit: "Boxy and oversized. Your normal size.",
    price: 35,
    cost: 9.93,
    images: [
      "/img/169-staple-black-street.jpg",
      "/img/170-staple-black-sleeve.jpg",
      "/img/209-staple-black-back.png",
      "/img/197-staple-black-forecourt.png",
      "/img/198-staple-black-profile.png",
    ],
    notInField: [
      "/img/169-staple-black-street.jpg",
      "/img/170-staple-black-sleeve.jpg",
      "/img/209-staple-black-back.png",
    ],
    sizes: FIVE,
    shopifyProductId: "15972281844043",
    shopifyVariantIds: {
      S: "58349633339723",
      M: "58349633372491",
      L: "58349633405259",
      XL: "58349633438027",
      "2XL": "58349633470795",
    },
  },
  {
    slug: "mesh",
    description:
      "Open-weave net, sheer on purpose. Boxy through the body. Drawn by hand, printed straight onto the mesh.",
    fit: "Boxy and loose. Your normal size.",
    title: "Mesh",
    eyebrow: "Open-weave net · boxy",
    price: MESH_PRICE,
    cost: 17.47,
    /* ── THE THREE GENERATED SHOTS ARE WRONG AND ARE BEING REPLACED ──────
       Sam had one printed on 4 Sep. On the real garment the ink lands only
       on the strands of the net: every hole stays open, and you can see
       straight through the letters. All three mockups render the print as a
       SOLID red shape, as though a vinyl decal had been laid over the mesh
       and the holes filled in. The hero is the worst of them, and it is what
       the grid, the cart and every shared link show.

       That is a misrepresentation of the product rather than a stylistic
       miss, and it is the sort that produces a return we pay postage on.
       171-mesh-print-macro is a photograph of the actual shirt and is placed
       SECOND, directly behind the hero, so anybody swiping sees the truth
       before they buy. It stays even after the mockups are redone: it is the
       only image here that is the real thing.

       FIXED 4 Sep. 173-mesh-chest-real-print is the regenerated hero: the
       wordmark is correct and the print is knocked through the net, every
       hole open. The old CloudFront hero and 27-mesh-chest are dropped
       outright rather than demoted, because both showed a solid filled
       print, which is the one thing about this shirt that was wrong.
       07-mesh-walking-blur is kept for now: it is a motion blur and the
       print is not legible enough in it to misinform anyone. Replace it in
       the next batch.

       What produced the correct result, and what to repeat: the garment
       element AND the wordmark artwork element together, a chest-facing
       pose, "letter for letter", and an explicit instruction that ink sits
       only on the threads with every hole open. A turned-away pose invented
       a back print reading "UNK NOWN". See MOCKUP-BRIEF.md. */
    images: [
      "/img/173-mesh-chest-real-print.png",
      "/img/205-mesh-front-woman-vest.png",
      "/img/171-mesh-print-macro.jpg",
      "/img/07-mesh-walking-blur.jpg",
      "/img/191-mesh-front-woman.png",
      "/img/194-mesh-back.png",
    ],
    notInField: ["/img/194-mesh-back.png"],
    sizes: FOUR,
    shopifyProductId: "15943646740811",
    shopifyVariantIds: {
      S: "58214043615563",
      M: "58214043648331",
      L: "58214043681099",
      XL: "58214043713867",
    },
  },
  {
    slug: "leopard-crop",
    description:
      "Lightweight stretch jersey. Pink leopard. Cut short and close through the body. Slogan drawn by hand, printed in red.",
    fit: "Fitted and cropped. This one runs true to size. Not oversized like the tees.",
    title: "Leopard Crop",
    eyebrow: "Pink leopard · cropped",
    // Priced below the rest of the range on request, it's a lighter
    // cropped body rather than the heavyweight boxy tee.
    price: WOMENS_PRICE,
    cost: 12.47,
    images: [
      "/img/225-leopardcrop-hero.png",
      "/img/06-leopard-threequarter-night.jpg",
      "/img/41-leopard-night-launderette.jpg",
      "/img/31-leopard-nightstreet.jpg",
      "/img/75-leopard-night-busstop.jpg",
      "/img/76-leopard-midturn.jpg",
      "/img/186-leopardcrop-back.png",
      "/img/187-leopardcrop-bed.png",
    ],
    notInField: ["/img/186-leopardcrop-back.png"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    shopifyProductId: "15942025118027",
    shopifyVariantIds: {
      S: "58204730786123",
      M: "58204730818891",
      L: "58204730851659",
      XL: "58204730884427",
      "2XL": "58204730917195",
    },
  },
  {
    // Same slogan as the Leopard Crop, a completely different garment: unisex,
    // boxy, oversized, and a GREY snow-leopard rather than the crop top's pink.
    // Worth keeping straight — they are easy to confuse in a grid and the two
    // reference elements in Higgsfield are named to match.
    // Only two photographs, so it surfaced once each in a field of nearly
    // eighty and the cat shot — the funniest thing in the shop — was easy to
    // miss entirely. Doubled, the way Westwood 69 Pink already is for the
    // same reason. The interleave spreads the repeats across separate rounds
    // rather than stacking them next to each other.
    fieldRepeat: 2,
    slug: "big-pussy",
    title: "Big Pussy",
    eyebrow: "Grey leopard · cropped · unisex",
    description:
      "Grey snow-leopard, washed and faded. Cropped and close through the body, not oversized. Slogan drawn by hand, large across the chest.",
    /* The only piece here that is NOT oversized, which is worth saying out
       loud because everything around it is. Sam has one in hand: his partner
       takes a medium in everything and the medium is a little tight. The
       measurements agree — 58-66cm long against 71-79 on the Staple — so this
       is a short, close cut and the old "boxy and oversized, your normal
       size" was going to sell people a shirt that did not fit. */
    fit: "Fitted and cropped, not oversized like the tees. It runs close, so take the next size up if you are between sizes or want any room.",
    // €40 rather than the €45 Shopify carried. At a cost of €14.69 that was
    // 3.06x — the steepest markup in the shop — where the house standard is
    // 2.72x, which lands almost exactly on €40.
    price: 40,
    cost: 14.93,
    /* 177 leads: it is the only shot that shows the cut honestly — cropped,
       close through the body, midriff visible — which is exactly what the
       corrected fit note now promises. The old hero read as a normal boxy
       tee, which is what let the page describe it as oversized for a month. */
    images: [
      "/img/177-bigpussy-launderette.png",
      "/img/165-bigpussy-night.jpg",
      "/img/166-bigpussy-cat.jpg",
      "/img/190-bigpussy-knot-corridor.png",
      "/img/192-bigpussy-back.png",
    ],
    notInField: ["/img/192-bigpussy-back.png"],
    sizes: FIVE,
    shopifyProductId: "15972229841227",
    shopifyVariantIds: {
      S: "58349114097995",
      M: "58349114130763",
      L: "58349114163531",
      XL: "58349114196299",
      "2XL": "58349114229067",
    },
  },
  {
    // Replaces the Cami, which Sam pulled for quality. Black only for now:
    // Shopify also carries a white colourway, but there are no photographs of
    // it and a listing with no picture of what you are buying is worse than no
    // listing. The white variant ids are in Shopify when it is shot.
    // Same as Big Pussy: two photographs is not enough to be seen in a field
    // this size.
    fieldRepeat: 2,
    slug: "crop-tank",
    title: "Crop Tank",
    eyebrow: "Black · cropped · wide strap",
    description:
      "Cropped tank in plain black cotton. Fitted through the body, wide scoop neck, broad straps. The mark across the chest, in red.",
    fit: "Fitted and cropped. Runs small, so size up if you are between.",
    // €25 rather than the €20 Shopify carried. At a cost of €8.25 that was
    // 2.42x against a house standard of 2.72x, which works out at €22.44 —
    // rounded up to €25 because every other price here is a multiple of five
    // and a lone €22 reads as a mistake rather than a decision.
    price: 25,
    cost: 8.93,
    images: [
      "/img/167-tank-alley.jpg",
      "/img/168-tank-crop.jpg",
      "/img/189-croptank-front-bathroom.png",
      "/img/207-croptank-back-bathroom.png",
      "/img/216-croptank-launderette.png",
      "/img/217-croptank-chest-detail.png",
    ],
    notInField: ["/img/207-croptank-back-bathroom.png"],
    sizes: XS_TO_L,
    shopifyProductId: "15972226695499",
    shopifyVariantIds: {
      XS: "58349099188555",
      S: "58349099221323",
      M: "58349099254091",
      L: "58349099286859",
    },
  },
  {
    slug: "bodysuit",
    title: "Bodysuit",
    eyebrow: "Mineral wash · ribbed · fitted",
    // Confirmed. Below the tees — less garment, more construction.
    price: BODYSUIT_PRICE,
    cost: 14.93,
    images: [
      "/img/130-bodysuit-onepiece-standing.jpg",
      "/img/151-bodysuit-tight-cut.jpg",
      "/img/150-bodysuit-back-turn.jpg",
      "/img/131-bodysuit-onepiece-stool.jpg",
      "/img/90-bodysuit-fullbody-flash.jpg",
      "/img/91-bodysuit-chest-crop.jpg",
      "/img/95-bodysuit-leather-jacket.jpg",
      "/img/92-bodysuit-night-diner.jpg",
      "/img/93-bodysuit-midturn.jpg",
      "/img/96-bodysuit-stairwell.jpg",
      "/img/122-bodysuit-fireescape.jpg",
      "/img/97-bodysuit-wide-negspace.jpg",
      "/img/188-bodysuit-front-flash.png",
    ],
    description:
      "Mineral-washed ribbed cotton. Fitted through the body, short sleeve, high-cut leg. Graphic drawn by hand, printed in red.",
    fit: "Fitted and stretchy. Take your normal size. Wear it with everything.",
    sizes: FIVE,
    shopifyProductId: "15944857846091",
    shopifyVariantIds: {
      S: "58218230546763",
      M: "58218230579531",
      L: "58218230612299",
      XL: "58218230645067",
      "2XL": "58218230677835",
    },
  },
];

/** Campaign and marketing imagery, used across the storefront. */
export const AP_IMAGERY = {
  group:
    "/img/226-imagery-group.png",
  printMacro:
    "/img/227-imagery-printmacro.png",
  folded:
    "/img/228-imagery-folded.png",
  motion: "/img/07-mesh-walking-blur.jpg",
  hemDetail: "/img/11-macro-rawhem-ink.jpg",
  wide: "/img/09-bats-wide-negativespace.jpg",
} as const;

export function getAnotherPunkProduct(slug: string): AnotherPunkProduct | undefined {
  return ANOTHER_PUNK_PRODUCTS.find((p) => p.slug === slug);
}

/** Master switch for whether Another Punk can take money.
 *
 * LIVE. The path is wired: stripe-webhook.ts calls createTapstitchOrder on
 * a paid checkout.session.completed, and that call is proven against the
 * live Shopify API (correct variant, size and shipping address).
 *
 * FULFILMENT IS AUTOMATIC. The webhook creates the draft and immediately
 * completes it, so Tapstitch sees the order and produces it without anyone
 * opening Shopify. Chosen deliberately: the alternative is that nothing
 * ships until a human is at a computer, and an order placed at 2am waits.
 * A wrong order can be cancelled in Tapstitch.
 *
 * The safety this replaces is now in createTapstitchOrder, which refuses to
 * place a second order for a payment it has already handled — checking both
 * drafts and completed orders, since a submitted draft stops being a draft.
 * That check is what makes automation safe: Stripe redelivers routinely, and
 * one test payment created FIVE identical drafts before it existed.
 *
 * To go back to manual, remove the submitTapstitchOrder call in
 * stripe-webhook.ts. Nothing else needs changing. */
export const TAPSTITCH_FULFILMENT_LIVE = true;

/** True when the product can actually be produced and shipped today. */
export function isFulfillable(p: AnotherPunkProduct): boolean {
  if (!TAPSTITCH_FULFILMENT_LIVE) return false;
  return p.shopifyProductId !== null && Object.keys(p.shopifyVariantIds).length > 0;
}
