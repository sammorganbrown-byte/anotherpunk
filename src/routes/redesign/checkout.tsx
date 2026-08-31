import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "../../lib/cart-context";
import { useCurrency } from "../../lib/currency-context";
import { createCheckoutSession } from "../../lib/api/checkout.functions";

export const Route = createFileRoute("/redesign/checkout")({ component: RedesignCheckout });

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
  const { items, total } = useCart();
  const { formatPrice } = useCurrency();

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

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <p className="rd-huge">
          Queue <span className="text-[var(--rd-red)]">empty.</span>
        </p>
        <Link to="/redesign/shop" className="rd-btn" data-primary="true">
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
          })),
          promoCode: null,
          ...form,
        },
      });
      if (result.configured) {
        window.location.href = result.redirectUrl;
      } else {
        setError(result.reason);
        setBusy(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
            <Field
              label="Country"
              value={form.country}
              onChange={set("country")}
              autoComplete="country"
            />
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
          <p className="rd-mid mt-6">
            Total <span className="text-[var(--rd-red)]">{formatPrice(total)}</span>
          </p>
        </aside>
      </div>
    </div>
  );
}
