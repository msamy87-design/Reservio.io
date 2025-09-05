
import { NewPublicBookingData, Booking, BookingStatus } from '../types/booking';
import * as dateFns from 'date-fns';
import { getNoShowRiskScore, findAndNotifyWaitlistMatches } from './aiService';
import { Business, IBusiness } from '../models/Business';
import { Service, IService } from '../models/Service';
import { Staff, IStaff } from '../models/Staff';
import { Booking as BookingModel, IBooking } from '../models/Booking';
import { Customer, ICustomer } from '../models/Customer';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const createPublicBooking = async (data: NewPublicBookingData): Promise<Booking> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(data.businessId) ||
            !mongoose.Types.ObjectId.isValid(data.serviceId) ||
            !mongoose.Types.ObjectId.isValid(data.staffId)) {
            throw new Error('Invalid business, service, or staff ID');
        }

        // Validate start time is in the future
        const startTime = new Date(data.startTime);
        if (startTime <= new Date()) {
            throw new Error('Booking start time must be in the future');
        }

        // Get business, service, and staff details
        const [business, service, staff] = await Promise.all([
            Business.findOne({ _id: data.businessId, isActive: true }).session(session),
            Service.findOne({ _id: data.serviceId, businessId: data.businessId, isActive: true }).session(session),
            Staff.findOne({ _id: data.staffId, businessId: data.businessId, isActive: true, serviceIds: data.serviceId }).session(session)
        ]);

        if (!business || !service || !staff) {
            throw new Error('Business, service, or staff not found or not available');
        }

        const endTime = dateFns.addMinutes(startTime, service.duration_minutes);

        // Check for booking conflicts
        const conflicts = await BookingModel.find({
            staffId: data.staffId,
            status: { $nin: ['cancelled', 'no_show'] },
            $or: [
                {
                    startAt: { $lt: endTime },
                    endAt: { $gt: startTime }
                }
            ]
        }).session(session);

        if (conflicts.length > 0) {
            throw new Error('Time slot is not available');
        }

        // Find or create customer
        let customer = await Customer.findOne({
            businessId: data.businessId,
            email: data.customer.email.toLowerCase()
        }).session(session);

        if (!customer) {
            customer = new Customer({
                businessId: data.businessId,
                fullName: data.customer.full_name,
                email: data.customer.email.toLowerCase(),
                phone: data.customer.phone || '',
                notes: 'New customer from online booking',
                preferences: {
                    preferred_staff_ids: [],
                    communication_method: 'email',
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
                risk_score: 50,
                tags: ['new-customer'],
                isActive: true
            });
            await customer.save({ session });
        }

        // Calculate pricing
        const servicePrice = service.price;
        const taxRate = 0.08; // 8% tax - should come from business settings
        const taxAmount = servicePrice * taxRate;
        const totalAmount = servicePrice + taxAmount;
        
        // Determine deposit amount if required
        let depositAmount = 0;
        if (service.settings.require_deposit && service.settings.deposit_amount) {
            depositAmount = service.settings.deposit_amount;
        } else if (business.payment_settings.deposit_type === 'fixed') {
            depositAmount = business.payment_settings.deposit_value;
        } else if (business.payment_settings.deposit_type === 'percentage') {
            depositAmount = servicePrice * (business.payment_settings.deposit_value / 100);
        }

        // Get risk assessment
        const riskScore = await getNoShowRiskScore({
            serviceId: data.serviceId,
            staffId: data.staffId,
            startTime: data.startTime,
            customer: {
                full_name: customer.fullName,
                email: customer.email,
            },
        });

        // Create booking
        const newBookingDoc = new BookingModel({
            businessId: data.businessId,
            customerId: customer._id,
            serviceId: data.serviceId,
            staffId: data.staffId,
            startAt: startTime,
            endAt: endTime,
            duration_minutes: service.duration_minutes,
            status: 'confirmed',
            pricing: {
                service_price: servicePrice,
                add_ons_price: 0,
                discount_amount: 0,
                tax_amount: taxAmount,
                deposit_amount: depositAmount,
                total_amount: totalAmount,
                currency: business.currency
            },
            payment: {
                status: data.paymentIntentId ? 'deposit_paid' : 'unpaid',
                stripe_payment_intent_id: data.paymentIntentId,
                paid_amount: data.paymentIntentId ? depositAmount : 0,
                refunded_amount: 0
            },
            addOns: [],
            risk_assessment: {
                score: riskScore,
                factors: riskScore > 70 ? ['new-customer', 'high-value-service'] : [],
                flagged: riskScore > 70
            },
            communications: [],
            review_submitted: false,
            booking_source: 'online'
        });

        await newBookingDoc.save({ session });

        // Update customer stats
        await Customer.updateOne(
            { _id: customer._id },
            { 
                $inc: { 'stats.total_bookings': 1 },
                $set: { 'stats.last_booking_date': new Date() }
            },
            { session }
        );

        // Update service stats
        await Service.updateOne(
            { _id: data.serviceId },
            { 
                $inc: { 'stats.total_bookings': 1, 'stats.total_revenue': totalAmount }
            },
            { session }
        );

        // Update staff stats
        await Staff.updateOne(
            { _id: data.staffId },
            { 
                $inc: { 'stats.total_bookings': 1, 'stats.total_revenue': totalAmount }
            },
            { session }
        );

        // Update business stats
        await Business.updateOne(
            { _id: data.businessId },
            { 
                $inc: { 'stats.total_bookings': 1, 'stats.total_revenue': totalAmount }
            },
            { session }
        );

        await session.commitTransaction();
        
        // Return the booking in the expected format
        const booking: Booking = {
            id: newBookingDoc._id.toString(),
            start_at: newBookingDoc.startAt.toISOString(),
            end_at: newBookingDoc.endAt.toISOString(),
            status: newBookingDoc.status,
            customer: { 
                id: customer._id.toString(), 
                full_name: customer.fullName 
            },
            service: { 
                id: service._id.toString(), 
                name: service.name, 
                duration_minutes: service.duration_minutes 
            },
            staff: { 
                id: staff._id.toString(), 
                full_name: staff.fullName 
            },
            business: { 
                id: business._id.toString(), 
                name: business.name 
            },
            payment_status: newBookingDoc.payment.status as 'unpaid' | 'deposit_paid' | 'paid_in_full',
            payment_intent_id: newBookingDoc.payment.stripe_payment_intent_id || null,
            noShowRiskScore: newBookingDoc.risk_assessment.score,
            review_submitted: newBookingDoc.review_submitted
        };

        logger.info('Booking created successfully', {
            bookingId: booking.id,
            customerId: customer._id,
            businessId: data.businessId
        });

        return booking;
    } catch (error) {
        await session.abortTransaction();
        logger.error('Error creating booking:', error);
        throw error;
    } finally {
        session.endSession();
    }
};

