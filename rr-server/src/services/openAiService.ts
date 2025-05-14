// services/OpenAiService.ts
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { Recipe } from '../types';
import { getCategoryNames, addNewCategory } from './categoryService';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RecipeResult {
  title: string;
  ingredients: string[];
  steps: string[];
  servings: number;
  prepTime: string;
  cookTime: string;
}

export async function generateRecipe(query: string): Promise<Recipe | null> {
  try {
    const existingCategories = await getCategoryNames();

    const fullPrompt = `
      Genereeri järgmise toidu retsept: "${query}".
      
      Olemasolevad kategooriad: ${existingCategories.join(', ')}.
      Iga koostisosal peab olema kategooria.
      Kui mõni koostisosa ei sobi olemasolevatesse, pakun uue sobiva kategooria.
      
      Tagasta ainult järgmises JSON-formaadis:
      {
        "title": "retsepti nimi",
        "description": "lühike kirjeldus",
        "tutorial": "valmistamise sammud",
        "serves": 4,
        "ingredients": [
          {
            "name": "...",
            "amount": "...",
            "unit": "...",
            "category": "..." // olemasolev või uus
          }
        ]
      }
      
      `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
    });

    const raw = completion.choices[0].message.content?.trim() ?? '';
    console.log('AI raw response:', raw);
    const cleaned = raw.replace(/^```json\n?/, '').replace(/```$/, '').trim();
    const base = JSON.parse(cleaned);


    const enriched: Recipe = {
      ...base,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      category: 'Muu', // placeholder, kui see ei tule AI-st
      ratings: [],
    };

    const newCategories = enriched.ingredients
      .map(i => i.category)
      .filter(cat => !!cat && !existingCategories.includes(cat));

    for (const name of [...new Set(newCategories)]) {
      console.log(`🆕 Lisame uue kategooria: ${name}`);
      await addNewCategory(name);
    }

    return enriched;

  } catch (error) {
    console.error('OpenAI error:', error);

    return null;
  }
}
