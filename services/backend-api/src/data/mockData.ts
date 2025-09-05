// Comprehensive mock data aligned with actual schemas

import { Types } from 'mongoose';

// Generate consistent ObjectIds for relationships
const businessId1 = new Types.ObjectId().toString();
const businessId2 = new Types.ObjectId().toString();
const staffId1 = new Types.ObjectId().toString();
const staffId2 = new Types.ObjectId().toString();
const staffId3 = new Types.ObjectId().toString();
const serviceId1 = new Types.ObjectId().toString();
const serviceId2 = new Types.ObjectId().toString();
const serviceId3 = new Types.ObjectId().toString();
const customerId1 = new Types.ObjectId().toString();
const customerId2 = new Types.ObjectId().toString();
const customerId3 = new Types.ObjectId().toString();

// Business Hours Template
const defaultBusinessHours = {
  monday: { is_working: true, start_time: "09:00", end_time: "17:00" },
  tuesday: { is_working: true, start_time: "09:00", end_time: "17:00" },
  wednesday: { is_working: true, start_time: "09:00", end_time: "17:00" },
  thursday: { is_working: true, start_time: "09:00", end_time: "18:00" },
  friday: { is_working: true, start_time: "09:00", end_time: "18:00" },
  saturday: { is_working: true, start_time: "10:00", end_time: "16:00" },
  sunday: { is_working: false, start_time: "00:00", end_time: "00:00" }
};

// Staff Schedule Template
const defaultStaffSchedule = {
  monday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
  tuesday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
  wednesday: { is_working: true, start_time: "09:00", end_time: "17:00", breaks: [] },
  thursday: { is_working: true, start_time: "09:00", end_time: "18:00", breaks: [] },
  friday: { is_working: true, start_time: "09:00", end_time: "18:00", breaks: [] },
  saturday: { is_working: true, start_time: "10:00", end_time: "16:00", breaks: [] },
  sunday: { is_working: false, start_time: "00:00", end_time: "00:00", breaks: [] }
};

// Business Mock Data
export const mockBusinesses = [
  {
    id: businessId1,
    name: "Elegant Hair Studio",
    email: "contact@eleganthair.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, Downtown, NY 10001",
    description: "Premier hair salon offering cutting-edge styles and treatments",
    website: "https://eleganthair.com",
    imageUrl: "https://example.com/elegant-hair.jpg",
    currency: "USD" as const,
    timezone: "America/New_York",
    hours: defaultBusinessHours,
    latitude: 40.7589,
    longitude: -73.9851,
    marketplace_listing: {
      is_listed: true,
      public_image_url: "https://example.com/elegant-hair-public.jpg",
      featured: true
    },
    payment_settings: {
      deposit_type: "percentage" as const,
      deposit_value: 25,
      stripe_account_id: "acct_1234567890"
    },
    no_show_prevention: {
      enabled: true,
      high_risk_deposit_amount: 50
    },
    notification_settings: {
      new_booking_alerts: true,
      cancellation_alerts: true,
      reminder_hours: 24
    },
    owner_email: "owner@eleganthair.com",
    verification_status: "approved" as const,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-09-01')
  },
  {
    id: businessId2,
    name: "Zen Spa & Wellness",
    email: "info@zenspa.com",
    phone: "+1 (555) 987-6543",
    address: "456 Wellness Blvd, Serenity Hills, CA 90210",
    description: "Holistic wellness center offering massage, facials, and body treatments",
    website: "https://zenspa.com",
    imageUrl: "https://example.com/zen-spa.jpg",
    currency: "USD" as const,
    timezone: "America/Los_Angeles",
    hours: defaultBusinessHours,
    latitude: 34.0901,
    longitude: -118.4065,
    marketplace_listing: {
      is_listed: true,
      public_image_url: "https://example.com/zen-spa-public.jpg",
      featured: false
    },
    payment_settings: {
      deposit_type: "fixed" as const,
      deposit_value: 30,
      stripe_account_id: "acct_0987654321"
    },
    no_show_prevention: {
      enabled: true,
      high_risk_deposit_amount: 75
    },
    notification_settings: {
      new_booking_alerts: true,
      cancellation_alerts: true,
      reminder_hours: 48
    },
    owner_email: "owner@zenspa.com",
    verification_status: "approved" as const,
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-08-30')
  }
];

