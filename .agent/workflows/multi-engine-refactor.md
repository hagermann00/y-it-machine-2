---
description: Refactor y-it-machine-2 to support multiple AI engines (Gemini, OpenAI, Anthropic) with MCP tool integration
---

# Multi-Engine + MCP Integration Plan

**Estimated Total Effort:** 8-12 hours  
**Complexity:** Medium-High  
**Risk:** Low (incremental, non-breaking changes)

---

## Phase 1: Abstract LLM Provider Interface (2-3 hours)

### 1.1 Create Core Types

Create `services/core/types/LLMTypes.ts`:

```typescript
// Provider-agnostic types for all LLM operations

export type ProviderID = 'gemini' | 'openai' | 'anthropic';

export interface TextGenParams {
  prompt: string;
  systemPrompt?: string;
  model?: string;  // Provider-specific model ID, or use default
  jsonSchema?: object;  // For structured output
  thinkingBudget?: number;  // Extended thinking (Gemini/Claude)
  tools?: ToolDefinition[];  // MCP-style tools
  maxTokens?: number;
}

export interface TextGenResult {
  text: string;
  usage?: { inputTokens: number; outputTokens: number };
  toolCalls?: ToolCall[];
}

export interface ImageGenParams {
  prompt: string;
  style?: string;
  aspectRatio?: '1:1' | '3:4' | '16:9' | '9:16';
  quality?: 'standard' | 'hd';
}

export interface ImageGenResult {
  imageBase64: string;
  mimeType: string;
}

export interface AudioGenParams {
  text: string;
  voice?: string;
  speakers?: { name: string; voice: string }[];  // Multi-speaker
}

export interface AudioGenResult {
  audioBase64: string;
  mimeType: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: object;  // JSON Schema
}

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export type ProviderCapability = 
  | 'text-generation'
  | 'json-mode'
  | 'image-generation'
  | 'image-editing'
  | 'audio-tts'
  | 'multi-speaker-tts'
  | 'web-search'
  | 'extended-thinking'
  | 'tool-calling';
```

### 1.2 Create Abstract Provider Interface

Create `services/core/providers/LLMProvider.ts`:

```typescript
import { 
  TextGenParams, TextGenResult, 
  ImageGenParams, ImageGenResult,
  AudioGenParams, AudioGenResult,
  ProviderCapability, ProviderID
} from '../types/LLMTypes';

export abstract class LLMProvider {
  abstract readonly id: ProviderID;
  abstract readonly name: string;
  abstract readonly capabilities: ProviderCapability[];
  
  // Required - all providers must implement text generation
  abstract generateText(params: TextGenParams): Promise<TextGenResult>;
  
  // Optional capabilities - throw if not supported
  generateImage?(params: ImageGenParams): Promise<ImageGenResult>;
  editImage?(image: string, prompt: string): Promise<ImageGenResult>;
  generateAudio?(params: AudioGenParams): Promise<AudioGenResult>;
  
  // Capability check
  supports(capability: ProviderCapability): boolean {
    return this.capabilities.includes(capability);
  }
  
  // Retry wrapper with exponential backoff
  protected async withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries > 0 && this.isRetryable(error)) {
        await new Promise(r => setTimeout(r, delay));
        return this.withRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }
  
  protected isRetryable(error: any): boolean {
    const status = error.status || error.response?.status;
    return status === 429 || (status >= 500 && status < 600);
  }
}
```

### 1.3 Implement Gemini Provider

Create `services/core/providers/GeminiProvider.ts`:

