# Y-IT Machine 2 — Priority TODO List
> Last Updated: 2025-12-11 | Status: ACTIVE DEVELOPMENT | BONUS: Demo Mode Added! ✨

---

## ✅ P0 — CRITICAL (COMPLETED)

### Infrastructure & Stability
- [x] **Generate package-lock.json** — Reproducible builds ✅
  - Location: Project root
  - Command: `npm install --package-lock-only`
  - Completed: 2025-12-11

- [x] **Fix API key fail-fast** — App crashes mid-operation with empty key ✅
  - File: `services/core/LLMClient.ts`
  - Change: `console.warn` → `throw new Error` with helpful message
  - Completed: 2025-12-11

- [x] **Fix context memory leak** — New instances created every render ✅
  - File: `context/ProjectContext.tsx`
  - Change: Wrapped in `useMemo()`
  - Completed: 2025-12-11

- [x] **Add .env.example** — Document required environment variables ✅
  - Created: `.env.example` with API key instructions
  - Completed: 2025-12-11

---

## ✅ P1 — HIGH (COMPLETED)

### Reliability
- [x] **Add request timeout** — Hung API calls freeze UI ✅
  - File: `services/core/LLMClient.ts`
  - Added: 60s timeout using Promise.race pattern
  - Completed: 2025-12-11

- [x] **Fix Blob URL memory leak** — Audio URLs never revoked ✅
  - File: `components/PodcastStudio.tsx`
  - Added: `useEffect` cleanup with `URL.revokeObjectURL`
  - Completed: 2025-12-11

- [x] **Implement cache limits** — LocalStorage fills up ✅
  - File: `context/ProjectContext.tsx`
  - Added: Max 5 cached topics, FIFO eviction, corrupted cache handling
  - Completed: 2025-12-11

### Cost Optimization
- [x] **Add cost estimator UI** — Show estimated $ before generation ✅
  - Created: `components/CostEstimator.tsx`
  - Features: Token + image cost breakdown, API call count for free tier users
  - Completed: 2025-12-11

- [x] **Add "Text-Only Preview" mode** — Skip images initially ✅
  - File: `types.ts`
  - Added: `textOnlyMode` flag to GenSettings
  - Completed: 2025-12-11

- [x] **Implement image caching** — Reuse images for similar prompts ✅
  - Created: `services/media/ImageCacheService.ts`
  - Features: IndexedDB storage, 100 image limit, FIFO eviction, hash-based keys
  - Integrated: `services/media/ImageService.ts` now checks cache first
  - Completed: 2025-12-11

---

## 🟡 P2 — MEDIUM (Quality Improvements)

### Code Quality
- [ ] **Enable TypeScript strict mode** ⏸️ DEFERRED
  - File: `tsconfig.json`
  - Reason: Requires significant Zod schema refactoring first (pre-existing type inference issues)
  - Time: 2+ hours (larger than estimated)

- [x] **Improve JSON parser robustness** ✅
  - File: `utils/jsonParser.ts`
  - Added: 5 extraction strategies (direct, code block, JSON-in-text, aggressive cleanup, JSON fix)
  - Completed: 2025-12-11

- [x] **Add input sanitization** ✅
  - File: `components/InputSection.tsx`
  - Added: XSS prevention (script tags, event handlers), length limits (200 chars topic, 10K text)
  - Completed: 2025-12-11

### PDF Export
- [x] **Add image error recovery** ✅
  - File: `utils/pdfExport.ts`
  - Added: `safeAddImage()` helper with gray placeholder on failure
  - Completed: 2025-12-11

- [ ] **Add "export preview" before PDF generation** — Moved to P3
  - New component: Export preview modal
  - Time: 1 hour

---

## 🟢 P3 — LOW (Nice to Have)

### Features
- [ ] **Add progress saving/resume** — Persist state to IndexedDB
- [ ] **Add export to EPUB format**
- [ ] **Add multi-language support**
- [ ] **Add book template presets** — One-click genre configs

### DevOps
- [ ] **Add unit tests for services**
- [ ] **Add E2E tests with Playwright**
- [ ] **Add GitHub Actions CI/CD**
- [ ] **Add structured logging** — Replace console.log

### Polish
- [ ] **Add loading skeletons** — Better perceived performance
- [ ] **Add keyboard shortcuts**
- [ ] **Add dark/light theme toggle**

---

## 🔵 NEW REQUESTS (To Prioritize)

### UI/UX
- [ ] **Add Book Reader pagination**
  - Navigate through book page-by-page
  - Add page numbers, prev/next controls
  - Time: 1 hour

### Image Management
- [ ] **Image prompt export**
  - Export all image prompts/descriptions as JSON or text file
  - Allow regeneration of specific images
  - Time: 45 min

- [ ] **Image import**
  - Allow users to upload their own images to replace placeholders
  - Drag & drop or file picker for each visual slot
  - Time: 1 hour

### Publishing & Compliance
- [ ] **KDP Compliance Checks**
  - Verify margins, bleed settings, and DPI
  - Warn on low-res images (<300 DPI)
  - Ensure even number of pages (insert blanks)
  - Time: 2 hours

---

## ✅ COMPLETED

<!-- Move items here when done -->
- [x] **Full project audit** — 2025-12-11
- [x] **Build verification** — Passes as of 2025-12-11

---

## 📊 Sprint Planning

### Current Sprint Focus
> Pick 3-5 items per work session

**Session 1 Target:**
1. [ ] Generate package-lock.json (P0)
2. [ ] Fix API key fail-fast (P0)
3. [ ] Fix context memory leak (P0)
4. [ ] Add .env.example (P0)

**Session 2 Target:**
1. [ ] Add request timeout (P1)
2. [ ] Fix Blob URL memory leak (P1)
3. [ ] Implement cache limits (P1)

---

## 🏷️ Labels Reference

| Priority | Meaning | Action Timing |
|----------|---------|---------------|
| 🔴 P0 | Blocker/Critical | Before ANY use |
| 🟠 P1 | High Priority | This week |
| 🟡 P2 | Medium Priority | Next 2 weeks |
| 🟢 P3 | Low Priority | When time permits |

---

## Notes

- **API Choice Decision:** Staying on AI Studio free tier for now, optimizing for cost
- **Next Decision Point:** Re-evaluate paid API when launching to users