// Staff Mock Data
export const mockStaff = [
  {
    id: staffId1,
    businessId: businessId1,
    fullName: "Sarah Johnson",
    email: "sarah@eleganthair.com",
    phone: "+1 (555) 234-5678",
    role: "Stylist" as const,
    bio: "Master stylist with 8 years of experience in cutting-edge hair design",
    profileImageUrl: "https://example.com/sarah-profile.jpg",
    skills: ["Cutting", "Coloring", "Balayage", "Extensions"],
    certifications: ["Redken Certified", "Olaplex Specialist"],
    experience_years: 8,
    schedule: defaultStaffSchedule,
    serviceIds: [serviceId1, serviceId2],
    commission: {
      type: "percentage" as const,
      value: 60,
      applies_to: "services" as const
    },
    stats: {
      total_bookings: 1250,
      completed_bookings: 1180,
      no_shows: 25,
      cancellations: 45,
      average_rating: 4.8,
      total_reviews: 180,
      revenue_generated: 85000
    },
    isActive: true,
    startDate: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-09-01')
  },
  {
    id: staffId2,
    businessId: businessId1,
    fullName: "Michael Chen",
    email: "michael@eleganthair.com",
    phone: "+1 (555) 345-6789",
    role: "Manager" as const,
    bio: "Salon manager and senior colorist with expertise in creative color",
    profileImageUrl: "https://example.com/michael-profile.jpg",
    skills: ["Management", "Color Correction", "Creative Color", "Training"],
    certifications: ["Salon Management Certified", "L'Oreal Professional"],
    experience_years: 12,
    schedule: defaultStaffSchedule,
    serviceIds: [serviceId2, serviceId3],
    commission: {
      type: "percentage" as const,
      value: 65,
      applies_to: "all" as const
    },
    stats: {
      total_bookings: 980,
      completed_bookings: 940,
      no_shows: 15,
      cancellations: 25,
      average_rating: 4.9,
      total_reviews: 145,
      revenue_generated: 120000
    },
    isActive: true,
    startDate: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-09-01')
  },
  {
    id: staffId3,
    businessId: businessId2,
    fullName: "Emma Rodriguez",
    email: "emma@zenspa.com",
    phone: "+1 (555) 456-7890",
    role: "Stylist" as const,
    bio: "Licensed massage therapist specializing in deep tissue and Swedish massage",
    profileImageUrl: "https://example.com/emma-profile.jpg",
    skills: ["Deep Tissue Massage", "Swedish Massage", "Hot Stone", "Aromatherapy"],
    certifications: ["Licensed Massage Therapist", "Reiki Level 2"],
    experience_years: 6,
    schedule: defaultStaffSchedule,
    serviceIds: [serviceId3],
    commission: {
      type: "percentage" as const,
      value: 55,
      applies_to: "services" as const
    },
    stats: {
      total_bookings: 750,
      completed_bookings: 720,
      no_shows: 12,
      cancellations: 18,
      average_rating: 4.7,
      total_reviews: 95,
      revenue_generated: 68000
    },
    isActive: true,
    startDate: new Date('2024-02-01'),
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-08-30')
  }
];

