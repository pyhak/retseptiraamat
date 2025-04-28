import { gql } from 'graphql-tag';

export const typeDefs = gql`
  enum RatingValue {
    JAH
    EI
    MEH
  }

  type Rating {
    user: String
    value: RatingValue
  }

  type Ingredient {
  name: String!
  amount: String
  unit: String
  category: String!
}

input IngredientInput {
  name: String!
  amount: String!
  unit: String!
  category: String!
}

input NewIngredientInput {
  name: String!
  category: String!
}

type Recipe {
  id: ID!
  title: String!
  description: String!
  tutorial: String!
  serves: Int!
  ingredients: [Ingredient!]!
  tags: [String]
  createdAt: String
}

input RecipeInput {
  title: String!
  description: String!
  tutorial: String!
  serves: Int!
  ingredients: [IngredientInput!]!
  tags: [String!]
}

 

  type Category {
  name: String!
  sortID: Int!
}

type Ingredient {
  name: String!
  amount: String
  unit: String
  category: String
  sortID: Int
}

type ShoppingListItem {
  name: String!
  totalAmount: Float!
  unit: String!
}

  input ShoppingListRecipeInput {
    id: ID!
    targetServes: Int!
  }

  type Query {
    recipes(query: String, serves: Int): [Recipe]
    categories: [Category!]!
    ingredients: [Ingredient!]!
    sortOrder: [String!]
  }

  type Mutation {
    addRecipe(recipe: RecipeInput!): Recipe
    updateRecipe(id: ID!, recipe: RecipeInput!): Recipe
    deleteRecipe(id: ID!): String
    addRating(title: String!, user: String!, value: RatingValue!): Recipe
    updateRating(title: String!, user: String!, value: RatingValue!): Recipe
    shoppingList(recipes: [ShoppingListRecipeInput!]!): [ShoppingListItem!]!
    addIngredient(ingredient: NewIngredientInput!): String!
  }
`;
