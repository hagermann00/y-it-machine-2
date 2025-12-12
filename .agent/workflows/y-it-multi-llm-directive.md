---
description: Technical directive for Y-IT Machine 2 multi-LLM integration and marketing production pipeline
---

# Y-IT Machine 2: Multi-LLM Integration & Marketing Production

## Tech Directive for Implementation Team

**Document Version:** 1.0  
**Date:** December 11, 2024  
**Priority:** High  
**Estimated Effort:** 40-60 hours

---

## Executive Summary

Y-IT Machine 2 currently runs on a single LLM provider (Google Gemini). This directive outlines the upgrade to a **full multi-LLM system** with:

1. **Per-feature engine selection** — User chooses which AI handles each task
2. **Real-time pricing quotes** — Cost estimation before generation
3. **Marketing production pipeline** — Full product family output
4. **Multi-format export** — eBook (EPUB, MOBI, PDF), interactive pages, podcast coordination

**Critical Context:** Research functionality is being extracted to a separate module called **Kno-It**. Y-IT will consume research either from Kno-It (advanced) or its own simple single-engine research (basic). This directive focuses on POST-research functionality.

---

## Part 1: Multi-LLM Provider Architecture

### 1.1 Model Registry

Create a comprehensive registry of all available models with metadata.

**File:** `src/core/ModelRegistry.ts`

```typescript
interface ModelDefinition {
  id: string;                      // "claude-sonnet-4.5"
  provider: 'gemini' | 'openai' | 'anthropic';
  displayName: string;             // "Claude Sonnet 4.5"
  version: string;                 // "2024-09"
  
  // Pricing (per million tokens)
  pricing: {
    input: number;                 // $3.00
    output: number;                // $15.00
    cached?: number;               // For providers that support caching
    thinking?: number;             // For reasoning models
    lastUpdated: string;           // ISO date
  };
  
  // Capabilities
  capabilities: ModelCapability[];
  contextWindow: number;           // 200000
  maxOutput: number;               // 8192
  
  // Performance hints
  speed: 'fast' | 'medium' | 'slow';
  qualityTier: 1 | 2 | 3 | 4 | 5;  // 5 = best
  
  // Status
  deprecated?: boolean;
  experimental?: boolean;
  releaseDate?: string;
}

type ModelCapability = 
  | 'text-generation'
  | 'json-mode'
  | 'image-generation'
  | 'image-editing'
  | 'audio-tts'
  | 'multi-speaker-tts'
  | 'web-search'
  | 'extended-thinking'
  | 'tool-calling'
  | 'vision';
```

### 1.2 Current Model Pricing (December 2024/2025)

Populate the registry with these verified prices:

#### Anthropic Claude

| Model ID | Display Name | Input $/M | Output $/M | Capabilities |
|----------|--------------|-----------|------------|--------------|
| `claude-3.5-haiku` | Claude 3.5 Haiku | $0.80 | $4.00 | text, json, tools |
| `claude-3.7-sonnet` | Claude 3.7 Sonnet | $3.00 | $15.00 | text, json, tools, thinking |
| `claude-sonnet-4` | Claude Sonnet 4 | $3.00 | $15.00 | text, json, tools, vision |
| `claude-sonnet-4.5` | Claude Sonnet 4.5 | $3.00 | $15.00 | text, json, tools, vision, thinking |
| `claude-opus-4.5` | Claude Opus 4.5 | $5.00 | $25.00 | text, json, tools, vision, thinking |

#### OpenAI

| Model ID | Display Name | Input $/M | Output $/M | Capabilities |
|----------|--------------|-----------|------------|--------------|
| `gpt-4o` | GPT-4o | $2.50 | $10.00 | text, json, tools, vision, image-gen |
| `gpt-4o-mini` | GPT-4o Mini | $0.15 | $0.60 | text, json, tools |
| `gpt-5` | GPT-5 | $1.25 | $10.00 | text, json, tools, vision |
| `gpt-5-mini` | GPT-5 Mini | $0.25 | $2.00 | text, json, tools |
| `gpt-5-nano` | GPT-5 Nano | $0.05 | $0.40 | text, json |
| `o3` | OpenAI o3 | $2.00 | $8.00 | text, json, tools, thinking |
| `o3-mini` | OpenAI o3 Mini | $1.10 | $4.40 | text, json, thinking |
| `o4-mini` | OpenAI o4 Mini | $1.10 | $4.40 | text, json, tools, thinking |

