import { z } from "zod";

// --- Research Schemas ---

export const StatSchema = z.object({
  label: z.string(),
  value: z.string(),
  context: z.string(),
});

export const CaseStudySchema = z.object({
  name: z.string(),
  type: z.enum(['WINNER', 'LOSER']),
  background: z.string(),
  strategy: z.string(),
  outcome: z.string(),
  revenue: z.string(),
});

export const AffiliateOppSchema = z.object({
  program: z.string(),
  potential: z.string(),
  type: z.enum(['PARTICIPANT', 'WRITER']),
  commission: z.string(),
  notes: z.string(),
});

export const ResearchDataSchema = z.object({
  summary: z.string(),
  ethicalRating: z.number().min(1).max(10),
  profitPotential: z.string(),
  marketStats: z.array(StatSchema),
  hiddenCosts: z.array(StatSchema),
  caseStudies: z.array(CaseStudySchema),
  affiliates: z.array(AffiliateOppSchema),
});

export type ValidatedResearchData = z.infer<typeof ResearchDataSchema>;

// --- Book Schemas ---

export const VisualElementSchema = z.object({
  type: z.enum(['HERO', 'CHART', 'CALLOUT', 'PORTRAIT', 'DIAGRAM']),
  description: z.string(),
  caption: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const CoverSchema = z.object({
  titleText: z.string().optional(),
  subtitleText: z.string().optional(),
  blurb: z.string().optional(),
  visualDescription: z.string(),
  imageUrl: z.string().optional(),
});

export const PosiBotQuoteSchema = z.object({
  position: z.enum(['LEFT', 'RIGHT']),
  text: z.string(),
});

export const ChapterSchema = z.object({
  number: z.number(),
  title: z.string(),
  content: z.string(),
  posiBotQuotes: z.array(PosiBotQuoteSchema).optional(),
  visuals: z.array(VisualElementSchema).optional(),
});

export const BookSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  frontCover: CoverSchema.optional(),
  backCover: CoverSchema.optional(),
  chapters: z.array(ChapterSchema),
});

export type ValidatedBook = z.infer<typeof BookSchema>;