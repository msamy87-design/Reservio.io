
import React from 'react';
import Modal from './Modal';
import { Staff, StaffSchedule } from '../types';

interface ViewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff;
}

const formatTime = (time: string): string => {
  if (!time) return '';
  const [hour, minute] = time.split(':');
  const hourNum = parseInt(hour, 10);
  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  const formattedHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
  return `${formattedHour}:${minute} ${ampm}`;
};

const ViewScheduleModal: React.FC<ViewScheduleModalProps> = ({ isOpen, onClose, staff }) => {
  if (!isOpen) return null;

  const daysOfWeek: (keyof StaffSchedule)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Schedule for ${staff.full_name}`}>
      <div className="space-y-3">
        {daysOfWeek.map(day => {
          const daySchedule = staff.schedule[day];
          return (
            <div key={day} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="capitalize font-medium text-gray-800 dark:text-gray-200">{day}</span>
              {daySchedule.is_working ? (
                <span className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                  {formatTime(daySchedule.start_time)} - {formatTime(daySchedule.end_time)}
                </span>
              ) : (
                <span className="text-red-500 dark:text-red-400 text-sm font-semibold">Day Off</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default ViewScheduleModal;
