import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "../lib/cart-context";
import { useCurrency } from "../lib/currency-context";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { items, updateQty, removeItem, subtotal, discount, total } = useCart();
  const { formatPrice } = useCurrency();

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1500px] flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="ap-statement text-pink">Empty.</h1>
        <p className="text-sm text-ink-2">Nothing in it. That's on you.</p>
        <Link
          to="/shop"
          className="font-label bg-ink px-8 py-4 text-xs font-medium tracking-[0.14em] text-paper uppercase transition-opacity hover:opacity-90"
        >
          Go and look
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-16 sm:px-10 sm:py-24">
      <h1 className="ap-statement mb-14 text-ink">Bag</h1>

      <ul className="border-t border-ink">
        {items.map((line) => (
          <li
            key={`${line.slug}-${line.sizeLabel}`}
            className="flex gap-5 border-b border-border py-6"
          >
            <img
              src={line.image}
              alt={line.title}
              className="h-28 w-24 shrink-0 object-cover sm:h-36 sm:w-28"
            />
            <div className="flex flex-1 flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-sm font-bold text-ink uppercase">{line.title}</p>
                  <p className="ap-eyebrow mt-1 text-ink-2">Size {line.sizeLabel}</p>
                </div>
                <p className="font-label text-sm text-ink">{formatPrice(line.price * line.qty)}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center border border-border">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() =>
                      updateQty(line.slug, line.productType, line.sizeLabel, line.qty - 1)
                    }
                    className="h-9 w-9 text-ink transition-colors hover:bg-surface-2"
                  >
                    −
                  </button>
                  <span className="font-label w-9 text-center text-xs">{line.qty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() =>
                      updateQty(line.slug, line.productType, line.sizeLabel, line.qty + 1)
                    }
                    className="h-9 w-9 text-ink transition-colors hover:bg-surface-2"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(line.slug, line.productType, line.sizeLabel)}
                  className="ap-eyebrow text-ink-2 transition-opacity hover:opacity-60"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col items-end gap-2">
        {discount > 0 && (
          <>
            <p className="font-label text-sm text-ink-2">Subtotal {formatPrice(subtotal)}</p>
            <p className="font-label text-sm text-pink">Discount −{formatPrice(discount)}</p>
          </>
        )}
        <p className="font-display text-2xl font-bold text-ink uppercase">
          Total {formatPrice(total)}
        </p>
        <p className="ap-eyebrow text-ink-2">Shipping included. Tax at checkout.</p>
        <Link
          to="/checkout"
          className="font-label mt-4 bg-pink px-10 py-4 text-xs font-medium tracking-[0.14em] text-paper uppercase transition-opacity hover:opacity-90"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
