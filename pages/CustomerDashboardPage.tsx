import React, { useState, useEffect } from 'react';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { fetchMyBookings, cancelMyBooking, submitReview } from '../services/customerApi';
import { Booking, Review } from '../types';
import MarketplaceHeader from '../components/MarketplaceHeader';
import MarketplaceFooter from '../components/MarketplaceFooter';
import ReviewFormModal from '../components/ReviewFormModal';
import { useToast } from '../contexts/ToastContext';

const CustomerDashboardPage: React.FC = () => {
    const { currentCustomer, customerToken } = useCustomerAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [bookingToReview, setBookingToReview] = useState<Booking | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        const loadBookings = async () => {
            if (!customerToken) return;
            setLoading(true);
            try {
                const myBookings = await fetchMyBookings(customerToken);
                setBookings(myBookings.sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime()));
            } catch (error) {
                console.error("Failed to fetch bookings:", error);
            } finally {
                setLoading(false);
            }
        };
        loadBookings();
    }, [customerToken]);

    const handleCancelBooking = async (bookingId: string) => {
        if (!customerToken) return;
        if (window.confirm('Are you sure you want to cancel this booking?')) {
            try {
                const updatedBooking = await cancelMyBooking(bookingId, customerToken);
                setBookings(bookings.map(b => b.id === bookingId ? updatedBooking : b));
                addToast('Booking cancelled successfully.', 'success');
            } catch (error) {
                addToast('Failed to cancel booking.', 'error');
            }
        }
    };
    
    const handleOpenReviewModal = (booking: Booking) => {
        setBookingToReview(booking);
        setIsReviewModalOpen(true);
    };

    const handleReviewSubmit = async (data: { rating: number, comment: string }) => {
        if (!customerToken || !bookingToReview) return;
        try {
            await submitReview({ ...data, booking_id: bookingToReview.id }, customerToken);
            setBookings(bookings.map(b => b.id === bookingToReview.id ? { ...b, review_submitted: true } : b));
            addToast('Thank you for your review!', 'success');
            setIsReviewModalOpen(false);
            setBookingToReview(null);
        } catch (error) {
            addToast('Failed to submit review.', 'error');
        }
    };

    const upcomingBookings = bookings.filter(b => new Date(b.start_at) >= new Date() && b.status === 'confirmed');
    const pastBookings = bookings.filter(b => new Date(b.start_at) < new Date() || b.status !== 'confirmed');
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    const BookingCard: React.FC<{ booking: Booking, isUpcoming: boolean }> = ({ booking, isUpcoming }) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-start">
            <div>
                <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{booking.service.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">with {booking.staff.full_name} at {booking.business?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">{formatDate(booking.start_at)} at {formatTime(booking.start_at)}</p>
                <p className={`mt-2 text-sm font-semibold capitalize ${booking.status === 'confirmed' ? 'text-green-600' : 'text-gray-500'}`}>{booking.status}</p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col sm:items-end gap-2 self-stretch sm:self-center">
                {isUpcoming && <button onClick={() => handleCancelBooking(booking.id)} className="px-3 py-1 text-sm text-red-600 dark:text-red-400 border border-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/50">Cancel Booking</button>}
                {booking.status === 'completed' && !booking.review_submitted && <button onClick={() => handleOpenReviewModal(booking)} className="px-3 py-1 text-sm text-indigo-600 dark:text-indigo-400 border border-indigo-500 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/50">Leave a Review</button>}
                {booking.status === 'completed' && booking.review_submitted && <span className="text-xs text-gray-400">Review submitted</span>}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <MarketplaceHeader />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Welcome, {currentCustomer?.full_name}!</h1>
                
                <div className="mt-8">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Upcoming Appointments</h2>
                    {loading ? <p>Loading...</p> : upcomingBookings.length > 0 ? (
                        <div className="space-y-4">{upcomingBookings.map(b => <BookingCard key={b.id} booking={b} isUpcoming={true} />)}</div>
                    ) : <p className="text-gray-500">You have no upcoming appointments.</p>}
                </div>
                
                <div className="mt-12">
                     <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Past Appointments</h2>
                    {loading ? <p>Loading...</p> : pastBookings.length > 0 ? (
                        <div className="space-y-4">{pastBookings.map(b => <BookingCard key={b.id} booking={b} isUpcoming={false} />)}</div>
                    ) : <p className="text-gray-500">You have no past appointments.</p>}
                </div>
            </main>
            <MarketplaceFooter />
            {isReviewModalOpen && bookingToReview && (
                <ReviewFormModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    booking={bookingToReview}
                    onSubmit={handleReviewSubmit}
                />
            )}
        </div>
    );
};

export default CustomerDashboardPage;
