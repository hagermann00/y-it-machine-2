
import React, { useState } from 'react';
import InputSection from './components/InputSection';
import ResearchDashboard from './components/ResearchDashboard';
import BookReader from './components/BookReader';
import PodcastStudio from './components/PodcastStudio';
import AgentStatus from './components/AgentStatus';
import Loader from './components/Loader'; // Import Loader
import { AppState, Book, Project, Branch, GenSettings, ExportSettings, TrimSize } from './types';
import { BookOpen, PieChart, ArrowLeft, Download, ChevronDown, Plus, GitBranch, Settings, X, Loader2, Mic2 } from 'lucide-react';
import { downloadPdf } from './utils/pdfExport';
import { ProjectProvider, useProject } from './context/ProjectContext';

// Main Content Wrapper to consume Context
const AppContent: React.FC = () => {
  const { state, startInvestigation, createBranch, resetProject, setActiveBranch, updateActiveBook, generatePodcast, updatePodcastEpisode } = useProject();
  const [activeTab, setActiveTab] = useState<'RESEARCH' | 'BOOK' | 'PODCAST'>('RESEARCH');
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
      trimSize: '6x9',
      includeBleed: false,
      imageQuality: 'standard'
  });

  const activeBranch = state.project?.branches.find(b => b.id === state.activeBranchId);

  const executeExport = () => {
    if (activeBranch) {
        downloadPdf(activeBranch.book, exportSettings);
        setShowExportModal(false);
        setShowExportMenu(false);
    }
  };

  if (state.status === 'INPUT' || state.status === 'ERROR') {
    return (
      <>
        {state.status === 'ERROR' && (
          <div className="fixed top-4 left-0 right-0 text-center pointer-events-none z-50">
            <span className="bg-red-600 text-white px-6 py-2 rounded-full shadow-xl inline-block animate-bounce">
              {state.error}
            </span>
            <button onClick={resetProject} className="pointer-events-auto block mx-auto mt-2 bg-black text-white px-4 py-1 rounded text-sm border border-gray-700">Dismiss</button>
          </div>
        )}
        <InputSection 
          onGenerate={startInvestigation} 
          isLoading={false} 
        />
      </>
    );
  }

  if (state.status === 'RESEARCHING') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <div className="mb-8 relative">
           <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-20 animate-pulse"></div>
           <Loader2 className="w-16 h-16 text-yellow-500 animate-spin relative z-10" />
        </div>
        <h2 className="text-2xl font-bold font-mono tracking-widest text-center mb-8">
          DEPLOYING AGENT SWARM
        </h2>
        <AgentStatus agents={state.agentStates} />
      </div>
    );
  }

  if (state.status === 'DRAFTING') {
    return (
        <Loader customMessage={state.loadingMessage || "Generating Draft..."} />
    );
  }

  // Result View
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans flex flex-col">
      <header className="h-16 border-b border-gray-800 bg-black/50 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4 lg:gap-6">
            <button onClick={resetProject} className="text-gray-500 hover:text-white transition-colors flex items-center gap-2 text-sm">
                <ArrowLeft size={16} /> <span className="hidden md:inline">New Topic</span>
            </button>
            <div className="h-6 w-px bg-gray-800"></div>
            
            <div className="relative">
                <button 
                    onClick={() => setShowBranchMenu(!showBranchMenu)}
                    className="flex items-center gap-2 text-sm font-bold text-gray-200 hover:text-white transition-colors bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700"
                >
                    <GitBranch size={16} className="text-yellow-500"/>
                    <span className="truncate max-w-[150px]">{activeBranch?.name || "Select Branch"}</span>
                    <ChevronDown size={14} />
                </button>

                {showBranchMenu && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                        <div className="p-2 border-b border-gray-800 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                            Available Drafts
                        </div>
                        {state.project?.branches.map(branch => (
                            <button
                                key={branch.id}
                                onClick={() => { setActiveBranch(branch.id); setShowBranchMenu(false); setActiveTab('BOOK'); }}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-800 border-l-2 transition-all ${state.activeBranchId === branch.id ? 'border-yellow-500 bg-gray-800/50 text-white' : 'border-transparent text-gray-400'}`}
                            >
                                <div className="font-bold">{branch.name}</div>
                                <div className="text-[10px] text-gray-600">{new Date(branch.timestamp).toLocaleTimeString()}</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
        
        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
            <button 
                onClick={() => setActiveTab('RESEARCH')}
                className={`px-3 md:px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'RESEARCH' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <PieChart size={14} /> <span className="hidden md:inline">Intel</span>
            </button>
            <button 
                onClick={() => setActiveTab('BOOK')}
                className={`px-3 md:px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'BOOK' ? 'bg-yellow-500 text-black shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <BookOpen size={14} /> <span className="hidden md:inline">Book</span>
            </button>
            <button 
                onClick={() => setActiveTab('PODCAST')}
                className={`px-3 md:px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'PODCAST' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <Mic2 size={14} /> <span className="hidden md:inline">Studio</span>
            </button>
        </div>

        <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="text-gray-500 hover:text-white transition-colors flex items-center gap-1" title="Export">
                <Download size={20} /> <ChevronDown size={14} />
            </button>
            {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-1 z-50">
                    <button onClick={() => { setShowExportModal(true); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-800 text-gray-300 hover:text-white flex justify-between items-center">
                        <span>Download PDF...</span> <Settings size={12}/>
                    </button>
                </div>
            )}
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full relative">
        {state.project && (
            <>
                {activeTab === 'RESEARCH' ? (
                    <ResearchDashboard data={state.project.research} />
                ) : activeTab === 'BOOK' ? (
                    <div className="flex flex-col gap-8">
                        {activeBranch ? (
                            <BookReader 
                                book={activeBranch.book} 
                                visualStyle={activeBranch.settings.visualStyle} 
                                imageModelHierarchy={activeBranch.settings.imageModelHierarchy}
                                onUpdateBook={updateActiveBook} 
                            />
                        ) : (
                            <div className="text-center text-gray-500 py-20">No active branch selected.</div>
                        )}

                        <div className="border-t border-gray-800 pt-8 mt-8">
                            <h3 className="text-xl font-bold text-gray-400 mb-6 flex items-center gap-2">
                                <GitBranch size={20} /> Generate Alternative Draft
                            </h3>
                            <InputSection 
                                onGenerate={async (topic, settings) => {
                                  setIsCreatingBranch(true);
                                  await createBranch(settings);
                                  setIsCreatingBranch(false);
                                }} 
                                isLoading={isCreatingBranch} 
                                existingResearchTopic={state.project.topic}
                                defaultSettings={state.project.branches[0]?.settings}
                            />
                        </div>
                    </div>
                ) : (
                    // PODCAST VIEW
                    <PodcastStudio 
                        podcast={activeBranch?.podcast}
                        isGenerating={state.isGeneratingPodcast}
                        onGenerate={generatePodcast}
                        onUpdatePodcast={updatePodcastEpisode}
                    />
                )}
            </>
        )}
      </main>

      {showExportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
                  <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
                      <h3 className="font-bold text-white flex items-center gap-2">
                          <Settings size={18} className="text-yellow-500"/> Export Configuration
                      </h3>
                      <button onClick={() => setShowExportModal(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Trim Size</label>
                          <div className="grid grid-cols-3 gap-2">
                              {(['5x8', '6x9', '7x10'] as TrimSize[]).map(size => (
                                  <button
                                      key={size}
                                      onClick={() => setExportSettings(prev => ({...prev, trimSize: size}))}
                                      className={`py-2 px-3 rounded text-sm font-bold border transition-all ${exportSettings.trimSize === size ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-black text-gray-400 border-gray-700 hover:border-gray-500'}`}
                                  >
                                      {size}"
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Print Options</label>
                          <div className="flex items-center justify-between bg-black p-3 rounded border border-gray-800">
                              <span className="text-sm text-gray-300">Include Bleed (+0.125")</span>
                              <button 
                                onClick={() => setExportSettings(prev => ({...prev, includeBleed: !prev.includeBleed}))}
                                className={`w-12 h-6 rounded-full transition-colors relative ${exportSettings.includeBleed ? 'bg-green-500' : 'bg-gray-700'}`}
                              >
                                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${exportSettings.includeBleed ? 'translate-x-6' : ''}`}></div>
                              </button>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 bg-black/50 border-t border-gray-800 flex gap-3">
                      <button onClick={() => setShowExportModal(false)} className="flex-1 py-3 rounded font-bold text-gray-400 hover:bg-gray-800 transition-colors">Cancel</button>
                      <button onClick={executeExport} className="flex-1 py-3 rounded font-bold bg-yellow-500 text-black hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2">
                          <Download size={18}/> Generate PDF
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
};

export default App;
