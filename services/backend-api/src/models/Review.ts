import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  businessId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  staffId: mongoose.Types.ObjectId;
  
  // Review content
  rating: number; // 1-5 stars
  title?: string;
  comment: string;
  
  // Review metadata
  status: 'pending' | 'published' | 'hidden' | 'flagged';
  moderator_notes?: string;
  
  // Response from business
  business_response?: {
    message: string;
    responded_at: Date;
    responder_name: string;
  };
  
  // Review analytics
  analytics: {
    helpful_votes: number;
    not_helpful_votes: number;
    flagged_count: number;
    reported_reasons: string[];
  };
  
  // Source information
  source: 'booking_completion' | 'email_invitation' | 'website' | 'google' | 'facebook';
  verified_booking: boolean; // True if review is from actual booking
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
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
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    minlength: [10, 'Comment must be at least 10 characters'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'published', 'hidden', 'flagged'],
    default: 'published'
  },
  moderator_notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Moderator notes cannot exceed 500 characters']
  },
  business_response: {
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Business response cannot exceed 500 characters']
    },
    responded_at: {
      type: Date,
      default: Date.now
    },
    responder_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    }
  },
  analytics: {
    helpful_votes: { type: Number, default: 0, min: 0 },
    not_helpful_votes: { type: Number, default: 0, min: 0 },
    flagged_count: { type: Number, default: 0, min: 0 },
    reported_reasons: [{
      type: String,
      enum: ['spam', 'inappropriate', 'fake', 'offensive', 'irrelevant']
    }]
  },
  source: {
    type: String,
    enum: ['booking_completion', 'email_invitation', 'website', 'google', 'facebook'],
    default: 'booking_completion'
  },
  verified_booking: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Ensure one review per booking
reviewSchema.index({ bookingId: 1 }, { unique: true });

// Performance indexes
reviewSchema.index({ businessId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ businessId: 1, rating: -1 });
reviewSchema.index({ staffId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ serviceId: 1, status: 1, rating: -1 });
reviewSchema.index({ customerId: 1, createdAt: -1 });

// Text search index
reviewSchema.index({ 
  title: 'text', 
  comment: 'text'
});

export const Review = mongoose.model<IReview>('Review', reviewSchema);