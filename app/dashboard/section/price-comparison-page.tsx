"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Hotel,
  Car,
  Utensils,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Filter,
  TrendingDown,
  Award,
  CheckCircle
} from "lucide-react";
import Image from "next/image";

interface HotelResult {
  id: string;
  name: string;
  provider: 'Agoda' | 'Booking.com' | 'Mock';
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  image: string;
  address: string;
  amenities: string[];
  roomType: string;
  cancellationPolicy: string;
  breakfastIncluded: boolean;
  distanceFromCenter?: number;
  bookingUrl?: string;
  score: number;
}

interface TransportationResult {
  id: string;
  provider: 'Gojek' | 'Grab' | 'Bluebird' | 'Traveloka' | 'RedBus' | 'Mock';
  type: 'ride-hail' | 'taxi' | 'bus' | 'train' | 'plane';
  price: number;
  currency: string;
  duration: string;
  distance: number;
  vehicleType?: string;
  schedule?: string[];
  bookingUrl?: string;
  score: number;
}

interface DiningResult {
  id: string;
  name: string;
  provider: 'Restaurant' | 'Mock';
  cuisine: string;
  priceRange: 'budget' | 'moderate' | 'premium';
  averagePrice: number;
  currency: string;
  rating: number;
  reviewCount: number;
  image: string;
  address: string;
  phone?: string;
  website?: string;
  specialties: string[];
  features: string[];
  operatingHours: { [key: string]: string };
  reservationRequired: boolean;
  bookingUrl?: string;
  score: number;
}

