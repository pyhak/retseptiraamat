import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import AddRecipeForm from './components/AddRecipeForm';
import RecipeCard from './components/RecipeCard';
import ShoppingListSection from './components/ShoppingListSection';

import {
  Container,
  Typography,
  TextField,
  CircularProgress,
  Button,
  Grid,
  Box
} from '@mui/material';

const GET_RECIPES = gql`
  query {
    recipes {
      id
      title
      category
      serves
      ingredients {
        name
        amount
        unit
      }
      ratings {
        user
        value
      }
    }
  }
`;

const GET_SHOPPING_LIST = gql`
  mutation ShoppingList($recipes: [ShoppingListRecipeInput!]!) {
    shoppingList(recipes: $recipes) {
      name
      totalAmount
      unit
    }
  }
`;

function App() {
  const [showAddForm, setShowAddForm] = useState(false);
  const { loading, error, data } = useQuery(GET_RECIPES);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [targetServes, setTargetServes] = useState(1);
  const [getShoppingList] = useMutation(GET_SHOPPING_LIST);
  const [shoppingList, setShoppingList] = useState<any[]>([]);

  const handleSelectRecipe = (id: string) => {
    setSelectedRecipes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGenerateShoppingList = async () => {
    const selectedInput = selectedRecipes.map((id) => ({ id, targetServes }));
    const { data } = await getShoppingList({ variables: { recipes: selectedInput } });
    setShoppingList(data.shoppingList);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Viga: {error.message}</Typography>;

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h3" gutterBottom>
        Retseptiraamat 📚
      </Typography>

      {/* Nupud samal real */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item>
          <Button
            variant="outlined"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Peida vorm' : 'Lisa uus retsept'}
          </Button>
        </Grid>

        <Grid item>
          <Button
            variant="contained"
            onClick={handleGenerateShoppingList}
            disabled={selectedRecipes.length === 0}
          >
            Koosta poenimekiri
          </Button>
        </Grid>
      </Grid>

      {/* Retsepti lisamise vorm */}
      {showAddForm && <AddRecipeForm />}

      {/* 2-veeruline layout */}
      <Grid container spacing={4}>
        {/* Vasak veerg: retseptid */}
        <Grid item xs={12} md={8}>
          {data.recipes.map((recipe: any) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              selected={selectedRecipes.includes(recipe.id)}
              onToggle={handleSelectRecipe}
            />
          ))}
        </Grid>

        {/* Parem veerg: poenimekiri */}
        <Grid item xs={12} md={4}>
          <Box sx={{ position: 'sticky', top: 32 }}>
            <TextField
              type="number"
              value={targetServes}
              onChange={(e) => setTargetServes(Number(e.target.value))}
              label="Sööjate arv"
              fullWidth
              sx={{ my: 2 }}
            />

            <ShoppingListSection shoppingList={shoppingList} />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

export default App;
