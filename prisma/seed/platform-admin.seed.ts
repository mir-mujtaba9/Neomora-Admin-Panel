import { PrismaService } from '../../src/infra/database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Load env variables
dotenv.config();

const prisma = new PrismaService();

export async function seedPlatformAdmin() {
  const email = 'admin@neomora.com';
  const plainPassword = 'Admin123!';
  
  // Hash the password with 12 rounds of bcrypt
  const passwordHash = await bcrypt.hash(plainPassword, 12);

  try {
    const admin = await (prisma as any).platformAdmin.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        firstName: 'Platform',
        lastName: 'Owner',
        role: 'OWNER',
        isActive: true,
      },
    });

    console.log(`Platform admin seeded: ${admin.email} (${admin.role})`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedPlatformAdmin()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
