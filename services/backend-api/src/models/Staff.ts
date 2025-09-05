import mongoose, { Document, Schema } from 'mongoose';

export interface IDaySchedule {
  is_working: boolean;
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  breaks?: {
    start_time: string;
    end_time: string;
  }[];
}

export interface IStaff extends Document {
  businessId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  role: 'Owner' | 'Manager' | 'Assistant' | 'Stylist';
  
  // Professional details
  bio?: string;
  profileImageUrl?: string;
  skills: string[];
  certifications: string[];
  experience_years?: number;
  
  // Schedule
  schedule: {
    monday: IDaySchedule;
    tuesday: IDaySchedule;
    wednesday: IDaySchedule;
    thursday: IDaySchedule;
    friday: IDaySchedule;
    saturday: IDaySchedule;
    sunday: IDaySchedule;
  };
  
  // Services this staff member can perform
  serviceIds: mongoose.Types.ObjectId[];
  
  // Commission settings
  commission: {
    type: 'percentage' | 'fixed' | 'none';
    value: number; // percentage (0-100) or fixed amount
    applies_to: 'all' | 'services' | 'products';
  };
  
  // Staff stats
  stats: {
    total_bookings: number;
    completed_bookings: number;
    no_shows: number;
    cancellations: number;
    average_rating: number;
    review_count: number;
    total_revenue: number;
    total_commission_earned: number;
  };
  
  // Availability settings
  availability: {
    max_bookings_per_day: number;
    buffer_time_minutes: number; // Time between appointments
    allow_back_to_back_bookings: boolean;
  };
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const dayScheduleSchema = new Schema<IDaySchedule>({
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
  },
  breaks: [{
    start_time: { 
      type: String, 
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
      required: true
    },
    end_time: { 
      type: String, 
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
      required: true
    }
  }]
});

const staffSchema = new Schema<IStaff>({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please provide a valid phone number']
  },
  role: {
    type: String,
    enum: ['Owner', 'Manager', 'Assistant', 'Stylist'],
    required: [true, 'Role is required']
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  profileImageUrl: String,
  skills: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  certifications: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  experience_years: {
    type: Number,
    min: 0,
    max: 50
  },
  schedule: {
    monday: { type: dayScheduleSchema, default: () => ({}) },
    tuesday: { type: dayScheduleSchema, default: () => ({}) },
    wednesday: { type: dayScheduleSchema, default: () => ({}) },
    thursday: { type: dayScheduleSchema, default: () => ({}) },
    friday: { type: dayScheduleSchema, default: () => ({}) },
    saturday: { type: dayScheduleSchema, default: () => ({}) },
    sunday: { type: dayScheduleSchema, default: () => ({}) }
  },
  serviceIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  commission: {
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'none'],
      default: 'none'
    },
    value: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function(this: IStaff, value: number) {
          if (this.commission.type === 'percentage') {
            return value <= 100;
          }
          return true;
        },
        message: 'Percentage commission cannot exceed 100%'
      }
    },
    applies_to: {
      type: String,
      enum: ['all', 'services', 'products'],
      default: 'all'
    }
  },
  stats: {
    total_bookings: { type: Number, default: 0, min: 0 },
    completed_bookings: { type: Number, default: 0, min: 0 },
    no_shows: { type: Number, default: 0, min: 0 },
    cancellations: { type: Number, default: 0, min: 0 },
    average_rating: { type: Number, default: 0, min: 0, max: 5 },
    review_count: { type: Number, default: 0, min: 0 },
    total_revenue: { type: Number, default: 0, min: 0 },
    total_commission_earned: { type: Number, default: 0, min: 0 }
  },
  availability: {
    max_bookings_per_day: {
      type: Number,
      default: 20,
      min: 1,
      max: 50
    },
    buffer_time_minutes: {
      type: Number,
      default: 15,
      min: 0,
      max: 60
    },
    allow_back_to_back_bookings: { type: Boolean, default: true }
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Compound unique index - one staff member per email per business
staffSchema.index({ businessId: 1, email: 1 }, { unique: true });

// Performance indexes
staffSchema.index({ businessId: 1, isActive: 1 });
staffSchema.index({ businessId: 1, role: 1 });
staffSchema.index({ businessId: 1, 'stats.average_rating': -1 });
staffSchema.index({ serviceIds: 1 });
staffSchema.index({ skills: 1 });

// Text search index
staffSchema.index({ 
  fullName: 'text', 
  bio: 'text',
  skills: 'text'
});

export const Staff = mongoose.model<IStaff>('Staff', staffSchema);