import { createServerFn } from "@tanstack/react-start";
import type Stripe from "stripe";
import { z } from "zod";
import { getStripe, type CheckoutSessionMetadata } from "../stripe.server";
import { getAnotherPunkProduct, isFulfillable } from "../another-punk-products";
import { computeDiscount, computeShippingDiscount, isCostPriceCode } from "../promo-codes";
import { encodeOrderLines } from "../order-lines";
import { bundleDiscount, shippingAfterBundles } from "../bundles";
import { computeShipping, SHIPPING_COUNTRIES } from "../shipping";

// Where the site lives, used to build Stripe's return URLs. Set SITE_URL in
// the host's env; falls back to localhost so `vite dev` works untouched.
const FALLBACK_SITE_URL = "https://www.anotherpunk.com";

/** Stripe will only take absolute image URLs on a line item, and rejects the
 * whole session with "Not a valid URL" if it gets anything else.
 *
 * Half the catalogue stores its photographs as site-relative paths and half
 * as absolute CDN links, so six of fourteen products could not be bought at
 * all — and the eight that could were exactly the ones reached for first when
 * testing, which is why this survived a purchase-path review. An absent image
 * yields no images array rather than a broken entry: a missing photograph on
 * Stripe's page is a blemish, a rejected session is a lost sale. */
function absoluteImages(images: readonly string[] | undefined): string[] {
  const first = images?.[0];
  if (!first) return [];
  if (/^https?:\/\//i.test(first)) return [first];
  return [`${siteUrl()}${first.startsWith("/") ? "" : "/"}${first}`];
}

/** The origin Stripe returns the customer to.
 *
 * Defensive about what the environment actually contains, because both ways
 * this has been wrong were invisible until checkout failed. Blank came first:
 * ?? only catches null and undefined, so an empty SITE_URL sailed through and
 * Stripe was handed relative URLs. Then a bare host — "anotherpunk.com", no
 * scheme — which is not a URL at all and fails as "Not a valid URL".
 *
 * So: trim it, add a scheme if it is missing, and if the result still does not
 * parse, ignore it and use the known-good origin. A checkout must not be
 * breakable by a typo in a dashboard field. */
function siteUrl(): string {
  const raw = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (!raw) return FALLBACK_SITE_URL;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

const itemSchema = z.object({
  slug: z.string().min(1),
  productType: z.literal("tapstitch"),
  sizeLabel: z.string().min(1),
  price: z.number().nonnegative(),
  qty: z.number().int().positive(),
  /** Which bundle instance this line belongs to, if any. Purely a grouping
   * key — the price it implies is recomputed from the catalogue below, so a
   * made-up id buys nothing. */
  bundleId: z.string().max(64).optional(),
  bundleSlug: z.string().max(64).optional(),
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
      resolved.push({
        product,
        sizeLabel: item.sizeLabel,
        qty: item.qty,
        bundleId: item.bundleId,
        bundleSlug: item.bundleSlug,
      });
    }

    // Bundles recomputed server-side. A group that does not validate — wrong
    // count, a product not in the bundle, a repeat where the bundle wants
    // four different designs — is silently ignored and its lines are charged
    // in full. Tampering can only ever cost the customer more.
    const bundleLines = resolved.map((r) => ({
      slug: r.product.slug,
      qty: r.qty,
      bundleId: r.bundleId,
      bundleSlug: r.bundleSlug,
    }));
    const bundlesOff = bundleDiscount(bundleLines);
    const grossSubtotal = resolved.reduce((sum, r) => sum + r.product.price * r.qty, 0);

    // ORDER MATTERS. The promo code discounts what the customer is already
    // being charged — the price after any bundle — not the list price. Taking
    // both off the gross made them stack: 99% of €200 plus the €25 a pack
    // already saves is €223 of discount on a €200 order, which capped out at
    // exactly zero and made Stripe refuse the session outright. The friends
    // code failed worse than that: it charged €49 for four tees costing €93
    // to make and post, which is the one thing pricing at cost exists to
    // prevent.
    const promoDiscount = computeDiscount(
      data.promoCode,
      resolved.map((r) => ({ price: r.product.price, qty: r.qty, slug: r.product.slug })),
      grossSubtotal - bundlesOff,
    );

    // Capped at the subtotal so the two together can never make the garments
    // free and then start eating the postage.
    const discount = Math.min(grossSubtotal, promoDiscount + bundlesOff);

    let stripe;
    try {
      stripe = getStripe();
    } catch (err) {
      return {
        configured: false,
        reason: err instanceof Error ? err.message : "Payment isn't connected yet.",
      };
    }

    const subtotal = grossSubtotal;
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
          images: absoluteImages(r.product.images),
        },
      },
    }));

    // Recomputed here from the resolved lines, never taken from the client.
    // Deliberately outside `factor`: a code discounts the clothes, and the
    // postage only if that code says so explicitly.
    // A bundle's price includes its postage, so it pays for the parcel its
    // own garments travel in. Anything loose alongside it is then charged
    // only the marginal cost of adding it to the same parcel, not a second
    // full base rate and not nothing.
    //
    // EXCEPT at cost price. A bundle can absorb postage because it is sold
    // with a margin; an order priced at what the garments cost to make has
    // nothing to absorb it with, so a friends order pays the real postage on
    // everything in the parcel. Otherwise the code that exists specifically
    // to never lose money quietly loses the postage on every bundle.
    const totalQty = resolved.reduce((sum, r) => sum + r.qty, 0);
    const fullShipping = isCostPriceCode(data.promoCode)
      ? computeShipping(totalQty)
      : shippingAfterBundles(bundleLines);
    const shipping = Math.max(
      0,
      fullShipping - computeShippingDiscount(data.promoCode, fullShipping),
    );
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

    // Note the `< 0.5` rather than `> 0 && < 0.5`: an order that comes to
    // exactly nothing is not a free gift, it is a Stripe session that cannot
    // be created, and it used to be reachable by putting a discount code on a
    // package deal. Refusing it with an explanation beats an opaque failure
    // at the payment step.
    const payable = Math.max(0, subtotal - discount) + shipping;
    if (payable < 0.5) {
      return {
        configured: false,
        reason:
          "This order comes to less than the 50c minimum a card payment can take. Remove the discount code, or add another item.",
      };
    }

    const metadata: CheckoutSessionMetadata = {
      itemsJson: encodeOrderLines(
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
        // This Stripe account also serves another shop, so the account-level
        // business name cannot correctly label both. Naming the charge per
        // session means an Another Punk order reads as Another Punk on the
        // customer's statement whatever the account is called — and renaming
        // the account for one shop stops mislabelling the other.
        //
        // The suffix is what follows the account's own prefix on a card
        // statement; Stripe caps the whole descriptor at 22 characters and
        // rejects <>\"' outright. An unrecognised statement line is one of
        // the most common causes of a chargeback, so this is worth the two
        // fields it costs.
        payment_intent_data: {
          description: "Another Punk — anotherpunk.com",
          statement_descriptor_suffix: "ANOTHERPUNK",
        },
        line_items: lineItems,
        metadata: metadata as unknown as Record<string, string>,
        // Stripe's own address element — a real country/postal-format-aware
        // form. The webhook treats THIS as the shipping-of-record, not the
        // free-text fields above.
        shipping_address_collection: {
          // Same list the checkout's country picker is built from, so the
          // form can never offer somewhere Stripe will refuse.
          allowed_countries: SHIPPING_COUNTRIES.map(
            (c) => c.code,
          ) as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection["allowed_countries"],
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
