import { createFileRoute } from "@tanstack/react-router";
import { getStripe } from "../../lib/stripe.server";

/** TEMPORARY. Distinguishes "cannot reach Stripe" from "the SDK is unhappy".
 *
 * Reports only booleans, HTTP statuses and error types. It never echoes a
 * key, a key prefix, or a response body — a diagnostic that leaks the thing
 * it is diagnosing is worse than the bug. Delete once checkout is proved.
 */
export const Route = createFileRoute("/api/diag")({
  server: {
    handlers: {
      GET: async () => {
        const out: Record<string, unknown> = {
          hasSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
          hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
          siteUrl: process.env.SITE_URL ?? null,
          runtimeHasNodeHttp: (() => {
            try {
              return typeof (globalThis as { process?: unknown }).process !== "undefined";
            } catch {
              return false;
            }
          })(),
        };

        // Plain fetch, no credentials. 401 is a PASS: it means the request
        // reached Stripe and was rejected for lack of a key.
        try {
          const r = await fetch("https://api.stripe.com/v1/charges");
          out.rawFetchToStripe = r.status;
        } catch (e) {
          out.rawFetchToStripe = `threw: ${e instanceof Error ? e.name : "unknown"}`;
        }

        // The SDK path the checkout actually uses.
        try {
          const stripe = getStripe();
          const list = await stripe.prices.list({ limit: 1 });
          out.sdkCall = `ok, ${list.data.length} price(s) visible`;
        } catch (e) {
          out.sdkCall = `${e instanceof Error ? e.constructor.name : "unknown"}: ${
            e instanceof Error ? e.message.slice(0, 120) : ""
          }`;
        }

        return new Response(JSON.stringify(out, null, 2), {
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        });
      },
    },
  },
});
