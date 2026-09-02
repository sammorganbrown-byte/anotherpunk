# Another Punk — outstanding

Updated 2026-09-01, after the purchase path was proved end to end.
Ordered by what bites soonest.

## Do first

- [ ] **Finish connecting the contact form.** The Resend key is in Vercel.
      What is left: add the domain at resend.com/domains — **enter
      `send.anotherpunk.com`, not `anotherpunk.com`**. Verifying the root
      would have Resend ask for an SPF record there, and the root already has
      one for Google; a domain can only have one, and a second breaks both
      silently. The subdomain keeps them apart. Paste me the records and I
      will add them and switch the form's from-address over.

      Until then /contact is live but the form cannot send — it tells people
      to email sam@anotherpunk.com instead.

- [x] **Shopify sender address — DNS done 2026-09-01.** Six Shopify CNAMEs
      added and resolving; Google's MX and SPF untouched. Finish in Shopify by
      setting the sender to sam@anotherpunk.com, and add it as a staff
      notification recipient on the same Notifications page so order alerts
      reach the brand inbox.

      Tapstitch has no separate notification address — only the account email,
      which means changing the login. It is not customer-facing, so it can
      wait; a Gmail filter forwarding Tapstitch mail to sam@ does the same job
      with no risk.


- [x] **Email — done 2026-09-01.** Google Workspace on sam@anotherpunk.com,
      with MX, SPF, DKIM and domain verification all added to Vercel DNS and
      verified. The site's Contact link points at it. An animated signature
      lives on the Desktop as another-punk-signature.html; the mark it uses is
      hosted at anotherpunk.com/img/sig-wordmark.gif.

      Still worth doing when convenient: free **aliases** in Workspace for
      orders@ or hello@, which land in the same inbox at no extra cost.

- [ ] **Talk through social media.** Raised 2026-09-01, not yet discussed —
      handles, what to hold back for launch, what the field imagery is
      actually for.

- [ ] **Cancel orders #1001 and #1002 in Tapstitch.** Both are your €1 tests.
      They sit at "On Hold / Pay now", so nothing is produced until you pay —
      but cancel them so they are not sitting there.

      **Cancel in Tapstitch. Do NOT delete them in Shopify.** The Shopify
      order is the record that stops the same payment being ordered twice,
      and Stripe can redeliver an event for about three days. Deleting the
      drafts for the earlier payment is exactly why order #1001 appeared.

- [ ] **Refund the three test charges** in Stripe → Payments: €6, €1, €1.
      Not refundable immediately on a new account — the balance is still
      pending. It will become available; it is €8 and not worth chasing.

- [ ] **Set the payout schedule to daily** at Settings → Payouts. Free, no
      eligibility needed, and money leaves for the bank as soon as it is
      available rather than waiting for a weekly batch. Instant Payouts (1%
      in the EU, needs a debit card on file) are not available to new
      accounts and would not help in week one anyway, since the first payout
      is held 7-14 days regardless.

- [ ] **Launch-week float.** The first Stripe payout takes 7-14 days, not 3,
      so nothing comes back during launch week and every order is fronted.
      Twenty orders in week one is about €460 of Tapstitch costs with no
      money returning yet. The steady-state €500 covers it, but only just.
      Worst case orders sit "On Hold" in Tapstitch until funds land, which is
      survivable — just better known in advance than discovered.

- [ ] **Remove `DRYRUN99`** — one entry in `src/lib/promo-codes.ts`. While it
      exists, anyone who guesses it buys a €50 shirt for €1. Ask and it is a
      two-minute change.

## Decisions worth making early

