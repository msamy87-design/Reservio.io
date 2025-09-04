import Stripe from 'stripe';
import { mockServices, mockBusinessSettings, mockCustomers } from '../data/mockData';
// FIX: Correctly import shared types to resolve module error.
import { PaymentIntentDetails } from '../../../../types';
// FIX: Correctly import aiService to resolve module error.
import { getNoShowRiskScore } from './aiService';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in the environment variables.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (details: PaymentIntentDetails): Promise<{ clientSecret: string; depositAmount: number; depositReason: string; }> => {
    const service = mockServices.find(s => s.id === details.serviceId);
    if (!service) {
        throw new Error('Service not found.');
    }
    
    // In a real app, customer would be passed in or looked up
    const mockCustomerForRisk = { full_name: 'New Customer', email: `new_${Date.now()}@example.com` };

    const riskScore = await getNoShowRiskScore({
        ...details,
        customer: mockCustomerForRisk
    });

    const businessSettings = mockBusinessSettings[details.businessId];
    if (!businessSettings) {
        throw new Error('Business settings not found');
    }

    let amount = service.price * 100; // Default to full price in cents
    let depositAmount = 0;
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
    } else if (standardDepositSettings.deposit_type === 'percentage' && standardDepositSettings.deposit_value > 0) {
        // Standard percentage deposit
        amount = Math.round(amount * (standardDepositSettings.deposit_value / 100));
        depositAmount = amount / 100;
    }

    if (amount < 50) { // Stripe's minimum charge is $0.50
        console.warn(`Calculated amount is ${amount} cents, which is below Stripe's minimum. The payment will likely fail.`);
        // For this mock, we'll proceed, but in a real app you might prevent this.
        if (amount === 0) {
             return { 
                clientSecret: '', // No payment needed
                depositAmount: 0,
                depositReason: ''
            };
        }
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
            businessId: details.businessId,
            riskScore: riskScore
        }
    });

    if (!paymentIntent.client_secret) {
        throw new Error('Failed to create payment intent.');
    }

    return { 
        clientSecret: paymentIntent.client_secret,
        depositAmount,
        depositReason
    };
};