#### Google Gemini

| Model ID | Display Name | Input $/M | Output $/M | Capabilities |
|----------|--------------|-----------|------------|--------------|
| `gemini-2.5-flash` | Gemini 2.5 Flash | $0.10 | $0.40 | text, json, tools, vision, search |
| `gemini-2.5-flash-thinking` | Gemini 2.5 Flash (Thinking) | $0.30 | $2.50 | text, json, tools, thinking, search |
| `gemini-2.5-flash-lite` | Gemini 2.5 Flash Lite | $0.10 | $0.40 | text, json |
| `gemini-2.5-pro` | Gemini 2.5 Pro (≤200K) | $1.25 | $10.00 | text, json, tools, vision, thinking, search |
| `gemini-2.5-pro-long` | Gemini 2.5 Pro (>200K) | $2.50 | $15.00 | text, json, tools, vision, thinking, search |
| `gemini-2.5-flash-image` | Gemini Flash Image | $0.039/img | — | image-gen |
| `gemini-2.5-flash-tts` | Gemini TTS | special | special | audio-tts, multi-speaker-tts |

### 1.3 Provider Implementations

Create provider classes that implement a common interface.

**File:** `src/core/providers/LLMProvider.ts`

```typescript
export abstract class LLMProvider {
  abstract readonly providerId: 'gemini' | 'openai' | 'anthropic';
  
  abstract generateText(params: TextGenParams): Promise<TextGenResult>;
  abstract generateImage?(params: ImageGenParams): Promise<ImageGenResult>;
  abstract generateAudio?(params: AudioGenParams): Promise<AudioGenResult>;
  
  supports(capability: ModelCapability): boolean {
    // Check if any model from this provider has the capability
  }
  
  getModel(modelId: string): ModelDefinition | undefined {
    // Lookup from registry
  }
  
  estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const model = this.getModel(modelId);
    if (!model) return 0;
    return (inputTokens / 1_000_000) * model.pricing.input +
           (outputTokens / 1_000_000) * model.pricing.output;
  }
}
```

**Implementations needed:**
- `src/core/providers/GeminiProvider.ts` — Port existing LLMClient logic
- `src/core/providers/OpenAIProvider.ts` — New, use `openai` npm package
- `src/core/providers/AnthropicProvider.ts` — New, use `@anthropic-ai/sdk` package

### 1.4 Provider Registry (Singleton)

**File:** `src/core/ProviderRegistry.ts`

```typescript
class ProviderRegistry {
  private providers: Map<string, LLMProvider> = new Map();
  
  // Initialize providers based on available API keys
  initialize(): void {
    if (process.env.GEMINI_API_KEY) {
      this.providers.set('gemini', new GeminiProvider());
    }
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIProvider());
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', new AnthropicProvider());
    }
  }
  
  getProvider(id: string): LLMProvider | undefined;
  getProviderForModel(modelId: string): LLMProvider | undefined;
  listAvailableProviders(): string[];
  listAvailableModels(): ModelDefinition[];
}
```

---

## Part 2: Per-Feature Engine Selection

### 2.1 Generation Configuration Schema

Users should be able to set a different model for each pipeline stage.

**File:** `src/types/GenerationConfig.ts`

