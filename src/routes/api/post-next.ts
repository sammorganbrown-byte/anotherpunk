import { createFileRoute } from "@tanstack/react-router";
import { POST_QUEUE, type QueuedPost } from "../../lib/post-queue";

/** Publishes the next due post from the queue to Instagram.
 *
 * Run by a daily cron. It looks for the earliest entry whose due date has
 * passed, checks Instagram itself to see whether that post already went out,
 * and publishes it if not. One post per run, never more — a backlog drains a
 * day at a time rather than dumping four posts in one morning.
 *
 * IDEMPOTENCY IS THE WHOLE GAME. A cron that retries, a manual trigger, a
 * platform that fires twice — any of these publishes the same photograph
 * again, and unlike a duplicate draft order there is no quiet way to undo it:
 * it is on the grid, in front of followers. So before publishing, this reads
 * back the account's recent media and skips anything whose caption is already
 * there. Instagram is the source of truth about what Instagram has posted;
 * a local "sent" flag would only be the story we tell ourselves.
 *
 * That check fails CLOSED, the opposite of the Shopify one. A paid order that
 * never got placed is recoverable; a post published twice is not, and nobody
 * is waiting on a photograph. If the lookup errors, nothing is published.
 */

const GRAPH = "https://graph.instagram.com/v21.0";
const SITE = "https://www.anotherpunk.com";
const NOTIFY = "sam@anotherpunk.com";

type Result = { ok: boolean; action: string; detail?: string };

export const Route = createFileRoute("/api/post-next")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Vercel signs cron requests with CRON_SECRET. Without this anyone
        // who guesses the path could push the queue out in an afternoon.
        const secret = process.env.CRON_SECRET?.trim();
        if (secret) {
          const auth = request.headers.get("authorization");
          if (auth !== `Bearer ${secret}`) {
            return json({ ok: false, action: "refused: bad or missing cron secret" }, 401);
          }
        }

        const token = process.env.IG_ACCESS_TOKEN?.trim();
        const igId = process.env.IG_USER_ID?.trim();
        if (!token || !igId) {
          return json({ ok: false, action: "not configured: IG_ACCESS_TOKEN / IG_USER_ID" }, 500);
        }

        // Earliest thing that is due. Dates are compared as plain ISO strings,
        // which sorts correctly and avoids a timezone argument nobody needs.
        const today = new Date().toISOString().slice(0, 10);
        const due = [...POST_QUEUE]
          .filter((p) => p.due <= today)
          .sort((a, b) => a.due.localeCompare(b.due));

        if (due.length === 0) {
          return json({ ok: true, action: "nothing due" });
        }

        // What has already gone out, straight from the account.
        let published: string[];
        try {
          published = await recentCaptions(igId, token);
        } catch (err) {
          // Fails closed. Better a missed day than a duplicate on the grid.
          return json(
            {
              ok: false,
              action: "could not read recent posts — publishing nothing",
              detail: msg(err),
            },
            503,
          );
        }

        const next = due.find((p) => !alreadyPosted(p, published));
        if (!next) {
          const left = POST_QUEUE.length - published.length;
          if (left <= 2) await warnQueueLow(left);
          return json({ ok: true, action: "everything due is already posted" });
        }

        try {
          const permalink = await publish(next, igId, token);
          await notify(next, permalink);
          const remaining = POST_QUEUE.filter((p) => p.due > today).length;
          if (remaining <= 2) await warnQueueLow(remaining);
          return json({ ok: true, action: `published ${next.id}`, detail: permalink });
        } catch (err) {
          await notifyFailure(next, msg(err));
          return json({ ok: false, action: `failed to publish ${next.id}`, detail: msg(err) }, 500);
        }
      },
    },
  },
});

/** Captions of the last 50 posts. Compared rather than counted, because the
 * account also carries posts made by hand from the phone. */
async function recentCaptions(igId: string, token: string): Promise<string[]> {
  const r = await fetch(`${GRAPH}/${igId}/media?fields=caption&limit=50&access_token=${token}`);
  if (!r.ok) throw new Error(`media read failed: HTTP ${r.status}`);
  const j = (await r.json()) as { data?: { caption?: string }[] };
  return (j.data ?? []).map((m) => m.caption ?? "");
}

/** Matches on the first line rather than the whole caption. A caption edited
 * on the phone after posting would otherwise look like a different post and
 * be published a second time. */
function alreadyPosted(post: QueuedPost, captions: string[]): boolean {
  const head = post.caption.split("\n")[0].trim();
  if (!head) return false;
  return captions.some((c) => c.trim().startsWith(head));
}

