<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Y-IT Machine 2: Nano-Book Generator
### Multi-LLM AI Book Creation Engine with Advanced Content Pipeline

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/hagermann00/y-it-machine-2)
[![Security](https://img.shields.io/badge/vulnerabilities-0-brightgreen)](https://github.com/hagermann00/y-it-machine-2)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-Internal-red)](LICENSE)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Multi-LLM Providers](#-multi-llm-providers)
- [Configuration](#-configuration)
- [Content Pipeline](#-content-pipeline)
- [Performance](#-performance)
- [Security](#-security)
- [Development](#-development)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Contributing](#-contributing)

---

## 🎯 Overview

**Y-IT Machine 2** is a sophisticated AI-powered content generation engine that transforms research data into professional-grade nano-books with integrated multimedia elements. Built with a modern React architecture and multi-provider LLM abstraction, it supports Google Gemini, Anthropic Claude, and OpenAI GPT models.

### What It Does

- **Book Generation**: Creates 8-chapter satirical nano-books with PosiBot character interruptions
- **Multi-Branch Drafts**: Generate alternative book versions from the same research data
- **Podcast Scripts**: Two-host dialogue format with skeptic vs. learner perspectives
- **Image Generation**: AI-generated visuals for each chapter (Gemini Imagen 3, DALL-E 3)
- **PDF Export**: KDP-compliant PDF output with configurable trim sizes (5x8, 6x9, 7x10)
- **Cost Estimation**: Real-time token and image cost breakdown across providers

### Key Differentiators

✨ **Multi-Provider Architecture**: Switch between Google, Anthropic, and OpenAI seamlessly
⚡ **Code-Split & Lazy-Loaded**: 40% smaller initial bundle with dynamic provider loading
🔒 **Zero Security Vulnerabilities**: All dependencies audited and up-to-date
📊 **Advanced State Management**: React Context + Reducer with multi-branch support
🎨 **Component-Based Refactoring**: Modular, testable, and maintainable codebase
🚀 **Demo Mode**: Zero-cost testing with mock data and sample topics

---

## ✨ Features

### 🤖 AI Content Generation

- **Multi-LLM Support**: Google Gemini 2.0 Flash, Claude 3.5 Sonnet/Haiku, GPT-4o/Mini
- **Flexible Model Selection**: Choose different models for research, writing, images, and podcasts
- **Satirical Tone Engine**: "PosiBot" character adds critical commentary to overly optimistic content
- **8-Chapter Structure**: "The Lie" → "If You're Still Here" (customizable)
- **Markdown Rendering**: Rich text with embedded visuals

### 📚 Book Pipeline

- **Pagination System**: Word-count based (~300 words/page), preserves paragraph boundaries
- **Visual Elements**: Per-chapter image descriptions and AI-generated visuals
- **Front/Back Covers**: Automated cover generation with title/subtitle
- **Addendum Support**: Optional appendix chapters
- **Chapter Reordering**: Drag-and-drop chapter management

### 🎙️ Podcast Studio

- **Script Generation**: Two-host conversational format from research data
- **Voice Selection**: 5 voice options (Puck, Charon, Kore, Fenrir, Zephyr)
- **Audio Synthesis**: (In Development - currently returns mock URLs)

### 🖼️ Image Generation

- **Multi-Provider**: Gemini Imagen 3, DALL-E 3, OpenAI DALL-E 2
- **Image Caching**: IndexedDB storage with FIFO eviction (100 image limit)
- **Fallback Handling**: Gray placeholders on generation failure
- **Batch Generation**: Parallel image requests for performance

### 📄 PDF Export

- **KDP Compliance**: Industry-standard trim sizes with bleed margins
- **Font Embedding**: Professional typography with fallback handling
- **Image Integration**: High-resolution image placement with error recovery
- **Custom Margins**: Configurable page margins and spacing

### 🎛️ Advanced Settings

- **Global Configuration**: Tone, visual profile, color schemes, humor balance
- **Chapter Architecture**: Configurable chapter structure with pagination
- **Template Management**: Save, load, and share configuration presets
- **Research Data Upload**: Import JSON or Markdown research files
- **Text-Only Preview Mode**: Skip images for faster iteration

### 💰 Cost Management

- **Real-Time Estimation**: Token count + image cost breakdown before generation
- **Multi-Provider Pricing**: Accurate costs for Google, Anthropic, OpenAI
- **Free Tier Tracking**: API call counter for users on free plans
- **Cache Optimization**: Reuse cached research to minimize API costs

---

## 🏗️ Architecture

### Multi-Provider Abstraction Layer

```
┌─────────────────────────────────────────────────────────┐
│ UI Layer (React 19 + TypeScript)                        │
│ - TopicInput, ResearchForm, BookReader, PodcastStudio   │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ State Management (React Context + Reducer)              │
│ - ProjectContext: Multi-branch state management         │
│ - LocalStorage cache with FIFO eviction                 │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ Service Layer                                            │
│ - AuthorAgent (book generation)                         │
│ - PodcastService (script generation)                    │
│ - ImageService (image orchestration)                    │
│ - Orchestrator (research coordination - deprecated)     │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ Provider Abstraction (Lazy-Loaded)                      │
│ - ProviderRegistry (Singleton factory)                  │
│ - LLMProvider (Abstract base class)                     │
│   └─ GeminiProvider, AnthropicProvider, OpenAIProvider │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ External APIs                                            │
│ - Google Gemini API (AI Studio / Vertex AI)            │
│ - Anthropic Claude API                                  │
│ - OpenAI GPT-4o / DALL-E 3 API                          │
└─────────────────────────────────────────────────────────┘
```

### Design Patterns

- **Abstract Factory**: `LLMProvider` base class with concrete implementations
- **Singleton**: `ProviderRegistry` for centralized provider management
- **Strategy**: Interchangeable model selection per generation task
- **Observer**: React Context + Reducer for state propagation
- **Lazy Loading**: Dynamic imports for providers and heavy libraries
- **Memoization**: useMemo for expensive computations (pagination, context values)

---

## 🛠️ Technology Stack

### Frontend Framework
- **React** 19.2.1 (latest with concurrent features)
- **TypeScript** 5.8.2 (strict typing for reliability)
- **Vite** 6.2.0 (fast build tool with HMR)
- **Tailwind CSS** (utility-first styling via CDN)

### AI / LLM Integrations
- **@google/genai** 1.33.0 (Google Gemini SDK)
- **@anthropic-ai/sdk** 0.71.2 (Anthropic Claude SDK)
- **openai** 6.10.0 (OpenAI GPT/DALL-E SDK)

### State & Validation
- **React Context API** (global state management)
- **Zod** 3.22.4 (runtime schema validation)

### UI & Visualization
- **Lucide React** 0.559.0 (icon library)
- **React Markdown** 10.1.0 (markdown rendering)
- **Recharts** 3.5.1 (data visualization for research dashboard)

### PDF Generation
- **jsPDF** 3.0.4 (client-side PDF creation - **security patched**)

### Development Tools
- **@vitejs/plugin-react** 5.0.0 (Vite React integration)
- **@types/node** 22.14.0 (Node.js type definitions)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn**
- **API Keys** (at least one):
  - Google AI Studio: https://aistudio.google.com/app/apikey (free tier available)
  - Anthropic: https://console.anthropic.com/ (paid)
  - OpenAI: https://platform.openai.com/ (paid)

### Installation

```bash
# Clone the repository
git clone https://github.com/hagermann00/y-it-machine-2.git
cd y-it-machine-2

# Install dependencies
npm install --legacy-peer-deps

# Create environment file
cp .env.example .env.local

# Add your API keys to .env.local
# VITE_GEMINI_API_KEY=your_google_api_key
# VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
# VITE_OPENAI_API_KEY=your_openai_api_key
```

### Running Locally

```bash
# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Demo Mode (No API Keys Required)

The app includes a **Demo Mode** with mock data for testing without API costs:

1. Launch the app (`npm run dev`)
2. Toggle **"Demo Mode"** in the UI
3. Select a sample topic (Dropshipping, Crypto Trading, etc.)
4. Generate instant results with placeholder data

---

## 📁 Project Structure

```
y-it-machine-2/
├── src/
│   ├── components/              # React UI components
│   │   ├── AdvancedSettings.tsx      # Global config controls (237 LOC)
│   │   ├── AgentStatus.tsx           # Agent status display
│   │   ├── BookReader.tsx            # Paginated book viewer
│   │   ├── CostEstimator.tsx         # Token/image cost calculator
│   │   ├── ErrorBoundary.tsx         # React error boundary
│   │   ├── InputSection.tsx          # Wrapper for ResearchForm
│   │   ├── Loader.tsx                # Loading spinner
│   │   ├── ModelSelector.tsx         # Reusable model dropdown (42 LOC)
│   │   ├── PodcastStudio.tsx         # Podcast script viewer
│   │   ├── ResearchDashboard.tsx     # Data visualization
│   │   ├── ResearchDashboardLazy.tsx # Lazy-loaded dashboard
│   │   ├── ResearchForm.tsx          # Main orchestrator (850 LOC)
│   │   └── TopicInput.tsx            # Topic input + cache (70 LOC)
│   │
│   ├── context/                 # React Context providers
│   │   └── ProjectContext.tsx        # Global state + reducer
│   │
│   ├── services/                # Business logic services
│   │   ├── agents/
│   │   │   └── AuthorAgent.ts        # Book generation logic
│   │   ├── core/
│   │   │   ├── providers/
│   │   │   │   ├── AnthropicProvider.ts  # Claude integration
│   │   │   │   ├── GeminiProvider.ts     # Google Gemini integration
│   │   │   │   ├── LLMProvider.ts        # Abstract base class
│   │   │   │   └── OpenAIProvider.ts     # OpenAI GPT/DALL-E integration
│   │   │   ├── LLMClient.ts          # Legacy client (deprecated)
│   │   │   ├── ModelRegistry.ts      # Model definitions + pricing
│   │   │   ├── ProviderRegistry.ts   # Provider factory (lazy loading)
│   │   │   └── SchemaValidator.ts    # Zod schemas
│   │   ├── demo/
│   │   │   └── DemoModeService.ts    # Mock data generator
│   │   ├── media/
│   │   │   ├── ImageService.ts       # Image generation orchestration
│   │   │   └── PodcastService.ts     # Podcast script generation
│   │   └── orchestrator.ts           # Research coordinator (stubbed)
│   │
│   ├── utils/                   # Helper functions
│   │   ├── jsonParser.ts             # 5-strategy LLM JSON parser
│   │   ├── manuscriptParser.ts       # Manuscript text parsing
│   │   ├── pdfExport.ts              # PDF generation logic
│   │   └── pdfExportLazy.ts          # Lazy-loaded PDF export
│   │
│   ├── constants.ts             # App constants + defaults
│   ├── types.ts                 # TypeScript type definitions
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # App entry point
│
├── public/                      # Static assets
├── .claude/                     # Claude Code settings
├── .env.example                 # Environment variable template
├── index.html                   # HTML entry point
├── package.json                 # Dependencies + scripts
├── package-lock.json            # Dependency lockfile
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite build configuration
├── TODO.md                      # Prioritized task list
├── COMPREHENSIVE_AUDIT_REPORT.md    # Full codebase audit
├── BUNDLE_SIZE_REPORT.md            # Bundle optimization analysis
├── REFACTORING_SUMMARY.md           # Component refactoring details
└── README.md                    # This file
```

---

## 🔌 Multi-LLM Providers

### Supported Models

| Provider | Model ID | Type | Context | Use Case |
|----------|----------|------|---------|----------|
| **Google** | `gemini-2.0-flash-exp` | Text | 1M tokens | Fast research/writing (default) |
| **Google** | `gemini-1.5-pro` | Text | 2M tokens | Complex reasoning |
| **Google** | `gemini-1.5-flash` | Text | 1M tokens | Balanced speed/quality |
| **Google** | `imagen-3.0-generate-001` | Image | N/A | High-quality images |
| **Anthropic** | `claude-3-5-sonnet-20241022` | Text | 200K tokens | Best writing quality |
| **Anthropic** | `claude-3-5-haiku-20241022` | Text | 200K tokens | Fast, cost-effective |
| **Anthropic** | `claude-3-opus-20240229` | Text | 200K tokens | Maximum capability |
| **OpenAI** | `gpt-4o` | Text | 128K tokens | General-purpose |
| **OpenAI** | `gpt-4o-mini` | Text | 128K tokens | Cost-optimized |
| **OpenAI** | `dall-e-3` | Image | N/A | Creative visuals |

### Provider Configuration

```typescript
// src/services/core/ProviderRegistry.ts

// Lazy-loaded on demand
const provider = await ProviderRegistry.getInstance().getProvider('google');

// Generate text
const response = await provider.generateText(
  'gemini-2.0-flash-exp',
  'Write a chapter about...',
  { temperature: 0.9, jsonMode: true }
);

// Generate image
const imageUrl = await provider.generateImage(
  'imagen-3.0-generate-001',
  'A futuristic city at sunset',
  1024, 1024
);
```

### Adding New Providers

1. Create provider class extending `LLMProvider`:
   ```typescript
   // src/services/core/providers/MyProvider.ts
   export class MyProvider extends LLMProvider {
     readonly id = 'my-provider';

     async generateText(modelId, prompt, config) { /* ... */ }
     async generateImage(modelId, prompt, width, height) { /* ... */ }
   }
   ```

2. Register in `ProviderRegistry.ts`:
   ```typescript
   case 'my-provider': {
     const { MyProvider } = await import('./providers/MyProvider');
     provider = new MyProvider({ apiKey: env.VITE_MY_PROVIDER_KEY });
     break;
   }
   ```

3. Add models to `ModelRegistry.ts`:
   ```typescript
   {
     id: 'my-model-id',
     name: 'My Model',
     provider: 'my-provider',
     capabilities: ['text'],
     pricing: { input: 0.001, output: 0.002 }
   }
   ```

---

## ⚙️ Configuration

### Environment Variables

Create `.env.local` in the project root:

```bash
# Google Gemini (AI Studio or Vertex AI)
VITE_GEMINI_API_KEY=your_google_gemini_key

# Anthropic Claude
VITE_ANTHROPIC_API_KEY=your_anthropic_key

# OpenAI GPT / DALL-E
VITE_OPENAI_API_KEY=your_openai_key
```

### Advanced Settings (UI)

Access via **"Advanced Settings"** panel in the app:

- **Broad Directive**: Creative direction for the entire book
- **Visual Profile**: Art style (e.g., "cyberpunk", "minimalist")
- **Color Scheme**: Primary palette (e.g., "neon blues and purples")
- **Tone Profile**: Writing style (satirical, academic, casual, etc.)
- **Tone Intensity**: 0-100 slider for tone strength
- **Standard Rules**: PosiBot frequency, technical vs. artistic image balance
- **KDP Specifications**: Trim size, margins, bleed settings
- **Global Scales**: Technical level (1-3), humor balance (0-100)

### Chapter Architecture

Configure chapter structure per book:

- **Chapters**: Add/remove chapters with custom titles
- **Subsections**: Configurable element counts (intros, conclusions, scenarios, etc.)
- **Addendums**: Optional appendix chapters
- **Pagination**: Auto-split by word count (~300 words/page)

### Presets

Save/load configuration templates:

```typescript
// Save current settings
const preset = compileManifest(globalConfig, chapters);
localStorage.setItem('my-preset', JSON.stringify(preset));

// Load preset
const loadedPreset = JSON.parse(localStorage.getItem('my-preset'));
applyPreset(loadedPreset);
```

---

## 🔄 Content Pipeline

### 1. Research Phase (Deprecated - Moving to Obsidian)

**Current State**: Research orchestrator stubbed for external data import.

**Future**: Import research from Obsidian database (JSON/Markdown format).

```typescript
// Upload research data via UI
{
  "summary": "Overview of the side hustle...",
  "ethicalRating": 3,
  "profitPotential": "Low to moderate",
  "marketStats": [...],
  "hiddenCosts": [...],
  "caseStudies": [...],
  "affiliates": [...]
}
```

### 2. Book Generation

**Flow**:
1. User selects **writing model** (e.g., Claude 3.5 Sonnet)
2. `AuthorAgent` constructs prompt with research data + global settings
3. LLM generates 8-chapter book in JSON format
4. Robust JSON parser (5 strategies) extracts book structure
5. Zod schema validates output
6. Book stored in multi-branch state

**Code**:
```typescript
// src/services/agents/AuthorAgent.ts
const provider = await ProviderRegistry.getInstance().getProvider(providerId);
const response = await provider.generateText(
  settings.writingModel || 'gemini-2.0-flash-exp',
  constructBookPrompt(research, settings),
  { jsonMode: true }
);
const book = parseJsonFromLLM<Book>(response);
```

### 3. Image Generation

**Flow**:
1. Extract visual descriptions from book chapters
2. User selects **image model** (e.g., DALL-E 3)
3. Batch generate images in parallel (Promise.all)
4. Cache images in IndexedDB (100 image limit, FIFO eviction)
5. Inject image URLs into book structure

**Code**:
```typescript
// src/services/media/ImageService.ts
const images = await Promise.all(
  visuals.map(v => provider.generateImage(modelId, v.description, 1024, 1024))
);
await cacheImages(images);
```

### 4. Podcast Generation

**Flow**:
1. User selects **podcast model** (e.g., GPT-4o)
2. `PodcastService` generates two-host dialogue script
3. (Future) Text-to-speech synthesis for audio playback

**Code**:
```typescript
// src/services/media/PodcastService.ts
const script = await provider.generateText(
  settings.podcastModel,
  constructPodcastPrompt(research),
  { jsonMode: true }
);
```

### 5. PDF Export

**Flow**:
1. User clicks **"Export PDF"**
2. Lazy-load jsPDF library (code-split)
3. Generate PDF with KDP-compliant settings (trim size, margins, bleed)
4. Embed images with fallback handling
5. Download PDF file

**Code**:
```typescript
// src/utils/pdfExport.ts
const pdf = new jsPDF({ orientation, unit, format });
pdf.setFont('Helvetica', 'normal');
pdf.text(content, x, y);
pdf.addImage(imageUrl, 'PNG', x, y, width, height);
pdf.save('nano-book.pdf');
```

---

## ⚡ Performance

### Bundle Optimization

**Before Optimization**:
- Main bundle: **1,309 kB** (369 kB gzipped)
- All providers loaded eagerly
- jsPDF + Recharts in main chunk

**After Code Splitting**:
```
dist/assets/index-[hash].js:            ~800 kB (gzipped: ~220 kB)
dist/assets/provider-gemini-[hash].js:   ~60 kB (gzipped: ~20 kB)
dist/assets/provider-anthropic-[hash].js: ~60 kB (gzipped: ~20 kB)
dist/assets/provider-openai-[hash].js:   ~80 kB (gzipped: ~25 kB)
dist/assets/pdf-export-[hash].js:        ~50 kB (gzipped: ~15 kB)
```

**Improvement**: ~40% reduction in initial load size

### Lazy Loading Strategy

```typescript
// Dynamic provider imports
const { GeminiProvider } = await import(
  /* webpackChunkName: "provider-gemini" */
  "./providers/GeminiProvider"
);

// Lazy PDF export
const { exportToPDF } = await import('./pdfExportLazy');
```

### Memoization

```typescript
// Prevent pagination recalculation
const pages = useMemo(() => {
  return splitContentIntoPages(book.chapters);
}, [book]);

// Prevent context recreation
const contextValue = useMemo(() => ({
  state, startInvestigation, createBranch
}), [state]);
```

### Caching

- **Research Cache**: LocalStorage (max 5 topics, FIFO eviction)
- **Image Cache**: IndexedDB (max 100 images, FIFO eviction)
- **Provider Cache**: In-memory Map (lazy-loaded once)

---

## 🔒 Security

### Vulnerability Audit (Dec 2025)

✅ **0 Vulnerabilities** (npm audit clean)

**Recent Fixes**:
- jsPDF upgraded from 2.5.1 → 3.0.4 (fixes HIGH severity DoS + MODERATE XSS)
- dompurify upgraded to 3.2.4+ (via jsPDF dependency)

### Input Sanitization

```typescript
// XSS prevention
const sanitized = topic
  .replace(/<script[^>]*>.*?<\/script>/gi, '')  // Remove <script> tags
  .replace(/on\w+="[^"]*"/gi, '')               // Remove event handlers
  .slice(0, 200);                               // Length limit
```

### API Key Security

**Current Approach** (Client-Side):
- Keys stored in `.env.local` (never committed)
- Vite embeds keys in build (only accessible to app users)
- Fail-fast on missing keys

**Recommended for Production** (Server-Side):
- Proxy API calls through serverless functions (Vercel Functions, Netlify Functions)
- Store keys in server-side environment variables
- Implement rate limiting per user

### Schema Validation

All LLM outputs validated with Zod:

```typescript
const ResearchDataSchema = z.object({
  summary: z.string(),
  ethicalRating: z.number().min(1).max(10),
  profitPotential: z.string(),
  // ... full schema
});

const validated = ResearchDataSchema.parse(llmOutput);
```

---

## 🛠️ Development

### Build Commands

```bash
# Development server with HMR
npm run dev

# Type checking
npx tsc --noEmit

# Production build
npm run build

# Preview production build
npm run preview

# Security audit
npm audit

# Install with legacy peer deps (required for Zod conflict)
npm install --legacy-peer-deps
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": false,  // TODO: Enable after Zod refactoring
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  server: { port: 3000, host: '0.0.0.0' },
  plugins: [react()],
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    'process.env.ANTHROPIC_API_KEY': JSON.stringify(env.VITE_ANTHROPIC_API_KEY),
    'process.env.OPENAI_API_KEY': JSON.stringify(env.VITE_OPENAI_API_KEY)
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  }
});
```

### Testing (Planned)

**Current State**: No tests (0% coverage)

**Recommended Stack**:
- **Vitest** (unit tests)
- **@testing-library/react** (component tests)
- **Playwright** (E2E tests)

**Priority Test Targets**:
1. JSON parser (5 strategies)
2. Provider abstraction
3. Schema validators
4. Pagination logic
5. Cost estimation

---

## 🚢 Deployment

### Recommended Hosting

| Platform | Pros | Setup Difficulty |
|----------|------|------------------|
| **Vercel** | Vite-optimized, serverless functions, auto-deploy | Easy |
| **Netlify** | Serverless functions, form handling | Easy |
| **AWS S3 + CloudFront** | Full control, CDN caching | Medium |
| **GitHub Pages** | Free, simple | Easy (static only) |

### Deployment Checklist

- [ ] Set environment variables on hosting platform
- [ ] Enable gzip compression
- [ ] Configure CDN caching headers
- [ ] Set up error tracking (Sentry, Bugsnag)
- [ ] Add analytics (Google Analytics, Plausible)
- [ ] Test multi-provider fallback
- [ ] Verify PDF export works in production
- [ ] Check bundle size in production build

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add VITE_GEMINI_API_KEY
vercel env add VITE_ANTHROPIC_API_KEY
vercel env add VITE_OPENAI_API_KEY

# Deploy to production
vercel --prod
```

---

## 📚 Documentation

### Available Docs

- **COMPREHENSIVE_AUDIT_REPORT.md**: 500+ line codebase audit (architecture, security, performance)
- **BUNDLE_SIZE_REPORT.md**: Bundle optimization analysis and recommendations
- **REFACTORING_SUMMARY.md**: Component refactoring details (InputSection → 4 components)
- **REMOVAL_EXECUTION_REPORT.md**: Research deprecation implementation notes
- **TODO.md**: Prioritized task list with P0-P3 labels
- **.agent/HANDOFF.md**: Claude Code session state and decisions

### API Documentation (Planned)

Generate API docs with:
```bash
npx typedoc --out docs src
```

---

## 🤝 Contributing

### Development Workflow

1. **Create Feature Branch**:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes**:
   - Follow existing patterns (functional components, TypeScript)
   - Add JSDoc comments for complex functions
   - Update TODO.md with new tasks

3. **Test Locally**:
   ```bash
   npm run dev
   npm run build
   ```

4. **Commit**:
   ```bash
   git add -A
   git commit -m "feat: add my feature"
   ```

5. **Push & Create PR**:
   ```bash
   git push origin feature/my-feature
   # Create PR on GitHub
   ```

### Code Style

- **Components**: PascalCase (e.g., `BookReader.tsx`)
- **Functions**: camelCase (e.g., `generateBook()`)
- **Types**: PascalCase (e.g., `interface Book { }`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `WORDS_PER_PAGE`)
- **Formatting**: Tailwind CSS utilities, no custom CSS files

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`

**Examples**:
- `feat(providers): add Mistral AI support`
- `fix(pdf): resolve image alignment issue`
- `docs(readme): update installation steps`

---

## 📝 License

**Internal Use Only** - Not licensed for public distribution.

---

## 🙏 Acknowledgments

- **Google AI Studio** for Gemini API
- **Anthropic** for Claude API
- **OpenAI** for GPT and DALL-E APIs
- **React Team** for React 19
- **Vite Team** for blazing-fast build tool
- **Claude Code** for comprehensive audit and refactoring assistance

---

## 📞 Support

For internal support, contact the development team or open an issue in the repository.

---

<div align="center">

**Built with ❤️ using React, TypeScript, and Multi-LLM AI**

[GitHub](https://github.com/hagermann00/y-it-machine-2) • [AI Studio](https://ai.studio/apps/drive/1MiVdutn9sl88jZOqzodBevbqmQF6DnQc)

</div>
