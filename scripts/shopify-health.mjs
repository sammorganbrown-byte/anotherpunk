#!/usr/bin/env node
/**
 * Does every product we sell still exist where it gets made?
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 * On 3 Sep, Saucer Oversized had gone missing from Tapstitch — deleted by
 * accident. Shopify still carried the product and our ids still resolved, so
 * the site went on selling both colourways at €40 with nothing at the other
 * end to make them. It was found only because a unit cost was missing and
 * somebody went looking.
 *
 * That is the worst failure a shop has, and it is silent by construction:
 * the money is taken, the draft order is created, the customer is thanked,
 * and the garment is never made. Nothing raises a hand. Every other check in
 * this repo runs at build time against our own files; this is the only one
 * that asks whether the outside world still agrees with them.
 *
 * WHAT IT CANNOT DO. It checks the catalogue against SHOPIFY, which is the
 * bridge — not against Tapstitch, which is the factory and has no API here.
 * A product deleted in Tapstitch while its Shopify product survives is
 * exactly the Saucer case and this script would still pass it. What it
 * catches is the larger family: ids that have gone stale, products archived
 * or drafted out from under us, sizes on sale with no variant behind them,
 * and variant ids pointing at the wrong garment. Treat a clean run as "the
 * bridge is intact", not "everything is makeable" — then spot-check
 * Tapstitch by eye.
 *
 *   node scripts/shopify-health.mjs
 *
 * Exits non-zero if anything CRITICAL is found, so it can be wired into CI
 * or a pre-deploy step later. Prints titles and ids only — never
 * credentials, never an error body, which on this API can echo the client id
 * back.
 */
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* Read the real catalogue rather than regex over it. A regex would drift the
   first time the file's shape changed, and drift silently — which is the
   failure mode this whole script exists to remove. */
const src = resolve(root, "src/lib/another-punk-products.ts");
const tmp = resolve(root, "node_modules/.ap-catalogue.mjs");
const { code } = await transform(readFileSync(src, "utf8"), { loader: "ts", format: "esm" });
writeFileSync(tmp, code);
let ANOTHER_PUNK_PRODUCTS;
try {
  ({ ANOTHER_PUNK_PRODUCTS } = await import(pathToFileURL(tmp).href));
} finally {
  try { unlinkSync(tmp); } catch {}
}

