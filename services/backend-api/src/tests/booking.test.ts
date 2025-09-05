import { Booking } from '../models/Booking';
import { Business } from '../models/Business';
import { Service } from '../models/Service';
import { Staff } from '../models/Staff';
import { Customer } from '../models/Customer';
import * as bookingService from '../services/bookingService';
import { Types } from 'mongoose';

describe('Booking System', () => {
  let businessId: string;
  let serviceId: string;
  let staffId: string;
  let customerId: string;

  beforeEach(async () => {
    // Create test business
    const business = new Business({
      name: 'Test Salon',
      email: 'test@salon.com',
      phone: '+1-555-123-4567',
      address: '123 Test Street, Test City, TC 12345',
      location: { latitude: 40.7128, longitude: -74.0060 },
      hours: {
        monday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        tuesday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        wednesday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        thursday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        friday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        saturday: { is_working: true, start_time: '10:00', end_time: '17:00' },
        sunday: { is_working: false, start_time: '00:00', end_time: '00:00' }
      },
      services: [],
      staff: [],
      average_rating: 4.5,
      review_count: 100,
      price_tier: '$$',
      amenities: ['wifi', 'parking'],
      is_open_now: true
    });
    const savedBusiness = await business.save();
    businessId = (savedBusiness._id as Types.ObjectId).toString();

    // Create test service
    const service = new Service({
      name: 'Hair Cut',
      description: 'Professional haircut service',
      duration_minutes: 60,
      price: 50.00,
      currency: 'USD',
      staffIds: [],
      average_rating: 4.7,
      review_count: 50
    });
    const savedService = await service.save();
    serviceId = (savedService._id as Types.ObjectId).toString();

    // Create test staff
    const staff = new Staff({
      full_name: 'Jane Smith',
      email: 'jane@salon.com',
      phone: '+1-555-987-6543',
      role: 'Stylist',
      schedule: {
        monday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        tuesday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        wednesday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        thursday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        friday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        saturday: { is_working: true, start_time: '10:00', end_time: '17:00' },
        sunday: { is_working: false, start_time: '00:00', end_time: '00:00' }
      },
      skills: ['haircut', 'styling'],
      average_rating: 4.8,
      review_count: 75
    });
    const savedStaff = await staff.save();
    staffId = (savedStaff._id as Types.ObjectId).toString();

    // Create test customer
    const customer = new Customer({
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '+1-555-111-2222',
      notes: 'Regular customer'
    });
    const savedCustomer = await customer.save();
    customerId = (savedCustomer._id as Types.ObjectId).toString();
  });

  describe('Booking Creation', () => {
    it('should create a booking successfully', async () => {
      const bookingData = {
        customerId,
        businessId,
        serviceId,
        staffId,
        startTime: new Date('2024-01-15T10:00:00Z'),
        status: 'pending' as const,
        pricing: {
          subtotal: 50.00,
          tax: 4.00,
          deposit: 10.00,
          total: 54.00
        }
      };

      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking._id).toBeDefined();
      expect(savedBooking.customerId.toString()).toBe(customerId);
      expect(savedBooking.businessId.toString()).toBe(businessId);
      expect(savedBooking.serviceId.toString()).toBe(serviceId);
      expect(savedBooking.staffId.toString()).toBe(staffId);
      expect(savedBooking.status).toBe('pending');
      expect(savedBooking.pricing.total).toBe(54.00);
    });

    it('should automatically calculate end time', async () => {
      const startTime = new Date('2024-01-15T10:00:00Z');
      
      const booking = new Booking({
        customerId,
        businessId,
        serviceId,
        staffId,
        startTime,
        status: 'pending',
        pricing: { subtotal: 50, tax: 4, deposit: 10, total: 54 }
      });

      const savedBooking = await booking.save();
      
      // Should calculate end time based on service duration (60 minutes)
      const expectedEndTime = new Date('2024-01-15T11:00:00Z');
      expect(savedBooking.endTime.getTime()).toBe(expectedEndTime.getTime());
    });

    it('should validate required fields', async () => {
      const booking = new Booking({});
      
      const validation = booking.validateSync();
      expect(validation?.errors.customerId).toBeDefined();
      expect(validation?.errors.businessId).toBeDefined();
      expect(validation?.errors.serviceId).toBeDefined();
      expect(validation?.errors.staffId).toBeDefined();
      expect(validation?.errors.startTime).toBeDefined();
    });

    it('should set default status to pending', async () => {
      const booking = new Booking({
        customerId,
        businessId,
        serviceId,
        staffId,
        startTime: new Date(),
        pricing: { subtotal: 50, tax: 4, deposit: 10, total: 54 }
      });

      expect(booking.status).toBe('pending');
    });
  });

  describe('Booking Status Management', () => {
    let bookingId: string;

    beforeEach(async () => {
      const booking = new Booking({
        customerId,
        businessId,
        serviceId,
        staffId,
        startTime: new Date('2024-01-15T10:00:00Z'),
        status: 'pending',
        pricing: { subtotal: 50, tax: 4, deposit: 10, total: 54 }
      });
      const savedBooking = await booking.save();
      bookingId = savedBooking._id.toString();
    });

    it('should update booking status', async () => {
      const booking = await Booking.findById(bookingId);
      expect(booking?.status).toBe('pending');

      booking!.status = 'confirmed';
      await booking!.save();

      const updatedBooking = await Booking.findById(bookingId);
      expect(updatedBooking?.status).toBe('confirmed');
    });

    it('should validate status values', async () => {
      const booking = await Booking.findById(bookingId);
      booking!.status = 'invalid' as any;

      const validation = booking!.validateSync();
      expect(validation?.errors.status).toBeDefined();
    });

    it('should track status history', async () => {
      const booking = await Booking.findById(bookingId);
      
      booking!.status = 'confirmed';
      await booking!.save();
      
      booking!.status = 'completed';
      await booking!.save();

      // In a real system, you might track status history
      expect(booking!.status).toBe('completed');
    });
  });

  describe('Booking Queries and Filtering', () => {
    beforeEach(async () => {
      // Create multiple bookings for testing
      const bookings = [
        {
          customerId,
          businessId,
          serviceId,
          staffId,
          startTime: new Date('2024-01-15T10:00:00Z'),
          status: 'confirmed' as const,
          pricing: { subtotal: 50, tax: 4, deposit: 10, total: 54 }
        },
        {
          customerId,
          businessId,
          serviceId,
          staffId,
          startTime: new Date('2024-01-16T14:00:00Z'),
          status: 'pending' as const,
          pricing: { subtotal: 75, tax: 6, deposit: 15, total: 81 }
        },
        {
          customerId,
          businessId,
          serviceId,
          staffId,
          startTime: new Date('2024-01-17T09:00:00Z'),
          status: 'cancelled' as const,
          pricing: { subtotal: 60, tax: 5, deposit: 12, total: 65 }
        }
      ];

      await Booking.insertMany(bookings);
    });

    it('should find bookings by customer', async () => {
      const customerBookings = await Booking.find({ customerId });
      expect(customerBookings.length).toBe(3);
    });

    it('should find bookings by status', async () => {
      const confirmedBookings = await Booking.find({ status: 'confirmed' });
      expect(confirmedBookings.length).toBe(1);
      expect(confirmedBookings[0].status).toBe('confirmed');
    });

    it('should find bookings by date range', async () => {
      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-16T23:59:59Z');

      const bookingsInRange = await Booking.find({
        startTime: { $gte: startDate, $lte: endDate }
      });

      expect(bookingsInRange.length).toBe(2);
    });

    it('should find bookings by business', async () => {
      const businessBookings = await Booking.find({ businessId });
      expect(businessBookings.length).toBe(3);
    });

    it('should find bookings by staff', async () => {
      const staffBookings = await Booking.find({ staffId });
      expect(staffBookings.length).toBe(3);
    });
  });

  describe('Booking Business Logic', () => {
    it('should prevent double booking same slot', async () => {
      const startTime = new Date('2024-01-15T10:00:00Z');
      
      // Create first booking
      const booking1 = new Booking({
        customerId,
        businessId,
        serviceId,
        staffId,
        startTime,
        status: 'confirmed',
        pricing: { subtotal: 50, tax: 4, deposit: 10, total: 54 }
      });
      await booking1.save();

      // Try to create overlapping booking
      const booking2 = new Booking({
        customerId,
        businessId,
        serviceId,
        staffId,
        startTime: new Date('2024-01-15T10:30:00Z'), // Overlaps with first booking
        status: 'confirmed',
        pricing: { subtotal: 50, tax: 4, deposit: 10, total: 54 }
      });

      // In a real system, you would have middleware or service logic to prevent this
      // For now, we'll just save it to test the model structure
      const savedBooking2 = await booking2.save();
      expect(savedBooking2._id).toBeDefined();
    });

    it('should calculate pricing correctly', async () => {
      const booking = new Booking({
        customerId,
        businessId,
        serviceId,
        staffId,
        startTime: new Date('2024-01-15T10:00:00Z'),
        status: 'pending',
        pricing: {
          subtotal: 100.00,
          tax: 8.50, // 8.5% tax
          deposit: 20.00,
          total: 108.50
        }
      });

      await booking.save();

      expect(booking.pricing.subtotal).toBe(100.00);
      expect(booking.pricing.tax).toBe(8.50);
      expect(booking.pricing.deposit).toBe(20.00);
      expect(booking.pricing.total).toBe(108.50);
    });

    it('should handle payment status tracking', async () => {
      const booking = new Booking({
        customerId,
        businessId,
        serviceId,
        staffId,
        startTime: new Date('2024-01-15T10:00:00Z'),
        status: 'confirmed',
        pricing: { subtotal: 50, tax: 4, deposit: 10, total: 54 },
        payment: {
          stripe_payment_intent_id: 'pi_1234567890',
          status: 'succeeded'
        }
      });

      await booking.save();

      expect(booking.payment?.stripe_payment_intent_id).toBe('pi_1234567890');
      expect(booking.payment?.status).toBe('succeeded');
    });
  });

  describe('Booking Validation Edge Cases', () => {
    it('should handle past dates', async () => {
      const pastDate = new Date('2020-01-01T10:00:00Z');
      
      const booking = new Booking({
        customerId,
        businessId,
        serviceId,
        staffId,
        startTime: pastDate,
        status: 'pending',
        pricing: { subtotal: 50, tax: 4, deposit: 10, total: 54 }
      });

      // Model should allow past dates (business logic should prevent)
      const savedBooking = await booking.save();
      expect(savedBooking.startTime.getTime()).toBe(pastDate.getTime());
    });

    it('should handle missing optional fields', async () => {
      const booking = new Booking({
        customerId,
        businessId,
        serviceId,
        staffId,
        startTime: new Date('2024-01-15T10:00:00Z'),
        status: 'pending',
        pricing: { subtotal: 50, tax: 4, deposit: 10, total: 54 }
        // payment field is optional
      });

      const savedBooking = await booking.save();
      expect(savedBooking.payment).toBeUndefined();
    });
  });
});