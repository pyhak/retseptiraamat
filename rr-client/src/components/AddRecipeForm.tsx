import { gql, useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { TextField, Button, Typography, IconButton, Box, Autocomplete, Container, MenuItem, Select } from '@mui/material';
import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// GraphQL päringud
const ADD_RECIPE = gql`
  mutation AddRecipe($recipe: RecipeInput!) {
    addRecipe(recipe: $recipe) {
      id
      title
    }
  }
`;

const ADD_INGREDIENT = gql`
  mutation AddIngredient($ingredient: NewIngredientInput!) {
    addIngredient(ingredient: $ingredient)
  }
`;

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      name
    }
  }
`;

const GET_INGREDIENTS = gql`
  query GetIngredients {
    ingredients {
      name
      category
    }
  }
`;

const GET_RECIPES = gql`
  query GetRecipes {
    recipes {
      id
      title
    }
  }
`;

const GENERATE_RECIPE = gql`
  query GenerateRecipeFromAI($query: String!, $mock: Boolean) {
    generateRecipeFromAI(query: $query, mock: $mock) {
      title
      description
      tutorial
      serves
      ingredients {
        name
        amount
        unit
        category
      }
    }
  }
`;

interface IngredientInput {
  name: string;
  amount: string;
  unit: string;
  category: string;
  isNew?: boolean;
}

interface RecipeData {
  title: string;
  description: string;
  tutorial: string;
  serves: number;
  ingredients: IngredientInput[];
}

interface Category {
  name: string;
}

interface IngredientData {
  name: string;
  category: string;
}

type PossiblyCachedIngredient = IngredientInput & { __typename?: string };

function AddRecipeForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tutorial, setTutorial] = useState('');
  const [serves, setServes] = useState<number | ''>('');
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { name: '', amount: '', unit: '', category: 'Muu', isNew: false }
  ]);

  const { data: categoriesData, loading: categoriesLoading, error: categoriesError } = useQuery<{ categories: Category[] }>(GET_CATEGORIES);
  const { data: ingredientsData, loading: ingredientsLoading, error: ingredientsError } = useQuery<{ ingredients: IngredientData[] }>(GET_INGREDIENTS);
  const { refetch: refetchRecipes } = useQuery(GET_RECIPES);

  const [addRecipe] = useMutation(ADD_RECIPE);
  const [addIngredient] = useMutation(ADD_INGREDIENT);

  const [prompt, setPrompt] = useState('');
  const [generateRecipe, { loading: generating }] = useLazyQuery<{ generateRecipeFromAI: RecipeData }>(GENERATE_RECIPE);

  if (categoriesLoading || ingredientsLoading) return <p>Laeb andmeid...</p>;
  if (categoriesError || ingredientsError) return <p>Viga andmete laadimisel: {categoriesError?.message || ingredientsError?.message}</p>;

  const handleGenerateRecipe = async () => {
    try {
      const { data } = await generateRecipe({ variables: { query: prompt, mock: false } });
      if (!data?.generateRecipeFromAI) return;

      const recipe = data.generateRecipeFromAI;
      setTitle(recipe.title);
      setDescription(recipe.description);
      setTutorial(recipe.tutorial);
      setServes(recipe.serves);
      setIngredients(recipe.ingredients.map((i) => ({ ...i, isNew: false })));
    } catch (err) {
      console.error('AI retsepti genereerimine ebaõnnestus:', err);
      alert('AI genereerimine ebaõnnestus');
    }
  };

  const handleIngredientChange = (index: number, field: keyof IngredientInput, value: string) => {
    const updated = ingredients.map((ingredient, i) => {
      if (i !== index) return ingredient;
      return {
        ...ingredient,
        [field]: value
      };
    });
    setIngredients(updated);
  };

  const handleIngredientSelect = (index: number, selectedName: string) => {
    const updated = ingredients.map((ingredient, i) => {
      if (i !== index) return ingredient;

      const selectedIngredient = ingredientsData?.ingredients.find((i) => i.name === selectedName);

      if (selectedIngredient) {
        return {
          ...ingredient,
          name: selectedIngredient.name,
          category: selectedIngredient.category || 'Muu',
          isNew: false
        };
      } else {
        return {
          ...ingredient,
          name: selectedName,
          category: 'Muu',
          isNew: true
        };
      }
    });

    setIngredients(updated);
  };

  const addIngredientField = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '', category: 'Muu', isNew: false }]);
  };

  const removeIngredientField = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index);
    setIngredients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      for (const ingredient of ingredients) {
        if (ingredient.isNew && ingredient.name.trim() !== '') {
          await addIngredient({
            variables: {
              ingredient: {
                name: ingredient.name,
                category: ingredient.category
              }
            }
          });
        }
      }

      await addRecipe({
        variables: {
          recipe: {
            title,
            description,
            tutorial,
            serves: Number(serves),
            ingredients: (ingredients as PossiblyCachedIngredient[]).map(({ __typename, isNew, ...rest }) => rest),
          },
        },
      });

      await refetchRecipes();

      alert('✅ Retsept lisatud!');
      setTitle('');
      setDescription('');
      setTutorial('');
      setServes('');
      setIngredients([{ name: '', amount: '', unit: '', category: 'Muu', isNew: false }]);
    } catch (error) {
      console.error('❌ Viga retsepti või koostisosa lisamisel:', error);
      alert('Viga retsepti lisamisel!');
    }
  };

  return (
    <Container sx={{ marginTop: 4 }}>
      <Typography variant="h4" gutterBottom>
        Lisa uus retsept
      </Typography>

      <form onSubmit={handleSubmit}>
      <Box display="flex" gap={2} alignItems="center" marginY={2}>
          <TextField
            label="Kirjelda, mida soovid valmistada (nt 'kanafilee karri')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            fullWidth
          />
          <Button onClick={handleGenerateRecipe} variant="outlined" disabled={generating}>
            {generating ? 'Laeb...' : 'Genereeri AI abil'}
          </Button>
        </Box>

        <Typography>Või täida ise.</Typography>

        <TextField
          label="Pealkiri"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Kirjeldus"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          required
        />
        <TextField
          label="Õpetus"
          value={tutorial}
          onChange={(e) => setTutorial(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          required
        />
        <TextField
          label="Portsjonite arv"
          type="number"
          value={serves}
          onChange={(e) => setServes(Number(e.target.value))}
          fullWidth
          margin="normal"
          required
        />

        <Typography variant="h6" sx={{ marginTop: 2 }}>
          Koostisosad
        </Typography>

        {ingredients.map((ingredient, index) => {
          const allCategories = categoriesData?.categories.map((c) => c.name) || [];
          const categoryOptions = allCategories.includes(ingredient.category)
            ? allCategories
            : [...allCategories, ingredient.category];

          return (
            <Box key={index} display="flex" gap={2} alignItems="center" marginBottom={2} flexWrap="wrap">
              <Autocomplete
                value={ingredient.name}
                onChange={(_e, value) => handleIngredientSelect(index, value || '')}
                onInputChange={(_e, value) => handleIngredientChange(index, 'name', value)}
                options={ingredientsData?.ingredients.map((i) => i.name) || []}
                renderInput={(params) => <TextField {...params} label="Koostisosade nimi" />}
                fullWidth
                freeSolo
              />
              <TextField
                label="Kogus"
                value={ingredient.amount}
                onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                required
              />
              <TextField
                label="Ühik"
                value={ingredient.unit}
                onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                required
              />
              <Select
                value={ingredient.category}
                onChange={(e) => handleIngredientChange(index, 'category', e.target.value)}
                displayEmpty
                sx={{ minWidth: 120 }}
              >
                {categoryOptions.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
              <IconButton onClick={() => removeIngredientField(index)}>
                <DeleteIcon />
              </IconButton>

              {ingredient.isNew && (
                <Typography variant="body2" color="warning.main" sx={{ marginLeft: 1 }}>
                  ⚠️ Uus koostisosa
                </Typography>
              )}
            </Box>
          );
        })}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addIngredientField}
          sx={{ marginBottom: 2 }}
        >
          Lisa koostisosa
        </Button>

        <Button type="submit" variant="contained" fullWidth>
          Salvesta retsept
        </Button>
      </form>
    </Container>
  );
}

export default AddRecipeForm;