```typescript
interface EngineSelection {
  modelId: string;           // "claude-sonnet-4.5"
  fallbackModelId?: string;  // "gpt-4o" if primary fails
}

interface GenerationConfig {
  // Research (may come from Kno-It or internal)
  research?: {
    source: 'kno-it' | 'internal';
    engine?: EngineSelection;  // Only if internal
  };
  
  // Content Generation
  writing: {
    chapterGeneration: EngineSelection;
    chapterRefinement?: EngineSelection;  // Optional second pass
  };
  
  // Visual Assets
  images: {
    coverArt: EngineSelection;
    chapterImages: EngineSelection;
    style?: string;  // "photorealistic", "illustrated", etc.
  };
  
  // Audio/Podcast
  podcast: {
    scriptGeneration: EngineSelection;
    audioGeneration: EngineSelection;  // Note: Multi-speaker TTS requires Gemini
  };
  
  // Marketing Outputs (NEW)
  marketing: {
    enabled: boolean;
    copywriting: EngineSelection;       // Ad copy, descriptions
    socialMedia: EngineSelection;       // Social posts, threads
    emailSequence?: EngineSelection;    // Email marketing
  };
}
```

### 2.2 Configuration UI Component

**File:** `src/components/EngineConfigurator.tsx`

Create a UI that allows:
1. Selecting a provider from available providers
2. Selecting a model from that provider's models
3. Showing real-time price estimate based on typical token usage
4. Warning if a required capability is missing

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚙️  ENGINE CONFIGURATION                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  CHAPTER WRITING                                                  │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ Provider: [Anthropic ▼]                                   │   │
│  │ Model:    [claude-sonnet-4.5 ▼]                           │   │
│  │                                                           │   │
│  │ 💰 Est. per chapter: ~$0.45 (15K in / 3K out)            │   │
│  │ ⚡ Speed: Fast | 🎯 Quality: ★★★★★                        │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  COVER ART                                                        │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ Provider: [OpenAI ▼]                                      │   │
│  │ Model:    [dall-e-3 ▼]                                    │   │
│  │                                                           │   │
│  │ 💰 Est. per image: ~$0.04 (HD)                           │   │
│  │ 🎨 Style: Artistic, creative                             │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  PODCAST AUDIO                                                    │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ Provider: [Google ▼]                                      │   │
│  │ Model:    [gemini-2.5-flash-tts ▼]                        │   │
│  │                                                           │   │
│  │ ⚠️ Multi-speaker TTS only available on Gemini            │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ─────────────────────────────────────────────────────────────   │
│  📊 TOTAL ESTIMATED COST: $4.50 - $7.00                          │
│  (Based on 8 chapters + cover + 1 podcast episode)               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 2.3 Presets System

Allow users to choose from preconfigured setups.

```typescript
interface Preset {
  id: string;
  name: string;
  description: string;
  config: GenerationConfig;
  estimatedCostRange: { min: number; max: number };
}

const PRESETS: Preset[] = [
  {
    id: 'budget',
    name: '💰 Budget',
    description: 'Lowest cost, good quality',
    config: {
      writing: { chapterGeneration: { modelId: 'gpt-4o-mini' } },
      images: { coverArt: { modelId: 'gemini-2.5-flash-image' }, ... },
      ...
    },
    estimatedCostRange: { min: 0.50, max: 1.50 }
  },
  {
    id: 'balanced',
    name: '⚖️ Balanced',
    description: 'Best value for quality',
    config: { ... },
    estimatedCostRange: { min: 3.00, max: 6.00 }
  },
  {
    id: 'premium',
    name: '👑 Premium',
    description: 'Maximum quality, all features',
    config: { ... },
    estimatedCostRange: { min: 10.00, max: 20.00 }
  },
  {
    id: 'custom',
    name: '🔧 Custom',
    description: 'Configure each engine manually',
    config: null  // User configures
  }
];
```

---

## Part 3: Marketing Production Pipeline

### 3.1 Product Family Outputs

Y-IT should generate a complete marketing package, not just a book.

**Outputs to generate:**

| Output | Format | Description |
|--------|--------|-------------|
| **Print Book** | PDF (KDP-ready) | Existing feature, maintain |
| **eBook** | EPUB, MOBI, PDF | Multi-format digital |
| **Interactive Page** | HTML/React | Dynamic web page for promotion |
| **Podcap** | Audio + transcript | Podcast-style audio content |
| **Marketing Copy** | Text | Ad copy, descriptions, taglines |
| **Social Media Kit** | Text + images | Ready-to-post content |
| **Email Sequence** | Text | Drip campaign emails |

### 3.2 eBook Multi-Format Export

**File:** `src/services/export/EbookExporter.ts`