```typescript
import { GoogleGenAI, Type } from "@google/genai";
import { LLMProvider } from './LLMProvider';
import { 
  TextGenParams, TextGenResult,
  ImageGenParams, ImageGenResult,
  AudioGenParams, AudioGenResult,
  ProviderCapability
} from '../types/LLMTypes';

export class GeminiProvider extends LLMProvider {
  readonly id = 'gemini' as const;
  readonly name = 'Google Gemini';
  readonly capabilities: ProviderCapability[] = [
    'text-generation',
    'json-mode',
    'image-generation',
    'image-editing',
    'audio-tts',
    'multi-speaker-tts',
    'web-search',
    'extended-thinking',
    'tool-calling'
  ];
  
  private client: GoogleGenAI;
  
  constructor(apiKey?: string) {
    super();
    this.client = new GoogleGenAI({ 
      apiKey: apiKey || process.env.GEMINI_API_KEY || '' 
    });
  }
  
  async generateText(params: TextGenParams): Promise<TextGenResult> {
    return this.withRetry(async () => {
      const config: any = {};
      
      if (params.systemPrompt) {
        config.systemInstruction = params.systemPrompt;
      }
      
      if (params.jsonSchema) {
        config.responseMimeType = 'application/json';
        config.responseSchema = params.jsonSchema;
      }
      
      if (params.thinkingBudget) {
        config.thinkingConfig = { thinkingBudget: params.thinkingBudget };
      }
      
      // Convert tools to Gemini format (or use MCP adapter)
      if (params.tools?.some(t => t.name === 'web_search')) {
        config.tools = [{ googleSearch: {} }];
      }
      
      const response = await this.client.models.generateContent({
        model: params.model || 'gemini-2.5-flash',
        contents: params.prompt,
        config
      });
      
      return {
        text: response.text || '',
        usage: {
          inputTokens: response.usageMetadata?.promptTokenCount || 0,
          outputTokens: response.usageMetadata?.candidatesTokenCount || 0
        }
      };
    });
  }
  
  async generateImage(params: ImageGenParams): Promise<ImageGenResult> {
    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: params.prompt }] },
      config: {
        imageConfig: { aspectRatio: params.aspectRatio || '3:4' }
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        return {
          imageBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png'
        };
      }
    }
    
    throw new Error('No image generated');
  }
  
  async generateAudio(params: AudioGenParams): Promise<AudioGenResult> {
    const config: any = { responseModalities: ['AUDIO'] };
    
    if (params.speakers && params.speakers.length > 1) {
      config.speechConfig = {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: params.speakers.map(s => ({
            speaker: s.name,
            voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voice } }
          }))
        }
      };
    } else {
      config.speechConfig = {
        voiceConfig: { 
          prebuiltVoiceConfig: { voiceName: params.voice || 'Puck' } 
        }
      };
    }
    
    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: { parts: [{ text: params.text }] },
      config
    });
    
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!audioData?.data) {
      throw new Error('No audio generated');
    }
    
    return {
      audioBase64: audioData.data,
      mimeType: audioData.mimeType || 'audio/wav'
    };
  }
}
```

### 1.4 Implement OpenAI Provider

Create `services/core/providers/OpenAIProvider.ts`:

```typescript
import OpenAI from 'openai';
import { LLMProvider } from './LLMProvider';
import { 
  TextGenParams, TextGenResult,
  ImageGenParams, ImageGenResult,
  ProviderCapability
} from '../types/LLMTypes';

export class OpenAIProvider extends LLMProvider {
  readonly id = 'openai' as const;
  readonly name = 'OpenAI';
  readonly capabilities: ProviderCapability[] = [
    'text-generation',
    'json-mode',
    'image-generation',
    'tool-calling'
    // Note: NO web-search, multi-speaker-tts, extended-thinking
  ];
  
  private client: OpenAI;
  
  constructor(apiKey?: string) {
    super();
    this.client = new OpenAI({ 
      apiKey: apiKey || process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: true  // For client-side usage
    });
  }
  
  async generateText(params: TextGenParams): Promise<TextGenResult> {
    return this.withRetry(async () => {
      const messages: any[] = [];
      
      if (params.systemPrompt) {
        messages.push({ role: 'system', content: params.systemPrompt });
      }
      messages.push({ role: 'user', content: params.prompt });
      
      const config: any = {
        model: params.model || 'gpt-4o',
        messages,
        max_tokens: params.maxTokens || 4096
      };
      
      if (params.jsonSchema) {
        config.response_format = { 
          type: 'json_schema',
          json_schema: {
            name: 'response',
            schema: params.jsonSchema
          }
        };
      }
      
      // Convert MCP tools to OpenAI format
      if (params.tools?.length) {
        config.tools = params.tools.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters
          }
        }));
      }
      
      const response = await this.client.chat.completions.create(config);
      
      return {
        text: response.choices[0]?.message?.content || '',
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0
        },
        toolCalls: response.choices[0]?.message?.tool_calls?.map(tc => ({
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments)
        }))
      };
    });
  }
  
  async generateImage(params: ImageGenParams): Promise<ImageGenResult> {
    const sizeMap: Record<string, string> = {
      '1:1': '1024x1024',
      '3:4': '1024x1792',
      '16:9': '1792x1024',
      '9:16': '1024x1792'
    };
    
    const response = await this.client.images.generate({
      model: 'dall-e-3',
      prompt: params.prompt,
      size: (sizeMap[params.aspectRatio || '1:1'] || '1024x1024') as any,
      quality: params.quality === 'hd' ? 'hd' : 'standard',
      response_format: 'b64_json'
    });
    
    return {
      imageBase64: response.data[0].b64_json || '',
      mimeType: 'image/png'
    };
  }
}
```

