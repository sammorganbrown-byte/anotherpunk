import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "../lib/cart-context";
import { useCurrency } from "../lib/currency-context";
import { createCheckoutSession } from "../lib/api/checkout.functions";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

const COUNTRIES = [
  ["GB", "United Kingdom"],
  ["IE", "Ireland"],
  ["PT", "Portugal"],
  ["ES", "Spain"],
  ["FR", "France"],
  ["DE", "Germany"],
  ["IT", "Italy"],
  ["NL", "Netherlands"],
  ["BE", "Belgium"],
  ["AT", "Austria"],
  ["SE", "Sweden"],
  ["DK", "Denmark"],
  ["PL", "Poland"],
  ["CZ", "Czechia"],
  ["US", "United States"],
  ["CA", "Canada"],
  ["AU", "Australia"],
  ["NZ", "New Zealand"],
] as const;

function Field({
  label,
  value,
  onChange,
  required = true,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="ap-eyebrow text-ink-2">
        {label}
        {!required && " (optional)"}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-ink"
      />
    </label>
  );
}

function CheckoutPage() {
  const { items, total } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

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
      <div className="mx-auto flex min-h-[60vh] max-w-[900px] flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="ap-statement text-pink">Empty</h1>
        <Link
          to="/shop"
          className="font-label bg-ink px-8 py-4 text-xs font-medium tracking-[0.14em] text-paper uppercase transition-opacity hover:opacity-90"
        >
          Start looking
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
        // Hand off to Stripe's hosted page.
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
    <div className="mx-auto max-w-[1100px] px-6 py-16 sm:px-10 sm:py-24">
      <h1 className="ap-statement mb-14 text-ink">Checkout</h1>

      <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <Field label="Name" value={form.name} onChange={set("name")} />
          <Field label="Email" type="email" value={form.email} onChange={set("email")} />
          <Field label="Address" value={form.address} onChange={set("address")} />
          <Field
            label="Address line 2"
            value={form.addressLine2}
            onChange={set("addressLine2")}
            required={false}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field label="City" value={form.city} onChange={set("city")} />
            <Field label="Postcode" value={form.postalCode} onChange={set("postalCode")} />
          </div>
          <Field
            label="County / State"
            value={form.stateOrCounty}
            onChange={set("stateOrCounty")}
            required={false}
          />
          <label className="flex flex-col gap-2">
            <span className="ap-eyebrow text-ink-2">Country</span>
            <select
              value={form.country}
              onChange={(e) => set("country")(e.target.value)}
              className="h-12 border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-ink"
            >
              {COUNTRIES.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="text-sm text-pink">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="font-label mt-4 h-14 bg-pink text-xs font-medium tracking-[0.14em] text-paper uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Taking you to payment…" : `Pay ${formatPrice(total)}`}
          </button>
          <p className="ap-eyebrow text-ink-2">
            Card details are handled by Stripe — they never touch this site.
          </p>
        </form>

        <aside className="h-fit border border-ink p-6">
          <h2 className="font-display mb-5 text-sm font-bold text-ink uppercase">Your order</h2>
          <ul className="flex flex-col gap-4">
            {items.map((line) => (
              <li key={`${line.slug}-${line.sizeLabel}`} className="flex items-center gap-3">
                <img src={line.image} alt="" className="h-16 w-14 shrink-0 object-cover" />
                <div className="flex-1">
                  <p className="font-display text-xs font-bold text-ink uppercase">{line.title}</p>
                  <p className="ap-eyebrow mt-1 text-ink-2">
                    {line.sizeLabel} × {line.qty}
                  </p>
                </div>
                <p className="font-label text-xs text-ink">{formatPrice(line.price * line.qty)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-baseline justify-between border-t border-ink pt-4">
            <span className="font-display text-sm font-bold text-ink uppercase">Total</span>
            <span className="font-label text-sm text-ink">{formatPrice(total)}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/cart" })}
            className="ap-eyebrow mt-5 text-ink transition-opacity hover:opacity-60"
          >
            ← Edit bag
          </button>
        </aside>
      </div>
    </div>
  );
}
