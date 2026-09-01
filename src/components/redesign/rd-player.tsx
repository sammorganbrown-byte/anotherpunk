import { useEffect, useRef, useState } from "react";

/** The soundtrack: an opt-in prompt, then a transport in the top bar.
 *
 * Three earlier versions are worth knowing about, because each one failed in
 * a way that shaped this one.
 *
 *   1. It autoplayed, pushed as hard as browsers allow — try immediately,
 *      re-arm on every gesture, retry on visibility change. It worked, and
 *      that was the problem: sound started without anyone asking for it.
 *   2. It linked out to a Spotify playlist. Clean, but handing off to Spotify
 *      means the site has no music — the point was to have music WHILE you
 *      shop, and a link takes you somewhere else to get it.
 *   3. Both of those restarted the track whenever the page reloaded.
 *
 * So: the file is hosted again (Spotify cannot play inside the page), nothing
 * plays until it is asked for, and the asking is explicit — a prompt on first
 * entry with a play button.
 *
 * Continuity across the site is structural rather than clever. This component
 * is mounted by the layout route, which stays mounted while you move between
 * the field, the shop, a product and the bag — those are client-side
 * navigations, so the <audio> element is never torn down and the track never
 * restarts. It only starts over on a true reload.
 */

const TRACK = { src: "/audio/turbo-power.mp3", title: "Turbo Power", artist: "2050" };
const PLAYLIST_URL = "https://open.spotify.com/playlist/6N5Xm74m5aX0nScoTO2Mp1";

/** Asked-once-per-session, not answered-once-forever: a visitor who says no
 * today should be asked again on a fresh visit rather than silently never
 * offered music again. */
const ASK_KEY = "ap-rd-sound-asked";
/** A beat after the boot clears, so the two never share the screen. */
const ASK_DELAY_MS = 700;

export function RdPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [asking, setAsking] = useState(false);

  const markAsked = () => {
    try {
      window.sessionStorage.setItem(ASK_KEY, "1");
    } catch {
      // Private mode. It asks again next time; nothing breaks.
    }
    setAsking(false);
  };

  const start = () => {
    const el = audioRef.current;
    markAsked();
    if (!el) return;
    // This runs inside the click handler, so it is a real user gesture and
    // the browser will allow it. That is the whole reason the prompt exists.
    void el
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  };

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }
    void el
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  };

  useEffect(() => {
    let asked = false;
    try {
      asked = window.sessionStorage.getItem(ASK_KEY) === "1";
    } catch {
      // Private mode. Ask.
    }
    if (asked) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Wait for the boot sequence to actually be gone, rather than guessing a
    // delay long enough to outlast it. A fixed timeout was wrong twice over:
    // too short and the prompt lands on top of the boot, and timers are
    // throttled in a background tab anyway, so the two drift relative to each
    // other exactly when nobody is watching to notice.
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
          src={TRACK.src}
          preload="auto"
          // One track, so it loops rather than stopping dead at the end.
          loop
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        <button
          type="button"
          onClick={toggle}
          className="rd-link rd-player-btn"
          aria-label={playing ? `Pause ${TRACK.title}` : `Play ${TRACK.title} by ${TRACK.artist}`}
        >
          <span aria-hidden="true" className="rd-player-glyph">
            {playing ? "❚❚" : "▶"}
          </span>
          {/* Drops on a narrow screen; the transport survives. */}
          <span className="rd-player-title" aria-hidden="true">
            {playing ? TRACK.title : "Sound"}
          </span>
        </button>
      </span>

      {asking ? (
        <div className="rd-ask" role="dialog" aria-label="Sound">
          <div className="rd-ask-box">
            <p className="rd-ask-q">Wanna rock out while you shop?</p>
            <p className="rd-log rd-ask-meta">
              {TRACK.artist} <span className="rd-key">—</span> {TRACK.title}
            </p>
            <div className="rd-ask-row">
              <button type="button" className="rd-btn" data-primary="true" onClick={start}>
                Play ▶
              </button>
              <button type="button" className="rd-link rd-ask-no" onClick={markAsked}>
                No thanks
              </button>
            </div>
            <a
              className="rd-link rd-ask-alt"
              href={PLAYLIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={markAsked}
            >
              Or take the whole playlist to Spotify →
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
