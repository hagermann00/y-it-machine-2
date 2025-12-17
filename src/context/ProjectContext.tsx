
import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';
import { Project, ResearchData, GenSettings, Branch, Book, PodcastEpisode, PodcastSettings } from '../types';
import { AgentState } from '../services/orchestrator';
import { AuthorAgent } from '../services/agents/AuthorAgent';
import { PodcastService } from '../services/media/PodcastService';
import { generateDemoResearch, generateDemoBook, generateDemoPodcast, isDemoMode } from '../services/demo/DemoModeService';

interface State {
  status: 'INPUT' | 'RESEARCHING' | 'DRAFTING' | 'RESULT' | 'ERROR';
  project: Project | null;
  agentStates: AgentState[];
  error: string | null;
  activeBranchId: string | null;
  isGeneratingPodcast: boolean;
  loadingMessage: string;
}

type Action =
  | { type: 'START_RESEARCH' }
  | { type: 'START_DRAFTING' }
  | { type: 'UPDATE_AGENTS', payload: AgentState[] }
  | { type: 'UPDATE_LOADING_MSG', payload: string }
  | { type: 'RESEARCH_SUCCESS', payload: { topic: string; data: ResearchData; settings: GenSettings; draft: any } }
  | { type: 'SET_ERROR', payload: string }
  | { type: 'RESET' }
  | { type: 'ADD_BRANCH', payload: Branch }
  | { type: 'SET_ACTIVE_BRANCH', payload: string }
  | { type: 'UPDATE_BOOK', payload: Book }
  | { type: 'SET_PODCAST_LOADING', payload: boolean }
  | { type: 'UPDATE_PODCAST', payload: PodcastEpisode };

const initialState: State = {
  status: 'INPUT',
  project: null,
  agentStates: [],
  error: null,
  activeBranchId: null,
  isGeneratingPodcast: false,
  loadingMessage: ''
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'START_RESEARCH':
      return { ...state, status: 'RESEARCHING', error: null, agentStates: [], loadingMessage: 'Initializing Agents...' };
    case 'START_DRAFTING':
      return { ...state, status: 'DRAFTING', loadingMessage: 'Initializing Ghostwriter...' };
    case 'UPDATE_AGENTS':
      return { ...state, agentStates: action.payload };
    case 'UPDATE_LOADING_MSG':
      return { ...state, loadingMessage: action.payload };
    case 'RESEARCH_SUCCESS':
      const firstBranch: Branch = {
        id: Date.now().toString(),
        name: "Original Draft",
        timestamp: Date.now(),
        settings: action.payload.settings,
        book: action.payload.draft
      };
      return {
        ...state,
        status: 'RESULT',
        project: {
          topic: action.payload.topic,
          research: action.payload.data,
          branches: [firstBranch]
        },
        activeBranchId: firstBranch.id,
        loadingMessage: ''
      };
    case 'SET_ERROR':
      return { ...state, status: 'ERROR', error: action.payload, isGeneratingPodcast: false, loadingMessage: '' };
    case 'RESET':
      return initialState;
    case 'ADD_BRANCH':
      return {
        ...state,
        project: state.project ? {
          ...state.project,
          branches: [...state.project.branches, action.payload]
        } : null,
        activeBranchId: action.payload.id
      };
    case 'SET_ACTIVE_BRANCH':
      return { ...state, activeBranchId: action.payload };
    case 'UPDATE_BOOK':
      if (!state.project || !state.activeBranchId) return state;
      const updatedBranches = state.project.branches.map(b =>
        b.id === state.activeBranchId ? { ...b, book: action.payload } : b
      );
      return {
        ...state,
        project: { ...state.project, branches: updatedBranches }
      };
    case 'SET_PODCAST_LOADING':
      return { ...state, isGeneratingPodcast: action.payload };
    case 'UPDATE_PODCAST':
      if (!state.project || !state.activeBranchId) return state;
      const branchesWithPodcast = state.project.branches.map(b =>
        b.id === state.activeBranchId ? { ...b, podcast: action.payload } : b
      );
      return {
        ...state,
        project: { ...state.project, branches: branchesWithPodcast }
      };
    default:
      return state;
  }
};

