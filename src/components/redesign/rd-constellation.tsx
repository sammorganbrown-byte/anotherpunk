import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { AnotherPunkProduct } from "../../lib/another-punk-products";

/** The shop as a field you move through rather than a grid you scan.
 *
 * Cipher's move: navigation dissolves into a scattered constellation of
 * imagery. Products are placed on a deterministic pseudo-random field, each
 * drifting on its own slow sine, and the whole field pans with drag or
 * arrow keys. Nothing is sorted, nothing is ranked, there is no first row.
 *
 * Deterministic placement matters — a seeded hash rather than Math.random()
 * so the field is identical on server and client (no hydration mismatch)
 * and a given shirt is always in the same place, which is what makes the
 * space learnable instead of merely chaotic.
 *
 * Accessibility: every item is a real link in DOM order, reachable and
 * operable by keyboard with a visible focus ring, and the whole field is
 * replaced by a plain list under prefers-reduced-motion.
 */

function seeded(slug: string) {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Placed = {
  p: AnotherPunkProduct;
  x: number;
  y: number;
  w: number;
  phase: number;
  amp: number;
};

export function RdConstellation({
  products,
  reduced,
}: {
  products: AnotherPunkProduct[];
  reduced: boolean;
}) {
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const skyRef = useRef<HTMLDivElement | null>(null);
  const [t, setT] = useState(0);

  useEffect(() => {
    setPlaced(
      products.map((p) => {
        const r = seeded(p.slug);
        return {
          p,
          // Spread wider than the viewport on purpose: some of the range is
          // always just off-screen, so panning is rewarded.
          x: 4 + r() * 108,
          y: 6 + r() * 78,
          w: 132 + r() * 118,
          phase: r() * Math.PI * 2,
          amp: 4 + r() * 9,
        };
      }),
    );
  }, [products]);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      setT((v) => v + 0.008);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  if (reduced) {
    // Honest static fallback: the same products, same links, laid out
    // plainly. Not a degraded constellation — a list.
    return (
      <ul className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <li key={p.slug}>
            <Link to="/redesign/product/$slug" params={{ slug: p.slug }} className="rd-star block">
              <img src={p.images[0]} alt={p.title} className="aspect-[4/3] w-full" />
              <figcaption>{p.title}</figcaption>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("a")) return;
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    setDragging(true);
    skyRef.current?.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) });
  };
  const onUp = (e: React.PointerEvent) => {
    drag.current = null;
    setDragging(false);
    skyRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={skyRef}
      className="rd-sky"
      data-drag={dragging}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onKeyDown={(e) => {
        const s = 60;
        if (e.key === "ArrowLeft") setPan((v) => ({ ...v, x: v.x + s }));
        if (e.key === "ArrowRight") setPan((v) => ({ ...v, x: v.x - s }));
        if (e.key === "ArrowUp") setPan((v) => ({ ...v, y: v.y + s }));
        if (e.key === "ArrowDown") setPan((v) => ({ ...v, y: v.y - s }));
      }}
      tabIndex={0}
      role="group"
      aria-label="Product field. Drag or use arrow keys to move around."
    >
      {placed.map(({ p, x, y, w, phase, amp }) => (
        <Link
          key={p.slug}
          to="/redesign/product/$slug"
          params={{ slug: p.slug }}
          className="rd-star"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: `${w}px`,
            transform: `translate3d(${pan.x + Math.sin(t + phase) * amp}px, ${
              pan.y + Math.cos(t * 0.8 + phase) * amp
            }px, 0)`,
          }}
        >
          <img src={p.images[0]} alt={p.title} className="aspect-[4/3]" />
          <figcaption>
            {p.title} <span aria-hidden="true">·</span> €{p.price}
          </figcaption>
        </Link>
      ))}
    </div>
  );
}
