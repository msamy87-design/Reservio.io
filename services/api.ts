// services/api.ts
import { 
    ApiKey, 
    NewApiKeyResult, 
    BusinessSettings, 
    Booking, 
    NewBookingData, 
    Customer, 
    NewCustomerData, 
    Service, 
    NewServiceData, 
    Staff, 
    NewStaffData, 
    StaffSchedule,
    MarketingCampaign,
    NewCampaignData,
    CustomerAudience,
    NewAudienceData,
    TimeOff,
    NewTimeOffData,
    Review,
    ReviewStatus,
    BookingStatus,
    Product,
    NewProductData,
    BulkImportResult,
    Transaction,
    NewTransactionData,
} from '../types';

// Helper to handle API responses
const handleResponse = async (response: Response) => {
    if (response.status === 204) return null; // Handle No Content
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `API request failed with status ${response.status}`);
    }
    return data;
};

const getAuthHeaders = () => {
    const token = sessionStorage.getItem('reservio_token') || 'mock_token_user_default';
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// --- Auth ---
export const login = (email: string, password: string) => fetch('/api/biz/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
}).then(handleResponse);

export const signup = (businessName: string, email: string, password: string) => fetch('/api/biz/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessName, email, password }),
}).then(handleResponse);

export const logout = () => fetch('/api/biz/logout', { method: 'POST', headers: getAuthHeaders() });
export const getCurrentUser = () => fetch('/api/biz/me', { headers: getAuthHeaders() }).then(handleResponse);

