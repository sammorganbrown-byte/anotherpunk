import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "../../lib/cart-context";
import { useCurrency } from "../../lib/currency-context";

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
    subtotal,
    discount,
    shipping,
    shippingBeforeDiscount,
    total,
  } = useCart();
  const { formatPrice, formatEur, converted } = useCurrency();

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

      <ul className="border-t border-[var(--rd-rule)]">
        {items.map((line) => (
          <li
            key={`${line.slug}-${line.sizeLabel}`}
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
                  updateQty(line.slug, line.productType, line.sizeLabel, line.qty - 1)
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
                  updateQty(line.slug, line.productType, line.sizeLabel, line.qty + 1)
                }
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="rd-link shrink-0 underline underline-offset-4"
              onClick={() => removeItem(line.slug, line.productType, line.sizeLabel)}
            >
              Kill
            </button>
          </li>
        ))}
      </ul>

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
        <p className="rd-log">Worldwide. Duties, where they apply, are yours.</p>
        <Link to="/checkout" className="rd-btn mt-4" data-primary="true">
          Dispatch →
        </Link>
      </div>
    </div>
  );
}
