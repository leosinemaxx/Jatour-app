import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BurnRateService } from '../burn-rate/burn-rate.service';
import { ExpensesService } from '../expenses/expenses.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface AlertRule {
  id: string;
  name: string;
  type: 'burn_rate' | 'budget_threshold' | 'spending_velocity' | 'unusual_activity';
  condition: {
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
    value: number | string;
    field: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  enabled: boolean;
  cooldownMinutes: number; // Prevent alert spam
}

export interface AlertInstance {
  id: string;
  ruleId: string;
  userId: string;
  budgetId?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: any; // Additional context data
  resolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
  lastNotifiedAt?: Date;
}

@Injectable()
export class AlertSystemService {
  private alertRules: AlertRule[] = [
    {
      id: 'burn-rate-critical',
      name: 'Critical Burn Rate Alert',
      type: 'burn_rate',
      condition: { operator: 'eq', value: 'critical', field: 'riskLevel' },
      severity: 'critical',
      message: '🚨 CRITICAL: Your burn rate indicates imminent budget exhaustion. Immediate action required.',
      enabled: true,
      cooldownMinutes: 60,
    },
    {
      id: 'burn-rate-high',
      name: 'High Burn Rate Alert',
      type: 'burn_rate',
      condition: { operator: 'eq', value: 'high', field: 'riskLevel' },
      severity: 'high',
      message: '⚠️ HIGH RISK: Your spending rate is concerning. Review your budget allocation.',
      enabled: true,
      cooldownMinutes: 120,
    },
    {
      id: 'velocity-increasing',
      name: 'Spending Acceleration Alert',
      type: 'spending_velocity',
      condition: { operator: 'gt', value: 0.2, field: 'velocity' },
      severity: 'medium',
      message: '📈 Spending velocity is increasing rapidly. Monitor your daily expenses closely.',
      enabled: true,
      cooldownMinutes: 240,
    },
    {
      id: 'budget-90-percent',
      name: '90% Budget Utilization',
      type: 'budget_threshold',
      condition: { operator: 'gte', value: 90, field: 'utilizationPercentage' },
      severity: 'high',
      message: '💰 Budget utilization has reached 90%. Consider adjusting spending or extending budget.',
      enabled: true,
      cooldownMinutes: 1440, // 24 hours
    },
    {
      id: 'unusual-spending',
      name: 'Unusual Spending Pattern',
      type: 'unusual_activity',
      condition: { operator: 'gt', value: 100000, field: 'amount' }, // Simple threshold
      severity: 'medium',
      message: '🔍 Unusual spending activity detected. Please verify recent transactions.',
      enabled: true,
      cooldownMinutes: 60,
    },
  ];

