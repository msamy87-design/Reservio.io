
import { mockBusinesses, mockServices, mockStaff, mockReviews, mockBookings } from '../data/mockData';
import { PublicBusinessProfile, DayOfWeek, BusinessHours } from '../../../../types';
import * as dateFns from 'date-fns';

// Haversine formula to calculate distance between two lat/lon points in miles
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Define an internal type that includes properties needed for filtering
type InternalBusinessProfile = PublicBusinessProfile & { hours: BusinessHours };


export const searchBusinesses = async (
    serviceQuery: string, 
    locationQuery: string, 
    filters: any,
    lat?: string,
    lon?: string
): Promise<PublicBusinessProfile[]> => {
    
    let results: InternalBusinessProfile[] = [...mockBusinesses];

    // Geolocation search
    if (lat && lon) {
        const userLat = parseFloat(lat);
        const userLon = parseFloat(lon);
        results = results.filter(biz => {
            if (biz.latitude && biz.longitude) {
                const distance = getDistance(userLat, userLon, biz.latitude, biz.longitude);
                return distance < 50; // 50-mile radius
            }
            return false;
        });
    } else if (locationQuery) { // Fallback to text location if no geo
        const lowerCaseLocation = locationQuery.toLowerCase();
        results = results.filter(biz =>
            biz.address.toLowerCase().includes(lowerCaseLocation)
        );
    }
    
    // Service search
    if (serviceQuery) {
        const lowerCaseService = serviceQuery.toLowerCase();
        results = results.filter(biz =>
            biz.services.some(s => s.name.toLowerCase().includes(lowerCaseService))
        );
    }

    // Advanced filters
    if (filters.minPrice) {
        results = results.filter(biz => biz.services.some(s => s.price >= filters.minPrice));
    }
    if (filters.maxPrice) {
        results = results.filter(biz => biz.services.some(s => s.price <= filters.maxPrice));
    }
    if (filters.minRating) {
        results = results.filter(biz => biz.average_rating >= filters.minRating);
    }
    if (filters.date) {
        try {
            const targetDate = dateFns.parse(filters.date, 'yyyy-MM-dd', new Date());
            const dayOfWeek = dateFns.format(targetDate, 'eeee').toLowerCase() as DayOfWeek;
            results = results.filter(biz => biz.hours[dayOfWeek]?.is_working);
        } catch (e) {
            console.error("Invalid date format for filtering:", filters.date);
        }
    }

    // Map to public profile to remove internal-only fields like 'hours'
    return results.map(({ hours, ...publicProfile }) => publicProfile);
};

export const getBusinessById = async (id: string): Promise<PublicBusinessProfile | null> => {
    const business = mockBusinesses.find(b => b.id === id);
    if (!business) return null;
    const { hours, verification_status, owner_email, ...publicProfile } = business;
    return { ...publicProfile }; // Return a copy
};

export const getBusinessesByIds = async (ids: string[]): Promise<PublicBusinessProfile[]> => {
    return mockBusinesses
        .filter(b => ids.includes(b.id))
        .map(({ hours, verification_status, owner_email, ...publicProfile }) => publicProfile);
}

export const getAvailability = async (businessId: string, serviceId: string, staffId: string, date: string): Promise<Record<string, string[]>> => {
    const business = mockBusinesses.find(b => b.id === businessId);
    const service = mockServices.find(s => s.id === serviceId);

    if (!business || !service) {
        throw new Error('Business or service not found');
    }

    const targetDate = dateFns.parse(date, 'yyyy-MM-dd', new Date());
    const dayOfWeek = dateFns.format(targetDate, 'eeee').toLowerCase() as keyof PublicBusinessProfile['hours'];
    
    const relevantStaff = staffId && staffId !== 'any'
        ? business.staff.filter(s => s.id === staffId)
        : business.staff;

    const availabilityByStaff: Record<string, string[]> = {};

    for (const staff of relevantStaff) {
        const fullStaffDetails = mockStaff.find(s => s.id === staff.id);
        const staffSchedule = fullStaffDetails?.schedule[dayOfWeek as DayOfWeek];
        if (!staffSchedule || !staffSchedule.is_working) continue;

        const staffBookings = mockBookings.filter(b =>
            b.staff.id === staff.id &&
            dateFns.isSameDay(dateFns.parseISO(b.start_at), targetDate)
        );
        
        const availableSlots: string[] = [];
        let currentTime = dateFns.parse(staffSchedule.start_time, 'HH:mm', targetDate);
        const endTime = dateFns.parse(staffSchedule.end_time, 'HH:mm', targetDate);

        while (dateFns.isBefore(dateFns.addMinutes(currentTime, service.duration_minutes), endTime)) {
            const slotEnd = dateFns.addMinutes(currentTime, service.duration_minutes);
            
            const isOverlapping = staffBookings.some(booking => {
                const bookingStart = dateFns.parseISO(booking.start_at);
                const bookingEnd = dateFns.parseISO(booking.end_at);
                return dateFns.areIntervalsOverlapping(
                    { start: currentTime, end: slotEnd },
                    { start: bookingStart, end: bookingEnd },
                    { inclusive: false }
                );
            });

            if (!isOverlapping && dateFns.isAfter(currentTime, new Date())) {
                availableSlots.push(dateFns.format(currentTime, 'HH:mm'));
            }

            currentTime = dateFns.addMinutes(currentTime, 15); // Check every 15 minutes
        }

        if (availableSlots.length > 0) {
            availabilityByStaff[staff.id] = availableSlots;
        }
    }
    
    return availabilityByStaff;
};
