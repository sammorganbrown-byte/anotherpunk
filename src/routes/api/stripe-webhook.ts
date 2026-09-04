import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { getStripe, type CheckoutSessionMetadata } from "../../lib/stripe.server";
import { decodeOrderLines } from "../../lib/order-lines";
import { notifyOrder, notifyOrderFailure } from "../../lib/notify.server";
import { getAnotherPunkProduct } from "../../lib/another-punk-products";
import {
  createTapstitchOrder,
  submitTapstitchOrder,
  type TapstitchOrderLine,
  type ShippingAddress,
} from "../../lib/tapstitch-fulfillment.server";

// Where the real Tapstitch order gets placed for a Stripe-paid order.
// Deliberately NOT the success-page redirect: anyone can hit that URL
// without paying. This webhook is server-to-server, signed by Stripe, and
// only fires once payment genuinely completed.
//
// Register this exact URL with Stripe (https://<your-domain>/api/stripe-webhook)
// listening for checkout.session.completed. STRIPE_WEBHOOK_SECRET is the
// signing secret Stripe returns when the endpoint is created; without it
// this handler cannot verify a request came from Stripe and rejects
// everything with a 400 — on purpose. Never skip signature verification on
// a webhook that triggers real fulfillment.
export const Route = createFileRoute("/api/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
        if (!webhookSecret) {
          return new Response("Webhook secret not configured", { status: 500 });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return new Response("Missing stripe-signature header", { status: 400 });
        }

        const body = await request.text();

        // getStripe() throws when STRIPE_SECRET_KEY is missing. Keep it
        // inside a guard: letting it escape produced a raw HTML 500, which
        // Stripe reads as "retry later" and silently piles up redeliveries
        // for what is actually a permanent config fault. Fail loudly and
        // distinctly instead so it shows up as itself in the logs.
        let stripe: Stripe;
        try {
          stripe = getStripe();
        } catch (err) {
          return new Response(
            `Stripe not configured: ${err instanceof Error ? err.message : "unknown error"}`,
            { status: 500 },
          );
        }

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        } catch (err) {
          return new Response(
            `Signature verification failed: ${err instanceof Error ? err.message : "unknown error"}`,
            { status: 400 },
          );
        }

        if (event.type !== "checkout.session.completed") {
          // Not an error: Stripe sends many event types to one endpoint.
          return new Response("ok", { status: 200 });
        }

        const session = event.data.object as Stripe.Checkout.Session;
        // "no_payment_required" is what a zero-total order reports — a
        // 100%-off code. It is a completed order and must still be
        // fulfilled; dropping it here would take the order and never print it.
        if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
          return new Response("ok (not paid)", { status: 200 });
        }

        const metadata = session.metadata as unknown as CheckoutSessionMetadata | null;
        if (!metadata?.itemsJson) {
          return new Response("Session has no order metadata, can't fulfill", { status: 400 });
        }

        let lines: TapstitchOrderLine[];
        try {
          lines = decodeOrderLines(metadata.itemsJson);
        } catch {
          return new Response("Couldn't parse order metadata", { status: 400 });
        }
        if (lines.length === 0) {
          // Paid, but nothing to make. Better to fail loudly here — Stripe
          // will retry and the failure is visible in its dashboard — than to
          // acknowledge and silently drop a paid order.
          return new Response("Order metadata contained no items", { status: 400 });
        }

        // Stripe's own collected address is the shipping-of-record: it has
        // been through Stripe's country/postal-format validation, unlike the
        // free-text metadata copy which only existed pre-payment. Fall back
        // to metadata only if shipping_details is somehow absent.
        // Stripe moved this. On older API versions the collected address is
        // session.shipping_details; from 2025-03-31.basil onwards it is
        // session.collected_information.shipping_details, and a webhook
        // endpoint is pinned to whichever API version it was created with.
        // Reading only the old shape means a newer endpoint silently finds no
        // address and falls back to the free-text form values, which never
        // went through Stripe's country and postal-format validation — a
        // parcel shipped to a worse address, with nothing visibly wrong.
        const collected = (
          session as unknown as {
            collected_information?: { shipping_details?: typeof session.shipping_details };
          }
        ).collected_information?.shipping_details;
        const shipping = collected ?? session.shipping_details;
        const address: ShippingAddress = shipping?.address
          ? {
              name: shipping.name ?? metadata.name,
              email: metadata.email,
              address: shipping.address.line1 ?? metadata.address,
              addressLine2: shipping.address.line2 ?? undefined,
              city: shipping.address.city ?? metadata.city,
              stateOrCounty: shipping.address.state ?? undefined,
              postalCode: shipping.address.postal_code ?? metadata.postalCode,
              country: shipping.address.country ?? metadata.country,
            }
          : {
              name: metadata.name,
              email: metadata.email,
              address: metadata.address,
              addressLine2: metadata.addressLine2 || undefined,
              city: metadata.city,
              stateOrCounty: metadata.stateOrCounty || undefined,
              postalCode: metadata.postalCode,
              country: metadata.country,
            };

        // Derived from the Stripe session id rather than freshly random:
        // Stripe can and does redeliver the same event, and a stable
        // reference means a redelivery hits Shopify's own idempotency on
        // the draft rather than creating a second real order. Not yet
        // verified against a real duplicate delivery — flagging honestly
        // rather than claiming proven dedupe.
        const orderReference = `stripe-${session.id}`;

        try {
          // Creates the draft, then completes it so Tapstitch can see it and
          // produce it. Automatic by explicit choice — the alternative is
          // that nothing ships until someone opens Shopify, which is worse
          // for a customer who ordered at 2am.
          //
          // This is only safe because createTapstitchOrder now refuses to
          // create a second order for a payment it has already handled.
          // Without that, one €1 test payment produced FIVE identical
          // drafts; automating submission on top of that would have printed
          // and posted five garments for one sale.
          const result = await createTapstitchOrder(
            lines,
            address,
            orderReference,
            typeof session.amount_total === "number" ? session.amount_total / 100 : undefined,
          );
          if (!result.id) {
            await notifyOrderFailure({
              stage: "Shopify returned no draft id",
              detail: "The request was accepted but came back without an id, so nothing can be submitted.",
              sessionId: session.id,
              name: address.name,
              email: address.email,
            });
            return new Response("Shopify accepted the request but returned no draft id", {
              status: 500,
            });
          }

          // A draft that exists but was never completed is recoverable by
          // hand; telling Stripe the whole thing failed would have it
          // redeliver, and the duplicate check would then return this same
          // draft and try again. So a submit failure is reported as its own
          // thing, loudly, rather than being folded into the order failure.
          try {
            await submitTapstitchOrder(result.id);
          } catch (err) {
            const detail = err instanceof Error ? err.message : "unknown error";
            await notifyOrderFailure({
              stage: `draft ${result.id} created but not submitted to Tapstitch`,
              detail,
              sessionId: session.id,
              name: address.name,
              email: address.email,
            });
            return new Response(`Draft ${result.id} created but not submitted: ${detail}`, {
              status: 500,
            });
          }

          /* The alert Sam actually needs, in the shop's own product names
             rather than the Tapstitch blank names Shopify would use. Awaited
             but never allowed to throw: a Resend outage must not turn a paid
             and fulfilled order into a 500 that Stripe then retries. */
          await notifyOrder({
            lines: lines.map((l) => ({
              title: getAnotherPunkProduct(l.slug)?.title ?? l.slug,
              sizeLabel: l.sizeLabel,
              qty: l.qty,
            })),
            name: address.name,
            email: address.email,
            city: address.city,
            country: address.country,
            total:
              typeof session.amount_total === "number" ? session.amount_total / 100 : undefined,
            currency: session.currency ?? undefined,
            draftId: String(result.id),
            sessionId: session.id,
          });

          return new Response("ok", { status: 200 });
        } catch (err) {
          // Non-2xx tells Stripe to retry later, which is right for a
          // transient failure. A permanently invalid order will keep
          // retrying until someone looks — there's no dead-letter or
          // alerting wired up yet.
          const detail = err instanceof Error ? err.message : "unknown error";
          await notifyOrderFailure({
            stage: "creating the Tapstitch order",
            detail,
            sessionId: session.id,
            name: address.name,
            email: address.email,
          });
          return new Response(`Tapstitch order failed: ${detail}`, { status: 500 });
        }
      },
    },
  },
});