const ProjectContext = createContext<{
  state: State;
  startInvestigation: (topic: string, settings: GenSettings, overrideResearch?: ResearchData | string) => Promise<void>;
  createBranch: (settings: GenSettings) => Promise<void>;
  resetProject: () => void;
  setActiveBranch: (id: string) => void;
  updateActiveBook: (book: Book) => void;
  generatePodcast: (settings: PodcastSettings) => Promise<void>;
  updatePodcastEpisode: (episode: PodcastEpisode) => void;
  clearCacheForTopic: (topic: string) => void;
  runDemoMode: (topic?: string) => Promise<void>;
} | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Memoize service instances to prevent recreation on every render
  const author = useMemo(() => new AuthorAgent(), []);

  const startInvestigation = async (topic: string, settings: GenSettings, overrideResearch?: ResearchData | string) => {
    dispatch({ type: 'START_RESEARCH' });
    try {
      let researchData: ResearchData;

      // --- PATH A: MANUAL OVERRIDE (UPLOAD) ---
      if (overrideResearch) {

        if (typeof overrideResearch === 'string') {
          // Raw Text / Markdown Mode - Create minimal research data from provided text
          dispatch({ type: 'UPDATE_LOADING_MSG', payload: "📂 PROCESSING UPLOADED INTEL..." });
          dispatch({ type: 'UPDATE_AGENTS', payload: [{ name: "Data Processor", status: 'RUNNING' }] });

          // Create a basic research data structure from uploaded text
          researchData = {
            summary: overrideResearch.substring(0, 500) || "Uploaded research data provided.",
            ethicalRating: 5,
            profitPotential: "Unable to determine",
            marketStats: [],
            hiddenCosts: [],
            caseStudies: [],
            affiliates: []
          };

          dispatch({ type: 'UPDATE_AGENTS', payload: [{ name: "Data Processor", status: 'COMPLETED' }] });
        } else {
          // Strict JSON Mode
          dispatch({ type: 'UPDATE_LOADING_MSG', payload: "📂 INJECTING UPLOADED INTEL..." });
          researchData = overrideResearch;

          // Artificial delay for UX
          await new Promise(resolve => setTimeout(resolve, 800));

          dispatch({
            type: 'UPDATE_AGENTS', payload: [
              { name: "Manual Upload", status: 'COMPLETED' },
              { name: "System Bypass", status: 'COMPLETED' }
            ]
          });
        }

      }
      else {
        // --- PATH B: CACHE LOOKUP (Research is now external, but support cached data) ---
        const CACHE_INDEX_KEY = 'YIT_CACHE_INDEX';
        const MAX_CACHE_ENTRIES = 5;
        const cacheKey = `YIT_RESEARCH_CACHE_${topic.trim().toLowerCase()}`;

        let cachedData: string | null = null;
        try {
          cachedData = localStorage.getItem(cacheKey);
        } catch (e) {
          console.warn("Cache read failed", e);
        }

        if (cachedData) {
          // CACHE HIT
          dispatch({ type: 'UPDATE_LOADING_MSG', payload: "⚡ PRE-EXECUTION QUERY: CACHE HIT..." });
          try {
            researchData = JSON.parse(cachedData);
          } catch (e) {
            // Corrupted cache, remove it
            console.warn("Corrupted cache entry, removing", e);
            localStorage.removeItem(cacheKey);
            cachedData = null;
          }

          if (cachedData) {
            dispatch({
              type: 'UPDATE_AGENTS', payload: [
                { name: "Cache", status: 'COMPLETED' }
              ]
            });
            await new Promise(resolve => setTimeout(resolve, 1200));
          }
        }

        if (!cachedData) {
          // CACHE MISS - Research must be provided externally via Obsidian
          dispatch({ type: 'UPDATE_LOADING_MSG', payload: "⚠️ NO CACHED RESEARCH DATA - PLEASE PROVIDE VIA UPLOAD" });
          dispatch({
            type: 'UPDATE_AGENTS', payload: [
              { name: "External Research", status: 'FAILED', message: "Research data not provided" }
            ]
          });

          // Create placeholder research data
          researchData = {
            summary: `Research for "${topic}" must be provided externally from Obsidian database.`,
            ethicalRating: 5,
            profitPotential: "Unable to determine without research data",
            marketStats: [],
            hiddenCosts: [],
            caseStudies: [],
            affiliates: []
          };
        }
      }

      // --- PHASE 2: DRAFTING (Always Runs) ---
      dispatch({ type: 'START_DRAFTING' });
      dispatch({ type: 'UPDATE_LOADING_MSG', payload: 'Generating book draft...' });

      const draft = await author.generateDraft(
        topic,
        researchData,
        settings
      );

      dispatch({ type: 'RESEARCH_SUCCESS', payload: { topic, data: researchData, settings, draft } });
    } catch (e: any) {
      console.error(e);
      dispatch({ type: 'SET_ERROR', payload: e.message || "Investigation failed." });
    }
  };

  const createBranch = async (settings: GenSettings) => {
    if (!state.project) return;
    try {
      const draft = await author.generateDraft(
        state.project.topic,
        state.project.research,
        settings
      );

      const newBranch: Branch = {
        id: Date.now().toString(),
        name: `Draft ${state.project.branches.length + 1}`,
        timestamp: Date.now(),
        settings: settings,
        book: draft
      };
      dispatch({ type: 'ADD_BRANCH', payload: newBranch });
    } catch (e: any) {
      console.error("Branch generation failed", e);
    }
  };

  const generatePodcast = async (settings: PodcastSettings) => {
    if (!state.project || !state.activeBranchId) return;

    const activeBranch = state.project.branches.find(b => b.id === state.activeBranchId);
    const book = activeBranch?.book;

    dispatch({ type: 'SET_PODCAST_LOADING', payload: true });
    try {
      const script = await PodcastService.generateScript(
        state.project.topic,
        state.project.research,
        settings,
        book
      );

      const audioUrl = await PodcastService.generateAudio(script, settings);

      const episode: PodcastEpisode = {
        id: Date.now().toString(),
        title: script.title,
        script: script.lines,
        audioUrl: audioUrl,
        settings: settings,
        timestamp: Date.now()
      };

      dispatch({ type: 'UPDATE_PODCAST', payload: episode });

    } catch (e: any) {
      console.error("Podcast gen failed", e);
      dispatch({ type: 'SET_ERROR', payload: "Podcast generation failed. " + e.message });
    } finally {
      dispatch({ type: 'SET_PODCAST_LOADING', payload: false });
    }
  };

  const clearCacheForTopic = (topic: string) => {
    const key = `YIT_RESEARCH_CACHE_${topic.trim().toLowerCase()}`;
    localStorage.removeItem(key);
  };

  const updatePodcastEpisode = (episode: PodcastEpisode) => {
    dispatch({ type: 'UPDATE_PODCAST', payload: episode });
  };

  const resetProject = () => dispatch({ type: 'RESET' });
  const setActiveBranch = (id: string) => dispatch({ type: 'SET_ACTIVE_BRANCH', payload: id });
  const updateActiveBook = (book: Book) => dispatch({ type: 'UPDATE_BOOK', payload: book });
  /**
   * DEMO MODE: Theatrical simulated generation for showing off the app
   * Zero API calls - uses pre-built content with dramatic visual presentation
   */
  const runDemoMode = async (topic: string = 'Dropshipping') => {
    dispatch({ type: 'START_RESEARCH' });
    dispatch({ type: 'UPDATE_LOADING_MSG', payload: `🎯 INITIALIZING INVESTIGATION: "${topic.toUpperCase()}"` });
    await new Promise(resolve => setTimeout(resolve, 800));

    // Dramatic agent execution sequence
    const agents = [
      { name: 'Detective', messages: ['Scanning Reddit threads...', 'Analyzing income claims...', 'Cross-referencing failure rates...'] },
      { name: 'Auditor', messages: ['Examining financial disclosures...', 'Calculating hidden costs...', 'Verifying expense reports...'] },
      { name: 'Insider', messages: ['Interviewing practitioners...', 'Gathering testimonials...', 'Documenting case studies...'] },
      { name: 'Statistician', messages: ['Crunching market data...', 'Computing success rates...', 'Generating projections...'] }
    ];

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];

      // Set agent to RUNNING
      const agentStates = agents.map((a, idx) => ({
        name: a.name,
        status: idx < i ? 'COMPLETED' : idx === i ? 'RUNNING' : 'PENDING'
      })) as AgentState[];
      dispatch({ type: 'UPDATE_AGENTS', payload: agentStates });

      // Cycle through dramatic messages for this agent
      for (const msg of agent.messages) {
        dispatch({ type: 'UPDATE_LOADING_MSG', payload: `🔍 ${agent.name.toUpperCase()} AGENT: ${msg}` });
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Mark as complete with satisfaction
      dispatch({ type: 'UPDATE_LOADING_MSG', payload: `✅ ${agent.name.toUpperCase()}: Intelligence gathered!` });
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    // All agents complete with flourish
    dispatch({ type: 'UPDATE_AGENTS', payload: agents.map(a => ({ name: a.name, status: 'COMPLETED' })) as AgentState[] });
    dispatch({ type: 'UPDATE_LOADING_MSG', payload: '🧠 SYNTHESIZING MULTI-AGENT INTELLIGENCE...' });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Dramatic transition to drafting
    dispatch({ type: 'UPDATE_LOADING_MSG', payload: '⚡ RESEARCH COMPLETE. ACTIVATING AUTHOR AGENT...' });
    await new Promise(resolve => setTimeout(resolve, 800));

    dispatch({ type: 'START_DRAFTING' });

    // Dramatic writing sequence - 8 chapters just like the real app
    const writingSteps = [
      '📖 Architecting 8-chapter book structure...',
      '✍️ Chapter 1: THE LIE THEY SOLD YOU',
      '✍️ Chapter 2: THE ROADMAP (WHAT THEY PROMISE)',
      '✍️ Chapter 3: THE REAL MATH',
      '✍️ Chapter 4: CASE STUDIES - WINNERS & LOSERS',
      '✍️ Chapter 5: THE PLATFORM DEEP DIVE',
      '✍️ Chapter 6: THE GURU ECONOMY',
      '✍️ Chapter 7: THE ALTERNATIVES',
      '✍️ Chapter 8: THE FINAL VERDICT',
      '🎨 Designing front cover...',
      '🎨 Designing back cover...',
      '🖼️ Generating 16 visual elements...',
      '🤖 Adding PosiBot interruptions...',
      '📊 Inserting research statistics...',
      '✨ Final polish and formatting...'
    ];

    for (const step of writingSteps) {
      dispatch({ type: 'UPDATE_LOADING_MSG', payload: step });
      await new Promise(resolve => setTimeout(resolve, 450));
    }

    const researchData = generateDemoResearch(topic);
    const demoBook = generateDemoBook(topic, researchData);

    dispatch({ type: 'UPDATE_LOADING_MSG', payload: '🎉 DEMO COMPLETE! Presenting your investigation...' });
    await new Promise(resolve => setTimeout(resolve, 800));

    // Create default settings for demo
    const demoSettings: GenSettings = {
      tone: 'Satirical Forensic',
      visualStyle: 'Noir Documentary',
      lengthLevel: 1,
      imageDensity: 2,
      techLevel: 2,
      textOnlyMode: false
    };

    dispatch({
      type: 'RESEARCH_SUCCESS',
      payload: {
        topic,
        data: researchData,
        settings: demoSettings,
        draft: demoBook
      }
    });
  };

  return (
    <ProjectContext.Provider value={{ state, startInvestigation, createBranch, resetProject, setActiveBranch, updateActiveBook, generatePodcast, updatePodcastEpisode, clearCacheForTopic, runDemoMode }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within ProjectProvider");
  return context;
};
