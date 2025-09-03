
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Staff, NewStaffData } from '../types';
import { TrashIcon } from './Icons';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewStaffData, id?: string) => Promise<void>;
  onDelete: (staffId: string) => Promise<void>;
  initialStaffData: Staff | null;
}

const StaffFormModal: React.FC<StaffFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialStaffData,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Staff['role']>('Stylist');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isEditMode = !!initialStaffData;
  const roles: Staff['role'][] = ['Stylist', 'Manager', 'Assistant', 'Owner'];

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setIsConfirmingDelete(false);
      if (initialStaffData) {
        setFullName(initialStaffData.full_name);
        setEmail(initialStaffData.email);
        setPhone(initialStaffData.phone);
        setRole(initialStaffData.role);
      } else {
        setFullName('');
        setEmail('');
        setPhone('');
        setRole('Stylist');
      }
    }
  }, [initialStaffData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    setIsSubmitting(true);
    await onSubmit({
      full_name: fullName,
      email,
      phone,
      role,
    }, initialStaffData?.id);
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!initialStaffData) return;
    setIsSubmitting(true);
    await onDelete(initialStaffData.id);
  };

  const isFormValid = fullName.trim() !== '' && email.trim() !== '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit Staff Member" : "New Staff Member"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="staffName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
          <input
            id="staffName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="staffEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
          <input
            id="staffEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="staffPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
          <input
            id="staffPhone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="staffRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
          <select
            id="staffRole"
            value={role}
            onChange={(e) => setRole(e.target.value as Staff['role'])}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        
        <div className="pt-2 flex justify-between items-center">
          <div className="min-h-[38px]">
            {isEditMode && !isConfirmingDelete && (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-500 font-semibold rounded-md hover:bg-red-50 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4" />
                Delete Member
              </button>
            )}
            {isEditMode && isConfirmingDelete && (
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
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Member')}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default StaffFormModal;
