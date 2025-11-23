"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  UtensilsCrossed, 
  MapPin, 
  Star, 
  Clock, 
  DollarSign, 
  Users, 
  Phone, 
  Globe,
  Heart,
  Share2,
  Filter,
  Search,
  ChefHat,
  Coffee,
  IceCream,
  Wine,
  Flame,
  Leaf,
  Award,
  Camera
} from "lucide-react";
import Image from "next/image";

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  priceRange: "Budget" | "Moderate" | "Premium";
  location: string;
  address: string;
  phone: string;
  website?: string;
  specialties: string[];
  operatingHours: {
    [key: string]: string;
  };
  features: string[];
  recommendation: "Must Try" | "Popular" | "Hidden Gem" | "Chef's Choice";
  price: {
    min: number;
    max: number;
  };
  popularDishes: {
    name: string;
    price: number;
    description: string;
    image: string;
  }[];
  images: string[];
}

const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "Warung Bu Rudi",
    cuisine: "Traditional Javanese",
    description: "Authentic Javanese cuisine dengan resep turun temurun dari nenek moyang.Menu signature: Sate Ayam Madura, Gado-gado Surabaya, dan Nasi Pecel.",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop",
    rating: 4.7,
    reviews: 234,
    priceRange: "Budget",
    location: "Surabaya",
    address: "Jl. Gubeng Kertajaya No. 15, Gubeng, Surabaya",
    phone: "+62 31 501 2345",
    website: "warungbududi.com",
    specialties: ["Sate Ayam Madura", "Gado-gado Surabaya", "Nasi Pecel"],
    operatingHours: {
      "Monday": "08:00 - 22:00",
      "Tuesday": "08:00 - 22:00",
      "Wednesday": "08:00 - 22:00",
      "Thursday": "08:00 - 22:00",
      "Friday": "08:00 - 23:00",
      "Saturday": "08:00 - 23:00",
      "Sunday": "09:00 - 21:00"
    },
    features: ["Outdoor Seating", "Family Friendly", "Parking Available"],
    recommendation: "Must Try",
    price: {
      min: 25000,
      max: 85000
    },
    popularDishes: [
      {
        name: "Sate Ayam Madura",
        price: 35000,
        description: "Sate lembut dengan bumbu kacang khas madura dan acar timun",
        image: "https://images.unsplash.com/photo-1568051243853-7070db9cf0f0?w=400&h=300&fit=crop"
      },
      {
        name: "Gado-gado Surabaya",
        price: 28000,
        description: "Racikan Sayuran Segar dengan bumbu kacang tradisional",
        image: "https://images.unsplash.com/photo-1625944529558-6bf1b65bf8e3?w=400&h=300&fit=crop"
      }
    ],
    images: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1568051243853-7070db9cf0f0?w=800&h=600&fit=crop"
    ]
  },
  {
    id: "2", 
    name: "Kedai Kopi Suroboyo",
    cuisine: "Coffee & Light Meals",
    description: "Third-wave coffee shop dengan roasting asli Surabaya. Menu signature: Kopi Single Origin Java, Manual Brew, dan Pastry artesanal khas daerah.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
    rating: 4.8,
    reviews: 189,
    priceRange: "Moderate",
    location: "Surabaya",
    address: "Jl. Tunjungan No. 77, Genteng, Surabaya",
    phone: "+62 31 532 7890",
    website: "kedaikopisby.com",
    specialties: ["Single Origin Java", "Manual Brew", "Artisan Pastry"],
    operatingHours: {
      "Monday": "07:00 - 23:00",
      "Tuesday": "07:00 - 23:00", 
      "Wednesday": "07:00 - 23:00",
      "Thursday": "07:00 - 23:00",
      "Friday": "07:00 - 24:00",
      "Saturday": "07:00 - 24:00",
      "Sunday": "08:00 - 22:00"
    },
    features: ["WiFi Free", "Co-working Space", "Live Music", "Rooftop View"],
    recommendation: "Popular",
    price: {
      min: 15000,
      max: 95000
    },
    popularDishes: [
      {
        name: "Java Single Origin",
        price: 25000,
        description: "Kopi single origin daridataran tinggi Jawa Timur dengan karakteristik sweet & floral",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop"
      },
      {
        name: "French Toast",
        price: 45000,
        description: "Roti panggang berlapis dengan syrup maple dan buah segar",
        image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop"
      }
    ],
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop"
    ]
  },
  {
    id: "3",
    name: "Rumah Bakso Malang",
    cuisine: "Traditional Indonesian",
    description: "Berdiri sejak 1978, rumah bakso legendaris Malang. Signature: Bakso Malang tamanhos dengan pangsit kukus dan rebus, plus kerupuk putih.",
    image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop",
    rating: 4.6,
    reviews: 312,
    priceRange: "Budget",
    location: "Malang",
    address: "Jl. Bandung No. 5, Malang",
    phone: "+62 341 567 890",
    specialties: ["Bakso Malang", "Pangsit Kukus", "Kerupuk Putih"],
    operatingHours: {
      "Monday": "09:00 - 21:00",
      "Tuesday": "09:00 - 21:00",
      "Wednesday": "09:00 - 21:00", 
      "Thursday": "09:00 - 21:00",
      "Friday": "09:00 - 22:00",
      "Saturday": "09:00 - 22:00",
      "Sunday": "10:00 - 21:00"
    },
    features: ["Family Heritage", "Traditional Recipe", "Affordable"],
    recommendation: "Must Try",
    price: {
      min: 18000,
      max: 45000
    },
    popularDishes: [
      {
        name: "Bakso Malang Sets",
        price: 28000,
        description: "Bakso Malang lengkap dengan pangsit, tahu, gorengan, dan kerupuk putih",
        image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop"
      },
      {
        name: "Bakso Urat",
        price: 22000,
        description: "Bakso dengan tekstur kenyal dan daging yang melimpah",
        image: "https://images.unsplash.com/photo-1579583765280-c7c139a3b4a0?w=400&h=300&fit=crop"
      }
    ],
    images: [
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop"
    ]
  },
  {
    id: "4",
    name: "Fine Dining Bromo",
    cuisine: "Contemporary Indonesian",
    description: "Restaurant fine dining dengan view langsung ke Gunung Bromo. Menu fusion Indonesia-Eropa dengan bahan lokal premium dan wine pairing.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop",
    rating: 4.9,
    reviews: 156,
    priceRange: "Premium",
    location: "Probolinggo",
    address: "Bromo Tourism Area, Probolinggo",
    phone: "+62 335 541 789",
    website: "finediningbromo.com",
    specialties: ["Fusion Menu", "Wine Pairing", "Mountain View"],
    operatingHours: {
      "Monday": "18:00 - 22:00",
      "Tuesday": "18:00 - 22:00",
      "Wednesday": "18:00 - 22:00",
      "Thursday": "18:00 - 22:00",
      "Friday": "18:00 - 23:00",
      "Saturday": "18:00 - 23:00",
      "Sunday": "18:00 - 22:00"
    },
    features: ["Mountain View", "Fine Dining", "Wine Cellar", "Private Chef"],
    recommendation: "Chef's Choice",
    price: {
      min: 350000,
      max: 800000
    },
    popularDishes: [
      {
        name: "Bromo Beef Tenderloin",
        price: 650000,
        description: "Daging tenderloin premium dengan rempah nusantara dan wine pairing",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop"
      },
      {
        name: "Traditional Tasting Menu",
        price: 450000,
        description: "7-course tasting menu dengan cita rasa tradisional Indonesia modern",
        image: "https://images.unsplash.com/photo-1556962175-8e69e4c6b5f4?w=400&h=300&fit=crop"
      }
    ],
    images: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop"
    ]
  }
];