// Services Mock Data
export const mockServices = [
  {
    id: serviceId1,
    businessId: businessId1,
    name: "Precision Haircut & Style",
    description: "Expert haircut with wash, style, and finishing touches",
    duration_minutes: 60,
    price: 85,
    currency: "USD" as const,
    category: "Hair Services",
    staffIds: [staffId1, staffId2],
    required_skill: "Cutting",
    settings: {
      max_advance_booking_days: 60,
      min_advance_booking_minutes: 60,
      allow_online_booking: true,
      require_deposit: false,
      cancellation_policy: {
        allow_cancellation: true,
        cancellation_window_hours: 24,
        cancellation_fee: 0
      }
    },
    pricing: {
      base_price: 85,
      peak_hours_multiplier: 1.2,
      weekend_multiplier: 1.1,
      holiday_multiplier: 1.5
    },
    stats: {
      total_bookings: 450,
      completed_bookings: 420,
      revenue_generated: 35700,
      average_rating: 4.8,
      review_count: 89
    },
    average_rating: 4.8,
    review_count: 89,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-08-15')
  },
  {
    id: serviceId2,
    businessId: businessId1,
    name: "Full Color Treatment",
    description: "Complete hair coloring service including consultation and aftercare",
    duration_minutes: 180,
    price: 165,
    currency: "USD" as const,
    category: "Color Services",
    staffIds: [staffId1, staffId2],
    required_skill: "Coloring",
    settings: {
      max_advance_booking_days: 90,
      min_advance_booking_minutes: 120,
      allow_online_booking: true,
      require_deposit: true,
      deposit_amount: 50,
      cancellation_policy: {
        allow_cancellation: true,
        cancellation_window_hours: 48,
        cancellation_fee: 25
      }
    },
    pricing: {
      base_price: 165,
      peak_hours_multiplier: 1.15,
      weekend_multiplier: 1.1,
      holiday_multiplier: 1.3
    },
    stats: {
      total_bookings: 280,
      completed_bookings: 265,
      revenue_generated: 43725,
      average_rating: 4.9,
      review_count: 67
    },
    average_rating: 4.9,
    review_count: 67,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-08-20')
  },
  {
    id: serviceId3,
    businessId: businessId2,
    name: "Deep Tissue Massage",
    description: "90-minute therapeutic deep tissue massage for muscle tension relief",
    duration_minutes: 90,
    price: 140,
    currency: "USD" as const,
    category: "Massage Therapy",
    staffIds: [staffId3],
    required_skill: "Deep Tissue Massage",
    settings: {
      max_advance_booking_days: 45,
      min_advance_booking_minutes: 240,
      allow_online_booking: true,
      require_deposit: true,
      deposit_amount: 30,
      cancellation_policy: {
        allow_cancellation: true,
        cancellation_window_hours: 24,
        cancellation_fee: 30
      }
    },
    pricing: {
      base_price: 140,
      peak_hours_multiplier: 1.1,
      weekend_multiplier: 1.15,
      holiday_multiplier: 1.25
    },
    stats: {
      total_bookings: 320,
      completed_bookings: 305,
      revenue_generated: 42700,
      average_rating: 4.7,
      review_count: 78
    },
    average_rating: 4.7,
    review_count: 78,
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-08-25')
  }
];

// Customers Mock Data
export const mockCustomers = [
  {
    id: customerId1,
    businessId: businessId1,
    fullName: "Alice Thompson",
    email: "alice.thompson@email.com",
    phone: "+1 (555) 111-2222",
    notes: "Prefers afternoon appointments, sensitive to strong chemicals",
    preferences: {
      preferred_staff_ids: [staffId1],
      communication_method: "email" as const,
      reminder_preferences: {
        email_reminders: true,
        sms_reminders: false,
        reminder_time: 24
      }
    },
    stats: {
      total_bookings: 8,
      completed_bookings: 7,
      no_shows: 0,
      cancellations: 1,
      total_spent: 560,
      average_rating_given: 4.9,
      last_booking_date: new Date('2024-08-15')
    },
    isActive: true,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-08-15')
  },
  {
    id: customerId2,
    businessId: businessId1,
    fullName: "Robert Kim",
    email: "robert.kim@email.com",
    phone: "+1 (555) 333-4444",
    notes: "Regular monthly color touch-ups, prefers Michael",
    preferences: {
      preferred_staff_ids: [staffId2],
      communication_method: "both" as const,
      reminder_preferences: {
        email_reminders: true,
        sms_reminders: true,
        reminder_time: 48
      }
    },
    stats: {
      total_bookings: 12,
      completed_bookings: 11,
      no_shows: 1,
      cancellations: 0,
      total_spent: 1840,
      average_rating_given: 5.0,
      last_booking_date: new Date('2024-08-28')
    },
    isActive: true,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-08-28')
  },
  {
    id: customerId3,
    businessId: businessId2,
    fullName: "Jennifer Martinez",
    email: "jennifer.martinez@email.com",
    phone: "+1 (555) 555-6666",
    notes: "Suffers from chronic back pain, prefers deep pressure",
    preferences: {
      preferred_staff_ids: [staffId3],
      communication_method: "sms" as const,
      reminder_preferences: {
        email_reminders: false,
        sms_reminders: true,
        reminder_time: 12
      }
    },
    stats: {
      total_bookings: 6,
      completed_bookings: 6,
      no_shows: 0,
      cancellations: 0,
      total_spent: 840,
      average_rating_given: 4.8,
      last_booking_date: new Date('2024-08-20')
    },
    isActive: true,
    createdAt: new Date('2024-04-10'),
    updatedAt: new Date('2024-08-20')
  }
];

