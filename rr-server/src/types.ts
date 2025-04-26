export type RatingValue = 'JAH' | 'EI' | 'MEH';

export interface Rating {
  user: string;
  value: RatingValue;
}

export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  category: string;
  sortID: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  tutorial: string;
  serves: number;
  category: string;
  createdAt: string;
  tags?: string[];
  ratings?: Rating[];
  ingredients: Ingredient[];
}
