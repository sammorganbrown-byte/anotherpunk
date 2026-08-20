// Statement ticker. Same seamless two-half trick as ApMarquee (render the
// track twice, animate exactly -50%), but scrolling the opposite way so
// when the two bands sit near each other they run against each other
// rather than in parallel — the thing that stops a double marquee reading
// as a mistake.
export function ApTextMarquee({
  items,
  reverse = false,
  invert = false,
}: {
  items: string[];
  reverse?: boolean;
  invert?: boolean;
}) {
  return (
    <div
      className={
        invert
          ? "overflow-hidden border-y border-ink bg-ink py-3"
          : "overflow-hidden border-y border-ink bg-paper py-3"
      }
    >
      <div className={`ap-marquee-track ${reverse ? "ap-marquee-track--rev" : ""}`}>
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center" aria-hidden={half === 1}>
            {items.map((t, i) => (
              <span key={i} className="flex shrink-0 items-center">
                <span
                  className={`font-display px-6 text-sm font-bold tracking-tight uppercase sm:text-base ${
                    invert ? "text-paper" : "text-ink"
                  }`}
                >
                  {t}
                </span>
                <span className="text-pink" aria-hidden="true">
                  ✦
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
