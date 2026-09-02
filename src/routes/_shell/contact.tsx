import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { sendContactMessage } from "../../lib/api/contact.functions";
import { RdPixelText } from "../../components/redesign/rd-pixel-text";

export const Route = createFileRoute("/_shell/contact")({ component: Contact });

/** Contact.
 *
 * A form, and underneath it the address written out in full. The address is
 * not a fallback for when the form breaks — it is there because some people
 * would simply rather use their own mail client, and because a shop that only
 * accepts messages through a box on a page reads as a company hiding behind a
 * ticketing system. This one is a person.
 */
function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setState("sending");
    try {
      const r = await sendContactMessage({ data: form });
      if (r.sent) {
        setState("sent");
      } else {
        setState("idle");
        setError(r.reason ?? "That didn't send.");
      }
    } catch {
      setState("idle");
      setError("That didn't send. Email sam@anotherpunk.com and it'll get there.");
    }
  };

  return (
    <div className="rd-contact">
      <p className="rd-label mb-4">
        CONTACT <span className="rd-key">/</span> OPEN
      </p>

      {state === "sent" ? (
        <>
          <RdPixelText as="h1" text="SENT" />
          <p className="rd-log mt-6 max-w-[52ch]">
            That's through. You'll get a reply from sam@anotherpunk.com — usually the same
            day, occasionally the next one.
          </p>
        </>
      ) : (
        <>
          <RdPixelText as="h1" text="CONTACT" />

          <form onSubmit={submit} className="mt-8 flex max-w-[46ch] flex-col gap-4">
            <Field label="Name" value={form.name} onChange={set("name")} autoComplete="name" />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
            />

            <label className="flex flex-col gap-1.5">
              <span className="rd-label">Message</span>
              <textarea
                className="rd-input"
                rows={6}
                required
                value={form.message}
                onChange={(e) => set("message")(e.target.value)}
              />
            </label>

            {/* Hidden from people, irresistible to bots. Anything that fills
                this in is answered with a cheerful success and nothing sent. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={form.website}
              onChange={(e) => set("website")(e.target.value)}
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
            />

            {error ? (
              <p role="alert" className="rd-log" style={{ color: "var(--rd-red)" }}>
                {error}
              </p>
            ) : null}

            <button type="submit" className="rd-btn mt-1" data-primary="true" disabled={state === "sending"}>
              {state === "sending" ? "Sending…" : "Send →"}
            </button>
          </form>
        </>
      )}

      <div className="rd-contact-who">
        <p className="rd-log">
          <span className="rd-ok">Sam Brown</span> — Punkiest Punk
        </p>
        <p className="rd-log">
          <a href="mailto:sam@anotherpunk.com" className="rd-link underline underline-offset-4">
            sam@anotherpunk.com
          </a>
        </p>
        <p className="rd-log">
          <a
            href="https://instagram.com/anotherpunk.threads"
            target="_blank"
            rel="noopener noreferrer"
            className="rd-link underline underline-offset-4"
          >
            @anotherpunk.threads
          </a>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  const id = `rd-c-${label.toLowerCase()}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="rd-label">
        {label}
      </label>
      <input
        id={id}
        className="rd-input"
        type={type}
        required
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
