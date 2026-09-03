import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "../../lib/cart-context";
import { useCurrency } from "../../lib/currency-context";
import { getBundle } from "../../lib/bundles";
import { RdDelivery } from "../../components/redesign/rd-delivery";
import type { CartItem } from "../../lib/cart-context";

export const Route = createFileRoute("/_shell/cart")({ component: RedesignCart });

/** The cart as a print queue.
 *
 * Deliberately the calmest page in the direction: no boot sequence, no
 * constellation, nothing between someone and paying. The terminal styling
 * stays; the theatre stops.
 */
function RedesignCart() {
  const {
    items,
    updateQty,
    removeItem,
    removeBundle,
    subtotal,
    discount,
    shipping,
    shippingBeforeDiscount,
    total,
  } = useCart();
  const { formatPrice, formatEur, converted } = useCurrency();

  // Split the bag into package deals and everything loose. Insertion order is
  // preserved by Map, so a pack stays where it was added rather than jumping
  // to the top of the bag when something else is added after it.
  const groups = new Map<string, CartItem[]>();
  const loose: CartItem[] = [];
  for (const line of items) {
    if (!line.bundleId) {
      loose.push(line);
      continue;
    }
    const existing = groups.get(line.bundleId);
    if (existing) existing.push(line);
    else groups.set(line.bundleId, [line]);
  }
  const bundleGroups = [...groups.entries()];

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <p className="rd-huge">
          Queue <span className="text-[var(--rd-red)]">empty.</span>
        </p>
        <p className="rd-log">No jobs. Nothing to print.</p>
        <Link to="/shop" className="rd-btn" data-primary="true">
          Open the field
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1000px] px-3 py-8 sm:px-4">
      <h1 className="rd-label mb-5">
        Print queue <span className="rd-key">·</span> {items.length} job
        {items.length === 1 ? "" : "s"}
      </h1>

      {/* Bundles are bracketed out of the flat list and shown as one thing.
          A pack is bought as a unit and removed as a unit, so its lines get
          no quantity steppers and no individual Kill — pulling one tee out
          of a four-pack would leave three garments that are no longer a
          deal, priced as though they never were. */}
      {bundleGroups.map(([bundleId, lines]) => {
        const bundle = getBundle(lines[0].bundleSlug ?? "");
        if (!bundle) return null;
        return (
          <section className="rd-bag-bundle" key={bundleId}>
            <div className="rd-bag-bundle-head">
              <div>
                <p className="rd-row-name">{bundle.title}</p>
                <p className="rd-log">
                  PACKAGE DEAL <span className="rd-key">·</span> SHIPPING INCLUDED
                </p>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="rd-row-name">{formatPrice(bundle.price)}</span>
                <button
                  type="button"
                  className="rd-link shrink-0 underline underline-offset-4"
                  onClick={() => removeBundle(bundleId)}
                >
                  Kill
                </button>
              </div>
            </div>
            <ul className="rd-bag-bundle-lines">
              {lines.map((line, i) => (
                <li className="rd-log flex items-center gap-2" key={`${line.slug}-${line.sizeLabel}-${i}`}>
                  <span className="rd-key">{String(i + 1).padStart(2, "0")}</span>
                  <span>{line.title}</span>
                  <span className="rd-key">·</span>
                  <span>SIZE {line.sizeLabel}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <ul className="border-t border-[var(--rd-rule)]">
        {loose.map((line) => (
          <li
            key={`${line.slug}-${line.sizeLabel}-${line.bundleId ?? ""}`}
            className="flex items-center gap-3 border-b border-[var(--rd-rule)] p-3"
          >
            <img
              src={line.image}
              alt=""
              aria-hidden="true"
              className="h-16 w-20 shrink-0 border border-[var(--rd-rule)] object-cover"
              style={{ filter: "grayscale(1) contrast(1.2) brightness(.85)" }}
            />
            <div className="min-w-0 flex-1">
              <p className="rd-row-name truncate">{line.title}</p>
              <p className="rd-log">
                SIZE {line.sizeLabel} <span className="rd-key">·</span> {formatPrice(line.price)}
              </p>
            </div>

            <div className="flex items-center gap-px">
              <button
                type="button"
                className="rd-cell"
                aria-label={`Decrease quantity of ${line.title}`}
                onClick={() =>
                  updateQty(line.slug, line.productType, line.sizeLabel, line.qty - 1, line.bundleId)
                }
              >
                −
              </button>
              <span className="rd-cell flex items-center justify-center" aria-live="polite">
                {line.qty}
              </span>
              <button
                type="button"
                className="rd-cell"
                aria-label={`Increase quantity of ${line.title}`}
                onClick={() =>
                  updateQty(line.slug, line.productType, line.sizeLabel, line.qty + 1, line.bundleId)
                }
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="rd-link shrink-0 underline underline-offset-4"
              onClick={() => removeItem(line.slug, line.productType, line.sizeLabel, line.bundleId)}
            >
              Kill
            </button>
          </li>
        ))}
      </ul>

      <RdDelivery compact />

      <div className="mt-6 flex flex-col items-end gap-1">
        <p className="rd-log">Subtotal {formatPrice(subtotal)}</p>
        {discount > 0 ? <p className="rd-log">Discount −{formatPrice(discount)}</p> : null}
        {/* Shows the rate even when a code has taken it to nothing — a line
            that simply disappears reads as a missing charge, not a saving. */}
        {shippingBeforeDiscount > 0 ? (
          <p className="rd-log">
            Shipping{" "}
            {shipping === 0 ? (
              <>
                <span className="line-through opacity-50">
                  {formatPrice(shippingBeforeDiscount)}
                </span>{" "}
                <span className="text-[var(--rd-red)]">free</span>
              </>
            ) : (
              formatPrice(shipping)
            )}
          </p>
        ) : null}
        <p className="rd-mid mt-1">
          Total <span className="text-[var(--rd-red)]">{formatPrice(total)}</span>
        </p>
        {converted ? (
          <p className="rd-log opacity-70">Charged in euros — {formatEur(total)}</p>
        ) : null}
        {/* A line here used to read "Worldwide. Duties, where they apply, are
            yours." It survived the switch to duty-paid shipping and sat two
            lines under the promise that there are no customs fees, flatly
            contradicting it on the same screen — and the frightening version
            is always the one a customer believes. RdDelivery above already
            says what happens; this said it again and wrongly. */}
        <Link to="/checkout" className="rd-btn mt-4" data-primary="true">
          Dispatch →
        </Link>
      </div>
    </div>
  );
}
