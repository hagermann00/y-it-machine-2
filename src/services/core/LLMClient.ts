import { GoogleGenAI } from "@google/genai";

export class LLMClient {
  private static instance: LLMClient;
  private client: GoogleGenAI;

  private constructor() {
    // Support both Vite (import.meta.env) and standard (process.env)
    const apiKey = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) 
      ? (import.meta as any).env.VITE_API_KEY 
      : process.env.API_KEY;

    if (!apiKey) {
      console.warn("API Key not found. Ensure VITE_API_KEY or API_KEY is set.");
    }

    this.client = new GoogleGenAI({ apiKey: apiKey || "" });
  }

  public static getInstance(): LLMClient {
    if (!LLMClient.instance) {
      LLMClient.instance = new LLMClient();
    }
    return LLMClient.instance;
  }

  public getClient(): GoogleGenAI {
    return this.client;
  }

  public async generateContentWithRetry(
    params: any,
    retries = 3,
    delay = 2000
  ): Promise<any> {
    try {
      return await this.client.models.generateContent(params);
    } catch (error: any) {
      const status = error.status || (error.response ? error.response.status : null);
      const message = error.message || "";

      const isPermissionError = status === 403 || message.includes("403") || message.includes("permission");
      const isRateLimit = status === 429 || message.includes("429") || message.includes("resource exhausted");
      
      // Fatal errors: Permissions or Invalid Argument
      if (isPermissionError || status === 400) {
        console.error("Fatal LLM Error:", message);
        throw error;
      }

      // Retry on Rate Limits (429) or Server Errors (5xx)
      if (retries > 0) {
        console.warn(`API call failed (${status || 'Unknown'}), retrying in ${delay}ms...`, message);
        await new Promise((resolve) => setTimeout(resolve, delay));
        // Exponential backoff
        return this.generateContentWithRetry(params, retries - 1, delay * 2);
      }
      
      throw error;
    }
  }

  public async generateImages(params: any): Promise<any> {
      // Wrapper for generateImages if using Imagen model directly via SDK
      return this.client.models.generateImages(params);
  }
}