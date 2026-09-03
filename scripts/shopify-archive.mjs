#!/usr/bin/env node
/**
 * Archive a Shopify product by id.
 *
 * Archiving, never deleting: it hides the product from the store while
 * keeping the record and any order history attached to it, and it is
 * reversible from the Shopify admin. Deleting is neither.
 *
 * REFUSES TO TOUCH ANYTHING THE CATALOGUE STILL USES. Every id is checked
 * against another-punk-products.ts first, because archiving a live product
 * takes it off sale and the failure would be silent until somebody tried to
 * buy it.
 *
 *   node scripts/shopify-archive.mjs 15971630580043 15942009520459
 *
 * Prints titles and statuses only — never credentials, never an error body.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ids = process.argv.slice(2);
if (!ids.length) { console.error("Usage: shopify-archive.mjs <productId> [...]"); process.exit(1); }

const catalogue = readFileSync(resolve(root, "src/lib/another-punk-products.ts"), "utf8");
for (const id of ids) {
  if (catalogue.includes(id)) {
    console.error(`REFUSED: ${id} is still used by the catalogue. Re-point it before archiving.`);
    process.exit(1);
  }
}

const env = Object.fromEntries(
  readFileSync(resolve(root, ".env.local"), "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")]),
);
const domain = env.SHOPIFY_STORE_DOMAIN, API = "2025-01";
let token = env.SHOPIFY_ADMIN_TOKEN;
if (!token) {
  const r = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: env.SHOPIFY_CLIENT_ID, client_secret: env.SHOPIFY_CLIENT_SECRET, grant_type: "client_credentials" }),
  });
  if (!r.ok) { console.error(`Token exchange failed: HTTP ${r.status}`); process.exit(1); }
  ({ access_token: token } = await r.json());
}
const H = { "X-Shopify-Access-Token": token, "Content-Type": "application/json" };

for (const id of ids) {
  const g = await fetch(`https://${domain}/admin/api/${API}/products/${id}.json`, { headers: H });
  if (!g.ok) { console.log(`${id}  — not found (HTTP ${g.status}), nothing to archive`); continue; }
  const { product } = await g.json();
  if (product.status === "archived") { console.log(`${id}  "${product.title}" — already archived`); continue; }
  const r = await fetch(`https://${domain}/admin/api/${API}/products/${id}.json`, {
    method: "PUT", headers: H, body: JSON.stringify({ product: { id: Number(id), status: "archived" } }),
  });
  if (!r.ok) { console.log(`${id}  "${product.title}" — FAILED (HTTP ${r.status})`); continue; }
  const { product: after } = await r.json();
  console.log(`${id}  "${product.title}"  ${product.status} → ${after.status}`);
}
