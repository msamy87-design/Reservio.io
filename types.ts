// types.ts

// --- General ---
export type Currency = 'USD' | 'EUR' | 'GBP';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// --- User & Auth ---
export interface User {
  id: string;
  businessName: string;
  email: string;
  role: 'Owner' | 'Manager' | 'Assistant' | 'Stylist';
  staffId: string; // The ID of the staff member this user corresponds to
}

export interface AdminUser {
    id: string;
    email: string;
    full_name: string;
    role: 'superadmin';
}

export interface PublicCustomerUser {
    id:string;
    full_name: string;
    email: string;
    favoriteBusinessIds: string[];
}
export interface UpdateProfileData {
    full_name: string;
    email: string;
}
export interface ChangePasswordData {
    current_password: string;
    new_password: string;
}


// --- API Keys ---
export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
}

export interface NewApiKeyResult {
    id: string;
    name: string;
    api_key: string;
}

// --- Business & Settings ---
export interface DaySchedule {
  is_working: boolean;
  start_time: string;
  end_time: string;
}

export type BusinessHours = Record<DayOfWeek, DaySchedule>;

export interface BusinessSettings {
  profile: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  hours: BusinessHours;
  currency: Currency;
  marketplace_listing: {
    is_listed: boolean;
    public_image_url: string;
  };
  payment_settings: {
    stripe_connected: boolean;
    deposit_type: 'none' | 'fixed' | 'percentage';
    deposit_value: number;
  };
  notification_settings: {
    new_booking_alerts: boolean;
    cancellation_alerts: boolean;
  };
  no_show_prevention: {
    enabled: boolean;
    high_risk_deposit_amount: number;
  };
}

export interface BusinessForAdmin {
    id: string;
    name: string;
    owner_email: string;
    phone: string;
    address: string;
    verification_status: BusinessVerificationStatus;
    created_at: string;
}
export type BusinessVerificationStatus = 'approved' | 'pending' | 'suspended';


// --- Customers ---
export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  notes: string;
}

export type NewCustomerData = Omit<Customer, 'id'>;

// --- Staff ---
export type StaffSchedule = Record<DayOfWeek, DaySchedule>;

export interface Staff {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'Owner' | 'Manager' | 'Assistant' | 'Stylist';
  schedule: StaffSchedule;
  skills: string[];
  average_rating: number;
  review_count: number;
}
export type NewStaffData = Omit<Staff, 'id' | 'schedule' | 'average_rating' | 'review_count'>;

// --- Services ---
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: Currency;
  duration_minutes: number;
  staffIds: string[];
  required_skill?: string;
  average_rating: number;
  review_count: number;
}
export type NewServiceData = Omit<Service, 'id' | 'average_rating' | 'review_count' | 'currency'>;

// --- Products & Inventory ---
export interface ProductVariant {
    id: string;
    name: string;
    price: number;
    stock_quantity: number;
}
export type NewProductVariantData = Omit<ProductVariant, 'id'>;

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

// --- Bookings & Scheduling ---
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled' | 'pending';
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid_in_full';

export interface Booking {
  id: string;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  customer: { id: string; full_name: string };
  service: { id: string; name: string; duration_minutes: number };
  staff: { id: string; full_name: string };
  business?: { id: string, name: string };
  payment_status: PaymentStatus;
  payment_intent_id?: string | null;
  transaction_id?: string | null;
  noShowRiskScore?: number;
  review_submitted?: boolean;
  recurrence_rule?: 'weekly' | 'monthly' | null;
}
export interface NewBookingData {
    customerId: string;
    serviceId: string;
    staffId: string;
    startTime: string;
    recurrenceRule?: 'weekly' | 'monthly' | null;
    recurrenceEndDate?: string | null;
}
export interface NewPublicBookingData {
    businessId: string;
    serviceId: string;
    staffId: string;
    startTime: string;
    customer: {
        full_name: string;
        email: string;
        phone: string;
    };
    paymentIntentId?: string;
}

export interface TimeOff {
    id: string;
    staff_id: string; // 'all' for company-wide
    start_at: string; // ISO string
    end_at: string; // ISO string
    reason: string;
}
export type NewTimeOffData = Omit<TimeOff, 'id'>;

// --- Marketing ---
export interface MarketingCampaign {
  id: string;
  name: string;
  description: string;
  status: 'Draft' | 'Active' | 'Completed' | 'Archived';
  channel: 'Email' | 'SMS' | 'Social';
  audience: { id: string; name: string };
  customers_reached: number;
  bookings_generated: number;
}
export interface NewCampaignData {
    name: string;
    description: string;
    status: MarketingCampaign['status'];
    channel: MarketingCampaign['channel'];
    audienceId: string;
}

export type AudienceType = 'all' | 'frequent' | 'lapsed' | 'new';
export interface CustomerAudience {
  id: string;
  name: string;
  description: string;
  type: AudienceType;
  customer_count: number;
}
export type NewAudienceData = Omit<CustomerAudience, 'id' | 'customer_count'>;

// --- Reviews ---
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
    rating: number;
    comment: string;
    status: ReviewStatus;
    created_at: string;
}

// --- Transactions ---
export interface TransactionItem {
    id: string;
    name: string;
    type: 'service' | 'product';
    quantity: number;
    unit_price: number;
    staffId?: string;
    staffName?: string;
}
export interface Discount {
    type: 'percentage' | 'fixed';
    value: number;
}
export interface Transaction {
    id: string;
    booking_id: string | null;
    customer_id: string;
    items: TransactionItem[];
    subtotal: number;
    discount_amount: number;
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

// --- AI ---
export interface AIGrowthInsight {
    id: string;
    type: 'pricing' | 'bundling';
    title: string;
    description: string;
}

// --- Public Marketplace ---
export interface PublicService {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_minutes: number;
}
export interface PublicStaff {
    id: string;
    full_name: string;
    role: string;
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
    name: string;
    address: string;
    phone: string;
    imageUrl: string;
    average_rating: number;
    review_count: number;
    services: PublicService[];
    staff: PublicStaff[];
    reviews: PublicReview[];
}

export interface PaymentIntentDetails {
    serviceId: string;
    businessId: string;
    staffId: string;
    startTime: string;
    customer?: { // For guest checkout risk assessment
        full_name: string;
        email: string;
    };
}

export interface WaitlistEntry {
    id: string;
    businessId: string;
    serviceId: string;
    date: string; // YYYY-MM-DD
    preferredTimeRange: 'any' | 'morning' | 'afternoon' | 'evening';
    customerName: string;
    customerEmail: string;
    createdAt: string;
}
export type NewWaitlistEntryData = Omit<WaitlistEntry, 'id' | 'createdAt'>;

// Platform Admin
export interface PlatformStats {
    total_revenue: number;
    total_businesses: number;
    total_customers: number;
    total_bookings: number;
}