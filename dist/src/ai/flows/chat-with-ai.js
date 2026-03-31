'use server';
/**
 * @fileOverview A flow for a conversational AI chatbot using Google Gemini 2.5 Flash.
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
const ChatWithAiOutputSchema = z.object({
    response: z.string().describe('The AI-generated response.'),
});
/**
 * Main function to chat with AI using Google Gemini 2.5 Flash.
 */
export async function chatWithAi(input) {
    return chatWithAiFlow(input);
}
const chatWithAiPrompt = ai.definePrompt({
    name: 'chatWithAiPrompt',
    input: { schema: ChatWithAiInputSchema },
    output: { format: 'text' },
    model: 'googleai/gemini-2.5-flash',
    system: `You are NexBot, a highly intelligent and friendly AI assistant. 
Provide responses that are clear, professional, and easy to scan:
- Use short paragraphs.
- Use double line breaks between paragraphs.
- Use bullet points or numbered lists for steps.
- If in 'reasoning' mode, provide logical, step-by-step analysis.
- If in 'deep_research' mode, provide comprehensive, detailed insights.`,
    prompt: 'User: {{{message}}}',
});
const chatWithAiFlow = ai.defineFlow({
    name: 'chatWithAiFlow',
    inputSchema: ChatWithAiInputSchema,
    outputSchema: ChatWithAiOutputSchema,
}, async (input) => {
    var _a;
    const result = await chatWithAiPrompt(input);
    return {
        response: (_a = result === null || result === void 0 ? void 0 : result.text) !== null && _a !== void 0 ? _a : "⚠️ AI did not return a response",
    };
});
