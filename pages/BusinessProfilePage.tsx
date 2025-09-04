

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getBusinessById } from '../services/marketplaceApi';
import { PublicBusinessProfile, PublicService } from '../types';
import MarketplaceHeader from '../components/MarketplaceHeader';
import StarRating from '../components/StarRating';
import { MapPinIcon, PhoneIcon } from '../components/Icons';
import BookingModal from '../components/BookingModal';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../utils/env';
import MarketplaceFooter from '../components/MarketplaceFooter';

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;


const BusinessProfilePage: React.FC = () => {
    const { businessId } = useParams<{ businessId: string }>();
    const [business, setBusiness] = useState<PublicBusinessProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<PublicService | null>(null);

    useEffect(() => {
        const fetchBusiness = async () => {
            if (!businessId) return;
            setLoading(true);
            setError(null);
            try {
                const data = await getBusinessById(businessId);
                setBusiness(data);
            } catch (err) {
                setError('Failed to load business profile.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBusiness();
    }, [businessId]);

    const handleBookNow = (service: PublicService) => {
        if (!stripePromise) {
            alert("Stripe is not configured. Please add VITE_STRIPE_PUBLISHABLE_KEY to your environment variables.");
            return;
        }
        setSelectedService(service);
        setIsBookingModalOpen(true);
    };

    if (loading) {
        return <div className="text-center p-10">Loading business profile...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">{error}</div>;
    }

    if (!business) {
        return <div className="text-center p-10">Business not found.</div>;
    }
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <Elements stripe={stripePromise}>
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
                <MarketplaceHeader />
                <main className="flex-grow">
                    {/* Hero Section */}
                    <div className="relative h-64 sm:h-80 lg:h-96">
                        <img src={business.imageUrl} alt={`${business.name} hero`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black bg-opacity-40" />
                        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 text-white">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">{business.name}</h1>
                            <div className="mt-2 flex items-center gap-4">
                                <div className="flex items-center">
                                    <StarRating rating={business.average_rating} />
                                    <span className="ml-2 text-sm">({business.review_count} reviews)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main content - Services */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Services</h2>
                                <ul className="space-y-4">
                                    {business.services.map(service => (
                                        <li key={service.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{service.name}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{service.description}</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{service.duration_minutes} min &bull; ${service.price.toFixed(2)}</p>
                                            </div>
                                            <button onClick={() => handleBookNow(service)} className="mt-3 sm:mt-0 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex-shrink-0">
                                                Book Now
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Reviews</h2>
                                <ul className="space-y-6">
                                    {business.reviews.slice(0, 5).map(review => (
                                        <li key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-gray-800 dark:text-gray-200">{review.customer_name}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(review.created_at)}</span>
                                            </div>
                                            <div className="mt-1"><StarRating rating={review.rating} /></div>
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Sidebar - Info */}
                        <div className="lg:col-span-1 space-y-6">
                             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Business Info</h3>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex items-start gap-3">
                                        <MapPinIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700 dark:text-gray-300">{business.address}</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <PhoneIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                        <span className="text-gray-700 dark:text-gray-300">{business.phone}</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Our Team</h3>
                                <ul className="space-y-3">
                                    {business.staff.map(staffMember => (
                                        <li key={staffMember.id}>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{staffMember.full_name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{staffMember.role}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </main>
                <MarketplaceFooter />
            </div>
            {isBookingModalOpen && selectedService && business && (
                 <BookingModal
                    isOpen={isBookingModalOpen}
                    onClose={() => setIsBookingModalOpen(false)}
                    service={selectedService}
                    business={business}
                />
            )}
        </Elements>
    );
};

export default BusinessProfilePage;