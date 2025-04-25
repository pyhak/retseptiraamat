import dotenv from 'dotenv';
import { Client } from '@elastic/elasticsearch';
import recipesData from '../recipes.json';
import { IndicesCreateRequest } from '@elastic/elasticsearch/lib/api/types';
dotenv.config();

const client = new Client({
    node: process.env.ELASTICSEARCH_NODE,
    auth: {
        username: process.env.ELASTICSEARCH_USERNAME || '',
        password: process.env.ELASTICSEARCH_PASSWORD || ''
    }
});

const recipes = recipesData;

async function checkIndex() {
    const indexName = 'recipes';

    const indexExists = await client.indices.exists({ index: indexName });

    if (indexExists) {
        console.log(`Indeks "${indexName}" juba eksisteerib.`);
    } else {
        console.log(`Indeksit "${indexName}" ei leitud. Loome selle...`);

        const recipeIndexDefinition: IndicesCreateRequest = {
            index: indexName,
            mappings: {
                properties: {
                    title: { type: 'text' },
                    description: { type: 'text' },
                    tutorial: { type: 'text' },
                    ingredients: {
                        type: 'nested',
                        properties: {
                            name: { type: 'text' },
                            amount: { type: 'keyword' },
                            unit: { type: 'keyword' }
                        }
                    }
                }
            }
        };

        await client.indices.create(recipeIndexDefinition);
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
        refresh: true, // kohe otsitav
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

async function loadRecipes() {
    await checkIndex();
    await loadRecipesBulk();
}

loadRecipes();
