import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  userId: string;
  budgetId?: string;
}

interface ExpenseAnalytics {
  totalSpent: number;
  categoryBreakdown: Record<string, number>;
  dailyAverage: number;
  monthlyTotal: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface BurnRateData {
  userId: string;
  budgetId: string;
  currentBurnRate: number;
  projectedBurnRate: number;
  dailyAverage: number;
  weeklyAverage: number;
  monthlyAverage: number;
  velocity: number;
  remainingDays: number;
  remainingBudget: number;
  projectedEndDate: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export function useRealTimeExpenses(userId: string, budgetId?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [burnRate, setBurnRate] = useState<BurnRateData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Initialize WebSocket connection
    const initWebSocket = async () => {
      try {
        // Get WebSocket connection info
        const response = await fetch('/api/expenses/real-time');
        const wsConfig = await response.json();

        // Create socket connection
        socketRef.current = io(wsConfig.websocketUrl, {
          query: { userId },
          transports: ['websocket', 'polling'],
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
          console.log('🔗 Connected to expense tracking WebSocket');
          setIsConnected(true);

          // Subscribe to expense updates
          socket.emit('subscribeToExpenses', { userId });

          // Get initial analytics
          socket.emit('getExpenseAnalytics', { userId, period: 'month' });
        });

        socket.on('disconnect', () => {
          console.log('🔌 Disconnected from expense tracking WebSocket');
          setIsConnected(false);
        });

        // Listen for expense creation events
        socket.on('expenseCreated', (data: { expense: Expense; timestamp: string }) => {
          console.log('💰 New expense created:', data.expense);
          setExpenses(prev => [data.expense, ...prev]);
          setLastUpdate(new Date(data.timestamp));

          // Refresh analytics
          socket.emit('getExpenseAnalytics', { userId, period: 'month' });
        });

        // Listen for transaction sync events
        socket.on('transactionSynced', (data: { transaction: any; timestamp: string }) => {
          console.log('🔄 Transaction synced:', data.transaction);
          setLastUpdate(new Date(data.timestamp));

          // Refresh analytics
          socket.emit('getExpenseAnalytics', { userId, period: 'month' });
        });

        // Listen for budget threshold alerts
        socket.on('budgetThreshold', (data: any) => {
          console.log('⚠️ Budget threshold alert:', data);
          // Could trigger notifications here
        });

        // Listen for analytics updates
        socket.on('expenseAnalytics', (data: ExpenseAnalytics) => {
          console.log('📊 Expense analytics updated:', data);
          setAnalytics(data);
        });

        socket.on('error', (error: any) => {
          console.error('🚨 WebSocket error:', error);
        });

      } catch (error) {
        console.error('Failed to initialize WebSocket connection:', error);
      }
    };

    initWebSocket();

    // Fetch initial expenses
    fetchInitialExpenses();

    // Fetch burn rate if budgetId is provided
    if (budgetId) {
      fetchBurnRate();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, budgetId]);

  const fetchInitialExpenses = async () => {
    try {
      const params = new URLSearchParams({
        userId,
        limit: '50',
        ...(budgetId && { budgetId }),
      });

      const response = await fetch(`/api/expenses?${params}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setExpenses(data);
      }
    } catch (error) {
      console.error('Failed to fetch initial expenses:', error);
    }
  };

  const fetchBurnRate = async () => {
    if (!budgetId) return;

    try {
      const response = await fetch(`/api/burn-rate/${budgetId}?userId=${userId}`);
      const data = await response.json();
      setBurnRate(data);
    } catch (error) {
      console.error('Failed to fetch burn rate:', error);
    }
  };

  const refreshBurnRate = () => {
    if (budgetId) {
      fetchBurnRate();
    }
  };

  const getSpendingVelocity = () => {
    if (!analytics || !burnRate) return null;

    const recentExpenses = expenses
      .filter(exp => {
        const expenseDate = new Date(exp.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return expenseDate >= weekAgo;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (recentExpenses.length < 2) return null;

    // Calculate daily spending trend
    const dailyAmounts = recentExpenses.reduce((acc, exp) => {
      const date = new Date(exp.date).toDateString();
      acc[date] = (acc[date] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const amounts = Object.values(dailyAmounts);
    if (amounts.length < 2) return null;

    // Simple velocity calculation (change over time)
    const recent = amounts.slice(-3); // Last 3 days
    const earlier = amounts.slice(-6, -3); // Previous 3 days

    if (earlier.length === 0) return 0;

    const recentAvg = recent.reduce((sum, amt) => sum + amt, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, amt) => sum + amt, 0) / earlier.length;

    return earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;
  };

  return {
    expenses,
    analytics,
    burnRate,
    isConnected,
    lastUpdate,
    spendingVelocity: getSpendingVelocity(),
    refreshBurnRate,
  };
}