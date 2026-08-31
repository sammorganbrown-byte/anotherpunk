import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ANOTHER_PUNK_PRODUCTS } from "../../lib/another-punk-products";
import { RdConstellation } from "../../components/redesign/rd-constellation";
import { RdBoot, hasBooted } from "../../components/redesign/rd-boot";
import { useReducedMotion } from "./route";
import { RdAsciiMark } from "../../components/redesign/rd-ascii-mark";

export const Route = createFileRoute("/redesign/")({ component: RedesignHome });

/** The homepage IS the field.
 *
 * No hero, no manifesto, no log of positioning statements — the range is
 * the landing page, and the only copy is the mark and the twelve names.
 * The site should look open for business, not like an argument about
 * inventory, so every "nothing exists yet" line is gone.
 */
function RedesignHome() {
  const reduced = useReducedMotion();
  const [booting, setBooting] = useState(false);

  useEffect(() => {
    if (!reduced && !hasBooted()) setBooting(true);
  }, [reduced]);

  return (
    <>
      {booting ? <RdBoot onDone={() => setBooting(false)} /> : null}

      {/* The mark sits over the field, not above it. Pointer-events off so
          it never blocks a drag. */}
      <div className="rd-mark" aria-hidden="true">
        <RdAsciiMark cols={96} />
      </div>

      <RdConstellation products={ANOTHER_PUNK_PRODUCTS} reduced={reduced} />

      <p className="rd-hint rd-above" aria-hidden="true">
        {reduced ? "" : "Drag · scroll · arrows"}
      </p>
    </>
  );
}
