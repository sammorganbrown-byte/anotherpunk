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

/** The end of the queue.
 *
 * Same server call and the same rules as the page this replaces — the bag is
 * only cleared once Stripe actually confirms payment, so a cancelled return
 * trip leaves it intact. Dressed as the last line of a job log rather than as
 * a receipt.
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
          <RdPixelText as="h1" text="QUEUED" />
          <p className="rd-log mt-6 max-w-[52ch]">
            Payment is through. Nothing existed until you ran the job — it does now, and it gets
            printed for you. Confirmation by email, and another when it ships.
          </p>
        </>
      ) : null}

      {state === "unknown" ? (
        <>
          <RdPixelText as="h1" text="HOLD" />
          <p className="rd-log mt-6 max-w-[52ch]">
            We couldn't confirm this one automatically. If you were charged it went through — check
            your email. If not, nothing was taken.
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
