#!/usr/bin/env node
/**
 * Cost every product out properly: garment, shipping and card fees, on one
 * line each, plus what price each would need to hit a target margin.
 *
 * The "margin" in pricing-sheet.mjs is gross margin on the garment alone —
 * useful for comparing products against each other, but it is not profit.
 * This adds the two costs that land on every real order:
 *
 *   shipping   charged at a flat rate, costs a different amount per country,
 *              so it contributes a little on cheap routes and loses a little
 *              on dear ones
 *   card fees  Stripe takes a percentage plus a fixed amount of the whole
 *              charge, shipping included
 *
 * Reads the sheets already in the repo; no network, no credentials.
 *
 *   node scripts/margin-sheet.mjs                 # single-item order, average destination
 *   node scripts/margin-sheet.mjs --qty 2         # two of the same item
 *   node scripts/margin-sheet.mjs --country IE    # a specific destination
 *   node scripts/margin-sheet.mjs --csv
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};
const CSV = process.argv.includes("--csv");
const QTY = Math.max(1, Number(arg("qty", 1)));
const COUNTRY = (arg("country", "") || "").toUpperCase();

// Kept in step with src/lib/shipping.ts by hand — it is two numbers, and a
// build step to share them across a script and a bundle is not worth it.
const SHIPPING_BASE = 9;
const SHIPPING_PER_EXTRA_ITEM = 3;
const shippingCharged = (n) => (n <= 0 ? 0 : SHIPPING_BASE + SHIPPING_PER_EXTRA_ITEM * (n - 1));

// Stripe's standard European rates. NOT read from the account — if these are
// wrong for yours, they are the only two numbers to change, and every net
// figure below moves with them.
const FEE_PCT = 0.015;
const FEE_FIXED = 0.25;

// Where orders can actually be sent, from checkout.functions.ts.
const SELLS_TO = "GB IE PT ES FR DE IT NL BE AT SE DK PL CZ US CA AU NZ".split(" ");

const rates = readFileSync(resolve(root, "shipping-rates.csv"), "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((l) => {
    const m = l.match(/^"([^"]*)","([^"]*)",([^,]*),([^,]*),/);
    return { zone: m[1], cc: m[2], one: parseFloat(m[3]), two: parseFloat(m[4]) };
  })
  .filter((r) => !Number.isNaN(r.one) && SELLS_TO.includes(r.cc));

/** Tapstitch quotes one and two items. Beyond two, the marginal cost of the
 * second is repeated rather than guessed at — it is the only evidence there
 * is, and it is the right shape (per shipment, not per garment). */
function shippingCost(cc, n) {
  const r = rates.find((x) => x.cc === cc);
  if (!r) return null;
  if (n <= 1) return r.one;
  return r.two + (n - 2) * (r.two - r.one);
}
const avgShippingCost = (n) =>
  rates.reduce((s, r) => s + shippingCost(r.cc, n), 0) / rates.length;

const shipCost = COUNTRY ? shippingCost(COUNTRY, QTY) : avgShippingCost(QTY);
if (COUNTRY && shipCost == null) {
  console.error(`No rate for ${COUNTRY}. Ships to: ${SELLS_TO.join(" ")}`);
  process.exit(1);
}
const where = COUNTRY || "average destination";

const products = readFileSync(resolve(root, "pricing-sheet.csv"), "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((l) => {
    const m = l.match(/^"([^"]*)",([^,]*),([^,]*),[^,]*,([^,]*),/);
    return { name: m[1], slug: m[2], price: Number(m[3]), cost: Number(m[4]) };
  })
  .filter((p) => p.price && p.cost);

const ship = shippingCharged(QTY);
const rows = products.map((p) => {
  const revenue = p.price * QTY + ship;
  const fee = revenue * FEE_PCT + FEE_FIXED;
  const cost = p.cost * QTY + shipCost + fee;
  const net = revenue - cost;
  return { ...p, revenue, fee, shipCost, net, pct: (net / revenue) * 100 };
});

// What each would have to sell for to clear a target, holding everything else
// still. Solved rather than guessed, because the fee is a percentage of the
// price you are solving for.
function priceForMargin(cost, target) {
  const t = target / 100;
  // net = (q*P + ship) - (q*cost + shipCost + (q*P + ship)*FEE_PCT + FEE_FIXED)
  // and net = t * (q*P + ship). Solve for P.
  const k = 1 - FEE_PCT - t;
  const P = (QTY * cost + shipCost + FEE_FIXED - ship * k) / (QTY * k);
  return P;
}

if (CSV) {
  console.log("product,slug,price_eur,garment_cost,shipping_charged,shipping_cost,card_fee,net_profit,net_margin_pct");
  for (const r of rows) {
    console.log(
      [`"${r.name}"`, r.slug, r.price, r.cost.toFixed(2), ship, r.shipCost.toFixed(2),
       r.fee.toFixed(2), r.net.toFixed(2), r.pct.toFixed(1)].join(","),
    );
  }
} else {
  console.log(`ONE ORDER — ${QTY} item${QTY > 1 ? "s" : ""} to the ${where}`);
  console.log(`shipping charged €${ship.toFixed(2)}, costs €${shipCost.toFixed(2)}; card fee ${FEE_PCT * 100}% + €${FEE_FIXED.toFixed(2)}\n`);
  const h = `${"product".padEnd(26)}${"price".padStart(7)}${"garment".padStart(9)}${"ship +/−".padStart(8)}${"fee".padStart(7)}${"PROFIT".padStart(9)}${"%".padStart(6)}`;
  console.log(h);
  console.log("-".repeat(h.length));
  for (const r of rows) {
    console.log(
      r.name.slice(0, 25).padEnd(26) +
        `€${r.price}`.padStart(7) +
        `−${r.cost.toFixed(2)}`.padStart(9) +
        // Signed, because a flat charge against a variable cost can go
        // either way: on most routes shipping adds to the profit.
        ((ship - r.shipCost >= 0 ? "+" : "−") + Math.abs(ship - r.shipCost).toFixed(2)).padStart(8) +
        `−${r.fee.toFixed(2)}`.padStart(7) +
        `€${r.net.toFixed(2)}`.padStart(9) +
        r.pct.toFixed(0).padStart(6),
    );
  }
  const mean = rows.reduce((s, r) => s + r.pct, 0) / rows.length;
  const totalNet = rows.reduce((s, r) => s + r.net, 0) / rows.length;
  console.log("-".repeat(h.length));
  console.log(`${"AVERAGE".padEnd(26)}${"".padStart(31)}${("€" + totalNet.toFixed(2)).padStart(9)}${mean.toFixed(0).padStart(6)}`);

  console.log(`\n\nWHAT IT WOULD TAKE TO HIT A TARGET (${QTY} item to the ${where})`);
  const targets = [55, 60, 65, 70];
  console.log(`${"product".padEnd(26)}${"now".padStart(6)}` + targets.map((t) => `${t}%`.padStart(8)).join(""));
  console.log("-".repeat(26 + 6 + targets.length * 8));
  for (const r of rows) {
    console.log(
      r.name.slice(0, 25).padEnd(26) +
        `€${r.price}`.padStart(6) +
        targets.map((t) => `€${priceForMargin(r.cost, t).toFixed(0)}`.padStart(8)).join(""),
    );
  }
  console.log("\nA price already at or above a target is shown at what it would be, not\nwhat it is — read across to see how much room each product has.");
}
