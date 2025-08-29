'use server';
/**
 * @fileOverview Analyzes a food image to identify the food, its nutritional content,
 * dietary suitability, and typical availability.
 *
 * - `analyzeFoodImage` - The function to call to get the analysis.
 * - `AnalyzeFoodImageInput` - The input type for `analyzeFoodImage`.
 * - `AnalyzeFoodImageOutput` - The output type for `analyzeFoodImage`.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const AnalyzeFoodImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a food item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeFoodImageInput = z.infer<typeof AnalyzeFoodImageInputSchema>;

// Define the output schema
const AnalyzeFoodImageOutputSchema = z.object({
  foodName: z.string().describe('The name of the identified food item.'),
  nutrients: z.object({
    calories: z.string().describe('Estimated calories per serving.'),
    protein: z.string().describe('Estimated protein in grams per serving.'),
    carbs: z.string().describe('Estimated carbohydrates in grams per serving.'),
    fat: z.string().describe('Estimated fat in grams per serving.'),
  }).describe('The nutritional information for the food item.'),
  suitability: z.string().describe('A description of who can eat this food, considering common dietary restrictions like vegan, gluten-free, etc.'),
  availability: z.object({
    description: z.string().describe('A description of where this food item is commonly available (e.g., grocery stores, farmers markets).'),
    googleMapsQuery: z.string().describe('A search query for Google Maps to find the item, like "grocery stores" or "farmers markets".'),
  }).describe('Information on where to find the food item.'),
});
export type AnalyzeFoodImageOutput = z.infer<typeof AnalyzeFoodImageOutputSchema>;

// Define the prompt
const analyzeFoodPrompt = ai.definePrompt({
  name: 'analyzeFoodPrompt',
  input: { schema: AnalyzeFoodImageInputSchema },
  output: { schema: AnalyzeFoodImageOutputSchema },
  prompt: `You are an expert nutritionist and food sourcing specialist. Analyze the attached image of a food item.

Based on the image, provide the following information:
1.  **Identify the food item.**
2.  **Estimate the nutritional content** (calories, protein, carbs, fat) for a standard serving size.
3.  **Describe its dietary suitability:** Mention if it's generally suitable for common diets (e.g., vegan, vegetarian, gluten-free, keto).
4.  **Describe its common availability:** Where can someone typically buy this item (e.g., "Found in most major supermarkets, in the produce section."). Also provide a concise Google Maps search query (e.g., "grocery stores", "bakeries") to help find it.

Image to analyze: {{media url=photoDataUri}}
`,
});

// Define the flow
const analyzeFoodImageFlow = ai.defineFlow(
  {
    name: 'analyzeFoodImageFlow',
    inputSchema: AnalyzeFoodImageInputSchema,
    outputSchema: AnalyzeFoodImageOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeFoodPrompt(input);
    return output!;
  }
);


export async function analyzeFoodImage(input: AnalyzeFoodImageInput): Promise<AnalyzeFoodImageOutput> {
  return analyzeFoodImageFlow(input);
}
