import mongoose from 'mongoose';
import { Review, IReview } from '../models/Review';
import { Booking } from '../models/Booking';
import { Business } from '../models/Business';
import { logger } from '../utils/logger';

export interface NewReviewData {
  booking_id: string;
  rating: number;
  comment: string;
  title?: string;
}

export const createReview = async (data: NewReviewData, customerId: string): Promise<IReview> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find and validate booking
    const booking = await Booking.findById(data.booking_id)
      .populate('business')
      .populate('service')
      .populate('staff')
      .session(session);

    if (!booking) {
      throw new Error('Booking not found.');
    }

    if (booking.customer.toString() !== customerId) {
      throw new Error('You can only review your own bookings.');
    }

    if (booking.status !== 'completed') {
      throw new Error('You can only review completed appointments.');
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ bookingId: data.booking_id }).session(session);
    if (existingReview) {
      throw new Error('A review has already been submitted for this booking.');
    }

    // Create new review
    const reviewData = {
      businessId: booking.business,
      bookingId: booking._id,
      customerId: customerId,
      serviceId: booking.service,
      staffId: booking.staff,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      status: 'published' as const,
      source: 'booking_completion' as const,
      verified_booking: true,
      analytics: {
        helpful_votes: 0,
        not_helpful_votes: 0,
        flagged_count: 0,
        reported_reasons: []
      }
    };

    const [newReview] = await Review.create([reviewData], { session });

    // Update business stats
    await updateBusinessStats(booking.business.toString(), session);

    await session.commitTransaction();
    
    logger.info('Review created successfully', {
      reviewId: newReview._id,
      bookingId: data.booking_id,
      customerId,
      rating: data.rating
    });

    return newReview;
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error creating review:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

export const getBusinessReviews = async (businessId: string, limit = 20, offset = 0) => {
  try {
    const reviews = await Review.find({
      businessId,
      status: 'published',
      isActive: true
    })
      .populate('customerId', 'fullName')
      .populate('serviceId', 'name')
      .populate('staffId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    const totalCount = await Review.countDocuments({
      businessId,
      status: 'published',
      isActive: true
    });

    return {
      reviews,
      totalCount,
      hasMore: offset + reviews.length < totalCount
    };
  } catch (error) {
    logger.error('Error fetching business reviews:', error);
    throw new Error('Failed to fetch reviews');
  }
};

export const getServiceReviews = async (serviceId: string, limit = 20, offset = 0) => {
  try {
    const reviews = await Review.find({
      serviceId,
      status: 'published',
      isActive: true
    })
      .populate('customerId', 'fullName')
      .populate('businessId', 'name')
      .populate('staffId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    const totalCount = await Review.countDocuments({
      serviceId,
      status: 'published',
      isActive: true
    });

    return {
      reviews,
      totalCount,
      hasMore: offset + reviews.length < totalCount
    };
  } catch (error) {
    logger.error('Error fetching service reviews:', error);
    throw new Error('Failed to fetch service reviews');
  }
};

// Helper function to update business review statistics
const updateBusinessStats = async (businessId: string, session: mongoose.ClientSession) => {
  try {
    const reviewStats = await Review.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
          status: 'published',
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]).session(session);

    if (reviewStats.length > 0) {
      const stats = reviewStats[0];
      
      await Business.updateOne(
        { _id: businessId },
        {
          $set: {
            'stats.average_rating': Math.round(stats.averageRating * 10) / 10,
            'stats.review_count': stats.totalReviews
          }
        },
        { session }
      );
    }
  } catch (error) {
    logger.error('Error updating business stats:', error);
    throw error;
  }
};

export const flagReview = async (reviewId: string, reason: string, reportedBy?: string) => {
  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    await Review.updateOne(
      { _id: reviewId },
      {
        $set: { status: 'flagged' },
        $inc: { 'analytics.flagged_count': 1 },
        $addToSet: { 'analytics.reported_reasons': reason }
      }
    );

    logger.info('Review flagged for moderation', {
      reviewId,
      reason,
      reportedBy
    });

    return { success: true, message: 'Review flagged for moderation' };
  } catch (error) {
    logger.error('Error flagging review:', error);
    throw new Error('Failed to flag review');
  }
};

export const addBusinessResponse = async (reviewId: string, response: string, responderName: string) => {
  try {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        $set: {
          business_response: {
            message: response,
            responded_at: new Date(),
            responder_name: responderName
          }
        }
      },
      { new: true }
    );

    if (!review) {
      throw new Error('Review not found');
    }

    logger.info('Business response added to review', {
      reviewId,
      responderName
    });

    return review;
  } catch (error) {
    logger.error('Error adding business response:', error);
    throw new Error('Failed to add business response');
  }
};