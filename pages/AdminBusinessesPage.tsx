
import React, { useState, useEffect, useMemo } from 'react';
import { fetchBusinesses, updateBusinessStatus } from '../services/adminApi';
import { BusinessForAdmin, BusinessVerificationStatus } from '../types';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useToast } from '../contexts/ToastContext';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 10;

const statusColors: Record<BusinessVerificationStatus, string> = {
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const AdminBusinessesPage: React.FC = () => {
    const { adminToken } = useAdminAuth();
    const { addToast } = useToast();
    const [businesses, setBusinesses] = useState<BusinessForAdmin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    
    useEffect(() => {
        const loadBusinesses = async () => {
            if (!adminToken) return;
            setIsLoading(true);
            try {
                const data = await fetchBusinesses(adminToken);
                setBusinesses(data);
            } catch (error) {
                console.error("Failed to fetch businesses:", error);
                addToast('Could not load businesses.', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        loadBusinesses();
    }, [adminToken, addToast]);
    
    const handleStatusChange = async (businessId: string, status: BusinessVerificationStatus) => {
        if (!adminToken) return;
        try {
            const updatedBusiness = await updateBusinessStatus(businessId, status, adminToken);
            setBusinesses(current => current.map(b => b.id === businessId ? updatedBusiness : b));
            addToast(`Business status updated to ${status}.`, 'success');
        } catch (error) {
            addToast('Failed to update business status.', 'error');
        }
    };

    const paginatedBusinesses = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return businesses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [businesses, currentPage]);
    
    const totalPages = Math.ceil(businesses.length / ITEMS_PER_PAGE);

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Business Management</h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Approve, suspend, and manage all businesses on the platform.</p>

            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Business Name</th>
                                <th scope="col" className="px-6 py-3">Owner Email</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={4} className="text-center py-10">Loading businesses...</td></tr>
                            ) : paginatedBusinesses.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-10">No businesses found.</td></tr>
                            ) : (
                                paginatedBusinesses.map(biz => (
                                    <tr key={biz.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{biz.name}</td>
                                        <td className="px-6 py-4">{biz.owner_email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${statusColors[biz.verification_status]}`}>
                                                {biz.verification_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select 
                                                value={biz.verification_status} 
                                                onChange={(e) => handleStatusChange(biz.id, e.target.value as BusinessVerificationStatus)}
                                                className="text-xs border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="approved">Approve</option>
                                                <option value="suspended">Suspend</option>
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

export default AdminBusinessesPage;
