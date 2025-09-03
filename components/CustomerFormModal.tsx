
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Customer, NewCustomerData } from '../types';
import { TrashIcon } from './Icons';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewCustomerData, id?: string) => Promise<Customer | void>;
  onDelete?: (customerId: string) => Promise<void>;
  initialCustomerData: Customer | null;
  onSuccess?: (customer: Customer) => void;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialCustomerData,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isEditMode = !!initialCustomerData;

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setIsConfirmingDelete(false);
      if (initialCustomerData) {
        setFullName(initialCustomerData.full_name);
        setEmail(initialCustomerData.email);
        setPhone(initialCustomerData.phone);
        setNotes(initialCustomerData.notes);
      } else {
        setFullName('');
        setEmail('');
        setPhone('');
        setNotes('');
      }
    }
  }, [initialCustomerData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    setIsSubmitting(true);
    const result = await onSubmit({
      full_name: fullName,
      email,
      phone,
      notes
    }, initialCustomerData?.id);
    
    if (result && !isEditMode && onSuccess) {
        onSuccess(result);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!initialCustomerData || !onDelete) return;
    setIsSubmitting(true);
    await onDelete(initialCustomerData.id);
  };

  const isFormValid = fullName.trim() !== '' && email.trim() !== '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit Customer" : "New Customer"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
          <input
            id="customerName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
          <input
            id="customerEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
          <input
            id="customerPhone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="customerNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
          <textarea
            id="customerNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., Prefers window seat, allergy to nuts..."
          />
        </div>
        
        <div className="pt-2 flex justify-between items-center">
          <div className="min-h-[38px]">
            {isEditMode && onDelete && !isConfirmingDelete && (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-500 font-semibold rounded-md hover:bg-red-50 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4" />
                Delete Customer
              </button>
            )}
            {isEditMode && onDelete && isConfirmingDelete && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 dark:disabled:bg-red-800"
                >
                  Confirm Deletion
                </button>
                <button type="button" onClick={() => setIsConfirmingDelete(false)} className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed dark:disabled:bg-indigo-800"
            >
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Customer')}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerFormModal;