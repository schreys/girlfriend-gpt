'use server';

/**
 * @fileOverview This file defines a Genkit flow for real-time voice interaction with a virtual girlfriend.
 *
 * - generateResponse - A function that takes voice input and generates a spoken response in the selected language.
 * - GenerateResponseInput - The input type for the generateResponse function.
 * - GenerateResponseOutput - The return type for the generateResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateResponseInputSchema = z.object({
  spokenInput: z
    .string()
    .describe('The user spoken input to be processed.'),
  language: z.enum(['english', 'dutch']).describe('The language for the virtual girlfriend to respond in.'),
  girlfriendName: z.string().describe('The name of the virtual girlfriend.'),
});
export type GenerateResponseInput = z.Infer<typeof GenerateResponseInputSchema>;

const GenerateResponseOutputSchema = z.object({
  spokenResponse: z.string().describe('The spoken response from the virtual girlfriend.'),
});
export type GenerateResponseOutput = z.Infer<typeof GenerateResponseOutputSchema>;

export async function generateResponse(input: GenerateResponseInput): Promise<GenerateResponseOutput> {
  return generateResponseFlow(input);
}

const generateResponsePrompt = ai.definePrompt({
  name: 'generateResponsePrompt',
  input: {schema: GenerateResponseInputSchema},
  output: {schema: GenerateResponseOutputSchema},
  prompt: `You are {{girlfriendName}}, a virtual girlfriend.
Your primary instruction is to respond ONLY in {{language}}.
Every single word of your response must be in {{language}}. Do not mix languages.
Maintain a natural, conversational tone in {{language}}, suitable for your persona as {{girlfriendName}}.

User input: {{{spokenInput}}}

Your {{language}} response:`,
});

const generateResponseFlow = ai.defineFlow(
  {
    name: 'generateResponseFlow',
    inputSchema: GenerateResponseInputSchema,
    outputSchema: GenerateResponseOutputSchema,
  },
  async input => {
    const {output} = await generateResponsePrompt(input);
    return output!;
  }
);