// Bookings Mock Data
export const mockBookings = [
  {
    id: new Types.ObjectId().toString(),
    businessId: businessId1,
    customerId: customerId1,
    serviceId: serviceId1,
    staffId: staffId1,
    start_at: new Date('2024-09-10T14:00:00Z').toISOString(),
    end_at: new Date('2024-09-10T15:00:00Z').toISOString(),
    status: "confirmed" as const,
    customer: { id: customerId1, full_name: "Alice Thompson" },
    service: { id: serviceId1, name: "Precision Haircut & Style", duration_minutes: 60 },
    staff: { id: staffId1, full_name: "Sarah Johnson" },
    business: { id: businessId1, name: "Elegant Hair Studio" },
    payment_status: "unpaid" as const,
    total_amount: 85,
    deposit_amount: 0,
    notes: "First time client consultation",
    createdAt: new Date('2024-09-05'),
    updatedAt: new Date('2024-09-05')
  },
  {
    id: new Types.ObjectId().toString(),
    businessId: businessId1,
    customerId: customerId2,
    serviceId: serviceId2,
    staffId: staffId2,
    start_at: new Date('2024-09-12T10:00:00Z').toISOString(),
    end_at: new Date('2024-09-12T13:00:00Z').toISOString(),
    status: "confirmed" as const,
    customer: { id: customerId2, full_name: "Robert Kim" },
    service: { id: serviceId2, name: "Full Color Treatment", duration_minutes: 180 },
    staff: { id: staffId2, full_name: "Michael Chen" },
    business: { id: businessId1, name: "Elegant Hair Studio" },
    payment_status: "deposit_paid" as const,
    total_amount: 165,
    deposit_amount: 50,
    recurrence_rule: "monthly" as const,
    notes: "Monthly color maintenance",
    createdAt: new Date('2024-08-28'),
    updatedAt: new Date('2024-08-28')
  },
  {
    id: new Types.ObjectId().toString(),
    businessId: businessId2,
    customerId: customerId3,
    serviceId: serviceId3,
    staffId: staffId3,
    start_at: new Date('2024-09-08T15:30:00Z').toISOString(),
    end_at: new Date('2024-09-08T17:00:00Z').toISOString(),
    status: "completed" as const,
    customer: { id: customerId3, full_name: "Jennifer Martinez" },
    service: { id: serviceId3, name: "Deep Tissue Massage", duration_minutes: 90 },
    staff: { id: staffId3, full_name: "Emma Rodriguez" },
    business: { id: businessId2, name: "Zen Spa & Wellness" },
    payment_status: "paid_in_full" as const,
    total_amount: 140,
    deposit_amount: 30,
    notes: "Focus on lower back and shoulders",
    review_submitted: true,
    createdAt: new Date('2024-08-20'),
    updatedAt: new Date('2024-09-08')
  }
];

