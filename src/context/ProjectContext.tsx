
import React, { createContext, useContext, useReducer, ReactNode, useMemo, useEffect } from 'react';
import { Project, ResearchData, GenSettings, Branch } from '../types';
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Project, ResearchData, GenSettings, Branch, Book, PodcastEpisode, PodcastSettings } from '../types';
import { AgentState, ResearchCoordinator } from '../services/orchestrator';
import { AuthorAgent } from '../services/agents/AuthorAgent';
import { PodcastService } from '../services/media/PodcastService';

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
  | { type: 'IMPORT_SUCCESS', payload: { topic: string; book: Book } }
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
    case 'IMPORT_SUCCESS':
      const importedBranch: Branch = {
          id: Date.now().toString(),
          name: "Imported Manuscript",
          timestamp: Date.now(),
          settings: { 
             tone: 'Imported', visualStyle: 'Imported', 
             lengthLevel: 2, imageDensity: 2, techLevel: 2, customSpec: "Imported" 
          }, // Dummy settings
          book: action.payload.book
      };
      // Dummy Research data for context if needed
      const dummyResearch: ResearchData = {
          summary: "Manually imported manuscript.",
          ethicalRating: 5,
          profitPotential: "Unknown",
          marketStats: [],
          hiddenCosts: [],
          caseStudies: [],
          affiliates: []
      };
      return {
        ...state,
        status: 'RESULT',
        project: {
          topic: action.payload.topic,
          research: dummyResearch,
          branches: [importedBranch]
        },
        activeBranchId: importedBranch.id,
        loadingMessage: ''
      };
    case 'SET_ERROR':
      return { ...state, status: 'ERROR', error: action.payload, isGeneratingPodcast: false, loadingMessage: '' };
    case 'RESET':
      localStorage.removeItem('y_it_nano_project'); // Clear storage on reset
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
  importManuscript: (book: Book) => void;
  resetProject: () => void;
  setActiveBranch: (id: string) => void;
  updateActiveBook: (book: Book) => void;
  generatePodcast: (settings: PodcastSettings) => Promise<void>;
  updatePodcastEpisode: (episode: PodcastEpisode) => void;
  clearCacheForTopic: (topic: string) => void;
} | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  // Hydrate state from localStorage if available
  const [state, dispatch] = useReducer(reducer, initialState, (defaultState) => {
    try {
      const stored = localStorage.getItem('y_it_nano_project');
      if (stored) {
        const parsedProject = JSON.parse(stored);
        // Basic validation: Check if it has branches
        if (parsedProject && parsedProject.branches && parsedProject.branches.length > 0) {
           return {
             ...defaultState,
             status: 'RESULT',
             project: parsedProject,
             activeBranchId: parsedProject.branches[0].id
           };
        }
      }
    } catch (e) {
      console.warn("Failed to rehydrate project state:", e);
    }
    return defaultState;
  });

  // Services: Memoized to prevent re-instantiation on every render
  const coordinator = useMemo(() => new ResearchCoordinator(), []);
  const author = useMemo(() => new AuthorAgent(), []);

  // Persistence: Save project to localStorage whenever it changes
  useEffect(() => {
    if (state.project) {
      localStorage.setItem('y_it_nano_project', JSON.stringify(state.project));
    }
  }, [state.project]);

  const startInvestigation = async (topic: string, settings: GenSettings, overrideResearch?: ResearchData | string) => {
    dispatch({ type: 'START_RESEARCH' });
    try {
      let researchData: ResearchData;

      // --- PATH A: MANUAL OVERRIDE (UPLOAD) ---
      if (overrideResearch) {
          
          if (typeof overrideResearch === 'string') {
              // Raw Text / Markdown Mode
              dispatch({ type: 'UPDATE_LOADING_MSG', payload: "🧩 PARSING RAW INTEL..." });
              dispatch({ type: 'UPDATE_AGENTS', payload: [{ name: "Normalizer", status: 'RUNNING' }] });
              
              researchData = await coordinator.normalizeLog(overrideResearch);
              
              dispatch({ type: 'UPDATE_AGENTS', payload: [{ name: "Normalizer", status: 'COMPLETED' }] });
          } else {
              // Strict JSON Mode
              dispatch({ type: 'UPDATE_LOADING_MSG', payload: "📂 INJECTING UPLOADED INTEL..." });
              researchData = overrideResearch;
              
              // Artificial delay for UX
              await new Promise(resolve => setTimeout(resolve, 800));
              
              dispatch({ type: 'UPDATE_AGENTS', payload: [
                { name: "Manual Upload", status: 'COMPLETED' },
                { name: "System Bypass", status: 'COMPLETED' }
              ]});
          }

      } 
      else {
          // --- PATH B: STANDARD EXECUTION ---
          const cacheKey = `YIT_RESEARCH_CACHE_${topic.trim().toLowerCase()}`;
          const cachedData = localStorage.getItem(cacheKey);

          if (cachedData) {
              // CACHE HIT
              dispatch({ type: 'UPDATE_LOADING_MSG', payload: "⚡ PRE-EXECUTION QUERY: CACHE HIT..." });
              researchData = JSON.parse(cachedData);
              dispatch({ type: 'UPDATE_AGENTS', payload: [
                { name: "Detective", status: 'COMPLETED' },
                { name: "Auditor", status: 'COMPLETED' },
                { name: "Insider", status: 'COMPLETED' },
                { name: "Statistician", status: 'COMPLETED' }
              ]});
              await new Promise(resolve => setTimeout(resolve, 1200));
          } else {
              // CACHE MISS - FULL SWARM
              researchData = await coordinator.execute(topic, (agentStates) => {
                dispatch({ type: 'UPDATE_AGENTS', payload: agentStates });
              });
              try {
                localStorage.setItem(cacheKey, JSON.stringify(researchData));
              } catch(e) { console.warn("Cache write failed", e); }
          }
      }

      // --- PHASE 2: DRAFTING (Always Runs) ---
      dispatch({ type: 'START_DRAFTING' });
      
      const draft = await author.generateDraft(
          topic, 
          researchData, 
          settings, 
          (msg) => dispatch({ type: 'UPDATE_LOADING_MSG', payload: msg })
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
          settings,
          (msg) => console.log("Branch Progress:", msg)
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
       // Dispatch error so the user knows something went wrong
       dispatch({ type: 'SET_ERROR', payload: "Failed to create new draft: " + (e.message || "Unknown error") });
    }
  };

  const importManuscript = (book: Book) => {
      dispatch({ type: 'IMPORT_SUCCESS', payload: { topic: book.title, book } });
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

  return (
    <ProjectContext.Provider value={{ state, startInvestigation, createBranch, importManuscript, resetProject, setActiveBranch, updateActiveBook, generatePodcast, updatePodcastEpisode, clearCacheForTopic }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within ProjectProvider");
  return context;
};
