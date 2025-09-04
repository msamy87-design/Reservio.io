import React, { useState, useEffect } from 'react';
import Modal from './Modal';
// FIX: Import DayOfWeek to fix typing issues with mapping over days.
import { Staff, StaffSchedule, DaySchedule, DayOfWeek } from '../types';

interface StaffScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (staffId: string, schedule: StaffSchedule) => Promise<void>;
  staff: Staff;
}

const StaffScheduleModal: React.FC<StaffScheduleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  staff,
}) => {
  const [schedule, setSchedule] = useState<StaffSchedule>(staff.schedule);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSchedule(staff.schedule);
      setIsSubmitting(false);
    }
  }, [staff, isOpen]);

  const handleDayChange = (day: keyof StaffSchedule, field: keyof DaySchedule, value: any) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(staff.id, schedule);
    setIsSubmitting(false);
  };
  
  // FIX: Use the specific DayOfWeek type to ensure type safety in loops.
  const daysOfWeek: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Weekly Schedule for ${staff.full_name}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {daysOfWeek.map(day => (
            <div key={day} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center md:col-span-1">
                <input
                  type="checkbox"
                  id={`${day}-working`}
                  checked={schedule[day].is_working}
                  onChange={(e) => handleDayChange(day, 'is_working', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor={`${day}-working`} className="ml-3 block text-sm font-medium text-gray-900 dark:text-gray-200 capitalize">
                  {day}
                </label>
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <input
                  type="time"
                  id={`${day}-start`}
                  value={schedule[day].start_time}
                  onChange={(e) => handleDayChange(day, 'start_time', e.target.value)}
                  disabled={!schedule[day].is_working}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600"
                />
                <span className="text-gray-500 dark:text-gray-400">-</span>
                <input
                  type="time"
                  id={`${day}-end`}
                  value={schedule[day].end_time}
                  onChange={(e) => handleDayChange(day, 'end_time', e.target.value)}
                  disabled={!schedule[day].is_working}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed dark:disabled:bg-indigo-800"
            >
              {isSubmitting ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
      </form>
    </Modal>
  );
};

export default StaffScheduleModal;
