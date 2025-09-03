
import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { Customer, Service, Booking, Staff, StaffSchedule, TimeOff } from '../types';
import { TrashIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {id?: string, customerId: string, serviceId: string, staffId: string, date: string, time: string, recurrenceRule?: 'weekly' | 'monthly', recurrenceEndDate?: string}) => Promise<void>;
  onDelete: (bookingId: string) => Promise<void>;
  initialBookingData: Booking | null;
  initialDate: Date | null;
  customers: Customer[];
  services: Service[];
  staff: Staff[];
  bookings: Booking[];
  timeOff: TimeOff[];
}

const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialBookingData,
  initialDate,
  customers,
  services,
  staff,
  bookings,
  timeOff
}) => {
  const [customerId, setCustomerId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<'weekly' | 'monthly'>('weekly');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const { addToast } = useToast();

  const isEditMode = !!initialBookingData;

  useEffect(() => {
    if (isOpen) {
        setIsSubmitting(false);
        setIsConfirmingDelete(false);
        if (initialBookingData) {
            const startDate = new Date(initialBookingData.start_at);
            setCustomerId(initialBookingData.customer.id);
            setServiceId(initialBookingData.service.id);
            setStaffId(initialBookingData.staff.id);
            setDate(startDate.toISOString().split('T')[0]);
            setTime(startDate.toTimeString().substring(0, 5));
            setIsRecurring(!!initialBookingData.recurrence_rule);
        } else if (initialDate) {
            const selected = initialDate;
            setDate(selected.toISOString().split('T')[0]);
            // Reset other fields for new booking
            setCustomerId('');
            setServiceId('');
            setStaffId('');
            setTime('09:00');
            setIsRecurring(false);
            setRecurrenceRule('weekly');
            const nextMonth = new Date(selected);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            setRecurrenceEndDate(nextMonth.toISOString().split('T')[0]);
        }
    }
  }, [initialBookingData, initialDate, isOpen]);
  
  const availableStaff = useMemo(() => {
    if (!serviceId) {
        return staff;
    }
    const selectedService = services.find(s => s.id === serviceId);
    if (!selectedService || !selectedService.staffIds || selectedService.staffIds.length === 0) {
        return staff; // Fallback to all staff if service has no specific staff assigned
    }
    return staff.filter(s => selectedService.staffIds.includes(s.id));
  }, [serviceId, services, staff]);

  const handleServiceChange = (newServiceId: string) => {
    setServiceId(newServiceId);
    const selectedService = services.find(s => s.id === newServiceId);
    if (staffId && selectedService?.staffIds && selectedService.staffIds.length > 0 && !selectedService.staffIds.includes(staffId)) {
      setStaffId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !serviceId || !staffId || !date || !time) return;
    if (isRecurring && !recurrenceEndDate) {
        addToast('Please provide an end date for the recurring booking.', 'error');
        return;
    }

    setIsSubmitting(true);
    
    // --- Conflict Detection Logic ---
    const selectedService = services.find(s => s.id === serviceId);
    const selectedStaffMember = staff.find(s => s.id === staffId);
    if (!selectedService || !selectedStaffMember) {
      addToast('Selected service or staff not found.', 'error');
      setIsSubmitting(false);
      return;
    }

    const startTimeObj = new Date(`${date}T${time}`);
    const endTimeObj = new Date(startTimeObj.getTime() + selectedService.duration_minutes * 60000);

    // 1. Check against staff working hours
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][startTimeObj.getDay()] as keyof StaffSchedule;
    const staffDaySchedule = selectedStaffMember.schedule[dayOfWeek];

    if (!staffDaySchedule.is_working) {
        addToast(`${selectedStaffMember.full_name} is not working on this day.`, 'error');
        setIsSubmitting(false);
        return;
    }

    const workStartTime = new Date(`${date}T${staffDaySchedule.start_time}`);
    const workEndTime = new Date(`${date}T${staffDaySchedule.end_time}`);

    if (startTimeObj < workStartTime || endTimeObj > workEndTime) {
        addToast(`Booking is outside of ${selectedStaffMember.full_name}'s working hours (${staffDaySchedule.start_time} - ${staffDaySchedule.end_time}).`, 'error');
        setIsSubmitting(false);
        return;
    }

    // 2. Check against time off
    for (const off of timeOff) {
        if (off.staff_id === staffId || off.staff_id === 'all') {
            const offStart = new Date(off.start_at).getTime();
            const offEnd = new Date(off.end_at).getTime();
            if (startTimeObj.getTime() < offEnd && endTimeObj.getTime() > offStart) {
                addToast(`${selectedStaffMember.full_name} is on time off during this period.`, 'error');
                setIsSubmitting(false);
                return;
            }
        }
    }

    // 3. Check for overlapping bookings
    const staffBookings = bookings.filter(b => b.staff.id === staffId && b.id !== initialBookingData?.id);
    const newBookingStart = startTimeObj.getTime();
    const newBookingEnd = endTimeObj.getTime();

    for (const existingBooking of staffBookings) {
        const existingStart = new Date(existingBooking.start_at).getTime();
        const existingEnd = new Date(existingBooking.end_at).getTime();

        if (newBookingStart < existingEnd && newBookingEnd > existingStart) {
            addToast(`This time slot conflicts with an existing booking for ${selectedStaffMember?.full_name}.`, 'error');
            setIsSubmitting(false);
            return;
        }
    }
    // --- End of Conflict Detection ---

    await onSubmit({ 
        id: initialBookingData?.id, 
        customerId, 
        serviceId, 
        staffId,
        date, 
        time,
        ...(isRecurring && { recurrenceRule, recurrenceEndDate })
    });
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!initialBookingData) return;
    setIsSubmitting(true);
    await onDelete(initialBookingData.id);
  }

  const isFormValid = customerId && serviceId && staffId && date && time && (!isRecurring || recurrenceEndDate);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit Booking" : "New Booking"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
          <select
            id="customer"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          >
            <option value="" disabled>Select a customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="service" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Service</label>
          <select
            id="service"
            value={serviceId}
            onChange={(e) => handleServiceChange(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          >
            <option value="" disabled>Select a service</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="staff" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Staff</label>
          <select
            id="staff"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
            disabled={!serviceId}
          >
            <option value="" disabled>Select a staff member</option>
            {availableStaff.map(s => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
            <input
              type="time"
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
        </div>
        {!isEditMode && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center">
              <input type="checkbox" id="isRecurring" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="isRecurring" className="ml-3 block text-sm font-medium text-gray-900 dark:text-gray-200">Repeat this booking</label>
            </div>
            {isRecurring && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="recurrenceRule" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
                  <select id="recurrenceRule" value={recurrenceRule} onChange={e => setRecurrenceRule(e.target.value as any)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                 <div>
                  <label htmlFor="recurrenceEndDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                  <input type="date" id="recurrenceEndDate" value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                </div>
              </div>
            )}
          </div>
        )}
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
                        Cancel Booking
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
                            Confirm Cancellation
                        </button>
                        <button type="button" onClick={() => setIsConfirmingDelete(false)} className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
                            Nevermind
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
                    {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Booking')}
                </button>
            </div>
        </div>
      </form>
    </Modal>
  );
};

export default BookingFormModal;
