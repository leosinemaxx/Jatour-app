"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, DollarSign, Crown, Backpack, CheckCircle } from 'lucide-react';
import { smartTripGoalsIntegration } from '../../lib/ml/smart-trip-goals-integration';

interface TripGoal {
  type: 'budget' | 'balanced' | 'luxury' | 'backpacker';
  name: string;
  description: string;
  icon: any;
  color: string;
  features: string[];
  estimatedBudget: string;
}

const tripGoals: TripGoal[] = [
  {
    type: 'budget',
    name: 'Budget Traveler',
    description: 'Cost-effective travel with great value experiences',
    icon: DollarSign,
    color: 'from-green-500 to-emerald-600',
    features: [
      'Affordable accommodations',
      'Local food experiences',
      'Public transportation',
      'Cultural immersion'
    ],
    estimatedBudget: 'IDR 1M - 2M'
  },
  {
    type: 'balanced',
    name: 'Balanced Explorer',
    description: 'Mix of comfort and adventure with moderate spending',
    icon: Target,
    color: 'from-blue-500 to-indigo-600',
    features: [
      'Mid-range accommodations',
      'Mix of local and tourist spots',
      'Balanced transportation options',
      'Quality experiences'
    ],
    estimatedBudget: 'IDR 3M - 5M'
  },
  {
    type: 'luxury',
    name: 'Luxury Experience',
    description: 'Premium travel with high-end accommodations and exclusive experiences',
    icon: Crown,
    color: 'from-purple-500 to-pink-600',
    features: [
      'Premium accommodations',
      'Private tours & experiences',
      'Fine dining',
      'Concierge services'
    ],
    estimatedBudget: 'IDR 10M - 15M+'
  },
  {
    type: 'backpacker',
    name: 'Backpacker Adventure',
    description: 'Authentic, immersive travel with focus on local experiences',
    icon: Backpack,
    color: 'from-orange-500 to-red-600',
    features: [
      'Hostels & guesthouses',
      'Street food & local markets',
      'Hiking & adventure activities',
      'Cultural exchange'
    ],
    estimatedBudget: 'IDR 1M - 1.5M'
  }
];

interface TripGoalSelectorProps {
  onGoalSelected: (goalType: TripGoal['type']) => void;
  selectedGoal?: TripGoal['type'];
  userId: string;
}

export default function TripGoalSelector({ onGoalSelected, selectedGoal, userId }: TripGoalSelectorProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Get goal recommendations on mount
  useState(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      try {
        const recs = smartTripGoalsIntegration.getGoalRecommendations(userId, {});
        setRecommendations(recs);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  });

  const getRecommendationBadge = (goalType: TripGoal['type']) => {
    const recommendation = recommendations.find(r => r.goalType === goalType);
    if (!recommendation) return null;

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        recommendation.suitability > 0.7 ? 'bg-green-100 text-green-800' :
        recommendation.suitability > 0.5 ? 'bg-yellow-100 text-yellow-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        <CheckCircle className="h-3 w-3" />
        {recommendation.suitability > 0.7 ? 'Highly Recommended' :
         recommendation.suitability > 0.5 ? 'Recommended' : 'Consider'}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Trip Goal</h2>
        <p className="text-gray-600">
          Select a travel style that matches your preferences. We'll personalize recommendations accordingly.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tripGoals.map((goal, index) => (
          <motion.div
            key={goal.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative group cursor-pointer`}
            onClick={() => onGoalSelected(goal.type)}
          >
            <div className={`relative rounded-2xl p-6 h-full transition-all duration-300 ${
              selectedGoal === goal.type
                ? `bg-gradient-to-br ${goal.color} text-white shadow-lg scale-105`
                : 'bg-white border border-gray-200 hover:shadow-md hover:scale-102'
            }`}>

              {/* Recommendation Badge */}
              <div className="absolute -top-2 -right-2">
                {getRecommendationBadge(goal.type)}
              </div>

              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl mb-4 ${
                selectedGoal === goal.type
                  ? 'bg-white/20'
                  : `bg-gradient-to-br ${goal.color} text-white`
              }`}>
                <goal.icon className={`h-6 w-6 ${
                  selectedGoal === goal.type ? 'text-white' : 'text-white'
                }`} />
              </div>

              {/* Content */}
              <div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  selectedGoal === goal.type ? 'text-white' : 'text-gray-900'
                }`}>
                  {goal.name}
                </h3>

                <p className={`text-sm mb-4 ${
                  selectedGoal === goal.type ? 'text-white/80' : 'text-gray-600'
                }`}>
                  {goal.description}
                </p>

                {/* Budget Estimate */}
                <div className={`text-xs font-medium mb-3 ${
                  selectedGoal === goal.type ? 'text-white/90' : 'text-gray-500'
                }`}>
                  Est. Budget: {goal.estimatedBudget}
                </div>

                {/* Features */}
                <ul className="space-y-1">
                  {goal.features.map((feature, idx) => (
                    <li key={idx} className={`text-xs flex items-center gap-2 ${
                      selectedGoal === goal.type ? 'text-white/80' : 'text-gray-600'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${
                        selectedGoal === goal.type ? 'bg-white/60' : 'bg-gray-400'
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Selection Indicator */}
              {selectedGoal === goal.type && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4"
                >
                  <CheckCircle className="h-6 w-6 text-white" />
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {selectedGoal && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <button
            onClick={() => onGoalSelected(selectedGoal)}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
          >
            Continue with {tripGoals.find(g => g.type === selectedGoal)?.name}
          </button>
        </motion.div>
      )}

      {loading && (
        <div className="text-center text-gray-500">
          Loading recommendations...
        </div>
      )}
    </div>
  );
}