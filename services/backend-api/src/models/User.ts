import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Business User Model
export interface IBusinessUser extends Document {
  businessName: string;
  email: string;
  password: string;
  role: 'Owner' | 'Manager' | 'Assistant';
  staffId: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const businessUserSchema = new Schema<IBusinessUser>({
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['Owner', 'Manager', 'Assistant'],
    default: 'Owner'
  },
  staffId: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  refreshTokens: [{
    type: String
  }]
}, {
  timestamps: true
});

// Hash password before saving
businessUserSchema.pre<IBusinessUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

// Compare password method
businessUserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes for performance
businessUserSchema.index({ email: 1 });
businessUserSchema.index({ isActive: 1 });

export const BusinessUser = mongoose.model<IBusinessUser>('BusinessUser', businessUserSchema);

// Customer User Model
export interface ICustomerUser extends Document {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  favoriteBusinessIds: string[];
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const customerUserSchema = new Schema<ICustomerUser>({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please provide a valid phone number']
  },
  favoriteBusinessIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  refreshTokens: [{
    type: String
  }]
}, {
  timestamps: true
});

// Hash password before saving
customerUserSchema.pre<ICustomerUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

// Compare password method
customerUserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
customerUserSchema.index({ email: 1 });
customerUserSchema.index({ isActive: 1 });

export const CustomerUser = mongoose.model<ICustomerUser>('CustomerUser', customerUserSchema);

// Admin User Model
export interface IAdminUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: 'superadmin';
  isActive: boolean;
  lastLogin?: Date;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const adminUserSchema = new Schema<IAdminUser>({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false
  },
  role: {
    type: String,
    enum: ['superadmin'],
    default: 'superadmin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  refreshTokens: [{
    type: String
  }]
}, {
  timestamps: true
});

// Hash password before saving
adminUserSchema.pre<IAdminUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

// Compare password method
adminUserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
adminUserSchema.index({ email: 1 });

export const AdminUser = mongoose.model<IAdminUser>('AdminUser', adminUserSchema);