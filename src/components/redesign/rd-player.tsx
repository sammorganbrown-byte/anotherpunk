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

/** The playlist's tracks, in playlist order.
 *
 * The embed API has no shuffle control — hand it a playlist URI and it starts
 * at track one, every time. So the shuffling is done here instead: the order
 * is randomised on load and the tracks are handed over one at a time.
 *
 * This list is baked in rather than fetched. Spotify's own public embed page
 * for the playlist carries these URIs and needs no key to read, but reading it
 * from the browser is a cross-origin request the browser will not allow, and
 * doing it server-side would put a Spotify round trip in front of every page
 * load. To refresh after changing the playlist:
 *
 *   curl -s "https://open.spotify.com/embed/playlist/6N5Xm74m5aX0nScoTO2Mp1" \
 *     -H 'user-agent: Mozilla/5.0' \
 *     | grep -o 'spotify:track:[A-Za-z0-9]*' | sort -u | sed 's/spotify:track://'
 */
const TRACK_IDS = [
  "0ElRzK07sc9eszyk1ea9Ab",
  "0XyjtybwqSdqMAFfBEkmZf",
  "1ntxpzIUbSsizvuAy6lTYY",
  "2EC9IJj7g0mN1Q5VrZkiYY",
  "2uXkW8uJcOIhlbUatEPLPs",
  "34miSNKQ0xN7EG8zzzaFzI",
  "3Id64dLhfH7z0mmcylxuNp",
  "3fElupNRLRJ0tbUDahPrAb",
  "4A48NL57P16zSRaq3yoYry",
  "4KT9Nd36rXPdTStMWlXrP0",
  "4kPSjEg8u1U4pg2dHHMmtf",
  "4uB28m7RAflobYpnLMb6A2",
  "56hwcJKj0M40A3qdhV3177",
  "5TZn3LQSWwVPnBlPgFKb54",
  "5rLTTa31EzWdvYZ5K7koDc",
  "5tHFPtV7dT01fxDe2AhKjD",
  "63T7DJ1AFDD6Bn8VzG6JE8",
  "6HvUYS1xDfTCGWoeVrv3XS",
  "79oH2M0vWq9bRYpNTCrlHu",
  "7rCchsJktyFH0MB5SIpnbN",
  "7rSERmjAT38lC5QhJ8hnQc",
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
const PLAYLIST_URL = `https://open.spotify.com/playlist/${PLAYLIST_ID}`;
const API_SRC = "https://open.spotify.com/embed/iframe-api/v1";

/** Asked-once-per-session, not answered-once-forever: someone who says no
 * today should be asked again on a fresh visit. */
const ASK_KEY = "ap-rd-sound-asked";
/** A beat after the boot clears, so the two never share the screen. */
const ASK_DELAY_MS = 700;

type Controller = {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  loadUri: (uri: string) => void;
  addListener: (event: string, cb: (e: { data: PlaybackData }) => void) => void;
};
type PlaybackData = { position: number; duration: number; isPaused: boolean };

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
  // The shuffled running order, and where we are in it. Refs, not state: the
  // playback listener is registered once and must not close over a stale
  // index every time React re-renders.
  const orderRef = useRef<string[]>([]);
  const atRef = useRef(0);
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

  /** The track at a position in the shuffled order. */
  const uriAt = (i: number) => `spotify:track:${orderRef.current[i]}`;

  /** Move to the next track and play it. Shared by the skip control and by
   * the end-of-track handler, so a manual skip and a natural one advance the
   * running order identically — the alternative is two code paths that drift
   * and land you on the same song twice. */
  const advance = () => {
    const c = ctrlRef.current;
    if (!c || !orderRef.current.length) return;
    atRef.current = (atRef.current + 1) % orderRef.current.length;
    c.loadUri(uriAt(atRef.current));
    c.play();
    setPlaying(true);
  };

  const start = () => {
    markAsked();
    setLive(true);
    // The host element only exists once `live` is true, so wait a tick for it
    // to be in the DOM before handing it to Spotify.
    window.setTimeout(() => {
      const host = hostRef.current;
      if (!host) return;
      orderRef.current = shuffled(TRACK_IDS);
      atRef.current = 0;

      loadSpotifyApi()
        .then((api) => {
          api.createController(
            host,
            { uri: uriAt(0), width: "100%", height: "80" },
            (controller) => {
              ctrlRef.current = controller;

              // One track at a time, so advancing is ours to do. The embed
              // reports position and duration; when a track reaches its end,
              // hand over the next one in the shuffled order and start it.
              // Guarded against firing twice on the same end, which the
              // update stream will happily do.
              let ended = false;
              controller.addListener("playback_update", ({ data }) => {
                if (!data || !data.duration) return;
                const atEnd = data.position >= data.duration - 800;
                if (atEnd && !ended) {
                  ended = true;
                  advance();
                } else if (!atEnd) {
                  ended = false;
                }
              });

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
        {live ? (
          <button
            type="button"
            onClick={advance}
            className="rd-link rd-player-next"
            aria-label="Skip to the next track"
          >
            <span aria-hidden="true">▶▶</span>
          </button>
        ) : null}
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
