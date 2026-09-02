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
/** Whether import duty and tax are prepaid, so nothing is owed on delivery.
 *
 * ── SETTLED, AND THE ANSWER IS NO ─────────────────────────────────────────
 * Tapstitch support, unambiguously:
 *
 *   "For DDP, the documented coverage is for U.S. shipments using Special
 *    Line, Special Line Pro, or Standard Shipping in non-remote areas.
 *    International Express is DDU, and remote addresses are DDU across
 *    shipping options. With DDU, the recipient is responsible for any
 *    applicable duties and import taxes, and unpaid charges may result in
 *    the parcel being returned or destroyed."
 *
 * DDP IS US-ONLY. Every European order — which is nearly every order this
 * shop will take — is DDU. Their marketing page saying non-US is "usually"
 * covered was simply wrong, and this site repeated it for a few hours.
 *
 * BUT "DDU" IS NOT THE SAME AS "THE CUSTOMER WILL BE CHARGED", and the copy
 * briefly said it was, which was wrong in the other direction. Asked point
 * blank whether an EU Special Line order arrives clean, support said only:
 * "We cannot guarantee that there will be nothing to pay upon delivery."
 * That is a support desk declining to promise something genuinely outside
 * its control, not a statement that a bill always comes. Sam's own parcel
 * reached Portugal with nothing to pay.
 *
 * What actually happens on a postal consolidation line like Special Line is
 * that a lot passes uncollected — which is worth knowing and worth nobody
 * relying on. So the copy says "may", because "will" and "won't" are both
 * claims we cannot make.
 *
 * The exposure when it does land: import VAT at the destination rate (23% in
 * Portugal) plus a courier clearance fee, so a €50 tee can want another
 * €17–25. An unpaid charge is worse than an annoyed customer — the parcel is
 * returned or destroyed, and we are out the garment, the postage and the
 * refund.
 *
 * THE FIX IS IOSS, NOT A CHANGE OF CARRIER. Support also said an IOSS/VAT
 * number "can be included in the shipping information", which means OURS.
 * Registered in Portugal, the number goes in Tapstitch under Account
 * Settings → My Info → Company Info and applies automatically to eligible EU
 * orders. Support will not guarantee even that — customs is theirs to assess,
 * not Tapstitch's — but it is precisely what IOSS exists to do, and it moves
 * the expected outcome for a sub-€150 order from "probably fine" to "settled
 * in advance". See TODO.md.
 * Note the VAT is owed either way — IOSS decides whether we collect it or a
 * courier ambushes the customer with it.
 *
 * FLIP THIS TO true ONCE THE IOSS NUMBER IS REGISTERED AND SUPPLIED, and
 * only for orders it covers. Above €150 IOSS does not apply at all. */
export const DUTY_PREPAID = false;

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
  /** The confident version, for when DUTY_PREPAID is true. */
  dutyPrepaid: "No customs charges, ever. Import duty and tax are already paid.",
  /** The honest version while it is unconfirmed. Warns without alarming, and
   * promises to look at it rather than to pay it — a promise that can be kept
   * whatever the answer turns out to be. */
  dutyUnknown:
    "Outside the US, import VAT may be charged on delivery at your country's rate. Most parcels arrive with nothing to pay, but we cannot promise it.",
} as const;
