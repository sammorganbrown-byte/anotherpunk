# Another Punk — outstanding

Written 2026-09-01. Ordered by what bites soonest, not by effort.

## Before you tell anyone the shop exists

- [ ] **Finish the €1 test order.** `DRYRUN99`, any product. Watch for, in order:
      Stripe shows a **€1.00 Succeeded** payment (not "no payment required") →
      the return page says **QUEUED**, not HOLD → a **draft order appears in
      Shopify** (Orders → Drafts) with the right product and size → the
      confirmation email arrives. Then **cancel the draft before it prints**.
      Steps 1 and 2 are proven. Step 3 is the only link never yet exercised.

- [ ] **If no draft order appears, suspect `STRIPE_WEBHOOK_SECRET`.** It is
      probably the same masked-value problem the API key had — copied from a
      view showing bullets rather than the real value. Stripe → Developers →
      Webhooks → your endpoint → Signing secret → Reveal, and re-paste it.
      This failure mode is silent: payments succeed and no order is ever
      placed, so you would find out from a customer rather than from the site.

- [ ] **Remove `DRYRUN99`** once the test passes. It is in
      `src/lib/promo-codes.ts`. While it exists, anyone who guesses it buys a
      €50 shirt for €1.

## Housekeeping that is currently a small risk

- [ ] **Delete `.env.local`** from the repo root. It holds your Shopify client
      ID and secret. Gitignored, so never committed, but the Shopify work is
      finished and there is no reason to keep credentials on disk.
      `rm "/Users/sam/Claude Code/another-punk/.env.local"`

- [ ] **Delete the stray Vercel project `another-punk`** (with the hyphen). It
      owns no domains, serves nothing, and builds on every push. Its only real
      effect is sitting next to the live project under a nearly identical name
      at the moment you are pasting secrets. Check its Domains list is empty
      first. Then `rm -rf .vercel` in this repo so no stray CLI command can
      deploy to it again.

## Small and cosmetic

- [ ] **`SITE_URL`** is `anotherpunk.com`, which now resolves to
      `https://anotherpunk.com` — working, but without the `www` the rest of
      the site uses. Set it to `https://www.anotherpunk.com` when convenient.

- [ ] **Vercel Analytics.** You asked; we deferred it to fix Stripe. It is an
      npm package plus one component in the shell — about ten minutes.

- [ ] **Stale copy.** The site's meta description still reads "Drawn by hand,
      printed to order", and the `/classic` footer says "Drawn by hand.
      Printed to order." Both predate dropping that language.

- [ ] **`BIGPUSSY69` is guessable** and sells at cost. Fine among friends; if
      it leaks, consider an expiry date or a longer code.

## Thin, if you ever want to fill it

- [ ] **Surrender Dorothy has only 2 images**, and **Another Punk 2** — the
      fewest in the range. Both lost shots in the front/back audit.
