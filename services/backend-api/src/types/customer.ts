// This represents the user data that is safe to send to the client.
export interface PublicCustomerUser {
    id: string;
    full_name: string;
    email: string;
    favoriteBusinessIds: string[];
}

// This represents the full user data, including sensitive info.
export interface CustomerUser extends PublicCustomerUser {
    passwordHash: string;
}

export interface UpdateProfileData {
    full_name: string;
    email: string;
}

export interface ChangePasswordData {
    current_password: string;
    new_password: string;
}