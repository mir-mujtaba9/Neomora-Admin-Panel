import { seedPlatformAdmin } from './platform-admin.seed';

async function main() {
  console.log('Starting seed...');
  await seedPlatformAdmin();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
