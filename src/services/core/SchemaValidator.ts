
import { z } from "zod";

// --- Research Schemas ---

export const StatSchema = z.object({
  label: z.coerce.string(),
  value: z.coerce.string(),
  context: z.coerce.string(),
});

export const CaseStudySchema = z.object({
  name: z.coerce.string(),
  type: z.enum(['WINNER', 'LOSER']).or(z.string()), // Allow relaxed string if enum mismatch
  background: z.coerce.string(),
  strategy: z.coerce.string(),
  outcome: z.coerce.string(),
  revenue: z.coerce.string(),
});

export const AffiliateOppSchema = z.object({
  program: z.coerce.string(),
  potential: z.coerce.string().optional(),
  type: z.enum(['PARTICIPANT', 'WRITER']).or(z.string()),
  commission: z.coerce.string(),
  notes: z.coerce.string(),
});

export const ResearchDataSchema = z.object({
  summary: z.coerce.string(),
  ethicalRating: z.coerce.number().min(1).max(10),
  profitPotential: z.coerce.string(),
  marketStats: z.array(StatSchema),
  hiddenCosts: z.array(StatSchema),
  caseStudies: z.array(CaseStudySchema),
  affiliates: z.array(AffiliateOppSchema),
});

export type ValidatedResearchData = z.infer<typeof ResearchDataSchema>;

// --- Book Schemas ---

export const VisualElementSchema = z.object({
  type: z.enum(['HERO', 'CHART', 'CALLOUT', 'PORTRAIT', 'DIAGRAM']).or(z.string()),
  description: z.coerce.string(),
  caption: z.coerce.string().optional(),
  imageUrl: z.string().optional(),
});

export const CoverSchema = z.object({
  titleText: z.string().optional(),
  subtitleText: z.string().optional(),
  blurb: z.string().optional(),
  visualDescription: z.coerce.string(),
  imageUrl: z.string().optional(),
});

export const PosiBotQuoteSchema = z.object({
  position: z.enum(['LEFT', 'RIGHT']).or(z.string()),
  text: z.coerce.string(),
});

export const ChapterSchema = z.object({
  number: z.coerce.number(),
  title: z.coerce.string(),
  content: z.coerce.string(),
  posiBotQuotes: z.array(PosiBotQuoteSchema).optional(),
  visuals: z.array(VisualElementSchema).optional(),
});

export const BookSchema = z.object({
  title: z.coerce.string(),
  subtitle: z.coerce.string(),
  frontCover: CoverSchema.optional(),
  backCover: CoverSchema.optional(),
  chapters: z.array(ChapterSchema),
});

export type ValidatedBook = z.infer<typeof BookSchema>;

// --- Architecture Schemas (Step 1 of Generation) ---

export const ChapterBriefSchema = z.object({
  number: z.coerce.number(),
  title: z.coerce.string(),
  detailedBrief: z.coerce.string(),
});

export const OutlineSchema = z.object({
  title: z.coerce.string(),
  subtitle: z.coerce.string(),
  frontCover: CoverSchema.optional(),
  backCover: CoverSchema.optional(),
  chapterBriefs: z.array(ChapterBriefSchema),
});

export type ValidatedOutline = z.infer<typeof OutlineSchema>;

// --- Chapter Content Schemas (Step 2 of Generation) ---

export const ChapterContentSchema = z.object({
  content: z.coerce.string(),
  posiBotQuotes: z.array(PosiBotQuoteSchema).optional(),
  visuals: z.array(VisualElementSchema).optional(),
});

export type ValidatedChapterContent = z.infer<typeof ChapterContentSchema>;


// --- Podcast Schemas ---

export const PodcastScriptLineSchema = z.object({
    speaker: z.coerce.string(),
    text: z.coerce.string()
});

export const PodcastScriptSchema = z.object({
    title: z.coerce.string(),
    lines: z.array(PodcastScriptLineSchema)
});

export type ValidatedPodcastScript = z.infer<typeof PodcastScriptSchema>;
