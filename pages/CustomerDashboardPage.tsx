
import React, { useState, useEffect, useMemo } from 'react';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { getMyBookings, cancelMyBooking } from '../services/customerApi';
import { Booking } from '../types';
import MarketplaceHeader from '../components/MarketplaceHeader';
import { useToast } from '../contexts/ToastContext';

type ActiveTab = 'upcoming' | 'past';

const CustomerDashboardPage: React.FC = () => {
    const { currentCustomer, customerToken } = useCustomerAuth();
    const { addToast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ActiveTab>('upcoming');

    useEffect(() => {
        const fetchBookings = async () => {
            if (!customerToken) return;
            setLoading(true);
            try {
                const myBookings = await getMyBookings(customerToken);
                setBookings(myBookings.sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime()));
            } catch (error) {
                console.error("Failed to fetch bookings:", error);
                addToast('Could not load your bookings.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, [customerToken, addToast]);
    
    const handleCancelBooking = async (bookingId: string) => {
        if (!customerToken || !window.confirm('Are you sure you want to cancel this appointment?')) return;
        
        try {
            await cancelMyBooking(bookingId, customerToken);
            setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
            addToast('Appointment cancelled successfully.', 'success');
        } catch (error) {
             addToast('Failed to cancel appointment.', 'error');
        }
    };

    const { upcomingBookings, pastBookings } = useMemo(() => {
        const now = new Date();
        return bookings.reduce((acc, booking) => {
            if (new Date(booking.end_at) < now || booking.status === 'completed' || booking.status === 'cancelled') {
                acc.pastBookings.push(booking);
            } else {
                acc.upcomingBookings.push(booking);
            }
            return acc;
        }, { upcomingBookings: [] as Booking[], pastBookings: [] as Booking[] });
    }, [bookings]);
    
    const bookingsToShow = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <MarketplaceHeader />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Account</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Welcome back, {currentCustomer?.full_name}!</p>

                <div className="mt-8">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button onClick={() => setActiveTab('upcoming')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'upcoming' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
                                Upcoming ({upcomingBookings.length})
                            </button>
                            <button onClick={() => setActiveTab('past')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'past' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
                                Past ({pastBookings.length})
                            </button>
                        </nav>
                    </div>

                    <div className="mt-6">
                        {loading ? (
                            <p>Loading your appointments...</p>
                        ) : bookingsToShow.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">You have no {activeTab} appointments.</p>
                        ) : (
                            <div className="space-y-4">
                                {bookingsToShow.map(booking => (
                                    <div key={booking.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <p className="font-bold text-lg text-gray-900 dark:text-white">{booking.service.name}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">with {booking.staff.full_name} at {booking.business?.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {new Date(booking.start_at).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>{booking.status}</span>
                                            {activeTab === 'upcoming' && booking.status === 'confirmed' && (
                                                <button onClick={() => handleCancelBooking(booking.id)} className="text-sm font-medium text-red-600 hover:underline">
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CustomerDashboardPage;
