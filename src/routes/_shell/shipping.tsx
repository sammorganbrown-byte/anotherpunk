import { createFileRoute } from "@tanstack/react-router";
import { RdLegal, LegalSection } from "../../components/redesign/rd-legal";
import {
  SHIPPING_BASE,
  SHIPPING_PER_EXTRA_ITEM,
  SHIPPING_COUNTRIES,
} from "../../lib/shipping";

export const Route = createFileRoute("/_shell/shipping")({ component: Shipping });

/** Shipping.
 *
 * The prices and the country list are imported from src/lib/shipping.ts rather
 * than written out here, so this page cannot quietly disagree with what the
 * checkout charges. Changing the rate in one place changes it in both.
 *
 * ── TIMINGS NEED CONFIRMING ───────────────────────────────────────────────
 * MAKE_DAYS and the transit ranges below are estimates, not quoted figures
 * from Tapstitch. Check them against Tapstitch's stated production and
 * delivery times and correct them here. Everything else on this page is
 * checked; these are the numbers to verify before they are relied on.
 * ──────────────────────────────────────────────────────────────────────────
 */
const MAKE_DAYS = "2–5 working days";
const EUROPE_DAYS = "3–7 working days";
const WORLD_DAYS = "7–14 working days";

function Shipping() {
  const eur = (n: number) => `€${n}`;

  return (
    <RdLegal label="SHIPPING" title="SHIPPING" updated="2 SEPTEMBER 2026">
      <p className="rd-legal-lede">
        Nothing here sits in a warehouse. Each piece is printed after you order it, which is
        why there is no dead stock and no sale rail — and why it takes a few days longer than
        something pulled off a shelf.
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
          <strong>{EUROPE_DAYS}</strong> in transit within Europe and{" "}
          <strong>{WORLD_DAYS}</strong> everywhere else. You get a tracking number by email
          when it leaves.
        </p>
        <p>
          These are working days and they are honest estimates rather than guarantees — a
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
        <p>
          Orders inside the EU arrive with nothing further to pay. Outside it, your country
          may charge import duty or tax on delivery. That is set by your own customs service,
          it is not collected here, and it cannot be paid in advance — so it is worth knowing
          about before you order rather than at the door.
        </p>
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
