
import { LLMProvider, ProviderConfig } from "./providers/LLMProvider";
import { GeminiProvider } from "./providers/GeminiProvider";
import { AnthropicProvider } from "./providers/AnthropicProvider";
import { OpenAIProvider } from "./providers/OpenAIProvider";

type ProviderID = 'google' | 'anthropic' | 'openai';

export class ProviderRegistry {
    private static instance: ProviderRegistry;
    private providers: Map<ProviderID, LLMProvider> = new Map();

    private constructor() {
        // Initialize providers with env vars
        this.initializeProviders();
    }

    public static getInstance(): ProviderRegistry {
        if (!ProviderRegistry.instance) {
            ProviderRegistry.instance = new ProviderRegistry();
        }
        return ProviderRegistry.instance;
    }

    public initializeProviders() {
        // Load environment variables (Vite-style)
        const env = (import.meta as any).env || {};

        // Google (Gemini)
        const googleKey = env.VITE_GEMINI_API_KEY || env.VITE_API_KEY; // Legacy support
        if (googleKey) {
            this.providers.set('google', new GeminiProvider({ apiKey: googleKey }));
        }

        // Anthropic (Claude)
        const anthropicKey = env.VITE_ANTHROPIC_API_KEY;
        if (anthropicKey) {
            this.providers.set('anthropic', new AnthropicProvider({ apiKey: anthropicKey }));
        }

        // OpenAI (Coming Soon)
        const openaiKey = env.VITE_OPENAI_API_KEY;
        if (openaiKey) {
            this.providers.set('openai', new OpenAIProvider({ apiKey: openaiKey }));
        }
    }

    public getProvider(id: ProviderID): LLMProvider {
        const provider = this.providers.get(id);
        if (!provider) {
            throw new Error(`Provider '${id}' is not configured. Please check your API keys.`);
        }
        return provider;
    }

    public isProviderAvailable(id: ProviderID): boolean {
        return this.providers.has(id);
    }

    public registerProvider(id: ProviderID, provider: LLMProvider) {
        this.providers.set(id, provider);
    }
}
