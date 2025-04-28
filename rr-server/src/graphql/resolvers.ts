import { client } from '../elastic';
import { v4 as uuidv4 } from 'uuid';
import { convertAmount } from '../utils/unitConversion';
import { Recipe, RatingValue } from '../types';

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
        query
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
                amount: (numeric * factor).toFixed(2)
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

    categories: async () => {
      try {
        const response = await client.search({
          index: 'categories',
          query: { match_all: {} }
        });

        if (!response.hits?.hits) {
          return [];
        }

        return response.hits.hits.map((hit: any) => hit._source);
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
        return [];
      }
    },

    ingredients: async () => {
      try {
        const response = await client.search({
          index: 'ingredients',
          query: { match_all: {} }
        });
    
        if (!response.hits?.hits) {
          return [];
        }
    
        return response.hits.hits.map((hit: any) => ({
          name: hit._source.name,
          amount: hit._source.amount || '',
          unit: hit._source.unit || '',
          category: hit._source.category || 'Muu'
        }));
      } catch (error) {
        console.error('❌ Error fetching ingredients:', error);
        return [];
      }
    },

    sortOrder: async () => {
      try {
        const response = await client.search({
          index: 'sortorder',
          query: { match_all: {} }
        });

        if (!response.hits?.hits) {
          return [];
        }

        return response.hits.hits.map((hit: any) => hit._source.category);
      } catch (error) {
        console.error('❌ Error fetching sortOrder:', error);
        return [];
      }
    }
  },

  Mutation: {
    addRecipe: async (_: unknown, args: { recipe: any }) => {
      const { recipe } = args;

      try {
        const categoryResponse = await client.search({
          index: 'categories',
          query: { match_all: {} }
        });
        const categories = categoryResponse.hits.hits.map((hit: any) => hit._source.name);

        const sortOrderResponse = await client.search({
          index: 'sortorder',
          query: { match_all: {} }
        });
        const sortOrder = sortOrderResponse.hits.hits.reduce((acc: any, hit: any) => {
          acc[hit._source.category] = hit._source.sortID;
          return acc;
        }, {});

        const ingredientsWithCategory = recipe.ingredients.map((ingredient: { name: string }) => {
          const category = categories.includes(ingredient.name) ? ingredient.name : 'Muu';
          return {
            ...ingredient,
            category,
            sortID: sortOrder[category] || 99,
          };
        });

        const newRecipe = {
          ...recipe,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          ingredients: ingredientsWithCategory,
        };

        const existingRecipeResponse = await client.search({
          index: 'recipes',
          query: {
            match: { title: newRecipe.title }
          }
        });

        if (existingRecipeResponse.hits.hits.length > 0) {
          throw new Error(`Retsept nimega "${newRecipe.title}" on juba olemas.`);
        }

        await client.index({
          index: 'recipes',
          document: newRecipe,
          refresh: 'wait_for'
        });

        console.log('✅ Uus retsept lisatud');
        return newRecipe;
      } catch (error) {
        console.error('💥 Viga retsepti lisamisel:', error);
        throw new Error(error instanceof Error ? error.message : 'Retsepti lisamine ebaõnnestus');
      }
    },

    addRating: async (_: unknown, args: { title: string; user: string; value: RatingValue }) => {
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

        const recipe = response.hits.hits[0]._source as Recipe;
        const id = response.hits.hits[0]._id;

        if (!recipe.ratings) {
          recipe.ratings = [];
        }

        const existingRating = recipe.ratings.find(rating => rating.user === user);
        if (existingRating) {
          throw new Error(`Kasutaja "${user}" on juba hinnangu andnud.`);
        }

        recipe.ratings.push({ user, value });

        await client.index({
          index: 'recipes',
          id,
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

    updateRating: async (_: unknown, args: { title: string; user: string; value: RatingValue }) => {
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

        const recipe = response.hits.hits[0]._source as Recipe;
        const id = response.hits.hits[0]._id;

        if (!recipe.ratings) {
          recipe.ratings = [];
        }

        const existingRating = recipe.ratings.find(rating => rating.user === user);
        if (!existingRating) {
          throw new Error(`Kasutaja "${user}" pole veel hinnangut andnud.`);
        }

        existingRating.value = value;

        await client.index({
          index: 'recipes',
          id,
          document: recipe,
          refresh: 'wait_for'
        });

        console.log(`✅ Hinnang uuendatud retseptile "${title}" kasutajalt "${user}"`);
        return recipe;
      } catch (error) {
        console.error('💥 Viga hinnangu uuendamisel:', error);
        throw new Error(error instanceof Error ? error.message : 'Hinnangu uuendamine ebaõnnestus');
      }
    },

    shoppingList: async (_: unknown, args: { recipes: { id: string; targetServes: number }[] }) => {
      const result: Record<string, { totalBaseAmount: number; baseUnit: string; category: string }> = {};
    
      // Laeme kategooriad sortID-dega
      const categoriesResponse = await client.search({
        index: 'categories',
        query: { match_all: {} },
        size: 100
      });
    
      const categoryMap = new Map<string, number>(
        categoriesResponse.hits.hits.map((hit: any) => [hit._source.name, hit._source.sortID])
      );
    
      // Läbime kõik valitud retseptid
      for (const input of args.recipes) {
        const response = await client.search({
          index: 'recipes',
          query: {
            term: { id: input.id }
          }
        });
    
        const hit = response.hits.hits[0];
        if (!hit) continue;
    
        const recipe = hit._source as Recipe;
        const factor = recipe.serves ? input.targetServes / recipe.serves : 1;
    
        for (const ingredient of recipe.ingredients) {
          const converted = convertAmount(ingredient.amount, ingredient.unit);
          if (!converted) continue;
    
          const key = `${ingredient.name}||${converted.baseUnit}`;
          if (!result[key]) {
            result[key] = {
              totalBaseAmount: 0,
              baseUnit: converted.baseUnit,
              category: ingredient.category || 'Muu' // paneme kategooria külge jooksvalt
            };
          }
    
          result[key].totalBaseAmount += converted.baseAmount * factor;
        }
      }
    
      // Teeme tulemuste listi
      const shoppingList = Object.entries(result).map(([key, value]) => {
        const [name] = key.split('||');
        const readable = convertAmount(value.totalBaseAmount.toString(), value.baseUnit);
    
        return {
          name,
          totalAmount: readable?.displayAmount ?? value.totalBaseAmount,
          unit: readable?.displayUnit ?? value.baseUnit,
          category: value.category
        };
      });
    
      // Sorteerime shopping listi category sortID järgi
      shoppingList.sort((a, b) => {
        const sortA = categoryMap.get(a.category) ?? 99;
        const sortB = categoryMap.get(b.category) ?? 99;
        return sortA - sortB;
      });
    
      // Tagastame ilma kategooriata (kui frontend ei taha näidata)
      return shoppingList.map(({ name, totalAmount, unit }) => ({
        name,
        totalAmount,
        unit
      }));
    },  
    
    addIngredient: async (_: unknown, args: { ingredient: { name: string; category: string } }) => {
      const { name, category } = args.ingredient;
    
      try {
        await client.index({
          index: 'ingredients',
          document: {
            name,
            category
          },
          refresh: 'wait_for'
        });
    
        return "Koostisosa lisatud";
      } catch (error) {
        console.error('💥 Viga koostisosa lisamisel:', error);
        throw new Error('Koostisosa lisamine ebaõnnestus');
      }
    },

  }
};
