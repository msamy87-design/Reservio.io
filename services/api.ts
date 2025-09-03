

import { ApiKey, NewApiKeyResult, Booking, Customer, Service, NewBookingData, NewServiceData, Staff, NewStaffData, NewCustomerData, StaffSchedule, BusinessSettings, User, MarketingCampaign, CustomerAudience, NewCampaignData, NewAudienceData, AudienceType, TimeOff, NewTimeOffData, Review, ReviewStatus, NewReviewData, BookingStatus, Product, NewProductData, Transaction, NewTransactionData, TransactionItem, BulkImportResult } from '../types';

// --- MOCK USER DATABASE ---
let mockUsers: User[] = [];

const SESSION_KEY = 'reservio_session_token';

// --- AUTHENTICATION FUNCTIONS ---

export const signup = async (businessName: string, email: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>, token: string }> => {
    console.log(`Signing up new user: ${email}`);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (mockUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                return reject(new Error('An account with this email already exists.'));
            }

            // Create a corresponding staff member for the new user, who will be the Owner
            const newStaffMember: Staff = {
                id: `staff_${crypto.randomUUID()}`,
                full_name: businessName, // Default to business name
                email: email,
                phone: '',
                role: 'Owner',
                schedule: defaultSchedule,
                average_rating: 0,
                review_count: 0,
            };
            mockStaff.push(newStaffMember);

            const newUser: User = {
                id: `user_${crypto.randomUUID()}`,
                businessName,
                email,
                passwordHash: `hashed_${password}`, // Simple mock hashing
                role: newStaffMember.role,
                staffId: newStaffMember.id,
            };
            mockUsers.push(newUser);

            const { passwordHash, ...userResponse } = newUser;
            const token = `mock_token_${newUser.id}`;
            sessionStorage.setItem(SESSION_KEY, token);

            console.log('User signed up successfully:', userResponse);
            resolve({ user: userResponse, token });
        }, 1000);
    });
};

// Seed the default user after signup is defined
signup('The Grooming Lounge', 'contact@groominglounge.com', 'password123');

export const login = async (email: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>, token: string }> => {
    console.log(`Attempting to log in user: ${email}`);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            
            if (user && user.passwordHash === `hashed_${password}`) {
                const { passwordHash, ...userResponse } = user;
                const token = `mock_token_${user.id}`;
                sessionStorage.setItem(SESSION_KEY, token);
                console.log('User logged in successfully:', userResponse);
                resolve({ user: userResponse, token });
            } else {
                reject(new Error('Invalid email or password.'));
            }
        }, 1000);
    });
};

export const logout = async (): Promise<{ success: boolean }> => {
    sessionStorage.removeItem(SESSION_KEY);
    console.log('User logged out.');
    return Promise.resolve({ success: true });
};

export const getCurrentUser = async (): Promise<Omit<User, 'passwordHash'> | null> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const token = sessionStorage.getItem(SESSION_KEY);
            if (!token || !token.startsWith('mock_token_')) {
                return resolve(null);
            }
            const userId = token.replace('mock_token_', '');
            const user = mockUsers.find(u => u.id === userId);

            if (user) {
                const staffMember = mockStaff.find(s => s.id === user.staffId);
                const userWithRole = { ...user, role: staffMember?.role || 'Stylist' };
                const { passwordHash, ...userResponse } = userWithRole;
                resolve(userResponse);
            } else {
                resolve(null);
            }
        }, 200);
    });
};

// --- EXISTING API FUNCTIONS ---

let mockApiKeys: ApiKey[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    name: 'Main Website Integration',
    key_prefix: 'rsvio_abcdef12',
    created_at: '2023-10-26T10:00:00Z',
    last_used_at: '2023-10-27T14:30:00Z',
    expires_at: '2024-10-25T10:00:00Z',
    permissions: ['booking:read', 'booking:write'],
  },
  {
    id: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1',
    name: 'Mobile App Key',
    key_prefix: 'rsvio_ghijklmn',
    created_at: '2023-09-15T11:00:00Z',
    last_used_at: null,
    expires_at: '2024-09-14T11:00:00Z',
    permissions: ['booking:read'],
  },
  {
    id: 'c3d4e5f6-a7b8-9012-3456-7890abcdef12',
    name: 'Reporting System Hook',
    key_prefix: 'rsvio_opqrstuv',
    created_at: '2023-08-01T12:00:00Z',
    last_used_at: '2023-10-25T09:15:00Z',
    expires_at: '2024-07-31T12:00:00Z',
    permissions: ['analytics:read', 'customers:read'],
  },
];

const generateRandomString = (length: number): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const fetchApiKeys = async (): Promise<ApiKey[]> => {
  console.log('Fetching API keys...');
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('Fetched API keys:', mockApiKeys);
      resolve([...mockApiKeys]);
    }, 1000);
  });
};

