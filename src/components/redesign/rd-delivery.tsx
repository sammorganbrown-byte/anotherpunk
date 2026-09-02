import { Link } from "@tanstack/react-router";
import { DELIVERY } from "../../lib/shipping";

/** What a customer is told about delivery, at the moment they are deciding.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 * All of this was true and all of it was on the shipping policy, which is to
 * say none of it was anywhere a person actually reads before paying. Someone
 * buying a €50 tee had no idea it would take a fortnight or come from China
 * until it had already taken a fortnight and come from China.
 *
 * THE TWO FACTS BELONG TOGETHER AND THAT IS THE WHOLE DESIGN. The wait and
 * the origin are the awkward half; the customs being paid is the reassuring
 * half, and it is the specific reassurance somebody wants the moment they
 * learn a parcel is coming from Asia. Told separately, the first is a
 * disappointment and the second is a detail nobody sees. Told together, they
 * are one honest proposition: it takes a while, and nothing else is owed.
 *
 * Delivered as fact rather than apology. There is no hedging language here
 * and no small print, because the reason for the wait — that nothing is made
 * before somebody wants it — is the same reason there is no dead stock and
 * no sale rail, and that is a thing this shop is proud of rather than sorry
 * about.
 */
export function RdDelivery({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rd-delivery" data-compact={compact ? "true" : undefined}>
      <p className="rd-delivery-line">
        <span className="rd-delivery-mark" aria-hidden="true">
          →
        </span>
        <span>
          Printed to order, so allow <strong>{DELIVERY.total}</strong>. {DELIVERY.origin}
        </span>
      </p>
      <p className="rd-delivery-line" data-good="true">
        <span className="rd-delivery-mark" aria-hidden="true">
          →
        </span>
        <span>
          <strong>{DELIVERY.duty}</strong> If you are ever charged anything on delivery, we
          refund it.
        </span>
      </p>
      {compact ? null : (
        <p className="rd-delivery-line rd-delivery-more">
          <span className="rd-delivery-mark" aria-hidden="true">
            →
          </span>
          <span>
            {DELIVERY.make} to make, then {DELIVERY.transit} in transit — most arrive within{" "}
            {DELIVERY.transitMost}. Tracked.{" "}
            <Link to="/shipping" className="rd-link underline underline-offset-4">
              Shipping in full
            </Link>
            .
          </span>
        </p>
      )}
    </div>
  );
}
