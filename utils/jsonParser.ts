/**
 * robustly parses JSON from LLM output, handling markdown code blocks and raw text.
 */
export const parseJsonFromLLM = <T>(text: string): T => {
  try {
    if (!text) throw new Error("Empty response from LLM");
    
    // Remove markdown code blocks (e.g., ```json ... ```)
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '');
    
    // Trim whitespace
    cleanText = cleanText.trim();
    
    // Parse
    return JSON.parse(cleanText) as T;
  } catch (error) {
    console.error("Failed to parse JSON from LLM:", text);
    throw new Error("Invalid JSON format received from LLM.");
  }
};