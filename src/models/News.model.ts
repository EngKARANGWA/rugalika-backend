import mongoose, { Schema, Document } from 'mongoose';
import { INews, ISubContent } from '../types';

export interface INewsDocument extends Omit<INews, '_id'>, Document {}

const subContentSchema = new Schema<ISubContent>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'pdf'],
    required: true
  },
  mediaUrl: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Media URL must be a valid HTTP/HTTPS URL'
    }
  },
  explanation: {
    type: String,
    maxlength: 500
  }
}, { _id: true });

const newsSchema = new Schema<INewsDocument>({
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
    index: 'text'
  },
  excerpt: {
    type: String,
    required: true,
    maxlength: 300
  },
  category: {
    type: String,
    enum: ['UBUREZI', 'UBUKUNGU', 'UBUZIMA', 'AMATANGAZO'],
    required: true,
    index: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['published', 'draft', 'archived'],
    default: 'draft',
    index: true
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  mainImage: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Main image must be a valid image URL'
    }
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  subContents: [subContentSchema],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  publishedAt: {
    type: Date,
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
newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ category: 1, status: 1, publishedAt: -1 });
newsSchema.index({ featured: 1, status: 1, publishedAt: -1 });
newsSchema.index({ views: -1 });
newsSchema.index({ likes: -1 });
newsSchema.index({ tags: 1 });

// Text index for search functionality
newsSchema.index({
  title: 'text',
  content: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    tags: 5,
    content: 1
  }
});

// Pre-save middleware
newsSchema.pre('save', function(next) {
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Generate excerpt if not provided
  if (!this.excerpt && this.content) {
    this.excerpt = this.content.substring(0, 297) + '...';
  }
  
  next();
});

// Virtual for reading time (words per minute)
newsSchema.virtual('readingTime').get(function() {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Static methods
newsSchema.statics.findPublished = function() {
  return this.find({ status: 'published' }).sort({ publishedAt: -1 });
};

newsSchema.statics.findFeatured = function() {
  return this.find({ status: 'published', featured: true }).sort({ publishedAt: -1 });
};

newsSchema.statics.findByCategory = function(category: string) {
  return this.find({ status: 'published', category }).sort({ publishedAt: -1 });
};

// Instance methods
newsSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

newsSchema.methods.toggleLike = function() {
  this.likes += 1;
  return this.save();
};

export const News = mongoose.model<INewsDocument>('News', newsSchema);
