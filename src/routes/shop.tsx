import { createFileRoute, Link } from "@tanstack/react-router";
import { ANOTHER_PUNK_PRODUCTS } from "../lib/another-punk-products";
import { useCurrency } from "../lib/currency-context";
import { ApQuotePlate } from "../components/another-punk/ap-quote-plate";

export const Route = createFileRoute("/shop")({
  component: AnotherPunkShop,
});

function AnotherPunkShop() {
  const { formatPrice } = useCurrency();

  return (
    <>
      <div className="ap-grain px-6 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-[1500px]">
        <h1 className="ap-statement text-ink">
          <span className="ap-misreg" data-text="Everything">
            Everything
          </span>
        </h1>
        <p className="ap-eyebrow mt-6 text-ink-2">
          {ANOTHER_PUNK_PRODUCTS.length} styles. Made to order. Shipped worldwide.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-3">
          {ANOTHER_PUNK_PRODUCTS.map((p, i) => (
            <Link
              key={p.slug}
              to="/product/$slug"
              params={{ slug: p.slug }}
              className="group block"
            >
              <div className="ap-tile-img aspect-[3/4] w-full bg-surface-2">
                <img
                  src={p.images[0]}
                  alt={p.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <div className="mt-4 flex items-baseline gap-3 border-t border-ink pt-3">
                <span className="ap-index">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display flex-1 text-sm font-bold text-ink uppercase">
                  {p.title}
                </span>
                <span className="font-label text-xs text-ink-2">{formatPrice(p.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      </div>

      <ApQuotePlate
        quote="Surrender Dorothy."
        emphasis="Dorothy."
        source="After Hours, 1985"
        slug="surrender-dorothy"
        tone="pink"
      />
    </>
  );
}
