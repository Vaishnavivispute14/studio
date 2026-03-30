'use server';
/**
 * @fileOverview A flow for a conversational AI chatbot using Google Gemini.
 *
 * - chatWithAi - A function that handles the AI chatbot conversation.
 * - ChatWithAiInput - The input type for the chatWithAi function.
 * - ChatWithAiOutput - The return type for the chatWithAi function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatWithAiInputSchema = z.object({
  message: z.string().describe("The user's message to the AI chatbot."),
  mode: z
    .enum(['reasoning', 'deep_research'])
    .optional()
    .nullable()
    .describe('The mode of operation for the AI.'),
});
export type ChatWithAiInput = z.infer<typeof ChatWithAiInputSchema>;

const ChatWithAiOutputSchema = z.object({
  response: z.string().describe('The AI-generated response.'),
});
export type ChatWithAiOutput = z.infer<typeof ChatWithAiOutputSchema>;

/**
 * Main function to chat with AI using Google Gemini.
 */
export async function chatWithAi(input: ChatWithAiInput): Promise<ChatWithAiOutput> {
  return chatWithAiFlow(input);
}

const chatWithAiPrompt = ai.definePrompt({
  name: 'chatWithAiPrompt',
  input: { schema: ChatWithAiInputSchema },
  output: { format: 'text' },
  model: 'googleai/gemini-1.5-flash',
  system: `You are NexBot, a highly intelligent and friendly AI assistant. 
Provide responses that are clear, professional, and easy to scan:
- Use short paragraphs.
- Use double line breaks between paragraphs.
- Use bullet points or numbered lists for steps.
- If in 'reasoning' mode, provide logical, step-by-step analysis.
- If in 'deep_research' mode, provide comprehensive, detailed insights.`,
  prompt: 'User: {{{message}}}',
});

const chatWithAiFlow = ai.defineFlow(
  {
    name: 'chatWithAiFlow',
    inputSchema: ChatWithAiInputSchema,
    outputSchema: ChatWithAiOutputSchema,
  },
  async (input) => {
    const { text } = await chatWithAiPrompt(input);
    return {
      response: text || "I'm sorry, I couldn't generate a response.",
    };
  }
);
