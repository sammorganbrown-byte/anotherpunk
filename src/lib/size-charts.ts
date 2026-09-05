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
  /** Quoted on the bodysuit only, where it is the measurement that decides
   * fit. Absent everywhere else, so the column is dropped there. */
  waist?: number;
};

export type SizeChart = {
  /** What the numbers describe, in the customer's words. Defaults to
   * DEFAULT_NOTE, which carries Tapstitch's own stated tolerance — quoting it
   * is what makes the table honest rather than a promise of exactness. */
  note?: string;
  rows: SizeRow[];
};

/** Tapstitch print this above every one of their tables: "1-3 cm sizing
 * differences may occur." It is theirs, it is true, and hiding it would turn
 * a measured guide into a guarantee nobody can keep. */
export const DEFAULT_NOTE =
  "Measured flat, in centimetres \u2014 chest is edge to edge, not around. Allow 1\u20133 cm variation between garments.";

/** Which measurements to show, and what to call them. Columns with no data in
 * a given chart are dropped rather than rendered empty. */
export const SIZE_COLUMNS: { key: keyof Omit<SizeRow, "size">; label: string }[] = [
  { key: "chest", label: "Chest" },
  { key: "length", label: "Length" },
  { key: "shoulder", label: "Shoulder" },
  { key: "sleeve", label: "Sleeve" },
  { key: "waist", label: "Waist" },
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
export const SIZE_CHARTS: Record<string, SizeChart> = {
  /* Big Pussy — Tapstitch "Unisex Leopard Print Boxy T-Shirt". */
  "15972229841227": {
    rows: [
      { size: "S", length: 58, shoulder: 55, chest: 60, sleeve: 20 },
      { size: "M", length: 60, shoulder: 56.5, chest: 62, sleeve: 20.5 },
      { size: "L", length: 62, shoulder: 58, chest: 64, sleeve: 21 },
      { size: "XL", length: 64, shoulder: 59.5, chest: 66, sleeve: 21.5 },
      { size: "2XL", length: 66, shoulder: 61, chest: 68, sleeve: 22 },
    ],
  },
  /* ── THE FIVE TEES HAVE NO CHART, AND THAT IS CORRECT FOR NOW ───────────
     They moved on 5 Sep from Snow Wash Raw-Hem (RT0058, 340gsm) to Vintage
     Wash Boxy Distressed Hem (RT0077, 240gsm). The old table was keyed to
     the old Shopify ids, so it stopped applying the moment they were
     repointed — which is exactly the behaviour wanted. A different blank has
     different measurements, and carrying the old numbers across would have
     been the worst outcome: a table that looks authoritative and describes a
     shirt nobody receives.

     getSizeChart returns undefined for these now, so the product page shows
     the fit note and no table. Read the new figures off the Tapstitch page
     for RT0077 and add them here, keyed by the new ids:

       15975454835019  Bat Country
       15975453720907  Tongue Box
       15975453425995  The Jesus
       15975454376267  Surrender Dorothy
       15975453098315  Saucer

     NOTE THE SIZE RUN CHANGED TOO. The old blank was S-XL; this one goes to
     2XL, so there are five rows per table rather than four. */

  /* Westwood 69, both colourways — Tapstitch "Unisex Striped Boxy Soccer
     Jersey". */
  "15966414274891": {
    rows: [
      { size: "S", length: 63, shoulder: 55, chest: 60, sleeve: 24 },
      { size: "M", length: 65, shoulder: 57, chest: 62, sleeve: 25 },
      { size: "L", length: 67, shoulder: 59, chest: 64, sleeve: 26 },
      { size: "XL", length: 69, shoulder: 61, chest: 66, sleeve: 27 },
      { size: "2XL", length: 72, shoulder: 63, chest: 68, sleeve: 28 },
    ],
  },
  /* Bodysuit — Tapstitch "Women\u2019s Mineral Wash Crewneck Bodysuit". The
     chest and shoulder figures are much smaller than the tees because it is
     a stretch garment measured unstretched; they are Tapstitch\u2019s own
     numbers and are not to be "corrected" to look consistent with the rest. */
  "15944857846091": {
    rows: [
      { size: "S", length: 65, shoulder: 27, chest: 30, sleeve: 12.5, waist: 25.5 },
      { size: "M", length: 67, shoulder: 28.5, chest: 32, sleeve: 13, waist: 27.5 },
      { size: "L", length: 69, shoulder: 30, chest: 34, sleeve: 13.5, waist: 29.5 },
      { size: "XL", length: 71, shoulder: 31.5, chest: 36, sleeve: 14, waist: 31.5 },
      { size: "2XL", length: 73, shoulder: 33, chest: 38, sleeve: 14.5, waist: 33.5 },
    ],
  },
  /* Staple, both colourways — Tapstitch "Unisex Oversized T-Shirt", item
     RT0086, 300gsm.

     NOT the "Boxy Oversized T-Shirt" table. That is item RT0080 at 400gsm —
     the blank the Staple REPLACED, whose Shopify product (15971630580043) is
     archived. Its numbers are shorter and wider (65-73cm long against 71-79)
     and reading like the obvious match is exactly what makes it dangerous:
     both are unisex oversized tees at S-2XL, and only the Shopify product
     titles and fabric weights tell them apart. Confirmed against Shopify on
     4 Sep before this was written. */
  "15972281844043": {
    rows: [
      { size: "S", length: 71, shoulder: 50, chest: 53, sleeve: 22 },
      { size: "M", length: 73, shoulder: 53, chest: 56, sleeve: 22.5 },
      { size: "L", length: 75, shoulder: 56, chest: 59, sleeve: 23 },
      { size: "XL", length: 77, shoulder: 59, chest: 62, sleeve: 23.5 },
      { size: "2XL", length: 79, shoulder: 62, chest: 65, sleeve: 24 },
    ],
  },
  /* Mesh — Tapstitch "See-through Boxy Net T-Shirt". */
  "15943646740811": {
    rows: [
      { size: "S", length: 63, shoulder: 50, chest: 60, sleeve: 22 },
      { size: "M", length: 65, shoulder: 52, chest: 62, sleeve: 23 },
      { size: "L", length: 67, shoulder: 54, chest: 64, sleeve: 24 },
      { size: "XL", length: 69, shoulder: 56, chest: 66, sleeve: 25 },
    ],
  },
  /* Another Punk AND Saucer Oversized — Tapstitch "Snow Washed Oversized
     Cotton T-Shirt". One table for two entries, which is an INFERENCE rather
     than something Sam stated: both carry that exact blank name in Shopify,
     both are the only S-3XL pieces in the range, and only one S-3XL table
     exists. They are separate Tapstitch products and cost differently
     (12.47 vs 15.07) because the wash and print differ — but the pattern,
     and therefore the measurements, are the same. If that ever turns out to
     be wrong, it is these two entries that are wrong. */
  "15942019613003": {
    rows: [
      { size: "S", length: 70, shoulder: 53, chest: 56, sleeve: 20.8 },
      { size: "M", length: 72, shoulder: 55, chest: 58, sleeve: 21.5 },
      { size: "L", length: 74, shoulder: 57, chest: 60, sleeve: 22.2 },
      { size: "XL", length: 76, shoulder: 59, chest: 62, sleeve: 22.9 },
      { size: "2XL", length: 78, shoulder: 61, chest: 64, sleeve: 23.6 },
      { size: "3XL", length: 79, shoulder: 63, chest: 67, sleeve: 23.6 },
    ],
  },
  "15972246094155": {
    rows: [
      { size: "S", length: 70, shoulder: 53, chest: 56, sleeve: 20.8 },
      { size: "M", length: 72, shoulder: 55, chest: 58, sleeve: 21.5 },
      { size: "L", length: 74, shoulder: 57, chest: 60, sleeve: 22.2 },
      { size: "XL", length: 76, shoulder: 59, chest: 62, sleeve: 22.9 },
      { size: "2XL", length: 78, shoulder: 61, chest: 64, sleeve: 23.6 },
      { size: "3XL", length: 79, shoulder: 63, chest: 67, sleeve: 23.6 },
    ],
  },
  /* Leopard Crop — Tapstitch "Women\u2019s Leopard Print Crop T-Shirt". */
  "15942025118027": {
    rows: [
      { size: "S", length: 43.5, shoulder: 29.8, chest: 32, sleeve: 10 },
      { size: "M", length: 45, shoulder: 31, chest: 34, sleeve: 10.5 },
      { size: "L", length: 46.5, shoulder: 32.2, chest: 36, sleeve: 11 },
      { size: "XL", length: 48, shoulder: 33.4, chest: 38, sleeve: 11.5 },
      { size: "2XL", length: 49.5, shoulder: 34.6, chest: 40, sleeve: 12 },
    ],
  },
  /* Crop Tank — Tapstitch "Women\u2019s Cropped Tank Top". Length and chest
     only; that table quotes no shoulder or sleeve, and a strappy crop has
     neither, so the columns drop out rather than render as dashes. */
  "15972226695499": {
    rows: [
      { size: "XS", length: 37, chest: 35 },
      { size: "S", length: 38, chest: 37 },
      { size: "M", length: 39, chest: 39 },
      { size: "L", length: 40.5, chest: 42 },
    ],
  },
};

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