export const generateApiKey = async (name: string): Promise<NewApiKeyResult> => {
  console.log(`Generating API key with name: ${name}`);
  return new Promise(resolve => {
    setTimeout(() => {
      const fullKey = `rsvio_${generateRandomString(43)}`;
      const newKey: ApiKey = {
        id: crypto.randomUUID(),
        name: name,
        key_prefix: `${fullKey.substring(0, 12)}`,
        created_at: new Date().toISOString(),
        last_used_at: null,
        expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        permissions: ['booking:read', 'booking:write'],
      };
      mockApiKeys.unshift(newKey);
      const result: NewApiKeyResult = {
        api_key: fullKey,
        key_id: newKey.id,
      };
      console.log('Generated new API key:', result);
      resolve(result);
    }, 1500);
  });
};

export const revokeApiKey = async (keyId: string): Promise<{ success: boolean }> => {
  console.log(`Revoking API key with ID: ${keyId}`);
  return new Promise(resolve => {
    setTimeout(() => {
      const initialLength = mockApiKeys.length;
      mockApiKeys = mockApiKeys.filter(key => key.id !== keyId);
      const success = mockApiKeys.length < initialLength;
      console.log(`Revoke success: ${success}`);
      resolve({ success });
    }, 500);
  });
};

let mockCustomers: Customer[] = [
  { id: 'cust_1', full_name: 'John Doe', email: 'john.doe@example.com', phone: '123-456-7890', notes: 'Prefers morning appointments. Allergic to lavender.' },
  { id: 'cust_2', full_name: 'Jane Smith', email: 'jane.smith@example.com', phone: '098-765-4321', notes: 'First-time customer. Interested in color services.' },
  { id: 'cust_3', full_name: 'Alice Johnson', email: 'alice.j@example.com', phone: '555-123-4567', notes: '' },
  { id: 'cust_4', full_name: 'Bob Williams', email: 'bob.w@example.com', phone: '555-987-6543', notes: 'VIP Customer. Always offers a tip.' },
];

let mockServices: Service[] = [
  { id: 'serv_1', name: 'Haircut', description: 'Standard men\'s haircut', price: 30, currency: 'USD', duration_minutes: 30, staffIds: ['staff_1', 'staff_2'], average_rating: 4.8, review_count: 15 },
  { id: 'serv_2', name: 'Beard Trim', description: 'Shape and trim beard', price: 15, currency: 'USD', duration_minutes: 15, staffIds: ['staff_1', 'staff_2', 'staff_3'], average_rating: 4.5, review_count: 12 },
  { id: 'serv_3', name: 'Deluxe Shave', description: 'Hot towel shave', price: 45, currency: 'USD', duration_minutes: 45, staffIds: ['staff_2'], average_rating: 5.0, review_count: 8 },
  { id: 'serv_4', name: 'Coloring', description: 'Full hair coloring', price: 75, currency: 'USD', duration_minutes: 90, staffIds: ['staff_1'], average_rating: 4.2, review_count: 5 },
];

const defaultSchedule: StaffSchedule = {
    monday: { is_working: true, start_time: '09:00', end_time: '17:00' },
    tuesday: { is_working: true, start_time: '09:00', end_time: '17:00' },
    wednesday: { is_working: true, start_time: '09:00', end_time: '17:00' },
    thursday: { is_working: true, start_time: '09:00', end_time: '17:00' },
    friday: { is_working: true, start_time: '09:00', end_time: '17:00' },
    saturday: { is_working: false, start_time: '10:00', end_time: '16:00' },
    sunday: { is_working: false, start_time: '10:00', end_time: '16:00' },
};

let mockStaff: Staff[] = [
    { id: 'staff_1', full_name: 'Mike Miller', email: 'mike.m@example.com', phone: '555-111-2222', role: 'Stylist', schedule: defaultSchedule, average_rating: 4.7, review_count: 20 },
    { id: 'staff_2', full_name: 'Sarah Chen', email: 'sarah.c@example.com', phone: '555-333-4444', role: 'Manager', schedule: defaultSchedule, average_rating: 4.9, review_count: 10 },
    { id: 'staff_3', full_name: 'David Lee', email: 'david.l@example.com', phone: '555-555-6666', role: 'Assistant', schedule: { ...defaultSchedule, friday: { is_working: false, start_time: '09:00', end_time: '17:00' } }, average_rating: 4.4, review_count: 5 },
];

