
import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { Service, NewServiceData, Staff } from '../types';
import { TrashIcon } from './Icons';

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewServiceData, id?: string) => Promise<void>;
  onDelete: (serviceId: string) => Promise<void>;
  initialServiceData: Service | null;
  staff: Staff[];
}

const PREDEFINED_SKILLS = ['haircut', 'coloring', 'shave', 'beard-trim', 'manicure', 'pedicure', 'facial'];


const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialServiceData,
  staff,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(0);
  const [requiredSkill, setRequiredSkill] = useState<string>('');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isEditMode = !!initialServiceData;

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setIsConfirmingDelete(false);
      if (initialServiceData) {
        setName(initialServiceData.name);
        setDescription(initialServiceData.description);
        setDuration(initialServiceData.duration_minutes);
        setPrice(initialServiceData.price);
        setSelectedStaffIds(initialServiceData.staffIds || []);
        setRequiredSkill(initialServiceData.required_skill || '');
      } else {
        setName('');
        setDescription('');
        setDuration(30);
        setPrice(0);
        setSelectedStaffIds([]);
        setRequiredSkill('');
      }
    }
  }, [initialServiceData, isOpen]);
  
  const handleStaffSelection = (staffId: string) => {
    setSelectedStaffIds(prev =>
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || duration <= 0 || price < 0) return;

    setIsSubmitting(true);
    await onSubmit({
      name,
      description,
      duration_minutes: duration,
      price,
      staffIds: selectedStaffIds,
      required_skill: requiredSkill
    }, initialServiceData?.id);
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!initialServiceData) return;
    setIsSubmitting(true);
    await onDelete(initialServiceData.id);
  };

  const availableStaffForService = useMemo(() => {
    if (!requiredSkill) {
        return staff;
    }
    return staff.filter(s => s.skills?.includes(requiredSkill));
  }, [staff, requiredSkill]);


  const isFormValid = name.trim() !== '' && duration > 0 && price >= 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit Service" : "New Service"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Service Name</label>
          <input
            id="serviceName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="serviceDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            id="serviceDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="serviceDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration (minutes)</label>
            <input
              id="serviceDuration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              min="1"
            />
          </div>
          <div>
            <label htmlFor="servicePrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price ($)</label>
            <input
              id="servicePrice"
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              min="0"
              step="0.01"
            />
          </div>
        </div>
         <div>
          <label htmlFor="requiredSkill" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Required Skill</label>
          <select
            id="requiredSkill"
            value={requiredSkill}
            onChange={(e) => {
                setRequiredSkill(e.target.value);
                // Unselect staff who don't have the new skill
                setSelectedStaffIds(prev => prev.filter(staffId => {
                    const staffMember = staff.find(s => s.id === staffId);
                    return staffMember?.skills?.includes(e.target.value);
                }));
            }}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">None</option>
            {PREDEFINED_SKILLS.map(skill => (
              <option key={skill} value={skill}>{skill.charAt(0).toUpperCase() + skill.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Staff</label>
          <div className="mt-2 space-y-2 border border-gray-300 dark:border-gray-600 rounded-md p-3 max-h-40 overflow-y-auto">
            {availableStaffForService.map(s => (
              <div key={s.id} className="flex items-center">
                <input
                  id={`staff-${s.id}`}
                  type="checkbox"
                  checked={selectedStaffIds.includes(s.id)}
                  onChange={() => handleStaffSelection(s.id)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor={`staff-${s.id}`} className="ml-3 text-sm text-gray-700 dark:text-gray-300">{s.full_name}</label>
              </div>
            ))}
            {availableStaffForService.length === 0 && (
                <p className="text-sm text-gray-500">No staff members have the selected required skill.</p>
            )}
          </div>
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
                Delete Service
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
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Service')}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ServiceFormModal;