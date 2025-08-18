import { User, News, Feedback, HelpRequest } from '../models';
import { IAnalyticsOverview, IActivity } from '../types';
import { logger } from '../utils/logger';

class AnalyticsService {
  /**
   * Get dashboard overview statistics
   */
  async getOverviewStats(): Promise<IAnalyticsOverview> {
    try {
      // Get basic counts
      const [totalUsers, totalNews, totalFeedback, totalHelpRequests] = await Promise.all([
        User.countDocuments(),
        News.countDocuments(),
        Feedback.countDocuments(),
        HelpRequest.countDocuments()
      ]);

      // Get recent activity
      const recentActivity = await this.getRecentActivity();

      // Get top news by views
      const topNews = await News.find({ status: 'published' })
        .select('title views')
        .sort({ views: -1 })
        .limit(5)
        .lean();

      // Get category statistics
      const categoryStats = await this.getCategoryStats();

      return {
        totalUsers,
        totalNews,
        totalFeedback,
        totalHelpRequests,
        recentActivity,
        topNews: topNews.map(news => ({
          title: news.title,
          views: news.views
        })),
        categoryStats
      };
    } catch (error) {
      logger.error('Error getting overview stats:', error);
      throw new Error('Failed to get overview statistics');
    }
  }

  /**
   * Get recent activity across the system
   */
  async getRecentActivity(limit: number = 10): Promise<IActivity[]> {
    try {
      const activities: IActivity[] = [];

      // Get recent news
      const recentNews = await News.find()
        .populate('author', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      recentNews.forEach(news => {
        activities.push({
          type: 'news',
          action: news.status === 'published' ? 'published' : 'created',
          description: `News article "${news.title}" was ${news.status === 'published' ? 'published' : 'created'}`,
          timestamp: news.createdAt
        });
      });

      // Get recent users
      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      recentUsers.forEach(user => {
        activities.push({
          type: 'user',
          action: 'registered',
          description: `New user ${user.firstName} ${user.lastName} registered`,
          timestamp: user.createdAt
        });
      });

      // Get recent feedback
      const recentFeedback = await Feedback.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      recentFeedback.forEach(feedback => {
        activities.push({
          type: 'feedback',
          action: 'submitted',
          description: `New feedback "${feedback.title}" was submitted`,
          timestamp: feedback.createdAt
        });
      });

      // Get recent help requests
      const recentHelpRequests = await HelpRequest.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      recentHelpRequests.forEach(request => {
        activities.push({
          type: 'help_request',
          action: 'submitted',
          description: `New help request for ${request.department} was submitted`,
          timestamp: request.createdAt
        });
      });

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting recent activity:', error);
      return [];
    }
  }

  /**
   * Get news category statistics
   */
  async getCategoryStats(): Promise<Array<{ category: string; count: number; percentage: number }>> {
    try {
      const categoryAggregation = await News.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const totalNews = categoryAggregation.reduce((sum, item) => sum + item.count, 0);

      return categoryAggregation.map(item => ({
        category: item._id,
        count: item.count,
        percentage: totalNews > 0 ? Math.round((item.count / totalNews) * 100) : 0
      }));
    } catch (error) {
      logger.error('Error getting category stats:', error);
      return [];
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    citizenUsers: number;
    employmentStats: Array<{ status: string; count: number }>;
    mutualStats: Array<{ status: string; count: number }>;
    monthlyRegistrations: Array<{ month: string; count: number }>;
  }> {
    try {
      const [
        totalUsers,
        activeUsers,
        adminUsers,
        citizenUsers,
        employmentStats,
        mutualStats,
        monthlyRegistrations
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: 'active' }),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ role: 'citizen' }),
        this.getEmploymentStats(),
        this.getMutualStats(),
        this.getMonthlyRegistrations()
      ]);

      return {
        totalUsers,
        activeUsers,
        adminUsers,
        citizenUsers,
        employmentStats,
        mutualStats,
        monthlyRegistrations
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw new Error('Failed to get user statistics');
    }
  }

  /**
   * Get employment statistics
   */
  private async getEmploymentStats(): Promise<Array<{ status: string; count: number }>> {
    const stats = await User.aggregate([
      { $group: { _id: '$employmentStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return stats.map(stat => ({
      status: stat._id,
      count: stat.count
    }));
  }

  /**
   * Get mutual statistics
   */
  private async getMutualStats(): Promise<Array<{ status: string; count: number }>> {
    const stats = await User.aggregate([
      { $group: { _id: '$mutualStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return stats.map(stat => ({
      status: stat._id,
      count: stat.count
    }));
  }

  /**
   * Get monthly user registrations for the last 12 months
   */
  private async getMonthlyRegistrations(): Promise<Array<{ month: string; count: number }>> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const stats = await User.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return stats.map(stat => {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return {
        month: `${monthNames[stat._id.month - 1]} ${stat._id.year}`,
        count: stat.count
      };
    });
  }

  /**
   * Get news performance statistics
   */
  async getNewsStats(): Promise<{
    totalNews: number;
    publishedNews: number;
    draftNews: number;
    archivedNews: number;
    totalViews: number;
    totalLikes: number;
    mostViewed: Array<{ title: string; views: number; category: string }>;
    categoryDistribution: Array<{ category: string; count: number; percentage: number }>;
    monthlyPublications: Array<{ month: string; count: number }>;
  }> {
    try {
      const [
        totalNews,
        publishedNews,
        draftNews,
        archivedNews,
        viewsAndLikes,
        mostViewed,
        categoryDistribution,
        monthlyPublications
      ] = await Promise.all([
        News.countDocuments(),
        News.countDocuments({ status: 'published' }),
        News.countDocuments({ status: 'draft' }),
        News.countDocuments({ status: 'archived' }),
        this.getTotalViewsAndLikes(),
        this.getMostViewedNews(),
        this.getCategoryStats(),
        this.getMonthlyPublications()
      ]);

      return {
        totalNews,
        publishedNews,
        draftNews,
        archivedNews,
        totalViews: viewsAndLikes.totalViews,
        totalLikes: viewsAndLikes.totalLikes,
        mostViewed,
        categoryDistribution,
        monthlyPublications
      };
    } catch (error) {
      logger.error('Error getting news stats:', error);
      throw new Error('Failed to get news statistics');
    }
  }

  /**
   * Get total views and likes
   */
  private async getTotalViewsAndLikes(): Promise<{ totalViews: number; totalLikes: number }> {
    const result = await News.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' }
        }
      }
    ]);

    return result[0] || { totalViews: 0, totalLikes: 0 };
  }

  /**
   * Get most viewed news
   */
  private async getMostViewedNews(): Promise<Array<{ title: string; views: number; category: string }>> {
    const news = await News.find({ status: 'published' })
      .select('title views category')
      .sort({ views: -1 })
      .limit(10)
      .lean();

    return news.map(item => ({
      title: item.title,
      views: item.views,
      category: item.category
    }));
  }

  /**
   * Get monthly publications for the last 12 months
   */
  private async getMonthlyPublications(): Promise<Array<{ month: string; count: number }>> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const stats = await News.aggregate([
      { 
        $match: { 
          status: 'published',
          publishedAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$publishedAt' },
            month: { $month: '$publishedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return stats.map(stat => {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return {
        month: `${monthNames[stat._id.month - 1]} ${stat._id.year}`,
        count: stat.count
      };
    });
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(): Promise<{
    totalFeedback: number;
    pendingFeedback: number;
    approvedFeedback: number;
    rejectedFeedback: number;
    averageResponseTime: number;
    monthlySubmissions: Array<{ month: string; count: number }>;
    priorityDistribution: Array<{ priority: string; count: number }>;
  }> {
    try {
      const [
        totalFeedback,
        pendingFeedback,
        approvedFeedback,
        rejectedFeedback,
        monthlySubmissions,
        priorityDistribution
      ] = await Promise.all([
        Feedback.countDocuments(),
        Feedback.countDocuments({ status: 'pending' }),
        Feedback.countDocuments({ status: 'approved' }),
        Feedback.countDocuments({ status: 'rejected' }),
        this.getMonthlyFeedbackSubmissions(),
        this.getFeedbackPriorityDistribution()
      ]);

      // Calculate average response time (simplified)
      const averageResponseTime = await this.getAverageResponseTime();

      return {
        totalFeedback,
        pendingFeedback,
        approvedFeedback,
        rejectedFeedback,
        averageResponseTime,
        monthlySubmissions,
        priorityDistribution
      };
    } catch (error) {
      logger.error('Error getting feedback stats:', error);
      throw new Error('Failed to get feedback statistics');
    }
  }

  /**
   * Get monthly feedback submissions
   */
  private async getMonthlyFeedbackSubmissions(): Promise<Array<{ month: string; count: number }>> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const stats = await Feedback.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return stats.map(stat => {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return {
        month: `${monthNames[stat._id.month - 1]} ${stat._id.year}`,
        count: stat.count
      };
    });
  }

  /**
   * Get feedback priority distribution
   */
  private async getFeedbackPriorityDistribution(): Promise<Array<{ priority: string; count: number }>> {
    const stats = await Feedback.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return stats.map(stat => ({
      priority: stat._id,
      count: stat.count
    }));
  }

  /**
   * Get average response time for feedback (in hours)
   */
  private async getAverageResponseTime(): Promise<number> {
    const result = await Feedback.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'rejected'] },
          adminResponse: { $exists: true }
        }
      },
      {
        $project: {
          responseTime: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageTime: { $avg: '$responseTime' }
        }
      }
    ]);

    return result[0]?.averageTime || 0;
  }

  /**
   * Get help request statistics
   */
  async getHelpRequestStats(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    inProgressRequests: number;
    completedRequests: number;
    cancelledRequests: number;
    departmentDistribution: Array<{ department: string; count: number }>;
    priorityDistribution: Array<{ priority: string; count: number }>;
    monthlySubmissions: Array<{ month: string; count: number }>;
    averageCompletionTime: number;
  }> {
    try {
      const [
        totalRequests,
        pendingRequests,
        inProgressRequests,
        completedRequests,
        cancelledRequests,
        departmentDistribution,
        priorityDistribution,
        monthlySubmissions
      ] = await Promise.all([
        HelpRequest.countDocuments(),
        HelpRequest.countDocuments({ status: 'pending' }),
        HelpRequest.countDocuments({ status: 'in_progress' }),
        HelpRequest.countDocuments({ status: 'completed' }),
        HelpRequest.countDocuments({ status: 'cancelled' }),
        this.getDepartmentDistribution(),
        this.getHelpRequestPriorityDistribution(),
        this.getMonthlyHelpRequestSubmissions()
      ]);

      const averageCompletionTime = await this.getAverageCompletionTime();

      return {
        totalRequests,
        pendingRequests,
        inProgressRequests,
        completedRequests,
        cancelledRequests,
        departmentDistribution,
        priorityDistribution,
        monthlySubmissions,
        averageCompletionTime
      };
    } catch (error) {
      logger.error('Error getting help request stats:', error);
      throw new Error('Failed to get help request statistics');
    }
  }

  /**
   * Get department distribution
   */
  private async getDepartmentDistribution(): Promise<Array<{ department: string; count: number }>> {
    const stats = await HelpRequest.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return stats.map(stat => ({
      department: stat._id,
      count: stat.count
    }));
  }

  /**
   * Get help request priority distribution
   */
  private async getHelpRequestPriorityDistribution(): Promise<Array<{ priority: string; count: number }>> {
    const stats = await HelpRequest.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return stats.map(stat => ({
      priority: stat._id,
      count: stat.count
    }));
  }

  /**
   * Get monthly help request submissions
   */
  private async getMonthlyHelpRequestSubmissions(): Promise<Array<{ month: string; count: number }>> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const stats = await HelpRequest.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return stats.map(stat => {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return {
        month: `${monthNames[stat._id.month - 1]} ${stat._id.year}`,
        count: stat.count
      };
    });
  }

  /**
   * Get average completion time for help requests (in hours)
   */
  private async getAverageCompletionTime(): Promise<number> {
    const result = await HelpRequest.aggregate([
      {
        $match: {
          status: 'completed'
        }
      },
      {
        $project: {
          completionTime: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageTime: { $avg: '$completionTime' }
        }
      }
    ]);

    return result[0]?.averageTime || 0;
  }
}

export const analyticsService = new AnalyticsService();
