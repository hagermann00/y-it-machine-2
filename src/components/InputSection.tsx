
import React, { useState, useRef, useEffect } from 'react';
import { Search, Settings, ChevronDown, ChevronUp, AlertCircle, GitBranch, Zap, Plus, Image as ImageIcon, Trash2, Upload, FileText, Activity, Smile, Bot, Copy, Clipboard, FileEdit, Calculator, BookOpen, Palette, Sliders, FileJson, Scale, ShieldAlert, ChevronLeft, ChevronRight, Database, RefreshCcw, FileUp, ToggleRight, ToggleLeft, Check, Save, Download, Book } from 'lucide-react';
import { GenSettings, ImageModelID, ResearchData } from '../types';
import { IMAGE_MODELS } from '../constants';
import { useProject } from '../context/ProjectContext';
import { ResearchDataSchema } from '../services/core/SchemaValidator';
import { parseManuscript } from '../utils/manuscriptParser';

interface InputSectionProps {
  onGenerate: (topic: string, settings: GenSettings, overrideResearch?: ResearchData | string) => void;
  isLoading: boolean;
  existingResearchTopic?: string;
  defaultSettings?: GenSettings;
}

interface ChapterConfig {
  id: number;
  title: string; // For addendums or specific titles
  outline: string; // The main brief
  customInstructions: string; // Merged field: Content + Visuals
  pages: number;
  words: number;
  posibots: number;
  techBars: number;
  funnyImages: number;
  techLevel: number; // 0-100
  humorLevel: number; // 0-100
  manuscript: string; // Override text
}

interface GlobalConfig {
  broadPrompt: string;
  bookStructure: string;
  tone: string;
  toneThrottle: number;
  visualProfile: string; 
  colorScheme: string;
  // Standard Rules
  posibotRules: string;
  techImageRules: string;
  artisticImageRules: string;
  // System
  kdpRules: string;
  systemicAdjustments: string;
  technicalLevel: number;
  humorBalance: number;
  chapterTitlePrompt: string;
}

const PLACEHOLDERS = {
    broadPrompt: "DEFINITION: The overarching creative direction and thematic summary for the entire book. Sets the conceptual foundation that all chapters and visuals should align with.",
    bookStructure: "DEFINITION: High-level structural blueprint including chapter count, section types, pacing rhythm, and placement of recurring elements (case studies, PosiBot interruptions, visual breaks).",
    tone: "DEFINITION: The dominant voice and attitude of the writing. Example values: 'Satirical Forensic', 'Empathetic Cynic', 'Deadpan Academic'. Must remain consistent across all content.",
    visualProfile: "DEFINITION: The overarching visual identity governing all imagery—style references, mood, texture, and aesthetic family. Ensures visual cohesion across title pages, diagrams, and artistic pieces.",
    colorScheme: "DEFINITION: Primary color palette for all visual elements. Format as comma-separated values. Example: 'Black/White/Yellow'. All generated images must adhere to this palette.",
    posibotRules: "DEFINITION: Behavioral guidelines for the PosiBot character. Defines when PosiBot appears, what triggers interruptions, speech patterns, and the type of delusional optimism employed.",
    techImageRules: "DEFINITION: Specifications for technical/informational imagery—charts, diagrams, flowcharts, data visualizations. Defines style (high contrast, gritty, corporate parody) and thematic approach.",
    artisticImageRules: "DEFINITION: Specifications for artistic/conceptual imagery—chapter title pages, mood pieces, symbolic illustrations. Defines aesthetic family (e.g., surrealist noir, digital grit) and recurring visual motifs.",
    kdpRules: "DEFINITION: Amazon KDP technical specifications. Must include: Trim size, margin widths (outer and gutter), mirror margin setting, bleed requirements, DPI minimums.",
    systemicAdjustments: "DEFINITION: Any global overrides or modifications to default behaviors—temporary tonal shifts, experimental formatting, or per-book exceptions to standard rules.",
    chapterTitlePrompt: "DEFINITION: The default image generation prompt template for chapter title pages. Should reference visual style, color constraints, and thematic symbolism."
};

const DUMMY_JSON_TEMPLATE = {
    summary: "Brief overview of the hustle and why it fails.",
    ethicalRating: 5,
    profitPotential: "$0 - $500 / month",
    marketStats: [{ label: "Failure Rate", value: "99%", context: "Based on 2024 survey" }],
    hiddenCosts: [{ label: "Ads", value: "$500/mo", context: "Min budget" }],
    caseStudies: [{ name: "User X", type: "LOSER", background: "Teacher", strategy: "Ads", outcome: "Broke", revenue: "-$2000" }],
    affiliates: [{ program: "Tool Y", type: "WRITER", commission: "$50", notes: "Primary driver" }]
};

