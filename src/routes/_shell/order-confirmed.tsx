import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSessionStatus } from "../../lib/api/checkout.functions";
import { useCart } from "../../lib/cart-context";
import { RdPixelText } from "../../components/redesign/rd-pixel-text";

export const Route = createFileRoute("/_shell/order-confirmed")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: OrderConfirmed,
});

/** The page someone lands on straight after paying.
 *
 * Same server call and the same rules as the page this replaces: the bag is
 * only cleared once Stripe actually confirms payment, so a cancelled return
 * trip leaves it intact.
 *
 * ── IT SAYS THANK YOU FIRST ───────────────────────────────────────────────
 * It used to open with QUEUED and then "nothing existed until you ran the
 * job". Both are true and both are the shop's own register, but this is the
 * one screen where a stranger has just handed over fifty euros to a brand
 * they have never bought from, and the first word they read was a status
 * code. Sam called it confusing, and it was: the machine framing that works
 * everywhere else on the site reads as coldness at exactly the moment it
 * should not.
 *
 * So the headline thanks them and the copy says plainly what happens next,
 * in the order they care about: it worked, it is being made, here is when
 * you will hear from us. The job-log framing stays in the small label above,
 * where it is flavour rather than the thing being communicated.
 */
function OrderConfirmed() {
  const { session_id } = Route.useSearch();
  const { clear } = useCart();
  const [state, setState] = useState<"checking" | "paid" | "unknown">("checking");

  useEffect(() => {
    if (!session_id) {
      setState("unknown");
      return;
    }
    let active = true;
    getSessionStatus({ data: { sessionId: session_id } })
      .then((r) => {
        if (!active) return;
        if (r.found && r.paid) {
          setState("paid");
          clear();
        } else {
          setState("unknown");
        }
      })
      .catch(() => active && setState("unknown"));
    return () => {
      active = false;
    };
  }, [session_id, clear]);

  return (
    <div className="rd-confirm">
      <p className="rd-label mb-4">
        JOB <span className="rd-key">/</span>{" "}
        {state === "checking" ? "VERIFYING" : state === "paid" ? "ACCEPTED" : "UNVERIFIED"}
      </p>

      {state === "checking" ? <p className="rd-log">Confirming payment…</p> : null}

      {state === "paid" ? (
        <>
          <RdPixelText as="h1" text="THANK YOU" />
          <p className="rd-log mt-6 max-w-[52ch]">
            Payment went through. Your order is in, and it gets printed for you now. Nothing was
            sitting in a warehouse waiting, which is why it takes about two weeks.
          </p>
          <p className="rd-log mt-4 max-w-[52ch]">
            A confirmation email is on its way, and another when it ships with your tracking
            number. Anything at all, reply to that email and it comes straight to Sam.
          </p>
        </>
      ) : null}

      {state === "unknown" ? (
        <>
          <RdPixelText as="h1" text="ONE MOMENT" />
          <p className="rd-log mt-6 max-w-[52ch]">
            We could not confirm this one automatically. If you were charged, the order went
            through, so check your email for the confirmation. If you were not, nothing has been
            taken and nothing has been ordered.
          </p>
          <p className="rd-log mt-4 max-w-[52ch]">
            Either way, email <a href="mailto:sam@anotherpunk.com" className="rd-link underline underline-offset-4">sam@anotherpunk.com</a>{" "}
            and it will be sorted the same day.
          </p>
        </>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-5">
        <Link to="/shop" className="rd-link underline underline-offset-4">
          Shop
        </Link>
        <Link to="/" className="rd-link underline underline-offset-4">
          ← Back to the field
        </Link>
      </div>
    </div>
  );
}
