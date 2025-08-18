import mongoose, { Schema, Document } from 'mongoose';
import { IOTPCode } from '../types';

export interface IOTPCodeDocument extends Omit<IOTPCode, '_id'>, Document {}

const otpCodeSchema = new Schema<IOTPCodeDocument>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    length: 6,
    match: [/^[0-9]{6}$/, 'OTP code must be 6 digits']
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.code; // Never return the actual code
      return ret;
    }
  }
});

// Compound index for efficient queries
otpCodeSchema.index({ email: 1, verified: 1, expiresAt: 1 });

// Static methods
otpCodeSchema.statics.generateCode = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

otpCodeSchema.statics.createOTP = async function(email: string) {
  // Remove any existing unverified codes for this email
  await this.deleteMany({ email, verified: false });
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
  const otpCode = new this({
    email,
    code,
    expiresAt
  });
  
  return await otpCode.save();
};

otpCodeSchema.statics.verifyCode = async function(email: string, code: string) {
  const otpCode = await this.findOne({
    email,
    code,
    verified: false,
    expiresAt: { $gt: new Date() }
  });
  
  if (!otpCode) {
    return null;
  }
  
  otpCode.verified = true;
  await otpCode.save();
  
  return otpCode;
};

// Instance methods
otpCodeSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

otpCodeSchema.methods.verify = function() {
  if (this.isExpired()) {
    throw new Error('OTP code has expired');
  }
  
  this.verified = true;
  return this.save();
};

export const OTPCode = mongoose.model<IOTPCodeDocument>('OTPCode', otpCodeSchema);
