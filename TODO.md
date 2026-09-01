# Another Punk — outstanding

Updated 2026-09-01, after the purchase path was proved end to end.
Ordered by what bites soonest.

## Do first

- [ ] **Cancel orders #1001 and #1002 in Tapstitch.** Both are your €1 tests.
      They sit at "On Hold / Pay now", so nothing is produced until you pay —
      but cancel them so they are not sitting there.

      **Cancel in Tapstitch. Do NOT delete them in Shopify.** The Shopify
      order is the record that stops the same payment being ordered twice,
      and Stripe can redeliver an event for about three days. Deleting the
      drafts for the earlier payment is exactly why order #1001 appeared.

- [ ] **Refund the three test charges** in Stripe → Payments: €6, €1, €1.

- [ ] **Remove `DRYRUN99`** — one entry in `src/lib/promo-codes.ts`. While it
      exists, anyone who guesses it buys a €50 shirt for €1. Ask and it is a
      two-minute change.

## Decisions worth making early

- [ ] **Does Tapstitch auto-pay?** Every order lands as "On Hold" until you
      pay them per order, so the pipeline is automatic right up to that point
      and then waits for you. If Tapstitch offers a wallet or auto-charge,
      turning it on is what makes an overnight order ship without you. If it
      does not, that manual step is simply part of the job.

- [ ] **`BIGPUSSY69` is guessable** and sells at cost. Fine among friends; if
      it circulates, add an expiry or lengthen it.

## Housekeeping

- [ ] **Delete `.env.local`** from the repo root — your Shopify client ID and
      secret. They are now set properly in Vercel, so the local copy is pure
      risk. `rm "/Users/sam/Claude Code/another-punk/.env.local"`

- [ ] **Delete the stray Vercel project `another-punk`** (with the hyphen).
      No domains, serves nothing, builds on every push, and sits next to the
      real project under a nearly identical name. Then `rm -rf .vercel` here
      so no stray CLI command can deploy to it.

- [ ] **Delete the stale Stripe destination** pointing at
      `anotherpunk.vercel.app` — it returns 500 and retries for days. Leave
      the `deadstock-posters` one alone; it is your other shop's live
      endpoint, and its 400s are it correctly ignoring Another Punk events.

- [ ] **`SITE_URL`** is `anotherpunk.com`, which resolves to
      `https://anotherpunk.com` — working, but without the `www` the rest of
      the site uses. Set it to `https://www.anotherpunk.com`.

## Known and accepted

- [ ] **Shopify order totals read retail, not what was charged.** An order
      bought with a discount code shows €40 in Shopify while Stripe took €1.
      Only the order note records the real amount. Without a discount code
      the two match exactly, so this only skews test orders — but worth
      knowing before reconciling Shopify against Stripe.

- [ ] **The Stripe account is shared with Deadstock**, so its business name
      cannot describe both. Each Another Punk charge now names itself and
      shows `ANOTHERPUNK` on statements, so the account name no longer
      matters — set it to whatever suits Deadstock. Separate accounts is the
      real answer if the shops grow apart.

## Small and cosmetic

- [ ] **Vercel Analytics** — a package plus one component. About ten minutes.

- [ ] **Stale copy.** The meta description still says "Drawn by hand, printed
      to order", and the `/classic` footer says "Drawn by hand. Printed to
      order." Both predate dropping that language.

- [ ] **Surrender Dorothy has only 2 images**, Another Punk 2 — the fewest in
      the range, both having lost shots in the front/back audit.
