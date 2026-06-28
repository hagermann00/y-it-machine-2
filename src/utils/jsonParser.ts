/**
 * Robustly parses JSON from LLM output using multiple extraction strategies.
 * Handles markdown code blocks, raw text, partial responses, and malformed JSON.
 */

// Pre-compile regexes and static arrays to avoid reallocation on every function call
const JSON_BLOCK_START_REGEX = /```json/i;
const JSON_BLOCK_CLEAN_REGEX = /```json/gi;
const CODE_BLOCK_CLEAN_REGEX = /```/g;
const TEXT_BEFORE_JSON_REGEX = /^[^[{]*/;
const TEXT_AFTER_JSON_REGEX = /[^\]}]*$/;
const TRAILING_COMMA_REGEX = /,\s*(?=[}\]])/g;
const UNQUOTED_KEY_REGEX = /([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g;
const SINGLE_QUOTE_STRING_REGEX = /'((?:[^'\\]|\\.)*)'/g;
const JSON_OBJECT_REGEX = /(\{[\s\S]*\})/;
const JSON_ARRAY_REGEX = /(\[[\s\S]*\])/;

const JSON_EXTRACT_PATTERNS = [
  JSON_OBJECT_REGEX,
  JSON_ARRAY_REGEX
];

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
  const jsonStartMatch = text.match(JSON_BLOCK_START_REGEX);
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
  for (const pattern of JSON_EXTRACT_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]) as T;
      } catch { }
    }
  }

  // Strategy 4: Aggressive cleanup - remove common LLM artifacts
  let cleanText = text
    .replace(JSON_BLOCK_CLEAN_REGEX, '')
    .replace(CODE_BLOCK_CLEAN_REGEX, '')
    .replace(TEXT_BEFORE_JSON_REGEX, '')  // Remove text before first { or [
    .replace(TEXT_AFTER_JSON_REGEX, '') // Remove text after last } or ]
    .trim();

  try {
    return JSON.parse(cleanText) as T;
  } catch { }

  // Strategy 5: Try to fix common JSON issues (trailing commas, unquoted keys, single quotes)
  cleanText = cleanText
    // 1. Handle single quotes: 'string' -> "string", while preserving internal apostrophes
    .replace(SINGLE_QUOTE_STRING_REGEX, (_, p1) => {
      return '"' + p1.replace(/"/g, '\\"').replace(/\\'/g, "'") + '"';
    })
    // 2. Add quotes to unquoted keys
    .replace(UNQUOTED_KEY_REGEX, '$1"$2":')
    // 3. Remove trailing commas
    .replace(TRAILING_COMMA_REGEX, '')
    .trim();

  const jsonMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]) as T;
    } catch { }
  }

  // All strategies failed
  console.error("All JSON parsing strategies failed for:", text.substring(0, 200) + "...");
  throw new Error("Invalid JSON format received from LLM. The response could not be parsed.");
};