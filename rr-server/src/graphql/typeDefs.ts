import { gql } from 'graphql-tag';

export const typeDefs = gql`
    enum Category {
    BREAKFAST
    LUNCH
    DINNER
    SNACK
    }

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
    name: String
    amount: String
    unit: String
  }

  type Recipe {
    title: String
    description: String
    tutorial: String
    category: Category
    serves: Int
    ingredients: [Ingredient]
    ratings: [Rating]
  }

  input IngredientInput {
    name: String!
    amount: String!
    unit: String!
  }

 input RecipeInput {
    title: String!
    description: String!
    tutorial: String!
    category: Category!
    serves: Int!
    ingredients: [IngredientInput!]!
  }

  type Query {
  recipes(query: String, serves: Int): [Recipe]
}

    type Mutation {
        addRecipe(recipe: RecipeInput!): Recipe
        updateRecipe(id: ID!, recipe: RecipeInput!): Recipe
        deleteRecipe(id: ID!): String
        addRating(title: String!, user: String!, value: RatingValue!): Recipe
        updateRating(title: String!, user: String!, value: RatingValue!): Recipe
    }
`;
