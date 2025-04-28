import resetIndexesAndLoadData from '../loadData';
import resetIndexAndLoadRecipes from '../loadRecipes';

async function seed() {
  console.log('🔄 Resetting base data...');
  await resetIndexesAndLoadData();

  console.log('🍲 Loading recipes...');
  await resetIndexAndLoadRecipes();

  console.log('✅ Database seed complete');
}

seed().catch(error => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});