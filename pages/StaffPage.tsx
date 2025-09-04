
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Staff, StaffSchedule } from '../types';
import StaffFormModal from '../components/StaffFormModal';
import StaffScheduleModal from '../components/StaffScheduleModal';
import ViewScheduleModal from '../components/ViewScheduleModal';
import { PlusIcon, SearchIcon, StarIcon } from '../components/Icons';
import Pagination from '../components/Pagination';
import StarRating from '../components/StarRating';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';

const ITEMS_PER_PAGE = 10;

const StaffPage: React.FC = () => {
  const { staff, loading: isLoading, createStaff, updateStaff, deleteStaff, updateStaffSchedule } = useData();
  const { addToast } = useToast();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isViewScheduleModalOpen, setIsViewScheduleModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const filteredStaff = useMemo(() => {
    return staff.filter(s =>
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staff, searchTerm]);

  const totalPages = Math.ceil(filteredStaff.length / ITEMS_PER_PAGE);

  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStaff.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStaff, currentPage]);

  const handleOpenFormModal = (staffMember: Staff | null = null) => {
    setSelectedStaff(staffMember);
    setIsFormModalOpen(true);
  };
  
  const handleOpenScheduleModal = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsScheduleModalOpen(true);
  };
  
  const handleOpenViewScheduleModal = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsViewScheduleModalOpen(true);
  }

  const handleCloseModals = () => {
    setSelectedStaff(null);
    setIsFormModalOpen(false);
    setIsScheduleModalOpen(false);
    setIsViewScheduleModalOpen(false);
  };

  const handleSaveStaff = async (data: any, id?: string) => {
    try {
      if (id) {
        await updateStaff(id, data);
      } else {
        await createStaff(data);
      }
      handleCloseModals();
    } catch (error) {
      console.error("Failed to save staff:", error);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      await deleteStaff(id);
      handleCloseModals();
    } catch (error) {
      console.error("Failed to delete staff:", error);
    }
  };

  const handleSaveSchedule = async (staffId: string, schedule: StaffSchedule) => {
    try {
        await updateStaffSchedule(staffId, schedule);
        handleCloseModals();
    } catch(e) {
        console.error("Failed to update schedule:", e);
    }
  };

  return (
    <>
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Staff</h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Manage your staff members and their schedules.</p>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-4">
            <div className="relative flex-grow sm:flex-grow-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={() => handleOpenFormModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="hidden sm:inline">New Member</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Name</th>
                  <th scope="col" className="px-6 py-3">Role</th>
                  <th scope="col" className="px-6 py-3">Rating</th>
                  <th scope="col" className="px-6 py-3">Contact</th>
                  <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-10">Loading staff...</td></tr>
                ) : paginatedStaff.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10">No staff members found.</td></tr>
                ) : (
                  paginatedStaff.map(s => (
                    <tr key={s.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white" onClick={() => navigate(`/biz/staff/${s.id}`)}>{s.full_name}</td>
                      <td className="px-6 py-4">{s.role}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                           <StarRating rating={s.average_rating} />
                           <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({s.review_count})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{s.email}</td>
                      <td className="px-6 py-4 text-right space-x-4">
                        <button onClick={() => handleOpenScheduleModal(s)} className="font-medium text-indigo-600 dark:text-indigo-500 hover:underline">Edit Schedule</button>
                        <button onClick={() => handleOpenFormModal(s)} className="font-medium text-indigo-600 dark:text-indigo-500 hover:underline">Edit Details</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
        </div>
      </div>

      {isFormModalOpen && (
        <StaffFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseModals}
          onSubmit={handleSaveStaff}
          onDelete={handleDeleteStaff}
          initialStaffData={selectedStaff}
        />
      )}
      
      {isScheduleModalOpen && selectedStaff && (
        <StaffScheduleModal
            isOpen={isScheduleModalOpen}
            onClose={handleCloseModals}
            onSubmit={handleSaveSchedule}
            staff={selectedStaff}
        />
      )}

      {isViewScheduleModalOpen && selectedStaff && (
          <ViewScheduleModal 
            isOpen={isViewScheduleModalOpen}
            onClose={handleCloseModals}
            staff={selectedStaff}
          />
      )}
    </>
  );
};

export default StaffPage;
