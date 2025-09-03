
import React, { useState } from 'react';
import { Booking, TimeOff } from '../types';
import { CalendarView } from '../pages/BookingsPage';
import BookingDetailsPopover from './BookingDetailsPopover';

// #region Helper Functions
const getWeekDays = (date: Date): Date[] => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(day.getDate() + i);
    return day;
  });
};

const getMonthDays = (date: Date): Date[] => {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startOfMonth.getDay());
  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endOfMonth.getDay()));

  const calendarDays = [];
  let day = new Date(startDate);
  while (day <= endDate) {
    calendarDays.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }
  return calendarDays;
};
// #endregion

interface DraggableProps {
    draggedBooking: Booking | null;
    onDragStart: (e: React.DragEvent, booking: Booking) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, date: Date) => void;
}

// #region Sub-components
const BookingPill: React.FC<{ booking: Booking, onClick: (e: React.MouseEvent, booking: Booking) => void, onDragStart: (e: React.DragEvent, booking: Booking) => void, onDragEnd: (e: React.DragEvent) => void, showCustomer?: boolean, isDragged: boolean }> = ({ booking, onClick, onDragStart, onDragEnd, showCustomer = false, isDragged }) => {
  const handleBookingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(e, booking);
  };

  return (
    <button
      onClick={handleBookingClick}
      draggable
      onDragStart={(e) => onDragStart(e, booking)}
      onDragEnd={onDragEnd}
      className={`w-full text-left p-1.5 mb-1 bg-indigo-100 dark:bg-indigo-900/50 rounded-md text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-opacity ${isDragged ? 'opacity-40 border-2 border-dashed border-indigo-500' : 'cursor-grab'}`}
    >
      <div className="text-xs font-semibold truncate">
        {new Date(booking.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} {booking.service.name}
      </div>
      <div className="text-xs text-indigo-500 dark:text-indigo-400 truncate">{booking.staff.full_name}</div>
      {showCustomer && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{booking.customer.full_name}</div>}
    </button>
  );
};

const TimeOffPill: React.FC<{ timeOff: TimeOff }> = ({ timeOff }) => (
    <div className="w-full text-left p-1.5 mb-1 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300">
        <div className="text-xs font-semibold truncate">Time Off</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{timeOff.reason}</div>
    </div>
);

type ViewProps = Pick<CalendarProps, 'currentDate' | 'bookingsByDate' | 'timeOffByDate' | 'onDateSelect' | 'onBookingClick' | 'onCheckoutClick'> & DraggableProps & { onPillClick: (e: React.MouseEvent, booking: Booking) => void };

