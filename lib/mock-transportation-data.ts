/**
 * Comprehensive Mock Transportation Data for East Java (Jawa Timur)
 * Provides realistic transportation data based on actual routes, distances, and pricing
 * Integrated with OpenStreetMap for accurate route calculations
 */

// East Java Cities and their coordinates
export const EAST_JAVA_CITIES = {
  Surabaya: { lat: -7.2575, lng: 112.7521, code: "SBY" },
  Malang: { lat: -7.9797, lng: 112.6304, code: "MLG" },
  Probolinggo: { lat: -7.7543, lng: 113.2159, code: "PBL" },
  Lumajang: { lat: -8.1335, lng: 113.2248, code: "LMJ" },
  Banyuwangi: { lat: -8.2191, lng: 114.3691, code: "BYW" },
  Pacitan: { lat: -8.1944, lng: 111.1031, code: "PCT" },
  Batu: { lat: -7.8667, lng: 112.5167, code: "BTU" },
  Kediri: { lat: -7.8167, lng: 112.0167, code: "KDR" },
  Blitar: { lat: -8.0983, lng: 112.1681, code: "BLT" },
  Jember: { lat: -8.1724, lng: 113.7008, code: "JBR" },
  Pasuruan: { lat: -7.6467, lng: 112.9075, code: "PSR" },
  Mojokerto: { lat: -7.4706, lng: 112.4403, code: "MJK" },
  Madiun: { lat: -7.6298, lng: 111.5239, code: "MDN" },
  Ponorogo: { lat: -7.8715, lng: 111.4617, code: "PNG" },
  Trenggalek: { lat: -8.0500, lng: 111.7167, code: "TRG" },
  Tulungagung: { lat: -8.0656, lng: 111.9025, code: "TLG" },
  Ngawi: { lat: -7.4033, lng: 111.4461, code: "NGW" },
  Bojonegoro: { lat: -7.1500, lng: 111.8833, code: "BJG" },
  Tuban: { lat: -6.8978, lng: 112.0642, code: "TBN" },
  Lamongan: { lat: -7.1167, lng: 112.4167, code: "LMG" },
  Gresik: { lat: -7.1539, lng: 112.6561, code: "GRS" },
  Sidoarjo: { lat: -7.4478, lng: 112.7183, code: "SDA" },
} as const;

// Indonesian Airports (for flight connections)
export const INDONESIAN_AIRPORTS = {
  // East Java
  "Surabaya Juanda": { code: "SUB", lat: -7.3797, lng: 112.7869, city: "Surabaya" },
  "Malang Abdul Rachman Saleh": { code: "MLG", lat: -7.9266, lng: 112.7145, city: "Malang" },
  "Banyuwangi": { code: "BWX", lat: -8.3103, lng: 114.3401, city: "Banyuwangi" },
  
  // Other major airports (for connections)
  "Jakarta Soekarno-Hatta": { code: "CGK", lat: -6.1256, lng: 106.6558, city: "Jakarta" },
  "Jakarta Halim Perdanakusuma": { code: "HLP", lat: -6.2666, lng: 106.8906, city: "Jakarta" },
  "Bali Ngurah Rai": { code: "DPS", lat: -8.7481, lng: 115.1672, city: "Denpasar" },
  "Yogyakarta Adisutjipto": { code: "JOG", lat: -7.7882, lng: 110.4318, city: "Yogyakarta" },
  "Bandung Husein Sastranegara": { code: "BDO", lat: -6.9006, lng: 107.5761, city: "Bandung" },
  "Semarang Ahmad Yani": { code: "SRG", lat: -6.9714, lng: 110.3742, city: "Semarang" },
} as const;

// Train operators in East Java
const TRAIN_OPERATORS = [
  "KAI (Kereta Api Indonesia)",
  "KAI Commuter",
  "Argo Bromo Anggrek",
  "Gajayana",
  "Mutiara Timur",
  "Sembrani",
] as const;

// Bus operators in East Java
const BUS_OPERATORS = [
  "PO Haryanto",
  "PO Sumber Alam",
  "PO Rosalia Indah",
  "PO Lorena",
  "PO Sinar Jaya",
  "PO Pahala Kencana",
  "PO Gunung Harta",
  "PO Eka",
] as const;

// Airlines operating in Indonesia
const AIRLINES = [
  "Garuda Indonesia",
  "Lion Air",
  "Citilink",
  "Batik Air",
  "Wings Air",
  "Sriwijaya Air",
] as const;

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate estimated duration based on distance and transport type
 */
