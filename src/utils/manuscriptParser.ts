
import { Book, Chapter, VisualElement, Cover } from '../types';

export const parseManuscript = (text: string): Book => {
  // 1. Try JSON First (For restoring backups or proper exports)
  try {
    const json = JSON.parse(text);
    // Basic validation to check if it looks like a book
    if (json.chapters && Array.isArray(json.chapters)) {
      // Ensure specific fields exist
      return {
        title: json.title || "Untitled Import",
        subtitle: json.subtitle || "Restored Manuscript",
        frontCover: json.frontCover,
        backCover: json.backCover,
        chapters: json.chapters
      } as Book;
    }
  } catch (e) {
    // Not JSON, proceed to Markdown parsing
  }

  // 2. Markdown Parsing
  const lines = text.split('\n');
  const chapters: Chapter[] = [];
  
  let title = "Imported Manuscript";
  let subtitle = "Draft Upload";
  let currentChapter: Partial<Chapter> | null = null;
  let currentContent: string[] = [];
  
  // Regex Patterns
  const titleRegex = /^#\s+(.+)/; // # Title
  const subtitleRegex = /^##\s+(.+)/; // ## Subtitle (if at top)
  const chapterRegex = /^##\s*Chapter\s*(\d+|One|Two|Three)?[:\s]*(.+)/i; // ## Chapter 1: The Lie
  const looseChapterRegex = /^##\s+(.+)/; // ## Just A Title (fallback if not matched above)
  const visualTagRegex = /\[Visual:\s*([A-Z]+)?\s*[-–:]\s*(.+)\]/i; // [Visual: HERO - Description]
  const mdImageRegex = /!\[(.*?)\]\((.*?)\)/; // ![Alt](URL)

  let isHeaderSection = true;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // A. Detect Global Title/Subtitle (Only at the very top)
    if (isHeaderSection) {
        const tMatch = trimmed.match(titleRegex);
        if (tMatch) {
            title = tMatch[1];
            return;
        }
        
        // If we hit a chapter header, header section is over
        if (trimmed.match(chapterRegex) || (trimmed.startsWith('##') && index > 5)) {
            isHeaderSection = false;
        } else {
             // Check for subtitle-ish things
             if (trimmed.startsWith('## ')) {
                 subtitle = trimmed.replace('## ', '');
                 return;
             }
        }
    }

    // B. Detect Chapter Start
    const chMatch = trimmed.match(chapterRegex);
    if (chMatch) {
        // Save previous chapter
        if (currentChapter) {
            currentChapter.content = currentContent.join('\n').trim();
            chapters.push(currentChapter as Chapter);
        }
        
        // Start new chapter
        isHeaderSection = false;
        currentContent = [];
        currentChapter = {
            number: chapters.length + 1,
            title: chMatch[2] || "Untitled Chapter",
            visuals: [],
            posiBotQuotes: []
        };
        return;
    }

    // C. Detect Loose Headers as Chapters (if we are past header section)
    if (!isHeaderSection && trimmed.startsWith('## ') && !chMatch) {
        if (currentChapter) {
            currentChapter.content = currentContent.join('\n').trim();
            chapters.push(currentChapter as Chapter);
        }
        currentContent = [];
        currentChapter = {
            number: chapters.length + 1,
            title: trimmed.replace('## ', ''),
            visuals: [],
            posiBotQuotes: []
        };
        return;
    }

    // D. Detect Content & Visuals
    if (currentChapter) {
        // 1. Explicit Visual Tags: [Visual: HERO - A robot]
        const vMatch = trimmed.match(visualTagRegex);
        if (vMatch) {
            const typeStr = vMatch[1] ? vMatch[1].toUpperCase() : 'DIAGRAM';
            const desc = vMatch[2];
            
            // Map generic types to allowed union
            let type: any = 'DIAGRAM';
            if (['HERO', 'CHART', 'CALLOUT', 'PORTRAIT'].includes(typeStr)) type = typeStr;

            currentChapter.visuals?.push({
                type: type,
                description: desc,
                caption: desc // Default caption to description
            });
            // Don't add tag to content text
            return; 
        }

        // 2. Markdown Images: ![Description](url)
        const imgMatch = trimmed.match(mdImageRegex);
        if (imgMatch) {
            const alt = imgMatch[1];
            const url = imgMatch[2];
            currentChapter.visuals?.push({
                type: 'HERO', // Assume inline images are important
                description: alt,
                imageUrl: url,
                caption: alt
            });
            return; 
        }

        // 3. Normal Text
        currentContent.push(line);
    }
  });

  // Save final chapter
  if (currentChapter) {
      currentChapter.content = currentContent.join('\n').trim();
      chapters.push(currentChapter as Chapter);
  }

  // Create default Covers if missing
  const frontCover: Cover = {
      titleText: title,
      subtitleText: subtitle,
      visualDescription: "A striking cover representing the book topic.",
      imageUrl: "" // Can be filled by user later
  };
  
  const backCover: Cover = {
      blurb: "Imported manuscript.",
      visualDescription: "Abstract patterns.",
      imageUrl: ""
  };

  return {
      title,
      subtitle,
      frontCover,
      backCover,
      chapters
  };
};
