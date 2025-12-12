
import { GoogleGenAI } from "@google/genai";
import { LLMProvider, GenerationConfig, ProviderConfig } from "./LLMProvider";

export class GeminiProvider extends LLMProvider {
    readonly id = 'google';
    private client: GoogleGenAI;

    constructor(config: ProviderConfig) {
        super(config);
        this.client = new GoogleGenAI({ apiKey: config.apiKey });
    }

    async generateText(modelId: string, prompt: string, config?: GenerationConfig): Promise<string> {
        if (!this.isConfigured()) throw new Error("Gemini API key not configured");

        const params: any = {
            model: modelId,
            contents: [{
                role: "user",
                parts: [{ text: config?.systemPrompt ? `${config.systemPrompt}\n\n${prompt}` : prompt }]
            }],
            config: {
                temperature: config?.temperature,
                maxOutputTokens: config?.maxTokens,
                responseMimeType: config?.jsonMode ? 'application/json' : 'text/plain'
            }
        };

        // Handle images if present
        if (config?.images && config.images.length > 0) {
            params.contents[0].parts = [
                ...config.images.map(img => ({ inlineData: { mimeType: "image/png", data: img } })),
                { text: prompt }
            ];
        }

        try {
            const result = await this.client.models.generateContent(params);

            // Extract text based on SDK response structure
            if (result.response?.candidates && result.response.candidates.length > 0) {
                const candidate = result.response.candidates[0];
                if (candidate.content?.parts && candidate.content.parts.length > 0) {
                    return candidate.content.parts[0].text || "";
                }
            }
            return "";
        } catch (error: any) {
            console.error("Gemini generation failed:", error);
            throw error;
        }
    }

    async generateImage(modelId: string, prompt: string, width?: number, height?: number): Promise<string> {
        if (!this.isConfigured()) throw new Error("Gemini API key not configured");

        try {
            // Imagen 3 usage via GoogleGenAI SDK
            const response = await this.client.models.generateImages({
                model: modelId, // e.g. 'imagen-3.0-generate-001'
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    aspectRatio: "1:1", // Map width/height to closest aspect ratio if needed
                    outputMimeType: "image/png"
                }
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                return `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
            }
            throw new Error("No image generated");
        } catch (error) {
            console.error("Gemini image generation failed:", error);
            throw error;
        }
    }
}
