// Correction Notification System for Auto Budget Correction System
// Handles real-time notifications for budget corrections and adjustments

import { BudgetAdjustment } from './budget-adjustment-engine';
import { OverspendingAlert } from './spending-pattern-analyzer';

export interface CorrectionNotification {
  id: string;
  userId: string;
  type: 'overspending_alert' | 'budget_adjustment' | 'alternative_suggestion' | 'proactive_correction';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: any; // Additional data specific to the notification type
  actions: NotificationAction[];
  timestamp: Date;
  expiresAt?: Date;
  read: boolean;
  dismissed: boolean;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'accept' | 'decline' | 'view_details' | 'snooze' | 'custom';
  actionData?: any;
  primary?: boolean; // If true, this is the primary action
}

export interface WebSocketMessage {
  type: 'notification' | 'budget_update' | 'correction_applied';
  userId: string;
  data: any;
  timestamp: Date;
}

export interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
  thresholds: {
    overspendingAlert: number; // Minimum overspend percentage to trigger alert
    budgetAdjustment: number; // Minimum adjustment amount to notify
    proactiveFrequency: 'daily' | 'weekly' | 'never';
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
}

export class CorrectionNotificationSystem {
  private activeConnections: Map<string, WebSocket[]> = new Map();
  private notificationHistory: Map<string, CorrectionNotification[]> = new Map();
  private userPreferences: Map<string, NotificationPreferences> = new Map();

  // Send notification for overspending alert
  async sendOverspendingAlert(alert: OverspendingAlert): Promise<void> {
    const preferences = this.getUserPreferences(alert.userId);

    if (!preferences.enabled || !this.shouldSendNotification(preferences, alert.severity)) {
      return;
    }

    const notification = this.createOverspendingNotification(alert);
    await this.sendNotification(notification);
  }

  // Send notification for budget adjustment
  async sendBudgetAdjustment(adjustment: BudgetAdjustment): Promise<void> {
    const preferences = this.getUserPreferences(adjustment.userId);

    if (!preferences.enabled) return;

    // Check if adjustment meets threshold
    if (adjustment.expectedSavings < preferences.thresholds.budgetAdjustment) {
      return;
    }

    const notification = this.createBudgetAdjustmentNotification(adjustment);
    await this.sendNotification(notification);
  }

  // Send proactive correction suggestions
  async sendProactiveCorrection(
    userId: string,
    suggestions: Array<{
      type: string;
      description: string;
      potentialSavings: number;
    }>
  ): Promise<void> {
    const preferences = this.getUserPreferences(userId);

    if (!preferences.enabled || preferences.thresholds.proactiveFrequency === 'never') {
      return;
    }

    // Check if we should send proactive notifications today
    if (!this.shouldSendProactiveToday(userId, preferences)) {
      return;
    }

    const notification = this.createProactiveNotification(userId, suggestions);
    await this.sendNotification(notification);
  }

  // Register WebSocket connection for real-time notifications
  registerConnection(userId: string, ws: WebSocket): void {
    const connections = this.activeConnections.get(userId) || [];
    connections.push(ws);
    this.activeConnections.set(userId, connections);

    // Clean up on connection close
    ws.onclose = () => {
      const userConnections = this.activeConnections.get(userId) || [];
      const index = userConnections.indexOf(ws);
      if (index > -1) {
        userConnections.splice(index, 1);
        if (userConnections.length === 0) {
          this.activeConnections.delete(userId);
        } else {
          this.activeConnections.set(userId, userConnections);
        }
      }
    };
  }

