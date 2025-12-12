
import { LLMClient } from "./core/LLMClient";
import { ResearchDataSchema, ValidatedResearchData } from "./core/SchemaValidator";
import { DetectiveAgent, AuditorAgent, InsiderAgent, StatAgent } from "./agents/SpecializedAgents";
import { RESEARCH_SYSTEM_PROMPT } from "../constants";
import { Type } from "@google/genai";

export type AgentStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface AgentState {
  name: string;
  status: AgentStatus;
  message?: string;
}

export class ResearchCoordinator {
  private llm: LLMClient;
  private agents: any[];

  constructor() {
    this.llm = LLMClient.getInstance();
    this.agents = [
      new DetectiveAgent(),
      new AuditorAgent(),
      new InsiderAgent(),
      new StatAgent()
    ];
  }

  async normalizeLog(rawText: string): Promise<ValidatedResearchData> {
    const response = await this.llm.generateContentWithRetry({
      model: 'gemini-2.5-flash',
      contents: `
        Task: Convert the following RAW RESEARCH NOTES into a structured Y-It Forensic Report JSON.
        
        INPUT TEXT:
        ${rawText.substring(0, 20000)} // Truncate to avoid context limits if massive
        
        INSTRUCTIONS:
        1. Extract specific facts, numbers, and warnings.
        2. If data is missing (e.g. no "Ethical Rating"), estimate it based on the sentiment of the text.
        3. Map unstructured text to the required JSON fields.
      `,
      config: {
        systemInstruction: "You are a Data Normalizer. You convert messy text into strict JSON for the Y-It Engine.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            ethicalRating: { type: Type.NUMBER },
            profitPotential: { type: Type.STRING },
            marketStats: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  context: { type: Type.STRING }
                },
                required: ["label", "value", "context"]
              }
            },
            hiddenCosts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  context: { type: Type.STRING }
                },
                required: ["label", "value", "context"]
              }
            },
            caseStudies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['WINNER', 'LOSER'] },
                  background: { type: Type.STRING },
                  strategy: { type: Type.STRING },
                  outcome: { type: Type.STRING },
                  revenue: { type: Type.STRING }
                },
                required: ["name", "type", "background", "strategy", "outcome", "revenue"]
              }
            },
            affiliates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  program: { type: Type.STRING },
                  potential: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['PARTICIPANT', 'WRITER'] },
                  commission: { type: Type.STRING },
                  notes: { type: Type.STRING }
                },
                required: ["program", "type", "commission", "notes"]
              }
            }
          }
        }
      }
    });

    const text = response.text || "{}";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '');
    
    try {
      const parsed = JSON.parse(cleanText);
      return ResearchDataSchema.parse(parsed);
    } catch (e) {
      console.error("Normalization validation error:", e);
      throw new Error("Failed to normalize raw text into valid Research Data.");
    }
  }

  async execute(topic: string, onProgress: (state: AgentState[]) => void): Promise<ValidatedResearchData> {
    const agentStates: AgentState[] = this.agents.map(a => ({ name: a.name, status: 'PENDING' }));
    onProgress([...agentStates]);

    // 1. Parallel Execution with Settled Results (Robustness)
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
        return `[${agent.name} Error] Failed to retrieve data. Proceed with caution.`;
      }
    });

    const results = await Promise.allSettled(promises);
    
    // 2. Synthesize Reports
    // Extract fulfilled values or fallback to error messages
    const reports = results.map((r, i) => 
        r.status === 'fulfilled' ? r.value : `[System Error] Agent ${this.agents[i].name} crashed.`
    );

    const [detectiveReport, auditorReport, insiderReport, statReport] = reports;

    const rawForensicData = `
      DETECTIVE REPORT: ${detectiveReport}
      AUDITOR REPORT: ${auditorReport}
      INSIDER REPORT: ${insiderReport}
      STATISTICIAN REPORT: ${statReport}
    `;

    // 3. Structured Synthesis
    const synthesisResponse = await this.llm.generateContentWithRetry({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze the following FORENSIC DOSSIER on "${topic}".
        Synthesize the conflicting reports into a single, cohesive ResearchData object.
        If reports are missing or contain errors, estimate conservatively based on the topic context.
        
        FORENSIC DOSSIER:
        ${rawForensicData}
      `,
      config: {
        systemInstruction: RESEARCH_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            ethicalRating: { type: Type.NUMBER },
            profitPotential: { type: Type.STRING },
            marketStats: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  context: { type: Type.STRING }
                },
                required: ["label", "value", "context"]
              }
            },
            hiddenCosts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  context: { type: Type.STRING }
                },
                required: ["label", "value", "context"]
              }
            },
            caseStudies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['WINNER', 'LOSER'] },
                  background: { type: Type.STRING },
                  strategy: { type: Type.STRING },
                  outcome: { type: Type.STRING },
                  revenue: { type: Type.STRING }
                },
                required: ["name", "type", "background", "strategy", "outcome", "revenue"]
              }
            },
            affiliates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  program: { type: Type.STRING },
                  potential: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['PARTICIPANT', 'WRITER'] },
                  commission: { type: Type.STRING },
                  notes: { type: Type.STRING }
                },
                required: ["program", "type", "commission", "notes"]
              }
            }
          }
        }
      }
    });

    const text = synthesisResponse.text || "{}";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '');
    
    try {
      const parsed = JSON.parse(cleanText);
      // Validate with Zod
      return ResearchDataSchema.parse(parsed);
    } catch (e) {
      console.error("Validation error:", e);
      throw new Error("Failed to validate research data structure.");
    }
  }
}
