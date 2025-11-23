import { Injectable } from '@nestjs/common';
import { HotelComparisonRequestDto, HotelComparisonResultDto } from './dto/hotel-comparison.dto';
import { TransportationComparisonRequestDto, TransportationComparisonResultDto } from './dto/transportation-comparison.dto';
import { DiningComparisonRequestDto, DiningComparisonResultDto } from './dto/dining-comparison.dto';

@Injectable()
export class PriceComparisonService {
  async compareHotels(request: HotelComparisonRequestDto): Promise<HotelComparisonResultDto[]> {
    // Aggregate prices from multiple hotel providers
    const agodaResults = await this.getAgodaHotels(request);
    const bookingResults = await this.getBookingHotels(request);
    const mockResults = this.getMockHotels(request);

    const allResults = [...agodaResults, ...bookingResults, ...mockResults];

    // Rank and personalize results
    return this.rankHotels(allResults, request);
  }

  async compareTransportation(request: TransportationComparisonRequestDto): Promise<TransportationComparisonResultDto[]> {
    // Aggregate prices from multiple transportation providers
    const gojekResults = await this.getGojekTransportation(request);
    const grabResults = await this.getGrabTransportation(request);
    const bluebirdResults = await this.getBluebirdTransportation(request);
    const mockResults = this.getMockTransportation(request);

    const allResults = [...gojekResults, ...grabResults, ...bluebirdResults, ...mockResults];

    // Rank and personalize results
    return this.rankTransportation(allResults, request);
  }

  async compareDining(request: DiningComparisonRequestDto): Promise<DiningComparisonResultDto[]> {
    // Aggregate dining options
    const restaurantResults = this.getRestaurantDining(request);
    const mockResults = this.getMockDining(request);

    const allResults = [...restaurantResults, ...mockResults];

    // Rank and personalize results
    return this.rankDining(allResults, request);
  }

  // Mock implementations for development
  private async getAgodaHotels(request: HotelComparisonRequestDto): Promise<HotelComparisonResultDto[]> {
    // Mock Agoda API integration
    if (!process.env.AGODA_API_KEY) {
      return [];
    }

    // Simulate API call
    return [
      {
        id: 'agoda-1',
        name: 'Grand Hotel Surabaya',
        provider: 'Agoda',
        price: 450000,
        currency: 'IDR',
        rating: 4.2,
        reviewCount: 1250,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
        address: 'Jl. Tunjungan No. 1, Surabaya',
        amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant'],
        roomType: 'Deluxe Room',
        cancellationPolicy: 'Free cancellation until 24h before check-in',
        breakfastIncluded: true,
        distanceFromCenter: 2.5,
        bookingUrl: 'https://agoda.com/booking/123',
        score: 85
      }
    ];
  }

  private async getBookingHotels(request: HotelComparisonRequestDto): Promise<HotelComparisonResultDto[]> {
    // Mock Booking.com API integration
    if (!process.env.BOOKING_API_KEY) {
      return [];
    }

    return [
      {
        id: 'booking-1',
        name: 'Swiss-Belhotel Surabaya',
        provider: 'Booking.com',
        price: 520000,
        currency: 'IDR',
        rating: 4.5,
        reviewCount: 890,
        image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=300&fit=crop',
        address: 'Jl. Mayjend Sungkono No. 11, Surabaya',
        amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar'],
        roomType: 'Executive Suite',
        cancellationPolicy: 'Free cancellation until 48h before check-in',
        breakfastIncluded: true,
        distanceFromCenter: 1.8,
        bookingUrl: 'https://booking.com/booking/456',
        score: 90
      }
    ];
  }

