import Stripe from 'stripe';
import { mockServices, mockBusinessSettings } from '../data/mockData';
import { PaymentIntentDetails } from '../../../../types';
import { getNoShowRiskScore } from './aiService';

let stripe: Stripe | null = null;

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("STRIPE_SECRET_KEY is not set in the environment variables. Payment services will be disabled.");
} else {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

export const createPaymentIntent = async (details: PaymentIntentDetails): Promise<{ clientSecret: string | null; depositAmount: number; depositReason: string; }> => {
    const service = mockServices.find(s => s.id === details.serviceId);
    if (!service) {
        throw new Error('Service not found.');
    }
    
    const businessSettings = mockBusinessSettings[details.businessId];
    if (!businessSettings) {
        throw new Error('Business settings not found');
    }

    // For this flow, we'll use the passed-in customer details for guests,
    // or a placeholder for logged-in users (in a real app, you'd fetch their history).
    const customerForRisk = details.customer || { full_name: 'Existing Customer', email: 'logged-in-user@example.com' };

    const riskScore = await getNoShowRiskScore({
        serviceId: details.serviceId,
        staffId: details.staffId,
        startTime: details.startTime,
        customer: customerForRisk,
    });

    let amount = 0; // in cents
    let depositAmount = 0; // in dollars
    let depositReason = '';

    const standardDepositSettings = businessSettings.payment_settings;
    const noShowSettings = businessSettings.no_show_prevention;

    // Determine the amount based on risk score and settings
    if (noShowSettings.enabled && riskScore >= 7 && noShowSettings.high_risk_deposit_amount > 0) {
        // High risk: use the no-show deposit amount
        amount = noShowSettings.high_risk_deposit_amount * 100;
        depositAmount = noShowSettings.high_risk_deposit_amount;
        depositReason = "To help our small businesses reduce no-shows, a deposit is required for this appointment time.";
    } else if (standardDepositSettings.deposit_type === 'fixed' && standardDepositSettings.deposit_value > 0) {
        // Standard fixed deposit
        amount = standardDepositSettings.deposit_value * 100;
        depositAmount = standardDepositSettings.deposit_value;
        depositReason = `A deposit of $${depositAmount.toFixed(2)} is required to secure your booking.`;
    } else if (standardDepositSettings.deposit_type === 'percentage' && standardDepositSettings.deposit_value > 0) {
        // Standard percentage deposit
        const totalAmount = service.price * 100;
        amount = Math.round(totalAmount * (standardDepositSettings.deposit_value / 100));
        depositAmount = amount / 100;
        depositReason = `A ${standardDepositSettings.deposit_value}% deposit is required to secure your booking.`;
    }

    // If no Stripe, or amount is too small, no payment can be processed.
    if (!stripe || amount < 50) { // Stripe's minimum charge is $0.50.
        return {
            clientSecret: null,
            depositAmount: 0,
            depositReason: ''
        };
    }
    
    // Proceed with creating Stripe Payment Intent
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount),
            currency: service.currency.toLowerCase(),
            automatic_payment_methods: { enabled: true },
            metadata: {
                businessId: details.businessId,
                serviceId: details.serviceId,
                staffId: details.staffId,
                startTime: details.startTime,
            }
        });

        return {
            clientSecret: paymentIntent.client_secret,
            depositAmount,
            depositReason,
        };
    } catch (error) {
        console.error("Error creating Stripe Payment Intent:", error);
        throw new Error("Could not initiate payment process.");
    }
};
