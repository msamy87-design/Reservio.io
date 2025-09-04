
import React, { useState } from 'react';
import Modal from './Modal';
import { Booking } from '../types';
import { StarIcon } from './Icons';

interface ReviewFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking;
    onSubmit: (data: { rating: number; comment: string }) => Promise<void>;
}

const StarRatingInput: React.FC<{ rating: number; setRating: (rating: number) => void }> = ({ rating, setRating }) => {
    const [hoverRating, setHoverRating] = useState(0);
    return (
        <div className="flex justify-center space-x-1">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <button
                        type="button"
                        key={starValue}
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none"
                    >
                        <StarIcon
                            className={`w-10 h-10 transition-colors ${
                                starValue <= (hoverRating || rating)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                            }`}
                        />
                    </button>
                );
            })}
        </div>
    );
};

const ReviewFormModal: React.FC<ReviewFormModalProps> = ({ isOpen, onClose, booking, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            alert('Please select a rating.');
            return;
        }
        setIsSubmitting(true);
        await onSubmit({ rating, comment });
        setIsSubmitting(false); // The parent component will close the modal on success
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Leave a Review">
            <div className="text-center">
                <p className="text-gray-700 dark:text-gray-300">How was your <span className="font-semibold">{booking.service.name}</span> with <span className="font-semibold">{booking.staff.full_name}</span>?</p>
            </div>
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center mb-2">Your Rating</label>
                    <StarRatingInput rating={rating} setRating={setRating} />
                </div>
                <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your Comments (Optional)</label>
                    <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Tell us more about your experience..."
                    />
                </div>
                <div className="pt-2 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md shadow-sm hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={rating === 0 || isSubmitting}
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed dark:disabled:bg-indigo-800"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ReviewFormModal;