// Reviews Mock Data
export const mockReviews = [
  {
    id: new Types.ObjectId().toString(),
    businessId: businessId1,
    customerId: customerId1,
    serviceId: serviceId1,
    staffId: staffId1,
    booking_id: mockBookings[0].id,
    customer_name: "Alice Thompson",
    service_name: "Precision Haircut & Style",
    staff_name: "Sarah Johnson",
    rating: 5,
    comment: "Sarah did an amazing job! My hair has never looked better. She listened to exactly what I wanted and delivered perfectly.",
    status: "Published" as const,
    created_at: new Date('2024-08-16T10:30:00Z').toISOString()
  },
  {
    id: new Types.ObjectId().toString(),
    businessId: businessId1,
    customerId: customerId2,
    serviceId: serviceId2,
    staffId: staffId2,
    booking_id: mockBookings[1].id,
    customer_name: "Robert Kim",
    service_name: "Full Color Treatment",
    staff_name: "Michael Chen",
    rating: 5,
    comment: "Michael is a color wizard! The highlights look so natural and the color is exactly what I was hoping for. Professional service all around.",
    status: "Published" as const,
    created_at: new Date('2024-08-30T16:45:00Z').toISOString()
  },
  {
    id: new Types.ObjectId().toString(),
    businessId: businessId2,
    customerId: customerId3,
    serviceId: serviceId3,
    staffId: staffId3,
    booking_id: mockBookings[2].id,
    customer_name: "Jennifer Martinez",
    service_name: "Deep Tissue Massage",
    staff_name: "Emma Rodriguez",
    rating: 5,
    comment: "Emma's deep tissue massage was exactly what I needed. She found all the knots in my back and worked them out. Feeling so much better!",
    status: "Published" as const,
    created_at: new Date('2024-09-08T18:00:00Z').toISOString()
  }
];

// Additional Mock Data for Complex Services
export const mockTransactions = [
  {
    id: new Types.ObjectId().toString(),
    businessId: businessId1,
    customerId: customerId1,
    booking_id: mockBookings[0].id,
    items: [
      {
        id: serviceId1,
        name: "Precision Haircut & Style",
        type: "service" as const,
        quantity: 1,
        unit_price: 85,
        staffId: staffId1,
        staffName: "Sarah Johnson"
      }
    ],
    subtotal: 85,
    discount_amount: 0,
    tax_amount: 6.8,
    total: 91.8,
    payment_method: "Card" as const,
    created_at: new Date('2024-09-10T15:15:00Z').toISOString()
  }
];

export const mockWaitlist = [
  {
    id: new Types.ObjectId().toString(),
    businessId: businessId1,
    serviceId: serviceId1,
    customerName: "David Wilson",
    customerEmail: "david.wilson@email.com",
    date: "2024-09-15",
    preferredTimeRange: "afternoon" as const,
    createdAt: new Date('2024-09-05T09:00:00Z').toISOString()
  }
];

export const mockBusinessSettings = [
  {
    id: businessId1,
    profile: {
      name: "Elegant Hair Studio",
      email: "contact@eleganthair.com",
      phone: "+1 (555) 123-4567",
      address: "123 Main St, Downtown, NY 10001"
    },
    currency: "USD" as const,
    hours: defaultBusinessHours,
    marketplace_listing: {
      is_listed: true,
      public_image_url: "https://example.com/elegant-hair-public.jpg"
    },
    no_show_prevention: {
      enabled: true,
      high_risk_deposit_amount: 50
    },
    payment_settings: {
      deposit_type: "percentage" as const,
      deposit_value: 25
    },
    notification_settings: {
      new_booking_alerts: true,
      cancellation_alerts: true
    }
  }
];

export const mockCustomerUsers = [
  {
    id: customerId1,
    fullName: "Alice Thompson",
    email: "alice.thompson@email.com",
    favoriteBusinessIds: [businessId1],
    isActive: true,
    emailVerified: true,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-08-15')
  },
  {
    id: customerId2,
    fullName: "Robert Kim", 
    email: "robert.kim@email.com",
    favoriteBusinessIds: [businessId1],
    isActive: true,
    emailVerified: true,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-08-28')
  }
];

// Legacy exports for backward compatibility
export const mockBusinessData = mockBusinesses[0];
export const mockServiceData = mockServices;
export const mockStaffData = mockStaff;
export const mockCustomerData = mockCustomers;