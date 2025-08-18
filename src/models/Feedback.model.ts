import mongoose, { Schema, Document } from 'mongoose';
import { IFeedback, IComment } from '../types';

export interface IFeedbackDocument extends Omit<IFeedback, '_id'>, Document {}

const feedbackSchema = new Schema<IFeedbackDocument>({
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: 'text'
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000,
    index: 'text'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  category: {
    type: String,
    trim: true,
    maxlength: 50
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
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ priority: 1, status: 1, createdAt: -1 });
feedbackSchema.index({ createdAt: -1 });

// Text index for search functionality
feedbackSchema.index({
  title: 'text',
  content: 'text',
  author: 'text'
}, {
  weights: {
    title: 10,
    author: 5,
    content: 1
  }
});

// Static methods
feedbackSchema.statics.findApproved = function() {
  return this.find({ status: 'approved' }).sort({ createdAt: -1 });
};

feedbackSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).sort({ createdAt: -1 });
};

feedbackSchema.statics.findByPriority = function(priority: string) {
  return this.find({ priority }).sort({ createdAt: -1 });
};

// Instance methods
feedbackSchema.methods.approve = function(adminResponse?: string) {
  this.status = 'approved';
  if (adminResponse) {
    this.adminResponse = adminResponse;
  }
  return this.save();
};

feedbackSchema.methods.reject = function(adminResponse?: string) {
  this.status = 'rejected';
  if (adminResponse) {
    this.adminResponse = adminResponse;
  }
  return this.save();
};

feedbackSchema.methods.incrementLikes = function() {
  this.likes += 1;
  return this.save();
};

export const Feedback = mongoose.model<IFeedbackDocument>('Feedback', feedbackSchema);