- [ ] **Turn on the Tapstitch wallet — this is the one to do first.**
      Researched 2026-09-01. Tapstitch has both pieces already, no
      application needed:

      - **A wallet you can top up in advance.** Payment is attempted against
        the wallet balance first, then your default card, then any other
        linked cards (up to 5). So the €500 float belongs *here*, not in the
        bank — same money, but it also removes the manual step.
      - **Auto Payments + Auto Order Submission.** Enabled together, an
        order is submitted and charged with no action from you. Auto Payments
        only fires on an auto-submitted order, so both must be on.

      This solves the cashflow question and the "On Hold until you pay" step
      at once, and makes the Stripe Issuing application unnecessary unless
      you specifically want the money to stay inside Stripe.

      **One real trade-off.** Auto-submission removes the gate that has been
      protecting you all evening: nothing currently prints until you press
      Pay now. Given that one test payment produced five drafts before the
      duplicate check existed, do not enable it on day one. Run a handful of
      real orders through by hand, confirm the garments come out right —
      especially products nobody has ordered yet, the bodysuit, the mesh, the
      oversized fits — and turn it on once you trust the pipeline.

      Also note a wallet balance is money held with Tapstitch rather than by
      you. Keep it to roughly a week of orders, not a large reserve.

      Source: https://www.tapstitch.com/help-center/faq/detail/How-to-set-up-auto-payments

- [ ] **Can Stripe's balance pay Tapstitch directly?** Tapstitch charges per
      order at "Pay now", but Stripe holds the takings for about three days
      before depositing — so every order is fronted out of your own money
      until the payout lands. Worth closing, since it scales with sales
      rather than staying fixed.

      **Researched 2026-09-01. Stripe Issuing is available in Portugal** — PT
      is one of 22 countries with local Issuing — and the "commercial card
      program" use case is explicitly for issuing cards to your own business,
      not just platforms issuing to others. **Stripe balance transfers** move
      money from your payments balance straight into the Issuing balance that
      the card spends from, which is exactly the loop you want.

      Two caveats that decide whether it is worth it:

      1. **It is not self-serve.** Step one in Stripe's own docs is
         "determine your eligibility by contacting Stripe sales", via
         https://stripe.com/contact/baas — it is an embedded-finance product
         aimed at businesses with real volume. A new shop may not be taken
         on. Ask early, since the answer costs nothing.
      2. **It shortens the lag rather than removing it.** Balance transfers
         settle instantly in the US but *within 1 business day* in Europe,
         and are still marked preview here. Better than 3 to 5 days, not
         zero.

      **The question that actually decides it**, and which the docs do not
      answer: can a balance transfer draw on *pending* payments proceeds, or
      only on funds that have already cleared the settlement delay? If only
      cleared funds, Issuing removes the bank round-trip but not the wait,
      and a float in the bank does the same job with no application. Put that
      question to Stripe directly.

      Also worth asking Tapstitch whether they support a prepaid wallet or
      account credit — topping that up periodically would let orders draw
      down automatically, solving both this and the "On Hold until you pay"
      step above, with no Stripe application at all.

      Sources: https://docs.stripe.com/issuing/global and
      https://docs.stripe.com/issuing/adding-funds-to-your-card-program

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

## Package deals — open questions (2 Sep)

- ~~Trader address on /terms~~ — done, 2 Sep. R. de S. Bento 436A,
  1250-221 Lisboa. A **tax number / NIF** is the one detail still missing;
  add it beside the address if the business is registered for VAT.
- **Production and transit times on /shipping** are estimates, not quoted
  Tapstitch figures. Confirm and correct — one constant at the top of
  `src/routes/_shell/shipping.tsx`.
- **A four-up shot of the raw-hem tees.** There isn't one; the pack currently
  leads with the raw-hem ink macro. Needs Higgsfield credits.
- **More group shots for the field.** Only `152-jersey-pair-night.jpg` exists.
  Both bundles float in the field now, so any new group shot has an obvious
  home — the pack, not a single garment.
- **Jersey name customisation** — deliberately not built yet. See the note at
  the bottom of `src/lib/bundles.ts` for why it is a different shape of
  problem from a bundle.

## Customs — SETTLED (2 Sep)

Tapstitch, after three answers that read like three different ones:

> "For EU orders using non-Express shipping methods to normal, non-remote
> addresses, the shipment may generally be handled under DDP, meaning duties
> and taxes are intended to be covered. However, we can't guarantee that there
> will be nothing to pay upon delivery, since customs and carriers make the
> final assessment."

Everything we ship is Special Line, EU, ordinary addresses — inside DDP. Their
earlier reply listed the documented coverage (US) beside the exceptions and
read as though the EU were excluded; it was not saying that.

The site now says **nothing to pay on delivery, and we refund you if you are
charged anyway**. Funding the exception is what makes the promise honest, and
it is cheap precisely because DDP is meant to cover this lane. `DUTY_PREPAID`
is true.

