
// FIX: Use named imports from express to avoid type conflicts.
import express, { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { bookingsService } from '../services/bookingsService';

const router = Router();

// If you want to pin apiVersion:
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-06-20' });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

router.post(
  '/stripe',
  // IMPORTANT: raw body so we can verify signature
  express.raw({ type: 'application/json' }),
  // FIX: Use named imports for Request and Response types.
  async (req: Request, res: Response) => {
    try {
      const sig = req.headers['stripe-signature'] as string | undefined;
      if (!sig || !WEBHOOK_SECRET) {
        console.error('[stripe] Missing signature or webhook secret');
        return res.status(400).send('Missing Stripe signature or secret');
      }

      // req.body is a Buffer because of express.raw
      // FIX: Use req.body directly to avoid 'Buffer' not found error when node types are missing.
      const buf = req.body;

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(buf, sig, WEBHOOK_SECRET);
      } catch (err: any) {
        console.error('[stripe] Signature verification failed:', err?.message);
        return res.status(400).send(`Webhook Error: ${err?.message ?? 'invalid signature'}`);
      }

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const pi = event.data.object as Stripe.PaymentIntent;
          const bookingId = pi.metadata?.booking_id;
          console.log('[stripe] payment_intent.succeeded', { bookingId, amountReceived: pi.amount_received });
          await bookingsService.markPaid(bookingId, { amount: pi.amount_received, paymentIntentId: pi.id });
          break;
        }
        case 'payment_intent.payment_failed': {
          const pi = event.data.object as Stripe.PaymentIntent;
          console.warn('[stripe] payment failed', {
            bookingId: pi.metadata?.booking_id,
            lastError: pi.last_payment_error?.message,
          });
          await bookingsService.markPaymentFailed(pi.metadata?.booking_id, { reason: pi.last_payment_error?.message, paymentIntentId: pi.id });
          break;
        }
        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          const bookingId = (charge.metadata as any)?.booking_id;
          console.log('[stripe] charge.refunded', { bookingId, chargeId: charge.id });
          await bookingsService.markRefunded(bookingId, { chargeId: charge.id });
          break;
        }
        default: {
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
