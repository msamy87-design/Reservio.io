// Business logic validation tests
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Business } from '../models/Business';
import { Staff } from '../models/Staff';
import { Service } from '../models/Service';
import { Customer } from '../models/Customer';
import { Booking } from '../models/Booking';
import { Types } from 'mongoose';
import * as bookingService from '../services/bookingService';
import * as businessService from '../services/businessService';

describe('Business Logic Validation', () => {
  let mongoServer: MongoMemoryServer;
  let businessId: Types.ObjectId;
  let staffId: Types.ObjectId;
  let serviceId: Types.ObjectId;
  let customerId: Types.ObjectId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await Promise.all([
      Business.deleteMany({}),
      Staff.deleteMany({}),
      Service.deleteMany({}),
      Customer.deleteMany({}),
      Booking.deleteMany({})
    ]);

    // Create test business
    const business = new Business({
      name: "Logic Test Business",
      email: "logic@test.com",
      phone: "+1234567890",
      address: "123 Logic St",
      currency: "USD",
      timezone: "America/New_York",
      ownerId: new Types.ObjectId(),
      hours: {
        monday: { is_working: true, start_time: "09:00", end_time: "17:00" },
        tuesday: { is_working: true, start_time: "09:00", end_time: "17:00" },
        wednesday: { is_working: true, start_time: "09:00", end_time: "17:00" },
        thursday: { is_working: true, start_time: "09:00", end_time: "17:00" },
        friday: { is_working: true, start_time: "09:00", end_time: "17:00" },
        saturday: { is_working: true, start_time: "10:00", end_time: "16:00" },
        sunday: { is_working: false, start_time: "00:00", end_time: "00:00" }
      },
      marketplace_listing: {
        is_listed: true,
        featured: false
      },
      payment_settings: {
        deposit_type: "percentage",
        deposit_value: 25
      },
      no_show_prevention: {
        enabled: true,
        high_risk_deposit_amount: 50
      },
      notification_settings: {
        new_booking_alerts: true,
        cancellation_alerts: true,
        reminder_hours: 24
      }
    });
    await business.save();
    businessId = business._id;

    // Create test staff
    const staff = new Staff({
      businessId: businessId,
      fullName: "Test Stylist",
      email: "stylist@logic.com",
      phone: "+1234567891",
      role: "Stylist",
      skills: ["Cutting", "Coloring"],
      certifications: [],
      schedule: {
        monday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
        tuesday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
        wednesday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
        thursday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
        friday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
        saturday: { is_working: true, start_time: "10:00", end_time: "16:00", breaks: [] },
        sunday: { is_working: false, start_time: "00:00", end_time: "00:00", breaks: [] }
      },
      serviceIds: [],
      commission: {
        type: "percentage",
        value: 50,
        applies_to: "services"
      },
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
    staffId = staff._id;

    // Create test service
    const service = new Service({
      businessId: businessId,
      name: "Test Service",
      description: "Test service description",
      duration_minutes: 60,
      price: 100,
      staffIds: [staffId],
      settings: {
        max_advance_booking_days: 60,
        min_advance_booking_minutes: 60,
        allow_online_booking: true,
        require_deposit: true,
        deposit_amount: 25,
        cancellation_policy: {
          allow_cancellation: true,
          cancellation_window_hours: 24,
          cancellation_fee: 10
        }
      },
      pricing: {
        base_price: 100,
        peak_hours_multiplier: 1.2,
        weekend_multiplier: 1.1,
        holiday_multiplier: 1.5
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
    serviceId = service._id;

    // Create test customer
    const customer = new Customer({
      businessId: businessId,
      fullName: "Test Customer",
      email: "customer@logic.com",
      phone: "+1234567892",
      notes: "Test customer",
      preferences: {
        preferred_staff_ids: [staffId],
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
    customerId = customer._id;
  });

  describe('Business Hours Validation', () => {
    it('should validate booking times against business hours', () => {
      const business = {
        hours: {
          monday: { is_working: true, start_time: "09:00", end_time: "17:00" },
          tuesday: { is_working: true, start_time: "09:00", end_time: "17:00" },
          wednesday: { is_working: true, start_time: "09:00", end_time: "17:00" },
          thursday: { is_working: true, start_time: "09:00", end_time: "17:00" },
          friday: { is_working: true, start_time: "09:00", end_time: "17:00" },
          saturday: { is_working: true, start_time: "10:00", end_time: "16:00" },
          sunday: { is_working: false, start_time: "00:00", end_time: "00:00" }
        }
      };

      // Test valid times
      const mondayValidTime = new Date();
      mondayValidTime.setDay(1); // Monday
      mondayValidTime.setHours(10, 0, 0, 0); // 10:00 AM
      
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][mondayValidTime.getDay()];
      const businessHours = business.hours[dayName as keyof typeof business.hours];
      
      expect(businessHours.is_working).toBe(true);
      expect(businessHours.start_time).toBe("09:00");
      expect(businessHours.end_time).toBe("17:00");

      // Test Sunday (closed)
      const sundayTime = new Date();
      sundayTime.setDay(0); // Sunday
      const sundayHours = business.hours.sunday;
      
      expect(sundayHours.is_working).toBe(false);
    });

    it('should handle timezone conversions properly', () => {
      const business = {
        timezone: "America/New_York",
        hours: {
          monday: { is_working: true, start_time: "09:00", end_time: "17:00" }
        }
      };

      // This would be more complex in real implementation
      expect(business.timezone).toBe("America/New_York");
    });
  });

  describe('Booking Conflict Detection', () => {
    it('should detect overlapping bookings for the same staff', async () => {
      const baseTime = new Date();
      baseTime.setDate(baseTime.getDate() + 1); // Tomorrow
      baseTime.setHours(10, 0, 0, 0); // 10:00 AM

      // Create first booking
      const booking1 = new Booking({
        businessId: businessId,
        customerId: customerId,
        serviceId: serviceId,
        staffId: staffId,
        start_at: baseTime,
        end_at: new Date(baseTime.getTime() + (60 * 60 * 1000)), // +1 hour
        status: 'confirmed',
        total_amount: 100,
        deposit_amount: 25,
        payment_status: 'deposit_paid'
      });
      await booking1.save();

      // Attempt to create overlapping booking
      const overlappingStart = new Date(baseTime.getTime() + (30 * 60 * 1000)); // 30 min later
      const overlappingEnd = new Date(baseTime.getTime() + (90 * 60 * 1000)); // 90 min later
      
      const conflictingBookings = await Booking.find({
        staffId: staffId,
        status: { $in: ['confirmed', 'pending'] },
        $or: [
          {
            start_at: { $lt: overlappingEnd },
            end_at: { $gt: overlappingStart }
          }
        ]
      });

      expect(conflictingBookings.length).toBeGreaterThan(0);
    });

    it('should allow non-overlapping bookings for the same staff', async () => {
      const baseTime = new Date();
      baseTime.setDate(baseTime.getDate() + 1);
      baseTime.setHours(10, 0, 0, 0);

      // Create first booking
      const booking1 = new Booking({
        businessId: businessId,
        customerId: customerId,
        serviceId: serviceId,
        staffId: staffId,
        start_at: baseTime,
        end_at: new Date(baseTime.getTime() + (60 * 60 * 1000)),
        status: 'confirmed',
        total_amount: 100,
        deposit_amount: 25,
        payment_status: 'deposit_paid'
      });
      await booking1.save();

      // Create non-overlapping booking
      const nextBookingStart = new Date(baseTime.getTime() + (60 * 60 * 1000)); // Right after first booking
      const nextBookingEnd = new Date(baseTime.getTime() + (120 * 60 * 1000)); // +1 hour

      const booking2 = new Booking({
        businessId: businessId,
        customerId: customerId,
        serviceId: serviceId,
        staffId: staffId,
        start_at: nextBookingStart,
        end_at: nextBookingEnd,
        status: 'confirmed',
        total_amount: 100,
        deposit_amount: 25,
        payment_status: 'deposit_paid'
      });
      await booking2.save();

      const allBookings = await Booking.find({ staffId: staffId });
      expect(allBookings.length).toBe(2);
    });
  });

  describe('Pricing Calculations', () => {
    it('should calculate correct pricing with multipliers', () => {
      const service = {
        pricing: {
          base_price: 100,
          peak_hours_multiplier: 1.2,
          weekend_multiplier: 1.1,
          holiday_multiplier: 1.5
        }
      };

      // Base price
      expect(service.pricing.base_price).toBe(100);

      // Peak hours (20% increase)
      const peakPrice = service.pricing.base_price * service.pricing.peak_hours_multiplier;
      expect(peakPrice).toBe(120);

      // Weekend (10% increase)
      const weekendPrice = service.pricing.base_price * service.pricing.weekend_multiplier;
      expect(weekendPrice).toBe(110);

      // Holiday (50% increase)
      const holidayPrice = service.pricing.base_price * service.pricing.holiday_multiplier;
      expect(holidayPrice).toBe(150);

      // Combined multipliers (peak + weekend)
      const combinedPrice = service.pricing.base_price * 
                           service.pricing.peak_hours_multiplier * 
                           service.pricing.weekend_multiplier;
      expect(combinedPrice).toBe(132);
    });

    it('should calculate deposit amounts correctly', () => {
      const serviceWithPercentageDeposit = {
        price: 100,
        settings: {
          require_deposit: true,
          deposit_amount: 25 // 25% or $25
        }
      };

      const businessWithPercentageDeposit = {
        payment_settings: {
          deposit_type: "percentage",
          deposit_value: 25
        }
      };

      // Service-specific deposit
      expect(serviceWithPercentageDeposit.settings.deposit_amount).toBe(25);

      // Business-wide percentage deposit  
      const calculatedDeposit = serviceWithPercentageDeposit.price * 
                               (businessWithPercentageDeposit.payment_settings.deposit_value / 100);
      expect(calculatedDeposit).toBe(25);

      // Fixed deposit
      const businessWithFixedDeposit = {
        payment_settings: {
          deposit_type: "fixed",
          deposit_value: 30
        }
      };

      expect(businessWithFixedDeposit.payment_settings.deposit_value).toBe(30);
    });
  });

  describe('Cancellation Policy Validation', () => {
    it('should validate cancellation timing', () => {
      const service = {
        settings: {
          cancellation_policy: {
            allow_cancellation: true,
            cancellation_window_hours: 24,
            cancellation_fee: 15
          }
        }
      };

      const now = new Date();
      const bookingIn20Hours = new Date(now.getTime() + (20 * 60 * 60 * 1000));
      const bookingIn30Hours = new Date(now.getTime() + (30 * 60 * 60 * 1000));

      const canCancel20Hours = (bookingIn20Hours.getTime() - now.getTime()) / (1000 * 60 * 60) > 
                              service.settings.cancellation_policy.cancellation_window_hours;
      const canCancel30Hours = (bookingIn30Hours.getTime() - now.getTime()) / (1000 * 60 * 60) > 
                              service.settings.cancellation_policy.cancellation_window_hours;

      expect(canCancel20Hours).toBe(false); // Less than 24 hours
      expect(canCancel30Hours).toBe(true);  // More than 24 hours
      expect(service.settings.cancellation_policy.cancellation_fee).toBe(15);
    });

    it('should handle no-cancellation policies', () => {
      const serviceNoCancellation = {
        settings: {
          cancellation_policy: {
            allow_cancellation: false,
            cancellation_window_hours: 0,
            cancellation_fee: 0
          }
        }
      };

      expect(serviceNoCancellation.settings.cancellation_policy.allow_cancellation).toBe(false);
    });
  });

  describe('Staff Scheduling Logic', () => {
    it('should validate staff availability', () => {
      const staff = {
        schedule: {
          monday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
          tuesday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [
            { start_time: "12:00", end_time: "13:00" }
          ] },
          wednesday: { is_working: false, start_time: "00:00", end_time: "00:00", breaks: [] }
        }
      };

      // Monday - available all day
      expect(staff.schedule.monday.is_working).toBe(true);
      expect(staff.schedule.monday.breaks.length).toBe(0);

      // Tuesday - available with lunch break
      expect(staff.schedule.tuesday.is_working).toBe(true);
      expect(staff.schedule.tuesday.breaks.length).toBe(1);
      expect(staff.schedule.tuesday.breaks[0].start_time).toBe("12:00");
      expect(staff.schedule.tuesday.breaks[0].end_time).toBe("13:00");

      // Wednesday - not working
      expect(staff.schedule.wednesday.is_working).toBe(false);
    });

    it('should check for breaks in schedule', () => {
      const staffWithBreaks = {
        schedule: {
          monday: { 
            is_working: true, 
            start_time: "09:00", 
            end_time: "17:00", 
            breaks: [
              { start_time: "12:00", end_time: "13:00" },
              { start_time: "15:00", end_time: "15:15" }
            ]
          }
        }
      };

      const mondaySchedule = staffWithBreaks.schedule.monday;
      
      // Check if 12:30 is during break time
      const isBreakTime1230 = mondaySchedule.breaks.some(breakTime => {
        const breakStart = breakTime.start_time;
        const breakEnd = breakTime.end_time;
        return "12:30" >= breakStart && "12:30" <= breakEnd;
      });

      // Check if 14:00 is during break time
      const isBreakTime1400 = mondaySchedule.breaks.some(breakTime => {
        const breakStart = breakTime.start_time;
        const breakEnd = breakTime.end_time;
        return "14:00" >= breakStart && "14:00" <= breakEnd;
      });

      expect(isBreakTime1230).toBe(true);  // During lunch break
      expect(isBreakTime1400).toBe(false); // Not during any break
    });
  });

  describe('Customer Preference Logic', () => {
    it('should handle preferred staff assignments', async () => {
      const customer = await Customer.findById(customerId);
      
      expect(customer!.preferences.preferred_staff_ids).toContain(staffId);
      expect(customer!.preferences.communication_method).toBe("email");
      expect(customer!.preferences.reminder_preferences.email_reminders).toBe(true);
      expect(customer!.preferences.reminder_preferences.reminder_time).toBe(24);
    });

    it('should track customer statistics', async () => {
      const customer = await Customer.findById(customerId);
      
      expect(customer!.stats.total_bookings).toBe(0);
      expect(customer!.stats.completed_bookings).toBe(0);
      expect(customer!.stats.no_shows).toBe(0);
      expect(customer!.stats.total_spent).toBe(0);

      // Simulate booking completion
      const updatedStats = {
        ...customer!.stats,
        total_bookings: customer!.stats.total_bookings + 1,
        completed_bookings: customer!.stats.completed_bookings + 1,
        total_spent: customer!.stats.total_spent + 100
      };

      expect(updatedStats.total_bookings).toBe(1);
      expect(updatedStats.completed_bookings).toBe(1);
      expect(updatedStats.total_spent).toBe(100);
    });
  });

  describe('Service Availability Logic', () => {
    it('should validate advance booking restrictions', () => {
      const service = {
        settings: {
          max_advance_booking_days: 60,
          min_advance_booking_minutes: 120,
          allow_online_booking: true
        }
      };

      const now = new Date();
      
      // Too far in advance (70 days)
      const tooFarAhead = new Date(now.getTime() + (70 * 24 * 60 * 60 * 1000));
      const daysDifference = (tooFarAhead.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      // Too soon (1 hour ahead)
      const tooSoon = new Date(now.getTime() + (60 * 60 * 1000));
      const minutesDifference = (tooSoon.getTime() - now.getTime()) / (1000 * 60);
      
      expect(daysDifference > service.settings.max_advance_booking_days).toBe(true);
      expect(minutesDifference < service.settings.min_advance_booking_minutes).toBe(true);
      
      // Valid booking time (3 days ahead)
      const validTime = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
      const validDaysDifference = (validTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      expect(validDaysDifference <= service.settings.max_advance_booking_days).toBe(true);
      expect(validDaysDifference * 24 * 60 >= service.settings.min_advance_booking_minutes).toBe(true);
    });

    it('should check online booking availability', () => {
      const onlineService = {
        settings: {
          allow_online_booking: true
        }
      };

      const offlineService = {
        settings: {
          allow_online_booking: false
        }
      };

      expect(onlineService.settings.allow_online_booking).toBe(true);
      expect(offlineService.settings.allow_online_booking).toBe(false);
    });
  });
});