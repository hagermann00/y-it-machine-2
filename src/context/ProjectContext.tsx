
import React, { createContext, useContext, useReducer, ReactNode, useMemo, useEffect } from 'react';
import { Project, ResearchData, GenSettings, Branch } from '../types';
import { AgentState, ResearchCoordinator } from '../services/orchestrator';
import { AuthorAgent } from '../services/agents/AuthorAgent';

interface State {
  status: 'INPUT' | 'RESEARCHING' | 'DRAFTING' | 'RESULT' | 'ERROR';
  project: Project | null;
  agentStates: AgentState[];
  error: string | null;
  activeBranchId: string | null;
}

type Action =
  | { type: 'START_RESEARCH' }
  | { type: 'UPDATE_AGENTS', payload: AgentState[] }
  | { type: 'RESEARCH_SUCCESS', payload: { topic: string; data: ResearchData; settings: GenSettings; draft: any } }
  | { type: 'SET_ERROR', payload: string }
  | { type: 'RESET' }
  | { type: 'ADD_BRANCH', payload: Branch }
  | { type: 'SET_ACTIVE_BRANCH', payload: string };

const initialState: State = {
  status: 'INPUT',
  project: null,
  agentStates: [],
  error: null,
  activeBranchId: null,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'START_RESEARCH':
      return { ...state, status: 'RESEARCHING', error: null, agentStates: [] };
    case 'UPDATE_AGENTS':
      return { ...state, agentStates: action.payload };
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
        activeBranchId: firstBranch.id
      };
    case 'SET_ERROR':
      return { ...state, status: 'ERROR', error: action.payload };
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

  const startInvestigation = async (topic: string, settings: GenSettings) => {
    dispatch({ type: 'START_RESEARCH' });
    try {
      const researchData = await coordinator.execute(topic, (agentStates) => {
        dispatch({ type: 'UPDATE_AGENTS', payload: agentStates });
      });

      // Phase 2: Drafting
      const draft = await author.generateDraft(topic, researchData, settings);

      dispatch({ type: 'RESEARCH_SUCCESS', payload: { topic, data: researchData, settings, draft } });
    } catch (e: any) {
      console.error(e);
      dispatch({ type: 'SET_ERROR', payload: e.message || "Investigation failed." });
    }
  };

  const createBranch = async (settings: GenSettings) => {
    if (!state.project) return;
    try {
      const draft = await author.generateDraft(state.project.topic, state.project.research, settings);
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

  const resetProject = () => dispatch({ type: 'RESET' });
  const setActiveBranch = (id: string) => dispatch({ type: 'SET_ACTIVE_BRANCH', payload: id });

  return (
    <ProjectContext.Provider value={{ state, startInvestigation, createBranch, resetProject, setActiveBranch }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within ProjectProvider");
  return context;
};
