import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, NewCustomerData } from '../types';
import CustomerFormModal from '../components/CustomerFormModal';
import { PlusIcon, SearchIcon } from '../components/Icons';
import Pagination from '../components/Pagination';
import { useData } from '../contexts/DataContext';

const ITEMS_PER_PAGE = 10;

const CustomersPage: React.FC = () => {
  const { customers, loading: isLoading, createCustomer, updateCustomer, deleteCustomer } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer =>
      customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveCustomer = async (data: NewCustomerData) => {
    try {
      await createCustomer(data);
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save customer:", error);
    }
  };

  return (
    <>
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Customers</h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400">View and manage your customer list.</p>
          </div>
           <div className="flex w-full sm:w-auto items-center gap-4">
            <div className="relative flex-grow sm:flex-grow-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Name</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">Phone</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-gray-500 dark:text-gray-400">
                      Loading customers...
                    </td>
                  </tr>
                ) : paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-gray-500 dark:text-gray-400">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map(customer => (
                    <tr 
                        key={customer.id} 
                        className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                        onClick={() => navigate(`/biz/customers/${customer.id}`)}
                    >
                      <td className="px-6 py-4 font-medium text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {customer.full_name}
                      </td>
                      <td className="px-6 py-4">
                        {customer.email}
                      </td>
                      <td className="px-6 py-4">
                        {customer.phone}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage} 
              />
          )}
        </div>
      </div>
      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSaveCustomer}
        initialCustomerData={null}
      />
    </>
  );
};

export default CustomersPage;