  constructor(
    private prisma: PrismaService,
    private burnRateService: BurnRateService,
    @Inject(forwardRef(() => ExpensesService))
    private expensesService: ExpensesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Evaluate all alert rules for a user and trigger alerts as needed
   */
  async evaluateAlerts(userId: string, budgetId?: string): Promise<AlertInstance[]> {
    const triggeredAlerts: AlertInstance[] = [];

    // Get user's budgets
    const budgets = budgetId
      ? [await this.prisma.budget.findUnique({ where: { id: budgetId, userId }, include: { itinerary: true } })].filter(Boolean)
      : await this.prisma.budget.findMany({ where: { userId }, include: { itinerary: true } });

    for (const budget of budgets) {
      try {
        // Get burn rate data
        const burnRateData = await this.burnRateService.calculateBurnRate(userId, budget.id);

        // Evaluate burn rate alerts
        const burnRateAlerts = await this.evaluateBurnRateAlerts(userId, budget, burnRateData);
        triggeredAlerts.push(...burnRateAlerts);

        // Evaluate budget threshold alerts
        const thresholdAlerts = await this.evaluateBudgetThresholdAlerts(userId, budget, burnRateData);
        triggeredAlerts.push(...thresholdAlerts);

        // Evaluate spending velocity alerts
        const velocityAlerts = await this.evaluateVelocityAlerts(userId, budget, burnRateData);
        triggeredAlerts.push(...velocityAlerts);

      } catch (error) {
        console.error(`Error evaluating alerts for budget ${budget.id}:`, error);
      }
    }

    // Evaluate unusual spending alerts
    const unusualAlerts = await this.evaluateUnusualSpendingAlerts(userId);
    triggeredAlerts.push(...unusualAlerts);

    // Process triggered alerts
    await this.processTriggeredAlerts(triggeredAlerts);

    return triggeredAlerts;
  }

  /**
   * Evaluate burn rate specific alerts
   */
  private async evaluateBurnRateAlerts(
    userId: string,
    budget: any,
    burnRateData: any
  ): Promise<AlertInstance[]> {
    const alerts: AlertInstance[] = [];
    const burnRateRules = this.alertRules.filter(rule => rule.type === 'burn_rate');

    for (const rule of burnRateRules) {
      if (!rule.enabled) continue;

      const shouldTrigger = this.evaluateCondition(rule.condition, burnRateData);

      if (shouldTrigger) {
        const alert: AlertInstance = {
          id: `${rule.id}-${budget.id}-${Date.now()}`,
          ruleId: rule.id,
          userId,
          budgetId: budget.id,
          type: rule.type,
          severity: rule.severity,
          title: rule.name,
          message: this.customizeMessage(rule.message, { budget, burnRateData }),
          data: { burnRateData, budget },
          resolved: false,
          createdAt: new Date(),
        };
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Evaluate budget threshold alerts
   */
  private async evaluateBudgetThresholdAlerts(
    userId: string,
    budget: any,
    burnRateData: any
  ): Promise<AlertInstance[]> {
    const alerts: AlertInstance[] = [];
    const thresholdRules = this.alertRules.filter(rule => rule.type === 'budget_threshold');

    for (const rule of thresholdRules) {
      if (!rule.enabled) continue;

      const shouldTrigger = this.evaluateCondition(rule.condition, {
        utilizationPercentage: burnRateData.utilizationPercentage || 0,
      });

      if (shouldTrigger) {
        const alert: AlertInstance = {
          id: `${rule.id}-${budget.id}-${Date.now()}`,
          ruleId: rule.id,
          userId,
          budgetId: budget.id,
          type: rule.type,
          severity: rule.severity,
          title: rule.name,
          message: this.customizeMessage(rule.message, { budget, burnRateData }),
          data: { burnRateData, budget },
          resolved: false,
          createdAt: new Date(),
        };
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Evaluate spending velocity alerts
   */
  private async evaluateVelocityAlerts(
    userId: string,
    budget: any,
    burnRateData: any
  ): Promise<AlertInstance[]> {
    const alerts: AlertInstance[] = [];
    const velocityRules = this.alertRules.filter(rule => rule.type === 'spending_velocity');

    for (const rule of velocityRules) {
      if (!rule.enabled) continue;

      const shouldTrigger = this.evaluateCondition(rule.condition, burnRateData);

      if (shouldTrigger) {
        const alert: AlertInstance = {
          id: `${rule.id}-${budget.id}-${Date.now()}`,
          ruleId: rule.id,
          userId,
          budgetId: budget.id,
          type: rule.type,
          severity: rule.severity,
          title: rule.name,
          message: this.customizeMessage(rule.message, { budget, burnRateData }),
          data: { burnRateData, budget },
          resolved: false,
          createdAt: new Date(),
        };
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Evaluate unusual spending alerts
   */
  private async evaluateUnusualSpendingAlerts(userId: string): Promise<AlertInstance[]> {
    const alerts: AlertInstance[] = [];
    const unusualRules = this.alertRules.filter(rule => rule.type === 'unusual_activity');

    // Get recent expenses
    const recentExpenses = await this.prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { date: 'desc' },
      take: 10,
    });

    for (const rule of unusualRules) {
      if (!rule.enabled) continue;

      for (const expense of recentExpenses) {
        const shouldTrigger = this.evaluateCondition(rule.condition, expense);

        if (shouldTrigger) {
          const alert: AlertInstance = {
            id: `${rule.id}-${expense.id}-${Date.now()}`,
            ruleId: rule.id,
            userId,
            budgetId: expense.budgetId || undefined,
            type: rule.type,
            severity: rule.severity,
            title: rule.name,
            message: this.customizeMessage(rule.message, { expense }),
            data: { expense },
            resolved: false,
            createdAt: new Date(),
          };
          alerts.push(alert);
        }
      }
    }

    return alerts;
  }

  /**
   * Evaluate a condition against data
   */
  private evaluateCondition(condition: any, data: any): boolean {
    const fieldValue = data[condition.field];

    if (fieldValue === undefined || fieldValue === null) return false;

    // Handle string comparisons
    if (typeof fieldValue === 'string' || typeof condition.value === 'string') {
      switch (condition.operator) {
        case 'eq':
          return fieldValue === condition.value;
        case 'gt':
        case 'gte':
        case 'lt':
        case 'lte':
          // String comparisons - could be extended for alphabetical ordering
          return false; // Not applicable for strings in this context
        default:
          return false;
      }
    }

    // Handle numeric comparisons
    switch (condition.operator) {
      case 'gt':
        return fieldValue > condition.value;
      case 'gte':
        return fieldValue >= condition.value;
      case 'lt':
        return fieldValue < condition.value;
      case 'lte':
        return fieldValue <= condition.value;
      case 'eq':
        return fieldValue === condition.value;
      default:
        return false;
    }
  }

  /**
   * Customize alert message with context data
   */
  private customizeMessage(template: string, context: any): string {
    let message = template;

    // Replace placeholders with actual values
    if (context.burnRateData) {
      message = message.replace(
        /\{burnRate\}/g,
        `IDR ${context.burnRateData.projectedBurnRate?.toLocaleString('id-ID') || 'N/A'}`
      );
      message = message.replace(
        /\{remainingDays\}/g,
        context.burnRateData.remainingDays?.toString() || 'N/A'
      );
    }

    if (context.budget) {
      message = message.replace(
        /\{budgetName\}/g,
        context.budget.itinerary?.title || 'Budget'
      );
    }

    if (context.expense) {
      message = message.replace(
        /\{amount\}/g,
        `IDR ${context.expense.amount?.toLocaleString('id-ID') || 'N/A'}`
      );
      message = message.replace(
        /\{category\}/g,
        context.expense.category || 'Unknown'
      );
    }

    return message;
  }

  /**
   * Process triggered alerts - create notifications and handle cooldowns
   */
  private async processTriggeredAlerts(alerts: AlertInstance[]): Promise<void> {
    for (const alert of alerts) {
      // Check if similar alert was recently triggered (cooldown)
      const rule = this.alertRules.find(r => r.id === alert.ruleId);
      if (rule) {
        // For now, use cache to check cooldown
        const cooldownKey = `alert-cooldown:${alert.userId}:${alert.ruleId}:${alert.budgetId || 'global'}`;
        const lastTriggered = await this.cacheManager.get<number>(cooldownKey);

        if (lastTriggered && (Date.now() - lastTriggered) < (rule.cooldownMinutes * 60 * 1000)) {
          console.log(`Alert ${alert.ruleId} is in cooldown period`);
          continue; // Skip this alert
        }

        // Set cooldown
        await this.cacheManager.set(cooldownKey, Date.now(), rule.cooldownMinutes * 60 * 1000);
      }

      // Create alert instance in database (temporarily disabled)
      // await this.createAlertInstance(alert);

      // Create notification
      await this.createNotification(alert);

      // Send real-time notification if gateway available
      await this.sendRealtimeNotification(alert);
    }
  }

  /**
   * Create alert instance in database (temporarily using cache)
   */
  private async createAlertInstance(alert: AlertInstance): Promise<void> {
    // Temporarily store in cache until Prisma client is updated
    const cacheKey = `alert-instance:${alert.id}`;
    await this.cacheManager.set(cacheKey, alert, 7 * 24 * 60 * 60 * 1000); // 7 days

    // TODO: Uncomment when Prisma client is updated
    // await this.prisma.alertInstance.create({
    //   data: {
    //     id: alert.id,
    //     ruleId: alert.ruleId,
    //     userId: alert.userId,
    //     budgetId: alert.budgetId,
    //     type: alert.type,
    //     severity: alert.severity,
    //     title: alert.title,
    //     message: alert.message,
    //     data: JSON.stringify(alert.data),
    //     resolved: alert.resolved,
    //     createdAt: alert.createdAt,
    //   },
    // });
  }

  /**
   * Create notification for the alert
   */
  private async createNotification(alert: AlertInstance): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: alert.userId,
        type: `alert_${alert.type}`,
        title: alert.title,
        message: alert.message,
        isRead: false,
      },
    });
  }

  /**
   * Send real-time notification
   */
  private async sendRealtimeNotification(alert: AlertInstance): Promise<void> {
    try {
      // This would integrate with WebSocket gateway
      // For now, we'll just log it
      console.log(`Real-time alert sent to user ${alert.userId}: ${alert.title}`);
    } catch (error) {
      console.error('Error sending real-time notification:', error);
    }
  }

  /**
   * Get active alerts for a user (temporarily using cache)
   */
  async getActiveAlerts(userId: string): Promise<AlertInstance[]> {
    // Temporarily return empty array until Prisma client is updated
    // TODO: Implement with database when available
    return [];

    // TODO: Uncomment when Prisma client is updated
    // const alertInstances = await this.prisma.alertInstance.findMany({
    //   where: {
    //     userId,
    //     resolved: false,
    //     createdAt: {
    //       gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    //     },
    //   },
    //   orderBy: { createdAt: 'desc' },
    // });

    // return alertInstances.map(instance => ({
    //   id: instance.id,
    //   ruleId: instance.ruleId,
    //   userId: instance.userId,
    //   budgetId: instance.budgetId || undefined,
    //   type: instance.type,
    //   severity: instance.severity as any,
    //   title: instance.title,
    //   message: instance.message,
    //   data: JSON.parse(instance.data || '{}'),
    //   resolved: instance.resolved,
    //   resolvedAt: instance.resolvedAt || undefined,
    //   createdAt: instance.createdAt,
    //   lastNotifiedAt: instance.lastNotifiedAt || undefined,
    // }));
  }

  /**
   * Resolve an alert (temporarily using cache)
   */
  async resolveAlert(alertId: string, userId: string): Promise<void> {
    // Temporarily mark as resolved in cache
    const cacheKey = `alert-instance:${alertId}`;
    const alert = await this.cacheManager.get<AlertInstance>(cacheKey);
    if (alert && alert.userId === userId) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      await this.cacheManager.set(cacheKey, alert, 7 * 24 * 60 * 60 * 1000);
    }

    // TODO: Uncomment when Prisma client is updated
    // await this.prisma.alertInstance.updateMany({
    //   where: {
    //     id: alertId,
    //     userId,
    //   },
    //   data: {
    //     resolved: true,
    //     resolvedAt: new Date(),
    //   },
    // });
  }

  /**
   * Configure alert rules for a user
   */
  async configureAlertRules(userId: string, rules: Partial<AlertRule>[]): Promise<void> {
    // This would store user-specific alert rule configurations
    // For now, we'll just update the in-memory rules
    for (const ruleUpdate of rules) {
      const existingRule = this.alertRules.find(r => r.id === ruleUpdate.id);
      if (existingRule) {
        Object.assign(existingRule, ruleUpdate);
      }
    }
  }

  /**
   * Get alert statistics for dashboard (temporarily returning mock data)
   */
  async getAlertStatistics(userId: string): Promise<any> {
    const cacheKey = `alert-stats:${userId}`;

    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Temporarily return mock statistics until database is available
    const stats = {
      total: 0,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      byType: {},
    };

    await this.cacheManager.set(cacheKey, stats, 300000); // Cache for 5 minutes
    return stats;

    // TODO: Uncomment when Prisma client is updated
    // const thirtyDaysAgo = new Date();
    // thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // const alertStats = await this.prisma.alertInstance.groupBy({
    //   by: ['severity', 'type'],
    //   where: {
    //     userId,
    //     createdAt: { gte: thirtyDaysAgo },
    //   },
    //   _count: {
    //     id: true,
    //   },
    // });

    // const stats = {
    //   total: alertStats.reduce((sum, stat) => sum + stat._count.id, 0),
    //   bySeverity: {
    //     low: alertStats.filter(s => s.severity === 'low').reduce((sum, s) => sum + s._count.id, 0),
    //     medium: alertStats.filter(s => s.severity === 'medium').reduce((sum, s) => sum + s._count.id, 0),
    //     high: alertStats.filter(s => s.severity === 'high').reduce((sum, s) => sum + s._count.id, 0),
    //     critical: alertStats.filter(s => s.severity === 'critical').reduce((sum, s) => sum + s._count.id, 0),
    //   },
    //   byType: alertStats.reduce((acc, stat) => {
    //     acc[stat.type] = (acc[stat.type] || 0) + stat._count.id;
    //     return acc;
    //   }, {} as Record<string, number>),
    // };

    // await this.cacheManager.set(cacheKey, stats, 300000); // Cache for 5 minutes
    // return stats;
  }
}