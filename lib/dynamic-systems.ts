// Dynamic systems that automatically sync with database changes
// This ensures all hardcoded data is replaced with real-time database content

import { useMemo } from 'react';
import { useDestinations } from './hooks/useDestinations';
import type { Destination } from '@/app/datatypes';

// Dynamic Theme System - automatically generated from database categories
export const useDynamicThemes = () => {
  const { destinations } = useDestinations();

  return useMemo(() => {
    if (!destinations.length) return [];

    // Extract unique categories from destinations
    const categories = Array.from(new Set(destinations.map(d => d.category?.toLowerCase()).filter(Boolean)));
    
    // Map database categories to theme options
    const themeMapping: Record<string, {
      title: string;
      description: string;
      accent: string;
      icon: string;
    }> = {
      'mountain': {
        title: 'Pegunungan',
        description: 'Pendakian & sunrise',
        accent: 'from-orange-100 to-orange-200',
        icon: 'Mountain'
      },
      'national park': {
        title: 'Wisata Alam',
        description: 'Air terjun, hutan, savana',
        accent: 'from-emerald-100 to-emerald-200',
        icon: 'TreePine'
      },
      'forest': {
        title: 'Hutan & Konservasi',
        description: 'Eco-tourism & wildlife',
        accent: 'from-green-100 to-green-200',
        icon: 'Leaf'
      },
      'beach': {
        title: 'Pantai & Laut',
        description: 'Sunset & snorkeling',
        accent: 'from-sky-100 to-sky-200',
        icon: 'Waves'
      },
      'temple': {
        title: 'Heritage',
        description: 'Candi & sejarah',
        accent: 'from-amber-100 to-amber-200',
        icon: 'Landmark'
      },
      'religious': {
        title: 'Budaya',
        description: 'Seni & tradisi lokal',
        accent: 'from-rose-100 to-rose-200',
        icon: 'Landmark'
      },
      'city': {
        title: 'Urban Explorer',
        description: 'Kota modern & landmark',
        accent: 'from-slate-100 to-slate-200',
        icon: 'Building2'
      },
      'theme park': {
        title: 'Family Friendly',
        description: 'Taman bermain & edukasi',
        accent: 'from-indigo-100 to-indigo-200',
        icon: 'Users'
      },
      'zoo': {
        title: 'Family Friendly',
        description: 'Taman bermain & edukasi',
        accent: 'from-indigo-100 to-indigo-200',
        icon: 'Users'
      },
      'museum': {
        title: 'Heritage',
        description: 'Museum & edukasi',
        accent: 'from-purple-100 to-purple-200',
        icon: 'Landmark'
      },
      'waterfall': {
        title: 'Wisata Alam',
        description: 'Air terjunj & alam',
        accent: 'from-emerald-100 to-emerald-200',
        icon: 'TreePine'
      },
      'lake': {
        title: 'Wisata Alam',
        description: 'Danau & alam',
        accent: 'from-emerald-100 to-emerald-200',
        icon: 'TreePine'
      },
      'cultural': {
        title: 'Budaya',
        description: 'Seni & tradisi lokal',
        accent: 'from-rose-100 to-rose-200',
        icon: 'Landmark'
      },
      'adventure': {
        title: 'Petualangan',
        description: 'Off-road & rafting',
        accent: 'from-purple-100 to-purple-200',
        icon: 'Activity'
      },
      'wellness': {
        title: 'Wellness',
        description: 'Spa & retreat',
        accent: 'from-pink-100 to-pink-200',
        icon: 'Sprout'
      },
      'culinary': {
        title: 'Kuliner',
        description: 'Street food & kopi',
        accent: 'from-lime-100 to-lime-200',
        icon: 'Utensils'
      },
      'nightlife': {
        title: 'Nightlife',
        description: 'Bar & city lights',
        accent: 'from-slate-900 to-slate-700 text-white',
        icon: 'MoonStar'
      }
    };

    // Generate themes from actual database categories
    const dynamicThemes = categories.map((category, index) => {
      const mapping = themeMapping[category] || {
        title: category.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        description: `Kategori ${category}`,
        accent: `from-gray-${100 + (index * 50)} to-gray-${200 + (index * 50)}`,
        icon: 'TreePine'
      };

      return {
        id: category,
        ...mapping,
        // Add icon import dynamically
        icon: mapping.icon
      };
    });

    // Ensure we have essential themes even if not in database
    const essentialThemes = [
      { id: 'nature', title: 'Wisata Alam', description: 'Air terjun, hutan, savana', accent: 'from-emerald-100 to-emerald-200', icon: 'TreePine' },
      { id: 'mountain', title: 'Pegunungan', description: 'Pendakian & sunrise', accent: 'from-orange-100 to-orange-200', icon: 'Mountain' },
      { id: 'beach', title: 'Pantai & Laut', description: 'Sunset & snorkeling', accent: 'from-sky-100 to-sky-200', icon: 'Waves' },
      { id: 'culture', title: 'Budaya', description: 'Seni & tradisi lokal', accent: 'from-rose-100 to-rose-200', icon: 'Landmark' },
      { id: 'culinary', title: 'Kuliner', description: 'Street food & kopi', accent: 'from-lime-100 to-lime-200', icon: 'Utensils' },
      { id: 'family', title: 'Family Friendly', description: 'Taman bermain & edukasi', accent: 'from-indigo-100 to-indigo-200', icon: 'Users' },
    ];

    // Merge essential themes with dynamic ones, avoiding duplicates
    const allThemes = [...essentialThemes];
    dynamicThemes.forEach(theme => {
      if (!allThemes.find(t => t.id === theme.id)) {
        allThemes.push(theme);
      }
    });

    return allThemes;
  }, [destinations]);
};

