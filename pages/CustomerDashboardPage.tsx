import React, { useState, useEffect } from 'react';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { fetchMyBookings, cancelMyBooking, submitReview, fetchMyFavorites } from '../services/customerApi';
import { Booking, PublicBusinessProfile } from '../types';
import MarketplaceHeader from '../components/MarketplaceHeader';
import MarketplaceFooter from '../components/MarketplaceFooter';
import ReviewFormModal from '../components/ReviewFormModal';
import { useToast } from '../contexts/ToastContext';
import ProfileSettingsForm from '../components/ProfileSettingsForm';
import { CalendarIcon, HeartIcon, Cog6ToothIcon } from '../components/Icons';
import BusinessCard from '../components/BusinessCard';
import { Link } from 'react-router-dom';

type ActiveTab = 'appointments' | 'favorites' | 'settings';

const CustomerDashboardPage: React.FC = () => {
    const { currentCustomer, customerToken } = useCustomerAuth();
    const [activeTab, setActiveTab] = useState<ActiveTab>('appointments');

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);

    const [favorites, setFavorites] = useState<PublicBusinessProfile[]>([]);
    const [favoritesLoading, setFavoritesLoading] = useState(true);

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [bookingToReview, setBookingToReview] = useState<Booking | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        const loadBookings = async () => {
            if (!customerToken || activeTab !== 'appointments') return;
            setBookingsLoading(true);
            try {
                const myBookings = await fetchMyBookings(customerToken);
                setBookings(myBookings.sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime()));
            } catch (error) {
                console.error("Failed to fetch bookings:", error);
            } finally {
                setBookingsLoading(false);
            }
        };
        loadBookings();
    }, [customerToken, activeTab]);

    useEffect(() => {
        const loadFavorites = async () => {
            if (!customerToken || activeTab !== 'favorites') return;
            setFavoritesLoading(true);
            try {
                const myFavorites = await fetchMyFavorites(customerToken);
                setFavorites(myFavorites);
            } catch (error) {
                console.error("Failed to fetch favorites:", error);
            } finally {
                setFavoritesLoading(false);
            }
        };
        loadFavorites();
    }, [customerToken, activeTab]);

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
    
    const TabButton: React.FC<{ tabName: ActiveTab; label: string; icon: React.FC<any> }> = ({ tabName, label, icon: Icon }) => (
        <button onClick={() => setActiveTab(tabName)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg ${activeTab === tabName ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
            <Icon className="h-5 w-5" />
            {label}
        </button>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'appointments':
                return <AppointmentsContent bookings={bookings} loading={bookingsLoading} onCancel={handleCancelBooking} onReview={handleOpenReviewModal} />;
            case 'favorites':
                return <FavoritesContent favorites={favorites} loading={favoritesLoading} />;
            case 'settings':
                return <ProfileSettingsForm />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
            <MarketplaceHeader />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Welcome, {currentCustomer?.full_name}!</h1>
                
                <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 mb-6">
                    <TabButton tabName="appointments" label="My Appointments" icon={CalendarIcon} />
                    <TabButton tabName="favorites" label="My Favorites" icon={HeartIcon} />
                    <TabButton tabName="settings" label="Profile Settings" icon={Cog6ToothIcon} />
                </div>
                
                <div>{renderContent()}</div>

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

// --- Appointments Content Component ---
interface AppointmentsContentProps {
    bookings: Booking[];
    loading: boolean;
    onCancel: (id: string) => void;
    onReview: (booking: Booking) => void;
}

const AppointmentsContent: React.FC<AppointmentsContentProps> = ({ bookings, loading, onCancel, onReview }) => {
    const upcomingBookings = bookings.filter(b => new Date(b.start_at) >= new Date() && b.status === 'confirmed');
    const pastBookings = bookings.filter(b => new Date(b.start_at) < new Date() || b.status !== 'confirmed');

    return (
        <div className="space-y-12">
            <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Upcoming</h2>
                {loading ? <p>Loading...</p> : upcomingBookings.length > 0 ? (
                    <div className="space-y-4">{upcomingBookings.map(b => <BookingCard key={b.id} booking={b} isUpcoming={true} onCancel={onCancel} onReview={onReview} />)}</div>
                ) : <p className="text-gray-500 dark:text-gray-400">You have no upcoming appointments.</p>}
            </div>
            
            <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">History</h2>
                {loading ? <p>Loading...</p> : pastBookings.length > 0 ? (
                    <div className="space-y-4">{pastBookings.map(b => <BookingCard key={b.id} booking={b} isUpcoming={false} onCancel={onCancel} onReview={onReview} />)}</div>
                ) : <p className="text-gray-500 dark:text-gray-400">You have no past appointments.</p>}
            </div>
        </div>
    );
};


// --- Booking Card Component ---
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

const BookingCard: React.FC<{ booking: Booking; isUpcoming: boolean; onCancel: (id: string) => void; onReview: (booking: Booking) => void; }> = ({ booking, isUpcoming, onCancel, onReview }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-start">
        <div>
            <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{booking.service.name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">with {booking.staff.full_name} at {booking.business?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">{formatDate(booking.start_at)} at {formatTime(booking.start_at)}</p>
            <p className={`mt-2 text-sm font-semibold capitalize ${booking.status === 'confirmed' ? 'text-green-600' : 'text-gray-500'}`}>{booking.status}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:items-end gap-2 self-stretch sm:self-center">
            {isUpcoming && <button onClick={() => onCancel(booking.id)} className="px-3 py-1 text-sm text-red-600 dark:text-red-400 border border-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/50">Cancel Booking</button>}
            {!isUpcoming && booking.business && (
                 <Link to={`/business/${booking.business.id}`} state={{ serviceToBookId: booking.service.id, staffToBookId: booking.staff.id }} className="px-3 py-1 text-sm text-indigo-600 dark:text-indigo-400 border border-indigo-500 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-center">Book Again</Link>
            )}
            {booking.status === 'completed' && !booking.review_submitted && <button onClick={() => onReview(booking)} className="px-3 py-1 text-sm text-yellow-600 dark:text-yellow-400 border border-yellow-500 rounded-md hover:bg-yellow-50 dark:hover:bg-yellow-900/50">Leave a Review</button>}
            {booking.status === 'completed' && booking.review_submitted && <span className="text-xs text-gray-400">Review submitted</span>}
        </div>
    </div>
);


// --- Favorites Content Component ---
interface FavoritesContentProps {
    favorites: PublicBusinessProfile[];
    loading: boolean;
}
const FavoritesContent: React.FC<FavoritesContentProps> = ({ favorites, loading }) => {
    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Favorite Businesses</h2>
            {loading ? <p>Loading...</p> : favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {favorites.map(b => <BusinessCard key={b.id} business={b} />)}
                </div>
            ) : <p className="text-gray-500 dark:text-gray-400">You haven't favorited any businesses yet. Click the heart icon on a business's page to add them here!</p>}
        </div>
    );
};

export default CustomerDashboardPage;