'use server';
/**
 * @fileOverview A Genkit flow for a conversational AI chatbot.
 *
 * - chatWithAi - A function that handles the AI chatbot conversation.
 * - ChatWithAiInput - The input type for the chatWithAi function.
 * - ChatWithAiOutput - The return type for the chatWithAi function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithAiInputSchema = z.object({
  message: z.string().describe("The user's message to the AI chatbot."),
});
export type ChatWithAiInput = z.infer<typeof ChatWithAiInputSchema>;

const ChatWithAiOutputSchema = z.object({
  response: z.string().describe('The AI-generated response.'),
});
export type ChatWithAiOutput = z.infer<typeof ChatWithAiOutputSchema>;

export async function chatWithAi(input: ChatWithAiInput): Promise<ChatWithAiOutput> {
  return chatWithAiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithAiPrompt',
  input: {schema: ChatWithAiInputSchema},
  output: {schema: ChatWithAiOutputSchema},
  prompt: `You are AuraChat, a helpful and friendly AI assistant. Respond to the user's message in a conversational manner. Format your response with paragraphs and newlines for readability.

User message: {{{message}}}`,
});

const chatWithAiFlow = ai.defineFlow(
  {
    name: 'chatWithAiFlow',
    inputSchema: ChatWithAiInputSchema,
    outputSchema: ChatWithAiOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
