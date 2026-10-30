# Launch Sprint 1: Viral Engagement & Shareable Artifacts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement ANIMALIA Daily (the daily bioacoustic and taxonomic mystery deduction challenge) and the Printable Archival Monograph & Poster Exporter while strictly maintaining the Archival Field Monograph aesthetic ("Obsidian Herbarium" & "Linnaean Parchment") and `GEMINI.md` scientific integrity rules.

**Architecture:**
1. **Deterministic Daily Mystery Engine (`DailySpecimenMystery.tsx`, `Header.tsx`)**:
   - Universal deterministic UTC date hash mapped against flagship taxa pool to seed the mystery animal worldwide.
   - Progressive 5-stage clue dossier: 1) Taxonomy/Realm envelope, 2) Bioacoustic signature (FFT sonogram / honest silence), 3) Scale silhouette vs Human 1.75m, 4) Redacted biological adaptation superpower (`[REDACTED TAXON]`), 5) Macro specimen plate + Order/Family.
   - Smart autocomplete input with real-time clade feedback (`Phylum`, `Class`, `Order`, `Family`, `Genus`) comparing guess to target.
   - Spoiler-free clipboard share dispatch generator (`ANIMALIA // FIELD DISPATCH #...`) and `localStorage` persistence.
2. **Archival Broadsheet & Poster Exporter (`MonographPosterExporter.tsx`, `SpeciesExpeditionPage.tsx`, `src/index.css`)**:
   - Interactive Linnaean specimen broadsheet preview with monumental Garamond typography, high-res photo attribution, dotted-leader morphometrics, 7-rank lineage, and adaptations.
   - `@media print` clean single-page vector PDF styling in `src/index.css` with zero UI chrome.
   - Offscreen HTML5 `<canvas>` high-res PNG poster generator with resilient CORS fallback to taxonomic silhouettes.
3. **Automated Verification Suite (`scripts/verify-viral-features-e2e.js`)**:
   - Deterministic seed validation, clade feedback truth table, clue redaction scanner, share dispatch formatting, and export DOM mounting.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Web Audio API, HTML5 Canvas API, CSS `@media print`.

**Spec:** User prompt requirements and `GEMINI.md` scientific integrity guidelines.

---

## Global Constraints

- **Zero Fabricated Biology (`GEMINI.md`)**: Never invent biological measurements, lifespans, diets, or statuses. All unverified fields remain `null` and render as *"Not yet documented in available source record"*.
- **Strict Media Provenance (`GEMINI.md`)**: Every photograph must preserve `sourceUrl`, `attribution`, `licenseCode`, and `verifiedTaxonMatch`. Fallback to `<TaxonomicSilhouette />` when unverified or restricted.
- **Data Source Transparency (`GEMINI.md`)**: Every taxon record must declare provenance: `LOCAL_DEMO_RECORD`, `IMPORTED_REPOSITORY_RECORD`, `LIVE_API_RESULT`, or `CACHED_RECORD`.
- **E2E Selector & Navigation Preservation**: Do not break any selectors or string assertions in `scripts/verify-animalia-e2e.js`, `scripts/verify-expedition-e2e.js`, `scripts/verify-bioacoustics-e2e.js`.
- **Zero Compilation Errors**: `npm.cmd run build` (`tsc && vite build`) must succeed with zero TypeScript or CSS errors.

---

## Review Focus

1. **Deterministic Daily Seed Invariance**: Confirm that users in any timezone on the same UTC date receive the identical mystery taxon, and day index #142 evaluates accurately on 2026-10-30.
2. **Clue Redaction Leak Prevention**: Ensure common names, scientific binomials, and genus names are strictly replaced with `[REDACTED TAXON]` in Clue 4 and audio track metadata in Clue 2.
3. **Canvas Taint & CORS Resilience**: Verify that if a remote photo source has restricted CORS headers, the PNG canvas exporter does not throw a SecurityError and gracefully falls back to the vector taxonomic silhouette.
4. **Print CSS Chrome Isolation**: Ensure `@media print` suppresses all background application headers, sticky bars, navigation tabs, and modal overlays, leaving exclusively the pristine A4 monograph broadsheet.
5. **Taxonomic Clade Matching Accuracy**: Verify that clade feedback accurately distinguishes between match (`✓`), divergence at Family (`✗`), Order (`✗`), Class (`✗`), and Phylum (`✗`).

