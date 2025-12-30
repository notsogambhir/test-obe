import { seed } from '../src/lib/seed';

console.log('Starting seed...');
seed()
  .then(() => {
    console.log('Seeding completed successfully.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  });
