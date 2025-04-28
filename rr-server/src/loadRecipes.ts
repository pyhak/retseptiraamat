import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
import recipesData from '../recipes.json';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const client = new Client({
  node: process.env.ELASTICSEARCH_NODE,
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || '',
    password: process.env.ELASTICSEARCH_PASSWORD || '',
  },
});

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  category: string;
  sortID: number;
}

interface Rating {
  user: string;
  value: 'JAH' | 'EI' | 'MEH';
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  tutorial: string;
  serves: number;
  ingredients: Ingredient[];
  ratings: Rating[];
  category: string;
  tags: string[];
  createdAt: string;
}

// Laadime Elasticsearchist kategooriad
async function loadCategories() {
  const response = await client.search({
    index: 'categories', 
    query: {
      match_all: {}
    }
  });

  return response.hits.hits.map((hit: any) => hit._source);
}

// Laadime Elasticsearchist sortOrder
async function loadSortOrder() {
  const response = await client.search({
    index: 'sortorder', 
    query: {
      match_all: {}
    }
  });

  return response.hits.hits.reduce((acc: any, hit: any) => {
    acc[hit._source.category] = hit._source.sortID;
    return acc;
  }, {});
}

// Laadime retseptid ja määrame kategooriad ja sortID
async function loadRecipesBulk() {

  const categories = await loadCategories();  // Laeme kategooriad Elasticsearchist
  const sortOrder = await loadSortOrder();  // Laeme sortOrder väärtused Elasticsearchist

  const recipes: Recipe[] = (recipesData as any[]).map((r) => ({
    ...r,
    id: uuidv4(),
    ratings: r.ratings ?? [],
    tags: r.tags ?? [],
    createdAt: new Date().toISOString(),
    ingredients: r.ingredients.map((ingredient: { name: string }) => {
      // Määrame koostisosadele kategooria ja sortID
      const category = categories.find((c: any) => c.name === ingredient.name) || 'Muu';
      return {
        ...ingredient,
        category,
        sortID: sortOrder[category] || 99,
      };
    }),
  }));

  const bulkBody = recipes.flatMap((recipe) => [
    { index: { _index: 'recipes' } },
    recipe
  ]);

  try {
    const bulkResponse = await client.bulk({
      refresh: true,
      body: bulkBody
    });

    if (bulkResponse.errors) {
      const erroredDocuments = bulkResponse.items.filter((item: any) => item.index && item.index.error);
      console.error('Mõned dokumendid ebaõnnestusid:', erroredDocuments);
    } else {
      console.log(`Laaditi edukalt ${recipes.length} retsepti Elasticsearchi.`);
    }
  } catch (error) {
    console.error('Viga bulk laadimisel:', error);
  }
}

// Kontrollime, kas indeks eksisteerib
async function checkIndex() {
  const indexName = 'recipes';
  const indexExists = await client.indices.exists({ index: indexName });

  if (indexExists) {
    console.log(`Indeks "${indexName}" juba eksisteerib.`);
  } else {
    console.log(`Indeksit "${indexName}" ei leitud. Loome selle...`);

    await client.indices.create({
      index: indexName,
      mappings: {
        properties: {
          id: { type: 'keyword' },
          title: { type: 'text' },
          description: { type: 'text' },
          tutorial: { type: 'text' },
          serves: { type: 'integer' },
          category: { type: 'keyword' },
          tags: { type: 'keyword' },
          createdAt: { type: 'date' },
          ratings: {
            type: 'nested',
            properties: {
              user: { type: 'keyword' },
              value: { type: 'keyword' }
            }
          },
          ingredients: {
            type: 'nested',
            properties: {
              name: { type: 'text' },
              amount: { type: 'keyword' },
              unit: { type: 'keyword' },
              category: { type: 'keyword' },
              sortID: { type: 'integer' }
            }
          }
        }
      }
    });

    console.log(`Indeks "${indexName}" loodud.`);
  }
}

async function deleteIndex() {
  const indexName = 'recipes';
  const indexExists = await client.indices.exists({ index: indexName });

  if (indexExists) {
    console.log(`Indeks "${indexName}" eksisteerib, kustutame selle...`);
    await client.indices.delete({ index: indexName });
    console.log(`Indeks "${indexName}" on kustutatud.`);
  } else {
    console.log(`Indeks "${indexName}" ei eksisteeri.`);
  }
}

async function createIndex() {
  const indexName = 'recipes';
  const indexExists = await client.indices.exists({ index: indexName });

  if (!indexExists) {
    console.log(`Indeks "${indexName}" ei eksisteeri, loome selle...`);

    await client.indices.create({
      index: indexName,
      mappings: {
        properties: {
          id: { type: 'keyword' },
          title: { type: 'text' },
          description: { type: 'text' },
          tutorial: { type: 'text' },
          serves: { type: 'integer' },
          category: { type: 'keyword' },
          tags: { type: 'keyword' },
          createdAt: { type: 'date' },
          ratings: {
            type: 'nested',
            properties: {
              user: { type: 'keyword' },
              value: { type: 'keyword' }
            }
          },
          ingredients: {
            type: 'nested',
            properties: {
              name: { type: 'text' },
              amount: { type: 'keyword' },
              unit: { type: 'keyword' },
              category: { type: 'keyword' },
              sortID: { type: 'integer' }
            }
          }
        }
      }
    });

    console.log(`Indeks "${indexName}" loodud.`);
  } else {
    console.log(`Indeks "${indexName}" juba eksisteerib.`);
  }
}

export default async function resetIndexAndLoadRecipes() {
  await deleteIndex();
  await createIndex();
  await loadRecipesBulk();
  console.log('Data loaded into indexes');
}
