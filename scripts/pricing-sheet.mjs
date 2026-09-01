#!/usr/bin/env node
/**
 * Build a pricing sheet: site price vs Shopify price vs cost per item, with
 * margin, for every product in the catalogue.
 *
 * Cost comes from Shopify's inventory item "cost per item" field, which is
 * only populated if someone filled it in — a blank cost is reported as
 * unknown rather than guessed at or treated as zero, because a made-up cost
 * is worse than a missing one when the point is to set prices.
 *
 * Reads credentials from .env.local and never prints them.
 *
 *   node scripts/pricing-sheet.mjs            # table
 *   node scripts/pricing-sheet.mjs --csv      # csv, for a spreadsheet
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const API = "2026-07";
const CSV = process.argv.includes("--csv");

function loadEnv() {
  let text;
  try {
    text = readFileSync(resolve(root, ".env.local"), "utf8");
  } catch {
    console.error("No .env.local. Needs SHOPIFY_STORE_DOMAIN plus either");
    console.error("SHOPIFY_ADMIN_TOKEN or SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET.");
    process.exit(1);
  }
  const env = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const domain = env.SHOPIFY_STORE_DOMAIN;
if (!domain) {
  console.error("Missing SHOPIFY_STORE_DOMAIN.");
  process.exit(1);
}

let token = env.SHOPIFY_ADMIN_TOKEN;
if (!token) {
  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.SHOPIFY_CLIENT_ID,
      client_secret: env.SHOPIFY_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) {
    console.error(`Token exchange failed: HTTP ${res.status}`);
    process.exit(1);
  }
  ({ access_token: token } = await res.json());
}

/** `soft` endpoints return null on a permission error instead of exiting, so
 * a missing scope costs you one column rather than the whole sheet. */
const api = async (path, soft = false) => {
  const r = await fetch(`https://${domain}/admin/api/${API}${path}`, {
    headers: { "X-Shopify-Access-Token": token },
  });
  if (!r.ok) {
    if (soft) return null;
    console.error(`${path.split("?")[0]} failed: HTTP ${r.status}`);
    process.exit(1);
  }
  return r.json();
};

// The site's own catalogue, so the sheet covers what is actually for sale
// rather than everything sitting in Shopify.
const cat = readFileSync(resolve(root, "src/lib/another-punk-products.ts"), "utf8");
const site = [];
for (const m of cat.matchAll(/slug: "([a-z0-9-]+)",([\s\S]*?)\n {2}\},/g)) {
  const body = m[2];
  const title = (body.match(/title: "([^"]+)"/) || [])[1];
  const priceRef = (body.match(/price: ([A-Za-z_]+|\d+)/) || [])[1];
  const pid = (body.match(/shopifyProductId: (?:null|"(\d+)")/) || [])[1] || null;
  site.push({ slug: m[1], title, priceRef, pid });
}
const consts = Object.fromEntries(
  [...cat.matchAll(/export const ([A-Z_]+) = (\d+);/g)].map((m) => [m[1], Number(m[2])]),
);
site.forEach((s) => {
  s.price = /^\d+$/.test(s.priceRef) ? Number(s.priceRef) : consts[s.priceRef];
});

const { products } = await api("/products.json?limit=250");
const byId = new Map(products.map((p) => [String(p.id), p]));

// Costs live on inventory items, one hop away from variants.
const invIds = [
  ...new Set(
    site.flatMap((s) => (byId.get(s.pid)?.variants ?? []).map((v) => v.inventory_item_id)),
  ),
].filter(Boolean);
const costs = new Map();
let costScope = true;
// Shopify caps how many inventory items it returns per call, and asking for
// more than it will give back silently returns a short list rather than an
// error — which shows up as products with "no cost" that plainly have one.
// Batches of 50, and the count is checked below.
for (let i = 0; i < invIds.length; i += 50) {
  const res = await api(`/inventory_items.json?ids=${invIds.slice(i, i + 50).join(",")}`, true);
  if (!res) {
    costScope = false;
    break;
  }
  for (const it of res.inventory_items) costs.set(it.id, it.cost == null ? null : Number(it.cost));
}

const rows = site.map((s) => {
  const p = byId.get(s.pid);
  const variants = p?.variants ?? [];
  const shopifyPrice = variants.length ? Number(variants[0].price) : null;
  const cs = variants.map((v) => costs.get(v.inventory_item_id)).filter((c) => c != null);
  const cost = cs.length ? Math.max(...cs) : null;
  const margin = cost == null ? null : s.price - cost;
  return {
    product: s.title,
    slug: s.slug,
    sitePrice: s.price,
    shopifyPrice,
    cost,
    margin,
    marginPct: cost == null || !s.price ? null : Math.round((margin / s.price) * 100),
    variants: variants.length,
  };
});

if (CSV) {
  console.log("product,slug,site_price_eur,shopify_price,cost_per_item,margin,margin_pct,variants");
  for (const r of rows) {
    console.log(
      [
        `"${r.product}"`,
        r.slug,
        r.sitePrice ?? "",
        r.shopifyPrice ?? "",
        r.cost ?? "",
        r.margin ?? "",
        r.marginPct ?? "",
        r.variants,
      ].join(","),
    );
  }
} else {
  const f = (v, s = "") => (v == null ? "—" : `${s}${v}`);
  console.log(
    `${"product".padEnd(24)}${"site".padStart(7)}${"shopify".padStart(9)}${"cost".padStart(8)}${"margin".padStart(9)}${"%".padStart(6)}`,
  );
  for (const r of rows) {
    console.log(
      r.product.slice(0, 23).padEnd(24) +
        f(r.sitePrice, "€").padStart(7) +
        f(r.shopifyPrice, "€").padStart(9) +
        f(r.cost, "€").padStart(8) +
        f(r.margin, "€").padStart(9) +
        f(r.marginPct).padStart(6),
    );
  }
  if (!costScope) {
    console.log(
      "\ncost/margin unavailable: the Shopify app lacks read_inventory. Add that",
    );
    console.log("scope and re-run, or read Cost per item off each product in the admin.");
  } else {
    const missing = rows.filter((r) => r.cost == null);
    if (missing.length) {
      console.log(
        `\n${missing.length} of ${rows.length} have no cost per item set in Shopify: ` +
          missing.map((m) => m.slug).join(", "),
      );
    }
  }

  const zones = await api("/shipping_zones.json", true);
  console.log("\nSHIPPING");
  if (!zones) {
    console.log("  shipping zones unavailable (needs read_shipping on the app).");
  } else if (!zones.shipping_zones?.length) {
    console.log("  no shipping zones configured in Shopify.");
  } else {
    for (const z of zones.shipping_zones) {
      const where = (z.countries ?? []).map((c) => c.code).join(" ") || "—";
      console.log(`  ${z.name}: ${where}`);
      for (const r of [...(z.price_based_shipping_rates ?? []), ...(z.weight_based_shipping_rates ?? [])]) {
        console.log(`     ${r.name}: ${r.price}`);
      }
    }
  }
}
