import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { SyncTransactionDto } from './dto/sync-transaction.dto';
import { ExpensesGateway } from './expenses.gateway';
import { autoBudgetCorrectionEngine } from '../../../lib/ml/auto-budget-correction-engine';
import { mlEngine } from '../../../lib/ml/ml-engine';
import { BurnRateService } from '../burn-rate/burn-rate.service';
import { AlertSystemService } from '../alert-system/alert-system.service';

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ExpensesGateway))
    private expensesGateway: ExpensesGateway,
    private burnRateService: BurnRateService,
    private alertSystemService: AlertSystemService,
  ) {}

  // Create expense with ML categorization
  async create(createExpenseDto: CreateExpenseDto) {
    const { userId, amount, description, merchant, location, paymentMethod, ...otherData } = createExpenseDto;

    // ML-based categorization
    let category = createExpenseDto.category;
    let mlConfidence = 0;

    if (!createExpenseDto.isManuallyCategorized) {
      const categorization = await this.categorizeExpense({
        amount,
        description,
        merchant,
        location,
        paymentMethod
      });
      category = categorization.category;
      mlConfidence = categorization.confidence;
    }

    // Anomaly detection
    const anomalyScore = await this.detectAnomaly(userId, amount, category);

    const expense = await this.prisma.expense.create({
      data: {
        userId,
        budgetId: createExpenseDto.budgetId,
        itineraryId: createExpenseDto.itineraryId,
        amount,
        currency: createExpenseDto.currency,
        category,
        subcategory: createExpenseDto.subcategory,
        description,
        date: createExpenseDto.date ? new Date(createExpenseDto.date) : new Date(),
        location,
        paymentMethod,
        merchant,
        tags: createExpenseDto.tags ? JSON.stringify(createExpenseDto.tags) : null,
        mlCategory: category,
        mlConfidence,
        isManuallyCategorized: createExpenseDto.isManuallyCategorized,
        receiptImage: createExpenseDto.receiptImage,
        transactionId: createExpenseDto.transactionId,
        isRecurring: createExpenseDto.isRecurring,
        recurringFrequency: createExpenseDto.recurringFrequency,
        consentGiven: createExpenseDto.consentGiven,
      },
    });

    // Update budget spent amount if linked to budget
    if (createExpenseDto.budgetId) {
      await this.updateBudgetSpent(createExpenseDto.budgetId);
    }

    // Send notification if approaching budget limit
    await this.checkBudgetThresholds(userId, createExpenseDto.budgetId);

    // Trigger burn rate analysis and alerts
    if (createExpenseDto.budgetId) {
      try {
        // Clear burn rate cache to force recalculation
        await this.burnRateService.clearCache(userId, createExpenseDto.budgetId);

        // Evaluate alerts for the budget
        await this.alertSystemService.evaluateAlerts(userId, createExpenseDto.budgetId);
      } catch (error) {
        console.error('Error updating burn rate and alerts after expense creation:', error);
        // Don't fail expense creation if burn rate analysis fails
      }
    }

    // Real-time notification
    this.expensesGateway.notifyExpenseCreated(userId, expense);

    // Track spending for auto budget correction
    try {
      await autoBudgetCorrectionEngine.trackSpending({
        userId,
        date: expense.date,
        category: expense.category as any,
        amount: expense.amount,
        description: expense.description || undefined,
        location: expense.location || undefined,
        plannedAmount: undefined // Could be calculated from budget
      });
    } catch (error) {
      console.error('Error tracking spending for budget correction:', error);
      // Don't fail the expense creation if budget correction fails
    }

    // Track behavior for ML learning
    try {
      mlEngine.trackUserBehavior({
        userId,
        timestamp: Date.now(),
        action: 'click', // Expense creation is an intentional action
        targetType: 'budget',
        targetId: expense.id,
        targetData: {
          category: expense.category,
          price: expense.amount,
          location: expense.location
        },
        sessionId: `expense_creation_${Date.now()}`,
        timeSpent: 0
      });
    } catch (error) {
      console.error('Error tracking behavior for ML:', error);
      // Don't fail expense creation if ML tracking fails
    }

    return expense;
  }

  // Enhanced ML-based expense categorization
  private async categorizeExpense(expenseData: {
    amount: number;
    description: string;
    merchant?: string;
    location?: string;
    paymentMethod: string;
  }): Promise<{ category: string; confidence: number }> {
    const { amount, description, merchant, location, paymentMethod } = expenseData;
    const text = `${description} ${merchant || ''} ${location || ''}`.toLowerCase();

    // Enhanced categorization with weighted keyword matching
    const categories = {
      transportation: {
        keywords: [
          'transport', 'taxi', 'uber', 'grab', 'gojek', 'bus', 'train', 'flight', 'airline', 'airport',
          'kereta', 'pesawat', 'bandara', 'terminal', 'stasiun', 'angkot', 'ojek', 'becak', 'rickshaw',
          'rental', 'sewa', 'mobil', 'motor', 'bike', 'car', 'vehicle'
        ],
        weight: 0.9
      },
      accommodation: {
        keywords: [
          'hotel', 'accommodation', 'penginapan', 'motel', 'inn', 'resort', 'villa', 'apartment', 'guesthouse',
          'hostel', 'homestay', 'airbnb', 'booking', 'agoda', 'traveloka', 'room', 'kamar', 'stay', 'overnight'
        ],
        weight: 0.95
      },
      food: {
        keywords: [
          'food', 'restaurant', 'cafe', 'kuliner', 'makan', 'eat', 'dining', 'warung', 'resto', 'bistro',
          'bar', 'pub', 'fast food', 'street food', 'takeaway', 'delivery', 'groceries', 'supermarket',
          'minimarket', 'indomaret', 'alfamart', 'pasar', 'market'
        ],
        weight: 0.85
      },
      'tourism tickets': {
        keywords: [
          'ticket', 'entrance', 'museum', 'park', 'zoo', 'aquarium', 'theme park', 'attraction', 'tour',
          'guided tour', 'sightseeing', 'monument', 'landmark', 'tiket', 'masuk', 'wisata', 'destinasi',
          'borobudur', 'prambanan', 'gunung', 'beach', 'pantai', 'island', 'pulau'
        ],
        weight: 0.8
      },
      shopping: {
        keywords: [
          'shop', 'mall', 'market', 'store', 'boutique', 'shopping', 'purchase', 'buy', 'belanja',
          'department store', 'outlet', 'plaza', 'center', 'retail', 'clothing', 'fashion', 'souvenir',
          'gift', 'oleh-oleh', 'craft', 'art', 'antique'
        ],
        weight: 0.75
      }
    };

    let bestCategory = 'miscellaneous';
    let bestScore = 0;
    let bestConfidence = 0.3;

    for (const [category, config] of Object.entries(categories)) {
      let score = 0;
      const keywords = config.keywords;

      // Count keyword matches
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          score += 1;
        }
      }

      // Normalize score by keyword count
      const normalizedScore = score / keywords.length;

      // Apply category weight
      const finalScore = normalizedScore * config.weight;

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestCategory = category;
        bestConfidence = Math.min(finalScore + 0.2, 1.0); // Add base confidence
      }
    }

    // Additional logic for payment method hints
    if (paymentMethod === 'qris' || paymentMethod === 'ewallet') {
      // QRIS/e-wallets often used for food, transportation, shopping
      if (bestCategory === 'miscellaneous' && amount < 100000) {
        if (text.includes('food') || text.includes('makan')) {
          bestCategory = 'food';
          bestConfidence = 0.7;
        } else if (text.includes('transport') || text.includes('taxi')) {
          bestCategory = 'transportation';
          bestConfidence = 0.8;
        }
      }
    }

    // Amount-based hints
    if (amount > 500000 && bestCategory === 'miscellaneous') {
      // High amounts likely accommodation or activities
      if (text.includes('hotel') || text.includes('stay')) {
        bestCategory = 'accommodation';
        bestConfidence = 0.9;
      } else if (text.includes('ticket') || text.includes('tour')) {
        bestCategory = 'tourism tickets';
        bestConfidence = 0.8;
      }
    }

    return { category: bestCategory, confidence: bestConfidence };
  }

  // Anomaly detection
  private async detectAnomaly(userId: string, amount: number, category: string): Promise<number> {
    // Get user's expense history for this category
    const userExpenses = await this.prisma.expense.findMany({
      where: {
        userId,
        category,
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      select: { amount: true },
    });

    if (userExpenses.length < 3) return 0; // Not enough data

    const amounts = userExpenses.map(e => e.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // Z-score for anomaly detection
    const zScore = Math.abs((amount - mean) / stdDev);
    return Math.min(zScore / 3, 1); // Normalize to 0-1
  }

  // Update budget spent amount
  private async updateBudgetSpent(budgetId: string) {
    const expenses = await this.prisma.expense.findMany({
      where: { budgetId },
      select: { amount: true },
    });

    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    await this.prisma.budget.update({
      where: { id: budgetId },
      data: { spent: totalSpent },
    });
  }

  // Check budget thresholds and send notifications
  private async checkBudgetThresholds(userId: string, budgetId?: string) {
    if (!budgetId) return;

    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: { user: true },
    });

    if (!budget) return;

    // Check total budget thresholds
    const spentPercentage = (budget.spent / budget.totalBudget) * 100;

    if (spentPercentage >= 70 && spentPercentage < 90) {
      // Create notification
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'budget_warning',
          title: 'Budget Alert',
          message: `You've used ${spentPercentage.toFixed(1)}% of your total budget. Consider adjusting your spending.`,
        },
      });

      // Real-time notification
      this.expensesGateway.notifyBudgetThreshold(userId, {
        budgetId,
        spentPercentage,
        level: 'warning',
        type: 'total',
        message: `You've used ${spentPercentage.toFixed(1)}% of your total budget.`,
      });
    } else if (spentPercentage >= 90) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'budget_critical',
          title: 'Budget Critical',
          message: `You've used ${spentPercentage.toFixed(1)}% of your total budget. Please review your expenses.`,
        },
      });

      // Real-time notification
      this.expensesGateway.notifyBudgetThreshold(userId, {
        budgetId,
        spentPercentage,
        level: 'critical',
        type: 'total',
        message: `You've used ${spentPercentage.toFixed(1)}% of your total budget.`,
      });
    }

    // Check daily budget thresholds
    await this.checkDailyBudgetThresholds(userId, budgetId);
  }

  // Check daily budget thresholds
  private async checkDailyBudgetThresholds(userId: string, budgetId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: { itinerary: true },
    });

    if (!budget || !budget.itinerary) return;

    const itinerary = budget.itinerary;
    const startDate = new Date(itinerary.startDate);
    const endDate = new Date(itinerary.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const dailyBudget = budget.totalBudget / totalDays;

    // Get today's expenses for this budget
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayExpenses = await this.prisma.expense.findMany({
      where: {
        budgetId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: { amount: true },
    });

    const todaySpent = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const dailySpentPercentage = (todaySpent / dailyBudget) * 100;

    if (dailySpentPercentage >= 70 && dailySpentPercentage < 90) {
      // Create notification
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'daily_budget_warning',
          title: 'Daily Budget Alert',
          message: `You've used ${dailySpentPercentage.toFixed(1)}% of your daily budget (${todaySpent.toLocaleString()} of ${dailyBudget.toLocaleString()}). Consider adjusting today's spending.`,
        },
      });

      // Real-time notification
      this.expensesGateway.notifyBudgetThreshold(userId, {
        budgetId,
        spentPercentage: dailySpentPercentage,
        level: 'warning',
        type: 'daily',
        todaySpent,
        dailyBudget,
        message: `You've used ${dailySpentPercentage.toFixed(1)}% of your daily budget.`,
      });
    } else if (dailySpentPercentage >= 90) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'daily_budget_critical',
          title: 'Daily Budget Critical',
          message: `You've used ${dailySpentPercentage.toFixed(1)}% of your daily budget (${todaySpent.toLocaleString()} of ${dailyBudget.toLocaleString()}). Please review today's expenses.`,
        },
      });

      // Real-time notification
      this.expensesGateway.notifyBudgetThreshold(userId, {
        budgetId,
        spentPercentage: dailySpentPercentage,
        level: 'critical',
        type: 'daily',
        todaySpent,
        dailyBudget,
        message: `You've used ${dailySpentPercentage.toFixed(1)}% of your daily budget.`,
      });
    }
  }

  // TODO: Track expense behavior for ML learning
  // private trackExpenseBehavior(userId: string, expense: any) {
  //   // ML tracking implementation
  // }

  // Sync transaction from external source
  async syncTransaction(syncTransactionDto: SyncTransactionDto) {
    const { userId, source, externalId, amount, date, merchant, location, description } = syncTransactionDto;

    console.log('🔄 Starting transaction sync with data:', {
      userId,
      source,
      externalId,
      amount,
      date,
      merchant,
      location,
      description
    });

    // Verify user exists before proceeding
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });

    if (!userExists) {
      console.error('❌ User does not exist for transaction sync:', userId);
      throw new BadRequestException(`User with ID ${userId} does not exist`);
    }

    console.log('✅ User verified:', userExists.email);

    // Check for duplicate transaction
    if (externalId) {
      const existing = await this.prisma.transaction.findUnique({
        where: {
          userId_externalId_source: {
            userId,
            externalId,
            source,
          },
        },
      });
      if (existing) {
        console.log('⚠️ Transaction already exists:', existing.id);
        throw new BadRequestException('Transaction already synced');
      }
    }

    // ML categorization for transaction
    const categorization = await this.categorizeExpense({
      amount,
      description: description || '',
      merchant,
      location,
      paymentMethod: source,
    });

    console.log('🤖 ML categorization result:', categorization);

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        source,
        externalId,
        amount,
        currency: syncTransactionDto.currency,
        date: new Date(date),
        merchant,
        location,
        description,
        status: syncTransactionDto.status,
        mlCategory: categorization.category,
        mlConfidence: categorization.confidence,
        anomalyScore: await this.detectAnomaly(userId, amount, categorization.category),
        consentGiven: syncTransactionDto.consentGiven,
        lastSyncedAt: new Date(),
        syncSource: source,
      },
    });

    console.log('✅ Transaction created successfully:', transaction.id);

    // Real-time notification for transaction sync
    this.expensesGateway.notifyTransactionSynced(userId, transaction);

    // Auto-create expense from transaction if amount is significant
    if (amount > 10000) { // Threshold for auto-creation
      await this.create({
        userId,
        amount,
        category: categorization.category,
        description: description || `Transaction from ${merchant || source}`,
        date,
        location,
        paymentMethod: source,
        merchant,
        transactionId: transaction.id,
        isManuallyCategorized: false,
        consentGiven: syncTransactionDto.consentGiven,
      });
    }

    return transaction;
  }

  // Get expenses with filtering and pagination
  async findAll(userId: string, filters?: {
    category?: string;
    startDate?: Date;
    endDate?: Date;
    budgetId?: string;
    itineraryId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { userId };

    if (filters?.category) where.category = filters.category;
    if (filters?.budgetId) where.budgetId = filters.budgetId;
    if (filters?.itineraryId) where.itineraryId = filters.itineraryId;
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        budget: true,
        itinerary: true,
        transaction: true,
      },
      orderBy: { date: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    const total = await this.prisma.expense.count({ where });

    return {
      expenses,
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
  }

  // Get expense analytics
  async getAnalytics(userId: string, period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    const periodStart = new Date();

    switch (period) {
      case 'week':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
    }

    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: periodStart,
          lte: now,
        },
      },
    });

    // Calculate analytics
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryBreakdown = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const dailySpending = expenses.reduce((acc, exp) => {
      const date = exp.date.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSpent,
      transactionCount: expenses.length,
      categoryBreakdown,
      dailySpending,
      averageTransaction: expenses.length > 0 ? totalSpent / expenses.length : 0,
    };
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        budget: true,
        itinerary: true,
        transaction: true,
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto) {
    const expense = await this.findOne(id);

    const data: any = {};
    if (updateExpenseDto.amount !== undefined) data.amount = updateExpenseDto.amount;
    if (updateExpenseDto.currency !== undefined) data.currency = updateExpenseDto.currency;
    if (updateExpenseDto.category !== undefined) data.category = updateExpenseDto.category;
    if (updateExpenseDto.subcategory !== undefined) data.subcategory = updateExpenseDto.subcategory;
    if (updateExpenseDto.description !== undefined) data.description = updateExpenseDto.description;
    if (updateExpenseDto.date !== undefined) data.date = new Date(updateExpenseDto.date);
    if (updateExpenseDto.location !== undefined) data.location = updateExpenseDto.location;
    if (updateExpenseDto.paymentMethod !== undefined) data.paymentMethod = updateExpenseDto.paymentMethod;
    if (updateExpenseDto.merchant !== undefined) data.merchant = updateExpenseDto.merchant;
    if (updateExpenseDto.tags !== undefined) data.tags = updateExpenseDto.tags ? JSON.stringify(updateExpenseDto.tags) : null;
    if (updateExpenseDto.receiptImage !== undefined) data.receiptImage = updateExpenseDto.receiptImage;
    if (updateExpenseDto.isRecurring !== undefined) data.isRecurring = updateExpenseDto.isRecurring;
    if (updateExpenseDto.recurringFrequency !== undefined) data.recurringFrequency = updateExpenseDto.recurringFrequency;
    if (updateExpenseDto.consentGiven !== undefined) data.consentGiven = updateExpenseDto.consentGiven;

    const updatedExpense = await this.prisma.expense.update({
      where: { id },
      data,
    });

    // Update budget spent if budget changed
    if (updateExpenseDto.budgetId && updateExpenseDto.budgetId !== expense.budgetId) {
      if (expense.budgetId) {
        await this.updateBudgetSpent(expense.budgetId);
      }
      if (updateExpenseDto.budgetId) {
        await this.updateBudgetSpent(updateExpenseDto.budgetId);
      }
    }

    return updatedExpense;
  }

  async remove(id: string) {
    const expense = await this.findOne(id);

    await this.prisma.expense.delete({
      where: { id },
    });

    // Update budget spent
    if (expense.budgetId) {
      await this.updateBudgetSpent(expense.budgetId);
    }

    return { message: 'Expense deleted successfully' };
  }
}