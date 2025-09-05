
import { PublicBusinessProfile, DayOfWeek, BusinessHours } from '../../../../types';
import * as dateFns from 'date-fns';
import { Business, IBusiness } from '../models/Business';
import { Service, IService } from '../models/Service';
import { Staff, IStaff } from '../models/Staff';
import { Booking, IBooking } from '../models/Booking';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

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
    try {
        let query: any = {
            isActive: true,
            verification_status: 'approved',
            'marketplace_listing.is_listed': true
        };

        // Build optimized geospatial query for location-based search
        if (lat && lon) {
            const userLat = parseFloat(lat);
            const userLon = parseFloat(lon);
            const radiusInMiles = 50; // Search radius in miles
            const radiusInMeters = radiusInMiles * 1609.34; // Convert to meters for MongoDB
            
            // Use efficient geospatial query with proper indexing
            query.latitude = { $ne: null };
            query.longitude = { $ne: null };
            
            // Add distance calculation using optimized aggregation pipeline approach
            // This will be used in the aggregation pipeline below for better performance
            
        } else if (locationQuery) {
            // Text-based location search
            query.address = { $regex: new RegExp(locationQuery, 'i') };
        }

        // Date availability filter - check if business is working on given day
        if (filters.date) {
            try {
                const targetDate = dateFns.parse(filters.date, 'yyyy-MM-dd', new Date());
                const dayOfWeek = dateFns.format(targetDate, 'eeee').toLowerCase() as DayOfWeek;
                query[`hours.${dayOfWeek}.is_working`] = true;
            } catch (e) {
                logger.error('Invalid date format for filtering:', filters.date);
            }
        }

        // Rating filter
        if (filters.minRating) {
            query['stats.average_rating'] = { $gte: parseFloat(filters.minRating) };
        }

        // Get businesses using optimized query with location support
        let businesses;
        
        if (lat && lon) {
            const userLat = parseFloat(lat);
            const userLon = parseFloat(lon);
            const radiusInMeters = 50 * 1609.34; // 50 miles in meters
            
            // Use aggregation pipeline for efficient geospatial queries
            businesses = await Business.aggregate([
                {
                    $match: {
                        ...query,
                        latitude: { $ne: null },
                        longitude: { $ne: null }
                    }
                },
                {
                    $addFields: {
                        distance: {
                            $sqrt: {
                                $add: [
                                    {
                                        $pow: [
                                            {
                                                $multiply: [
                                                    { $subtract: ['$latitude', userLat] },
                                                    111320 // meters per degree latitude
                                                ]
                                            },
                                            2
                                        ]
                                    },
                                    {
                                        $pow: [
                                            {
                                                $multiply: [
                                                    { $subtract: ['$longitude', userLon] },
                                                    { $multiply: [111320, { $cos: { $multiply: [userLat, Math.PI / 180] } }] }
                                                ]
                                            },
                                            2
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                },
                {
                    $match: {
                        distance: { $lte: radiusInMeters }
                    }
                },
                {
                    $project: {
                        'payment_settings.stripe_account_id': 0,
                        'notification_settings': 0
                    }
                },
                {
                    $sort: {
                        'marketplace_listing.featured': -1,
                        distance: 1, // Closest first
                        'stats.average_rating': -1
                    }
                }
            ]);
        } else {
            // Standard query without location
            businesses = await Business.find(query)
                .select('-payment_settings.stripe_account_id -notification_settings')
                .sort({ 'stats.average_rating': -1, 'marketplace_listing.featured': -1 })
                .lean();
        }

        if (!businesses || businesses.length === 0) {
            return [];
        }

        // If service query or price filters, need to join with services
        if (serviceQuery || filters.minPrice || filters.maxPrice) {
            const businessIds = businesses.map(b => b._id);
            let serviceFilter: any = {
                businessId: { $in: businessIds },
                isActive: true
            };

            if (serviceQuery) {
                serviceFilter.$text = { $search: serviceQuery };
            }

            if (filters.minPrice || filters.maxPrice) {
                serviceFilter.price = {};
                if (filters.minPrice) serviceFilter.price.$gte = parseFloat(filters.minPrice);
                if (filters.maxPrice) serviceFilter.price.$lte = parseFloat(filters.maxPrice);
            }

            const matchingServices = await Service.find(serviceFilter).select('businessId name price duration_minutes').lean();
            const businessesWithMatchingServices = new Set(matchingServices.map(s => s.businessId.toString()));
            
            // Filter businesses to only those with matching services
            businesses = businesses.filter(b => businessesWithMatchingServices.has(b._id.toString()));

            // Attach services to each business
            const servicesByBusiness = matchingServices.reduce((acc, service) => {
                const bizId = service.businessId.toString();
                if (!acc[bizId]) acc[bizId] = [];
                acc[bizId].push(service);
                return acc;
            }, {} as Record<string, any[]>);

            return businesses.map(business => {
                const services = servicesByBusiness[business._id.toString()] || [];
                return {
                    id: business._id.toString(),
                    name: business.name,
                    address: business.address,
                    phone: business.phone,
                    description: business.description,
                    website: business.website,
                    imageUrl: business.marketplace_listing.public_image_url || business.imageUrl,
                    latitude: business.latitude,
                    longitude: business.longitude,
                    average_rating: business.stats.average_rating,
                    review_count: business.stats.review_count,
                    featured: business.marketplace_listing.featured,
                    services: services.map(s => ({
                        id: s._id.toString(),
                        name: s.name,
                        price: s.price,
                        duration_minutes: s.duration_minutes
                    }))
                };
            });
        } else {
            // For businesses without service filters, we still need to get their services
            const businessIds = businesses.map(b => b._id);
            const allServices = await Service.find({
                businessId: { $in: businessIds },
                isActive: true
            }).select('businessId name price duration_minutes').lean();

            const servicesByBusiness = allServices.reduce((acc, service) => {
                const bizId = service.businessId.toString();
                if (!acc[bizId]) acc[bizId] = [];
                acc[bizId].push(service);
                return acc;
            }, {} as Record<string, any[]>);

            return businesses.map(business => ({
                id: business._id.toString(),
                name: business.name,
                address: business.address,
                phone: business.phone,
                description: business.description,
                website: business.website,
                imageUrl: business.marketplace_listing.public_image_url || business.imageUrl,
                latitude: business.latitude,
                longitude: business.longitude,
                average_rating: business.stats.average_rating,
                review_count: business.stats.review_count,
                featured: business.marketplace_listing.featured,
                services: (servicesByBusiness[business._id.toString()] || []).map(s => ({
                    id: s._id.toString(),
                    name: s.name,
                    price: s.price,
                    duration_minutes: s.duration_minutes
                }))
            }));
        }
    } catch (error) {
        logger.error('Error searching businesses:', error);
        throw new Error('Failed to search businesses');
    }
};

export const getBusinessById = async (id: string): Promise<PublicBusinessProfile | null> => {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }

        const business = await Business.findOne({ 
            _id: id,
            isActive: true,
            verification_status: 'approved',
            'marketplace_listing.is_listed': true
        })
        .select('-payment_settings.stripe_account_id -notification_settings')
        .lean();

        if (!business) return null;

        // Get services for this business
        const services = await Service.find({ 
            businessId: business._id, 
            isActive: true 
        })
        .select('name price duration_minutes')
        .lean();

        return {
            id: business._id.toString(),
            name: business.name,
            address: business.address,
            phone: business.phone,
            description: business.description,
            website: business.website,
            imageUrl: business.marketplace_listing.public_image_url || business.imageUrl,
            latitude: business.latitude,
            longitude: business.longitude,
            average_rating: business.stats.average_rating,
            review_count: business.stats.review_count,
            featured: business.marketplace_listing.featured,
            services: services.map(s => ({
                id: s._id.toString(),
                name: s.name,
                price: s.price,
                duration_minutes: s.duration_minutes
            }))
        };
    } catch (error) {
        logger.error('Error getting business by ID:', error);
        return null;
    }
};

export const getBusinessesByIds = async (ids: string[]): Promise<PublicBusinessProfile[]> => {
    try {
        const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validIds.length === 0) return [];

        const businesses = await Business.find({ 
            _id: { $in: validIds },
            isActive: true,
            verification_status: 'approved',
            'marketplace_listing.is_listed': true
        })
        .select('-payment_settings.stripe_account_id -notification_settings')
        .lean();

        if (!businesses || businesses.length === 0) return [];

        // Get services for all businesses
        const businessIds = businesses.map(b => b._id);
        const services = await Service.find({
            businessId: { $in: businessIds },
            isActive: true
        })
        .select('businessId name price duration_minutes')
        .lean();

        const servicesByBusiness = services.reduce((acc, service) => {
            const bizId = service.businessId.toString();
            if (!acc[bizId]) acc[bizId] = [];
            acc[bizId].push(service);
            return acc;
        }, {} as Record<string, any[]>);

        return businesses.map(business => ({
            id: business._id.toString(),
            name: business.name,
            address: business.address,
            phone: business.phone,
            description: business.description,
            website: business.website,
            imageUrl: business.marketplace_listing.public_image_url || business.imageUrl,
            latitude: business.latitude,
            longitude: business.longitude,
            average_rating: business.stats.average_rating,
            review_count: business.stats.review_count,
            featured: business.marketplace_listing.featured,
            services: (servicesByBusiness[business._id.toString()] || []).map(s => ({
                id: s._id.toString(),
                name: s.name,
                price: s.price,
                duration_minutes: s.duration_minutes
            }))
        }));
    } catch (error) {
        logger.error('Error getting businesses by IDs:', error);
        return [];
    }
}

export const getAvailability = async (businessId: string, serviceId: string, staffId: string, date: string): Promise<Record<string, string[]>> => {
    try {
        if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(serviceId)) {
            throw new Error('Invalid business or service ID');
        }

        // Validate date format and ensure it's not in the past
        const targetDate = dateFns.parse(date, 'yyyy-MM-dd', new Date());
        if (!dateFns.isValid(targetDate)) {
            throw new Error('Invalid date format. Use yyyy-MM-dd');
        }
        if (dateFns.isBefore(targetDate, dateFns.startOfDay(new Date()))) {
            throw new Error('Cannot get availability for past dates');
        }

        // Get business and service details
        const business = await Business.findOne({ _id: businessId, isActive: true }).lean();
        const service = await Service.findOne({ _id: serviceId, businessId, isActive: true }).lean();

        if (!business || !service) {
            throw new Error('Business or service not found');
        }

        const dayOfWeek = dateFns.format(targetDate, 'eeee').toLowerCase() as DayOfWeek;
        
        // Check if business is working on this day
        const businessHours = business.hours[dayOfWeek];
        if (!businessHours || !businessHours.is_working) {
            return {}; // Business is closed on this day
        }

        // Get relevant staff members
        let staffQuery: any = {
            businessId: new mongoose.Types.ObjectId(businessId),
            isActive: true,
            serviceIds: new mongoose.Types.ObjectId(serviceId)
        };

        if (staffId && staffId !== 'any' && mongoose.Types.ObjectId.isValid(staffId)) {
            staffQuery._id = new mongoose.Types.ObjectId(staffId);
        }

        const relevantStaff = await Staff.find(staffQuery).lean();
        
        if (!relevantStaff || relevantStaff.length === 0) {
            return {}; // No staff available for this service
        }

        // Get all bookings for relevant staff on target date
        const startOfDay = dateFns.startOfDay(targetDate);
        const endOfDay = dateFns.endOfDay(targetDate);
        const staffIds = relevantStaff.map(s => s._id);
        
        const dayBookings = await Booking.find({
            staffId: { $in: staffIds },
            startAt: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            status: { $nin: ['cancelled', 'no_show'] }
        })
        .select('staffId startAt endAt')
        .lean();

        // Group bookings by staff
        const bookingsByStaff = dayBookings.reduce((acc, booking) => {
            const staffIdStr = booking.staffId.toString();
            if (!acc[staffIdStr]) acc[staffIdStr] = [];
            acc[staffIdStr].push(booking);
            return acc;
        }, {} as Record<string, any[]>);

        const availabilityByStaff: Record<string, string[]> = {};

        for (const staff of relevantStaff) {
            const staffIdStr = staff._id.toString();
            const staffSchedule = staff.schedule[dayOfWeek];
            
            // Check if staff is working on this day
            if (!staffSchedule || !staffSchedule.is_working) continue;

            const staffBookings = bookingsByStaff[staffIdStr] || [];
            const availableSlots: string[] = [];
            
            // Parse staff working hours
            let currentTime = dateFns.parse(staffSchedule.start_time, 'HH:mm', targetDate);
            const endTime = dateFns.parse(staffSchedule.end_time, 'HH:mm', targetDate);
            
            // Buffer time between appointments
            const bufferMinutes = staff.availability?.buffer_time_minutes || 15;
            
            while (dateFns.isBefore(dateFns.addMinutes(currentTime, service.duration_minutes), endTime)) {
                const slotEnd = dateFns.addMinutes(currentTime, service.duration_minutes);
                
                // Check for conflicts with existing bookings
                const hasConflict = staffBookings.some(booking => {
                    return dateFns.areIntervalsOverlapping(
                        { start: currentTime, end: slotEnd },
                        { start: booking.startAt, end: booking.endAt },
                        { inclusive: false }
                    );
                });

                // Check for conflicts with staff breaks
                const hasBreakConflict = staffSchedule.breaks?.some(breakPeriod => {
                    const breakStart = dateFns.parse(breakPeriod.start_time, 'HH:mm', targetDate);
                    const breakEnd = dateFns.parse(breakPeriod.end_time, 'HH:mm', targetDate);
                    return dateFns.areIntervalsOverlapping(
                        { start: currentTime, end: slotEnd },
                        { start: breakStart, end: breakEnd },
                        { inclusive: false }
                    );
                });

                // Only include slots that are in the future and have no conflicts
                if (!hasConflict && !hasBreakConflict && dateFns.isAfter(currentTime, new Date())) {
                    availableSlots.push(dateFns.format(currentTime, 'HH:mm'));
                }

                // Move to next time slot (every 15 minutes)
                currentTime = dateFns.addMinutes(currentTime, 15);
            }

            if (availableSlots.length > 0) {
                availabilityByStaff[staffIdStr] = availableSlots;
            }
        }
        
        return availabilityByStaff;
    } catch (error) {
        logger.error('Error getting availability:', error);
        throw error;
    }
};
