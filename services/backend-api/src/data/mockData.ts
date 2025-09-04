import { Booking, Customer, Service, Staff, StaffSchedule, TimeOff, Review, CustomerUser } from '../types/booking'; // Using a shared type structure
import { AdminUser, BusinessSettings, BusinessForAdmin } from '../../../../types';

// --- MOCK DATABASE ---

export let mockAdminUsers: (AdminUser & { passwordHash: string })[] = [
    { id: 'admin_1', email: 'superadmin@reservio.com', full_name: 'Super Admin', role: 'superadmin', passwordHash: 'hashed_supersecret' }
];

export const defaultSchedule: StaffSchedule = {
    monday: { is_working: true, start_time: '09:00', end_time: '17:00' },
    tuesday: { is_working: true, start_time: '09:00', end_time: '17:00' },
    wednesday: { is_working: true, start_time: '09:00', end_time: '17:00' },
    thursday: { is_working: true, start_time: '09:00', end_time: '17:00' },
    friday: { is_working: true, start_time: '09:00', end_time: '17:00' },
    saturday: { is_working: false, start_time: '10:00', end_time: '16:00' },
    sunday: { is_working: false, start_time: '10:00', end_time: '16:00' },
};

export let mockCustomers: Customer[] = [
  { id: 'cust_1', full_name: 'John Doe', email: 'john.doe@example.com', phone: '123-456-7890', notes: 'Prefers morning appointments. Allergic to lavender.' },
  { id: 'cust_2', full_name: 'Jane Smith', email: 'jane.smith@example.com', phone: '098-765-4321', notes: 'First-time customer. Interested in color services.' },
  { id: 'cust_3', full_name: 'Alice Johnson', email: 'alice.j@example.com', phone: '555-123-4567', notes: '' },
  { id: 'cust_4', full_name: 'Bob Williams', email: 'bob.w@example.com', phone: '555-987-6543', notes: 'VIP Customer. Always offers a tip.' },
];

export let mockServices: Service[] = [
  { id: 'serv_1', name: 'Haircut', description: 'Standard men\'s haircut', price: 30, currency: 'USD', duration_minutes: 30, staffIds: ['staff_1', 'staff_2'], average_rating: 4.8, review_count: 15 },
  { id: 'serv_2', name: 'Beard Trim', description: 'Shape and trim beard', price: 15, currency: 'USD', duration_minutes: 15, staffIds: ['staff_1', 'staff_2', 'staff_3'], average_rating: 4.5, review_count: 12 },
  { id: 'serv_3', name: 'Deluxe Shave', description: 'Hot towel shave', price: 45, currency: 'USD', duration_minutes: 45, staffIds: ['staff_2'], average_rating: 5.0, review_count: 8 },
  { id: 'serv_4', name: 'Coloring', description: 'Full hair coloring', price: 75, currency: 'USD', duration_minutes: 90, staffIds: ['staff_1'], average_rating: 4.2, review_count: 5 },
];

export let mockStaff: Staff[] = [
    { id: 'staff_1', full_name: 'Mike Miller', email: 'mike.m@example.com', phone: '555-111-2222', role: 'Stylist', schedule: defaultSchedule, average_rating: 4.7, review_count: 20 },
    { id: 'staff_2', full_name: 'Sarah Chen', email: 'sarah.c@example.com', phone: '555-333-4444', role: 'Manager', schedule: defaultSchedule, average_rating: 4.9, review_count: 10 },
    { id: 'staff_3', full_name: 'David Lee', email: 'david.l@example.com', phone: '555-555-6666', role: 'Assistant', schedule: { ...defaultSchedule, friday: { is_working: false, start_time: '09:00', end_time: '17:00' } }, average_rating: 4.4, review_count: 5 },
];