  private getMockHotels(request: HotelComparisonRequestDto): HotelComparisonResultDto[] {
    const basePrice = request.budget ? Math.min(request.budget * 0.8, 300000) : 250000;
    const hotels = [
      {
        id: 'mock-1',
        name: 'Hotel Majapahit',
        provider: 'Mock',
        price: basePrice,
        currency: 'IDR',
        rating: 4.0,
        reviewCount: 650,
        image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
        address: 'Jl. Tunjungan No. 65, Surabaya',
        amenities: ['WiFi', 'Restaurant'],
        roomType: 'Standard Room',
        cancellationPolicy: 'Free cancellation until 12h before check-in',
        breakfastIncluded: false,
        distanceFromCenter: 3.2,
        score: 75
      },
      {
        id: 'mock-2',
        name: 'Ibis Styles Surabaya',
        provider: 'Mock',
        price: basePrice * 1.3,
        currency: 'IDR',
        rating: 4.3,
        reviewCount: 420,
        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop',
        address: 'Jl. Ahmad Yani No. 123, Surabaya',
        amenities: ['WiFi', 'Pool', 'Restaurant', 'Gym'],
        roomType: 'Superior Room',
        cancellationPolicy: 'Free cancellation until 24h before check-in',
        breakfastIncluded: true,
        distanceFromCenter: 1.5,
        score: 82
      }
    ];

    return hotels.filter(hotel => !request.budget || hotel.price <= request.budget) as HotelComparisonResultDto[];
  }

  private async getGojekTransportation(request: TransportationComparisonRequestDto): Promise<TransportationComparisonResultDto[]> {
    if (!process.env.GOJEK_API_KEY) {
      return [];
    }

    return [
      {
        id: 'gojek-1',
        provider: 'Gojek',
        type: 'ride-hail',
        price: 25000,
        currency: 'IDR',
        duration: '25 minutes',
        distance: 8.5,
        vehicleType: request.vehicleType || 'car',
        bookingUrl: 'https://gojek.com/ride/123',
        score: 88
      }
    ];
  }

  private async getGrabTransportation(request: TransportationComparisonRequestDto): Promise<TransportationComparisonResultDto[]> {
    if (!process.env.GRAB_API_KEY) {
      return [];
    }

    return [
      {
        id: 'grab-1',
        provider: 'Grab',
        type: 'ride-hail',
        price: 28000,
        currency: 'IDR',
        duration: '22 minutes',
        distance: 8.5,
        vehicleType: request.vehicleType || 'car',
        bookingUrl: 'https://grab.com/ride/456',
        score: 85
      }
    ];
  }

  private async getBluebirdTransportation(request: TransportationComparisonRequestDto): Promise<TransportationComparisonResultDto[]> {
    if (!process.env.BLUEBIRD_API_KEY) {
      return [];
    }

    return [
      {
        id: 'bluebird-1',
        provider: 'Bluebird',
        type: 'taxi',
        price: 35000,
        currency: 'IDR',
        duration: '30 minutes',
        distance: 8.5,
        vehicleType: 'taxi',
        bookingUrl: 'https://bluebird.com/ride/789',
        score: 78
      }
    ];
  }

  private getMockTransportation(request: TransportationComparisonRequestDto): TransportationComparisonResultDto[] {
    const basePrice = request.vehicleType === 'motorcycle' ? 15000 : request.vehicleType === 'taxi' ? 30000 : 25000;
    const options = [
      {
        id: 'mock-transport-1',
        provider: 'Mock',
        type: 'ride-hail' as const,
        price: basePrice,
        currency: 'IDR',
        duration: '20-30 minutes',
        distance: 8.5,
        vehicleType: request.vehicleType || 'car',
        score: 80
      },
      {
        id: 'mock-transport-2',
        provider: 'Mock',
        type: 'bus' as const,
        price: basePrice * 0.3,
        currency: 'IDR',
        duration: '45-60 minutes',
        distance: 8.5,
        vehicleType: 'bus',
        schedule: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
        score: 65
      }
    ];

    return options.filter(option => !request.budget || option.price <= request.budget) as TransportationComparisonResultDto[];
  }

