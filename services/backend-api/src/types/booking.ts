// Re-exporting shared types for consistency. In a monorepo, these would be in a shared package.

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
  payment_status?: PaymentStatus;
  payment_intent_id?: string | null;
  review_submitted?: boolean;
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

export interface TimeOff {
  id: string;
  staff_id: string | 'all'; // 'all' for entire business
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

export interface CustomerUser {
    id: string;
    full_name: string;
    email: string;
    passwordHash: string;
    // FIX: Add favoriteBusinessIds to align with other type definitions
    favoriteBusinessIds: string[];
}