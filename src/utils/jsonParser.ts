/**
 * Robustly parses JSON from LLM output using multiple extraction strategies.
 * Handles markdown code blocks, raw text, partial responses, and malformed JSON.
 */
export const parseJsonFromLLM = <T>(text: string): T => {
  if (!text || typeof text !== 'string') {
    throw new Error("Empty or invalid response from LLM");
  }

  // Strategy 1: Direct parse (already valid JSON)
  try {
    return JSON.parse(text.trim()) as T;
  } catch { }

  // Strategy 2: Extract from markdown code blocks
  // Optimized to avoid regex looping over large text
  const jsonStartMatch = text.match(/```json/i);
  if (jsonStartMatch && jsonStartMatch.index !== undefined) {
    const start = jsonStartMatch.index + jsonStartMatch[0].length;
    const end = text.indexOf('```', start);
    if (end !== -1) {
      try {
        return JSON.parse(text.slice(start, end).trim()) as T;
      } catch { }
    }
  }

  const codeBlockStart = text.indexOf('```');
  if (codeBlockStart !== -1) {
    const start = codeBlockStart + 3;
    const end = text.indexOf('```', start);
    if (end !== -1) {
      try {
        return JSON.parse(text.slice(start, end).trim()) as T;
      } catch { }
    }
  }

  const inlineCodeStart = text.indexOf('`');
  if (inlineCodeStart !== -1) {
    const start = inlineCodeStart + 1;
    const end = text.indexOf('`', start);
    if (end !== -1) {
      try {
        return JSON.parse(text.slice(start, end).trim()) as T;
      } catch { }
    }
  }

  // Strategy 3: Find JSON-like structure in text (starts with { or [)
  const jsonPatterns = [
    /(\{[\s\S]*\})/,  // Object
    /(\[[\s\S]*\])/   // Array
  ];

  for (const pattern of jsonPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]) as T;
      } catch { }
    }
  }

  // Strategy 4: Aggressive cleanup - remove common LLM artifacts
  let cleanText = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/^[^[{]*/, '')  // Remove text before first { or [
    .replace(/[^\]}]*$/, '') // Remove text after last } or ]
    .trim();

  try {
    return JSON.parse(cleanText) as T;
  } catch { }

  // Strategy 5: Try to fix common JSON issues
  cleanText = text
    .replace(/,\s*}/g, '}')     // Remove trailing commas in objects
    .replace(/,\s*]/g, ']')     // Remove trailing commas in arrays
    .replace(/'(?=(?:[^"]*"[^"]*")*[^"]*$)/g, (match, offset, str) => {
      const prev = str[offset - 1];
      const next = str[offset + 1];
      if (prev && next && /[a-zA-Z]/.test(prev) && /[a-zA-Z]/.test(next)) {
        return "'";
      }
      return '"';
    }) // Replace single quotes with double, preserving internal apostrophes
    .replace(/([,{]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Add quotes to unquoted keys
    .trim();

  try {
    return JSON.parse(cleanText) as T;
  } catch { }

  const greedyMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (greedyMatch) {
    try {
      return JSON.parse(greedyMatch[1]) as T;
    } catch { }
  }

  // All strategies failed
  console.error("All JSON parsing strategies failed for:", text.substring(0, 200) + "...");
  throw new Error("Invalid JSON format received from LLM. The response could not be parsed.");
};