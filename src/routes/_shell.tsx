import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../lib/cart-context";
import { RdField } from "../components/redesign/rd-field";
import { RdPlayer } from "../components/redesign/rd-player";
import { RdCurrency } from "../components/redesign/rd-currency";
import rdCss from "../styles/redesign.css?url";

/** The official hand-painted wordmark — the brand mark, not a typeface.
 * Same asset the live site uses. */
export const LOGO_URL =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/00048e3d-cede-4c1a-a65e-222abb97d9a9.png";

/** Layout route for the whole site.
 *
 * This was built as a parallel direction under /redesign and is now the site
 * itself, so it owns the clean paths: /, /shop, /product/$slug, /cart,
 * /checkout, /order-confirmed. It is a PATHLESS layout (the leading
 * underscore), which is what lets it wrap those routes without adding a
 * segment of its own to any URL.
 *
 * The previous site is kept intact under /classic for rollback, noindexed so
 * only one version is in search. Both trees share the same data layer, cart
 * and Stripe path.
 *
 * The `data-ap-rd` attribute scopes every rule in redesign.css, and is also
 * what the stylesheet's :has() rule keys off to hide the old header, footer
 * and music player — they still render from __root.tsx for /classic, and are
 * simply not shown here.
 */
export const Route = createFileRoute("/_shell")({
  head: () => ({
    meta: [
      { title: "Another Punk" },
      {
        name: "description",
        content: "Nothing exists until you run the job. Drawn by hand, printed to order.",
      },
    ],
    links: [{ rel: "stylesheet", href: rdCss }],
  }),
  component: RedesignLayout,
});

/** Reads the OS motion preference and keeps up if it changes mid-session. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function Clock() {
  const [now, setNow] = useState<string>("--:--:--");
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("en-GB", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="rd-log tabular-nums" aria-hidden="true">
      {now}
    </span>
  );
}

function RedesignLayout() {
  const { count } = useCart();
  const reduced = useReducedMotion();
  const path = useRouterState({ select: (s) => s.location.pathname });

  // --rd-foot-h was a hardcoded 34px that eight rules depend on, including
  // the product page's viewport lock and the now-playing panel's offset. It
  // stopped being true the moment the footer could wrap — on a phone it is
  // nearer 100px — so the panel came to rest on top of the footer's own
  // controls. The previous fix padded the footer to make room, which meant
  // the bar visibly grew the moment you pressed play. Measuring it instead
  // fixes the cause: everything positioned against the footer now knows how
  // tall the footer actually is.
  const footRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = footRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    // Written onto the element that declares the token, not the root: the
    // default lives on [data-ap-rd], so a value set higher up is shadowed for
    // everything inside and the panel keeps using the 34px guess.
    const host = el.closest("[data-ap-rd]") as HTMLElement | null;
    if (!host) return;
    let last = -1;
    const apply = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h === last || h === 0) return;
      last = h;
      host.style.setProperty("--rd-foot-h", `${h}px`);
    };

    // Deliberately more than one trigger. A single ResizeObserver measured
    // the footer before the webfont had settled and then stayed quiet, so the
    // token kept a height that was 27px short and the panel sat on the
    // switcher anyway. These are all cheap, they all no-op once the height
    // stops changing, and between them there is no moment where the footer
    // can resize without something noticing.
    apply();
    const raf = requestAnimationFrame(apply);
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    window.addEventListener("load", apply);
    document.fonts?.ready.then(apply).catch(() => {});
    const settle = window.setTimeout(apply, 1200);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", apply);
      window.removeEventListener("load", apply);
      window.clearTimeout(settle);
    };
  }, []);

  return (
    <div data-ap-rd className="min-h-dvh">
      {reduced ? null : <RdField />}
      <div className="rd-scan" aria-hidden="true" />

      <header className="rd-bar">
        <Link to="/" className="rd-brand">
          Another Punk
        </Link>

        {/* Separated by a single red pixel rather than by space alone, so the
            bar reads as one continuous terminal line. The separators are
            drawn by CSS between items and are decoration only. */}
        <nav className="rd-nav" aria-label="Redesign">
          <Link
            to="/shop"
            className="rd-link"
            data-on={path.startsWith("/shop")}
          >
            Shop
          </Link>
          <a href="mailto:hello@anotherpunk.com" className="rd-link">
            Contact
          </a>
          <Link to="/cart" className="rd-link" data-on={path.startsWith("/cart")}>
            Bag [{count}]
          </Link>
          <RdPlayer />
          <Clock />
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer ref={footRef} className="border-t border-[var(--rd-rule)] px-4 py-6">
        <div className="rd-log flex flex-wrap items-center justify-between gap-3">
          <span>SHIPPED WORLDWIDE</span>
          <RdCurrency />
        </div>
      </footer>
    </div>
  );
}
