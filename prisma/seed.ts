/// <reference types="@prisma/client" />
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// dotenv will be loaded by ts-node via -r dotenv/config flag

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Comprehensive Jawa Timur Destinations with detailed information
  const destinations = [
    // MOUNTAINS
    {
      name: 'Gunung Bromo',
      city: 'Probolinggo',
      province: 'Jawa Timur',
      category: 'Mountain',
      description: 'Gunung Bromo adalah gunung berapi aktif yang terkenal dengan pemandangan sunrise yang menakjubkan. Destinasi wisata populer di Jawa Timur dengan kawah yang masih aktif. Pengunjung dapat menikmati pemandangan lautan pasir, kawah yang mengeluarkan asap, dan sunrise yang spektakuler dari Penanjakan. Best time to visit: April-October.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=600&fit=crop'
      ],
      rating: 4.8,
      priceRange: 'moderate',
      coordinates: { lat: -7.9425, lng: 112.9530 },
      address: 'Taman Nasional Bromo Tengger Semeru, Desa Ngadisari, Sukapura, Probolinggo, Jawa Timur',
      openingHours: '24 hours (Best time: 03:00 - 10:00 for sunrise)',
      contact: '+62 335-541193',
      website: 'https://bromotenggersemeru.org',
      featured: true,
      disabledFriendly: false,
      accessibilityFeatures: {
        wheelchairAccessible: false,
        accessibleParking: true,
        accessibleRestrooms: false,
        audioGuide: false,
        signLanguage: false,
      },
    },
    {
      name: 'Gunung Semeru',
      city: 'Lumajang',
      province: 'Jawa Timur',
      category: 'Mountain',
      description: 'Gunung tertinggi di Pulau Jawa dengan puncak Mahameru setinggi 3.676 mdpl. Destinasi pendakian yang menantang dengan pemandangan yang luar biasa. Memerlukan persiapan fisik dan mental yang matang. Jalur pendakian melalui Ranu Pani dan Ranu Kumbolo menawarkan danau yang indah. Waktu terbaik: Mei-September.',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop'
      ],
      rating: 4.7,
      priceRange: 'budget',
      coordinates: { lat: -8.1080, lng: 112.9215 },
      address: 'Taman Nasional Bromo Tengger Semeru, Desa Ranu Pani, Senduro, Lumajang, Jawa Timur',
      openingHours: '24 hours (Permit required)',
      contact: '+62 334-461859',
      featured: true,
    },
    {
      name: 'Kawah Ijen',
      city: 'Banyuwangi',
      province: 'Jawa Timur',
      category: 'Mountain',
      description: 'Famous for its blue fire phenomenon and turquoise acidic crater lake. The blue fire (api biru) is a rare natural phenomenon visible only at night. The crater lake is the largest acidic lake in the world. Best visited at night (1-4 AM) to see the blue fire, then sunrise at the crater rim.',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop'
      ],
      rating: 4.9,
      priceRange: 'moderate',
      coordinates: { lat: -8.0583, lng: 114.2425 },
      address: 'Kecamatan Licin, Banyuwangi, Jawa Timur',
      openingHours: '24 hours (Night tour: 00:00 - 06:00)',
      contact: '+62 333-636510',
      website: 'https://kawahijen.id',
      featured: true,
    },
    
    // BEACHES
    {
      name: 'Pantai Klayar',
      city: 'Pacitan',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai dengan formasi batu karang yang unik dan pemandangan yang menakjubkan. Cocok untuk fotografi dan menikmati sunset. Terkenal dengan "Semburan Air" (sea fountain) yang menyembur dari celah batu karang. Pantai dengan pasir putih dan air laut yang jernih.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&h=600&fit=crop'
      ],
      rating: 4.6,
      priceRange: 'budget',
      coordinates: { lat: -8.2553, lng: 111.2461 },
      address: 'Desa Klayar, Kecamatan Donorojo, Pacitan, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 357-881015',
      featured: true,
    },
    {
      name: 'Pantai Tampak Siring',
      city: 'Banyuwangi',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai dengan pasir putih yang indah dan air laut yang jernih. Cocok untuk berenang dan menikmati sunset. Pantai yang masih alami dengan pemandangan yang menenangkan. Terletak di ujung timur Pulau Jawa dengan view ke Pulau Bali.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&h=600&fit=crop'
      ],
      rating: 4.5,
      priceRange: 'budget',
      coordinates: { lat: -8.2192, lng: 114.3691 },
      address: 'Desa Tampak Siring, Kecamatan Glagah, Banyuwangi, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 333-636510',
      featured: true,
    },
    {
      name: 'Pantai Balekambang',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai yang indah dengan tiga pulau kecil di depannya. Terkenal dengan Pura Luhur Poten yang berada di atas batu karang. Cocok untuk berenang, fotografi, dan menikmati sunset. Fasilitas lengkap dengan area parkir dan warung makan.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&h=600&fit=crop'
      ],
      rating: 4.4,
      priceRange: 'moderate',
      coordinates: { lat: -8.4167, lng: 112.5833 },
      address: 'Desa Srigonco, Kecamatan Bantur, Malang, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 341-362123',
      featured: false,
    },
    
    // NATURE & WATERFALLS
    {
      name: 'Air Terjun Tumpak Sewu',
      city: 'Lumajang',
      province: 'Jawa Timur',
      category: 'Nature',
      description: 'Air terjun yang sangat indah dengan ketinggian sekitar 120 meter. Dijuluki sebagai Niagara-nya Indonesia. Air terjun dengan formasi yang unik dan pemandangan yang spektakuler. Cocok untuk fotografi dan wisata alam. Memerlukan perjalanan trekking sekitar 30 menit.',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop'
      ],
      rating: 4.8,
      priceRange: 'moderate',
      coordinates: { lat: -8.1667, lng: 112.9167 },
      address: 'Desa Sidomulyo, Kecamatan Pronojiwo, Lumajang, Jawa Timur',
      openingHours: '06:00 - 17:00',
      contact: '+62 334-461859',
      website: 'https://tumpaksewu.com',
      featured: true,
    },
    {
      name: 'Coban Rondo',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Nature',
      description: 'Air terjun dengan ketinggian 84 meter yang terletak di kawasan hutan pinus. Suasana sejuk dan asri dengan berbagai fasilitas wisata. Cocok untuk keluarga dengan area piknik, outbound, dan camping. Terdapat berbagai wahana seperti flying fox dan paintball.',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
      ],
      rating: 4.3,
      priceRange: 'moderate',
      coordinates: { lat: -7.9167, lng: 112.5167 },
      address: 'Desa Pandansari, Kecamatan Pujon, Malang, Jawa Timur',
      openingHours: '07:00 - 17:00',
      contact: '+62 341-362123',
      featured: false,
    },
    
    // TEMPLES & CULTURAL
    {
      name: 'Candi Borobudur',
      city: 'Magelang',
      province: 'Jawa Tengah',
      category: 'Temple',
      description: 'Candi Buddha terbesar di dunia, warisan budaya UNESCO dengan arsitektur yang megah. Dibangun pada abad ke-9 dengan 2.672 relief dan 504 arca Buddha. Sunrise view dari puncak candi sangat menakjubkan. Best visited early morning (05:30) for sunrise experience.',
      image: 'https://images.unsplash.com/photo-1555993536-7e5ce6b87700?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1555993536-7e5ce6b87700?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ],
      rating: 4.9,
      priceRange: 'moderate',
      coordinates: { lat: -7.6079, lng: 110.2038 },
      address: 'Borobudur, Magelang, Jawa Tengah (Near Jawa Timur border)',
      openingHours: '06:00 - 17:00',
      contact: '+62 293-788266',
      website: 'https://borobudurpark.com',
      featured: true,
    },
    {
      name: 'Candi Singosari',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Temple',
      description: 'Candi Hindu-Buddha peninggalan Kerajaan Singosari dari abad ke-13. Terdapat beberapa candi di kompleks ini dengan arsitektur yang unik. Lokasi strategis di pusat kota Malang, mudah dijangkau. Cocok untuk wisata sejarah dan budaya.',
      image: 'https://images.unsplash.com/photo-1555993536-7e5ce6b87700?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1555993536-7e5ce6b87700?w=800&h=600&fit=crop'
      ],
      rating: 4.2,
      priceRange: 'budget',
      coordinates: { lat: -7.8925, lng: 112.6653 },
      address: 'Jalan Kertanegara, Desa Candirenggo, Kecamatan Singosari, Malang, Jawa Timur',
      openingHours: '07:00 - 17:00',
      contact: '+62 341-362123',
      featured: false,
    },
    
    // PARKS & RECREATION
    {
      name: 'Taman Safari Prigen',
      city: 'Pasuruan',
      province: 'Jawa Timur',
      category: 'Park',
      description: 'Taman safari dengan berbagai satwa liar. Pengalaman melihat hewan dari dekat dengan kendaraan. Terdapat berbagai wahana seperti baby zoo, bird aviary, dan show satwa. Cocok untuk keluarga dengan anak-anak. Fasilitas lengkap termasuk restoran dan penginapan.',
      image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=800&h=600&fit=crop'
      ],
      rating: 4.6,
      priceRange: 'moderate',
      coordinates: { lat: -7.7000, lng: 112.7000 },
      address: 'Jalan Raya Prigen, Kecamatan Prigen, Pasuruan, Jawa Timur',
      openingHours: '08:00 - 17:00',
      contact: '+62 343-674000',
      website: 'https://tamansafari.com',
      featured: true,
      disabledFriendly: true,
      accessibilityFeatures: {
        wheelchairAccessible: true,
        accessibleParking: true,
        accessibleRestrooms: true,
        audioGuide: true,
        signLanguage: false,
        accessiblePaths: true,
      },
    },
    {
      name: 'Taman Bungkul',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'Park',
      description: 'Taman urban populer di Surabaya dengan jogging track dan fasilitas rekreasi. Taman yang hijau dan asri di tengah kota. Cocok untuk olahraga pagi, piknik keluarga, dan acara komunitas. Terdapat area bermain anak dan food court.',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop'
      ],
      rating: 4.5,
      priceRange: 'budget',
      coordinates: { lat: -7.2897, lng: 112.7385 },
      address: 'Jalan Raya Darmo, Surabaya, Jawa Timur',
      openingHours: '05:00 - 22:00',
      contact: '+62 31-5341234',
      featured: false,
    },
    
    // MUSEUMS
    {
      name: 'Museum Brawijaya',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Museum',
      description: 'Museum yang menyimpan koleksi sejarah perjuangan kemerdekaan Indonesia, khususnya di Jawa Timur. Terdapat berbagai artefak sejarah, senjata, dan dokumentasi perjuangan. Cocok untuk wisata edukasi dan sejarah. Lokasi strategis di pusat kota Malang.',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'
      ],
      rating: 4.3,
      priceRange: 'budget',
      coordinates: { lat: -7.9797, lng: 112.6304 },
      address: 'Jalan Ijen, Malang, Jawa Timur',
      openingHours: '08:00 - 15:00 (Closed on Monday)',
      contact: '+62 341-362123',
      featured: false,
    },
    {
      name: 'Museum House of Sampoerna',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'Museum',
      description: 'Museum yang menampilkan sejarah industri rokok di Indonesia dengan arsitektur kolonial yang indah. Terdapat pabrik rokok yang masih aktif dan galeri seni. Cocok untuk wisata sejarah dan budaya. Free admission dengan tour guide.',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'
      ],
      rating: 4.4,
      priceRange: 'budget',
      coordinates: { lat: -7.2458, lng: 112.7378 },
      address: 'Jalan Taman Sampoerna, Surabaya, Jawa Timur',
      openingHours: '09:00 - 22:00',
      contact: '+62 31-3539000',
      website: 'https://houseofsampoerna.museum',
      featured: false,
      disabledFriendly: true,
      accessibilityFeatures: {
        wheelchairAccessible: true,
        accessibleParking: true,
        accessibleRestrooms: true,
        audioGuide: true,
        signLanguage: false,
        accessiblePaths: true,
        elevator: true,
      },
    },
    
    // ADDITIONAL DESTINATIONS
    {
      name: 'Jatim Park 1',
      city: 'Batu',
      province: 'Jawa Timur',
      category: 'Park',
      description: 'Taman rekreasi dan edukasi terbesar di Jawa Timur dengan berbagai wahana dan atraksi. Terdapat museum satwa, science center, dan berbagai wahana permainan. Cocok untuk keluarga dengan anak-anak. Fasilitas lengkap termasuk hotel dan restoran.',
      image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&h=600&fit=crop'
      ],
      rating: 4.7,
      priceRange: 'moderate',
      coordinates: { lat: -7.8833, lng: 112.5333 },
      address: 'Jalan Kartika, Batu, Jawa Timur',
      openingHours: '08:00 - 17:00',
      contact: '+62 341-597777',
      website: 'https://jatimpark.com',
      featured: true,
      disabledFriendly: true,
      accessibilityFeatures: {
        wheelchairAccessible: true,
        accessibleParking: true,
        accessibleRestrooms: true,
        audioGuide: false,
        signLanguage: false,
        accessiblePaths: true,
        elevator: true,
        accessibleShuttle: true,
      },
    },
    {
      name: 'Selecta Recreation Park',
      city: 'Batu',
      province: 'Jawa Timur',
      category: 'Park',
      description: 'Taman rekreasi dengan pemandangan gunung dan bunga yang indah. Terdapat berbagai wahana seperti sky bike, flying fox, dan kolam renang. Cocok untuk keluarga dan pasangan. Suasana sejuk dengan pemandangan alam yang menenangkan.',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop'
      ],
      rating: 4.5,
      priceRange: 'moderate',
      coordinates: { lat: -7.8667, lng: 112.5167 },
      address: 'Desa Tulungrejo, Kecamatan Bumiaji, Batu, Jawa Timur',
      openingHours: '08:00 - 17:00',
      contact: '+62 341-591035',
      featured: false,
    },
    {
      name: 'Coban Rais',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Nature',
      description: 'Air terjun dengan ketinggian 25 meter yang dikelilingi hutan pinus. Suasana sejuk dan asri dengan berbagai fasilitas wisata. Cocok untuk keluarga dengan area piknik dan outbound. Terdapat berbagai wahana seperti flying fox dan paintball.',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
      ],
      rating: 4.4,
      priceRange: 'moderate',
      coordinates: { lat: -7.9333, lng: 112.5833 },
      address: 'Desa Pandansari, Kecamatan Pujon, Malang, Jawa Timur',
      openingHours: '07:00 - 17:00',
      contact: '+62 341-362123',
      featured: false,
    },
  ];

  // Create destinations
  console.log('📍 Creating destinations...');
  const createdDestinations = [];
  for (const dest of destinations) {
    try {
      // Try to find existing destination by name (name is unique in schema)
      const existing = await prisma.destination.findFirst({
        where: { name: dest.name },
      });
      
      const created = existing
        ? await prisma.destination.update({
            where: { id: existing.id },
            data: dest,
          })
        : await prisma.destination.create({
            data: dest,
          });
      
      createdDestinations.push(created);
    } catch (error) {
      console.error(`Error creating destination ${dest.name}:`, error);
    }
  }
  console.log(`✅ Created/Updated ${createdDestinations.length} destinations`);

  // Create sample reviews for destinations
  console.log('💬 Creating sample reviews...');
  const reviewData = [
    { destinationName: 'Gunung Bromo', rating: 5, comment: 'Sunrise view yang sangat menakjubkan! Worth it untuk bangun pagi buta.' },
    { destinationName: 'Gunung Bromo', rating: 4, comment: 'Pemandangan kawah yang spektakuler. Cuaca dingin, bawa jaket tebal.' },
    { destinationName: 'Kawah Ijen', rating: 5, comment: 'Blue fire phenomenon sangat unik! Pengalaman yang tidak terlupakan.' },
    { destinationName: 'Pantai Klayar', rating: 4, comment: 'Pantai yang indah dengan formasi batu karang yang unik. Cocok untuk fotografi.' },
    { destinationName: 'Air Terjun Tumpak Sewu', rating: 5, comment: 'Air terjun yang sangat indah! Trekking sedikit menantang tapi worth it.' },
    { destinationName: 'Candi Borobudur', rating: 5, comment: 'Warisan budaya yang luar biasa. Sunrise view dari puncak sangat menakjubkan.' },
    { destinationName: 'Jatim Park 1', rating: 4, comment: 'Taman rekreasi yang lengkap. Cocok untuk keluarga dengan anak-anak.' },
  ];

  // Create sample user first
  console.log('👤 Creating/updating sample user...');
  const demoPassword = 'demo123';
  const hashedPassword = await bcrypt.hash(demoPassword, 10);
  
  const sampleUser = await prisma.user.upsert({
    where: { email: 'demo@jatour.com' },
    update: {
      password: hashedPassword,
      fullName: 'Demo User',
      phone: '+6281234567890',
      preferences: {
        language: 'id',
        notifications: true,
        theme: 'light',
      },
    },
    create: {
      email: 'demo@jatour.com',
      password: hashedPassword,
      fullName: 'Demo User',
      phone: '+6281234567890',
      preferences: {
        language: 'id',
        notifications: true,
        theme: 'light',
      },
    },
  });
  console.log('✅ Created/updated sample user:', sampleUser.email);
  console.log('   📧 Email: demo@jatour.com');
  console.log('   🔑 Password: demo123');

  // Create reviews
  for (const review of reviewData) {
    const destination = createdDestinations.find(d => d.name === review.destinationName);
    if (destination) {
      await prisma.review.upsert({
        where: {
          userId_destinationId: {
            userId: sampleUser.id,
            destinationId: destination.id,
          },
        },
        update: {
          rating: review.rating,
          comment: review.comment,
        },
        create: {
          userId: sampleUser.id,
          destinationId: destination.id,
          rating: review.rating,
          comment: review.comment,
        },
      });
    }
  }
  console.log(`✅ Created ${reviewData.length} sample reviews`);

  // Update destination ratings based on reviews
  for (const dest of createdDestinations) {
    const reviews = await prisma.review.findMany({
      where: { destinationId: dest.id },
      select: { rating: true },
    });
    
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await prisma.destination.update({
        where: { id: dest.id },
        data: { rating: Math.round(avgRating * 10) / 10 },
      });
    }
  }
  console.log('✅ Updated destination ratings from reviews');

  console.log('🎉 Seed completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - ${createdDestinations.length} destinations`);
  console.log(`   - ${reviewData.length} reviews`);
  console.log(`   - 1 sample user (demo@jatour.com / demo123)`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