const env = Object.fromEntries(
  readFileSync(resolve(root, ".env.local"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
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
const H = { "X-Shopify-Access-Token": token };

/* status must be listed explicitly. `status=any` is NOT a valid value here:
   it returns HTTP 200 with an EMPTY product list, which made an early version
   of this script report all 17 products as missing. A filter that silently
   matches nothing is the exact failure this file is meant to catch, so it is
   worth naming. Archived and draft are wanted: a product quietly archived out
   from under us is a real fault, and omitting them would hide it as "does not
   exist" instead of naming what actually happened. */
const STATUS = "active,archived,draft";
const pr = await fetch(`https://${domain}/admin/api/${API}/products.json?limit=250&status=${STATUS}`, { headers: H });
if (!pr.ok) { console.error(`Product list failed: HTTP ${pr.status}`); process.exit(1); }
const { products } = await pr.json();
const byId = new Map(products.map((p) => [String(p.id), p]));

const critical = [], warning = [];
const crit = (slug, msg) => critical.push(`  ✗ ${slug.padEnd(22)} ${msg}`);
const warn = (slug, msg) => warning.push(`  · ${slug.padEnd(22)} ${msg}`);

/* A variant id used by two different products, or by two sizes of one, means
   somebody copied a block and forgot to change it — and it ships the wrong
   garment or the wrong size, silently, forever. */
const variantOwners = new Map();

for (const p of ANOTHER_PUNK_PRODUCTS) {
  const { slug, sizes = [], shopifyProductId: pid, shopifyVariantIds: vids = {} } = p;

  if (pid == null) {
    warn(slug, "no Shopify product — cannot be fulfilled (the order builder refuses it)");
    continue;
  }

  const sp = byId.get(String(pid));
  if (!sp) { crit(slug, `Shopify product ${pid} DOES NOT EXIST`); continue; }
  if (sp.status !== "active") crit(slug, `Shopify product ${pid} is ${sp.status.toUpperCase()}, not active — "${sp.title}"`);

  const live = new Map(sp.variants.map((v) => [String(v.id), v]));

  for (const size of sizes) {
    const vid = vids[size];
    if (!vid) { crit(slug, `size ${size} is on sale with no variant id`); continue; }
    if (!live.has(String(vid))) crit(slug, `size ${size} → variant ${vid} is not on Shopify product ${pid}`);
    const key = String(vid), prev = variantOwners.get(key);
    if (prev) crit(slug, `size ${size} shares variant ${vid} with ${prev}`);
    else variantOwners.set(key, `${slug}/${size}`);
  }

  for (const size of Object.keys(vids)) {
    if (!sizes.includes(size)) warn(slug, `variant mapped for ${size}, which is not in sizes — dead entry`);
  }
}

/* Images. A product delisted from the catalogue leaves the field on its own,
   because the field is derived from ANOTHER_PUNK_PRODUCTS — but the field
   also carries a hand-written ATMOSPHERE list of paths that nothing derives,
   and a broken path there is a hole in the page nobody would notice from the
   code. Same for any local product image. Remote CloudFront images are
   Higgsfield's storage and cannot be checked from here; they are counted so
   the number stays visible rather than forgotten. */
let remote = 0;
for (const p of ANOTHER_PUNK_PRODUCTS) {
  for (const src of p.images ?? []) {
    if (/^https?:/.test(src)) { remote++; continue; }
    if (!existsSync(resolve(root, "public", src.replace(/^\//, "")))) crit(p.slug, `image missing from disk: ${src}`);
  }
  for (const src of p.notInField ?? []) {
    if (!(p.images ?? []).includes(src)) warn(p.slug, `notInField lists ${src}, which is not one of its images — dead entry`);
  }
}
const atmos = [...readFileSync(resolve(root, "src/components/redesign/rd-constellation.tsx"), "utf8")
  .matchAll(/src:\s*"(\/img\/[^"]+)"/g)].map((m) => m[1]);
for (const src of atmos) {
  if (!existsSync(resolve(root, "public", src.replace(/^\//, "")))) crit("field/atmosphere", `image missing from disk: ${src}`);
}

/* The reverse direction. An active Shopify product nothing references is the
   shape of thing that gets archived — harmless, but it is also how a
   half-finished migration looks, so it is worth seeing. */
const referenced = new Set(ANOTHER_PUNK_PRODUCTS.map((p) => String(p.shopifyProductId)).filter((x) => x !== "null"));
const orphans = products.filter((p) => p.status === "active" && !referenced.has(String(p.id)));

const n = ANOTHER_PUNK_PRODUCTS.length;
console.log(`\nAnother Punk — catalogue health\n${n} products, ${referenced.size} distinct Shopify products, ${variantOwners.size} variants\n${atmos.length} atmosphere frames, ${remote} product images still on Higgsfield\u2019s CDN rather than in the repo\n`);
if (critical.length) console.log(`CRITICAL — money can be taken for these\n${critical.join("\n")}\n`);
if (warning.length) console.log(`Worth knowing\n${warning.join("\n")}\n`);
if (orphans.length) {
  console.log(`Active in Shopify, unused by the catalogue (archive candidates)`);
  for (const p of orphans) console.log(`  · ${String(p.id).padEnd(16)} "${p.title}"`);
  console.log();
}
if (!critical.length && !warning.length) console.log("All clear. The bridge is intact — now go and eyeball Tapstitch.\n");
process.exit(critical.length ? 1 : 0);
