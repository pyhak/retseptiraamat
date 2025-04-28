import { gql, useMutation, useQuery } from '@apollo/client';
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

interface IngredientInput {
  name: string;
  amount: string;
  unit: string;
  category: string;
  isNew?: boolean;
}

function AddRecipeForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tutorial, setTutorial] = useState('');
  const [serves, setServes] = useState<number | ''>('');
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { name: '', amount: '', unit: '', category: 'Muu', isNew: false }
  ]);

  const { data: categoriesData, loading: categoriesLoading, error: categoriesError } = useQuery(GET_CATEGORIES);
  const { data: ingredientsData, loading: ingredientsLoading, error: ingredientsError } = useQuery(GET_INGREDIENTS);
  const { refetch: refetchRecipes } = useQuery(GET_RECIPES); // <-- retseptide uuendamine

  const [addRecipe] = useMutation(ADD_RECIPE);
  const [addIngredient] = useMutation(ADD_INGREDIENT);

  if (categoriesLoading || ingredientsLoading) return <p>Laeb andmeid...</p>;
  if (categoriesError || ingredientsError) return <p>Viga andmete laadimisel: {categoriesError?.message || ingredientsError?.message}</p>;

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

      const selectedIngredient = ingredientsData?.ingredients.find((i: { name: string }) => i.name === selectedName);

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
      // Kõigepealt salvesta kõik uued koostisosad
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

      // Seejärel salvesta retsept
      await addRecipe({
        variables: {
          recipe: {
            title,
            description,
            tutorial,
            serves: Number(serves),
            ingredients: ingredients.map(({ isNew, ...rest }) => rest),
          },
        },
      });

      // Uuenda retseptide nimekirja
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
          required
        />
        <TextField
          label="Õpetus"
          value={tutorial}
          onChange={(e) => setTutorial(e.target.value)}
          fullWidth
          margin="normal"
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

        {ingredients.map((ingredient, index) => (
          <Box key={index} display="flex" gap={2} alignItems="center" marginBottom={2} flexWrap="wrap">
            <Autocomplete
              value={ingredient.name}
              onChange={(_e, value) => handleIngredientSelect(index, value || '')}
              onInputChange={(_e, value) => handleIngredientChange(index, 'name', value)}
              options={ingredientsData?.ingredients.map((i: { name: string }) => i.name) || []}
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
              {categoriesData?.categories.map((c: { name: string }) => (
                <MenuItem key={c.name} value={c.name}>
                  {c.name}
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
        ))}

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
