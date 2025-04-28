import dotenv from 'dotenv';
dotenv.config(); // Laeme .env muutujad esimesena!

import { Client } from '@elastic/elasticsearch';
import { categories } from './data/categories';
import { ingredients } from './data/ingredients';
// Kui vajad hiljem sortOrderi andmeid, saad selle avada
// import { sortOrders } from './data/sortOrders';

const client = new Client({
  node: process.env.ELASTICSEARCH_NODE,
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || '',
    password: process.env.ELASTICSEARCH_PASSWORD || '',
  },
});

async function deleteIndex(indexName: string) {
  try {
    const exists = await client.indices.exists({ index: indexName });
    if (exists) {
      await client.indices.delete({ index: indexName });
      console.log(`🗑️ Index "${indexName}" deleted`);
    } else {
      console.log(`ℹ️ Index "${indexName}" did not exist`);
    }
  } catch (error) {
    console.error(`❌ Error deleting index "${indexName}":`, error);
  }
}

async function createCategoryIndex() {
  await client.indices.create({
    index: 'categories',
    mappings: {
      properties: {
        name: { type: 'text' },
        sortID: { type: 'integer' },
      },
    },
  });
  console.log('✅ Category index created');
}

async function createIngredientIndex() {
  await client.indices.create({
    index: 'ingredients',
    mappings: {
      properties: {
        name: { type: 'text' },
        category: { type: 'keyword' },
      },
    },
  });
  console.log('✅ Ingredient index created');
}

async function createSortOrderIndex() {
  await client.indices.create({
    index: 'sortorder',
    mappings: {
      properties: {
        category: { type: 'keyword' },
        sortID: { type: 'integer' },
      },
    },
  });
  console.log('✅ SortOrder index created');
}

async function loadCategories() {
  for (const category of categories) {
    await client.index({
      index: 'categories',
      document: category,
      refresh: 'wait_for', // kohe pärast lisamist saadaval
    });
  }
  console.log(`✅ ${categories.length} categories loaded`);
}

async function loadIngredients() {
  for (const ingredient of ingredients) {
    await client.index({
      index: 'ingredients',
      document: ingredient,
      refresh: 'wait_for',
    });
  }
  console.log(`✅ ${ingredients.length} ingredients loaded`);
}

// Kui kunagi soovid sortOrder andmeid laadida
// async function loadSortOrders() {
//   for (const sortOrder of sortOrders) {
//     await client.index({
//       index: 'sortorder',
//       document: sortOrder,
//       refresh: 'wait_for',
//     });
//   }
//   console.log(`✅ ${sortOrders.length} sort orders loaded`);
// }

export default async function resetIndexesAndLoadData() {
  try {
    console.log('🔄 Starting full reset and data load...');

    // 1. Kustutame olemasolevad indeksid
    await deleteIndex('categories');
    await deleteIndex('ingredients');
    await deleteIndex('sortorder');

    // 2. Loome indeksid uuesti
    await createCategoryIndex();
    await createIngredientIndex();
    await createSortOrderIndex();

    // 3. Laeme andmed
    await loadCategories();
    await loadIngredients();
    // await loadSortOrders();

    console.log('🎉 Base data successfully reset and loaded!');
  } catch (error) {
    console.error('❌ Error during full reset:', error);
  }
}
