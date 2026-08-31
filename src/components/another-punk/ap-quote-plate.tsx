import { Link } from "@tanstack/react-router";

/** A film line at viewport scale, credited underneath.
 *
 * The whole plate links to the design it belongs to — the quote is the reason
 * the shirt exists, so it should be a route into it rather than decoration.
 *
 * `tone` alternates so consecutive plates down the page don't read as one
 * long block: "ink" is red-on-black, "pink" is a solid red field. */
export function ApQuotePlate({
  quote,
  source,
  slug,
  tone = "ink",
  emphasis,
}: {
  quote: string;
  source: string;
  slug: string;
  tone?: "ink" | "pink";
  /** The fragment of `quote` to knock into the accent colour. Must appear in
   * `quote` verbatim; when it doesn't, the line just renders plain. */
  emphasis?: string;
}) {
  const idx = emphasis ? quote.indexOf(emphasis) : -1;
  const before = idx >= 0 ? quote.slice(0, idx) : quote;
  const hit = idx >= 0 ? emphasis! : "";
  const after = idx >= 0 ? quote.slice(idx + emphasis!.length) : "";

  const onInk = tone === "ink";

  return (
    <section className={onInk ? "border-b border-border bg-ink" : "bg-pink"}>
      <Link
        to="/classic/product/$slug"
        params={{ slug }}
        className="group block px-6 py-24 transition-opacity hover:opacity-90 sm:px-10 sm:py-28"
      >
        <div className="mx-auto max-w-[1500px]">
          <blockquote>
            <p className={`ap-statement ${onInk ? "text-paper" : "text-paper"}`}>
              {before}
              {hit ? <span className={onInk ? "text-pink" : "text-ink"}>{hit}</span> : null}
              {after}
            </p>
            <footer
              className={`ap-eyebrow mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 ${
                onInk ? "text-paper/60" : "text-ink/70"
              }`}
            >
              <span>{source}</span>
              <span aria-hidden="true">·</span>
              <span className={onInk ? "text-pink" : "text-ink"}>See the shirt →</span>
            </footer>
          </blockquote>
        </div>
      </Link>
    </section>
  );
}
