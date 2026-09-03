#!/usr/bin/env node
/**
 * Print each product's unit cost from Shopify's cost-per-item field.
 *
 * The catalogue's `cost` values are supposed to come from here, and this is
 * how to check that they still do. Costs live on the InventoryItem, not the
 * variant, so the variant list is only a way of collecting inventory ids.
 *
 * Prints titles and numbers only — never credentials, never an error body,
 * which on this API can echo the client id back.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(resolve(root, ".env.local"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")]),
);
const domain = env.SHOPIFY_STORE_DOMAIN;
const API = "2025-01";
let token = env.SHOPIFY_ADMIN_TOKEN;
if (!token) {
  const r = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: env.SHOPIFY_CLIENT_ID, client_secret: env.SHOPIFY_CLIENT_SECRET, grant_type: "client_credentials" }),
  });
  if (!r.ok) { console.error(`Token exchange failed: HTTP ${r.status}`); process.exit(1); }
  ({ access_token: token } = await r.json());
}
const H = { "X-Shopify-Access-Token": token };
const pr = await fetch(`https://${domain}/admin/api/${API}/products.json?limit=250`, { headers: H });
if (!pr.ok) { console.error(`Product list failed: HTTP ${pr.status}`); process.exit(1); }
const { products } = await pr.json();
const needle = (process.argv[2] || "").toLowerCase();
const matches = needle ? products.filter((p) => p.title.toLowerCase().includes(needle)) : products;
const ids = [...new Set(matches.flatMap((p) => p.variants.map((v) => v.inventory_item_id)))];
const costs = new Map();
for (let i = 0; i < ids.length; i += 50) {
  const chunk = ids.slice(i, i + 50).join(",");
  const ir = await fetch(`https://${domain}/admin/api/${API}/inventory_items.json?ids=${chunk}`, { headers: H });
  if (!ir.ok) { console.error(`Inventory read failed: HTTP ${ir.status} — the app may lack read_inventory.`); process.exit(1); }
  const { inventory_items } = await ir.json();
  for (const it of inventory_items) costs.set(it.id, it.cost);
}
for (const p of matches) {
  const cs = [...new Set(p.variants.map((v) => costs.get(v.inventory_item_id)).filter((c) => c != null && c !== ""))];
  const price = p.variants[0]?.price;
  console.log(`${p.title}\n    retail €${price}   cost ${cs.length ? cs.map((c) => "€" + c).join(" / ") : "(not set)"}${cs.length === 1 ? `   markup ${(price / +cs[0]).toFixed(2)}x` : ""}`);
}
