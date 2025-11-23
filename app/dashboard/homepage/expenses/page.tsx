// Real-time Expense Tracking and Smart Categorization Page
// AI-powered expense management with automatic categorization and budget monitoring

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Receipt,
  CreditCard,
  Smartphone,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  Calendar,
  MapPin,
  Tag,
  Brain,
  Zap,
  DollarSign,
  PieChart,
  BarChart3,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Camera,
  Upload,
  QrCode,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useNotification } from "@/lib/components/NotificationProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const expenseCategories = [
  { id: 'food', name: 'Food & Dining', icon: '🍽️', color: 'from-orange-500 to-red-500' },
  { id: 'transportation', name: 'Transportation', icon: '🚗', color: 'from-blue-500 to-cyan-500' },
  { id: 'accommodation', name: 'Accommodation', icon: '🏨', color: 'from-purple-500 to-pink-500' },
  { id: 'activities', name: 'Activities', icon: '🎭', color: 'from-green-500 to-emerald-500' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: 'from-yellow-500 to-orange-500' },
  { id: 'miscellaneous', name: 'Miscellaneous', icon: '📦', color: 'from-gray-500 to-slate-500' },
];

const paymentMethods = [
  { id: 'cash', name: 'Cash', icon: DollarSign },
  { id: 'debit_card', name: 'Debit Card', icon: CreditCard },
  { id: 'credit_card', name: 'Credit Card', icon: CreditCard },
  { id: 'e_wallet', name: 'E-Wallet', icon: Smartphone },
  { id: 'transfer', name: 'Bank Transfer', icon: TrendingUp },
  { id: 'qris', name: 'QRIS', icon: QrCode },
];

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
  merchant?: string;
  location?: string;
  mlCategory?: string;
  mlConfidence?: number;
  tags?: string[];
  receiptImage?: string;
}

