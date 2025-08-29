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
  isSpoiled: z.boolean().describe('Whether the food item in the image appears to be spoiled or rotten.'),
  spoilageReason: z.string().optional().describe('A brief explanation if the food is considered spoiled.'),
  isHealthy: z.boolean().describe('A general assessment of whether the food is healthy for an average person.'),
  healthSummary: z.string().describe('A brief summary explaining why the food is considered healthy or not.'),
  nutrients: z.array(z.object({
    name: z.string().describe('The name of the nutrient (e.g., Vitamin C, Protein).'),
    amount: z.string().describe('The estimated amount per 10 gram serving (e.g., 9.5 mg, 2g).'),
    importance: z.string().describe('The importance of the nutrient in 3-4 words.'),
  })).describe('An array of up to 20 key nutrients found in the food item, calculated for a 10-gram serving.'),
  suitability: z.object({
    diabetes: z.string().describe('Advice for people with diabetes.'),
    allergies: z.string().describe('Information on common allergens.'),
    cholesterol: z.string().describe('Information regarding cholesterol.'),
    heartHealth: z.string().describe('Information regarding heart health.'),
    weightManagement: z.string().describe('Information regarding weight management.'),
    gutHealth: z.string().describe('Information regarding gut health and digestion.'),
    general: z.string().describe('A general description of who can eat this food.'),
  }).describe('Detailed dietary suitability information.'),
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
  prompt: `You are an expert nutritionist and food inspector. Analyze the attached image of a food item.

Based on the image, provide the following information:
1.  **Identify the food item.**
2.  **Spoilage Check:** Assess if the food appears rotten, moldy, or otherwise spoiled. Set 'isSpoiled' to true if it is, and provide a brief 'spoilageReason'.
3.  **Health Assessment:** Determine if the food is generally considered healthy. Set 'isHealthy' and provide a concise 'healthSummary'.
4.  **Nutritional Content (per 10g):** Provide a list of up to 20 important nutrients. For each, list its name, estimated amount per **10 grams**, and its importance in 3-4 words.
5.  **Dietary Suitability:** Provide specific advice for the following:
    - **Diabetes:** Can someone with diabetes eat this? What should they consider?
    - **Allergies:** Does it contain common allergens?
    - **Cholesterol:** How does it impact cholesterol levels?
    - **Heart Health:** How does it impact heart health?
    - **Weight Management:** Is it suitable for weight loss or weight gain?
    - **Gut Health:** How does it affect digestion and gut health?
    - **General:** Provide a general summary of its suitability for common diets.
6.  **Availability:** Describe where to buy it and provide a concise Google Maps search query.

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
