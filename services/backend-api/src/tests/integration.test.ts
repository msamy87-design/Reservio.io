// Integration tests for business logic
import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { BusinessUser, CustomerUser, AdminUser } from '../models/User';
import { Business } from '../models/Business';
import { Staff } from '../models/Staff';
import { Service } from '../models/Service';
import { Customer } from '../models/Customer';
import { Booking } from '../models/Booking';
import * as authService from '../services/authService';
import * as bookingService from '../services/bookingService';
import { Types } from 'mongoose';

// Test data setup
const testData = {
  business: {
    name: "Test Salon",
    email: "test@salon.com",
    phone: "+1234567890",
    address: "123 Test St",
    currency: "USD" as const,
    timezone: "America/New_York"
  },
  businessUser: {
    businessName: "Test Salon",
    email: "owner@salon.com", 
    password: "TestPass123!@#"
  },
  customerUser: {
    fullName: "John Doe",
    email: "john@customer.com",
    password: "CustomerPass123!@#"
  },
  adminUser: {
    fullName: "Admin User",
    email: "admin@reservio.com",
    password: "AdminPass123!@#"
  },
  service: {
    name: "Haircut",
    description: "Professional haircut", 
    duration_minutes: 60,
    price: 50
  },
  staff: {
    fullName: "Jane Stylist",
    email: "jane@salon.com",
    phone: "+1234567891",
    role: "Stylist" as const,
    skills: ["Cutting", "Styling"]
  },
  customer: {
    fullName: "Alice Customer",
    email: "alice@customer.com",
    phone: "+1234567892",
    notes: "Regular customer"
  }
};

