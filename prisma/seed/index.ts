import { seedPlatformAdmin } from './platform-admin.seed';
import { seedPlans } from './plans.seed';

async function main() {
  console.log('Starting seed...');
  await seedPlatformAdmin();
  await seedPlans();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
