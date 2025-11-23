import { Injectable, Logger, Inject } from '@nestjs/common';
import { ScoredDeal } from '../deal-matching/deal-matching.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface DealNotification {
  id: string;
  userId: string;
  dealId: string;
  type: 'new_deal' | 'expiring_soon' | 'budget_match' | 'flash_deal' | 'personalized_recommendation';
  title: string;
  message: string;
  deal: ScoredDeal;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: Date;
  actionUrl?: string;
  metadata: {
    relevanceScore: number;
    potentialSavings: number;
    category: string;
    merchantName: string;
  };
}

export interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  types: {
    new_deal: boolean;
    expiring_soon: boolean;
    budget_match: boolean;
    flash_deal: boolean;
    personalized_recommendation: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
  maxDailyNotifications: number;
}

@Injectable()
export class DealNotificationService {
  private readonly logger = new Logger(DealNotificationService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Send notifications for new matching deals
   */
  async notifyMatchingDeals(
    userId: string,
    deals: ScoredDeal[],
    context: 'budget_update' | 'location_change' | 'scheduled_check' | 'manual_request'
  ): Promise<DealNotification[]> {
    const preferences = await this.getUserNotificationPreferences(userId);

    if (!preferences.enabled) {
      this.logger.log(`Notifications disabled for user ${userId}`);
      return [];
    }

    const notifications: DealNotification[] = [];
    const now = new Date();

    // Check quiet hours
    if (this.isInQuietHours(now, preferences.quietHours)) {
      this.logger.log(`In quiet hours for user ${userId}, skipping notifications`);
      return [];
    }

    // Check daily limit
    const todayNotifications = await this.getTodayNotificationCount(userId);
    if (todayNotifications >= preferences.maxDailyNotifications) {
      this.logger.log(`Daily notification limit reached for user ${userId}`);
      return [];
    }

    for (const deal of deals) {
      if (todayNotifications + notifications.length >= preferences.maxDailyNotifications) {
        break;
      }

      const notification = await this.createDealNotification(userId, deal, context, preferences);
      if (notification) {
        notifications.push(notification);
      }
    }

    // Send notifications based on frequency preference
    if (preferences.frequency === 'immediate') {
      await this.sendImmediateNotifications(userId, notifications);
    } else {
      await this.queueNotifications(userId, notifications, preferences.frequency);
    }

    this.logger.log(`Created ${notifications.length} notifications for user ${userId}`);
    return notifications;
  }

  /**
   * Create a notification for a specific deal
   */
  private async createDealNotification(
    userId: string,
    deal: ScoredDeal,
    context: string,
    preferences: NotificationPreferences
  ): Promise<DealNotification | null> {
    const notificationType = this.determineNotificationType(deal, context);

    // Check if this type is enabled
    if (!preferences.types[notificationType]) {
      return null;
    }

    // Check if we've already notified about this deal recently
    const recentNotification = await this.getRecentNotification(userId, deal.id);
    if (recentNotification) {
      return null; // Already notified recently
    }

    const priority = this.calculateNotificationPriority(deal, context);
    const { title, message } = this.generateNotificationContent(deal, notificationType, context);

    const notification: DealNotification = {
      id: `deal-notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      dealId: deal.id,
      type: notificationType,
      title,
      message,
      deal,
      priority,
      expiresAt: this.calculateExpiryDate(deal, priority),
      actionUrl: `/dashboard?tab=promo&deal=${deal.id}`,
      metadata: {
        relevanceScore: deal.relevanceScore,
        potentialSavings: deal.originalPrice - deal.discountedPrice,
        category: deal.category,
        merchantName: deal.merchantName
      }
    };

    return notification;
  }

  /**
   * Determine the type of notification based on deal and context
   */
  private determineNotificationType(
    deal: ScoredDeal,
    context: string
  ): DealNotification['type'] {
    // Check for flash deals
    if (deal.tags.includes('Flash') || deal.tags.includes('Limited Time')) {
      return 'flash_deal';
    }

    // Check for expiring soon
    const daysUntilExpiry = Math.ceil(
      (new Date(deal.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry <= 3) {
      return 'expiring_soon';
    }

    // Context-based types
    if (context === 'budget_update') {
      return 'budget_match';
    }

    if (deal.relevanceScore >= 90) {
      return 'personalized_recommendation';
    }

    return 'new_deal';
  }

  /**
   * Calculate notification priority
   */
  private calculateNotificationPriority(
    deal: ScoredDeal,
    context: string
  ): DealNotification['priority'] {
    // Urgent for flash deals
    if (deal.tags.includes('Flash') || deal.tags.includes('Limited Time')) {
      return 'urgent';
    }

    // High priority for high relevance scores
    if (deal.relevanceScore >= 90) {
      return 'high';
    }

    // High priority for significant savings
    const savingsPercentage = ((deal.originalPrice - deal.discountedPrice) / deal.originalPrice) * 100;
    if (savingsPercentage >= 30) {
      return 'high';
    }

    // Medium priority for expiring soon
    const daysUntilExpiry = Math.ceil(
      (new Date(deal.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry <= 7) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate notification content
   */
  private generateNotificationContent(
    deal: ScoredDeal,
    type: DealNotification['type'],
    context: string
  ): { title: string; message: string } {
    const savings = deal.originalPrice - deal.discountedPrice;
    const savingsPercent = Math.round(((deal.originalPrice - deal.discountedPrice) / deal.originalPrice) * 100);

    switch (type) {
      case 'flash_deal':
        return {
          title: '🔥 Flash Deal Tersedia!',
          message: `Hemat ${savingsPercent}% di ${deal.merchantName} - ${deal.title}. Penawaran terbatas!`
        };

      case 'expiring_soon':
        const daysLeft = Math.ceil((new Date(deal.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return {
          title: '⏰ Penawaran Segera Berakhir!',
          message: `${deal.title} dari ${deal.merchantName} berakhir dalam ${daysLeft} hari. Hemat IDR ${savings.toLocaleString('id-ID')}!`
        };

      case 'budget_match':
        return {
          title: '💰 Deal Sesuai Budget Anda!',
          message: `${deal.title} - cocok dengan budget Anda. Hemat IDR ${savings.toLocaleString('id-ID')} (${savingsPercent}%)`
        };

      case 'personalized_recommendation':
        return {
          title: '🎯 Rekomendasi Personal',
          message: `Berdasarkan preferensi Anda: ${deal.title} dari ${deal.merchantName}. Skor kecocokan: ${deal.relevanceScore}%`
        };

      default:
        return {
          title: '🆕 Deal Baru Tersedia!',
          message: `${deal.title} - Hemat ${savingsPercent}% di ${deal.merchantName}`
        };
    }
  }

  /**
   * Calculate when the notification should expire
   */
  private calculateExpiryDate(deal: ScoredDeal, priority: DealNotification['priority']): Date {
    const baseHours = {
      urgent: 2,
      high: 6,
      medium: 24,
      low: 72
    };

    const hours = baseHours[priority];
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  /**
   * Send immediate notifications via WebSocket
   */
  private async sendImmediateNotifications(userId: string, notifications: DealNotification[]): Promise<void> {
    // In a real implementation, this would integrate with the ExpensesGateway or a dedicated notification gateway
    // For now, we'll log the notifications
    for (const notification of notifications) {
      this.logger.log(`Sending immediate notification to user ${userId}: ${notification.title}`);

      // Store notification for retrieval
      await this.storeNotification(notification);
    }
  }

  /**
   * Queue notifications for batch sending
   */
  private async queueNotifications(
    userId: string,
    notifications: DealNotification[],
    frequency: 'daily' | 'weekly'
  ): Promise<void> {
    const queueKey = `notification-queue:${userId}:${frequency}`;

    const existingQueue = await this.cacheManager.get<DealNotification[]>(queueKey) || [];
    const updatedQueue = [...existingQueue, ...notifications];

    await this.cacheManager.set(queueKey, updatedQueue, 7 * 24 * 60 * 60 * 1000); // 7 days

    this.logger.log(`Queued ${notifications.length} notifications for user ${userId} (${frequency})`);
  }

  /**
   * Process queued notifications (called by a scheduled job)
   */
  async processQueuedNotifications(userId: string, frequency: 'daily' | 'weekly'): Promise<void> {
    const queueKey = `notification-queue:${userId}:${frequency}`;
    const queuedNotifications = await this.cacheManager.get<DealNotification[]>(queueKey) || [];

    if (queuedNotifications.length === 0) return;

    // Group notifications by type and send digest
    const digestNotification = this.createDigestNotification(userId, queuedNotifications, frequency);

    await this.sendImmediateNotifications(userId, [digestNotification]);

    // Clear the queue
    await this.cacheManager.del(queueKey);

    this.logger.log(`Processed ${queuedNotifications.length} queued notifications for user ${userId}`);
  }

  /**
   * Create a digest notification from multiple deals
   */
  private createDigestNotification(
    userId: string,
    notifications: DealNotification[],
    frequency: 'daily' | 'weekly'
  ): DealNotification {
    const totalSavings = notifications.reduce((sum, n) => sum + n.metadata.potentialSavings, 0);
    const categories = [...new Set(notifications.map(n => n.metadata.category))];

    const title = frequency === 'daily' ? '📊 Ringkasan Deal Harian' : '📊 Ringkasan Deal Mingguan';
    const message = `Temukan ${notifications.length} deal menarik di kategori ${categories.join(', ')}. Potensi penghematan: IDR ${totalSavings.toLocaleString('id-ID')}`;

    return {
      id: `digest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      dealId: 'digest',
      type: 'personalized_recommendation',
      title,
      message,
      deal: notifications[0].deal, // Use first deal as representative
      priority: 'medium',
      actionUrl: '/dashboard?tab=promo',
      metadata: {
        relevanceScore: Math.max(...notifications.map(n => n.metadata.relevanceScore)),
        potentialSavings: totalSavings,
        category: categories.join(', '),
        merchantName: 'Multiple Merchants'
      }
    };
  }

  /**
   * Get user's notification preferences (mock implementation)
   */
  async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    // In production, this would fetch from database
    // For now, return default preferences
    return {
      userId,
      enabled: true,
      types: {
        new_deal: true,
        expiring_soon: true,
        budget_match: true,
        flash_deal: true,
        personalized_recommendation: true
      },
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      maxDailyNotifications: 10
    };
  }

