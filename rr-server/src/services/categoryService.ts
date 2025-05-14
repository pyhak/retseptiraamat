// helper kategooriate lisamiseks
import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  node: process.env.ELASTICSEARCH_NODE,
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || '',
    password: process.env.ELASTICSEARCH_PASSWORD || '',
  },
});

export async function getCategoryNames(): Promise<string[]> {
  const response = await client.search({
    index: 'categories',
    size: 1000,
    query: {
      match_all: {}
    }
  });

  return response.hits.hits.map((hit: any) => hit._source.name);
}

export async function addNewCategory(name: string): Promise<void> {
  await client.index({
    index: 'categories',
    document: {
      name,
      sortID: 9999 // või dünaamiline max sortID + 1
    },
    refresh: 'wait_for'
  });
}
