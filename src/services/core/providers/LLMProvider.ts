
import { ModelDefinition } from '../ModelRegistry';

export interface GenerationConfig {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    systemPrompt?: string;
    images?: string[]; // Base64 strings
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

    abstract readonly id: string;

    /**
     * Generates text response from the LLM
     */
    abstract generateText(
        modelId: string,
        prompt: string,
        config?: GenerationConfig
    ): Promise<string>;

    /**
     * Generates an image (if supported)
     */
    abstract generateImage(
        modelId: string,
        prompt: string,
        width?: number,
        height?: number
    ): Promise<string>;

    /**
     * Calculates cost for a request
     */
    calculateCost(modelId: string, inputTokens: number, outputTokens: number, modelDef: ModelDefinition): number {
        const inputCost = (inputTokens / 1_000_000) * modelDef.pricing.inputPer1M;
        const outputCost = (outputTokens / 1_000_000) * modelDef.pricing.outputPer1M;
        return inputCost + outputCost;
    }

    /**
     * Checks if the provider is configured and ready
     */
    isConfigured(): boolean {
        return !!this.config.apiKey;
    }
}
