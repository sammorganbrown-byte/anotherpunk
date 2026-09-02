import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCart } from "../../lib/cart-context";
import { useCurrency } from "../../lib/currency-context";
import { createCheckoutSession } from "../../lib/api/checkout.functions";
import { findPromoCode } from "../../lib/promo-codes";
import { SHIPPING_COUNTRIES } from "../../lib/shipping";

export const Route = createFileRoute("/_shell/checkout")({ component: RedesignCheckout });

/** Dispatch. Entirely new UI over the existing, real Stripe flow — same
 * server function, same payload shape, same hosted Stripe hand-off as the
 * live checkout. Nothing about the money path is reimplemented here.
 *
 * No boot sequence, no field, no drag. A checkout should be boring. */

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  const id = `rd-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="rd-label">
        {label}
      </label>
      <input
        id={id}
        className="rd-input"
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function RedesignCheckout() {
  const {
    items,
    subtotal,
    discount,
    shipping,
    shippingBeforeDiscount,
    total,
    applyPromoCode,
    removePromoCode,
  } = useCart();
  const { formatPrice, formatEur, converted } = useCurrency();

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    addressLine2: "",
    city: "",
    stateOrCounty: "",
    postalCode: "",
    country: "GB",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Errors reaching a customer must be readable. A schema failure arrives as
   * a JSON array of issues, which was being rendered straight onto the page —
   * so a mistyped country produced a wall of `{"code":"too_big"...}` above
   * the Pay button. Anything that does not look like a sentence we wrote is
   * replaced by one that says what to do about it. */
  const readable = (raw: string): string => {
    const looksStructured = /^[[{]/.test(raw.trim()) || /"code":|zod|expected string/i.test(raw);
    if (!looksStructured) return raw;
    if (/"path":\s*\[\s*"country"/.test(raw) || /country/i.test(raw)) {
      return "Please choose your country from the list.";
    }
    return "Some of these details weren't accepted. Check the address fields and try again.";
  };
  const [promo, setPromo] = useState("");

  const promoFound = findPromoCode(promo);

  // The field feeds the cart rather than being read straight into this page.
  // It used to be display-only: the code was recognised and its saving shown,
  // but the Pay button still quoted the undiscounted total while the server
  // charged the discounted one — the customer saw one number and their card
  // saw another. Going through the cart means the summary here, the total on
  // /cart and the amount sent to Stripe are all the same figure.
  //
  // The server still recomputes the discount from the items before it creates
  // the session, so nothing typed here decides what is actually charged.
  useEffect(() => {
    const code = promo.trim();
    if (code && findPromoCode(code)) applyPromoCode(code);
    else removePromoCode();
    // applyPromoCode/removePromoCode are stable for the provider's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promo]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <p className="rd-huge">
          Queue <span className="text-[var(--rd-red)]">empty.</span>
        </p>
        <Link to="/shop" className="rd-btn" data-primary="true">
          Open the field
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await createCheckoutSession({
        data: {
          items: items.map((i) => ({
            slug: i.slug,
            productType: "tapstitch" as const,
            sizeLabel: i.sizeLabel,
            price: i.price,
            qty: i.qty,
            // Must be carried through. Without these the server sees a bag
            // of loose garments, finds no bundle to honour, and charges the
            // full price — the customer having been shown the deal the whole
            // way to the card form.
            bundleId: i.bundleId,
            bundleSlug: i.bundleSlug,
          })),
          promoCode: promo.trim() || null,
          ...form,
        },
      });
      if (result.configured) {
        window.location.href = result.redirectUrl;
      } else {
        setError(readable(result.reason));
        setBusy(false);
      }
    } catch (err) {
      setError(readable(err instanceof Error ? err.message : "Something went wrong."));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] px-3 py-8 sm:px-4">
      <h1 className="rd-label mb-6">
        Dispatch <span className="rd-key">·</span> {items.length} job
        {items.length === 1 ? "" : "s"}
      </h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Name" value={form.name} onChange={set("name")} autoComplete="name" />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={set("email")}
            autoComplete="email"
          />
          <Field
            label="Address"
            value={form.address}
            onChange={set("address")}
            autoComplete="address-line1"
          />
          <Field
            label="Discount code"
            value={promo}
            onChange={setPromo}
            required={false}
            autoComplete="off"
          />
          {promo.trim() ? (
            <p className="rd-log">
              {promoFound ? (
                <span className="rd-ok">
                  {/* Not every code is a percentage — one prices at cost —
                      and printing "undefined% off" is worse than saying
                      nothing about how the number was arrived at. */}
                  {promoFound.label ?? promoFound.code}
                  {typeof promoFound.percentOff === "number"
                    ? ` — ${promoFound.percentOff}% off`
                    : promoFound.toCost
                      ? " — at cost"
                      : ""}
                  , −{formatPrice(discount)}
                </span>
              ) : (
                <span className="rd-key">No such code.</span>
              )}
            </p>
          ) : null}
          <Field
            label="Address line 2"
            value={form.addressLine2}
            onChange={set("addressLine2")}
            required={false}
            autoComplete="address-line2"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="City"
              value={form.city}
              onChange={set("city")}
              autoComplete="address-level2"
            />
            <Field
              label="Postcode"
              value={form.postalCode}
              onChange={set("postalCode")}
              autoComplete="postal-code"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="County / State"
              value={form.stateOrCounty}
              onChange={set("stateOrCounty")}
              required={false}
              autoComplete="address-level1"
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rd-country" className="rd-label">
                Country
              </label>
              <select
                id="rd-country"
                className="rd-input rd-select-field"
                value={form.country}
                onChange={(e) => set("country")(e.target.value)}
                autoComplete="country"
                required
              >
                {SHIPPING_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <p role="alert" className="rd-log" style={{ color: "var(--rd-red)" }}>
              {error}
            </p>
          ) : null}

          <button type="submit" className="rd-btn mt-2" data-primary="true" disabled={busy}>
            {busy ? "Dispatching…" : `Pay ${formatPrice(total)}`}
          </button>
          <p className="rd-log">Payment is handled by Stripe on their own page.</p>
        </form>

        <aside className="border-t border-[var(--rd-rule)] pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <h2 className="rd-label mb-4">Queue</h2>
          <ul className="flex flex-col gap-3">
            {items.map((line) => (
              <li key={`${line.slug}-${line.sizeLabel}`} className="flex items-center gap-3">
                <img
                  src={line.image}
                  alt=""
                  aria-hidden="true"
                  className="h-14 w-16 shrink-0 border border-[var(--rd-rule)] object-cover"
                  style={{ filter: "grayscale(1) contrast(1.2) brightness(.85)" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="rd-log rd-ok truncate">{line.title}</p>
                  <p className="rd-log">
                    {line.sizeLabel} × {line.qty}
                  </p>
                </div>
                <span className="rd-log rd-ok">{formatPrice(line.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          {discount > 0 ? (
            <>
              <p className="rd-log mt-4 flex justify-between">
                <span>Subtotal</span>
                <span className="rd-ok">{formatPrice(subtotal)}</span>
              </p>
              <p className="rd-log flex justify-between text-[var(--rd-red)]">
                <span>Discount</span>
                <span>−{formatPrice(discount)}</span>
              </p>
            </>
          ) : null}
          {shippingBeforeDiscount > 0 ? (
            <p className={`rd-log flex justify-between ${discount > 0 ? "" : "mt-4"}`}>
              <span>Shipping</span>
              {shipping === 0 ? (
                <span>
                  <span className="line-through opacity-50">
                    {formatPrice(shippingBeforeDiscount)}
                  </span>{" "}
                  <span className="text-[var(--rd-red)]">free</span>
                </span>
              ) : (
                <span className="rd-ok">{formatPrice(shipping)}</span>
              )}
            </p>
          ) : null}
          <p className="rd-mid mt-2">
            Total <span className="text-[var(--rd-red)]">{formatPrice(total)}</span>
          </p>
          {/* Prices can be read in another currency, but the charge is always
              in euros. Saying so here, next to the number being committed to,
              is the whole reason the converter is allowed to exist. */}
          {converted ? (
            <p className="rd-log mt-1 opacity-70">Charged in euros — {formatEur(total)}</p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
