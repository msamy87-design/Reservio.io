import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  businessId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  notes?: string;
  
  // Customer preferences
  preferences: {
    preferred_staff_ids: mongoose.Types.ObjectId[];
    communication_method: 'email' | 'sms' | 'both';
    reminder_preferences: {
      email_reminders: boolean;
      sms_reminders: boolean;
      reminder_time: number; // hours before appointment
    };
  };
  
  // Customer stats
  stats: {
    total_bookings: number;
    completed_bookings: number;
    no_shows: number;
    cancellations: number;
    total_spent: number;
    average_rating_given: number;
    last_booking_date?: Date;
  };
  
  // Risk assessment
  risk_score: number; // 0-100, higher = more risky
  
  // Tags for segmentation
  tags: string[];
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>({
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
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please provide a valid phone number']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  preferences: {
    preferred_staff_ids: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    }],
    communication_method: {
      type: String,
      enum: ['email', 'sms', 'both'],
      default: 'email'
    },
    reminder_preferences: {
      email_reminders: { type: Boolean, default: true },
      sms_reminders: { type: Boolean, default: false },
      reminder_time: { type: Number, default: 24, min: 1, max: 168 } // 1 hour to 1 week
    }
  },
  stats: {
    total_bookings: { type: Number, default: 0, min: 0 },
    completed_bookings: { type: Number, default: 0, min: 0 },
    no_shows: { type: Number, default: 0, min: 0 },
    cancellations: { type: Number, default: 0, min: 0 },
    total_spent: { type: Number, default: 0, min: 0 },
    average_rating_given: { type: Number, default: 0, min: 0, max: 5 },
    last_booking_date: Date
  },
  risk_score: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Compound unique index - one customer per email per business
customerSchema.index({ businessId: 1, email: 1 }, { unique: true });

// Performance indexes
customerSchema.index({ businessId: 1, isActive: 1 });
customerSchema.index({ businessId: 1, 'stats.total_spent': -1 });
customerSchema.index({ businessId: 1, 'stats.last_booking_date': -1 });
customerSchema.index({ risk_score: 1 });

// Text search index
customerSchema.index({ 
  fullName: 'text', 
  email: 'text',
  phone: 'text'
});

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);