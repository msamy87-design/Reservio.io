
import React, { useState, useMemo } from 'react';
import { Staff, NewStaffData, StaffSchedule } from '../types';
import StaffFormModal from '../components/StaffFormModal';
import StaffScheduleModal from '../components/StaffScheduleModal';
import ViewScheduleModal from '../components/ViewScheduleModal';
import { PlusIcon, ClockIcon, SearchIcon, EyeIcon } from '../components/Icons';
import Pagination from '../components/Pagination';
import StarRating from '../components/StarRating';
import { useData } from '../contexts/DataContext';

const ITEMS_PER_PAGE = 10;

const StaffPage: React.FC = () => {
  const { staff, loading: isLoading, createStaff, updateStaff, deleteStaff, updateStaffSchedule } = useData();
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedStaffForSchedule, setSelectedStaffForSchedule] = useState<Staff | null>(null);

  const [isViewScheduleModalOpen, setIsViewScheduleModalOpen] = useState(false);
  const [staffToView, setStaffToView] = useState<Staff | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const roles: Staff['role'][] = ['Stylist', 'Manager', 'Assistant', 'Owner'];

  const filteredStaff = useMemo(() => {
    return staff
      .filter(staffMember => 
        roleFilter === 'all' || staffMember.role === roleFilter
      )
      .filter(staffMember =>
        staffMember.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staffMember.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [staff, searchTerm, roleFilter]);

  const totalPages = Math.ceil(filteredStaff.length / ITEMS_PER_PAGE);

  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStaff.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStaff, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleOpenFormModal = (staffMember: Staff | null = null) => {
    setSelectedStaff(staffMember);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setSelectedStaff(null);
    setIsFormModalOpen(false);
  };
  
  const handleOpenScheduleModal = (staffMember: Staff) => {
    setSelectedStaffForSchedule(staffMember);
    setIsScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setSelectedStaffForSchedule(null);
    setIsScheduleModalOpen(false);
  };

  const handleOpenViewScheduleModal = (staffMember: Staff) => {
    setStaffToView(staffMember);
    setIsViewScheduleModalOpen(true);
  };

  const handleCloseViewScheduleModal = () => {
    setStaffToView(null);
    setIsViewScheduleModalOpen(false);
  };

  const handleSaveStaff = async (data: NewStaffData, id?: string) => {
    try {
      if (id) {
        await updateStaff(id, data);
      } else {
        await createStaff(data);
      }
      handleCloseFormModal();
    } catch (error) {
      console.error("Failed to save staff member:", error);
    }
  };
  
  const handleSaveSchedule = async (staffId: string, schedule: StaffSchedule) => {
    try {
        await updateStaffSchedule(staffId, schedule);
        handleCloseScheduleModal();
    } catch (error) {
        console.error("Failed to save schedule:", error);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    try {
      await deleteStaff(staffId);
      handleCloseFormModal();
    } catch (error) {
      console.error("Failed to delete staff member:", error);
    }
  };

  return (
    <>
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Staff Management</h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Manage your team members and their schedules.</p>
          </div>
          <button
            onClick={() => handleOpenFormModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="hidden sm:inline">New Staff Member</span>
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="w-full sm:w-48">
             <label htmlFor="role-filter" className="sr-only">Filter by role</label>
             <select 
               id="role-filter"
               value={roleFilter}
               onChange={handleRoleChange}
               className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
             >
                <option value="all">All Roles</option>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
             </select>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Name</th>
                  <th scope="col" className="px-6 py-3">Role</th>
                  <th scope="col" className="px-6 py-3">Rating</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10">Loading staff...</td>
                  </tr>
                ) : paginatedStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10">No staff members found matching your criteria.</td>
                  </tr>
                ) : (
                  paginatedStaff.map(staffMember => (
                    <tr key={staffMember.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{staffMember.full_name}</td>
                      <td className="px-6 py-4">{staffMember.role}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <StarRating rating={staffMember.average_rating} />
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({staffMember.review_count})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{staffMember.email}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-4">
                            <button onClick={() => handleOpenViewScheduleModal(staffMember)} className="inline-flex items-center gap-1.5 font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-500 hover:underline">
                                <EyeIcon className="h-4 w-4" />
                                <span className="hidden lg:inline">View Schedule</span>
                            </button>
                             <button onClick={() => handleOpenScheduleModal(staffMember)} className="inline-flex items-center gap-1.5 font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-500 hover:underline">
                                <ClockIcon className="h-4 w-4" />
                                <span className="hidden lg:inline">Edit Schedule</span>
                            </button>
                            <button onClick={() => handleOpenFormModal(staffMember)} className="font-medium text-indigo-600 dark:text-indigo-500 hover:underline">
                                Edit
                            </button>
                        </div>
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

      <StaffFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSubmit={handleSaveStaff}
        onDelete={handleDeleteStaff}
        initialStaffData={selectedStaff}
      />

      {selectedStaffForSchedule && (
        <StaffScheduleModal
            isOpen={isScheduleModalOpen}
            onClose={handleCloseScheduleModal}
            onSubmit={handleSaveSchedule}
            staff={selectedStaffForSchedule}
        />
      )}

      {staffToView && (
        <ViewScheduleModal
          isOpen={isViewScheduleModalOpen}
          onClose={handleCloseViewScheduleModal}
          staff={staffToView}
        />
      )}
    </>
  );
};

export default StaffPage;