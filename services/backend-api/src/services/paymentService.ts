
import Stripe from 'stripe';
import { mockServices } from '../data/mockData';
import { BusinessSettings } from '../../../../types'; // Adjust path as necessary

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in the environment variables.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Mock business payment settings. In a real app, this would be fetched from the DB for the specific business.
const mockPaymentSettings: BusinessSettings['payment_settings'] = {
    stripe_connected: true,
    deposit_type: 'fixed',
    deposit_value: 10.00
};

export const createPaymentIntent = async (serviceId: string): Promise<string> => {
    const service = mockServices.find(s => s.id === serviceId);
    if (!service) {
        throw new Error('Service not found.');
    }

    let amount = service.price * 100; // Stripe expects amount in cents

    // Apply deposit logic
    if (mockPaymentSettings.deposit_type === 'fixed' && mockPaymentSettings.deposit_value > 0) {
        amount = mockPaymentSettings.deposit_value * 100;
    } else if (mockPaymentSettings.deposit_type === 'percentage' && mockPaymentSettings.deposit_value > 0) {
        amount = Math.round(amount * (mockPaymentSettings.deposit_value / 100));
    }

    if (amount < 50) { // Stripe's minimum charge is $0.50
        console.warn(`Calculated amount is ${amount} cents, which is below Stripe's minimum. Defaulting to service price.`);
        amount = service.price * 100;
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        automatic_payment_methods: {
            enabled: true,
        },
        metadata: {
            serviceId: service.id,
            serviceName: service.name,
        }
    });

    if (!paymentIntent.client_secret) {
        throw new Error('Failed to create payment intent.');
    }

    return paymentIntent.client_secret;
};
