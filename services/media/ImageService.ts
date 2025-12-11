import { LLMClient } from "../core/LLMClient";
import { ImageModelID } from "../../types";

export class ImageService {
  private static llm = LLMClient.getInstance();

  public static async generateImage(
    prompt: string, 
    visualStyle: string = '', 
    highRes: boolean = false, 
    hierarchy: ImageModelID[] = ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image', 'imagen-3.0-generate-001']
  ): Promise<string> {
    
    const client = this.llm.getClient();
    const fullPrompt = `Style: ${visualStyle || "Photorealistic, Gritty, Forensic, High Contrast"}. Subject: ${prompt}. No text in image.`;

    // Try models in the user-defined order
    for (const modelId of hierarchy) {
        try {
            console.log(`Attempting image gen with ${modelId}...`);
            
            if (modelId === 'imagen-3.0-generate-001') {
                const response = await this.llm.generateImages({
                    model: modelId,
                    prompt: fullPrompt,
                    config: {
                        numberOfImages: 1,
                        outputMimeType: 'image/jpeg',
                        aspectRatio: '3:4'
                    }
                });
                return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
            } 
            else {
                // Gemini Models
                // Filter incompatible config for standard flash
                const imageConfig: any = { aspectRatio: "3:4" };
                if (modelId === 'gemini-3-pro-image-preview' && highRes) {
                    imageConfig.imageSize = "2K"; // Only for Pro
                }

                const response = await this.llm.generateContentWithRetry({
                    model: modelId,
                    contents: { parts: [{ text: fullPrompt }] },
                    config: {
                        imageConfig: imageConfig
                    }
                });

                // Extract image
                for (const part of response.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData && part.inlineData.data) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
        } catch (error: any) {
            console.warn(`Model ${modelId} failed:`, error.message);
            // Continue to next model in hierarchy
        }
    }

    throw new Error("All image generation models failed. Please check your API key permissions.");
  }

  public static async editImage(
    base64Image: string, 
    prompt: string, 
    hierarchy: ImageModelID[] = ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image']
  ): Promise<string> {
    
    const editingHierarchy = hierarchy.filter(id => id.startsWith('gemini'));
    if (editingHierarchy.length === 0) editingHierarchy.push('gemini-2.5-flash-image');

    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    for (const modelId of editingHierarchy) {
        try {
            const response = await this.llm.generateContentWithRetry({
                model: modelId,
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
                        { text: `Modify this image: ${prompt}. Keep the same aspect ratio.` }
                    ]
                }
            });

             for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        } catch (error) {
             console.warn(`Edit with ${modelId} failed.`, error);
        }
    }
    
    throw new Error("Image editing failed on all available models.");
  }
}