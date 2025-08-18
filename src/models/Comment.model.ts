import mongoose, { Schema, Document } from 'mongoose';
import { IComment } from '../types';

export interface ICommentDocument extends Omit<IComment, '_id'>, Document {}

const commentSchema = new Schema<ICommentDocument>({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  itemId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  itemType: {
    type: String,
    enum: ['news', 'feedback'],
    required: true,
    index: true
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
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

// Compound indexes
commentSchema.index({ itemId: 1, itemType: 1, createdAt: -1 });
commentSchema.index({ createdAt: -1 });

// Instance methods
commentSchema.methods.incrementLikes = function() {
  this.likes += 1;
  return this.save();
};

export const Comment = mongoose.model<ICommentDocument>('Comment', commentSchema);
