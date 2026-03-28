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

export async function chatWithAi(input: ChatWithAiInput): Promise<ChatWithAiOutput> {
  return chatWithAiFlow(input);
}

// Internal schema for the prompt to avoid complex logic in Handlebars
const ChatPromptInputSchema = z.object({
  message: z.string(),
  isReasoning: z.boolean().optional(),
  isDeepResearch: z.boolean().optional(),
});

const prompt = ai.definePrompt({
  name: 'chatWithAiPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: ChatPromptInputSchema},
  output: {schema: ChatWithAiOutputSchema},
  prompt: `You are NexBot, a highly intelligent and friendly AI assistant. 

Your goal is to provide responses that have a ChatGPT-like structure:
- Use short, clear paragraphs.
- Use double line breaks between paragraphs for clean spacing.
- Use bullet points or numbered lists for steps, multiple items, or lists.
- Ensure clear separation of points with headers or bold text where appropriate.
- Maintain a professional, structured, and easy-to-scan format.
- Tone should be interactive and engaging, yet concise.

{{#if isReasoning}}
You are currently in **Reasoning Mode**: Provide logical, step-by-step analysis. Break down complex problems clearly. Use structured thinking.
{{/if}}

{{#if isDeepResearch}}
You are currently in **Deep Research Mode**: Provide comprehensive, detailed insights. Synthesize information thoroughly. Organize findings with clear headers.
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
    // Pre-process the input to set flags for the prompt
    const {output} = await prompt({
      message: input.message,
      isReasoning: input.mode === 'reasoning',
      isDeepResearch: input.mode === 'deep_research',
    });
    return output!;
  }
);
