import mongoose, { Document, Schema } from 'mongoose';
import { logger } from '../utils/logger';
import { cacheService } from './cacheService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Multi-tenant Types
interface ITenant extends Document {
  id: string;
  name: string;
  slug: string; // unique identifier for subdomain
  domain?: string; // custom domain
  plan: 'starter' | 'professional' | 'enterprise' | 'white-label';
  status: 'active' | 'suspended' | 'trial' | 'cancelled';
  
  // Subscription details
  subscription: {
    plan: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    trialEnd?: Date;
  };
  
  // Configuration
  settings: {
    branding: {
      logo?: string;
      primaryColor: string;
      secondaryColor: string;
      customCss?: string;
    };
    features: {
      [key: string]: boolean;
    };
    limits: {
      users: number;
      businesses: number;
      bookings: number;
      storage: number; // in MB
    };
    integrations: {
      stripe?: { accountId: string; webhookSecret: string };
      google?: { clientId: string; clientSecret: string };
      facebook?: { appId: string; appSecret: string };
      mailgun?: { apiKey: string; domain: string };
    };
  };
  
  // Contact information
  contact: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
  
  // Database configuration
  database: {
    type: 'shared' | 'dedicated';
    connectionString?: string;
    name: string;
  };
  
  // Usage metrics
  usage: {
    users: number;
    businesses: number;
    bookings: number;
    storage: number;
    lastCalculated: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

interface ITenantUser extends Document {
  tenantId: string;
  userId: string;
  role: 'owner' | 'admin' | 'manager' | 'user';
  permissions: string[];
  status: 'active' | 'inactive' | 'invited';
  invitedBy?: string;
  invitedAt?: Date;
  joinedAt?: Date;
}

// Tenant Schema
const TenantSchema = new Schema<ITenant>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  domain: { type: String, sparse: true, unique: true },
  plan: { 
    type: String, 
    enum: ['starter', 'professional', 'enterprise', 'white-label'],
    default: 'starter'
  },
  status: { 
    type: String, 
    enum: ['active', 'suspended', 'trial', 'cancelled'],
    default: 'trial'
  },
  
  subscription: {
    plan: { type: String, required: true },
    status: { type: String, required: true },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    trialEnd: Date
  },
  
  settings: {
    branding: {
      logo: String,
      primaryColor: { type: String, default: '#3B82F6' },
      secondaryColor: { type: String, default: '#1F2937' },
      customCss: String
    },
    features: {
      type: Map,
      of: Boolean,
      default: new Map()
    },
    limits: {
      users: { type: Number, default: 5 },
      businesses: { type: Number, default: 1 },
      bookings: { type: Number, default: 100 },
      storage: { type: Number, default: 1024 }
    },
    integrations: {
      stripe: {
        accountId: String,
        webhookSecret: String
      },
      google: {
        clientId: String,
        clientSecret: String
      },
      facebook: {
        appId: String,
        appSecret: String
      },
      mailgun: {
        apiKey: String,
        domain: String
      }
    }
  },
  
  contact: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    company: String
  },
  
  database: {
    type: { 
      type: String, 
      enum: ['shared', 'dedicated'],
      default: 'shared'
    },
    connectionString: String,
    name: { type: String, required: true }
  },
  
  usage: {
    users: { type: Number, default: 0 },
    businesses: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
    storage: { type: Number, default: 0 },
    lastCalculated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Tenant User Schema
const TenantUserSchema = new Schema<ITenantUser>({
  tenantId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['owner', 'admin', 'manager', 'user'],
    default: 'user'
  },
  permissions: [{ type: String }],
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'invited'],
    default: 'invited'
  },
  invitedBy: String,
  invitedAt: Date,
  joinedAt: Date
}, {
  timestamps: true
});

// Indexes
TenantSchema.index({ slug: 1 });
TenantSchema.index({ domain: 1 });
TenantSchema.index({ status: 1 });
TenantUserSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

// Models
const Tenant = mongoose.model<ITenant>('Tenant', TenantSchema);
const TenantUser = mongoose.model<ITenantUser>('TenantUser', TenantUserSchema);

