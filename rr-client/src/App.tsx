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
  Card,
  CardContent,
  Box,
} from '@mui/material';

const GET_RECIPES = gql`
  query {
  recipes {
    id
    title
    description
    tutorial
    serves
    tags
    createdAt
    ingredients {
      name
      amount
      unit
      category
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
          <Box 
      sx={{
        backgroundColor: '#f7f0e4', 
        padding: 2,
        display: 'flex',
        alignItems: 'left',
        justifyContent: 'left',
        boxShadow: 1, 
        borderRadius: 2,
        marginBottom: 4,
      }}
    >
      <img src="/retseptiraamat.png" alt="Retseptiraamat logo" style={{ height: '120px' }} />
    </Box>

      

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        <Card sx={{ flex: 2, padding: 2 }}>
          <CardContent>
            {data.recipes.map((recipe: any) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                selected={selectedRecipes.includes(recipe.id)}
                onToggle={handleSelectRecipe}
              />
            ))}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <Button
          variant="outlined"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Peida vorm' : 'Lisa uus retsept'}
        </Button>


      </div>

      {showAddForm && <AddRecipeForm />}
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, padding: 2 }}>
          <CardContent>
            <Button
              variant="contained"
              onClick={handleGenerateShoppingList}
              disabled={selectedRecipes.length === 0}
            >
              Koosta poenimekiri
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: 2, marginBottom: 2 }}>
              <TextField
                size="small"
                type="number"
                value={targetServes}
                onChange={(e) => setTargetServes(Number(e.target.value))}
                sx={{ width: '80px' }}
                inputProps={{ min: 1 }}
              />
              <Typography variant="body2">inimesele</Typography>
            </Box>
            <ShoppingListSection shoppingList={shoppingList} />
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

export default App;