export const cancelBooking = async (bookingId: string, customerId: string): Promise<Booking> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (!mongoose.Types.ObjectId.isValid(bookingId) || !mongoose.Types.ObjectId.isValid(customerId)) {
            throw new Error('Invalid booking or customer ID');
        }

        // Find the booking
        const bookingDoc = await BookingModel.findOne({
            _id: bookingId,
            customerId: customerId,
            status: { $nin: ['cancelled', 'completed'] }
        })
        .populate('businessId', 'name')
        .populate('serviceId', 'name duration_minutes')
        .populate('staffId', 'fullName')
        .populate('customerId', 'fullName')
        .session(session);

        if (!bookingDoc) {
            throw new Error('Booking not found or cannot be cancelled');
        }

        // Check cancellation policy
        const service = await Service.findById(bookingDoc.serviceId).session(session);
        if (service?.settings.cancellation_policy.allow_cancellation === false) {
            throw new Error('This booking cannot be cancelled');
        }

        const hoursUntilBooking = dateFns.differenceInHours(bookingDoc.startAt, new Date());
        const cancellationWindowHours = service?.settings.cancellation_policy.cancellation_window_hours || 24;
        
        let cancellationFee = 0;
        if (hoursUntilBooking < cancellationWindowHours) {
            cancellationFee = service?.settings.cancellation_policy.cancellation_fee || 0;
        }

        // Calculate refund amount
        const refundAmount = Math.max(0, bookingDoc.payment.paid_amount - cancellationFee);

        // Update booking
        bookingDoc.status = 'cancelled';
        bookingDoc.cancellation = {
            cancelled_at: new Date(),
            cancelled_by: 'customer',
            reason: 'Customer cancellation',
            fee_charged: cancellationFee,
            refund_amount: refundAmount
        };

        if (refundAmount < bookingDoc.payment.paid_amount) {
            bookingDoc.payment.status = 'partially_refunded';
            bookingDoc.payment.refunded_amount = refundAmount;
        } else if (refundAmount > 0) {
            bookingDoc.payment.status = 'refunded';
            bookingDoc.payment.refunded_amount = refundAmount;
        }

        await bookingDoc.save({ session });

        // Update customer stats
        await Customer.updateOne(
            { _id: customerId },
            { $inc: { 'stats.cancellations': 1 } },
            { session }
        );

        // Update staff stats
        await Staff.updateOne(
            { _id: bookingDoc.staffId },
            { $inc: { 'stats.cancellations': 1 } },
            { session }
        );

        await session.commitTransaction();

        // Trigger waitlist matching (non-blocking)
        const booking: Booking = {
            id: bookingDoc._id.toString(),
            start_at: bookingDoc.startAt.toISOString(),
            end_at: bookingDoc.endAt.toISOString(),
            status: bookingDoc.status,
            customer: { 
                id: (bookingDoc.customerId as any)._id.toString(), 
                full_name: (bookingDoc.customerId as any).fullName 
            },
            service: { 
                id: (bookingDoc.serviceId as any)._id.toString(), 
                name: (bookingDoc.serviceId as any).name, 
                duration_minutes: (bookingDoc.serviceId as any).duration_minutes 
            },
            staff: { 
                id: (bookingDoc.staffId as any)._id.toString(), 
                full_name: (bookingDoc.staffId as any).fullName 
            },
            business: { 
                id: (bookingDoc.businessId as any)._id.toString(), 
                name: (bookingDoc.businessId as any).name 
            },
            payment_status: bookingDoc.payment.status as 'unpaid' | 'deposit_paid' | 'paid_in_full',
            payment_intent_id: bookingDoc.payment.stripe_payment_intent_id || null,
            noShowRiskScore: bookingDoc.risk_assessment.score,
            review_submitted: bookingDoc.review_submitted
        };

        // Trigger waitlist matching (non-blocking)
        setImmediate(() => {
            findAndNotifyWaitlistMatches(booking).catch(error => {
                logger.error('Error processing waitlist after cancellation:', error);
            });
        });

        logger.info('Booking cancelled successfully', {
            bookingId: booking.id,
            customerId,
            refundAmount,
            cancellationFee
        });

        return booking;
    } catch (error) {
        await session.abortTransaction();
        logger.error('Error cancelling booking:', error);
        throw error;
    } finally {
        session.endSession();
    }
};
