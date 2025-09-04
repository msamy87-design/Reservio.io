
import { PublicCustomerUser } from "./customer";
// FIX: Correctly import AdminUser type from shared types.
import { AdminUser } from "../../../../types";

export interface CustomerLoginRequest {
    email: string;
    password: string;
}

export interface CustomerSignupRequest {
    full_name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    user: PublicCustomerUser;
    token: string;
}

export interface AdminAuthResponse {
    user: AdminUser;
    token: string;
}