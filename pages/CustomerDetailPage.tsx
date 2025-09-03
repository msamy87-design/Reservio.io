
import React, { useState, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Customer, Booking, NewCustomerData } from '../types';
import { ArrowLeftIcon, PencilIcon } from '../components/Icons';
import CustomerFormModal from '../components/CustomerFormModal';

const CustomerDetailPage: React.FC = () => {
    const { id } = ReactRouterDOM.useParams<{ id: string }>();
    const navigate = ReactRouterDOM.useNavigate();
    const { customers, bookings, loading, updateCustomer } = useData();

    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notes, setNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const customer = useMemo(() => customers.find(c => c.id === id), [customers, id]);
    
    useEffect(() => {
        if (customer) {
            setNotes(customer.notes || '');
        }
    }, [customer]);

    const customerBookings = useMemo(() => {
        return bookings
            .filter(b => b.customer.id === id)
            .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());
    }, [bookings, id]);

    if (loading) {
        return <div className="text-center p-8">Loading customer details...</div>;
    }

    if (!customer) {
        return <div className="text-center p-8">Customer not found.</div>;
    }

    const handleSaveNotes = async () => {
        setIsSavingNotes(true);
        await updateCustomer(customer.id, { notes });
        setIsSavingNotes(false);
        setIsEditingNotes(false);
    };
    
    const handleSaveCustomerDetails = async (data: NewCustomerData, customerId?: string) => {
        if (!customerId) return;
        await updateCustomer(customerId, data);
        setIsEditModalOpen(false);
    };

    const totalSpent = useMemo(() => {
        // In a real app, price would be stored on the booking record.
        // Here we can't calculate it without services data. For simplicity, we'll omit it.
        return "N/A";
    }, [customerBookings]);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <div className="mb-6">
                <button onClick={() => navigate('/customers')} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to Customers
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    {/* Customer Info Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-start">
                             <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{customer.full_name}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{customer.phone}</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(true)} className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <PencilIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-around text-center">
                            <div>
                                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{customerBookings.length}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Total Bookings</p>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{formatDate(customerBookings[customerBookings.length - 1]?.start_at || '')}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">First Booking</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Notes Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Notes</h3>
                            {!isEditingNotes && (
                                <button onClick={() => setIsEditingNotes(true)} className="text-sm font-medium text-indigo-600 hover:underline">
                                    Edit
                                </button>
                            )}
                        </div>
                        {isEditingNotes ? (
                            <div>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={5}
                                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                                <div className="mt-2 flex justify-end gap-2">
                                    <button onClick={() => { setIsEditingNotes(false); setNotes(customer.notes); }} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded-md">Cancel</button>
                                    <button onClick={handleSaveNotes} disabled={isSavingNotes} className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md disabled:bg-indigo-400">
                                        {isSavingNotes ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap min-h-[5rem]">
                                {notes || <span className="text-gray-400">No notes added for this customer.</span>}
                            </p>
                        )}
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
                                    <th scope="col" className="px-4 py-3">Staff</th>
                                    <th scope="col" className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customerBookings.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8">No bookings found.</td></tr>
                                ) : (
                                    customerBookings.map(booking => (
                                        <tr key={booking.id} className="border-b dark:border-gray-700">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{formatDate(booking.start_at)}</td>
                                            <td className="px-4 py-3">{formatTime(booking.start_at)}</td>
                                            <td className="px-4 py-3">{booking.service.name}</td>
                                            <td className="px-4 py-3">{booking.staff.full_name}</td>
                                            <td className="px-4 py-3 capitalize">{booking.status}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <CustomerFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleSaveCustomerDetails}
                initialCustomerData={customer}
            />
        </>
    );
};

export default CustomerDetailPage;