import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ANOTHER_PUNK_PRODUCTS,
  getAnotherPunkProduct,
  isFulfillable,
  TAPSTITCH_FULFILMENT_LIVE,
  type ApSize,
} from "../../../lib/another-punk-products";
import { useCart } from "../../../lib/cart-context";
import { useCurrency } from "../../../lib/currency-context";
import { RdPixelText } from "../../../components/redesign/rd-pixel-text";

export const Route = createFileRoute("/redesign/product/$slug")({
  loader: ({ params }) => {
    const product = getAnotherPunkProduct(params.slug);
    if (!product) throw notFound();
    return product;
  },
  component: RedesignProduct,
});

/** The product page as a job spec.
 *
 * The photograph is duotoned red by default and only resolves to full colour
 * on hover/focus — the print colour applied TO the image rather than placed
 * beside it. Everything else is a spec sheet: fields, values, a SOURCE block
 * for the film line, and a button that queues a job rather than adding to a
 * bag. Same cart, same Stripe path underneath.
 */
function RedesignProduct() {
  const product = Route.useLoaderData();
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const [size, setSize] = useState<ApSize>(
    product.sizes.includes("M") ? "M" : product.sizes[0],
  );
  const [shot, setShot] = useState(0);
  const [lit, setLit] = useState(false);
  const [queued, setQueued] = useState(false);

  const available = isFulfillable(product);
  const idx = ANOTHER_PUNK_PRODUCTS.findIndex((p) => p.slug === product.slug) + 1;

  const spec: [string, string][] = [
    ["JOB", String(idx).padStart(3, "0")],
    ["NAME", product.title],
    ["BUILD", product.eyebrow],
    ["PRICE", formatPrice(product.price)],
    ["SIZES", product.sizes.join(" / ")],
    ["METHOD", "PRINTED TO ORDER"],
    ["SHIPPING", "WORLDWIDE"],
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      <div className="border-b border-[var(--rd-rule)] lg:border-r lg:border-b-0">
        <div
          className="rd-plate aspect-[4/3] w-full"
          data-lit={lit}
          onMouseEnter={() => setLit(true)}
          onMouseLeave={() => setLit(false)}
          onFocus={() => setLit(true)}
          onBlur={() => setLit(false)}
        >
          <img src={product.images[shot]} alt={`${product.title}, view ${shot + 1}`} />
        </div>

        {product.images.length > 1 ? (
          <div className="flex flex-wrap gap-px border-t border-[var(--rd-rule)]">
            {product.images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setShot(i)}
                aria-label={`View ${i + 1} of ${product.images.length}`}
                aria-pressed={i === shot}
                className="rd-cell"
                style={{ minWidth: 44 }}
              >
                {String(i + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-8 p-4 sm:p-8">
        <div>
          <p className="rd-label mb-3">
            JOB {String(idx).padStart(3, "0")} <span className="rd-key">/</span> SPEC
          </p>
          <RdPixelText as="h1" text={product.title.toUpperCase()} />
        </div>

        <dl className="flex flex-col gap-[3px]">
          {spec.map(([k, v]) => (
            <div key={k} className="rd-log flex gap-2">
              <dt className="w-[5.5rem] shrink-0">{k}</dt>
              <dd
                aria-hidden="true"
                className="flex-1 overflow-hidden text-[var(--rd-dimmer)] select-none"
              >
                {"·".repeat(60)}
              </dd>
              <dd className={v === "NONE" ? "rd-key shrink-0" : "rd-ok shrink-0"}>{v}</dd>
            </div>
          ))}
        </dl>

        {product.quote ? (
          <blockquote className="border-l-2 border-[var(--rd-red)] pl-4">
            <RdPixelText text={product.quote.toUpperCase()} className="rd-pix-red" />
            <footer className="rd-label mt-3">{product.quoteSource}</footer>
          </blockquote>
        ) : null}

        <div className="flex flex-col gap-3">
          <span className="rd-label">Size</span>
          <div className="flex flex-wrap gap-px">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                className="rd-cell"
                aria-pressed={size === s}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {available ? (
          <button
            type="button"
            className="rd-btn"
            data-primary="true"
            onClick={() => {
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
              setQueued(true);
              window.setTimeout(() => setQueued(false), 1600);
            }}
          >
            {queued ? "Queued ▮" : `Queue job — ${formatPrice(product.price)}`}
          </button>
        ) : (
          <div>
            <button type="button" className="rd-btn" disabled>
              Not for sale yet
            </button>
            <p className="rd-log mt-3">
              {!TAPSTITCH_FULFILMENT_LIVE
                ? "It's drawn, printed and ready. We're just not taking money for it today."
                : "Not in production yet. The rest of it ships now."}
            </p>
          </div>
        )}

        <p className="rd-log max-w-[56ch]">{product.description ?? ""}</p>

        <div className="flex flex-wrap gap-5">
          <Link to="/redesign" className="rd-link underline underline-offset-4">
            ← Back to the field
          </Link>
          <Link to="/redesign/shop" className="rd-link underline underline-offset-4">
            Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
