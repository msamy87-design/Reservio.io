
import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { createPublicBooking } from '../services/marketplaceApi';
import { NewPublicBookingData } from '../types';
import { useToast } from '../contexts/ToastContext';
import { CreditCardIcon } from './Icons';

interface CheckoutFormProps {
    clientSecret: string;
    bookingData: Omit<NewPublicBookingData, 'paymentIntentId'>;
    onSuccess: () => void;
}

const cardElementOptions = {
    style: {
        base: {
            color: '#32325d',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
                color: '#aab7c4'
            },
        },
        invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
        },
    },
    // To comply with dark mode
    // This is a simplified approach. A more robust solution would involve dynamic styles.
    ... (document.documentElement.classList.contains('dark') && {
        style: {
             base: {
                color: '#ffffff',
                iconColor: '#aab7c4',
                '::placeholder': {
                    color: '#aab7c4'
                },
             },
             invalid: {
                color: '#fa755a',
                iconColor: '#fa755a'
            },
        }
    })
};

const CheckoutForm: React.FC<CheckoutFormProps> = ({ clientSecret, bookingData, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { addToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setError(null);

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
             setIsProcessing(false);
             return;
        }

        const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: bookingData.customer.full_name,
                    email: bookingData.customer.email,
                },
            },
        });
        
        if (paymentError) {
            setError(paymentError.message || "An unexpected error occurred.");
            setIsProcessing(false);
            return;
        }

        if (paymentIntent && paymentIntent.status === 'succeeded') {
            try {
                const finalBookingData: NewPublicBookingData = {
                    ...bookingData,
                    paymentIntentId: paymentIntent.id
                };
                await createPublicBooking(finalBookingData);
                addToast('Payment successful and booking confirmed!', 'success');
                onSuccess();
            } catch (bookingError) {
                console.error("Booking creation failed after payment:", bookingError);
                setError("Payment was successful, but we failed to finalize your booking. Please contact support.");
                addToast("Payment successful, but booking failed. Please contact support.", 'error');
            }
        }

        setIsProcessing(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Card Details</label>
                <div className="p-3 border rounded-md dark:border-gray-600">
                    <CardElement options={cardElementOptions} />
                </div>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <button
                disabled={isProcessing || !stripe}
                className="w-full flex justify-center items-center gap-2 mt-4 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-800"
            >
                {isProcessing ? 'Processing...' : (
                    <>
                        <CreditCardIcon className="h-5 w-5" />
                        Confirm & Pay
                    </>
                )}
            </button>
        </form>
    );
};

export default CheckoutForm;
