import React, { useState, useMemo, useEffect } from 'react';
import { Book, Chapter, VisualElement, ImageModelID } from '../types';
import { ChevronLeft, ChevronRight, Image as ImageIcon, BarChart2, AlertCircle, Wand2, RefreshCw, Edit3, Upload, X, Zap, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ImageService } from '../services/media/ImageService';

interface Props {
    book: Book;
    visualStyle?: string;
    imageModelHierarchy?: ImageModelID[];
    onUpdateBook: (updatedBook: Book) => void;
}

// ---------------------------------------------------------------------------
// Pagination Helper
// ---------------------------------------------------------------------------
const WORDS_PER_PAGE = 300; // Adjust for density

function splitContent(text: string, maxWords: number): string[] {
    if (!text) return [];

    // Split by double newline to preserve paragraphs
    const paragraphs = text.split(/\n\n+/);
    const pages: string[] = [];
    let currentPage = "";
    let currentWords = 0;

    for (const para of paragraphs) {
        const paraWords = para.split(/\s+/).length;

        // If adding this paragraph exceeds limit AND we have content already, push page
        if (currentWords + paraWords > maxWords && currentPage.length > 0) {
            pages.push(currentPage);
            currentPage = para;
            currentWords = paraWords;
        } else {
            currentPage = currentPage ? currentPage + "\n\n" + para : para;
            currentWords += paraWords;
        }
    }
    if (currentPage) pages.push(currentPage);
    return pages;
}

type PageType = 'FRONT_COVER' | 'BACK_COVER' | 'CHAPTER_PAGE';

interface FlatPage {
    type: PageType;
    chapterIndex?: number;
    subPageIndex?: number; // 0-based index within chapter
    totalSubPages?: number;
    content?: string;
    chapter?: Chapter;
}

