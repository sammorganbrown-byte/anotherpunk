import { getAnotherPunkProduct } from "./another-punk-products";

// Promo codes, plain shared logic (no server-only APIs) so the exact same
// discount math can run on the client (cart/checkout display) and on the
// server as the authoritative check before an order is placed. Never trust a
// client-computed discount for a server-side decision — recompute from
// `items` there.
//
// No codes are live yet. Add entries to PROMO_CODES below and both the cart
// and checkout pick them up with no further wiring.

export type PromoCodeItem = {
  price: number;
  qty: number;
  slug?: string;
  productType?: string;
  sizeLabel?: string;
};

type PromoCode = {
  /** Stored uppercase; user input is normalised before lookup. */
  code: string;
  /** Percentage off the order subtotal, 0-100. Omitted by a code that prices
   * some other way — see `toCost`. */
  percentOff?: number;
  /** Prices the clothes at what they cost to make, whatever that is per
   * product, instead of taking a percentage. Shipping is unaffected unless
   * shippingPercentOff says otherwise, so the order comes to cost + postage. */
  toCost?: boolean;
  /** Percentage off the postage, 0-100. Absent means shipping is not
   * discounted, which is the right default: a code is a discount on the
   * clothes, and the courier still has to be paid. */
  shippingPercentOff?: number;
  /** Optional human label for the cart UI. */
  label?: string;
};

const PROMO_CODES: PromoCode[] = [
  // TEST CODE — remove it once the purchase path has been proved. While it
  // exists, anyone who guesses it buys at roughly nothing.
  //
  // It must leave a real charge. Stripe reports a zero-total order as
  // "no_payment_required" rather than "paid", so a 100% test would exercise a
  // different path from a real sale and prove less than it appears to. It also
  // has to clear Stripe's 50c minimum for EUR.
  //
  // 99% off the clothes and all of the postage lands a €50 tee at €1.00: a
  // genuine card charge, twice the floor, and cheap enough to run more than
  // once. See computeDiscount for why 99% is not quietly 100%.
  { code: "DRYRUN99", percentOff: 99, shippingPercentOff: 100, label: "Dry run" },

  // Friends and family. Pays what the garment actually costs to make plus the
  // real postage, so it never loses money — unlike a flat percentage, which
  // would sell an €18.36 tee and an €11.93 crop at the same discount and put
  // one of them underwater. Shipping is charged in full, deliberately: the
  // courier is not doing anyone a favour.
  { code: "BIGPUSSY69", toCost: true, label: "Friends" },
];

/** True when the code prices at cost rather than by percentage.
 *
 * Checkout needs to know, because a bundle's price has its postage folded in
 * and a cost-price order has no margin to absorb that. A friends order must
 * pay the real postage or the code stops being "never loses money", which is
 * the entire reason it prices at cost instead of by percentage. */
export function isCostPriceCode(input: string | null | undefined): boolean {
  if (!input) return false;
  return Boolean(findPromoCode(input)?.toCost);
}

export function normalizePromoCode(input: string): string {
  return input.trim().toUpperCase();
}

export function findPromoCode(input: string): PromoCode | null {
  const code = normalizePromoCode(input);
  if (!code) return null;
  return PROMO_CODES.find((c) => c.code === code) ?? null;
}

/** @param subtotalOverride the amount the code should actually discount.
 *
 * Exists because a code must apply to what the customer is ALREADY being
 * charged, not to the list price. Without it a bundle discount and a promo
 * code both come off the full total and stack: 99% off €200 plus the €25 the
 * pack already saves is €223 of discount on a €200 order, which capped out at
 * exactly zero and made Stripe refuse the session. The friends code was worse
 * than refused — it charged €49 for four tees that cost €93 to make and post.
 */
export function computeDiscount(
  input: string | null | undefined,
  items: PromoCodeItem[],
  subtotalOverride?: number,
): number {
  if (!input) return 0;
  const promo = findPromoCode(input);
  if (!promo) return 0;

  const subtotal = subtotalOverride ?? items.reduce((sum, i) => sum + i.price * i.qty, 0);

  if (promo.toCost) {
    // Down to what the garments cost, not down by a percentage. Rounded DOWN
    // so the rounding can only ever leave the order slightly above cost — the
    // one direction that cannot end up selling at a loss. A line whose cost
    // is unknown keeps its full price rather than being given away.
    const costTotal = items.reduce((sum, i) => {
      const cost = getAnotherPunkProduct(i.slug ?? "")?.cost;
      return sum + (typeof cost === "number" ? cost : i.price) * i.qty;
    }, 0);
    return Math.max(0, Math.floor(subtotal - costTotal));
  }

  return roundDiscount(subtotal, promo.percentOff ?? 0);
}

/** Shipping taken off by a code, 0 unless the code says otherwise. */
export function computeShippingDiscount(
  input: string | null | undefined,
  shipping: number,
): number {
  if (!input || shipping <= 0) return 0;
  const promo = findPromoCode(input);
  if (!promo?.shippingPercentOff) return 0;
  return roundDiscount(shipping, promo.shippingPercentOff);
}

/** Whole currency units, never more than the amount itself.
 *
 * Rounds DOWN, which matters more than it looks. Rounding to nearest turned
 * "99% off" into 100% off for every price in the range — 99% of €50 is €49.50,
 * which rounds up to the full €50 — so the test code was zeroing the goods and
 * a genuine 99% code could silently become a giveaway. Only a code that
 * actually says 100% can take the whole amount. */
function roundDiscount(amount: number, percentOff: number): number {
  if (percentOff >= 100) return amount;
  return Math.min(amount, Math.floor((amount * percentOff) / 100));
}
