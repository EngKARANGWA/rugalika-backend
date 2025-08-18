import mongoose, { Schema, Document } from 'mongoose';
import { ITokenBlacklist } from '../types';

export interface ITokenBlacklistDocument extends Omit<ITokenBlacklist, '_id'>, Document {}

const tokenBlacklistSchema = new Schema<ITokenBlacklistDocument>({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index - MongoDB will automatically delete expired documents
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Static methods
tokenBlacklistSchema.statics.blacklistToken = async function(token: string, expiresAt: Date) {
  const blacklistedToken = new this({
    token,
    expiresAt
  });
  
  try {
    return await blacklistedToken.save();
  } catch (error: any) {
    // If token is already blacklisted, ignore the error
    if (error.code === 11000) {
      return null;
    }
    throw error;
  }
};

tokenBlacklistSchema.statics.isBlacklisted = async function(token: string) {
  const blacklistedToken = await this.findOne({ 
    token,
    expiresAt: { $gt: new Date() }
  });
  
  return !!blacklistedToken;
};

tokenBlacklistSchema.statics.cleanExpired = async function() {
  return await this.deleteMany({
    expiresAt: { $lte: new Date() }
  });
};

export const TokenBlacklist = mongoose.model<ITokenBlacklistDocument>('TokenBlacklist', tokenBlacklistSchema);
