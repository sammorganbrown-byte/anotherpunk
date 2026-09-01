/** How a cart is packed into — and unpacked from — Stripe session metadata.
 *
 * Stripe caps each metadata VALUE at 500 characters, and the obvious encoding
 * (an array of {slug, sizeLabel, qty} objects) spends most of that budget on
 * repeating the three key names. It fits nine distinct products. The shop
 * sells fourteen, so a customer buying most of the range would have been told
 * their order could not be created, with nothing on the page explaining why.
 *
 * The compact form drops the keys and writes one line per item:
 *
 *     westwood-69-pink:M:1|tongue-box:2XL:3
 *
 * That fits the entire catalogue at every size with room to spare. Slugs are
 * [a-z0-9-] and sizes are short and alphanumeric, so neither can contain the
 * separators.
 *
 * The reader still accepts the old JSON form. Nothing should be in flight —
 * no order has ever been placed — but a session created minutes before a
 * deploy and paid minutes after would otherwise be unfulfillable, and a
 * customer's paid order is the wrong thing to lose to a format change.
 */

export type OrderLine = { slug: string; sizeLabel: string; qty: number };

export function encodeOrderLines(lines: readonly OrderLine[]): string {
  return lines.map((l) => `${l.slug}:${l.sizeLabel}:${l.qty}`).join("|");
}

export function decodeOrderLines(raw: string): OrderLine[] {
  const text = raw.trim();
  if (!text) return [];

  if (text.startsWith("[")) {
    const parsed = JSON.parse(text) as Array<Partial<OrderLine>>;
    return parsed.flatMap((i) =>
      i?.slug && i?.sizeLabel && Number(i.qty) > 0
        ? [{ slug: i.slug, sizeLabel: i.sizeLabel, qty: Number(i.qty) }]
        : [],
    );
  }

  return text.split("|").flatMap((part) => {
    // rsplit on ":" so a size containing one could never eat the quantity.
    const bits = part.split(":");
    if (bits.length < 3) return [];
    const qty = Number(bits.pop());
    const sizeLabel = bits.pop() as string;
    const slug = bits.join(":");
    if (!slug || !sizeLabel || !Number.isFinite(qty) || qty <= 0) return [];
    return [{ slug, sizeLabel, qty }];
  });
}
