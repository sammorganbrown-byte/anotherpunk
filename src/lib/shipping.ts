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
