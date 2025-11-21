"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tag, 
  Percent, 
  Clock, 
  MapPin, 
  Plane, 
  Hotel, 
  UtensilsCrossed,
  Star,
  Users,
  Calendar,
  Sparkles,
  Gift,
  Zap,
  Heart,
  Bookmark
} from "lucide-react";
import Image from "next/image";

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: number;
  originalPrice: number;
  salePrice: number;
  category: string;
  validUntil: string;
  image: string;
  rating: number;
  reviews: number;
  tags: string[];
  featured?: boolean;
  limited?: boolean;
  flash?: boolean;
}

const promotions: Promotion[] = [
  {
    id: "1",
    title: "Liburan Akhir Tahun ke Mount Bromo",
    description: "Paket Lengkap 3 Hari 2 Malam termasuk homestay, meals, dan guide profesional",
    discount: 35,
    originalPrice: 1200000,
    salePrice: 780000,
    category: "Adventure",
    validUntil: "2024-12-31",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop",
    rating: 4.8,
    reviews: 156,
    tags: ["Popular", "Grup"],
    featured: true,
    limited: true
  },
  {
    id: "2",
    title: "Weekend Seru di Malang & Batu",
    description: "Eksplorasi kota Apel dengan paket all-include: hotel, tour guide, dan restaurant guide",
    discount: 28,
    originalPrice: 850000,
    salePrice: 612000,
    category: "City Tour",
    validUntil: "2024-12-15",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
    rating: 4.7,
    reviews: 89,
    tags: ["Weekend", "Budget"]
  },
  {
    id: "3",
    title: "Surabaya Heritage Walking Tour",
    description: "Jelajahi sejarah dan budaya Surabaya dengan guide ahli",
    discount: 22,
    originalPrice: 350000,
    salePrice: 273000,
    category: "Cultural",
    validUntil: "2024-12-20",
    image: "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=800&h=600&fit=crop",
    rating: 4.6,
    reviews: 134,
    tags: ["Heritage", "Walking"],
    flash: true
  },
  {
    id: "4",
    title: "Paket Gastronomi Surabaya",
    description: "Tour kuliner exclusivas dengan mencoba makanan khas terbaik Surabaya",
    discount: 40,
    originalPrice: 650000,
    salePrice: 390000,
    category: "Culinary",
    validUntil: "2024-12-10",
    image: "https://images.unsplash.com/photo-1563379091339-03246963dcd1?w=800&h=600&fit=crop",
    rating: 4.9,
    reviews: 203,
    tags: ["Food", "Experience"],
    featured: true,
    limited: true
  },
  {
    id: "5",
    title: "Adventure Park & Waterfall",
    description: "Serunya outdoor activities dan bermain air di alam terbuka",
    discount: 30,
    originalPrice: 450000,
    salePrice: 315000,
    category: "Adventure",
    validUntil: "2024-12-25",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop",
    rating: 4.5,
    reviews: 67,
    tags: ["Outdoor", "Family"]
  },
  {
    id: "6",
    title: "Temple Hopping East Java",
    description: "Kunjungi candi-candi bersejarah dan寺庙 dengan paket spiritual",
    discount: 25,
    originalPrice: 750000,
    salePrice: 562500,
    category: "Spiritual",
    validUntil: "2024-12-30",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
    rating: 4.7,
    reviews: 112,
    tags: ["Culture", "History"]
  }
];

const categories = [
  { name: "Semua", value: "all" },
  { name: "Adventure", value: "Adventure" },
  { name: "Cultural", value: "Cultural" },
  { name: "Culinary", value: "Culinary" },
  { name: "City Tour", value: "City Tour" },
  { name: "Spiritual", value: "Spiritual" }
];

export default function PromoPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bookmarked, setBookmarked] = useState<string[]>([]);

  const filteredPromotions = selectedCategory === "all" 
    ? promotions 
    : promotions.filter(promo => promo.category === selectedCategory);

  const toggleBookmark = (id: string) => {
    setBookmarked(prev => 
      prev.includes(id) 
        ? prev.filter(b => b !== id)
        : [...prev, id]
    );
  };

  const calculateDaysLeft = (validUntil: string) => {
    const today = new Date();
    const endDate = new Date(validUntil);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-red-500 text-white rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                Promo & Penawaran Khusus
              </h1>
              <p className="text-orange-100 text-sm sm:text-base">
                Dapatkan diskon hingga 40% untuk destinasi wisata terbaik di Jawa Timur
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Flash Sale Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-400 rounded-full animate-pulse">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-yellow-800">Flash Sale!</h3>
                  <p className="text-sm text-yellow-700">Hemat hingga 40% hanya hari ini</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">Berakhir dalam</p>
                <p className="text-sm font-mono text-red-600">02:15:30</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              variant={selectedCategory === category.value ? "default" : "outline"}
              className={`rounded-2xl ${
                selectedCategory === category.value 
                  ? "bg-orange-500 text-white" 
                  : "hover:bg-orange-50"
              }`}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPromotions.map((promo, index) => (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all group relative">
              {/* Promotion Badges */}
              <div className="absolute top-3 left-3 z-10 flex gap-2">
                {promo.featured && (
                  <Badge className="bg-red-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {promo.flash && (
                  <Badge className="bg-yellow-500 text-black animate-pulse">
                    <Zap className="h-3 w-3 mr-1" />
                    Flash
                  </Badge>
                )}
                {promo.limited && (
                  <Badge className="bg-green-500 text-white">
                    <Gift className="h-3 w-3 mr-1" />
                    Terbatas
                  </Badge>
                )}
              </div>

              {/* Bookmark Button */}
              <button
                onClick={() => toggleBookmark(promo.id)}
                className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
              >
                <Bookmark 
                  className={`h-4 w-4 ${
                    bookmarked.includes(promo.id) 
                      ? "text-yellow-500 fill-current" 
                      : "text-gray-600"
                  }`} 
                />
              </button>

              {/* Image */}
              <div className="relative h-48">
                <Image
                  src={promo.image}
                  alt={promo.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Discount Badge */}
                <div className="absolute bottom-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full font-bold">
                  -{promo.discount}%
                </div>
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Title & Rating */}
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {promo.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{promo.rating}</span>
                        <span className="text-xs text-gray-500">({promo.reviews} review)</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {promo.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {promo.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 line-through">
                        IDR {promo.originalPrice.toLocaleString('id-ID')}
                      </span>
                      <Badge className="bg-green-100 text-green-800">
                        Hemat IDR {(promo.originalPrice - promo.salePrice).toLocaleString('id-ID')}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      IDR {promo.salePrice.toLocaleString('id-ID')}
                      <span className="text-sm text-gray-500 font-normal">/person</span>
                    </div>
                  </div>

                  {/* Valid Until */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Berlaku hingga {calculateDaysLeft(promo.validUntil)} hari lagi</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                      size="sm"
                    >
                      Book Sekarang
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="rounded-xl border-orange-200 hover:bg-orange-50"
                    >
                      Detail
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <Heart className="h-8 w-8" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Tidak menemukan promo yang sesuai?</h3>
                <p className="text-blue-100 text-sm">
                  Hubungi tim customer service kami untuk penawaran khusus yang disesuaikan dengan kebutuhan Anda
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                  Chat WhatsApp
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  Custom Package
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