**Exceptions to remember:** International Express is DDU whatever else is
true, and remote addresses are DDU on every service. If express is ever
offered it must be sold on speed alone and must not inherit this claim.

**If a refund is ever actually claimed, note it here.** More than one or two
and the promise needs revisiting.

### IOSS — worth doing, no longer urgent

Not a blocker now DDP covers the lane. Still the clean way for an EU business
to handle VAT on imported goods, and the easy version here: Portugal-
established means registering direct with the AT, no intermediary and none of
the €200–500/yr fee non-EU sellers pay. It brings a monthly return, so ten
minutes with an accountant first.

The number goes in Tapstitch under **Account Settings → My Info → Company
Info** and applies automatically to eligible EU orders. IOSS only covers
consignments up to €150, so it would not reach Raw Hem Four at €175 either way.

## Express shipping — one question left (2 Sep)

Tapstitch publish three international services. Times are theirs:

| Service | Average | 95% within |
|---|---|---|
| International Shipping | 5 days | 7 days |
| **Special Line** (what we use) | 10 days | 15 days |
| Standard Shipping | 25 days | 30 days |

So the express product already exists and is roughly **twice as fast** —
"International Shipping", not "Special Line", which is the middle tier despite
the name sounding premium.

**The one thing still needed is what it costs**, per destination.
`shipping-rates.csv` only holds Special Line rates. Ask support for the
International Shipping rate card and the checkout side can be built the same
day.

Still worth confirming: whether the service can be set from the Shopify order
(the draft sets no `shipping_line` at all today, so Tapstitch is applying a
default), or whether each express order has to be switched by hand in their
dashboard. If it is manual, Tapstitch orders arrive **On Hold**, so there is a
window — and express orders would carry an `EXPRESS` tag, the word in the
order note, and EXPRESS in the notification email subject.

## From the Tapstitch FAQ — two things worth acting on (2 Sep)

**1. Check the real postage on four heavyweight tees.** Their FAQ says
multi-item shipping "may vary depending on the product mix, categories, and
total shipment weight" — weight, not item count. Our `SHIPPING_PER_EXTRA_ITEM`
of €2 is extrapolated from a two-item quote and has never been verified, and
the Raw Hem Four is the heaviest thing we sell. They tell you how to check:
add the items to a Tapstitch cart and read the live rate at checkout. Do it
for Portugal and for the Netherlands (our worst zone). The margin survives
even at triple the assumed cost, so this is not urgent — just unmeasured.

Same trick gets the **International Shipping (express) rates**, which is the
one thing still blocking express at checkout.

**2. Lost or damaged parcels are not guaranteed.** Their answer is only that
they will "do our best to assist you and work with you toward a satisfactory
solution" — no committed reshipment. /returns promises customers a replacement
or refund with postage both ways, which is the right promise to make and
should stay. Just know it may not always be recoverable from Tapstitch, so a
lost parcel can land on our margin. Worth watching if it ever happens twice.

Also confirmed: shipping time excludes production time, which /shipping
already states correctly.


## CHECK WHICH SHIPPING SERVICE OUR ORDERS ACTUALLY USE (2 Sep)

Sam's parcel may have gone **International Express**. If so it proves nothing
about what customers get, and it takes away the only real-world evidence
behind two live claims.

**Why it matters:** International Express is DDU. If the Tapstitch account is
sending customer orders on Express, every EU order can attract import VAT plus
a handling fee — and the site promises to refund that. Roughly €20 a time
against a €25 margin, on most orders. The "no customs fees" line only holds
for non-Express services.

**What to check, before real orders start arriving:**
1. Open the completed test order in Tapstitch and read the service it shipped on.
2. Check the account's default shipping method (and whether Shopify's shipping
   option is influencing it — the draft order sets no `shipping_line`, so
   Tapstitch is choosing).
3. If it is Express, switch the default to Special Line, then re-verify.

The customer is protected either way by the refund promise. What is exposed is
our margin, which is the right way round while this is unconfirmed — but it is
not a thing to leave unconfirmed for long.

Delivery time has gone back to "about two weeks", matching Tapstitch's own
published figures for Special Line rather than the faster number Sam's
possibly-Express parcel suggested.
