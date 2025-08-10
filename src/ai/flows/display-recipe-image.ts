'use server';

/**
 * @fileOverview A flow to generate and display an image of the suggested recipe.
 *
 * - displayRecipeImage - A function that handles the image generation process.
 * - DisplayRecipeImageInput - The input type for the displayRecipeImage function.
 * - DisplayRecipeImageOutput - The return type for the displayRecipeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DisplayRecipeImageInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe to generate an image for.'),
});
export type DisplayRecipeImageInput = z.infer<typeof DisplayRecipeImageInputSchema>;

const DisplayRecipeImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type DisplayRecipeImageOutput = z.infer<typeof DisplayRecipeImageOutputSchema>;

export async function displayRecipeImage(input: DisplayRecipeImageInput): Promise<DisplayRecipeImageOutput> {
  return displayRecipeImageFlow(input);
}

const displayRecipeImagePrompt = ai.definePrompt({
  name: 'displayRecipeImagePrompt',
  input: {schema: DisplayRecipeImageInputSchema},
  output: {schema: DisplayRecipeImageOutputSchema},
  prompt: `Generate an image of the following recipe: {{{recipeName}}}.`,
});

const displayRecipeImageFlow = ai.defineFlow(
  {
    name: 'displayRecipeImageFlow',
    inputSchema: DisplayRecipeImageInputSchema,
    outputSchema: DisplayRecipeImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: input.recipeName,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Failed to generate image.');
    }

    return {imageUrl: media.url};
  }
);
