import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
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
          // Structural facts only. Never the key, never a fragment of it.
          ...(() => {
            const k = process.env.STRIPE_SECRET_KEY ?? "";
            return {
              keyLength: k.length,
              keyPrefixLooksRight: /^(sk|rk)_(live|test)_/.test(k),
              keyIsAllLegalHeaderChars: /^[\x21-\x7E]*$/.test(k),
              keyHasInnerWhitespace: /\s/.test(k),
              keyHasNonAscii: /[^\x00-\x7F]/.test(k),
              keyCharCodesOutsideRange: [...k]
                .map((c, i) => (c.charCodeAt(0) < 0x21 || c.charCodeAt(0) > 0x7e ? i : -1))
                .filter((i) => i >= 0)
                .slice(0, 5),
            };
          })(),
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

        out.sdkVersion = (Stripe as unknown as { PACKAGE_VERSION?: string }).PACKAGE_VERSION ?? null;
        out.hasFetchClientFactory = typeof Stripe.createFetchHttpClient === "function";

        // Authenticated raw call. Status only — never the body. 200 proves
        // the key itself is good and reachable without the SDK in the way.
        try {
          const r = await fetch("https://api.stripe.com/v1/prices?limit=1", {
            headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY?.trim()}` },
          });
          out.authedRawFetch = r.status;
        } catch (e) {
          out.authedRawFetch = `threw ${e instanceof Error ? e.name : "unknown"}: ${
            e instanceof Error
              ? e.message.replace(/[a-z]{2}_(live|test)_[A-Za-z0-9]+/g, "[redacted]").slice(0, 160)
              : ""
          }`;
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
