import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSessionStatus } from "../lib/api/checkout.functions";
import { useCart } from "../lib/cart-context";

export const Route = createFileRoute("/order-confirmed")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: OrderConfirmed,
});

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
          // Only clear once payment is actually confirmed — a cancelled
          // return trip should leave the bag intact.
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
    <div className="mx-auto flex min-h-[70vh] max-w-[900px] flex-col items-center justify-center gap-6 px-6 text-center">
      {state === "checking" && <p className="ap-eyebrow text-ink-2">Confirming…</p>}

      {state === "paid" && (
        <>
          <h1 className="ap-statement text-pink">In</h1>
          <p className="max-w-[42ch] text-sm leading-relaxed text-ink-2">
            Payment's through and your order is queued for print. You'll get a confirmation by
            email, and another when it ships.
          </p>
        </>
      )}

      {state === "unknown" && (
        <>
          <h1 className="ap-statement text-ink">Hold on</h1>
          <p className="max-w-[42ch] text-sm leading-relaxed text-ink-2">
            We couldn't confirm this order automatically. If you were charged it's gone through —
            check your email. If not, nothing was taken.
          </p>
        </>
      )}

      <Link
        to="/shop"
        className="font-label mt-2 bg-ink px-8 py-4 text-xs font-medium tracking-[0.14em] text-paper uppercase transition-opacity hover:opacity-90"
      >
        Back to the range
      </Link>
    </div>
  );
}
