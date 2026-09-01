import { useEffect, useRef, useState } from "react";

/** The soundtrack: an opt-in prompt, then a real player.
 *
 * Four earlier versions failed, and each failure is the reason for something
 * here, so they are worth recording rather than rediscovering.
 *
 *   1. Autoplayed on load. Removed at the time, then asked for again — so it
 *      is back, deliberately, with the pause control visible the instant
 *      anything is audible.
 *   2. Linked out to Spotify. Clean, but then the site has no music; the
 *      point was music WHILE you shop.
 *   3. Spotify embed, driven track-by-track from here. Spotify serves
 *      THIRTY-SECOND PREVIEWS to anyone not signed in, and an end-of-track
 *      listener cannot tell a preview ending from a song ending — so it
 *      walked the playlist every half minute and would not settle.
 *   4. A single hosted royalty-free track. Behaved perfectly, but it was one
 *      song and not the point.
 *
 * So the music is hosted, which is the only arrangement where every visitor
 * hears the same full-length thing on any device — but it is real punk under
 * Creative Commons licences that permit commercial use, checked one release
 * at a time against the licence printed on its Bandcamp page.
 *
 * On autoplay: no browser will start audible sound without a user gesture,
 * and it refuses SILENTLY, so this cannot be one hopeful play() call. It
 * tries immediately — which Chrome permits for a visitor with enough media
 * engagement, i.e. anyone who has heard it here before — and if refused, arms
 * every plausible first interaction and tries again. Listeners are re-armed
 * on each failure rather than given up on, because a gesture can be rejected
 * while the tab is still in the background, and it retries on visibility so a
 * tab opened in the background starts when it is actually looked at.
 *
 * Every one of those licences requires attribution, which is why the artist,
 * the track and a link back are part of the player rather than buried in a
 * footer. Nothing here trims, loops or edits a track: two of the releases are
 * ShareAlike and playing them whole keeps this simple.
 *
 * Continuity across the site is structural: this is mounted by the layout
 * route, which survives client-side navigation, so the <audio> element is
 * never torn down and the track never restarts on a page change.
 */

type Track = {
  file: string;
  title: string;
  artist: string;
  art: string;
  /** Where the credit points. Required by every licence used here. */
  href: string;
  licence: "CC BY" | "CC BY-SA";
};

const TRACKS: Track[] = [
  {
    file: "/audio/ap/pack-rat-a01-bite-my-tongue.mp3",
    title: "Bite My Tongue",
    artist: "Pack Rat",
    art: "/audio/ap/art/pack-rat.jpg",
    href: "https://turbodiscos.bandcamp.com/album/bite-my-tongue-7",
    licence: "CC BY-SA",
  },
  {
    file: "/audio/ap/pack-rat-a02-new-kind.mp3",
    title: "New Kind",
    artist: "Pack Rat",
    art: "/audio/ap/art/pack-rat.jpg",
    href: "https://turbodiscos.bandcamp.com/album/bite-my-tongue-7",
    licence: "CC BY-SA",
  },
  {
    file: "/audio/ap/sharizza-hot-sauce.mp3",
    title: "Hot Sauce",
    artist: "Sharizza",
    art: "/audio/ap/art/sharizza.jpg",
    href: "https://turbodiscos.bandcamp.com/album/hot-sauce-cs",
    licence: "CC BY-SA",
  },
  {
    file: "/audio/ap/sharizza-alien-company.mp3",
    title: "Alien Company",
    artist: "Sharizza",
    art: "/audio/ap/art/sharizza.jpg",
    href: "https://turbodiscos.bandcamp.com/album/hot-sauce-cs",
    licence: "CC BY-SA",
  },
  {
    file: "/audio/ap/bam-box-orchestra-double-middle-finger.mp3",
    title: "Double Middle Finger",
    artist: "Bam!Box Orchestra",
    art: "/audio/ap/art/bam-box-orchestra.jpg",
    href: "https://budgetliving.bandcamp.com/album/double-middle-finger",
    licence: "CC BY",
  },
  {
    file: "/audio/ap/bam-box-orchestra-regionale-stomp.mp3",
    title: "Regionale Stomp",
    artist: "Bam!Box Orchestra",
    art: "/audio/ap/art/bam-box-orchestra.jpg",
    href: "https://budgetliving.bandcamp.com/album/double-middle-finger",
    licence: "CC BY",
  },
  {
    file: "/audio/ap/little-waist-i-wanna-be-a-dyke-wife.mp3",
    title: "(I Wanna Be A) Dyke Wife",
    artist: "Little Waist",
    art: "/audio/ap/art/little-waist.jpg",
    href: "https://littlewaist.bandcamp.com/album/some-kinda-comfort",
    licence: "CC BY",
  },
  {
    file: "/audio/ap/little-waist-cops-confiscated-my-lipstick.mp3",
    title: "Cops Confiscated My Lipstick",
    artist: "Little Waist",
    art: "/audio/ap/art/little-waist.jpg",
    href: "https://littlewaist.bandcamp.com/album/some-kinda-comfort",
    licence: "CC BY",
  },
];

/** Fisher-Yates. Not `sort(() => Math.random() - 0.5)`, which is not a
 * shuffle — it biases heavily toward the original order. */
function shuffled<T>(xs: readonly T[]): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function RdPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // The running order is fixed once, on mount, so it does not reshuffle under
  // the listener every time React re-renders.
  const [order] = useState(() => shuffled(TRACKS));
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  const track = order[at];

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      return;
    }
    setStarted(true);
    void el
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  };

  const next = () => setAt((i) => (i + 1) % order.length);

  // Changing the src pauses the element, so playback has to be picked back up
  // — but only if we were already going, or a skip would start music that
  // nobody had asked for yet.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !started) return;
    void el.play().catch(() => setPlaying(false));
  }, [at, started]);

  // Autoplay, pushed as hard as browsers actually allow. See the note at the
  // top of the file for why this is a campaign rather than a single call.
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
    <>
      <span className="rd-player">
        <audio
          ref={audioRef}
          src={track.file}
          preload="auto"
          onEnded={next}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        <button
          type="button"
          onClick={toggle}
          className="rd-link rd-player-btn"
          aria-label={playing ? `Pause ${track.title} by ${track.artist}` : "Play"}
        >
          <span aria-hidden="true" className="rd-player-glyph">
            {playing ? "❚❚" : "▶"}
          </span>
          <span className="rd-player-title" aria-hidden="true">
            {started ? track.artist : "Sound"}
          </span>
        </button>
      </span>

      {/* The now-playing panel. It carries the attribution every licence here
          requires — artist, track and a link back to the release — so the
          credit lives where the music is rather than in a footer nobody
          reads. */}
      {started ? (
        <div className="rd-np">
          <img className="rd-np-art" src={track.art} alt="" aria-hidden="true" />
          <div className="rd-np-meta">
            <p className="rd-np-track">{track.title}</p>
            <a className="rd-np-artist" href={track.href} target="_blank" rel="noopener noreferrer">
              {track.artist} <span aria-hidden="true">↗</span>
            </a>
            <p className="rd-np-lic">{track.licence}</p>
          </div>
          <div className="rd-np-controls">
            <button
              type="button"
              onClick={toggle}
              className="rd-np-btn"
              aria-label={playing ? "Pause" : "Play"}
            >
              <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
            </button>
            <button type="button" onClick={next} className="rd-np-btn" aria-label="Next track">
              <span aria-hidden="true">▶▶</span>
            </button>
          </div>
        </div>
      ) : null}

    </>
  );
}
