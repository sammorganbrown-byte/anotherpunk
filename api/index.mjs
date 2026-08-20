// Vercel serverless entry.
//
// `vite build` emits dist/server/server.js, which exports a Web-standard
// `{ fetch(Request) => Response }` handler. Vercel's Node runtime hands us
// Node's (req, res), so this bridges between the two explicitly rather than
// relying on any particular Vercel version auto-detecting a Web handler.
//
// The raw request body is passed through UNMODIFIED and unparsed. That is
// load-bearing: /api/stripe-webhook verifies Stripe's signature against the
// exact bytes Stripe sent, so any re-encoding or JSON round-trip here would
// break signature verification and silently kill fulfillment.
import handler from "../dist/server/server.js";

export const config = { runtime: "nodejs" };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function vercelHandler(req, res) {
  try {
    const proto = req.headers["x-forwarded-proto"] ?? "https";
    const host = req.headers["x-forwarded-host"] ?? req.headers.host;
    const url = `${proto}://${host}${req.url}`;

    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const body = hasBody ? await readRawBody(req) : undefined;

    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: body && body.length > 0 ? body : undefined,
    });

    const response = await handler.fetch(request, process.env, {});

    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    const buffer = Buffer.from(await response.arrayBuffer());
    res.end(buffer);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end("<!doctype html><title>Error</title><h1>Something went wrong</h1>");
  }
}
