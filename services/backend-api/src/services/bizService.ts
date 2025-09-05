// Business service layer for business dashboard operations
import { 
    mockBookings, 
    mockCustomers, 
    mockServices, 
    mockStaff, 
    mockBusinessSettings,
    mockCampaigns,
    mockAudiences,
    mockTimeOff,
    mockReviews,
    mockProducts,
    mockTransactions,
    mockWaitlist
} from '../data/mockData';
import { 
    BookingStatus, 
    ReviewStatus, 
    NewBookingData, 
    NewCustomerData, 
    NewServiceData, 
    NewStaffData, 
    NewCampaignData,
    NewAudienceData,
    NewTimeOffData,
    NewProductData,
    NewTransactionData
} from '../../../../types';

// API Key Management
export const getApiKeys = async (businessId: string) => {
    // Mock API keys for business
    return [
        { id: 'key_1', name: 'Production API', key: 'pk_test_***', created_at: new Date().toISOString() },
        { id: 'key_2', name: 'Development API', key: 'pk_dev_***', created_at: new Date().toISOString() }
    ];
};

export const generateApiKey = async (name: string) => {
    return { 
        id: `key_${crypto.randomUUID()}`, 
        name, 
        key: `pk_${crypto.randomUUID()}`, 
        created_at: new Date().toISOString() 
    };
};

export const revokeApiKey = async (keyId: string) => {
    console.log(`[bizService] Revoking API key: ${keyId}`);
    return { success: true };
};

// Business Settings
export const getBusinessSettings = async (businessId: string) => {
    return mockBusinessSettings[businessId] || {
        profile: { name: '', email: '', phone: '', address: '' },
        payment_settings: { deposit_type: 'none', deposit_value: 0 },
        notification_settings: { 
            new_booking_alerts: true,
            cancellation_alerts: true,
            reminder_emails: true,
            review_request_emails: true
        },
        no_show_prevention: { enabled: false, high_risk_deposit_amount: 0 }
    };
};

export const updateBusinessSettings = async (businessId: string, settings: any) => {
    mockBusinessSettings[businessId] = { ...mockBusinessSettings[businessId], ...settings };
    return mockBusinessSettings[businessId];
};

// Booking Management
export const getBookings = async (businessId: string) => {
    return mockBookings.filter(b => b.business?.id === businessId);
};

export const createBooking = async (businessId: string, data: NewBookingData) => {
    const newBooking = {
        id: crypto.randomUUID(),
        ...data,
        business: { id: businessId, name: 'Business Name' },
        status: 'confirmed' as BookingStatus
    };
    mockBookings.push(newBooking);
    return newBooking;
};

export const updateBooking = async (bookingId: string, data: Partial<NewBookingData & { status: BookingStatus }>) => {
    const index = mockBookings.findIndex(b => b.id === bookingId);
    if (index === -1) throw new Error('Booking not found');
    
    mockBookings[index] = { ...mockBookings[index], ...data };
    return mockBookings[index];
};

export const deleteBooking = async (bookingId: string) => {
    const index = mockBookings.findIndex(b => b.id === bookingId);
    if (index === -1) throw new Error('Booking not found');
    
    const booking = mockBookings[index];
    mockBookings.splice(index, 1);
    return booking;
};

// Customer Management
export const getCustomers = async (businessId: string) => {
    return mockCustomers.filter(c => c.businessId === businessId);
};

