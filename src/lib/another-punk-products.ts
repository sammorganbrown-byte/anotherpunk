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

export const DEFAULT_DESCRIPTION =
  "Heavyweight cotton. Cut boxy. Raw hem. Graphic drawn by hand. Printed after you order. Not before.";
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
    eyebrow: "Washed black · raw hem",
    price: TEE_PRICE,
    cost: 18.47,
    images: [
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/746fa1fe-5055-4a02-913a-aba6e38d07de.png",
      "/img/24-bats-chest-redo.jpg",
      "/img/33-bats-night-neon.jpg",
      "/img/09-bats-wide-negativespace.jpg",
      "/img/44-bats-jump-flash.jpg",
      "/img/58-bats-chest-daylight.jpg",
      "/img/60-bats-sprint-night.jpg",
    ],
    sizes: FOUR,
    shopifyProductId: "15942009225547",
    shopifyVariantIds: {
      S: "58204637200715",
      M: "58204637233483",
      L: "58204637266251",
      XL: "58204637299019",
    },
  },
  {
    slug: "tongue-box",
    quote: "I better adjust my tongue box.",
    quoteSource: "Barbarella, 1968",
    title: "Tongue Box",
    eyebrow: "Washed black · raw hem",
    price: TEE_PRICE,
    cost: 18.47,
    // Reshot 2026-09-01. Every previous image showed the garment misspelled
    // TOUNGE; the artwork was corrected and these three are the only shots of
    // the real product. The old five are still on disk but must not be listed
    // — a customer scrolling to image four and finding a different spelling
    // is worse than a product with three photographs.
    images: [
      "/img/70-tonguebox-chest-flash.jpg",
      "/img/71-tonguebox-threequarter.jpg",
      "/img/72-tonguebox-night-neon.jpg",
    ],
    sizes: FOUR,
    shopifyProductId: "15942008799563",
    shopifyVariantIds: {
      S: "58204634153291",
      M: "58204634186059",
      L: "58204634218827",
      XL: "58204634251595",
    },
  },
  {
    slug: "the-jesus",
    quote: "Nobody fucks with the Jesus.",
    quoteSource: "The Big Lebowski, 1998",
    title: "The Jesus",
    eyebrow: "Washed black · raw hem",
    price: TEE_PRICE,
    cost: 18.47,
    images: [
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/ddc73ac6-e5d5-4e0e-8d0e-87380496611f.png",
      "/img/23-jesus-chest.jpg",
      "/img/35-jesus-night-rain.jpg",
      "/img/61-jesus-walking-corridor.jpg",
      "/img/74-jesus-kerb-night.jpg",
    ],
    sizes: FOUR,
    shopifyProductId: "15942008832331",
    shopifyVariantIds: {
      S: "58204634546507",
      M: "58204634579275",
      L: "58204634612043",
      XL: "58204634644811",
    },
  },
  {
    slug: "surrender-dorothy",
    quote: "Surrender Dorothy.",
    quoteSource: "After Hours, 1985",
    title: "Surrender Dorothy",
    eyebrow: "Washed black · raw hem",
    price: TEE_PRICE,
    cost: 18.47,
    images: [
      // The print is on the FRONT of this garment. Five shots here showed it
      // across the BACK — 26-back-full, 04-threequarter-turn,
      // 36-night-takeaway, 59-spin and 70-wide-negspace — which is a product
      // that does not exist. Each remaining image was opened and checked
      // rather than judged by filename. Files stay on disk.
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/4ca18e68-84f4-42c7-98a5-f5e547502ce2.png",
      "/img/53-dorothy-chest-crop.jpg",
    ],
    sizes: FOUR,
    shopifyProductId: "15942008963403",
    shopifyVariantIds: {
      S: "58204636053835",
      M: "58204636086603",
      L: "58204636119371",
      XL: "58204636152139",
    },
  },
  {
    slug: "saucer",
    title: "Saucer",
    eyebrow: "Washed black · raw hem",
    price: TEE_PRICE,
    cost: 18.47,
    images: [
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/e4e13de6-1f38-408d-bd58-c5588bb875d9.png",
      "/img/25-saucer-chest.jpg",
      "/img/05-saucer-profile.jpg",
      "/img/37-saucer-night-carpark.jpg",
      "/img/56-saucer-chest-raking.jpg",
      "/img/63-saucer-turn.jpg",
    ],
    sizes: FOUR,
    shopifyProductId: "15942009356619",
    shopifyVariantIds: {
      S: "58204637528395",
      M: "58204637561163",
      L: "58204637593931",
      XL: "58204637626699",
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
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/6c8c1532-1749-44ec-8f53-395ff5643b92.png",
      "/img/28-bwblack-chest.jpg",
      "/img/38-bwblack-night-busshelter.jpg",
      "/img/43-bwblack-night-wide.jpg",
      "/img/57-bwblack-chest-night.jpg",
      "/img/66-bwblack-skate-kick.jpg",
    ],
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
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/d2036219-e99b-4ceb-8597-37452d66dec3.png",
      "/img/08-bwwhite-midturn.jpg",
      "/img/39-bwwhite-night-alley.jpg",
      "/img/54-bwwhite-chest-crop.jpg",
      "/img/64-bwwhite-dance.jpg",
    ],
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
      // REAL GARMENT PHOTOS, from the Shopify product this maps to.
      //
      // The campaign mockups that were here (21-wordmark-*, 03-wordmark-*,
      // 62-wordmark-*, 77-wordmark-*) were generated from the Brand1
      // reference, which is the washed black tee with a RAW DISTRESSED HEM.
      // This product is Shopify's "Snow Washed Oversized Cotton T-Shirt" —
      // a clean-hem blank. So those shots showed a garment the customer
      // would not receive, and had to come out.
      //
      // These packshots are plainer than the rest of the range. Replace them
      // with campaign shots built from a reference element made from THIS
      // garment, not the raw-hem one.
      // 145-anotherpunk-chest-flash pulled on sight — headless torso, arms
      // dead at the sides, no attitude in it at all. File kept on disk.
      // Two night-street shots, different corners. Both were generated from
      // the raw-distressed-hem reference and both were nearly binned for it —
      // but neither actually rendered a torn hem, so both show the clean-hem
      // garment this product really is. Checked, not assumed.
      "/img/147-anotherpunk-night-shopphone.jpg",
      "/img/146-anotherpunk-night-neon.jpg",
      "/img/AP-real-front-black.jpg",
      // AP-real-back-black pulled: a blank back with nothing printed on it.
      // It shows the customer no more than an empty tee would. File kept.
    ],
    // The flat packshot earns its place on the product page and nowhere else.
    notInField: ["/img/AP-real-front-black.jpg"],
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
    // Not in the field — every image here is either a flat packshot or reads
    // at a glance as a blank white tee, and the field is a campaign of
    // photographs that carry a graphic. Sam asked for it to stay out, and it
    // would have looked like an empty frame in there anyway.
    slug: "staple",
    title: "Staple",
    eyebrow: "Plain white · sleeve print",
    description:
      "400gsm heavyweight cotton \u2014 11.8oz, and it hangs like it. Cut boxy and oversized, ribbed crew collar. Blank front, blank back, one small mark on the sleeve. Because a wardrobe full of loud shirts still needs a staple.",
    fit: "Boxy and oversized. Your normal size.",
    price: 35,
    cost: 16.93,
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
    images: ["/img/163-plainwhite-night-street.jpg", "/img/164-plainwhite-sleeve.jpg"],
    notInField: ["/img/163-plainwhite-night-street.jpg", "/img/164-plainwhite-sleeve.jpg"],
    sizes: FIVE,
    shopifyProductId: "15971630580043",
    shopifyVariantIds: {
      S: "58347515609419",
      M: "58347515642187",
      L: "58347515674955",
      XL: "58347515707723",
      "2XL": "58347515740491",
    },
  },
  {
    slug: "mesh",
    description:
      "Open-weave net. Cut boxy. Sheer on purpose. Graphic drawn by hand, printed straight onto the mesh. Wear it over something. Or don't.",
    fit: "Boxy and loose. Your normal size.",
    title: "Mesh",
    eyebrow: "Open-weave net · boxy",
    price: MESH_PRICE,
    cost: 17.47,
    images: [
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/47da1769-eb20-4e33-9204-60503c824ef5.png",
      "/img/07-mesh-walking-blur.jpg",
      "/img/27-mesh-chest.jpg",
    ],
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
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/7d1de5e3-2285-4b61-8580-1acba6248e3f.png",
      "/img/06-leopard-threequarter-night.jpg",
      "/img/41-leopard-night-launderette.jpg",
      "/img/31-leopard-nightstreet.jpg",
      "/img/75-leopard-night-busstop.jpg",
      "/img/76-leopard-midturn.jpg",
    ],
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
    slug: "big-pussy",
    title: "Big Pussy",
    eyebrow: "Grey leopard · unisex boxy",
    description:
      "Grey snow-leopard print, washed and faded, on a boxy oversized cut with dropped shoulders. Slogan drawn by hand, printed big and red across the chest. Unisex.",
    fit: "Boxy and oversized. Your normal size.",
    // €40 rather than the €45 Shopify carried. At a cost of €14.69 that was
    // 3.06x — the steepest markup in the shop — where the house standard is
    // 2.72x, which lands almost exactly on €40.
    price: 40,
    cost: 14.93,
    images: ["/img/165-bigpussy-night.jpg", "/img/166-bigpussy-cat.jpg"],
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
    slug: "crop-tank",
    title: "Crop Tank",
    eyebrow: "Black · cropped · wide strap",
    description:
      "Cropped tank in plain black cotton. Fitted through the body, wide scoop neck, broad straps rather than spaghetti. The mark across the chest, drawn by hand and printed in red.",
    fit: "Fitted and cropped. Runs small — size up if you are between.",
    // €25 rather than the €20 Shopify carried. At a cost of €8.25 that was
    // 2.42x against a house standard of 2.72x, which works out at €22.44 —
    // rounded up to €25 because every other price here is a multiple of five
    // and a lone €22 reads as a mistake rather than a decision.
    price: 25,
    cost: 8.93,
    images: ["/img/167-tank-alley.jpg", "/img/168-tank-crop.jpg"],
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
      // HERO is the one-piece shot on purpose. Every shot with it tucked into
      // trousers reads as an ordinary fitted tee in the shop grid, which is
      // the one thing a bodysuit tile cannot do.
      // The shots that actually read as a bodysuit lead. Most of the rest show
      // it worn under trousers, where it looks like a fitted tee — accurate,
      // but it does not tell a customer what they are buying.
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
    "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/b79c334c-0fda-4a4b-88c8-be3ab40ea24e.png",
  printMacro:
    "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/fc6ac488-ea86-41b1-99ec-79dc0eec4f63.png",
  folded:
    "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/c8282fe8-bb57-4715-97e5-1396e2a7e8d5.png",
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
