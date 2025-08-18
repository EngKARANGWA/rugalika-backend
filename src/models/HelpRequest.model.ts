import mongoose, { Schema, Document } from 'mongoose';
import { IHelpRequest } from '../types';

export interface IHelpRequestDocument extends Omit<IHelpRequest, '_id'>, Document {}

const helpRequestSchema = new Schema<IHelpRequestDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
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
  department: {
    type: String,
    enum: ['Ubutaka', 'Ubuvuzi bw\'Amatungo', 'Imiturire', 'Irangamimerere', 'Imibereho Myiza', 'Amashyamba'],
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
    index: 'text'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },
  adminResponse: {
    type: String,
    maxlength: 1000
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
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

// Compound indexes for better query performance
helpRequestSchema.index({ status: 1, priority: 1, createdAt: -1 });
helpRequestSchema.index({ department: 1, status: 1, createdAt: -1 });
helpRequestSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
helpRequestSchema.index({ createdAt: -1 });

// Text index for search functionality
helpRequestSchema.index({
  name: 'text',
  description: 'text',
  department: 'text'
}, {
  weights: {
    name: 10,
    department: 5,
    description: 1
  }
});

// Static methods
helpRequestSchema.statics.findByStatus = function(status: string) {
  return this.find({ status }).sort({ createdAt: -1 });
};

helpRequestSchema.statics.findByDepartment = function(department: string) {
  return this.find({ department }).sort({ createdAt: -1 });
};

helpRequestSchema.statics.findByPriority = function(priority: string) {
  return this.find({ priority }).sort({ createdAt: -1 });
};

helpRequestSchema.statics.findAssigned = function(userId: string) {
  return this.find({ assignedTo: userId }).sort({ createdAt: -1 });
};

// Instance methods
helpRequestSchema.methods.assign = function(userId: string) {
  this.assignedTo = new mongoose.Types.ObjectId(userId);
  this.status = 'in_progress';
  return this.save();
};

helpRequestSchema.methods.complete = function(adminResponse?: string) {
  this.status = 'completed';
  if (adminResponse) {
    this.adminResponse = adminResponse;
  }
  return this.save();
};

helpRequestSchema.methods.cancel = function(adminResponse?: string) {
  this.status = 'cancelled';
  if (adminResponse) {
    this.adminResponse = adminResponse;
  }
  return this.save();
};

helpRequestSchema.methods.updateStatus = function(status: string, adminResponse?: string) {
  this.status = status;
  if (adminResponse) {
    this.adminResponse = adminResponse;
  }
  return this.save();
};

export const HelpRequest = mongoose.model<IHelpRequestDocument>('HelpRequest', helpRequestSchema);
