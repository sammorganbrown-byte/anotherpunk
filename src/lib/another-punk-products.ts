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

export type ApSize = "S" | "M" | "L" | "XL" | "2XL" | "3XL";

export type AnotherPunkProduct = {
  slug: string;
  title: string;
  /** Short editorial kicker shown above the title. */
  eyebrow: string;
  /** EUR. Flat across the range for now, revisited once real unit costs
   * and shipping are confirmed against Tapstitch's actual invoices. */
  price: number;
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
const SIX: ApSize[] = ["S", "M", "L", "XL", "2XL", "3XL"];
const FIVE: ApSize[] = ["S", "M", "L", "XL", "2XL"];

export const AP_PRICE = 60;

export const ANOTHER_PUNK_PRODUCTS: AnotherPunkProduct[] = [
  {
    slug: "bat-country",
    quote: "We can't stop here. This is bat country.",
    quoteSource: "Fear and Loathing in Las Vegas, 1998",
    title: "Bat Country",
    eyebrow: "Washed black · raw hem",
    price: AP_PRICE,
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
    price: AP_PRICE,
    images: [
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/b738c126-ea64-4245-8130-9b9ca15adccf.png",
      "/img/51-tonguebox-chest-FIXED.jpg",
      "/img/45-tonguebox-night-petrol.jpg",
      "/img/52-tonguebox-fullbody-FIXED.jpg",
      "/img/68-tonguebox-midturn.jpg",
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
    price: AP_PRICE,
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
    price: AP_PRICE,
    images: [
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/4ca18e68-84f4-42c7-98a5-f5e547502ce2.png",
      "/img/26-dorothy-back-full.jpg",
      "/img/04-dorothy-threequarter-turn.jpg",
      "/img/36-dorothy-night-takeaway.jpg",
      "/img/53-dorothy-chest-crop.jpg",
      "/img/59-dorothy-spin.jpg",
      "/img/70-dorothy-wide-negspace.jpg",
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
    price: AP_PRICE,
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
      "Snow-washed heavyweight cotton. Oversized through the body, hem finished clean. Drawn by hand on the chest, mark on the sleeve. Made to order.",
    title: "Saucer — Oversized, Black",
    eyebrow: "Snow-washed black · sleeve hit",
    price: AP_PRICE,
    images: [
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/6c8c1532-1749-44ec-8f53-395ff5643b92.png",
      "/img/28-bwblack-chest.jpg",
      "/img/38-bwblack-night-busshelter.jpg",
      "/img/43-bwblack-night-wide.jpg",
      "/img/57-bwblack-chest-night.jpg",
      "/img/66-bwblack-skate-kick.jpg",
    ],
    sizes: SIX,
    shopifyProductId: "15942009520459",
    shopifyVariantIds: {
      S: "58204637954379",
      M: "58204637987147",
      L: "58204638019915",
      XL: "58204638052683",
      "2XL": "58204638085451",
      "3XL": "58204638118219",
    },
  },
  {
    slug: "saucer-oversized-bone",
    description:
      "Snow-washed heavyweight cotton in bone. Oversized through the body, hem finished clean. Drawn by hand on the chest, mark on the sleeve. Made to order.",
    title: "Saucer — Oversized, Bone",
    eyebrow: "Snow-washed bone · sleeve hit",
    price: AP_PRICE,
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
    shopifyProductId: "15942009520459",
    shopifyVariantIds: {
      S: "58204637757771",
      M: "58204637790539",
      L: "58204637823307",
      XL: "58204637856075",
      "2XL": "58204637888843",
      "3XL": "58204637921611",
    },
  },
  {
    slug: "another-punk",
    description:
      "Snow-washed heavyweight cotton. Oversized through the body, hem finished clean. The mark, large across the chest. Made to order.",
    title: "Another Punk",
    eyebrow: "Snow-washed · oversized",
    price: AP_PRICE,
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
      "/img/AP-real-front-black.jpg",
      "/img/AP-real-back-black.jpg",
    ],
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
    slug: "mesh",
    description:
      "Open-weave net. Cut boxy. Sheer on purpose. Graphic drawn by hand, printed straight onto the mesh. Wear it over something. Or don't.",
    fit: "Boxy and loose. Your normal size.",
    title: "Mesh",
    eyebrow: "Open-weave net · boxy",
    price: AP_PRICE,
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
      "Lightweight stretch jersey. Pink leopard. Cut short and close through the body. Slogan drawn by hand, printed in red. Made to order.",
    fit: "Fitted and cropped. This one runs true to size. Not oversized like the tees.",
    title: "Leopard Crop",
    eyebrow: "Pink leopard · cropped",
    // Priced below the rest of the range on request, it's a lighter
    // cropped body rather than the heavyweight boxy tee.
    price: 40,
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
    slug: "cami",
    title: "Cami",
    eyebrow: "Black · slim fit · thin strap",
    // Matches Leopard Crop, the other lightweight women's cut. Confirmed.
    price: 40,
    images: [
      "/img/80-cami-fullbody-flash.jpg",
      "/img/81-cami-chest-crop.jpg",
      "/img/86-cami-leather-jacket.jpg",
      "/img/82-cami-night-neon.jpg",
      "/img/83-cami-midturn.jpg",
      "/img/84-cami-profile.jpg",
      "/img/87-cami-night-carpark.jpg",
      "/img/121-cami-cafe.jpg",
      "/img/88-cami-wide-negspace.jpg",
      "/img/FLOAT-109-cami.jpg",
      "/img/89-cami-strap-detail.jpg",
    ],
    description:
      "Lightweight stretch cotton. Cut slim and close through the body. Thin straps, open back. Graphic drawn by hand, printed in red. Made to order.",
    fit: "Fitted and close. This one runs true to size. Not oversized like the tees.",
    sizes: FOUR,
    shopifyProductId: "15944344109387",
    shopifyVariantIds: {
      S: "58217310323019",
      M: "58217310355787",
      L: "58217310388555",
      XL: "58217310421323",
    },
  },
  {
    slug: "bodysuit",
    title: "Bodysuit",
    eyebrow: "Mineral wash · ribbed · fitted",
    // Confirmed. Below the tees — less garment, more construction.
    price: 50,
    images: [
      // HERO is the one-piece shot on purpose. Every shot with it tucked into
      // trousers reads as an ordinary fitted tee in the shop grid, which is
      // the one thing a bodysuit tile cannot do.
      "/img/130-bodysuit-onepiece-standing.jpg",
      "/img/131-bodysuit-onepiece-stool.jpg",
      "/img/90-bodysuit-fullbody-flash.jpg",
      "/img/91-bodysuit-chest-crop.jpg",
      "/img/95-bodysuit-leather-jacket.jpg",
      "/img/92-bodysuit-night-diner.jpg",
      "/img/93-bodysuit-midturn.jpg",
      "/img/94-bodysuit-profile.jpg",
      "/img/96-bodysuit-stairwell.jpg",
      "/img/122-bodysuit-fireescape.jpg",
      "/img/97-bodysuit-wide-negspace.jpg",
      "/img/FLOAT-110-bodysuit.jpg",
      "/img/98-bodysuit-rib-detail.jpg",
    ],
    description:
      "Mineral-washed ribbed cotton. Fitted through the body, short sleeve, high-cut leg. Graphic drawn by hand, printed in red. Made to order.",
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
 * FULFILMENT IS DELIBERATELY MANUAL. The webhook only creates a HELD DRAFT
 * order. submitTapstitchOrder — the call that completes a draft into a real
 * order and starts production — is intentionally NOT wired to anything, so
 * a bug in the payment path can never silently print and ship garments.
 *
 * That means every paid order needs a human: Shopify admin -> Orders ->
 * Drafts -> open it -> complete. Nothing is produced until you do. Drafts
 * carry the tag `another-punk` plus the Stripe reference, and the note
 * records what the customer was actually charged (the line-item price
 * cannot be overridden — see tapstitch-fulfillment.server.ts).
 *
 * Automate it by calling submitTapstitchOrder from the webhook, but only
 * once real orders have been watched through to printed garments. */
export const TAPSTITCH_FULFILMENT_LIVE = true;

/** True when the product can actually be produced and shipped today. */
export function isFulfillable(p: AnotherPunkProduct): boolean {
  if (!TAPSTITCH_FULFILMENT_LIVE) return false;
  return p.shopifyProductId !== null && Object.keys(p.shopifyVariantIds).length > 0;
}
