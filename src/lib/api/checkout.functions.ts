import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getStripe, type CheckoutSessionMetadata } from "../stripe.server";
import { getAnotherPunkProduct, isFulfillable } from "../another-punk-products";
import { computeDiscount } from "../promo-codes";
import { computeShipping } from "../shipping";

// Where the site lives, used to build Stripe's return URLs. Set SITE_URL in
// the host's env; falls back to localhost so `vite dev` works untouched.
function siteUrl(): string {
  return process.env.SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

const itemSchema = z.object({
  slug: z.string().min(1),
  productType: z.literal("tapstitch"),
  sizeLabel: z.string().min(1),
  price: z.number().nonnegative(),
  qty: z.number().int().positive(),
});

const checkoutInput = z.object({
  items: z.array(itemSchema).min(1),
  promoCode: z.string().nullable(),
  name: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(1),
  addressLine2: z.string(),
  city: z.string().min(1),
  stateOrCounty: z.string(),
  postalCode: z.string().min(1),
  country: z.string().length(2),
});

type CheckoutResult =
  { configured: true; redirectUrl: string } | { configured: false; reason: string };

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator(checkoutInput)
  .handler(async ({ data }): Promise<CheckoutResult> => {
    // Re-resolve every line against the real catalogue rather than trusting
    // the client's price. A tampered request otherwise sets its own price.
    const resolved = [];
    for (const item of data.items) {
      const product = getAnotherPunkProduct(item.slug);
      if (!product) {
        return { configured: false, reason: `We no longer carry "${item.slug}".` };
      }
      if (!isFulfillable(product)) {
        return {
          configured: false,
          reason: `"${product.title}" isn't available to order yet.`,
        };
      }
      if (!product.sizes.includes(item.sizeLabel as never)) {
        return {
          configured: false,
          reason: `"${product.title}" doesn't come in size ${item.sizeLabel}.`,
        };
      }
      resolved.push({ product, sizeLabel: item.sizeLabel, qty: item.qty });
    }

    // Discount recomputed server-side; the client's figure is display only.
    const discount = computeDiscount(
      data.promoCode,
      resolved.map((r) => ({ price: r.product.price, qty: r.qty, slug: r.product.slug })),
    );

    let stripe;
    try {
      stripe = getStripe();
    } catch (err) {
      return {
        configured: false,
        reason: err instanceof Error ? err.message : "Payment isn't connected yet.",
      };
    }

    const subtotal = resolved.reduce((sum, r) => sum + r.product.price * r.qty, 0);
    // Spread any discount proportionally across lines so Stripe's own
    // line-item totals still add up to what the customer is charged.
    const factor = subtotal > 0 ? Math.max(0, subtotal - discount) / subtotal : 1;

    const lineItems = resolved.map((r) => ({
      quantity: r.qty,
      price_data: {
        currency: "eur",
        unit_amount: Math.round(r.product.price * factor * 100),
        product_data: {
          name: `${r.product.title} — ${r.sizeLabel}`,
          images: [r.product.images[0]],
        },
      },
    }));

    // Recomputed here from the resolved lines, never taken from the client.
    // Deliberately outside `factor`, so a promo code discounts the clothes
    // and not the postage.
    const shipping = computeShipping(resolved.reduce((n, r) => n + r.qty, 0));
    if (shipping > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(shipping * 100),
          product_data: { name: "Shipping", images: [] },
        },
      });
    }

    const metadata: CheckoutSessionMetadata = {
      itemsJson: JSON.stringify(
        resolved.map((r) => ({ slug: r.product.slug, sizeLabel: r.sizeLabel, qty: r.qty })),
      ),
      promoCode: data.promoCode ?? "",
      name: data.name,
      email: data.email,
      address: data.address,
      addressLine2: data.addressLine2,
      city: data.city,
      stateOrCounty: data.stateOrCounty,
      postalCode: data.postalCode,
      country: data.country,
    };

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: data.email,
        line_items: lineItems,
        metadata: metadata as unknown as Record<string, string>,
        // Stripe's own address element — a real country/postal-format-aware
        // form. The webhook treats THIS as the shipping-of-record, not the
        // free-text fields above.
        shipping_address_collection: {
          allowed_countries: [
            "GB",
            "IE",
            "PT",
            "ES",
            "FR",
            "DE",
            "IT",
            "NL",
            "BE",
            "AT",
            "SE",
            "DK",
            "PL",
            "CZ",
            "US",
            "CA",
            "AU",
            "NZ",
          ],
        },
        success_url: `${siteUrl()}/order-confirmed?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl()}/checkout`,
      });
      if (!session.url) {
        return { configured: false, reason: "Stripe created a session but returned no URL." };
      }
      return { configured: true, redirectUrl: session.url };
    } catch (err) {
      return {
        configured: false,
        reason: err instanceof Error ? err.message : "Stripe session creation failed.",
      };
    }
  });

// Display-only lookup for /order-confirmed. Never triggers fulfillment —
// the webhook does that independently — so it's safe to call even if the
// webhook hasn't fired yet.
const sessionStatusInput = z.object({ sessionId: z.string().min(1) });

type SessionStatusResult =
  { found: true; paid: boolean; amountTotal: number | null } | { found: false };

export const getSessionStatus = createServerFn({ method: "POST" })
  .inputValidator(sessionStatusInput)
  .handler(async ({ data }): Promise<SessionStatusResult> => {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);
      return {
        found: true,
        // A zero-total order — a 100%-off code — completes with
        // "no_payment_required" rather than "paid". Treating only "paid" as
        // success would show a real, completed order as unconfirmed.
        paid:
          session.payment_status === "paid" ||
          session.payment_status === "no_payment_required",
        amountTotal: session.amount_total != null ? session.amount_total / 100 : null,
      };
    } catch {
      return { found: false };
    }
  });
