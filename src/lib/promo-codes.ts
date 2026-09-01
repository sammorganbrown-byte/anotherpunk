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
  /** Percentage off the order subtotal, 0-100. */
  percentOff: number;
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
];

export function normalizePromoCode(input: string): string {
  return input.trim().toUpperCase();
}

export function findPromoCode(input: string): PromoCode | null {
  const code = normalizePromoCode(input);
  if (!code) return null;
  return PROMO_CODES.find((c) => c.code === code) ?? null;
}

export function computeDiscount(input: string | null | undefined, items: PromoCodeItem[]): number {
  if (!input) return 0;
  const promo = findPromoCode(input);
  if (!promo) return 0;

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return roundDiscount(subtotal, promo.percentOff);
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
