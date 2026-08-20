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
  /** Worn model shot, used as the product tile and product-page hero. */
  image: string;
  /** Product-page body copy. Falls back to DEFAULT_DESCRIPTION, which
   * describes the heavyweight boxy raw-hem tee most of the range uses —
   * override it for anything cut differently (crop, mesh, oversized). */
  description?: string;
  /** Sizing note. Falls back to DEFAULT_FIT. */
  fit?: string;
  sizes: ApSize[];
  /** Backend Shopify product this maps to, null when not yet pushed. */
  shopifyProductId: string | null;
  /** size label -> Shopify variant id. Empty until the product is pushed. */
  shopifyVariantIds: Partial<Record<ApSize, string>>;
};

export const DEFAULT_DESCRIPTION =
  "Heavyweight cotton, cut boxy, hem left raw on purpose. Hand-drawn graphic, pulled in one colour. Printed after you order it — nothing sits in a box waiting.";
export const DEFAULT_FIT =
  "Runs oversized. Take your normal size for the fit shown, one down if you want it closer.";

const FOUR: ApSize[] = ["S", "M", "L", "XL"];
const SIX: ApSize[] = ["S", "M", "L", "XL", "2XL", "3XL"];

export const AP_PRICE = 60;

export const ANOTHER_PUNK_PRODUCTS: AnotherPunkProduct[] = [
  {
    slug: "bat-country",
    title: "Bat Country",
    eyebrow: "Washed black · raw hem",
    price: AP_PRICE,
    image:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/746fa1fe-5055-4a02-913a-aba6e38d07de.png",
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
    title: "Tongue Box",
    eyebrow: "Washed black · raw hem",
    price: AP_PRICE,
    image:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/b738c126-ea64-4245-8130-9b9ca15adccf.png",
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
    title: "The Jesus",
    eyebrow: "Washed black · raw hem",
    price: AP_PRICE,
    image:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/ddc73ac6-e5d5-4e0e-8d0e-87380496611f.png",
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
    title: "Surrender Dorothy",
    eyebrow: "Washed black · raw hem",
    price: AP_PRICE,
    image:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/4ca18e68-84f4-42c7-98a5-f5e547502ce2.png",
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
    image:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/e4e13de6-1f38-408d-bd58-c5588bb875d9.png",
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
      "Snow-washed heavyweight cotton, oversized through the body with a clean finished hem. Hand-drawn graphic on the chest, brand mark on the sleeve. Printed to order.",
    title: "Saucer — Oversized, Black",
    eyebrow: "Snow-washed black · sleeve hit",
    price: AP_PRICE,
    image:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/6c8c1532-1749-44ec-8f53-395ff5643b92.png",
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
      "Snow-washed heavyweight cotton in bone, oversized through the body with a clean finished hem. Hand-drawn graphic on the chest, brand mark on the sleeve. Printed to order.",
    title: "Saucer — Oversized, Bone",
    eyebrow: "Snow-washed bone · sleeve hit",
    price: AP_PRICE,
    image:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/d2036219-e99b-4ceb-8597-37452d66dec3.png",
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
    slug: "wordmark",
    description:
      "Snow-washed heavyweight cotton, oversized through the body with a clean finished hem. The wordmark, pulled large across the chest in one colour. Printed to order.",
    title: "Wordmark",
    eyebrow: "Snow-washed · oversized",
    price: AP_PRICE,
    image:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/8c8960ef-9235-410b-a992-0ce0ad2190e8.png",
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
      "Open-weave net, cut boxy and deliberately sheer. Hand-drawn graphic pulled straight onto the mesh. Wear it over something, or don't.",
    fit: "Boxy and loose. Take your normal size.",
    title: "Mesh",
    eyebrow: "Open-weave net · boxy",
    price: AP_PRICE,
    image:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/47da1769-eb20-4e33-9204-60503c824ef5.png",
    sizes: FOUR,
    // Not pushed into Tapstitch/Shopify yet.
    shopifyProductId: null,
    shopifyVariantIds: {},
  },
  {
    slug: "leopard-crop",
    description:
      "Lightweight stretch jersey in a pink leopard print, cut short and close through the body. Hand-drawn slogan pulled in red. Printed to order.",
    fit: "Fitted and cropped — this one runs true to size, not oversized like the tees.",
    title: "Leopard Crop",
    eyebrow: "Pink leopard · cropped",
    // Priced below the rest of the range on request, it's a lighter
    // cropped body rather than the heavyweight boxy tee.
    price: 40,
    image:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/7d1de5e3-2285-4b61-8580-1acba6248e3f.png",
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
];

/** Campaign and marketing imagery, used across the storefront. */
export const AP_IMAGERY = {
  group:
    "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/b79c334c-0fda-4a4b-88c8-be3ab40ea24e.png",
  printMacro:
    "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/fc6ac488-ea86-41b1-99ec-79dc0eec4f63.png",
  folded:
    "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/c8282fe8-bb57-4715-97e5-1396e2a7e8d5.png",
  printing:
    "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/ee24d75d-acf8-4da0-a6f4-6b3ee8e40005.png",
  drying:
    "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/1abcc11b-b834-4475-8881-214671275949.png",
} as const;

export function getAnotherPunkProduct(slug: string): AnotherPunkProduct | undefined {
  return ANOTHER_PUNK_PRODUCTS.find((p) => p.slug === slug);
}

/** Master switch for whether Another Punk can take money yet.
 *
 * The Tapstitch order path (tapstitch-fulfillment.server.ts) is written but
 * NOT yet wired into stripe-webhook.ts, so a completed checkout would charge
 * the customer and produce nothing. Until that's wired and proven with a
 * real end-to-end test order, the storefront shows the full range but
 * refuses to sell it. Flip to true only once a live order has been watched
 * through to Tapstitch actually producing it. */
export const TAPSTITCH_FULFILMENT_LIVE = false;

/** True when the product can actually be produced and shipped today. */
export function isFulfillable(p: AnotherPunkProduct): boolean {
  if (!TAPSTITCH_FULFILMENT_LIVE) return false;
  return p.shopifyProductId !== null && Object.keys(p.shopifyVariantIds).length > 0;
}
