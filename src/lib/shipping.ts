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
// The base is set just under the worst single-item cost and the increment
// just under the worst marginal cost, so the only orders that ship at a small
// loss are one item to Ireland (30c) and two items to the Netherlands (55c) —
// both trivial against a €25+ gross margin, and both cheaper than the
// alternative of overcharging every other destination.
//
// TO CHANGE THE PRICE, change these two numbers. Nothing else needs touching.
export const SHIPPING_BASE = 9;
export const SHIPPING_PER_EXTRA_ITEM = 3;

/** Shipping in whole euros for an order of `count` garments. An empty bag
 * ships for nothing, so a cart with no lines never shows a shipping charge. */
export function computeShipping(count: number): number {
  if (count <= 0) return 0;
  return SHIPPING_BASE + SHIPPING_PER_EXTRA_ITEM * (count - 1);
}
