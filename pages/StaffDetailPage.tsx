
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { ArrowLeftIcon } from '../components/Icons';
import StarRating from '../components/StarRating';
import { DayOfWeek } from '../types';

const StaffDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { staff, bookings, loading } = useData();

    const staffMember = useMemo(() => staff.find(s => s.id === id), [staff, id]);

    const staffBookings = useMemo(() => {
        return bookings
            .filter(b => b.staff.id === id)
            .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());
    }, [bookings, id]);
    
    const daysOfWeek: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    if (loading) {
        return <div className="text-center p-8">Loading staff details...</div>;
    }

    if (!staffMember) {
        return <div className="text-center p-8">Staff member not found.</div>;
    }

    const formatTime = (time: string): string => {
        if (!time) return '';
        const [hour, minute] = time.split(':');
        const hourNum = parseInt(hour, 10);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const formattedHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
        return `${formattedHour}:${minute} ${ampm}`;
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const formatTimeDate = (dateString: string) => new Date(dateString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });


    return (
        <>
            <div className="mb-6">
                <button onClick={() => navigate('/biz/staff')} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to Staff
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    {/* Staff Info Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{staffMember.full_name}</h2>
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{staffMember.role}</p>
                        <div className="mt-2 flex items-center">
                           <StarRating rating={staffMember.average_rating} />
                           <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({staffMember.review_count} reviews)</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 text-sm">
                            <p className="text-gray-500 dark:text-gray-400">{staffMember.email}</p>
                            <p className="text-gray-500 dark:text-gray-400">{staffMember.phone}</p>
                        </div>
                    </div>

                    {/* Schedule Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Weekly Schedule</h3>
                        <div className="space-y-2">
                           {daysOfWeek.map(day => {
                                const daySchedule = staffMember.schedule[day];
                                return (
                                    <div key={day} className="flex justify-between items-center text-sm">
                                    <span className="capitalize font-medium text-gray-800 dark:text-gray-200">{day}</span>
                                    {daySchedule.is_working ? (
                                        <span className="text-gray-700 dark:text-gray-300 font-mono">
                                        {formatTime(daySchedule.start_time)} - {formatTime(daySchedule.end_time)}
                                        </span>
                                    ) : (
                                        <span className="text-red-500 dark:text-red-400 font-semibold">Day Off</span>
                                    )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Booking History */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Booking History</h3>
                    <div className="overflow-x-auto max-h-[60vh]">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Date</th>
                                    <th scope="col" className="px-4 py-3">Time</th>
                                    <th scope="col" className="px-4 py-3">Service</th>
                                    <th scope="col" className="px-4 py-3">Customer</th>
                                    <th scope="col" className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staffBookings.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8">No bookings found for this staff member.</td></tr>
                                ) : (
                                    staffBookings.map(booking => (
                                        <tr key={booking.id} className="border-b dark:border-gray-700">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{formatDate(booking.start_at)}</td>
                                            <td className="px-4 py-3">{formatTimeDate(booking.start_at)}</td>
                                            <td className="px-4 py-3">{booking.service.name}</td>
                                            <td className="px-4 py-3">{booking.customer.full_name}</td>
                                            <td className="px-4 py-3 capitalize">{booking.status}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StaffDetailPage;
