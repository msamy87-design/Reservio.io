import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessHours {
  is_working: boolean;
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
}

export interface IBusiness extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  description?: string;
  website?: string;
  imageUrl?: string;
  currency: 'USD' | 'EUR' | 'GBP';
  timezone: string;
  
  // Business hours
  hours: {
    monday: IBusinessHours;
    tuesday: IBusinessHours;
    wednesday: IBusinessHours;
    thursday: IBusinessHours;
    friday: IBusinessHours;
    saturday: IBusinessHours;
    sunday: IBusinessHours;
  };
  
  // Location data
  latitude?: number;
  longitude?: number;
  
  // Marketplace settings
  marketplace_listing: {
    is_listed: boolean;
    public_image_url?: string;
    featured: boolean;
  };
  
  // Payment settings
  payment_settings: {
    deposit_type: 'none' | 'fixed' | 'percentage';
    deposit_value: number;
    stripe_account_id?: string;
  };
  
  // Business settings
  no_show_prevention: {
    enabled: boolean;
    high_risk_deposit_amount: number;
  };
  
  notification_settings: {
    new_booking_alerts: boolean;
    cancellation_alerts: boolean;
    review_alerts: boolean;
    email_notifications: boolean;
    sms_notifications: boolean;
  };
  
  // Stats (computed/cached values)
  stats: {
    average_rating: number;
    review_count: number;
    total_bookings: number;
    total_revenue: number;
  };
  
  verification_status: 'pending' | 'approved' | 'suspended';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const businessHoursSchema = new Schema<IBusinessHours>({
  is_working: { type: Boolean, default: false },
  start_time: { 
    type: String, 
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    default: '09:00'
  },
  end_time: { 
    type: String, 
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    default: '17:00'
  }
});

const businessSchema = new Schema<IBusiness>({
  name: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please provide a valid website URL']
  },
  imageUrl: String,
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP'],
    default: 'USD'
  },
  timezone: {
    type: String,
    default: 'America/New_York'
  },
  hours: {
    monday: { type: businessHoursSchema, default: () => ({}) },
    tuesday: { type: businessHoursSchema, default: () => ({}) },
    wednesday: { type: businessHoursSchema, default: () => ({}) },
    thursday: { type: businessHoursSchema, default: () => ({}) },
    friday: { type: businessHoursSchema, default: () => ({}) },
    saturday: { type: businessHoursSchema, default: () => ({}) },
    sunday: { type: businessHoursSchema, default: () => ({}) }
  },
  latitude: {
    type: Number,
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90']
  },
  longitude: {
    type: Number,
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180']
  },
  marketplace_listing: {
    is_listed: { type: Boolean, default: false },
    public_image_url: String,
    featured: { type: Boolean, default: false }
  },
  payment_settings: {
    deposit_type: {
      type: String,
      enum: ['none', 'fixed', 'percentage'],
      default: 'none'
    },
    deposit_value: { type: Number, default: 0, min: 0 },
    stripe_account_id: String
  },
  no_show_prevention: {
    enabled: { type: Boolean, default: false },
    high_risk_deposit_amount: { type: Number, default: 0, min: 0 }
  },
  notification_settings: {
    new_booking_alerts: { type: Boolean, default: true },
    cancellation_alerts: { type: Boolean, default: true },
    review_alerts: { type: Boolean, default: true },
    email_notifications: { type: Boolean, default: true },
    sms_notifications: { type: Boolean, default: false }
  },
  stats: {
    average_rating: { type: Number, default: 0, min: 0, max: 5 },
    review_count: { type: Number, default: 0, min: 0 },
    total_bookings: { type: Number, default: 0, min: 0 },
    total_revenue: { type: Number, default: 0, min: 0 }
  },
  verification_status: {
    type: String,
    enum: ['pending', 'approved', 'suspended'],
    default: 'pending'
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes for performance
businessSchema.index({ email: 1 }, { unique: true });
businessSchema.index({ 'marketplace_listing.is_listed': 1 });
businessSchema.index({ verification_status: 1 });
businessSchema.index({ isActive: 1 });
businessSchema.index({ 'stats.average_rating': -1 });
businessSchema.index({ latitude: 1, longitude: 1 }); // For geospatial queries

// Text index for search
businessSchema.index({ 
  name: 'text', 
  description: 'text', 
  address: 'text' 
});

export const Business = mongoose.model<IBusiness>('Business', businessSchema);