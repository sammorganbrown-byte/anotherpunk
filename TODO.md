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


## Shipping service — confirmed (2 Sep)

Orders default to **Special Line**. That is non-Express, to normal addresses,
in the EU — exactly the lane Tapstitch described as generally DDP, so the
"no customs fees" promise sits on the right service and the exceptions
(International Express, remote addresses) do not apply.

Sam's own parcel may have gone Express. It is cited as evidence for nothing:
different service, happened to be faster, and would have been DDU.

Delivery time stays "about two weeks", matching Tapstitch's published Special
Line figures — 2–5 days to make plus around 10 in transit. Replace it with a
real average once a few customer orders have landed.

**The one way this breaks:** if an order ever goes out on a different service.
Picking Express for someone in a rush, or adding a Shopify shipping option
Tapstitch honours, moves that order to DDU while the site still promises no
customs fees — and the refund lands on us. This is why express, if ever
offered, needs its own copy rather than a different service swapped in behind
the same promise.

## Fulfilment origin — stay on international (2 Sep)

Tapstitch lets you default to US or international fulfilment. **Keep
international.** Two reasons:

1. **Every price on the site assumes it.** `shipping-rates.csv` is quoted from
   the international origin — that is why Thailand, China and Vietnam are the
   cheapest zones on the sheet. Switching would invalidate the €9 base, the €2
   increment, the margin sheet and both bundle prices at once, silently, while
   the site kept charging the old numbers.
2. **It is the better origin for a European shop.** International on Special
   Line is the lane Tapstitch confirmed as DDP into the EU. US origin would
   make every EU order an import from America instead — no cheaper, no faster,
   and without the documented duty-paid treatment. That trades the main
   market's shipping for a smaller one's.

US customers are not penalised: DDP explicitly covers "U.S. shipments using
Special Line", so they are duty-paid on this origin too.

**Revisit if US sales become a real share.** Fulfilling those domestically
would cut a fortnight to a few days, which is worth having — but it needs its
own rate card, and not every garment is available from both origins. It is a
second origin to add, not a default to flip.

## From the real Tapstitch invoice (INV-1540545095349288960)

Five items, shipped to Lisbon. What it actually said:

| | USD |
|---|---|
| Production cost (5 items: 18.47 / 12.47 / 16.60 / 12.47 / 15.07) | 75.08 |
| Shipping | 38.64 |
| Discount | −12.37 |
| **Tax** | **0.00** |
| **Total** | **101.35** |

### 1. Customs question: answered. Declared value is production cost.

The commercial transaction is Tapstitch → Sam at **$75.08 for five garments**,
not the retail price a customer pays. That is the value that crosses a border.
Four tees is roughly €65 of declared value — nowhere near €150.

**So Raw Hem Four can go back up.** €140 was bought as insurance against a
threshold that does not apply. €175 nets ~€83 against ~€49 and is still a real
discount. Say the word.

Also note **Tax: $0.00** — Tapstitch charged no VAT on the transaction, which
is consistent with the DDP treatment they described.

### 2. THE SHIPPING NUMBER IS THE PROBLEM. €33 where the model says €16.

$38.64 is about €33 at today's rate, for five items to Portugal. Our model
(`SHIPPING_BASE` €9 + €2 each extra) predicts **€17 charged** and assumes a
real cost near **€16**. The invoice is roughly **double the assumed cost**.

If that holds for Special Line, every multi-item order is losing money on
postage, and the bundles — which include shipping — are worst hit.

**CHECKED. A live cart, four raw-hem tees to Portugal: production €73.88,
shipping €19.37, tax €0.00, total €93.25.**

So the $38.64 on the invoice was inflated by it being five items and probably
express — but the underlying problem is real at a smaller size. We charge €15
to ship four items and it costs €19.37. **Every four-item order to Portugal
loses about €4.40 on postage**, and Portugal is not the worst zone.

The base looks about right; the €2 increment is what is wrong. Three extra
garments appear to cost around €10 to add, roughly €3.20 each, not €2.

**Netherlands checked too: €28.61** for the same four tees.

| | we charge | sheet said | ACTUAL | we lose |
|---|---|---|---|---|
| Portugal, 4 items | €15 | €14.68 | **€19.37** | €4.37 |
| Netherlands, 4 items | €15 | €21.13 | **€28.61** | €13.61 |

The sheet understates by roughly a third, consistently. Two separate problems:
the €2 increment is far too low (real marginal cost is €3.20 to Portugal, €5
to the Netherlands), and a flat national rate cannot hold when the spread
between cheapest and dearest destination is €9 on an identical parcel.

**Not fatal.** A €50 tee costs €18.47 to make, so even carrying €10 of postage
it nets over €20 — the garment margin is absorbing the error. But every
multi-item order is less profitable than the margin sheet says, and the
bundles, which swallow their own postage, take it hardest.

**Last thing needed — 1 item and 2 items, to Portugal and the Netherlands.**
Four numbers, same cart. One-item orders will be most of the shop, so the base
rate matters more than anything else here and it is the last figure still
resting on the bad sheet.