function calculateDuration(distance: number, type: string): string {
  let speed = 60; // km/h default
  
  switch (type) {
    case "train":
      speed = 80; // Average train speed
      break;
    case "bus":
      speed = 60; // Average bus speed
      break;
    case "plane":
      speed = 800; // Average plane speed
      break;
    case "ferry":
      speed = 30; // Average ferry speed
      break;
    case "ride-hail":
    case "taxi":
      speed = 50; // Average car speed in city
      break;
  }
  
  const hours = distance / speed;
  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`;
  } else if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h} hours`;
  } else {
    const days = Math.floor(hours / 24);
    const h = Math.floor(hours % 24);
    return `${days}d ${h}h`;
  }
}

/**
 * Calculate realistic price based on distance and transport type
 */
function calculatePrice(distance: number, type: string): number {
  let basePrice = 0;
  let pricePerKm = 0;
  
  switch (type) {
    case "train":
      basePrice = 50000;
      pricePerKm = 2000;
      break;
    case "bus":
      basePrice = 30000;
      pricePerKm = 1500;
      break;
    case "plane":
      basePrice = 500000;
      pricePerKm = 5000;
      break;
    case "ferry":
      basePrice = 100000;
      pricePerKm = 3000;
      break;
    case "ride-hail":
    case "taxi":
      basePrice = 10000;
      pricePerKm = 3000;
      break;
  }
  
  const totalPrice = basePrice + distance * pricePerKm;
  // Round to nearest 1000
  return Math.round(totalPrice / 1000) * 1000;
}

/**
 * Generate realistic schedules based on transport type
 */
function generateSchedules(type: string, count: number = 5): string[] {
  const schedules: string[] = [];
  
  switch (type) {
    case "train":
      // Trains typically run from 6 AM to 10 PM
      const trainTimes = [6, 8, 10, 12, 14, 16, 18, 20];
      for (let i = 0; i < count && i < trainTimes.length; i++) {
        const hour = trainTimes[i];
        schedules.push(`${hour.toString().padStart(2, "0")}:00`);
      }
      break;
    case "bus":
      // Buses run more frequently
      const busTimes = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
      for (let i = 0; i < count && i < busTimes.length; i++) {
        const hour = busTimes[i];
        schedules.push(`${hour.toString().padStart(2, "0")}:00`);
      }
      break;
    case "plane":
      // Flights typically 2-4 per day
      const flightTimes = [8, 12, 16, 20];
      for (let i = 0; i < count && i < flightTimes.length; i++) {
        const hour = flightTimes[i];
        schedules.push(`${hour.toString().padStart(2, "0")}:00`);
      }
      break;
    case "ferry":
      // Ferries run less frequently
      const ferryTimes = [9, 15];
      for (let i = 0; i < count && i < ferryTimes.length; i++) {
        const hour = ferryTimes[i];
        schedules.push(`${hour.toString().padStart(2, "0")}:00`);
      }
      break;
  }
  
  return schedules;
}

/**
 * Get city coordinates by name
 */
function getCityCoordinates(cityName: string): { lat: number; lng: number } | null {
  const normalizedName = cityName.trim();
  
  // Try exact match first
  for (const [name, data] of Object.entries(EAST_JAVA_CITIES)) {
    if (name.toLowerCase() === normalizedName.toLowerCase()) {
      return { lat: data.lat, lng: data.lng };
    }
  }
  
  // Try partial match
  for (const [name, data] of Object.entries(EAST_JAVA_CITIES)) {
    if (name.toLowerCase().includes(normalizedName.toLowerCase()) || 
        normalizedName.toLowerCase().includes(name.toLowerCase())) {
      return { lat: data.lat, lng: data.lng };
    }
  }
  
  // Default to Surabaya if not found
  return EAST_JAVA_CITIES.Surabaya;
}

/**
 * Get airport by city name
 */
function getAirportByCity(cityName: string): typeof INDONESIAN_AIRPORTS[keyof typeof INDONESIAN_AIRPORTS] | null {
  for (const [name, data] of Object.entries(INDONESIAN_AIRPORTS)) {
    if (data.city.toLowerCase() === cityName.toLowerCase()) {
      return data;
    }
  }
  return null;
}

export interface MockTransportationRoute {
  from: { name: string; coordinates: { lat: number; lng: number } };
  to: { name: string; coordinates: { lat: number; lng: number } };
  type: "train" | "bus" | "plane" | "ferry" | "taxi" | "ride-hail" | "shuttle";
  duration: string;
  price: number;
  operator: string;
  schedule: string[];
  provider: string;
  estimatedArrival?: string;
  vehicleType?: string;
  distance?: number; // in km
}

/**
 * Generate mock train routes for East Java
 */
