import { createFileRoute } from "@tanstack/react-router";
import { ANOTHER_PUNK_PRODUCTS } from "../../lib/another-punk-products";
import { RdConstellation } from "../../components/redesign/rd-constellation";
import { useReducedMotion } from "./route";

export const Route = createFileRoute("/redesign/shop")({ component: RedesignShop });

/** No grid. The catalogue is a field you move through — drag, or arrows. */
function RedesignShop() {
  const reduced = useReducedMotion();
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--rd-rule)] px-4 py-3">
        <h1 className="rd-label">
          Field <span className="rd-key">·</span> {ANOTHER_PUNK_PRODUCTS.length} jobs
        </h1>
        <p className="rd-log">
          {reduced ? "Static list — motion reduced" : "Drag to move · arrow keys to pan"}
        </p>
      </div>
      <RdConstellation products={ANOTHER_PUNK_PRODUCTS} reduced={reduced} />
    </>
  );
}
