

import { PublicCustomerUser } from "./customer";
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