import { Router } from 'express';
import * as bizController from '../controllers/bizController';
import { protectBusiness } from '../middleware/authMiddleware';

const router = Router();

// All routes in this file are for authenticated business users
router.use(protectBusiness);

// --- Auth ---
router.post('/logout', bizController.logout);
router.get('/me', bizController.getMe);
router.post('/biz/login', bizController.login);
router.post('/biz/signup', bizController.signup);


// --- API Keys ---
router.get('/api-keys', bizController.getApiKeys);
router.post('/api-keys', bizController.generateApiKey);
router.delete('/api-keys/:id', bizController.revokeApiKey);

// --- Settings ---
router.get('/settings', bizController.getBusinessSettings);
router.put('/settings', bizController.updateBusinessSettings);

// --- Bookings ---
router.get('/bookings', bizController.getBookings);
router.post('/bookings', bizController.createBooking);
router.patch('/bookings/:id', bizController.updateBooking);
router.delete('/bookings/:id', bizController.deleteBooking);

// --- Customers ---
router.get('/customers', bizController.getCustomers);
router.post('/customers', bizController.createCustomer);
router.patch('/customers/:id', bizController.updateCustomer);
router.delete('/customers/:id', bizController.deleteCustomer);

// --- Services ---
router.get('/services', bizController.getServices);
router.post('/services', bizController.createService);
router.put('/services/:id', bizController.updateService);
router.delete('/services/:id', bizController.deleteService);

// --- Staff ---
router.get('/staff', bizController.getStaff);
router.post('/staff', bizController.createStaff);
router.put('/staff/:id', bizController.updateStaff);
router.delete('/staff/:id', bizController.deleteStaff);
router.put('/staff/:id/schedule', bizController.updateStaffSchedule);

// --- Marketing ---
router.get('/marketing/campaigns', bizController.getCampaigns);
router.post('/marketing/campaigns', bizController.createCampaign);
router.patch('/marketing/campaigns/:id', bizController.updateCampaign);
router.delete('/marketing/campaigns/:id', bizController.deleteCampaign);
router.post('/marketing/campaigns/:id/send', bizController.sendCampaign);

router.get('/marketing/audiences', bizController.getAudiences);
router.post('/marketing/audiences', bizController.createAudience);
router.put('/marketing/audiences/:id', bizController.updateAudience);
router.delete('/marketing/audiences/:id', bizController.deleteAudience);

// --- Time Off ---
router.get('/timeoff', bizController.getTimeOff);
router.post('/timeoff', bizController.createTimeOff);
router.delete('/timeoff/:id', bizController.deleteTimeOff);

// --- Reviews ---
router.get('/reviews', bizController.getReviews);
router.patch('/reviews/:id', bizController.updateReviewStatus);

// --- Products ---
router.get('/products', bizController.getProducts);
router.post('/products', bizController.createProduct);
router.post('/products/bulk', bizController.createProductsBulk);
router.put('/products/:id', bizController.updateProduct);
router.delete('/products/:id', bizController.deleteProduct);

// --- Transactions ---
router.get('/transactions', bizController.getTransactions);
router.post('/transactions', bizController.createTransaction);


export default router;
