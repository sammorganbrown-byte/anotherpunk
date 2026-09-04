const LOGO_URL =
  "/img/229-ap-wordmark-logo.png";

// Infinite logo ticker. Renders the track TWICE back to back and animates
// exactly -50% (see .ap-marquee-track in styles.css): since both halves are
// identical, the loop point is invisible, no seam/jump. `count` controls how
// many logo repeats live inside ONE half — tune per how wide the container
// is, not global; a wider band needs more repeats to avoid huge gaps.
export function ApMarquee({ count = 6 }: { count?: number }) {
  const items = Array.from({ length: count });
  return (
    <div className="overflow-hidden border-y border-ink bg-ink py-4">
      <div className="ap-marquee-track">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center" aria-hidden={half === 1}>
            {items.map((_, i) => (
              <img
                key={i}
                src={LOGO_URL}
                alt={half === 0 && i === 0 ? "Another Punk" : ""}
                className="mx-8 h-7 w-auto shrink-0 brightness-0 invert sm:h-9"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
