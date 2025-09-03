
import React, { useMemo } from 'react';
import { Booking } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

const StatCard: React.FC<{ title: string; value: string | number; isLoading: boolean }> = ({ title, value, isLoading }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
    {isLoading ? (
      <div className="mt-2 h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
    ) : (
      <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{value}</p>
    )}
  </div>
);


const DashboardPage: React.FC = () => {
  const { bookings, customers, services, loading: isLoading } = useData();
  const { currentUser } = useAuth();

  const isPrivilegedUser = currentUser?.role === 'Owner' || currentUser?.role === 'Manager';

  const todaysBookingsCount = useMemo(() => {
    const today = new Date().toDateString();
    let userBookings = bookings;
    if (!isPrivilegedUser) {
        userBookings = bookings.filter(b => b.staff.id === currentUser?.staffId);
    }
    return userBookings.filter(b => new Date(b.start_at).toDateString() === today).length;
  }, [bookings, isPrivilegedUser, currentUser]);

  const totalCustomers = useMemo(() => customers.length, [customers]);

  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const revenue = bookings
      .filter(b => {
        const bookingDate = new Date(b.start_at);
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
      })
      .reduce((total, booking) => {
        const service = services.find(s => s.id === booking.service.id);
        return total + (service?.price || 0);
      }, 0);
    
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(revenue);
  }, [bookings, services]);
  
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
     let userBookings = bookings;
    if (!isPrivilegedUser) {
        userBookings = bookings.filter(b => b.staff.id === currentUser?.staffId);
    }
    return userBookings
      .filter(b => {
        const bookingDate = new Date(b.start_at);
        return bookingDate.toDateString() === todayStr && bookingDate >= now;
      })
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }, [bookings, isPrivilegedUser, currentUser]);

  const formatTime = (isoString: string) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">Welcome to your Reservio business portal.</p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Today's Bookings" value={todaysBookingsCount} isLoading={isLoading} />
        {isPrivilegedUser && (
            <>
                <StatCard title="Total Customers" value={totalCustomers} isLoading={isLoading} />
                <StatCard title="Revenue (This Month)" value={monthlyRevenue} isLoading={isLoading} />
            </>
        )}
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Upcoming Appointments</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Your schedule for the rest of today.</p>
        <div className="mt-4 flow-root">
          {isLoading ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading appointments...</div>
          ) : upcomingAppointments.length > 0 ? (
            <ul role="list" className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
              {upcomingAppointments.map(booking => (
                <li key={booking.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                        {booking.service.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                        with {booking.customer.full_name}
                      </p>
                    </div>
                     <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
                       <p>{booking.staff.full_name}</p>
                       <p>{formatTime(booking.start_at)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
             <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No more appointments for today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;