// --- API Keys ---
export const fetchApiKeys = (): Promise<ApiKey[]> => fetch('/api/biz/api-keys', { headers: getAuthHeaders() }).then(handleResponse);
export const generateApiKey = (name: string): Promise<NewApiKeyResult> => fetch('/api/biz/api-keys', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
}).then(handleResponse);
export const revokeApiKey = (id: string): Promise<void> => fetch(`/api/biz/api-keys/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse);

// --- Settings ---
export const fetchBusinessSettings = (): Promise<BusinessSettings> => fetch('/api/biz/settings', { headers: getAuthHeaders() }).then(handleResponse);
export const updateBusinessSettings = (settings: BusinessSettings): Promise<BusinessSettings> => fetch('/api/biz/settings', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
}).then(handleResponse);

// --- Bookings ---
export const fetchBookings = (): Promise<Booking[]> => fetch('/api/biz/bookings', { headers: getAuthHeaders() }).then(handleResponse);
export const createBooking = (data: NewBookingData): Promise<Booking[]> => fetch('/api/biz/bookings', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(handleResponse);
export const updateBooking = (id: string, data: Partial<NewBookingData & { status: BookingStatus }>): Promise<Booking> => fetch(`/api/biz/bookings/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(handleResponse);
export const deleteBooking = (id: string): Promise<void> => fetch(`/api/biz/bookings/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse);

// --- Customers ---
export const fetchCustomers = (): Promise<Customer[]> => fetch('/api/biz/customers', { headers: getAuthHeaders() }).then(handleResponse);
export const createCustomer = (data: NewCustomerData): Promise<Customer> => fetch('/api/biz/customers', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(handleResponse);
export const updateCustomer = (id: string, data: Partial<NewCustomerData>): Promise<Customer> => fetch(`/api/biz/customers/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(handleResponse);
export const deleteCustomer = (id: string): Promise<void> => fetch(`/api/biz/customers/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse);

// --- Services ---
export const fetchServices = (): Promise<Service[]> => fetch('/api/biz/services', { headers: getAuthHeaders() }).then(handleResponse);
export const createService = (data: NewServiceData): Promise<Service> => fetch('/api/biz/services', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(handleResponse);
export const updateService = (id: string, data: NewServiceData): Promise<Service> => fetch(`/api/biz/services/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(handleResponse);
export const deleteService = (id: string): Promise<void> => fetch(`/api/biz/services/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse);

// --- Staff ---
export const fetchStaff = (): Promise<Staff[]> => fetch('/api/biz/staff', { headers: getAuthHeaders() }).then(handleResponse);
export const createStaff = (data: NewStaffData): Promise<Staff> => fetch('/api/biz/staff', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(handleResponse);
export const updateStaff = (id: string, data: NewStaffData): Promise<Staff> => fetch(`/api/biz/staff/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(handleResponse);
export const deleteStaff = (id: string): Promise<void> => fetch(`/api/biz/staff/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse);
export const updateStaffSchedule = (id: string, schedule: StaffSchedule): Promise<Staff> => fetch(`/api/biz/staff/${id}/schedule`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ schedule }),
}).then(handleResponse);

// --- Marketing ---
export const fetchCampaigns = (): Promise<MarketingCampaign[]> => fetch('/api/biz/marketing/campaigns', { headers: getAuthHeaders() }).then(handleResponse);
export const createCampaign = (data: NewCampaignData): Promise<MarketingCampaign> => fetch('/api/biz/marketing/campaigns', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(handleResponse);
export const updateCampaign = (id: string, data: Partial<NewCampaignData>): Promise<MarketingCampaign> => fetch(`/api/biz/marketing/campaigns/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(handleResponse);
export const deleteCampaign = (id: string): Promise<void> => fetch(`/api/biz/marketing/campaigns/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse);
export const sendCampaign = (id: string): Promise<MarketingCampaign> => fetch(`/api/biz/marketing/campaigns/${id}/send`, { method: 'POST', headers: getAuthHeaders() }).then(handleResponse);

export const fetchAudiences = (): Promise<CustomerAudience[]> => fetch('/api/biz/marketing/audiences', { headers: getAuthHeaders() }).then(handleResponse);
export const createAudience = (data: NewAudienceData): Promise<CustomerAudience> => fetch('/api/biz/marketing/audiences', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(handleResponse);
export const updateAudience = (id: string, data: NewAudienceData): Promise<CustomerAudience> => fetch(`/api/biz/marketing/audiences/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(handleResponse);
export const deleteAudience = (id: string): Promise<void> => fetch(`/api/biz/marketing/audiences/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse);

// --- Time Off ---
export const fetchTimeOff = (): Promise<TimeOff[]> => fetch('/api/biz/timeoff', { headers: getAuthHeaders() }).then(handleResponse);
export const createTimeOff = (data: NewTimeOffData): Promise<TimeOff> => fetch('/api/biz/timeoff', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(handleResponse);
export const deleteTimeOff = (id: string): Promise<void> => fetch(`/api/biz/timeoff/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse);

// --- Reviews ---
export const fetchReviews = (): Promise<Review[]> => fetch('/api/biz/reviews', { headers: getAuthHeaders() }).then(handleResponse);
export const updateReviewStatus = (id: string, status: ReviewStatus): Promise<Review> => fetch(`/api/biz/reviews/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
}).then(handleResponse);

// --- Products ---
export const fetchProducts = (): Promise<Product[]> => fetch('/api/biz/products', { headers: getAuthHeaders() }).then(handleResponse);
export const createProduct = (data: NewProductData): Promise<Product> => fetch('/api/biz/products', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(handleResponse);
export const createProductsBulk = (data: NewProductData[]): Promise<BulkImportResult> => fetch('/api/biz/products/bulk', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(handleResponse);
export const updateProduct = (id: string, data: NewProductData): Promise<Product> => fetch(`/api/biz/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(handleResponse);
export const deleteProduct = (id: string): Promise<void> => fetch(`/api/biz/products/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse);

// --- Transactions ---
export const fetchTransactions = (): Promise<Transaction[]> => fetch('/api/biz/transactions', { headers: getAuthHeaders() }).then(handleResponse);
export const createTransaction = (data: NewTransactionData): Promise<{transaction: Transaction, updatedProducts: Product[]}> => fetch('/api/biz/transactions', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(handleResponse);
