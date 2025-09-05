// Service layer type definitions

// Payment Service Types
export interface PaymentIntentRequest {
  businessId: string;
  serviceId: string;
  staffId: string;
  startTime: string;
  customer?: {
    full_name: string;
    email: string;
  };
}

export interface PaymentIntentResponse {
  clientSecret: string | null;
  depositAmount: number;
  depositReason: string;
}

// Review Service Types
export interface ReviewServiceParams {
  serviceId: string;
  staffId: string;
}

export interface AggregateRating {
  rating: number;
  count: number;
}

// Business Service Types
export interface BusinessSearchFilters {
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  date?: string;
}

export interface AvailabilityRequest {
  businessId: string;
  serviceId: string;
  staffId: string;
  date: string;
}

export interface AvailabilityResponse {
  [staffId: string]: string[]; // Array of available time slots
}

// Booking Service Types
export interface BookingCreationData {
  businessId: string;
  serviceId: string;
  staffId: string;
  startTime: string;
  customer: {
    full_name: string;
    email: string;
    phone?: string;
  };
  paymentIntentId?: string;
}

export interface BookingCancellationRequest {
  bookingId: string;
  customerId: string;
}

// Customer Service Types
export interface CustomerProfileUpdate {
  full_name?: string;
  email?: string;
}

export interface CustomerPasswordChange {
  current_password: string;
  new_password: string;
}

// Notification Service Types
export interface NotificationRecipient {
  email: string;
  name?: string;
}

export interface BookingNotificationData {
  booking: {
    id: string;
    start_at: string;
    customer: { full_name: string };
    service: { name: string };
    staff: { full_name: string };
    business?: { id: string };
  };
  recipientEmail: string;
}

// Waitlist Service Types
export interface WaitlistEntryData {
  businessId: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  date: string;
  preferredTimeRange: 'morning' | 'afternoon' | 'evening' | 'any';
}

// AI Service Types
export interface NoShowRiskRequest {
  serviceId: string;
  staffId: string;
  startTime: string;
  customer: {
    full_name: string;
    email: string;
  };
}

export interface GrowthInsightRequest {
  businessId: string;
}

export interface GrowthInsight {
  id: string;
  type: 'pricing' | 'bundling';
  title: string;
  description: string;
}

// Service Error Types
export interface ServiceError extends Error {
  code?: string;
  statusCode?: number;
}

// Service Response Wrapper
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

// Common service method patterns
export interface ServiceMethods {
  create?: (...args: any[]) => Promise<any>;
  update?: (...args: any[]) => Promise<any>;
  delete?: (...args: any[]) => Promise<any>;
  get?: (...args: any[]) => Promise<any>;
  list?: (...args: any[]) => Promise<any[]>;
}