
import { LLMClient } from "../core/LLMClient";
import { parseJsonFromLLM } from "../../utils/jsonParser";
import { BookSchema, ValidatedBook } from "../core/SchemaValidator";
import { AUTHOR_SYSTEM_PROMPT } from "../../constants";
import { ResearchData, GenSettings } from "../../types";
import { Type } from "@google/genai";

export class AuthorAgent {
  private llm: LLMClient;

  constructor() {
    this.llm = LLMClient.getInstance();
  }

  public async generateDraft(topic: string, research: ResearchData, settings: GenSettings): Promise<ValidatedBook> {
    
    const lengthInstruction = settings.lengthLevel === 1 ? "Keep chapters short (Nano-sized)." 
                            : settings.lengthLevel === 3 ? "Write extensive, deep chapters." 
                            : "Standard chapter length.";
    
    const imageInstruction = settings.imageDensity === 3 ? "Include 3-4 visual descriptions per chapter." 
                           : settings.imageDensity === 1 ? "Minimal visuals, text focused." 
                           : "Include 1-2 visual descriptions per chapter.";

    const constraints = `
        Target Word Count: ${settings.targetWordCount || "Default"}
        Tone: ${settings.tone || "Default Y-It Satire"}
        Visual Style: ${settings.visualStyle || "Default Forensic/Gritty"}
        ${lengthInstruction}
        ${imageInstruction}
        Tech Level: ${settings.techLevel}
    `;

    const response = await this.llm.generateContentWithRetry({
        model: 'gemini-2.5-flash',
        contents: `
            Topic: ${topic}
            Research Summary: ${JSON.stringify(research.summary)}
            Market Stats: ${JSON.stringify(research.marketStats)}
            Case Studies: ${JSON.stringify(research.caseStudies)}
            User Constraints: ${constraints}
            Custom Spec: ${settings.customSpec || "Use Standard Spec"}
            Cover Art Instructions:
            Front: ${settings.frontCoverPrompt || "Auto-generate based on Y-It Brand (Yellow/Black/Bold)"}
            Back: ${settings.backCoverPrompt || "Auto-generate based on Y-It Brand"}
        `,
        config: {
            systemInstruction: AUTHOR_SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    frontCover: {
                        type: Type.OBJECT,
                        properties: {
                            titleText: { type: Type.STRING },
                            subtitleText: { type: Type.STRING },
                            visualDescription: { type: Type.STRING }
                        }
                    },
                    backCover: {
                        type: Type.OBJECT,
                        properties: {
                            blurb: { type: Type.STRING },
                            visualDescription: { type: Type.STRING }
                        }
                    },
                    chapters: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                number: { type: Type.NUMBER },
                                title: { type: Type.STRING },
                                content: { type: Type.STRING },
                                posiBotQuotes: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            position: { type: Type.STRING, enum: ['LEFT', 'RIGHT'] },
                                            text: { type: Type.STRING }
                                        }
                                    }
                                },
                                visuals: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            type: { type: Type.STRING, enum: ['HERO', 'CHART', 'CALLOUT', 'PORTRAIT', 'DIAGRAM'] },
                                            description: { type: Type.STRING },
                                            caption: { type: Type.STRING }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const rawData = parseJsonFromLLM(response.text || "{}");
    
    // Validate Structure
    return BookSchema.parse(rawData);
  }
}
