
'use server';
/**
 * @fileOverview A flow for generating a chat session title using Hugging Face.
 *
 * - generateChatTitle - A function that creates a concise title from a message.
 * - GenerateChatTitleInput - The input type for the generateChatTitle function.
 * - GenerateChatTitleOutput - The return type for the generateChatTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import axios from 'axios';

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

const generateChatTitleFlow = ai.defineFlow(
  {
    name: 'generateChatTitleFlow',
    inputSchema: GenerateChatTitleInputSchema,
    outputSchema: GenerateChatTitleOutputSchema,
  },
  async input => {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    const model = process.env.HUGGINGFACE_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct';

    if (!apiKey) {
      throw new Error("HUGGINGFACE_API_KEY is not configured.");
    }

    const prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\nGenerate a concise title (2-4 words) for a chat session based on the following user message. The title should capture the main topic. Do not use quotes.<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n${input.message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;

    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 15,
            return_full_text: false,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let title = response.data[0]?.generated_text || "New Chat";
      title = title.replace(/["']/g, "").trim();

      return {
        title: title || "New Chat",
      };
    } catch (error: any) {
      console.error("Hugging Face Title Error:", error.message);
      return { title: "New Chat" };
    }
  }
);
