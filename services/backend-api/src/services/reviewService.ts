
import { mockBookings, mockReviews, mockServices, mockStaff } from '../data/mockData';
import { Booking, BookingStatus, Review, ReviewStatus } from '../../../../types';
import { NewReviewData } from '../types/booking';

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
            return reject(new Error('A review has already been submitted for this booking.'));
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
            status: 'Pending', // All reviews start as pending
            created_at: new Date().toISOString(),
        };

        mockReviews.unshift(newReview);
        
        // This won't affect aggregates until published, but we could call it here
        // if we wanted pending reviews to count towards something.
        // updateAggregateRatings(newReview.service_id, newReview.staff_id);

        resolve(newReview);
    });
};
