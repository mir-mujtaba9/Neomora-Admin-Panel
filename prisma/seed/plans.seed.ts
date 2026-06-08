import { PrismaService } from '../../src/infra/database/prisma.service';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaService();

export async function seedPlans() {
  try {
    const starter = await (prisma as any).plan.upsert({
      where: { code: 'STARTER' },
      update: {},
      create: {
        name: 'Starter',
        code: 'STARTER',
        maxUsers: 50,
        maxLocations: 1,
        maxParticipants: 200,
      },
    });

    const professional = await (prisma as any).plan.upsert({
      where: { code: 'PROFESSIONAL' },
      update: {},
      create: {
        name: 'Professional',
        code: 'PROFESSIONAL',
        maxUsers: 250,
        maxLocations: 5,
        maxParticipants: 2000,
      },
    });

    const enterprise = await (prisma as any).plan.upsert({
      where: { code: 'ENTERPRISE' },
      update: {},
      create: {
        name: 'Enterprise',
        code: 'ENTERPRISE',
        maxUsers: 1000,
        maxLocations: 50,
        maxParticipants: 10000,
      },
    });

    console.log('Plans seeded:', [starter.name, professional.name, enterprise.name].join(', '));
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedPlans()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