const MonthView: React.FC<ViewProps> = ({ currentDate, bookingsByDate, timeOffByDate, onDateSelect, onPillClick, draggedBooking, ...dragHandlers }) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = getMonthDays(currentDate);
  const today = new Date();

  return (
    <>
      <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-600 dark:text-gray-300 border-t border-l border-b border-gray-200 dark:border-gray-700">
        {daysOfWeek.map(day => (
          <div key={day} className="py-2 border-r border-gray-200 dark:border-gray-700">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-b border-r border-gray-200 dark:border-gray-700">
        {calendarDays.map((date, index) => {
          const dateKey = date.toDateString();
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isToday = dateKey === today.toDateString();
          const dayBookings = bookingsByDate.get(dateKey) || [];
          const dayTimeOff = timeOffByDate.get(dateKey) || [];
          
          return (
            <div
              key={index}
              onClick={() => onDateSelect(date)}
              onDragOver={dragHandlers.onDragOver}
              onDrop={(e) => dragHandlers.onDrop(e, date)}
              className={`relative flex flex-col h-28 sm:h-32 p-1 sm:p-2 border-t border-l border-gray-200 dark:border-gray-700 transition-colors duration-200 ${
                isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-400'
              } ${draggedBooking ? 'hover:bg-indigo-50 dark:hover:bg-gray-700/50' : 'cursor-pointer'}`}
            >
              <div className={`text-xs sm:text-sm self-end ${isToday ? 'bg-indigo-600 text-white rounded-full h-6 w-6 flex items-center justify-center' : ''}`}>
                {date.getDate()}
              </div>
              <div className="mt-1 flex-grow overflow-y-auto pr-1">
                {dayTimeOff.map(t => <TimeOffPill key={t.id} timeOff={t} />)}
                {dayBookings.map(booking => <BookingPill key={booking.id} booking={booking} onClick={onPillClick} onDragStart={dragHandlers.onDragStart} onDragEnd={dragHandlers.onDragEnd} isDragged={draggedBooking?.id === booking.id} />)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const WeekView: React.FC<ViewProps> = ({ currentDate, bookingsByDate, timeOffByDate, onDateSelect, onPillClick, draggedBooking, ...dragHandlers }) => {
  const weekDays = getWeekDays(currentDate);
  const today = new Date();
  const timelineHours = Array.from({ length: 16 }, (_, i) => 7 + i); // 7 AM to 10 PM

  const renderTimeOff = (timeOff: TimeOff) => {
    const start = new Date(timeOff.start_at);
    const end = new Date(timeOff.end_at);
    
    let startMinutes = (start.getHours() - 7) * 60 + start.getMinutes();
    let endMinutes = (end.getHours() - 7) * 60 + end.getMinutes();

    // Clamp to the visible timeline
    startMinutes = Math.max(0, startMinutes);
    endMinutes = Math.min(16 * 60, endMinutes);
    
    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes <= 0) return null;

    const top = startMinutes * (4 / 60);
    const height = durationMinutes * (4 / 60);

    return (
        <div
          key={timeOff.id}
          className="absolute left-1 right-1 p-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 z-0 text-left opacity-75"
          style={{ top: `${top}rem`, height: `${height}rem` }}
        >
          <p className="text-xs font-bold truncate">Time Off</p>
          <p className="text-xs truncate">{timeOff.reason}</p>
        </div>
    );
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Week Header */}
      <div className="flex">
        <div className="w-14 flex-shrink-0" />
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map(day => (
            <div key={day.toISOString()} className="text-center p-2 border-l border-b border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">{day.toLocaleString('default', { weekday: 'short' }).toUpperCase()}</div>
              <div className={`text-xl sm:text-2xl font-bold mt-1 ${day.toDateString() === today.toDateString() ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-100'}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Timeline Body */}
      <div className="h-[75vh] overflow-y-auto">
        <div className="flex relative">
          {/* Time Gutter */}
          <div className="w-14 flex-shrink-0 text-right pr-2">
            {timelineHours.map(hour => (
              <div key={hour} className="h-16 relative -top-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {hour === 12 ? '12 PM' : (hour > 12 ? `${hour-12} PM` : `${hour} AM`)}
                </span>
              </div>
            ))}
          </div>
          
          {/* Day Columns */}
          <div className="flex-1 grid grid-cols-7">
            {weekDays.map(day => {
              const dayKey = day.toDateString();
              const dayBookings = bookingsByDate.get(dayKey) || [];
              const dayTimeOff = timeOffByDate.get(dayKey) || [];
              
              return (
                <div 
                  key={dayKey} 
                  className="relative border-l border-gray-200 dark:border-gray-700"
                  onDragOver={dragHandlers.onDragOver}
                  onDrop={(e) => dragHandlers.onDrop(e, day)}
                >
                  {/* Hour lines */}
                  {timelineHours.map(hour => (
                    <div key={hour} className="h-16 border-b border-gray-200 dark:border-gray-700" onClick={() => onDateSelect(day)} />
                  ))}
                  
                  {/* Time Off Blocks */}
                  {dayTimeOff.map(t => renderTimeOff(t))}

                  {/* Bookings */}
                  {dayBookings.map(booking => {
                    const start = new Date(booking.start_at);
                    const end = new Date(booking.end_at);
                    const durationMinutes = (end.getTime() - start.getTime()) / 60000;
                    
                    const minutesFrom7Am = (start.getHours() - 7) * 60 + start.getMinutes();
                    
                    // Each hour is h-16 (4rem). 1 minute = 4rem / 60.
                    const top = minutesFrom7Am * (4 / 60);
                    const height = durationMinutes * (4 / 60);

                    const isDragged = draggedBooking?.id === booking.id;

                    return (
                       <button
                          key={booking.id}
                          onClick={(e) => onPillClick(e, booking)}
                          draggable
                          onDragStart={(e) => dragHandlers.onDragStart(e, booking)}
                          onDragEnd={dragHandlers.onDragEnd}
                          className={`absolute left-1 right-1 p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-md text-indigo-800 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 z-10 text-left transition-opacity ${isDragged ? 'opacity-40 border-2 border-dashed border-indigo-500' : 'cursor-grab'}`}
                          style={{
                            top: `${top}rem`,
                            height: `${height}rem`,
                          }}
                        >
                          <p className="text-xs font-bold truncate">{booking.service.name}</p>
                          <p className="text-xs truncate">{booking.customer.full_name}</p>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 truncate">{booking.staff.full_name}</p>
                        </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const DayView: React.FC<ViewProps> = ({ currentDate, bookingsByDate, onDateSelect, onPillClick, draggedBooking, ...dragHandlers }) => {
  const dayBookings = bookingsByDate.get(currentDate.toDateString()) || [];
  
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 h-[60vh] min-h-[500px] overflow-y-auto" onClick={() => onDateSelect(currentDate)}>
      {dayBookings.length > 0 ? dayBookings.map(booking => 
        <BookingPill key={booking.id} booking={booking} onClick={onPillClick} onDragStart={dragHandlers.onDragStart} onDragEnd={dragHandlers.onDragEnd} showCustomer isDragged={draggedBooking?.id === booking.id} />
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-8">No bookings for this day.</div>
      )}
    </div>
  );
};

// #endregion

interface CalendarProps {
  view: CalendarView;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  bookingsByDate: Map<string, Booking[]>;
  timeOffByDate: Map<string, TimeOff[]>;
  onDateSelect: (date: Date) => void;
  onBookingClick: (booking: Booking) => void;
  onCheckoutClick: (booking: Booking) => void;
  onBookingDrop: (bookingId: string, newDate: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ view, currentDate, onDateChange, onBookingDrop, onBookingClick, onCheckoutClick, ...props }) => {
  const [draggedBooking, setDraggedBooking] = useState<Booking | null>(null);
  const [popoverState, setPopoverState] = useState<{ booking: Booking; targetRect: DOMRect } | null>(null);

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };
  
  const handleToday = () => {
    onDateChange(new Date());
  };

  const formatHeaderTitle = (): string => {
    if (view === 'month') {
      return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    if (view === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const startMonth = start.toLocaleString('default', { month: 'short' });
      const endMonth = end.toLocaleString('default', { month: 'short' });
      
      if (start.getFullYear() !== end.getFullYear()) {
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      }
      if (startMonth === endMonth) {
        return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
    }
    return currentDate.toLocaleString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const handleDragStart = (e: React.DragEvent, booking: Booking) => {
    setPopoverState(null); // Close popover when dragging starts
    e.dataTransfer.setData('bookingId', booking.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
        setDraggedBooking(booking);
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedBooking(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
      e.preventDefault();
      const bookingId = e.dataTransfer.getData('bookingId');
      if (bookingId && draggedBooking) {
          onBookingDrop(bookingId, date);
      }
      setDraggedBooking(null);
  };
  
  const handlePillClick = (e: React.MouseEvent, booking: Booking) => {
    const target = e.currentTarget as HTMLElement;
    setPopoverState({ booking, targetRect: target.getBoundingClientRect() });
  };

  const ViewComponent = {
    month: MonthView,
    week: WeekView,
    day: DayView
  }[view];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-4">
          <button onClick={handlePrev} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={handleNext} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
           <button 
             onClick={handleToday}
             className="px-4 py-1.5 text-sm font-medium bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 rounded-md border border-gray-200 dark:border-gray-600 shadow-sm"
           >
            Today
          </button>
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 text-center">
          {formatHeaderTitle()}
        </h2>
        <div className="w-28 hidden sm:block"></div> {/* Spacer to balance the header */}
      </div>

      <ViewComponent 
        currentDate={currentDate} 
        {...props} 
        onBookingClick={onBookingClick}
        onCheckoutClick={onCheckoutClick}
        onPillClick={handlePillClick}
        draggedBooking={draggedBooking}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />

      {popoverState && (
        <BookingDetailsPopover
            booking={popoverState.booking}
            targetRect={popoverState.targetRect}
            onClose={() => setPopoverState(null)}
            onEdit={(bookingToEdit) => {
                onBookingClick(bookingToEdit);
                setPopoverState(null);
            }}
            onCheckout={onCheckoutClick}
        />
      )}
    </div>
  );
};

export default Calendar;