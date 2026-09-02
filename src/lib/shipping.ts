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
 * ── TRUE, AFTER THREE ANSWERS THAT LOOKED LIKE THREE DIFFERENT ONES ───────
 * Tapstitch support, finally unambiguous about the lane we actually ship on:
 *
 *   "For EU orders using non-Express shipping methods to normal, non-remote
 *    addresses, the shipment may generally be handled under DDP, meaning
 *    duties and taxes are intended to be covered. However, we can't guarantee
 *    that there will be nothing to pay upon delivery, since customs and
 *    carriers make the final assessment."
 *
 * Their earlier message listed the DOCUMENTED coverage (US) alongside the
 * EXCEPTIONS (International Express, remote addresses) and read as though the
 * EU were excluded. It was not saying that. Everything we ship is Special
 * Line, to ordinary city addresses, in the EU — squarely inside DDP.
 *
 * THE EXCEPTIONS ARE REAL AND NARROW: International Express is DDU whatever
 * else is true, and remote addresses are DDU across every service. If express
 * is ever offered, IT MUST NOT INHERIT THIS CLAIM — sell it on speed alone.
 *
 * ── THE SERVICE IS CONFIRMED: SPECIAL LINE ───────────────────────────────
 * Checked with Sam. Orders default to Special Line — non-Express, which is
 * precisely the lane support described as generally DDP. So the claim below
 * rests on the right service, and the exceptions (International Express,
 * remote addresses) do not apply to how this shop actually ships.
 *
 * Sam's own parcel may have gone Express, which is why it is cited nowhere as
 * evidence: it was a different service from the one customers get, and it
 * happened to be both faster and DDU. Interesting, irrelevant.
 *
 * THE ONE WAY THIS BREAKS is if the service is ever changed — by picking
 * Express for a rush order, or by setting a Shopify shipping option that
 * Tapstitch honours. Either would move that order to DDU while the site still
 * promises no customs fees, and the refund would land on us. If express is
 * ever offered, this is the reason it needs its own handling rather than a
 * shipping line swapped in behind the same copy.
 *
 * WHY "CANNOT GUARANTEE" IS NOT A REASON TO STAY SILENT. No seller anywhere
 * can guarantee a customs outcome; the assessment belongs to a border
 * official. Waiting for a guarantee means never saying anything, while the
 * customer is left assuming the worst about a parcel from China — which is
 * the assumption that loses the sale.
 *
 * So the page states the expected outcome and funds the exception: nothing to
 * pay, and if you are charged anyway, we refund it. That is affordable
 * precisely because DDP is intended to cover this lane, so a charge is the
 * rare case rather than the rule. A promise you pay for is worth more than a
 * promise you qualify, and it is the honest way to sell a near-certainty. */
export const DUTY_PREPAID = true;

export const DELIVERY = {
  /** Days to print and finish, before it ships. Still an estimate. */
  make: "2–5 days",
  /** Tapstitch's Special Line average. */
  transit: "about 10 days",
  /** Their 95th percentile. */
  transitMost: "15 days",
  /** Roughly what the whole thing takes, made and delivered. Rounded to weeks
   * because a customer thinks in weeks, and quoting "12 to 20 days" implies a
   * precision that a customs desk can undo in an afternoon.
   *
   * SAY THE TYPICAL, NOT THE WORST. This read "two to three weeks", which
   * quietly took the tail of every estimate and added them together — 5 days
   * of production plus the 15-day 95th percentile. Almost nobody gets that.
   * Tapstitch's average is 10 days in transit, so a fortnight is the honest
   * headline and the detail line underneath carries the spread for anyone who
   * wants it.
   *
   * The pull is toward over-quoting, because an early parcel delights and a
   * late one complains. But an inflated number on the product page costs
   * sales from people who never order at all, and that cost is invisible —
   * which is exactly why it is worth resisting.
   *
   * THIS BRIEFLY SAID "UNDER TWO WEEKS" ON BAD EVIDENCE. The reason was that
   * Sam's own parcel arrived quickly — but he then remembered it may have
   * gone International Express, which is a different and faster service from
   * the one customers get. So it confirms nothing about Special Line, and the
   * figure goes back to matching Tapstitch's published numbers: 2–5 days to
   * make plus around 10 in transit is a fortnight, not less than one.
   *
   * When a few REAL customer orders have landed, average them and put the
   * true number here. That is the only evidence that will ever be worth
   * anything. */
  total: "about two weeks",
  /** Kept for the shipping policy, where somebody who wants to know can find
   * it. Deliberately NOT on the product pages, the bag or the checkout: Sam's
   * call, and a fair one — where a thing is manufactured is ordinary
   * commercial information, not something a shopfront owes on every page, and
   * no clothing brand on the high street prints it above the till.
   *
   * It stays on /shipping rather than disappearing entirely, because the
   * difference between "not advertised" and "hidden" is whether it is there
   * for anyone who looks. */
  origin: "Made and sent by our production partner overseas.",
  /** The confident version, for when DUTY_PREPAID is true. */
  dutyPrepaid: "No customs charges, ever. Import duty and tax are already paid.",
  /** The honest version while it is unconfirmed. Warns without alarming, and
   * promises to look at it rather than to pay it — a promise that can be kept
   * whatever the answer turns out to be. */
  dutyUnknown:
    "Outside the US, import VAT may be charged on delivery at your country's rate. Most parcels arrive with nothing to pay, but we cannot promise it.",
} as const;