export const createCustomer = async (data: NewCustomerData) => {
    const newCustomer = {
        id: crypto.randomUUID(),
        ...data,
        stats: {
            total_bookings: 0,
            completed_bookings: 0,
            no_shows: 0,
            cancellations: 0,
            total_spent: 0,
            average_rating_given: 0
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    mockCustomers.push(newCustomer);
    return newCustomer;
};

export const updateCustomer = async (customerId: string, data: Partial<NewCustomerData>) => {
    const index = mockCustomers.findIndex(c => c.id === customerId);
    if (index === -1) throw new Error('Customer not found');
    
    mockCustomers[index] = { ...mockCustomers[index], ...data, updatedAt: new Date() };
    return mockCustomers[index];
};

export const deleteCustomer = async (customerId: string) => {
    const index = mockCustomers.findIndex(c => c.id === customerId);
    if (index === -1) throw new Error('Customer not found');
    
    const customer = mockCustomers[index];
    mockCustomers.splice(index, 1);
    return customer;
};

// Service Management
export const getServices = async (businessId: string) => {
    return mockServices.filter(s => s.businessId === businessId);
};

export const createService = async (data: NewServiceData) => {
    const newService = {
        id: crypto.randomUUID(),
        ...data,
        stats: {
            total_bookings: 0,
            completed_bookings: 0,
            revenue_generated: 0,
            average_rating: 0,
            review_count: 0
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    mockServices.push(newService);
    return newService;
};

export const updateService = async (serviceId: string, data: NewServiceData) => {
    const index = mockServices.findIndex(s => s.id === serviceId);
    if (index === -1) throw new Error('Service not found');
    
    mockServices[index] = { ...mockServices[index], ...data, updatedAt: new Date() };
    return mockServices[index];
};

export const deleteService = async (serviceId: string) => {
    const index = mockServices.findIndex(s => s.id === serviceId);
    if (index === -1) throw new Error('Service not found');
    
    const service = mockServices[index];
    mockServices.splice(index, 1);
    return service;
};

// Staff Management
export const getStaff = async (businessId: string) => {
    return mockStaff.filter(s => s.businessId === businessId);
};

export const createStaff = async (data: NewStaffData) => {
    const newStaff = {
        id: crypto.randomUUID(),
        ...data,
        stats: {
            total_bookings: 0,
            completed_bookings: 0,
            no_shows: 0,
            cancellations: 0,
            average_rating: 0,
            total_reviews: 0,
            revenue_generated: 0
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    mockStaff.push(newStaff);
    return newStaff;
};

export const updateStaff = async (staffId: string, data: NewStaffData) => {
    const index = mockStaff.findIndex(s => s.id === staffId);
    if (index === -1) throw new Error('Staff not found');
    
    mockStaff[index] = { ...mockStaff[index], ...data, updatedAt: new Date() };
    return mockStaff[index];
};

export const deleteStaff = async (staffId: string) => {
    const index = mockStaff.findIndex(s => s.id === staffId);
    if (index === -1) throw new Error('Staff not found');
    
    const staff = mockStaff[index];
    mockStaff.splice(index, 1);
    return staff;
};

export const updateStaffSchedule = async (staffId: string, schedule: any) => {
    const index = mockStaff.findIndex(s => s.id === staffId);
    if (index === -1) throw new Error('Staff not found');
    
    mockStaff[index] = { ...mockStaff[index], schedule, updatedAt: new Date() };
    return mockStaff[index];
};

// Campaign Management
export const getCampaigns = async (businessId: string) => {
    return mockCampaigns.filter(c => c.businessId === businessId);
};

export const createCampaign = async (data: NewCampaignData) => {
    const newCampaign = {
        id: crypto.randomUUID(),
        ...data,
        stats: { sent: 0, delivered: 0, opened: 0, clicked: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    mockCampaigns.push(newCampaign);
    return newCampaign;
};

export const updateCampaign = async (campaignId: string, data: Partial<NewCampaignData>) => {
    const index = mockCampaigns.findIndex(c => c.id === campaignId);
    if (index === -1) throw new Error('Campaign not found');
    
    mockCampaigns[index] = { ...mockCampaigns[index], ...data, updatedAt: new Date().toISOString() };
    return mockCampaigns[index];
};

export const deleteCampaign = async (campaignId: string) => {
    const index = mockCampaigns.findIndex(c => c.id === campaignId);
    if (index === -1) throw new Error('Campaign not found');
    
    const campaign = mockCampaigns[index];
    mockCampaigns.splice(index, 1);
    return campaign;
};

export const sendCampaign = async (campaignId: string) => {
    const campaign = mockCampaigns.find(c => c.id === campaignId);
    if (!campaign) throw new Error('Campaign not found');
    
    // Simulate sending campaign
    campaign.status = 'sent';
    campaign.stats = { sent: 100, delivered: 95, opened: 25, clicked: 5 };
    campaign.updatedAt = new Date().toISOString();
    
    return campaign;
};

// Audience Management
export const getAudiences = async (businessId: string) => {
    return mockAudiences.filter(a => a.businessId === businessId);
};

export const createAudience = async (data: NewAudienceData) => {
    const newAudience = {
        id: crypto.randomUUID(),
        ...data,
        customerCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    mockAudiences.push(newAudience);
    return newAudience;
};

export const updateAudience = async (audienceId: string, data: NewAudienceData) => {
    const index = mockAudiences.findIndex(a => a.id === audienceId);
    if (index === -1) throw new Error('Audience not found');
    
    mockAudiences[index] = { ...mockAudiences[index], ...data, updatedAt: new Date().toISOString() };
    return mockAudiences[index];
};

export const deleteAudience = async (audienceId: string) => {
    const index = mockAudiences.findIndex(a => a.id === audienceId);
    if (index === -1) throw new Error('Audience not found');
    
    const audience = mockAudiences[index];
    mockAudiences.splice(index, 1);
    return audience;
};

// Time Off Management
export const getTimeOff = async (businessId: string) => {
    return mockTimeOff.filter(t => t.businessId === businessId);
};

export const createTimeOff = async (data: NewTimeOffData) => {
    const newTimeOff = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date().toISOString()
    };
    mockTimeOff.push(newTimeOff);
    return newTimeOff;
};

export const deleteTimeOff = async (timeOffId: string) => {
    const index = mockTimeOff.findIndex(t => t.id === timeOffId);
    if (index === -1) throw new Error('Time off entry not found');
    
    const timeOff = mockTimeOff[index];
    mockTimeOff.splice(index, 1);
    return timeOff;
};

// Review Management
export const getReviews = async (businessId: string) => {
    return mockReviews.filter(r => r.businessId === businessId);
};

export const updateReviewStatus = async (reviewId: string, status: ReviewStatus) => {
    const index = mockReviews.findIndex(r => r.id === reviewId);
    if (index === -1) throw new Error('Review not found');
    
    mockReviews[index] = { ...mockReviews[index], status };
    return mockReviews[index];
};

// Product Management
export const getProducts = async (businessId: string) => {
    return mockProducts.filter(p => p.businessId === businessId);
};

export const createProduct = async (data: NewProductData) => {
    const newProduct = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    mockProducts.push(newProduct);
    return newProduct;
};

export const createProductsBulk = async (products: NewProductData[]) => {
    const newProducts = products.map(data => ({
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }));
    mockProducts.push(...newProducts);
    return newProducts;
};

export const updateProduct = async (productId: string, data: NewProductData) => {
    const index = mockProducts.findIndex(p => p.id === productId);
    if (index === -1) throw new Error('Product not found');
    
    mockProducts[index] = { ...mockProducts[index], ...data, updatedAt: new Date().toISOString() };
    return mockProducts[index];
};

export const deleteProduct = async (productId: string) => {
    const index = mockProducts.findIndex(p => p.id === productId);
    if (index === -1) throw new Error('Product not found');
    
    const product = mockProducts[index];
    mockProducts.splice(index, 1);
    return product;
};

// Transaction Management
export const getTransactions = async (businessId: string) => {
    return mockTransactions.filter(t => t.businessId === businessId);
};

export const createTransaction = async (data: NewTransactionData) => {
    const newTransaction = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date().toISOString()
    };
    mockTransactions.push(newTransaction);
    return newTransaction;
};

// Waitlist Management
export const getWaitlist = async (businessId: string) => {
    return mockWaitlist.filter(w => w.businessId === businessId);
};

export const deleteWaitlistEntry = async (entryId: string) => {
    const index = mockWaitlist.findIndex(w => w.id === entryId);
    if (index === -1) throw new Error('Waitlist entry not found');
    
    const entry = mockWaitlist[index];
    mockWaitlist.splice(index, 1);
    return entry;
};