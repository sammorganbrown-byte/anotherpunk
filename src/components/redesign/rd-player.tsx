/** The soundtrack, as a line in the top bar.
 *
 * This was an <audio> element with a single track and a hard-won autoplay
 * strategy behind it. It is now a link out to a playlist instead, which drops
 * the whole problem: no autoplay policy to fight, no file to ship, no second
 * player to keep from overlapping the one on /classic, and the music keeps
 * playing when the visitor leaves the site.
 *
 * It stays where the player was — another item in the terminal line at the
 * top, alongside SHOP and BAG — so nothing moves.
 */

/** The playlist this links to. One constant: change it here and nowhere else.
 *
 * The `?si=` token from the share link is deliberately dropped. It is a share
 * attribution token tied to the account that copied the link, not part of the
 * address — the playlist opens fine without it, and there is no reason to
 * stamp every visitor's request with it. */
const PLAYLIST_URL = "https://open.spotify.com/playlist/6N5Xm74m5aX0nScoTO2Mp1";
const PLAYLIST_LABEL = "Playlist";

export function RdPlayer() {
  return (
    <a
      className="rd-link rd-player-btn"
      href={PLAYLIST_URL}
      target="_blank"
      // noreferrer alongside noopener: the tab this opens should not be handed
      // a handle back to the storefront.
      rel="noopener noreferrer"
    >
      <span aria-hidden="true" className="rd-player-glyph">
        ▶
      </span>
      {/* Drops on a narrow screen; the glyph and the link survive. */}
      <span className="rd-player-title">{PLAYLIST_LABEL}</span>
      <span className="rd-sr">Open the playlist on Spotify in a new tab</span>
    </a>
  );
}