  private getRestaurantDining(request: DiningComparisonRequestDto): DiningComparisonResultDto[] {
    // Use existing restaurant data from kuliner page
    return [
      {
        id: 'restaurant-1',
        name: 'Warung Bu Rudi',
        provider: 'Restaurant',
        cuisine: 'Traditional Javanese',
        priceRange: 'budget',
        averagePrice: 35000,
        currency: 'IDR',
        rating: 4.7,
        reviewCount: 234,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        address: 'Jl. Gubeng Kertajaya No. 15, Gubeng, Surabaya',
        phone: '+62 31 501 2345',
        specialties: ['Sate Ayam Madura', 'Gado-gado Surabaya', 'Nasi Pecel'],
        features: ['Outdoor Seating', 'Family Friendly', 'Parking Available'],
        operatingHours: {
          'Monday': '08:00 - 22:00',
          'Tuesday': '08:00 - 22:00',
          'Wednesday': '08:00 - 22:00',
          'Thursday': '08:00 - 22:00',
          'Friday': '08:00 - 23:00',
          'Saturday': '08:00 - 23:00',
          'Sunday': '09:00 - 21:00'
        },
        reservationRequired: false,
        score: 88
      }
    ];
  }

  private getMockDining(request: DiningComparisonRequestDto): DiningComparisonResultDto[] {
    const basePrice = request.priceRange === 'budget' ? 25000 : request.priceRange === 'premium' ? 150000 : 75000;
    const restaurants = [
      {
        id: 'mock-dining-1',
        name: 'Local Eatery',
        provider: 'Mock',
        cuisine: request.cuisine || 'Local',
        priceRange: request.priceRange || 'moderate',
        averagePrice: basePrice,
        currency: 'IDR',
        rating: 4.2,
        reviewCount: 150,
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
        address: 'Jl. Local Street No. 1, Surabaya',
        specialties: ['Local Dishes'],
        features: ['Casual Dining'],
        operatingHours: {
          'Monday': '10:00 - 22:00',
          'Tuesday': '10:00 - 22:00',
          'Wednesday': '10:00 - 22:00',
          'Thursday': '10:00 - 22:00',
          'Friday': '10:00 - 23:00',
          'Saturday': '10:00 - 23:00',
          'Sunday': '11:00 - 21:00'
        },
        reservationRequired: false,
        score: 75
      }
    ];

    return restaurants.filter(restaurant => !request.budget || restaurant.averagePrice <= request.budget) as DiningComparisonResultDto[];
  }

  private rankHotels(results: HotelComparisonResultDto[], request: HotelComparisonRequestDto): HotelComparisonResultDto[] {
    return results
      .map(result => {
        let score = result.score;

        // Adjust score based on budget
        if (request.budget && result.price > request.budget) {
          score -= 20;
        }

        // Adjust score based on rating preference
        if (request.preferences?.rating && result.rating >= request.preferences.rating) {
          score += 10;
        }

        // Adjust score based on amenities
        if (request.preferences?.amenities) {
          const matchingAmenities = request.preferences.amenities.filter(amenity =>
            result.amenities.some(hotelAmenity =>
              hotelAmenity.toLowerCase().includes(amenity.toLowerCase())
            )
          );
          score += matchingAmenities.length * 5;
        }

        return { ...result, score };
      })
      .sort((a, b) => b.score - a.score);
  }

  private rankTransportation(results: TransportationComparisonResultDto[], request: TransportationComparisonRequestDto): TransportationComparisonResultDto[] {
    return results
      .map(result => {
        let score = result.score;

        // Adjust score based on budget
        if (request.budget && result.price > request.budget) {
          score -= 20;
        }

        // Adjust score based on vehicle type preference
        if (request.vehicleType && result.vehicleType === request.vehicleType) {
          score += 15;
        }

        // Adjust score based on preferred providers
        if (request.preferences?.preferredProviders?.includes(result.provider)) {
          score += 10;
        }

        return { ...result, score };
      })
      .sort((a, b) => b.score - a.score);
  }

  private rankDining(results: DiningComparisonResultDto[], request: DiningComparisonRequestDto): DiningComparisonResultDto[] {
    return results
      .map(result => {
        let score = result.score;

        // Adjust score based on budget
        if (request.budget && result.averagePrice > request.budget) {
          score -= 20;
        }

        // Adjust score based on cuisine preference
        if (request.cuisine && result.cuisine.toLowerCase().includes(request.cuisine.toLowerCase())) {
          score += 15;
        }

        // Adjust score based on price range preference
        if (request.priceRange && result.priceRange === request.priceRange) {
          score += 10;
        }

        return { ...result, score };
      })
      .sort((a, b) => b.score - a.score);
  }
}