export default function ExpensesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);

  // Form states
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    merchant: '',
    location: '',
    tags: '',
    receiptImage: null as File | null,
  });

  const [syncForm, setSyncForm] = useState({
    source: '',
    externalId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    merchant: '',
    location: '',
    description: '',
  });

  // Filters
  const [filters, setFilters] = useState({
    category: '',
    startDate: '',
    endDate: '',
    search: '',
  });

  // Real-time updates
  useEffect(() => {
    if (user) {
      loadExpenses();
      loadAnalytics();
      setupWebSocket();
    }
  }, [user]);

  const setupWebSocket = async () => {
    try {
      // Get WebSocket connection info from API
      const response = await fetch('/api/expenses/real-time');
      const wsConfig = await response.json();

      const ws = new WebSocket(`${wsConfig.websocketUrl}?userId=${user?.id}`);

      ws.onopen = () => {
        // Subscribe to expense updates
        ws.send(JSON.stringify({
          event: 'subscribeToExpenses',
          data: { userId: user?.id }
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleRealTimeUpdate(data);
      };

      ws.onclose = () => {
        // Reconnect logic
        setTimeout(setupWebSocket, 5000);
      };

      return () => ws.close();
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
      // Fallback to polling or show error
    }
  };

  const handleRealTimeUpdate = (data: any) => {
    switch (data.event) {
      case 'expenseCreated':
        setExpenses(prev => [data.data.expense, ...prev]);
        addNotification({
          title: 'New Expense Added',
          message: `Expense of IDR ${data.data.expense.amount.toLocaleString()} added`,
          type: 'success',
        });
        break;
      case 'budgetThreshold':
        addNotification({
          title: 'Budget Alert',
          message: data.data.message,
          type: data.data.level === 'critical' ? 'error' : 'warning',
        });
        break;
      case 'transactionSynced':
        addNotification({
          title: 'Transaction Synced',
          message: `Transaction from ${data.data.transaction.merchant || data.data.transaction.source} synced`,
          type: 'info',
        });
        loadExpenses(); // Refresh expenses
        break;
    }
  };

  const loadExpenses = async () => {
    try {
      const response = await fetch(`/api/expenses?userId=${user?.id}&${new URLSearchParams(filters)}`);
      const data = await response.json();
      setExpenses(data.expenses || []);
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to load expenses',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/expenses/analytics?userId=${user?.id}&period=month`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.category || !expenseForm.description) {
      addNotification({
        title: 'Validation Error',
        message: 'Please fill in all required fields',
        type: 'error',
      });
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(expenseForm).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          formData.append(key, value);
        }
      });
      formData.append('userId', user?.id || '');

      const response = await fetch('/api/expenses', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setShowAddExpense(false);
        setExpenseForm({
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: '',
          merchant: '',
          location: '',
          tags: '',
          receiptImage: null,
        });
        loadExpenses();
        loadAnalytics();
      }
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to add expense',
        type: 'error',
      });
    }
  };

  const handleSyncTransaction = async () => {
    try {
      const response = await fetch('/api/expenses/sync-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...syncForm,
          userId: user?.id,
          amount: parseFloat(syncForm.amount),
        }),
      });

      if (response.ok) {
        setShowSyncDialog(false);
        setSyncForm({
          source: '',
          externalId: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          merchant: '',
          location: '',
          description: '',
        });
        loadExpenses();
      }
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to sync transaction',
        type: 'error',
      });
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return expenseCategories.find(cat => cat.id === categoryId) || expenseCategories[5];
  };

  const filteredExpenses = expenses.filter(expense => {
    if (filters.search && !expense.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.category && expense.category !== filters.category) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Smart Expense Tracking</h1>
              <p className="text-blue-100">AI-powered expense management with real-time insights</p>
            </div>
            <div className="flex gap-3">
              <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="bg-white/20 hover:bg-white/30">
                    <QrCode className="mr-2 h-4 w-4" />
                    Sync Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Sync External Transaction</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Source</Label>
                      <Select value={syncForm.source} onValueChange={(value) => setSyncForm(prev => ({ ...prev, source: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="qris">QRIS</SelectItem>
                          <SelectItem value="debit_card">Debit Card</SelectItem>
                          <SelectItem value="credit_card">Credit Card</SelectItem>
                          <SelectItem value="e_wallet">E-Wallet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={syncForm.amount}
                        onChange={(e) => setSyncForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={syncForm.date}
                        onChange={(e) => setSyncForm(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Merchant</Label>
                      <Input
                        value={syncForm.merchant}
                        onChange={(e) => setSyncForm(prev => ({ ...prev, merchant: e.target.value }))}
                        placeholder="Merchant name"
                      />
                    </div>
                    <Button onClick={handleSyncTransaction} className="w-full">
                      Sync Transaction
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-blue-600 hover:bg-blue-50">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Amount *</Label>
                      <Input
                        type="number"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Category *</Label>
                      <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.icon} {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Description *</Label>
                      <Textarea
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="What did you spend on?"
                      />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Payment Method</Label>
                      <Select value={expenseForm.paymentMethod} onValueChange={(value) => setExpenseForm(prev => ({ ...prev, paymentMethod: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map(method => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Merchant</Label>
                      <Input
                        value={expenseForm.merchant}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, merchant: e.target.value }))}
                        placeholder="Store/merchant name"
                      />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input
                        value={expenseForm.location}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Where was this expense?"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Tags</Label>
                      <Input
                        value={expenseForm.tags}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="business, personal, emergency (comma separated)"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Receipt Image</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, receiptImage: e.target.files?.[0] || null }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={() => setShowAddExpense(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddExpense}>
                      <Brain className="mr-2 h-4 w-4" />
                      Add Expense
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold">IDR {analytics.totalSpent?.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-2xl font-bold">{analytics.transactionCount}</p>
                  </div>
                  <Receipt className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Transaction</p>
                    <p className="text-2xl font-bold">IDR {analytics.averageTransaction?.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">AI Confidence</p>
                    <p className="text-2xl font-bold">94%</p>
                  </div>
                  <Brain className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <Input
                  placeholder="Search expenses..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full"
                />
              </div>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {expenseCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={loadExpenses} variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Recent Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading expenses...</div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No expenses found</p>
                <Button onClick={() => setShowAddExpense(true)} className="mt-4">
                  Add Your First Expense
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExpenses.map((expense) => {
                  const categoryInfo = getCategoryInfo(expense.category);
                  return (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-lg bg-gradient-to-br text-white",
                          categoryInfo.color
                        )}>
                          <span className="text-lg">{categoryInfo.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{expense.description}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(expense.date).toLocaleDateString()}
                            </span>
                            {expense.merchant && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {expense.merchant}
                              </span>
                            )}
                            {expense.mlConfidence && (
                              <Badge variant="secondary" className="text-xs">
                                <Brain className="h-3 w-3 mr-1" />
                                AI: {Math.round(expense.mlConfidence * 100)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg">IDR {expense.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600 capitalize">{expense.paymentMethod.replace('_', ' ')}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}