const generateMockBookings = (): Booking[] => {
  const bookings: Booking[] = [];
  const today = new Date();
  
  const createBooking = (date: Date, hour: number, customer: Customer, service: Service, staff: Staff, status: Booking['status'] = 'confirmed', reminder_sent_at: string | null = null) => {
    const startDate = new Date(date);
    startDate.setHours(hour, 0, 0, 0);
    const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000);
    bookings.push({
      id: crypto.randomUUID(),
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      status,
      customer: { id: customer.id, full_name: customer.full_name },
      service: { id: service.id, name: service.name, duration_minutes: service.duration_minutes },
      staff: { id: staff.id, full_name: staff.full_name },
      reminder_sent_at,
      payment_status: 'unpaid',
      payment_intent_id: null,
    });
  };

  // --- Generate rich booking history ---
  // John Doe (Frequent Customer)
  createBooking(new Date(new Date().setDate(today.getDate() - 60)), 10, mockCustomers[0], mockServices[0], mockStaff[0], 'completed');
  createBooking(new Date(new Date().setDate(today.getDate() - 30)), 11, mockCustomers[0], mockServices[1], mockStaff[1], 'completed');
  createBooking(today, 9, mockCustomers[0], mockServices[0], mockStaff[0], 'confirmed', new Date().toISOString());
  createBooking(new Date(new Date().setDate(today.getDate() + 14)), 14, mockCustomers[0], mockServices[1], mockStaff[0], 'confirmed');

  // Jane Smith (New Customer)
  createBooking(new Date(new Date().setDate(today.getDate() - 5)), 11, mockCustomers[1], mockServices[2], mockStaff[1], 'completed');
  
  // Alice Johnson (Lapsed Customer)
  createBooking(new Date(new Date().setDate(today.getDate() - 90)), 10, mockCustomers[2], mockServices[0], mockStaff[2], 'completed');

  // Bob Williams (Active Customer)
  createBooking(new Date(new Date().setDate(today.getDate() - 20)), 16, mockCustomers[3], mockServices[2], mockStaff[1], 'completed');
  createBooking(new Date(new Date().setDate(today.getDate() + 5)), 16, mockCustomers[3], mockServices[3], mockStaff[1]);

  return bookings;
};

let mockBookings: Booking[] = generateMockBookings();

export const fetchBookings = async (): Promise<Booking[]> => {
  console.log('Fetching bookings...');
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('Fetched bookings:', mockBookings);
      resolve([...mockBookings]);
    }, 800);
  });
};

export const fetchCustomers = async (): Promise<Customer[]> => {
  console.log('Fetching customers...');
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('Fetched customers:', mockCustomers);
      resolve([...mockCustomers]);
    }, 500);
  });
};

export const fetchCustomerById = async (id: string): Promise<Customer | undefined> => {
  console.log(`Fetching customer by ID: ${id}`);
  return new Promise(resolve => {
    setTimeout(() => {
        const customer = mockCustomers.find(c => c.id === id);
        resolve(customer);
    }, 300);
  });
};


export const fetchServices = async (): Promise<Service[]> => {
  console.log('Fetching services...');
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('Fetched services:', mockServices);
      resolve([...mockServices]);
    }, 500);
  });
};

export const fetchStaff = async (): Promise<Staff[]> => {
  console.log('Fetching staff...');
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('Fetched staff:', mockStaff);
      resolve([...mockStaff]);
    }, 500);
  });
};


export const createBooking = async (data: NewBookingData): Promise<Booking[]> => {
    console.log('Creating booking with data:', data);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const customer = mockCustomers.find(c => c.id === data.customerId);
            const service = mockServices.find(s => s.id === data.serviceId);
            const staff = mockStaff.find(st => st.id === data.staffId);

            if (!customer || !service || !staff) {
                return reject(new Error('Invalid customer, service or staff ID'));
            }

            const newBookings: Booking[] = [];
            const parentBookingId = crypto.randomUUID();

            if (data.recurrenceRule && data.recurrenceEndDate) {
                let currentStartDate = new Date(data.startTime);
                const recurrenceEndDate = new Date(data.recurrenceEndDate);

                while(currentStartDate <= recurrenceEndDate) {
                    const endDate = new Date(currentStartDate.getTime() + service.duration_minutes * 60000);
                    newBookings.push({
                        id: crypto.randomUUID(),
                        start_at: currentStartDate.toISOString(),
                        end_at: endDate.toISOString(),
                        status: 'confirmed',
                        customer: { id: customer.id, full_name: customer.full_name },
                        service: { id: service.id, name: service.name, duration_minutes: service.duration_minutes },
                        staff: { id: staff.id, full_name: staff.full_name },
                        reminder_sent_at: null,
                        recurrence_rule: data.recurrenceRule,
                        recurrence_end_date: data.recurrenceEndDate,
                        parent_booking_id: parentBookingId,
                        payment_status: 'unpaid',
                        payment_intent_id: null,
                    });
                    
                    if(data.recurrenceRule === 'weekly') {
                        currentStartDate.setDate(currentStartDate.getDate() + 7);
                    } else if (data.recurrenceRule === 'monthly') {
                        currentStartDate.setMonth(currentStartDate.getMonth() + 1);
                    } else {
                        break; // Should not happen
                    }
                }
            } else {
                const startDate = new Date(data.startTime);
                const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000);
                newBookings.push({
                    id: parentBookingId,
                    start_at: startDate.toISOString(),
                    end_at: endDate.toISOString(),
                    status: 'confirmed',
                    customer: { id: customer.id, full_name: customer.full_name },
                    service: { id: service.id, name: service.name, duration_minutes: service.duration_minutes },
                    staff: { id: staff.id, full_name: staff.full_name },
                    reminder_sent_at: null,
                    payment_status: 'unpaid',
                    payment_intent_id: null,
                });
            }

            mockBookings.push(...newBookings);
            mockBookings.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
            
            console.log('Created new bookings:', newBookings);
            resolve(newBookings);
        }, 1000);
    });
};

