/// <reference types="@prisma/client" />
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// dotenv will be loaded by ts-node via -r dotenv/config flag

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  // Create Currency data first (no dependencies)
  console.log('💱 Creating currency data...');
  const currencies = [
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', rateToUSD: 1, isActive: true },
    { code: 'USD', name: 'US Dollar', symbol: '$', rateToUSD: 1, isActive: true },
    { code: 'EUR', name: 'Euro', symbol: '€', rateToUSD: 1.1, isActive: true },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rateToUSD: 0.74, isActive: true },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', rateToUSD: 0.22, isActive: true },
  ];

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: currency,
      create: currency,
    });
  }

  // Create Forum Categories (no dependencies)
  console.log('📝 Creating forum categories...');
  const forumCategories = [
    { name: 'Destinations', slug: 'destinations', description: 'Discuss destinations in East Java', icon: '📍', color: '#3B82F6', isActive: true, order: 1 },
    { name: 'Travel Tips', slug: 'travel-tips', description: 'Share travel tips and advice', icon: '💡', color: '#10B981', isActive: true, order: 2 },
    { name: 'Transportation', slug: 'transportation', description: 'Transportation options and advice', icon: '🚗', color: '#F59E0B', isActive: true, order: 3 },
    { name: 'Accommodation', slug: 'accommodation', description: 'Hotels, hostels, and accommodations', icon: '🏨', color: '#8B5CF6', isActive: true, order: 4 },
    { name: 'Food & Dining', slug: 'food-dining', description: 'Local cuisine and restaurant recommendations', icon: '🍜', color: '#EF4444', isActive: true, order: 5 },
    { name: 'Budget Travel', slug: 'budget-travel', description: 'Budget-friendly travel tips', icon: '💰', color: '#059669', isActive: true, order: 6 },
    { name: 'Adventure & Hiking', slug: 'adventure-hiking', description: 'Hiking and adventure activities', icon: '🥾', color: '#DC2626', isActive: true, order: 7 },
    { name: 'General Discussion', slug: 'general', description: 'General travel discussions', icon: '💬', color: '#6B7280', isActive: true, order: 8 },
  ];

  await Promise.all(
    forumCategories.map(category =>
      prisma.forumCategory.upsert({
        where: { slug: category.slug },
        update: category,
        create: category,
      })
    )
  );

  // Get the created categories for reference
  const categories = await prisma.forumCategory.findMany();
  console.log('📝 Forum Categories created:', categories.map(c => `${c.name}: ${c.id}`));

  // Comprehensive East Java Destinations (80+ locations)
  console.log('📍 Creating East Java destinations...');
  const destinations = [
    // MOUNTAINS & VOLCANOES
    {
      name: 'Gunung Bromo',
      city: 'Probolinggo',
      province: 'Jawa Timur',
      category: 'Mountain',
      description: 'Gunung Bromo adalah gunung berapi aktif yang terkenal dengan pemandangan sunrise yang menakjubkan. Destinasi wisata populer di Jawa Timur dengan kawah yang masih aktif. Pengunjung dapat menikmati pemandangan lautan pasir, kawah yang mengeluarkan asap, dan sunrise yang spektakuler dari Penanjakan.',
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
    },
    {
      name: 'Pantai Klayar',
      city: 'Pacitan',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai dengan formasi batu karang yang unik dan pemandangan yang menakjubkan. Cocok untuk fotografi dan menikmati sunset. Terkenal dengan "Semburan Air" (sea fountain) yang menyembur dari celah batu karang.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop'
      ],
      rating: 4.6,
      priceRange: 'budget',
      coordinates: { lat: -8.2553, lng: 111.2461 },
      address: 'Desa Klayar, Kecamatan Donorojo, Pacitan, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 357-881015',
      featured: true,
    }
  ];

  // Create destinations
  const createdDestinations = [];
  for (const dest of destinations) {
    try {
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

  // Create sample users
  console.log('👤 Creating sample users...');
  const users = [
    {
      email: 'demo@jatour.com',
      password: await bcrypt.hash('demo123', 10),
      fullName: 'Demo User',
      phone: '+6281234567890',
      preferences: {
        language: 'id',
        notifications: true,
        theme: 'light',
      },
    },
    {
      email: 'traveler@jatour.com',
      password: await bcrypt.hash('traveler123', 10),
      fullName: 'Sarah Traveler',
      phone: '+6281234567891',
      preferences: {
        language: 'en',
        notifications: true,
        theme: 'dark',
      },
    },
    {
      email: 'mountain@jatour.com',
      password: await bcrypt.hash('mountain123', 10),
      fullName: 'Agus Mountaineer',
      phone: '+6281234567892',
      preferences: {
        language: 'id',
        notifications: false,
        theme: 'light',
      },
    },
  ];

  const createdUsers = await Promise.all(
    users.map(user =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {
          password: user.password,
          fullName: user.fullName,
          phone: user.phone,
          preferences: user.preferences,
        },
        create: user,
      })
    )
  );
  console.log(`✅ Created/Updated ${createdUsers.length} users`);

  // Create Transportation data
  console.log('🚌 Creating transportation data...');
  const transportations = [
    {
      type: 'bus',
      provider: 'Putra Remaja',
      route: 'Surabaya-Malang',
      schedule: {
        departureTime: '06:00',
        arrivalTime: '08:30',
        duration: '2h 30m',
        frequency: 'Every 30 minutes',
      },
      pricing: {
        economy: 45000,
        business: 75000,
      },
      availability: {
        seatsAvailable: 30,
        bookedSeats: 15,
      },
      bookingUrl: 'https://booking.example.com/bus/surabaya-malang',
      status: 'active',
    }
  ];

  const createdTransportations = await Promise.all(
    transportations.map(t => prisma.transportation.create({ data: t }))
  );
  console.log(`✅ Created ${createdTransportations.length} transportation options`);

  // Create sample forum topics
  console.log('📝 Creating forum topics...');
  const forumTopics = [
    {
      title: 'Tips Mendaki Gunung Bromo untuk Pemula',
      slug: 'tips-mendaki-gunung-bromo-untuk-pemula',
      content: 'Halo semua, saya baru pertama kali mau mendaki Gunung Bromo. Ada yang bisa sharing tips-tipsnya? Apa aja yang perlu disiapkan? thanks!',
      userId: createdUsers[2].id, // mountain@jatour.com
      categoryId: categories.find(c => c.slug === 'destinations')?.id || '',
      tags: ['gunung-bromo', 'mendaki', 'tips'],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      title: 'Rekomendasi Kuliner Malang yang Enak',
      slug: 'rekomendasi-kuliner-malang-yang-enak',
      content: 'Lagi di Malang nih guys! Boleh sharing rekomendasi tempat makan yang wajib dicoba? Baik makanan tradisional maupun modern. Makasih!',
      userId: createdUsers[1].id, // traveler@jatour.com
      categoryId: categories.find(c => c.slug === 'food-dining')?.id || '',
      tags: ['malang', 'kuliner', 'rekomendasi'],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      title: 'Budget Traveling di East Java - Share Your Tips!',
      slug: 'budget-traveling-east-java-tips',
      content: 'B lagi planning budget traveling ke East Java. Ada yang punya tips hemat untuk住宿, транспорт, dan makan? Share dong ya!',
      userId: createdUsers[0].id, // demo@jatour.com
      categoryId: categories.find(c => c.slug === 'budget-travel')?.id || '',
      tags: ['budget-travel', 'east-java', 'tips'],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  ];

  const createdTopics = await Promise.all(
    forumTopics.map(topic =>
      prisma.forumTopic.upsert({
        where: { slug: topic.slug },
        update: topic,
        create: topic,
      })
    )
  );
  console.log(`✅ Created ${createdTopics.length} forum topics`);

  console.log('🎉 Comprehensive seed completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - ${createdDestinations.length} destinations`);
  console.log(`   - ${createdUsers.length} users`);
  console.log(`   - ${createdTransportations.length} transportation options`);
  console.log(`   - ${createdTopics.length} forum topics`);
  console.log(`   - Sample users: demo@jatour.com / demo123, traveler@jatour.com / traveler123, mountain@jatour.com / mountain123`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
