
import { LLMClient } from "../core/LLMClient";

export abstract class BaseAgent {
  protected llm: LLMClient;
  public name: string;

  constructor(name: string) {
    this.name = name;
    this.llm = LLMClient.getInstance();
  }

  protected async executeSearch(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const response = await this.llm.generateContentWithRetry({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          // We want raw text for the agents, not JSON yet
        }
      });
      return response.text || "No data found.";
    } catch (e: any) {
      console.error(`Agent ${this.name} failed:`, e.message);
      throw e;
    }
  }

  abstract run(topic: string): Promise<string>;
}