```typescript
interface EbookConfig {
  format: 'epub' | 'mobi' | 'pdf' | 'all';
  includeTableOfContents: boolean;
  includeCoverImage: boolean;
  metadata: {
    title: string;
    author: string;
    publisher?: string;
    isbn?: string;
    language: string;
    description: string;
    keywords: string[];
  };
}

class EbookExporter {
  async exportEpub(book: Book, config: EbookConfig): Promise<Blob>;
  async exportMobi(book: Book, config: EbookConfig): Promise<Blob>;
  async exportPdf(book: Book, config: EbookConfig): Promise<Blob>;
  async exportAll(book: Book, config: EbookConfig): Promise<{
    epub: Blob;
    mobi: Blob;
    pdf: Blob;
  }>;
}
```

**Dependencies:**
- `epub-gen` or `nodepub` for EPUB
- `kindlegen` CLI or API for MOBI conversion
- Existing PDF logic for PDF

### 3.3 Interactive Page Generator

**File:** `src/services/marketing/InteractivePageGenerator.ts`

Generate a single-page promotional site for the book.

```typescript
interface InteractivePage {
  html: string;
  css: string;
  js: string;
  assets: { name: string; data: Blob }[];
}

interface PageConfig {
  style: 'modern' | 'classic' | 'bold' | 'minimal';
  sections: PageSection[];
  integrations?: {
    podcastPlayer?: boolean;      // Embed podcast
    sampleChapter?: boolean;      // Read preview
    purchaseLinks?: string[];     // Amazon, Gumroad, etc.
    emailCapture?: boolean;       // Newsletter signup
  };
}

type PageSection = 
  | { type: 'hero'; headline: string; subheadline: string; coverImage: string }
  | { type: 'about'; content: string }
  | { type: 'chapters'; items: { title: string; preview: string }[] }
  | { type: 'author'; bio: string; image?: string }
  | { type: 'testimonials'; items: { quote: string; author: string }[] }
  | { type: 'cta'; text: string; buttonText: string; buttonUrl: string };
```

**LLM-generated content:**
- Headline and subheadline (from book content)
- Section copy
- Call-to-action text

### 3.4 Marketing Copy Generator

**File:** `src/services/marketing/CopyGenerator.ts`

```typescript
interface MarketingCopy {
  tagline: string;                    // One-liner hook
  shortDescription: string;           // 50-100 words
  longDescription: string;            // 200-300 words
  amazonDescription: string;          // Formatted for KDP
  socialPosts: {
    twitter: string[];                // Multiple tweet options
    linkedin: string;
    facebook: string;
    instagram: string;
  };
  emailSequence: {
    welcome: string;
    valueAdd1: string;
    valueAdd2: string;
    softPitch: string;
    hardPitch: string;
  };
  adCopy: {
    facebookAd: { headline: string; body: string; cta: string };
    googleAd: { headlines: string[]; descriptions: string[] };
  };
}

class CopyGenerator {
  constructor(private engine: EngineSelection) {}
  
  async generate(book: Book, research: ResearchData): Promise<MarketingCopy>;
}
```

---

## Part 4: Podcast Integration (Podcap)

### 4.1 Enhanced Podcast Service

Extend existing PodcastService with better integration.

```typescript
interface PodcapOutput {
  script: PodcastScriptLine[];
  audioUrl: string;                    // Blob URL
  audioFile: Blob;                     // For download
  transcript: string;                  // Text transcript
  chapters: {                          // Podcast chapters for players
    title: string;
    startTime: number;
    endTime: number;
  }[];
  metadata: {
    title: string;
    description: string;
    duration: number;
    format: 'wav' | 'mp3';
  };
}
```

### 4.2 Future-Proofing for Coordination

Design the podcast system to coordinate with the interactive page:

```typescript
interface PodcapIntegration {
  // Embed player in interactive page
  getEmbedCode(): string;
  
  // Sync highlights with transcript
  getTimestampedHighlights(): {
    text: string;
    startTime: number;
    endTime: number;
    bookReference?: { chapter: number; paragraph: number };
  }[];
  
  // Generate audiogram clips for social
  generateAudiograms(count: number): Promise<{
    video: Blob;
    thumbnail: Blob;
    quote: string;
  }[]>;
}
```