  /**
   * Check if current time is in user's quiet hours
   */
  private isInQuietHours(now: Date, quietHours: NotificationPreferences['quietHours']): boolean {
    if (!quietHours.enabled) return false;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMinute] = quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = quietHours.end.split(':').map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      // Same day range
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight range
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Get count of notifications sent today
   */
  private async getTodayNotificationCount(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const key = `notifications-today:${userId}:${today}`;

    const count = await this.cacheManager.get<number>(key) || 0;
    return count;
  }

  /**
   * Check for recent notification about the same deal
   */
  private async getRecentNotification(userId: string, dealId: string): Promise<DealNotification | null> {
    const key = `recent-notifications:${userId}`;
    const recentNotifications = await this.cacheManager.get<DealNotification[]>(key) || [];

    return recentNotifications.find(n => n.dealId === dealId) || null;
  }

  /**
   * Store notification for tracking
   */
  private async storeNotification(notification: DealNotification): Promise<void> {
    // Update daily count
    const today = new Date().toISOString().split('T')[0];
    const countKey = `notifications-today:${notification.userId}:${today}`;
    const currentCount = await this.cacheManager.get<number>(countKey) || 0;
    await this.cacheManager.set(countKey, currentCount + 1, 24 * 60 * 60 * 1000); // 24 hours

    // Add to recent notifications
    const recentKey = `recent-notifications:${notification.userId}`;
    const recentNotifications = await this.cacheManager.get<DealNotification[]>(recentKey) || [];
    recentNotifications.push(notification);

    // Keep only last 50 notifications
    if (recentNotifications.length > 50) {
      recentNotifications.splice(0, recentNotifications.length - 50);
    }

    await this.cacheManager.set(recentKey, recentNotifications, 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    // In production, this would update database
    this.logger.log(`Updated notification preferences for user ${userId}`);
  }
}