export const updateBooking = async (bookingId: string, data: Partial<NewBookingData & { status: BookingStatus }>): Promise<Booking> => {
    console.log(`Updating booking ${bookingId} with data:`, data);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const bookingIndex = mockBookings.findIndex(b => b.id === bookingId);
            if (bookingIndex === -1) {
                return reject(new Error('Booking not found'));
            }

            const originalBooking = mockBookings[bookingIndex];

            const customer = data.customerId ? mockCustomers.find(c => c.id === data.customerId) : originalBooking.customer;
            const service = data.serviceId ? mockServices.find(s => s.id === data.serviceId) : originalBooking.service;
            const staff = data.staffId ? mockStaff.find(st => st.id === data.staffId) : originalBooking.staff;
            
            if (!customer || !service || !staff) {
                return reject(new Error('Invalid customer, service or staff ID'));
            }
            
            const serviceDetails = data.serviceId ? mockServices.find(s=>s.id === data.serviceId) : originalBooking.service
            if(!serviceDetails) return reject(new Error('Service details not found'));
            
            const startDate = data.startTime ? new Date(data.startTime) : new Date(originalBooking.start_at);
            const endDate = new Date(startDate.getTime() + serviceDetails.duration_minutes * 60000);

            const updatedBooking: Booking = {
                ...originalBooking,
                start_at: startDate.toISOString(),
                end_at: endDate.toISOString(),
                status: data.status || originalBooking.status,
                customer: { id: customer.id, full_name: customer.full_name },
                service: { id: service.id, name: service.name, duration_minutes: serviceDetails.duration_minutes },
                staff: { id: staff.id, full_name: staff.full_name },
            };

            mockBookings[bookingIndex] = updatedBooking;

            // If status changed to completed, trigger review creation
            if (data.status === 'completed' && originalBooking.status !== 'completed') {
                createPendingReview(updatedBooking);
            }

            mockBookings.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
            
            console.log('Updated booking:', updatedBooking);
            resolve(updatedBooking);
        }, 1000);
    });
};

export const deleteBooking = async (bookingId: string): Promise<{ success: boolean }> => {
    console.log(`Deleting booking with ID: ${bookingId}`);
    return new Promise(resolve => {
        setTimeout(() => {
            const initialLength = mockBookings.length;
            mockBookings = mockBookings.filter(b => b.id !== bookingId);
            const success = mockBookings.length < initialLength;
            console.log(`Delete success: ${success}`);
            resolve({ success });
        }, 500);
    });
};

export const createService = async (data: NewServiceData): Promise<Service> => {
    console.log('Creating service with data:', data);
    return new Promise((resolve) => {
        setTimeout(() => {
            const newService: Service = {
                id: `serv_${crypto.randomUUID()}`,
                currency: 'USD',
                average_rating: 0,
                review_count: 0,
                ...data
            };
            mockServices.push(newService);
            resolve(newService);
        }, 500);
    });
};

export const updateService = async (serviceId: string, data: NewServiceData): Promise<Service> => {
    console.log(`Updating service ${serviceId} with data:`, data);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const serviceIndex = mockServices.findIndex(s => s.id === serviceId);
            if (serviceIndex === -1) {
                return reject(new Error('Service not found'));
            }
            const updatedService = { ...mockServices[serviceIndex], ...data };
            mockServices[serviceIndex] = updatedService;
            resolve(updatedService);
        }, 500);
    });
};

export const deleteService = async (serviceId: string): Promise<{ success: boolean }> => {
    console.log(`Deleting service with ID: ${serviceId}`);
    return new Promise(resolve => {
        setTimeout(() => {
            const initialLength = mockServices.length;
            mockServices = mockServices.filter(s => s.id !== serviceId);
            const success = mockServices.length < initialLength;
            resolve({ success });
        }, 500);
    });
};

export const createStaff = async (data: NewStaffData): Promise<Staff> => {
    console.log('Creating staff with data:', data);
    return new Promise((resolve) => {
        setTimeout(() => {
            const newStaff: Staff = {
                id: `staff_${crypto.randomUUID()}`,
                schedule: defaultSchedule,
                average_rating: 0,
                review_count: 0,
                ...data
            };
            mockStaff.push(newStaff);
            resolve(newStaff);
        }, 500);
    });
};

export const updateStaff = async (staffId: string, data: NewStaffData): Promise<Staff> => {
    console.log(`Updating staff ${staffId} with data:`, data);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const staffIndex = mockStaff.findIndex(s => s.id === staffId);
            if (staffIndex === -1) {
                return reject(new Error('Staff not found'));
            }
            const updatedStaff = { ...mockStaff[staffIndex], ...data };
            mockStaff[staffIndex] = updatedStaff;
            resolve(updatedStaff);
        }, 500);
    });
};

export const updateStaffSchedule = async (staffId: string, schedule: StaffSchedule): Promise<Staff> => {
    console.log(`Updating schedule for staff ${staffId}`);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const staffIndex = mockStaff.findIndex(s => s.id === staffId);
            if (staffIndex === -1) {
                return reject(new Error('Staff not found'));
            }
            mockStaff[staffIndex].schedule = schedule;
            console.log('Updated staff schedule:', mockStaff[staffIndex]);
            resolve(mockStaff[staffIndex]);
        }, 500);
    });
};

export const deleteStaff = async (staffId: string): Promise<{ success: boolean }> => {
    console.log(`Deleting staff with ID: ${staffId}`);
    return new Promise(resolve => {
        setTimeout(() => {
            const initialLength = mockStaff.length;
            mockStaff = mockStaff.filter(s => s.id !== staffId);
            const success = mockStaff.length < initialLength;
            resolve({ success });
        }, 500);
    });
};

export const createCustomer = async (data: NewCustomerData): Promise<Customer> => {
    console.log('Creating customer with data:', data);
    return new Promise((resolve) => {
        setTimeout(() => {
            const newCustomer: Customer = {
                id: `cust_${crypto.randomUUID()}`,
                notes: data.notes || '',
                ...data
            };
            mockCustomers.push(newCustomer);
            resolve(newCustomer);
        }, 500);
    });
};

export const updateCustomer = async (customerId: string, data: Partial<NewCustomerData>): Promise<Customer> => {
    console.log(`Updating customer ${customerId} with data:`, data);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const customerIndex = mockCustomers.findIndex(c => c.id === customerId);
            if (customerIndex === -1) {
                return reject(new Error('Customer not found'));
            }
            const updatedCustomer = { ...mockCustomers[customerIndex], ...data };
            mockCustomers[customerIndex] = updatedCustomer;
            resolve(updatedCustomer);
        }, 500);
    });
};

export const deleteCustomer = async (customerId: string): Promise<{ success: boolean }> => {
    console.log(`Deleting customer with ID: ${customerId}`);
    return new Promise(resolve => {
        setTimeout(() => {
            const initialLength = mockCustomers.length;
            mockCustomers = mockCustomers.filter(c => c.id !== customerId);
            const success = mockCustomers.length < initialLength;
            resolve({ success });
        }, 500);
    });
};


let mockBusinessSettings: BusinessSettings = {
    profile: {
        name: 'The Grooming Lounge',
        email: 'contact@groominglounge.com',
        phone: '123-456-7890',
        address: '123 Main St, Anytown, USA 12345',
    },
    hours: {
        monday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        tuesday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        wednesday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        thursday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        friday: { is_working: true, start_time: '09:00', end_time: '18:00' },
        saturday: { is_working: true, start_time: '10:00', end_time: '16:00' },
        sunday: { is_working: false, start_time: '10:00', end_time: '16:00' },
    },
    currency: 'USD',
    marketplace_listing: {
        is_listed: true,
        public_image_url: 'https://placehold.co/800x600/818cf8/ffffff?text=The+Grooming+Lounge',
    },
    payment_settings: {
        stripe_connected: false,
        deposit_type: 'fixed',
        deposit_value: 10.00
    },
// FIX: Added missing 'notification_settings' property to align with BusinessSettings type.
    notification_settings: {
        new_booking_alerts: true,
        cancellation_alerts: true,
    }
};

export const fetchBusinessSettings = async (): Promise<BusinessSettings> => {
    console.log('Fetching business settings...');
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(JSON.parse(JSON.stringify(mockBusinessSettings)));
        }, 700);
    });
};

export const updateBusinessSettings = async (settings: BusinessSettings): Promise<BusinessSettings> => {
    console.log('Updating business settings...');
    return new Promise(resolve => {
        setTimeout(() => {
            mockBusinessSettings = JSON.parse(JSON.stringify(settings));
            console.log('Updated business settings:', mockBusinessSettings);
            resolve(mockBusinessSettings);
        }, 1200);
    });
};

// --- MARKETING MODULE API ---

let mockAudiences: CustomerAudience[] = [
    { id: 'aud_1', name: 'All Customers', description: 'A dynamic list of all customers.', type: 'all', customer_count: 4, created_at: new Date().toISOString() },
    { id: 'aud_2', name: 'Frequent Customers', description: 'Customers with more than 2 bookings.', type: 'frequent', customer_count: 1, created_at: new Date().toISOString() },
];

let mockCampaigns: MarketingCampaign[] = [
    { id: 'camp_1', name: 'Holiday Special', description: '20% off all services in December.', channel: 'Email', status: 'Completed', audience: { id: 'aud_1', name: 'All Customers' }, customers_reached: 4, bookings_generated: 2, created_at: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString() },
    { id: 'camp_2', name: 'New Year, New Look!', description: 'Promote our new coloring services.', channel: 'Social', status: 'Draft', audience: { id: 'aud_2', name: 'Frequent Customers' }, customers_reached: 0, bookings_generated: 0, created_at: new Date().toISOString() },
];

const getAudienceCount = (type: AudienceType): number => {
    const customerBookings = mockCustomers.map(c => ({
        ...c,
        bookings: mockBookings.filter(b => b.customer.id === c.id)
    }));
    
    switch (type) {
        case 'all':
            return mockCustomers.length;
        case 'frequent':
            return customerBookings.filter(c => c.bookings.length > 2).length;
        case 'lapsed':
            const sixtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 60));
            return customerBookings.filter(c => {
                const lastBooking = c.bookings.sort((a,b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())[0];
                return c.bookings.length > 0 && lastBooking && new Date(lastBooking.start_at) < sixtyDaysAgo;
            }).length;
        case 'new':
             const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
             return customerBookings.filter(c => {
                return c.bookings.length === 1 && new Date(c.bookings[0].start_at) > thirtyDaysAgo;
             }).length;
        default:
            return 0;
    }
}


export const fetchAudiences = async (): Promise<CustomerAudience[]> => {
  console.log('Fetching audiences...');
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([...mockAudiences].map(aud => ({ ...aud, customer_count: getAudienceCount(aud.type) })));
    }, 600);
  });
};

export const createAudience = async (data: NewAudienceData): Promise<CustomerAudience> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newAudience: CustomerAudience = {
        id: `aud_${crypto.randomUUID()}`,
        name: data.name,
        description: data.description,
        type: data.type,
        customer_count: getAudienceCount(data.type),
        created_at: new Date().toISOString(),
      };
      mockAudiences.push(newAudience);
      resolve(newAudience);
    }, 500);
  });
};

export const updateAudience = async (id: string, data: NewAudienceData): Promise<CustomerAudience> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockAudiences.findIndex(a => a.id === id);
      if (index === -1) return reject(new Error('Audience not found'));
      const updated = { 
          ...mockAudiences[index], 
          name: data.name,
          description: data.description,
          type: data.type,
          customer_count: getAudienceCount(data.type)
      };
      mockAudiences[index] = updated;
      resolve(updated);
    }, 500);
  });
};

export const deleteAudience = async (id: string): Promise<{ success: boolean }> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const initialLength = mockAudiences.length;
      mockAudiences = mockAudiences.filter(a => a.id !== id);
      resolve({ success: mockAudiences.length < initialLength });
    }, 500);
  });
};


export const fetchCampaigns = async (): Promise<MarketingCampaign[]> => {
  console.log('Fetching campaigns...');
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([...mockCampaigns]);
    }, 700);
  });
};

export const createCampaign = async (data: NewCampaignData): Promise<MarketingCampaign> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const audience = mockAudiences.find(a => a.id === data.audienceId);
      if (!audience) return reject(new Error('Audience not found'));
      const newCampaign: MarketingCampaign = {
        id: `camp_${crypto.randomUUID()}`,
        name: data.name,
        description: data.description,
        channel: data.channel,
        status: data.status,
        audience: { id: audience.id, name: audience.name },
        customers_reached: 0,
        bookings_generated: 0,
        created_at: new Date().toISOString(),
      };
      mockCampaigns.push(newCampaign);
      resolve(newCampaign);
    }, 500);
  });
};

export const updateCampaign = async (id: string, data: Partial<NewCampaignData>): Promise<MarketingCampaign> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockCampaigns.findIndex(c => c.id === id);
      if (index === -1) return reject(new Error('Campaign not found'));
      
      const audience = data.audienceId ? mockAudiences.find(a => a.id === data.audienceId) : mockAudiences.find(a => a.id === mockCampaigns[index].audience.id);
      if (!audience) return reject(new Error('Audience not found'));
      
      const updated = {
        ...mockCampaigns[index],
        ...data,
        audience: { id: audience.id, name: audience.name },
      };
      mockCampaigns[index] = updated;
      resolve(updated);
    }, 500);
  });
};

export const deleteCampaign = async (id: string): Promise<{ success: boolean }> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const initialLength = mockCampaigns.length;
      mockCampaigns = mockCampaigns.filter(c => c.id !== id);
      resolve({ success: mockCampaigns.length < initialLength });
    }, 500);
  });
};

export const sendCampaign = async (id: string): Promise<MarketingCampaign> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = mockCampaigns.findIndex(c => c.id === id);
            if (index === -1) return reject(new Error('Campaign not found'));
            
            const audience = mockAudiences.find(a => a.id === mockCampaigns[index].audience.id);
            if (!audience) return reject(new Error('Audience not found'));

            const customersReached = getAudienceCount(audience.type);
            const bookingsGenerated = Math.floor(Math.random() * (customersReached / 2));

            const updated = {
                ...mockCampaigns[index],
                status: 'Completed' as const,
                customers_reached: customersReached,
                bookings_generated: bookingsGenerated,
            };
            mockCampaigns[index] = updated;
            resolve(updated);
        }, 1500);
    });
};

export const markReminderAsSent = async (bookingId: string): Promise<{ success: boolean }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const booking = mockBookings.find(b => b.id === bookingId);
            if (booking) {
                booking.reminder_sent_at = new Date().toISOString();
            }
            resolve({ success: !!booking });
        }, 200);
    });
};

// --- TIME OFF API ---
let mockTimeOff: TimeOff[] = [
    { id: 'to_1', staff_id: 'staff_1', start_at: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(), end_at: new Date(new Date().setDate(new Date().getDate() + 12)).toISOString(), reason: 'Vacation' }
];

export const fetchTimeOff = async (): Promise<TimeOff[]> => {
    return new Promise(resolve => setTimeout(() => resolve([...mockTimeOff]), 300));
};

export const createTimeOff = async (data: NewTimeOffData): Promise<TimeOff> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const newTimeOff: TimeOff = { id: `to_${crypto.randomUUID()}`, ...data };
            mockTimeOff.push(newTimeOff);
            resolve(newTimeOff);
        }, 500);
    });
};

export const deleteTimeOff = async (id: string): Promise<{ success: boolean }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            mockTimeOff = mockTimeOff.filter(to => to.id !== id);
            resolve({ success: true });
        }, 500);
    });
};

// --- REVIEWS API ---
let mockReviews: Review[] = [];

// Helper to update average ratings
const updateRatings = (serviceId: string, staffId: string) => {
    const serviceReviews = mockReviews.filter(r => r.service_id === serviceId && r.status === 'Published');
    const staffReviews = mockReviews.filter(r => r.staff_id === staffId && r.status === 'Published');

    const serviceIndex = mockServices.findIndex(s => s.id === serviceId);
    if (serviceIndex !== -1) {
        mockServices[serviceIndex].review_count = serviceReviews.length;
        mockServices[serviceIndex].average_rating = serviceReviews.length > 0 ? serviceReviews.reduce((acc, r) => acc + r.rating, 0) / serviceReviews.length : 0;
    }

    const staffIndex = mockStaff.findIndex(s => s.id === staffId);
    if (staffIndex !== -1) {
        mockStaff[staffIndex].review_count = staffReviews.length;
        mockStaff[staffIndex].average_rating = staffReviews.length > 0 ? staffReviews.reduce((acc, r) => acc + r.rating, 0) / staffReviews.length : 0;
    }
};

const createPendingReview = (booking: Booking) => {
    if (mockReviews.some(r => r.booking_id === booking.id)) return; // Don't create duplicates

    setTimeout(() => {
      // Simulate customer submitting the review after a delay
      const randomRating = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
      const comments = [
        "Great service, will be back!", "Excellent experience.", "Very professional.", "Good, but could be better.", "Loved it!", "Fantastic job."
      ];
      const randomComment = comments[Math.floor(Math.random() * comments.length)];

      const newReview: Review = {
        id: `rev_${crypto.randomUUID()}`,
        booking_id: booking.id,
        customer_id: booking.customer.id,
        customer_name: booking.customer.full_name,
        service_id: booking.service.id,
        service_name: booking.service.name,
        staff_id: booking.staff.id,
        staff_name: booking.staff.full_name,
        rating: randomRating,
        comment: randomComment,
        status: 'Pending',
        created_at: new Date().toISOString(),
      };
      mockReviews.unshift(newReview);
      console.log("Generated mock review for completed booking:", newReview);
    }, 5000); // 5-second delay to simulate customer response
};

export const fetchReviews = async (): Promise<Review[]> => {
    return new Promise(resolve => setTimeout(() => resolve([...mockReviews]), 600));
};

export const updateReviewStatus = async (reviewId: string, status: ReviewStatus): Promise<Review> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = mockReviews.findIndex(r => r.id === reviewId);
            if (index === -1) return reject(new Error('Review not found'));
            
            mockReviews[index].status = status;
            updateRatings(mockReviews[index].service_id, mockReviews[index].staff_id);
            
            resolve(mockReviews[index]);
        }, 500);
    });
};

// --- INVENTORY & POS API ---
let mockProducts: Product[] = [
    { id: 'prod_1', name: 'Premium Hair Gel', description: 'Strong hold, matte finish.', price: 18.00, stock_quantity: 50, imageUrl: 'https://placehold.co/400x400/818cf8/ffffff?text=Hair+Gel' },
    { 
        id: 'prod_2', 
        name: 'Beard Oil', 
        description: 'Nourishing and softening. Available in multiple scents.', 
        price: 22.50,
        stock_quantity: 43,
        imageUrl: 'https://placehold.co/400x400/818cf8/ffffff?text=Beard+Oil',
        variants: [
            { id: 'var_1', name: 'Sandalwood', price: 22.50, stock_quantity: 35 },
            { id: 'var_2', name: 'Cedarwood', price: 24.00, stock_quantity: 8 },
        ]
    },
    { id: 'prod_3', name: 'Aftershave Balm', description: 'Soothes and moisturizes skin.', price: 25.00, stock_quantity: 40, imageUrl: 'https://placehold.co/400x400/818cf8/ffffff?text=Balm' },
];

let mockTransactions: Transaction[] = [];

export const fetchProducts = async (): Promise<Product[]> => {
    return new Promise(resolve => setTimeout(() => resolve([...mockProducts]), 400));
};