// ---------------------------------------------------------------------------
// BookReader Component
// ---------------------------------------------------------------------------
const BookReader: React.FC<Props> = ({ book, visualStyle, imageModelHierarchy, onUpdateBook }) => {

    const [currentIndex, setCurrentIndex] = useState(0);

    // Memoize pagination structure
    const pages = useMemo(() => {
        const flat: FlatPage[] = [];

        // 1. Front Cover
        flat.push({ type: 'FRONT_COVER' });

        // 2. Chapters (Split)
        book.chapters.forEach((ch, chIdx) => {
            const chunks = splitContent(ch.content, WORDS_PER_PAGE);
            if (chunks.length === 0) chunks.push(""); // Handles empty chapters

            chunks.forEach((chunk, pIdx) => {
                flat.push({
                    type: 'CHAPTER_PAGE',
                    chapterIndex: chIdx,
                    subPageIndex: pIdx,
                    totalSubPages: chunks.length,
                    content: chunk,
                    chapter: ch
                });
            });
        });

        // 3. Back Cover
        flat.push({ type: 'BACK_COVER' });
        return flat;
    }, [book]);

    // Safety clamp if book content changes drastically
    useEffect(() => {
        if (currentIndex >= pages.length) {
            setCurrentIndex(Math.max(0, pages.length - 1));
        }
    }, [pages.length, currentIndex]);

    const activePage = pages[currentIndex] || pages[0];

    // Studio State
    const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
    const [expandedStudioKey, setExpandedStudioKey] = useState<string | null>(null);
    const [studioPrompt, setStudioPrompt] = useState('');
    const [studioMode, setStudioMode] = useState<'GENERATE' | 'EDIT' | 'UPLOAD'>('GENERATE');

    // -------------------------------------------------------------------------
    // Studio & Image Handlers
    // -------------------------------------------------------------------------
    const toggleStudio = (key: string, defaultPrompt: string) => {
        if (expandedStudioKey === key) {
            setExpandedStudioKey(null);
        } else {
            setExpandedStudioKey(key);
            setStudioPrompt(defaultPrompt);
            setStudioMode('GENERATE');
        }
    };

    const handleStudioAction = async (key: string, chapterIndex: number | 'front' | 'back', visualIndex?: number) => {
        if (generatingImages[key]) return;
        setGeneratingImages(prev => ({ ...prev, [key]: true }));

        try {
            let imageUrl = "";

            if (studioMode === 'GENERATE') {
                imageUrl = await ImageService.generateImage(studioPrompt, visualStyle, true, imageModelHierarchy);
            } else if (studioMode === 'EDIT') {
                let currentImage = "";
                if (chapterIndex === 'front') currentImage = book.frontCover?.imageUrl || "";
                else if (chapterIndex === 'back') currentImage = book.backCover?.imageUrl || "";
                else if (typeof chapterIndex === 'number' && visualIndex !== undefined) {
                    currentImage = book.chapters[chapterIndex].visuals?.[visualIndex].imageUrl || "";
                }

                if (!currentImage) throw new Error("No image to edit.");
                imageUrl = await ImageService.editImage(currentImage, studioPrompt, imageModelHierarchy?.[0]);
            }

            // Deep clone & Update
            const newBook = JSON.parse(JSON.stringify(book)) as Book;

            if (chapterIndex === 'front' && newBook.frontCover) newBook.frontCover.imageUrl = imageUrl;
            else if (chapterIndex === 'back' && newBook.backCover) newBook.backCover.imageUrl = imageUrl;
            else if (typeof chapterIndex === 'number' && visualIndex !== undefined && newBook.chapters[chapterIndex].visuals) {
                newBook.chapters[chapterIndex].visuals![visualIndex].imageUrl = imageUrl;
            }

            onUpdateBook(newBook);
            setExpandedStudioKey(null);

        } catch (e: any) {
            console.error("Studio action failed", e);
            alert(e.message || "Failed to generate image");
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

                if (chapterIndex === 'front' && newBook.frontCover) newBook.frontCover.imageUrl = result;
                else if (chapterIndex === 'back' && newBook.backCover) newBook.backCover.imageUrl = result;
                else if (typeof chapterIndex === 'number' && visualIndex !== undefined && newBook.chapters[chapterIndex].visuals) {
                    newBook.chapters[chapterIndex].visuals![visualIndex].imageUrl = result;
                }
                onUpdateBook(newBook);
                setExpandedStudioKey(null);
            };
            reader.readAsDataURL(file);
        }
    };

    // -------------------------------------------------------------------------
    // Render Helpers
    // -------------------------------------------------------------------------
    const renderStudioPanel = (key: string, chapterIndex: number | 'front' | 'back', visualIndex?: number) => {
        if (expandedStudioKey !== key) return null;
        const isGenerating = generatingImages[key];

        return (
            <div className="mt-4 p-4 bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 animate-slideDown z-20 relative">
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Zap size={14} className="text-yellow-500" /> Image Studio
                    </h4>
                    <button onClick={() => setExpandedStudioKey(null)} className="text-gray-400 hover:text-white"><X size={16} /></button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                    {(['GENERATE', 'EDIT', 'UPLOAD'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setStudioMode(mode)}
                            className={`px-3 py-1 rounded text-xs font-bold ${studioMode === mode ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400'}`}
                        >
                            {mode === 'GENERATE' ? 'Generate' : mode === 'EDIT' ? 'Edit' : 'Upload'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {studioMode !== 'UPLOAD' ? (
                    <div className="space-y-3">
                        <textarea
                            value={studioPrompt}
                            onChange={(e) => setStudioPrompt(e.target.value)}
                            placeholder={studioMode === 'GENERATE' ? "Describe the image..." : "Describe changes..."}
                            className="w-full h-24 bg-black border border-gray-700 rounded p-3 text-sm focus:border-yellow-500 focus:outline-none"
                        />
                        <button
                            onClick={() => handleStudioAction(key, chapterIndex, visualIndex)}
                            disabled={isGenerating}
                            className="w-full py-2 bg-white text-black hover:bg-gray-200 rounded font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isGenerating ? <RefreshCw className="animate-spin" size={14} /> : <Wand2 size={14} />}
                            {isGenerating ? "Processing..." : "Execute"}
                        </button>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-green-500 transition-colors relative">
                        <input
                            type="file" accept="image/*"
                            onChange={(e) => handleImageUpload(e, chapterIndex, visualIndex)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="mx-auto mb-2 text-gray-500" size={24} />
                        <p className="text-xs text-gray-400">Click to upload image</p>
                    </div>
                )}
            </div>
        )
    };

    const renderVisual = (visual: VisualElement, vIdx: number, chapterIndex: number) => {
        const key = `${chapterIndex}-${vIdx}`;
        return (
            <div key={key} className="my-8 group relative page-break-inside-avoid">
                {visual.imageUrl ? (
                    <div className="rounded-xl overflow-hidden shadow-2xl bg-gray-100 relative">
                        <img src={visual.imageUrl} alt={visual.description} className="w-full h-auto object-cover" />
                        {visual.caption && <div className="bg-gray-100 p-2 text-xs text-gray-500 text-center italic border-t border-gray-200">{visual.caption}</div>}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => toggleStudio(key, visual.description)} className="bg-black/70 hover:bg-black text-white p-2 rounded-full backdrop-blur-md"><Edit3 size={16} /></button>
                        </div>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 flex flex-col items-center text-center space-y-4 hover:border-yellow-500 transition-colors">
                        {visual.type === 'CHART' ? <BarChart2 size={32} className="text-gray-400" /> : <ImageIcon size={32} className="text-gray-400" />}
                        <div className="space-y-1">
                            <div className="font-bold text-gray-700 text-sm">{visual.type} Placeholder</div>
                            <p className="text-[10px] text-gray-500 line-clamp-2">{visual.description}</p>
                        </div>
                        <button onClick={() => toggleStudio(key, visual.description)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                            <Wand2 size={14} /> Open Studio
                        </button>
                    </div>
                )}
                {renderStudioPanel(key, chapterIndex, vIdx)}
            </div>
        );
    };

    const handleExportPrompts = () => {
        const text = ImageService.extractPrompts(book);
        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_prompts.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // -------------------------------------------------------------------------
    // Render Main Layout
    // -------------------------------------------------------------------------
    const goToNext = () => currentIndex < pages.length - 1 && setCurrentIndex(p => p + 1);
    const goToPrev = () => currentIndex > 0 && setCurrentIndex(p => p - 1);

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            {/* Navigation Bar */}
            <div className="flex items-center justify-between bg-gray-900/50 p-4 rounded-t-xl border border-gray-800">
                <button onClick={goToPrev} disabled={currentIndex === 0} className="p-2 rounded hover:bg-gray-800 disabled:opacity-30">
                    <ChevronLeft />
                </button>

                <div className="text-center">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">
                        Page {currentIndex + 1} of {pages.length}
                    </div>
                    <div className="font-bold text-white text-sm md:text-base truncate max-w-[200px] md:max-w-md mx-auto">
                        {activePage.type === 'FRONT_COVER' ? "Front Cover" :
                            activePage.type === 'BACK_COVER' ? "Back Cover" :
                                `Chapter ${activePage.chapter?.number} • Part ${(activePage.subPageIndex || 0) + 1}/${activePage.totalSubPages}`}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportPrompts}
                        className="p-2 rounded hover:bg-gray-800 text-gray-400 hover:text-yellow-500 transition-colors"
                        title="Export Visual Prompts"
                    >
                        <Download size={20} />
                    </button>
                    <button onClick={goToNext} disabled={currentIndex === pages.length - 1} className="p-2 rounded hover:bg-gray-800 disabled:opacity-30">
                        <ChevronRight />
                    </button>
                </div>
            </div>

            {/* Main Content Viewer */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white text-black p-8 md:p-12 shadow-2xl rounded-b-xl relative">

                {/* 1. FRONT COVER */}
                {activePage.type === 'FRONT_COVER' && (
                    <div className="max-w-xl mx-auto flex flex-col items-center text-center space-y-8 animate-fadeIn">
                        <div className="relative group w-full aspect-[2/3] bg-gray-100 rounded shadow-lg overflow-hidden border border-gray-200">
                            {book.frontCover?.imageUrl ? (
                                <>
                                    <img src={book.frontCover.imageUrl} className="w-full h-full object-cover" alt="Cover" />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => toggleStudio('cover-front', book.frontCover?.visualDescription || "Cover Art")} className="bg-black/70 hover:bg-black text-white p-2 rounded-full backdrop-blur-md"><Edit3 size={16} /></button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400">
                                    <ImageIcon size={48} className="mb-4 opacity-50" />
                                    <p className="text-sm">Cover Placeholder</p>
                                    <button onClick={() => toggleStudio('cover-front', book.frontCover?.visualDescription || "Cover Art")} className="mt-4 bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Wand2 size={14} /> Generate</button>
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

                {/* 2. CHAPTER PAGE */}
                {activePage.type === 'CHAPTER_PAGE' && activePage.chapter && (
                    <div className="max-w-2xl mx-auto animate-fadeIn min-h-[500px] flex flex-col">
                        {/* Chapter Title only on Page 1 */}
                        {activePage.subPageIndex === 0 && (
                            <div className="mb-8 border-b border-gray-200 pb-4">
                                <div className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-1">Chapter {activePage.chapter.number}</div>
                                <h2 className="text-3xl font-bold font-serif">{activePage.chapter.title}</h2>
                            </div>
                        )}

                        {/* Render HERO images on Page 1 */}
                        {activePage.subPageIndex === 0 && activePage.chapter.visuals?.filter(v => v.type === 'HERO').map((v, i) => renderVisual(v, i, activePage.chapterIndex!))}

                        <div className="prose prose-lg prose-stone max-w-none flex-1">
                            <ReactMarkdown>{activePage.content || ""}</ReactMarkdown>
                        </div>

                        {/* Render ALL Other visuals on Last Page of Chapter */}
                        {activePage.subPageIndex === (activePage.totalSubPages! - 1) &&
                            activePage.chapter.visuals?.filter(v => v.type !== 'HERO').map((v, i) => renderVisual(v, i + 100, activePage.chapterIndex!))}
                    </div>
                )}

                {/* 3. BACK COVER */}
                {activePage.type === 'BACK_COVER' && (
                    <div className="max-w-xl mx-auto flex flex-col items-center text-center space-y-8 animate-fadeIn">
                        <div className="relative group w-full aspect-[2/3] bg-gray-100 rounded shadow-lg overflow-hidden border border-gray-200">
                            {book.backCover?.imageUrl ? (
                                <>
                                    <img src={book.backCover.imageUrl} className="w-full h-full object-cover" alt="Back Cover" />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => toggleStudio('cover-back', book.backCover?.visualDescription || "Back Cover Art")} className="bg-black/70 hover:bg-black text-white p-2 rounded-full backdrop-blur-md"><Edit3 size={16} /></button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400">
                                    <ImageIcon size={48} className="mb-4 opacity-50" />
                                    <button onClick={() => toggleStudio('cover-back', book.backCover?.visualDescription || "Back Cover Art")} className="mt-4 bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Wand2 size={14} /> Generate</button>
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