import { BaseAgent } from "./BaseAgent";
import {
  DETECTIVE_AGENT_PROMPT,
  AUDITOR_AGENT_PROMPT,
  INSIDER_AGENT_PROMPT,
  STAT_AGENT_PROMPT
} from "../../constants";

export class DetectiveAgent extends BaseAgent {
  constructor() { super("Detective"); }

  async run(topic: string): Promise<string> {
    return this.executeSearch(
      DETECTIVE_AGENT_PROMPT,
      `Investigate victim stories and scams related to: "${topic}". Find specific user complaints from Reddit/Quora.`
    );
  }
}

export class AuditorAgent extends BaseAgent {
  constructor() { super("Auditor"); }

  async run(topic: string): Promise<string> {
    return this.executeSearch(
      AUDITOR_AGENT_PROMPT,
      `Uncover hidden costs, fees, and real financial requirements for: "${topic}". Ignore "guru" claims.`
    );
  }
}

export class InsiderAgent extends BaseAgent {
  constructor() { super("Insider"); }

  async run(topic: string): Promise<string> {
    return this.executeSearch(
      INSIDER_AGENT_PROMPT,
      `Identify affiliate programs, influencer commissions, and who makes money selling tools for: "${topic}".`
    );
  }
}

export class StatAgent extends BaseAgent {
  constructor() { super("Statistician"); }

  async run(topic: string): Promise<string> {
    return this.executeSearch(
      STAT_AGENT_PROMPT,
      `Find 2024/2025 failure rates, saturation statistics, and median earnings for: "${topic}".`
    );
  }
}
