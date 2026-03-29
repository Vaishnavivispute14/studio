
import {genkit} from 'genkit';
import {openAI} from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    openAI({
      apiKey: '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',
      baseURL: 'https://integrate.api.nvidia.com/v1',
    }),
  ],
  // Using NVIDIA NIM (OpenAI compatible) with the Llama 3.3 70B model
  model: 'openai/meta/llama-3.3-70b-instruct',
});
