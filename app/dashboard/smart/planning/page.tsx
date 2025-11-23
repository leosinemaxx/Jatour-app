"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Hotel, MapPin, Navigation, Wallet, Plus, Sparkles, Search, Calendar,
  Save, Trash2, Edit, Star, ShieldCheck, Clock, Tag, Filter,
  Brain, TrendingUp, TrendingDown, Award, Users, Building2, Heart, Leaf, RefreshCw,
  AlertTriangle, CheckCircle2, XCircle, RotateCcw, Lock, Unlock, Settings,
  DollarSign, CreditCard, Smartphone, Banknote, Receipt, Target, CheckSquare,
  PlayCircle, PauseCircle, X, MoreVertical, Activity, Clock3, MapPin as LocationIcon,
  PiggyBank, TrendingUp as TrendingUpIcon, Receipt as ReceiptIcon, QrCode,
  Banknote as CashIcon, Loader2, ExternalLink, Zap, Target as TargetIcon
} from "lucide-react";
import { useSmartItinerary } from "@/lib/contexts/SmartItineraryContext";
import { useUnifiedPlanning } from "@/lib/contexts/UnifiedPlanningContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import NavbarDash from "@/app/components/navbar-dash";
import { useNotification } from "@/lib/components/NotificationProvider";
import { useDestinations } from "@/lib/hooks/useDestinations";
import { useAccommodations } from "@/lib/hooks/useAccommodations";

