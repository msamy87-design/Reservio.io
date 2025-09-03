
import express from 'express';
import * as paymentController from '../controllers/paymentController';

const router = express.Router();

// Route: POST /api/payments/create-payment-intent
// Description: Creates a Stripe Payment Intent for a given service to initiate a payment.
router.post('/create-payment-intent', paymentController.create);

export default router;