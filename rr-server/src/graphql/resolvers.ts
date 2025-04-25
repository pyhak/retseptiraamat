import { client } from '../elastic';
import { v4 as uuidv4 } from 'uuid';
import { convertAmount } from '../utils/unitConversion';
import { categories, sortOrder } from '../utils/categories';  // Impordime kategooriad ja sortID

export const resolvers = {
  Query: {
    recipes: async (_: unknown, args: { query?: string; serves?: number }) => {
      const query = args.query
        ? {
            bool: {
              should: [
                { match: { title: args.query } },
                { match: { description: args.query } },
                {
                  nested: {
                    path: 'ingredients',
                    query: {
                      match: { 'ingredients.name': args.query }
                    }
                  }
                }
              ]
            }
          }
        : { match_all: {} };

      const response = await client.search({
        index: 'recipes',
        size: 100,
        query: query
      });

      const requestedServes = args.serves;

      return response.hits.hits.map((hit: any) => {
        const recipe = hit._source;

        if (requestedServes && recipe.serves && recipe.ingredients) {
          const factor = requestedServes / recipe.serves;

          recipe.ingredients = recipe.ingredients.map((ingredient: any) => {
            const numeric = parseFloat(ingredient.amount);
            if (!isNaN(numeric)) {
              return {
                ...ingredient,
                amount: (numeric * factor).toFixed(2) // ümardame kahe komakohani
              };
            } else {
              return ingredient;
            }
          });

          recipe.serves = requestedServes;
        }

        return recipe;
      });
    },

    shoppingList: async (_: unknown, args: { recipes: { id: string; targetServes: number }[] }) => {
      const result: Record<string, { totalBaseAmount: number; baseUnit: string }> = {};

      for (const input of args.recipes) {
        const response = await client.search({
          index: 'recipes',
          query: {
            term: { id: input.id }
          }
        });

        const hit = response.hits.hits[0];
        if (!hit) continue;

        const recipe = hit._source as any;
        const factor = input.targetServes / recipe.serves;

        for (const ingredient of recipe.ingredients) {
          const converted = convertAmount(ingredient.amount, ingredient.unit);
          if (!converted) continue;

          const key = `${ingredient.name}||${converted.baseUnit}`;
          if (!result[key]) {
            result[key] = { totalBaseAmount: 0, baseUnit: converted.baseUnit };
          }

          result[key].totalBaseAmount += converted.baseAmount * factor;
        }
      }

      return Object.entries(result).map(([key, value]) => {
        const [name] = key.split('||');

        // kuvame mugavas ühikus (nt 1500g -> 1.5kg)
        const readable = convertAmount(value.totalBaseAmount.toString(), value.baseUnit);

        return {
          name,
          totalAmount: readable?.displayAmount ?? value.totalBaseAmount,
          unit: readable?.displayUnit ?? value.baseUnit
        };
      });
    }
  },

  Mutation: {
    addRecipe: async (_: unknown, args: { recipe: any }) => {
      const { recipe } = args;
      const ingredientsWithCategory = recipe.ingredients.map((ingredient: { name: keyof typeof categories }) => {
        const category = categories[ingredient.name] || 'Muu';
        return {
          ...ingredient,
          category: category,
          sortID: sortOrder[category as keyof typeof sortOrder] || 99, // Kõrge sortID kui kategooria puudub
        };
      });

      const newRecipe = {
        ...recipe,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        ingredients: ingredientsWithCategory, // Uued koostisosad koos kategooriatega
      };

      // Kontrollime, kas sellise nimega retsept on juba olemas
      const existingRecipeResponse = await client.search({
        index: 'recipes',
        query: {
          match: { title: newRecipe.title }
        }
      });

      if (existingRecipeResponse.hits.hits.length > 0) {
        throw new Error(`Retsept nimega "${newRecipe.title}" on juba olemas.`);
      }

      try {
        const response = await client.index({
          index: 'recipes',
          document: newRecipe,
          refresh: 'wait_for'
        });

        console.log('✅ Uus retsept lisatud:', response);

        return newRecipe;
      } catch (error) {
        console.error('💥 Viga retsepti lisamisel:', error);
        throw new Error('Retsepti lisamine ebaõnnestus');
      }
    },

    addRating: async (_: unknown, args: { title: string; user: string; value: 'JAH' | 'EI' | 'MEH' }) => {
      const { title, user, value } = args;

      try {
        const response = await client.search({
          index: 'recipes',
          query: {
            match: { title }
          }
        });

        if (response.hits.hits.length === 0) {
          throw new Error('Retsepti ei leitud');
        }

        const recipe = response.hits.hits[0]._source as { ratings?: { user: string; value: 'JAH' | 'EI' | 'MEH' }[] };
        const id = response.hits.hits[0]._id;

        if (!recipe.ratings) {
          recipe.ratings = [];
        }

        // Kontrollime, kas sama kasutaja on juba hinnanud
        const existingRating = recipe.ratings.find(rating => rating.user === user);
        if (existingRating) {
          throw new Error(`Kasutaja "${user}" on juba hinnangu andnud.`);
        }

        // Lisame uue hinnangu
        recipe.ratings.push({ user, value });

        await client.index({
          index: 'recipes',
          id: id,
          document: recipe,
          refresh: 'wait_for'
        });

        console.log(`✅ Hinnang lisatud retseptile "${title}" kasutajalt "${user}"`);

        return recipe;
      } catch (error) {
        console.error('💥 Viga hinnangu lisamisel:', error);
        throw new Error(error instanceof Error ? error.message : 'Hinnangu lisamine ebaõnnestus');
      }
    },

    updateRating: async (_: unknown, args: { title: string; user: string; value: 'JAH' | 'EI' | 'MEH' }) => {
      const { title, user, value } = args;

      try {
        const response = await client.search({
          index: 'recipes',
          query: {
            match: { title }
          }
        });

        if (response.hits.hits.length === 0) {
          throw new Error('Retsepti ei leitud');
        }

        const recipe = response.hits.hits[0]._source as { ratings?: { user: string; value: 'JAH' | 'EI' | 'MEH' }[] };
        const id = response.hits.hits[0]._id;

        if (!recipe.ratings) {
          recipe.ratings = [];
        }

        // Kontrollime, kas kasutaja on olemas
        const existingRating = recipe.ratings.find(rating => rating.user === user);
        if (!existingRating) {
          throw new Error(`Kasutaja "${user}" pole veel hinnangut andnud.`);
        }

        // Uuendame olemasoleva hinnangu
        existingRating.value = value;

        await client.index({
          index: 'recipes',
          id: id,
          document: recipe,
          refresh: 'wait_for'
        });

        console.log(`✅ Hinnang uuendatud retseptile "${title}" kasutajalt "${user}"`);

        return recipe;
      } catch (error) {
        console.error('💥 Viga hinnangu uuendamisel:', error);
        throw new Error(error instanceof Error ? error.message : 'Hinnangu uuendamine ebaõnnestus');
      }
    }
  }
};
