import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  businessId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  staffId: mongoose.Types.ObjectId;
  
  // Booking details
  startAt: Date;
  endAt: Date;
  duration_minutes: number;
  
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  
  // Pricing
  pricing: {
    service_price: number;
    add_ons_price: number;
    discount_amount: number;
    tax_amount: number;
    deposit_amount: number;
    total_amount: number;
    currency: string;
  };
  
  // Payment details
  payment: {
    status: 'unpaid' | 'deposit_paid' | 'paid_in_full' | 'refunded' | 'partially_refunded';
    method?: 'cash' | 'card' | 'online';
    transaction_id?: string;
    paid_amount: number;
    refunded_amount: number;
  };
  
  // Recurrence (for recurring appointments)
  recurrence?: {
    rule: 'weekly' | 'biweekly' | 'monthly';
    end_date?: Date;
    parent_booking_id?: mongoose.Types.ObjectId; // Link to original booking
    occurrence_number?: number; // Which occurrence in the series (1st, 2nd, etc.)
  };
  
  // Add-ons selected
  addOns: {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
  }[];
  
  // Customer notes and special requests
  customer_notes?: string;
  internal_notes?: string; // Staff/business notes
  
  // No-show risk assessment
  risk_assessment: {
    score: number; // 0-100
    factors: string[]; // Reasons for risk score
    flagged: boolean;
  };
  
  // Communication history
  communications: {
    type: 'reminder' | 'confirmation' | 'cancellation' | 'custom';
    method: 'email' | 'sms' | 'push';
    sent_at: Date;
    status: 'sent' | 'delivered' | 'failed' | 'opened' | 'clicked';
    message?: string;
  }[];
  
  // Cancellation details
  cancellation?: {
    cancelled_at: Date;
    cancelled_by: 'customer' | 'business' | 'system';
    reason?: string;
    fee_charged?: number;
    refund_amount?: number;
  };
  
  // Review link
  review_submitted: boolean;
  review_id?: mongoose.Types.ObjectId;
  
  // Source tracking
  booking_source: 'online' | 'phone' | 'walk_in' | 'admin' | 'mobile_app';
  
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  startAt: {
    type: Date,
    required: [true, 'Start time is required'],
    validate: {
      validator: function(value: Date) {
        return value > new Date();
      },
      message: 'Booking start time must be in the future'
    }
  },
  endAt: {
    type: Date,
    required: [true, 'End time is required'],
    validate: {
      validator: function(this: IBooking, value: Date) {
        return value > this.startAt;
      },
      message: 'End time must be after start time'
    }
  },
  duration_minutes: {
    type: Number,
    required: true,
    min: 15,
    max: 480
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'confirmed'
  },
  pricing: {
    service_price: { type: Number, required: true, min: 0 },
    add_ons_price: { type: Number, default: 0, min: 0 },
    discount_amount: { type: Number, default: 0, min: 0 },
    tax_amount: { type: Number, default: 0, min: 0 },
    deposit_amount: { type: Number, default: 0, min: 0 },
    total_amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' }
  },
  payment: {
    status: {
      type: String,
      enum: ['unpaid', 'deposit_paid', 'paid_in_full', 'refunded', 'partially_refunded'],
      default: 'unpaid'
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'online']
    },
    stripe_payment_intent_id: String,
    transaction_id: String,
    paid_amount: { type: Number, default: 0, min: 0 },
    refunded_amount: { type: Number, default: 0, min: 0 }
  },
  recurrence: {
    rule: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly']
    },
    end_date: Date,
    parent_booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    occurrence_number: {
      type: Number,
      min: 1
    }
  },
  addOns: [{
    id: { type: String, required: true },
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    duration_minutes: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  customer_notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Customer notes cannot exceed 500 characters']
  },
  internal_notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Internal notes cannot exceed 1000 characters']
  },
  risk_assessment: {
    score: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    factors: [{
      type: String,
      trim: true
    }],
    flagged: { type: Boolean, default: false }
  },
  communications: [{
    type: {
      type: String,
      enum: ['reminder', 'confirmation', 'cancellation', 'custom'],
      required: true
    },
    method: {
      type: String,
      enum: ['email', 'sms', 'push'],
      required: true
    },
    sent_at: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'opened', 'clicked'],
      default: 'sent'
    },
    message: String
  }],
  cancellation: {
    cancelled_at: { type: Date },
    cancelled_by: {
      type: String,
      enum: ['customer', 'business', 'system']
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 200
    },
    fee_charged: {
      type: Number,
      min: 0
    },
    refund_amount: {
      type: Number,
      min: 0
    }
  },
  review_submitted: { type: Boolean, default: false },
  review_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  },
  booking_source: {
    type: String,
    enum: ['online', 'phone', 'walk_in', 'admin', 'mobile_app'],
    default: 'online'
  }
}, {
  timestamps: true
});

// Performance indexes
bookingSchema.index({ businessId: 1, startAt: 1 });
bookingSchema.index({ businessId: 1, status: 1, startAt: 1 });
bookingSchema.index({ customerId: 1, startAt: -1 });
bookingSchema.index({ staffId: 1, startAt: 1 });
bookingSchema.index({ serviceId: 1 });

// Compound indexes for common queries
bookingSchema.index({ businessId: 1, staffId: 1, startAt: 1 });
bookingSchema.index({ businessId: 1, status: 1, startAt: 1 });

// Index for finding conflicts
bookingSchema.index({ staffId: 1, startAt: 1, endAt: 1 });

// Index for recurring bookings
bookingSchema.index({ 'recurrence.parent_booking_id': 1 });

// Pre-save middleware to calculate duration
bookingSchema.pre('save', function(next) {
  if (this.startAt && this.endAt) {
    this.duration_minutes = Math.ceil((this.endAt.getTime() - this.startAt.getTime()) / (1000 * 60));
  }
  next();
});

// Virtual for total duration including add-ons
bookingSchema.virtual('total_duration_minutes').get(function() {
  const addOnsDuration = this.addOns.reduce((sum, addOn) => sum + addOn.duration_minutes, 0);
  return this.duration_minutes + addOnsDuration;
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);