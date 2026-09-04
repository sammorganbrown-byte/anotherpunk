import { createFileRoute, Link } from "@tanstack/react-router";
import { BUNDLES } from "../../lib/bundles";
import { ANOTHER_PUNK_PRODUCTS } from "../../lib/another-punk-products";
import { useCurrency } from "../../lib/currency-context";

import { pageMeta } from "../../lib/seo";

export const Route = createFileRoute("/_shell/shop")({
  /* The shop is the link most likely to be shared after a product page, and
     it should show the range rather than one jersey. */
  head: () => ({
    meta: pageMeta({
      title: "Shop — Another Punk",
      image: "/img/og-another-punk.jpg",
      imageAlt: "Another Punk garments.",
      path: "/shop",
    }),
  }),
  component: RedesignIndexView,
});
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

      {/* Package deals sit UNDER the garments, not above them.
          They led the grid on the theory that a deal nobody scrolls to is not
          a deal. But somebody arriving at a shop wants to see the clothes, and
          opening with two bundles asks them to commit to four garments before
          they have seen one — the pack is what you consider after something
          has caught your eye, not instead of looking. Putting the range first
          also means the grid opens with fourteen different graphics rather
          than two, which is the more honest picture of what is for sale. */}
      <ul className="grid grid-cols-1 gap-px p-px sm:grid-cols-2">
        {BUNDLES.map((b) => (
          <li key={b.slug}>
            <Link to="/bundle/$slug" params={{ slug: b.slug }} className="rd-tile">
              <img
                src={b.image}
                alt={b.title}
                loading="lazy"
                decoding="async"
                className="aspect-[16/9] w-full object-cover"
              />
              <span className="rd-tile-cap">
                <span className="rd-ok">{b.title}</span>
                <span className="rd-log">
                  <span className="text-[var(--rd-red)]">{formatPrice(b.price)}</span>{" "}
                  <span aria-hidden="true">·</span> {b.eyebrow}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
