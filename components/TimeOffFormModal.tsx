
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Staff, NewTimeOffData } from '../types';
import { useToast } from '../contexts/ToastContext';

interface TimeOffFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: NewTimeOffData) => Promise<void>;
    staffList: Staff[];
}

const TimeOffFormModal: React.FC<TimeOffFormModalProps> = ({ isOpen, onClose, onSubmit, staffList }) => {
    const [staffId, setStaffId] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            const today = new Date().toISOString().split('T')[0];
            setStaffId('all');
            setStartDate(today);
            setEndDate(today);
            setReason('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate || !reason) {
            addToast('Please fill out all fields.', 'error');
            return;
        }

        const startDateTime = new Date(startDate).toISOString();
        const endDateTime = new Date(endDate).toISOString();

        if (new Date(endDateTime) < new Date(startDateTime)) {
            addToast('End date cannot be before the start date.', 'error');
            return;
        }

        setIsSubmitting(true);
        await onSubmit({
            staff_id: staffId,
            start_at: startDateTime,
            end_at: endDateTime,
            reason
        });
        setIsSubmitting(false);
    };
    
    const isFormValid = startDate && endDate && reason.trim();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Time Off">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="staff" className="block text-sm font-medium text-gray-700 dark:text-gray-300">For Staff Member</label>
                    <select
                        id="staff"
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="all">All Staff</option>
                        {staffList.map(s => (
                            <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        />
                    </div>
                </div>
                 <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
                    <input
                        id="reason"
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="e.g., Holiday, Vacation, Training"
                        required
                    />
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md shadow-sm hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500">
                        Cancel
                    </button>
                    <button type="submit" disabled={!isFormValid || isSubmitting} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed dark:disabled:bg-indigo-800">
                        {isSubmitting ? 'Saving...' : 'Add Time Off'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default TimeOffFormModal;
