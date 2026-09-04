import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ANOTHER_PUNK_PRODUCTS,
  getAnotherPunkProduct,
  isFulfillable,
  TAPSTITCH_FULFILMENT_LIVE,
  type ApSize,
  DEFAULT_DESCRIPTION,
} from "../../../lib/another-punk-products";
import { useCart } from "../../../lib/cart-context";
import { useCurrency } from "../../../lib/currency-context";
import { SHIPPING_BASE, SHIPPING_PER_EXTRA_ITEM } from "../../../lib/shipping";
import { RdDelivery } from "../../../components/redesign/rd-delivery";
import { RdSizeChart } from "../../../components/redesign/rd-size-chart";
import { RdPixelText } from "../../../components/redesign/rd-pixel-text";
import { pageMeta } from "../../../lib/seo";

export const Route = createFileRoute("/_shell/product/$slug")({
  loader: ({ params }) => {
    const product = getAnotherPunkProduct(params.slug);
    if (!product) throw notFound();
    return product;
  },
  /* Without this the page inherited _shell's meta, so every product link
     pasted anywhere unfurled as the Westwood 69 jersey — the wrong garment
     advertising itself on sixteen of seventeen products. images[0] is the
     hero, which is chosen as the frame that reads the garment most clearly,
     so it is exactly the right frame for a thumbnail too. */
  head: ({ loaderData: product }) =>
    product
      ? {
          meta: pageMeta({
            title: `${product.title} — Another Punk`,
            description: product.description ?? DEFAULT_DESCRIPTION,
            image: product.images[0],
            imageAlt: `${product.title}. ${product.eyebrow}.`,
            path: `/product/${product.slug}`,
          }),
        }
      : {},
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
    ["SHIPPING", `WORLDWIDE · +${formatPrice(SHIPPING_BASE)}, +${formatPrice(
      SHIPPING_PER_EXTRA_ITEM,
    )} PER EXTRA ITEM`],
  ];

  return (
    <div className="rd-pdp">
      <div className="rd-pdp-media">
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

      <div className="rd-pdp-spec flex flex-col gap-8 p-4 sm:p-8">
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
          {/* Under the size buttons, which is where somebody is standing when
              they wonder whether M means what they think it means. */}
          <RdSizeChart product={product} />
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

        {/* Directly under the buy button, which is the moment the questions
            it answers actually occur to somebody. */}
        <RdDelivery />

        <p className="rd-log max-w-[56ch]">{product.description ?? ""}</p>

        <div className="flex flex-wrap gap-5">
          <Link to="/" className="rd-link underline underline-offset-4">
            ← Back to the field
          </Link>
          <Link to="/shop" className="rd-link underline underline-offset-4">
            Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