// Dynamic Cities System - from destination data
export const useDynamicCities = () => {
  const { destinations } = useDestinations();

  return useMemo(() => {
    if (!destinations.length) return [];

    const citiesMap = new Map();
    destinations.forEach(dest => {
      const cityName = dest.city;
      if (!citiesMap.has(cityName)) {
        const category = dest.category?.toLowerCase() || '';
        const tags = [];

        // Auto-generate tags based on destination categories
        if (['mountain', 'national park', 'forest'].includes(category)) {
          tags.push('nature', 'mountain', 'adventure');
        }
        if (['beach'].includes(category)) {
          tags.push('beach', 'nature', 'family');
        }
        if (['temple', 'religious'].includes(category)) {
          tags.push('culture', 'heritage');
        }
        if (['city'].includes(category)) {
          tags.push('urban', 'culinary', 'nightlife');
        }
        if (['theme park', 'zoo', 'museum'].includes(category)) {
          tags.push('family', 'culture', 'heritage');
        }
        if (['waterfall', 'lake'].includes(category)) {
          tags.push('nature', 'family', 'wellness');
        }

        citiesMap.set(cityName, {
          name: cityName,
          image: dest.image || "/destinations/main-bg.webp",
          tags,
          province: dest.province,
          destinationCount: destinations.filter(d => d.city === cityName).length,
          featured: destinations.some(d => d.city === cityName && d.featured)
        });
      }
    });

    return Array.from(citiesMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .sort((a, b) => b.destinationCount - a.destinationCount); // Sort by popularity
  }, [destinations]);
};

// Dynamic Spots System - all destinations
export const useDynamicSpots = () => {
  const { destinations } = useDestinations();

  return useMemo(() => {
    if (!destinations.length) return [];

    return destinations.map(dest => {
      const category = dest.category?.toLowerCase() || '';
      const tags = [];

      // Auto-generate tags from destination categories
      if (['mountain', 'national park', 'forest'].includes(category)) {
        tags.push('nature', 'mountain', 'adventure');
      }
      if (['beach'].includes(category)) {
        tags.push('beach', 'nature', 'family');
      }
      if (['temple', 'religious'].includes(category)) {
        tags.push('culture', 'heritage');
      }
      if (['city'].includes(category)) {
        tags.push('urban', 'culinary', 'nightlife');
      }
      if (['theme park', 'zoo', 'museum'].includes(category)) {
        tags.push('family', 'culture', 'heritage');
      }
      if (['waterfall', 'lake'].includes(category)) {
        tags.push('nature', 'family', 'wellness');
      }

      return {
        name: dest.name,
        image: dest.image || "/destinations/main-bg.webp",
        tags,
        category: dest.category,
        city: dest.city,
        rating: dest.rating,
        priceRange: dest.priceRange,
        description: dest.description
      };
    }).sort((a, b) => {
      // Sort by rating first, then by name
      if (a.rating && b.rating) {
        return b.rating - a.rating;
      }
      return a.name.localeCompare(b.name);
    });
  }, [destinations]);
};

// Dynamic Price Ranges - from database analysis
export const useDynamicPriceRanges = () => {
  const { destinations } = useDestinations();

  return useMemo(() => {
    if (!destinations.length) return ['budget', 'moderate', 'luxury'];

    const priceRanges = Array.from(new Set(destinations.map(d => d.priceRange?.toLowerCase()).filter(Boolean)));
    
    if (priceRanges.length === 0) {
      return ['budget', 'moderate', 'luxury'];
    }

    return priceRanges.sort();
  }, [destinations]);
};

// Dynamic Categories - from database
export const useDynamicCategories = () => {
  const { destinations } = useDestinations();

  return useMemo(() => {
    if (!destinations.length) return [];

    return Array.from(new Set(destinations.map(d => d.category).filter(Boolean)))
      .sort();
  }, [destinations]);
};

// Dynamic Rating System
export const useDynamicRatings = () => {
  const { destinations } = useDestinations();

  return useMemo(() => {
    if (!destinations.length) return [1, 2, 3, 4, 5];

    const ratings = Array.from(new Set(destinations.map(d => Math.floor(d.rating || 0)).filter(r => r > 0)));
    
    return ratings.length > 0 ? ratings.sort((a, b) => a - b) : [1, 2, 3, 4, 5];
  }, [destinations]);
};

// Dynamic Featured Destinations
export const useDynamicFeaturedDestinations = () => {
  const { destinations } = useDestinations();

  return useMemo(() => {
    if (!destinations.length) return [];

    return destinations
      .filter(d => d.featured)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 12); // Limit to top 12 featured destinations
  }, [destinations]);
};

