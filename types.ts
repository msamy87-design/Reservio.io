// types.ts

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid_in_full';
export type Currency = 'USD' | 'EUR' | 'GBP';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string;
  permissions: string[];
}

export interface NewApiKeyResult {
  api_key: string;
  key_id: string;
}

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface NewCustomerData {
  full_name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: Currency;
  duration_minutes: number;
  staffIds: string[];
  average_rating: number;
  review_count: number;
}

export interface NewServiceData {
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  staffIds: string[];
}

export interface DaySchedule {
  is_working: boolean;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
}

export interface BusinessHours {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

export type StaffSchedule = {
    [day in DayOfWeek]: DaySchedule;
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

export interface NewStaffData {
  full_name: string;
  email: string;
  phone: string;
  role: Staff['role'];
}

export interface Booking {
  id: string;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  customer: Pick<Customer, 'id' | 'full_name'>;
  service: Pick<Service, 'id' | 'name' | 'duration_minutes'>;
  staff: Pick<Staff, 'id' | 'full_name'>;
  reminder_sent_at?: string | null;
  recurrence_rule?: 'weekly' | 'monthly' | null;
  recurrence_end_date?: string | null;
  parent_booking_id?: string;
  payment_status: PaymentStatus;
  payment_intent_id?: string | null;
  transaction_id?: string;
  review_submitted?: boolean;
  business?: { id: string, name: string };
}

export interface NewBookingData {
  customerId: string;
  serviceId: string;
  staffId: string;
  startTime: string; // ISO String
  recurrenceRule?: 'weekly' | 'monthly' | null;
  recurrenceEndDate?: string | null;
}

export interface BusinessProfile {
    name: string;
    email: string;
    phone: string;
    address: string;
}

export interface BusinessSettings {
    profile: BusinessProfile;
    hours: BusinessHours;
    currency: Currency;
    marketplace_listing: {
        is_listed: boolean;
        public_image_url: string;
    };
    payment_settings: {
        stripe_connected: boolean;
        deposit_type: 'fixed' | 'percentage';
        deposit_value: number;
    };
    notification_settings: {
        new_booking_alerts: boolean;
        cancellation_alerts: boolean;
    };
}

export interface User {
  id: string;
  businessName: string;
  email: string;
  passwordHash: string;
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

export interface NewAudienceData {
    name: string;
    description: string;
    type: AudienceType;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  description: string;
  channel: 'Email' | 'SMS' | 'Social';
  status: 'Draft' | 'Active' | 'Completed' | 'Archived';
  audience: {
    id: string;
    name: string;
  };
  customers_reached: number;
  bookings_generated: number;
  created_at: string;
}

export interface NewCampaignData {
    name: string;
    description: string;
    channel: MarketingCampaign['channel'];
    status: MarketingCampaign['status'];
    audienceId: string;
}

export interface TimeOff {
  id: string;
  staff_id: string; // or 'all' for business-wide
  start_at: string;
  end_at: string;
  reason: string;
}

export interface NewTimeOffData {
  staff_id: string;
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

export interface ProductVariant {
    id: string;
    name: string;
    price: number;
    stock_quantity: number;
}

export interface NewProductVariantData extends Omit<ProductVariant, 'id'> {}

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

export interface TransactionItem {
    id: string; // Service or Product ID
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
    discount?: Discount | null;
    total: number;
    tax_amount: number;
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

// Admin types
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

// Marketplace types
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
  name: string;
  address: string;
  phone: string;
  services: PublicService[];
  staff: PublicStaff[];
  reviews: PublicReview[];
  average_rating: number;
  review_count: number;
  imageUrl: string;
  is_listed: boolean;
}

export interface PublicCustomerUser {
    id: string;
    full_name: string;
    email: string;
    favoriteBusinessIds: string[];
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

export interface UpdateProfileData {
    full_name: string;
    email: string;
}

export interface ChangePasswordData {
    current_password: string;
    new_password: string;
}