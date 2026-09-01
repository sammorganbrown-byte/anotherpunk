#!/usr/bin/env node
/**
 * Look up a Shopify product and print the ids the catalogue needs.
 *
 * Reads credentials from .env.local and never prints them. Output is only the
 * product id, the per-size variant ids and the price — i.e. exactly what goes
 * into another-punk-products.ts, and nothing that would be unsafe in a log.
 *
 *   node scripts/shopify-find-product.mjs jersey
 *
 * The argument is matched loosely against product titles, so a fragment is
 * enough. With no argument it lists every product, which is the quickest way
 * to find something whose exact name you cannot remember.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  let text;
  try {
    text = readFileSync(resolve(root, ".env.local"), "utf8");
  } catch {
    console.error("No .env.local found. Create it with SHOPIFY_STORE_DOMAIN,");
    console.error("SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET.");
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
  console.error("Missing SHOPIFY_STORE_DOMAIN (e.g. your-store.myshopify.com).");
  process.exit(1);
}

const API = "2026-07";

/** Two ways in, because the credentials live in different places depending on
 * how the app was created. A custom app in the store admin hands you a single
 * Admin API access token (shpat_...); an app made in the Dev Dashboard hands
 * you a client id and secret to exchange. Either is fine here — take whichever
 * you can actually find. */
let token = env.SHOPIFY_ADMIN_TOKEN;
if (!token) {
  const clientId = env.SHOPIFY_CLIENT_ID;
  const clientSecret = env.SHOPIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("Need either SHOPIFY_ADMIN_TOKEN, or SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET.");
    process.exit(1);
  }
  const tokenRes = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });
  if (!tokenRes.ok) {
    // Deliberately does not echo the body, which can repeat the client id back.
    console.error(`Token exchange failed: HTTP ${tokenRes.status}`);
    process.exit(1);
  }
  ({ access_token: token } = await tokenRes.json());
}

const res = await fetch(`https://${domain}/admin/api/${API}/products.json?limit=250`, {
  headers: { "X-Shopify-Access-Token": token },
});
if (!res.ok) {
  console.error(`Product list failed: HTTP ${res.status}`);
  process.exit(1);
}
const { products } = await res.json();

const needle = (process.argv[2] || "").toLowerCase();
const matches = needle
  ? products.filter((p) => p.title.toLowerCase().includes(needle))
  : products;

if (!matches.length) {
  console.log(`No product title contains "${process.argv[2]}". All titles:`);
  for (const p of products) console.log("  -", p.title);
  process.exit(0);
}

for (const p of matches) {
  console.log(`\n${p.title}`);
  console.log(`  shopifyProductId: "${p.id}",`);
  console.log(`  shopifyVariantIds: {`);
  for (const v of p.variants) {
    console.log(`    "${v.title}": "${v.id}",   // ${v.price}`);
  }
  console.log(`  },`);
}
