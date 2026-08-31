import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Reveal } from "../../components/reveal";
import { ApMarquee } from "../../components/another-punk/ap-marquee";
import { ApTextMarquee } from "../../components/another-punk/ap-text-marquee";
import { ApQuotePlate } from "../../components/another-punk/ap-quote-plate";
import { ANOTHER_PUNK_PRODUCTS, AP_IMAGERY } from "../../lib/another-punk-products";
import { useCurrency } from "../../lib/currency-context";

export const Route = createFileRoute("/classic/")({
  head: () => ({
    // Kept for rollback, not for visitors: the current site lives at /.
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  component: AnotherPunkHome,
});

const LOGO_URL =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/00048e3d-cede-4c1a-a65e-222abb97d9a9.png";

const FEATURED_SLUGS = ["bat-country", "tongue-box", "the-jesus"];

function ProductTile({
  slug,
  title,
  image,
  price,
  index,
  formatPrice,
}: {
  slug: string;
  title: string;
  image: string;
  price: number;
  index: number;
  formatPrice: (n: number) => string;
}) {
  return (
    <Link to="/classic/product/$slug" params={{ slug }} className="group block">
      <div className="ap-tile-img aspect-[3/4] w-full bg-surface-2">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </div>
      <div className="mt-4 flex items-baseline gap-3 border-t border-ink pt-3">
        <span className="ap-index">{String(index).padStart(2, "0")}</span>
        <span className="font-display flex-1 text-sm font-bold text-ink uppercase">{title}</span>
        <span className="font-label text-xs text-ink-2">{formatPrice(price)}</span>
      </div>
    </Link>
  );
}

/** Homepage hero: the campaign film full-bleed, the mark over the top.
 *
 * Muted and silent on purpose. The site already plays the Boudicca tracks
 * through the player, two audio sources would fight, and browsers only
 * autoplay video that is muted anyway.
 *
 * No `autoPlay` attribute: playback is started in an effect so we can honour
 * prefers-reduced-motion, where the poster frame is left showing instead. */
function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // Reduced motion: the autoplay attribute below will have started it, so
    // stop it and leave the poster frame showing.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.pause();
      el.currentTime = 0;
      return;
    }

    // iOS Safari will not reliably start a video from a bare programmatic
    // play() with no user gesture — it refuses silently. The `autoplay`
    // attribute IS honoured there for muted + playsinline video, so that
    // does the real work; this is a nudge for anything that ignored it, and
    // a gesture fallback for the cases that still refuse (Low Power Mode).
    let done = false;
    const start = () => {
      if (done) return;
      void el
        .play()
        .then(() => {
          done = true;
          window.removeEventListener("pointerdown", start);
          window.removeEventListener("scroll", start);
        })
        .catch(() => {
          // Poster stays up. Perfectly good hero on its own.
        });
    };
    start();
    window.addEventListener("pointerdown", start, { passive: true });
    window.addEventListener("scroll", start, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("scroll", start);
    };
  }, []);

  return (
    <section className="relative flex min-h-[86vh] flex-col items-center justify-center overflow-hidden px-6 py-24 text-center sm:px-10">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        poster="/img/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="/video/ap-hero.webm" type='video/webm; codecs="vp9"' />
        <source src="/video/ap-hero.mp4" type='video/mp4; codecs="avc1.640028"' />
      </video>

      {/* Scrim. The footage is mid-grey concrete and the mark is red, so
          without this the logo sits at roughly 2:1 contrast and disappears. */}
      <div
        className="absolute inset-0 bg-ink/55"
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center">
        <p className="ap-eyebrow mb-8 text-paper/80">No stock. No season. No repeat.</p>
        <img
          src={LOGO_URL}
          alt="Another Punk"
          className="ap-hero-enter ap-glitch w-full max-w-4xl px-2 brightness-0 invert"
        />
        <div className="mt-12 h-2 w-28 bg-pink" aria-hidden="true" />
      </div>
    </section>
  );
}