export default function UnifiedPlanningPage() {
  const router = useRouter();
  const { addNotification } = useNotification();
  const { preferences } = useSmartItinerary();
  const {
    state: planningState,
    addDestination,
    removeDestination,
    addActivity,
    setAccommodation,
    setTransportation,
    setBudget,
    addExpense,
    connectPaymentMethod,
    syncTransactions,
    completeStep,
    setCurrentStep,
    addPlanningTask,
    updatePlanningTask,
    validatePlanning,
    generateRecommendations,
    optimizePlanning,
    savePlanning
  } = useUnifiedPlanning();

  const [activeSection, setActiveSection] = useState<'itinerary' | 'budget' | 'payment'>('itinerary');
  const [showAddDestination, setShowAddDestination] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showTaskManager, setShowTaskManager] = useState(false);
  const [newDestination, setNewDestination] = useState({
    name: '',
    location: '',
    category: 'attraction',
    estimatedCost: 0
  });
  const [newActivity, setNewActivity] = useState<{
    name: string;
    destinationId: string;
    scheduledTime: string;
    duration: number;
    cost: number;
    category: string;
    priority: 'low' | 'medium' | 'high';
  }>({
    name: '',
    destinationId: '',
    scheduledTime: '09:00',
    duration: 120,
    cost: 0,
    category: 'activity',
    priority: 'medium'
  });
  const [newExpense, setNewExpense] = useState({
    amount: 0,
    category: 'food',
    description: '',
    paymentMethod: 'cash'
  });
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    category: 'itinerary' | 'budget' | 'payment';
    priority: 'low' | 'medium' | 'high';
  }>({
    title: '',
    description: '',
    category: 'itinerary',
    priority: 'medium'
  });

  // Use existing hooks for data integration
  const { destinations: availableDestinations, isLoading: destinationsLoading } = useDestinations();
  const { accommodations: availableAccommodations, loading: accommodationsLoading } = useAccommodations(
    preferences.cities[0],
    'moderate'
  );

  // Handle hash-based navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      if (['itinerary', 'budget', 'payment'].includes(hash)) {
        setActiveSection(hash as 'itinerary' | 'budget' | 'payment');
      }
    }
  }, []);

  // Planning steps configuration
  const planningSteps = [
    { id: 'destinations', label: 'Destination Selection', icon: MapPin, section: 'itinerary' },
    { id: 'activities', label: 'Activity Scheduling', icon: Calendar, section: 'itinerary' },
    { id: 'accommodation', label: 'Accommodation Booking', icon: Hotel, section: 'itinerary' },
    { id: 'transportation', label: 'Transportation', icon: Navigation, section: 'itinerary' },
    { id: 'budget', label: 'Budget Planning', icon: Wallet, section: 'budget' },
    { id: 'expenses', label: 'Expense Tracking', icon: Receipt, section: 'budget' },
    { id: 'payment', label: 'Payment Integration', icon: CreditCard, section: 'payment' }
  ];

  // Calculate planning progress
  const calculateProgress = () => {
    const totalSteps = planningSteps.length;
    const completedSteps = planningState.completedSteps.length;
    return (completedSteps / totalSteps) * 100;
  };

  // Navigation between sections
  const navigateToSection = (section: 'itinerary' | 'budget' | 'payment') => {
    setActiveSection(section);
  };

  // Handle adding destination
  const handleAddDestination = () => {
    if (newDestination.name && newDestination.location) {
      addDestination({
        name: newDestination.name,
        location: newDestination.location,
        category: newDestination.category,
        estimatedCost: newDestination.estimatedCost,
        duration: 180,
        rating: 4.0
      });
      setNewDestination({ name: '', location: '', category: 'attraction', estimatedCost: 0 });
      setShowAddDestination(false);
      completeStep('destinations');
      addNotification({
        type: 'success',
        title: 'Destination Added',
        message: `${newDestination.name} has been added to your itinerary.`
      });
    }
  };

  // Handle adding activity
  const handleAddActivity = () => {
    if (newActivity.name && newActivity.destinationId) {
      addActivity(newActivity);
      setNewActivity({
        name: '',
        destinationId: '',
        scheduledTime: '09:00',
        duration: 120,
        cost: 0,
        category: 'activity',
        priority: 'medium'
      });
      setShowAddActivity(false);
      completeStep('activities');
      addNotification({
        type: 'success',
        title: 'Activity Added',
        message: `${newActivity.name} has been scheduled.`
      });
    }
  };

  // Handle adding expense
  const handleAddExpense = () => {
    if (newExpense.amount > 0 && newExpense.description) {
      addExpense({
        ...newExpense,
        date: new Date().toISOString()
      });
      setNewExpense({ amount: 0, category: 'food', description: '', paymentMethod: 'cash' });
      setShowAddExpense(false);
      completeStep('expenses');
      addNotification({
        type: 'success',
        title: 'Expense Added',
        message: `IDR ${newExpense.amount.toLocaleString()} expense recorded.`
      });
    }
  };

  // Handle adding planning task
  const handleAddTask = () => {
    if (newTask.title) {
      addPlanningTask({
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        priority: newTask.priority,
        status: 'pending'
      });
      setNewTask({ title: '', description: '', category: 'itinerary', priority: 'medium' });
      setShowTaskManager(false);
      addNotification({
        type: 'success',
        title: 'Task Added',
        message: `${newTask.title} has been added to your planning tasks.`
      });
    }
  };

  // Handle payment method connection
  const handleConnectPayment = async (methodId: string) => {
    try {
      await connectPaymentMethod(methodId);
      addNotification({
        type: 'success',
        title: 'Payment Method Connected',
        message: `${methodId.toUpperCase()} has been connected successfully.`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: `Failed to connect ${methodId.toUpperCase()}. Please try again.`
      });
    }
  };

  // Handle transaction sync
  const handleSyncTransactions = async () => {
    try {
      await syncTransactions();
      addNotification({
        type: 'success',
        title: 'Transactions Synced',
        message: 'Your transactions have been synchronized successfully.'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Sync Failed',
        message: 'Failed to sync transactions. Please try again.'
      });
    }
  };

  // Handle ML operations
  const handleValidatePlanning = async () => {
    try {
      await validatePlanning();
      addNotification({
        type: 'success',
        title: 'Planning Validated',
        message: 'Your planning has been validated successfully.'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Validation Failed',
        message: 'Failed to validate planning. Please check your inputs.'
      });
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      await generateRecommendations();
      addNotification({
        type: 'success',
        title: 'Recommendations Generated',
        message: 'AI recommendations have been generated for your planning.'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate recommendations. Please try again.'
      });
    }
  };

  const handleOptimizePlanning = async () => {
    try {
      await optimizePlanning();
      addNotification({
        type: 'success',
        title: 'Planning Optimized',
        message: 'Your planning has been optimized using AI algorithms.'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Optimization Failed',
        message: 'Failed to optimize planning. Please try again.'
      });
    }
  };

  const handleSavePlanning = async () => {
    try {
      await savePlanning();
      addNotification({
        type: 'success',
        title: 'Planning Saved',
        message: 'Your planning has been saved successfully.'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save planning. Please try again.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarDash />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Unified Travel Planning</h1>
              <p className="text-gray-600">Plan your complete itinerary, budget, and payments in one place</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/dashboard/plan")}
                variant="outline"
                className="border-gray-300 hover:border-blue-500"
              >
                <Calendar className="h-4 w-4 mr-2" />
                View Plans
              </Button>
              <Button
                onClick={() => router.push("/dashboard/preferences")}
                className="bg-gradient-to-r from-green-500 to-blue-500 text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </Button>
            </div>
          </div>

          {/* Progress Overview */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Planning Progress</h3>
                <Badge variant="secondary" className="text-sm">
                  {planningState.completedSteps.length} of {planningSteps.length} steps completed
                </Badge>
              </div>
              <Progress value={calculateProgress()} className="h-3" />
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>0%</span>
                <span>{Math.round(calculateProgress())}% Complete</span>
                <span>100%</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Planning Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {planningSteps.map((step) => {
                  const isCompleted = planningState.completedSteps.includes(step.id);
                  const isActive = planningState.currentStep === step.id;

                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        setCurrentStep(step.id);
                        navigateToSection(step.section as any);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : isCompleted
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <step.icon className={`h-5 w-5 ${
                        isCompleted ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{step.label}</div>
                      </div>
                      {isCompleted && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {/* Itinerary Planning Section */}
              {activeSection === 'itinerary' && (
                <motion.div
                  key="itinerary"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        Itinerary Planning
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {planningState.destinations.length > 0 ? (
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium text-gray-900">Selected Destinations</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {planningState.destinations.map((dest) => (
                              <Card key={dest.id} className="border border-gray-200">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium text-gray-900">{dest.name}</h4>
                                      <p className="text-sm text-gray-600">{dest.location}</p>
                                      <p className="text-sm text-gray-500">Est. cost: IDR {dest.estimatedCost.toLocaleString()}</p>
                                    </div>
                                    <Button
                                      onClick={() => removeDestination(dest.id)}
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          <div className="flex gap-3 justify-center pt-4">
                            <Button
                              onClick={() => router.push("/dashboard/preferences/spots?from=planning")}
                              variant="outline"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add More Destinations
                            </Button>
                            <Button
                              onClick={() => setCurrentStep('activities')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Plan Activities →
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Destination Selection</h3>
                          <p className="text-gray-600 mb-6">Choose your destinations and plan your activities</p>
                          <Button
                            onClick={() => router.push("/dashboard/preferences/spots?from=planning")}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Destinations
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Budget Management Section */}
              {activeSection === 'budget' && (
                <motion.div
                  key="budget"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-green-600" />
                        Budget Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Smart Budget Planning</h3>
                        <p className="text-gray-600 mb-6">Set your budget and track expenses with AI optimization</p>
                        <Button
                          onClick={() => router.push("/dashboard/preferences/smart-budget")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Plan Budget
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Payment Integration Section */}
              {activeSection === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                        Payment Integration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Multi-Platform Payments</h3>
                        <p className="text-gray-600 mb-6">Connect your QRIS, banking, and e-wallet accounts</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {planningState.paymentMethods.map((method) => (
                            <Badge key={method.id} variant="outline" className="px-3 py-1">
                              {method.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Button
            onClick={() => router.push("/dashboard/insights")}
            variant="outline"
            className="px-8"
          >
            <Brain className="h-4 w-4 mr-2" />
            View Insights
          </Button>
          <Button
            onClick={() => router.push("/dashboard/plan")}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Itinerary
          </Button>
        </div>

        {/* Add Destination Modal */}
        <Dialog open={showAddDestination} onOpenChange={setShowAddDestination}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Destination</DialogTitle>
              <DialogDescription>
                Add a new destination to your travel itinerary
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Name
                </label>
                <Input
                  value={newDestination.name}
                  onChange={(e) => setNewDestination(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Borobudur Temple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <Input
                  value={newDestination.location}
                  onChange={(e) => setNewDestination(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Magelang, Central Java"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <Select
                  value={newDestination.category}
                  onValueChange={(value) => setNewDestination(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attraction">Attraction</SelectItem>
                    <SelectItem value="nature">Nature</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Cost (IDR)
                </label>
                <Input
                  type="number"
                  value={newDestination.estimatedCost}
                  onChange={(e) => setNewDestination(prev => ({ ...prev, estimatedCost: Number(e.target.value) }))}
                  placeholder="50000"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowAddDestination(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDestination} className="bg-blue-600 hover:bg-blue-700">
                  Add Destination
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Activity Modal */}
        <Dialog open={showAddActivity} onOpenChange={setShowAddActivity}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Activity</DialogTitle>
              <DialogDescription>
                Add an activity to your travel itinerary
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Name
                </label>
                <Input
                  value={newActivity.name}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Temple Visit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination
                </label>
                <Select
                  value={newActivity.destinationId}
                  onValueChange={(value) => setNewActivity(prev => ({ ...prev, destinationId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {planningState.destinations.map((dest) => (
                      <SelectItem key={dest.id} value={dest.id}>
                        {dest.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <Input
                    type="time"
                    value={newActivity.scheduledTime}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (min)
                  </label>
                  <Input
                    type="number"
                    value={newActivity.duration}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    placeholder="120"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost (IDR)
                  </label>
                  <Input
                    type="number"
                    value={newActivity.cost}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, cost: Number(e.target.value) }))}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <Select
                    value={newActivity.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high') => setNewActivity(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowAddActivity(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddActivity} className="bg-green-600 hover:bg-green-700">
                  Add Activity
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Expense Modal */}
        <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Expense</DialogTitle>
              <DialogDescription>
                Track your spending to stay within budget
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Input
                  value={newExpense.description}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Lunch at local restaurant"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (IDR)
                  </label>
                  <Input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) => setNewExpense(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Food & Dining</SelectItem>
                      <SelectItem value="transportation">Transportation</SelectItem>
                      <SelectItem value="accommodation">Accommodation</SelectItem>
                      <SelectItem value="activities">Activities</SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                      <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <Select
                  value={newExpense.paymentMethod}
                  onValueChange={(value) => setNewExpense(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="qris">QRIS</SelectItem>
                    <SelectItem value="bca">BCA</SelectItem>
                    <SelectItem value="mandiri">Mandiri</SelectItem>
                    <SelectItem value="gopay">GoPay</SelectItem>
                    <SelectItem value="ovo">OVO</SelectItem>
                    <SelectItem value="dana">DANA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowAddExpense(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddExpense} className="bg-orange-600 hover:bg-orange-700">
                  Record Expense
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Task Manager Modal */}
        <Dialog open={showTaskManager} onOpenChange={setShowTaskManager}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Planning Tasks</DialogTitle>
              <DialogDescription>
                Manage your travel planning tasks and track progress
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Add New Task */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add New Task</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Title
                    </label>
                    <Input
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Book hotel for Day 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <Textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Task details..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <Select
                        value={newTask.category}
                        onValueChange={(value: 'itinerary' | 'budget' | 'payment') => setNewTask(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="itinerary">Itinerary</SelectItem>
                          <SelectItem value="budget">Budget</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <Select
                        value={newTask.priority}
                        onValueChange={(value: 'low' | 'medium' | 'high') => setNewTask(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleAddTask} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Tasks */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Your Tasks</h3>
                {planningState.planningTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No tasks yet. Add your first planning task above.
                  </div>
                ) : (
                  planningState.planningTasks.map((task) => (
                    <Card key={task.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                task.status === 'completed' ? 'bg-green-500' :
                                task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                              }`}></div>
                              <div>
                                <h4 className="font-medium text-gray-900">{task.title}</h4>
                                {task.description && (
                                  <p className="text-sm text-gray-600">{task.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {task.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {task.category}
                            </Badge>
                            <Button
                              onClick={() => updatePlanningTask(task.id, {
                                status: task.status === 'completed' ? 'pending' : 'completed'
                              })}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              {task.status === 'completed' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <PlayCircle className="h-4 w-4 text-blue-600" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}