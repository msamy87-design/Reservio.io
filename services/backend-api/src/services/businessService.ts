import { mockBusinesses, mockBusinessSettings, mockServices, mockStaff, mockReviews, mockBookings, mockTimeOff } from '../data/mockData';
import { PublicBusinessProfile } from '../types/business';
import * as dateFns from 'date-fns';
import { DayOfWeek } from '../../../../types';

export const searchBusinesses = async (params: { location?: string; service?: string }): Promise<PublicBusinessProfile[]> => {
    // Mock search logic
    let results = mockBusinesses.filter(b => b.verification_status === 'approved');
    if (params.location) {
        results = results.filter(b => b.address.toLowerCase().includes(params.location!.toLowerCase()));
    }
    // In a real app, service search would be more complex (e.g., checking services offered by business)
    // For now, we'll just return all approved businesses if no location is specified
    
    // Enrich with details
    return results.map(b => {
        const settings = mockBusinessSettings[b.id];
        if (!settings) return null;

        const reviewsForBusiness = mockReviews.slice(0, 5); // Mock
        const avgRating = reviewsForBusiness.length > 0 ? reviewsForBusiness.reduce((acc, r) => acc + r.rating, 0) / reviewsForBusiness.length : 0;

        return {
            id: b.id,
            name: b.name,
            address: b.address,
            phone: b.phone,
            imageUrl: settings.marketplace_listing.public_image_url,
            services: mockServices, // Simplified
            staff: mockStaff, // Simplified
            reviews: reviewsForBusiness,
            average_rating: avgRating,
            review_count: reviewsForBusiness.length,
        };
    }).filter(b => b !== null) as PublicBusinessProfile[];
};

export const getBusinessById = async (id: string): Promise<PublicBusinessProfile | null> => {
    const business = mockBusinesses.find(b => b.id === id);
    if (!business || business.verification_status !== 'approved') {
        return null;
    }
    const settings = mockBusinessSettings[id];
    if (!settings) return null;
    
    const reviewsForBusiness = mockReviews.slice(0, 5); // Mock
    const avgRating = reviewsForBusiness.length > 0 ? reviewsForBusiness.reduce((acc, r) => acc + r.rating, 0) / reviewsForBusiness.length : 0;
    
    return {
        id: business.id,
        name: business.name,
        address: business.address,
        phone: business.phone,
        imageUrl: settings.marketplace_listing.public_image_url,
        services: mockServices, // Simplified
        staff: mockStaff, // Simplified
        reviews: reviewsForBusiness,
        average_rating: avgRating,
        review_count: reviewsForBusiness.length,
    };
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

export const getAvailableSlots = async (staffId: string, serviceId: string, date: Date): Promise<string[]> => {
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

export const getCombinedAvailability = async (serviceId: string, date: Date): Promise<Record<string, string[]>> => {
    const service = mockServices.find(s => s.id === serviceId);
    if (!service) {
        throw new Error('Service not found');
    }
    
    const staffForService = mockStaff.filter(s => service.staffIds.includes(s.id));
    const availability: Record<string, string[]> = {};

    for (const staff of staffForService) {
        const slots = await getAvailableSlots(staff.id, serviceId, date);
        for (const slot of slots) {
            if (!availability[slot]) {
                availability[slot] = [];
            }
            availability[slot].push(staff.id);
        }
    }
    return availability;
};
