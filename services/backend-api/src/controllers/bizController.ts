
import { Request, Response } from 'express';
import { AuthenticatedBusinessRequest } from '../middleware/authMiddleware';
import * as bizService from '../services/bizService';
import { 
    NewBookingData, 
    NewCustomerData, 
    NewServiceData, 
    NewStaffData, 
    NewCampaignData,
    NewAudienceData,
    NewTimeOffData,
    ReviewStatus,
    BookingStatus,
    NewProductData,
    NewTransactionData,
} from '../types/booking';
import { getAIGrowthInsights } from '../services/aiService';

// Since this is a mock, we'll just send back success/failure
export const login = (req: Request, res: Response) => res.json({ message: 'Login mock placeholder' });
export const signup = (req: Request, res: Response) => res.json({ message: 'Signup mock placeholder' });
export const logout = (req: Request, res: Response) => res.json({ message: 'Logout mock placeholder' });
export const getMe = (req: AuthenticatedBusinessRequest, res: Response) => {
    // In a real app, you'd fetch user details based on req.business
    const mockUser = {
        id: 'user_default',
        businessName: 'The Grooming Lounge',
        email: 'contact@groominglounge.com',
        role: 'Owner',
        staffId: 'staff_2', // Let's say the owner is also a manager
    };
    res.json(mockUser);
};

// Generic handler for fetching all items of a certain type
const getAll = (fetcher: (businessId: string) => Promise<any>) => async (req: AuthenticatedBusinessRequest, res: Response) => {
    try {
        const businessId = req.business!.businessId;
        const items = await fetcher(businessId);
        res.json(items);
    } catch (e) {
        res.status(500).json({ message: 'Failed to fetch data' });
    }
};

// Generic handler for creating an item
const create = (creator: (businessId: string, data: any) => Promise<any>) => async (req: AuthenticatedBusinessRequest, res: Response) => {
    try {
        const businessId = req.business!.businessId;
        const newItem = await creator(businessId, req.body);
        res.status(201).json(newItem);
    } catch (e) {
        if (e instanceof Error) {
            return res.status(400).json({ message: e.message });
        }
        res.status(500).json({ message: 'Failed to create item' });
    }
};

// Generic handler for updating an item
const update = (updater: (id: string, data: any) => Promise<any>) => async (req: Request, res: Response) => {
    try {
        const updatedItem = await updater(req.params.id, req.body);
        res.json(updatedItem);
    } catch (e) {
        res.status(404).json({ message: 'Item not found' });
    }
};

// Generic handler for deleting an item
const deleteItem = (deleter: (id: string) => Promise<any>) => async (req: Request, res: Response) => {
    try {
        await deleter(req.params.id);
        res.status(204).send();
    } catch (e) {
        res.status(404).json({ message: 'Item not found' });
    }
};

// --- API Keys ---
export const getApiKeys = getAll(bizService.getApiKeys);
export const generateApiKey = create((_, data) => bizService.generateApiKey(data.name));
export const revokeApiKey = deleteItem(bizService.revokeApiKey);

// --- Settings ---
export const getBusinessSettings = getAll(bizService.getBusinessSettings);
export const updateBusinessSettings = async (req: AuthenticatedBusinessRequest, res: Response) => {
    try {
        const businessId = req.business!.businessId;
        const updatedSettings = await bizService.updateBusinessSettings(businessId, req.body);
        res.json(updatedSettings);
    } catch (e) {
        res.status(404).json({ message: 'Settings not found' });
    }
};

// --- Bookings ---
export const getBookings = getAll(bizService.getBookings);
export const createBooking = create((bizId, data: NewBookingData) => bizService.createBooking(bizId, data));
export const updateBooking = update((id, data: Partial<NewBookingData & { status: BookingStatus }>) => bizService.updateBooking(id, data));
export const deleteBooking = deleteItem(bizService.deleteBooking);

// --- Customers ---
export const getCustomers = getAll(bizService.getCustomers);
export const createCustomer = create((_, data: NewCustomerData) => bizService.createCustomer(data));
export const updateCustomer = update((id, data: Partial<NewCustomerData>) => bizService.updateCustomer(id, data));
export const deleteCustomer = deleteItem(bizService.deleteCustomer);

// --- Services ---
export const getServices = getAll(bizService.getServices);
export const createService = create((_, data: NewServiceData) => bizService.createService(data));
export const updateService = update((id, data: NewServiceData) => bizService.updateService(id, data));
export const deleteService = deleteItem(bizService.deleteService);

// --- Staff ---
export const getStaff = getAll(bizService.getStaff);
export const createStaff = create((_, data: NewStaffData) => bizService.createStaff(data));
export const updateStaff = update((id, data: NewStaffData) => bizService.updateStaff(id, data));
export const deleteStaff = deleteItem(bizService.deleteStaff);
export const updateStaffSchedule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { schedule } = req.body;
        const updatedStaff = await bizService.updateStaffSchedule(id, schedule);
        res.json(updatedStaff);
    } catch (e) {
        res.status(404).json({ message: 'Staff not found' });
    }
};

// --- Marketing ---
export const getCampaigns = getAll(bizService.getCampaigns);
export const createCampaign = create((_, data: NewCampaignData) => bizService.createCampaign(data));
export const updateCampaign = update((id, data: Partial<NewCampaignData>) => bizService.updateCampaign(id, data));
export const deleteCampaign = deleteItem(bizService.deleteCampaign);
export const sendCampaign = async (req: Request, res: Response) => {
    try {
        const sentCampaign = await bizService.sendCampaign(req.params.id);
        res.json(sentCampaign);
    } catch (e) {
        res.status(404).json({ message: 'Campaign not found' });
    }
};

export const getAudiences = getAll(bizService.getAudiences);
export const createAudience = create((_, data: NewAudienceData) => bizService.createAudience(data));
export const updateAudience = update((id, data: NewAudienceData) => bizService.updateAudience(id, data));
export const deleteAudience = deleteItem(bizService.deleteAudience);

// --- Time Off ---
export const getTimeOff = getAll(bizService.getTimeOff);
export const createTimeOff = create((_, data: NewTimeOffData) => bizService.createTimeOff(data));
export const deleteTimeOff = deleteItem(bizService.deleteTimeOff);

// --- Reviews ---
export const getReviews = getAll(bizService.getReviews);
export const updateReviewStatus = update((id, data: { status: ReviewStatus }) => bizService.updateReviewStatus(id, data.status));

// --- Products ---
export const getProducts = getAll(bizService.getProducts);
export const createProduct = create((_, data: NewProductData) => bizService.createProduct(data));
export const createProductsBulk = create((_, data: NewProductData[]) => bizService.createProductsBulk(data));
export const updateProduct = update((id, data: NewProductData) => bizService.updateProduct(id, data));
export const deleteProduct = deleteItem(bizService.deleteProduct);

// --- Transactions ---
export const getTransactions = getAll(bizService.getTransactions);
export const createTransaction = create((_, data: NewTransactionData) => bizService.createTransaction(data));

// --- AI ---
export const getGrowthInsights = async (req: AuthenticatedBusinessRequest, res: Response) => {
    try {
        const businessId = req.business!.businessId;
        const insights = await getAIGrowthInsights(businessId);
        res.json(insights);
    } catch (e) {
        console.error("Error generating AI growth insights:", e);
        res.status(500).json({ message: 'Failed to generate AI insights' });
    }
};