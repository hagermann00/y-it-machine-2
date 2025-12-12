import React, { useState } from 'react';
import { Book, Chapter, VisualElement, ImageModelID } from '../types';
import { ChevronLeft, ChevronRight, Image as ImageIcon, BarChart2, AlertCircle, Wand2, RefreshCw, Edit3, Upload, X, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ImageService } from '../services/media/ImageService';

interface Props {
  book: Book;
  visualStyle?: string;
  imageModelHierarchy?: ImageModelID[];
  onUpdateBook: (updatedBook: Book) => void;
}

const BookReader: React.FC<Props> = ({ book, visualStyle, imageModelHierarchy, onUpdateBook }) => {
  // Use -1 for Front Cover, chapters.length for Back Cover
  const [activePageIndex, setActivePageIndex] = useState(-1);
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  
  // Track which visual is currently being "Studio Edited"
  // Key format: "chapterIndex-visualIndex" or "cover-front" / "cover-back"
  const [expandedStudioKey, setExpandedStudioKey] = useState<string | null>(null);
  
  // State for the studio inputs
  const [studioPrompt, setStudioPrompt] = useState('');
  const [studioMode, setStudioMode] = useState<'GENERATE' | 'EDIT' | 'UPLOAD'>('GENERATE');

  const isFrontCover = activePageIndex === -1;
  const isBackCover = activePageIndex === book.chapters.length;
  const activeChapterIndex = (!isFrontCover && !isBackCover) ? activePageIndex : null;
  const activeChapter = activeChapterIndex !== null ? book.chapters[activeChapterIndex] : null;

  const toggleStudio = (key: string, defaultPrompt: string) => {
    if (expandedStudioKey === key) {
        setExpandedStudioKey(null);
    } else {
        setExpandedStudioKey(key);
        setStudioPrompt(defaultPrompt);
        setStudioMode('GENERATE'); // Default to Generate
    }
  };

  const handleStudioAction = async (key: string, chapterIndex: number | 'front' | 'back', visualIndex?: number) => {
      // Prevent double click/execution if already generating this key
      if (generatingImages[key]) return;

      setGeneratingImages(prev => ({ ...prev, [key]: true }));
      
      try {
        let imageUrl = "";
        
        // 1. Upload Logic is handled instantly by file input, so this action is for Gen/Edit
        if (studioMode === 'GENERATE') {
             // High Res Generation
             imageUrl = await ImageService.generateImage(studioPrompt, visualStyle, true, imageModelHierarchy); // true = High Res
        } else if (studioMode === 'EDIT') {
             // Image Editing
             // Need current image.
             let currentImage = "";
             if (chapterIndex === 'front') currentImage = book.frontCover?.imageUrl || "";
             else if (chapterIndex === 'back') currentImage = book.backCover?.imageUrl || "";
             else if (typeof chapterIndex === 'number' && visualIndex !== undefined) {
                 currentImage = book.chapters[chapterIndex].visuals?.[visualIndex].imageUrl || "";
             }

             if (!currentImage) {
                 alert("Cannot edit - no image exists yet. Generate one first.");
                 setGeneratingImages(prev => ({ ...prev, [key]: false }));
                 return;
             }
             
             imageUrl = await ImageService.editImage(currentImage, studioPrompt, imageModelHierarchy);
        }

        // Update Book State
        const newBook = JSON.parse(JSON.stringify(book)) as Book;
        
        if (chapterIndex === 'front' && newBook.frontCover) {
            newBook.frontCover.imageUrl = imageUrl;
        } else if (chapterIndex === 'back' && newBook.backCover) {
            newBook.backCover.imageUrl = imageUrl;
        } else if (typeof chapterIndex === 'number' && visualIndex !== undefined) {
            if (newBook.chapters[chapterIndex].visuals) {
                newBook.chapters[chapterIndex].visuals![visualIndex].imageUrl = imageUrl;
            }
        }
        
        onUpdateBook(newBook);
        setExpandedStudioKey(null); // Close studio on success

      } catch (e) {
          console.error("Studio action failed", e);
      } finally {
          setGeneratingImages(prev => ({ ...prev, [key]: false }));
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, chapterIndex: number | 'front' | 'back', visualIndex?: number) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              const newBook = JSON.parse(JSON.stringify(book)) as Book;
              
              if (chapterIndex === 'front' && newBook.frontCover) {
                  newBook.frontCover.imageUrl = result;
              } else if (chapterIndex === 'back' && newBook.backCover) {
                  newBook.backCover.imageUrl = result;
              } else if (typeof chapterIndex === 'number' && visualIndex !== undefined) {
                  if (newBook.chapters[chapterIndex].visuals) {
                      newBook.chapters[chapterIndex].visuals![visualIndex].imageUrl = result;
                  }
              }
              onUpdateBook(newBook);
              setExpandedStudioKey(null);
          };
          reader.readAsDataURL(file);
      }
  };

  const renderStudioPanel = (key: string, chapterIndex: number | 'front' | 'back', visualIndex?: number) => {
      if (expandedStudioKey !== key) return null;
      
      const isGenerating = generatingImages[key];

      return (
          <div className="mt-4 p-4 bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 animate-slideDown z-20 relative">
              <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Zap size={14} className="text-yellow-500"/>
                      Image Studio (Pro)
                  </h4>
                  <button onClick={() => setExpandedStudioKey(null)} className="text-gray-400 hover:text-white"><X size={16}/></button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                  <button 
                    onClick={() => setStudioMode('GENERATE')}
                    className={`px-3 py-1 rounded text-xs font-bold ${studioMode === 'GENERATE' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400'}`}
                  >
                    Regenerate (High Res)
                  </button>
                  <button 
                    onClick={() => setStudioMode('EDIT')}
                    className={`px-3 py-1 rounded text-xs font-bold ${studioMode === 'EDIT' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400'}`}
                  >
                    Edit Existing (AI)
                  </button>
                  <button 
                    onClick={() => setStudioMode('UPLOAD')}
                    className={`px-3 py-1 rounded text-xs font-bold ${studioMode === 'UPLOAD' ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'}`}
                  >
                    Upload File
                  </button>
              </div>

              {/* Content */}
              {studioMode !== 'UPLOAD' ? (
                  <div className="space-y-3">
                      <textarea
                          value={studioPrompt}
                          onChange={(e) => setStudioPrompt(e.target.value)}
                          placeholder={studioMode === 'GENERATE' ? "Describe the image..." : "Describe changes (e.g. 'Make it darker', 'Add a robot')..."}
                          className="w-full h-24 bg-black border border-gray-700 rounded p-3 text-sm focus:border-yellow-500 focus:outline-none"
                      />
                      <button
                          onClick={() => handleStudioAction(key, chapterIndex, visualIndex)}
                          disabled={isGenerating}
                          className={`w-full py-2 rounded font-bold text-sm flex items-center justify-center gap-2 ${
                              studioMode === 'GENERATE' ? 'bg-white text-black hover:bg-gray-200' : 'bg-purple-600 text-white hover:bg-purple-500'
                          } disabled:opacity-50`}
                      >
                          {isGenerating ? <RefreshCw className="animate-spin" size={14} /> : <Wand2 size={14} />}
                          {isGenerating ? "Processing..." : (studioMode === 'GENERATE' ? "Generate High Quality (2K)" : "Apply AI Edits")}
                      </button>
                      <p className="text-[10px] text-gray-500 text-center">
                          Powered by Gemini Pro Vision. Optimized for KDP 6x9 Print.
                      </p>
                  </div>
              ) : (
                  <div className="space-y-3">
                      <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-green-500 transition-colors cursor-pointer relative">
                          <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, chapterIndex, visualIndex)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <Upload className="mx-auto mb-2 text-gray-500" size={24} />
                          <p className="text-xs text-gray-400">Click to upload or drag and drop</p>
                          <p className="text-[10px] text-gray-600 mt-1">Recommended: 1800x2700px (300dpi) for full page</p>
                      </div>
                  </div>
              )}
          </div>
      )
  };

  const renderVisual = (visual: VisualElement, vIdx: number, chapterIndex: number) => {
    const key = `${chapterIndex}-${vIdx}`;
    
    return (
        <div key={key} className="my-8 group relative">
             {visual.imageUrl ? (
                 <div className="rounded-xl overflow-hidden shadow-2xl bg-gray-100 relative">
                     <img src={visual.imageUrl} alt={visual.description} className="w-full h-auto object-cover" />
                     {visual.caption && <div className="bg-gray-100 p-2 text-xs text-gray-500 text-center italic border-t border-gray-200">{visual.caption}</div>}
                     
                     <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => toggleStudio(key, visual.description)} className="bg-black/70 hover:bg-black text-white p-2 rounded-full backdrop-blur-md">
                             <Edit3 size={16} />
                         </button>
                     </div>
                 </div>
             ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 flex flex-col items-center text-center space-y-4 hover:border-yellow-500 transition-colors">
                    {visual.type === 'CHART' ? <BarChart2 size={32} className="text-gray-400" /> : 
                     visual.type === 'HERO' ? <ImageIcon size={32} className="text-gray-400" /> :
                     <AlertCircle size={32} className="text-gray-400" />}
                    
                    <div className="space-y-1">
                        <div className="font-bold text-gray-700 text-sm uppercase tracking-wide">{visual.type} Visual Placeholder</div>
                        <p className="text-xs text-gray-500 max-w-md mx-auto">{visual.description}</p>
                    </div>

                    <button 
                        onClick={() => toggleStudio(key, visual.description)} 
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
                    >
                        <Wand2 size={14} /> Open Studio
                    </button>
                </div>
             )}
             {renderStudioPanel(key, chapterIndex, vIdx)}
        </div>
    );
  };

  const goToNext = () => {
    if (activePageIndex < book.chapters.length) setActivePageIndex(activePageIndex + 1);
  };
  const goToPrev = () => {
    if (activePageIndex > -1) setActivePageIndex(activePageIndex - 1);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between bg-gray-900/50 p-4 rounded-t-xl border border-gray-800">
          <button 
            onClick={goToPrev} 
            disabled={activePageIndex === -1}
            className="p-2 rounded hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft />
          </button>

          <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Current View</div>
              <div className="font-bold text-white">
                  {isFrontCover ? "Front Cover" : isBackCover ? "Back Cover" : `Chapter ${activeChapter?.number}: ${activeChapter?.title}`}
              </div>
          </div>

          <button 
            onClick={goToNext} 
            disabled={activePageIndex === book.chapters.length}
            className="p-2 rounded hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight />
          </button>
      </div>

      {/* Main Content Viewer */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white text-black p-8 md:p-12 shadow-2xl rounded-b-xl relative">
          
          {/* Front Cover */}
          {isFrontCover && (
              <div className="max-w-xl mx-auto flex flex-col items-center text-center space-y-8 animate-fadeIn">
                   <div className="relative group w-full aspect-[2/3] bg-gray-100 rounded shadow-lg overflow-hidden border border-gray-200">
                       {book.frontCover?.imageUrl ? (
                           <>
                               <img src={book.frontCover.imageUrl} className="w-full h-full object-cover" alt="Cover" />
                               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => toggleStudio('cover-front', book.frontCover?.visualDescription || "Cover Art")} className="bg-black/70 hover:bg-black text-white p-2 rounded-full backdrop-blur-md">
                                        <Edit3 size={16} />
                                    </button>
                                </div>
                           </>
                       ) : (
                           <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400">
                               <ImageIcon size={48} className="mb-4 opacity-50"/>
                               <p className="text-sm">{book.frontCover?.visualDescription}</p>
                               <button 
                                    onClick={() => toggleStudio('cover-front', book.frontCover?.visualDescription || "Cover Art")} 
                                    className="mt-4 bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                                >
                                    <Wand2 size={14} /> Generate Cover
                                </button>
                           </div>
                       )}
                   </div>
                   {renderStudioPanel('cover-front', 'front')}
                   
                   <div className="space-y-2">
                       <h1 className="text-5xl font-black tracking-tighter uppercase">{book.frontCover?.titleText || book.title}</h1>
                       <h2 className="text-2xl text-gray-600 font-serif">{book.frontCover?.subtitleText || book.subtitle}</h2>
                   </div>
              </div>
          )}

          {/* Chapter Content */}
          {activeChapter && (
              <div className="max-w-2xl mx-auto animate-fadeIn">
                   <div className="mb-8 border-b border-gray-200 pb-4">
                       <div className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-1">Chapter {activeChapter.number}</div>
                       <h2 className="text-3xl font-bold font-serif">{activeChapter.title}</h2>
                   </div>

                   <div className="prose prose-lg prose-stone max-w-none">
                       {activeChapter.visuals?.filter(v => v.type === 'HERO').map((v, i) => renderVisual(v, i, activeChapterIndex!))}
                       
                       <ReactMarkdown>
                           {activeChapter.content}
                       </ReactMarkdown>

                       {activeChapter.visuals?.filter(v => v.type !== 'HERO').map((v, i) => renderVisual(v, i + 100, activeChapterIndex!))}
                   </div>
              </div>
          )}

          {/* Back Cover */}
          {isBackCover && (
              <div className="max-w-xl mx-auto flex flex-col items-center text-center space-y-8 animate-fadeIn">
                   <div className="relative group w-full aspect-[2/3] bg-gray-100 rounded shadow-lg overflow-hidden border border-gray-200">
                       {book.backCover?.imageUrl ? (
                           <>
                               <img src={book.backCover.imageUrl} className="w-full h-full object-cover" alt="Back Cover" />
                               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => toggleStudio('cover-back', book.backCover?.visualDescription || "Back Cover Art")} className="bg-black/70 hover:bg-black text-white p-2 rounded-full backdrop-blur-md">
                                        <Edit3 size={16} />
                                    </button>
                                </div>
                           </>
                       ) : (
                           <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400">
                               <ImageIcon size={48} className="mb-4 opacity-50"/>
                               <p className="text-sm">{book.backCover?.visualDescription}</p>
                               <button 
                                    onClick={() => toggleStudio('cover-back', book.backCover?.visualDescription || "Back Cover Art")} 
                                    className="mt-4 bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                                >
                                    <Wand2 size={14} /> Generate Back Cover
                                </button>
                           </div>
                       )}
                   </div>
                   {renderStudioPanel('cover-back', 'back')}

                   <div className="bg-gray-100 p-6 rounded-xl border border-gray-200">
                       <p className="font-serif text-lg leading-relaxed italic">"{book.backCover?.blurb}"</p>
                   </div>
              </div>
          )}

      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default BookReader;