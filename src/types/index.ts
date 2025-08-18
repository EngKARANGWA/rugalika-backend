import { ObjectId } from 'mongoose';

export interface IUser {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  role: 'admin' | 'citizen';
  status: 'active' | 'inactive';
  mutualStatus: 'registered' | 'not_registered';
  employmentStatus: 'employed' | 'unemployed' | 'leader';
  profileImage?: string;
  joinDate: Date;
  lastLogin?: Date;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubContent {
  title: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'pdf';
  mediaUrl?: string;
  explanation?: string;
}

export interface INews {
  _id: ObjectId;
  title: string;
  content: string;
  excerpt: string;
  category: 'UBUREZI' | 'UBUKUNGU' | 'UBUZIMA' | 'AMATANGAZO';
  author: ObjectId;
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
  mainImage: string;
  views: number;
  likes: number;
  subContents: ISubContent[];
  tags: string[];
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment {
  _id: ObjectId;
  content: string;
  author: string;
  itemId: ObjectId;
  itemType: 'news' | 'feedback';
  likes: number;
  createdAt: Date;
}

export interface IFeedback {
  _id: ObjectId;
  author: string;
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  likes: number;
  comments: IComment[];
  category?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  adminResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHelpRequest {
  _id: ObjectId;
  name: string;
  email: string;
  phone: string;
  department: 'Ubutaka' | 'Ubuvuzi bw\'Amatungo' | 'Imiturire' | 'Irangamimerere' | 'Imibereho Myiza' | 'Amashyamba';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  adminResponse?: string;
  assignedTo?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISystemSettings {
  _id: ObjectId;
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  logo?: string;
  enableNotifications: boolean;
  enableComments: boolean;
  enableRegistration: boolean;
  maintenanceMode: boolean;
  updatedBy: ObjectId;
  updatedAt: Date;
}

export interface IOTPCode {
  _id: ObjectId;
  email: string;
  code: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

export interface ITokenBlacklist {
  _id: ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// Request/Response interfaces
export interface IAuthResponse {
  success: boolean;
  token?: string;
  user?: IUser;
  message?: string;
}

export interface IPaginationQuery {
  page?: number;
  limit?: number;
}

export interface ISearchQuery extends IPaginationQuery {
  search?: string;
}

export interface INewsQuery extends ISearchQuery {
  category?: string;
  status?: string;
  featured?: boolean;
}

export interface IUserQuery extends ISearchQuery {
  role?: string;
  status?: string;
}

export interface IFeedbackQuery extends ISearchQuery {
  status?: string;
}

export interface IHelpRequestQuery extends ISearchQuery {
  status?: string;
  department?: string;
  priority?: string;
}

export interface IAnalyticsOverview {
  totalUsers: number;
  totalNews: number;
  totalFeedback: number;
  totalHelpRequests: number;
  recentActivity: IActivity[];
  topNews: { title: string; views: number }[];
  categoryStats: { category: string; count: number; percentage: number }[];
}

export interface IActivity {
  type: 'news' | 'user' | 'feedback' | 'help_request';
  action: string;
  description: string;
  timestamp: Date;
}

export interface IUploadResponse {
  success: boolean;
  url?: string;
  message?: string;
}

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
}

// Middleware interfaces
export interface IAuthRequest extends Request {
  user?: IUser;
}

export interface IValidationError {
  field: string;
  message: string;
}
