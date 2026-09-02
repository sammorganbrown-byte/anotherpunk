import { createFileRoute } from "@tanstack/react-router";
import { RdLegal, LegalSection } from "../../components/redesign/rd-legal";
import {
  SHIPPING_BASE,
  SHIPPING_PER_EXTRA_ITEM,
  SHIPPING_COUNTRIES,
  DELIVERY,
  DUTY_PREPAID,
} from "../../lib/shipping";

export const Route = createFileRoute("/_shell/shipping")({ component: Shipping });

/** Shipping.
 *
 * The prices and the country list are imported from src/lib/shipping.ts rather
 * than written out here, so this page cannot quietly disagree with what the
 * checkout charges. Changing the rate in one place changes it in both.
 *
 * ── PRODUCTION IS IN CHINA, AND THAT DECIDES THIS PAGE ────────────────────
 * Two consequences, both of which this page used to get wrong:
 *
 * TIME. Transit dominates, not printing. The earlier figures here (3–7 days
 * to Europe) were written assuming European production and were far too
 * optimistic. They are now the ranges you would expect from an Asian origin.
 * Still estimates — confirm against Tapstitch and tighten.
 *
 * MONEY. Every order into the EU is an IMPORT. This page previously said
 * "orders inside the EU arrive with nothing further to pay", which is only
 * true if Tapstitch ships DDP under an IOSS registration. That has not been
 * confirmed, and if it is wrong the customer meets an unexpected VAT bill and
 * a courier handling fee at their own front door — the single worst way to
 * find out, and a guaranteed chargeback. The wording below therefore warns
 * rather than promises.
 *
 * That direction is deliberate. Warning about a charge that never arrives is
 * a pleasant surprise; promising none and delivering one is fraud by
 * accident. ASK TAPSTITCH WHETHER THEY ARE IOSS-REGISTERED AND SHIP DDP —
 * if they are, this section should be rewritten to say so plainly, because
 * it is a genuine selling point worth stating.
 * ──────────────────────────────────────────────────────────────────────────
 */
// DUTY_PREPAID now lives in lib/shipping.ts, beside the reasoning and the
// support quote that governs it, so this page and the product pages cannot
// disagree about whether a customer owes anything at the door.

/** Tapstitch's own published figures for Special Line, the service these
 * orders travel on: "10d avg; 95% in 15d". Read from lib/shipping.ts so this
 * page, the product page, the bag and the checkout cannot drift apart.
 *
 * Their other two international services, for reference:
 *   International Shipping   5d avg, 95% in 7d   — the fast one
 *   Special Line            10d avg, 95% in 15d  — what we use
 *   Standard Shipping       25d avg, 95% in 30d  — do not use this
 *
 * Production time is on top, and Tapstitch's figures exclude it. */
const MAKE_DAYS = DELIVERY.make;
const TRANSIT_AVG = DELIVERY.transit;
const TRANSIT_MOST = DELIVERY.transitMost;

function Shipping() {
  const eur = (n: number) => `€${n}`;

  return (
    <RdLegal label="SHIPPING" title="SHIPPING" updated="2 SEPTEMBER 2026">
      <p className="rd-legal-lede">
        Nothing here sits in a warehouse. Each piece is printed after you order it, which is
        why there is no dead stock and no sale rail — and why it takes longer than something
        pulled off a shelf. It is printed and sent by our production partner in China, so
        most of the wait is the journey rather than the printing.
      </p>

      <LegalSection heading="What it costs">
        <p>
          <strong>{eur(SHIPPING_BASE)}</strong> for the first item, then{" "}
          <strong>{eur(SHIPPING_PER_EXTRA_ITEM)}</strong> for each one after it. Two pieces
          cost {eur(SHIPPING_BASE + SHIPPING_PER_EXTRA_ITEM)} to ship, three cost{" "}
          {eur(SHIPPING_BASE + SHIPPING_PER_EXTRA_ITEM * 2)}.
        </p>
        <p>
          The same rate applies wherever you are. Prices on the site are shown without
          shipping, and it is added at the basket where you can see it before you pay.
        </p>
      </LegalSection>

      <LegalSection heading="How long it takes">
        <p>
          <strong>{MAKE_DAYS}</strong> to print and finish, then{" "}
          <strong>{TRANSIT_AVG}</strong> in transit — the large majority arrive within{" "}
          {TRANSIT_MOST} of leaving. You get a tracking number by email when it does.
        </p>
        <p>
          These are honest estimates rather than guarantees — a
          customs desk or a courier's bad week can add to them. If something has gone quiet
          for longer than it should, email{" "}
          <a href="mailto:sam@anotherpunk.com">sam@anotherpunk.com</a> and it will be chased.
        </p>
      </LegalSection>

      <LegalSection heading="Where it goes">
        <p>
          Currently {SHIPPING_COUNTRIES.length} countries, chosen at checkout:
        </p>
        <p className="rd-legal-countries">
          {SHIPPING_COUNTRIES.map((c) => c.name).join(" · ")}
        </p>
        <p>
          Somewhere else? Ask. Adding a country is usually a small thing, and it is worth
          doing for someone who actually wants one.
        </p>
      </LegalSection>

      <LegalSection heading="Duty and customs">
        {DUTY_PREPAID ? (
          <>
            <p>
              <strong>Nothing to pay on delivery.</strong> Everything is printed and
              dispatched by our production partner in China, and the import VAT is settled
              before the parcel reaches you. The price you paid at checkout is the price.
            </p>
            <p>
              No customs bill, no courier handling fee, no card through the door asking you
              to go and collect your own shirt. If anything is ever charged to you on
              delivery, email <a href="mailto:sam@anotherpunk.com">sam@anotherpunk.com</a>{" "}
              with the receipt and you will be refunded it.
            </p>
          </>
        ) : (
          <>
            <p>
              Everything is printed and dispatched by our production partner in China, so an
              order is an import wherever you are. Depending on your country, import VAT or
              duty may be charged when it arrives, along with a courier handling fee. That is
              set by your own customs service rather than collected here.
            </p>
            <p>
              Most orders arrive with nothing more to pay. We would rather tell you it is
              possible than have you meet it at the door — if you are charged anything on
              delivery, email <a href="mailto:sam@anotherpunk.com">sam@anotherpunk.com</a>{" "}
              with the receipt.
            </p>
          </>
        )}
      </LegalSection>

      <LegalSection heading="Wrong address">
        <p>
          The address you type is the address it is printed on. If you spot a mistake, email{" "}
          <a href="mailto:sam@anotherpunk.com">sam@anotherpunk.com</a> immediately — before it
          ships it is a two-minute fix, and after it ships it is a lost parcel.
        </p>
      </LegalSection>
    </RdLegal>
  );
}
