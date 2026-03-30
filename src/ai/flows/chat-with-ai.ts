
'use server';
/**
 * @fileOverview A flow for a conversational AI chatbot using Hugging Face Inference API.
 *
 * - chatWithAi - A function that handles the AI chatbot conversation.
 * - ChatWithAiInput - The input type for the chatWithAi function.
 * - ChatWithAiOutput - The return type for the chatWithAi function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import axios from 'axios';

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
 * Main function to chat with AI using Hugging Face Inference API.
 */
export async function chatWithAi(input: ChatWithAiInput): Promise<ChatWithAiOutput> {
  return chatWithAiFlow(input);
}

const chatWithAiFlow = ai.defineFlow(
  {
    name: 'chatWithAiFlow',
    inputSchema: ChatWithAiInputSchema,
    outputSchema: ChatWithAiOutputSchema,
  },
  async input => {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    const model = process.env.HUGGINGFACE_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct';

    if (!apiKey) {
      throw new Error("HUGGINGFACE_API_KEY is not configured.");
    }

    // Build the system prompt
    let systemPrompt = `You are NexBot, a highly intelligent and friendly AI assistant. 
Your goal is to provide responses that have a ChatGPT-like structure:
- Use short, clear paragraphs.
- Use double line breaks between paragraphs for clean spacing.
- Use bullet points or numbered lists for steps.
- Maintain a professional and easy-to-scan format.`;

    if (input.mode === 'reasoning') {
      systemPrompt += "\n\nMode: Reasoning. Provide logical, step-by-step analysis.";
    } else if (input.mode === 'deep_research') {
      systemPrompt += "\n\nMode: Deep Research. Provide comprehensive, detailed insights.";
    }

    // Formatting for Llama 3 Instruct
    const prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n${input.message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;

    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 1024,
            return_full_text: false,
            temperature: 0.7,
            top_p: 0.9,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Hugging Face returns an array of objects
      const generatedText = response.data[0]?.generated_text || "I'm sorry, I couldn't generate a response.";

      return {
        response: generatedText.trim(),
      };
    } catch (error: any) {
      console.error("Hugging Face API Error:", error.response?.data || error.message);
      
      // Handle loading state (503) which is common for Inference API
      if (error.response?.status === 503) {
        return {
          response: "The AI model is currently loading on Hugging Face. Please try again in a few seconds.",
        };
      }

      throw new Error("Failed to get response from AI provider.");
    }
  }
);
