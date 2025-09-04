import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { WaitlistEntry, NewWaitlistEntryData } from '../types';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { useToast } from '../contexts/ToastContext';
import { joinWaitlist } from '../services/marketplaceApi';
import * as dateFns from 'date-fns';

interface WaitlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessId: string;
    serviceId: string;
    date: Date;
}

type TimeRange = WaitlistEntry['preferredTimeRange'];

const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose, businessId, serviceId, date }) => {
    const { currentCustomer } = useCustomerAuth();
    const { addToast } = useToast();
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [preferredTimeRange, setPreferredTimeRange] = useState<TimeRange>('any');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsSubmitting(false);
            if (currentCustomer) {
                setCustomerName(currentCustomer.full_name);
                setCustomerEmail(currentCustomer.email);
            } else {
                setCustomerName('');
                setCustomerEmail('');
            }
        }
    }, [isOpen, currentCustomer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data: NewWaitlistEntryData = {
                businessId,
                serviceId,
                date: dateFns.format(date, 'yyyy-MM-dd'),
                preferredTimeRange,
                customerName,
                customerEmail
            };
            await joinWaitlist(data);
            addToast("You've been added to the waitlist!", 'success');
            onClose();
        } catch (error) {
            addToast('Failed to join the waitlist.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const timeRanges: { id: TimeRange, label: string }[] = [
        { id: 'any', label: 'Any Time' },
        { id: 'morning', label: 'Morning (8am - 12pm)' },
        { id: 'afternoon', label: 'Afternoon (12pm - 5pm)' },
        { id: 'evening', label: 'Evening (5pm - 9pm)' },
    ];

    const isFormValid = customerName.trim() && customerEmail.trim();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Join Waitlist for ${dateFns.format(date, 'MMMM d')}`}>
             <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                There are no openings on this day, but we can notify you if a spot becomes available.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
                 {!currentCustomer && (
                    <>
                        <div>
                            <label htmlFor="waitlistName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                            <input id="waitlistName" type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="waitlistEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                            <input id="waitlistEmail" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                    </>
                 )}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preferred Time</label>
                    <div className="mt-2 space-y-2">
                        {timeRanges.map(range => (
                            <label key={range.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                <input type="radio" name="timeRange" value={range.id} checked={preferredTimeRange === range.id} onChange={() => setPreferredTimeRange(range.id)} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                                <span className="ml-3 text-sm text-gray-900 dark:text-gray-200">{range.label}</span>
                            </label>
                        ))}
                    </div>
                 </div>
                 <div className="pt-2 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md shadow-sm hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500">
                        Cancel
                    </button>
                    <button type="submit" disabled={!isFormValid || isSubmitting} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed dark:disabled:bg-indigo-800">
                        {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default WaitlistModal;