export default function PriceComparisonPage() {
  const [activeTab, setActiveTab] = useState("hotels");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // Hotel search state
  const [hotelSearch, setHotelSearch] = useState({
    location: "",
    checkInDate: "",
    checkOutDate: "",
    guests: 1,
    budget: ""
  });

  // Transportation search state
  const [transportSearch, setTransportSearch] = useState({
    from: "",
    to: "",
    date: "",
    passengers: 1,
    vehicleType: "",
    budget: ""
  });

  // Dining search state
  const [diningSearch, setDiningSearch] = useState({
    location: "",
    cuisine: "",
    priceRange: "",
    guests: 1,
    budget: ""
  });

  const handleHotelSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        location: hotelSearch.location,
        checkInDate: hotelSearch.checkInDate,
        checkOutDate: hotelSearch.checkOutDate,
        guests: hotelSearch.guests.toString(),
        ...(hotelSearch.budget && { budget: hotelSearch.budget })
      });

      const response = await fetch(`/api/price-comparison/hotels?${params}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Hotel search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransportSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: transportSearch.from,
        to: transportSearch.to,
        ...(transportSearch.date && { date: transportSearch.date }),
        passengers: transportSearch.passengers.toString(),
        ...(transportSearch.vehicleType && { vehicleType: transportSearch.vehicleType }),
        ...(transportSearch.budget && { budget: transportSearch.budget })
      });

      const response = await fetch(`/api/price-comparison/transportation?${params}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Transportation search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiningSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        location: diningSearch.location,
        ...(diningSearch.cuisine && { cuisine: diningSearch.cuisine }),
        ...(diningSearch.priceRange && { priceRange: diningSearch.priceRange }),
        guests: diningSearch.guests.toString(),
        ...(diningSearch.budget && { budget: diningSearch.budget })
      });

      const response = await fetch(`/api/price-comparison/dining?${params}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Dining search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHotelResults = (hotels: HotelResult[]) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {hotels.map((hotel, index) => (
        <motion.div
          key={hotel.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48">
              <Image
                src={hotel.image}
                alt={hotel.name}
                fill
                className="object-cover"
              />
              <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-sm font-medium">
                {hotel.provider}
              </div>
              <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-medium">{hotel.rating}</span>
                <span className="text-sm">({hotel.reviewCount})</span>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{hotel.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {hotel.address}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      {hotel.currency} {hotel.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">per night</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Score</div>
                    <div className="font-bold text-lg">{hotel.score}/100</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm"><strong>Room:</strong> {hotel.roomType}</p>
                  <p className="text-sm"><strong>Amenities:</strong> {hotel.amenities.slice(0, 3).join(", ")}</p>
                  {hotel.breakfastIncluded && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="h-3 w-3" />
                      Breakfast included
                    </div>
                  )}
                </div>

                <Button className="w-full bg-blue-500 hover:bg-blue-600">
                  Book Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  const renderTransportResults = (transports: TransportationResult[]) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {transports.map((transport, index) => (
        <motion.div
          key={transport.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      transport.provider === 'Gojek' ? 'bg-green-100 text-green-800' :
                      transport.provider === 'Grab' ? 'bg-blue-100 text-blue-800' :
                      transport.provider === 'Bluebird' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transport.provider}
                    </div>
                    <Badge variant="outline">{transport.type}</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {transport.vehicleType || transport.type}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {transport.currency} {transport.price.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Score: {transport.score}/100</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{transport.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{transport.distance} km</span>
                  </div>
                </div>

                {transport.schedule && transport.schedule.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Schedule:</p>
                    <div className="flex flex-wrap gap-1">
                      {transport.schedule.slice(0, 3).map(time => (
                        <Badge key={time} variant="outline" className="text-xs">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button className="w-full bg-green-500 hover:bg-green-600">
                  Book Ride
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  const renderDiningResults = (restaurants: DiningResult[]) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {restaurants.map((restaurant, index) => (
        <motion.div
          key={restaurant.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48">
              <Image
                src={restaurant.image}
                alt={restaurant.name}
                fill
                className="object-cover"
              />
              <div className="absolute top-3 right-3 bg-orange-500 text-white px-2 py-1 rounded-full text-sm font-medium">
                {restaurant.priceRange}
              </div>
              <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-medium">{restaurant.rating}</span>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{restaurant.name}</h3>
                  <p className="text-sm text-orange-600 font-medium">{restaurant.cuisine}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {restaurant.address}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      {restaurant.currency} {restaurant.averagePrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">per person</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Score</div>
                    <div className="font-bold text-lg">{restaurant.score}/100</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm"><strong>Specialties:</strong> {restaurant.specialties.slice(0, 2).join(", ")}</p>
                  <p className="text-sm"><strong>Features:</strong> {restaurant.features.slice(0, 2).join(", ")}</p>
                </div>

                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                  {restaurant.reservationRequired ? 'Make Reservation' : 'View Menu'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <TrendingDown className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                Price Comparison
              </h1>
              <p className="text-blue-100 text-sm sm:text-base">
                Compare prices across multiple providers for hotels, transportation, and dining
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hotels" className="flex items-center gap-2">
            <Hotel className="h-4 w-4" />
            Hotels
          </TabsTrigger>
          <TabsTrigger value="transportation" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Transportation
          </TabsTrigger>
          <TabsTrigger value="dining" className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Dining
          </TabsTrigger>
        </TabsList>

        {/* Hotels Tab */}
        <TabsContent value="hotels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hotel className="h-5 w-5" />
                Hotel Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="hotel-location">Location</Label>
                  <Input
                    id="hotel-location"
                    placeholder="e.g., Surabaya"
                    value={hotelSearch.location}
                    onChange={(e) => setHotelSearch({...hotelSearch, location: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="check-in">Check-in Date</Label>
                  <Input
                    id="check-in"
                    type="date"
                    value={hotelSearch.checkInDate}
                    onChange={(e) => setHotelSearch({...hotelSearch, checkInDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="check-out">Check-out Date</Label>
                  <Input
                    id="check-out"
                    type="date"
                    value={hotelSearch.checkOutDate}
                    onChange={(e) => setHotelSearch({...hotelSearch, checkOutDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="guests">Guests</Label>
                  <Select value={hotelSearch.guests.toString()} onValueChange={(value) => setHotelSearch({...hotelSearch, guests: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num} guest{num > 1 ? 's' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="hotel-budget">Budget (optional)</Label>
                  <Input
                    id="hotel-budget"
                    placeholder="Max price per night"
                    value={hotelSearch.budget}
                    onChange={(e) => setHotelSearch({...hotelSearch, budget: e.target.value})}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleHotelSearch} disabled={loading} className="px-8">
                    {loading ? 'Searching...' : 'Compare Hotels'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {results.length > 0 && renderHotelResults(results)}
        </TabsContent>

        {/* Transportation Tab */}
        <TabsContent value="transportation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Transportation Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="from">From</Label>
                  <Input
                    id="from"
                    placeholder="Departure city"
                    value={transportSearch.from}
                    onChange={(e) => setTransportSearch({...transportSearch, from: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="to">To</Label>
                  <Input
                    id="to"
                    placeholder="Destination city"
                    value={transportSearch.to}
                    onChange={(e) => setTransportSearch({...transportSearch, to: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="travel-date">Date (optional)</Label>
                  <Input
                    id="travel-date"
                    type="date"
                    value={transportSearch.date}
                    onChange={(e) => setTransportSearch({...transportSearch, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="vehicle-type">Vehicle Type</Label>
                  <Select value={transportSearch.vehicleType} onValueChange={(value) => setTransportSearch({...transportSearch, vehicleType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="taxi">Taxi</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="transport-budget">Budget (optional)</Label>
                  <Input
                    id="transport-budget"
                    placeholder="Max price"
                    value={transportSearch.budget}
                    onChange={(e) => setTransportSearch({...transportSearch, budget: e.target.value})}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleTransportSearch} disabled={loading} className="px-8">
                    {loading ? 'Searching...' : 'Compare Transportation'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {results.length > 0 && renderTransportResults(results)}
        </TabsContent>

        {/* Dining Tab */}
        <TabsContent value="dining" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Dining Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="dining-location">Location</Label>
                  <Input
                    id="dining-location"
                    placeholder="e.g., Surabaya"
                    value={diningSearch.location}
                    onChange={(e) => setDiningSearch({...diningSearch, location: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="cuisine">Cuisine</Label>
                  <Input
                    id="cuisine"
                    placeholder="e.g., Indonesian, Italian"
                    value={diningSearch.cuisine}
                    onChange={(e) => setDiningSearch({...diningSearch, cuisine: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="price-range">Price Range</Label>
                  <Select value={diningSearch.priceRange} onValueChange={(value) => setDiningSearch({...diningSearch, priceRange: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dining-guests">Guests</Label>
                  <Select value={diningSearch.guests.toString()} onValueChange={(value) => setDiningSearch({...diningSearch, guests: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,8,10].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num} guest{num > 1 ? 's' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="dining-budget">Budget per person (optional)</Label>
                  <Input
                    id="dining-budget"
                    placeholder="Max price per person"
                    value={diningSearch.budget}
                    onChange={(e) => setDiningSearch({...diningSearch, budget: e.target.value})}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleDiningSearch} disabled={loading} className="px-8">
                    {loading ? 'Searching...' : 'Compare Dining'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {results.length > 0 && renderDiningResults(results)}
        </TabsContent>
      </Tabs>

      {/* No Results */}
      {results.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Start comparing prices
                </h3>
                <p className="text-sm text-gray-600">
                  Fill in the search criteria above to find the best deals across multiple providers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}