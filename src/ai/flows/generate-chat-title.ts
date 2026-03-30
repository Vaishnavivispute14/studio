
'use server';
/**
 * @fileOverview A flow for generating a chat session title using Google Gemini.
 *
 * - generateChatTitle - A function that creates a concise title from a message.
 * - GenerateChatTitleInput - The input type for the generateChatTitle function.
 * - GenerateChatTitleOutput - The return type for the generateChatTitle function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const GenerateChatTitleInputSchema = z.object({
  message: z.string().describe("The user's message to summarize."),
});
export type GenerateChatTitleInput = z.infer<typeof GenerateChatTitleInputSchema>;

const GenerateChatTitleOutputSchema = z.object({
  title: z.string().describe('The generated concise title.'),
});
export type GenerateChatTitleOutput = z.infer<typeof GenerateChatTitleOutputSchema>;

export async function generateChatTitle(input: GenerateChatTitleInput): Promise<GenerateChatTitleOutput> {
  return generateChatTitleFlow(input);
}

const titlePrompt = ai.definePrompt({
  name: 'generateChatTitlePrompt',
  input: { schema: GenerateChatTitleInputSchema },
  output: { format: 'text' },
  model: googleAI('gemini-1.5-flash'),
  system: 'Generate a very concise title (2-4 words) for a chat session based on the provided user message. Do not use quotes.',
  prompt: 'Message: {{{message}}}',
});

const generateChatTitleFlow = ai.defineFlow(
  {
    name: 'generateChatTitleFlow',
    inputSchema: GenerateChatTitleInputSchema,
    outputSchema: GenerateChatTitleOutputSchema,
  },
  async (input) => {
    const { text } = await titlePrompt(input);
    let title = text || "New Chat";
    title = title.replace(/["']/g, "").trim();
    return {
      title: title || "New Chat",
    };
  }
);
