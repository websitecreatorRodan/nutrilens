'use server';
/**
 * @fileOverview Personalized dietary recommendations flow.
 *
 * This flow analyzes food inputs against a user's dietary profile (including dietary needs and allergies)
 * and provides personalized recommendations, highlighting potential allergens or unsuitable ingredients.
 *
 * - `getDietaryRecommendations` - The function to call to get dietary recommendations.
 * - `DietaryRecommendationsInput` - The input type for `getDietaryRecommendations`.
 * - `DietaryRecommendationsOutput` - The output type for `getDietaryRecommendations`.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const DietaryProfileSchema = z.object({
  dietaryNeeds: z.string().describe('Specific dietary needs (e.g., low-carb, high-protein, vegan).'),
  allergies: z.string().describe('A comma-separated list of allergies (e.g., peanuts, gluten, dairy).'),
  preferences: z.string().optional().describe('Other dietary preferences (e.g., avoid processed foods).'),
});

const FoodItemSchema = z.object({
  name: z.string().describe('The name of the food item.'),
  ingredients: z.string().describe('A comma-separated list of ingredients in the food item.'),
});

const DietaryRecommendationsInputSchema = z.object({
  dietaryProfile: DietaryProfileSchema.describe('The user dietary profile.'),
  foodItems: z.array(FoodItemSchema).describe('The food items to analyze.'),
});

export type DietaryRecommendationsInput = z.infer<typeof DietaryRecommendationsInputSchema>;

// Define the output schema
const RecommendationSchema = z.object({
  foodItemName: z.string().describe('The name of the food item.'),
  recommendation: z.string().describe('A personalized dietary recommendation for the food item.'),
  isSuitable: z.boolean().describe('Whether this food item is suitable for the user.'),
  reason: z.string().optional().describe('The reasons why food item is or is not suitable.'),
});

const DietaryRecommendationsOutputSchema = z.array(RecommendationSchema);

export type DietaryRecommendationsOutput = z.infer<typeof DietaryRecommendationsOutputSchema>;

// Define the tool to analyze food items against dietary profile
const analyzeFoodItem = ai.defineTool({
  name: 'analyzeFoodItem',
  description: 'Analyzes a food item against a dietary profile to provide personalized recommendations, highlighting potential allergens or unsuitable ingredients.',
  inputSchema: z.object({
    foodItem: FoodItemSchema,
    dietaryProfile: DietaryProfileSchema,
  }),
  outputSchema: RecommendationSchema,
},
async (input) => {
  // Dummy implementation - replace with actual analysis logic
  const { foodItem, dietaryProfile } = input;
  const { name, ingredients } = foodItem;
  const { allergies, dietaryNeeds, preferences } = dietaryProfile;

  let recommendation = `This food item (${name}) contains the following ingredients: ${ingredients}.\n`;
  let isSuitable = true;
  let reason = '';

  if (allergies) {
    const allergyList = allergies.split(',').map(s => s.trim());
    const ingredientList = ingredients.split(',').map(s => s.trim());
    const allergensPresent = allergyList.filter(allergen => ingredientList.includes(allergen));

    if (allergensPresent.length > 0) {
      isSuitable = false;
      reason = `This food contains ${allergensPresent.join(', ')}, which you are allergic to.`;
      recommendation += `\nWARNING: This food contains allergens you have indicated you are allergic to: ${allergensPresent.join(', ')}.`;
    } else {
      recommendation += '\nThis food does not appear to contain any of your listed allergens.';
    }
  }

  if (dietaryNeeds) {
    recommendation += `\nConsidering your dietary needs: ${dietaryNeeds}.`;
  }

  if (preferences) {
    recommendation += `\nConsidering your dietary preferences: ${preferences}.`;
  }
  
  return {
    foodItemName: name,
    recommendation: recommendation,
    isSuitable: isSuitable,
    reason: reason
  };
});

// Define the prompt
const dietaryRecommendationsPrompt = ai.definePrompt({
  name: 'dietaryRecommendationsPrompt',
  tools: [analyzeFoodItem],
  input: { schema: DietaryRecommendationsInputSchema },
  output: { schema: DietaryRecommendationsOutputSchema },
  prompt: `You are a dietary expert. Analyze the provided food items against the user's dietary profile and provide personalized recommendations.

Dietary Profile:
Dietary Needs: {{{dietaryProfile.dietaryNeeds}}}
Allergies: {{{dietaryProfile.allergies}}}
Preferences: {{{dietaryProfile.preferences}}}

Food Items:
{{#each foodItems}}
  - Name: {{{name}}}
    Ingredients: {{{ingredients}}}
{{/each}}

Instructions:
Use the 'analyzeFoodItem' tool to analyze each food item against the dietary profile.
Return an array of recommendations, one for each food item.
`,  
});

// Define the flow
const dietaryRecommendationsFlow = ai.defineFlow({
  name: 'dietaryRecommendationsFlow',
  inputSchema: DietaryRecommendationsInputSchema,
  outputSchema: DietaryRecommendationsOutputSchema,
}, async (input) => {
  const recommendations: RecommendationSchema[] = [];

  for (const foodItem of input.foodItems) {
    const result = await analyzeFoodItem({
      foodItem: foodItem,
      dietaryProfile: input.dietaryProfile,
    });
    recommendations.push(result);
  }

  return recommendations;
});

/**
 * Analyzes food inputs against a user's dietary profile and provides personalized recommendations.
 * @param input - The DietaryRecommendationsInput object containing the dietary profile and food items.
 * @returns A promise that resolves to a DietaryRecommendationsOutput object.
 */
export async function getDietaryRecommendations(input: DietaryRecommendationsInput): Promise<DietaryRecommendationsOutput> {
  return dietaryRecommendationsFlow(input);
}

export type { DietaryRecommendationsInputSchema, DietaryRecommendationsOutputSchema };
