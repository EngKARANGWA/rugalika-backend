import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../types';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {}

const userSchema = new Schema<IUserDocument>({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^(\+250|250)?[0-9]{9}$/, 'Please enter a valid Rwandan phone number']
  },
  nationalId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^[0-9]{16}$/, 'National ID must be 16 digits']
  },
  role: {
    type: String,
    enum: ['admin', 'citizen'],
    default: 'citizen'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  mutualStatus: {
    type: String,
    enum: ['registered', 'not_registered'],
    default: 'not_registered'
  },
  employmentStatus: {
    type: String,
    enum: ['employed', 'unemployed', 'leader'],
    required: true
  },
  profileImage: {
    type: String,
    default: null
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ nationalId: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware
userSchema.pre('save', function(next) {
  if (this.isNew) {
    this.joinDate = new Date();
  }
  next();
});

export const User = mongoose.model<IUserDocument>('User', userSchema);