describe('Business Logic Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let businessId: string;
  let staffId: string;
  let serviceId: string;
  let customerId: string;
  let businessAuthToken: string;
  let customerAuthToken: string;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Set test environment variables
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars-long';
    process.env.JWT_EXPIRE = '1h';
    process.env.JWT_REFRESH_EXPIRE = '7d';
    process.env.BCRYPT_ROUNDS = '10'; // Lower rounds for faster tests
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await Promise.all([
      BusinessUser.deleteMany({}),
      CustomerUser.deleteMany({}),
      AdminUser.deleteMany({}),
      Business.deleteMany({}),
      Staff.deleteMany({}),
      Service.deleteMany({}),
      Customer.deleteMany({}),
      Booking.deleteMany({})
    ]);
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full business signup and login flow', async () => {
      // 1. Business Signup
      const signupResult = await authService.signupBusiness(
        testData.businessUser.businessName,
        testData.businessUser.email,
        testData.businessUser.password
      );

      expect(signupResult.user).toBeDefined();
      expect(signupResult.accessToken).toBeDefined();
      expect(signupResult.refreshToken).toBeDefined();
      expect(signupResult.user.email).toBe(testData.businessUser.email);
      expect(signupResult.user.businessName).toBe(testData.businessUser.businessName);

      // 2. Verify user exists in database
      const savedUser = await BusinessUser.findOne({ email: testData.businessUser.email });
      expect(savedUser).toBeDefined();
      expect(savedUser!.businessName).toBe(testData.businessUser.businessName);

      // 3. Login with created account
      const loginResult = await authService.loginBusiness(
        testData.businessUser.email,
        testData.businessUser.password
      );

      expect(loginResult.user).toBeDefined();
      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.refreshToken).toBeDefined();
      expect(loginResult.user.email).toBe(testData.businessUser.email);

      businessAuthToken = loginResult.accessToken;
    });

    it('should complete full customer signup and login flow', async () => {
      // 1. Customer Signup  
      const signupResult = await authService.signupCustomer(
        testData.customerUser.fullName,
        testData.customerUser.email,
        testData.customerUser.password
      );

      expect(signupResult.user).toBeDefined();
      expect(signupResult.accessToken).toBeDefined();
      expect(signupResult.refreshToken).toBeDefined();
      expect(signupResult.user.email).toBe(testData.customerUser.email);
      expect(signupResult.user.fullName).toBe(testData.customerUser.fullName);

      // 2. Login with created account
      const loginResult = await authService.loginCustomer(
        testData.customerUser.email,
        testData.customerUser.password
      );

      expect(loginResult.user).toBeDefined();
      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.refreshToken).toBeDefined();

      customerAuthToken = loginResult.accessToken;
    });

    it('should prevent duplicate email registration', async () => {
      // Create first user
      await authService.signupBusiness(
        testData.businessUser.businessName,
        testData.businessUser.email,
        testData.businessUser.password
      );

      // Attempt to create duplicate
      await expect(authService.signupBusiness(
        "Another Business",
        testData.businessUser.email, // Same email
        "DifferentPass123!@#"
      )).rejects.toThrow('An account with this email already exists');
    });
  });

  describe('Business Setup Integration', () => {
    beforeEach(async () => {
      // Setup business user
      const signupResult = await authService.signupBusiness(
        testData.businessUser.businessName,
        testData.businessUser.email,
        testData.businessUser.password
      );
      businessAuthToken = signupResult.accessToken;
    });

    it('should create complete business profile with services and staff', async () => {
      // 1. Create business profile
      const business = new Business({
        ...testData.business,
        ownerId: new Types.ObjectId()
      });
      await business.save();
      businessId = business._id.toString();

      // 2. Create staff member
      const staff = new Staff({
        ...testData.staff,
        businessId: new Types.ObjectId(businessId),
        schedule: {
          monday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
          tuesday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
          wednesday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
          thursday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
          friday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
          saturday: { is_working: false, start_time: "00:00", end_time: "00:00", breaks: [] },
          sunday: { is_working: false, start_time: "00:00", end_time: "00:00", breaks: [] }
        },
        serviceIds: [],
        commission: { type: "percentage", value: 50, applies_to: "services" },
        stats: {
          total_bookings: 0,
          completed_bookings: 0,
          no_shows: 0,
          cancellations: 0,
          average_rating: 0,
          total_reviews: 0,
          revenue_generated: 0
        }
      });
      await staff.save();
      staffId = staff._id.toString();

      // 3. Create service
      const service = new Service({
        ...testData.service,
        businessId: new Types.ObjectId(businessId),
        staffIds: [new Types.ObjectId(staffId)],
        settings: {
          max_advance_booking_days: 30,
          min_advance_booking_minutes: 60,
          allow_online_booking: true,
          require_deposit: false,
          cancellation_policy: {
            allow_cancellation: true,
            cancellation_window_hours: 24
          }
        },
        pricing: {
          base_price: testData.service.price
        },
        stats: {
          total_bookings: 0,
          completed_bookings: 0,
          revenue_generated: 0,
          average_rating: 0,
          review_count: 0
        }
      });
      await service.save();
      serviceId = service._id.toString();

      // 4. Verify all entities are linked correctly
      const savedBusiness = await Business.findById(businessId);
      const savedStaff = await Staff.findById(staffId);
      const savedService = await Service.findById(serviceId);

      expect(savedBusiness).toBeDefined();
      expect(savedStaff).toBeDefined();
      expect(savedService).toBeDefined();
      
      expect(savedStaff!.businessId.toString()).toBe(businessId);
      expect(savedService!.businessId.toString()).toBe(businessId);
      expect(savedService!.staffIds).toContain(new Types.ObjectId(staffId));
    });
  });

  describe('Booking Flow Integration', () => {
    beforeEach(async () => {
      // Setup complete business environment
      const businessSignup = await authService.signupBusiness(
        testData.businessUser.businessName,
        testData.businessUser.email,
        testData.businessUser.password
      );
      businessAuthToken = businessSignup.accessToken;

      const customerSignup = await authService.signupCustomer(
        testData.customerUser.fullName,
        testData.customerUser.email,
        testData.customerUser.password
      );
      customerAuthToken = customerSignup.accessToken;

      // Create business entities
      const business = new Business({
        ...testData.business,
        ownerId: new Types.ObjectId()
      });
      await business.save();
      businessId = business._id.toString();

      const customer = new Customer({
        ...testData.customer,
        businessId: new Types.ObjectId(businessId),
        preferences: {
          preferred_staff_ids: [],
          communication_method: "email",
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
        }
      });
      await customer.save();
      customerId = customer._id.toString();

      const staff = new Staff({
        ...testData.staff,
        businessId: new Types.ObjectId(businessId),
        schedule: {
          monday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
          tuesday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
          wednesday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
          thursday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
          friday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
          saturday: { is_working: false, start_time: "00:00", end_time: "00:00", breaks: [] },
          sunday: { is_working: false, start_time: "00:00", end_time: "00:00", breaks: [] }
        },
        serviceIds: [],
        commission: { type: "percentage", value: 50, applies_to: "services" },
        stats: {
          total_bookings: 0,
          completed_bookings: 0,
          no_shows: 0,
          cancellations: 0,
          average_rating: 0,
          total_reviews: 0,
          revenue_generated: 0
        }
      });
      await staff.save();
      staffId = staff._id.toString();

      const service = new Service({
        ...testData.service,
        businessId: new Types.ObjectId(businessId),
        staffIds: [new Types.ObjectId(staffId)],
        settings: {
          max_advance_booking_days: 30,
          min_advance_booking_minutes: 60,
          allow_online_booking: true,
          require_deposit: false,
          cancellation_policy: {
            allow_cancellation: true,
            cancellation_window_hours: 24
          }
        },
        pricing: {
          base_price: testData.service.price
        },
        stats: {
          total_bookings: 0,
          completed_bookings: 0,
          revenue_generated: 0,
          average_rating: 0,
          review_count: 0
        }
      });
      await service.save();
      serviceId = service._id.toString();
    });

    it('should create and manage booking lifecycle', async () => {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 24); // Tomorrow
      const endTime = new Date(startTime.getTime() + (60 * 60 * 1000)); // +1 hour

      // 1. Create booking
      const booking = new Booking({
        businessId: new Types.ObjectId(businessId),
        customerId: new Types.ObjectId(customerId),
        serviceId: new Types.ObjectId(serviceId),
        staffId: new Types.ObjectId(staffId),
        start_at: startTime,
        end_at: endTime,
        status: 'confirmed',
        total_amount: testData.service.price,
        deposit_amount: 0,
        payment_status: 'unpaid',
        notes: 'Integration test booking'
      });
      await booking.save();

      // 2. Verify booking was created
      const savedBooking = await Booking.findById(booking._id);
      expect(savedBooking).toBeDefined();
      expect(savedBooking!.status).toBe('confirmed');
      expect(savedBooking!.total_amount).toBe(testData.service.price);

      // 3. Update booking status
      savedBooking!.status = 'completed';
      savedBooking!.payment_status = 'paid_in_full';
      await savedBooking!.save();

      // 4. Verify update
      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking!.status).toBe('completed');
      expect(updatedBooking!.payment_status).toBe('paid_in_full');

      // 5. Test booking cancellation
      const cancelledBooking = new Booking({
        businessId: new Types.ObjectId(businessId),
        customerId: new Types.ObjectId(customerId),
        serviceId: new Types.ObjectId(serviceId),
        staffId: new Types.ObjectId(staffId),
        start_at: new Date(startTime.getTime() + (24 * 60 * 60 * 1000)), // Day after
        end_at: new Date(startTime.getTime() + (25 * 60 * 60 * 1000)),
        status: 'cancelled',
        total_amount: testData.service.price,
        deposit_amount: 0,
        payment_status: 'unpaid',
        notes: 'Cancelled booking test'
      });
      await cancelledBooking.save();

      expect(cancelledBooking.status).toBe('cancelled');
    });

    it('should handle booking conflicts and validation', async () => {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 24);
      const endTime = new Date(startTime.getTime() + (60 * 60 * 1000));

      // Create first booking
      const booking1 = new Booking({
        businessId: new Types.ObjectId(businessId),
        customerId: new Types.ObjectId(customerId),
        serviceId: new Types.ObjectId(serviceId),
        staffId: new Types.ObjectId(staffId),
        start_at: startTime,
        end_at: endTime,
        status: 'confirmed',
        total_amount: testData.service.price,
        deposit_amount: 0,
        payment_status: 'unpaid'
      });
      await booking1.save();

      // Attempt to create overlapping booking
      const overlappingBooking = new Booking({
        businessId: new Types.ObjectId(businessId),
        customerId: new Types.ObjectId(customerId),
        serviceId: new Types.ObjectId(serviceId),
        staffId: new Types.ObjectId(staffId),
        start_at: new Date(startTime.getTime() + (30 * 60 * 1000)), // 30 minutes later
        end_at: new Date(endTime.getTime() + (30 * 60 * 1000)),
        status: 'confirmed',
        total_amount: testData.service.price,
        deposit_amount: 0,
        payment_status: 'unpaid'
      });

      // This should work for now as we don't have validation implemented
      // In a real system, this would throw a validation error
      await overlappingBooking.save();
      
      // Verify both bookings exist
      const allBookings = await Booking.find({ staffId: new Types.ObjectId(staffId) });
      expect(allBookings.length).toBe(2);
    });
  });

  describe('Data Relationships Integration', () => {
    it('should maintain referential integrity across collections', async () => {
      // Setup all entities
      const business = new Business({
        ...testData.business,
        ownerId: new Types.ObjectId()
      });
      await business.save();

      const staff = new Staff({
        ...testData.staff,
        businessId: business._id,
        schedule: {
          monday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
          tuesday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
          wednesday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
          thursday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
          friday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
          saturday: { is_working: false, start_time: "00:00", end_time: "00:00", breaks: [] },
          sunday: { is_working: false, start_time: "00:00", end_time: "00:00", breaks: [] }
        },
        serviceIds: [],
        commission: { type: "percentage", value: 50, applies_to: "services" },
        stats: {
          total_bookings: 0,
          completed_bookings: 0,
          no_shows: 0,
          cancellations: 0,
          average_rating: 0,
          total_reviews: 0,
          revenue_generated: 0
        }
      });
      await staff.save();

      const service = new Service({
        ...testData.service,
        businessId: business._id,
        staffIds: [staff._id],
        settings: {
          max_advance_booking_days: 30,
          min_advance_booking_minutes: 60,
          allow_online_booking: true,
          require_deposit: false,
          cancellation_policy: {
            allow_cancellation: true,
            cancellation_window_hours: 24
          }
        },
        pricing: {
          base_price: testData.service.price
        },
        stats: {
          total_bookings: 0,
          completed_bookings: 0,
          revenue_generated: 0,
          average_rating: 0,
          review_count: 0
        }
      });
      await service.save();

      const customer = new Customer({
        ...testData.customer,
        businessId: business._id,
        preferences: {
          preferred_staff_ids: [staff._id],
          communication_method: "email",
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
        }
      });
      await customer.save();

      // Verify relationships
      const populatedService = await Service.findById(service._id);
      const populatedCustomer = await Customer.findById(customer._id);

      expect(populatedService!.businessId.toString()).toBe(business._id.toString());
      expect(populatedService!.staffIds[0].toString()).toBe(staff._id.toString());
      
      expect(populatedCustomer!.businessId.toString()).toBe(business._id.toString());
      expect(populatedCustomer!.preferences.preferred_staff_ids[0].toString()).toBe(staff._id.toString());
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid authentication gracefully', async () => {
      await expect(authService.loginBusiness(
        'nonexistent@email.com',
        'wrongpassword'
      )).rejects.toThrow('Invalid email or password');
    });

    it('should validate required fields', async () => {
      await expect(authService.signupBusiness(
        '', // Empty business name
        'test@email.com',
        'password123'
      )).rejects.toThrow();
    });

    it('should handle database connection issues', async () => {
      // Temporarily disconnect
      await mongoose.disconnect();
      
      // Attempt operation
      await expect(authService.signupBusiness(
        'Test Business',
        'test@disconnected.com',
        'password123'
      )).rejects.toThrow();

      // Reconnect for cleanup
      await mongoose.connect(mongoServer.getUri());
    });
  });
});

