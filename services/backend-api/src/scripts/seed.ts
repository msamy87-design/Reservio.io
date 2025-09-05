import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { BusinessUser, AdminUser } from '../models/User';
import { Business } from '../models/Business';
import { Staff } from '../models/Staff';
import { Service } from '../models/Service';
import { Customer } from '../models/Customer';
import { logger } from '../utils/logger';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI!);
    logger.info('Connected to MongoDB for seeding');

    // Clear existing data
    await Promise.all([
      BusinessUser.deleteMany({}),
      AdminUser.deleteMany({}),
      Business.deleteMany({}),
      Staff.deleteMany({}),
      Service.deleteMany({}),
      Customer.deleteMany({})
    ]);

    logger.info('Cleared existing data');

    // Create admin user
    const adminUser = new AdminUser({
      fullName: 'System Administrator',
      email: 'admin@reservio.com',
      password: 'Admin123!@#',
      role: 'superadmin'
    });
    await adminUser.save();
    logger.info('Created admin user');

    // Create business
    const business = new Business({
      name: 'The Grooming Lounge',
      email: 'contact@groominglounge.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main Street, New York, NY 10001',
      description: 'A premium grooming salon offering haircuts, beard trims, and styling services.',
      currency: 'USD',
      timezone: 'America/New_York',
      hours: {
        monday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        tuesday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        wednesday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        thursday: { is_working: true, start_time: '09:00', end_time: '20:00' },
        friday: { is_working: true, start_time: '09:00', end_time: '20:00' },
        saturday: { is_working: true, start_time: '08:00', end_time: '17:00' },
        sunday: { is_working: false, start_time: '10:00', end_time: '16:00' }
      },
      marketplace_listing: {
        is_listed: true,
        featured: true
      },
      verification_status: 'approved'
    });
    await business.save();
    logger.info('Created business');

    // Create business owner
    const businessOwner = new BusinessUser({
      businessName: business.name,
      email: business.email,
      password: 'Owner123!@#',
      role: 'Owner',
      staffId: 'pending' // Will be updated after staff creation
    });
    await businessOwner.save();
    logger.info('Created business owner user');

    // Create staff members
    const staff1 = new Staff({
      businessId: business._id,
      fullName: 'Marcus Johnson',
      email: 'marcus@groominglounge.com',
      phone: '+1 (555) 234-5678',
      role: 'Owner',
      bio: 'Master barber with 15 years of experience specializing in classic cuts and modern styles.',
      skills: ['Haircuts', 'Beard Trimming', 'Hot Towel Shaves', 'Hair Styling'],
      experience_years: 15,
      schedule: {
        monday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        tuesday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        wednesday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        thursday: { is_working: true, start_time: '09:00', end_time: '20:00' },
        friday: { is_working: true, start_time: '09:00', end_time: '20:00' },
        saturday: { is_working: true, start_time: '08:00', end_time: '17:00' },
        sunday: { is_working: false, start_time: '10:00', end_time: '16:00' }
      },
      commission: {
        type: 'percentage',
        value: 60,
        applies_to: 'services'
      }
    });
    await staff1.save();

    const staff2 = new Staff({
      businessId: business._id,
      fullName: 'Alex Rivera',
      email: 'alex@groominglounge.com',
      phone: '+1 (555) 345-6789',
      role: 'Stylist',
      bio: 'Creative stylist specializing in modern cuts and color treatments.',
      skills: ['Modern Haircuts', 'Hair Coloring', 'Beard Styling', 'Consultations'],
      experience_years: 8,
      schedule: {
        monday: { is_working: true, start_time: '10:00', end_time: '19:00' },
        tuesday: { is_working: true, start_time: '10:00', end_time: '19:00' },
        wednesday: { is_working: false, start_time: '10:00', end_time: '19:00' },
        thursday: { is_working: true, start_time: '10:00', end_time: '20:00' },
        friday: { is_working: true, start_time: '10:00', end_time: '20:00' },
        saturday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        sunday: { is_working: true, start_time: '11:00', end_time: '17:00' }
      },
      commission: {
        type: 'percentage',
        value: 55,
        applies_to: 'services'
      }
    });
    await staff2.save();

    // Update business owner with staff ID
    businessOwner.staffId = staff1._id.toString();
    await businessOwner.save();

    logger.info('Created staff members');

    // Create services
    const services = [
      {
        name: 'Classic Haircut',
        description: 'Traditional men\'s haircut with styling',
        duration_minutes: 45,
        price: 35,
        category: 'Haircuts',
        staffIds: [staff1._id, staff2._id]
      },
      {
        name: 'Beard Trim',
        description: 'Professional beard trimming and shaping',
        duration_minutes: 30,
        price: 25,
        category: 'Grooming',
        staffIds: [staff1._id]
      },
      {
        name: 'Hot Towel Shave',
        description: 'Luxury hot towel shave experience',
        duration_minutes: 60,
        price: 45,
        category: 'Shaving',
        staffIds: [staff1._id]
      },
      {
        name: 'Modern Style Cut',
        description: 'Contemporary styling with consultation',
        duration_minutes: 60,
        price: 50,
        category: 'Haircuts',
        staffIds: [staff2._id],
        required_skill: 'Modern Haircuts'
      },
      {
        name: 'Hair Wash & Style',
        description: 'Professional wash and styling service',
        duration_minutes: 30,
        price: 20,
        category: 'Styling',
        staffIds: [staff1._id, staff2._id]
      }
    ];

    for (const serviceData of services) {
      const service = new Service({
        ...serviceData,
        businessId: business._id,
        settings: {
          max_advance_booking_days: 30,
          min_advance_booking_minutes: 120,
          allow_online_booking: true,
          require_deposit: false,
          cancellation_policy: {
            allow_cancellation: true,
            cancellation_window_hours: 24
          }
        },
        pricing: {
          base_price: serviceData.price,
          weekend_multiplier: 1.1
        }
      });
      await service.save();

      // Update staff with service IDs
      await Staff.updateMany(
        { _id: { $in: serviceData.staffIds } },
        { $push: { serviceIds: service._id } }
      );
    }

    logger.info('Created services');

    // Create sample customers
    const customers = [
      {
        fullName: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1 (555) 987-6543',
        notes: 'Prefers shorter cuts, usually books monthly'
      },
      {
        fullName: 'Michael Brown',
        email: 'michael.brown@email.com',
        phone: '+1 (555) 876-5432',
        notes: 'Regular customer, likes beard trims with haircuts'
      },
      {
        fullName: 'David Wilson',
        email: 'david.wilson@email.com',
        phone: '+1 (555) 765-4321',
        notes: 'New customer, interested in modern styles'
      }
    ];

    for (const customerData of customers) {
      const customer = new Customer({
        ...customerData,
        businessId: business._id,
        preferences: {
          preferred_staff_ids: [staff1._id],
          communication_method: 'email',
          reminder_preferences: {
            email_reminders: true,
            sms_reminders: false,
            reminder_time: 24
          }
        },
        tags: ['regular', 'monthly']
      });
      await customer.save();
    }

    logger.info('Created customers');

    logger.info('Database seeded successfully!');
    logger.info('Login credentials:');
    logger.info('- Admin: admin@reservio.com / Admin123!@#');
    logger.info('- Business: contact@groominglounge.com / Owner123!@#');

  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedDatabase();