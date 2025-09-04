import { PublicBusinessProfile, PublicService, PublicStaff, PublicReview } from '../types/business';
import { mockStaff, mockServices, mockReviews, mockBookings, mockTimeOff } from '../data/mockData';
import { StaffSchedule } from '../types/booking';
import * as dateFns from 'date-fns';

// --- MOCK DATABASE OF PUBLIC BUSINESS PROFILES ---
// In a real application, this data would come from a database.
const mockBusinesses: Omit<PublicBusinessProfile, 'services'|'staff'|'reviews'>[] = [
    {
        id: 'biz_1',
        name: 'The Grooming Lounge',
        address: '123 Main St, Anytown, USA 12345',
        phone: '123-456-7890',
        average_rating: 4.8,
        review_count: 15,
        imageUrl: 'https://placehold.co/800x600/818cf8/ffffff?text=The+Grooming+Lounge',
        is_listed: true,
    },
    {
        id: 'biz_2',
        name: 'Sunset Salon & Spa',
        address: '456 Ocean Dr, Seaville, USA 54321',
        phone: '987-654-3210',
        average_rating: 4.9,
        review_count: 32,
        imageUrl: 'https://placehold.co/400x400/f472b6/ffffff?text=Salon',
        is_listed: true,
    },
];


interface SearchCriteria {
    location?: string;
    service?: string;
}

export const searchBusinesses = async (criteria: SearchCriteria): Promise<PublicBusinessProfile[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            let results = [...mockBusinesses].filter(b => b.is_listed).map(b => ({
                ...b,
                services: mockServices.map(s => ({...s, description: ''})), // simplified for search
                staff: [],
                reviews: []
            }));

            if (criteria.location) {
                const locationQuery = criteria.location.toLowerCase();
                results = results.filter(business => business.address.toLowerCase().includes(locationQuery));
            }

            if (criteria.service) {
                const serviceQuery = criteria.service.toLowerCase();
                results = results.filter(business => business.services.some(s => s.name.toLowerCase().includes(serviceQuery)));
            }

            resolve(results);
        }, 500); 
    });
};

export const getBusinessById = async (id: string): Promise<PublicBusinessProfile | undefined> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const business = mockBusinesses.find(b => b.id === id);
            if (!business) return resolve(undefined);

            const businessProfile: PublicBusinessProfile = {
                ...business,
                services: mockServices.map(({currency, staffIds, average_rating, review_count, ...s}) => s),
                staff: mockStaff.map(({email, phone, schedule, average_rating, review_count, ...s}) => s),
                reviews: mockReviews
                    .filter(r => r.status === 'Published')
                    .map(({booking_id, customer_id, service_id, staff_id, status, ...r}) => r),
            };
            resolve(businessProfile);
        }, 300);
    });
};

export const getBusinessesByIds = async (ids: string[]): Promise<PublicBusinessProfile[]> => {
     return new Promise(resolve => {
        setTimeout(() => {
            const businesses = mockBusinesses
                .filter(b => ids.includes(b.id))
                .map(b => ({
                    ...b,
                     services: mockServices.map(s => ({...s, description: ''})),
                     staff: [],
                     reviews: []
                }));
            resolve(businesses as PublicBusinessProfile[]);
        }, 300);
    });
};

export const updateBusinessProfile = async (id: string, data: Partial<{ is_listed: boolean; imageUrl: string }>): Promise<PublicBusinessProfile> => {
     return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = mockBusinesses.findIndex(b => b.id === id);
            if (index === -1) {
                return reject(new Error('Business not found'));
            }
            if (data.is_listed !== undefined) {
                (mockBusinesses[index] as PublicBusinessProfile).is_listed = data.is_listed;
            }
            if (data.imageUrl) {
                (mockBusinesses[index] as PublicBusinessProfile).imageUrl = data.imageUrl;
            }
            resolve(mockBusinesses[index] as PublicBusinessProfile);
        }, 500);
    });
};

const calculateSlotsForStaff = (staffId: string, serviceId: string, date: Date): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const staff = mockStaff.find(s => s.id === staffId);
        const service = mockServices.find(s => s.id === serviceId);

        if (!staff || !service) {
            return reject(new Error('Staff or Service not found.'));
        }

        const dayOfWeek = dateFns.format(date, 'eeee').toLowerCase() as keyof StaffSchedule;
        const staffDaySchedule = staff.schedule[dayOfWeek];

        if (!staffDaySchedule.is_working) {
            return resolve([]);
        }

        const availableSlots: string[] = [];
        const interval = 15; // 15-minute intervals
        const serviceDuration = service.duration_minutes;

        const dayStart = dateFns.parse(staffDaySchedule.start_time, 'HH:mm', date);
        const dayEnd = dateFns.parse(staffDaySchedule.end_time, 'HH:mm', date);
        
        let currentTime = dayStart;
        
        while (dateFns.addMinutes(currentTime, serviceDuration) <= dayEnd) {
            const slotEnd = dateFns.addMinutes(currentTime, serviceDuration);
            let isSlotAvailable = true;

            // Check against existing bookings
            const staffBookingsOnDate = mockBookings.filter(b => 
                b.staff.id === staffId && 
                dateFns.isSameDay(new Date(b.start_at), date) &&
                b.status === 'confirmed'
            );

            for (const booking of staffBookingsOnDate) {
                const bookingStart = new Date(booking.start_at);
                const bookingEnd = new Date(booking.end_at);
                if (dateFns.areIntervalsOverlapping({ start: currentTime, end: slotEnd }, { start: bookingStart, end: bookingEnd })) {
                    isSlotAvailable = false;
                    break;
                }
            }
            if (!isSlotAvailable) {
                currentTime = dateFns.addMinutes(currentTime, interval);
                continue;
            }

            // Check against time off
            const staffTimeOff = mockTimeOff.filter(t => (t.staff_id === staffId || t.staff_id === 'all'));
             for (const off of staffTimeOff) {
                const offStart = new Date(off.start_at);
                const offEnd = new Date(off.end_at);
                if (dateFns.areIntervalsOverlapping({ start: currentTime, end: slotEnd }, { start: offStart, end: offEnd })) {
                    isSlotAvailable = false;
                    break;
                }
            }
            
            if (isSlotAvailable) {
                availableSlots.push(dateFns.format(currentTime, 'HH:mm'));
            }

            currentTime = dateFns.addMinutes(currentTime, interval);
        }
        
        resolve(availableSlots);
    });
};


export const getAvailableSlots = async (staffId: string, serviceId: string, date: Date): Promise<Record<string, string[]>> => {
    const slots = await calculateSlotsForStaff(staffId, serviceId, date);
    const result: Record<string, string[]> = {};
    slots.forEach(time => {
        result[time] = [staffId];
    });
    return result;
};


export const getCombinedAvailability = async (serviceId: string, date: Date): Promise<Record<string, string[]>> => {
    const service = mockServices.find(s => s.id === serviceId);
    if (!service) {
        throw new Error('Service not found.');
    }

    const qualifiedStaffIds = service.staffIds.length > 0 ? service.staffIds : mockStaff.map(s => s.id);

    const allSlotsPromises = qualifiedStaffIds.map(staffId => 
        calculateSlotsForStaff(staffId, serviceId, date).then(slots => ({ staffId, slots }))
    );

    const staffSlotsArray = await Promise.all(allSlotsPromises);

    const combinedSlots: Record<string, string[]> = {};

    staffSlotsArray.forEach(({ staffId, slots }) => {
        slots.forEach(time => {
            if (!combinedSlots[time]) {
                combinedSlots[time] = [];
            }
            combinedSlots[time].push(staffId);
        });
    });

    return combinedSlots;
};