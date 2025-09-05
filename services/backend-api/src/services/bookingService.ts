
import { mockBookings, mockCustomers, mockServices, mockStaff } from '../data/mockData';
import { NewPublicBookingData, Booking, BookingStatus } from '../types/booking';
import * as dateFns from 'date-fns';
import { getNoShowRiskScore, findAndNotifyWaitlistMatches } from './aiService';

export const createPublicBooking = async (data: NewPublicBookingData): Promise<Booking> => {
    return new Promise(async (resolve, reject) => {
        try {
            const service = mockServices.find(s => s.id === data.serviceId);
            const staff = mockStaff.find(s => s.id === data.staffId);

            if (!service || !staff) {
                return reject(new Error('Invalid service or staff ID'));
            }

            // Find or create customer
            let customer = mockCustomers.find(c => c.email.toLowerCase() === data.customer.email.toLowerCase());
            if (!customer) {
                customer = {
                    id: `cust_${crypto.randomUUID()}`,
                    businessId: data.businessId,
                    fullName: data.customer.full_name,
                    email: data.customer.email,
                    phone: data.customer.phone || '',
                    notes: 'New customer from online booking.',
                    preferences: {
                        preferred_staff_ids: [],
                        communication_method: 'email' as const,
                        reminder_preferences: {
                            email_reminders: true,
                            sms_reminders: false,
                            reminder_time: 24
                        }
                    },
                    stats: {
                        total_bookings: 0,
                        completed_bookings: 0,
                        no_shows: 0,
                        cancellations: 0,
                        total_spent: 0,
                        average_rating_given: 0
                    },
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                mockCustomers.push(customer);
            }
            
            const startTime = new Date(data.startTime);
            const endTime = dateFns.addMinutes(startTime, service.duration_minutes);

            const riskScore = await getNoShowRiskScore({
                serviceId: data.serviceId,
                staffId: data.staffId,
                startTime: data.startTime,
                customer: {
                    full_name: customer.fullName,
                    email: customer.email,
                },
            });

            const newBooking: Booking = {
                id: crypto.randomUUID(),
                start_at: startTime.toISOString(),
                end_at: endTime.toISOString(),
                status: 'confirmed',
                customer: { id: customer.id, full_name: customer.fullName },
                service: { id: service.id, name: service.name, duration_minutes: service.duration_minutes },
                staff: { id: staff.id, full_name: staff.fullName },
                business: { id: data.businessId, name: 'Business Name' },
                payment_status: data.paymentIntentId ? 'deposit_paid' : 'unpaid',
                payment_intent_id: data.paymentIntentId || null,
                noShowRiskScore: riskScore,
            };
            
            mockBookings.push(newBooking);
            mockBookings.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
            
            resolve(newBooking);
        } catch(error) {
            reject(error);
        }
    });
};

export const cancelBooking = async (bookingId: string, customerId: string): Promise<Booking> => {
     return new Promise((resolve, reject) => {
        setTimeout(() => {
            const bookingIndex = mockBookings.findIndex(b => b.id === bookingId);
            if (bookingIndex === -1) {
                return reject(new Error('Booking not found'));
            }

            const booking = mockBookings[bookingIndex];
            if (booking.customer.id !== customerId) {
                return reject(new Error('Forbidden'));
            }
            
            booking.status = 'cancelled' as BookingStatus;
            mockBookings[bookingIndex] = booking;

            // Trigger waitlist matching (non-blocking)
            findAndNotifyWaitlistMatches(booking);
            
            resolve(booking);
        }, 500);
    });
}