### 1.5 Implement Anthropic Provider

Create `services/core/providers/AnthropicProvider.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider } from './LLMProvider';
import { 
  TextGenParams, TextGenResult,
  ProviderCapability
} from '../types/LLMTypes';

export class AnthropicProvider extends LLMProvider {
  readonly id = 'anthropic' as const;
  readonly name = 'Anthropic Claude';
  readonly capabilities: ProviderCapability[] = [
    'text-generation',
    'json-mode',
    'extended-thinking',
    'tool-calling'
    // Note: NO image-generation, audio, web-search
  ];
  
  private client: Anthropic;
  
  constructor(apiKey?: string) {
    super();
    this.client = new Anthropic({ 
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    });
  }
  
  async generateText(params: TextGenParams): Promise<TextGenResult> {
    return this.withRetry(async () => {
      const config: any = {
        model: params.model || 'claude-sonnet-4-20250514',
        max_tokens: params.maxTokens || 4096,
        messages: [{ role: 'user', content: params.prompt }]
      };
      
      if (params.systemPrompt) {
        config.system = params.systemPrompt;
      }
      
      // Extended thinking for Claude
      if (params.thinkingBudget) {
        config.thinking = {
          type: 'enabled',
          budget_tokens: params.thinkingBudget
        };
      }
      
      // Convert MCP tools to Anthropic format
      if (params.tools?.length) {
        config.tools = params.tools.map(t => ({
          name: t.name,
          description: t.description,
          input_schema: t.parameters
        }));
      }
      
      const response = await this.client.messages.create(config);
      
      // Extract text and tool use
      let text = '';
      const toolCalls: any[] = [];
      
      for (const block of response.content) {
        if (block.type === 'text') {
          text += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            name: block.name,
            arguments: block.input
          });
        }
      }
      
      return {
        text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens
        },
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined
      };
    });
  }
}
```

### 1.6 Create Provider Registry

Create `services/core/ProviderRegistry.ts`:

```typescript
import { LLMProvider } from './providers/LLMProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { ProviderID, ProviderCapability } from './types/LLMTypes';

class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<ProviderID, LLMProvider> = new Map();
  private activeProvider: ProviderID = 'gemini';
  
  private constructor() {
    // Initialize available providers based on API keys
    if (process.env.GEMINI_API_KEY || process.env.API_KEY) {
      this.providers.set('gemini', new GeminiProvider());
    }
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIProvider());
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', new AnthropicProvider());
    }
  }
  
  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }
  
  getProvider(id?: ProviderID): LLMProvider {
    const providerId = id || this.activeProvider;
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not available. Check API keys.`);
    }
    return provider;
  }
  
  setActiveProvider(id: ProviderID): void {
    if (!this.providers.has(id)) {
      throw new Error(`Provider ${id} not available`);
    }
    this.activeProvider = id;
  }
  
  getActiveProvider(): LLMProvider {
    return this.getProvider(this.activeProvider);
  }
  
  listAvailable(): ProviderID[] {
    return Array.from(this.providers.keys());
  }
  
  // Find best provider for a specific capability
  getProviderFor(capability: ProviderCapability): LLMProvider | null {
    // Prefer active provider if it supports the capability
    const active = this.getActiveProvider();
    if (active.supports(capability)) {
      return active;
    }
    
    // Otherwise find any provider that supports it
    for (const provider of this.providers.values()) {
      if (provider.supports(capability)) {
        return provider;
      }
    }
    
    return null;
  }
}

