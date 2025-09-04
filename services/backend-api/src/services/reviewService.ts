
import { mockBookings, mockReviews, mockServices, mockStaff } from '../data/mockData';
// FIX: Correctly import shared types to resolve module errors.
import { Booking, BookingStatus, Review, ReviewStatus } from '../../../../types';
import { NewReviewData } from '../types/booking';
// FIX: Correctly import aiService to resolve module error.
import { findAndNotifyWaitlistMatches } from './aiService';

// Helper to update average ratings for services and staff
const updateAggregateRatings = (serviceId: string, staffId: string) => {
    const serviceReviews = mockReviews.filter(r => r.service_id === serviceId && r.status === 'Published');
    const staffReviews = mockReviews.filter(r => r.staff_id === staffId && r.status === 'Published');

    const serviceIndex = mockServices.findIndex(s => s.id === serviceId);
    if (serviceIndex !== -1) {
        mockServices[serviceIndex].review_count = serviceReviews.length;
        mockServices[serviceIndex].average_rating = serviceReviews.length > 0 ? serviceReviews.reduce((acc, r) => acc + r.rating, 0) / serviceReviews.length : 0;
    }

    const staffIndex = mockStaff.findIndex(s => s.id === staffId);
    if (staffIndex !== -1) {
        mockStaff[staffIndex].review_count = staffReviews.length;
        mockStaff[staffIndex].average_rating = staffReviews.length > 0 ? staffReviews.reduce((acc, r) => acc + r.rating, 0) / staffReviews.length : 0;
    }
};

export const createReview = async (data: NewReviewData, customerId: string): Promise<Review> => {
    return new Promise((resolve, reject) => {
        const booking = mockBookings.find(b => b.id === data.booking_id);

        if (!booking) {
            return reject(new Error('Booking not found.'));
        }
        if (booking.customer.id !== customerId) {
            return reject(new Error('You can only review your own bookings.'));
        }
        if (booking.status !== 'completed') {
            return reject(new Error('You can only review completed appointments.'));
        }
        if (mockReviews.some(r => r.booking_id === data.booking_id)) {
            return reject(new Error('A review for this booking has already been submitted.'));
        }

        const newReview: Review = {
            id: `rev_${crypto.randomUUID()}`,
            booking_id: data.booking_id,
            customer_id: customerId,
            customer_name: booking.customer.full_name,
            service_id: booking.service.id,
            service_name: booking.service.name,
            staff_id: booking.staff.id,
            staff_name: booking.staff.full_name,
            rating: data.rating,
            comment: data.comment,
            status: 'Pending',
            created_at: new Date().toISOString(),
        };

        mockReviews.unshift(newReview);
        resolve(newReview);
    });
};

export const getReviewsByBusiness = async (): Promise<Review[]> => {
    // In a real app, this would be filtered by businessId
    return Promise.resolve([...mockReviews]);
};

export const updateReviewStatus = async (reviewId: string, status: ReviewStatus): Promise<Review> => {
    return new Promise((resolve, reject) => {
        const index = mockReviews.findIndex(r => r.id === reviewId);
        if (index === -1) {
            return reject(new Error('Review not found'));
        }
        mockReviews[index].status = status;
        updateAggregateRatings(mockReviews[index].service_id, mockReviews[index].staff_id);
        resolve(mockReviews[index]);
    });
};

export const handleBookingCompletion = async (booking: Booking, status: BookingStatus): Promise<Booking> => {
    const index = mockBookings.findIndex(b => b.id === booking.id);
    if (index === -1) {
        throw new Error("Booking not found");
    }
    
    const originalStatus = mockBookings[index].status;
    mockBookings[index].status = status;

    if (status === 'completed' && originalStatus !== 'completed') {
       // Future logic for review requests could go here, but for now, it's user-initiated.
    }

    if (status === 'cancelled' && originalStatus !== 'cancelled') {
        // Trigger waitlist matching (non-blocking)
        findAndNotifyWaitlistMatches(mockBookings[index]);
    }
    
    return mockBookings[index];
};