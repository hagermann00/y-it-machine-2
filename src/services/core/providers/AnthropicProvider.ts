
import Anthropic from "@anthropic-ai/sdk";
import { LLMProvider, GenerationConfig, ProviderConfig } from "./LLMProvider";

export class AnthropicProvider extends LLMProvider {
    readonly id = 'anthropic';
    private client: Anthropic;

    constructor(config: ProviderConfig) {
        super(config);
        this.client = new Anthropic({
            apiKey: config.apiKey,
            dangerouslyAllowBrowser: true // Required for frontend usage if not proxied
        });
    }

    async generateText(modelId: string, prompt: string, config?: GenerationConfig): Promise<string> {
        if (!this.isConfigured()) throw new Error("Anthropic API key not configured");

        const params: Anthropic.MessageCreateParamsNonStreaming = {
            model: modelId,
            max_tokens: config?.maxTokens || 4096,
            temperature: config?.temperature,
            system: config?.systemPrompt,
            messages: [{ role: 'user', content: prompt }]
        };

        // Handle images if present (Claude Vision)
        if (config?.images && config.images.length > 0) {
            params.messages[0].content = [
                ...config.images.map(img => ({
                    type: "image" as const,
                    source: {
                        type: "base64" as const,
                        media_type: "image/png" as const, // Assume PNG for now, or detect
                        data: img
                    }
                })),
                { type: "text" as const, text: prompt }
            ];
        }

        // JSON Mode (Prefill strategy)
        if (config?.jsonMode) {
            // Claude standard practice: Prefill "{" to force JSON
            if (!params.messages[1]) {
                // We can't prefill easily in one turn, but we can append "Return valid JSON" to system
                params.system = (params.system || "") + "\n\nCRITICAL: Return ONLY valid JSON.";
            }
        }

        try {
            const response = await this.client.messages.create(params);

            if (response.content && response.content.length > 0) {
                const textContent = response.content.find(c => c.type === 'text');
                return textContent ? textContent.text : "";
            }
            return "";
        } catch (error: any) {
            console.error("Anthropic generation failed:", error);
            throw error;
        }
    }

    async generateImage(modelId: string, prompt: string, width?: number, height?: number): Promise<string> {
        throw new Error("Anthropic does not support native image generation.");
    }
}