export const registry = ProviderRegistry.getInstance();
```

---

## Phase 2: MCP Integration for Tools (2-3 hours)

### 2.1 Create MCP Search Server

Create `mcp-servers/search-server/index.ts`:

```typescript
// This runs as a separate Node.js process
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'search-server',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

// Define the web search tool
server.setRequestHandler('tools/list', async () => ({
  tools: [{
    name: 'web_search',
    description: 'Search the web for current information on any topic',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query'
        },
        num_results: {
          type: 'number',
          description: 'Number of results to return (default: 5)'
        }
      },
      required: ['query']
    }
  }]
}));

// Handle tool execution
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'web_search') {
    const { query, num_results = 5 } = request.params.arguments;
    
    // Use Brave Search API (or Google Custom Search, Bing, etc.)
    const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
    
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${num_results}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY || ''
        }
      }
    );
    
    const data = await response.json();
    
    const results = data.web?.results?.map((r: any) => ({
      title: r.title,
      url: r.url,
      description: r.description
    })) || [];
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(results, null, 2)
      }]
    };
  }
  
  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start the server
const transport = new StdioServerTransport();
server.connect(transport);
```

### 2.2 Create MCP Client Wrapper

Create `services/core/MCPClient.ts`:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ToolDefinition, ToolCall } from './types/LLMTypes';

export class MCPToolClient {
  private static instance: MCPToolClient;
  private clients: Map<string, Client> = new Map();
  private toolMap: Map<string, string> = new Map(); // tool name -> server name
  
  static getInstance(): MCPToolClient {
    if (!MCPToolClient.instance) {
      MCPToolClient.instance = new MCPToolClient();
    }
    return MCPToolClient.instance;
  }
  
  async connectServer(name: string, transport: any): Promise<void> {
    const client = new Client({ name: `y-it-${name}`, version: '1.0.0' }, {});
    await client.connect(transport);
    this.clients.set(name, client);
    
    // Register tools from this server
    const tools = await client.listTools();
    for (const tool of tools.tools) {
      this.toolMap.set(tool.name, name);
    }
  }
  
  async listAllTools(): Promise<ToolDefinition[]> {
    const allTools: ToolDefinition[] = [];
    
    for (const client of this.clients.values()) {
      const response = await client.listTools();
      for (const tool of response.tools) {
        allTools.push({
          name: tool.name,
          description: tool.description || '',
          parameters: tool.inputSchema as object
        });
      }
    }
    
    return allTools;
  }
  
  async executeTool(call: ToolCall): Promise<string> {
    const serverName = this.toolMap.get(call.name);
    if (!serverName) {
      throw new Error(`Unknown tool: ${call.name}`);
    }
    
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server ${serverName} not connected`);
    }
    
    const result = await client.callTool({
      name: call.name,
      arguments: call.arguments
    });
    
    // Extract text content
    return result.content
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text)
      .join('\n');
  }
}

export const mcpClient = MCPToolClient.getInstance();
```

### 2.3 Update vite.config.ts for Multiple API Keys

```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Gemini
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // OpenAI
      'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
      // Anthropic
      'process.env.ANTHROPIC_API_KEY': JSON.stringify(env.ANTHROPIC_API_KEY),
      // Brave Search (for MCP)
      'process.env.BRAVE_API_KEY': JSON.stringify(env.BRAVE_API_KEY),
    }
  };
});
```

---

## Phase 3: Refactor Existing Services (2-3 hours)

### 3.1 Update BaseAgent

```typescript
import { registry } from '../core/ProviderRegistry';
import { mcpClient } from '../core/MCPClient';
import { TextGenParams } from '../core/types/LLMTypes';

export abstract class BaseAgent {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  abstract run(topic: string): Promise<string>;

