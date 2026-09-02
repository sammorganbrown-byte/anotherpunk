import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** The contact form's server side.
 *
 * Sends through Resend's REST API with `fetch` rather than pulling in an SMTP
 * client. Nothing is stored: a message is relayed to the shop's inbox and
 * that is the end of it, which is the right amount of machinery for a form
 * that will see a handful of messages a week.
 *
 * The reply-to is set to the sender, so replying from the inbox goes to the
 * customer rather than to the shop. Without that, every reply would go to
 * yourself — the classic contact-form failure, and one you would only notice
 * after ignoring someone for a week.
 */

const CONTACT_TO = "sam@anotherpunk.com";

const contactInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(1).max(4000),
  /** Honeypot. Real people never fill this in — it is hidden — so anything
   * that does is a bot, and gets a cheerful success with nothing sent. */
  website: z.string().max(200).optional(),
});

export type ContactResult = { sent: boolean; reason?: string };

export const sendContactMessage = createServerFn({ method: "POST" })
  .validator((data: unknown) => contactInput.parse(data))
  .handler(async ({ data }): Promise<ContactResult> => {
    // Silently accepted, never sent. Telling a bot it failed just teaches it
    // to try again differently.
    if (data.website && data.website.length > 0) return { sent: true };

    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) {
      return {
        sent: false,
        reason: "The form isn't connected yet — email sam@anotherpunk.com directly.",
      };
    }

    // Falls back to the SEND subdomain, not the root. Only send.anotherpunk.com
    // is verified with Resend — the root carries Google Workspace, and a from
    // address there is refused outright. The old fallback would have failed
    // silently the moment CONTACT_FROM was missing.
    const from = process.env.CONTACT_FROM?.trim() || "Another Punk <hello@send.anotherpunk.com>";

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [CONTACT_TO],
          reply_to: data.email,
          subject: `Another Punk — message from ${data.name}`,
          text: `${data.message}\n\n—\n${data.name}\n${data.email}`,
        }),
      });

      if (!res.ok) {
        // Deliberately not echoed to the visitor: the body can carry account
        // detail, and "it didn't send" plus the address is all they can act on.
        return {
          sent: false,
          reason: "That didn't send. Email sam@anotherpunk.com and it'll get there.",
        };
      }
      return { sent: true };
    } catch {
      return {
        sent: false,
        reason: "That didn't send. Email sam@anotherpunk.com and it'll get there.",
      };
    }
  });