const cuisineTypes = [
  { name: "Semua", value: "all" },
  { name: "Traditional Javanese", value: "Traditional Javanese" },
  { name: "Coffee & Light Meals", value: "Coffee & Light Meals" },
  { name: "Traditional Indonesian", value: "Traditional Indonesian" },
  { name: "Contemporary Indonesian", value: "Contemporary Indonesian" },
  { name: "International", value: "International" }
];

const priceRanges = [
  { name: "Semua", value: "all" },
  { name: "Budget", value: "Budget", icon: Coffee },
  { name: "Moderate", value: "Moderate", icon: UtensilsCrossed },
  { name: "Premium", value: "Premium", icon: Wine }
];

export default function KulinerPage() {
  const [selectedCuisine, setSelectedCuisine] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesCuisine = selectedCuisine === "all" || restaurant.cuisine === selectedCuisine;
    const matchesPriceRange = selectedPriceRange === "all" || restaurant.priceRange === selectedPriceRange;
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCuisine && matchesPriceRange && matchesSearch;
  });

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(f => f !== id)
        : [...prev, id]
    );
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case "Must Try":
        return <Badge className="bg-red-500 text-white"><Flame className="h-3 w-3 mr-1" />Must Try</Badge>;
      case "Popular":
        return <Badge className="bg-blue-500 text-white"><Users className="h-3 w-3 mr-1" />Popular</Badge>;
      case "Hidden Gem":
        return <Badge className="bg-purple-500 text-white"><Award className="h-3 w-3 mr-1" />Hidden Gem</Badge>;
      case "Chef's Choice":
        return <Badge className="bg-yellow-500 text-black"><ChefHat className="h-3 w-3 mr-1" />Chef's Choice</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <UtensilsCrossed className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                Kuliner Terbaik Jawa Timur
              </h1>
              <p className="text-green-100 text-sm sm:text-base">
                Jelajahi cita rasa autentik dari traditional hingga fine dining
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari restaurant, cuisine, atau dish favorit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 h-14 text-base rounded-2xl border-2 border-gray-200 focus:border-green-500 shadow-sm"
          />
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {/* Cuisine Filter */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Jenis Masakan</h3>
          <div className="flex flex-wrap gap-2">
            {cuisineTypes.map((cuisine) => (
              <Button
                key={cuisine.value}
                onClick={() => setSelectedCuisine(cuisine.value)}
                variant={selectedCuisine === cuisine.value ? "default" : "outline"}
                className={`rounded-2xl ${
                  selectedCuisine === cuisine.value 
                    ? "bg-green-500 text-white" 
                    : "hover:bg-green-50"
                }`}
                size="sm"
              >
                {cuisine.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Range Harga</h3>
          <div className="flex flex-wrap gap-2">
            {priceRanges.map((range) => (
              <Button
                key={range.name}
                onClick={() => setSelectedPriceRange(range.value)}
                variant={selectedPriceRange === range.value ? "default" : "outline"}
                className={`rounded-2xl ${
                  selectedPriceRange === range.value 
                    ? "bg-green-500 text-white" 
                    : "hover:bg-green-50"
                }`}
                size="sm"
              >
                {range.icon && <range.icon className="h-4 w-4 mr-1" />}
                {range.name}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Results Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between"
      >
        <p className="text-sm text-gray-600">
          Menampilkan <span className="font-semibold text-green-600">{filteredRestaurants.length}</span> restaurant
        </p>
        <Button variant="outline" size="sm" className="rounded-2xl">
          <Filter className="h-4 w-4 mr-2" />
          Filter Lanjutan
        </Button>
      </motion.div>

      {/* Restaurants Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRestaurants.map((restaurant, index) => (
          <motion.div
            key={restaurant.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all group">
              <div className="flex">
                {/* Image */}
                <div className="relative w-48 h-48 flex-shrink-0">
                  <Image
                    src={restaurant.image}
                    alt={restaurant.name}
                    fill
                    className="object-cover"
                    sizes="192px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
                  
                  {/* Recommendation Badge */}
                  <div className="absolute top-3 left-3">
                    {getRecommendationBadge(restaurant.recommendation)}
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(restaurant.id)}
                    className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                  >
                    <Heart 
                      className={`h-4 w-4 ${
                        favorites.includes(restaurant.id) 
                          ? "text-red-500 fill-current" 
                          : "text-gray-600"
                      }`} 
                    />
                  </button>
                </div>

                {/* Content */}
                <CardContent className="flex-1 p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                            {restaurant.name}
                          </h3>
                          <p className="text-sm text-green-600 font-medium">{restaurant.cuisine}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{restaurant.rating}</span>
                            <span className="text-xs text-gray-500">({restaurant.reviews})</span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              restaurant.priceRange === "Budget" ? "border-green-300 text-green-700" :
                              restaurant.priceRange === "Moderate" ? "border-yellow-300 text-yellow-700" :
                              "border-purple-300 text-purple-700"
                            }`}
                          >
                            {restaurant.priceRange}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {restaurant.description}
                    </p>

                    {/* Location & Contact */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span>{restaurant.address}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{restaurant.phone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{restaurant.operatingHours.Monday?.split(' - ')[0] || '09:00'} - {restaurant.operatingHours.Monday?.split(' - ')[1] || '21:00'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">
                        IDR {restaurant.price.min.toLocaleString('id-ID')} - {restaurant.price.max.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1">
                      {restaurant.specialties.slice(0, 3).map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>

                    {/* Popular Dishes */}
                    {restaurant.popularDishes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Menu Populer:</h4>
                        <div className="space-y-1">
                          {restaurant.popularDishes.slice(0, 2).map((dish) => (
                            <div key={dish.name} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{dish.name}</span>
                              <span className="text-green-600 font-medium">IDR {dish.price.toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl"
                        size="sm"
                      >
                        Reservasi
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="rounded-xl border-green-200 hover:bg-green-50"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="rounded-xl border-green-200 hover:bg-green-50"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {filteredRestaurants.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <UtensilsCrossed className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Tidak ada restaurant ditemukan
                </h3>
                <p className="text-sm text-gray-600">
                  Coba ubah filter atau kata kunci pencarian Anda
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <ChefHat className="h-8 w-8" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Rekomendasi Kuliner Personal</h3>
                <p className="text-orange-100 text-sm">
                  Dapatkan rekomendasi restaurant yang disesuaikan dengan selera dan budget Anda dari food expert JaTour
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50">
                  Konsultasi Gratis
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  Download Menu
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