  protected async executeSearch(
    systemPrompt: string, 
    userPrompt: string
  ): Promise<string> {
    const provider = registry.getActiveProvider();
    
    // If provider supports native search (Gemini), use it
    if (provider.supports('web-search')) {
      const result = await provider.generateText({
        prompt: userPrompt,
        systemPrompt,
        tools: [{ name: 'web_search', description: '', parameters: {} }]
      });
      return result.text;
    }
    
    // Otherwise, use MCP tool + LLM synthesis
    const tools = await mcpClient.listAllTools();
    const searchTool = tools.find(t => t.name === 'web_search');
    
    if (!searchTool) {
      throw new Error('No search capability available');
    }
    
    // Step 1: Ask LLM to formulate search query
    const queryResult = await provider.generateText({
      prompt: `Given this research task: "${userPrompt}"
               What search query would be most effective?
               Return ONLY the search query string, nothing else.`,
      systemPrompt: 'You are a research assistant.'
    });
    
    // Step 2: Execute search via MCP
    const searchResults = await mcpClient.executeTool({
      name: 'web_search',
      arguments: { query: queryResult.text.trim(), num_results: 10 }
    });
    
    // Step 3: Synthesize results
    const synthesisResult = await provider.generateText({
      prompt: `Research Task: ${userPrompt}
               
               Search Results:
               ${searchResults}
               
               Synthesize the above information into a comprehensive response.`,
      systemPrompt
    });
    
    return synthesisResult.text;
  }
}
```

### 3.2 Update ImageService

```typescript
import { registry } from '../core/ProviderRegistry';
import { ImageGenParams } from '../core/types/LLMTypes';

export class ImageService {
  static async generateImage(
    prompt: string,
    visualStyle: string = '',
    aspectRatio: '3:4' | '1:1' | '16:9' = '3:4'
  ): Promise<string> {
    
    // Get provider that supports image generation
    const provider = registry.getProviderFor('image-generation');
    
    if (!provider) {
      throw new Error('No image generation provider available');
    }
    
    const fullPrompt = `Style: ${visualStyle || "Photorealistic, High Contrast"}. 
                        Subject: ${prompt}. No text in image.`;
    
    const result = await provider.generateImage!({
      prompt: fullPrompt,
      aspectRatio
    });
    
    return `data:${result.mimeType};base64,${result.imageBase64}`;
  }
}
```

### 3.3 Update PodcastService

```typescript
import { registry } from '../core/ProviderRegistry';
import { PodcastSettings, ValidatedPodcastScript } from '../../types';

export class PodcastService {
  
  static async generateScript(/* ... same params ... */): Promise<ValidatedPodcastScript> {
    const provider = registry.getActiveProvider();
    
    // Script generation works with any provider
    const result = await provider.generateText({
      prompt: `Topic: ${topic}...`,  // Same as before
      systemPrompt: PODCAST_PRODUCER_PROMPT,
      jsonSchema: PodcastScriptSchema,
      thinkingBudget: settings.lengthLevel === 3 ? 2048 : 0
    });
    
    return JSON.parse(result.text);
  }
  
  static async generateAudio(
    script: ValidatedPodcastScript,
    settings: PodcastSettings
  ): Promise<string> {
    
    // Audio requires multi-speaker TTS - only Gemini has this
    const provider = registry.getProviderFor('multi-speaker-tts');
    
    if (!provider) {
      throw new Error(
        'Multi-speaker audio requires Gemini. ' +
        'Please set GEMINI_API_KEY or use script-only mode.'
      );
    }
    
    const dialoguePrompt = script.lines
      .map(line => `${line.speaker}: ${line.text}`)
      .join('\n');
    
    const result = await provider.generateAudio!({
      text: dialoguePrompt,
      speakers: [
        { name: 'Host 1', voice: settings.host1Voice },
        { name: 'Host 2', voice: settings.host2Voice }
      ]
    });
    
    // Convert to WAV blob URL (same as before)
    return this.createAudioUrl(result.audioBase64);
  }
}
```

---

## Phase 4: UI Integration (1-2 hours)

### 4.1 Add Provider Selector Component

Create `components/ProviderSelector.tsx`:

```tsx
import React from 'react';
import { registry } from '../services/core/ProviderRegistry';
import { ProviderID } from '../services/core/types/LLMTypes';

interface Props {
  onChange?: (provider: ProviderID) => void;
}