export default function InputSection({ onGenerate, isLoading, existingResearchTopic, defaultSettings }: InputSectionProps) {
  const [topic, setTopic] = useState(existingResearchTopic || '');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [isCached, setIsCached] = useState(false);
  const { clearCacheForTopic, importManuscript } = useProject();
  
  // --- Upload State ---
  const [uploadedResearch, setUploadedResearch] = useState<ResearchData | null>(null);
  const [rawResearchUpload, setRawResearchUpload] = useState<string | null>(null);
  const [bypassResearch, setBypassResearch] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const manuscriptInputRef = useRef<HTMLInputElement>(null);

  // --- Presets State ---
  const [presets, setPresets] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  
  // --- Metrics ---
  const [chapterCount, setChapterCount] = useState(8);
  const [addendumCount, setAddendumCount] = useState(2);
  const [targetTotalPages, setTargetTotalPages] = useState(80); 

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  // --- Global State ---
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
    broadPrompt: '',
    bookStructure: '',
    tone: 'Satirical Forensic',
    toneThrottle: 80,
    visualProfile: 'Surrealist noir, digital grit, silhouettes of failure.', 
    colorScheme: 'Black/White/Yellow',
    posibotRules: 'Interrupts with toxic positivity when math gets too real.',
    techImageRules: 'High contrast diagrams with red arrows indicating loss.',
    artisticImageRules: 'Surrealist noir concept art, high contrast.',
    kdpRules: 'Trim: 6x9. Margins: 0.5" Outer, 0.75" Gutter. Mirror Margins enabled.',
    systemicAdjustments: '',
    technicalLevel: 70,
    humorBalance: 60,
    chapterTitlePrompt: 'Surrealist noir concept art, high contrast, danger yellow accents, symbolic of the chapter theme.',
  });

  // --- Chapters State ---
  const [chapters, setChapters] = useState<ChapterConfig[]>(
    Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      title: '',
      outline: '',
      customInstructions: '', 
      pages: 10,
      words: 2500,
      techBars: 2,
      funnyImages: 1,
      posibots: 2,
      techLevel: 50,
      humorLevel: 50,
      manuscript: ''
    }))
  );

  const [addendums, setAddendums] = useState<ChapterConfig[]>(
    Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: '',
      outline: '',
      customInstructions: '',
      pages: 5,
      words: 1250,
      techBars: 1,
      funnyImages: 0,
      posibots: 1,
      techLevel: 50,
      humorLevel: 50,
      manuscript: ''
    }))
  );

  // --- Effects ---

  // Check Cache Logic
  useEffect(() => {
    if (!topic || bypassResearch) {
        setIsCached(false);
        return;
    }
    const key = `YIT_RESEARCH_CACHE_${topic.trim().toLowerCase()}`;
    setIsCached(!!localStorage.getItem(key));
  }, [topic, bypassResearch]);

  // Ensure pagination doesn't get stuck out of bounds if chapters are reduced
  useEffect(() => {
    const maxPage = Math.ceil(chapterCount / ITEMS_PER_PAGE) || 1;
    if (currentPage > maxPage) {
        setCurrentPage(maxPage);
    }
  }, [chapterCount]);

  // Load Presets List
  useEffect(() => {
    const saved = localStorage.getItem('YIT_CONFIG_PRESETS');
    if (saved) {
        setPresets(Object.keys(JSON.parse(saved)));
    }
  }, []);

  // --- Helpers ---
  
  const handleClearCache = () => {
      clearCacheForTopic(topic);
      setIsCached(false);
  };

  const updateChapter = (id: number, field: keyof ChapterConfig, value: any) => {
    setChapters(prev => prev.map(ch => ch.id === id ? { ...ch, [field]: value } : ch));
  };
  
  const updateAddendum = (id: number, field: keyof ChapterConfig, value: any) => {
    setAddendums(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  // Auto-distribute total pages
  const handleSetTotalPages = (total: number) => {
      setTargetTotalPages(total);
      const activeChapters = chapters.slice(0, chapterCount);
      const count = activeChapters.length;
      if (count === 0) return;

      const basePages = Math.floor(total / count);
      const remainder = total % count;

      setChapters(prev => prev.map((ch, idx) => {
          if (idx >= count) return ch;
          const newPages = basePages + (idx < remainder ? 1 : 0);
          return {
              ...ch,
              pages: newPages,
              words: newPages * 250 // Standard density
          };
      }));
  };

  const adjustPagesWords = (id: number, field: 'pages' | 'words', delta: number, isAddendum = false) => {
    const update = isAddendum ? updateAddendum : updateChapter;
    const items = isAddendum ? addendums : chapters;
    const item = items.find(c => c.id === id);
    if (!item) return;
    
    if (field === 'pages') {
      const newPages = Math.max(1, item.pages + delta);
      const wordsPerPage = 250;
      update(id, 'pages', newPages);
      update(id, 'words', Math.round(newPages * wordsPerPage));
    } else {
      const newWords = Math.max(100, item.words + (delta * 250));
      update(id, 'words', newWords);
    }
  };

  // --- Upload Handlers ---

  const handleResearchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          
          try {
              // Try JSON first
              const json = JSON.parse(content);
              const validData = ResearchDataSchema.parse(json);
              setUploadedResearch(validData);
              setRawResearchUpload(null);
              setBypassResearch(true);
              if (!topic) setTopic("Uploaded JSON Intel"); 
          } catch (error) {
              // Failed JSON? Treat as Markdown/Text
              console.log("JSON parse failed, treating as Markdown text.");
              setUploadedResearch(null);
              setRawResearchUpload(content);
              setBypassResearch(true);
              if (!topic) setTopic("Uploaded Text Intel"); 
          }
      };
      reader.readAsText(file);
  };

  const handleManuscriptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target?.result as string;
        try {
            const book = parseManuscript(content);
            if (confirm(`Load manuscript "${book.title}" with ${book.chapters.length} chapters? This will skip the generation process.`)) {
                importManuscript(book);
            }
        } catch (e) {
            alert("Failed to parse manuscript file.");
        }
    };
    reader.readAsText(file);
  };
  
  const downloadJsonTemplate = () => {
      const blob = new Blob([JSON.stringify(DUMMY_JSON_TEMPLATE, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "Y-It_Research_Template.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  // --- Preset Management ---

  const savePreset = () => {
      const name = prompt("Enter a name for this configuration preset:");
      if (!name) return;

      const currentData = {
          global: globalConfig,
          chapterCount,
          addendumCount,
          chapters: chapters, // Save full array or slice? Saving full allows restoration
          addendums: addendums
      };
      
      const allPresets = JSON.parse(localStorage.getItem('YIT_CONFIG_PRESETS') || '{}');
      allPresets[name] = currentData;
      localStorage.setItem('YIT_CONFIG_PRESETS', JSON.stringify(allPresets));
      setPresets(Object.keys(allPresets));
      setSelectedPreset(name);
  };

  const loadPreset = (name: string) => {
      const allPresets = JSON.parse(localStorage.getItem('YIT_CONFIG_PRESETS') || '{}');
      const data = allPresets[name];
      if (!data) return;

      if (data.global) setGlobalConfig(data.global);
      if (data.chapterCount) setChapterCount(data.chapterCount);
      if (data.addendumCount) setAddendumCount(data.addendumCount);
      if (data.chapters) setChapters(data.chapters);
      if (data.addendums) setAddendums(data.addendums);
      
      setSelectedPreset(name);
  };
  
  const deletePreset = () => {
      if (!selectedPreset) return;
      if (!confirm(`Delete preset "${selectedPreset}"?`)) return;

      const allPresets = JSON.parse(localStorage.getItem('YIT_CONFIG_PRESETS') || '{}');
      delete allPresets[selectedPreset];
      localStorage.setItem('YIT_CONFIG_PRESETS', JSON.stringify(allPresets));
      setPresets(Object.keys(allPresets));
      setSelectedPreset('');
  };

  // --- Template Management ---

  const handleCopyTemplate = (empty: boolean) => {
      const template = {
          global: globalConfig,
          chapterCount,
          addendumCount,
          chapters: empty ? [] : chapters.slice(0, chapterCount),
          addendums: empty ? [] : addendums.slice(0, addendumCount)
      };
      navigator.clipboard.writeText(JSON.stringify(template, null, 2));
      alert(empty ? "Empty Template Copied!" : "Full Config Copied!");
  };

  const handleManualImport = () => {
    try {
        const data = JSON.parse(importText);
        applyTemplateData(data);
        setImportText('');
        setShowImport(false);
    } catch (e) {
        alert("Invalid JSON format");
    }
  };

  const handlePasteTemplate = async () => {
      try {
          const text = await navigator.clipboard.readText();
          const data = JSON.parse(text);
          applyTemplateData(data);
      } catch (e) {
          alert("Clipboard read failed or Invalid JSON. Try using the Manual Import box.");
          setShowImport(true);
      }
  };

  const applyTemplateData = (data: any) => {
      if (data.global) {
          setGlobalConfig(prev => ({
              ...prev,
              ...Object.fromEntries(Object.entries(data.global).filter(([_, v]) => v !== ""))
          }));
      }
      if (data.chapterCount) setChapterCount(data.chapterCount);
      if (data.addendumCount) setAddendumCount(data.addendumCount);
      
      // Handle Chapters
      if (Array.isArray(data.chapters)) {
          setChapters(prev => prev.map((ch, idx) => {
              // 1. Handle String Arrays (Simple Outline List)
              if (typeof data.chapters[idx] === 'string') {
                   return { ...ch, outline: data.chapters[idx] };
              }
              // 2. Handle Object Arrays (Full Config)
              else if (typeof data.chapters[idx] === 'object') {
                   // Try to match by ID if present, otherwise use index
                   const pasted = data.chapters.find((p: any) => p.id === ch.id);
                   if (pasted) return { ...ch, ...pasted };
                   // Fallback to index if no ID
                   if (data.chapters[idx]) return { ...ch, ...data.chapters[idx] };
              }
              return ch;
          }));
      }

      // Handle Addendums
      if (Array.isArray(data.addendums)) {
        setAddendums(prev => prev.map((ch, idx) => {
            if (typeof data.addendums[idx] === 'string') {
                 return { ...ch, outline: data.addendums[idx] };
            }
            else if (typeof data.addendums[idx] === 'object') {
                 const pasted = data.addendums.find((p: any) => p.id === ch.id);
                 if (pasted) return { ...ch, ...pasted };
                 if (data.addendums[idx]) return { ...ch, ...data.addendums[idx] };
            }
            return ch;
        }));
    }

      alert("Template Merged Successfully!");
  };

  // --- Compilation ---

  const compileManifest = () => {
    let spec = `# Y-It Book Manifest\n\n`;
    spec += `## Global Configuration\n`;
    spec += `**Broad Concept:** ${globalConfig.broadPrompt}\n`;
    spec += `**Tone:** ${globalConfig.tone} (Intensity: ${globalConfig.toneThrottle}%)\n`;
    spec += `**Structure Funnel:** ${globalConfig.bookStructure}\n`;
    spec += `**Visual Profile (Master Aesthetic):** ${globalConfig.visualProfile}\n`;
    spec += `**Color Scheme:** ${globalConfig.colorScheme}\n`;
    
    spec += `\n## Standard Rules (Overrides)\n`;
    spec += `**PosiBot Rules:** ${globalConfig.posibotRules}\n`;
    spec += `**Tech Image Rules:** ${globalConfig.techImageRules}\n`;
    spec += `**Art Image Rules:** ${globalConfig.artisticImageRules}\n`;
    
    spec += `\n## System Specs\n`;
    spec += `**KDP Rules:** ${globalConfig.kdpRules}\n`;
    spec += `**Systemic Adjustments:** ${globalConfig.systemicAdjustments}\n`;
    
    spec += `\n## Chapter Manifest\n`;
    chapters.slice(0, chapterCount).forEach(ch => {
        spec += `\n### Chapter ${ch.id}\n`;
        if (ch.manuscript && ch.manuscript.trim().length > 10) {
             spec += `[MANUSCRIPT OVERRIDE ENABLED]\n${ch.manuscript}\n`;
        } else {
             spec += `**Outline:** ${ch.outline || "Auto-generate based on structure"}\n`;
             spec += `**Custom Adjustments:** ${ch.customInstructions || "None"}\n`;
             spec += `**Title Prompt:** ${globalConfig.chapterTitlePrompt}\n`;
             spec += `**Targets:** ${ch.pages} Pages, ~${ch.words} Words.\n`;
             spec += `**Elements:** ${ch.posibots} PosiBots, ${ch.techBars} Charts, ${ch.funnyImages} Satirical Images.\n`;
             spec += `**Levels:** Tech ${ch.techLevel}%, Humor ${ch.humorLevel}%.\n`;
        }
    });

    if (addendumCount > 0) {
        spec += `\n## Addendums\n`;
        addendums.slice(0, addendumCount).forEach(ch => {
            spec += `\n### Addendum ${ch.id}: ${ch.title}\n`;
            spec += `**Outline:** ${ch.outline}\n`;
            spec += `**Instructions:** ${ch.customInstructions}\n`;
            spec += `**Targets:** ${ch.pages} Pages.\n`;
        });
    }

    return spec;
  };

  const handleSubmit = () => {
    if (!topic) return;
    const spec = compileManifest();
    
    // Determine the override payload
    let override: ResearchData | string | undefined = undefined;
    if (bypassResearch) {
        if (uploadedResearch) override = uploadedResearch;
        else if (rawResearchUpload) override = rawResearchUpload;
    }

    onGenerate(
      topic, 
      {
        tone: globalConfig.tone,
        visualStyle: globalConfig.visualProfile || "Y-It Standard",
        lengthLevel: 2, 
        imageDensity: 2, 
        techLevel: 2, 
        customSpec: spec,
        imageModelHierarchy: IMAGE_MODELS.map(m => m.id as ImageModelID)
      },
      override
    );
  };

  const MiniCounter = ({ value, onChange, label, color = "text-yellow-500" }: any) => (
    <div className="flex flex-col items-center">
      {label && <span className="text-[10px] text-gray-500 mb-0.5 uppercase">{label}</span>}
      <div className="flex items-center gap-1 bg-gray-950 rounded border border-gray-800 px-1">
        <button onClick={() => onChange(Math.max(0, value - 1))} className="text-gray-500 hover:text-white px-1">-</button>
        <span className={`${color} font-mono text-xs w-4 text-center`}>{value}</span>
        <button onClick={() => onChange(value + 1)} className="text-gray-500 hover:text-white px-1">+</button>
      </div>
    </div>
  );

  const Throttle = ({ label, value, onChange, leftLabel, rightLabel }: any) => (
    <div className="flex items-center gap-2 w-full">
       <span className="text-[10px] text-gray-500 w-12 text-right">{leftLabel}</span>
       <input 
          type="range" min="0" max="100" value={value} 
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-yellow-600"
       />
       <span className="text-[10px] text-gray-500 w-12">{rightLabel}</span>
    </div>
  );

  const ChapterRow = ({ config, isAddendum = false }: { config: ChapterConfig, isAddendum?: boolean }) => {
      const update = isAddendum ? updateAddendum : updateChapter;
      const [showManuscript, setShowManuscript] = useState(false);

      const handlePaste = (e: React.ClipboardEvent) => {
          if (!showManuscript) setShowManuscript(true);
      };

      return (
          <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-2 flex flex-col gap-2 hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 ${isAddendum ? 'bg-purple-900/50 text-purple-400' : 'bg-yellow-900/50 text-yellow-500'} rounded flex items-center justify-center font-bold text-xs`}>
                       {isAddendum ? 'A' : ''}{config.id}
                   </div>
                   
                   {isAddendum && (
                       <input 
                          value={config.title} onChange={e => update(config.id, 'title', e.target.value)}
                          placeholder="Addendum Title"
                          className="bg-transparent border-b border-gray-700 text-sm focus:outline-none focus:border-purple-500 w-48"
                       />
                   )}

                   <div className="flex items-center gap-3 ml-auto bg-black/30 px-2 py-1 rounded">
                       <div className="flex items-center gap-1 border-r border-gray-800 pr-3">
                           <FileText size={12} className="text-gray-500"/>
                           <input 
                              type="number" value={config.pages} 
                              onChange={(e) => adjustPagesWords(config.id, 'pages', parseInt(e.target.value) - config.pages, isAddendum)}
                              className="w-8 bg-transparent text-right text-xs font-mono focus:outline-none"
                           />
                           <span className="text-[10px] text-gray-600">pgs</span>
                       </div>
                       <div className="flex items-center gap-1">
                           <span className="text-xs font-mono text-gray-400">{config.words}</span>
                           <span className="text-[10px] text-gray-600">wds</span>
                       </div>
                   </div>

                   <div className="flex items-center gap-2">
                       <MiniCounter value={config.posibots} onChange={(v:number) => update(config.id, 'posibots', v)} label="POSI" />
                       <MiniCounter value={config.techBars} onChange={(v:number) => update(config.id, 'techBars', v)} label="TECH" color="text-blue-400"/>
                       <MiniCounter value={config.funnyImages} onChange={(v:number) => update(config.id, 'funnyImages', v)} label="LOL" color="text-green-400"/>
                   </div>
              </div>

              <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-8">
                      <textarea 
                          value={config.outline}
                          onChange={(e) => update(config.id, 'outline', e.target.value)}
                          placeholder={isAddendum ? "Addendum Brief..." : "Chapter Outline & Objectives..."}
                          className="w-full h-24 bg-black/20 border border-gray-800 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-yellow-600 resize-none"
                      />
                  </div>
                  
                  <div className="col-span-4 flex flex-col gap-1">
                      <label className="text-[9px] text-gray-500 font-bold uppercase">Custom Adjustments</label>
                      <textarea 
                          value={config.customInstructions}
                          onChange={(e) => update(config.id, 'customInstructions', e.target.value)}
                          placeholder="Unique Content & Visual directives for this chapter."
                          className="w-full h-12 bg-black/20 border border-gray-800 rounded p-2 text-[10px] text-yellow-500 placeholder-gray-600 focus:outline-none focus:border-yellow-500 resize-none"
                      />
                      <div className="flex flex-col gap-1 mt-auto pt-1">
                          <Throttle value={config.techLevel} onChange={(v:number) => update(config.id, 'techLevel', v)} leftLabel="Lite" rightLabel="Deep" />
                          <Throttle value={config.humorLevel} onChange={(v:number) => update(config.id, 'humorLevel', v)} leftLabel="Dry" rightLabel="Wild" />
                      </div>
                  </div>
              </div>

              <div className="border-t border-gray-800/50 pt-1">
                  <button 
                      onClick={() => setShowManuscript(!showManuscript)}
                      className="text-[10px] text-gray-600 hover:text-gray-400 flex items-center gap-1 w-full"
                  >
                      {showManuscript ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
                      Manuscript Override {config.manuscript ? '(Active)' : '(Empty)'}
                  </button>
                  
                  {showManuscript && (
                      <textarea 
                          value={config.manuscript}
                          onChange={(e) => update(config.id, 'manuscript', e.target.value)}
                          onPaste={handlePaste}
                          placeholder="Paste raw text here to bypass AI generation for this chapter..."
                          className="w-full h-32 mt-2 bg-gray-950 border border-gray-800 rounded p-3 text-xs font-mono text-gray-400 focus:outline-none focus:border-red-500"
                      />
                  )}
              </div>
          </div>
      );
  };

  const activeChapterSlice = chapters.slice(0, chapterCount).slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(chapterCount / ITEMS_PER_PAGE);

  return (
    <div className="w-full bg-black border border-gray-800 rounded-xl overflow-hidden shadow-2xl animate-fadeIn">
      {/* --- HEADER --- */}
      <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black">
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-yellow-500 font-bold tracking-widest uppercase text-xs flex items-center gap-2">
                    <Settings size={14} /> Y-It Control Panel v3.1
                </h2>

                {/* Preset Manager */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select 
                            value={selectedPreset}
                            onChange={(e) => loadPreset(e.target.value)}
                            className="bg-gray-900 text-xs text-gray-400 border border-gray-700 rounded px-2 py-1 focus:outline-none"
                        >
                            <option value="">Load Preset...</option>
                            {presets.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <button onClick={savePreset} className="p-1 text-gray-400 hover:text-white" title="Save Current as Preset"><Save size={14}/></button>
                    <button onClick={deletePreset} className="p-1 text-gray-400 hover:text-red-500" title="Delete Preset"><Trash2 size={14}/></button>
                </div>
            </div>
            
            <div className="flex gap-2 items-center">
                <div className="relative flex-1 group">
                    <Search className={`absolute left-3 top-3 ${isCached ? 'text-yellow-500' : 'text-gray-500'} transition-colors`} size={18} />
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter Investigation Topic (e.g. 'Dropshipping', 'Airbnb Arbitrage')..."
                        className={`w-full bg-gray-900 border ${isCached ? 'border-yellow-500/50' : 'border-gray-700'} text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none font-bold transition-all`}
                    />
                    {isCached && (
                        <div className="absolute right-3 top-3.5 flex items-center gap-2">
                             <span className="text-[10px] uppercase font-bold text-yellow-500 tracking-wider flex items-center gap-1">
                                <Database size={10}/> Data Cached
                             </span>
                             <button onClick={handleClearCache} className="text-gray-600 hover:text-red-400" title="Clear Cache">
                                <Trash2 size={12}/>
                             </button>
                        </div>
                    )}
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !topic}
                    className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg 
                    ${isCached || bypassResearch
                        ? 'bg-gray-900 border border-yellow-500 text-yellow-500 hover:bg-gray-800 shadow-[0_0_20px_rgba(234,179,8,0.2)]' 
                        : 'bg-yellow-600 text-black hover:bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                    }`}
                >
                    {isLoading ? (
                        <Zap className="animate-spin" /> 
                    ) : (
                        <Zap className={(isCached || bypassResearch) ? "fill-yellow-500 text-yellow-500 animate-pulse" : "fill-black text-black"} />
                    )}
                    <span className="hidden md:inline">
                        {bypassResearch ? "BYPASS MODE" : isCached ? "INSTANT LAUNCH" : "IGNITE SWARM"}
                    </span>
                </button>
            </div>
        </div>
      </div>

      <div className="p-6 bg-[#050505] space-y-8">
         {/* --- GLOBAL CONFIG & TOOLS --- */}
         <div>
             <div className="flex items-center justify-between mb-4">
                 <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                     <Activity size={14}/> Broad Directive
                 </h3>
                 <div className="flex gap-2">
                     <input type="file" accept=".json,.txt,.md" className="hidden" ref={fileInputRef} onChange={handleResearchUpload} />
                     <input type="file" accept=".json,.txt,.md" className="hidden" ref={manuscriptInputRef} onChange={handleManuscriptUpload} />
                     
                     <button onClick={downloadJsonTemplate} className="text-[10px] bg-gray-900 border border-gray-700 px-2 py-1 rounded text-gray-400 hover:text-white flex items-center gap-1" title="Download Template"><Download size={10}/></button>
                     
                     <button onClick={() => fileInputRef.current?.click()} className="text-[10px] bg-blue-900/30 border border-blue-800 px-2 py-1 rounded text-blue-400 hover:text-blue-300 flex items-center gap-1"><FileUp size={10}/> Upload Intel</button>
                     <button onClick={() => manuscriptInputRef.current?.click()} className="text-[10px] bg-purple-900/30 border border-purple-800 px-2 py-1 rounded text-purple-400 hover:text-purple-300 flex items-center gap-1"><Book size={10}/> Upload Manuscript</button>
                     
                     <div className="w-px h-4 bg-gray-800 mx-1"></div>
                     <button onClick={() => handleCopyTemplate(true)} className="text-[10px] bg-gray-900 border border-gray-700 px-2 py-1 rounded text-gray-400 hover:text-white flex items-center gap-1"><Copy size={10}/> Template</button>
                     <button onClick={handlePasteTemplate} className="text-[10px] bg-gray-900 border border-gray-700 px-2 py-1 rounded text-gray-400 hover:text-white flex items-center gap-1"><Clipboard size={10}/> Paste</button>
                     <button onClick={() => setShowImport(!showImport)} className="text-[10px] bg-gray-900 border border-gray-700 px-2 py-1 rounded text-gray-400 hover:text-white flex items-center gap-1"><FileJson size={10}/> Manual Import</button>
                 </div>
             </div>

             {/* Research Bypass Info */}
             {(uploadedResearch || rawResearchUpload) && (
                 <div className="mb-4 flex items-center justify-between bg-blue-900/10 border border-blue-900 rounded p-3 animate-slideDown">
                     <div className="flex items-center gap-2 text-blue-400">
                         {rawResearchUpload ? <FileText size={16} className="text-yellow-400"/> : <Check size={16} />}
                         <span className="text-xs font-bold">
                             {rawResearchUpload 
                                ? `Raw Markdown/Text Loaded (${rawResearchUpload.length} chars) - Will Auto-Parse` 
                                : `JSON Intel Loaded: ${uploadedResearch?.summary.substring(0, 40)}...`}
                         </span>
                     </div>
                     <button 
                         onClick={() => setBypassResearch(!bypassResearch)}
                         className={`flex items-center gap-2 text-xs font-bold px-3 py-1 rounded border transition-colors ${bypassResearch ? 'bg-blue-500 text-white border-blue-400' : 'bg-transparent text-gray-500 border-gray-700'}`}
                     >
                         {bypassResearch ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
                         Use Uploaded Data (Skip Research)
                     </button>
                 </div>
             )}

             {/* Manual Import Box */}
             {showImport && (
                 <div className="mb-4 bg-gray-900 p-4 rounded border border-gray-700 animate-slideDown">
                     <label className="text-[10px] text-gray-500 font-bold uppercase block mb-2">Paste JSON Template Here</label>
                     <textarea 
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        className="w-full h-32 bg-black border border-gray-800 rounded p-2 text-xs font-mono text-green-500 focus:outline-none focus:border-green-500 mb-2"
                        placeholder='{"global": {...}, "chapters": ["Line 1", "Line 2"] }'
                     />
                     <button onClick={handleManualImport} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded text-xs font-bold w-full">Apply Template</button>
                 </div>
             )}
             
             <textarea 
                 value={globalConfig.broadPrompt}
                 onChange={(e) => setGlobalConfig({...globalConfig, broadPrompt: e.target.value})}
                 placeholder={PLACEHOLDERS.broadPrompt}
                 className="w-full h-24 bg-gray-900/50 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 focus:border-yellow-600 focus:outline-none mb-4"
             />

             {/* Visual Profile */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                 <div>
                     <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1 mb-1"><Palette size={10}/> Visual Profile (Master)</label>
                     <textarea 
                        value={globalConfig.visualProfile}
                        onChange={(e) => setGlobalConfig({...globalConfig, visualProfile: e.target.value})}
                        placeholder={PLACEHOLDERS.visualProfile}
                        className="w-full h-20 bg-gray-900/30 border border-gray-800 rounded p-2 text-xs text-gray-300 focus:border-purple-500 focus:outline-none resize-none"
                     />
                 </div>
                 <div>
                     <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1 mb-1"><Palette size={10}/> Color Scheme</label>
                     <textarea 
                        value={globalConfig.colorScheme}
                        onChange={(e) => setGlobalConfig({...globalConfig, colorScheme: e.target.value})}
                        placeholder={PLACEHOLDERS.colorScheme}
                        className="w-full h-20 bg-gray-900/30 border border-gray-800 rounded p-2 text-xs text-gray-300 focus:border-purple-500 focus:outline-none resize-none"
                     />
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div>
                     <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1"><Sliders size={10}/> Tone Profile</label>
                     <input 
                        value={globalConfig.tone}
                        onChange={(e) => setGlobalConfig({...globalConfig, tone: e.target.value})}
                        placeholder={PLACEHOLDERS.tone}
                        className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-gray-600 mt-1"
                     />
                 </div>
                 <div>
                     <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1"><Activity size={10}/> Intensity ({globalConfig.toneThrottle}%)</label>
                     <Throttle value={globalConfig.toneThrottle} onChange={(v:number) => setGlobalConfig({...globalConfig, toneThrottle: v})} leftLabel="Mild" rightLabel="Max" />
                 </div>
             </div>
         </div>
         
         {/* --- STANDARD RULES (The "Overrides") --- */}
         <div className="pt-4 border-t border-gray-900">
             <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-3">
                 <ShieldAlert size={14}/> Standard Rules
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                     <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">PosiBot Rules</label>
                     <textarea 
                        value={globalConfig.posibotRules}
                        onChange={(e) => setGlobalConfig({...globalConfig, posibotRules: e.target.value})}
                        placeholder={PLACEHOLDERS.posibotRules}
                        className="w-full h-24 bg-gray-900/50 border border-gray-800 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500 resize-none"
                     />
                 </div>
                 <div>
                     <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Tech Image Rules</label>
                     <textarea 
                        value={globalConfig.techImageRules}
                        onChange={(e) => setGlobalConfig({...globalConfig, techImageRules: e.target.value})}
                        placeholder={PLACEHOLDERS.techImageRules}
                        className="w-full h-24 bg-gray-900/50 border border-gray-800 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500 resize-none"
                     />
                 </div>
                 <div>
                     <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Artistic Image Rules</label>
                     <textarea 
                        value={globalConfig.artisticImageRules}
                        onChange={(e) => setGlobalConfig({...globalConfig, artisticImageRules: e.target.value})}
                        placeholder={PLACEHOLDERS.artisticImageRules}
                        className="w-full h-24 bg-gray-900/50 border border-gray-800 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500 resize-none"
                     />
                 </div>
             </div>
         </div>

         {/* --- PRE-CHAPTER CONFIG --- */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-900">
             <div className="md:col-span-2">
                 <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Universal Chapter Title Prompt</label>
                 <input 
                    value={globalConfig.chapterTitlePrompt}
                    onChange={(e) => setGlobalConfig({...globalConfig, chapterTitlePrompt: e.target.value})}
                    placeholder={PLACEHOLDERS.chapterTitlePrompt}
                    className="w-full bg-gray-900/50 border border-gray-800 rounded px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-gray-600"
                 />
             </div>
             <div>
                 <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Structure Funnel</label>
                 <input 
                    value={globalConfig.bookStructure}
                    onChange={(e) => setGlobalConfig({...globalConfig, bookStructure: e.target.value})}
                    placeholder={PLACEHOLDERS.bookStructure}
                    className="w-full bg-gray-900/50 border border-gray-800 rounded px-3 py-2 text-xs text-gray-500 focus:outline-none focus:border-gray-600"
                 />
             </div>
         </div>
         
         {/* --- SCALES --- */}
         <div className="grid grid-cols-2 gap-6 pt-2 pb-4">
             <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Technical Level ({globalConfig.technicalLevel})</label>
                <Throttle value={globalConfig.technicalLevel} onChange={(v:number) => setGlobalConfig({...globalConfig, technicalLevel: v})} leftLabel="Narrative" rightLabel="Academic" />
             </div>
             <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Humor Balance ({globalConfig.humorBalance})</label>
                <Throttle value={globalConfig.humorBalance} onChange={(v:number) => setGlobalConfig({...globalConfig, humorBalance: v})} leftLabel="Serious" rightLabel="Comedy" />
             </div>
         </div>

         {/* --- CHAPTER ARCHITECTURE --- */}
         <div>
             <div className="flex items-center justify-between mb-4">
                 <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                     <BookOpen size={14}/> Chapter Architecture
                 </h3>
                 
                 <div className="flex items-center gap-6 bg-gray-900/50 px-3 py-1 rounded-lg border border-gray-800">
                     <div className="flex items-center gap-2">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">Total Pages</label>
                        <div className="relative">
                            <Calculator size={12} className="absolute left-2 top-1.5 text-gray-500"/>
                            <input 
                                type="number" 
                                value={targetTotalPages}
                                onChange={(e) => handleSetTotalPages(parseInt(e.target.value))}
                                className="w-16 pl-6 pr-1 bg-black border border-gray-700 rounded text-xs text-yellow-500 font-mono py-1 focus:outline-none focus:border-yellow-500"
                            />
                        </div>
                     </div>

                     <div className="h-4 w-px bg-gray-700"></div>

                     <div className="flex items-center gap-2">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">Chapters</label>
                        <div className="flex items-center bg-black border border-gray-700 rounded">
                             <button onClick={() => setChapterCount(Math.max(1, chapterCount - 1))} className="px-2 text-gray-400 hover:text-white">-</button>
                             <span className="text-xs font-mono w-6 text-center text-gray-300">{chapterCount}</span>
                             <button onClick={() => setChapterCount(Math.min(20, chapterCount + 1))} className="px-2 text-gray-400 hover:text-white">+</button>
                        </div>
                     </div>
                 </div>
             </div>

             <div className="space-y-3">
                 {activeChapterSlice.map(ch => (
                     <ChapterRow key={ch.id} config={ch} />
                 ))}
             </div>

             {/* Pagination Controls */}
             {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6 bg-gray-900/50 p-2 rounded-lg border border-gray-800 w-fit mx-auto">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 hover:text-white text-gray-500 disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-mono font-bold text-gray-400">
                        PAGE {currentPage} / {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 hover:text-white text-gray-500 disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
             )}

             {/* Addendums */}
             <div className="mt-8">
                 <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs text-purple-500 font-bold uppercase tracking-wider">Addendums</h4>
                    <div className="flex items-center bg-black border border-gray-700 rounded">
                        <button onClick={() => setAddendumCount(Math.max(0, addendumCount - 1))} className="px-2 text-gray-400 hover:text-white">-</button>
                        <span className="text-xs font-mono w-6 text-center text-gray-300">{addendumCount}</span>
                        <button onClick={() => setAddendumCount(Math.min(10, addendumCount + 1))} className="px-2 text-gray-400 hover:text-white">+</button>
                    </div>
                 </div>
                 {addendumCount > 0 && (
                     <div className="space-y-3">
                         {addendums.slice(0, addendumCount).map(ch => (
                             <ChapterRow key={ch.id} config={ch} isAddendum />
                         ))}
                     </div>
                 )}
             </div>
         </div>

         {/* --- BOTTOM SYSTEM CONFIG --- */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-900">
             <div>
                 <label className="text-[10px] text-red-500 uppercase font-bold block mb-1">KDP Specs (Mandatory)</label>
                 <textarea 
                    value={globalConfig.kdpRules}
                    onChange={(e) => setGlobalConfig({...globalConfig, kdpRules: e.target.value})}
                    placeholder={PLACEHOLDERS.kdpRules}
                    className="w-full h-16 bg-red-900/10 border border-red-900/30 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-red-500 resize-none"
                 />
             </div>
             <div>
                 <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Systemic Adjustments (Prompt Override)</label>
                 <textarea 
                    value={globalConfig.systemicAdjustments}
                    onChange={(e) => setGlobalConfig({...globalConfig, systemicAdjustments: e.target.value})}
                    placeholder={PLACEHOLDERS.systemicAdjustments}
                    className="w-full h-16 bg-gray-900 border border-gray-800 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-gray-500 resize-none"
                 />
             </div>
         </div>
      </div>
    </div>
  );
}
