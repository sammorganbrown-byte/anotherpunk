import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ANOTHER_PUNK_PRODUCTS } from "../../lib/another-punk-products";
import { RdConstellation } from "../../components/redesign/rd-constellation";
import { RdBoot, hasBooted } from "../../components/redesign/rd-boot";
import { RdLogoCard, RdShopCard } from "../../components/redesign/rd-pinned";
import { useReducedMotion } from "../_shell";

export const Route = createFileRoute("/_shell/")({ component: RedesignHome });

/** The homepage is the field, and the field is the store.
 *
 * Layers, back to front: the campaign film running heavily degraded behind
 * everything, then the grain, then the photographs you can push around, then
 * two pinned cards — the mark and the way into the grid — that never drift
 * off however far you wander.
 */
function RedesignHome() {
  const reduced = useReducedMotion();
  const [booting, setBooting] = useState(false);
  const vid = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!reduced && !hasBooted()) setBooting(true);
  }, [reduced]);

  useEffect(() => {
    const el = vid.current;
    if (!el || reduced) return;
    // Muted + playsInline + the attribute is what iOS actually honours; this
    // is the nudge for anything that ignored it.
    void el.play().catch(() => {
      // Refused. The poster frame is a perfectly good still backdrop.
    });
  }, [reduced]);

  return (
    <>
      {booting ? <RdBoot onDone={() => setBooting(false)} /> : null}

      {/* The campaign film, pushed right down under the grain — movement in
          the room rather than something to watch. Silent, and never mounted
          for anyone who asked for less motion. */}
      {reduced ? null : (
        <video
          ref={vid}
          className="rd-backfilm"
          poster="/img/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src="/video/ap-hero.webm" type='video/webm; codecs="vp9"' />
          <source src="/video/ap-hero.mp4" type='video/mp4; codecs="avc1.640028"' />
        </video>
      )}

      <RdConstellation products={ANOTHER_PUNK_PRODUCTS} reduced={reduced} />

      {reduced ? null : <RdLogoCard />}
      <RdShopCard />

      <p className="rd-hint rd-above" aria-hidden="true">
        {reduced ? "" : "Drag to move"}
      </p>
    </>
  );
}
