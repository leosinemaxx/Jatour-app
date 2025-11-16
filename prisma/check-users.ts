import { PrismaClient } from '@prisma/client';

// dotenv will be loaded by ts-node via -r dotenv/config flag

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('🔍 Checking registered users...\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (users.length === 0) {
    console.log('❌ No users found in the database.');
    console.log('💡 Run "npm run prisma:seed" to create a demo user.\n');
    await prisma.$disconnect();
    return;
  }

  console.log('📋 Registered Users:');
  console.log('='.repeat(60));
  
  users.forEach((user, index) => {
    console.log(`\n${index + 1}. ${user.fullName}`);
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   📱 Phone: ${user.phone || 'N/A'}`);
    console.log(`   📅 Created: ${user.createdAt.toLocaleString()}`);
    console.log(`   🆔 ID: ${user.id}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Total users: ${users.length}\n`);
  console.log('💡 Note: Passwords are hashed and cannot be displayed.');
  console.log('   To test login, use the email addresses shown above.\n');

  await prisma.$disconnect();
}

checkUsers().catch((e) => {
  console.error('❌ Error checking users:', e);
  process.exit(1);
});

