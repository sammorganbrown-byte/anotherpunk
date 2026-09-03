/** Garment measurements, for the size chart on each product page.
 *
 * ── KEYED BY SHOPIFY PRODUCT ID, DELIBERATELY ─────────────────────────────
 * Not by slug. Several pieces share one blank — Westwood 69 pink and black
 * are one Shopify product, so are the two Saucer Oversized colourways and
 * both Staples — and a blank is exactly the thing that has measurements. Key
 * on the id and a shared blank cannot end up with two disagreeing tables, or
 * one colourway silently missing its chart. It also means adding a product in
 * an existing blank needs no work here at all.
 *
 * ── NOTHING IS INVENTED, AND NOTHING MAY BE ───────────────────────────────
 * Every number below has to be copied from that product's own page on
 * Tapstitch. Do not estimate them, do not scale them from another blank, and
 * do not reason them out from a size letter. A made-up chart is worse than no
 * chart: it is the thing a customer measures against before buying, so a
 * wrong number produces a garment that does not fit, a return we pay postage
 * on, and — because the site stated a measurement — goods "not as described"
 * under the two-year rule on /returns. The honest failure is an absent table.
 * The dishonest one is a plausible table.
 *
 * A blank with no entry here renders no table, just the fit note. That is
 * safe and is the current state of every product: no measurements have been
 * read off Tapstitch yet.
 *
 * ── HOW TO FILL IT IN ─────────────────────────────────────────────────────
 * Open the product on Tapstitch, find its size table, and copy the rows in.
 * `cm` is required, `inch` is optional — leave it out rather than converting
 * by hand, since the component derives inches when they are absent. Sizes may
 * be a subset: list only the ones that product actually sells.
 */
import type { ApSize } from "./another-punk-products";

/** One row of a size table. Add fields as the source tables provide them —
 * anything absent is simply not rendered, so a partial table is fine. */
export type SizeRow = {
  size: ApSize;
  /** Flat across the chest, doubled — the way garment tables quote it. */
  chest?: number;
  /** High point of shoulder to hem. */
  length?: number;
  shoulder?: number;
  sleeve?: number;
};

export type SizeChart = {
  /** What the numbers describe, in the customer's words. */
  note?: string;
  rows: SizeRow[];
};

/** Which measurements to show, and what to call them. Columns with no data in
 * a given chart are dropped rather than rendered empty. */
export const SIZE_COLUMNS: { key: keyof Omit<SizeRow, "size">; label: string }[] = [
  { key: "chest", label: "Chest" },
  { key: "length", label: "Length" },
  { key: "shoulder", label: "Shoulder" },
  { key: "sleeve", label: "Sleeve" },
];

/** shopifyProductId -> chart. Empty until the tables are read off Tapstitch.
 *
 * Add entries like this, with the real numbers:
 *
 *   "15942009225547": {
 *     note: "Measured flat, in centimetres. Allow a little variation.",
 *     rows: [
 *       { size: "S", chest: 54, length: 70 },
 *       { size: "M", chest: 57, length: 72 },
 *     ],
 *   },
 */
export const SIZE_CHARTS: Record<string, SizeChart> = {};

export function getSizeChart(shopifyProductId: string | null): SizeChart | undefined {
  if (!shopifyProductId) return undefined;
  const chart = SIZE_CHARTS[shopifyProductId];
  return chart && chart.rows.length ? chart : undefined;
}

/** Centimetres to inches, to one decimal. Derived rather than stored so the
 * two units cannot drift apart, and so filling the table in means copying one
 * set of numbers rather than two. */
export const toInches = (cm: number): string =>
  (Math.round((cm / 2.54) * 10) / 10).toFixed(1);
