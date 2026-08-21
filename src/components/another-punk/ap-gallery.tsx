import { useEffect, useRef, useState } from "react";

/** Product-page gallery: one large frame, a strip of thumbnails under it.
 *
 * Resets to the hero when `images` changes, otherwise navigating between two
 * products with the router would leave the second one showing whichever index
 * the first was on — and land out of range when the new product has fewer
 * shots. */
export function ApGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const stripRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActive(0);
  }, [images]);

  const go = (i: number) => setActive(((i % images.length) + images.length) % images.length);

  // Arrow keys move through the strip when focus is inside it.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(active + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(active - 1);
    }
  };

  if (images.length <= 1) {
    return (
      <div className="aspect-[3/4] w-full overflow-hidden bg-surface-2 lg:aspect-auto lg:h-[calc(100dvh-73px)]">
        <img src={images[0]} alt={title} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-73px)]">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2 sm:aspect-[3/2] lg:min-h-0 lg:flex-1">
        <img
          key={images[active]}
          src={images[active]}
          alt={`${title}, view ${active + 1} of ${images.length}`}
          className="ap-fade h-full w-full object-cover"
        />
        <span className="ap-eyebrow absolute right-3 bottom-3 bg-ink px-2.5 py-1.5 text-paper">
          {String(active + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
        </span>
      </div>

      <div
        ref={stripRef}
        onKeyDown={onKeyDown}
        className="flex shrink-0 gap-2 overflow-x-auto border-t border-ink bg-paper p-2"
      >
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => go(i)}
            aria-label={`View ${i + 1} of ${images.length}`}
            aria-current={i === active}
            className={`h-16 w-24 shrink-0 overflow-hidden border transition-opacity sm:h-20 sm:w-28 ${
              i === active
                ? "border-pink opacity-100"
                : "border-border opacity-55 hover:opacity-100 focus-visible:opacity-100"
            }`}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
