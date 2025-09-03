

export interface CustomerUser {
    id: string;
    full_name: string;
    email: string;
    passwordHash: string; // This is never sent to the client
}

export type PublicCustomerUser = Omit<CustomerUser, 'passwordHash'>;
