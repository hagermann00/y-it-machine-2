/**
 * DEPRECATED: Research Coordinator
 *
 * This file has been deprecated as research functionality is being moved to Obsidian database.
 * The orchestrator pattern is no longer used for research agent coordination.
 *
 * Keeping this file with minimal exports only for backward compatibility with ProjectContext.
 */

export type AgentStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface AgentState {
  name: string;
  status: AgentStatus;
  message?: string;
}

/**
 * DEPRECATED: ResearchCoordinator class
 *
 * All research functionality is deprecated and will no longer be executed.
 * This class is kept only as a stub to prevent breaking changes in ProjectContext.
 *
 * DO NOT USE - This will throw an error if called.
 */
export class ResearchCoordinator {
  constructor() {
    console.warn("ResearchCoordinator is deprecated and no longer functional.");
  }

  async execute(): Promise<never> {
    throw new Error("ResearchCoordinator is deprecated. Research functionality has been moved to Obsidian database.");
  }

  async normalizeLog(): Promise<never> {
    throw new Error("ResearchCoordinator is deprecated. Research functionality has been moved to Obsidian database.");
  }
}
