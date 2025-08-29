import type { FoodItem, DietaryProfile } from './types';

export const FOOD_DATABASE: FoodItem[] = [
  {
    id: 'apple',
    name: 'Apple',
    ingredients: 'apple',
    nutrition: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  },
  {
    id: 'banana',
    name: 'Banana',
    ingredients: 'banana',
    nutrition: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  },
  {
    id: 'chicken_breast',
    name: 'Chicken Breast (100g)',
    ingredients: 'chicken',
    nutrition: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  },
  {
    id: 'brown_rice',
    name: 'Brown Rice (cooked, 1 cup)',
    ingredients: 'brown rice',
    nutrition: { calories: 215, protein: 5, carbs: 45, fat: 1.8 },
  },
  {
    id: 'whole_egg',
    name: 'Whole Egg',
    ingredients: 'egg',
    nutrition: { calories: 78, protein: 6, carbs: 0.6, fat: 5 },
  },
  {
    id: 'peanut_butter',
    name: 'Peanut Butter (2 tbsp)',
    ingredients: 'peanuts, sugar, salt',
    nutrition: { calories: 190, protein: 7, carbs: 8, fat: 16 },
  },
  {
    id: 'whole_wheat_bread',
    name: 'Whole Wheat Bread (1 slice)',
    ingredients: 'whole wheat flour, water, yeast, salt',
    nutrition: { calories: 81, protein: 4, carbs: 14, fat: 1.1 },
  },
  {
    id: 'milk',
    name: 'Milk (1 cup)',
    ingredients: 'milk',
    nutrition: { calories: 103, protein: 8, carbs: 12, fat: 2.4 },
  },
];

export const DEFAULT_PROFILES: DietaryProfile[] = [
  {
    id: 'guest',
    name: 'Guest (No restrictions)',
    dietaryNeeds: 'None',
    allergies: 'None',
    preferences: 'None',
  },
  {
    id: 'vegan',
    name: 'Vegan',
    dietaryNeeds: 'Vegan, no animal products.',
    allergies: 'None',
    preferences: 'Prefers plant-based whole foods.',
  },
  {
    id: 'gluten_free',
    name: 'Gluten-Free',
    dietaryNeeds: 'Must not contain gluten.',
    allergies: 'wheat, barley, rye',
    preferences: 'Avoids processed foods that may contain hidden gluten.',
  },
];
