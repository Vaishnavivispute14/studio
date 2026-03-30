
import {genkit} from 'genkit';

/**
 * Genkit initialization.
 * We've removed model plugins as we're calling Hugging Face directly via axios.
 * The 'ai' object is still used for flow definitions if needed.
 */
export const ai = genkit({
  plugins: [],
});
