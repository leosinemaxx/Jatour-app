import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// dotenv will be loaded by ts-node via -r dotenv/config flag

const prisma = new PrismaClient();

async function verifyUser() {
  const email = process.argv[2] || 'admin@jatour.com';
  const password = process.argv[3] || 'admin123';

  try {
    console.log('🔍 Verifying user credentials...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        fullName: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.log('❌ User NOT FOUND in database!');
      console.log('\n💡 Solution: Create the user first:');
      console.log('   npm run prisma:create-user');
      return;
    }

    console.log('✅ User FOUND in database!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🆔 User ID:', user.id);
    console.log('👤 Full Name:', user.fullName);
    console.log('📱 Phone:', user.phone || 'Not set');
    console.log('📅 Created:', user.createdAt);
    console.log('🔐 Password Hash Length:', user.password.length);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test password
    console.log('🔐 Testing password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      console.log('✅ Password is CORRECT!');
      console.log('\n💡 You should be able to login with these credentials.');
      console.log('   If login still fails, check:');
      console.log('   1. Backend server is running (npm run dev:server)');
      console.log('   2. Backend is on port 3001');
      console.log('   3. Database connection is working');
    } else {
      console.log('❌ Password is INCORRECT!');
      console.log('\n💡 Solution: Reset the password:');
      console.log(`   npm run prisma:create-user ${email} ${password} "${user.fullName}" "${user.phone || ''}"`);
      console.log('\n   Or delete and recreate:');
      console.log(`   "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe" -U postgres -d jatour -c "DELETE FROM users WHERE email = '${email}';"`);
      console.log(`   npm run prisma:create-user ${email} ${password}`);
    }
  } catch (error) {
    console.error('❌ Error verifying user:', error);
    console.error('\n💡 Check:');
    console.error('   1. Database is running');
    console.error('   2. DATABASE_URL is correct in server/.env');
    console.error('   3. Prisma client is generated (npm run prisma:generate)');
  } finally {
    await prisma.$disconnect();
  }
}

verifyUser();

