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

const PROMO_CODES: PromoCode[] = [];

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
