
// This represents the user data that is safe to send to the client.
export interface PublicCustomerUser {
    id: string;
    full_name: string;
    email: string;
}

// This represents the full user data, including sensitive info.
export interface CustomerUser extends PublicCustomerUser {
    passwordHash: string;
}
