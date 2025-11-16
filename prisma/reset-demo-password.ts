import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// dotenv will be loaded by ts-node via -r dotenv/config flag

const prisma = new PrismaClient();

async function resetDemoPassword() {
  console.log('🔐 Resetting demo user password...\n');

  const demoEmail = 'demo@jatour.com';
  const newPassword = 'demo123';

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (!existingUser) {
    console.log('❌ User not found. Creating new demo user...\n');
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const newUser = await prisma.user.create({
      data: {
        email: demoEmail,
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
    
    console.log('✅ Created demo user:');
    console.log(`   📧 Email: ${newUser.email}`);
    console.log(`   🔑 Password: ${newPassword}\n`);
  } else {
    console.log('✅ Found existing user. Updating password...\n');
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await prisma.user.update({
      where: { email: demoEmail },
      data: { password: hashedPassword },
    });
    
    console.log('✅ Password updated successfully!');
    console.log(`   📧 Email: ${updatedUser.email}`);
    console.log(`   🔑 New Password: ${newPassword}\n`);
    console.log('💡 You can now login with these credentials.\n');
  }

  await prisma.$disconnect();
}

resetDemoPassword().catch((e) => {
  console.error('❌ Error resetting password:', e);
  process.exit(1);
});

