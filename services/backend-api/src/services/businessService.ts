import { mockBusinesses, mockServices, mockStaff, mockReviews, mockBookings, mockTimeOff, mockBusinessSettings } from '../data/mockData';
import { PublicBusinessProfile, PublicService, PublicStaff, PublicReview, Booking, DayOfWeek, Service } from '../../../../types';
import * as dateFns from 'date-fns';

const toPublicBusinessProfile = (business: any): PublicBusinessProfile => {
    return {
        id: business.id,
        name: business.name,
        address: business.address,
        phone: business.phone,
        imageUrl: mockBusinessSettings[business.id]?.marketplace_listing.public_image_url || 'https://placehold.co/800x600/cccccc/ffffff?text=Image+Not+Available',
        average_rating: 4.7, // MOCKED
        review_count: 32, // MOCKED
        services: mockServices.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            price: s.price,
            duration_minutes: s.duration_minutes,
        })),
        staff: mockStaff.map(s => ({
            id: s.id,
            full_name: s.full_name,
            role: s.role,
        })),
        reviews: mockReviews.filter(r => r.status === 'Published').map(r => ({
            id: r.id,
            customer_name: r.customer_name,
            rating: r.rating,
            comment: r.comment,
            created_at: r.created_at,
        })),
    };
};


export const searchBusinesses = async (params: { location?: string, service?: string }): Promise<PublicBusinessProfile[]> => {
    // This is a mock search. In a real app, you'd query a database.
    return mockBusinesses
        .filter(b => b.verification_status === 'approved')
        .map(toPublicBusinessProfile);
};

export const getBusinessById = async (id: string): Promise<PublicBusinessProfile | null> => {
    const business = mockBusinesses.find(b => b.id === id);
    if (!business || business.verification_status !== 'approved') {
        return null;
    }
    return toPublicBusinessProfile(business);
};

export const getBusinessesByIds = async (ids: string[]): Promise<PublicBusinessProfile[]> => {
    return mockBusinesses
        .filter(b => ids.includes(b.id) && b.verification_status === 'approved')
        .map(toPublicBusinessProfile);
};

export const getAvailableSlots = async (staffId: string, serviceId: string, date: Date): Promise<string[]> => {
    const staff = mockStaff.find(s => s.id === staffId);
    const service = mockServices.find(s => s.id === serviceId);

    if (!staff || !service) {
        throw new Error('Staff member or service not found.');
    }

    const dayOfWeek = dateFns.format(date, 'EEEE').toLowerCase() as DayOfWeek;
    const schedule = staff.schedule[dayOfWeek];

    if (!schedule.is_working) {
        return [];
    }

    const businessDayStart = dateFns.parse(schedule.start_time, 'HH:mm', date);
    const businessDayEnd = dateFns.parse(schedule.end_time, 'HH:mm', date);

    const staffBookings = mockBookings.filter(b => b.staff.id === staffId && dateFns.isSameDay(new Date(b.start_at), date));
    const staffTimeOff = mockTimeOff.filter(t => t.staff_id === staffId || t.staff_id === 'all').filter(t => dateFns.isWithinInterval(date, { start: new Date(t.start_at), end: new Date(t.end_at) }));

    if (staffTimeOff.length > 0) return []; // Full day off

    const availableSlots: string[] = [];
    let currentTime = businessDayStart;

    while (dateFns.isBefore(dateFns.addMinutes(currentTime, service.duration_minutes), businessDayEnd)) {
        const slotEnd = dateFns.addMinutes(currentTime, service.duration_minutes);
        const slotInterval = { start: currentTime, end: slotEnd };

        const isOverlapping = staffBookings.some(booking =>
            dateFns.areIntervalsOverlapping(
                slotInterval,
                { start: new Date(booking.start_at), end: new Date(booking.end_at) },
                { inclusive: false }
            )
        );

        if (!isOverlapping) {
            availableSlots.push(dateFns.format(currentTime, 'HH:mm'));
        }

        currentTime = dateFns.addMinutes(currentTime, 15); // Check every 15 minutes
    }
    
    return availableSlots;
};

export const getCombinedAvailability = async (serviceId: string, date: Date): Promise<Record<string, string[]>> => {
    const service = mockServices.find(s => s.id === serviceId);
    if (!service) throw new Error("Service not found");
    
    const staffForService = mockStaff.filter(s => service.staffIds.includes(s.id));
    
    const availabilityByStaff: Record<string, string[]> = {};

    for (const staff of staffForService) {
        const slots = await getAvailableSlots(staff.id, serviceId, date);
        if (slots.length > 0) {
            availabilityByStaff[staff.id] = slots;
        }
    }
    
    return availabilityByStaff;
};
