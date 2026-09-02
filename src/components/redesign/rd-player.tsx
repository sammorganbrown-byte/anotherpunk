import { useEffect, useRef, useState } from "react";

/** The soundtrack: an opt-in prompt, then a real player.
 *
 * Four earlier versions failed, and each failure is the reason for something
 * here, so they are worth recording rather than rediscovering.
 *
 *   1. Autoplayed on load. Twice — removed, asked for again, and removed
 *      again after the owner could not find which tab was playing and had to
 *      hunt for it. That is the customer experience too, and no pause control
 *      helps someone who cannot tell where the sound is coming from.
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
 * footer. Nothing here trims, loops or edits a track — some of these are
 * NoDerivatives, and playing everything whole means the same rule covers the
 * lot rather than one release needing special handling.
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
  licence: "CC BY" | "CC BY-SA" | "CC BY-ND";
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
    file: "/audio/ap/sharizza-driven.mp3",
    title: "Driven",
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
  {
    file: "/audio/ap/king-gizzard-the-lizard-wizard-polygondwanaland.mp3",
    title: "Polygondwanaland",
    artist: "King Gizzard & The Lizard Wizard",
    art: "/audio/ap/art/king-gizzard-the-lizard-wizard.jpg",
    href: "https://delicaterecords.bandcamp.com/album/polygondwanaland",
    licence: "CC BY-ND",
  },
  {
    file: "/audio/ap/king-gizzard-the-lizard-wizard-the-castle-in-the-air.mp3",
    title: "The Castle In The Air",
    artist: "King Gizzard & The Lizard Wizard",
    art: "/audio/ap/art/king-gizzard-the-lizard-wizard.jpg",
    href: "https://delicaterecords.bandcamp.com/album/polygondwanaland",
    licence: "CC BY-ND",
  },
  {
    file: "/audio/ap/king-gizzard-the-lizard-wizard-horology.mp3",
    title: "Horology",
    artist: "King Gizzard & The Lizard Wizard",
    art: "/audio/ap/art/king-gizzard-the-lizard-wizard.jpg",
    href: "https://delicaterecords.bandcamp.com/album/polygondwanaland",
    licence: "CC BY-ND",
  },
  {
    file: "/audio/ap/c-c-meri-on.mp3",
    title: "Meri on",
    artist: "C.C.",
    art: "/audio/ap/art/c-c.jpg",
    href: "https://ccest.bandcamp.com/album/siin-olema-peab",
    licence: "CC BY-SA",
  },
  {
    file: "/audio/ap/goldzilla-cops-oder-zahlen.mp3",
    title: "Cops Oder Zahlen",
    artist: "GOLDZILLA",
    art: "/audio/ap/art/goldzilla.jpg",
    href: "https://goldzillaband.bandcamp.com/album/goldzilla-vs-robohitler",
    licence: "CC BY",
  },
  {
    file: "/audio/ap/los-blenders-yo-soy-punk.mp3",
    title: "Yo Soy Punk",
    artist: "Los Blenders",
    art: "/audio/ap/art/los-blenders.jpg",
    href: "https://losblenders.bandcamp.com/album/chavos-bien-lp",
    licence: "CC BY-SA",
  },
  {
    file: "/audio/ap/los-zalvajes-garage.mp3",
    title: "Garage",
    artist: "Los Zalvajes",
    art: "/audio/ap/art/los-zalvajes.jpg",
    href: "https://zalvajes.bandcamp.com/album/los-zalvajes",
    licence: "CC BY",
  },
  {
    file: "/audio/ap/n0thanky0u-this-old-room.mp3",
    title: "This Old Room",
    artist: "N0THANKY0U",
    art: "/audio/ap/art/n0thanky0u.jpg",
    href: "https://jestedincorporated.bandcamp.com/album/dead-form",
    licence: "CC BY-SA",
  },
  {
    file: "/audio/ap/preoccupied-pipers-live-and-let-dumb.mp3",
    title: "Live And Let Dumb",
    artist: "Preoccupied Pipers",
    art: "/audio/ap/art/preoccupied-pipers.jpg",
    href: "https://preoccupiedpipers.bandcamp.com/album/live-and-let-dumb-2022",
    licence: "CC BY",
  },
  {
    file: "/audio/ap/the-fatalities-down-the-rabbit-hole.mp3",
    title: "Down the Rabbit Hole",
    artist: "The Fatalities",
    art: "/audio/ap/art/the-fatalities.jpg",
    href: "https://thefatalitiesmusic.bandcamp.com/album/monk-rock",
    licence: "CC BY",
  },
  {
    file: "/audio/ap/thee-loyal-wankers-trouble.mp3",
    title: "Trouble!",
    artist: "Thee Loyal Wankers",
    art: "/audio/ap/art/thee-loyal-wankers.jpg",
    href: "https://theeloyalwankers.bandcamp.com/album/thee-loyal-wankers-2",
    licence: "CC BY",
  },
  {
    file: "/audio/ap/shitty-kickflips-tequila-sunrise.mp3",
    title: "Tequila Sunrise",
    artist: "shitty kickflips",
    art: "/audio/ap/art/shitty-kickflips.jpg",
    href: "https://shittykickflips.bandcamp.com/album/loosies-comp-1",
    licence: "CC BY-SA",
  },
  {
    file: "/audio/ap/dj-mcdonalds-hashbrown-aries.mp3",
    title: "Aries",
    artist: "DJ MCDONALDS HASHBROWN",
    art: "/audio/ap/art/dj-mcdonalds-hashbrown.jpg",
    href: "https://shittykickflips.bandcamp.com/album/zodiac",
    licence: "CC BY-SA",
  },
];

/** Asked-once-per-session, not answered-once-forever: someone who says no
 * today should be asked again on a fresh visit. */