  // Update user notification preferences
  updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): void {
    const current = this.userPreferences.get(userId) || this.getDefaultPreferences(userId);
    this.userPreferences.set(userId, { ...current, ...preferences });
  }

  // Get notification history for a user
  getNotificationHistory(userId: string, limit: number = 50): CorrectionNotification[] {
    const history = this.notificationHistory.get(userId) || [];
    return history
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Mark notification as read
  markAsRead(userId: string, notificationId: string): void {
    const history = this.notificationHistory.get(userId) || [];
    const notification = history.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  // Dismiss notification
  dismissNotification(userId: string, notificationId: string): void {
    const history = this.notificationHistory.get(userId) || [];
    const notification = history.find(n => n.id === notificationId);
    if (notification) {
      notification.dismissed = true;
    }
  }

  // Handle notification action
  async handleAction(userId: string, notificationId: string, actionId: string): Promise<{
    success: boolean;
    result?: any;
  }> {
    const history = this.notificationHistory.get(userId) || [];
    const notification = history.find(n => n.id === notificationId);

    if (!notification) {
      return { success: false };
    }

    const action = notification.actions.find(a => a.id === actionId);
    if (!action) {
      return { success: false };
    }

    // Handle different action types
    switch (action.type) {
      case 'accept':
        return await this.handleAcceptAction(notification, action);
      case 'decline':
        return await this.handleDeclineAction(notification, action);
      case 'view_details':
        return await this.handleViewDetailsAction(notification, action);
      case 'snooze':
        return await this.handleSnoozeAction(notification, action);
      default:
        return { success: false };
    }
  }

  private async sendNotification(notification: CorrectionNotification): Promise<void> {
    // Store in history
    const history = this.notificationHistory.get(notification.userId) || [];
    history.push(notification);
    this.notificationHistory.set(notification.userId, history);

    // Send via WebSocket if connected
    const connections = this.activeConnections.get(notification.userId);
    if (connections) {
      const wsMessage: WebSocketMessage = {
        type: 'notification',
        userId: notification.userId,
        data: notification,
        timestamp: new Date()
      };

      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(wsMessage));
        }
      });
    }

    // Send via other channels based on preferences
    const preferences = this.getUserPreferences(notification.userId);
    if (preferences.channels.email) {
      await this.sendEmailNotification(notification);
    }

    if (preferences.channels.push) {
      await this.sendPushNotification(notification);
    }
  }

  private createOverspendingNotification(alert: OverspendingAlert): CorrectionNotification {
    const title = this.getOverspendingTitle(alert);
    const message = this.getOverspendingMessage(alert);

    const actions: NotificationAction[] = [
      {
        id: 'view_budget',
        label: 'View Budget Details',
        type: 'view_details',
        primary: true
      },
      {
        id: 'accept_suggestions',
        label: 'See Suggestions',
        type: 'accept'
      },
      {
        id: 'snooze',
        label: 'Remind Me Later',
        type: 'snooze'
      }
    ];

    return {
      id: `overspend_${alert.userId}_${Date.now()}`,
      userId: alert.userId,
      type: 'overspending_alert',
      priority: this.mapSeverityToPriority(alert.severity),
      title,
      message,
      data: alert,
      actions,
      timestamp: new Date(),
      read: false,
      dismissed: false
    };
  }

  private createBudgetAdjustmentNotification(adjustment: BudgetAdjustment): CorrectionNotification {
    const title = 'Budget Adjustment Available';
    const message = `We found ways to save ${adjustment.expectedSavings.toLocaleString()} IDR on your trip budget.`;

    const actions: NotificationAction[] = [
      {
        id: 'apply_adjustments',
        label: 'Apply Adjustments',
        type: 'accept',
        primary: true
      },
      {
        id: 'view_details',
        label: 'View Details',
        type: 'view_details'
      },
      {
        id: 'decline',
        label: 'Not Now',
        type: 'decline'
      }
    ];

    return {
      id: adjustment.adjustmentId,
      userId: adjustment.userId,
      type: 'budget_adjustment',
      priority: adjustment.severity,
      title,
      message,
      data: adjustment,
      actions,
      timestamp: new Date(),
      read: false,
      dismissed: false
    };
  }

  private createProactiveNotification(
    userId: string,
    suggestions: Array<{ type: string; description: string; potentialSavings: number }>
  ): CorrectionNotification {
    const totalSavings = suggestions.reduce((sum, s) => sum + s.potentialSavings, 0);
    const title = 'Budget Optimization Tips';
    const message = `Here are some personalized suggestions to save ${totalSavings.toLocaleString()} IDR on your trip.`;

    const actions: NotificationAction[] = [
      {
        id: 'view_suggestions',
        label: 'View Suggestions',
        type: 'view_details',
        primary: true
      },
      {
        id: 'apply_all',
        label: 'Apply All',
        type: 'accept'
      }
    ];

    return {
      id: `proactive_${userId}_${Date.now()}`,
      userId,
      type: 'proactive_correction',
      priority: 'low',
      title,
      message,
      data: { suggestions },
      actions,
      timestamp: new Date(),
      read: false,
      dismissed: false
    };
  }

  private getOverspendingTitle(alert: OverspendingAlert): string {
    switch (alert.severity) {
      case 'critical':
        return '🚨 Critical: Budget Significantly Exceeded';
      case 'high':
        return '⚠️ Budget Alert: Overspending Detected';
      case 'medium':
        return '📊 Budget Notice: Spending Above Target';
      default:
        return '💰 Budget Update: Minor Overspend';
    }
  }

  private getOverspendingMessage(alert: OverspendingAlert): string {
    const categoryText = alert.category === 'total' ? 'overall budget' : `${alert.category} budget`;
    const timeFrameText = alert.timeFrame === 'daily' ? 'today' :
                         alert.timeFrame === 'weekly' ? 'this week' : 'this month';

    return `You've spent ${alert.actualSpent.toLocaleString()} IDR on ${categoryText} ${timeFrameText}, ` +
           `which is ${alert.overspendPercentage.toFixed(1)}% over your ${alert.budgetedAmount.toLocaleString()} IDR budget.`;
  }

  private mapSeverityToPriority(severity: OverspendingAlert['severity']): CorrectionNotification['priority'] {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }

  private getUserPreferences(userId: string): NotificationPreferences {
    return this.userPreferences.get(userId) || this.getDefaultPreferences(userId);
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      enabled: true,
      channels: {
        inApp: true,
        email: false,
        push: false
      },
      thresholds: {
        overspendingAlert: 10, // 10% overspend
        budgetAdjustment: 50000, // 50k IDR minimum
        proactiveFrequency: 'weekly'
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  }

  private shouldSendNotification(preferences: NotificationPreferences, severity: string): boolean {
    // Check quiet hours
    if (preferences.quietHours.enabled && this.isQuietHour(preferences.quietHours)) {
      return severity === 'critical'; // Only send critical notifications during quiet hours
    }

    return true;
  }

  private shouldSendProactiveToday(userId: string, preferences: NotificationPreferences): boolean {
    if (preferences.thresholds.proactiveFrequency === 'never') return false;

    const lastProactive = this.getLastProactiveNotification(userId);
    if (!lastProactive) return true;

    const daysSinceLast = (Date.now() - lastProactive.timestamp.getTime()) / (1000 * 60 * 60 * 24);

    switch (preferences.thresholds.proactiveFrequency) {
      case 'daily': return daysSinceLast >= 1;
      case 'weekly': return daysSinceLast >= 7;
      default: return false;
    }
  }

  private getLastProactiveNotification(userId: string): CorrectionNotification | null {
    const history = this.notificationHistory.get(userId) || [];
    const proactiveNotifications = history
      .filter(n => n.type === 'proactive_correction')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return proactiveNotifications[0] || null;
  }

  private isQuietHour(quietHours: NotificationPreferences['quietHours']): boolean {
    if (!quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = this.timeToMinutes(quietHours.start);
    const endTime = this.timeToMinutes(quietHours.end);

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async sendEmailNotification(notification: CorrectionNotification): Promise<void> {
    // In a real implementation, this would integrate with an email service
    console.log(`Sending email notification to ${notification.userId}: ${notification.title}`);
  }

  private async sendPushNotification(notification: CorrectionNotification): Promise<void> {
    // In a real implementation, this would integrate with push notification service
    console.log(`Sending push notification to ${notification.userId}: ${notification.title}`);
  }

  private async handleAcceptAction(notification: CorrectionNotification, action: NotificationAction): Promise<{ success: boolean; result?: any }> {
    // Handle accepting a notification (e.g., applying budget adjustments)
    switch (notification.type) {
      case 'budget_adjustment':
        // In a real implementation, this would apply the budget adjustments
        return { success: true, result: { message: 'Budget adjustments applied successfully' } };
      case 'overspending_alert':
        // Mark as acknowledged and show suggestions
        return { success: true, result: { message: 'Alert acknowledged, showing budget suggestions' } };
      default:
        return { success: false };
    }
  }

  private async handleDeclineAction(notification: CorrectionNotification, action: NotificationAction): Promise<{ success: boolean; result?: any }> {
    // Handle declining a notification
    notification.dismissed = true;
    return { success: true, result: { message: 'Notification dismissed' } };
  }

  private async handleViewDetailsAction(notification: CorrectionNotification, action: NotificationAction): Promise<{ success: boolean; result?: any }> {
    // Handle viewing details
    return { success: true, result: { data: notification.data } };
  }

  private async handleSnoozeAction(notification: CorrectionNotification, action: NotificationAction): Promise<{ success: boolean; result?: any }> {
    // Handle snoozing a notification
    const snoozeUntil = new Date(Date.now() + 60 * 60 * 1000); // Snooze for 1 hour
    notification.expiresAt = snoozeUntil;
    return { success: true, result: { snoozedUntil: snoozeUntil } };
  }
}

// Singleton instance
export const correctionNotificationSystem = new CorrectionNotificationSystem();