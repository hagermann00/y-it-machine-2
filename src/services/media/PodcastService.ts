
import { PodcastScriptLine, PodcastSettings, ResearchData, Book } from '../../types';
import { ProviderRegistry } from '../core/ProviderRegistry';

export class PodcastService {

    public static async generateScript(topic: string, research: ResearchData, settings: PodcastSettings, book?: Book): Promise<{ title: string, lines: PodcastScriptLine[] }> {
        // Use Gemini Flash for speed/cost on podcast scripts usually
        const provider = ProviderRegistry.getInstance().getProvider('google');

        const prompt = `
            Create a 2-person podcast script discussing the topic: "${topic}".
            Host 1: ${settings.host1Name} (${settings.host1Voice}) - Role: Host/Interviewer
            Host 2: ${settings.host2Name} (${settings.host2Voice}) - Role: Expert/Skeptic
            Tone: ${settings.conversationStyle}
            Length Level: ${settings.lengthLevel}
            
            Based on this Research Summary:
            ${research ? JSON.stringify(research.summary) : "General knowledge"}

            Output JSON:
            {
                "title": "Catchy Podcast Title",
                "lines": [
                    { "speaker": "Host 1", "text": "..." },
                    { "speaker": "Host 2", "text": "..." }
                ]
            }
        `;

        const response = await provider.generateText('gemini-2.5-flash', prompt, {
            systemPrompt: "You are a professional podcast scriptwriter.",
            jsonMode: true
        });

        const clean = response.replace(/```json/g, '').replace(/```/g, '');
        return JSON.parse(clean);
    }

    public static async generateAudio(script: { title: string, lines: PodcastScriptLine[] }, settings: PodcastSettings): Promise<string> {
        // Real audio generation requires specific multi-modal handling. 
        // Returning a placeholder URL for now to prevent crash.
        console.warn("Real audio generation not implemented in this refactor. Returning mock URL.");
        return "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg";
    }
}