const ASK_KEY = "ap-rd-sound-asked";
/** A beat after the boot clears, so the two never share the screen. */
const ASK_DELAY_MS = 700;

/** Where the listener last dragged the now-playing panel to. */
const NP_POS_KEY = "another-punk-np-pos";

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
  // The running order is fixed once, after mount, so it does not reshuffle
  // under the listener every time React re-renders.
  //
  // It deliberately starts unshuffled. Shuffling in the initial state ran the
  // shuffle during the server render too, so the server picked one first
  // track and the browser picked another, and every single page load logged a
  // hydration mismatch on the <audio src>. React does not patch those up. The
  // first paint now matches on both sides and the order is randomised in an
  // effect, which only ever runs in the browser.
  const [order, setOrder] = useState<readonly Track[]>(TRACKS);
  useEffect(() => {
    setOrder(shuffled(TRACKS));
  }, []);
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
    // Inside the click handler, so it is a real gesture and the browser
    // allows it. That is the whole reason the prompt exists.
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
      id = window.setTimeout(() => {
        // Never over a page with a form on it. The prompt is a panel near the
        // middle of the screen, so on checkout it landed on the address fields
        // and on contact it landed on the send button — an invitation to play
        // music covering the thing someone is trying to do. It can wait until
        // they are browsing again.
        if (/^\/(checkout|cart|order-confirmed|contact)/.test(window.location.pathname)) return;
        setAsking(true);
      }, ASK_DELAY_MS);
    };
    poll();
    return () => window.clearTimeout(id);
  }, []);

  // Draggable, because a fixed panel eventually lands on something. It has
  // already had to be moved off the nav and off the currency switcher, and
  // that is a game you lose slowly — a page added later will collide again.
  // Letting it be dragged out of the way costs less than guarding every
  // future layout against it.
  //
  // Position is kept as an offset from where CSS puts it rather than as
  // absolute coordinates, so the panel still sits itself correctly on a
  // phone, on a product page, and wherever CSS moves it next; a drag just
  // nudges it from there.
  const npRef = useRef<HTMLDivElement | null>(null);
  const [nudge, setNudge] = useState<{ x: number; y: number }>(() => {
    try {
      const raw = window.localStorage.getItem(NP_POS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { x: number; y: number };
        if (Number.isFinite(p?.x) && Number.isFinite(p?.y)) return p;
      }
    } catch {
      // No stored position. It opens where CSS puts it, which is correct.
    }
    return { x: 0, y: 0 };
  });

  const onDragStart = (e: React.PointerEvent) => {
    // Never start a drag from a control — the buttons and the artist link
    // have to stay clickable, and a drag that begins on a button feels like
    // a broken button.
    if ((e.target as HTMLElement).closest("button, a")) return;
    const el = npRef.current;
    if (!el) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const from = { ...nudge };
    el.setPointerCapture(e.pointerId);
    el.dataset.dragging = "true";

    const move = (ev: PointerEvent) => {
      const box = el.getBoundingClientRect();
      // Clamped so it can never be dragged off screen and stranded — the
      // only way back would be clearing site data.
      const next = {
        x: from.x + (ev.clientX - startX),
        y: from.y + (ev.clientY - startY),
      };
      const minX = -box.left + nudge.x + 8;
      const maxX = window.innerWidth - box.right + nudge.x - 8;
      const minY = -box.top + nudge.y + 8;
      const maxY = window.innerHeight - box.bottom + nudge.y - 8;
      setNudge({
        x: Math.min(Math.max(next.x, minX), maxX),
        y: Math.min(Math.max(next.y, minY), maxY),
      });
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      delete el.dataset.dragging;
      setNudge((n) => {
        try {
          window.localStorage.setItem(NP_POS_KEY, JSON.stringify(n));
        } catch {
          // Position simply will not persist. Nothing else breaks.
        }
        return n;
      });
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };

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
        <div
          className="rd-np"
          ref={npRef}
          onPointerDown={onDragStart}
          style={
            nudge.x || nudge.y
              ? { transform: `translate(${nudge.x}px, ${nudge.y}px)` }
              : undefined
          }
          title="Drag to move"
        >
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
              {TRACKS.length} tracks, on the house and on the level.
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
