import { Recipe } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const mockRecipe: Recipe = {
  id: uuidv4(),
  title: 'Hakklihakaste kartulitega',
  description: 'Klassikaline kodune roog, mis sobib igapäevaseks lõunaks.',
  tutorial: 'Koori ja keeda kartulid. Pruunista hakkliha ja sibul pannil, lisa jahu ning piim, keeda kuni pakseneb. Serveeri koos kartulitega.',
  serves: 4,
  category: 'Muu',
  createdAt: new Date().toISOString(),
  tags: ['kiire', 'kodune', 'liha'],
  ratings: [],
  ingredients: [
    { name: 'Hakkliha', amount: '400', unit: 'g', category: 'Liha', sortID: 0 },
    { name: 'Sibul', amount: '1', unit: 'tk', category: 'Köögivili', sortID: 0 },
    { name: 'Piim', amount: '300', unit: 'ml', category: 'Piimatooted', sortID: 0 },
    { name: 'Jahu', amount: '1', unit: 'spl', category: 'Muu', sortID: 0 },
    { name: 'Kartul', amount: '5', unit: 'tk', category: 'Köögivili', sortID: 0 }
  ]
};