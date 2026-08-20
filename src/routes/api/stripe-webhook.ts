import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { getStripe, type CheckoutSessionMetadata } from "../../lib/stripe.server";
import {
  createTapstitchOrder,
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
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
          return new Response("Webhook secret not configured", { status: 500 });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return new Response("Missing stripe-signature header", { status: 400 });
        }

        const body = await request.text();
        const stripe = getStripe();

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
        if (session.payment_status !== "paid") {
          return new Response("ok (not paid)", { status: 200 });
        }

        const metadata = session.metadata as unknown as CheckoutSessionMetadata | null;
        if (!metadata?.itemsJson) {
          return new Response("Session has no order metadata, can't fulfill", { status: 400 });
        }

        let lines: TapstitchOrderLine[];
        try {
          lines = (
            JSON.parse(metadata.itemsJson) as Array<{
              slug: string;
              sizeLabel: string;
              qty: number;
            }>
          ).map((i) => ({ slug: i.slug, sizeLabel: i.sizeLabel, qty: i.qty }));
        } catch {
          return new Response("Couldn't parse order metadata", { status: 400 });
        }

        // Stripe's own collected address is the shipping-of-record: it has
        // been through Stripe's country/postal-format validation, unlike the
        // free-text metadata copy which only existed pre-payment. Fall back
        // to metadata only if shipping_details is somehow absent.
        const shipping = session.shipping_details;
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
          // Lands as a HELD Shopify draft order, which Tapstitch's app does
          // NOT see until it's completed into a real order. Nothing is
          // produced by this call alone — see submitTapstitchOrder.
          const result = await createTapstitchOrder(lines, address, orderReference);
          if (!result.id) {
            return new Response("Shopify accepted the request but returned no draft id", {
              status: 500,
            });
          }
          return new Response("ok", { status: 200 });
        } catch (err) {
          // Non-2xx tells Stripe to retry later, which is right for a
          // transient failure. A permanently invalid order will keep
          // retrying until someone looks — there's no dead-letter or
          // alerting wired up yet.
          return new Response(
            `Tapstitch order failed: ${err instanceof Error ? err.message : "unknown error"}`,
            { status: 500 },
          );
        }
      },
    },
  },
});
