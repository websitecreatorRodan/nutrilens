export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem {
  id: string;
  name: string;
  ingredients: string;
  nutrition: NutritionalInfo;
}

export interface MealItem {
  foodItem: FoodItem;
  quantity: number;
}

export interface DietaryProfile {
  id: string;
  name: string;
  dietaryNeeds: string;
  allergies: string;
  preferences?: string;
}

export interface SavedMeal {
  id: string;
  name: string;
  items: MealItem[];
}
