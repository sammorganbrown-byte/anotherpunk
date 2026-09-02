import { createFileRoute } from "@tanstack/react-router";
import { RdLegal, LegalSection } from "../../components/redesign/rd-legal";

export const Route = createFileRoute("/_shell/privacy")({ component: Privacy });

/** Privacy.
 *
 * Written from what the code actually does rather than from a template. Every
 * claim below was checked against the source: the processor list is the set of
 * services an order genuinely passes through, and the storage section is the
 * real inventory of `localStorage` and `sessionStorage` keys. That last part
 * is the unusual one — the site sets no cookies at all, functional or
 * otherwise, so there is no consent banner and nothing to opt out of. Worth
 * stating out loud, because almost nobody can.
 *
 * If a service is ever added that tracks people, this page has to change in
 * the same commit. A privacy policy that lags the code is worse than none.
 */
function Privacy() {
  return (
    <RdLegal label="PRIVACY" title="PRIVACY" updated="2 SEPTEMBER 2026">
      <p className="rd-legal-lede">
        Another Punk is a one-person shop. It collects what it needs to print a shirt and
        get it to your door, and nothing beyond that. There is no advertising network here,
        nothing is sold on, and no profile is built about you.
      </p>

      <LegalSection heading="What is collected">
        <p>When you order: your name, email address, delivery address, and what you bought.</p>
        <p>
          When you use the contact form: your name, email address, and your message. It is
          relayed straight to the inbox and not stored anywhere else.
        </p>
        <p>
          <strong>Card details are never collected.</strong> Payment happens on Stripe's own
          checkout page. Your card number never reaches this site, and nobody here can see
          it — only the last four digits and whether the payment worked.
        </p>
        <p>
          There is no account to create, so there is no password, and there is no newsletter
          list unless you ask to be on one.
        </p>
      </LegalSection>

      <LegalSection heading="No cookies, no tracking">
        <p>
          This site sets <strong>no cookies</strong> — not advertising cookies, not analytics
          cookies, not functional ones. That is why you were never shown a consent banner.
        </p>
        <p>
          It does keep a few things in your own browser's local storage, which never leaves
          your device and is never sent anywhere: your basket, a discount code if you entered
          one, which currency you chose to view prices in, a cached copy of the day's exchange
          rates, where you dragged the music player, and a note that you have already seen the
          opening animation. Clearing your browser data clears all of it.
        </p>
        <p>
          Visitor numbers are counted by Vercel Analytics, which is cookieless and does not
          follow anyone between sites: it records the page, the country, and the kind of
          device, with no identifier that can be tied back to a person.
        </p>
      </LegalSection>

      <LegalSection heading="Who else sees it">
        <p>An order cannot be filled without passing through a few services. They are:</p>
        <ul>
          <li>
            <strong>Stripe</strong> — takes the payment. Handles your card details directly;
            we receive only confirmation.
          </li>
          <li>
            <strong>Shopify</strong> — holds the order record.
          </li>
          <li>
            <strong>Tapstitch</strong> — prints the garment and ships it. They receive your
            name and delivery address, because somebody has to put it on the parcel.
          </li>
          <li>
            <strong>Resend</strong> — sends order and contact email.
          </li>
          <li>
            <strong>Vercel</strong> — hosts the site and keeps short-lived server logs.
          </li>
          <li>
            <strong>Google Workspace</strong> — the inbox that receives your messages.
          </li>
        </ul>
        <p>
          Each is used only to do its job. None of them is given your details for their own
          marketing, and nothing is sold to anyone, ever. Some are based outside the EU and
          transfer data under the standard contractual clauses or an adequacy decision.
        </p>
      </LegalSection>

      <LegalSection heading="How long it is kept">
        <p>
          Order records are kept while they may still be needed for accounting and tax — in
          practice several years, because the law requires it. Contact-form messages are kept
          only as long as the conversation is live, and are deleted once it is finished.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          Under the GDPR you can ask for a copy of what is held about you, ask for it to be
          corrected, or ask for it to be deleted — subject to records that have to be kept for
          tax. You can also object to how it is used, or ask for it in a portable form.
        </p>
        <p>
          Email <a href="mailto:sam@anotherpunk.com">sam@anotherpunk.com</a> and it will be
          dealt with. There is no ticketing system and no department; it is one person, and
          you will get a straight answer.
        </p>
        <p>
          If you are not happy with the answer, you can complain. Another Punk is established
          in Portugal, so its supervisory authority is the{" "}
          <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer">
            CNPD
          </a>{" "}
          — but you do not have to go there. You are equally entitled to complain to the data
          protection authority of the country you live in, which is usually the easier one to
          deal with and the one that speaks your language.
        </p>
      </LegalSection>
    </RdLegal>
  );
}
