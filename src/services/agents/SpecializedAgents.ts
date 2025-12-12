/**
 * Specialized Research Agents
 * These agents perform parallel research on a topic from different angles.
 * 
 * NOTE: These are placeholder implementations pending full Kno-It integration.
 * They currently use the legacy LLMClient (Gemini-only) for backwards compatibility.
 */

import { LLMClient } from "../core/LLMClient";

// Base Agent class
abstract class BaseAgent {
    abstract name: string;
    protected llm: LLMClient;

    constructor() {
        this.llm = LLMClient.getInstance();
    }

    abstract run(topic: string): Promise<string>;
}

/**
 * Detective Agent - Investigates Reddit, forums, and social proof
 */
export class DetectiveAgent extends BaseAgent {
    name = "Detective";

    async run(topic: string): Promise<string> {
        try {
            const response = await this.llm.generateContentWithRetry({
                model: 'gemini-2.5-flash',
                contents: `
                    You are a REDDIT DETECTIVE investigating "${topic}".
                    Search for:
                    - Common complaints and failure stories
                    - Success claims vs reality
                    - Red flags and warning signs
                    - Typical user experiences
                    
                    Format: Write a detailed investigative report as if you found this on Reddit.
                `,
                config: { systemInstruction: "You are a skeptical investigator who searches Reddit and social media." }
            });
            return response.text || "[Detective found no evidence]";
        } catch (e) {
            console.error("Detective Agent failed:", e);
            return "[Detective Agent: Investigation failed. Proceeding with limited data.]";
        }
    }
}

/**
 * Auditor Agent - Analyzes financial claims and hidden costs
 */
export class AuditorAgent extends BaseAgent {
    name = "Auditor";

    async run(topic: string): Promise<string> {
        try {
            const response = await this.llm.generateContentWithRetry({
                model: 'gemini-2.5-flash',
                contents: `
                    You are a FINANCIAL AUDITOR examining "${topic}".
                    Analyze:
                    - Advertised vs actual startup costs
                    - Hidden fees and ongoing expenses
                    - Revenue claims vs realistic expectations
                    - Time investment required
                    
                    Be ruthlessly honest about the numbers.
                `,
                config: { systemInstruction: "You are a forensic accountant who exposes financial lies." }
            });
            return response.text || "[Auditor found no financial data]";
        } catch (e) {
            console.error("Auditor Agent failed:", e);
            return "[Auditor Agent: Audit failed. Proceeding with estimated figures.]";
        }
    }
}

/**
 * Insider Agent - Gathers testimonials and case studies
 */
export class InsiderAgent extends BaseAgent {
    name = "Insider";

    async run(topic: string): Promise<string> {
        try {
            const response = await this.llm.generateContentWithRetry({
                model: 'gemini-2.5-flash',
                contents: `
                    You are an INSIDER SOURCE who knows the truth about "${topic}".
                    Provide:
                    - 2-3 detailed case studies (mix of winners and losers)
                    - Behind-the-scenes information
                    - What the gurus don't tell you
                    - Who actually profits in this ecosystem
                    
                    Write as someone who has been in the industry.
                `,
                config: { systemInstruction: "You are a disillusioned industry insider sharing hidden truths." }
            });
            return response.text || "[Insider has no intel]";
        } catch (e) {
            console.error("Insider Agent failed:", e);
            return "[Insider Agent: Intel gathering failed. Using general knowledge.]";
        }
    }
}

/**
 * Stat Agent - Compiles statistics and market data
 */
export class StatAgent extends BaseAgent {
    name = "Statistician";

    async run(topic: string): Promise<string> {
        try {
            const response = await this.llm.generateContentWithRetry({
                model: 'gemini-2.5-flash',
                contents: `
                    You are a DATA SCIENTIST analyzing "${topic}".
                    Compile:
                    - Industry-wide success/failure rates (be realistic!)
                    - Average income statistics (median, not mean)
                    - Market saturation indicators
                    - Year-over-year trends
                    - Comparison to traditional alternatives
                    
                    Use specific numbers and cite plausible sources.
                `,
                config: { systemInstruction: "You are a statistician who only trusts hard data." }
            });
            return response.text || "[Statistician has no data]";
        } catch (e) {
            console.error("Stat Agent failed:", e);
            return "[Stat Agent: Data collection failed. Using industry averages.]";
        }
    }
}
