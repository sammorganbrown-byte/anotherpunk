import { createFileRoute, Link } from "@tanstack/react-router";
import { ANOTHER_PUNK_PRODUCTS } from "../../lib/another-punk-products";
import { useCurrency } from "../../lib/currency-context";

export const Route = createFileRoute("/_shell/shop")({ component: RedesignIndexView });

/** The plain index.
 *
 * The field is the store — this is the escape hatch: a straight grid, every
 * garment, one image each, sorted, no motion, no drag, no reveal. It exists
 * because a field is a lovely way to browse and a poor way to find a thing
 * you already know the name of, and because anyone who cannot or does not
 * want to drag a canvas still needs the whole range.
 *
 * Deliberately undersold in the navigation: it is a fallback, not the front
 * door. No hero, no big type, just the goods.
 */
function RedesignIndexView() {
  const { formatPrice } = useCurrency();

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--rd-rule)] px-4 py-3">
        <h1 className="rd-label">Shop</h1>
        <p className="rd-log">
          {ANOTHER_PUNK_PRODUCTS.length} styles <span aria-hidden="true">·</span>{" "}
          <Link to="/" className="rd-link underline underline-offset-4">
            back to the field
          </Link>
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-px p-px sm:grid-cols-3 lg:grid-cols-4">
        {ANOTHER_PUNK_PRODUCTS.map((p) => (
          <li key={p.slug}>
            <Link to="/product/$slug" params={{ slug: p.slug }} className="rd-tile">
              <img
                src={p.images[0]}
                alt={p.title}
                loading="lazy"
                decoding="async"
                className="aspect-[4/5] w-full object-cover"
              />
              <span className="rd-tile-cap">
                <span className="rd-ok">{p.title}</span>
                <span className="rd-log">{formatPrice(p.price)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
