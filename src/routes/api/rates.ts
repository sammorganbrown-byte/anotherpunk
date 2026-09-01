import { createFileRoute } from "@tanstack/react-router";

/** Exchange rates for the display-only currency switcher.
 *
 * Proxied through this origin rather than fetched from the browser directly.
 * Three reasons, in order of how likely they are to bite:
 *
 *   - ad blockers and privacy extensions routinely block unfamiliar API
 *     domains, which would silently strip the feature for a slice of visitors
 *   - the upstream host redirects, and a cross-origin redirect is not
 *     followed by a browser fetch without correct CORS on the redirect itself
 *   - one server-side cache serves everyone, instead of every visitor hitting
 *     a third party on their first page view
 *
 * Rates are the ECB daily reference rates, republished by frankfurter.dev.
 * They are for reading prices only — every charge is made in euros.
 */

const UPSTREAM = "https://api.frankfurter.dev/v1/latest?base=EUR";

// The ECB publishes once per working day, so an hour is already far finer
// than the data changes. Held in module scope, which on a serverless host
// means per warm instance — good enough for a cache whose only job is to
// avoid hammering a free endpoint.
const TTL_MS = 60 * 60 * 1000;
let cache: { at: number; body: string } | null = null;

export const Route = createFileRoute("/api/rates")({
  server: {
    handlers: {
      GET: async () => {
        const headers = {
          "content-type": "application/json",
          // Let the CDN hold it too, and keep serving the old copy while a
          // new one is fetched, so a slow upstream never blocks a page.
          "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
        };

        if (cache && Date.now() - cache.at < TTL_MS) {
          return new Response(cache.body, { headers });
        }

        try {
          const res = await fetch(UPSTREAM, { redirect: "follow" });
          if (!res.ok) throw new Error(`upstream ${res.status}`);
          const data = (await res.json()) as { date?: string; rates?: Record<string, number> };
          if (!data?.rates || typeof data.date !== "string") throw new Error("unexpected shape");
          const body = JSON.stringify({ date: data.date, rates: data.rates });
          cache = { at: Date.now(), body };
          return new Response(body, { headers });
        } catch {
          // A stale copy beats no prices; otherwise say so plainly and let
          // the client stay in euros. Never invent a rate.
          if (cache) return new Response(cache.body, { headers });
          return new Response(JSON.stringify({ error: "rates unavailable" }), {
            status: 503,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
