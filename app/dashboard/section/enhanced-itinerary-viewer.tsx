"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Clock, 
  Navigation, 
  Hotel, 
  UtensilsCrossed,
  Camera,
  DollarSign,
  Calendar,
  Star,
  Info,
  X,
  ExternalLink,
  Phone,
  Globe,
  ArrowRight,
  CheckCircle,
  Users,
  Share2,
  Download,
  Trash2
} from "lucide-react";
import { useSmartItinerary } from "@/lib/contexts/SmartItineraryContext";
import { useDestinations } from "@/lib/hooks/useDestinations";
import type { Destination } from "@/app/datatypes";

interface SmartItinerary {
  id: string;
  title: string;
  cities: string[];
  days: number;
  budget: number;
  status: "active" | "planned" | "completed";
  preferences: {
    theme: string;
    style: string;
  };
  createdAt: string;
  daysPlan: {
    day: number;
    title: string;
    activities: {
      name: string;
      duration: string;
      cost: number;
      type: string;
    }[];
  }[];
}

interface EnhancedItineraryViewerProps {
  itineraries: SmartItinerary[];
  onDeleteItinerary?: (id: string) => void;
}

export default function EnhancedItineraryViewer({ itineraries, onDeleteItinerary }: EnhancedItineraryViewerProps) {
  const [selectedItinerary, setSelectedItinerary] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<number[]>([]);

  const toggleDayExpansion = (day: number) => {
    setExpandedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "planned":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-3 w-3" />;
      case "planned":
        return <Calendar className="h-3 w-3" />;
      case "completed":
        return <Star className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-4">
      {itineraries.map((itinerary, index) => (
        <motion.div
          key={itinerary.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-0">
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{itinerary.title}</h3>
                    <div className="flex items-center gap-4 text-blue-100 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{itinerary.cities.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{itinerary.days} days</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>IDR {itinerary.budget.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(itinerary.status)} border-0`}>
                      {getStatusIcon(itinerary.status)}
                      <span className="ml-1 capitalize">{itinerary.status}</span>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedItinerary(
                        selectedItinerary === itinerary.id ? null : itinerary.id
                      )}
                      className="text-white hover:bg-white/20"
                    >
                      {selectedItinerary === itinerary.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {selectedItinerary === itinerary.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-6">
                      {/* Budget Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4 text-center">
                            <Hotel className="h-6 w-6 text-green-600 mx-auto mb-2" />
                            <p className="text-xs text-green-700 mb-1">Accommodation</p>
                            <p className="text-sm font-bold text-green-900">
                              IDR {(itinerary.budget * 0.4).toLocaleString('id-ID')}
                            </p>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-4 text-center">
                            <Navigation className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                            <p className="text-xs text-blue-700 mb-1">Transportation</p>
                            <p className="text-sm font-bold text-blue-900">
                              IDR {(itinerary.budget * 0.3).toLocaleString('id-ID')}
                            </p>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-orange-50 border-orange-200">
                          <CardContent className="p-4 text-center">
                            <UtensilsCrossed className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                            <p className="text-xs text-orange-700 mb-1">Food & Others</p>
                            <p className="text-sm font-bold text-orange-900">
                              IDR {(itinerary.budget * 0.3).toLocaleString('id-ID')}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Daily Plan */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          Daily Itinerary
                        </h4>
                        
                        <div className="space-y-3">
                          {itinerary.daysPlan.map((dayPlan) => (
                            <Card key={dayPlan.day} className="border border-gray-200">
                              <CardContent className="p-0">
                                <button
                                  onClick={() => toggleDayExpansion(dayPlan.day)}
                                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                      {dayPlan.day}
                                    </div>
                                    <div className="text-left">
                                      <h5 className="font-medium text-gray-900">{dayPlan.title}</h5>
                                      <p className="text-sm text-gray-600">
                                        {dayPlan.activities.length} activities
                                      </p>
                                    </div>
                                  </div>
                                  {expandedDays.includes(dayPlan.day) ? (
                                    <ChevronUp className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                  )}
                                </button>

                                <AnimatePresence>
                                  {expandedDays.includes(dayPlan.day) && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-4 pt-0 border-t border-gray-100">
                                        <div className="space-y-3">
                                          {dayPlan.activities.map((activity, actIndex) => (
                                            <motion.div
                                              key={actIndex}
                                              initial={{ opacity: 0, x: -20 }}
                                              animate={{ opacity: 1, x: 0 }}
                                              transition={{ delay: actIndex * 0.1 }}
                                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                              <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                                  <span className="text-xs font-bold text-blue-600">
                                                    {actIndex + 1}
                                                  </span>
                                                </div>
                                                <div>
                                                  <h6 className="font-medium text-gray-900">{activity.name}</h6>
                                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{activity.duration}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                      {activity.type}
                                                    </Badge>
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <p className="text-sm font-medium text-gray-900">
                                                  IDR {activity.cost.toLocaleString('id-ID')}
                                                </p>
                                              </div>
                                            </motion.div>
                                          ))}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                          Edit Itinerary
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 text-red-600 hover:text-white hover:bg-red-600 border-red-300"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${itinerary.title}"? This action cannot be undone.`)) {
                              if (onDeleteItinerary) {
                                onDeleteItinerary(itinerary.id);
                              }
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
