// Tapstitch fulfillment, reached through a HEADLESS Shopify bridge.
//
// The customer never sees Shopify or Tapstitch. They pay through this
// site's own Stripe checkout; this module then creates an order in a
// backend Shopify store that Tapstitch's Shopify app watches, and Tapstitch
// produces and ships it.
//
// AUTH — client credentials, not a static token. Shopify changed custom
// apps on 1 Jan 2026: apps are created in the Dev Dashboard and no longer
// expose a long-lived `shpat_` token in the admin. Instead the app exchanges
// its client id + secret for a short-lived access token (24h) at
// /admin/oauth/access_token. Tokens are cached in module scope and refreshed
// a few minutes before expiry — a cold serverless instance simply mints a
// new one, which is cheap.
//
// HOLD BEFORE PRODUCTION — createTapstitchOrder creates a DRAFT order.
// Tapstitch's app does not see a draft, so nothing is produced by that call
// alone. submitTapstitchOrder completes the draft into a real order, and
// that is the moment production starts. Keeping those as two steps is
// deliberate: it means a bug in the payment path can never silently print
// and ship garments.

import { getAnotherPunkProduct, isFulfillable, type ApSize } from "./another-punk-products";

const SHOPIFY_API_VERSION = "2026-07";

export type TapstitchOrderLine = {
  /** Site-side product slug, resolved against the Another Punk catalogue. */
  slug: string;
  /** Size label as shown on the product page ("M", "2XL", …). */
  sizeLabel: string;
  qty: number;
};

export type ShippingAddress = {
  name: string;
  email?: string;
  address: string;
  addressLine2?: string;
  city: string;
  stateOrCounty?: string;
  postalCode: string;
  /** ISO 3166-1 alpha-2, e.g. "US", "GB", "PT". */
  country: string;
};

/** A Shopify-safe tag: at most 40 characters, keeping the distinctive tail.
 * Anything already short enough is returned untouched. */
function shortTag(reference: string): string {
  if (reference.length <= 40) return reference;
  return `stripe-${reference.slice(-24)}`;
}

function storeDomain(): string {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!domain) {
    throw new Error(
      'Tapstitch bridge is not connected — set SHOPIFY_STORE_DOMAIN (e.g. "your-store.myshopify.com").',
    );
  }
  return domain;
}

// --- Access token ----------------------------------------------------------

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  // 60s of headroom so a token can't expire mid-request.
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Tapstitch bridge is not connected — set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET " +
        "(from the Shopify Dev Dashboard app; it needs write_draft_orders, write_orders and read_products).",
    );
  }

  const response = await fetch(`https://${storeDomain()}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    throw new Error(`Shopify token exchange failed (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    throw new Error("Shopify token exchange returned no access_token.");
  }

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

async function shopifyFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`https://${storeDomain()}/admin/api/${SHOPIFY_API_VERSION}${path}`, {
    ...init,
    headers: {
      "X-Shopify-Access-Token": await accessToken(),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

// --- Orders ----------------------------------------------------------------

type ShopifyDraftOrderResponse = {
  draft_order?: { id: number; name: string };
  errors?: unknown;
};

/** Creates a HELD Shopify draft order. Tapstitch's app cannot see a draft,
 * so nothing is produced until submitTapstitchOrder completes it.
 *
 * Throws rather than skipping if any line can't be resolved to a real
 * variant — never silently drop or substitute a line item somebody paid
 * for. */
export async function createTapstitchOrder(
  lines: TapstitchOrderLine[],
  address: ShippingAddress,
  orderReference: string,
): Promise<{ id: string }> {
  if (lines.length === 0) {
    throw new Error("createTapstitchOrder called with no line items.");
  }

  const lineItems = lines.map((line) => {
    const product = getAnotherPunkProduct(line.slug);
    if (!product) {
      throw new Error(`Unknown Another Punk product in order: "${line.slug}".`);
    }
    if (!isFulfillable(product)) {
      throw new Error(
        `"${product.title}" is not currently fulfillable — it has no Shopify product mapped.`,
      );
    }
    const variantId = product.shopifyVariantIds[line.sizeLabel as ApSize];
    if (!variantId) {
      throw new Error(`"${product.title}" has no Shopify variant for size "${line.sizeLabel}".`);
    }
    return {
      variant_id: Number(variantId),
      quantity: line.qty,
      // NO price override here, deliberately. It was tried and it does not
      // work: a draft-order line that carries a variant_id always keeps the
      // variant's own price, and Shopify silently discards the price you
      // send (verified against the live API — sent 50.00 for a variant
      // priced 35.00, the draft stored 35.00 with no error). Overriding
      // would need write_products, which this app does not have.
      //
      // The variant_id has to stay: it is how Tapstitch knows which garment
      // to print. So the Shopify order's value is the backend catalogue
      // price, NOT what the customer paid. Stripe is the source of truth
      // for revenue; the amount actually charged goes in the note below so
      // an order can still be reconciled.
    };
  });

  const chargedTotal = lines.reduce((sum, line) => {
    const product = getAnotherPunkProduct(line.slug);
    return sum + (product ? product.price * line.qty : 0);
  }, 0);

  const body = {
    draft_order: {
      line_items: lineItems,
      email: address.email,
      // Tag with the Stripe reference so an order can always be traced back
      // to the payment that created it.
      // Shopify caps a tag at 40 characters and rejects the whole draft
      // order if one is longer — a Stripe session id alone is 66, so the
      // reference has to be shortened for the tag. The tail is kept rather
      // than the head: session ids share a long "cs_live_" prefix and differ
      // at the end, so the last 24 characters are what actually identify the
      // order. The full reference still goes in the note below, untruncated,
      // which is where anyone looking for it would read it.
      tags: `another-punk,${shortTag(orderReference)}`,
      // Carries the real charged total, because the line-item prices above
      // cannot be made to reflect it.
      note: `Another Punk — ${orderReference} — customer paid ${chargedTotal.toFixed(2)} EUR via Stripe`,
      shipping_address: {
        first_name: address.name.split(" ")[0] ?? address.name,
        last_name: address.name.split(" ").slice(1).join(" ") || "-",
        address1: address.address,
        address2: address.addressLine2 ?? "",
        city: address.city,
        province: address.stateOrCounty ?? "",
        zip: address.postalCode,
        country_code: address.country.toUpperCase(),
      },
      // Don't let Shopify email the customer — they already got a receipt
      // from this site's own Stripe checkout.
      use_customer_default_address: false,
    },
  };

  const response = await shopifyFetch("/draft_orders.json", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as ShopifyDraftOrderResponse;
  if (!response.ok || !data.draft_order) {
    throw new Error(`Shopify draft order failed (${response.status}): ${JSON.stringify(data)}`);
  }
  return { id: String(data.draft_order.id) };
}

/** Completes the held draft into a real Shopify order — the moment
 * Tapstitch's app sees it and production starts.
 *
 * payment_pending: false marks it paid with no Shopify payment attached,
 * because payment already happened through this site's Stripe checkout. */
export async function submitTapstitchOrder(draftOrderId: string): Promise<void> {
  const response = await shopifyFetch(
    `/draft_orders/${draftOrderId}/complete.json?payment_pending=false`,
    { method: "PUT" },
  );
  if (!response.ok) {
    throw new Error(
      `Shopify draft order complete failed (${response.status}): ${await response.text()}`,
    );
  }
}
