
// Authentication request types
export interface CustomerLoginRequest {
    email: string;
    password: string;
}

export interface CustomerSignupRequest {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
}

export interface BusinessLoginRequest {
    email: string;
    password: string;
}

export interface BusinessSignupRequest {
    businessName: string;
    email: string;
    password: string;
}

export interface AdminLoginRequest {
    email: string;
    password: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

// Authentication response types
export interface AuthResponse {
    user: {
        id: string;
        fullName: string;
        email: string;
        favoriteBusinessIds: string[];
    };
    accessToken: string;
    refreshToken: string;
}

export interface BusinessAuthResponse {
    user: {
        id: string;
        businessName: string;
        businessId: string;
        email: string;
        role: string;
        staffId: string;
    };
    accessToken: string;
    refreshToken: string;
}

export interface AdminAuthResponse {
    user: {
        id: string;
        fullName: string;
        email: string;
        role: string;
    };
    accessToken: string;
    refreshToken: string;
}

export interface TokenRefreshResponse {
    accessToken: string;
    refreshToken: string;
}