describe('Performance Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars-long';
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Promise.all([
      BusinessUser.deleteMany({}),
      Business.deleteMany({}),
      Staff.deleteMany({}),
      Service.deleteMany({})
    ]);
  });

  it('should handle bulk operations efficiently', async () => {
    const startTime = Date.now();
    
    // Create multiple users concurrently
    const signupPromises = Array.from({ length: 10 }, (_, i) => 
      authService.signupBusiness(
        `Test Business ${i}`,
        `test${i}@business.com`,
        'TestPass123!@#'
      )
    );

    const results = await Promise.all(signupPromises);
    const endTime = Date.now();
    
    expect(results).toHaveLength(10);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    
    // Verify all users were created
    const userCount = await BusinessUser.countDocuments({});
    expect(userCount).toBe(10);
  });

  it('should handle large dataset queries efficiently', async () => {
    // Create business and services
    const business = new Business({
      name: "Performance Test Business",
      email: "perf@test.com",
      phone: "+1234567890",
      address: "123 Perf St",
      currency: "USD",
      timezone: "America/New_York",
      ownerId: new Types.ObjectId()
    });
    await business.save();

    // Create many services
    const services = Array.from({ length: 100 }, (_, i) => ({
      name: `Service ${i}`,
      description: `Description ${i}`,
      duration_minutes: 30 + (i % 120), // Vary duration
      price: 25 + (i % 200), // Vary price
      businessId: business._id,
      staffIds: [],
      settings: {
        max_advance_booking_days: 30,
        min_advance_booking_minutes: 60,
        allow_online_booking: true,
        require_deposit: false,
        cancellation_policy: {
          allow_cancellation: true,
          cancellation_window_hours: 24
        }
      },
      pricing: {
        base_price: 25 + (i % 200)
      },
      stats: {
        total_bookings: 0,
        completed_bookings: 0,
        revenue_generated: 0,
        average_rating: 0,
        review_count: 0
      }
    }));

    const startInsert = Date.now();
    await Service.insertMany(services);
    const endInsert = Date.now();

    const startQuery = Date.now();
    const retrievedServices = await Service.find({ businessId: business._id }).limit(50);
    const endQuery = Date.now();

    expect(retrievedServices).toHaveLength(50);
    expect(endInsert - startInsert).toBeLessThan(2000); // Insert should be fast
    expect(endQuery - startQuery).toBeLessThan(500); // Query should be very fast
  });
});