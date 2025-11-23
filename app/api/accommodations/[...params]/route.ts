import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
) {
  try {
    // Await the params promise
    const awaitedParams = await params;
    const { params: pathParams } = awaitedParams;
    
    // Handle /city/{city}/category/{category} pattern
    if (pathParams && pathParams.length >= 4 && 
        pathParams[0] === 'city' && pathParams[2] === 'category') {
      
      const city = pathParams[1];
      const category = pathParams[3];
      
      console.log('🔍 API Request for accommodations:', { city, category });
      
      // Try direct database access first
      try {
        console.log('🗄️  Attempting direct database query...');
        let accommodations = await prisma.accommodation.findMany({
          where: {
            city: city,
            category: category
          },
          orderBy: {
            rating: 'desc'
          }
        });
        
        console.log('✅ Direct database query successful:', accommodations.length, 'accommodations found for', { city, category });
        
        // If no accommodations found for this city and category, search for alternatives
        if (accommodations.length === 0) {
          console.log('🔍 No accommodations found, searching for alternatives...');
          
          // First, try to find accommodations in the same city with different categories
          const sameCityOtherCategories = await prisma.accommodation.findMany({
            where: {
              city: city,
              category: {
                not: category
              }
            },
            orderBy: {
              rating: 'desc'
            }
          });
          
          if (sameCityOtherCategories.length > 0) {
            console.log('✅ Found', sameCityOtherCategories.length, 'accommodations in same city with different categories');
            accommodations = sameCityOtherCategories;
          } else {
            // If no accommodations in the same city, search for nearby cities
            console.log('🔍 Searching for nearby cities...');
            
            // Define nearby cities mapping for common cities
            const nearbyCities: Record<string, string[]> = {
              'Gresik': ['Surabaya', 'Sidoarjo', 'Lamongan'],
              'Surabaya': ['Gresik', 'Sidoarjo', 'Mojokerto'],
              'Sidoarjo': ['Surabaya', 'Gresik', 'Mojokerto'],
              'Mojokerto': ['Surabaya', 'Sidoarjo', 'Jombang'],
              'Jombang': ['Mojokerto', 'Kediri', 'Surabaya'],
              'Kediri': ['Jombang', 'Madiun', 'Blitar'],
              'Madiun': ['Kediri', 'Ngawi', 'Ponorogo'],
              'Blitar': ['Kediri', 'Tulungagung', 'Malang'],
              'Malang': ['Blitar', 'Tulungagung', 'Batu', 'Pasuruan'],
              'Batu': ['Malang', 'Pasuruan', 'Surabaya'],
              'Pasuruan': ['Malang', 'Batu', 'Probolinggo'],
              'Probolinggo': ['Pasuruan', 'Lumajang', 'Malang'],
              'Lumajang': ['Probolinggo', 'Jember', 'Malang'],
              'Jember': ['Lumajang', 'Banyuwangi', 'Probolinggo'],
              'Banyuwangi': ['Jember', 'Situbondo'],
              'Situbondo': ['Banyuwangi', 'Jember'],
              'Pacitan': ['Trenggalek', 'Ponorogo'],
              'Trenggalek': ['Pacitan', 'Ponorogo'],
              'Ponorogo': ['Trenggalek', 'Pacitan', 'Madiun'],
              'Tulungagung': ['Blitar', 'Trenggalek', 'Kediri']
            };
            
            const nearby = nearbyCities[city] || [];
            console.log('📍 Nearby cities for', city, ':', nearby);
            
            // Search for accommodations in nearby cities with the same category
            if (nearby.length > 0) {
              const nearbyCityAccommodations = await prisma.accommodation.findMany({
                where: {
                  city: {
                    in: nearby
                  },
                  category: category
                },
                orderBy: {
                  rating: 'desc'
                }
              });
              
              if (nearbyCityAccommodations.length > 0) {
                console.log('✅ Found', nearbyCityAccommodations.length, 'accommodations in nearby cities');
                // Add location information to indicate these are from nearby cities
                accommodations = nearbyCityAccommodations.map(acc => ({
                  ...acc,
                  _source: 'nearby_city',
                  _original_city: city,
                  _suggested_city: acc.city
                }));
              } else {
                // Last resort: search for any accommodations in nearby cities regardless of category
                const anyNearbyAccommodations = await prisma.accommodation.findMany({
                  where: {
                    city: {
                      in: nearby
                    }
                  },
                  orderBy: {
                    rating: 'desc'
                  }
                });
                
                if (anyNearbyAccommodations.length > 0) {
                  console.log('✅ Found', anyNearbyAccommodations.length, 'accommodations in nearby cities (any category)');
                  accommodations = anyNearbyAccommodations.map(acc => ({
                    ...acc,
                    _source: 'nearby_city_any_category',
                    _original_city: city,
                    _suggested_city: acc.city
                  }));
                } else {
                  // Ultimate fallback: search for accommodations in the same category across all cities
                  const allCitiesSameCategory = await prisma.accommodation.findMany({
                    where: {
                      category: category
                    },
                    orderBy: {
                      rating: 'desc'
                    },
                    take: 10 // Limit to top 10
                  });
                  
                  if (allCitiesSameCategory.length > 0) {
                    console.log('✅ Found', allCitiesSameCategory.length, 'accommodations in other cities with same category');
                    accommodations = allCitiesSameCategory.map(acc => ({
                      ...acc,
                      _source: 'other_cities_same_category',
                      _original_city: city,
                      _suggested_city: acc.city
                    }));
                  } else {
                    // Final fallback: return any accommodations
                    const anyAccommodations = await prisma.accommodation.findMany({
                      orderBy: {
                        rating: 'desc'
                      },
                      take: 10
                    });
                    
                    console.log('✅ Found', anyAccommodations.length, 'any accommodations as final fallback');
                    accommodations = anyAccommodations.map(acc => ({
                      ...acc,
                      _source: 'any_accommodation',
                      _original_city: city,
                      _suggested_city: acc.city
                    }));
                  }
                }
              }
            }
          }
        }
        
        // Transform data to match expected format
        const transformedAccommodations = accommodations.map(acc => ({
          ...acc,
          amenities: typeof acc.amenities === 'string' ? acc.amenities : JSON.stringify(acc.amenities),
          coordinates: typeof acc.coordinates === 'string' ? acc.coordinates : JSON.stringify(acc.coordinates),
          availability: typeof acc.availability === 'string' ? acc.availability : JSON.stringify(acc.availability)
        }));
        
        console.log('📤 Returning', transformedAccommodations.length, 'accommodations');
        return NextResponse.json(transformedAccommodations);
        
      } catch (dbError) {
        console.error('❌ Direct database query failed:', dbError);
        
        // Fallback to NestJS backend
        const backendUrl = `${process.env.NESTJS_API_URL || 'http://localhost:3001'}/accommodations/city/${city}/category/${category}`;
        
        console.log('🔄 Falling back to NestJS backend:', backendUrl);
        
        try {
          const backendResponse = await fetch(backendUrl);
          
          if (!backendResponse.ok) {
            throw new Error(`Backend responded with status: ${backendResponse.status}`);
          }
          
          const data = await backendResponse.json();
          console.log('✅ Backend response successful:', data.length, 'accommodations found');
          return NextResponse.json(data);
          
        } catch (backendError) {
          console.error('❌ Backend also failed:', backendError);
          
          // Final fallback: return empty array with error info
          return NextResponse.json({
            error: 'No accommodations available',
            details: 'Both database and backend queries failed',
            city,
            category,
            suggestions: [
              'Ensure NestJS backend is running on port 3001',
              'Check database connection',
              'Verify city and category parameters'
            ]
          }, { status: 503 });
        }
      }
    }
    
    return NextResponse.json(
      { error: 'Invalid URL format. Expected: /api/accommodations/city/{city}/category/{category}' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('🚨 API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
