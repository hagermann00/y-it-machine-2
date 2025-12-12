
import { ProviderRegistry } from "./core/ProviderRegistry";
import { getModel } from "./core/ModelRegistry";
import { ResearchDataSchema, ValidatedResearchData } from "./core/SchemaValidator";
import { DetectiveAgent, AuditorAgent, InsiderAgent, StatAgent } from "./agents/SpecializedAgents";
import { RESEARCH_SYSTEM_PROMPT } from "../constants";
import { GenSettings } from "../types";

export type AgentStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface AgentState {
  name: string;
  status: AgentStatus;
  message?: string;
}

export class ResearchCoordinator {
  private agents: any[];

  constructor() {
    // Basic instantiation - if these classes are missing at runtime, this will crash.
    // Assuming they exist or will be restored.
    try {
      this.agents = [
        new DetectiveAgent(),
        new AuditorAgent(),
        new InsiderAgent(),
        new StatAgent()
      ];
    } catch (e) {
      console.warn("Specialized Agents not found. Research Coordinator operating in degraded mode.");
      this.agents = [];
    }
  }

  // Helper to get provider
  private getProviderForModel(modelId?: string) {
    const id = modelId || 'gemini-2.5-flash';
    const modelDef = getModel(id);
    const safeProviderId = modelDef ? modelDef.provider : 'google';
    return {
      provider: ProviderRegistry.getInstance().getProvider(safeProviderId),
      modelId: id
    };
  }

  async normalizeLog(rawText: string, modelId?: string): Promise<ValidatedResearchData> {
    const { provider, modelId: safeModelId } = this.getProviderForModel(modelId);

    const prompt = `
        Task: Convert the following RAW RESEARCH NOTES into a structured Y-It Forensic Report JSON.
        
        INPUT TEXT:
        ${rawText.substring(0, 25000)}
        
        INSTRUCTIONS:
        1. Extract specific facts, numbers, and warnings.
        2. If data is missing (e.g. no "Ethical Rating"), estimate it based on the sentiment of the text.
        3. Map unstructured text to the required JSON fields.
        
        CRITICAL: Return valid JSON matching this schema:
        {
             "summary": "string",
             "ethicalRating": number (1-10),
             "profitPotential": "string",
             "marketStats": [ { "label": "string", "value": "string", "context": "string" } ],
             "hiddenCosts": [ { "label": "string", "value": "string", "context": "string" } ],
             "caseStudies": [ { "name": "string", "type": "WINNER"|"LOSER", "background": "string", "strategy": "string", "outcome": "string", "revenue": "string" } ],
             "affiliates": [ { "program": "string", "potential": "string", "type": "PARTICIPANT"|"WRITER", "commission": "string", "notes": "string" } ]
        }
    `;

    const response = await provider.generateText(safeModelId, prompt, {
      systemPrompt: "You are a Data Normalizer. You convert messy text into strict JSON for the Y-It Engine.",
      jsonMode: true,
      maxTokens: 4000
    });

    const cleanText = response.replace(/```json/g, '').replace(/```/g, '');

    try {
      const parsed = JSON.parse(cleanText);
      return ResearchDataSchema.parse(parsed);
    } catch (e) {
      console.error("Normalization validation error:", e);
      throw new Error("Failed to normalize raw text into valid Research Data.");
    }
  }

  async execute(topic: string, settings: GenSettings, onProgress: (state: AgentState[]) => void): Promise<ValidatedResearchData> {
    if (this.agents.length === 0) {
      throw new Error("Research Agents unavailable. Please use Manual Upload.");
    }

    const agentStates: AgentState[] = this.agents.map(a => ({ name: a.name, status: 'PENDING' }));
    onProgress([...agentStates]);

    // 1. Parallel Execution 
    // Note: specialized agents likely still use hardcoded LLMClient unless updated.
    const promises = this.agents.map(async (agent, index) => {
      agentStates[index].status = 'RUNNING';
      onProgress([...agentStates]);

      try {
        const result = await agent.run(topic);
        agentStates[index].status = 'COMPLETED';
        onProgress([...agentStates]);
        return result;
      } catch (e) {
        console.error(`${agent.name} failed:`, e);
        agentStates[index].status = 'FAILED';
        onProgress([...agentStates]);
        return `[${agent.name} Error] Failed to retrieve data.`;
      }
    });

    const results = await Promise.allSettled(promises);

    // 2. Synthesize Reports
    const reports = results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : `[System Error] Agent ${this.agents[i].name} crashed.`
    );

    const rawForensicData = reports.join("\n\n---\n\n");

    // 3. Structured Synthesis using Selected Model
    const { provider, modelId: safeModelId } = this.getProviderForModel(settings.researchModel);

    const prompt = `
        Analyze the following FORENSIC DOSSIER on "${topic}".
        Synthesize the conflicting reports into a single, cohesive ResearchData object.
        If reports are missing or contain errors, estimate conservatively based on the topic context.
        
        FORENSIC DOSSIER:
        ${rawForensicData}
        
        CRITICAL: Return valid JSON matching this schema:
        {
             "summary": "string",
             "ethicalRating": number (1-10),
             "profitPotential": "string",
             "marketStats": [ { "label": "string", "value": "string", "context": "string" } ],
             "hiddenCosts": [ { "label": "string", "value": "string", "context": "string" } ],
             "caseStudies": [ { "name": "string", "type": "WINNER"|"LOSER", "background": "string", "strategy": "string", "outcome": "string", "revenue": "string" } ],
             "affiliates": [ { "program": "string", "potential": "string", "type": "PARTICIPANT"|"WRITER", "commission": "string", "notes": "string" } ]
        }
    `;

    const synthesisResponse = await provider.generateText(safeModelId, prompt, {
      systemPrompt: RESEARCH_SYSTEM_PROMPT + "\n\nRETURN JSON ONLY.",
      jsonMode: true,
      maxTokens: 4000
    });

    const cleanText = synthesisResponse.replace(/```json/g, '').replace(/```/g, '');

    try {
      const parsed = JSON.parse(cleanText);
      return ResearchDataSchema.parse(parsed);
    } catch (e) {
      console.error("Validation error:", e);
      throw new Error("Failed to validate research data structure.");
    }
  }
}
