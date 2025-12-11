
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
  startInvestigation: (topic: string, settings: GenSettings) => Promise<void>;
  createBranch: (settings: GenSettings) => Promise<void>;
  resetProject: () => void;
  setActiveBranch: (id: string) => void;
  updateActiveBook: (book: Book) => void;
  generatePodcast: (settings: PodcastSettings) => Promise<void>;
  updatePodcastEpisode: (episode: PodcastEpisode) => void;
} | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const coordinator = new ResearchCoordinator();
  const author = new AuthorAgent();

  const startInvestigation = async (topic: string, settings: GenSettings) => {
    dispatch({ type: 'START_RESEARCH' });
    try {
      // Phase 1: Research
      const researchData = await coordinator.execute(topic, (agentStates) => {
        dispatch({ type: 'UPDATE_AGENTS', payload: agentStates });
      });

      // Phase 2: Drafting
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
      // Branch creation also triggers the multi-step drafting process
      // We don't set global 'DRAFTING' status here because we might want to keep the UI interactive,
      // or we should handle a "Branch Creating" state. For now, we'll let the user wait.
      // But typically we should show a loader. 
      // The InputSection handles `isLoading` prop locally, but we can update that logic.
      
      // Ideally, pass a callback even here if we want to bubble up progress.
      const draft = await author.generateDraft(
          state.project.topic, 
          state.project.research, 
          settings,
          (msg) => console.log("Branch Progress:", msg) // Just log for now or wire up if needed
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
          // 1. Script (Now includes Book context if available)
          const script = await PodcastService.generateScript(
              state.project.topic,
              state.project.research,
              settings,
              book
          );

          // 2. Audio
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

  const updatePodcastEpisode = (episode: PodcastEpisode) => {
      dispatch({ type: 'UPDATE_PODCAST', payload: episode });
  };

  const resetProject = () => dispatch({ type: 'RESET' });
  const setActiveBranch = (id: string) => dispatch({ type: 'SET_ACTIVE_BRANCH', payload: id });
  const updateActiveBook = (book: Book) => dispatch({ type: 'UPDATE_BOOK', payload: book });

  return (
    <ProjectContext.Provider value={{ state, startInvestigation, createBranch, resetProject, setActiveBranch, updateActiveBook, generatePodcast, updatePodcastEpisode }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within ProjectProvider");
  return context;
};
