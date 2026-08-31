import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { AnotherPunkProduct } from "../../lib/another-punk-products";

/** The field. Navigation dissolved into a scattered constellation you move
 * through rather than a grid you scan — Cipher's move, applied to the range.
 *
 * Interaction, in layers:
 *   - drag to pan, with real momentum: release and the field keeps going,
 *     decaying on a friction curve rather than stopping dead
 *   - the cursor has a pull radius: pieces near it rise, scale up and gain
 *     their colour back, so moving the mouse feels like a light source
 *     passing over the field rather than a hover state firing
 *   - each piece drifts on its own slow orbit so the field is never still
 *   - wheel scrolls the field vertically instead of the page
 *
 * Placement is seeded from the slug, not random: identical on server and
 * client (no hydration mismatch), and a given shirt is always in the same
 * place, which is what makes the space learnable instead of merely chaotic.
 *
 * Reduced motion gets a plain static list — the same links, no field.
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
  const skyRef = useRef<HTMLDivElement | null>(null);

  // Kept in refs and written straight to the DOM in the animation loop.
  // Driving 12 transforms through React state at 60fps would re-render the
  // whole field every frame for no reason.
  const pan = useRef({ x: 0, y: 0 });
  const vel = useRef({ x: 0, y: 0 });
  const cursor = useRef({ x: -9999, y: -9999 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const nodes = useRef<(HTMLAnchorElement | null)[]>([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    setPlaced(
      products.map((p) => {
        const r = seeded(p.slug);
        return {
          p,
          x: 6 + r() * 100,
          y: 8 + r() * 74,
          w: 130 + r() * 120,
          phase: r() * Math.PI * 2,
          amp: 4 + r() * 10,
        };
      }),
    );
  }, [products]);

  useEffect(() => {
    if (reduced || placed.length === 0) return;
    let raf = 0;
    let alive = true;
    let t = 0;

    const loop = () => {
      if (!alive) return;
      t += 0.008;

      // Momentum: only while not actively dragging.
      if (!drag.current) {
        pan.current.x += vel.current.x;
        pan.current.y += vel.current.y;
        vel.current.x *= 0.94;
        vel.current.y *= 0.94;
        if (Math.abs(vel.current.x) < 0.01) vel.current.x = 0;
        if (Math.abs(vel.current.y) < 0.01) vel.current.y = 0;
      }

      const PULL = 260;
      placed.forEach((s, i) => {
        const el = nodes.current[i];
        if (!el) return;
        const dx = pan.current.x + Math.sin(t + s.phase) * s.amp;
        const dy = pan.current.y + Math.cos(t * 0.8 + s.phase) * s.amp;

        // Proximity to the cursor, measured against where the piece has
        // actually landed this frame.
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dist = Math.hypot(cursor.current.x - cx, cursor.current.y - cy);
        const near = Math.max(0, 1 - dist / PULL);

        el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${1 + near * 0.13})`;
        el.style.zIndex = String(10 + Math.round(near * 20));
        const im = el.firstElementChild as HTMLElement | null;
        if (im) {
          im.style.filter = `grayscale(${1 - near}) contrast(${1.3 - near * 0.3}) brightness(${
            0.78 + near * 0.32
          })`;
        }
      });

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [placed, reduced]);

  if (reduced) {
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
    drag.current = { x: e.clientX, y: e.clientY, px: pan.current.x, py: pan.current.y };
    vel.current = { x: 0, y: 0 };
    setDragging(true);
    skyRef.current?.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    cursor.current = { x: e.clientX, y: e.clientY };
    const d = drag.current;
    if (!d) return;
    const nx = d.px + (e.clientX - d.x);
    const ny = d.py + (e.clientY - d.y);
    vel.current = { x: nx - pan.current.x, y: ny - pan.current.y };
    pan.current = { x: nx, y: ny };
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
      onPointerLeave={() => (cursor.current = { x: -9999, y: -9999 })}
      onWheel={(e) => {
        vel.current.y -= e.deltaY * 0.12;
        vel.current.x -= e.deltaX * 0.12;
      }}
      onKeyDown={(e) => {
        const s = 14;
        if (e.key === "ArrowLeft") vel.current.x += s;
        if (e.key === "ArrowRight") vel.current.x -= s;
        if (e.key === "ArrowUp") vel.current.y += s;
        if (e.key === "ArrowDown") vel.current.y -= s;
      }}
      tabIndex={0}
      role="group"
      aria-label="Product field. Drag, scroll or use arrow keys to move around."
    >
      {placed.map(({ p, x, y, w }, i) => (
        <Link
          key={p.slug}
          ref={(el) => {
            nodes.current[i] = el;
          }}
          to="/redesign/product/$slug"
          params={{ slug: p.slug }}
          className="rd-star"
          style={{ left: `${x}%`, top: `${y}%`, width: `${w}px` }}
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
