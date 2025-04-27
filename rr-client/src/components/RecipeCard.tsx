import {
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemText,
    Checkbox,
    FormControlLabel,
    Collapse,
    IconButton
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { useState } from 'react';
import { Tooltip } from '@mui/material';

interface Ingredient {
    name: string;
    amount: string;
    unit: string;
}

interface Rating {
    user: string;
    value: string;
}

interface Recipe {
    id: string;
    title: string;
    category: string;
    serves: number;
    ingredients: Ingredient[];
    ratings?: Rating[];
}

interface Props {
    recipe: Recipe;
    selected: boolean;
    onToggle: (id: string) => void;
}

export default function RecipeCard({ recipe, selected, onToggle }: Props) {
    const [expanded, setExpanded] = useState(false);

    return (
        <Card sx={{ marginBottom: 2 }}>
            <CardContent
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
                <FormControlLabel
                    control={
                        <Tooltip title="Lisa retsept poenimekirja" arrow>
                            <Checkbox checked={selected} onChange={() => onToggle(recipe.id)} />
                        </Tooltip>
                    }
                    label={<Typography variant="h6">{recipe.title}</Typography>}
                />
                <IconButton onClick={() => setExpanded(!expanded)}>
                    {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
            </CardContent>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CardContent>
                    <Typography color="text.secondary">
                        Kategooria: {recipe.category} | Portsjonid: {recipe.serves}
                    </Typography>

                    <Typography variant="subtitle1" sx={{ mt: 2 }}>
                        Koostisosad
                    </Typography>
                    <List>
                        {recipe.ingredients.map((ingredient, idx) => (
                            <ListItem key={idx}>
                                <ListItemText
                                    primary={`${ingredient.name} - ${ingredient.amount} ${ingredient.unit}`}
                                />
                            </ListItem>
                        ))}
                    </List>

                    <Typography variant="subtitle1" sx={{ mt: 2 }}>
                        Hinnangud
                    </Typography>
                    {recipe.ratings?.length ? (
                        <List>
                            {recipe.ratings.map((rating, idx) => (
                                <ListItem key={idx}>
                                    <ListItemText primary={`${rating.user}: ${rating.value}`} />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            (Hinnangud puuduvad)
                        </Typography>
                    )}
                </CardContent>
            </Collapse>
        </Card>
    );
}
