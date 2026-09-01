import { createFileRoute } from "@tanstack/react-router";

/** TEMPORARY. Structural check on the webhook signing secret.
 *
 * A signature failure has exactly two causes — wrong secret, or a body that
 * was not passed through verbatim — and the handler already reads the raw
 * body, so this looks at the secret. It reports length, prefix and character
 * legality only. Never the value, never a fragment of it. Delete once the
 * webhook succeeds.
 */
export const Route = createFileRoute("/api/diag")({
  server: {
    handlers: {
      GET: async () => {
        const raw = process.env.STRIPE_WEBHOOK_SECRET ?? "";
        const trimmed = raw.trim();
        return new Response(
          JSON.stringify(
            {
              present: raw.length > 0,
              length: raw.length,
              // A live signing secret is "whsec_" plus base64-ish characters.
              prefixLooksRight: /^whsec_/.test(trimmed),
              allLegalChars: /^[\x21-\x7E]*$/.test(trimmed),
              hasNonAscii: /[^\x00-\x7F]/.test(trimmed),
              // 8226 is the bullet character that masked the API key.
              containsBullets: raw.includes("•"),
              neededTrimming: raw !== trimmed,
              // Fulfilment runs on the server too, and needs its own
              // credentials there — presence only, never values.
              shopify: {
                domain: Boolean(process.env.SHOPIFY_STORE_DOMAIN),
                clientId: Boolean(process.env.SHOPIFY_CLIENT_ID),
                clientSecret: Boolean(process.env.SHOPIFY_CLIENT_SECRET),
                adminToken: Boolean(process.env.SHOPIFY_ADMIN_TOKEN),
              },
              // Where it looks wrong, which positions — never which characters.
              illegalPositions: [...trimmed]
                .map((c, i) => (c.charCodeAt(0) < 0x21 || c.charCodeAt(0) > 0x7e ? i : -1))
                .filter((i) => i >= 0)
                .slice(0, 6),
            },
            null,
            2,
          ),
          { headers: { "content-type": "application/json", "cache-control": "no-store" } },
        );
      },
    },
  },
});
