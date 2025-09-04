
import { mockBusinesses, mockBusinessSettings, mockServices, mockStaff, mockReviews, mockBookings, mockTimeOff } from '../data/mockData';
// FIX: Correctly import shared types to resolve module errors.
import { PublicBusinessProfile, DayOfWeek, PublicService, PublicStaff, PublicReview } from '../../../../types';
import * as dateFns from 'date-fns';

const shapeBusinessProfile = (business: any): PublicBusinessProfile | null => {
    const settings = mockBusinessSettings[business.id];
    if (!settings || !settings.marketplace_listing.is_listed) return null;

    // Correctly filter data for THIS business
    const servicesForBusiness = mockServices; // In a real DB, this would be filtered by business ID
    const staffForBusiness = mockStaff; // In a real DB, this would be filtered by business ID
    const reviewsForBusiness = mockReviews.filter(r => r.status === 'Published'); // Simplified for mock

    const avgRating = reviewsForBusiness.length > 0 ? reviewsForBusiness.reduce((acc, r) => acc + r.rating, 0) / reviewsForBusiness.length : 0;
    
    // Explicitly shape public data to avoid leaking complex objects
    const publicServices: PublicService[] = servicesForBusiness.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: s.price,
        duration_minutes: s.duration_minutes,
    }));
    
    const publicStaff: PublicStaff[] = staffForBusiness.map(s => ({
        id: s.id,
        full_name: s.full_name,
        role: s.role,
        average_rating: s.average_rating,
        review_count: s.review_count,
    }));

    const publicReviews: PublicReview[] = reviewsForBusiness.slice(0, 5).map(r => ({
        id: r.id,
        customer_name: r.customer_name,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
    }));

    const profile: PublicBusinessProfile = {
        id: business.id,
        name: business.name,
        address: business.address,
        phone: business.phone,
        imageUrl: settings.marketplace_listing.public_image_url,
        services: publicServices,
        staff: publicStaff,
        reviews: publicReviews,
        average_rating: avgRating,
        review_count: reviewsForBusiness.length,
    };
    return profile;
}


export const searchBusinesses = async (params: { location?: string; service?: string }): Promise<PublicBusinessProfile[]> => {
    // Mock search logic
    let results = mockBusinesses.filter(b => b.verification_status === 'approved');
    if (params.location && params.location.trim().length > 0) {
        results = results.filter(b => b.address.toLowerCase().includes(params.location!.trim().toLowerCase()));
    }
    
    if (params.service && params.service.trim().length > 0) {
        const serviceNameQuery = params.service.trim().toLowerCase();
        // Filter businesses that offer a matching service
        const businessesWithService = new Set(mockServices.filter(s => s.name.toLowerCase().includes(serviceNameQuery)).flatMap(s => {
             // This logic is simplified; in a real app, services would be linked to businesses.
             // For now, we assume all businesses offer all services.
            return mockBusinesses.map(b => b.id);
        }));
        if (businessesWithService.size === 0) return [];
        results = results.filter(b => businessesWithService.has(b.id));
    }
    
    // Enrich with details
    return results
        .map(shapeBusinessProfile)
        .filter((b): b is PublicBusinessProfile => b !== null);
};

export const getBusinessById = async (id: string): Promise<PublicBusinessProfile | null> => {
    const business = mockBusinesses.find(b => b.id === id);
    if (!business || business.verification_status !== 'approved') {
        return null;
    }
    return shapeBusinessProfile(business);
};

export const getBusinessesByIds = async (ids: string[]): Promise<PublicBusinessProfile[]> => {
    const businesses = await Promise.all(ids.map(id => getBusinessById(id)));
    return businesses.filter(b => b !== null) as PublicBusinessProfile[];
};

export const updateBusinessProfile = async (businessId: string, data: Partial<{ is_listed: boolean, imageUrl: string }>) => {
    if (mockBusinessSettings[businessId]) {
        if (data.is_listed !== undefined) {
            mockBusinessSettings[businessId].marketplace_listing.is_listed = data.is_listed;
        }
        if (data.imageUrl) {
            mockBusinessSettings[businessId].marketplace_listing.public_image_url = data.imageUrl;
        }
        return mockBusinessSettings[businessId];
    }
    throw new Error('Business not found');
};

const calculateSlotsForStaff = async (staffId: string, serviceId: string, date: Date): Promise<string[]> => {
    const staff = mockStaff.find(s => s.id === staffId);
    const service = mockServices.find(s => s.id === serviceId);
    
    if (!staff || !service) {
        throw new Error('Staff or service not found');
    }
    
    const dayOfWeek = dateFns.format(date, 'eeee').toLowerCase() as DayOfWeek;
    const staffSchedule = staff.schedule[dayOfWeek];
    
    if (!staffSchedule.is_working) {
        return [];
    }
    
    const staffBookings = mockBookings.filter(b => b.staff.id === staffId && dateFns.isSameDay(new Date(b.start_at), date));
    const staffTimeOff = mockTimeOff.filter(t => (t.staff_id === staffId || t.staff_id === 'all') && dateFns.isWithinInterval(date, { start: new Date(t.start_at), end: new Date(t.end_at) }));

    const slots: string[] = [];
    const serviceDuration = service.duration_minutes;
    
    let currentTime = dateFns.parse(staffSchedule.start_time, 'HH:mm', date);
    const endTime = dateFns.parse(staffSchedule.end_time, 'HH:mm', date);

    while (dateFns.isBefore(dateFns.addMinutes(currentTime, serviceDuration), endTime)) {
        const slotEnd = dateFns.addMinutes(currentTime, serviceDuration);
        const slotInterval = { start: currentTime, end: slotEnd };

        const isBooked = staffBookings.some(b => dateFns.areIntervalsOverlapping(slotInterval, { start: new Date(b.start_at), end: new Date(b.end_at) }));
        const isTimeOff = staffTimeOff.some(t => dateFns.areIntervalsOverlapping(slotInterval, { start: new Date(t.start_at), end: new Date(t.end_at) }));

        if (!isBooked && !isTimeOff) {
            slots.push(dateFns.format(currentTime, 'HH:mm'));
        }
        
        currentTime = dateFns.addMinutes(currentTime, 15); // Check every 15 minutes
    }
    
    return slots;
};

export const getAvailableSlots = async (staffId: string, serviceId: string, date: Date): Promise<Record<string, string[]>> => {
    const slots = await calculateSlotsForStaff(staffId, serviceId, date);
    const result: Record<string, string[]> = {};
    slots.forEach(slot => {
        result[slot] = [staffId];
    });
    return result;
};

export const getCombinedAvailability = async (serviceId: string, date: Date): Promise<Record<string, string[]>> => {
    const service = mockServices.find(s => s.id === serviceId);
    if (!service) {
        throw new Error('Service not found');
    }
    
    const staffForService = mockStaff.filter(s => service.staffIds.includes(s.id));
    const availability: Record<string, string[]> = {};

    for (const staff of staffForService) {
        const slots = await calculateSlotsForStaff(staff.id, serviceId, date);
        for (const slot of slots) {
            if (!availability[slot]) {
                availability[slot] = [];
            }
            availability[slot].push(staff.id);
        }
    }
    return availability;
};