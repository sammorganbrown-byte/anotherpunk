import { createFileRoute } from "@tanstack/react-router";
import { RdLegal, LegalSection } from "../../components/redesign/rd-legal";

export const Route = createFileRoute("/_shell/returns")({ component: Returns });

/** Returns.
 *
 * The important point of law here, and the one small shops most often get
 * wrong: printing to order does NOT remove the EU's 14-day right of
 * withdrawal. The exemption for "goods made to the consumer's specification"
 * covers something personalised — a name, a custom design — not a standard
 * size of a standard piece that happens to be printed after you buy it. These
 * are picked off a size chart, so the right applies in full, and this page
 * says so rather than quietly hoping nobody asks.
 *
 * Two things follow from the same directive and are set out deliberately:
 * the outbound standard shipping has to be refunded as well as the goods, and
 * the buyer may be made to pay return postage ONLY if they were told before
 * ordering — which is what the returns line at checkout is for.
 */
function Returns() {
  return (
    <RdLegal label="RETURNS" title="RETURNS" updated="2 SEPTEMBER 2026">
      <p className="rd-legal-lede">
        Fourteen days to change your mind, from the day the parcel arrives. No reason needed
        and no argument. Everything here is printed to order, which does not take that right
        away — these are standard sizes off a chart, not personalised, so the law treats them
        like anything else you buy online.
      </p>

      <LegalSection heading="Changing your mind">
        <p>
          Tell us within <strong>14 days</strong> of the parcel arriving, then send it back
          within <strong>14 days</strong> of telling us.
        </p>
        <p>
          It needs to come back unworn and unwashed, in the state it arrived. Try it on the
          way you would in a shop — that is fine, and expected. Wearing it out for a weekend
          is not, and anything that comes back visibly used may be refunded at less than the
          full amount.
        </p>
        <p>
          You pay the postage to send it back, unless the item was faulty or the wrong thing
          arrived. Use a tracked service: until it gets here it is still your parcel, and
          without tracking there is no way to show it was sent.
        </p>
      </LegalSection>

      <LegalSection heading="Getting your money back">
        <p>
          The refund covers what you paid for the item <em>and</em> the standard shipping you
          paid on the way out. It goes back to the card you paid with, within{" "}
          <strong>14 days</strong> of the return arriving — usually much sooner. Stripe then
          takes a few days of its own to put it back on your statement, which is out of
          anyone's hands here.
        </p>
        <p>If you return part of an order, the shipping stays with the part you kept.</p>
      </LegalSection>

      <LegalSection heading="If it is faulty or wrong">
        <p>
          Email <a href="mailto:sam@anotherpunk.com">sam@anotherpunk.com</a> with your order
          number and a photograph. If the print is wrong, the garment is damaged, or the wrong
          thing turned up, it gets replaced or refunded in full and{" "}
          <strong>we pay the postage both ways</strong>. You do not need to have kept the
          packaging and you do not need to make a case for it.
        </p>
        <p>
          This sits on top of your legal rights, which in the EU run to two years for goods
          that were not as described. Nothing on this page reduces them.
        </p>
      </LegalSection>

      <LegalSection heading="Wrong size">
        <p>
          There is no formal exchange — it is faster to return the one you have and order the
          size you want, so the new one starts printing straight away instead of waiting for
          the first to arrive back. Say so in the email and it will be watched for.
        </p>
        <p>
          Every product page carries the fit in plain words. If you are between sizes or
          unsure, ask before ordering. That is a much better use of everyone's time than a
          return.
        </p>
      </LegalSection>

      <LegalSection heading="How to start one">
        <p>
          Email <a href="mailto:sam@anotherpunk.com">sam@anotherpunk.com</a> with your order
          number and what is wrong. You will get the return address by reply. Please do not
          send anything back before that — parcels arriving unannounced are hard to match to
          an order, and the address on the outside of your parcel is the printer's, not ours.
        </p>
      </LegalSection>
    </RdLegal>
  );
}
