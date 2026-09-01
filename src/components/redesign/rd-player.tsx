import { useEffect, useRef, useState } from "react";

/** The soundtrack: an opt-in prompt, then the Spotify playlist.
 *
 * Why an embed rather than a hosted file. The playlist is other artists'
 * music, so it cannot be downloaded and served from here — that is what the
 * embed exists for, and the only legitimate way to play this catalogue on a
 * page. The trade is real and worth stating plainly: a visitor who is NOT
 * logged into Spotify in this browser hears 30-second previews, not full
 * tracks. Logged-in visitors get the whole thing.
 *
 * Why it can autoplay at all. Browsers refuse to start audio without a user
 * gesture, and a cross-origin iframe cannot borrow one it did not receive.
 * The prompt's Play button is that gesture: the click loads Spotify's IFrame
 * API and calls play() inside the same activation, which is the only sequence
 * that gets sound out of this without the visitor pressing Spotify's own
 * button afterwards.
 *
 * Why the script loads late. Spotify's API is fetched on the click, not on
 * page load, so nobody who never asks for music has their visit reported to
 * Spotify or pays for the script.
 *
 * Continuity across the site is structural: this is mounted by the layout
 * route, which survives client-side navigation, so the iframe is never torn
 * down and playback is not interrupted by moving between pages.
 */

const PLAYLIST_ID = "6N5Xm74m5aX0nScoTO2Mp1";
const PLAYLIST_URI = `spotify:playlist:${PLAYLIST_ID}`;
const PLAYLIST_URL = `https://open.spotify.com/playlist/${PLAYLIST_ID}`;
const API_SRC = "https://open.spotify.com/embed/iframe-api/v1";

/** Asked-once-per-session, not answered-once-forever: someone who says no
 * today should be asked again on a fresh visit. */
const ASK_KEY = "ap-rd-sound-asked";
/** A beat after the boot clears, so the two never share the screen. */
const ASK_DELAY_MS = 700;

type Controller = { play: () => void; pause: () => void; togglePlay: () => void };

/** Load Spotify's IFrame API once, and hand the same promise to every caller.
 * The API announces itself through a global callback rather than a module
 * export, so this wraps that in something awaitable. */
let apiPromise: Promise<{
  createController: (
    el: HTMLElement,
    opts: Record<string, unknown>,
    cb: (c: Controller) => void,
  ) => void;
}> | null = null;

function loadSpotifyApi() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    (window as unknown as Record<string, unknown>).onSpotifyIframeApiReady = resolve;
    const s = document.createElement("script");
    s.src = API_SRC;
    s.async = true;
    s.onerror = () => reject(new Error("Spotify embed API failed to load"));
    document.body.appendChild(s);
  });
  return apiPromise;
}

export function RdPlayer() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const ctrlRef = useRef<Controller | null>(null);
  const [live, setLive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
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
    markAsked();
    setLive(true);
    // The host element only exists once `live` is true, so wait a tick for it
    // to be in the DOM before handing it to Spotify.
    window.setTimeout(() => {
      const host = hostRef.current;
      if (!host) return;
      loadSpotifyApi()
        .then((api) => {
          api.createController(
            host,
            { uri: PLAYLIST_URI, width: "100%", height: "152" },
            (controller) => {
              ctrlRef.current = controller;
              controller.play();
              setPlaying(true);
            },
          );
        })
        .catch(() => setFailed(true));
    }, 0);
  };

  const toggle = () => {
    const c = ctrlRef.current;
    // Before anyone has opted in, the bar button IS the opt-in.
    if (!c) {
      start();
      return;
    }
    c.togglePlay();
    setPlaying((v) => !v);
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

    // Wait for the boot sequence to actually be gone rather than guessing a
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
        <button
          type="button"
          onClick={toggle}
          className="rd-link rd-player-btn"
          aria-label={playing ? "Pause the playlist" : "Play the playlist"}
        >
          <span aria-hidden="true" className="rd-player-glyph">
            {playing ? "❚❚" : "▶"}
          </span>
          <span className="rd-player-title" aria-hidden="true">
            {live ? "Playlist" : "Sound"}
          </span>
        </button>
      </span>

      {/* Spotify replaces this node with its own iframe. It stays in the DOM
          for the life of the layout, which is what keeps playback running as
          you move around the site. Kept visible on purpose: a hidden embed is
          both unreliable and not what Spotify permits. */}
      {live ? (
        <div className="rd-embed" data-failed={failed}>
          {failed ? (
            <p className="rd-log">
              Spotify wouldn't load.{" "}
              <a className="rd-link" href={PLAYLIST_URL} target="_blank" rel="noopener noreferrer">
                Open the playlist →
              </a>
            </p>
          ) : (
            <div ref={hostRef} />
          )}
        </div>
      ) : null}

      {asking ? (
        <div className="rd-ask" role="dialog" aria-label="Sound">
          <div className="rd-ask-box">
            <p className="rd-ask-q">Wanna rock out while you shop?</p>
            <p className="rd-log rd-ask-meta">Playlist plays here while you browse.</p>
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
