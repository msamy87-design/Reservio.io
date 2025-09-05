// types.ts

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type Currency = 'USD' | 'EUR' | 'GBP';
export type StaffRole = 'Owner' | 'Manager' | 'Assistant' | 'Stylist';
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled' | 'pending';
export type ReviewStatus = 'Pending' | 'Published' | 'Hidden';
export type BusinessVerificationStatus = 'pending' | 'approved' | 'suspended';
export type MarketingChannel = 'Email' | 'SMS' | 'Social';
export type AudienceType = 'all' | 'frequent' | 'lapsed' | 'new';
export type TrendingPeriod = 'week' | 'month' | 'season';
export type SeasonType = 'spring' | 'summer' | 'fall' | 'winter';

export interface DaySchedule {
  is_working: boolean;
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
}

export type StaffSchedule = Record<DayOfWeek, DaySchedule>;

export interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface BusinessSettings {
  id: string;
  profile: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  currency: Currency;
  hours: BusinessHours;
  marketplace_listing: {
    is_listed: boolean;
    public_image_url: string;
  };
  no_show_prevention: {
    enabled: boolean;
    high_risk_deposit_amount: number;
  };
  payment_settings: {
    deposit_type: 'none' | 'fixed' | 'percentage';
    deposit_value: number;
  };
  notification_settings: {
    new_booking_alerts: boolean;
    cancellation_alerts: boolean;
  };
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
}

export interface NewApiKeyResult {
  api_key: string;
  details: ApiKey;
}

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
  duration_minutes: number;
  price: number;
  currency: Currency;
  staffIds: string[];
  required_skill?: string;
  average_rating: number;
  review_count: number;
}

export interface Staff {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: StaffRole;
  schedule: StaffSchedule;
  skills?: string[];
  average_rating: number;
  review_count: number;
}

export interface Booking {
  id: string;
  start_at: string; // ISO string
  end_at: string; // ISO string
  status: BookingStatus;
  customer: { id: string, full_name: string };
  service: { id: string, name: string, duration_minutes: number };
  staff: { id: string, full_name: string };
  business?: { id: string, name: string };
  recurrence_rule?: 'weekly' | 'monthly' | null;
  payment_status?: 'unpaid' | 'deposit_paid' | 'paid_in_full';
  payment_intent_id?: string | null;
  transaction_id?: string | null;
  noShowRiskScore?: number | null;
  review_submitted?: boolean;
}

export interface NewBookingData {
  customerId: string;
  serviceId: string;
  staffId: string;
  startTime: string; // ISO string
  recurrenceRule?: 'weekly' | 'monthly' | null;
  recurrenceEndDate?: string | null;
}

export interface NewCustomerData {
  full_name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface NewServiceData {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  staffIds: string[];
  required_skill: string | undefined;
}

export interface NewStaffData {
  full_name: string;
  email: string;
  phone: string;
  role: StaffRole;
  skills: string[];
}

export interface MarketingCampaign {
    id: string;
    name: string;
    description: string;
    status: 'Draft' | 'Active' | 'Completed' | 'Archived';
    channel: MarketingChannel;
    audience: { id: string, name: string };
    customers_reached: number;
    bookings_generated: number;
}

export interface NewCampaignData {
    name: string;
    description: string;
    status: 'Draft' | 'Active' | 'Completed' | 'Archived';
    channel: MarketingChannel;
    audienceId: string;
}

export interface CustomerAudience {
    id: string;
    name: string;
    description: string;
    type: AudienceType;
    customer_count: number;
}

export interface NewAudienceData {
    name: string;
    description: string;
    type: AudienceType;
}

export interface TimeOff {
    id: string;
    staff_id: string; // 'all' for all staff
    start_at: string; // ISO string
    end_at: string; // ISO string
    reason: string;
}

export interface NewTimeOffData {
    staff_id: string;
    start_at: string;
    end_at: string;
    reason: string;
}

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
    price?: number;
    stock_quantity?: number;
    imageBase64?: string | null; // For creating/updating
    variants?: NewProductVariantData[];
}

export interface BulkImportResult {
    successCount: number;
    errorCount: number;
    createdProducts: Product[];
}

export interface Discount {
    type: 'percentage' | 'fixed';
    value: number;
}

