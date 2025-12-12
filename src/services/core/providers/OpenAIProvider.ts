
import OpenAI from "openai";
import { LLMProvider, GenerationConfig, ProviderConfig } from "./LLMProvider";

/**
 * OpenAIProvider
 *
 * Concrete implementation of LLMProvider using the official `openai` SDK.
 * - Text: Chat Completions (supports JSON mode + vision)
 * - Images: DALL·E 3 via images.generate
 */
export class OpenAIProvider extends LLMProvider {
    readonly id = 'openai';
    private client: OpenAI;

    constructor(config: ProviderConfig) {
        super(config);

        if (!config.apiKey) {
            throw new Error(
                "[OpenAIProvider] Missing OpenAI API key."
            );
        }

        this.client = new OpenAI({
            apiKey: config.apiKey,
            dangerouslyAllowBrowser: true, // Client-side risks acknowledged
        });
    }

    /**
     * Text / Vision generation using Chat Completions.
     */
    async generateText(
        modelId: string,
        prompt: string,
        config?: GenerationConfig
    ): Promise<string> {
        try {
            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

            if (config?.systemPrompt) {
                messages.push({
                    role: "system",
                    content: config.systemPrompt,
                });
            }

            // Build User Content (Text + Optional Images)
            const userContent = this.buildUserContent(prompt, config?.images);
            messages.push({
                role: "user",
                content: userContent,
            });

            const params: OpenAI.Chat.ChatCompletionCreateParams = {
                model: modelId,
                messages,
                temperature: config?.temperature,
                max_tokens: config?.maxTokens,
                response_format: config?.jsonMode
                    ? { type: "json_object" }
                    : undefined,
            };

            const completion = await this.client.chat.completions.create(params);
            return completion.choices[0]?.message?.content || "";

        } catch (err: any) {
            console.error("[OpenAIProvider] generateText error:", err);
            throw new Error(`[OpenAIProvider] Text generation failed: ${err.message}`);
        }
    }

    /**
     * Image generation using DALL·E 3.
     */
    async generateImage(
        modelId: string,
        prompt: string,
        width?: number,
        height?: number
    ): Promise<string> {
        try {
            // DALL-E 3 supports specific sizes. We map request to closest standard.
            // 1024x1024 is the standard square.
            // 1024x1792 is portrait. 1792x1024 is landscape.
            let size: "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024";

            if (width && height) {
                if (width > height) size = "1792x1024";
                else if (height > width) size = "1024x1792";
            }

            const response = await this.client.images.generate({
                model: "dall-e-3", // DALL-E 3 is the standard for now, ignoring modelId unless needed
                prompt,
                n: 1,
                size,
                response_format: "b64_json"
            });

            const img = response.data[0];
            if (img.b64_json) {
                return `data:image/png;base64,${img.b64_json}`;
            }
            if (img.url) {
                // Fallback if needed, though we prefer base64 for PDF building
                return img.url;
            }
            return "";
        } catch (err: any) {
            console.error("[OpenAIProvider] generateImage error:", err);
            throw new Error(`[OpenAIProvider] Image generation failed: ${err.message}`);
        }
    }

    /**
     * Helper to format content with images
     */
    private buildUserContent(
        prompt: string,
        images?: string[]
    ): string | OpenAI.Chat.ChatCompletionContentPart[] {
        if (!images || images.length === 0) {
            return prompt;
        }

        const parts: OpenAI.Chat.ChatCompletionContentPart[] = [
            { type: "text", text: prompt }
        ];

        for (const b64 of images) {
            // The interface guarantees raw base64 string
            const url = `data:image/png;base64,${b64}`;
            parts.push({
                type: "image_url",
                image_url: { url }
            });
        }

        return parts;
    }
}
