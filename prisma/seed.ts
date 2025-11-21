import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// dotenv will be loaded by ts-node via -r dotenv/config flag

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  // Create Currency data first (no dependencies)
  console.log('💱 Creating currency data...');
  const currencies = [
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', rateToUSD: 1, isActive: true },
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', rateToUSD: 1, isActive: true },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rateToUSD: 1.1, isActive: true },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', rateToUSD: 0.74, isActive: true },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', rateToUSD: 0.22, isActive: true },
    { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', rateToUSD: 0.029, isActive: true },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', rateToUSD: 0.67, isActive: true },
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
    { name: 'Photography', slug: 'photography', description: 'Share travel photos and photography tips', icon: '📸', color: '#7C3AED', isActive: true, order: 8 },
    { name: 'General Discussion', slug: 'general', description: 'General travel discussions', icon: '💬', color: '#6B7280', isActive: true, order: 9 },
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

  // Massive East Java Destinations Database (100+ locations)
  console.log('📍 Creating massive East Java destinations database...');
  const destinations = [
    // MOUNTAINS & VOLCANOES
    {
      name: 'Gunung Bromo',
      city: 'Probolinggo',
      province: 'Jawa Timur',
      category: 'Mountain',
      description: 'Gunung Bromo adalah gunung berapi aktif yang terkenal dengan pemandangan sunrise yang menakjubkan. Destinasi wisata populer di Jawa Timur dengan kawah yang masih aktif. Pengunjung dapat menikmati pemandangan lautan pasir, kawah yang mengeluarkan asap, dan sunrise yang spektakuler dari Penanjakan.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=600&fit=crop'
      ]),
      rating: 4.8,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.9425, lng: 112.9530 }),
      address: 'Taman Nasional Bromo Tengger Semeru, Desa Ngadisari, Sukapura, Probolinggo, Jawa Timur',
      openingHours: '24 hours (Best time: 03:00 - 10:00 for sunrise)',
      contact: '+62 335-541193',
      website: 'https://bromotenggersemeru.org',
      featured: true,
    },
    {
      name: 'Gunung Semeru',
      city: 'Lumajang',
      province: 'Jawa Timur',
      category: 'Mountain',
      description: 'Gunung tertinggi di Pulau Jawa dengan ketinggian 3.676 mdpl. Menawarkan tantangan pendakian terbaik dan pemandangan alam yang spektakuler. Jalur pendakian via Ranu Pani adalah yang paling populer.',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
      ]),
      rating: 4.7,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -8.1080, lng: 112.9219 }),
      address: 'Taman Nasional Bromo Tengger Semeru, Lumajang, Jawa Timur',
      openingHours: '06:00 - 18:00 (Pendakian: 24 jam)',
      contact: '+62 334-881193',
      website: 'https://bromotenggersemeru.org',
      featured: true,
    },
    {
      name: 'Gunung Arjuno',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Mountain',
      description: 'Gunung Arjuno menawarkan jalur pendakian yang challenging dengan pemandangan hijau yang asri. Dikenal sebagai "Mountain of Three Lakes" karena terdapat tiga danau di puncaknya: Ranu Kunir, Ranu Lamat, dan Ranu Tengah.',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
      ]),
      rating: 4.6,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.7333, lng: 112.5833 }),
      address: 'Desa Oro-Oro Ombo, Batu, Malang, Jawa Timur',
      openingHours: '24 hours (Best hiking: 06:00 - 16:00)',
      contact: '+62 341-591111',
      featured: false,
    },
    {
      name: 'Gunung Welirang',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Mountain',
      description: 'Gunung Welirang terkenal dengan jalur pendakian yang mudah diakses dan pemandangan kawahnya yang indah. Terhubung dengan Gunung Arjuno melalui jalur ridge yang menuntut adventure.',
      image: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.7000, lng: 112.6000 }),
      address: 'Desa Oro-Oro Ombo, Batu, Malang, Jawa Timur',
      openingHours: '24 hours (Best hiking: 06:00 - 16:00)',
      contact: '+62 341-591111',
      featured: false,
    },

    // BEACHES
    {
      name: 'Pantai Klayar',
      city: 'Pacitan',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai dengan formasi batu karang yang unik dan pemandangan yang menakjubkan. Cocok untuk fotografi dan menikmati sunset. Terkenal dengan "Semburan Air" (sea fountain) yang menyembur dari celah batu karang.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop'
      ]),
      rating: 4.6,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.2553, lng: 111.2461 }),
      address: 'Desa Klayar, Kecamatan Donorojo, Pacitan, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 357-881015',
      featured: true,
    },
    {
      name: 'Pantai Balekambang',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai Balekambang adalah pantai berpasir putih dengan air jernih dan pemandangan indah. Dikenal dengan pulau karang di tengahnya yang membentukformasi seperti jembatan alami.',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.4089, lng: 112.5300 }),
      address: 'Desa Sisir, Kecamatan Balekambang, Malang, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 341-891234',
      featured: false,
    },
    {
      name: 'Pantai Carita',
      city: 'Probolinggo',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai Carita menawarkan keindahan alam dengan latar belakang Pegunungan Bromo. Cocok untuk aktivitas beach sports dan menikmati sunset di atas kapal.',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.8833, lng: 113.2167 }),
      address: 'Desa Carita, Kecamatan Carita, Probolinggo, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 335-412345',
      featured: false,
    },
    {
      name: 'Pantai Plengkung (G-Land)',
      city: 'Gresik',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'G-Land adalah surga surfing dunia dengan wave konsisten yang menarik peselancar internasional. Terletak di wilayah konservasi taman nasional dengan pemandangan hutan tropis yang indah.',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop'
      ]),
      rating: 4.7,
      priceRange: 'luxury',
      coordinates: JSON.stringify({ lat: -7.2167, lng: 112.4500 }),
      address: 'Desapringin, Kec. Panceng, Ujung Pangkah, Gresik, Jawa Timur',
      openingHours: '24 hours',
      contact: '+62 31-3981234',
      website: 'https://glandresort.com',
      featured: true,
    },

    // TEMPLES
    {
      name: 'Candi Penataran',
      city: 'Blitar',
      province: 'Jawa Timur',
      category: 'Temple',
      description: 'Candi Hindu tertua di Jawa Timur dengan arsitektur yang megah dan relief yang indah. Dibangun pada masa Kerajaan Kahuripan dan menjadi saksi bisu peradaban Hindu di Jawa.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.0833, lng: 112.2167 }),
      address: 'Desa Penataran, Kecamatan Nglegok, Blitar, Jawa Timur',
      openingHours: '06:00 - 17:00',
      contact: '+62 342-891234',
      featured: false,
    },
    {
      name: 'Candi Jago',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Temple',
      description: 'Candi Jago adalah candi Hindu yang dibangun pada abad ke-13. Terkenal dengan relief yang menggambarkan cerita Ramayana dan arsitektur yang khas Jawa Timur.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.2500, lng: 112.6333 }),
      address: 'Desa Jago, Kecamatan Wadak, Malang, Jawa Timur',
      openingHours: '06:00 - 17:00',
      contact: '+62 341-567890',
      featured: false,
    },
    {
      name: 'Candi Badut',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Temple',
      description: 'Candi Badut adalah candi Hindu kecil yang unik dengan relief yang aneh dan menarik. Terletak di tengah-tengah kawasan permukiman.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.9667, lng: 112.6333 }),
      address: 'Kelurahan Bunul, Kecamatan Blimbing, Malang, Jawa Timur',
      openingHours: '06:00 - 17:00',
      contact: '+62 341-451234',
      featured: false,
    },
    {
      name: 'Candi Sumberawan',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Temple',
      description: 'Candi Sumberawan adalah candi Hindu kecil yang terletak di tepi danau. Dikenal dengan suasana yang tenang dan damai.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.8833, lng: 112.6333 }),
      address: 'Kelurahan Tlogomas, Malang, Jawa Timur',
      openingHours: '06:00 - 17:00',
      contact: '+62 341-461234',
      featured: false,
    },

    // CITIES & CULTURAL SITES
    {
      name: 'Kota Malang',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'City',
      description: 'Kota Malang adalah kota terbesar kedua di Jawa Timur. Dikenal dengan clima sejuk, arsitektur kolonial yang indah, dan sebagai pusat pendidikan. Terletak di dataran tinggi dengan ketinggian 400-667 mdpl.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop'
      ]),
      rating: 4.6,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.9667, lng: 112.6333 }),
      address: 'Kota Malang, Jawa Timur',
      openingHours: '24 hours',
      contact: '+62 341-361234',
      website: 'https://malangkota.go.id',
      featured: true,
    },
    {
      name: 'Kota Surabaya',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'City',
      description: 'Kota Pahlawan adalah ibukota Jawa Timur dan kota terbesar kedua di Indonesia. Pusat bisnis, perdagangan, dan transportasi. Memiliki berbagai tempat wisata menarik seperti Tugu Pahlawan dan Cheng Hoo Mosque.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.2575, lng: 112.7521 }),
      address: 'Kota Surabaya, Jawa Timur',
      openingHours: '24 hours',
      contact: '+62 31-5312345',
      website: 'https://surabaya.go.id',
      featured: true,
    },
    {
      name: 'Kota Batu',
      city: 'Batu',
      province: 'Jawa Timur',
      category: 'City',
      description: 'Kota Batu adalah kota wisata cooler di Jawa Timur dengan iklim sejuk pegunungan. Dikenal dengan kebun apel, tema park, dan tempat wisata keluarga.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop'
      ]),
      rating: 4.6,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.8667, lng: 112.5167 }),
      address: 'Kota Batu, Jawa Timur',
      openingHours: '24 hours',
      contact: '+62 341-591234',
      website: 'https://batukota.go.id',
      featured: true,
    },
    {
      name: 'Museum Bung Karno',
      city: 'Blitar',
      province: 'Jawa Timur',
      category: 'Museum',
      description: 'Museum Bung Karno adalah museum yang menampilkan memorabilia dan kehidupan Presiden Pertama Indonesia. TerLocated di rumah masa kecil Bung Karno.',
      image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.2167, lng: 112.1667 }),
      address: 'Jl. Hasanuddin 150, Bendogerit, Sananwetan, Blitar, Jawa Timur',
      openingHours: '08:00 - 16:00 (Senin-Tutup)',
      contact: '+62 342-801234',
      featured: false,
    },
    {
      name: 'Tugu Pahlawan',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'Monument',
      description: 'Tugu Pahlawan adalah monument peringatan pertempuran 10 November 1945. Terbentuk seperti lingga dengan monumen di atasnya, melambangkan heroic struggle.',
      image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop'
      ]),
      rating: 4.6,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2459, lng: 112.7379 }),
      address: 'Alun-Alun Contong, Bubutan, Surabaya, Jawa Timur',
      openingHours: '08:00 - 17:00',
      contact: '+62 31-5612345',
      featured: false,
    },

    // WATERFALLS
    {
      name: 'Air Terjun Coban Rondo',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Waterfall',
      description: 'Air Terjun Coban Rondo adalah air terjun tertinggi di Malang dengan ketinggian 84 meter. Surrounded oleh hutan pinus yang rindang dan jalur tracking yang menantang.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.7,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.0000, lng: 112.5833 }),
      address: 'Desa Jurang Kalianyar, Kec. Poncokusumo, Malang, Jawa Timur',
      openingHours: '07:00 - 17:00',
      contact: '+62 341-511234',
      featured: true,
    },
    {
      name: 'Air Terjun Madakaripura',
      city: 'Probolinggo',
      province: 'Jawa Timur',
      category: 'Waterfall',
      description: 'Air Terjun Madakaripura adalah air jatuh tertinggi kedua di Indonesia dengan ketinggian 200 meter. Dikenal dengan legenda Majapahit tentang Gajah Mada.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.8,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.9167, lng: 112.8833 }),
      address: 'Desa Sapikerep, Kec. Lumbang, Probolinggo, Jawa Timur',
      openingHours: '08:00 - 16:00',
      contact: '+62 335-421234',
      featured: true,
    },
    {
      name: 'Air Terjun Coban Rais',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Waterfall',
      description: 'Air Terjun Coban Rais menawarkan keindahan alam dengan air jatuh yang menjorok ke atas. Lokasi yang instagramable dan mudah diakses.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.0500, lng: 112.5333 }),
      address: 'Desa Tlogorejo, Kec. Gedangan, Malang, Jawa Timur',
      openingHours: '08:00 - 16:00',
      contact: '+62 341-521234',
      featured: false,
    },

    // LAKES
    {
      name: 'Ranu Pani',
      city: 'Lumajang',
      province: 'Jawa Timur',
      category: 'Lake',
      description: 'Ranu Pani adalah danau kawah di kaki Gunung Semeru. Base camp utama untuk pendakian Semeru dengan pemandangan gunung tertinggi di Jawa.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.8,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.1080, lng: 112.9219 }),
      address: 'Desa Ranu Pani, Kec. Senduro, Lumajang, Jawa Timur',
      openingHours: '24 hours',
      contact: '+62 334-851234',
      featured: true,
    },
    {
      name: 'Ranu Kumbolo',
      city: 'Lumajang',
      province: 'Jawa Timur',
      category: 'Lake',
      description: 'Ranu Kumbolo adalah danau indah di tengah hutan Dataran Tinggi Dieng. Objek wisata populer dengan pemandangan alam yang menawan.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.6,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2000, lng: 109.8833 }),
      address: 'Dataran Tinggi Dieng, Lumajang, Jawa Timur',
      openingHours: '06:00 - 17:00',
      contact: '+62 334-881234',
      featured: false,
    },

    // NATURE PARKS
    {
      name: 'Taman Nasional Bromo Tengger Semeru',
      city: 'Probolinggo',
      province: 'Jawa Timur',
      category: 'National Park',
      description: 'Taman Nasional Bromo Tengger Semeru adalah taman nasional tertua di Indonesia Timur. Rumah bagi tiga gunung berapi aktif: Bromo, Semeru, dan Batok.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=600&fit=crop'
      ]),
      rating: 4.9,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -8.0000, lng: 112.9000 }),
      address: 'Probolinggo - Lumajang, Jawa Timur',
      openingHours: '24 hours (Park office: 07:00 - 17:00)',
      contact: '+62 335-541193',
      website: 'https://bromotenggersemeru.org',
      featured: true,
    },
    {
      name: 'Taman Nasional Baluran',
      city: 'Situbondo',
      province: 'Jawa Timur',
      category: 'National Park',
      description: 'Taman Nasional Baluran adalah Savana Africa di Jawa Timur. Dikenal dengan satwa liar seperti banteng, rusa, dan berbagai jenis burung.',
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.8500, lng: 114.0500 }),
      address: 'Desa Wonorejo, Kec. Banyuputih, Situbondo, Jawa Timur',
      openingHours: '07:00 - 17:00',
      contact: '+62 338-421234',
      featured: false,
    },
    {
      name: 'Taman Nasional Meru Betiri',
      city: 'Jember',
      province: 'Jawa Timur',
      category: 'National Park',
      description: 'Taman Nasional Meru Betiri adalah kawasan konservasi dengan pantai terpencil dan hutan tropis. tempat berkembang biak penyu dan beragam satwa.',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.4500, lng: 113.5333 }),
      address: 'Desa Sarongan, Kec. Pesanggaran, Jember, Jawa Timur',
      openingHours: '07:00 - 17:00',
      contact: '+62 331-481234',
      featured: false,
    },

    // CULTURAL & TRADITIONAL
    {
      name: 'Alun-Alun Malang',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Cultural',
      description: 'Alun-Alun Malang adalah pusat kota dengan arsitektur kolonial yang indah. Tempat rekreasi keluarga dengan kuliner tradisional Jawa.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.9667, lng: 112.6333 }),
      address: 'Kota Malang, Jawa Timur',
      openingHours: '24 hours',
      contact: '+62 341-361234',
      featured: false,
    },
    {
      name: 'Jatim Park 1',
      city: 'Batu',
      province: 'Jawa Timur',
      category: 'Theme Park',
      description: 'Jatim Park 1 adalah theme park dengan berbagai wahana seru cocok untuk keluarga. Memiliki museum satwa dan educational centre.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.8833, lng: 112.5167 }),
      address: 'Jl. Kartika No. 2, Kota Batu, Jawa Timur',
      openingHours: '09:00 - 17:00',
      contact: '+62 341-598234',
      website: 'https://jatimpark.com',
      featured: false,
    },
    {
      name: 'Jatim Park 2',
      city: 'Batu',
      province: 'Jawa Timur',
      category: 'Theme Park',
      description: 'Jatim Park 2 adalah theme park dengan fokus edukatif dan scientific. Memiliki Planetarium, Laboratorium, dan berbagai wahana science.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.6,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.8833, lng: 112.5167 }),
      address: 'Jl. Kartika No. 2, Kota Batu, Jawa Timur',
      openingHours: '09:00 - 17:00',
      contact: '+62 341-598234',
      website: 'https://jatimpark.com',
      featured: false,
    },
    {
      name: 'Batu Secret Zoo',
      city: 'Batu',
      province: 'Jawa Timur',
      category: 'Zoo',
      description: 'Batu Secret Zoo adalah kebun-binatang dengan konsep modern dan interaktif. memiliki berbagai satwa exotic dan show performance.',
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.8833, lng: 112.5167 }),
      address: 'Jl.熊猫园, Kota Batu, Jawa Timur',
      openingHours: '09:00 - 17:00',
      contact: '+62 341-598234',
      website: 'https://batuzoo.com',
      featured: false,
    },

    // FOOD & SHOPPING
    {
      name: 'Pasar Induk Malang',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Market',
      description: 'Pasar Induk Malang adalah pasar tradisional terbesar di Malang. Menjual berbagai bahan makanan, buah-buahan, dan oleh-oleh khas Malang.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.9833, lng: 112.6333 }),
      address: 'Jl. pasar Induk, Kota Malang, Jawa Timur',
      openingHours: '04:00 - 18:00',
      contact: '+62 341-351234',
      featured: false,
    },
    {
      name: 'Floating Market Lembang',
      city: 'Batu',
      province: 'Jawa Timur',
      category: 'Market',
      description: 'Floating Market Lembang adalah pasar terapung dengan konsep unik. Menjual berbagai makanan dan minuman khas dari booth boat.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.9000, lng: 112.5000 }),
      address: 'Desa Lembang, Kota Batu, Jawa Timur',
      openingHours: '08:00 - 20:00',
      contact: '+62 341-581234',
      website: 'https://floatingmarket.co.id',
      featured: false,
    },
    {
      name: 'Town Square Malang',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Shopping',
      description: 'Town Square Malang adalah pusat perbelanjaan modern dengan berbagai brand dan restoran. Cocok untuk shopping dan entertainment.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.9667, lng: 112.6333 }),
      address: 'Jl. town Square No. 1, Kota Malang, Jawa Timur',
      openingHours: '10:00 - 22:00',
      contact: '+62 341-361234',
      website: 'https://townsquare-malang.com',
      featured: false,
    },

    // ADDITIONAL BEACHES
    {
      name: 'Pantai Parangtritis',
      city: 'Pacitan',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai Parangtritis adalah pantai berpasir hitam dengan ombak besar yang cocok untuk surfing. Pemandangan sunset yang indah.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.4000, lng: 111.1000 }),
      address: 'Desa parangtritis, Kec. Kebonag, Pacitan, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 357-891234',
      featured: false,
    },
    {
      name: 'Pantai Ngliyep',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai Ngliyep adalah pantai dengan pemandangan alam yang indah dan konsisten ombak untuk surfing. Terdapat juga fasilitas camping.',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.4167, lng: 112.3667 }),
      address: 'Desa Ngliyep, Kec. DONOMULYO, Malang, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 341-411234',
      featured: false,
    },
    {
      name: 'Pantai Sendang Biru',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai Sendang Biru adalah pelabuhan tradisional dan pantai dengan ikan segar. Dikenal dengan restaurant seafood yang enak.',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.4333, lng: 112.4000 }),
      address: 'Desa Sendang Biru, Kec. Sumber.Manjing, Malang, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 341-421234',
      featured: false,
    },

    // ADDITIONAL MOUNTAINS
    {
      name: 'Gunung Kawi',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Mountain',
      description: 'Gunung Kawi menawarkan jalur pendakian yang challenge dengan pemandangan alam yang indah. terkenal dengan batuan unik.',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.9333, lng: 112.5333 }),
      address: 'Desa Kawi, Kec. Wajak, Malang, Jawa Timur',
      openingHours: '24 hours (Best hiking: 06:00 - 16:00)',
      contact: '+62 341-531234',
      featured: false,
    },
    {
      name: 'Gunung Penanggungan',
      city: 'Mojokerto',
      province: 'Jawa Timur',
      category: 'Mountain',
      description: 'Gunung Penanggungan adalah gunung kecil dengan jalur pendakian yang mudah. terkenal dengan situs purbakala di puncaknya.',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.6667, lng: 112.5000 }),
      address: 'Desa Gedeg, Kec. Gedeg, Mojokerto, Jawa Timur',
      openingHours: '06:00 - 16:00',
      contact: '+62 321-391234',
      featured: false,
    },

    // CAVE SYSTEMS
    {
      name: 'Goa Akbar',
      city: 'Trenggalek',
      province: 'Jawa Timur',
      category: 'Cave',
      description: 'Goa Akbar adalah gua stalaktit dengan formasi bebatuan yang indah. Lokasi spelunking yang menantang dengan pemandangan alam yang menakjubkan.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.2167, lng: 111.7167 }),
      address: 'Desa Pule, Kec. Durenan, Trenggalek, Jawa Timur',
      openingHours: '08:00 - 16:00',
      contact: '+62 355-911234',
      featured: false,
    },
    {
      name: 'Goa Gong',
      city: 'Pacitan',
      province: 'Jawa Timur',
      category: 'Cave',
      description: 'Goa Gong adalah gua stalaktit ketiga terindah di dunia. Formasi stalaktit dan stalagmit yang spektakuler dengan efek suara yang unik.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.7,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -8.1667, lng: 111.1000 }),
      address: 'Desa Bomo, Kec. Punung, Pacitan, Jawa Timur',
      openingHours: '08:00 - 16:00',
      contact: '+62 357-911234',
      featured: true,
    },

    // SPORTS & RECREATION
    {
      name: 'Waterboom Malang',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Water Park',
      description: 'Waterboom Malang adalah waterpark terbesar di Jawa Timur dengan berbagai water slide dan wave pool. tempat favorit keluarga.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.9667, lng: 112.6333 }),
      address: 'Jl. Waterboom No. 1, Kota Malang, Jawa Timur',
      openingHours: '10:00 - 18:00',
      contact: '+62 341-371234',
      featured: false,
    },
    {
      name: 'Batu City Park',
      city: 'Batu',
      province: 'Jawa Timur',
      category: 'Park',
      description: 'Batu City Park adalah taman kota dengan fasilitas olahraga dan rekreasi. Cocok untuk jogging dan photo session dengan pemandangan kota.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.8833, lng: 112.5167 }),
      address: 'Kota Batu, Jawa Timur',
      openingHours: '05:00 - 18:00',
      contact: '+62 341-591234',
      featured: false,
    },

    // INDUSTRIAL & MODERN TOURISM
    {
      name: 'Museum Bung Karno Blitar',
      city: 'Blitar',
      province: 'Jawa Timur',
      category: 'Museum',
      description: 'Museum Bung Karno menampilkan kehidupan dan perjuangan Bangsa Pertama RI. TerLocated di rumah masa kecil Bung Karno.',
      image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop'
      ]),
      rating: 4.6,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.2167, lng: 112.1667 }),
      address: 'Jl. Hasanuddin 150, Bendogerit, Sananwetan, Blitar, Jawa Timur',
      openingHours: '08:00 - 16:00 (Senin-Tutup)',
      contact: '+62 342-801234',
      featured: false,
    },
    {
      name: 'Museum Malang Tempo Doeloe',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Museum',
      description: 'Museum Malang Tempo Doeloe menampilkan sejarah dan budaya Malang jaman dulu. koleksi foto dan artefak bersejarah.',
      image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.9667, lng: 112.6333 }),
      address: 'Jl. Keuangan No. 1, Kota Malang, Jawa Timur',
      openingHours: '08:00 - 15:00 (Senin-Tutup)',
      contact: '+62 341-331234',
      featured: false,
    },

    // EXTENDED MOUNTAINS & HILL STATIONS
    {
      name: 'Gunung Kelut',
      city: 'Kediri',
      province: 'Jawa Timur',
      category: 'Mountain',
      description: 'Gunung Kelut adalah gunung berapi yang terkenal dengan danau kawahnya yang indah. Destinasi populer untuk hiking dan фотografi alam.',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.1333, lng: 112.3167 }),
      address: 'Desa Sugihwaras, Kec. Ngancar, Kediri, Jawa Timur',
      openingHours: '06:00 - 17:00',
      contact: '+62 354-551234',
      featured: false,
    },
    {
      name: 'Gunung Lawu',
      city: 'Madiun',
      province: 'Jawa Timur',
      category: 'Mountain',
      description: 'Gunung Lawu adalah destinasi hiking populer dengan pemandangan sunrise yang indah. Jalur pendakian via Cemoro Kandang sangat terkenal.',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.6333, lng: 111.1833 }),
      address: 'Desa Ngargosari, Kec. Saradan, Madiun, Jawa Timur',
      openingHours: '24 hours',
      contact: '+62 351-741234',
      featured: false,
    },
    {
      name: 'Gunung Pandan',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Mountain',
      description: 'Gunung Pandan menawarkan pendakian dengan pemandangan sawah hijau yang luas. Cocok untuk pemula yang ingin mencoba hiking.',
      image: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.1000, lng: 112.6000 }),
      address: 'Desa Pandanwangi, Kec. Dampit, Malang, Jawa Timur',
      openingHours: '06:00 - 16:00',
      contact: '+62 341-441234',
      featured: false,
    },
    {
      name: 'Gunung Anjasmoro',
      city: 'Bojonegoro',
      province: 'Jawa Timur',
      category: 'Mountain',
      description: 'Gunung Anjasmoro adalah gunung hijau dengan jalur pendakian yang asri. Dikenal dengan pemandangan alam yang masih perawan.',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.1167, lng: 111.8833 }),
      address: 'Desa Kedungadem, Kec. Kedungadem, Bojonegoro, Jawa Timur',
      openingHours: '06:00 - 17:00',
      contact: '+62 352-591234',
      featured: false,
    },
    {
      name: 'Gunung Wilis',
      city: 'Nganjuk',
      province: 'Jawa Timur',
      category: 'Mountain',
      description: 'Gunung Wilis adalah destinasi hiking yang menawarkan pemandangan alam yang indah dan udara sejuk pegunungan.',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
      ]),
      rating: 4.1,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.8000, lng: 111.8833 }),
      address: 'Desa Pace, Kec. Pace, Nganjuk, Jawa Timur',
      openingHours: '06:00 - 16:00',
      contact: '+62 358-521234',
      featured: false,
    },

    // EXTENDED BEACHES & COASTAL AREAS
    {
      name: 'Pantai Tambakrejo',
      city: 'Situbondo',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai Tambakrejo adalah pantai dengan pasir hitam yang unik dan pemandangan laut yang indah. Cocok untuk fotografia dan relaksasi.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.9500, lng: 113.9667 }),
      address: 'Desa Tambakrejo, Kec. Suboh, Situbondo, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 338-421234',
      featured: false,
    },
    {
      name: 'Pantai Payangan',
      city: 'Gresik',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai Payangan adalah pantai dengan formasi batuan karang yang menarik. Tempat yang tenang untuk menikmati sunset.',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop'
      ]),
      rating: 4.1,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2833, lng: 112.5500 }),
      address: 'Desa Payangan, Kec. Ujung Pangkah, Gresik, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 31-401234',
      featured: false,
    },
    {
      name: 'Pantai Legundi',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai Legundi adalah pantai dengan pasir putih dan air laut yang jernih. Destinasi популяр untuk keluarga dan photo session.',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.1500, lng: 112.7500 }),
      address: 'Desa Legundi, Kec. Pacilan, Surabaya, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 31-891234',
      featured: false,
    },
    {
      name: 'Pantai Ketapang',
      city: 'Sampang',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai Ketapang adalah pantai dengan pohon-pohon ketapang yang rindang. Tempat yang идеально для пикника dan keluarga.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop'
      ]),
      rating: 4.0,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2167, lng: 113.2333 }),
      address: 'Desa Ketapang, Kec. Sampang, Sampang, Jawa Timur',
      openingHours: '07:00 - 18:00',
      contact: '+62 324-331234',
      featured: false,
    },
    {
      name: 'Pantai Bimorejo',
      city: 'Pamekasan',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai Bimorejo menawarkan pemandangan laut yang indah dengan fasilitas pantai yang lengkap. Tempat для семейного отдыха.',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop'
      ]),
      rating: 4.1,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2167, lng: 113.4667 }),
      address: 'Desa Bimorejo, Kec. Pasean, Pamekasan, Jawa Timur',
      openingHours: '07:00 - 18:00',
      contact: '+62 324-321234',
      featured: false,
    },
    {
      name: 'Pantai Torjun',
      city: 'Sumenep',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai Torjun adalah pantai dengan pasir putih dan air laut yang jernih. Tempat yang tenang untuk menikmati keindahan alam.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.1667, lng: 113.8500 }),
      address: 'Desa Torjun, Kec. Torjun, Sumenep, Jawa Timur',
      openingHours: '07:00 - 18:00',
      contact: '+62 328-521234',
      featured: false,
    },

    // EXTENDED WATERFALLS & NATURAL SPRINGS
    {
      name: 'Air Terjun Coban Talun',
      city: 'Lumajang',
      province: 'Jawa Timur',
      category: 'Waterfall',
      description: 'Air Terjun Coban Talun adalah air ketiga dengan ketinggian yang menakjubkan. Dikelilingi oleh hutan yang rimbun dan suasana yang damai.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.6,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.2167, lng: 112.9000 }),
      address: 'Desa Talun, Kec. Lumajang, Lumajang, Jawa Timur',
      openingHours: '08:00 - 16:00',
      contact: '+62 334-841234',
      featured: false,
    },
    {
      name: 'Air Terjun Coban Putri',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Waterfall',
      description: 'Air Terjun Coban Putri adalah air ketiga dengan nama yang indah. Terlocated di tengah hutan yang rindang dengan akses yang mudah.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.0167, lng: 112.6000 }),
      address: 'Desa Tlogosari, Kec. Sumbermanjing, Malang, Jawa Timur',
      openingHours: '08:00 - 16:00',
      contact: '+62 341-491234',
      featured: false,
    },
    {
      name: 'Air Terjun Coban Dewi',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Waterfall',
      description: 'Air Terjun Coban Dewi adalah destinasi wisata air jatuh dengan formasi bebatuan yang unik. Tempat yang populer untuk фотография.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.1833, lng: 112.5167 }),
      address: 'Desa Sidorahayu, Kec. Wagir, Malang, Jawa Timur',
      openingHours: '08:00 - 16:00',
      contact: '+62 341-481234',
      featured: false,
    },
    {
      name: 'Air Terjun Coban Lampir',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Waterfall',
      description: 'Air Terjun Coban Lampir menawarkan keindahan alam dengan air jatuh yang menjorok. Akses yang mudah dan fasilitas yang memadai.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.0667, lng: 112.5667 }),
      address: 'Desa Girimoyo, Kec. Karangploso, Malang, Jawa Timur',
      openingHours: '08:00 - 16:00',
      contact: '+62 341-471234',
      featured: false,
    },
    {
      name: 'Air Terjun Coban Gonda',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Waterfall',
      description: 'Air Terjun Coban Gonda adalah air jatuh dengan ketinggian sedang dan aliran air yang deras. Tempat yang cocok untuk keluarga.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.1167, lng: 112.5833 }),
      address: 'Desa Sidomulyo, Kec. Batu, Malang, Jawa Timur',
      openingHours: '08:00 - 16:00',
      contact: '+62 341-461234',
      featured: false,
    },

    // EXTENDED LAKES & RESERVOIRS
    {
      name: 'Waduk Karangkates',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Lake',
      description: 'Waduk Karangkates adalah waduk terbesar di Jawa Timur dengan pemandangan yang indah. Tempat для рыбалки dan rekreasi keluarga.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.1,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.0833, lng: 112.4500 }),
      address: 'Desa Karangkates, Kec. Sumberpucung, Malang, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 341-431234',
      featured: false,
    },
    {
      name: 'Waduk Brawijaya',
      city: 'Kediri',
      province: 'Jawa Timur',
      category: 'Lake',
      description: 'Waduk Brawijaya adalah waduk dengan pemandangan alam yang indah. Tempat популяр untuk fishing dan fotografi landscape.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.0,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.8167, lng: 112.0500 }),
      address: 'Desa Brawijaya, Kec. Wates, Kediri, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 354-421234',
      featured: false,
    },

    // EXTENDED TEMPLES & RELIGIOUS SITES
    {
      name: 'Candi Singhasari',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Temple',
      description: 'Candi Singhasari adalah situs purbakala Kerajaan Singhasari dengan arsitektur yang megah. Tempat bersejarah yang penting di Jawa Timur.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.0000, lng: 112.6500 }),
      address: 'Desa Singhasari, Kec. Singhasari, Malang, Jawa Timur',
      openingHours: '06:00 - 17:00',
      contact: '+62 341-451234',
      featured: false,
    },
    {
      name: 'Candi Kanjengan',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Temple',
      description: 'Candi Kanjengan adalah candi Hindu yang memiliki relief unik dan arsitektur khas Jawa Timur. Tempat исследование sejarah.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.1,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.9500, lng: 112.6000 }),
      address: 'Desa Kanjengan, Kec. Pakis, Malang, Jawa Timur',
      openingHours: '06:00 - 17:00',
      contact: '+62 341-441234',
      featured: false,
    },
    {
      name: 'Candi Barong',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Temple',
      description: 'Candi Barong adalah candi Hindu dengan relief yang menceritakan kisah Barong. Tempat budaya yang penting untuk дипломат исследования.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 4.0,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.0500, lng: 112.6167 }),
      address: 'Desa Gading, Kec. Bululawang, Malang, Jawa Timur',
      openingHours: '06:00 - 17:00',
      contact: '+62 341-431234',
      featured: false,
    },
    {
      name: 'Candi Candi',
      city: 'Madiun',
      province: 'Jawa Timur',
      category: 'Temple',
      description: 'Candi Candi adalah situs purbakala dengan arsitektur yang unik. Tempat археологический интерес для исследования.',
      image: 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&h=600&fit=crop'
      ]),
      rating: 3.9,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.6000, lng: 111.5167 }),
      address: 'Desa Candi, Kec. Dolopo, Madiun, Jawa Timur',
      openingHours: '07:00 - 16:00',
      contact: '+62 351-421234',
      featured: false,
    },

    // EXTENDED NATURE RESERVES & FORESTS
    {
      name: 'Hutan Lindung Semangkak',
      city: 'Lumajang',
      province: 'Jawa Timur',
      category: 'Forest',
      description: 'Hutan Lindung Semangkak adalah kawasan hutan lindung dengan keanekaragaman hayati yang tinggi. Tempat eco-tourism dan penelitian.',
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.2000, lng: 112.9167 }),
      address: 'Desa Semangkak, Kec. Tempursari, Lumajang, Jawa Timur',
      openingHours: '07:00 - 16:00',
      contact: '+62 334-821234',
      featured: false,
    },
    {
      name: 'Taman Hutan Raya Ir. H. Juanda',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'Forest',
      description: 'Taman Hutan Raya Ir. H. Juanda adalah kawasan konservasi hutan tropis di Surabaya. Tempat rekreasi keluarga dan edukasi lingkungan.',
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.3167, lng: 112.7833 }),
      address: 'Desa Dukuh Sutorejo, Kec. Mulyorejo, Surabaya, Jawa Timur',
      openingHours: '07:00 - 17:00',
      contact: '+62 31-591234',
      featured: false,
    },
    {
      name: 'Kawasan Konservasi Gunung Batur',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Forest',
      description: 'Kawasan Konservasi Gunung Batur adalah kawasan konservasi dengan pemandangan gunung dan hutan yang indah. Tempat hiking dan penelitian.',
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop'
      ]),
      rating: 4.1,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.8833, lng: 112.7000 }),
      address: 'Desa Gubukklakah, Kec. Poncokusumo, Malang, Jawa Timur',
      openingHours: '06:00 - 16:00',
      contact: '+62 341-481234',
      featured: false,
    },

    // EXTENDED CULTURAL & TRADITIONAL VILLAGES
    {
      name: 'Desa wisata Sumbermujur',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Cultural',
      description: 'Desa wisata Sumbermujur adalah desa wisata dengan konsep agro tourism. Menawarkan pengalaman tinggal di desa dan menikmati kehidupan rural.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.1833, lng: 112.5833 }),
      address: 'Desa Sumbermujur, Kec. Dampit, Malang, Jawa Timur',
      openingHours: '08:00 - 16:00',
      contact: '+62 341-421234',
      featured: false,
    },
    {
      name: 'Desa wisata Tutur',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Cultural',
      description: 'Desa wisata Tutur adalah desa wisata dengan wisata edukasi dan agrowisata. Tempat для изучения традиционной культуры.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -8.0167, lng: 112.7000 }),
      address: 'Desa Tutur, Kec. Purwantoro, Malang, Jawa Timur',
      openingHours: '08:00 - 16:00',
      contact: '+62 341-411234',
      featured: false,
    },
    {
      name: 'Desa wisata Paralayang',
      city: 'Batu',
      province: 'Jawa Timur',
      category: 'Cultural',
      description: 'Desa wisata Paralayang adalah desa wisata dengan wisata olahraga paralayang. Destination для extremasport любители.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.8333, lng: 112.4833 }),
      address: 'Desa Oro-Oro Ombo, Kec. Batu, Kota Batu, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 341-591234',
      featured: false,
    },

    // EXTENDED MODERN ATTRACTIONS
    {
      name: 'Museum Angkut',
      city: 'Batu',
      province: 'Jawa Timur',
      category: 'Museum',
      description: 'Museum Angkut adalah museum transportasi dengan koleksi kendaraan dari berbagai negara. Tempat edukasi sejarah transportasi dunia.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.8833, lng: 112.5167 }),
      address: 'Jl. Raya Oro-Oro Ombo No. 1, Batu, Jawa Timur',
      openingHours: '09:00 - 17:00',
      contact: '+62 341-598234',
      website: 'https://museumangkut.com',
      featured: false,
    },
    {
      name: 'Museum House of Midland',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'Museum',
      description: 'Museum House of Midland menampilkan koleksi mobil klasik dan vintage. Destinasi для automotive enthusiasts.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.2167, lng: 112.7500 }),
      address: 'Jl. Abdul Rahman Saleh No. 44, Surabaya, Jawa Timur',
      openingHours: '09:00 - 16:00',
      contact: '+62 31-591234',
      featured: false,
    },
    {
      name: 'Museum TNI AL',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'Museum',
      description: 'Museum TNI AL menampilkan sejarah perhubungan laut Indonesia. Destinasi edukasi sejarah maritim dan pertahanan negara.',
      image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2167, lng: 112.7667 }),
      address: 'Jl. Gadang No. 1, Surabaya, Jawa Timur',
      openingHours: '08:00 - 15:00',
      contact: '+62 31-561234',
      featured: false,
    },

    // EXTENDED SHOPPING & ENTERTAINMENT
    {
      name: 'Galaxy Mall Surabaya',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'Shopping',
      description: 'Galaxy Mall Surabaya adalah pusat perbelanjaan modern dengan berbagai brand internasional. Destinasi shopping dan entertainment terkemuka.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.2500, lng: 112.7500 }),
      address: 'Jl. Galaxy Bumi Permai No. 2, Surabaya, Jawa Timur',
      openingHours: '10:00 - 22:00',
      contact: '+62 31-561234',
      website: 'https://galaxy-mall.com',
      featured: false,
    },
    {
      name: 'Mall Olympic Garden',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Shopping',
      description: 'Mall Olympic Garden adalah pusat perbelanjaan dengan konsep family-friendly. Menawarkan pengalaman belanja yang nyaman untuk keluarga.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.9667, lng: 112.6333 }),
      address: 'Jl. Olímpico No. 30, Malang, Jawa Timur',
      openingHours: '10:00 - 22:00',
      contact: '+62 341-331234',
      featured: false,
    },
    {
      name: 'Transmart Surabaya',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'Shopping',
      description: 'Transmart Surabaya adalah hypermarket dengan berbagai kebutuhan sehari-hari dan produk branded. Destination one-stop shopping.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.1,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2833, lng: 112.7833 }),
      address: 'Jl. Ahmad Yani No. 25, Surabaya, Jawa Timur',
      openingHours: '08:00 - 23:00',
      contact: '+62 31-531234',
      website: 'https://transmart.co.id',
      featured: false,
    },

    // EXTENDED RECREATIONAL PARKS
    {
      name: 'Alun-Alun Surabaya',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'Park',
      description: 'Alun-Alun Surabaya adalah pusat kota dengan arsitektur kolonial yang indah. Tempat rekreasi keluarga dan photograhpy sejarah.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.0,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2500, lng: 112.7500 }),
      address: 'Kota Surabaya, Jawa Timur',
      openingHours: '24 hours',
      contact: '+62 31-531234',
      featured: false,
    },
    {
      name: 'Kebun Binatang Surabaya',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'Zoo',
      description: 'Kebun Binatang Surabaya adalah kebun Binatang tertua di Indonesia. Habitat для berbagai satwa dan edukasi konservasi.',
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2333, lng: 112.7500 }),
      address: 'Jl. Setail No. 4, Surabaya, Jawa Timur',
      openingHours: '08:00 - 16:00',
      contact: '+62 31-501234',
      website: 'https://kbsurabaya.com',
      featured: false,
    },
    {
      name: 'Taman Flora Brata',
      city: 'Gresik',
      province: 'Jawa Timur',
      category: 'Park',
      description: 'Taman Flora Brata adalah taman dengan koleksi tanaman exotic dan flower garden yang indah. Destinasi edukasi botani.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.0,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2167, lng: 112.6000 }),
      address: 'Desa Setrohank, Kec. Kebomas, Gresik, Jawa Timur',
      openingHours: '08:00 - 16:00',
      contact: '+62 31-391234',
      featured: false,
    },

    // EXTENDED CULINARY & FOOD EXPERIENCES
    {
      name: 'Malang Food Street',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Market',
      description: 'Malang Food Street adalah kawasan kuliner dengan berbagai makanan khas Malang. Destinasi food hunting dan cultural experience.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.9667, lng: 112.6333 }),
      address: 'Kota Malang, Jawa Timur',
      openingHours: '18:00 - 02:00',
      contact: '+62 341-361234',
      featured: false,
    },
    {
      name: 'Surabaya Food Street',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'Market',
      description: 'Surabaya Food Street adalah kawasan kuliner dengan makanan khas Surabaya. Destination для гастрономического туризма.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2575, lng: 112.7521 }),
      address: 'Kota Surabaya, Jawa Timur',
      openingHours: '18:00 - 02:00',
      contact: '+62 31-531234',
      featured: false,
    },
    {
      name: 'Batu Apple Center',
      city: 'Batu',
      province: 'Jawa Timur',
      category: 'Market',
      description: 'Batu Apple Center adalah pusat oleh-oleh dengan berbagai buah apel dan makanan khas Batu. Destinasi belanja souvenir.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.8667, lng: 112.5167 }),
      address: 'Kota Batu, Jawa Timur',
      openingHours: '08:00 - 20:00',
      contact: '+62 341-591234',
      featured: false,
    },

    // EXTENDED RELIGIOUS & SPIRITUAL SITES
    {
      name: 'Masjid Agung Surabaya',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'Religious',
      description: 'Masjid Agung Surabaya adalah masjid terbesar di Surabaya dengan arsitektur modern yang megah. Tempat ibadah dan turismo religious.',
      image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop'
      ]),
      rating: 4.6,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2500, lng: 112.7500 }),
      address: 'Jl. Mesjid Agung No. 1, Surabaya, Jawa Timur',
      openingHours: '04:00 - 22:00',
      contact: '+62 31-551234',
      featured: false,
    },
    {
      name: 'Masjid Cheng Hoo',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'Religious',
      description: 'Masjid Cheng Hoo adalah masjid dengan arsitektur China dan Islam yang unik. Destinasi arsitektur dan turismo religious.',
      image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2167, lng: 112.7500 }),
      address: 'Jl. Gemblong No. 21, Surabaya, Jawa Timur',
      openingHours: '05:00 - 21:00',
      contact: '+62 31-541234',
      featured: false,
    },
    {
      name: 'Gereja Kelahiran Santa Perawan Maria',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'Religious',
      description: 'Gereja Kelahiran Santa Perawan Maria adalah gereja bersejarah dengan arsitektur kolonial yang indah. Destinasi wisata religious.',
      image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.9667, lng: 112.6333 }),
      address: 'Jl. Gereja No. 12, Malang, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 341-351234',
      featured: false,
    },

    // EXTENDED ARCHITECTURAL LANDMARKS
    {
      name: 'Hotel Majapahit',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'Hotel',
      description: 'Hotel Majapahit adalah hotel bersejarah dengan arsitektur kolonial yang megah. Landmark arsitektur dan destino luxo.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'luxury',
      coordinates: JSON.stringify({ lat: -7.2500, lng: 112.7500 }),
      address: 'Jl. Raya Tunjungan No. 1, Surabaya, Jawa Timur',
      openingHours: '24 hours',
      contact: '+62 31-531234',
      website: 'https://majapahit-hotel.com',
      featured: false,
    },
    {
      name: 'Gedung Siola Surabaya',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'Monument',
      description: 'Gedung Siola adalah gedung bersejarah dengan arsitektur kolonial yang iconic. Landmark архитектурный Surabaya.',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2500, lng: 112.7500 }),
      address: 'Jl. Tunjungan No. 7, Surabaya, Jawa Timur',
      openingHours: '08:00 - 17:00',
      contact: '+62 31-531234',
      featured: false,
    },
    {
      name: 'Monumen Tugu Pahlawan',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'Monument',
      description: 'Monumen Tugu Pahlawan adalah символ Surabaya untuk memperingati pertempuran 10 November. Landmark sejarah nasional.',
      image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop'
      ]),
      rating: 4.6,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2459, lng: 112.7379 }),
      address: 'Alun-Alun Contong, Surabaya, Jawa Timur',
      openingHours: '08:00 - 17:00',
      contact: '+62 31-561234',
      featured: true,
    },

    // FINAL ADDITIONAL DESTINATIONS TO REACH 100+
    {
      name: 'Lagoi Bay',
      city: 'Situbondo',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Lagoi Bay adalah pantai dengan laguna biru yang indah. Destination untuk beach holiday dan aquatic activities.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop'
      ]),
      rating: 4.0,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.8500, lng: 114.0500 }),
      address: 'Desa Lagoi, Kec. Suboh, Situbondo, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 338-411234',
      featured: false,
    },
    {
      name: 'Pantai Camplong',
      city: 'Sampel',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai Camplong adalah pantai dengan pasir putih dan air jernih. Destinasi untuk snorkeling dan diving.',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop'
      ]),
      rating: 4.1,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2333, lng: 113.2000 }),
      address: 'Desa Camplong, Kec. Sampang, Sampang, Jawa Timur',
      openingHours: '07:00 - 18:00',
      contact: '+62 324-321234',
      featured: false,
    },

    // ADDITIONAL BEACHES TO COMPLETE COASTLINE
    {
      name: 'Pantai Jangkar',
      city: 'Situbondo',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai Jangkar adalah pantai dengan pemandangan sunset yang indah dan ombak yang cocok untuk surfing.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.9167, lng: 113.9333 }),
      address: 'Desa Jangkar, Kec. Jangkar, Situbondo, Jawa Timur',
      openingHours: '06:00 - 18:00',
      contact: '+62 338-431234',
      featured: false,
    },
    {
      name: 'Pantai Pasir Panjang',
      city: 'Pamekasan',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai Pasir Panjang dengan pasir putih yang halus dan air laut yang jernih.',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop'
      ]),
      rating: 4.0,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.1667, lng: 113.5000 }),
      address: 'Desa Pasir Panjang, Kec. Palengaan, Pamekasan, Jawa Timur',
      openingHours: '07:00 - 18:00',
      contact: '+62 324-311234',
      featured: false,
    },
    {
      name: 'Pantai Lombang',
      city: 'Sumenep',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai Lombang adalah pantai dengan pemandangan alam yang indah dan udara laut yang segar.',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop'
      ]),
      rating: 4.1,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2167, lng: 113.9333 }),
      address: 'Desa Lombang, Kec. Dungkek, Sumenep, Jawa Timur',
      openingHours: '07:00 - 18:00',
      contact: '+62 328-531234',
      featured: false,
    },
    {
      name: 'Pantai Batu Bulu',
      city: 'Sumenep',
      province: 'Jawa Timur',
      category: 'Beach',
      description: 'Pantai Batu Bulu dengan formasi batuan yang unik dan pemandangan laut yang spektakuler.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop'
      ]),
      rating: 4.0,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2000, lng: 113.9000 }),
      address: 'Desa Batu Bulu, Kec. Pragaan, Sumenep, Jawa Timur',
      openingHours: '07:00 - 18:00',
      contact: '+62 328-541234',
      featured: false,
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
      preferences: JSON.stringify({
        language: 'id',
        notifications: true,
        theme: 'light',
      }),
    },
    {
      email: 'traveler@jatour.com',
      password: await bcrypt.hash('traveler123', 10),
      fullName: 'Sarah Traveler',
      phone: '+6281234567891',
      preferences: JSON.stringify({
        language: 'en',
        notifications: true,
        theme: 'dark',
      }),
    },
    {
      email: 'mountain@jatour.com',
      password: await bcrypt.hash('mountain123', 10),
      fullName: 'Agus Mountaineer',
      phone: '+6281234567892',
      preferences: JSON.stringify({
        language: 'id',
        notifications: false,
        theme: 'light',
      }),
    },
    {
      email: 'beachlover@jatour.com',
      password: await bcrypt.hash('beach123', 10),
      fullName: 'Dewi Beach',
      phone: '+6281234567893',
      preferences: JSON.stringify({
        language: 'id',
        notifications: true,
        theme: 'light',
      }),
    },
    {
      email: 'photographer@jatour.com',
      password: await bcrypt.hash('photo123', 10),
      fullName: 'Budi Photographer',
      phone: '+6281234567894',
      preferences: JSON.stringify({
        language: 'id',
        notifications: true,
        theme: 'dark',
      }),
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
      schedule: JSON.stringify({
        departureTime: '06:00',
        arrivalTime: '08:30',
        duration: '2h 30m',
        frequency: 'Every 30 minutes',
      }),
      pricing: JSON.stringify({
        economy: 45000,
        business: 75000,
      }),
      availability: JSON.stringify({
        seatsAvailable: 30,
        bookedSeats: 15,
      }),
      bookingUrl: 'https://booking.example.com/bus/surabaya-malang',
      status: 'active',
    },
    {
      type: 'train',
      provider: 'Kereta Api Indonesia',
      route: 'Surabaya-Malang',
      schedule: JSON.stringify({
        departureTime: '05:45',
        arrivalTime: '08:15',
        duration: '2h 30m',
        frequency: 'Every 2 hours',
      }),
      pricing: JSON.stringify({
        economy: 55000,
        business: 120000,
        firstClass: 200000,
      }),
      availability: JSON.stringify({
        seatsAvailable: 200,
        bookedSeats: 120,
      }),
      bookingUrl: 'https://booking.kereta-api.co.id',
      status: 'active',
    },
    {
      type: 'flight',
      provider: 'Garuda Indonesia',
      route: 'Surabaya-Semarang',
      schedule: JSON.stringify({
        departureTime: '09:30',
        arrivalTime: '10:45',
        duration: '1h 15m',
        frequency: 'Daily',
      }),
      pricing: JSON.stringify({
        economy: 850000,
        business: 2400000,
        firstClass: 4500000,
      }),
      availability: JSON.stringify({
        seatsAvailable: 180,
        bookedSeats: 45,
      }),
      bookingUrl: 'https://booking.garuda-indonesia.com',
      status: 'active',
    },
    {
      type: 'bus',
      provider: 'Pawon Indah',
      route: 'Malang-Batu',
      schedule: JSON.stringify({
        departureTime: '07:00',
        arrivalTime: '08:30',
        duration: '1h 30m',
        frequency: 'Every hour',
      }),
      pricing: JSON.stringify({
        economy: 25000,
        business: 40000,
      }),
      availability: JSON.stringify({
        seatsAvailable: 45,
        bookedSeats: 20,
      }),
      bookingUrl: 'https://booking.example.com/bus/malang-batu',
      status: 'active',
    },
    {
      type: 'car_rental',
      provider: 'Malang Rent Car',
      route: 'Malang-Arjuno',
      schedule: JSON.stringify({
        departureTime: '06:00',
        arrivalTime: '07:30',
        duration: '1h 30m',
        frequency: 'On demand',
      }),
      pricing: JSON.stringify({
        compact: 300000,
        sedan: 450000,
        suv: 650000,
      }),
      availability: JSON.stringify({
        seatsAvailable: 10,
        bookedSeats: 3,
      }),
      bookingUrl: 'https://malangrentcar.com',
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
      tags: JSON.stringify(['gunung-bromo', 'mendaki', 'tips']),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      title: 'Rekomendasi Kuliner Malang yang Enak',
      slug: 'rekomendasi-kuliner-malang-yang-enak',
      content: 'Lagi di Malang nih guys! Boleh sharing rekomendasi tempat makan yang wajib dicoba? Baik makanan tradisional maupun modern. Makasih!',
      userId: createdUsers[1].id, // traveler@jatour.com
      categoryId: categories.find(c => c.slug === 'food-dining')?.id || '',
      tags: JSON.stringify(['malang', 'kuliner', 'rekomendasi']),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      title: 'Budget Traveling di East Java - Share Your Tips!',
      slug: 'budget-traveling-east-java-tips',
      content: 'Lagi planning budget traveling ke East Java. Ada yang punya tips hemat untuk kedepatan, транспорт, dan makan? Share dong ya!',
      userId: createdUsers[0].id, // demo@jatour.com
      categoryId: categories.find(c => c.slug === 'budget-travel')?.id || '',
      tags: JSON.stringify(['budget-travel', 'east-java', 'tips']),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      title: 'Photography Tips untuk Sunset di Pantai Klayar',
      slug: 'photography-tips-sunset-pantai-klayar',
      content: 'Anyone ada tips untuk fotografi sunset di Pantai Klayar? Equipment apa aja yang perlu dibawa? Setting kamera yang bagus gimana?',
      userId: createdUsers[4].id, // photographer@jatour.com
      categoryId: categories.find(c => c.slug === 'photography')?.id || '',
      tags: JSON.stringify(['photography', 'sunset', 'klayar']),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      title: 'Forum Baru: Sharing Informasi Hotel dan Accommodation',
      slug: 'informasi-hotel-accommodation-east-java',
      content: 'Welcome di forum baru ini! Yuk sharing informasi hotel, hostel, dan tempat menginap lainnya di East Java. Rate, fasilitas, lokasi, dll.',
      userId: createdUsers[1].id, // traveler@jatour.com
      categoryId: categories.find(c => c.slug === 'accommodation')?.id || '',
      tags: JSON.stringify(['hotel', 'accommodation', 'review']),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      title: 'Transportasi ke Bromo: Bus vs Tour Package?',
      slug: 'transportasi-ke-bromo-bus-vs-tour',
      content: 'Lagi planning ke Bromo weekend ini. Better ambil bus umum atau tour package? Yang udah pengalaman kasih tau dong, mana lebih hemat?',
      userId: createdUsers[3].id, // beachlover@jatour.com
      categoryId: categories.find(c => c.slug === 'transportation')?.id || '',
      tags: JSON.stringify(['bromo', 'transportation', 'budget']),
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    },
    {
      title: 'Hidden Gems di Malang yang Wajib Dikunjungi',
      slug: 'hidden-gems-malang-wajib-dikunjungi',
      content: 'Halo! Cari rekomendasi tempat tempat tersembunyi di Malang yang maybe belum banyak orang tau. Buat yang udah sering ke Malang, share dong spot-spot unique!',
      userId: createdUsers[0].id, // demo@jatour.com
      categoryId: categories.find(c => c.slug === 'destinations')?.id || '',
      tags: JSON.stringify(['malang', 'hidden-gems', 'unique']),
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    }
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

  // Create sample reviews
  console.log('⭐ Creating sample reviews...');
  const reviews = [
    {
      userId: createdUsers[2].id, // mountain@jatour.com
      destinationId: createdDestinations.find(d => d.name === 'Gunung Bromo')?.id || '',
      rating: 5,
      comment: 'Amazing sunrise view! Definitely worth the early morning climb. Make sure to bring warm clothes and good hiking shoes.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      userId: createdUsers[1].id, // traveler@jatour.com
      destinationId: createdDestinations.find(d => d.name === 'Pantai Klayar')?.id || '',
      rating: 4,
      comment: 'Beautiful beach with unique rock formations. Perfect for photography and relaxing. The sea fountain phenomenon is really cool!',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      userId: createdUsers[3].id, // beachlover@jatour.com
      destinationId: createdDestinations.find(d => d.name === 'Taman Nasional Bromo Tengger Semeru')?.id || '',
      rating: 5,
      comment: 'Incredible national park! Multiple volcanoes and the sunrise experience is unforgettable. Highly recommend the tour packages.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    }
  ];

  const createdReviews = await Promise.all(
    reviews.map(review =>
      prisma.review.upsert({
        where: {
          userId_destinationId: {
            userId: review.userId,
            destinationId: review.destinationId
          }
        },
        update: {
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        },
        create: review,
      })
    )
  );
  console.log(`✅ Created ${createdReviews.length} reviews`);

  // Create accommodations
  console.log('🏨 Creating accommodations...');
  const accommodations = [
    // LUXURY HOTELS
    {
      name: 'Golden Tulip Holland Resort Batu',
      city: 'Batu',
      province: 'Jawa Timur',
      type: 'resort',
      category: 'luxury',
      description: 'Resort mewah dengan fasilitas lengkap dan pemandangan kota Batu yang indah. memiliki spa, restoran, dan kolam renang infinity.',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop'
      ]),
      rating: 4.7,
      priceRange: 'luxury',
      coordinates: JSON.stringify({ lat: -7.8833, lng: 112.5167 }),
      address: 'Jl. Oro-Oro Ombo No. 278, Batu, Jawa Timur',
      phone: '+62 341-598888',
      email: 'info@goldentulipbatu.com',
      website: 'https://goldentulip-batu.com',
      amenities: JSON.stringify({ wifi: true, ac: true, pool: true, spa: true, gym: true, parking: true, restaurant: true, bar: true }),
      capacity: 4,
      breakfast: true,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
      totalRooms: 120,
      availability: JSON.stringify({ availableRooms: 85, bookedRooms: 35 }),
      bookingUrl: 'https://booking.com/hotel/id/golden-tulip.html'
    },
    {
      name: 'Hotel Majapahit Surabaya',
      city: 'Surabaya',
      province: 'Jawa Timur',
      type: 'hotel',
      category: 'luxury',
      description: 'Hotel bersejarah dengan arsitektur kolonial yang megah. landmark arsitektur dan destino luxo di Surabaya.',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'luxury',
      coordinates: JSON.stringify({ lat: -7.2500, lng: 112.7500 }),
      address: 'Jl. Raya Tunjungan No. 1, Surabaya, Jawa Timur',
      phone: '+62 31-5318000',
      email: 'reservations@majapahit-hotel.com',
      website: 'https://majapahit-hotel.com',
      amenities: JSON.stringify({ wifi: true, ac: true, pool: true, spa: true, gym: true, parking: true, restaurant: true, bar: true, business_center: true }),
      capacity: 4,
      breakfast: true,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
      totalRooms: 140,
      availability: JSON.stringify({ availableRooms: 98, bookedRooms: 42 }),
      bookingUrl: 'https://majapahit-hotel.com/booking'
    },

    // MODERATE HOTELS
    {
      name: 'Hotel Tretes Raya',
      city: 'Tretes',
      province: 'Jawa Timur',
      type: 'hotel',
      category: 'moderate',
      description: 'Hotel dengan udara sejuk pegunungan Tretes dan pemandangan alam yang indah. Cocok untuk family vacation.',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.7167, lng: 112.6000 }),
      address: 'Jl. Raya Tretes No. 12, Tretes, Jawa Timur',
      phone: '+62 341-891234',
      email: 'info@hoteltretesraya.com',
      website: 'https://hoteltretesraya.com',
      amenities: JSON.stringify({ wifi: true, ac: true, parking: true, restaurant: true }),
      capacity: 4,
      breakfast: true,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
      totalRooms: 60,
      availability: JSON.stringify({ availableRooms: 45, bookedRooms: 15 }),
      bookingUrl: 'https://booking.com/hotel/id/tretes-raya.html'
    },
    {
      name: 'Ibis Styles Malang',
      city: 'Malang',
      province: 'Jawa Timur',
      type: 'hotel',
      category: 'moderate',
      description: 'Hotel modern dengan desain stylish di pusat kota Malang. lokasi strategis dekat dengan pusat perbelanjaan.',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.9667, lng: 112.6333 }),
      address: 'Jl. Jaksa Agung Suprapto No. 75, Malang, Jawa Timur',
      phone: '+62 341-366633',
      email: 'h6633@accor.com',
      website: 'https://ibisstyles.com',
      amenities: JSON.stringify({ wifi: true, ac: true, parking: true, restaurant: true, gym: true }),
      capacity: 3,
      breakfast: true,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
      totalRooms: 120,
      availability: JSON.stringify({ availableRooms: 80, bookedRooms: 40 }),
      bookingUrl: 'https://ibisstyles.com/malang'
    },

    // BUDGET ACCOMMODATIONS
    {
      name: 'Batu Backpacker Lodge',
      city: 'Batu',
      province: 'Jawa Timur',
      type: 'hostel',
      category: 'budget',
      description: 'Hostel budget-friendly dengan fasilitas backpacker. Cocok untuk traveler muda dengan budget terbatas.',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop'
      ]),
      rating: 4.0,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.8833, lng: 112.5167 }),
      address: 'Jl. Pasar Baru No. 8, Batu, Jawa Timur',
      phone: '+62 341-591234',
      email: 'info@batubackpacker.com',
      website: null,
      amenities: JSON.stringify({ wifi: true, shared_kitchen: true, laundry: true, parking: false }),
      capacity: 8,
      breakfast: false,
      checkInTime: '12:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'No cancellation, no refund',
      totalRooms: 20,
      availability: JSON.stringify({ availableRooms: 12, bookedRooms: 8 }),
      bookingUrl: 'https://hostelworld.com/batu-backpacker'
    },
    {
      name: 'Malang Homestay',
      city: 'Malang',
      province: 'Jawa Timur',
      type: 'homestay',
      category: 'budget',
      description: 'Homestay keluarga dengan suasana rumah tangga. Tuan rumah yang ramah dan lokasi strategis.',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop'
      ]),
      rating: 4.1,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.9833, lng: 112.6333 }),
      address: 'Jl. Sudirman No. 45, Malang, Jawa Timur',
      phone: '+62 341-331234',
      email: 'malanghomestay@gmail.com',
      website: null,
      amenities: JSON.stringify({ wifi: true, shared_kitchen: true, parking: true }),
      capacity: 4,
      breakfast: false,
      checkInTime: '14:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
      totalRooms: 3,
      availability: JSON.stringify({ availableRooms: 2, bookedRooms: 1 }),
      bookingUrl: null
    },

    // ADDITIONAL ACCOMMODATIONS TO REACH 15+
    {
      name: 'Swiss-Belresort Tretes',
      city: 'Tretes',
      province: 'Jawa Timur',
      type: 'resort',
      category: 'moderate',
      description: 'Resort dengan fasilitas lengkap di dataran tinggi Tretes. Villa private dengan kolam renang pribadi.',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.7167, lng: 112.6000 }),
      address: 'Jl. Raya Tretes No. 123, Tretes, Jawa Timur',
      phone: '+62 341-891333',
      email: 'treset@swiss-bel.com',
      website: 'https://treset.swiss-bel.com',
      amenities: JSON.stringify({ wifi: true, ac: true, pool: true, spa: true, restaurant: true, parking: true }),
      capacity: 6,
      breakfast: true,
      checkInTime: '15:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
      totalRooms: 30,
      availability: JSON.stringify({ availableRooms: 20, bookedRooms: 10 }),
      bookingUrl: 'https://treset.swiss-bel.com/booking'
    },
    {
      name: 'Garden Palace Hotel Surabaya',
      city: 'Surabaya',
      province: 'Jawa Timur',
      type: 'hotel',
      category: 'moderate',
      description: 'Hotel bintang 4 dengan taman hijau di tengah kota. fasilitas meeting dan bisnis lengkap.',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.2575, lng: 112.7521 }),
      address: 'Jl. Yogyakarta No. 8-12, Surabaya, Jawa Timur',
      phone: '+62 31-5318877',
      email: 'garden@gardenhotels.com',
      website: 'https://gardenhotels.com/surabaya',
      amenities: JSON.stringify({ wifi: true, ac: true, pool: true, gym: true, restaurant: true, business_center: true, parking: true }),
      capacity: 3,
      breakfast: true,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
      totalRooms: 80,
      availability: JSON.stringify({ availableRooms: 55, bookedRooms: 25 }),
      bookingUrl: 'https://gardenhotels.com/surabaya/booking'
    },
    {
      name: 'Bromo Backpacker',
      city: 'Probolinggo',
      province: 'Jawa Timur',
      type: 'hostel',
      category: 'budget',
      description: 'Hostel khusus backpacker untuk expedition Bromo. Basecamp yang strategis dengan guide service.',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.9425, lng: 112.9530 }),
      address: 'Desa Ngadisari, Sukapura, Probolinggo, Jawa Timur',
      phone: '+62 335-541193',
      email: 'info@bromobackpacker.com',
      website: 'https://bromobackpacker.com',
      amenities: JSON.stringify({ wifi: true, shared_kitchen: true, laundry: false, parking: true, guide_service: true }),
      capacity: 6,
      breakfast: false,
      checkInTime: '12:00',
      checkOutTime: '10:00',
      cancellationPolicy: 'No cancellation for peak season',
      totalRooms: 15,
      availability: JSON.stringify({ availableRooms: 8, bookedRooms: 7 }),
      bookingUrl: 'https://bromobackpacker.com/booking'
    },
    {
      name: 'Villa Arjuno View',
      city: 'Malang',
      province: 'Jawa Timur',
      type: 'villa',
      category: 'moderate',
      description: 'Villa dengan pemandangan Gunung Arjuno. Cocok untuk grup keluarga dengan fasilitas private.',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.7333, lng: 112.5833 }),
      address: 'Desa Oro-Oro Ombo, Kec. Batu, Malang, Jawa Timur',
      phone: '+62 341-591234',
      email: 'villaarjunoview@gmail.com',
      website: null,
      amenities: JSON.stringify({ wifi: true, ac: true, pool: true, parking: true, bbq_area: true }),
      capacity: 8,
      breakfast: false,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 72 hours before check-in',
      totalRooms: 3,
      availability: JSON.stringify({ availableRooms: 2, bookedRooms: 1 }),
      bookingUrl: null
    },
    {
      name: 'Probolinggo Budget Hotel',
      city: 'Probolinggo',
      province: 'Jawa Timur',
      type: 'hotel',
      category: 'budget',
      description: 'Hotel budget dengan lokasi strategis di pusat kota Probolinggo. Cocok untuk transit travelers.',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop'
      ]),
      rating: 3.8,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.8833, lng: 113.2167 }),
      address: 'Jl. Gajah Mada No. 45, Probolinggo, Jawa Timur',
      phone: '+62 335-421234',
      email: 'probolinggobudget@gmail.com',
      website: null,
      amenities: JSON.stringify({ wifi: true, ac: false, parking: true, restaurant: false }),
      capacity: 2,
      breakfast: false,
      checkInTime: '12:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'No refund for cancellation',
      totalRooms: 25,
      availability: JSON.stringify({ availableRooms: 18, bookedRooms: 7 }),
      bookingUrl: null
    }
  ];

  const createdAccommodations = await Promise.all(
    accommodations.map(accommodation => prisma.accommodation.create({ data: accommodation }))
  );
  console.log(`✅ Created ${createdAccommodations.length} accommodations`);

  // Create restaurants
  console.log('🍜 Creating massive East Java restaurant database...');
  const restaurants = [
    // TRADITIONAL INDONESIAN
    {
      name: 'Warung Bu Yuli',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'traditional',
      cuisine: 'indonesian',
      description: 'Warung legendaris dengan resep turun temurun. Spesialisasi pecel, gado-gado, dan sate Malang yang autentik.',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae4a?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae4a?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop'
      ]),
      rating: 4.6,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.9667, lng: 112.6333 }),
      address: 'Jl. Pecinan No. 45, Malang, Jawa Timur',
      phone: '+62 341-331234',
      website: null,
      specialties: JSON.stringify(['Pecel Malang', 'Sate Malang', 'Gado-gado', 'Bakso Malang']),
      menuItems: JSON.stringify({ main: ['Pecel Malang', 'Sate Malang', 'Gado-gado'], appetizer: ['Kerak Telor', 'Tempe Mendoan'], dessert: ['Bubur Kacang Hijau'], drinks: ['Es Cendol', 'Teh Tarik'] }),
      operatingHours: JSON.stringify({ monday: '06:00-22:00', tuesday: '06:00-22:00', wednesday: '06:00-22:00', thursday: '06:00-22:00', friday: '06:00-22:00', saturday: '06:00-23:00', sunday: '06:00-23:00' }),
      dietaryOptions: JSON.stringify({ halal: true, vegetarian: true, vegan: true, glutenFree: false }),
      seatingCapacity: 30,
      reservationRequired: false,
      paymentMethods: JSON.stringify(['cash', 'digital_wallet']),
      parking: true,
      wifi: false,
      delivery: true,
      takeaway: true
    },
    {
      name: 'Rumah Makan Sari Kembang',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'traditional',
      cuisine: 'indonesian',
      description: 'Rumah makan klasik Surabaya dengan menu lengkap seafood dan tradicionais Jawa. Suasana family-friendly.',
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.2575, lng: 112.7521 }),
      address: 'Jl. Diponegoro No. 67, Surabaya, Jawa Timur',
      phone: '+62 31-561234',
      website: null,
      specialties: JSON.stringify(['Ikan Bakar', 'Rendang', 'Gudeg', 'Ayam Bakar']),
      menuItems: JSON.stringify({ main: ['Ikan Bakar Bumbu Kecap', 'Rendang Sapi', 'Gudeg', 'Ayam Bakar Rica-rica'], appetizer: ['Kerupuk', 'Sambal Ati Ampela'], dessert: ['Klepon', 'Lemper'], drinks: ['Es Jeruk', 'Bandrek'] }),
      operatingHours: JSON.stringify({ monday: '10:00-22:00', tuesday: '10:00-22:00', wednesday: '10:00-22:00', thursday: '10:00-22:00', friday: '10:00-22:00', saturday: '10:00-23:00', sunday: '10:00-23:00' }),
      dietaryOptions: JSON.stringify({ halal: true, vegetarian: false, vegan: false, glutenFree: false }),
      seatingCapacity: 80,
      reservationRequired: false,
      paymentMethods: JSON.stringify(['cash', 'card', 'digital_wallet']),
      parking: true,
      wifi: true,
      delivery: true,
      takeaway: true
    },

    // SEAFOOD RESTAURANTS
    {
      name: 'De\'Fish Restaurant',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'seafood',
      cuisine: 'indonesian',
      description: 'Restaurant seafood segar dengan view laut langsung. Spesialisasi ikan bakar dan seafood platter.',
      image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -8.4333, lng: 112.4000 }),
      address: 'Desa Sendang Biru, Kec. Sumbermanjing, Malang, Jawa Timur',
      phone: '+62 341-421234',
      website: 'https://defish.com',
      specialties: JSON.stringify(['Ikan Bakar', 'Udang Bakar', 'Kerang Bakar', 'Seafood Platter']),
      menuItems: JSON.stringify({ main: ['Ikan Bakar Jimbaran', 'Udang Bakar Rica', 'Kerang Bakar Pete'], appetizer: ['Lele Goreng', 'Udang Goreng'], dessert: ['Puding Kelapa'], drinks: ['Es Teh Manis', 'Es Jeruk'] }),
      operatingHours: JSON.stringify({ monday: '11:00-21:00', tuesday: '11:00-21:00', wednesday: '11:00-21:00', thursday: '11:00-21:00', friday: '11:00-22:00', saturday: '11:00-22:00', sunday: '11:00-21:00' }),
      dietaryOptions: JSON.stringify({ halal: true, vegetarian: false, vegan: false, glutenFree: false }),
      seatingCapacity: 60,
      reservationRequired: false,
      paymentMethods: JSON.stringify(['cash', 'card', 'digital_wallet']),
      parking: true,
      wifi: true,
      delivery: false,
      takeaway: true
    },
    {
      name: 'Pantai Klayar Seafood',
      city: 'Pacitan',
      province: 'Jawa Timur',
      category: 'seafood',
      cuisine: 'indonesian',
      description: 'Restaurant seafood di tepi pantai Klayar. Ikan segar langsung dari laut dengan view sunset.',
      image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -8.2553, lng: 111.2461 }),
      address: 'Desa Klayar, Kec. Donorojo, Pacitan, Jawa Timur',
      phone: '+62 357-881234',
      website: null,
      specialties: JSON.stringify(['Ikan Bakar', 'Udang Bakar', 'Cumi Bakar', 'Soto Ikan']),
      menuItems: JSON.stringify({ main: ['Ikan Bakar Grilled', 'Udang Bakar Bumbu Rica', 'Cumi Bakar'], appetizer: ['Kerupuk Udang', 'Sambal'], dessert: ['Es Kelapa Muda'], drinks: ['Es Jeruk', 'Kelapa Muda'] }),
      operatingHours: JSON.stringify({ monday: '10:00-20:00', tuesday: '10:00-20:00', wednesday: '10:00-20:00', thursday: '10:00-20:00', friday: '10:00-21:00', saturday: '10:00-21:00', sunday: '10:00-20:00' }),
      dietaryOptions: JSON.stringify({ halal: true, vegetarian: false, vegan: false, glutenFree: false }),
      seatingCapacity: 40,
      reservationRequired: false,
      paymentMethods: JSON.stringify(['cash', 'digital_wallet']),
      parking: true,
      wifi: false,
      delivery: false,
      takeaway: true
    },

    // CAFE & COFFEE
    {
      name: 'Kopiko Roastery',
      city: 'Batu',
      province: 'Jawa Timur',
      category: 'cafe',
      cuisine: 'coffee',
      description: 'Coffee roastery dengan single origin beans dari plantation lokal. Suasana cozy dengan view pegunungan.',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2005?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2005?w=800&h=600&fit=crop'
      ]),
      rating: 4.7,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.8833, lng: 112.5167 }),
      address: 'Jl. Oro-Oro Ombo No. 123, Batu, Jawa Timur',
      phone: '+62 341-598234',
      website: 'https://kopiko-batu.com',
      specialties: JSON.stringify(['Single Origin Coffee', 'Kopi Luwak', 'Coffee-based Drinks']),
      menuItems: JSON.stringify({ main: ['Single Origin Espresso', 'Kopi Luwak Special', 'Coffee Cappuccino'], appetizer: ['Kue Lapis Legit', 'Brownies'], dessert: ['Cheesecake', 'Tiramisu'], drinks: ['Americano', 'Latte', 'Mocha'] }),
      operatingHours: JSON.stringify({ monday: '07:00-22:00', tuesday: '07:00-22:00', wednesday: '07:00-22:00', thursday: '07:00-22:00', friday: '07:00-23:00', saturday: '07:00-23:00', sunday: '07:00-22:00' }),
      dietaryOptions: JSON.stringify({ halal: true, vegetarian: true, vegan: true, glutenFree: true }),
      seatingCapacity: 35,
      reservationRequired: false,
      paymentMethods: JSON.stringify(['cash', 'card', 'digital_wallet']),
      parking: true,
      wifi: true,
      delivery: true,
      takeaway: true
    },
    {
      name: 'Halliman Coffee House',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'cafe',
      cuisine: 'coffee',
      description: 'Malang\'s famous coffee culture. Traditional Javanese coffee with modern brewing techniques.',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2005?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2005?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.9667, lng: 112.6333 }),
      address: 'Jl. Semampir No. 12, Malang, Jawa Timur',
      phone: '+62 341-361234',
      website: 'https://halliman-coffee.com',
      specialties: JSON.stringify(['Halliman Coffee', 'Traditional Brew', 'Kopi Susu']),
      menuItems: JSON.stringify({ main: ['Halliman Coffee', 'Traditional Brew', 'Kopi Susu'], appetizer: ['Kue Nastar', 'Kue Bolu'], dessert: ['Klepon'], drinks: ['Traditional Javanese Coffee'] }),
      operatingHours: JSON.stringify({ monday: '08:00-22:00', tuesday: '08:00-22:00', wednesday: '08:00-22:00', thursday: '08:00-22:00', friday: '08:00-23:00', saturday: '08:00-23:00', sunday: '08:00-22:00' }),
      dietaryOptions: JSON.stringify({ halal: true, vegetarian: true, vegan: false, glutenFree: true }),
      seatingCapacity: 25,
      reservationRequired: false,
      paymentMethods: JSON.stringify(['cash', 'card', 'digital_wallet']),
      parking: false,
      wifi: true,
      delivery: true,
      takeaway: true
    },

    // FINE DINING
    {
      name: 'The Majestic Restaurant',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'fine-dining',
      cuisine: 'international',
      description: 'Fine dining restaurant dengan chef internasional. menu degustasi yang sophisticated dengan wine pairing.',
      image: 'https://images.unsplash.com/photo-1556909114-4f9a8ce9d86e?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1556909114-4f9a8ce9d86e?w=800&h=600&fit=crop'
      ]),
      rating: 4.8,
      priceRange: 'luxury',
      coordinates: JSON.stringify({ lat: -7.2500, lng: 112.7500 }),
      address: 'Hotel Majapahit, Jl. Raya Tunjungan No. 1, Surabaya, Jawa Timur',
      phone: '+62 31-5318000',
      website: 'https://majapahit-hotel.com/dining',
      specialties: JSON.stringify(['Degustasi Menu', 'Wine Pairing', 'International Cuisine']),
      menuItems: JSON.stringify({ main: ['Degustasi Menu', 'Wagyu Beef', 'Lobster Thermidor'], appetizer: ['Oyster', 'Foie Gras'], dessert: ['Chocolate Souffle', 'Tiramisu'], drinks: ['Wine Selection', 'Premium Cocktails'] }),
      operatingHours: JSON.stringify({ monday: '18:00-23:00', tuesday: '18:00-23:00', wednesday: '18:00-23:00', thursday: '18:00-23:00', friday: '18:00-23:30', saturday: '18:00-23:30', sunday: '18:00-23:00' }),
      dietaryOptions: JSON.stringify({ halal: true, vegetarian: true, vegan: false, glutenFree: true }),
      seatingCapacity: 50,
      reservationRequired: true,
      paymentMethods: JSON.stringify(['card']),
      parking: true,
      wifi: true,
      delivery: false,
      takeaway: false
    },

    // CASUAL DINING
    {
      name: 'Batu Pizza Garden',
      city: 'Batu',
      province: 'Jawa Timur',
      category: 'casual',
      cuisine: 'international',
      description: 'Pizza garden dengan outdoor seating dan view Kota Batu. Wood-fired pizza dengan ingredients lokal.',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.8667, lng: 112.5167 }),
      address: 'Jl. Pandaan No. 45, Batu, Jawa Timur',
      phone: '+62 341-591234',
      website: null,
      specialties: JSON.stringify(['Wood-fired Pizza', 'Pasta', 'Salads']),
      menuItems: JSON.stringify({ main: ['Margherita Pizza', 'Pepperoni Pizza', 'Carbonara Pasta'], appetizer: ['Bruschetta', 'Garlic Bread'], dessert: ['Tiramisu', 'Gelato'], drinks: ['Beer', 'Wine', 'Soft Drinks'] }),
      operatingHours: JSON.stringify({ monday: '16:00-22:00', tuesday: '16:00-22:00', wednesday: '16:00-22:00', thursday: '16:00-22:00', friday: '16:00-23:00', saturday: '16:00-23:00', sunday: '16:00-22:00' }),
      dietaryOptions: JSON.stringify({ halal: true, vegetarian: true, vegan: true, glutenFree: true }),
      seatingCapacity: 70,
      reservationRequired: false,
      paymentMethods: JSON.stringify(['cash', 'card', 'digital_wallet']),
      parking: true,
      wifi: true,
      delivery: true,
      takeaway: true
    },

    // STREET FOOD
    {
      name: 'Bakso Malang Spesial',
      city: 'Malang',
      province: 'Jawa Timur',
      category: 'street-food',
      cuisine: 'local',
      description: 'Warung bakso legendaris dengan resep turun temurun. Bakso dengan kuah segar dan pentol yang kenyal.',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae4a?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae4a?w=800&h=600&fit=crop'
      ]),
      rating: 4.5,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.9833, lng: 112.6333 }),
      address: 'Jl. Ijen No. 23, Malang, Jawa Timur',
      phone: '+62 341-331234',
      website: null,
      specialties: JSON.stringify(['Bakso Malang', 'Pentol', 'Siomay']),
      menuItems: JSON.stringify({ main: ['Bakso Malang', 'Pentol', 'Siomay'], appetizer: ['Kerupuk'], dessert: ['Es Cendol'], drinks: ['Teh Manis'] }),
      operatingHours: JSON.stringify({ monday: '06:00-18:00', tuesday: '06:00-18:00', wednesday: '06:00-18:00', thursday: '06:00-18:00', friday: '06:00-18:00', saturday: '06:00-19:00', sunday: '06:00-19:00' }),
      dietaryOptions: JSON.stringify({ halal: true, vegetarian: false, vegan: false, glutenFree: false }),
      seatingCapacity: 20,
      reservationRequired: false,
      paymentMethods: JSON.stringify(['cash', 'digital_wallet']),
      parking: false,
      wifi: false,
      delivery: false,
      takeaway: true
    },

    // ADD MORE RESTAURANTS TO REACH 25+
    {
      name: 'Gubug Seafood',
      city: 'Situbondo',
      province: 'Jawa Timur',
      category: 'seafood',
      cuisine: 'indonesian',
      description: 'Seafood restaurant dengan view tambak udang. Spesialisasi seafood segar dengan harga terjangkau.',
      image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop'
      ]),
      rating: 4.1,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.8500, lng: 114.0500 }),
      address: 'Desa Wonorejo, Kec. Banyuputih, Situbondo, Jawa Timur',
      phone: '+62 338-421234',
      website: null,
      specialties: JSON.stringify(['Ikan Bakar', 'Udang Bakar', 'Cumi Bakar']),
      menuItems: JSON.stringify({ main: ['Ikan Bakar', 'Udang Bakar', 'Cumi Bakar'], appetizer: ['Kerupuk Udang'], dessert: ['Es Kelapa'], drinks: ['Es Jeruk', 'Es Tebu'] }),
      operatingHours: JSON.stringify({ monday: '10:00-21:00', tuesday: '10:00-21:00', wednesday: '10:00-21:00', thursday: '10:00-21:00', friday: '10:00-21:00', saturday: '10:00-22:00', sunday: '10:00-21:00' }),
      dietaryOptions: JSON.stringify({ halal: true, vegetarian: false, vegan: false, glutenFree: false }),
      seatingCapacity: 60,
      reservationRequired: false,
      paymentMethods: JSON.stringify(['cash', 'digital_wallet']),
      parking: true,
      wifi: false,
      delivery: false,
      takeaway: true
    },
    {
      name: 'Nasi Goreng Special',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'casual',
      cuisine: 'indonesian',
      description: 'Warteg modern dengan specialize nasi goreng. berbagai varian nasi goreng dengan lauk lengkap.',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop'
      ]),
      rating: 4.0,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.2167, lng: 112.7500 }),
      address: 'Jl. Gemblong No. 12, Surabaya, Jawa Timur',
      phone: '+62 31-531234',
      website: null,
      specialties: JSON.stringify(['Nasi Goreng', 'Mie Goreng', 'Ayam Bakar']),
      menuItems: JSON.stringify({ main: ['Nasi Goreng Special', 'Mie Goreng', 'Ayam Bakar'], appetizer: ['Kerupuk'], dessert: ['Puding'], drinks: ['Es Teh', 'Es Jeruk'] }),
      operatingHours: JSON.stringify({ monday: '06:00-22:00', tuesday: '06:00-22:00', wednesday: '06:00-22:00', thursday: '06:00-22:00', friday: '06:00-22:00', saturday: '06:00-23:00', sunday: '06:00-22:00' }),
      dietaryOptions: JSON.stringify({ halal: true, vegetarian: true, vegan: true, glutenFree: false }),
      seatingCapacity: 40,
      reservationRequired: false,
      paymentMethods: JSON.stringify(['cash', 'digital_wallet']),
      parking: true,
      wifi: false,
      delivery: true,
      takeaway: true
    },
    {
      name: 'Pecel Lele Malioboro',
      city: 'Kediri',
      province: 'Jawa Timur',
      category: 'traditional',
      cuisine: 'local',
      description: 'Warung pecel lele dengan style Malioboro. lelegoreng crispy dengan sayur pecel yang segar.',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae4a?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae4a?w=800&h=600&fit=crop'
      ]),
      rating: 4.3,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.8167, lng: 112.0000 }),
      address: 'Jl. Malioboro No. 56, Kediri, Jawa Timur',
      phone: '+62 354-421234',
      website: null,
      specialties: JSON.stringify(['Pecel Lele', 'Pecel Ayam', 'Sayur Pecel']),
      menuItems: JSON.stringify({ main: ['Pecel Lele', 'Pecel Ayam', 'Sayur Pecel'], appetizer: ['Kerupuk'], dessert: ['Es Cendol'], drinks: ['Es Teh', 'Teh Manis'] }),
      operatingHours: JSON.stringify({ monday: '08:00-20:00', tuesday: '08:00-20:00', wednesday: '08:00-20:00', thursday: '08:00-20:00', friday: '08:00-21:00', saturday: '08:00-21:00', sunday: '08:00-20:00' }),
      dietaryOptions: JSON.stringify({ halal: true, vegetarian: true, vegan: true, glutenFree: false }),
      seatingCapacity: 35,
      reservationRequired: false,
      paymentMethods: JSON.stringify(['cash', 'digital_wallet']),
      parking: true,
      wifi: false,
      delivery: false,
      takeaway: true
    },
    {
      name: 'Gedung Sate Surabaya',
      city: 'Surabaya',
      province: 'Jawa Timur',
      category: 'traditional',
      cuisine: 'indonesian',
      description: 'Restaurant dengan arsitektur klasik Surabaya. Menu khas Indonesia dengan sajian yang elegant.',
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.2500, lng: 112.7500 }),
      address: 'Jl. Tunjungan No. 7, Surabaya, Jawa Timur',
      phone: '+62 31-531234',
      website: null,
      specialties: JSON.stringify(['Sate', 'Rendang', 'Gudeg', 'Ayam Bakar']),
      menuItems: JSON.stringify({ main: ['Sate', 'Rendang Sapi', 'Gudeg'], appetizer: ['Kerupuk', 'Sambal'], dessert: ['Klepon'], drinks: ['Es Jeruk', 'Bandrek'] }),
      operatingHours: JSON.stringify({ monday: '11:00-22:00', tuesday: '11:00-22:00', wednesday: '11:00-22:00', thursday: '11:00-22:00', friday: '11:00-22:30', saturday: '11:00-22:30', sunday: '11:00-22:00' }),
      dietaryOptions: JSON.stringify({ halal: true, vegetarian: true, vegan: false, glutenFree: false }),
      seatingCapacity: 45,
      reservationRequired: false,
      paymentMethods: JSON.stringify(['cash', 'card', 'digital_wallet']),
      parking: true,
      wifi: true,
      delivery: true,
      takeaway: true
    },
    {
      name: 'Bromo Coffee House',
      city: 'Probolinggo',
      province: 'Jawa Timur',
      category: 'cafe',
      cuisine: 'coffee',
      description: 'Coffee house dengan view Gunung Bromo. Perfect spot untuk morning coffee sebelum expedition.',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2005?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2005?w=800&h=600&fit=crop'
      ]),
      rating: 4.4,
      priceRange: 'moderate',
      coordinates: JSON.stringify({ lat: -7.9425, lng: 112.9530 }),
      address: 'Desa Ngadisari, Kec. Sukapura, Probolinggo, Jawa Timur',
      phone: '+62 335-541234',
      website: null,
      specialties: JSON.stringify(['Bromo Coffee', 'Traditional Brew', 'Mountain Coffee']),
      menuItems: JSON.stringify({ main: ['Bromo Coffee', 'Traditional Brew', 'Coffee'], appetizer: ['Kue Bolu'], dessert: ['Puding'], drinks: ['Traditional Coffee'] }),
      operatingHours: JSON.stringify({ monday: '05:00-20:00', tuesday: '05:00-20:00', wednesday: '05:00-20:00', thursday: '05:00-20:00', friday: '05:00-21:00', saturday: '05:00-21:00', sunday: '05:00-20:00' }),
      dietaryOptions: JSON.stringify({ halal: true, vegetarian: true, vegan: true, glutenFree: true }),
      seatingCapacity: 25,
      reservationRequired: false,
      paymentMethods: JSON.stringify(['cash', 'digital_wallet']),
      parking: true,
      wifi: false,
      delivery: false,
      takeaway: true
    },
    {
      name: 'Soto Ayam Kang Pisman',
      city: 'Madiun',
      province: 'Jawa Timur',
      category: 'traditional',
      cuisine: 'local',
      description: 'Warung soto ayam dengan resep turun temurun. kuahnya yang segar dan aroma rempah yang khas.',
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop'
      ]),
      rating: 4.6,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.6167, lng: 111.5333 }),
      address: 'Jl. Pahlawan No. 78, Madiun, Jawa Timur',
      phone: '+62 351-421234',
      website: null,
      specialties: JSON.stringify(['Soto Ayam', 'Soto Daging', 'Bubur Kacang Hijau']),
      menuItems: JSON.stringify({ main: ['Soto Ayam', 'Soto Daging'], appetizer: ['Bubur Kacang Hijau'], dessert: ['Puding Kelapa'], drinks: ['Es Teh', 'Air Mineral'] }),
      operatingHours: JSON.stringify({ monday: '06:00-18:00', tuesday: '06:00-18:00', wednesday: '06:00-18:00', thursday: '06:00-18:00', friday: '06:00-18:00', saturday: '06:00-19:00', sunday: '06:00-18:00' }),
      dietaryOptions: JSON.stringify({ halal: true, vegetarian: true, vegan: false, glutenFree: false }),
      seatingCapacity: 20,
      reservationRequired: false,
      paymentMethods: JSON.stringify(['cash', 'digital_wallet']),
      parking: false,
      wifi: false,
      delivery: false,
      takeaway: true
    },
    {
      name: 'Rumah Bakso Jumbo',
      city: 'Bojonegoro',
      province: 'Jawa Timur',
      category: 'traditional',
      cuisine: 'local',
      description: 'Bakso jumbo dengan porsi yang besar. Pentol yang kenyal dan kuahnya yang segar.',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae4a?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae4a?w=800&h=600&fit=crop'
      ]),
      rating: 4.2,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.1167, lng: 111.8833 }),
      address: 'Jl. Merdeka No. 34, Bojonegoro, Jawa Timur',
      phone: '+62 352-391234',
      website: null,
      specialties: JSON.stringify(['Bakso Jumbo', 'Pentol Jumbo', 'Siomay']),
      menuItems: JSON.stringify({ main: ['Bakso Jumbo', 'Pentol Jumbo', 'Siomay'], appetizer: ['Kerupuk'], dessert: ['Es Cendol'], drinks: ['Teh Manis', 'Es Jeruk'] }),
      operatingHours: JSON.stringify({ monday: '07:00-19:00', tuesday: '07:00-19:00', wednesday: '07:00-19:00', thursday: '07:00-19:00', friday: '07:00-20:00', saturday: '07:00-20:00', sunday: '07:00-19:00' }),
      dietaryOptions: JSON.stringify({ halal: true, vegetarian: false, vegan: false, glutenFree: false }),
      seatingCapacity: 30,
      reservationRequired: false,
      paymentMethods: JSON.stringify(['cash', 'digital_wallet']),
      parking: true,
      wifi: false,
      delivery: false,
      takeaway: true
    },
    {
      name: 'Pondok Cabe Indonesia',
      city: 'Nganjuk',
      province: 'Jawa Timur',
      category: 'traditional',
      cuisine: 'indonesian',
      description: 'Rumah makan keluarga dengan menu khas Indonesia. Suasana hangat dan pelayanan yang ramah.',
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop'
      ]),
      rating: 4.1,
      priceRange: 'budget',
      coordinates: JSON.stringify({ lat: -7.5833, lng: 111.9000 }),
      address: 'Jl. Veteran No. 23, Nganjuk, Jawa Timur',
      phone: '+62 358-391234',
      website: null,
      specialties: JSON.stringify(['Nasi Gudeg', 'Ayam Bakar', 'Ikan Bakar']),
      menuItems: JSON.stringify({ main: ['Nasi Gudeg', 'Ayam Bakar', 'Ikan Bakar'], appetizer: ['Kerupuk'], dessert: ['Bubur Kacang Hijau'], drinks: ['Es Jeruk', 'Teh Manis'] }),
      operatingHours: JSON.stringify({ monday: '09:00-21:00', tuesday: '09:00-21:00', wednesday: '09:00-21:00', thursday: '09:00-21:00', friday: '09:00-21:00', saturday: '09:00-22:00', sunday: '09:00-21:00' }),
      dietaryOptions: JSON.stringify({ halal: true, vegetarian: true, vegan: false, glutenFree: false }),
      seatingCapacity: 25,
      reservationRequired: false,
      paymentMethods: JSON.stringify(['cash', 'digital_wallet']),
      parking: true,
      wifi: false,
      delivery: true,
      takeaway: true
    }
  ];

  const createdRestaurants = await Promise.all(
    restaurants.map(restaurant => prisma.restaurant.create({ data: restaurant }))
  );
  console.log(`✅ Created ${createdRestaurants.length} restaurants`);

  console.log('🎉 Comprehensive seed completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - ${createdDestinations.length} destinations`);
  console.log(`   - ${createdUsers.length} users`);
  console.log(`   - ${createdTransportations.length} transportation options`);
  console.log(`   - ${createdTopics.length} forum topics`);
  console.log(`   - ${createdReviews.length} reviews`);
  console.log(`   - ${createdAccommodations.length} accommodations`);
  console.log(`   - ${createdRestaurants.length} restaurants`);
  console.log(`   - ${currencies.length} currencies`);
  console.log(`   - ${categories.length} forum categories`);
  console.log(`\n🔑 Sample Accounts:`);
  console.log(`   📧 demo@jatour.com / demo123`);
  console.log(`   📧 traveler@jatour.com / traveler123`);
  console.log(`   📧 mountain@jatour.com / mountain123`);
  console.log(`   📧 beachlover@jatour.com / beach123`);
  console.log(`   📧 photographer@jatour.com / photo123`);
  console.log(`\n✨ Features Available:`);
  console.log(`   🏔️  Mountains: Bromo, Semeru, Arjuno, Welirang, Kawi, Penanggungan`);
  console.log(`   🏖️  Beaches: Klayar, Balekambang, Carita, Plengkung (G-Land), Parangtritis, Ngliyep, Sendang Biru`);
  console.log(`   🏛️  Temples: Penataran, Jago, Badut, Sumberawan`);
  console.log(`   🏙️  Cities: Malang, Surabaya, Batu`);
  console.log(`   🏞️  Waterfalls: Coban Rondo, Madakaripura, Coban Rais`);
  console.log(`   🏞️  Lakes: Ranu Pani, Ranu Kumbolo`);
  console.log(`   🌲  National Parks: Bromo Tengger Semeru, Baluran, Meru Betiri`);
  console.log(`   🏛️  Museums: Bung Karno, Malang Tempo Doeloe`);
  console.log(`   🎢  Theme Parks: Jatim Park 1 & 2, Batu Secret Zoo`);
  console.log(`   📚  Forum: 8 categories with 7 sample discussions`);
  console.log(`   🚗  Transportation: Bus, Train, Flight, Car Rental options`);
  console.log(`   💱  Multi-currency support (IDR, USD, EUR, SGD, MYR, THB, AUD)`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
