import mongoose, { Schema, Document } from 'mongoose';
import { ISystemSettings } from '../types';

export interface ISystemSettingsDocument extends Omit<ISystemSettings, '_id'>, Document {}

const systemSettingsSchema = new Schema<ISystemSettingsDocument>({
  siteName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    default: 'Rugalika News'
  },
  siteDescription: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
    default: 'Official news and community portal for Rugalika Sector'
  },
  contactEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    default: 'info@rugalika.gov.rw'
  },
  contactPhone: {
    type: String,
    required: true,
    trim: true,
    match: [/^(\+250|250)?[0-9]{9}$/, 'Please enter a valid Rwandan phone number'],
    default: '+250788000000'
  },
  logo: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(v);
      },
      message: 'Logo must be a valid image URL'
    }
  },
  enableNotifications: {
    type: Boolean,
    default: true
  },
  enableComments: {
    type: Boolean,
    default: true
  },
  enableRegistration: {
    type: Boolean,
    default: false
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: { createdAt: false, updatedAt: true },
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Ensure only one settings document exists
systemSettingsSchema.index({ _id: 1 }, { unique: true });

// Static method to get or create settings
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    // Create default settings if none exist
    const defaultAdmin = await mongoose.model('User').findOne({ role: 'admin' });
    settings = new this({
      updatedBy: defaultAdmin?._id || new mongoose.Types.ObjectId()
    });
    await settings.save();
  }
  return settings;
};

// Static method to update settings
systemSettingsSchema.statics.updateSettings = async function(updates: Partial<ISystemSettings>, updatedBy: string) {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this({ updatedBy });
  }
  
  Object.assign(settings, updates, { updatedBy });
  return await settings.save();
};

export const SystemSettings = mongoose.model<ISystemSettingsDocument>('SystemSettings', systemSettingsSchema);
