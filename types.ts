

// --- ADMIN PORTAL TYPES ---
export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'superadmin';
}

export interface PlatformStats {
  total_revenue: number;
  total_businesses: number;
  total_customers: number;
  total_bookings: number;
}

export type BusinessVerificationStatus = 'approved' | 'pending' | 'suspended';

export interface BusinessForAdmin {
  id: string;
  name: string;
  owner_email: string;
  phone: string;
  address: string;
  verification_status: BusinessVerificationStatus;
  created_at: string;
}


// --- MARKETPLACE TYPES ---
export interface PublicService {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description: string;
}

export interface PublicStaff {
  id: string;
  full_name: string;
  role: 'Stylist' | 'Manager' | 'Assistant' | 'Owner';
}

export interface PublicReview {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface PublicBusinessProfile {
  id: string;
  name:string;
  address: string;
  phone: string;
  services: PublicService[];
  staff: PublicStaff[];
  reviews: PublicReview[];
  average_rating: number;
  review_count: number;
  imageUrl: string;
}

export interface NewPublicCustomerData {
  full_name: string;
  email: string;
  phone: string;
}

export interface NewPublicBookingData {
    businessId: string;
    serviceId: string;
    staffId: string;
    startTime: string; // ISO String
    customer: NewPublicCustomerData;
    paymentIntentId?: string;
}

export interface PublicCustomerUser {
  id: string;
  full_name: string;
  email: string;
}


// --- BUSINESS PORTAL TYPES ---
export interface ApiKey {
  id: string; // UUID
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  expires_at: string;
  created_at: string;
  permissions: string[];
}

export interface NewApiKeyResult {
  api_key: string;
  key_id: string;
}

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid_in_full';

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration_minutes: number;
  staffIds: string[];
  average_rating: number;
  review_count: number;
}

export interface DaySchedule {
    is_working: boolean;
    start_time: string; // "HH:MM" format
    end_time: string;   // "HH:MM" format
}

export type StaffSchedule = {
    [day in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']: DaySchedule;
};


export interface Staff {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    role: 'Stylist' | 'Manager' | 'Assistant' | 'Owner';
    schedule: StaffSchedule;
    average_rating: number;
    review_count: number;
}

export interface Booking {
  id: string;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  customer: Pick<Customer, 'id' | 'full_name'>;
  service: Pick<Service, 'id' | 'name' | 'duration_minutes'>;
  staff: Pick<Staff, 'id' | 'full_name'>;
  business?: {
    id: string;
    name: string;
  };
  reminder_sent_at?: string | null;
  recurrence_rule?: string | null; // e.g., 'weekly', 'monthly'
  recurrence_end_date?: string | null;
  parent_booking_id?: string | null;
  transaction_id?: string | null;
  payment_status?: PaymentStatus;
  payment_intent_id?: string | null;
}

export interface NewBookingData {
    customerId: string;
    serviceId: string;
    staffId: string;
    startTime: string; // ISO String
    recurrenceRule?: 'weekly' | 'monthly' | null;
    recurrenceEndDate?: string | null;
}

export interface NewServiceData {
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  staffIds: string[];
}

export interface NewStaffData {
    full_name: string;
    email: string;
    phone: string;
    role: Staff['role'];
}

export interface NewCustomerData {
    full_name: string;
    email: string;
    phone: string;
    notes?: string;
}

export interface BusinessProfile {
    name: string;
    email: string;
    phone: string;
    address: string;
}

export type BusinessHours = StaffSchedule;

export type Currency = 'USD' | 'EUR' | 'GBP';

export interface MarketplaceListingSettings {
    is_listed: boolean;
    public_image_url: string | null;
}

export interface PaymentSettings {
    stripe_connected: boolean;
    deposit_type: 'none' | 'fixed' | 'percentage';
    deposit_value: number;
}

export interface NotificationSettings {
    new_booking_alerts: boolean;
    cancellation_alerts: boolean;
}

export interface BusinessSettings {
    profile: BusinessProfile;
    hours: BusinessHours;
    currency: Currency;
    marketplace_listing: MarketplaceListingSettings;
    payment_settings: PaymentSettings;
    notification_settings: NotificationSettings;
}

export interface User {
  id: string;
  businessName: string;
  email: string;
  passwordHash: string; // In a real app, this would never be sent to the client
  role: Staff['role'];
  staffId: string;
}

export type AudienceType = 'all' | 'frequent' | 'lapsed' | 'new';

export interface CustomerAudience {
  id: string;
  name: string;
  description: string;
  type: AudienceType;
  customer_count: number;
  created_at: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  description: string;
  channel: 'Email' | 'SMS' | 'Social';
  status: 'Draft' | 'Active' | 'Completed' | 'Archived';
  audience: Pick<CustomerAudience, 'id' | 'name'>;
  customers_reached: number;
  bookings_generated: number;
  created_at: string;
}

export interface NewAudienceData {
  name: string;
  description: string;
  type: AudienceType;
}

export interface NewCampaignData {
  name: string;
  description: string;
  channel: MarketingCampaign['channel'];
  status: MarketingCampaign['status'];
  audienceId: string;
  customers_reached?: number;
  bookings_generated?: number;
}

export interface TimeOff {
  id: string;
  staff_id: string | 'all'; // 'all' for entire business
  start_at: string;
  end_at: string;
  reason: string;
}

export interface NewTimeOffData {
  staff_id: string | 'all';
  start_at: string;
  end_at: string;
  reason: string;
}

export type ReviewStatus = 'Pending' | 'Published' | 'Hidden';

export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  customer_name: string;
  service_id: string;
  service_name: string;
  staff_id: string;
  staff_name: string;
  rating: number; // 1-5
  comment: string;
  status: ReviewStatus;
  created_at: string;
}

export interface NewReviewData {
  booking_id: string;
  customer_id: string;
  service_id: string;
  staff_id: string;
  rating: number;
  comment: string;
}

// --- POS & INVENTORY TYPES ---

export interface ProductVariant {
    id: string;
    name: string;
    price: number;
    stock_quantity: number;
}

export interface NewProductVariantData {
    name: string;
    price: number;
    stock_quantity: number;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock_quantity: number;
    imageUrl?: string;
    variants?: ProductVariant[];
}

export interface NewProductData {
    name: string;
    description: string;
    price: number;
    stock_quantity: number;
    imageBase64?: string | null;
    variants?: NewProductVariantData[];
}

export interface BulkImportResult {
    successCount: number;
    errorCount: number;
    createdProducts: Product[];
}

export type TransactionItem = {
    id: string; // service_id or product_id
    name: string;
    type: 'service' | 'product';
    quantity: number;
    unit_price: number;
    staffId?: string; // For standalone POS service attribution
    staffName?: string;
};

export type Discount = {
    type: 'percentage' | 'fixed';
    value: number;
};

export interface Transaction {
    id: string;
    booking_id: string | null;
    customer_id: string;
    items: TransactionItem[];
    subtotal: number;
    discount: Discount | null;
    tax_amount: number;
    total: number;
    payment_method: 'Cash' | 'Card';
    created_at: string;
}

export interface NewTransactionData {
    booking_id: string | null;
    customer_id: string;
    items: TransactionItem[];
    discount: Discount | null;
    payment_method: 'Cash' | 'Card';
}
