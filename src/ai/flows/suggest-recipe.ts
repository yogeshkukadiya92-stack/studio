// This file holds the Genkit flow for suggesting recipes based on a list of ingredients.

'use server';

/**
 * @fileOverview Recipe suggestion AI agent.
 *
 * - suggestRecipe - A function that suggests recipes based on the provided ingredients.
 * - SuggestRecipeInput - The input type for the suggestRecipe function.
 * - SuggestRecipeOutput - The return type for the suggestRecipe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRecipeInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A comma-separated list of ingredients available.'),
});
export type SuggestRecipeInput = z.infer<typeof SuggestRecipeInputSchema>;

const SuggestRecipeOutputSchema = z.object({
  recipeName: z.string().describe('The name of the suggested recipe.'),
  ingredients: z.array(z.string()).describe('The list of ingredients required for the recipe.'),
  steps: z.array(z.string()).describe('The steps to prepare the recipe.'),
  imageUrl: z.string().describe('URL of the image representing the recipe.'),
});
export type SuggestRecipeOutput = z.infer<typeof SuggestRecipeOutputSchema>;

export async function suggestRecipe(input: SuggestRecipeInput): Promise<SuggestRecipeOutput> {
  return suggestRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRecipePrompt',
  input: {schema: SuggestRecipeInputSchema},
  output: {schema: SuggestRecipeOutputSchema},
  prompt: `You are a recipe suggestion AI. Given the following ingredients, suggest a recipe. The output should be a JSON object conforming to the schema.

Ingredients: {{{ingredients}}}
`,
});

const generateRecipeImage = ai.defineFlow(
  {
    name: 'generateRecipeImage',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (recipeName) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate an image of ${recipeName}`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return media.url;
  }
);

const suggestRecipeFlow = ai.defineFlow(
  {
    name: 'suggestRecipeFlow',
    inputSchema: SuggestRecipeInputSchema,
    outputSchema: SuggestRecipeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    const imageUrl = await generateRecipeImage(output!.recipeName);
    return {...output!, imageUrl: imageUrl};
  }
);