export const ProviderSelector: React.FC<Props> = ({ onChange }) => {
  const available = registry.listAvailable();
  const active = registry.getActiveProvider();
  
  const handleChange = (id: ProviderID) => {
    registry.setActiveProvider(id);
    onChange?.(id);
  };
  
  const providerInfo: Record<ProviderID, { icon: string; label: string }> = {
    gemini: { icon: '✨', label: 'Gemini' },
    openai: { icon: '🤖', label: 'OpenAI' },
    anthropic: { icon: '🧠', label: 'Claude' }
  };
  
  return (
    <div className="provider-selector">
      <label>AI Engine:</label>
      <div className="provider-options">
        {available.map(id => (
          <button
            key={id}
            className={`provider-btn ${active.id === id ? 'active' : ''}`}
            onClick={() => handleChange(id)}
          >
            <span>{providerInfo[id].icon}</span>
            <span>{providerInfo[id].label}</span>
            {id === 'gemini' && <span className="badge">Full Features</span>}
          </button>
        ))}
      </div>
      {active.id !== 'gemini' && (
        <p className="provider-warning">
          ⚠️ Some features (Image Gen, Podcast Audio) may be limited
        </p>
      )}
    </div>
  );
};
```

---

## Phase 5: Testing & Validation (1-2 hours)

### 5.1 Create Test Script

```typescript
// scripts/test-providers.ts
import { registry } from '../services/core/ProviderRegistry';

async function testProviders() {
  const providers = registry.listAvailable();
  
  for (const id of providers) {
    console.log(`\n=== Testing ${id} ===`);
    const provider = registry.getProvider(id);
    
    // Test text generation
    try {
      const result = await provider.generateText({
        prompt: 'What is 2+2? Reply with just the number.',
        maxTokens: 10
      });
      console.log(`✅ Text: ${result.text}`);
    } catch (e: any) {
      console.log(`❌ Text failed: ${e.message}`);
    }
    
    // Test capabilities
    console.log(`Capabilities: ${provider.capabilities.join(', ')}`);
  }
}

testProviders();
```

---

## File Change Summary

| File | Action | Description |
|------|--------|-------------|
| `services/core/types/LLMTypes.ts` | CREATE | Provider-agnostic type definitions |
| `services/core/providers/LLMProvider.ts` | CREATE | Abstract provider interface |
| `services/core/providers/GeminiProvider.ts` | CREATE | Gemini implementation |
| `services/core/providers/OpenAIProvider.ts` | CREATE | OpenAI implementation |
| `services/core/providers/AnthropicProvider.ts` | CREATE | Claude implementation |
| `services/core/ProviderRegistry.ts` | CREATE | Provider management singleton |
| `services/core/MCPClient.ts` | CREATE | MCP tool client wrapper |
| `mcp-servers/search-server/index.ts` | CREATE | MCP search server |
| `services/agents/BaseAgent.ts` | MODIFY | Use registry + MCP |
| `services/media/ImageService.ts` | MODIFY | Use registry |
| `services/media/PodcastService.ts` | MODIFY | Use registry |
| `components/ProviderSelector.tsx` | CREATE | UI for provider selection |
| `vite.config.ts` | MODIFY | Add multiple API key support |
| `package.json` | MODIFY | Add openai, @anthropic-ai/sdk deps |

---

## Dependencies to Add

```bash
npm install openai @anthropic-ai/sdk @modelcontextprotocol/sdk
```

---

## Environment Variables (.env.local)

```bash
# Required (at least one)
GEMINI_API_KEY=your-gemini-key

# Optional - enables additional providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# For MCP Search (if not using Gemini's native search)
BRAVE_API_KEY=your-brave-search-key
```

---

## Execution Order

1. ✅ Create type definitions (`LLMTypes.ts`)
2. ✅ Create abstract provider (`LLMProvider.ts`)
3. ✅ Implement Gemini provider (preserve current functionality)
4. ✅ Create registry and test with Gemini only
5. ✅ Implement OpenAI provider
6. ✅ Implement Anthropic provider
7. ✅ Create MCP search server
8. ✅ Refactor BaseAgent to use registry + MCP
9. ✅ Refactor ImageService
10. ✅ Refactor PodcastService
11. ✅ Add UI selector
12. ✅ Full integration test
