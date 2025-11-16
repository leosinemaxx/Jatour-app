import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
// Try .env.local first (for frontend), then server/.env (for backend)
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const prisma = new PrismaClient();

async function createUser() {
  const email = process.argv[2] || 'admin@jatour.com';
  const password = process.argv[3] || 'admin123';
  const fullName = process.argv[4] || 'Admin User';
  const phone = process.argv[5] || '+6281234567890';

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`❌ User with email ${email} already exists!`);
      console.log(`   User ID: ${existingUser.id}`);
      console.log(`   Full Name: ${existingUser.fullName}`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        phone,
        profilePicture: '/avatars/default.jpg',
        preferences: {
          language: 'id',
          notifications: true,
          theme: 'light',
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        createdAt: true,
      },
    });

    console.log('✅ User created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', user.email);
    console.log('👤 Full Name:', user.fullName);
    console.log('📱 Phone:', user.phone || 'Not set');
    console.log('🆔 User ID:', user.id);
    console.log('📅 Created:', user.createdAt);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Password:', password);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 You can now sign in with these credentials!');
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();

