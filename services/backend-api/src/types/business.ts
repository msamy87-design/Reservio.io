
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
  is_listed: boolean;
}