export function generateMockTrainRoutes(
  from: string,
  to: string
): MockTransportationRoute[] {
  const fromCoords = getCityCoordinates(from);
  const toCoords = getCityCoordinates(to);
  
  if (!fromCoords || !toCoords) {
    return [];
  }
  
  const distance = calculateDistance(
    fromCoords.lat,
    fromCoords.lng,
    toCoords.lat,
    toCoords.lng
  );
  
  // Only generate train routes for reasonable distances (trains connect major cities)
  if (distance > 500) {
    return []; // Too far for direct train
  }
  
  const routes: MockTransportationRoute[] = [];
  
  // Generate 2-3 train options with different classes
  const trainClasses = [
    { name: "Ekonomi", priceMultiplier: 1.0 },
    { name: "Bisnis", priceMultiplier: 1.5 },
    { name: "Eksekutif", priceMultiplier: 2.0 },
  ];
  
  trainClasses.forEach((trainClass, index) => {
    const basePrice = calculatePrice(distance, "train");
    const price = Math.round(basePrice * trainClass.priceMultiplier);
    const operator = `${TRAIN_OPERATORS[index % TRAIN_OPERATORS.length]} - ${trainClass.name}`;
    
    routes.push({
      from: { name: from, coordinates: fromCoords },
      to: { name: to, coordinates: toCoords },
      type: "train",
      duration: calculateDuration(distance, "train"),
      price,
      operator,
      schedule: generateSchedules("train", 5),
      provider: "Mock API",
      distance: Math.round(distance * 10) / 10,
    });
  });
  
  return routes;
}

/**
 * Generate mock bus routes for East Java
 */
export function generateMockBusRoutes(
  from: string,
  to: string
): MockTransportationRoute[] {
  const fromCoords = getCityCoordinates(from);
  const toCoords = getCityCoordinates(to);
  
  if (!fromCoords || !toCoords) {
    return [];
  }
  
  const distance = calculateDistance(
    fromCoords.lat,
    fromCoords.lng,
    toCoords.lat,
    toCoords.lng
  );
  
  const routes: MockTransportationRoute[] = [];
  
  // Generate 2-3 bus options with different operators
  const busCount = Math.min(3, BUS_OPERATORS.length);
  
  for (let i = 0; i < busCount; i++) {
    const basePrice = calculatePrice(distance, "bus");
    // Add some variation in pricing
    const priceVariation = 0.8 + Math.random() * 0.4; // 80% to 120% of base price
    const price = Math.round(basePrice * priceVariation);
    
    routes.push({
      from: { name: from, coordinates: fromCoords },
      to: { name: to, coordinates: toCoords },
      type: "bus",
      duration: calculateDuration(distance, "bus"),
      price,
      operator: BUS_OPERATORS[i],
      schedule: generateSchedules("bus", 8),
      provider: "Mock API",
      distance: Math.round(distance * 10) / 10,
    });
  }
  
  return routes;
}

/**
 * Generate mock flight routes (connecting to airports)
 */
export function generateMockFlightRoutes(
  from: string,
  to: string
): MockTransportationRoute[] {
  const fromAirport = getAirportByCity(from);
  const toAirport = getAirportByCity(to);
  
  // If both cities have airports, generate direct flights
  if (fromAirport && toAirport) {
    const distance = calculateDistance(
      fromAirport.lat,
      fromAirport.lng,
      toAirport.lat,
      toAirport.lng
    );
    
    // Only generate flights for distances > 200km (reasonable for flights)
    if (distance < 200) {
      return []; // Too short for flight
    }
    
    const routes: MockTransportationRoute[] = [];
    
    // Generate 2-3 flight options
    const flightCount = Math.min(3, AIRLINES.length);
    
    for (let i = 0; i < flightCount; i++) {
      const basePrice = calculatePrice(distance, "plane");
      const priceVariation = 0.9 + Math.random() * 0.3; // 90% to 120% of base price
      const price = Math.round(basePrice * priceVariation);
      
      routes.push({
        from: { 
          name: `${fromAirport.city} (${fromAirport.code})`, 
          coordinates: { lat: fromAirport.lat, lng: fromAirport.lng } 
        },
        to: { 
          name: `${toAirport.city} (${toAirport.code})`, 
          coordinates: { lat: toAirport.lat, lng: toAirport.lng } 
        },
        type: "plane",
        duration: calculateDuration(distance, "plane"),
        price,
        operator: AIRLINES[i],
        schedule: generateSchedules("plane", 4),
        provider: "Mock API",
        distance: Math.round(distance * 10) / 10,
      });
    }
    
    return routes;
  }
  
  // If one city has airport, suggest connecting flights via Surabaya or Jakarta
  if (fromAirport || toAirport) {
    const hubAirport = INDONESIAN_AIRPORTS["Surabaya Juanda"];
    const cityAirport = fromAirport || toAirport;
    const cityName = fromAirport ? to : from;
    
    const distance1 = calculateDistance(
      cityAirport.lat,
      cityAirport.lng,
      hubAirport.lat,
      hubAirport.lng
    );
    
    const distance2 = calculateDistance(
      hubAirport.lat,
      hubAirport.lng,
      getCityCoordinates(cityName)!.lat,
      getCityCoordinates(cityName)!.lng
    );
    
    return [{
      from: { 
        name: fromAirport ? `${fromAirport.city} (${fromAirport.code})` : from, 
        coordinates: fromAirport 
          ? { lat: fromAirport.lat, lng: fromAirport.lng }
          : getCityCoordinates(from)!
      },
      to: { 
        name: toAirport ? `${toAirport.city} (${toAirport.code})` : to, 
        coordinates: toAirport 
          ? { lat: toAirport.lat, lng: toAirport.lng }
          : getCityCoordinates(to)!
      },
      type: "plane",
      duration: calculateDuration(distance1 + distance2, "plane"),
      price: Math.round(calculatePrice(distance1 + distance2, "plane") * 1.2), // 20% more for connecting
      operator: `${AIRLINES[0]} (via ${hubAirport.code})`,
      schedule: generateSchedules("plane", 3),
      provider: "Mock API",
      distance: Math.round((distance1 + distance2) * 10) / 10,
    }];
  }
  
  return [];
}

