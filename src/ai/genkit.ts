import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      // Using the specific API key provided by the user to ensure model access
      apiKey: 'AIzaSyD5EjFMiX5UktV8u-R4_C7rx1H4R4BK1eE',
    }),
  ],
  // Standardized model identifier for Gemini 1.5 Flash
  model: 'googleai/gemini-1.5-flash',
});