---

## File Structure

```
src/
├── components/
│   ├── common/
│   │   └── Header.tsx                                     # Add "DAILY MYSTERY // SPECIMEN #..." masthead button
│   ├── engagement/
│   │   ├── DailySpecimenMystery.tsx                       # New 5-stage daily deduction challenge & dispatch share
│   │   └── DailyDiscoveryHero.tsx                         # Mystery challenge trigger banner
│   └── profile/
│       ├── SpeciesExpeditionPage.tsx                      # Add "Export Monograph Plate" action in control bar
│       └── modules/
│           ├── BioacousticVocalizationDeck.tsx            # Support mysteryMode (redacted titles)
│           └── MonographPosterExporter.tsx                # New Linnaean broadsheet preview, PDF print & PNG canvas
├── index.css                                              # Add @media print rules for #archival-monograph-plate
scripts/
└── verify-viral-features-e2e.js                           # New automated verification suite for viral features
```

---

## Task Decomposition

### Task 1: Bioacoustic Redaction & Clade Matching Engine

**Files:**
- Modify: `src/components/profile/modules/BioacousticVocalizationDeck.tsx:28-40,366-385`
- Create: `src/utils/taxonomicMysteryEngine.ts`
- Test: `scripts/verify-viral-features-e2e.js`

**Interfaces:**
- Consumes: `AnimalRecord` from `src/types/taxonomy.ts`.
- Produces: `getDailyMysteryTaxon(taxa: AnimalRecord[], dateStr?: string): { taxon: AnimalRecord, dayNumber: number }`, `compareClades(guess: AnimalRecord, target: AnimalRecord): CladeMatchResult`, `redactSpecimenText(text: string, target: AnimalRecord): string`.

