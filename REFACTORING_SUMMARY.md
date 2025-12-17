# Research Component Removal - Refactoring Summary

**Date:** 2025-12-16
**Branch:** frosty-faraday
**Status:** COMPLETE

## Overview

This refactoring removed all deprecated research functionality from the codebase, as the app is transitioning from internal agent-based research to external Obsidian database management. The app now focuses solely on the content pipeline: Book generation, Podcast scripts, Image generation, and PDF export.

## Components Removed

### 1. **SpecializedAgents.ts** (DELETED)
- **Path:** `src/services/agents/SpecializedAgents.ts`
- **Removed Classes:**
  - `DetectiveAgent` - Reddit/forums investigation (REMOVED)
  - `AuditorAgent` - Financial cost analysis (REMOVED)
  - `InsiderAgent` - Case study collection (REMOVED)
  - `StatAgent` - Statistical data collection (REMOVED)
- **Impact:** These agents performed parallel research using hardcoded Gemini-only LLMClient

### 2. **orchestrator.ts** (STUBBED)
- **Path:** `src/services/orchestrator.ts`
- **Action:** Converted from full implementation to minimal stub
- **Kept Exports:**
  - `AgentStatus` type (for compatibility)
  - `AgentState` interface (for compatibility)
  - `ResearchCoordinator` class (throws error if called)
- **Reason:** ProjectContext imports these types; stub prevents breaking changes while warning about deprecation
- **Code Size Reduction:** ~150 lines to ~40 lines

## Code Modifications

### 3. **ProjectContext.tsx** (REFACTORED)
- **Removed:** ResearchCoordinator instantiation and imports
- **Modified:** `startInvestigation()` method
  - Removed `coordinator.execute()` call for full agent swarm
  - Removed `coordinator.normalizeLog()` call for raw text processing
  - Added simplified cache-miss handling with placeholder data
  - Added note about external Obsidian research requirement
- **Modified:** `createBranch()` method
  - Removed progress callback parameter from AuthorAgent.generateDraft()

**Result:** Research phase is now minimal; focuses on cached data or external uploads only

### 4. **InputSection.tsx** (DEPRECATED UI)
- **Disabled Research Engine UI:** Changed from dropdown selector to disabled field
- **Added deprecation notice:** "Moved to Obsidian Database"
- **Kept Intact:** Upload Intel button (for external research data)

### 5. **constants.ts** (CLEANED UP)
- **Removed Research Prompts:**
  - RESEARCH_SYSTEM_PROMPT
  - DETECTIVE_AGENT_PROMPT
  - AUDITOR_AGENT_PROMPT
  - INSIDER_AGENT_PROMPT
  - STAT_AGENT_PROMPT
- **Replaced With:** Single deprecation notice
- **Preserved:** All AUTHOR and PODCAST prompts (still in use)

## Content Pipeline - PRESERVED & WORKING

### Book Generation
- **File:** `src/services/agents/AuthorAgent.ts`
- **Status:** Active, used in ProjectContext for drafting
- **Multi-LLM Support:** Yes

### Podcast Generation
- **File:** `src/services/media/PodcastService.ts`
- **Status:** Active, called in ProjectContext.generatePodcast()
- **Voice selection:** Working

### Image Generation
- **File:** `src/services/media/ImageService.ts`
- **Status:** Active, supports multiple image models

### PDF Export
- **File:** `src/utils/pdfExport.ts` (lazy-loaded)
- **Status:** Active, export button functional

### Multi-LLM Provider System
- **Path:** `src/services/core/providers/`
- **Components:** AnthropicProvider, GeminiProvider, OpenAIProvider
- **Status:** Active, fully preserved

## Files Changed Summary

| File | Type | Lines Changed | Notes |
|------|------|---------------|-------|
| `src/services/agents/SpecializedAgents.ts` | DELETED | 143 removed | Specialized agents no longer needed |
| `src/services/orchestrator.ts` | MODIFIED | 152 to 40 lines | Stubbed to minimal exports only |
| `src/context/ProjectContext.tsx` | MODIFIED | ~100 lines | Removed coordinator instantiation & calls |
| `src/components/InputSection.tsx` | MODIFIED | ~15 lines | Disabled research engine UI |
| `src/constants.ts` | MODIFIED | ~40 lines | Removed 5 research prompts |
| **Total** | | **~350 lines removed** | |

## Testing Results

### TypeScript Compilation
- No TypeScript errors related to research components
- All imports resolve correctly
- All type references valid

### Runtime Verification
- AuthorAgent still imports and instantiates correctly
- PodcastService still imports and functional
- pdfExport still imports and lazy-loads
- Multi-LLM provider system still accessible
- Demo mode still works (uses generateDemoResearch)

### Integration Points
- ProjectContext.startInvestigation() now skips research phase
- Research data flow: external upload or cached data or placeholder
- Book generation pipeline unaffected
- Podcast generation pipeline unaffected
- All UI components render without errors

## Git Status

### Changes Made
- Deleted: `src/services/agents/SpecializedAgents.ts`
- Modified: `src/services/orchestrator.ts`
- Modified: `src/context/ProjectContext.tsx`
- Modified: `src/components/InputSection.tsx`
- Modified: `src/constants.ts`

### Ready to Commit
All changes are stable and tested. No breaking changes introduced.

## Migration Path for Users

### Pre-Refactor: How Research Worked
1. User enters topic
2. App spawns 4 specialized agents
3. Agents query LLM with hardcoded research prompts
4. Results synthesized into ResearchData JSON
5. AuthorAgent uses research to generate book

### Post-Refactor: How Research Works
1. User enters topic
2. User uploads research via "Upload Intel" button
   - Option A: Paste JSON matching ResearchData schema
   - Option B: Upload markdown/text (converted to basic structure)
3. OR if topic was previously cached, uses cached data
4. AuthorAgent uses provided research to generate book
5. (Future) Research comes from external Obsidian database

## Conclusion

Successfully removed all deprecated research components while maintaining:
- Full book generation capability
- Full podcast generation capability
- Full image generation capability
- Full PDF export functionality
- Multi-LLM provider system
- Zero breaking changes to public APIs
- Clear migration path for users

The app is now positioned for external research integration via Obsidian database, with all internal research generation removed.
