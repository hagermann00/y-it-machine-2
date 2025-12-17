
/**
 * Utility to repair malformed JSON strings returned by LLMs.
 * Handles common errors like:
 * - Markdown code blocks (```json ... ```)
 * - Trailing commas
 * - Missing closing brackets/braces (Best effort)
 */
export const repairJson = (jsonString: string): string => {
  if (!jsonString) return "{}";

  // 1. Remove Markdown code blocks
  let clean = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();

  // 2. Remove comments (basic single line //)
  // Be careful with URLs, so strict regex might be risky.
  // Standard JSON doesn't support comments, but LLMs often add them.
  // We'll skip stripping comments for now to avoid false positives in string content.

  // 3. Fix Trailing Commas (Common in LLM arrays/objects)
  // Regex: Find a comma, followed by optional whitespace, followed by a closing brace/bracket
  clean = clean.replace(/,(\s*[}\]])/g, '$1');

  // 4. Attempt to balance brackets if truncated (Naive approach)
  // Count open/close
  const openBraces = (clean.match(/{/g) || []).length;
  const closeBraces = (clean.match(/}/g) || []).length;
  const openBrackets = (clean.match(/\[/g) || []).length;
  const closeBrackets = (clean.match(/]/g) || []).length;

  if (openBraces > closeBraces) {
    clean += '}'.repeat(openBraces - closeBraces);
  }
  if (openBrackets > closeBrackets) {
    clean += ']'.repeat(openBrackets - closeBrackets);
  }

  return clean;
};

/**
 * Safe JSON Parse that attempts repair if standard parse fails.
 */
export const safeJsonParse = <T>(text: string, fallback: T | null = null): T | null => {
  try {
    return JSON.parse(text);
  } catch (e) {
    // First attempt: Basic cleanup (whitespace)
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e2) {
        // Second attempt: Deep repair
        try {
            const repaired = repairJson(text);
            return JSON.parse(repaired);
        } catch (e3) {
            console.error("Failed to parse JSON even after repair:", e3, "\nInput:", text);
            return fallback;
        }
    }
  }
};
