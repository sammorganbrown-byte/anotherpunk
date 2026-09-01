import { useEffect, useRef, useState } from "react";

/** The soundtrack: an opt-in prompt, then a real player.
 *
 * Four earlier versions failed, and each failure is the reason for something
 * here, so they are worth recording rather than rediscovering.
 *
 *   1. Autoplayed on load. It worked, which was the problem — sound started
 *      without anyone asking. Hence the prompt.
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

/** Asked-once-per-session, not answered-once-forever: someone who says no
 * today should be asked again on a fresh visit. */
const ASK_KEY = "ap-rd-sound-asked";
/** A beat after the boot clears, so the two never share the screen. */
const ASK_DELAY_MS = 700;

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
  const [asking, setAsking] = useState(false);

  const track = order[at];

  const markAsked = () => {
    try {
      window.sessionStorage.setItem(ASK_KEY, "1");
    } catch {
      // Private mode. It asks again next time; nothing breaks.
    }
    setAsking(false);
  };

  const start = () => {
    markAsked();
    setStarted(true);
    const el = audioRef.current;
    // Runs inside the click handler, so it is a real user gesture and the
    // browser allows it. That is the whole reason the prompt exists.
    void el
      ?.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  };

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

  useEffect(() => {
    let asked = false;
    try {
      asked = window.sessionStorage.getItem(ASK_KEY) === "1";
    } catch {
      // Private mode. Ask.
    }
    if (asked) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Wait for the boot sequence to be gone rather than guessing a delay long
    // enough to outlast it — timers are throttled in a background tab, so the
    // two drift apart exactly when nobody is watching.
    let id = 0;
    const poll = () => {
      if (document.querySelector(".rd-boot")) {
        id = window.setTimeout(poll, 200);
        return;
      }
      id = window.setTimeout(() => setAsking(true), ASK_DELAY_MS);
    };
    poll();
    return () => window.clearTimeout(id);
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

      {asking ? (
        <div className="rd-ask" role="dialog" aria-label="Sound">
          <div className="rd-ask-box">
            <p className="rd-ask-q">Wanna rock out while you shop?</p>
            <p className="rd-log rd-ask-meta">
              Eight tracks from four bands, on the house and on the level.
            </p>
            <div className="rd-ask-row">
              <button type="button" className="rd-btn" data-primary="true" onClick={start}>
                Play ▶
              </button>
              <button type="button" className="rd-link rd-ask-no" onClick={markAsked}>
                No thanks
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
