import { Link } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
 *    black and lose the range entirely. That was first fixed by clamping the
 *    pan to a finite world, which stopped the loss but put a wall at the edge
 *    of it. The field is now a TORUS instead: each piece is folded back into
 *    the world's width and height every frame, so what leaves behind you
 *    comes round in front. No wall, no abyss, and no end to the scroll.
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
/** How far past the edge a piece travels before it comes round the other
 * side. Must exceed the widest piece, or one would pop back into view while
 * still partly on screen. */
/** Where the CRT slider starts, 0..1. This is the shipped look — change THIS
 * to change what every visitor sees. Chosen on the slider, then baked in. */
const CRT_DEFAULT = 0.5;

const WRAP_MARGIN = 560;

/** Fold a coordinate onto a torus: `v` brought into [-margin, size - margin).
 * The double modulo is not superstition — JS `%` keeps the sign of the left
 * operand, so a negative pan would otherwise place pieces off the wrong end. */
function wrapAxis(v: number, size: number, margin: number) {
  return ((((v + margin) % size) + size) % size) - margin;
}

function buildPieces(products: AnotherPunkProduct[], world: { w: number; h: number }): Piece[] {
  // Group first, then INTERLEAVE. Walking the catalogue product by product
  // handed consecutive grid cells to the same garment, so the field came out
  // in clumps — six photographs of one tee together and another product not
  // visible at all until you panned. Taking one image from each product in
  // turn, then going round again, puts a different product in every adjacent
  // cell, so whatever part of the field you are looking at shows most of the
  // range rather than a few things repeated.
  const byProduct = products.map((p) =>
    // Skip anything the product marks as product-page-only — flat packshots,
    // which read as dead weight floating among photographs of people.
    p.images.filter((src) => !p.notInField?.includes(src)).map((src) => ({ p, src, label: true })),
  );
  const raw: { p: AnotherPunkProduct; src: string; label: boolean }[] = [];
  const deepest = Math.max(0, ...byProduct.map((imgs) => imgs.length));
  for (let round = 0; round < deepest; round++) {
    for (const imgs of byProduct) {
      if (imgs[round]) raw.push(imgs[round]);
    }
  }

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
      // Drift amplitude. Raised now that the wordmark no longer pushes
      // pieces around: with the exclusion zone gone that was the only large
      // movement in the middle of the field, so the drift has to carry it.
      amp: 7 + rnd() * 16,
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
  const worldRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);

  // Sized from the number of photographs, so adding products spreads the
  // field out instead of crowding it.
  const world = useRef({ w: 2400, h: 1700 });
  // Read inside the animation loop, which is not re-created when the level
  // changes.
  const crtRef = useRef(0);
  const pan = useRef({ x: 0, y: 0 });
  const vel = useRef({ x: 0, y: 0 });
  const cursor = useRef({ x: -9999, y: -9999 });
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);

  // CRT intensity, 0..1. The on/off switch is gone: the effect is the look
  // now, not an experiment to compare against. 0 on the slider is what used
  // to be "ON" — the floor, not an absence — and it only goes up from there.
  // The site ships at CRT_DEFAULT, which is not the floor.
  //
  // Deliberately NOT persisted. It was, and the result was that whoever had
  // dragged it once never saw the shipped look again — their own browser kept
  // handing them their old experiment back, which reads as the site booting
  // at the wrong level. The slider is for choosing a value to bake in as
  // CRT_DEFAULT above, not for remembering one per visitor.
  const [crt, setCrt] = useState(CRT_DEFAULT);
  useEffect(() => {
    crtRef.current = crt;
    // The bloom is CSS, so it is handed over as a custom property rather than
    // written per-frame — it only changes when the slider does.
    const sky = skyRef.current;
    sky?.style.setProperty("--rd-crt-blur", `${(0.35 + crt * 1.15).toFixed(2)}px`);
    sky?.style.setProperty("--rd-crt-f", (8 + crt * 16).toFixed(2));
  }, [crt]);

  const setCrtLevel = (next: number) => setCrt(next);
  // The opening placement is written imperatively in a layout effect below,
  // NOT as an inline style prop. It used to be a prop on .rd-world, which
  // meant every re-render — and `dragging` state toggles one on every single
  // drag — re-applied the opening transform over whatever the animation loop
  // had just written. The rule this cost us: nothing the loop animates may
  // also be set from React, or React wins at the worst possible moment.
  // Survives pointerup. `drag` is cleared on release, which happens BEFORE
  // the click event, so checking it in the click handler always saw null and
  // the suppression never fired — meaning a pan ended by navigating to
  // whichever product you happened to let go over.
  const suppressClick = useRef(false);

  useEffect(() => {
    // Size the world against the VIEWPORT, not just the photo count. Sizing
    // it from the count alone made it several screens wide on a laptop and
    // enormous on a phone, so the field opened on a near-empty view and you
    // had to go looking for the clothes. Roughly two and a half screens in
    // each direction is enough to reward panning while still filling the
    // first one.
    const el = skyRef.current;
    const vw = el?.clientWidth || window.innerWidth;
    const vh = el?.clientHeight || window.innerHeight;
    world.current = {
      w: Math.max(1500, Math.round(vw * 2.4)),
      h: Math.max(1200, Math.round(vh * 2.6)),
    };
    setPieces(buildPieces(products, world.current));

    // Open on the middle of the field, not its top-left corner. The pan
    // started at 0,0, which put the viewport in the empty corner of a world
    // several screens wide — and with the mark clearing a hole in the centre
    // the first thing you saw was mostly nothing.
    pan.current = {
      x: (vw - world.current.w) / 2,
      y: (vh - world.current.h) / 2,
    };
  }, [products]);

  // The first correct frame, painted before the browser gets a chance to show
  // the raw layout. The pieces sit at their world coordinates in CSS — the
  // top-left corner of something several screens wide — so without this the
  // field flashes at the wrong offset until the first animation frame lands.
  useLayoutEffect(() => {
    if (pieces.length === 0) return;
    const W = world.current.w;
    const H = world.current.h;
    pieces.forEach((s, i) => {
      const el = nodes.current[i];
      if (!el) return;
      const wx = wrapAxis(s.x + pan.current.x, W, WRAP_MARGIN);
      const wy = wrapAxis(s.y + pan.current.y, H, WRAP_MARGIN);
      el.style.transform = `translate3d(${wx - s.x}px, ${wy - s.y}px, 0)`;
    });
  }, [pieces]);

  useEffect(() => {
    if (reduced || pieces.length === 0) return;
    let raf = 0;
    let alive = true;
    let t = 0;

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

      // The world container is stationary — each piece is placed individually
      // now (see the wrap below).
      const W = world.current.w;
      const H = world.current.h;

      const PULL = 250;

      // The wordmark no longer pushes photographs out of the way. It used to
      // clear an ellipse in the middle of the field, which meant the one part
      // of the screen you always look at was the one part with nothing in it.
      // The pieces pass underneath it instead — the mark simply sits above
      // them in the stack — so the field stays dense all the way through the
      // centre and the mark reads as printed ON the field rather than as a
      // hole punched in it.
      pieces.forEach((s, i) => {
        const el = nodes.current[i];
        if (!el) return;
        // The field is a torus. Rather than sliding one finite world under
        // the viewport and stopping at its edge, every piece is folded back
        // into the world's own width and height — so whatever leaves behind
        // you comes round in front, and there is no edge to reach.
        const wx = wrapAxis(s.x + pan.current.x, W, WRAP_MARGIN);
        const wy = wrapAxis(s.y + pan.current.y, H, WRAP_MARGIN);
        let dx = wx - s.x + Math.sin(t + s.phase) * s.amp;
        let dy = wy - s.y + Math.cos(t * 0.8 + s.phase) * s.amp;

        // Screen position = CSS layout (s.x/s.y) + the delta we apply here.
        let cx = s.x + dx + s.w / 2;
        let cy = s.y + dy + s.w * 0.375;

        const dist = Math.hypot(cursor.current.x - cx, cursor.current.y - cy);
        const near = Math.max(0, 1 - dist / PULL);

        // dx/dy are already the full offset from the layout position, the
        // pan included, because the world underneath is stationary.
        el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${1 + near * 0.14})`;
        el.style.zIndex = String(10 + Math.round(near * 30));
        const im = el.querySelector(".rd-shot img") as HTMLElement | null;
        if (im) {
          // Resolution as a state, not a skin: the field rests as a 90s
          // screen and SHARPENS toward whatever you move at. The pixel
          // quantisation is done by rendering the image small and scaling it
          // back up with nearest-neighbour, which is genuine blockiness
          // rather than a blur pretending to be it.
          // The resting block size is the ceiling; moving toward a piece
          // walks it back down to 1 (full resolution). The slider raises the
          // ceiling only — the sharpening under the cursor is untouched, so
          // turning it up makes the field coarser without making the thing
          // you are looking at harder to see.
          const ceiling = 8 + crtRef.current * 16;
          const f = 1 + (1 - near) * (ceiling - 1);
          im.style.width = `${100 / f}%`;
          im.style.height = `${100 / f}%`;
          im.style.transform = `scale(${f})`;
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
            <Link to="/product/$slug" params={{ slug: p.slug }} className="rd-star block">
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
      data-crt="true"
      style={{ touchAction: "none" }}
      data-drag={dragging}
      onPointerDown={(e) => {
        // Start a drag wherever the pointer lands, links included.
        //
        // NOTE: no setPointerCapture here, deliberately. Capturing on press
        // retargets the whole gesture to this element, so the click that
        // follows a simple tap was being delivered to the canvas instead of
        // the link under the finger — which is why nothing opened. Capture
        // is taken lazily in onPointerMove, only once the pointer has
        // travelled far enough to count as a drag.
        drag.current = {
          x: e.clientX,
          y: e.clientY,
          px: pan.current.x,
          py: pan.current.y,
          moved: false,
        };
        vel.current = { x: 0, y: 0 };
        setDragging(true);
      }}
      onPointerMove={(e) => {
        cursor.current = { x: e.clientX, y: e.clientY };
        const d = drag.current;
        if (!d) return;
        const ddx = e.clientX - d.x;
        const ddy = e.clientY - d.y;
        if (!d.moved && Math.hypot(ddx, ddy) > DRAG_SLOP) {
          d.moved = true;
          // Now it is genuinely a drag, so take the pointer.
          try {
            skyRef.current?.setPointerCapture(e.pointerId);
          } catch {
            // Pointer already gone; panning still works without capture.
          }
        }
        // Nothing to pan until the gesture clears the slop threshold.
        if (!d.moved) return;
        const nx = d.px + ddx;
        const ny = d.py + ddy;
        vel.current = { x: nx - pan.current.x, y: ny - pan.current.y };
        pan.current = { x: nx, y: ny };
      }}
      onPointerUp={(e) => {
        suppressClick.current = drag.current?.moved ?? false;
        drag.current = null;
        setDragging(false);
        try {
          if (skyRef.current?.hasPointerCapture(e.pointerId)) {
            skyRef.current.releasePointerCapture(e.pointerId);
          }
        } catch {
          // Never captured — a tap. Nothing to release.
        }
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
      <div ref={worldRef} className="rd-world">
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
            to="/product/$slug"
            params={{ slug: s.p.slug }}
            className="rd-star-link"
            draggable={false}
            aria-label={`${s.p.title}, \u20ac${s.p.price}`}
          >
            {/* The frame holds the layout; the photograph floats inside it.
                CRT mode quantises by rendering the image small and scaling it
                back up — and while that image was still the sizing element,
                shrinking it shrank the whole piece and let the scaled-up
                result cover the caption. That is what made the pieces jump
                in size and lose their words. */}
            <span className="rd-shot">
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
                draggable={false}
              />
            </span>
            {s.label ? (
              <figcaption>
                {s.p.title} <span aria-hidden="true">·</span> €{s.p.price}
              </figcaption>
            ) : null}
          </Link>
        </div>
        ))}
      </div>

      <div className="rd-crt-lines" aria-hidden="true" />
      <div className="rd-crt-vig" aria-hidden="true" />

      <label className="rd-crt-ctl" onPointerDown={(e) => e.stopPropagation()}>
        <span className="rd-crt-ctl-label">CRT {String(Math.round(crt * 100)).padStart(2, "0")}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={crt}
          onChange={(e) => setCrtLevel(Number(e.currentTarget.value))}
          aria-label="CRT intensity"
        />
      </label>
    </div>
  );
}