function AnotherPunkHome() {
  const { formatPrice } = useCurrency();
  const featured = ANOTHER_PUNK_PRODUCTS.filter((p) => FEATURED_SLUGS.includes(p.slug));
  const rest = ANOTHER_PUNK_PRODUCTS.filter((p) => !FEATURED_SLUGS.includes(p.slug));

  return (
    <div className="ap-grain">
      <HeroVideo />

      <ApMarquee />

      {/* The whole range, one frame, edge to edge. */}
      <section>
        <img
          src={AP_IMAGERY.group}
          alt="The Another Punk range"
          className="h-auto w-full object-cover"
        />
      </section>

      <ApTextMarquee
        reverse
        invert
        items={[
          `${ANOTHER_PUNK_PRODUCTS.length} styles`,
          "Made to order",
          "Shipped worldwide",
          "Nothing sits in a box",
        ]}
      />

      {/* Origin. Deliberately six lines, not an "our story" page — the brand
          is small enough that a paragraph of backstory would read as padding.
          Westwood and Repo Man are named as influences only; nothing from
          either is quoted, reproduced or paraphrased. */}
      <section id="story" className="border-b border-border px-6 py-24 sm:px-10 sm:py-32">
        <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-10 lg:grid-cols-[auto_1fr]">
          <Reveal>
            <p className="ap-eyebrow text-pink lg:pt-2">Where it came from</p>
          </Reveal>
          <Reveal delay={100}>
            <div className="flex max-w-[46ch] flex-col gap-5 font-display text-xl leading-[1.25] font-bold tracking-tight text-ink uppercase sm:text-2xl">
              <p>
                A Vivienne Westwood exhibition. Then <span className="text-pink">Repo Man</span>.
                They didn't go together. That was the point.
              </p>
              <p>Paint straight onto a shirt. No plan.</p>
              <p>
                Not a mood board. <span className="text-pink">A compulsion.</span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Statement. The lead design's source line, quoted exactly and credited.
          Sits where the old "not another logo tee" pitch was — the quote does
          that job without having to claim anything. */}
      <section className="border-b border-border px-6 py-28 sm:px-10 sm:py-36">
        <div className="mx-auto max-w-[1500px]">
          <Reveal>
            <blockquote>
              <p className="ap-statement text-ink">
                <span className="ap-misreg" data-text="We can't stop here.">
                  We can't stop here.
                </span>
                <br />
                <span className="text-pink">This is bat country.</span>
              </p>
              <footer className="ap-eyebrow mt-10 text-ink-2">
                Fear and Loathing in Las Vegas, 1998
              </footer>
            </blockquote>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-14 max-w-[52ch] text-sm leading-relaxed text-ink-2">
              Heavyweight cotton. Cut boxy. The hem is raw because we left it that way. Nothing
              exists until you buy it. Nothing is left over.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Lead three. */}
      <section className="px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10 flex items-end justify-between border-b border-ink pb-4">
            <h2 className="font-display text-3xl font-bold tracking-tight text-pink uppercase sm:text-5xl">
              The drop
            </h2>
            <span className="ap-eyebrow hidden text-ink-2 sm:inline">
              {ANOTHER_PUNK_PRODUCTS.length} styles
            </span>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {featured.map((p, i) => (
              <Reveal key={p.slug} delay={i * 80}>
                <ProductTile
                  slug={p.slug}
                  title={p.title}
                  image={p.images[0]}
                  price={p.price}
                  index={i + 1}
                  formatPrice={formatPrice}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ApQuotePlate
        quote="I better adjust my tongue box."
        emphasis="tongue box."
        source="Barbarella, 1968"
        slug="tongue-box"
      />

      {/* Process: two production frames, hard against each other. */}
      <section className="grid grid-cols-1 sm:grid-cols-2">
        <img
          src={AP_IMAGERY.motion}
          alt="Mesh shirt worn on the street at night"
          className="h-full w-full object-cover"
        />
        <img
          src={AP_IMAGERY.printMacro}
          alt="Red ink sitting on washed cotton"
          className="h-full w-full object-cover"
        />
      </section>

      <section className="border-b border-border bg-ink px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-[1500px]">
          <h2 className="ap-statement text-paper">
            Drawn by hand.
            <br />
            <span className="text-pink">Printed to order.</span>
            <br />
            Nothing before that.
          </h2>
          <p className="mt-10 max-w-[46ch] text-sm leading-relaxed text-paper/70">
            Every graphic starts as paint on paper. No warehouse, no stock sitting in a box, no
            second run. Your shirt doesn't exist until you buy it.
          </p>
        </div>
      </section>

      <ApTextMarquee items={["Another Punk", "Drawn by hand", "Made to order", "Red on black"]} />

      {/* Everything else. */}
      <section className="px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10 flex items-end justify-between border-b border-ink pb-4">
            <h2 className="font-display text-3xl font-bold tracking-tight text-pink uppercase sm:text-5xl">
              The rest
            </h2>
            <Link
              to="/classic/shop"
              className="ap-eyebrow hidden text-ink transition-opacity hover:opacity-60 sm:inline"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {rest.map((p, i) => (
              <Reveal key={p.slug} delay={i * 70}>
                <ProductTile
                  slug={p.slug}
                  title={p.title}
                  image={p.images[0]}
                  price={p.price}
                  index={featured.length + i + 1}
                  formatPrice={formatPrice}
                />
              </Reveal>
            ))}
          </div>

          <Link
            to="/classic/shop"
            className="ap-eyebrow mt-10 inline-block text-ink transition-opacity hover:opacity-60 sm:hidden"
          >
            View all →
          </Link>
        </div>
      </section>

      <ApQuotePlate
        quote="Nobody fucks with the Jesus."
        emphasis="the Jesus."
        source="The Big Lebowski, 1998"
        slug="the-jesus"
      />

      {/* Closing plate. */}
      <section className="bg-pink px-6 py-24 text-center sm:px-10">
        <p className="font-display text-3xl leading-[1.05] font-bold tracking-tight text-paper uppercase sm:text-5xl">
          Wear it out.
          <br />
          We'll make another.
        </p>
      </section>
    </div>
  );
}
