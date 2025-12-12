
# Technical Task for ChatGPT 5.1

You are tasked with implementing the `OpenAIProvider` class for a multi-LLM TypeScript application. 
The system uses a standardized abstract class `LLMProvider`.

## Context
- **SDK:** `openai` (Node.js/Browser compatible)
- **Framework:** React/Vite (TypeScript)
- **Goal:** Implement the `LLMProvider` interface for OpenAI, supporting Text (GPT-4o) and Image (DALL-E 3) generation.

## Interfaces

Here is the abstract base class and types you MUST match:

```typescript
// src/services/core/providers/LLMProvider.ts

export interface GenerationConfig {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  systemPrompt?: string;
  images?: string[]; // Base64 strings (pure base64, no data: prefix)
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
}

export abstract class LLMProvider {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract readonly id: string; // Should be 'openai'
  
  abstract generateText(
    modelId: string, 
    prompt: string, 
    config?: GenerationConfig
  ): Promise<string>;

  abstract generateImage(
    modelId: string,
    prompt: string,
    width?: number,
    height?: number
  ): Promise<string>;
  
  isConfigured(): boolean {
      return !!this.config.apiKey;
  }
}
```

## Requirements for OpenAIProvider.ts

1.  **Class Name:** `OpenAIProvider` (extends `LLMProvider`)
2.  **Constructor:** Initialize `new OpenAI({ apiKey, dangerouslyAllowBrowser: true })`.
3.  **generateText:**
    -   Use `chat.completions.create`.
    -   Map `prompt` to `user` role.
    -   Map `config.systemPrompt` to `system` role.
    -   Map `config.images` to `image_url` content parts (prepending `data:image/png;base64,` to the generic base64 string).
    -   Handle `config.jsonMode` by setting `response_format: { type: "json_object" }`. Note: You usually need to ensure the word "JSON" is in the prompt for this to work safely with OpenAI.
    -   Return the content string (handle `null`).
4.  **generateImage:**
    -   Use `images.generate`.
    -   If `modelId` is `dall-e-3`, remember it requires specific standard sizes (1024x1024). Map width/height requests to the nearest standard size or default to `1024x1024`.
    -   Return the base64_json (`b64_json`) string, properly formatted as a data URI (`data:image/png;base64,...`).

## Your Output
Please provide the **full, complete TypeScript code** for `src/services/core/providers/OpenAIProvider.ts`. No comments explaining "how" to do it, just the production-ready code.
