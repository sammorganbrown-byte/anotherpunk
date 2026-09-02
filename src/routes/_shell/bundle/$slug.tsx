import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { getBundle, bundleFullPrice, bundleSaving } from "../../../lib/bundles";
import { getAnotherPunkProduct } from "../../../lib/another-punk-products";
import { computeShipping } from "../../../lib/shipping";
import { useCart } from "../../../lib/cart-context";
import { useCurrency } from "../../../lib/currency-context";
import { RdPixelText } from "../../../components/redesign/rd-pixel-text";
import { RdDelivery } from "../../../components/redesign/rd-delivery";

export const Route = createFileRoute("/_shell/bundle/$slug")({
  loader: ({ params }) => {
    const bundle = getBundle(params.slug);
    if (!bundle) throw notFound();
    return { bundle };
  },
  component: BundlePage,
});

/** A package deal, chosen slot by slot.
 *
 * The page is a row per garment: pick the design, pick the size. That shape
 * is what makes the deal buildable at all — four tees at four different sizes
 * is not something a single size selector can express, and a bundle that
 * forced one size across four garments would be a bundle nobody could wear.
 *
 * Nothing is added to the basket until every slot is filled, because a
 * half-built bundle is not a bundle: the server would reject the group and
 * charge full price. Better to refuse to add it than to add something that
 * silently costs more than the page promised.
 */
function BundlePage() {
  const { bundle } = Route.useLoaderData();
  const { addItem } = useCart();
  const { formatEur } = useCurrency();

  // One slot per garment. Pre-filled where the choice is obvious — a
  // his-and-hers pair defaults to one of each, which is what most people
  // came for and saves them two taps to arrive where they were going.
  const [picks, setPicks] = useState<{ slug: string | null; size: string | null }[]>(() =>
    Array.from({ length: bundle.count }, (_, i) => ({
      slug: bundle.choices[i] ?? bundle.choices[0] ?? null,
      size: null,
    })),
  );
  const [added, setAdded] = useState(false);

  const setSlot = (i: number, patch: Partial<{ slug: string | null; size: string | null }>) => {
    setPicks((p) => p.map((s, j) => (j === i ? { ...s, ...patch } : s)));
    setAdded(false);
  };

  const chosen = picks.map((p) => p.slug).filter((s): s is string => Boolean(s));
  const full = bundleFullPrice(bundle, chosen.length === bundle.count ? chosen : bundle.choices.slice(0, bundle.count));
  const saving = bundleSaving(
    bundle,
    chosen.length === bundle.count ? chosen : bundle.choices.slice(0, bundle.count),
  );

  // Distinct bundles must not repeat a design; the picker greys out what is
  // already taken, so this can only fail if someone gets there mid-change.
  const duplicate =
    bundle.distinct && new Set(chosen).size !== chosen.length && chosen.length === bundle.count;
  const complete = picks.every((p) => p.slug && p.size) && !duplicate;

  const add = () => {
    if (!complete) return;
    // One id per instance, so two of the same bundle in one basket stay two
    // separate groups rather than merging into one that validates as neither.
    const bundleId = `${bundle.slug}-${Math.random().toString(36).slice(2, 10)}`;
    for (const pick of picks) {
      const product = getAnotherPunkProduct(pick.slug!);
      if (!product) continue;
      addItem(
        {
          slug: product.slug,
          title: product.title,
          image: product.images[0],
          productType: "tapstitch",
          sizeLabel: pick.size!,
          price: product.price,
          bundleId,
          bundleSlug: bundle.slug,
        },
        1,
      );
    }
    setAdded(true);
  };

  return (
    <div className="rd-bundle">
      <p className="rd-label mb-4">
        PACKAGE DEAL <span className="rd-key">/</span> {bundle.eyebrow.toUpperCase()}
      </p>

      <RdPixelText as="h1" text={bundle.title} />

      <p className="rd-log mt-6 max-w-[54ch]">{bundle.pitch}</p>

      <div className="rd-bundle-price">
        <span className="rd-bundle-now">{formatEur(bundle.price)}</span>
        <span className="rd-bundle-was">{formatEur(full + computeShipping(bundle.count))}</span>
        <span className="rd-bundle-save">
          SAVE {formatEur(saving)} <span className="rd-key">·</span> SHIPPING INCLUDED
        </span>
      </div>

      <p className="rd-log mt-4 max-w-[54ch]">{bundle.description}</p>

      <div className="rd-bundle-slots">
        {picks.map((pick, i) => {
          const product = pick.slug ? getAnotherPunkProduct(pick.slug) : undefined;
          // In a distinct bundle a design taken by another slot is offered
          // but disabled, rather than hidden — a list that changes length as
          // you fill it in is disorienting, and seeing what is gone is part
          // of understanding the choice.
          const takenElsewhere = (slug: string) =>
            bundle.distinct && picks.some((p, j) => j !== i && p.slug === slug);

          return (
            <div className="rd-bundle-slot" key={i}>
              <p className="rd-label">
                {String(i + 1).padStart(2, "0")} <span className="rd-key">/</span>{" "}
                {bundle.count === 2 ? (i === 0 ? "FIRST" : "SECOND") : "TEE"}
              </p>

              <div className="rd-bundle-slot-body">
                {product ? (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="rd-bundle-thumb"
                    loading="lazy"
                  />
                ) : (
                  <div className="rd-bundle-thumb" aria-hidden="true" />
                )}

                <div className="rd-bundle-picks">
                  <div>
                    <p className="rd-label mb-2">DESIGN</p>
                    <div className="rd-log flex flex-wrap gap-2">
                      {bundle.choices.map((slug) => {
                        const p = getAnotherPunkProduct(slug);
                        if (!p) return null;
                        const taken = takenElsewhere(slug);
                        return (
                          <button
                            key={slug}
                            type="button"
                            className="rd-cell"
                            aria-pressed={pick.slug === slug}
                            disabled={taken}
                            title={taken ? "Already in this pack" : undefined}
                            onClick={() => setSlot(i, { slug, size: null })}
                          >
                            {p.title.replace(/^Westwood 69 — /, "")}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="rd-label mb-2">SIZE</p>
                    <div className="rd-log flex flex-wrap gap-2">
                      {(product?.sizes ?? []).map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="rd-cell"
                          aria-pressed={pick.size === s}
                          onClick={() => setSlot(i, { size: s })}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rd-bundle-actions">
        <button type="button" className="rd-btn" data-primary="true" disabled={!complete} onClick={add}>
          {complete
            ? `Add the pack — ${formatEur(bundle.price)}`
            : "Choose a size for each"}
        </button>

        {added ? (
          <p className="rd-log">
            In the bag.{" "}
            <Link to="/cart" className="rd-link underline underline-offset-4">
              Go to the bag
            </Link>
            .
          </p>
        ) : null}
      </div>

      <RdDelivery />

      <p className="rd-log rd-bundle-note">
        Sold as a pack — the pieces arrive in one parcel and come out of the bag together. The
        price is worked out again at checkout from the pieces you picked, so it is the same
        number there as it is here.
      </p>
    </div>
  );
}