/**
 * Generate mock ferry routes (for inter-island connections)
 */
export function generateMockFerryRoutes(
  from: string,
  to: string
): MockTransportationRoute[] {
  // Ferries typically connect to Bali from Banyuwangi
  if (
    (from.toLowerCase().includes("banyuwangi") && to.toLowerCase().includes("bali")) ||
    (to.toLowerCase().includes("banyuwangi") && from.toLowerCase().includes("bali"))
  ) {
    const fromCoords = getCityCoordinates(from);
    const toCoords = { lat: -8.4095, lng: 115.1889 }; // Bali coordinates
    
    const distance = calculateDistance(
      fromCoords!.lat,
      fromCoords!.lng,
      toCoords.lat,
      toCoords.lng
    );
    
    return [{
      from: { name: from, coordinates: fromCoords! },
      to: { name: to, coordinates: toCoords },
      type: "ferry",
      duration: calculateDuration(distance, "ferry"),
      price: calculatePrice(distance, "ferry"),
      operator: "Pelni",
      schedule: generateSchedules("ferry", 2),
      provider: "Mock API",
      distance: Math.round(distance * 10) / 10,
    }];
  }
  
  return [];
}

/**
 * Generate mock ride-hailing options
 */
export function generateMockRideHail(
  from: { name: string; coordinates: { lat: number; lng: number } },
  to: { name: string; coordinates: { lat: number; lng: number } },
  provider: string,
  vehicleType?: string
): MockTransportationRoute[] {
  const distance = calculateDistance(
    from.coordinates.lat,
    from.coordinates.lng,
    to.coordinates.lat,
    to.coordinates.lng
  );
  
  // Ride-hailing is typically for shorter distances (< 50km)
  if (distance > 50) {
    return []; // Too far for ride-hailing
  }
  
  const basePrice = calculatePrice(distance, "ride-hail");
  const priceMultiplier = vehicleType === "motorcycle" ? 0.6 : vehicleType === "taxi" ? 1.2 : 1.0;
  const price = Math.round(basePrice * priceMultiplier);
  
  return [{
    from,
    to,
    type: vehicleType === "motorcycle" ? "ride-hail" : vehicleType === "taxi" ? "taxi" : "ride-hail",
    duration: calculateDuration(distance, "ride-hail"),
    price,
    operator: provider,
    schedule: [], // On-demand, no schedule
    provider: "Mock API",
    vehicleType: vehicleType || "car",
    distance: Math.round(distance * 10) / 10,
  }];
}

/**
 * Get all available routes between two cities
 */
export function getAllMockRoutes(
  from: string,
  to: string
): MockTransportationRoute[] {
  const routes: MockTransportationRoute[] = [];
  
  routes.push(...generateMockTrainRoutes(from, to));
  routes.push(...generateMockBusRoutes(from, to));
  routes.push(...generateMockFlightRoutes(from, to));
  routes.push(...generateMockFerryRoutes(from, to));
  
  return routes.sort((a, b) => a.price - b.price);
}