export let mockBookings: Booking[] = [
    {
        id: 'booking_1',
        start_at: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(10, 0, 0, 0).toString(),
        end_at: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(10, 30, 0, 0).toString(),
        status: 'confirmed',
        customer: { id: 'cust_1', full_name: 'John Doe' },
        service: { id: 'serv_1', name: 'Haircut', duration_minutes: 30 },
        staff: { id: 'staff_1', full_name: 'Mike Miller' },
        business: { id: 'biz_1', name: 'The Grooming Lounge' },
        payment_status: 'unpaid',
    },
    {
        id: 'booking_2',
        start_at: new Date(new Date().setDate(new Date().getDate() + 2)).setHours(14, 0, 0, 0).toString(),
        end_at: new Date(new Date().setDate(new Date().getDate() + 2)).setHours(15, 30, 0, 0).toString(),
        status: 'confirmed',
        customer: { id: 'cust_2', full_name: 'Jane Smith' },
        service: { id: 'serv_4', name: 'Coloring', duration_minutes: 90 },
        staff: { id: 'staff_1', full_name: 'Mike Miller' },
        business: { id: 'biz_1', name: 'The Grooming Lounge' },
        payment_status: 'deposit_paid',
    },
     {
        id: 'booking_3',
        start_at: new Date(new Date().setDate(new Date().getDate() - 5)).setHours(11, 0, 0, 0).toString(),
        end_at: new Date(new Date().setDate(new Date().getDate() - 5)).setHours(11, 30, 0, 0).toString(),
        status: 'completed',
        customer: { id: 'cust_1', full_name: 'John Doe' },
        service: { id: 'serv_1', name: 'Haircut', duration_minutes: 30 },
        staff: { id: 'staff_1', full_name: 'Mike Miller' },
        business: { id: 'biz_1', name: 'The Grooming Lounge' },
        payment_status: 'paid_in_full',
    },
];

export let mockTimeOff: TimeOff[] = [
    { id: 'to_1', staff_id: 'staff_1', start_at: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(), end_at: new Date(new Date().setDate(new Date().getDate() + 12)).toISOString(), reason: 'Vacation' }
];

export let mockReviews: Review[] = [
    { id: 'rev_1', booking_id: 'b_1', customer_id: 'cust_1', customer_name: 'John Doe', service_id: 'serv_1', service_name: 'Haircut', staff_id: 'staff_1', staff_name: 'Mike Miller', rating: 5, comment: 'Mike is the best! Always a great cut.', status: 'Published', created_at: new Date().toISOString() }
];

export let mockCustomerUsers: CustomerUser[] = [
    { id: 'cuser_1', full_name: 'John Doe', email: 'john.doe@example.com', passwordHash: 'hashed_password123', favoriteBusinessIds: ['biz_2'] }
];

export let mockBusinesses: BusinessForAdmin[] = [
    {
        id: 'biz_1',
        name: 'The Grooming Lounge',
        owner_email: 'contact@groominglounge.com',
        phone: '123-456-7890',
        address: '123 Main St, Anytown, USA 12345',
        verification_status: 'approved',
        created_at: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    },
    {
        id: 'biz_2',
        name: 'Sunset Salon & Spa',
        owner_email: 'manager@sunsetsalon.com',
        phone: '987-654-3210',
        address: '456 Ocean Dr, Seaville, USA 54321',
        verification_status: 'pending',
        created_at: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    },
    {
        id: 'biz_3',
        name: 'The Edge Barbershop',
        owner_email: 'contact@theedge.com',
        phone: '555-555-5555',
        address: '789 Blade St, Shearburg, USA 67890',
        verification_status: 'suspended',
        created_at: new Date(new Date().setDate(new Date().getDate() - 120)).toISOString(),
    },
];

export const mockBusinessSettings: { [businessId: string]: BusinessSettings } = {
    'biz_1': {
        profile: { name: 'The Grooming Lounge', email: 'contact@groominglounge.com', phone: '123-456-7890', address: '123 Main St, Anytown, USA 12345' },
        hours: defaultSchedule,
        currency: 'USD',
        marketplace_listing: { is_listed: true, public_image_url: 'https://placehold.co/800x600/818cf8/ffffff?text=The+Grooming+Lounge' },
        payment_settings: { stripe_connected: true, deposit_type: 'fixed', deposit_value: 10.00 },
        notification_settings: { new_booking_alerts: true, cancellation_alerts: true },
    }
};