/** Builds a container, waits for Instagram to fetch the images, publishes.
 *
 * One image posts as a single photo; two or three post as a carousel, which
 * needs a container per image and then a container wrapping those. The single
 * case is not just a carousel of one — Instagram renders a one-item carousel
 * with swipe affordances and a different crop, so it is worth the branch. */
async function publish(post: QueuedPost, igId: string, token: string): Promise<string> {
  const urls = post.images.map((f) => `${SITE}/img/${f}`);
  const containerId =
    urls.length === 1
      ? await singleContainer(urls[0], post.caption, igId, token)
      : await carouselContainer(urls, post.caption, igId, token);

  // Up to ~30s. Instagram is downloading photographs from anotherpunk.com;
  // usually ready on the first or second look, slower for a carousel.
  for (let i = 0; i < 12; i++) {
    const s = await fetch(`${GRAPH}/${containerId}?fields=status_code&access_token=${token}`);
    const sb = (await s.json()) as { status_code?: string };
    if (sb.status_code === "FINISHED") break;
    if (sb.status_code === "ERROR") throw new Error("Instagram could not process the image");
    await new Promise((r) => setTimeout(r, 3000));
  }

  const pub = await fetch(`${GRAPH}/${igId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: containerId, access_token: token }),
  });
  const pubBody = (await pub.json()) as { id?: string; error?: { message?: string } };
  if (!pub.ok || !pubBody.id) {
    throw new Error(pubBody.error?.message ?? `publish failed: HTTP ${pub.status}`);
  }

  const link = await fetch(`${GRAPH}/${pubBody.id}?fields=permalink&access_token=${token}`);
  const lb = (await link.json()) as { permalink?: string };
  return lb.permalink ?? `https://www.instagram.com/anotherpunk.threads/`;
}

/** A single photo container. */
async function singleContainer(
  url: string,
  caption: string,
  igId: string,
  token: string,
): Promise<string> {
  return container(igId, token, { image_url: url, caption });
}

/** A carousel: one container per image, then a container holding them.
 *
 * The children are built in sequence rather than in parallel — Instagram
 * rate-limits container creation, and a carousel that half-builds leaves
 * orphaned containers with no way to tell what happened. */
async function carouselContainer(
  urls: string[],
  caption: string,
  igId: string,
  token: string,
): Promise<string> {
  const children: string[] = [];
  for (const url of urls) {
    children.push(await container(igId, token, { image_url: url, is_carousel_item: true }));
  }
  return container(igId, token, {
    media_type: "CAROUSEL",
    children: children.join(","),
    caption,
  });
}

async function container(
  igId: string,
  token: string,
  fields: Record<string, unknown>,
): Promise<string> {
  const r = await fetch(`${GRAPH}/${igId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...fields, access_token: token }),
  });
  const b = (await r.json()) as { id?: string; error?: { message?: string } };
  if (!r.ok || !b.id) throw new Error(b.error?.message ?? `container failed: HTTP ${r.status}`);
  return b.id;
}

async function notify(post: QueuedPost, permalink: string) {
  await email(
    `Posted: ${post.id}`,
    `${post.caption}\n\n${permalink}\n\n${post.images.length === 1 ? "Image" : `${post.images.length} images`}: ${post.images.join(", ")}\n\nPosted automatically from the queue. Nothing to do.`,
  );
}

async function notifyFailure(post: QueuedPost, detail: string) {
  await email(
    `Instagram post failed: ${post.id}`,
    `Nothing was published.\n\n${detail}\n\nIf this says the token is invalid or expired, generate a new one in the Meta app dashboard — Instagram, Generate access tokens — and it needs putting into Vercel as IG_ACCESS_TOKEN.\n\nIt will try again tomorrow.`,
  );
}

async function warnQueueLow(left: number) {
  await email(
    `Post queue running low: ${left} left`,
    `${left} post${left === 1 ? "" : "s"} remaining in the queue.\n\nWhen it empties the account goes quiet, so this is the nudge to approve another batch.`,
  );
}

/** Best-effort. A failed email must never stop a post going out, or turn a
 * successful publish into a reported failure. */
async function email(subject: string, text: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM?.trim() || "Another Punk <hello@send.anotherpunk.com>",
        to: [NOTIFY],
        subject: `Another Punk — ${subject}`,
        text,
      }),
    });
  } catch {
    // Nothing to do about it here.
  }
}

const msg = (e: unknown) => (e instanceof Error ? e.message : "unknown error");

const json = (body: Result, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
