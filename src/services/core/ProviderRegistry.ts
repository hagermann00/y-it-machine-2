
import { LLMProvider, ProviderConfig } from "./providers/LLMProvider";

type ProviderID = 'google' | 'anthropic' | 'openai';

export class ProviderRegistry {
    private static instance: ProviderRegistry;
    private providers: Map<ProviderID, LLMProvider> = new Map();
    private loadingPromises: Map<ProviderID, Promise<LLMProvider>> = new Map();

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

        // Pre-check which providers are configured
        const googleKey = env.VITE_GEMINI_API_KEY || env.VITE_API_KEY;
        const anthropicKey = env.VITE_ANTHROPIC_API_KEY;
        const openaiKey = env.VITE_OPENAI_API_KEY;

        // Store keys for lazy loading
        if (googleKey) {
            (this as any)._googleKey = googleKey;
        }
        if (anthropicKey) {
            (this as any)._anthropicKey = anthropicKey;
        }
        if (openaiKey) {
            (this as any)._openaiKey = openaiKey;
        }
    }

    private async loadProviderModule(id: ProviderID): Promise<LLMProvider> {
        const env = (import.meta as any).env || {};
        let provider: LLMProvider;

        switch (id) {
            case 'google': {
                const googleKey = env.VITE_GEMINI_API_KEY || env.VITE_API_KEY;
                if (!googleKey) {
                    throw new Error(`Provider 'google' is not configured.`);
                }
                const { GeminiProvider } = await import(
                    /* webpackChunkName: "provider-gemini" */
                    "./providers/GeminiProvider"
                );
                provider = new GeminiProvider({ apiKey: googleKey });
                break;
            }
            case 'anthropic': {
                const anthropicKey = env.VITE_ANTHROPIC_API_KEY;
                if (!anthropicKey) {
                    throw new Error(`Provider 'anthropic' is not configured.`);
                }
                const { AnthropicProvider } = await import(
                    /* webpackChunkName: "provider-anthropic" */
                    "./providers/AnthropicProvider"
                );
                provider = new AnthropicProvider({ apiKey: anthropicKey });
                break;
            }
            case 'openai': {
                const openaiKey = env.VITE_OPENAI_API_KEY;
                if (!openaiKey) {
                    throw new Error(`Provider 'openai' is not configured.`);
                }
                const { OpenAIProvider } = await import(
                    /* webpackChunkName: "provider-openai" */
                    "./providers/OpenAIProvider"
                );
                provider = new OpenAIProvider({ apiKey: openaiKey });
                break;
            }
            default:
                throw new Error(`Unknown provider: ${id}`);
        }

        return provider;
    }

    public async getProvider(id: ProviderID): Promise<LLMProvider> {
        // Return cached provider if available
        const cached = this.providers.get(id);
        if (cached) {
            return cached;
        }

        // Return existing loading promise if one is in progress
        const loadingPromise = this.loadingPromises.get(id);
        if (loadingPromise) {
            return loadingPromise;
        }

        // Create new loading promise
        const promise = this.loadProviderModule(id);
        this.loadingPromises.set(id, promise);

        try {
            const provider = await promise;
            this.providers.set(id, provider);
            this.loadingPromises.delete(id);
            return provider;
        } catch (error) {
            this.loadingPromises.delete(id);
            throw error;
        }
    }

    public isProviderAvailable(id: ProviderID): boolean {
        const env = (import.meta as any).env || {};
        switch (id) {
            case 'google':
                return !!(env.VITE_GEMINI_API_KEY || env.VITE_API_KEY);
            case 'anthropic':
                return !!env.VITE_ANTHROPIC_API_KEY;
            case 'openai':
                return !!env.VITE_OPENAI_API_KEY;
            default:
                return false;
        }
    }

    public registerProvider(id: ProviderID, provider: LLMProvider) {
        this.providers.set(id, provider);
        this.loadingPromises.delete(id);
    }
}
