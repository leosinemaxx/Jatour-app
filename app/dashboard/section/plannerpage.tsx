"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, DollarSign, TrendingUp, Route, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/contexts/AuthContext";

interface Destination {
  id: string;
  name: string;
  city: string;
  category: string;
  image: string;
  rating: number;
  coordinates: { lat: number; lng: number };
  priceRange?: string;
  recommendationScore?: number;
}

interface BudgetBreakdown {
  estimated: {
    accommodation: number;
    food: number;
    transport: number;
    activities: number;
    miscellaneous: number;
  };
  totalEstimated: number;
  days: number;
}

export default function PlannerPage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(false);
  const [budgetBreakdown, setBudgetBreakdown] = useState<BudgetBreakdown | null>(null);
  const [filters, setFilters] = useState({
    budget: "",
    days: "",
    city: "",
    interests: [] as string[],
  });

  const categories = ["Beach", "Mountain", "Temple", "Nature", "Park", "Museum"];

  useEffect(() => {
    if (user?.id) {
      loadRecommendations();
    }
  }, [user, filters]);

  const loadRecommendations = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await apiClient.getRecommendations(user.id, {
        budget: filters.budget ? parseFloat(filters.budget) : undefined,
        days: filters.days ? parseInt(filters.days) : undefined,
        interests: filters.interests.length > 0 ? filters.interests : undefined,
        city: filters.city || undefined,
      });
      setRecommendations(response.data || []);
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      interests: prev.interests.includes(category)
        ? prev.interests.filter((c) => c !== category)
        : [...prev.interests, category],
    }));
  };

  const calculateBudget = async () => {
    // This would typically use an existing itinerary ID
    // For demo, we'll show estimated breakdown
    if (!filters.days) return;

    const days = parseInt(filters.days);
    const estimated: BudgetBreakdown["estimated"] = {
      accommodation: days * 300000,
      food: days * 150000,
      transport: 500000,
      activities: recommendations.length * 100000,
      miscellaneous: days * 50000,
    };

    setBudgetBreakdown({
      estimated,
      totalEstimated: Object.values(estimated).reduce((sum, cost) => sum + cost, 0),
      days,
    });
  };

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Smart Travel Planner</h1>
        <p className="text-muted-foreground">
          Plan your perfect trip to Jawa Timur with AI-powered recommendations
        </p>
      </div>

      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="budget">Budget Planner</TabsTrigger>
          <TabsTrigger value="route">Route Optimizer</TabsTrigger>
        </TabsList>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter Preferences</CardTitle>
              <CardDescription>Customize your travel recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Budget (IDR)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g., 5000000"
                    value={filters.budget}
                    onChange={(e) => setFilters({ ...filters, budget: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="days">Number of Days</Label>
                  <Input
                    id="days"
                    type="number"
                    placeholder="e.g., 3"
                    value={filters.days}
                    onChange={(e) => setFilters({ ...filters, days: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g., Surabaya, Malang, Banyuwangi"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Interests</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant={filters.interests.includes(cat) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleInterest(cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={loadRecommendations} className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Get Recommendations
              </Button>
            </CardContent>
          </Card>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((dest) => (
                <Card key={dest.id} className="overflow-hidden">
                  <div className="relative h-48">
                    <Image
                      src={dest.image || "/destinations/main-bg.webp"}
                      alt={dest.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      loading="lazy"
                    />
                    {dest.recommendationScore && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
                        Score: {dest.recommendationScore.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{dest.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {dest.city}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{dest.category}</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {dest.rating.toFixed(1)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No recommendations yet. Adjust your filters and click "Get Recommendations"
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Budget Planner Tab */}
        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Calculator</CardTitle>
              <CardDescription>Estimate your travel expenses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="budget-days">Number of Days</Label>
                <Input
                  id="budget-days"
                  type="number"
                  placeholder="e.g., 3"
                  value={filters.days}
                  onChange={(e) => setFilters({ ...filters, days: e.target.value })}
                />
              </div>
              <Button onClick={calculateBudget} className="w-full">
                <DollarSign className="mr-2 h-4 w-4" />
                Calculate Budget
              </Button>
            </CardContent>
          </Card>

          {budgetBreakdown && (
            <Card>
              <CardHeader>
                <CardTitle>Budget Breakdown</CardTitle>
                <CardDescription>
                  Estimated costs for {budgetBreakdown.days} days
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Accommodation</span>
                  <span className="font-semibold">
                    {formatCurrency(budgetBreakdown.estimated.accommodation)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Food & Drinks</span>
                  <span className="font-semibold">
                    {formatCurrency(budgetBreakdown.estimated.food)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Transportation</span>
                  <span className="font-semibold">
                    {formatCurrency(budgetBreakdown.estimated.transport)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Activities</span>
                  <span className="font-semibold">
                    {formatCurrency(budgetBreakdown.estimated.activities)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Miscellaneous</span>
                  <span className="font-semibold">
                    {formatCurrency(budgetBreakdown.estimated.miscellaneous)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total Estimated</span>
                  <span className="text-primary">
                    {formatCurrency(budgetBreakdown.totalEstimated)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Route Optimizer Tab */}
        <TabsContent value="route" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Route Optimizer</CardTitle>
              <CardDescription>
                Optimize your travel route for the best experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Select destinations from recommendations and we'll calculate the optimal route
                for you. OpenStreetMap integration is available!
              </p>
              <Button className="mt-4 w-full" disabled>
                <Route className="mr-2 h-4 w-4" />
                Optimize Route (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

