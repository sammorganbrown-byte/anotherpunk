// Real Stripe integration using Checkout Sessions (the hosted page), not
// Stripe Elements — the client never touches a publishable key or Stripe.js.
// The server creates a Session and returns its `url`; the browser just
// redirects there.
//
// Fulfillment (the real Tapstitch order) happens from the WEBHOOK
// (checkout.session.completed), never from the success-page redirect: that
// redirect URL is reachable by anyone and is not proof payment succeeded.
// The webhook is server-to-server and signed.
//
// STRIPE_SECRET_KEY is read inside the function rather than at module scope
// so it resolves per-request on any host.

import Stripe from "stripe";

export function getStripe(): Stripe {
  // Trimmed, and not merely for tidiness. A key pasted into a host's env UI
  // can arrive with a trailing newline or space, and that character makes the
  // Authorization header it is interpolated into an illegal header value —
  // fetch throws TypeError before the request is ever sent. The SDK reports
  // that as "An error occurred with our connection to Stripe", which reads
  // like a network fault and sent this looking at egress, runtimes and HTTP
  // clients for far too long. An unauthenticated fetch to the same host
  // returning 401 while an authenticated one threw is what gave it away.
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("Stripe is not connected yet — set STRIPE_SECRET_KEY to enable payment.");
  }
  return new Stripe(key, {
    // The SDK defaults to Node's http module, which is not available in every
    // serverless runtime a build like this can land on. When it is missing,
    // every API call fails as "An error occurred with our connection to
    // Stripe. Request was retried 2 times" — a connection error rather than
    // an auth error, which is what made it look like a network or key
    // problem. fetch exists in both runtimes, so this works either way.
    httpClient: Stripe.createFetchHttpClient(),
    // Retries are the SDK's own; two extra attempts on a transient failure,
    // and a timeout well inside a serverless function's budget so a hanging
    // request fails with something we can report rather than being killed.
    maxNetworkRetries: 2,
    timeout: 20_000,
  });
}

export type CheckoutLineItem = {
  slug: string;
  sizeLabel: string;
  qty: number;
};

/** Everything the webhook needs to place the Tapstitch order once Stripe
 * confirms payment, packed into the Session's metadata.
 *
 * Stripe caps each metadata VALUE at 500 characters. `itemsJson` is the one
 * that can grow with cart size — roughly 20 lines before it's at risk. If
 * this range ever grows enough for that to bite, the fix is to persist the
 * order server-side and put only its id here, not to widen this. */
export type CheckoutSessionMetadata = {
  itemsJson: string;
  promoCode: string;
  name: string;
  email: string;
  address: string;
  addressLine2: string;
  city: string;
  stateOrCounty: string;
  postalCode: string;
  country: string;
};
