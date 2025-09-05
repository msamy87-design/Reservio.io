import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  category?: string;
  
  // Staff assignment
  staffIds: mongoose.Types.ObjectId[];
  required_skill?: string;
  
  // Service settings
  settings: {
    max_advance_booking_days: number; // How far in advance can be booked
    min_advance_booking_minutes: number; // Minimum notice required
    allow_online_booking: boolean;
    require_deposit: boolean;
    deposit_amount?: number;
    cancellation_policy: {
      allow_cancellation: boolean;
      cancellation_window_hours: number; // Hours before appointment
      cancellation_fee?: number;
    };
  };
  
  // Pricing variations
  pricing: {
    base_price: number;
    peak_hours_multiplier?: number;
    weekend_multiplier?: number;
    holiday_multiplier?: number;
  };
  
  // Service stats
  stats: {
    total_bookings: number;
    completed_bookings: number;
    average_rating: number;
    review_count: number;
    total_revenue: number;
  };
  
  // Add-ons that can be selected with this service
  addOns: {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
  }[];
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  duration_minutes: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [15, 'Duration must be at least 15 minutes'],
    max: [480, 'Duration cannot exceed 8 hours']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    max: [10000, 'Price cannot exceed $10,000']
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  staffIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  }],
  required_skill: {
    type: String,
    trim: true,
    maxlength: [100, 'Required skill cannot exceed 100 characters']
  },
  settings: {
    max_advance_booking_days: {
      type: Number,
      default: 30,
      min: 1,
      max: 365
    },
    min_advance_booking_minutes: {
      type: Number,
      default: 60,
      min: 0,
      max: 10080 // 1 week
    },
    allow_online_booking: { type: Boolean, default: true },
    require_deposit: { type: Boolean, default: false },
    deposit_amount: {
      type: Number,
      min: 0,
      validate: {
        validator: function(this: IService, value: number) {
          return !this.settings.require_deposit || (value > 0 && value <= this.price);
        },
        message: 'Deposit amount must be between 0 and service price when deposit is required'
      }
    },
    cancellation_policy: {
      allow_cancellation: { type: Boolean, default: true },
      cancellation_window_hours: {
        type: Number,
        default: 24,
        min: 0,
        max: 168 // 1 week
      },
      cancellation_fee: {
        type: Number,
        min: 0,
        max: 1000
      }
    }
  },
  pricing: {
    base_price: {
      type: Number,
      required: true,
      min: 0
    },
    peak_hours_multiplier: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    },
    weekend_multiplier: {
      type: Number,
      min: 1,
      max: 3,
      default: 1
    },
    holiday_multiplier: {
      type: Number,
      min: 1,
      max: 3,
      default: 1
    }
  },
  stats: {
    total_bookings: { type: Number, default: 0, min: 0 },
    completed_bookings: { type: Number, default: 0, min: 0 },
    average_rating: { type: Number, default: 0, min: 0, max: 5 },
    review_count: { type: Number, default: 0, min: 0 },
    total_revenue: { type: Number, default: 0, min: 0 }
  },
  addOns: [{
    id: { type: String, required: true },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      max: 1000
    },
    duration_minutes: {
      type: Number,
      required: true,
      min: 0,
      max: 240
    }
  }],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Performance indexes
serviceSchema.index({ businessId: 1, isActive: 1 });
serviceSchema.index({ businessId: 1, category: 1 });
serviceSchema.index({ businessId: 1, 'stats.total_revenue': -1 });
serviceSchema.index({ businessId: 1, 'stats.average_rating': -1 });
serviceSchema.index({ staffIds: 1 });

// Text search index
serviceSchema.index({ 
  name: 'text', 
  description: 'text',
  category: 'text'
});

// Pre-save middleware to sync base_price with price
serviceSchema.pre('save', function(next) {
  this.pricing.base_price = this.price;
  next();
});

export const Service = mongoose.model<IService>('Service', serviceSchema);