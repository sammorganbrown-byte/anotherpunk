import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCart } from "../lib/cart-context";
import { RdField } from "../components/redesign/rd-field";
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

  // The live shell's audio player is hidden by redesign.css while these
  // pages are mounted — but hiding the control does not stop the sound, so
  // a visitor would get music with no way to turn it off. Pause it on the
  // way in and hand it back on the way out. Done here, from the redesign's
  // own layout, rather than by touching ap-player.tsx.
  useEffect(() => {
    // A one-off pause on mount is not enough: the live player carries
    // autoPlay and its own retry-on-gesture logic, so it simply starts
    // again a moment later. Hold it down instead — catch `play` in the
    // capture phase for as long as these pages are mounted.
    let everPlayed = false;
    const hold = (e: Event) => {
      const el = e.target as HTMLAudioElement | null;
      if (!el || el.tagName !== "AUDIO") return;
      everPlayed = true;
      el.pause();
    };
    document.addEventListener("play", hold, true);

    const now = Array.from(document.querySelectorAll("audio"));
    now.forEach((el) => {
      if (!el.paused) {
        everPlayed = true;
        el.pause();
      }
    });

    return () => {
      document.removeEventListener("play", hold, true);
      if (!everPlayed) return;
      document.querySelectorAll("audio").forEach((el) => {
        void (el as HTMLAudioElement).play().catch(() => {
          // Leaving the redesign is a navigation, not a gesture. If the
          // browser refuses, the live player's own control still works.
        });
      });
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
          <Clock />
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-[var(--rd-rule)] px-4 py-6">
        <div className="rd-log flex flex-wrap items-center justify-between gap-3">
          <span>SHIPPED WORLDWIDE</span>
          <span>
            <a href="/classic" className="rd-link underline underline-offset-4">
              ← Previous version
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
