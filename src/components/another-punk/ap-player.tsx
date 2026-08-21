import { useEffect, useRef, useState } from "react";

// Brand tracks by Boudicca, converted from the supplied 24-bit WAVs to MP3
// (~165kbps VBR) — the originals were 113MB together, which is not something
// you put on a storefront.
//
// Deliberately NOT autoplaying. Every current browser blocks audio autoplay
// without a user gesture, so an autoplay attempt would fail silently on most
// visits and ambush the rest. The control starts muted-by-default in the
// sense that nothing plays until it's pressed.
const TRACKS = [
  { src: "/audio/on-my-level.mp3", title: "On My Level" },
  { src: "/audio/quick.mp3", title: "Quick" },
  { src: "/audio/encore.mp3", title: "Encore" },
] as const;

export function ApPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  // Only true once the user has pressed play at least once. Before that the
  // control is a single word; after, it earns the full transport.
  const [started, setStarted] = useState(false);

  const track = TRACKS[index];

  // Advancing the track swaps the <audio> src, which pauses it. Resume only
  // once playback has been started, so a skip keeps going.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !started) return;
    void el.play().catch(() => setPlaying(false));
  }, [index, started]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }
    setStarted(true);
    void el
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  };

  const next = () => setIndex((i) => (i + 1) % TRACKS.length);

  // Autoplay, as far as browsers actually permit it.
  //
  // No browser will start audible audio without a user gesture, so a bare
  // play() on load is rejected on a first visit — silently, which is the
  // trap. So: try it anyway (Chrome does allow it for returning visitors
  // with enough media engagement, and it costs nothing when refused), and
  // otherwise arm one-shot listeners that start playback on the visitor's
  // very first interaction with the page, whatever that is. In practice
  // that means the music comes up on their first tap or scroll rather than
  // requiring them to find this button.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    let done = false;
    const start = () => {
      if (done) return;
      done = true;
      setStarted(true);
      void el
        .play()
        .then(() => setPlaying(true))
        .catch(() => {
          // Still refused. Leave the control sitting there as-is.
          done = false;
          setStarted(false);
        });
      cleanup();
    };

    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart", "scroll"];
    const cleanup = () => events.forEach((e) => window.removeEventListener(e, start));

    void el
      .play()
      .then(() => {
        setStarted(true);
        setPlaying(true);
        done = true;
        cleanup();
      })
      .catch(() => {
        // Expected on a first visit. Wait for any gesture instead.
        events.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }));
      });

    return cleanup;
  }, []);

  // Bottom-RIGHT on purpose: the product gallery's thumbnail strip runs along
  // the bottom-left, and a bottom-left player sat directly on top of its
  // first thumbnail.
  return (
    <div className="fixed right-0 bottom-0 z-40 flex items-stretch border-t border-l border-ink bg-paper">
      <audio
        ref={audioRef}
        src={track.src}
        preload="none"
        onEnded={next}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? `Pause ${track.title}` : `Play ${track.title} by Boudicca`}
        className="font-label flex min-h-11 items-center gap-2.5 px-3.5 py-3 text-[11px] font-medium tracking-[0.14em] text-ink uppercase transition-colors hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper focus-visible:outline-none sm:px-4"
      >
        <span aria-hidden="true" className="text-pink">
          {playing ? "❚❚" : "▶"}
        </span>
        {playing ? (
          <span className="ap-eq" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        ) : null}
        <span className="hidden sm:inline">{started ? track.title : "Sound"}</span>
      </button>

      {started ? (
        <button
          type="button"
          onClick={next}
          aria-label="Next track"
          className="font-label hidden min-h-11 border-l border-ink px-3.5 py-3 text-[11px] font-medium tracking-[0.14em] text-ink-2 uppercase transition-colors hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper focus-visible:outline-none sm:block"
        >
          <span aria-hidden="true">{"▶▶"}</span>
        </button>
      ) : null}
    </div>
  );
}
