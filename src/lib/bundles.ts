import { getAnotherPunkProduct } from "./another-punk-products";
import { computeShipping } from "./shipping";

/** Package deals.
 *
 * ── THE WHOLE IDEA ────────────────────────────────────────────────────────
 * A bundle is not a product. Nothing here is a new SKU, nothing is added to
 * Shopify, and Tapstitch never learns that a bundle exists. Buying one puts
 * the ORDINARY garment lines in the basket — two jerseys, or four tees, each
 * with its own size and its own Shopify variant — and the bundle is nothing
 * more than a rule that says what those lines cost together.
 *
 * That is deliberate. The fulfilment path is the one part of this shop that
 * is proven end to end: payment, webhook, Shopify draft, Tapstitch. A bundle
 * modelled as its own product would have needed a new variant, a new mapping,
 * and a new way for that path to go wrong. Modelled as a price rule it needs
 * none of them, and the printer receives exactly what it already knows how to
 * print.
 *
 * ── WHERE THE PRICE IS DECIDED ────────────────────────────────────────────
 * On the server, in checkout.functions.ts, recomputed from the catalogue.
 * The client sends a `bundleId` on each line saying which bundle instance it
 * belongs to; the server groups by that id and checks the group is genuinely
 * a complete, valid bundle before honouring the price.
 *
 * If a group does NOT validate, it is ignored and every line is charged at
 * full price. That is the safe direction: a tampered basket pays more, never
 * less. The client's own arithmetic is display only, as everywhere else here.
 * ──────────────────────────────────────────────────────────────────────────
 */

export type Bundle = {
  slug: string;
  title: string;
  eyebrow: string;
  /** The whole bundle, shipping included. See PRICING below. */
  price: number;
  description: string;
  /** Slugs a member may be chosen from. */
  choices: string[];
  /** How many garments make up the bundle. Counted by quantity, not by
   * basket line — two of the same jersey in the same size collapse into one
   * line of qty 2, and that is still two garments. */
  count: number;
  /** Whether every member must be a different product. */
  distinct: boolean;
  /** The shot that sells it. */
  image: string;
  /** Shown on the bundle page under the heading. */
  pitch: string;
};

/** ── PRICING ───────────────────────────────────────────────────────────────
 *
 * Both are priced to be an obvious deal rather than a token one, and both
 * include shipping. Checked against the real numbers rather than picked:
 *
 *   69 — HIS AND HERS      €69
 *     Separately: 2 x €40 + €11 shipping = €91. Saves €22.
 *     Garments €29.36, shipping ~€9.19, card fee ~€2.30 → net ~€28 (41%).
 *     Priced at 69 because the jersey is called Westwood 69 and a bundle
 *     that costs its own name is worth more in the telling than the few
 *     euros it gives up. This is the one price here chosen by ear.
 *
 *   RAW HEM FOUR           €175
 *     Separately: 4 x €50 + €15 shipping = €215. Saves €40, near a fifth.
 *     Garments €73.44, shipping ~€12.90, card fee ~€5.38 → net ~€83 (48%),
 *     which is in line with the margin on a single piece.
 *
 * Shipping costs are the average across the eighteen countries the shop
 * ships to, from shipping-rates.csv. The Netherlands is the worst case at
 * roughly €21 for four; the pack still clears well over half in profit
 * there, so no country is sold at a loss.
 * ────────────────────────────────────────────────────────────────────────── */

/** The five heavyweight raw-hem tees. Sam described this pack as "the 4 raw
 * hem shirts" — there are five, so it is sold as any four of the five, which
 * is the better product anyway: choosing is part of the appeal, and it does
 * not strand whichever design would have been left out. */
const RAW_HEM = ["bat-country", "tongue-box", "the-jesus", "surrender-dorothy", "saucer"];

export const BUNDLES: Bundle[] = [
  {
    slug: "his-and-hers",
    title: "69 — His and Hers",
    eyebrow: "Two jerseys · any colours",
    price: 69,
    image: "/img/152-jersey-pair-night.jpg",
    description:
      "Two Westwood 69 football jerseys, pink or black or one of each, sized separately. Shipping included.",
    pitch: "Two jerseys. Sixty-nine euros. The number was always going to decide the price.",
    choices: ["westwood-69-pink", "westwood-69-black"],
    count: 2,
    // Two of the same colour is a fair thing to want, so this is not forced
    // to be one of each.
    distinct: false,
  },
  {
    slug: "raw-hem-four",
    title: "Raw Hem Four",
    eyebrow: "Any four tees",
    price: 175,
    image: "/img/11-macro-rawhem-ink.jpg",
    description:
      "Any four of the five heavyweight raw-hem tees, each in its own size. Shipping included.",
    pitch: "Four of the five. Pick the four. Forty euros off and nothing to pay for postage.",
    choices: RAW_HEM,
    count: 4,
    distinct: true,
  },
];

