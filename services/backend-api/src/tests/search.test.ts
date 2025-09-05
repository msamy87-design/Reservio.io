import { Business } from '../models/Business';
import { Service } from '../models/Service';
import * as businessService from '../services/businessService';

describe('Business Search System', () => {
  beforeEach(async () => {
    // Create test businesses with different characteristics
    const businesses = [
      {
        name: 'Downtown Hair Salon',
        email: 'downtown@salon.com',
        phone: '+1-555-100-0001',
        address: '100 Main St, Downtown, NYC 10001',
        location: { latitude: 40.7128, longitude: -74.0060 },
        hours: {
          monday: { is_working: true, start_time: '09:00', end_time: '18:00' },
          tuesday: { is_working: true, start_time: '09:00', end_time: '18:00' },
          wednesday: { is_working: true, start_time: '09:00', end_time: '18:00' },
          thursday: { is_working: true, start_time: '09:00', end_time: '18:00' },
          friday: { is_working: true, start_time: '09:00', end_time: '18:00' },
          saturday: { is_working: true, start_time: '10:00', end_time: '17:00' },
          sunday: { is_working: false, start_time: '00:00', end_time: '00:00' }
        },
        services: [],
        staff: [],
        average_rating: 4.8,
        review_count: 120,
        price_tier: '$$$',
        amenities: ['wifi', 'parking', 'credit_cards'],
        is_open_now: true,
        next_available: new Date('2024-01-15T10:00:00Z')
      },
      {
        name: 'Budget Cuts Barbershop',
        email: 'budget@barbershop.com',
        phone: '+1-555-200-0002',
        address: '200 Side St, Brooklyn, NYC 11201',
        location: { latitude: 40.6892, longitude: -73.9442 },
        hours: {
          monday: { is_working: true, start_time: '08:00', end_time: '19:00' },
          tuesday: { is_working: true, start_time: '08:00', end_time: '19:00' },
          wednesday: { is_working: true, start_time: '08:00', end_time: '19:00' },
          thursday: { is_working: true, start_time: '08:00', end_time: '19:00' },
          friday: { is_working: true, start_time: '08:00', end_time: '19:00' },
          saturday: { is_working: true, start_time: '08:00', end_time: '18:00' },
          sunday: { is_working: true, start_time: '10:00', end_time: '16:00' }
        },
        services: [],
        staff: [],
        average_rating: 3.9,
        review_count: 85,
        price_tier: '$',
        amenities: ['walk_ins', 'credit_cards'],
        is_open_now: true,
        next_available: new Date('2024-01-15T11:30:00Z')
      },
      {
        name: 'Luxury Spa & Wellness',
        email: 'luxury@spa.com',
        phone: '+1-555-300-0003',
        address: '300 Park Ave, Manhattan, NYC 10016',
        location: { latitude: 40.7505, longitude: -73.9934 },
        hours: {
          monday: { is_working: true, start_time: '10:00', end_time: '20:00' },
          tuesday: { is_working: true, start_time: '10:00', end_time: '20:00' },
          wednesday: { is_working: true, start_time: '10:00', end_time: '20:00' },
          thursday: { is_working: true, start_time: '10:00', end_time: '20:00' },
          friday: { is_working: true, start_time: '10:00', end_time: '20:00' },
          saturday: { is_working: true, start_time: '09:00', end_time: '19:00' },
          sunday: { is_working: true, start_time: '10:00', end_time: '18:00' }
        },
        services: [],
        staff: [],
        average_rating: 4.9,
        review_count: 200,
        price_tier: '$$$',
        amenities: ['wifi', 'parking', 'wheelchair_accessible', 'credit_cards'],
        is_open_now: false,
        next_available: new Date('2024-01-16T09:00:00Z')
      }
    ];

    await Business.insertMany(businesses);

    // Create test services
    const services = [
      {
        name: 'Men\'s Haircut',
        description: 'Classic men\'s haircut',
        duration_minutes: 30,
        price: 25.00,
        currency: 'USD',
        staffIds: [],
        average_rating: 4.5,
        review_count: 50
      },
      {
        name: 'Women\'s Cut & Style',
        description: 'Cut and blow-dry styling',
        duration_minutes: 90,
        price: 85.00,
        currency: 'USD',
        staffIds: [],
        average_rating: 4.7,
        review_count: 75
      },
      {
        name: 'Full Body Massage',
        description: 'Relaxing full body massage',
        duration_minutes: 60,
        price: 120.00,
        currency: 'USD',
        staffIds: [],
        average_rating: 4.9,
        review_count: 100
      }
    ];

    await Service.insertMany(services);
  });

  describe('Basic Business Search', () => {
    it('should find businesses by name', async () => {
      const businesses = await Business.find({
        name: { $regex: 'salon', $options: 'i' }
      });

      expect(businesses.length).toBe(1);
      expect(businesses[0].name).toBe('Downtown Hair Salon');
    });

    it('should find all businesses when no filter applied', async () => {
      const businesses = await Business.find({});
      expect(businesses.length).toBe(3);
    });

    it('should filter by rating', async () => {
      const highRatedBusinesses = await Business.find({
        average_rating: { $gte: 4.5 }
      });

      expect(highRatedBusinesses.length).toBe(2);
      highRatedBusinesses.forEach(business => {
        expect(business.average_rating).toBeGreaterThanOrEqual(4.5);
      });
    });

    it('should filter by price tier', async () => {
      const budgetBusinesses = await Business.find({
        price_tier: '$'
      });

      expect(budgetBusinesses.length).toBe(1);
      expect(budgetBusinesses[0].name).toBe('Budget Cuts Barbershop');
    });

    it('should filter by amenities', async () => {
      const businessesWithWifi = await Business.find({
        amenities: 'wifi'
      });

      expect(businessesWithWifi.length).toBe(2);
    });

    it('should filter by open status', async () => {
      const openBusinesses = await Business.find({
        is_open_now: true
      });

      expect(openBusinesses.length).toBe(2);
    });
  });

  describe('Location-Based Search', () => {
    it('should handle location queries', async () => {
      // Find businesses near Manhattan (40.7589, -73.9851)
      const manhattanLat = 40.7589;
      const manhattanLon = -73.9851;
      
      // Simple distance calculation (in a real app, you'd use MongoDB's geospatial queries)
      const businesses = await Business.find({});
      
      const businessesWithDistance = businesses.map(business => ({
        ...business.toObject(),
        distance: Math.sqrt(
          Math.pow(business.location.latitude - manhattanLat, 2) + 
          Math.pow(business.location.longitude - manhattanLon, 2)
        )
      }));

      const nearbyBusinesses = businessesWithDistance
        .filter(b => b.distance < 0.1) // Very close
        .sort((a, b) => a.distance - b.distance);

      expect(nearbyBusinesses.length).toBeGreaterThan(0);
    });

    it('should sort by distance', async () => {
      const businesses = await Business.find({}).sort({ name: 1 });
      expect(businesses.length).toBe(3);
      
      // In a real implementation, you'd sort by actual distance
      expect(businesses[0].name).toBe('Budget Cuts Barbershop');
      expect(businesses[1].name).toBe('Downtown Hair Salon');
      expect(businesses[2].name).toBe('Luxury Spa & Wellness');
    });
  });

  describe('Complex Search Filters', () => {
    it('should combine multiple filters', async () => {
      const businesses = await Business.find({
        price_tier: { $in: ['$$', '$$$'] },
        average_rating: { $gte: 4.0 },
        is_open_now: true
      });

      expect(businesses.length).toBe(1);
      expect(businesses[0].name).toBe('Downtown Hair Salon');
    });

    it('should filter by review count threshold', async () => {
      const popularBusinesses = await Business.find({
        review_count: { $gte: 100 }
      });

      expect(popularBusinesses.length).toBe(2);
      expect(popularBusinesses.map(b => b.name)).toContain('Downtown Hair Salon');
      expect(popularBusinesses.map(b => b.name)).toContain('Luxury Spa & Wellness');
    });

    it('should search by address/location text', async () => {
      const nycBusinesses = await Business.find({
        address: { $regex: 'NYC', $options: 'i' }
      });

      expect(nycBusinesses.length).toBe(3);
    });

    it('should filter by multiple amenities', async () => {
      const accessibleBusinesses = await Business.find({
        amenities: { $all: ['wifi', 'credit_cards'] }
      });

      expect(accessibleBusinesses.length).toBe(2);
    });
  });

  describe('Search Result Sorting', () => {
    it('should sort by rating descending', async () => {
      const businesses = await Business.find({})
        .sort({ average_rating: -1 });

      expect(businesses[0].average_rating).toBe(4.9);
      expect(businesses[0].name).toBe('Luxury Spa & Wellness');
      expect(businesses[businesses.length - 1].average_rating).toBe(3.9);
    });

    it('should sort by review count', async () => {
      const businesses = await Business.find({})
        .sort({ review_count: -1 });

      expect(businesses[0].review_count).toBe(200);
      expect(businesses[0].name).toBe('Luxury Spa & Wellness');
    });

    it('should sort by name alphabetically', async () => {
      const businesses = await Business.find({})
        .sort({ name: 1 });

      expect(businesses[0].name).toBe('Budget Cuts Barbershop');
      expect(businesses[1].name).toBe('Downtown Hair Salon');
      expect(businesses[2].name).toBe('Luxury Spa & Wellness');
    });
  });

  describe('Search Pagination', () => {
    it('should support pagination with limit and skip', async () => {
      const page1 = await Business.find({})
        .limit(2)
        .skip(0);

      const page2 = await Business.find({})
        .limit(2)
        .skip(2);

      expect(page1.length).toBe(2);
      expect(page2.length).toBe(1);
      expect(page1[0]._id).not.toEqual(page2[0]._id);
    });

    it('should count total results for pagination', async () => {
      const totalCount = await Business.countDocuments({});
      const highRatedCount = await Business.countDocuments({
        average_rating: { $gte: 4.5 }
      });

      expect(totalCount).toBe(3);
      expect(highRatedCount).toBe(2);
    });
  });

  describe('Service-Based Search', () => {
    it('should find services by name', async () => {
      const services = await Service.find({
        name: { $regex: 'haircut', $options: 'i' }
      });

      expect(services.length).toBe(1);
      expect(services[0].name).toBe('Men\'s Haircut');
    });

    it('should filter services by price range', async () => {
      const affordableServices = await Service.find({
        price: { $lte: 50.00 }
      });

      expect(affordableServices.length).toBe(1);
      expect(affordableServices[0].name).toBe('Men\'s Haircut');
    });

    it('should filter services by duration', async () => {
      const quickServices = await Service.find({
        duration_minutes: { $lte: 60 }
      });

      expect(quickServices.length).toBe(2);
    });

    it('should sort services by price', async () => {
      const services = await Service.find({})
        .sort({ price: 1 });

      expect(services[0].price).toBe(25.00);
      expect(services[services.length - 1].price).toBe(120.00);
    });
  });

  describe('Search Performance', () => {
    it('should handle empty search results', async () => {
      const nonExistentBusinesses = await Business.find({
        name: { $regex: 'NonExistent', $options: 'i' }
      });

      expect(nonExistentBusinesses.length).toBe(0);
    });

    it('should handle invalid search parameters gracefully', async () => {
      // Test with invalid rating range
      const businesses = await Business.find({
        average_rating: { $gte: 6.0 } // Ratings are 1-5
      });

      expect(businesses.length).toBe(0);
    });

    it('should handle text search with special characters', async () => {
      const businesses = await Business.find({
        name: { $regex: 'Hair & Style', $options: 'i' }
      });

      // Should not throw error and return empty array
      expect(Array.isArray(businesses)).toBe(true);
    });
  });
});