// Plan configurations
const PLAN_FEATURES = {
  starter: {
    users: 5,
    businesses: 1,
    bookings: 100,
    storage: 1024,
    features: {
      customBranding: false,
      advancedAnalytics: false,
      whiteLabel: false,
      api: false,
      sso: false,
      prioritySupport: false
    }
  },
  professional: {
    users: 25,
    businesses: 5,
    bookings: 1000,
    storage: 5120,
    features: {
      customBranding: true,
      advancedAnalytics: true,
      whiteLabel: false,
      api: true,
      sso: false,
      prioritySupport: true
    }
  },
  enterprise: {
    users: 100,
    businesses: 20,
    bookings: 10000,
    storage: 20480,
    features: {
      customBranding: true,
      advancedAnalytics: true,
      whiteLabel: false,
      api: true,
      sso: true,
      prioritySupport: true
    }
  },
  'white-label': {
    users: -1, // unlimited
    businesses: -1,
    bookings: -1,
    storage: -1,
    features: {
      customBranding: true,
      advancedAnalytics: true,
      whiteLabel: true,
      api: true,
      sso: true,
      prioritySupport: true
    }
  }
};

// Multi-tenant Service
export class MultiTenantService {
  private tenantConnections: Map<string, mongoose.Connection> = new Map();

