import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { AnotherPunkProduct } from "../../lib/another-punk-products";

/** The field: the store and the homepage, one object.
 *
 * Fixes over the first pass, all of them things that made it unusable:
 *
 *  - DRAG WAS DEAD. The old handler bailed out whenever the pointer landed
 *    on a link, and the pieces ARE links covering most of the screen, so a
 *    drag almost never started. Now a drag begins anywhere; the link click
 *    is suppressed only if the pointer actually travelled (DRAG_SLOP), so
 *    press-and-move pans and press-and-release still opens the product.
 *
 *  - THE ABYSS. Panning was unbounded, so you could sail off into empty
 *    black and lose the range entirely. Pieces now live in a finite world
 *    and the pan is clamped to it with a little overscan, so the field
 *    always stays on screen.
 *
 *  - PILE-UPS. Positions were pure random, which stacks things. They are
 *    now scattered within cells of a jittered grid sized to the number of
 *    pieces, which guarantees breathing room while still looking strewn.
 *
 *  - ONE PICTURE PER PRODUCT. The field showed only images[0]. It now
 *    floats several frames per garment, so the same shirt recurs in
 *    different shots as you move.
 */

const DRAG_SLOP = 6;

function seeded(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
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

type Piece = {
  key: string;
  p: AnotherPunkProduct;
  src: string;
  /** World-space px. */
  x: number;
  y: number;
  w: number;
  phase: number;
  amp: number;
  /** Every frame carries the garment's name and price. */
  label: boolean;
};

/** EVERY frame of every garment. A shirt recurring in three different shots
 * is the point — it reads as a contact sheet strewn across a table rather
 * than a catalogue with one hero each. The world grows with the count so
 * density stays constant however many photographs exist. */
function buildPieces(products: AnotherPunkProduct[], world: { w: number; h: number }): Piece[] {
  const raw: { p: AnotherPunkProduct; src: string; label: boolean }[] = [];
  products.forEach((p) => {
    p.images.forEach((src) => raw.push({ p, src, label: true }));
  });

  // Jittered grid: roughly square, one cell per piece, scattered inside it.
  const cols = Math.ceil(Math.sqrt(raw.length * (world.w / world.h)));
  const rows = Math.ceil(raw.length / cols);
  const cw = world.w / cols;
  const ch = world.h / rows;

  return raw.map((r, i) => {
    const rnd = seeded(r.src + i);
    const cx = (i % cols) * cw;
    const cy = Math.floor(i / cols) * ch;
    const w = 150 + rnd() * 130;
    const h = w * 0.75;
    // A piece may spill up to ~10% of its own size into the neighbouring
    // cell, in either direction. Enough that the field reads as a strewn
    // contact sheet rather than a disguised grid, without pieces burying
    // each other the way pure random placement did.
    const OVERLAP = 0.1;
    const spanX = Math.max(10, cw - w) + w * OVERLAP * 2;
    const spanY = Math.max(10, ch - h) + h * OVERLAP * 2;
    return {
      key: `${r.p.slug}-${i}`,
      p: r.p,
      src: r.src,
      label: r.label,
      w,
      x: cx - w * OVERLAP + rnd() * spanX,
      y: cy - h * OVERLAP + rnd() * spanY,
      phase: rnd() * Math.PI * 2,
      amp: 3 + rnd() * 8,
    };
  });
}

export function RdConstellation({
  products,
  reduced,
}: {
  products: AnotherPunkProduct[];
  reduced: boolean;
}) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const skyRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);

  // Sized from the number of photographs, so adding products spreads the
  // field out instead of crowding it.
  const world = useRef({ w: 2400, h: 1700 });
  const pan = useRef({ x: 0, y: 0 });
  const vel = useRef({ x: 0, y: 0 });
  const cursor = useRef({ x: -9999, y: -9999 });
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);
  // Survives pointerup. `drag` is cleared on release, which happens BEFORE
  // the click event, so checking it in the click handler always saw null and
  // the suppression never fired — meaning a pan ended by navigating to
  // whichever product you happened to let go over.
  const suppressClick = useRef(false);

  useEffect(() => {
    const count = products.reduce((n, p) => n + p.images.length, 0);
    const area = count * 340 * 300;
    const ratio = 1.45;
    world.current = {
      w: Math.max(1800, Math.round(Math.sqrt(area * ratio))),
      h: Math.max(1300, Math.round(Math.sqrt(area / ratio))),
    };
    setPieces(buildPieces(products, world.current));
  }, [products]);

  useEffect(() => {
    if (reduced || pieces.length === 0) return;
    let raf = 0;
    let alive = true;
    let t = 0;

    const clamp = () => {
      const el = skyRef.current;
      if (!el) return;
      const vw = el.clientWidth;
      const vh = el.clientHeight;
      // Overscan so the edge of the field never snaps hard against the frame.
      const pad = 160;
      const minX = Math.min(0, vw - world.current.w - pad);
      const minY = Math.min(0, vh - world.current.h - pad);
      pan.current.x = Math.min(pad, Math.max(minX, pan.current.x));
      pan.current.y = Math.min(pad, Math.max(minY, pan.current.y));
    };

    const loop = () => {
      if (!alive) return;
      t += 0.008;

      if (!drag.current) {
        pan.current.x += vel.current.x;
        pan.current.y += vel.current.y;
        vel.current.x *= 0.93;
        vel.current.y *= 0.93;
        if (Math.abs(vel.current.x) < 0.02) vel.current.x = 0;
        if (Math.abs(vel.current.y) < 0.02) vel.current.y = 0;
      }
      clamp();

      const PULL = 250;

      // The wordmark holds the middle of the screen and photographs are not
      // allowed to cross it. Read its box once per frame (not per piece) and
      // treat it as an exclusion zone: anything that would land on top of it
      // gets pushed radially outwards just far enough to clear.
      const markEl = document.querySelector(".rd-pin-logo") as HTMLElement | null;
      const mark = markEl?.getBoundingClientRect() ?? null;
      const mx = mark ? mark.left + mark.width / 2 : 0;
      const my = mark ? mark.top + mark.height / 2 : 0;
      // A circle around the mark, sized to its longest edge plus breathing room.
      const markR = mark ? Math.max(mark.width, mark.height) * 0.5 + 26 : 0;

      pieces.forEach((s, i) => {
        const el = nodes.current[i];
        if (!el) return;
        let dx = pan.current.x + Math.sin(t + s.phase) * s.amp;
        let dy = pan.current.y + Math.cos(t * 0.8 + s.phase) * s.amp;

        // Screen position = CSS layout (s.x/s.y) + the delta we apply here.
        let cx = s.x + dx + s.w / 2;
        let cy = s.y + dy + s.w * 0.375;

        if (mark) {
          const pr = Math.max(s.w, s.w * 0.75) * 0.5;
          const vx = cx - mx;
          const vy = cy - my;
          const d = Math.hypot(vx, vy) || 0.0001;
          const need = markR + pr;
          if (d < need) {
            // Push straight out along the line from the mark to the piece.
            const k = (need - d) / d;
            const ox = vx * k;
            const oy = vy * k;
            dx += ox;
            dy += oy;
            cx += ox;
            cy += oy;
          }
        }
        const dist = Math.hypot(cursor.current.x - cx, cursor.current.y - cy);
        const near = Math.max(0, 1 - dist / PULL);

        el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${1 + near * 0.14})`;
        el.style.zIndex = String(10 + Math.round(near * 30));
        const im = el.querySelector("img") as HTMLElement | null;
        if (im) {
          // Rest at partly-desaturated, resolve to full colour under the
          // cursor. Matches the CSS resting state so there is no jump on the
          // first frame.
          im.style.filter = `grayscale(${0.55 - near * 0.55}) contrast(${
            1.15 - near * 0.1
          }) brightness(${0.85 + near * 0.25}) saturate(${1.1 + near * 0.15})`;
        }
      });

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [pieces, reduced]);

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

  return (
    <div
      ref={skyRef}
      className="rd-sky"
      style={{ touchAction: "none" }}
      data-drag={dragging}
      onPointerDown={(e) => {
        // Start a drag wherever the pointer lands, links included.
        drag.current = {
          x: e.clientX,
          y: e.clientY,
          px: pan.current.x,
          py: pan.current.y,
          moved: false,
        };
        vel.current = { x: 0, y: 0 };
        setDragging(true);
        skyRef.current?.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        cursor.current = { x: e.clientX, y: e.clientY };
        const d = drag.current;
        if (!d) return;
        const ddx = e.clientX - d.x;
        const ddy = e.clientY - d.y;
        if (!d.moved && Math.hypot(ddx, ddy) > DRAG_SLOP) d.moved = true;
        const nx = d.px + ddx;
        const ny = d.py + ddy;
        vel.current = { x: nx - pan.current.x, y: ny - pan.current.y };
        pan.current = { x: nx, y: ny };
      }}
      onPointerUp={(e) => {
        suppressClick.current = drag.current?.moved ?? false;
        drag.current = null;
        setDragging(false);
        skyRef.current?.releasePointerCapture(e.pointerId);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setDragging(false);
      }}
      onPointerLeave={() => (cursor.current = { x: -9999, y: -9999 })}
      // A pan that ended in movement must not also open a product; a press
      // that never travelled must still open it.
      onClickCapture={(e) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onWheel={(e) => {
        vel.current.y -= e.deltaY * 0.1;
        vel.current.x -= e.deltaX * 0.1;
      }}
      onKeyDown={(e) => {
        const s = 16;
        if (e.key === "ArrowLeft") vel.current.x += s;
        if (e.key === "ArrowRight") vel.current.x -= s;
        if (e.key === "ArrowUp") vel.current.y += s;
        if (e.key === "ArrowDown") vel.current.y -= s;
      }}
      tabIndex={0}
      role="group"
      aria-label="Product field. Drag, scroll or use arrow keys to move around."
    >
      {pieces.map((s, i) => (
        // The ref lives on this div, NOT on the Link. TanStack's Link does
        // not forward a ref to its underlying <a>, so the animation loop was
        // reading null for every piece and skipping all of them — which is
        // why nothing drifted and dragging appeared dead.
        <div
          key={s.key}
          ref={(el) => {
            nodes.current[i] = el;
          }}
          className="rd-star"
          style={{ left: `${s.x}px`, top: `${s.y}px`, width: `${s.w}px` }}
        >
          <Link
            to="/redesign/product/$slug"
            params={{ slug: s.p.slug }}
            className="rd-star-link"
            draggable={false}
            aria-label={`${s.p.title}, \u20ac${s.p.price}`}
          >
            <img
              src={s.src}
              alt=""
              aria-hidden="true"
              // The first handful are the ones on screen at load. Lazy-loading
              // those meant the field appeared as empty outlines and filled in
              // afterwards; the rest stay lazy so 76 photographs do not all
              // fetch at once.
              loading={i < 10 ? "eager" : "lazy"}
              fetchPriority={i < 6 ? "high" : "auto"}
              decoding="async"
              className="aspect-[4/3]"
              draggable={false}
            />
            {s.label ? (
              <figcaption>
                {s.p.title} <span aria-hidden="true">·</span> €{s.p.price}
              </figcaption>
            ) : null}
          </Link>
        </div>
      ))}
    </div>
  );
}
