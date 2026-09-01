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
  /** Optional human label for the cart UI. */
  label?: string;
};

const PROMO_CODES: PromoCode[] = [
  // TEST CODE — remove it once the purchase path has been proved. While it
  // exists, anyone who guesses it buys at 1%.
  //
  // 99% leaves a real charge, which matters: Stripe reports a zero-total
  // order as "no_payment_required" rather than "paid", so a 100% test would
  // exercise a different path from a real sale. A small live charge proves
  // the actual one.
  //
  // The 50c EUR floor used to be a trap here — 99% off a €40 item left €0.40
  // and Stripe refused the session. Shipping is now charged as its own
  // undiscounted line, so every order clears the floor by €9 or more and any
  // item can be used for the test. Expect the dry run to cost about €9.45.
  { code: "DRYRUN99", percentOff: 99, label: "Dry run" },
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
  const raw = (subtotal * promo.percentOff) / 100;
  // Whole currency units, never more than the order itself.
  return Math.min(subtotal, Math.round(raw));
}
