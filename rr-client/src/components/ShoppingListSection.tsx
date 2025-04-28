import {
    Typography,
    List,
    ListItem,
    ListItemText,
    Button
  } from '@mui/material';
  import { useCallback } from 'react';
  
  interface ShoppingItem {
    name: string;
    totalAmount: number;
    unit: string;
  }
  
  interface Props {
    shoppingList: ShoppingItem[];
  }
  
  export default function ShoppingListSection({ shoppingList }: Props) {
    const generateTodoText = useCallback(() => {
      return shoppingList
        .map((item) => {
          const amount = item.totalAmount < 1 ? 1 : Math.round(item.totalAmount);
          return `Osta ${amount} ${item.unit} ${item.name}`;
        })
        .join('\n');
    }, [shoppingList]);
  
    const handleDownload = () => {
      const text = generateTodoText();
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
  
      const a = document.createElement('a');
      a.href = url;
      a.download = 'poenimekiri-microsoft-todo.txt';
      a.click();
  
      URL.revokeObjectURL(url);
    };
  
    return (
      <>
        <Typography variant="h5" sx={{ marginTop: 4 }}>
          Poenimekiri:
        </Typography>
  
        
  
        <List>
          {shoppingList.length === 0 ? (
            <Typography>Valige retseptid ja koostage poenimekiri.</Typography>
          ) : (
            shoppingList.map((item, idx) => {
              const displayAmount = item.totalAmount < 1 ? 1 : Math.round(item.totalAmount);
              return (
                <ListItem key={idx}>
                  <ListItemText
                    primary={`${item.name}: ${displayAmount} ${item.unit}`}
                  />
                </ListItem>
              );
            })
          )}
        </List>
        <Button
          variant="outlined"
          onClick={handleDownload}
          disabled={shoppingList.length === 0}
          sx={{ mb: 2 }}
        >
          Lae alla Microsoft To Do jaoks
        </Button>
      </>
    );
  }
  