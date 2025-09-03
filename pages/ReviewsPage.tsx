
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Review, ReviewStatus } from '../types';
import Pagination from '../components/Pagination';
import StarRating from '../components/StarRating';
import { SearchIcon } from '../components/Icons';

const ITEMS_PER_PAGE = 10;

const statusColors: Record<ReviewStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  Published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Hidden: 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
};

const ReviewsPage: React.FC = () => {
    const { reviews, loading, updateReviewStatus } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    
    const filteredReviews = useMemo(() => {
        return reviews
            .filter(r => statusFilter === 'all' || r.status === statusFilter)
            .filter(r => 
                r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.staff_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [reviews, searchTerm, statusFilter]);

    const paginatedReviews = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredReviews.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredReviews, currentPage]);
    
    const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);

    const handleStatusChange = (reviewId: string, newStatus: ReviewStatus) => {
        updateReviewStatus(reviewId, newStatus);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Customer Reviews</h2>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">Manage feedback from your customers.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                <div className="relative w-full sm:max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search reviews..."
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div className="w-full sm:w-48">
                    <label htmlFor="status-filter" className="sr-only">Filter by status</label>
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="all">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Published">Published</option>
                        <option value="Hidden">Hidden</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Customer</th>
                                <th scope="col" className="px-6 py-3">Rating & Comment</th>
                                <th scope="col" className="px-6 py-3">Service / Staff</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-10">Loading reviews...</td></tr>
                            ) : paginatedReviews.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-10">No reviews found matching your criteria.</td></tr>
                            ) : (
                                paginatedReviews.map(review => (
                                    <tr key={review.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white align-top">
                                            {review.customer_name}
                                        </td>
                                        <td className="px-6 py-4 max-w-sm">
                                            <StarRating rating={review.rating} />
                                            <p className="mt-1 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{review.comment}</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs align-top">
                                            <p className="font-semibold text-gray-700 dark:text-gray-200">{review.service_name}</p>
                                            <p className="text-gray-500 dark:text-gray-400">with {review.staff_name}</p>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[review.status]}`}>
                                                {review.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right align-top">
                                            <select 
                                                value={review.status} 
                                                onChange={(e) => handleStatusChange(review.id, e.target.value as ReviewStatus)}
                                                className="text-xs border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Published">Publish</option>
                                                <option value="Hidden">Hide</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>
        </div>
    );
};

export default ReviewsPage;
