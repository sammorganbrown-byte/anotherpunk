/** Email to the brand inbox. Server-only.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 * The Stripe webhook took money, created the Tapstitch order and submitted
 * it for printing without telling anybody. The only order alert Sam got came
 * from Shopify, to whichever address Shopify happened to be configured with
 * — a personal Gmail — and Shopify's alert describes the Tapstitch blank
 * ("Snow Washed Oversized Cotton T-Shirt"), not the thing that was sold.
 *
 * Worse, the FAILURE paths told nobody at all. A paid order whose Tapstitch
 * draft failed returned a 500 to Stripe and stopped there: Stripe retries
 * for a while, gives up, and the customer has paid for a garment nobody is
 * making. That is the single worst failure this shop has, and it was silent.
 *
 * So notification lives here rather than in a dashboard setting: it cannot
 * be pointed at the wrong inbox by accident, it says what was actually sold
 * in the shop's own product names, and it shouts when something breaks.
 *
 * NEVER let a notification failure break the caller. Resend being down must
 * not turn a paid, fulfilled order into a 500 that Stripe retries — that
 * would risk a duplicate. Every function here swallows its own errors.
 */

/** Where order alerts go. The brand inbox, not a personal one. */
const NOTIFY = "sam@anotherpunk.com";

async function send(subject: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM?.trim() || "Another Punk <hello@send.anotherpunk.com>",
        to: [NOTIFY],
        subject: `Another Punk — ${subject}`,
        text,
      }),
    });
  } catch {
    // Deliberately swallowed. See the note at the top of this file.
  }
}

export type OrderLineSummary = { title: string; sizeLabel: string; qty: number };

/** A sale went through and is being printed. */
export async function notifyOrder(input: {
  lines: OrderLineSummary[];
  name: string;
  email?: string;
  city: string;
  country: string;
  total?: number;
  currency?: string;
  draftId: string;
  sessionId: string;
}): Promise<void> {
  const items = input.lines
    .map((l) => `  ${l.qty} x ${l.title} (${l.sizeLabel})`)
    .join("\n");
  const money =
    typeof input.total === "number"
      ? `${(input.currency ?? "EUR").toUpperCase()} ${input.total.toFixed(2)}`
      : "unknown";
  await send(
    `Order — ${input.lines.map((l) => l.title).join(", ")}`,
    [
      `${input.name}, ${input.city}, ${input.country}`,
      input.email ? input.email : "no email on the order",
      "",
      items,
      "",
      `Paid: ${money}`,
      "",
      "Already submitted to Tapstitch and printing. Nothing to do.",
      "",
      `Shopify draft: ${input.draftId}`,
      `Stripe session: ${input.sessionId}`,
    ].join("\n"),
  );
}

/** Something went wrong AFTER the customer paid. This is the one that matters. */
export async function notifyOrderFailure(input: {
  stage: string;
  detail: string;
  sessionId: string;
  name?: string;
  email?: string;
}): Promise<void> {
  await send(
    `PAID BUT NOT ORDERED — ${input.stage}`,
    [
      "A customer has paid and the order did NOT reach Tapstitch.",
      "",
      `Stage: ${input.stage}`,
      `Detail: ${input.detail}`,
      "",
      input.name ? `Customer: ${input.name}` : "Customer: unknown",
      input.email ? `Email: ${input.email}` : "Email: not captured",
      `Stripe session: ${input.sessionId}`,
      "",
      "WHAT TO DO",
      "1. Open the Stripe payment and confirm it really was charged.",
      "2. Check Shopify for a draft against this session before making anything,",
      "   so a manual order does not become a second garment.",
      "3. If there is no draft, place it in Tapstitch by hand.",
      "4. Email the customer. They have paid and are expecting a shirt.",
      "",
      "Stripe will retry this webhook for a while, so it may still resolve",
      "itself. Check for a draft before acting.",
    ].join("\n"),
  );
}