// Dynamic Search Suggestions
export const useDynamicSearchSuggestions = () => {
  const { destinations } = useDestinations();

  return useMemo(() => {
    if (!destinations.length) return [];

    const suggestions = [
      ...destinations.map(d => d.name),
      ...destinations.map(d => d.city),
      ...destinations.map(d => d.category),
    ];

    return Array.from(new Set(suggestions))
      .filter(s => s && s.length > 0)
      .sort()
      .slice(0, 20); // Limit to top 20 suggestions
  }, [destinations]);
};

// Dynamic Statistics
export const useDynamicStats = () => {
  const { destinations } = useDestinations();

  return useMemo(() => {
    if (!destinations.length) {
      return {
        totalDestinations: 0,
        totalCities: 0,
        totalCategories: 0,
        averageRating: 0,
        featuredCount: 0
      };
    }

    const cities = new Set(destinations.map(d => d.city));
    const categories = new Set(destinations.map(d => d.category));
    const ratings = destinations.map(d => d.rating).filter(r => r && r > 0);
    const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const featuredCount = destinations.filter(d => d.featured).length;

    return {
      totalDestinations: destinations.length,
      totalCities: cities.size,
      totalCategories: categories.size,
      averageRating: Math.round(averageRating * 10) / 10,
      featuredCount
    };
  }, [destinations]);
};

// Dynamic Badge/Tag Colors
export const getDynamicCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    'mountain': 'bg-orange-100 text-orange-800',
    'national park': 'bg-green-100 text-green-800',
    'forest': 'bg-emerald-100 text-emerald-800',
    'beach': 'bg-blue-100 text-blue-800',
    'temple': 'bg-amber-100 text-amber-800',
    'religious': 'bg-purple-100 text-purple-800',
    'city': 'bg-slate-100 text-slate-800',
    'theme park': 'bg-indigo-100 text-indigo-800',
    'zoo': 'bg-green-100 text-green-800',
    'museum': 'bg-purple-100 text-purple-800',
    'waterfall': 'bg-cyan-100 text-cyan-800',
    'lake': 'bg-sky-100 text-sky-800',
    'cultural': 'bg-rose-100 text-rose-800',
    'adventure': 'bg-red-100 text-red-800',
    'wellness': 'bg-pink-100 text-pink-800',
    'culinary': 'bg-yellow-100 text-yellow-800',
    'nightlife': 'bg-gray-800 text-white',
  };

  const normalizedCategory = category?.toLowerCase() || '';
  return colorMap[normalizedCategory] || 'bg-gray-100 text-gray-800';
};

// Dynamic Price Range Display
export const getDynamicPriceDisplay = (priceRange: string, category: string = ''): string => {
  const priceDisplays: Record<string, string> = {
    'budget': 'IDR 0 - 50K / Orang',
    'moderate': 'IDR 50K - 150K / Orang', 
    'luxury': 'IDR 150K+ / Orang',
  };

  const normalizedPrice = priceRange?.toLowerCase();
  return priceDisplays[normalizedPrice] || 'Harga bervariasi';
};

// Export all dynamic systems
export const DynamicSystems = {
  useDynamicThemes,
  useDynamicCities,
  useDynamicSpots,
  useDynamicPriceRanges,
  useDynamicCategories,
  useDynamicRatings,
  useDynamicFeaturedDestinations,
  useDynamicSearchSuggestions,
  useDynamicStats,
  getDynamicCategoryColor,
  getDynamicPriceDisplay
};
