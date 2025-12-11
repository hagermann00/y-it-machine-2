

import { LLMClient } from "../core/LLMClient";
import { parseJsonFromLLM } from "../../utils/jsonParser";
import { BookSchema, ValidatedBook, OutlineSchema, ValidatedOutline, ChapterContentSchema, ValidatedChapterContent } from "../core/SchemaValidator";
import { AUTHOR_OUTLINE_PROMPT, AUTHOR_CHAPTER_PROMPT } from "../../constants";
import { ResearchData, GenSettings, Chapter } from "../../types";
import { Type } from "@google/genai";

export class AuthorAgent {
  private llm: LLMClient;

  constructor() {
    this.llm = LLMClient.getInstance();
  }

  /**
   * Orchestrates the 2-step generation process:
   * 1. Architect: Creates an Outline with detailed briefs.
   * 2. Ghostwriter: Writes each chapter individually.
   */
  public async generateDraft(
    topic: string, 
    research: ResearchData, 
    settings: GenSettings,
    onProgress?: (msg: string) => void
  ): Promise<ValidatedBook> {
    
    // --- Step 1: Generate Outline ---
    if(onProgress) onProgress("Architecting book structure and chapter briefs...");
    const outline = await this.generateOutline(topic, research, settings);

    // --- Step 2: Generate Chapters Sequentially ---
    const chapters: Chapter[] = [];
    
    for (const brief of outline.chapterBriefs) {
        if(onProgress) onProgress(`Writing Chapter ${brief.number}: ${brief.title}...`);
        
        try {
            // Add a small delay to respect rate limits if necessary, though minimal
            const content = await this.generateChapter(topic, research, settings, brief, outline.title);
            
            chapters.push({
                number: brief.number,
                title: brief.title,
                content: content.content,
                posiBotQuotes: content.posiBotQuotes || [],
                visuals: content.visuals || []
            });
        } catch (e) {
            console.error(`Failed to generate chapter ${brief.number}`, e);
            // Fallback for failed chapter to not kill the whole book
            chapters.push({
                number: brief.number,
                title: brief.title,
                content: "## Content Generation Failed\n\nWe apologize, but the ghostwriter was intercepted by legal counsel. Please regenerate this chapter.",
                posiBotQuotes: [],
                visuals: []
            });
        }
    }

    // --- Step 3: Assemble Book ---
    if(onProgress) onProgress("Finalizing manuscript...");
    const book: ValidatedBook = {
        title: outline.title,
        subtitle: outline.subtitle,
        frontCover: outline.frontCover,
        backCover: outline.backCover,
        chapters: chapters
    };

    return book;
  }

  /**
   * STEP 1: The Architect
   */
  private async generateOutline(
      topic: string, 
      research: ResearchData, 
      settings: GenSettings
  ): Promise<ValidatedOutline> {
      
      const constraints = `
        Tone: ${settings.tone || "Default Y-It Satire"}
        Structure: ${settings.lengthLevel === 1 ? "Condensed (4 Chapters)" : "Full Standard (8 Chapters)"}
      `;

      const response = await this.llm.generateContentWithRetry({
          model: 'gemini-2.5-flash',
          contents: `
              Topic: ${topic}
              Research Data Summary: ${JSON.stringify(research.summary)}
              Key Stats: ${JSON.stringify(research.marketStats.slice(0,5))}
              
              USER MANIFEST (CRITICAL - FOLLOW THESE RULES):
              ${settings.customSpec || "No custom spec provided. Use defaults."}

              Global Constraints: ${constraints}
              
              Task: Create the master outline and DETAILED CHAPTER BRIEFS for the ghostwriter.
              IMPORTANT: If the Manifest contains a [MANUSCRIPT OVERRIDE] for a chapter, the brief MUST instruct the ghostwriter to use that exact text.
          `,
          config: {
              systemInstruction: AUTHOR_OUTLINE_PROMPT,
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
                      chapterBriefs: {
                          type: Type.ARRAY,
                          items: {
                              type: Type.OBJECT,
                              properties: {
                                  number: { type: Type.NUMBER },
                                  title: { type: Type.STRING },
                                  detailedBrief: { type: Type.STRING }
                              },
                              required: ["number", "title", "detailedBrief"]
                          }
                      }
                  }
              }
          }
      });

      return parseJsonFromLLM(response.text || "{}");
  }

  /**
   * STEP 2: The Ghostwriter (Per Chapter)
   */
  private async generateChapter(
      topic: string,
      research: ResearchData,
      settings: GenSettings,
      brief: { number: number; title: string; detailedBrief: string },
      bookTitle: string
  ): Promise<ValidatedChapterContent> {

      const response = await this.llm.generateContentWithRetry({
          model: 'gemini-2.5-flash',
          contents: `
              Book Title: ${bookTitle}
              Topic: ${topic}
              Research Data (Reference this for facts): ${JSON.stringify(research)}
              
              CHAPTER ASSIGNMENT:
              Number: ${brief.number}
              Title: ${brief.title}
              BRIEFING INSTRUCTIONS: ${brief.detailedBrief}
              
              MANIFEST / SPEC (Look here for specific PosiBot rules or Overrides):
              ${settings.customSpec || ""}

              Global Tone: ${settings.tone}
              Tech Level: ${settings.techLevel}
          `,
          config: {
              systemInstruction: AUTHOR_CHAPTER_PROMPT,
              thinkingConfig: { thinkingBudget: 1024 }, // Use thinking for deep writing structure
              responseMimeType: "application/json",
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
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
      });

      return parseJsonFromLLM(response.text || "{}");
  }
}
