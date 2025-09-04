
import { mockCustomerUsers, mockAdminUsers } from '../data/mockData';
import { AuthResponse, AdminAuthResponse } from '../types/auth';
import { PublicCustomerUser, CustomerUser } from '../types/customer';
import { AdminUser } from '../../../../types';

// In a real app, use a library like bcrypt for password hashing
const mockHash = (password: string) => `hashed_${password}`;
const mockCompare = (password: string, hash: string) => mockHash(password) === hash;

// In a real app, use a library like jsonwebtoken
const mockSignToken = (user: PublicCustomerUser | AdminUser): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ user, iat: Date.now() }));
    return `${header}.${payload}.mock_signature`;
};


export const loginCustomer = async (email: string, password: string): Promise<AuthResponse> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = mockCustomerUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (!user || !mockCompare(password, user.passwordHash)) {
                return reject(new Error('Invalid email or password.'));
            }
            
            const { passwordHash, ...publicUser } = user;
            const token = mockSignToken(publicUser);
            
            resolve({ user: publicUser, token });
        }, 800);
    });
};

export const signupCustomer = async (full_name: string, email: string, password: string): Promise<AuthResponse> => {
     return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (mockCustomerUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                return reject(new Error('An account with this email already exists.'));
            }

            const newUser: CustomerUser = {
                id: `cuser_${crypto.randomUUID()}`,
                full_name,
                email,
                passwordHash: mockHash(password),
                // FIX: Initialize favoriteBusinessIds for new users to satisfy type requirements.
                favoriteBusinessIds: [],
            };
            mockCustomerUsers.push(newUser);
            
            const { passwordHash, ...publicUser } = newUser;
            const token = mockSignToken(publicUser);

            resolve({ user: publicUser, token });
        }, 1000);
    });
};

export const loginAdmin = async (email: string, password: string): Promise<AdminAuthResponse> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const adminUser = mockAdminUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (!adminUser || !mockCompare(password, adminUser.passwordHash)) {
                return reject(new Error('Invalid admin credentials.'));
            }
            const { passwordHash, ...publicUser } = adminUser;
            const token = mockSignToken(publicUser);
            resolve({ user: publicUser, token });
        }, 500);
    });
};
