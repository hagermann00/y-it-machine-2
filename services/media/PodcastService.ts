
import { LLMClient } from "../core/LLMClient";
import { ResearchData, PodcastSettings, PodcastScriptLine, Book } from "../../types";
import { PODCAST_PRODUCER_PROMPT } from "../../constants";
import { PodcastScriptSchema, ValidatedPodcastScript } from "../core/SchemaValidator";
import { parseJsonFromLLM } from "../../utils/jsonParser";
import { Type } from "@google/genai";

export class PodcastService {
  private static llm = LLMClient.getInstance();

  /**
   * Phase 1: Generate the script using a thinking model.
   */
  public static async generateScript(
    topic: string, 
    research: ResearchData, 
    settings: PodcastSettings,
    book?: Book
  ): Promise<ValidatedPodcastScript> {
    
    const client = this.llm.getClient();
    
    const lengthMultiplier = settings.lengthLevel === 1 ? "Short (2 minutes)" : settings.lengthLevel === 3 ? "Deep Dive (10 minutes)" : "Standard (5 minutes)";
    
    // Add Book Context if available (This parallels the narrative of the generated book)
    let bookContext = "";
    if (book) {
        const chapterSummaries = book.chapters.map(c => `Chapter ${c.number} (${c.title}): ${c.content.substring(0, 500)}...`).join('\n');
        bookContext = `
        THE BOOK BEING DISCUSSED:
        Title: ${book.title}
        Subtitle: ${book.subtitle}
        
        KEY NARRATIVE POINTS (Discuss these):
        ${chapterSummaries}
        
        INSTRUCTION: The hosts have read this book. They should discuss its specific "Lie", "Math", and "Hidden Killers". Quote the book's title directly.
        `;
    }

    // Thinking Budget based on complexity
    const thinkingBudget = settings.lengthLevel === 3 ? 2048 : 0; 

    const response = await this.llm.generateContentWithRetry({
        model: 'gemini-2.5-flash',
        contents: `
            Topic: ${topic}
            Research Data: ${JSON.stringify(research)}
            ${bookContext}
            
            Configuration:
            - Style: ${settings.conversationStyle}
            - Length: ${lengthMultiplier}
            
            Create a podcast script dialogue between Host 1 and Host 2.
            If a Book is provided, structure the episode as a review/reaction to that specific book.
            If no Book is provided, structure it as an investigative report on the topic.
        `,
        config: {
            systemInstruction: PODCAST_PRODUCER_PROMPT,
            thinkingConfig: { thinkingBudget: thinkingBudget },
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    lines: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                speaker: { type: Type.STRING, enum: ['Host 1', 'Host 2'] },
                                text: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        }
    });

    const rawData = parseJsonFromLLM(response.text || "{}");
    return PodcastScriptSchema.parse(rawData);
  }

  /**
   * Phase 2: Generate Audio using Multi-Speaker TTS
   */
  public static async generateAudio(
    script: ValidatedPodcastScript, 
    settings: PodcastSettings
  ): Promise<string> { // Returns Blob URL
    
    const client = this.llm.getClient();

    const dialoguePrompt = script.lines.map(line => `${line.speaker}: ${line.text}`).join('\n');

    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: {
            parts: [{ text: dialoguePrompt }]
        },
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: [
                        {
                            speaker: 'Host 1',
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.host1Voice } }
                        },
                        {
                            speaker: 'Host 2',
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.host2Voice } }
                        }
                    ]
                }
            }
        }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data generated.");
    }

    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Wrap in WAV header for broad browser compatibility
    const wavBytes = this.addWavHeader(bytes, 24000, 1);
    const wavBlob = new Blob([wavBytes], { type: 'audio/wav' });
    
    return URL.createObjectURL(wavBlob);
  }

  // Helper to add WAV header to raw PCM
  private static addWavHeader(samples: Uint8Array, sampleRate: number, numChannels: number): Uint8Array {
    const buffer = new ArrayBuffer(44 + samples.length);
    const view = new DataView(buffer);

    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    // RIFF chunk length
    view.setUint32(4, 36 + samples.length, true);
    // RIFF type
    this.writeString(view, 8, 'WAVE');
    // format chunk identifier
    this.writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, numChannels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * numChannels * 2, true); // 16-bit = 2 bytes
    // block align (channel count * bytes per sample)
    view.setUint16(32, numChannels * 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    this.writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, samples.length, true);

    // Write audio data
    const bytes = new Uint8Array(buffer);
    bytes.set(samples, 44);

    return bytes;
  }

  private static writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
