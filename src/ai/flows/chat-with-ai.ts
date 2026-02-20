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
  mode: z.enum(['reasoning', 'deep_research']).optional().describe('The mode of operation for the AI.'),
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
{{#if mode}}

You are currently in a special mode:
{{#if (eq mode "reasoning")}}
**Reasoning Mode:** Provide step-by-step reasoning and logical explanations for your answers. Break down complex topics.
{{/if}}
{{#if (eq mode "deep_research")}}
**Deep Research Mode:** Provide a comprehensive, in-depth answer. If possible, consult external knowledge and mention potential sources, but do not fabricate URLs.
{{/if}}
{{/if}}

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