export const createProduct = async (data: NewProductData): Promise<Product> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const { imageBase64, variants, ...rest } = data;
            
            const newProduct: Product = { 
                id: `prod_${crypto.randomUUID()}`, 
                ...rest,
                imageUrl: imageBase64 || undefined,
            };

            if (variants && variants.length > 0) {
                newProduct.variants = variants.map(v => ({
                    ...v,
                    id: `var_${crypto.randomUUID()}`
                }));
                newProduct.stock_quantity = newProduct.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
                newProduct.price = newProduct.variants.length > 0 ? Math.min(...newProduct.variants.map(v => v.price)) : 0;
            }

            mockProducts.push(newProduct);
            resolve(newProduct);
        }, 500);
    });
};

// FIX: Handle NewProductData to Product conversion correctly, especially for variants.
export const createProductsBulk = async (data: NewProductData[]): Promise<BulkImportResult> => {
    console.log(`Bulk creating ${data.length} products`);
    return new Promise(resolve => {
        setTimeout(() => {
            const createdProducts: Product[] = [];
            data.forEach(pData => {
                const { imageBase64, variants, ...rest } = pData;
            
                const newProduct: Product = { 
                    id: `prod_${crypto.randomUUID()}`, 
                    ...rest,
                    imageUrl: imageBase64 || undefined,
                };

                if (variants && variants.length > 0) {
                    newProduct.variants = variants.map(v => ({
                        ...v,
                        id: `var_${crypto.randomUUID()}`
                    }));
                    newProduct.stock_quantity = newProduct.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
                    newProduct.price = newProduct.variants.length > 0 ? Math.min(...newProduct.variants.map(v => v.price)) : 0;
                }

                createdProducts.push(newProduct);
            });
            mockProducts.push(...createdProducts);
            const result: BulkImportResult = {
                successCount: createdProducts.length,
                errorCount: 0,
                createdProducts: createdProducts,
            };
            console.log('Bulk create complete:', result);
            resolve(result);
        }, 1500);
    });
};

export const updateProduct = async (id: string, data: NewProductData): Promise<Product> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = mockProducts.findIndex(p => p.id === id);
            if (index === -1) return reject(new Error('Product not found'));
            
            const { imageBase64, variants, ...rest } = data;
            
            const updatedProduct: Product = { 
                ...mockProducts[index], 
                ...rest,
            };

            if (data.hasOwnProperty('imageBase64')) {
                updatedProduct.imageUrl = imageBase64 || undefined;
            }

            if (variants) {
                if (variants.length > 0) {
                     updatedProduct.variants = variants.map(v => {
                        const existing = mockProducts[index].variants?.find(ev => ev.name === v.name);
                        return { ...v, id: existing?.id || `var_${crypto.randomUUID()}`};
                    });
                    updatedProduct.stock_quantity = updatedProduct.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
                    updatedProduct.price = Math.min(...updatedProduct.variants.map(v => v.price));
                } else {
                    delete updatedProduct.variants;
                    updatedProduct.stock_quantity = data.stock_quantity;
                    updatedProduct.price = data.price;
                }
            }


            mockProducts[index] = updatedProduct;
            resolve(updatedProduct);
        }, 500);
    });
};

export const deleteProduct = async (id: string): Promise<{ success: boolean }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            mockProducts = mockProducts.filter(p => p.id !== id);
            resolve({ success: true });
        }, 500);
    });
};

export const fetchTransactions = async (): Promise<Transaction[]> => {
    return new Promise(resolve => setTimeout(() => resolve([...mockTransactions]), 700));
};

export const createTransaction = async (data: NewTransactionData): Promise<{transaction: Transaction, updatedProducts: Product[]}> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const subtotal = data.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
            
            let discountAmount = 0;
            if (data.discount) {
                if (data.discount.type === 'percentage') {
                    discountAmount = subtotal * (data.discount.value / 100);
                } else {
                    discountAmount = data.discount.value;
                }
            }
            
            const totalBeforeTax = subtotal - discountAmount;
            const taxAmount = totalBeforeTax * 0.10; // 10% tax
            const total = totalBeforeTax + taxAmount;
            
            const newTransaction: Transaction = {
                id: `txn_${crypto.randomUUID()}`,
                ...data,
                subtotal,
                tax_amount: taxAmount,
                total,
                created_at: new Date().toISOString(),
            };
            mockTransactions.unshift(newTransaction);
            
            // Update booking if linked
            if (data.booking_id) {
                const bookingIndex = mockBookings.findIndex(b => b.id === data.booking_id);
                if (bookingIndex !== -1) {
                    mockBookings[bookingIndex].transaction_id = newTransaction.id;
                }
            }

            // Update stock quantities
            const updatedProductIds = new Set<string>();
            data.items.forEach(item => {
                if (item.type === 'product') {
                    const productIndex = mockProducts.findIndex(p => p.id === item.id);
                    if (productIndex !== -1) {
                        mockProducts[productIndex].stock_quantity -= item.quantity;
                        updatedProductIds.add(item.id);
                    }
                }
            });
            const updatedProducts = mockProducts.filter(p => updatedProductIds.has(p.id));

            resolve({ transaction: newTransaction, updatedProducts });
        }, 1200);
    });
};