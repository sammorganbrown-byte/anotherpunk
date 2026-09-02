import { createFileRoute } from "@tanstack/react-router";
import { POST_QUEUE } from "../lib/post-queue";

/** The posting queue, rendered from the file the publisher actually reads.
 *
 * Server-rendered HTML rather than a React route on purpose. A client route
 * would ship the whole queue into the browser bundle and any key check would
 * be theatre — this way the page does not exist at all without the key, and
 * the queue never leaves the server unasked.
 *
 * It reads POST_QUEUE directly, so it cannot drift from what will be
 * published. There is no second copy to keep in step.
 */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const Route = createFileRoute("/admin")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const key = process.env.ADMIN_KEY?.trim();
        const given = new URL(request.url).searchParams.get("key");

        // No key configured means the page is off, not open. Failing open on
        // an admin surface is how these things end up indexed.
        if (!key || given !== key) {
          return new Response("Not found", {
            status: 404,
            headers: { "content-type": "text/plain" },
          });
        }

        const today = new Date().toISOString().slice(0, 10);
        const rows = [...POST_QUEUE].sort((a, b) => a.due.localeCompare(b.due));
        const gone = rows.filter((p) => p.due < today).length;

        const cards = rows
          .map((p, i) => {
            const d = new Date(p.due + "T12:00:00Z");
            const when = `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
            const posted = p.due < today;
            return `
    <article class="post" data-gone="${posted ? "yes" : "no"}">
      <div class="shots">${p.images.map((f) => `<img class="shot" src="/img/${esc(f)}" alt="" loading="lazy">`).join("")}</div>
      <div class="meta">
        <p class="when">
          <span class="num">${String(i + 1).padStart(2, "0")}</span>
          <span>${when}</span>
          <span class="tag" data-live="${posted ? "no" : "yes"}">${posted ? "posted" : "scheduled"}</span>
        </p>
        <p class="caption">${esc(p.caption)}</p>
        <p class="file">${p.images.map(esc).join(" &middot; ")} &middot; ${esc(p.id)}</p>
      </div>
    </article>`;
          })
          .join("");

        return new Response(page(cards, rows.length, gone), {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
            // Never let this end up in a search index.
            "x-robots-tag": "noindex, nofollow",
          },
        });
      },
    },
  },
});

/** Escapes text into HTML. Captions are content, never markup. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function page(cards: string, total: number, gone: number): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Post queue — Another Punk</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&display=swap">
<style>
  :root {
    --void:#080807; --void-2:#0e0d0c; --paper:#ece8e0; --dim:#77716a;
    --dimmer:#443f3a; --red:#ed1c24; --rule:#1e1c1a;
    --mono: ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,monospace;
    --display:"Anton","Arial Narrow",Haettenschweiler,sans-serif;
    color-scheme: dark;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--void);color:var(--paper);font-family:var(--mono);
       font-size:13px;line-height:1.6;-webkit-font-smoothing:antialiased}
  .wrap{max-width:1000px;margin:0 auto;padding:44px 20px 100px}
  header{border-bottom:1px solid var(--rule);padding-bottom:26px}
  .eyebrow{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);margin:0 0 14px}
  .eyebrow b{color:var(--red);font-weight:400}
  h1{font-family:var(--display);font-weight:400;font-size:clamp(38px,8vw,74px);
     line-height:.92;margin:0 0 18px;text-wrap:balance}
  .lede{color:var(--dim);max-width:64ch;margin:0 0 12px}
  .lede strong{color:var(--paper);font-weight:400}
  .tally{display:flex;gap:26px;flex-wrap:wrap;margin-top:22px;font-size:11px;
         letter-spacing:.1em;text-transform:uppercase;color:var(--dim)}
  .tally b{color:var(--paper);font-weight:400;font-variant-numeric:tabular-nums}
  .post{display:grid;grid-template-columns:300px 1fr;gap:26px;padding:30px 0;
        border-bottom:1px solid var(--rule);align-items:start}
  .post[data-gone="yes"]{opacity:.45}
  .shots{display:flex;flex-direction:column;gap:6px}
  .shot{display:block;width:100%;height:auto;border:1px solid var(--rule);background:var(--void-2)}
  .shots .shot:not(:first-child){opacity:.66}
  .meta{min-width:0}
  .when{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);
        margin:0 0 10px;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
  .when .num{color:var(--red);font-variant-numeric:tabular-nums}
  .when .tag{border:1px solid var(--rule);padding:1px 7px}
  .when .tag[data-live="yes"]{color:var(--red);border-color:var(--red)}
  .caption{font-size:15px;line-height:1.65;margin:0 0 14px;white-space:pre-wrap;max-width:46ch}
  .file{font-size:11px;color:var(--dimmer);margin:0;word-break:break-all}
  footer{margin-top:44px;padding-top:26px;border-top:1px solid var(--rule);color:var(--dim);font-size:12px}
  footer h2{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--paper);
            font-weight:400;margin:26px 0 12px}
  footer h2:first-child{margin-top:0}
  footer p{margin:0 0 12px;max-width:66ch}
  footer code{color:var(--paper);background:var(--void-2);border:1px solid var(--rule);padding:1px 5px}
  @media(max-width:640px){.post{grid-template-columns:1fr;gap:16px}}
</style></head>
<body>
<div class="wrap">
  <header>
    <p class="eyebrow">Post queue <b>/</b> publishing automatically</p>
    <h1>${total} posts</h1>
    <p class="lede">
      Read straight from <strong>src/lib/post-queue.ts</strong> — the file the site
      publishes from, so this cannot drift from what actually goes out. A cron checks it
      every morning at 10:00 and posts anything due, one at a time. You get an email each
      time with a link.
    </p>
    <p class="lede">
      Nothing sits queued inside Instagram, because <strong>Instagram's API cannot
      schedule</strong> — it only publishes immediately. The waiting happens here instead.
    </p>
    <div class="tally">
      <span>Queued <b>${total}</b></span>
      <span>Already out <b>${gone}</b></span>
      <span>To come <b>${total - gone}</b></span>
    </div>
  </header>
${cards}
  <footer>
    <h2>Changing one</h2>
    <p>Edit <code>src/lib/post-queue.ts</code>, commit, push. Rewrite a caption, delete a
    block to drop a post, or move a <code>due</code> date to reorder — it publishes by date,
    not by position. Editing something already posted changes nothing; it will not go out
    twice.</p>
    <h2>This page</h2>
    <p>Only exists with the key in the URL. Without it the route returns a plain 404, and it
    is marked noindex so it cannot be found by search.</p>
  </footer>
</div>
</body></html>`;
}