---

## Part 5: Environment & Dependencies

### 5.1 Environment Variables

Update `.env.local`:

```bash
# Primary Provider (existing)
GEMINI_API_KEY=xxx

# Additional Providers (new)
OPENAI_API_KEY=xxx
ANTHROPIC_API_KEY=xxx

# Optional: Specific model overrides
DEFAULT_WRITING_MODEL=claude-sonnet-4.5
DEFAULT_IMAGE_MODEL=dall-e-3
DEFAULT_TTS_MODEL=gemini-2.5-flash-tts
```

### 5.2 New Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    "openai": "^4.x",
    "@anthropic-ai/sdk": "^0.x",
    "epub-gen": "^0.x",
    "nodepub": "^4.x"
  }
}
```

### 5.3 Vite Config Updates

**File:** `vite.config.ts`

```typescript
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
  'process.env.ANTHROPIC_API_KEY': JSON.stringify(env.ANTHROPIC_API_KEY),
}
```

---

## Part 6: Implementation Order

### Phase 1: Provider Infrastructure (Priority: HIGH)
1. Create `ModelRegistry.ts` with all models
2. Create abstract `LLMProvider.ts`
3. Port existing Gemini code to `GeminiProvider.ts`
4. Implement `OpenAIProvider.ts`
5. Implement `AnthropicProvider.ts`
6. Create `ProviderRegistry.ts` singleton
7. **Test:** Verify all three providers can generate text

### Phase 2: Per-Feature Selection (Priority: HIGH)
1. Create `GenerationConfig` type
2. Refactor `AuthorAgent` to accept engine config
3. Refactor `ImageService` to accept engine config
4. Refactor `PodcastService` to accept engine config
5. Create `EngineConfigurator` UI component
6. Add presets system
7. **Test:** Generate a book with different engines per feature

### Phase 3: Cost Estimation (Priority: MEDIUM)
1. Add `estimateCost()` to providers
2. Create `CostEstimator` service
3. Add cost display to UI
4. Add cost breakdown to generation results
5. **Test:** Verify cost estimates match actual usage

### Phase 4: Marketing Production (Priority: MEDIUM)
1. Implement `EbookExporter` (EPUB first, then MOBI)
2. Implement `CopyGenerator`
3. Implement `InteractivePageGenerator`
4. Add marketing tab to UI
5. **Test:** Generate full marketing package

### Phase 5: Podcap Enhancement (Priority: LOW)
1. Enhance `PodcastService` with transcript, chapters
2. Add embed code generation
3. Add audiogram generation (stretch)
4. Integrate with interactive page
5. **Test:** Full podcast workflow with page integration

---

## Part 7: Integration with Kno-It (Future)

When Kno-It is ready, Y-IT will consume it as a module:

```typescript
// Option A: Import Kno-It directly
import { ResearchEngine } from 'kno-it';

const research = await new ResearchEngine({
  depth: 'verified',
  primaryModel: 'gemini-2.5-flash',
}).investigate(topic);

// Option B: Keep using internal research
const research = await internalResearchService.research(topic);
```

**For now:** Keep internal research working. Design the interface so swapping to Kno-It is a one-line change.

---

## Acceptance Criteria

- [ ] User can select different LLM providers for each generation step
- [ ] User sees real-time cost estimates before generation
- [ ] User can choose from presets OR custom configuration
- [ ] System gracefully handles provider failures with fallbacks
- [ ] eBook exports to EPUB, MOBI, and PDF
- [ ] Marketing copy is generated automatically
- [ ] Interactive page is generated and exportable
- [ ] Podcast integrates with interactive page
- [ ] All features work with any available provider combination

---

## Questions for Product Owner

1. Should cost limits be enforceable (stop if exceeds $X)?
2. Should we track usage/spending across sessions?
3. Priority order for marketing outputs?
4. Specific interactive page templates needed?
5. Email capture integration (Mailchimp, ConvertKit, etc.)?

---

*End of Technical Directive*
