
import React, { useState, useMemo } from 'react';
import { Service, NewServiceData } from '../types';
import ServiceFormModal from '../components/ServiceFormModal';
import { PlusIcon, SearchIcon, StarIcon } from '../components/Icons';
import Pagination from '../components/Pagination';
import StarRating from '../components/StarRating';
import { useData } from '../contexts/DataContext';

const ITEMS_PER_PAGE = 10;

const ServicesPage: React.FC = () => {
  const { services, staff, loading: isLoading, createService, updateService, deleteService } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredServices = useMemo(() => {
    return services.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [services, searchTerm]);

  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);

  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredServices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredServices, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleOpenModal = (service: Service | null = null) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setIsModalOpen(false);
  };

  const handleSaveService = async (data: NewServiceData, id?: string) => {
    try {
      if (id) {
        await updateService(id, data);
      } else {
        await createService(data);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save service:", error);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await deleteService(serviceId);
      handleCloseModal();
    } catch (error) {
      console.error("Failed to delete service:", error);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  return (
    <>
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Services</h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Manage the services your business offers.</p>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-4">
            <div className="relative flex-grow sm:flex-grow-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={() => handleOpenModal()}
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
                  <th scope="col" className="px-6 py-3">Rating</th>
                  <th scope="col" className="px-6 py-3">Duration</th>
                  <th scope="col" className="px-6 py-3">Price</th>
                  <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10">Loading services...</td>
                  </tr>
                ) : paginatedServices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10">No services found. Create your first service to get started.</td>
                  </tr>
                ) : (
                  paginatedServices.map(service => (
                    <tr key={service.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{service.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                           <StarRating rating={service.average_rating} />
                           <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({service.review_count})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{service.duration_minutes} min</td>
                      <td className="px-6 py-4">{formatCurrency(service.price, service.currency)}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleOpenModal(service)} className="font-medium text-indigo-600 dark:text-indigo-500 hover:underline">
                          Edit
                        </button>
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

      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSaveService}
        onDelete={handleDeleteService}
        initialServiceData={selectedService}
        staff={staff}
      />
    </>
  );
};

export default ServicesPage;