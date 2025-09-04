// Re-exporting shared types for consistency. In a monorepo, these would be in a shared package.

import { PublicCustomerUser } from './customer';

export * from '../../../../types';

// You can also define backend-specific types here if needed.
// For example, a user type that includes a password hash.
export interface CustomerUser extends PublicCustomerUser {
    passwordHash: string;
}

export interface NewReviewData {
    booking_id: string;
    rating: number;
    comment: string;
}
