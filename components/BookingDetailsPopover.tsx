import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Booking, BookingStatus } from '../types';
import { useData } from '../contexts/DataContext';

interface BookingDetailsPopoverProps {
  booking: Booking;
  targetRect: DOMRect;
  onClose: () => void;
  onEdit: (booking: Booking) => void;
  onCheckout: (booking: Booking) => void;
}

const statusOptions: BookingStatus[] = ['confirmed', 'completed', 'cancelled'];
const statusColors: Record<BookingStatus, string> = {
  confirmed: 'text-blue-600 dark:text-blue-400',
  completed: 'text-green-600 dark:text-green-400',
  cancelled: 'text-red-600 dark:text-red-400',
  pending: 'text-yellow-600 dark:text-yellow-400',
};

const getRiskInfo = (score: number | undefined | null) => {
    if (score === null || score === undefined) return null;
    if (score >= 7) return { label: 'High', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/50' };
    if (score >= 4) return { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/50' };
    return { label: 'Low', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/50' };
}

const BookingDetailsPopover: React.FC<BookingDetailsPopoverProps> = ({
  booking,
  targetRect,
  onClose,
  onEdit,
  onCheckout,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { updateBooking } = useData();
  const [currentStatus, setCurrentStatus] = useState(booking.status);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  const popoverStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${targetRect.bottom + window.scrollY + 8}px`,
    left: `${targetRect.left + window.scrollX}px`,
    zIndex: 1000,
  };
  
  const formatTime = (isoString: string) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as BookingStatus;
    setCurrentStatus(newStatus);
    try {
        await updateBooking(booking.id, { status: newStatus });
    } catch(error) {
        // Revert on failure
        setCurrentStatus(booking.status);
    }
  };
  
  const handleCheckout = () => {
    onCheckout(booking);
    onClose();
  };

  const riskInfo = getRiskInfo(booking.noShowRiskScore);

  return ReactDOM.createPortal(
    <div
      ref={popoverRef}
      style={popoverStyle}
      className="w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in-fast"
      onClick={(e) => e.stopPropagation()}
    >
        <div className="p-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{booking.service.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatTime(booking.start_at)} - {formatTime(booking.end_at)}
            </p>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Customer</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{booking.customer.full_name}</p>
                </div>
                 <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Staff</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{booking.staff.full_name}</p>
                </div>
                 <div>
                    <label htmlFor="booking-status" className="text-xs font-semibold text-gray-500 dark:text-gray-400">Status</label>
                     <select 
                        id="booking-status" 
                        value={currentStatus}
                        onChange={handleStatusChange}
                        className={`mt-1 block w-full pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white capitalize ${statusColors[currentStatus]}`}
                    >
                         {statusOptions.map(status => (
                            <option key={status} value={status} className="capitalize text-gray-800 dark:text-white">{status}</option>
                         ))}
                    </select>
                </div>
                {riskInfo && (
                    <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">AI No-Show Risk</p>
                        <p className={`text-sm font-medium ${riskInfo.color}`}>
                            {riskInfo.label} ({booking.noShowRiskScore}/10)
                        </p>
                    </div>
                )}
            </div>
        </div>
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
             <button
                type="button"
                onClick={() => onEdit(booking)}
                className="px-3 py-1.5 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            >
                Edit Booking
            </button>
            {booking.status === 'completed' && !booking.transaction_id && (
                 <button
                    type="button"
                    onClick={handleCheckout}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Checkout
                </button>
            )}
            {booking.transaction_id && (
                 <span className="px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400">Paid</span>
            )}
        </div>
        <style>{`
          @keyframes fade-in-fast {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in-fast {
            animation: fade-in-fast 0.1s ease-out;
          }
        `}</style>
    </div>,
    document.body
  );
};

export default BookingDetailsPopover;