  // Create a new tenant
  async createTenant(data: {
    name: string;
    slug: string;
    domain?: string;
    plan?: string;
    contact: {
      name: string;
      email: string;
      phone?: string;
      company?: string;
    };
  }): Promise<ITenant> {
    try {
      // Validate slug is available
      const existingTenant = await Tenant.findOne({ 
        $or: [
          { slug: data.slug },
          { domain: data.domain }
        ]
      });

      if (existingTenant) {
        throw new Error('Tenant slug or domain already exists');
      }

      // Create tenant database name
      const dbName = `tenant_${data.slug}`;
      
      // Get plan configuration
      const plan = data.plan || 'starter';
      const planConfig = PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES];
      
      if (!planConfig) {
        throw new Error('Invalid plan specified');
      }

      // Create tenant
      const tenant = new Tenant({
        name: data.name,
        slug: data.slug,
        domain: data.domain,
        plan,
        status: 'trial',
        subscription: {
          plan,
          status: 'trialing',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        },
        settings: {
          branding: {
            primaryColor: '#3B82F6',
            secondaryColor: '#1F2937'
          },
          features: new Map(Object.entries(planConfig.features)),
          limits: {
            users: planConfig.users,
            businesses: planConfig.businesses,
            bookings: planConfig.bookings,
            storage: planConfig.storage
          }
        },
        contact: data.contact,
        database: {
          type: 'shared',
          name: dbName
        }
      });

      await tenant.save();

      // Initialize tenant database structure
      await this.initializeTenantDatabase(tenant.id);

      // Cache tenant information
      await this.cacheTenantInfo(tenant);

      logger.info('Tenant created successfully:', {
        tenantId: tenant.id,
        slug: tenant.slug,
        plan: tenant.plan
      });

      return tenant;
    } catch (error) {
      logger.error('Failed to create tenant:', error);
      throw error;
    }
  }

  // Get tenant by slug or domain
  async getTenant(identifier: string, byDomain: boolean = false): Promise<ITenant | null> {
    try {
      // Check cache first
      const cacheKey = `tenant:${byDomain ? 'domain' : 'slug'}:${identifier}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Query database
      const query = byDomain ? { domain: identifier } : { slug: identifier };
      const tenant = await Tenant.findOne(query);

      if (tenant) {
        await this.cacheTenantInfo(tenant);
      }

      return tenant;
    } catch (error) {
      logger.error('Failed to get tenant:', error);
      return null;
    }
  }

  // Update tenant settings
  async updateTenantSettings(
    tenantId: string, 
    settings: Partial<ITenant['settings']>
  ): Promise<ITenant | null> {
    try {
      const tenant = await Tenant.findByIdAndUpdate(
        tenantId,
        { $set: { settings } },
        { new: true }
      );

      if (tenant) {
        await this.cacheTenantInfo(tenant);
      }

      return tenant;
    } catch (error) {
      logger.error('Failed to update tenant settings:', error);
      throw error;
    }
  }

  // Add user to tenant
  async addUserToTenant(
    tenantId: string,
    userId: string,
    role: string = 'user',
    permissions: string[] = []
  ): Promise<ITenantUser> {
    try {
      const existingUser = await TenantUser.findOne({ tenantId, userId });
      
      if (existingUser) {
        throw new Error('User already belongs to this tenant');
      }

      const tenantUser = new TenantUser({
        tenantId,
        userId,
        role,
        permissions,
        status: 'active',
        joinedAt: new Date()
      });

      await tenantUser.save();

      // Update tenant usage
      await this.updateTenantUsage(tenantId);

      return tenantUser;
    } catch (error) {
      logger.error('Failed to add user to tenant:', error);
      throw error;
    }
  }

  // Remove user from tenant
  async removeUserFromTenant(tenantId: string, userId: string): Promise<boolean> {
    try {
      const result = await TenantUser.findOneAndDelete({ tenantId, userId });
      
      if (result) {
        await this.updateTenantUsage(tenantId);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to remove user from tenant:', error);
      throw error;
    }
  }

  // Get user's tenants
  async getUserTenants(userId: string): Promise<{
    tenant: ITenant;
    role: string;
    permissions: string[];
  }[]> {
    try {
      const tenantUsers = await TenantUser.find({ userId, status: 'active' });
      const results = [];

      for (const tenantUser of tenantUsers) {
        const tenant = await this.getTenant(tenantUser.tenantId);
        if (tenant) {
          results.push({
            tenant,
            role: tenantUser.role,
            permissions: tenantUser.permissions
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Failed to get user tenants:', error);
      return [];
    }
  }

  // Check if user has permission
  async hasPermission(
    tenantId: string, 
    userId: string, 
    permission: string
  ): Promise<boolean> {
    try {
      const tenantUser = await TenantUser.findOne({ tenantId, userId, status: 'active' });
      
      if (!tenantUser) return false;

      // Owner and admin have all permissions
      if (tenantUser.role === 'owner' || tenantUser.role === 'admin') {
        return true;
      }

      return tenantUser.permissions.includes(permission);
    } catch (error) {
      logger.error('Failed to check permission:', error);
      return false;
    }
  }

  // Check tenant limits
  async checkTenantLimits(
    tenantId: string, 
    resource: 'users' | 'businesses' | 'bookings' | 'storage',
    amount: number = 1
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const current = tenant.usage[resource];
      const limit = tenant.settings.limits[resource];
      
      // -1 means unlimited
      const allowed = limit === -1 || (current + amount) <= limit;

      return { allowed, current, limit };
    } catch (error) {
      logger.error('Failed to check tenant limits:', error);
      throw error;
    }
  }

  // Update tenant usage
  async updateTenantUsage(tenantId: string): Promise<void> {
    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) return;

      // Get tenant connection
      const connection = await this.getTenantConnection(tenantId);
      
      // Count resources
      const userCount = await TenantUser.countDocuments({ tenantId, status: 'active' });
      const businessCount = await connection.model('Business').countDocuments();
      const bookingCount = await connection.model('Booking').countDocuments();
      
      // Calculate storage usage (simplified)
      const storageUsage = 0; // Would calculate actual storage usage

      await Tenant.findByIdAndUpdate(tenantId, {
        $set: {
          'usage.users': userCount,
          'usage.businesses': businessCount,
          'usage.bookings': bookingCount,
          'usage.storage': storageUsage,
          'usage.lastCalculated': new Date()
        }
      });

      logger.info('Tenant usage updated:', {
        tenantId,
        users: userCount,
        businesses: businessCount,
        bookings: bookingCount
      });
    } catch (error) {
      logger.error('Failed to update tenant usage:', error);
    }
  }

  // Get tenant database connection
  async getTenantConnection(tenantId: string): Promise<mongoose.Connection> {
    try {
      if (this.tenantConnections.has(tenantId)) {
        return this.tenantConnections.get(tenantId)!;
      }

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // For shared database, use default connection with tenant-specific collections
      // For dedicated database, create new connection
      let connection: mongoose.Connection;
      
      if (tenant.database.type === 'dedicated' && tenant.database.connectionString) {
        connection = mongoose.createConnection(tenant.database.connectionString);
      } else {
        // Use shared database with tenant-prefixed collections
        connection = mongoose.connection;
      }

      this.tenantConnections.set(tenantId, connection);
      return connection;
    } catch (error) {
      logger.error('Failed to get tenant connection:', error);
      throw error;
    }
  }

  // Initialize tenant database structure
  async initializeTenantDatabase(tenantId: string): Promise<void> {
    try {
      const connection = await this.getTenantConnection(tenantId);
      
      // Create tenant-specific collections/schemas
      // This would set up the database structure for the new tenant
      
      logger.info('Tenant database initialized:', { tenantId });
    } catch (error) {
      logger.error('Failed to initialize tenant database:', error);
      throw error;
    }
  }

  // Upgrade tenant plan
  async upgradeTenantPlan(tenantId: string, newPlan: string): Promise<ITenant | null> {
    try {
      const planConfig = PLAN_FEATURES[newPlan as keyof typeof PLAN_FEATURES];
      
      if (!planConfig) {
        throw new Error('Invalid plan specified');
      }

      const tenant = await Tenant.findByIdAndUpdate(
        tenantId,
        {
          $set: {
            plan: newPlan,
            'subscription.plan': newPlan,
            'settings.limits': {
              users: planConfig.users,
              businesses: planConfig.businesses,
              bookings: planConfig.bookings,
              storage: planConfig.storage
            },
            'settings.features': new Map(Object.entries(planConfig.features))
          }
        },
        { new: true }
      );

      if (tenant) {
        await this.cacheTenantInfo(tenant);
        
        logger.info('Tenant plan upgraded:', {
          tenantId,
          oldPlan: tenant.plan,
          newPlan
        });
      }

      return tenant;
    } catch (error) {
      logger.error('Failed to upgrade tenant plan:', error);
      throw error;
    }
  }

  // Suspend tenant
  async suspendTenant(tenantId: string, reason: string): Promise<boolean> {
    try {
      await Tenant.findByIdAndUpdate(tenantId, {
        $set: {
          status: 'suspended',
          'subscription.status': 'past_due'
        }
      });

      // Clear cache
      await this.clearTenantCache(tenantId);

      logger.warn('Tenant suspended:', { tenantId, reason });
      return true;
    } catch (error) {
      logger.error('Failed to suspend tenant:', error);
      return false;
    }
  }

  // Reactivate tenant
  async reactivateTenant(tenantId: string): Promise<boolean> {
    try {
      await Tenant.findByIdAndUpdate(tenantId, {
        $set: {
          status: 'active',
          'subscription.status': 'active'
        }
      });

      logger.info('Tenant reactivated:', { tenantId });
      return true;
    } catch (error) {
      logger.error('Failed to reactivate tenant:', error);
      return false;
    }
  }

  // Get tenant metrics
  async getTenantMetrics(tenantId: string): Promise<{
    usage: ITenant['usage'];
    limits: ITenant['settings']['limits'];
    utilizationPercentage: Record<string, number>;
  }> {
    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const usage = tenant.usage;
      const limits = tenant.settings.limits;

      const utilizationPercentage = {
        users: limits.users === -1 ? 0 : (usage.users / limits.users) * 100,
        businesses: limits.businesses === -1 ? 0 : (usage.businesses / limits.businesses) * 100,
        bookings: limits.bookings === -1 ? 0 : (usage.bookings / limits.bookings) * 100,
        storage: limits.storage === -1 ? 0 : (usage.storage / limits.storage) * 100
      };

      return {
        usage,
        limits,
        utilizationPercentage
      };
    } catch (error) {
      logger.error('Failed to get tenant metrics:', error);
      throw error;
    }
  }

  // Helper methods
  private async cacheTenantInfo(tenant: ITenant): Promise<void> {
    try {
      const tenantData = JSON.stringify(tenant);
      await Promise.all([
        cacheService.setex(`tenant:slug:${tenant.slug}`, 3600, tenantData),
        tenant.domain && cacheService.setex(`tenant:domain:${tenant.domain}`, 3600, tenantData)
      ]);
    } catch (error) {
      logger.error('Failed to cache tenant info:', error);
    }
  }

  private async clearTenantCache(tenantId: string): Promise<void> {
    try {
      const tenant = await Tenant.findById(tenantId);
      if (tenant) {
        await Promise.all([
          cacheService.delete(`tenant:slug:${tenant.slug}`),
          tenant.domain && cacheService.delete(`tenant:domain:${tenant.domain}`)
        ]);
      }
    } catch (error) {
      logger.error('Failed to clear tenant cache:', error);
    }
  }

  // Public method to check if service is configured
  isConfigured(): { database: boolean; cache: boolean } {
    return {
      database: mongoose.connection.readyState === 1,
      cache: true // Assuming cache service is available
    };
  }

  // Get service statistics
  async getStats(): Promise<{
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    planDistribution: Record<string, number>;
    totalUsers: number;
  }> {
    try {
      const [
        totalTenants,
        activeTenants,
        trialTenants,
        planDistribution,
        totalUsers
      ] = await Promise.all([
        Tenant.countDocuments(),
        Tenant.countDocuments({ status: 'active' }),
        Tenant.countDocuments({ status: 'trial' }),
        Tenant.aggregate([
          { $group: { _id: '$plan', count: { $sum: 1 } } }
        ]).then(results => 
          results.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {})
        ),
        TenantUser.countDocuments({ status: 'active' })
      ]);

      return {
        totalTenants,
        activeTenants,
        trialTenants,
        planDistribution,
        totalUsers
      };
    } catch (error) {
      logger.error('Failed to get multi-tenant stats:', error);
      return {
        totalTenants: 0,
        activeTenants: 0,
        trialTenants: 0,
        planDistribution: {},
        totalUsers: 0
      };
    }
  }
}

// Export singleton instance
export const multiTenantService = new MultiTenantService();
export { ITenant, ITenantUser, Tenant, TenantUser, PLAN_FEATURES };