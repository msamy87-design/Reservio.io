import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useToast } from './ToastContext';
import * as api from '../services/api';
import { Booking, Customer, Service, Staff, NewBookingData, NewCustomerData, NewServiceData, NewStaffData, StaffSchedule, MarketingCampaign, CustomerAudience, NewCampaignData, NewAudienceData, TimeOff, NewTimeOffData, Review, ReviewStatus, BookingStatus, Product, NewProductData, Transaction, NewTransactionData, BulkImportResult, WaitlistEntry } from '../types';

interface DataState {
  bookings: Booking[];
  customers: Customer[];
  services: Service[];
  staff: Staff[];
  campaigns: MarketingCampaign[];
  audiences: CustomerAudience[];
  timeOff: TimeOff[];
  reviews: Review[];
  products: Product[];
  transactions: Transaction[];
  waitlist: WaitlistEntry[];
}

interface DataContextType extends DataState {
  loading: boolean;
  error: Error | null;
  createBooking: (data: NewBookingData) => Promise<Booking[] | void>;
  updateBooking: (id: string, data: Partial<NewBookingData & { status: BookingStatus }>, optimistic?: boolean) => Promise<Booking | void>;
  deleteBooking: (id: string) => Promise<void>;
  createCustomer: (data: NewCustomerData) => Promise<Customer | void>;
  updateCustomer: (id: string, data: Partial<NewCustomerData>) => Promise<Customer | void>;
  deleteCustomer: (id: string) => Promise<void>;
  createService: (data: NewServiceData) => Promise<Service | void>;
  updateService: (id: string, data: NewServiceData) => Promise<Service | void>;
  deleteService: (id: string) => Promise<void>;
  createStaff: (data: NewStaffData) => Promise<Staff | void>;
  updateStaff: (id: string, data: NewStaffData) => Promise<Staff | void>;
  deleteStaff: (id: string) => Promise<void>;
  updateStaffSchedule: (id: string, schedule: StaffSchedule) => Promise<Staff | void>;
  createCampaign: (data: NewCampaignData) => Promise<MarketingCampaign | void>;
  updateCampaign: (id: string, data: Partial<NewCampaignData>) => Promise<MarketingCampaign | void>;
  deleteCampaign: (id: string) => Promise<void>;
  sendCampaign: (id: string) => Promise<void>;
  createAudience: (data: NewAudienceData) => Promise<CustomerAudience | void>;
  updateAudience: (id: string, data: NewAudienceData) => Promise<CustomerAudience | void>;
  deleteAudience: (id: string) => Promise<void>;
  createTimeOff: (data: NewTimeOffData) => Promise<TimeOff | void>;
  deleteTimeOff: (id: string) => Promise<void>;
  updateReviewStatus: (id: string, status: ReviewStatus) => Promise<Review | void>;
  createProduct: (data: NewProductData) => Promise<Product | void>;
  updateProduct: (id: string, data: NewProductData) => Promise<Product | void>;
  deleteProduct: (id: string) => Promise<void>;
  createProductsBulk: (data: NewProductData[]) => Promise<BulkImportResult | void>;
  createTransaction: (data: NewTransactionData) => Promise<Transaction | void>;
  deleteWaitlistEntry: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const sortBookings = (bookings: Booking[]) => bookings.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DataState>({
    bookings: [],
    customers: [],
    services: [],
    staff: [],
    campaigns: [],
    audiences: [],
    timeOff: [],
    reviews: [],
    products: [],
    transactions: [],
    waitlist: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { addToast } = useToast();

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookings, customers, services, staff, campaigns, audiences, timeOff, reviews, products, transactions, waitlist] = await Promise.all([
        api.fetchBookings(),
        api.fetchCustomers(),
        api.fetchServices(),
        api.fetchStaff(),
        api.fetchCampaigns(),
        api.fetchAudiences(),
        api.fetchTimeOff(),
        api.fetchReviews(),
        api.fetchProducts(),
        api.fetchTransactions(),
        api.fetchWaitlist(),
      ]);
      const sorted = sortBookings(bookings);
      setState({ bookings: sorted, customers, services, staff, campaigns, audiences, timeOff, reviews, products, transactions, waitlist });
    } catch (e) {
      setError(e as Error);
      addToast('Failed to load business data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const contextValue = {
    ...state,
    loading,
    error,
    createBooking: async (data: NewBookingData) => {
        try {
            const newBookings = await api.createBooking(data);
            setState(s => ({...s, bookings: sortBookings([...s.bookings, ...newBookings])}));
            addToast(newBookings.length > 1 ? `${newBookings.length} recurring bookings created.` : 'Booking created successfully.', 'success');
            return newBookings;
        } catch (e) {
            addToast('Failed to create booking.', 'error'); throw e;
        }
    },
    updateBooking: async (id: string, data: Partial<NewBookingData & { status: BookingStatus }>, optimistic: boolean = false) => {
        const originalBookings = state.bookings;
        if (optimistic) {
            const customer = data.customerId ? state.customers.find(c => c.id === data.customerId) : originalBookings.find(b=>b.id === id)?.customer;
            const service = data.serviceId ? state.services.find(s => s.id === data.serviceId) : originalBookings.find(b=>b.id === id)?.service;
            const staffMember = data.staffId ? state.staff.find(st => st.id === data.staffId) : originalBookings.find(b=>b.id === id)?.staff;
            
            if(customer && service && staffMember) {
                 const optimisticUpdate = { 
                    ...originalBookings.find(b => b.id === id)!, 
                    start_at: data.startTime!,
                    customer: { id: customer.id, full_name: customer.full_name },
                    service: { id: service.id, name: service.name, duration_minutes: service.duration_minutes },
                    staff: { id: staffMember.id, full_name: staffMember.full_name },
                 };
                setState(s => ({ ...s, bookings: sortBookings(s.bookings.map(b => b.id === id ? optimisticUpdate : b))}));
            }
        }
        try {
            const updatedBooking = await api.updateBooking(id, data);
            setState(s => ({...s, bookings: sortBookings(s.bookings.map(b => b.id === id ? updatedBooking : b))}));
            // After successful update, we might need to refetch reviews if a booking was completed
            if (data.status === 'completed') {
                const reviews = await api.fetchReviews();
                const services = await api.fetchServices();
                const staff = await api.fetchStaff();
                setState(s => ({ ...s, reviews, services, staff }));
            }

            addToast('Booking updated successfully.', 'success');
            return updatedBooking;
        } catch (e) {
            setState(s => ({...s, bookings: originalBookings})); // Revert on error
            addToast(`Failed to update booking.`, 'error'); throw e;
        }
    },
    deleteBooking: async (id: string) => {
        try {
            await api.deleteBooking(id);
            setState(s => ({...s, bookings: s.bookings.filter(b => b.id !== id)}));
            addToast('Booking cancelled successfully.', 'success');
        } catch (e) {
            addToast('Failed to cancel booking.', 'error'); throw e;
        }
    },
    createCustomer: async (data: NewCustomerData) => {
        try {
            const newCustomer = await api.createCustomer(data);
            setState(s => ({...s, customers: [...s.customers, newCustomer]}));
            addToast('Customer created successfully.', 'success');
            return newCustomer;
        } catch (e) {
            addToast('Failed to create customer.', 'error'); throw e;
        }
    },
    updateCustomer: async (id: string, data: Partial<NewCustomerData>) => {
        try {
            const updatedCustomer = await api.updateCustomer(id, data);
            setState(s => ({...s, customers: s.customers.map(c => c.id === id ? updatedCustomer : c)}));
            addToast('Customer updated successfully.', 'success');
            return updatedCustomer;
        } catch (e) {
            addToast('Failed to update customer.', 'error'); throw e;
        }
    },
    deleteCustomer: async (id: string) => {
        try {
            await api.deleteCustomer(id);
            setState(s => ({...s, customers: s.customers.filter(c => c.id !== id)}));
            addToast('Customer deleted successfully.', 'success');
        } catch (e) {
            addToast('Failed to delete customer.', 'error'); throw e;
        }
    },
    createService: async (data: NewServiceData) => {
        try {
            const newService = await api.createService(data);
            setState(s => ({...s, services: [...s.services, newService]}));
            addToast('Service created successfully.', 'success');
            return newService;
        } catch (e) {
            addToast('Failed to create service.', 'error'); throw e;
        }
    },
    updateService: async (id: string, data: NewServiceData) => {
        try {
            const updatedService = await api.updateService(id, data);
            setState(s => ({...s, services: s.services.map(srv => srv.id === id ? updatedService : srv)}));
            addToast('Service updated successfully.', 'success');
            return updatedService;
        } catch (e) {
            addToast('Failed to update service.', 'error'); throw e;
        }
    },
    deleteService: async (id: string) => {
        try {
            await api.deleteService(id);
            setState(s => ({...s, services: s.services.filter(srv => srv.id !== id)}));
            addToast('Service deleted successfully.', 'success');
        } catch (e) {
            addToast('Failed to delete service.', 'error'); throw e;
        }
    },
    createStaff: async (data: NewStaffData) => {
        try {
            const newStaff = await api.createStaff(data);
            setState(s => ({...s, staff: [...s.staff, newStaff]}));
            addToast('Staff member added successfully.', 'success');
            return newStaff;
        } catch (e) {
            addToast('Failed to add staff member.', 'error'); throw e;
        }
    },
    updateStaff: async (id: string, data: NewStaffData) => {
        try {
            const updatedStaff = await api.updateStaff(id, data);
            setState(s => ({...s, staff: s.staff.map(st => st.id === id ? updatedStaff : st)}));
            addToast('Staff member updated successfully.', 'success');
            return updatedStaff;
        } catch (e) {
            addToast('Failed to update staff member.', 'error'); throw e;
        }
    },
    deleteStaff: async (id: string) => {
        try {
            await api.deleteStaff(id);
            setState(s => ({...s, staff: s.staff.filter(st => st.id !== id)}));
            addToast('Staff member deleted successfully.', 'success');
        } catch (e) {
            addToast('Failed to delete staff member.', 'error'); throw e;
        }
    },
    updateStaffSchedule: async (id: string, schedule: StaffSchedule) => {
        try {
            const updatedStaff = await api.updateStaffSchedule(id, schedule);
            setState(s => ({...s, staff: s.staff.map(st => st.id === id ? updatedStaff : st)}));
            addToast('Schedule updated successfully.', 'success');
            return updatedStaff;
        } catch (e) {
            addToast('Failed to update schedule.', 'error'); throw e;
        }
    },
    createCampaign: async (data: NewCampaignData) => {
        try {
            const newCampaign = await api.createCampaign(data);
            setState(s => ({...s, campaigns: [...s.campaigns, newCampaign]}));
            addToast('Campaign created successfully.', 'success');
            return newCampaign;
        } catch (e) {
            addToast('Failed to create campaign.', 'error'); throw e;
        }
    },
    updateCampaign: async (id: string, data: Partial<NewCampaignData>) => {
        try {
            const updatedCampaign = await api.updateCampaign(id, data);
            setState(s => ({...s, campaigns: s.campaigns.map(c => c.id === id ? updatedCampaign : c)}));
            addToast('Campaign updated successfully.', 'success');
            return updatedCampaign;
        } catch (e) {
            addToast('Failed to update campaign.', 'error'); throw e;
        }
    },
    deleteCampaign: async (id: string) => {
        try {
            await api.deleteCampaign(id);
            setState(s => ({...s, campaigns: s.campaigns.filter(c => c.id !== id)}));
            addToast('Campaign deleted successfully.', 'success');
        } catch (e) {
            addToast('Failed to delete campaign.', 'error'); throw e;
        }
    },
    sendCampaign: async (id: string) => {
        try {
            const sentCampaign = await api.sendCampaign(id);
            setState(s => ({...s, campaigns: s.campaigns.map(c => c.id === id ? sentCampaign : c)}));
            addToast('Campaign sent successfully!', 'success');
        } catch (e) {
            addToast('Failed to send campaign.', 'error'); throw e;
        }
    },
    createAudience: async (data: NewAudienceData) => {
        try {
            const newAudience = await api.createAudience(data);
            setState(s => ({...s, audiences: [...s.audiences, newAudience]}));
            addToast('Audience created successfully.', 'success');
            return newAudience;
        } catch (e) {
            addToast('Failed to create audience.', 'error'); throw e;
        }
    },
    updateAudience: async (id: string, data: NewAudienceData) => {
        try {
            const updatedAudience = await api.updateAudience(id, data);
            setState(s => ({...s, audiences: s.audiences.map(a => a.id === id ? updatedAudience : a)}));
            addToast('Audience updated successfully.', 'success');
            return updatedAudience;
        } catch (e) {
            addToast('Failed to update audience.', 'error'); throw e;
        }
    },
    deleteAudience: async (id: string) => {
        try {
            await api.deleteAudience(id);
            setState(s => ({...s, audiences: s.audiences.filter(a => a.id !== id)}));
            addToast('Audience deleted successfully.', 'success');
        } catch (e) {
            addToast('Failed to delete audience.', 'error'); throw e;
        }
    },
    createTimeOff: async (data: NewTimeOffData) => {
        try {
            const newTimeOff = await api.createTimeOff(data);
            setState(s => ({...s, timeOff: [...s.timeOff, newTimeOff]}));
            addToast('Time off added successfully.', 'success');
            return newTimeOff;
        } catch (e) {
            addToast('Failed to add time off.', 'error'); throw e;
        }
    },
    deleteTimeOff: async (id: string) => {
        try {
            await api.deleteTimeOff(id);
            setState(s => ({...s, timeOff: s.timeOff.filter(t => t.id !== id)}));
            addToast('Time off removed successfully.', 'success');
        } catch (e) {
            addToast('Failed to remove time off.', 'error'); throw e;
        }
    },
    updateReviewStatus: async (id: string, status: ReviewStatus) => {
        try {
            const updatedReview = await api.updateReviewStatus(id, status);
            setState(s => ({...s, reviews: s.reviews.map(r => r.id === id ? updatedReview : r)}));
            addToast('Review status updated.', 'success');
            return updatedReview;
        } catch (e) {
            addToast('Failed to update review status.', 'error'); throw e;
        }
    },
    createProduct: async (data: NewProductData) => {
        try {
            const newProduct = await api.createProduct(data);
            setState(s => ({...s, products: [...s.products, newProduct]}));
            addToast('Product created successfully.', 'success');
            return newProduct;
        } catch (e) {
            addToast('Failed to create product.', 'error'); throw e;
        }
    },
    updateProduct: async (id: string, data: NewProductData) => {
        try {
            const updatedProduct = await api.updateProduct(id, data);
            setState(s => ({...s, products: s.products.map(p => p.id === id ? updatedProduct : p)}));
            addToast('Product updated successfully.', 'success');
            return updatedProduct;
        } catch (e) {
            addToast('Failed to update product.', 'error'); throw e;
        }
    },
    deleteProduct: async (id: string) => {
        try {
            await api.deleteProduct(id);
            setState(s => ({...s, products: s.products.filter(p => p.id !== id)}));
            addToast('Product deleted successfully.', 'success');
        } catch (e) {
            addToast('Failed to delete product.', 'error'); throw e;
        }
    },
    createProductsBulk: async (data: NewProductData[]) => {
        try {
            const result = await api.createProductsBulk(data);
            setState(s => ({ ...s, products: [...s.products, ...result.createdProducts] }));
            addToast(`${result.successCount} products imported successfully. ${result.errorCount > 0 ? `${result.errorCount} failed.` : ''}`, 'success');
            return result;
        } catch (e) {
            addToast('Bulk import failed.', 'error'); throw e;
        }
    },
    createTransaction: async (data: NewTransactionData) => {
        try {
            const { transaction, updatedProducts } = await api.createTransaction(data);
            setState(s => ({
                ...s, 
                transactions: [...s.transactions, transaction],
                products: s.products.map(p => updatedProducts.find(up => up.id === p.id) || p)
            }));
            addToast('Transaction recorded successfully.', 'success');
            return transaction;
        } catch (e) {
            addToast('Failed to record transaction.', 'error'); throw e;
        }
    },
    deleteWaitlistEntry: async (id: string) => {
        try {
            await api.deleteWaitlistEntry(id);
            setState(s => ({ ...s, waitlist: s.waitlist.filter(entry => entry.id !== id) }));
            addToast('Waitlist entry removed.', 'success');
        } catch (e) {
            addToast('Failed to remove waitlist entry.', 'error'); throw e;
        }
    },
  };

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};