- [ ] **Step 1: Write failing unit test for `taxonomicMysteryEngine.ts` in `scripts/verify-viral-features-e2e.js`**
  Verify deterministic date seed (e.g., `2026-10-30` resolves day #142 consistently), clade comparison between two taxa (Panthera leo vs Panthera tigris has matching phylum, class, order, family, genus; Panthera leo vs Canis lupus matches phylum, class, order, but mismatches family), and biological text redaction.

- [ ] **Step 2: Run test to verify failure**
  Run: `node scripts/verify-viral-features-e2e.js`
  Expected: FAIL with "Cannot find module '../src/utils/taxonomicMysteryEngine.ts'".

- [ ] **Step 3: Implement `src/utils/taxonomicMysteryEngine.ts`**
  - Implement `hashDateToSeed(dateStr: string): number`
  - Implement `getDailyDayNumber(dateStr?: string): number` using epoch `2026-06-10T00:00:00Z` so `2026-10-30` yields Day #142.
  - Implement `getDailyMysteryTaxon(taxa: AnimalRecord[], dateStr?: string)` selecting from verified flagship taxa.
  - Implement `compareClades(guess: AnimalRecord, target: AnimalRecord)` returning `{ phylum: boolean, class: boolean, order: boolean, family: boolean, genus: boolean, isExactMatch: boolean, matchCount: number }`.
  - Implement `redactSpecimenText(text: string, target: AnimalRecord): string` replacing commonName, scientificName, and genus with `[REDACTED TAXON]`.
  - Implement `generateDispatchShareText(dayNumber: number, dateStr: string, solved: boolean, solvedClueStage: number, guesses: { matchCount: number }[]): string`.

- [ ] **Step 4: Update `BioacousticVocalizationDeck.tsx` to support `mysteryMode`**
  Add optional prop `mysteryMode?: boolean` to `BioacousticVocalizationDeckProps`. When `mysteryMode` is true, display `"[REDACTED BIOACOUSTIC SIGNATURE]"` instead of animal common name/recording title, suppress species taxonomy chips, and retain live 60fps Web Audio FFT spectrogram, oscillogram, and honest non-vocal/paleo fallback notes.

- [ ] **Step 5: Run test to verify pass**
  Run: `node scripts/verify-viral-features-e2e.js`
  Expected: PASS on taxonomic mystery engine assertions.

---

### Task 2: "ANIMALIA Daily" — The Daily Bioacoustic & Taxonomic Mystery (`DailySpecimenMystery.tsx` & `Header.tsx`)

**Files:**
- Create: `src/components/engagement/DailySpecimenMystery.tsx`
- Modify: `src/components/common/Header.tsx:1-80`
- Modify: `src/App.tsx:16-100,175-200`
- Modify: `src/components/engagement/DailyDiscoveryHero.tsx:1-40`
- Test: `scripts/verify-viral-features-e2e.js`

**Interfaces:**
- Consumes: `allAnimals: AnimalRecord[]`, `onSelectAnimal: (animal: AnimalRecord) => void`, `isOpen: boolean`, `onClose: () => void`.
- Produces: Interactive modal with 5-stage progressive dossier, smart autocomplete with clade warm/cold feedback, Wordle-style expedition dispatch sharing, and `localStorage` persistence under key `animalia_daily_mystery_v1`.

- [ ] **Step 1: Write test assertion for `DailySpecimenMystery.tsx` and Masthead button in `scripts/verify-viral-features-e2e.js`**
  Verify component exports, localStorage state schema, 5-stage clue rendering, and presence of `DAILY MYSTERY // SPECIMEN #` in `Header.tsx`.

- [ ] **Step 2: Run test to verify failure**
  Run: `node scripts/verify-viral-features-e2e.js`
  Expected: FAIL with "Cannot find module DailySpecimenMystery.tsx".

- [ ] **Step 3: Implement `DailySpecimenMystery.tsx`**
  - **Header & Controls**: Monumental title `DAILY BIOACOUSTIC & TAXONOMIC MYSTERY`, Specimen day stamp (`#142 // 2026-10-30`), Practice Archive Mode toggle, Daily Streak indicator, and Help/Close actions.
  - **Progressive Clue Dossier (5 Stages)**:
    - Stage 1: Kingdom & Phylum, Biogeographic Realm, Elevation/Depth Envelope.
    - Stage 2: Embedded `BioacousticVocalizationDeck` with `mysteryMode={true}`.
    - Stage 3: Scale Comparator silhouette showing mystery organism scaled beside Adult Human 1.75m.
    - Stage 4: Diagnostic adaptation superpower with `[REDACTED TAXON]`.
    - Stage 5: Blurred/cropped macro specimen plate + Taxonomic Order & Family.
  - **Smart Taxonomic Autocomplete Input**:
    - Live search against all catalog taxa with dropdown previewing common and scientific names.
    - Submit Guess button + "Skip / Reveal Next Clue" button.
  - **Warm / Cold Clade Feedback Grid**:
    - For each guess, render a Linnaean plaque with rank checks: `Phylum ✓`, `Class ✓`, `Order ✗`, `Family ✗`, `Genus ✗`.
  - **Victory / Completion Dossier & Share Dispatch**:
    - Unblurred specimen card reveal, victory fanfare, streak counter, and 1-click **"Copy Field Dispatch"** button copying the Wordle-style share block.
  - **Persistence**: Store `{ lastPlayedDate, streak, totalSolved, totalPlayed, todayGuesses, todaySolved, todayRevealedClues }` in `localStorage` under `animalia_daily_mystery_v1`.

- [ ] **Step 4: Connect Daily Mystery trigger in `Header.tsx` & `App.tsx`**
  - In `Header.tsx`, add `DAILY MYSTERY // SPECIMEN #...` button in the Telemetry Strip / Masthead with an archival pulsed badge.
  - In `App.tsx`, maintain `isDailyMysteryOpen` state, wire `onOpenDailyMystery` through `Header`, and mount `DailySpecimenMystery`.
  - In `DailyDiscoveryHero.tsx`, add a shortcut banner to launch the Daily Mystery.

- [ ] **Step 5: Run test to verify pass**
  Run: `node scripts/verify-viral-features-e2e.js`
  Expected: PASS on Daily Mystery component and Masthead integration.

---

### Task 3: Printable Archival Monograph & Poster Exporter (`MonographPosterExporter.tsx` & `src/index.css`)

**Files:**
- Create: `src/components/profile/modules/MonographPosterExporter.tsx`
- Modify: `src/components/profile/SpeciesExpeditionPage.tsx:280-325`
- Modify: `src/index.css:70-120`
- Test: `scripts/verify-viral-features-e2e.js`

**Interfaces:**
- Consumes: `animal: AnimalRecord`, `onClose: () => void`.
- Produces: Interactive broadsheet preview modal, `window.print()` single-page vector print layout, and HTML5 Canvas 2x PNG poster downloader.

- [ ] **Step 1: Write test assertion for `MonographPosterExporter.tsx` and Print CSS in `scripts/verify-viral-features-e2e.js`**
  Verify component exports, `@media print` rules in `src/index.css`, and presence of "Export Monograph Plate" in `SpeciesExpeditionPage.tsx`.

- [ ] **Step 2: Run test to verify failure**
  Run: `node scripts/verify-viral-features-e2e.js`
  Expected: FAIL with "Cannot find module MonographPosterExporter.tsx".

- [ ] **Step 3: Add `@media print` rules to `src/index.css`**
  Add dedicated print stylesheet rules:
  ```css
  @media print {
    body {
      background: #F5F2EB !important;
      color: #141816 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    header, nav, footer, button, .no-print, [role="banner"], [role="navigation"] {
      display: none !important;
    }
    #archival-monograph-plate {
      display: block !important;
      position: absolute;
      left: 0;
      top: 0;
      width: 100% !important;
      margin: 0 !important;
      padding: 16mm !important;
      box-shadow: none !important;
      border: 2px solid #141816 !important;
    }
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
  }
  ```

- [ ] **Step 4: Implement `MonographPosterExporter.tsx`**
  - **Archival Broadsheet Preview Container (`#archival-monograph-plate`)**:
    - Outer museum double hairline frame (`border-2 border-[#141816] p-6`).
    - Monumental Header: `ANIMALIA ARCHIVAL MONOGRAPH // GBIF:{animal.gbifTaxonKey || animal.id}`, Common Name in monumental `Cormorant Garamond`, scientific binomial italicized + authorship, official IUCN Red List stamp.
    - High-resolution primary photograph with photographer attribution & CC license plaque (or `<TaxonomicSilhouette />` if absent).
    - Two-column editorial spread below:
      - Left Column: Drop-cap biological description (`.editorial-dropcap`), 7-rank taxonomic lineage table (Kingdom to Species).
      - Right Column: Dotted-leader biometric table (`Length`, `Mass`, `Lifespan`, `Trophic Guild`, `Elevation Envelope`), and Key Evolutionary Adaptations plaque.
      - Footer Archival Seal: Authenticity stamp, expedition registration code, date.
  - **Action 1: `Print / Save as PDF Dossier`**:
    - Triggers `window.print()` with `@media print` styling.
  - **Action 2: `Download Specimen Card (.png)`**:
    - Offscreen HTML5 `<canvas>` rendering (1200 x 1600 px high-DPI).
    - Renders parchment background `#F5F2EB`, double border lines, Garamond typography, IUCN badge, and editorial text.
    - Loads animal photo via `Image` with `crossOrigin = 'anonymous'`. If CORS allows, draws photo; if tainted/error, renders vector taxonomic silhouette.
    - Exports blob as `animalia-${scientificName}-plate.png` and triggers browser download.

- [ ] **Step 5: Add `Export Monograph Plate` button in `SpeciesExpeditionPage.tsx`**
  In the sticky Expedition Control Bar next to Compare and Bookmark, add the `Export Monograph Plate` button. When clicked, opens the `MonographPosterExporter` modal.

- [ ] **Step 6: Run test to verify pass**
  Run: `node scripts/verify-viral-features-e2e.js`
  Expected: PASS on Monograph Poster Exporter and print stylesheet assertions.

---

### Task 4: Automated Verification, Build Validation & Visual Check

**Files:**
- Create/Complete: `scripts/verify-viral-features-e2e.js`
- Test: `scripts/verify-viral-features-e2e.js`
- Build: `npm.cmd run build`

- [ ] **Step 1: Run comprehensive viral features E2E verification**
  Run: `node scripts/verify-viral-features-e2e.js`
  Expected: All checks pass (Deterministic Seed, Clade Matching, Redaction, Share Dispatch, Broadsheet Exporter, Print CSS).

- [ ] **Step 2: Run full existing test suites to prevent regressions**
  Run: `node scripts/verify-expedition-e2e.js`
  Expected: 33/33 unit/architecture assertions pass.

- [ ] **Step 3: Run production build**
  Run: `npm.cmd run build`
  Expected: Clean compilation with 0 TypeScript and 0 CSS errors.

- [ ] **Step 4: Visual verification**
  Start Vite dev server and inspect both Daily Mystery modal and Monograph Poster Exporter across Linnaean Parchment and Obsidian Herbarium modes.
