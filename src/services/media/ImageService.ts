
import { ProviderRegistry } from "../core/ProviderRegistry";
import { getModel } from "../core/ModelRegistry";
import { ImageModelID } from "../../types";

export class ImageService {

    public static async generateImage(
        prompt: string,
        visualStyle: string = '',
        highRes: boolean = false,
        preferredModelId: string = 'dall-e-3' // Default to DALL-E 3 if not specified
    ): Promise<string> {

        const fullPrompt = `Style: ${visualStyle || "Photorealistic, Gritty, Forensic, High Contrast"}. Subject: ${prompt}. No text in image.`;

        // Resolve provider
        const modelDef = getModel(preferredModelId);
        if (!modelDef) {
            console.warn(`Image model ${preferredModelId} not found in registry.`);
        }

        const providerId = modelDef ? modelDef.provider : (preferredModelId.includes('gpt') || preferredModelId.includes('dall') ? 'openai' : 'google');

        try {
            const provider = ProviderRegistry.getInstance().getProvider(providerId);

            console.log(`Generating image with ${preferredModelId} (${providerId})...`);

            // Call generic provider method
            const result = await provider.generateImage(
                preferredModelId,
                fullPrompt,
                highRes ? 1792 : 1024,
                highRes ? 1024 : 1024
            );

            return result;

        } catch (error: any) {
            console.error(`Image generation failed with ${preferredModelId}:`, error);

            // Simple fallback to DALL-E 3 or Gemini based on availability if primary failed? 
            // For now, let's just fail loudly so user knows.
            throw new Error(`Image generation failed: ${error.message}`);
        }
    }

    public static async editImage(
        base64Image: string,
        prompt: string,
        modelId: string = 'gemini-1.5-pro-002'
    ): Promise<string> {
        // Currently only Gemini supports "edit by prompting" in this specific way (multi-modal input + text output of image?)
        // Actually, DALL-E edits require masks. Gemini 1.5 Pro can intake image and output image? 
        // Wait, Gemini 1.5 Pro generates TEXT from image. It does NOT generate image from image directly in standard API yet (Imagen 3 does not support img2img via API public generally).
        // The previous implementation used `generateContentWithRetry` and expected `inlineData` in response.
        // This implies using a model that returns images. Experimental Gemini models do this.

        // We will keep the logic similar but use the ProviderRegistry to get the provider.
        // However, LLMProvider interface doesn't have `editImage`.

        // For now, we will throw not implemented or try to cast to GeminiProvider if needed.
        // Given the strict directive for Multi-LLM, we'll mark this as limited support.

        throw new Error("Image editing is temporarily disabled in Multi-LLM mode pending provider standardization.");
    }
}
