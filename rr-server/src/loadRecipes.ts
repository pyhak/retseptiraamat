import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
import recipesData from '../recipes.json';
import { v4 as uuidv4 } from 'uuid';
import { categories, sortOrder } from './utils/categories';  // Impordime kategooriad ja sortID

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
  category: string; // Kategooria lisatud
  sortID: number;   // SortID lisatud
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

// Laadime retseptide andmed ja määrame kategooriad ja sortID
const recipes: Recipe[] = (recipesData as any[]).map((r) => ({
  ...r,
  id: uuidv4(),
  ratings: r.ratings ?? [],
  tags: r.tags ?? [],
  createdAt: new Date().toISOString(),
  ingredients: r.ingredients.map((ingredient: { name: string | number; }) => {
    const category = categories[ingredient.name as keyof typeof categories] || 'Muu'; // Kui kategooriat pole, määrame "Muu"
    return {
      ...ingredient,
      category: category,
      sortID: sortOrder[category as keyof typeof sortOrder] || 99, // Kõrge sortID kui kategooria puudub
    };
  }),
}));

// Kontrollime, kas indeks eksisteerib
async function checkIndex() {
  const indexName = 'recipes';

  const indexExists = await client.indices.exists({ index: indexName });

  if (indexExists) {
    console.log(`Indeks "${indexName}" juba eksisteerib.`);
  } else {
    console.log(`Indeksit "${indexName}" ei leitud. Loome selle...`);

    // Loome Elasticsearchis indeksi, kus määrame kõigi väljade tüüpide määratlus
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
              category: { type: 'keyword' }, // Kategooria lisatud
              sortID: { type: 'integer' }    // SortID lisatud
            }
          }
        }
      }
    });

    console.log(`Indeks "${indexName}" loodud.`);
  }
}

async function loadRecipesBulk() {
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
        const erroredDocuments = bulkResponse.items.filter(
          (item: any) => item.index && item.index.error
        );
        console.error('Mõned dokumendid ebaõnnestusid:', erroredDocuments);
      } else {
        console.log(`Laaditi edukalt ${recipes.length} retsepti Elasticsearchi.`);
      }
    } catch (error) {
      console.error('Viga bulk laadimisel:', error);
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
                category: { type: 'keyword' }, // Kategooria lisatud
                sortID: { type: 'integer' }    // SortID lisatud
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
  

  async function resetIndexAndLoadRecipes() {
    await deleteIndex();  // Eemaldame olemasoleva indeksi
    await createIndex();   // Loome uue indeksi
    await loadRecipesBulk();   // Laadime retseptid
  }
  
  resetIndexAndLoadRecipes();  // Käivitame funktsiooni