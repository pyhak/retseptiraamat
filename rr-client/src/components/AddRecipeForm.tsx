import { gql, useMutation } from '@apollo/client';
import {
  Container,
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
  Box
} from '@mui/material';
import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const ADD_RECIPE = gql`
  mutation AddRecipe($recipe: RecipeInput!) {
    addRecipe(recipe: $recipe) {
      title
    }
  }
`;

const categories = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

function AddRecipeForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tutorial, setTutorial] = useState('');
  const [category, setCategory] = useState('');
  const [serves, setServes] = useState<number | ''>('');
  const [ingredients, setIngredients] = useState([{ name: '', amount: '', unit: '' }]);

  const [addRecipe] = useMutation(ADD_RECIPE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addRecipe({
        variables: {
          recipe: {
            title,
            description,
            tutorial,
            category,
            serves: Number(serves),
            ingredients
          }
        }
      });

      alert('Retsept lisatud!');
      setTitle('');
      setDescription('');
      setTutorial('');
      setCategory('');
      setServes('');
      setIngredients([{ name: '', amount: '', unit: '' }]);
    } catch (error) {
      console.error('Viga retsepti lisamisel:', error);
      alert('Viga retsepti lisamisel!' + error);
    }
  };

  const handleIngredientChange = (index: number, field: string, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const addIngredientField = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
  };

  const removeIngredientField = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index);
    setIngredients(updated);
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

        <FormControl fullWidth margin="normal" required>
          <InputLabel>Kategooria</InputLabel>
          <Select
            value={category}
            label="Kategooria"
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
          <Box key={index} display="flex" gap={2} alignItems="center" marginBottom={2}>
            <TextField
              label="Nimi"
              value={ingredient.name}
              onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
              required
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
            <IconButton onClick={() => removeIngredientField(index)}>
              <DeleteIcon />
            </IconButton>
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
