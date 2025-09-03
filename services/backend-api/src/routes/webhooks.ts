import express from 'express';
import Stripe from 'stripe';
import { bookingsService } from '../services/bookingsService';

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

// IMPORTANT: Use express.raw on this route to preserve the raw body for signature verification.
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: express.Request, res: express.Response) => {
    try {
      const sig = req.headers['stripe-signature'] as string | undefined;
      if (!sig || !WEBHOOK_SECRET) {
        console.error('[stripe] Missing signature or webhook secret');
        return res.status(400).send('Missing Stripe signature or secret');
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
      } catch (err: any) {
        console.error('[stripe] Signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle supported event types
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const pi = event.data.object as Stripe.PaymentIntent;
          const bookingId = pi.metadata?.booking_id;
          const amountReceived = pi.amount_received;
          console.log('[stripe] payment_intent.succeeded', { bookingId, amountReceived });

          // Mark booking as paid in DB
          await bookingsService.markPaid(bookingId, { amount: amountReceived, paymentIntentId: pi.id });

          break;
        }

        case 'payment_intent.payment_failed': {
          const pi = event.data.object as Stripe.PaymentIntent;
          const bookingId = pi.metadata?.booking_id;
          const lastError = pi.last_payment_error?.message;
          console.warn('[stripe] payment failed', { bookingId, lastError });

          // Persist failure reason / notify user
          await bookingsService.markPaymentFailed(bookingId, { reason: lastError ?? 'unknown', paymentIntentId: pi.id });

          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          const bookingId = (charge.metadata && (charge.metadata as any).booking_id) || undefined;
          console.log('[stripe] charge.refunded', { bookingId, charge.id });

          // Mark booking/refund status
          await bookingsService.markRefunded(bookingId, { chargeId: charge.id });

          break;
        }

        default: {
          // Log and ignore unhandled events
          console.log(`[stripe] Unhandled event: ${event.type}`);
          break;
        }
      }

      return res.json({ received: true });
    } catch (e) {
      console.error('[stripe] webhook handler error', e);
      return res.status(500).send('Internal Server Error');
    }
  }
);

export default router;