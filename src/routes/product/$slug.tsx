import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ApGallery } from "../../components/another-punk/ap-gallery";
import {
  ANOTHER_PUNK_PRODUCTS,
  DEFAULT_DESCRIPTION,
  DEFAULT_FIT,
  getAnotherPunkProduct,
  isFulfillable,
  TAPSTITCH_FULFILMENT_LIVE,
  type ApSize,
} from "../../lib/another-punk-products";
import { useCart } from "../../lib/cart-context";
import { useCurrency } from "../../lib/currency-context";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = getAnotherPunkProduct(params.slug);
    if (!product) throw notFound();
    return product;
  },
  component: AnotherPunkProductPage,
});

function AnotherPunkProductPage() {
  const product = Route.useLoaderData();
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const [size, setSize] = useState<ApSize>(product.sizes.includes("M") ? "M" : product.sizes[0]);
  const [justAdded, setJustAdded] = useState(false);

  const available = isFulfillable(product);
  const index = ANOTHER_PUNK_PRODUCTS.findIndex((p) => p.slug === product.slug) + 1;

  const handleAdd = () => {
    addItem(
      {
        slug: product.slug,
        title: product.title,
        image: product.images[0],
        productType: "tapstitch",
        sizeLabel: size,
        price: product.price,
      },
      1,
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <div className="ap-grain">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-2">
        <ApGallery images={product.images} title={product.title} />

        <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
          <div className="mb-4 flex items-center gap-3">
            <span className="ap-index">{String(index).padStart(2, "0")}</span>
            <span className="ap-eyebrow text-ink-2">{product.eyebrow}</span>
          </div>

          <h1 className="font-display text-4xl leading-[0.95] font-bold tracking-tight uppercase sm:text-6xl">
            <span className="ap-misreg" data-text={product.title}>
              {product.title}
            </span>
          </h1>

          <p className="font-label mt-8 text-sm text-ink">{formatPrice(product.price)}</p>

          <div className="mt-10 flex flex-col gap-3">
            <span className="ap-eyebrow text-ink-2">Size</span>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`font-label h-11 min-w-11 border px-3 text-xs font-medium uppercase transition-colors ${
                    size === s
                      ? "border-ink bg-ink text-paper"
                      : "border-border text-ink hover:border-ink"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {available ? (
            <button
              type="button"
              onClick={handleAdd}
              className="font-label mt-8 h-14 w-full bg-pink text-xs font-medium tracking-[0.14em] text-paper uppercase transition-opacity hover:opacity-90"
            >
              {justAdded ? "In the bag" : "Add to bag"}
            </button>
          ) : (
            <div className="mt-8">
              <button
                type="button"
                disabled
                className="font-label h-14 w-full cursor-not-allowed border border-ink text-xs font-medium tracking-[0.14em] text-ink-2 uppercase"
              >
                Not yet
              </button>
              <p className="mt-3 text-xs text-ink-2">
                {!TAPSTITCH_FULFILMENT_LIVE
                  ? "Not for sale yet. It's drawn, printed and ready. We're just not taking money for it today."
                  : "Not in production yet. The rest of it ships now."}
              </p>
            </div>
          )}

          {product.quote ? (
            <blockquote className="mt-12 border-t border-ink pt-8">
              <p className="font-display text-2xl leading-[1.1] font-bold tracking-tight text-pink uppercase sm:text-3xl">
                <span className="ap-misreg" data-text={product.quote}>
                  {product.quote}
                </span>
              </p>
              <footer className="ap-eyebrow mt-4 text-ink-2">{product.quoteSource}</footer>
            </blockquote>
          ) : null}

          <div className="mt-12 flex flex-col gap-4 border-t border-ink pt-8">
            <p className="text-sm leading-relaxed text-ink-2">
              {product.description ?? DEFAULT_DESCRIPTION}
            </p>
            <p className="text-sm leading-relaxed text-ink-2">{product.fit ?? DEFAULT_FIT}</p>
            <Link
              to="/shop"
              className="ap-eyebrow mt-2 text-ink transition-opacity hover:opacity-60"
            >
              ← Everything else
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
