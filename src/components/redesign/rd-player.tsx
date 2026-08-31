import { useEffect, useRef, useState } from "react";

/** The soundtrack, set as a line in the top bar.
 *
 * The autoplay strategy is the hard-won part and is carried over intact from
 * the player this replaces (see the long comment on the effect below); what
 * changed was the skin, and now the track. The old control is a
 * paper-coloured pill fixed to the bottom right, which would have sat on the
 * field like a sticker. Here it is another item in the terminal line at the
 * top, alongside SHOP and BAG.
 *
 * The list is still a list, and the transport still cycles it, so adding a
 * second track is a one-line change — the skip control simply hides itself
 * while there is only one thing to skip to.
 *
 * Only one of the two players is ever mounted: __root.tsx renders the old
 * one (still the Boudicca tracks) for /classic only, so there is never a
 * second <audio> playing underneath.
 */
const TRACKS = [{ src: "/audio/kingdom-fall.mp3", title: "Kingdom Fall", artist: "OLLiGAN" }] as const;

export function RdPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
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

  // Autoplay, pushed as hard as browsers actually allow.
  //
  // No browser starts audible audio without a user gesture, and it refuses
  // silently, so this cannot be a single hopeful play() call. Instead:
  //   1. Try immediately. Chrome permits this for visitors with enough media
  //      engagement — anyone who has played it here before — so returning
  //      visitors genuinely do get sound on load.
  //   2. If refused, start on the first interaction of any kind.
  //   3. Keep retrying rather than giving up: a gesture can be rejected while
  //      the tab is still backgrounded, so listeners are re-armed on every
  //      failure until a play() actually resolves.
  //   4. Retry when the tab becomes visible, covering the page being opened
  //      in a background tab.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    let settled = false;
    const EVENTS: (keyof WindowEventMap)[] = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
      "wheel",
    ];

    const disarm = () => EVENTS.forEach((e) => window.removeEventListener(e, onGesture));

    const attempt = () => {
      if (settled) return;
      void el
        .play()
        .then(() => {
          settled = true;
          setStarted(true);
          setPlaying(true);
          disarm();
          document.removeEventListener("visibilitychange", onVisible);
        })
        .catch(() => {
          if (!settled) arm();
        });
    };

    const onGesture = () => attempt();
    const onVisible = () => {
      if (document.visibilityState === "visible") attempt();
    };
    const arm = () => {
      disarm();
      EVENTS.forEach((e) => window.addEventListener(e, onGesture, { once: true, passive: true }));
    };

    attempt();
    arm();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      disarm();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <span className="rd-player">
      <audio
        ref={audioRef}
        src={track.src}
        autoPlay
        preload="auto"
        // With one track, onEnded advances to the same index, so the resume
        // effect (keyed on index) never re-fires and the music just stops at
        // the end. Loop instead, and let onEnded do its job once there is
        // something else to move to.
        loop={TRACKS.length === 1}
        onEnded={next}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <button
        type="button"
        onClick={toggle}
        className="rd-link rd-player-btn"
        aria-label={playing ? `Pause ${track.title}` : `Play ${track.title} by ${track.artist}`}
      >
        <span aria-hidden="true" className="rd-player-glyph">
          {playing ? "❚❚" : "▶"}
        </span>
        {/* The title is the one part that goes on a narrow screen — the
            transport still works, it just stops narrating itself. */}
        <span className="rd-player-title" aria-hidden="true">
          {started ? track.title : "Sound"}
        </span>
      </button>

      {started && TRACKS.length > 1 ? (
        <button type="button" onClick={next} className="rd-link rd-player-next" aria-label="Next track">
          <span aria-hidden="true">▶▶</span>
        </button>
      ) : null}
    </span>
  );
}
