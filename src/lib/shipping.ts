// Shipping, charged as its own line rather than buried in the garment price.
//
// Shared (no server-only APIs) so the cart, the checkout summary and the
// Stripe session all quote the same number. The server recomputes it before
// charging; the client's figure is display only.
//
// WHY THIS SHAPE. Tapstitch bills per shipment, not per garment. Across the
// countries we sell to, the first item costs €3.44 (GB) to €9.30 (IE), but a
// second item only adds €1.22 to €4.29 — an average of €1.86, about a quarter
// of the first. A flat per-item charge would therefore punish anyone buying
// two, so this is a base for the order plus a small increment per extra item.
//
// The base covers the worst single-item route bar one: 17 of 18 destinations
// pay for themselves, Ireland alone is 30c short. The €2 increment is thinner
// than the base — it is set below the worst marginal cost rather than above
// it — so a two-item order to the Netherlands runs €1.55 down and one to
// Ireland 28c down. Both are trivial against a €25 profit, and a bigger
// increment would tax every two-item order to make back a loss that only
// happens on one route.
//
// TO CHANGE THE PRICE, change these two numbers. Nothing else needs touching.
export const SHIPPING_BASE = 9;
export const SHIPPING_PER_EXTRA_ITEM = 2;

/** ── THE €2 IS THE LEAST VERIFIED NUMBER IN THIS SHOP ──────────────────────
 *
 * shipping-rates.csv quotes Tapstitch for ONE item and TWO items. Everything
 * beyond two repeats the marginal cost of the second, which is a guess with
 * the right shape rather than a figure anyone has confirmed.
 *
 * Tapstitch's own FAQ says why that guess is shakier than it looks:
 * "Shipping costs for multi-product orders may vary depending on the product
 * mix, categories, and total shipment weight." Weight, not item count. Our
 * per-item charge is flat, so a heavy order and a light one of the same
 * length are charged the same and cost us different amounts.
 *
 * THE EXPOSURE IS THE RAW HEM FOUR: four heavyweight tees, the heaviest
 * bundle we sell, priced on a shipping cost extrapolated from a two-item
 * quote. The margin has room — even at triple the assumed postage it stays
 * profitable — so this is not urgent, but it is unmeasured.
 *
 * IT IS ALSO EASY TO SETTLE. Tapstitch say: "add the items to your cart and
 * check the live shipping cost at checkout." Put four raw-hem tees in a
 * Tapstitch cart to Portugal, and again to the Netherlands (our worst zone),
 * and read the real numbers. Then either confirm the €2 or correct it here.
 * ────────────────────────────────────────────────────────────────────────── */

/** Shipping in whole euros for an order of `count` garments. An empty bag
 * ships for nothing, so a cart with no lines never shows a shipping charge. */
export function computeShipping(count: number): number {
  if (count <= 0) return 0;
  return SHIPPING_BASE + SHIPPING_PER_EXTRA_ITEM * (count - 1);
}

/** Where orders can be sent.
 *
 * One list, used both to build the country picker at checkout and to set
 * Stripe's allowed countries, so the two cannot drift apart. Codes are ISO
 * 3166-1 alpha-2, which is what Stripe and Tapstitch both expect — the
 * checkout used to take the country as free text, so it was possible to type
 * a city into it and be handed a validation error instead of a payment page.
 */
export const SHIPPING_COUNTRIES: { code: string; name: string }[] = [
  { code: "PT", name: "Portugal" },
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "ES", name: "Spain" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" },
  { code: "SE", name: "Sweden" },
  { code: "DK", name: "Denmark" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czechia" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
];

/** ── WHAT THE CUSTOMER IS TOLD ABOUT DELIVERY ──────────────────────────────
 *
 * One source for the delivery facts, because they now appear on the product
 * page, the bundle page, the bag, the checkout and the shipping policy. Five
 * places is exactly how a site ends up quoting two different delivery times,
 * and the one a customer remembers is always the shorter one.
 *
 * All of it is Tapstitch's own published figures for Special Line, the
 * service these orders travel on — 10 days average, 95% within 15 — with
 * production on top. Their times exclude production and they say so.
 *
 * WHY THE ORIGIN IS STATED OUT LOUD. It would be quieter not to mention
 * China. But someone waiting a fortnight works it out anyway, and finding out
 * afterwards feels like something was hidden — whereas saying it up front,
 * next to the fact that the customs is already paid, turns the slow part into
 * the honest part of a good deal. The wait is the price of nothing being made
 * before it is wanted, and that is worth saying rather than hiding.
 */
export const DELIVERY = {
  /** Days to print and finish, before it ships. Still an estimate. */
  make: "2–5 days",
  /** Tapstitch's Special Line average. */
  transit: "about 10 days",
  /** Their 95th percentile. */
  transitMost: "15 days",
  /** Roughly what the whole thing takes, made and delivered. Rounded to
   * weeks because a customer thinks in weeks, and quoting "12 to 20 days"
   * implies a precision that a customs desk can undo in an afternoon. */
  total: "two to three weeks",
  origin: "Made and sent by our producer in China.",
  /** The good news, and the reason the wait is worth stating plainly next to
   * it. Tapstitch ship DDP; we refund the rare exception. */
  duty: "No customs charges, ever. Import duty and tax are already paid.",
} as const;
