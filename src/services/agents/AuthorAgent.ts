
import { ProviderRegistry } from "../core/ProviderRegistry";
import { getModel } from "../core/ModelRegistry";
import { parseJsonFromLLM } from "../../utils/jsonParser";
import { BookSchema, ValidatedBook } from "../core/SchemaValidator";
import { AUTHOR_SYSTEM_PROMPT } from "../../constants";
import { ResearchData, GenSettings } from "../../types";

export class AuthorAgent {

    public async generateDraft(topic: string, research: ResearchData, settings: GenSettings): Promise<ValidatedBook> {

        // 1. Resolve Provider
        // Default to Gemini Flash if not specified (legacy behavior)
        const modelId = settings.writingModel || 'gemini-2.5-flash';
        const modelDef = getModel(modelId);

        // Fallback if model ID changed/deprecated
        if (!modelDef) {
            console.warn(`Model ${modelId} not found, falling back to gemini-2.5-flash`);
        }
        const safeModelId = modelDef ? modelId : 'gemini-2.5-flash';
        const safeProviderId = modelDef ? modelDef.provider : 'google';

        const provider = ProviderRegistry.getInstance().getProvider(safeProviderId);

        // 2. Build Prompt
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

        const prompt = `
        Topic: ${topic}
        Research Summary: ${JSON.stringify(research.summary)}
        Market Stats: ${JSON.stringify(research.marketStats)}
        Case Studies: ${JSON.stringify(research.caseStudies)}
        User Constraints: ${constraints}
        Custom Spec: ${settings.customSpec || "Use Standard Spec"}
        Cover Art Instructions:
        Front: ${settings.frontCoverPrompt || "Auto-generate based on Y-It Brand (Yellow/Black/Bold)"}
        Back: ${settings.backCoverPrompt || "Auto-generate based on Y-It Brand"}
        
        CRITICAL OUTPUT INSTRUCTIONS:
        You must return a valid JSON object. Do not wrap in markdown code blocks if possible, but if you do, the parser handles it.
        
        Structure:
        {
          "title": "string",
          "subtitle": "string",
          "frontCover": { 
              "titleText": "...", 
              "subtitleText": "...", 
              "visualDescription": "..." 
          },
          "backCover": { 
              "blurb": "...", 
              "visualDescription": "..." 
          },
          "chapters": [
            {
               "number": 1,
               "title": "...",
               "content": "Full markdown content of the chapter...",
               "posiBotQuotes": [{ "position": "LEFT", "text": "..." }],
               "visuals": [{ "type": "HERO (or CHART/CALLOUT)", "description": "...", "caption": "..." }]
            }
          ]
        }
    `;

        try {
            // 3. Generate
            console.log(`Generating draft with ${safeModelId}...`);
            const resultText = await provider.generateText(safeModelId, prompt, {
                systemPrompt: AUTHOR_SYSTEM_PROMPT + "\n\nIMPORTANT: OUTPUT MUST BE VALID JSON.",
                jsonMode: true,
                maxTokens: 8192, // High limit for books
                temperature: 0.7
            });

            // 4. Parse & Validate
            const rawData = parseJsonFromLLM(resultText);
            return BookSchema.parse(rawData);

        } catch (error) {
            console.error("AuthorAgent generation failed:", error);
            throw error;
        }
    }
}