export function getBundle(slug: string): Bundle | undefined {
  return BUNDLES.find((b) => b.slug === slug);
}

/** What the members would cost bought one at a time, from the catalogue. */
export function bundleFullPrice(bundle: Bundle, slugs: string[]): number {
  return slugs.reduce((sum, s) => sum + (getAnotherPunkProduct(s)?.price ?? 0), 0);
}

/** The saving as shown on the page, INCLUDING the shipping it absorbs.
 *
 * Quoted against buying the same garments in one order rather than in
 * separate ones, which is the honest comparison — someone buying four tees
 * at once already pays €15 rather than €36 to ship them, and claiming the
 * bigger number as a saving would be a lie by arithmetic. */
export function bundleSaving(bundle: Bundle, slugs: string[]): number {
  return bundleFullPrice(bundle, slugs) + computeShipping(bundle.count) - bundle.price;
}

/** A line as the server sees it, once resolved against the catalogue. */
export type BundleLine = { slug: string; qty: number; bundleId?: string; bundleSlug?: string };

export type BundleGroup = {
  bundle: Bundle;
  /** Total price the members would have cost individually. */
  full: number;
  /** What the group is charged instead. */
  price: number;
  /** Garments in the group — always `bundle.count` once validated. */
  count: number;
};

/** Groups lines by bundle instance and keeps only the genuinely valid ones.
 *
 * Every rule is checked here rather than trusted from the client: that the
 * bundle exists, that the members are all drawn from its allowed products,
 * that there are exactly the right number of garments, and that they are
 * distinct where the bundle demands it. Anything that fails is dropped, and
 * dropping it means those lines are simply charged at their normal price.
 */
export function collectBundles(lines: BundleLine[]): BundleGroup[] {
  const groups = new Map<string, BundleLine[]>();
  for (const line of lines) {
    if (!line.bundleId) continue;
    const existing = groups.get(line.bundleId);
    if (existing) existing.push(line);
    else groups.set(line.bundleId, [line]);
  }

  const out: BundleGroup[] = [];
  for (const members of groups.values()) {
    const bundle = getBundle(members[0].bundleSlug ?? "");
    if (!bundle) continue;

    // Mixing two different bundles under one id is not a thing that can
    // happen honestly, so it is not indulged.
    if (members.some((m) => m.bundleSlug !== bundle.slug)) continue;

    // Counted by quantity: one line of qty 2 is two garments.
    const count = members.reduce((n, m) => n + m.qty, 0);
    if (count !== bundle.count) continue;

    if (members.some((m) => !bundle.choices.includes(m.slug))) continue;

    if (bundle.distinct) {
      const slugs = members.map((m) => m.slug);
      // Distinct means distinct products, so a line of qty 2 fails here too
      // — which is right, and is why quantity is checked and not just the
      // number of lines.
      if (new Set(slugs).size !== slugs.length) continue;
      if (members.some((m) => m.qty !== 1)) continue;
    }

    const slugs = members.flatMap((m) => Array.from({ length: m.qty }, () => m.slug));
    out.push({
      bundle,
      full: bundleFullPrice(bundle, slugs),
      price: bundle.price,
      count,
    });
  }
  return out;
}

/** How much comes off the garment subtotal because of bundles. */
export function bundleDiscount(lines: BundleLine[]): number {
  return collectBundles(lines).reduce((sum, g) => sum + Math.max(0, g.full - g.price), 0);
}

/** Shipping a bundle has already paid for, to be taken off the order's total.
 *
 * Not simply "shipping is free when a bundle is present". An order of one
 * bundle plus one loose tee travels in the SAME parcel, so the honest charge
 * for that extra tee is its marginal €2, not a second €9 and not nothing.
 * Crediting what the bundle's own garments would have cost to ship produces
 * exactly that, and falls out to zero for a bundle bought on its own.
 */
export function bundleShippingCredit(lines: BundleLine[]): number {
  return collectBundles(lines).reduce((sum, g) => sum + computeShipping(g.count), 0);
}

/** Shipping actually charged on an order, once bundles have paid their part. */
export function shippingAfterBundles(lines: BundleLine[]): number {
  const total = lines.reduce((n, l) => n + l.qty, 0);
  return Math.max(0, computeShipping(total) - bundleShippingCredit(lines));
}