With those, `SHIPPING_BASE`, `SHIPPING_PER_EXTRA_ITEM`, the margin sheet and
the His and Hers price can all be rebuilt on evidence. Not changing the
increment before then: raising it to cover four-item orders would tax every
two-item order to fix an error that mostly shows up at four.

## Two new products (3 Sep)

**Big Pussy** (grey leopard unisex boxy) and **Crop Tank** (black) are live.
The Cami is gone — pulled for quality — and its two scheduled posts were
retargeted to these, so nothing advertises a product that no longer exists.

Costs came from **Shopify's cost-per-item field**, read with the new
`scripts/shopify-costs.mjs`. Both prices were then set to the house markup of
2.72x rather than kept at what Shopify carried:

| | was | now | cost | markup |
|---|---|---|---|---|
| Big Pussy | €45 | **€40** | €14.69 | 3.06x → 2.72x |
| Crop Tank | €20 | **€25** | €8.25 | 2.42x → 3.03x |

The tank works out at €22.44 on the nose; it went to €25 because every other
price here is a multiple of five and a lone €22 reads as a mistake rather than
a decision.

**All costs now come from Tapstitch, not Shopify.** Shopify's cost-per-item
field was stale on every single product — low by 2c to 68c, with no consistent
offset, so the gap could not be derived. Understated costs flatter every
margin and let the cost-price friends code sell below true cost.

**Two products still need checking.** `saucer-oversized-black` and
`saucer-oversized-bone` are still on the old Shopify figure of €14.68 —
Tapstitch's page for that product was not among the screenshots. Read it off
Tapstitch and correct them.

**The Staple is the thin one.** €35 against a true cost of €16.93 is 2.07x,
where the house standard is about 2.7x. At that markup it would be €45. It may
be deliberate for a plain white tee, but nothing else here works that hard for
that little.

**The white tank is still not listed.** Shopify carries the colourway and the
flat exists, but nothing has photographed it on a body, and a listing without
a picture of what you are buying is worse than no listing. The variant ids are
in Shopify whenever it gets shot.

## Latent risk: eight product images are remote CDN URLs

Eleven references in `another-punk-products.ts` point at
`d2ol7oe51mr4n9.cloudfront.net` — Higgsfield's own storage — rather than at
files in `public/img`. They work today. They are not ours, and nothing
guarantees they will resolve next year. Worth downloading into the repo like
every other image before that becomes a support email about missing pictures.

## Saucer Oversized — resolved, but check the rest (3 Sep)

It had gone missing from Tapstitch, probably deleted by accident. Shopify
still carried it and our ids still resolved, so the site was selling both
colourways at €40 with nothing at the other end to make them. Sam re-added it;
both entries are relinked to the new product **15972246094155**, cost €15.07
from Tapstitch, and all 16 products are on sale again.

~~**The old Shopify product `15942009520459` is now an orphan.**~~ Archived
3 Sep with `scripts/shopify-archive.mjs`, along with the old 400gsm
`15971630580043`. Both kept rather than deleted: archiving preserves any order
history and is reversible from the Shopify admin.

**Nothing checks that a product we sell exists where it gets made.** This was
found only because a unit cost was missing and I went looking. Any other gap
of the same kind is sitting there silently right now, and it produces the
worst failure a shop has: the money is taken, the draft order is created, the
customer is thanked, and the garment is never made — with nothing raising a
hand.

Cheap fix, worth doing before volume: a script that walks the catalogue,
resolves each `shopifyProductId` against Shopify, and reports anything that
does not exist. It would have caught this the day it broke.

Also worth knowing: Shopify calls the second colourway **Apricot**, our site
calls it **bone**. Fine as a brand choice — just do not let it confuse a
variant mapping later.

## Staple: changing the blank (3 Sep)

Sam is replacing the 400gsm blank — too thick for a t-shirt, which it is.
Standard tee is around 180gsm, heavyweight 240–280; 400gsm/11.8oz is
sweatshirt weight. Target something in the 240–280 range for a plain tee that
still feels like a good one.

**Five things change with the blank, and the first is the one that bites:**

1. **The description is now wrong.** It reads "400gsm heavyweight cotton —
   11.8oz, and it hangs like it." That has to be rewritten to the real weight
   before the new blank goes live, or the page describes a garment nobody
   receives.
2. **The cost changes.** Read it off Tapstitch, not Shopify.
3. **The Shopify ids will change** if this becomes a new Tapstitch product,
   exactly as the Saucer Oversized did. Do not assume the existing ids carry
   over — re-read them with `scripts/shopify-find-product.mjs` and check the
   old product gets archived rather than left live.
4. **The comment above the price in `another-punk-products.ts` becomes
   wrong.** It argues the 400gsm weight IS the product and that a lighter
   blank would remove the only reason to buy it. That argument dies with the
   blank and needs replacing with whatever the new one actually is.
5. **The mockups are probably fine.** A plain white tee with a sleeve print
   looks much the same at 260gsm; only the drape differs, and not enough to
   notice in the shots we have. Re-check rather than assume.

**Margin improves as a side effect** — a lighter blank costs less than €16.93,
so the 43% goes up without touching the €35 price. That is a bonus, not the
reason: the reason is that the shirt is too thick.
