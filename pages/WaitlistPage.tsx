import React from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';

const WaitlistPage: React.FC = () => {
  const { waitlist, services, loading, deleteWaitlistEntry } = useData();
  const { addToast } = useToast();

  const getServiceName = (serviceId: string) => {
    return services.find(s => s.id === serviceId)?.name || 'Unknown Service';
  };

  const handleNotify = (customerName: string) => {
    addToast(`Simulated notification sent to ${customerName}.`, 'success');
  };

  const handleDelete = (id: string, customerName: string) => {
    if (window.confirm(`Are you sure you want to remove ${customerName} from the waitlist?`)) {
      deleteWaitlistEntry(id);
    }
  };

  const formatDate = (dateString: string) => {
    // Add a day to the date to correct for potential timezone issues in display
    const date = new Date(dateString);
    const correctedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
    return correctedDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Waitlist</h2>
      <p className="mt-1 text-gray-600 dark:text-gray-400">Manage customers waiting for an appointment.</p>

      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Date Joined</th>
                <th scope="col" className="px-6 py-3">Customer</th>
                <th scope="col" className="px-6 py-3">Service</th>
                <th scope="col" className="px-6 py-3">Desired Date</th>
                <th scope="col" className="px-6 py-3">Preferred Time</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10">Loading waitlist...</td></tr>
              ) : waitlist.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10">No customers on the waitlist.</td></tr>
              ) : (
                waitlist.map(entry => (
                  <tr key={entry.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-6 py-4">{formatDate(entry.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{entry.customerName}</div>
                      <div className="text-xs text-gray-500">{entry.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4">{getServiceName(entry.serviceId)}</td>
                    <td className="px-6 py-4">{formatDate(entry.date)}</td>
                    <td className="px-6 py-4 capitalize">{entry.preferredTimeRange}</td>
                    <td className="px-6 py-4 space-x-4">
                      <button 
                        onClick={() => handleNotify(entry.customerName)}
                        className="font-medium text-indigo-600 dark:text-indigo-500 hover:underline"
                      >
                        Notify
                      </button>
                      <button 
                        onClick={() => handleDelete(entry.id, entry.customerName)}
                        className="font-medium text-red-600 dark:text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WaitlistPage;