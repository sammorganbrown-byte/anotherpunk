import { createFileRoute } from "@tanstack/react-router";
import { RdLegal, LegalSection } from "../../components/redesign/rd-legal";

export const Route = createFileRoute("/_shell/terms")({ component: Terms });

/** Terms.
 *
 * Short on purpose. A one-person shop selling fourteen shirts does not need
 * four thousand words of boilerplate, and nobody reads it anyway; what it
 * needs is the handful of points that actually decide something if there is
 * ever a disagreement — when the contract forms, what happens if a price is
 * wrong, who owns the artwork, and which law applies.
 *
 * The trader's legal name and geographic address are required by EU consumer
 * law and are given in full below — that requirement is the reason the
 * address is on the page at all, and it is why it has to be a real one
 * rather than a contact form. A tax number is the one detail still missing;
 * add it beside the address if the business is registered for VAT.
 */
function Terms() {
  return (
    <RdLegal label="TERMS" title="TERMS" updated="2 SEPTEMBER 2026">
      <p className="rd-legal-lede">
        The short version: order something, we print it and send it, you can send it back
        within 14 days. Everything below is the detail behind that.
      </p>

      <LegalSection heading="Who you are buying from">
        <p>
          Another Punk, run by Sam Brown.
          <br />
          R. de S. Bento 436A
          <br />
          1250-221 Lisboa, Portugal
          <br />
          <a href="mailto:sam@anotherpunk.com">sam@anotherpunk.com</a>
        </p>
        <p>
          Questions, complaints and returns all go to the same address, and are read by the
          same person. Please do not send returns here — the parcels are printed and shipped
          elsewhere, so email first and you will be given the right address back.
        </p>
      </LegalSection>

      <LegalSection heading="When the order becomes an order">
        <p>
          Adding something to the basket is not a contract, and neither is paying. The
          contract forms when you get the email confirming the order has been accepted and
          sent for printing. Until then, an order can be refused and the payment returned in
          full — which would only happen if something has genuinely gone wrong.
        </p>
      </LegalSection>

      <LegalSection heading="Prices">
        <p>
          Prices are in euros and are what you pay. Orders ship duty-paid, so there is
          nothing further owed on delivery; in the rare event customs charges you anyway, we
          refund it — see <a href="/shipping">shipping</a>. You can switch the currency
          shown at the bottom of any page, but that is a conversion for your convenience at
          the day's rate — <strong>the charge is made in euros</strong>, and your bank's rate
          on the day is what lands on your statement.
        </p>
        <p>
          Shipping is shown separately and added at the basket. If a price is obviously wrong
          — a €50 jersey listed at €5 — the order will not be accepted and your money will be
          returned. You will be told, not left wondering.
        </p>
      </LegalSection>

      <LegalSection heading="The clothes">
        <p>
          Everything is printed to order. Colours on a screen are not colours on cotton, and
          there is a little variation between garments in how the print sits and how it wears.
          That is the nature of the process rather than a fault, and the photographs on the
          site are honest about how these actually look.
        </p>
        <p>
          Sizes follow the chart on each product page. Measure something you already own
          against it — it is more reliable than a letter on a label.
        </p>
      </LegalSection>

      <LegalSection heading="The artwork">
        <p>
          The designs, the drawings, the photographs and the name are ours. Buy a shirt and
          you own the shirt — wear it, cut it up, hand it on. What you cannot do is reproduce
          the artwork, print it yourself, or sell anything carrying it.
        </p>
      </LegalSection>

      <LegalSection heading="Where things stand legally">
        <p>
          Nothing here takes away the rights you have as a consumer, and where anything on
          this site conflicts with those rights, those rights win. That includes the 14-day
          right of withdrawal and the two-year period for goods that are not as described.
        </p>
        <p>
          If something goes wrong, email first. Almost everything is solved that way, and it
          is faster than any of the alternatives.
        </p>
      </LegalSection>
    </RdLegal>
  );
}
