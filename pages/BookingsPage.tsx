
import React, { useState, useMemo } from 'react';
import { Booking, NewBookingData, TimeOff, NewTimeOffData, Transaction } from '../types';
import Calendar from '../components/Calendar';
import BookingFormModal from '../components/BookingFormModal';
import TimeOffFormModal from '../components/TimeOffFormModal';
import PosModal from '../components/PosModal';
import { PlusIcon, CalendarDaysIcon } from '../components/Icons';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

type ModalState = {
  booking?: Booking;
  date?: Date;
}

export type CalendarView = 'month' | 'week' | 'day';

const BookingsPage: React.FC = () => {
  const { 
    bookings, 
    customers, 
    services, 
    staff,
    timeOff,
    products,
    loading: isLoading,
    createBooking,
    updateBooking,
    deleteBooking,
    createTimeOff,
    createTransaction,
  } = useData();
  const { currentUser } = useAuth();

  const isStylist = currentUser?.role === 'Stylist' || currentUser?.role === 'Assistant';
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedStaffId, setSelectedStaffId] = useState<string>(isStylist ? currentUser!.staffId : 'all');
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalInitialState, setModalInitialState] = useState<ModalState | null>(null);

  const [isTimeOffModalOpen, setIsTimeOffModalOpen] = useState(false);
  
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [bookingForCheckout, setBookingForCheckout] = useState<Booking | null>(null);

  const handleDateSelect = (date: Date) => {
    setModalInitialState({ date });
    setIsFormModalOpen(true);
  };
  
  const handleBookingClick = (booking: Booking) => {
    setModalInitialState({ booking });
    setIsFormModalOpen(true);
  };
  
  const handleCheckoutClick = (booking: Booking) => {
    setBookingForCheckout(booking);
    setIsPosModalOpen(true);
  };

  const handleModalClose = () => {
    setIsFormModalOpen(false);
    setModalInitialState(null);
  };

  const handleSaveBooking = async (data: {id?: string, customerId: string, serviceId: string, staffId: string, date: string, time: string, recurrenceRule?: 'weekly' | 'monthly', recurrenceEndDate?: string}) => {
    const { id, date: dateString, time, recurrenceRule, recurrenceEndDate, ...rest } = data;
    const startTime = new Date(`${dateString}T${time}`).toISOString();
    const payload: NewBookingData = { ...rest, startTime, recurrenceRule: recurrenceRule || null, recurrenceEndDate: recurrenceEndDate || null };
    
    try {
      if (id) {
        await updateBooking(id, payload);
      } else {
        await createBooking(payload);
      }
      handleModalClose();
    } catch (error) {
      console.error("Failed to save booking:", error);
      // Toast is handled in context
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
        await deleteBooking(bookingId);
        handleModalClose();
    } catch (error) {
        console.error("Failed to delete booking:", error);
    }
  };

  const handleBookingDrop = async (bookingId: string, newDate: Date) => {
    const originalBooking = bookings.find(b => b.id === bookingId);
    if (!originalBooking) return;

    const originalDay = new Date(originalBooking.start_at).toDateString();
    if (originalDay === newDate.toDateString()) return;

    const originalStartDate = new Date(originalBooking.start_at);
    
    const newStartDate = new Date(newDate);
    newStartDate.setHours(
        originalStartDate.getHours(), 
        originalStartDate.getMinutes(), 
        originalStartDate.getSeconds(), 
        originalStartDate.getMilliseconds()
    );

    const payload = {
        customerId: originalBooking.customer.id,
        serviceId: originalBooking.service.id,
        staffId: originalBooking.staff.id,
        startTime: newStartDate.toISOString(),
    };
        
    try {
        await updateBooking(bookingId, payload, true); // Pass true for optimistic update
    } catch (error) {
        console.error("Failed to update booking via drag-and-drop:", error);
    }
  };

  const handleSaveTimeOff = async (data: NewTimeOffData) => {
    try {
      await createTimeOff(data);
      setIsTimeOffModalOpen(false);
    } catch (error) {
      console.error("Failed to save time off:", error);
    }
  };

  const filteredBookings = useMemo(() => {
    if (selectedStaffId === 'all') {
      return bookings;
    }
    return bookings.filter(booking => booking.staff.id === selectedStaffId);
  }, [bookings, selectedStaffId]);

  const filteredTimeOff = useMemo(() => {
    if (selectedStaffId === 'all') {
      return timeOff;
    }
    return timeOff.filter(t => t.staff_id === selectedStaffId || t.staff_id === 'all');
  }, [timeOff, selectedStaffId]);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    filteredBookings.forEach(booking => {
      const dateKey = new Date(booking.start_at).toDateString();
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(booking);
    });
    return map;
  }, [filteredBookings]);

  const timeOffByDate = useMemo(() => {
    const map = new Map<string, TimeOff[]>();
    filteredTimeOff.forEach(t => {
      let currentDate = new Date(t.start_at);
      const endDate = new Date(t.end_at);
      
      while(currentDate <= endDate) {
        const dateKey = currentDate.toDateString();
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(t);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    return map;
  }, [filteredTimeOff]);

  const ViewSwitcher: React.FC<{ currentView: CalendarView, onChange: (view: CalendarView) => void }> = ({ currentView, onChange }) => {
    const views: CalendarView[] = ['month', 'week', 'day'];
    return (
      <div className="inline-flex rounded-md shadow-sm" role="group">
        {views.map((v, index) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`px-4 py-2 text-sm font-medium ${
              v === currentView
                ? 'bg-indigo-600 text-white z-10 ring-2 ring-indigo-500'
                : 'bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
            } ${index === 0 ? 'rounded-l-lg' : ''} ${index === views.length - 1 ? 'rounded-r-lg' : ''} border border-gray-200 dark:border-gray-600 focus:z-10 focus:ring-2 focus:ring-indigo-500`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Bookings Calendar</h2>
          <p className="mt-1 text-gray-600 dark:text-gray-400">View and manage your appointments.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="sm:w-48">
              <label htmlFor="staff-filter" className="sr-only">Filter by Staff</label>
              <select
                  id="staff-filter"
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  disabled={isStylist}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                  <option value="all">All Staff</option>
                  {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
              </select>
          </div>
          <button
            onClick={() => setIsTimeOffModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            title="Add Time Off"
          >
            <CalendarDaysIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDateSelect(new Date())}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="hidden sm:inline">New Booking</span>
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg shadow-md">
        <div className="mb-4 ml-2"><ViewSwitcher currentView={view} onChange={setView} /></div>
        {isLoading ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">Loading calendar...</div>
        ) : (
          <Calendar 
            view={view}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            bookingsByDate={bookingsByDate}
            timeOffByDate={timeOffByDate}
            onDateSelect={handleDateSelect}
            onBookingClick={handleBookingClick}
            onCheckoutClick={handleCheckoutClick}
            onBookingDrop={handleBookingDrop}
          />
        )}
      </div>

      {isFormModalOpen && (
        <BookingFormModal
            isOpen={isFormModalOpen}
            onClose={handleModalClose}
            onSubmit={handleSaveBooking}
            onDelete={handleDeleteBooking}
            initialBookingData={modalInitialState?.booking ?? null}
            initialDate={modalInitialState?.date ?? null}
            customers={customers}
            services={services}
            staff={staff}
            bookings={bookings}
            timeOff={timeOff}
        />
      )}
      <TimeOffFormModal
        isOpen={isTimeOffModalOpen}
        onClose={() => setIsTimeOffModalOpen(false)}
        onSubmit={handleSaveTimeOff}
        staffList={staff}
      />
      {bookingForCheckout && (
        <PosModal
          isOpen={isPosModalOpen}
          onClose={() => setIsPosModalOpen(false)}
          booking={bookingForCheckout}
          services={services}
          products={products}
          onSubmit={createTransaction}
        />
      )}
    </>
  );
};

export default BookingsPage;