export interface TransactionItem {
    id: string;
    name: string;
    type: 'service' | 'product';
    quantity: number;
    unit_price: number;
    staffId?: string;
    staffName?: string;
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

export interface AIGrowthInsight {
    id: string;
    type: 'pricing' | 'bundling';
    title: string;
    description: string;
}

export interface User {
    id: string;
    businessName: string;
    email: string;
    passwordHash: string;
    role: StaffRole;
    staffId: string;
}

export interface WaitlistEntry {
    id: string;
    businessId: string;
    serviceId: string;
    customerName: string;
    customerEmail: string;
    date: string; // YYYY-MM-DD
    preferredTimeRange: 'any' | 'morning' | 'afternoon' | 'evening';
    createdAt: string;
}

export interface NewWaitlistEntryData extends Omit<WaitlistEntry, 'id' | 'createdAt'> {}

// --- Marketplace Types ---

export interface PublicCustomerUser {
    id: string;
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

export interface PublicService extends Omit<Service, 'staffIds' | 'required_skill' | 'review_count' | 'average_rating'> {}

export interface PublicStaffMember {
    id: string;
    full_name: string;
    role: StaffRole;
}

export interface PublicReview {
    id: string;
    customer_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export type PriceTier = '$' | '$$' | '$$$';
export type BusinessAmenity = 'wifi' | 'parking' | 'wheelchair_accessible' | 'credit_cards' | 'walk_ins' | 'online_booking';

export interface BusinessHours {
    monday: { open: string; close: string; is_open: boolean };
    tuesday: { open: string; close: string; is_open: boolean };
    wednesday: { open: string; close: string; is_open: boolean };
    thursday: { open: string; close: string; is_open: boolean };
    friday: { open: string; close: string; is_open: boolean };
    saturday: { open: string; close: string; is_open: boolean };
    sunday: { open: string; close: string; is_open: boolean };
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
    staff: PublicStaffMember[];
    reviews: PublicReview[];
    latitude?: number;
    longitude?: number;
    // New enhanced fields
    price_tier?: PriceTier;
    amenities?: BusinessAmenity[];
    next_available_slot?: string | null;
    distance_miles?: number;
    is_open_now?: boolean;
    business_hours?: BusinessHours;
    image_gallery?: string[];
    is_featured?: boolean;
    is_new_business?: boolean;
    response_time_minutes?: number;
    booking_completion_rate?: number;
    recent_booking_count?: number;
}

export interface NewPublicBookingData {
    businessId: string;
    serviceId: string;
    staffId: string;
    startTime: string; // ISO String
    customer: {
        full_name: string;
        email: string;
        phone: string;
    };
    paymentIntentId?: string | null;
}

export interface PaymentIntentDetails {
    serviceId: string;
    businessId: string;
    staffId: string;
    startTime: string;
    customer?: {
        full_name: string;
        email: string;
    };
}


// --- Admin Types ---
export interface AdminUser {
    id: string;
    full_name: string;
    email: string;
    role: 'superadmin';
    passwordHash?: string;
}

export interface PlatformStats {
    total_revenue: number;
    total_businesses: number;
    total_customers: number;
    total_bookings: number;
}

export interface BusinessForAdmin {
    id: string;
    name: string;
    owner_email: string;
    verification_status: BusinessVerificationStatus;
    latitude?: number;
    longitude?: number;
}

// Trending Services & Marketplace Features
export interface TrendingService {
    id: string;
    name: string;
    icon: React.ComponentType<any>;
    query: string;
    booking_count: number;
    growth_percentage: number;
    average_price: number;
    average_duration: number;
    popular_times: string[];
    is_seasonal?: boolean;
    season?: SeasonType;
    trending_period: TrendingPeriod;
}

export interface SeasonalHighlight {
    id: string;
    title: string;
    description: string;
    services: string[];
    image_url: string;
    season: SeasonType;
    discount_percentage?: number;
    cta_text: string;
    cta_link: string;
}

export interface PopularLocation {
    id: string;
    name: string;
    business_count: number;
    average_rating: number;
    popular_services: string[];
    coordinates: {
        lat: number;
        lng: number;
    };
}

export interface CustomerReview {
    id: string;
    customer_name: string;
    customer_image?: string;
    business_name: string;
    service_name: string;
    rating: number;
    comment: string;
    before_image?: string;
    after_image?: string;
    date: string;
    is_featured: boolean;
    helpful_count: number;
}

// Personalization Features
export interface UserPreferences {
    id: string;
    preferred_services: string[];
    preferred_locations: string[];
    budget_range: {
        min: number;
        max: number;
    };
    preferred_times: string[];
    favorite_businesses: string[];
    booking_history: string[];
    notification_preferences: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
}

export interface PersonalizedRecommendation {
    id: string;
    type: 'service' | 'business' | 'offer' | 'time_slot';
    title: string;
    description: string;
    confidence_score: number;
    reasoning: string;
    business_id?: string;
    service_name?: string;
    offer_id?: string;
    image_url?: string;
    price?: number;
    rating?: number;
    distance?: number;
    available_slots?: string[];
}

export interface RecentlyViewed {
    id: string;
    business_id: string;
    business_name: string;
    service_name?: string;
    image_url?: string;
    rating: number;
    price_range: string;
    viewed_at: string;
    booking_url: string;
}

export interface TrendingNearYou {
    id: string;
    business_name: string;
    service_name: string;
    trending_reason: string;
    booking_velocity: number;
    image_url?: string;
    rating: number;
    price: number;
    distance_miles: number;
    next_available: string;
}