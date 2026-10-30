# Archival Field Monograph & Wildlife Cinema Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform ANIMALIA from a generic SaaS dashboard into a bespoke, Awwwards-caliber **"Archival Field Monograph meets Wildlife Cinema"** product inspired by National Geographic, London Natural History Museum plates, and Apple TV+ Planet Earth, preserving 100% of existing functionality, audio engines, and E2E test selectors.

**Architecture:**
1. **Design System & Typography Tokens (`index.html`, `src/index.css`, `tailwind.config.js`)**: Integrate Cormorant Garamond, Plus Jakarta Sans, and JetBrains Mono with zero-overhead SVG film-grain (`.archival-grain`), architectural hairline utilities, and dual-mode museum surfaces (Dark: "Obsidian Herbarium" `#070A09`; Light: "Linnaean Parchment" `#F5F2EB`).
2. **Editorial Masthead & Telemetry Bar (`src/components/common/Header.tsx`)**: Replace SaaS pill navigation with an expedition instrument strip (live GBIF/CoL backbone telemetry, specimen counts) and an editorial masthead with bottom indicator lines.
3. **Full-Bleed Specimen Plates & Magazine Grid (`AnimalCard.tsx`, `ExploreSection.tsx`)**: Redesign specimen cards into portrait poster plates (`aspect-[4/5]`) with cinematic slow-zoom photography, archival monospace stamps, architectural IUCN markers, and slide-up action trays; replace filter pills with a sleek Taxonomic Clade Index Bar.
4. **Natural History Monograph (`SpeciesExpeditionPage.tsx`, `HeroImageChanger.tsx`)**: Eliminate boxed widget syndrome in favor of chapter-indexed editorial monograph sections (`01 // MORPHOMETRIC SCALE`, etc.), drop-cap narratives, dotted-leader biometric data plaques, and a 35mm archival contact sheet filmstrip.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Web Audio API, @tanstack/react-virtual, Leaflet, PostgreSQL.

**Spec:** User prompt requirements and ANIMALIA Scientific Integrity Rules (`GEMINI.md`).

---

## Global Constraints

- **Zero Fabricated Biology (`GEMINI.md`)**: Never invent biological measurements, diets, or statuses. Unverified fields remain `null` and render as *"Not yet documented in available source record"*.
- **Strict Media Provenance (`GEMINI.md`)**: Every photograph must preserve `sourceUrl`, `attribution`, `licenseCode`, and `verifiedTaxonMatch`.
- **E2E Selector Preservation**: Do not break any selectors or string assertions used in `scripts/verify-animalia-e2e.js`, `scripts/verify-expedition-e2e.js`, `scripts/verify-bioacoustics-e2e.js`, or `scripts/verify-gallery-expansion-e2e.js`.
- **No Decorative-Only Controls**: Every filter, search bar, comparison toggle, and audio preview must execute real state transitions.
- **Flawless Type Safety**: `npm.cmd run build` (`tsc && vite build`) must succeed with zero compilation or lint errors.

---

## Review Focus

1. **Light / Dark Theme Contrast**: Verify that "Linnaean Parchment" (`#F5F2EB`) and "Obsidian Herbarium" (`#070A09`) maintain WCAG 2.1 AA text contrast across all typography, badges, and card overlays.
2. **E2E Test String Invariants**: Ensure `Header.tsx` preserves `Discovery & Quizzes`, `Collections`, `dark:bg-[#0B0F0E]`, `toggleTheme`, `role="banner"`, `role="navigation"`, and `aria-current`.
3. **ExploreSection Virtualizer Stability**: Verify that the full-bleed `aspect-[4/5]` card ratio in `AnimalCard.tsx` does not distort row heights or cause jitter in `@tanstack/react-virtual` during fast scrolling.
4. **Bioacoustic Audio Bus Mutual Exclusion**: Ensure audio triggers in the new slide-up hover tray on `AnimalCard.tsx` and hero capsule in `HeroImageChanger.tsx` maintain singleton playback without overlapping sound.
5. **Species Expedition Keyboard Shortcuts**: Ensure `Escape`, `ArrowLeft`, `ArrowRight`, `c`, `s`, `f`, `1`, `2`, `3`, `[`, `]` continue to be guarded against typing in text inputs.

---

## File Structure

```
index.html                                          # Upgraded Google Fonts & canvas background
src/
├── index.css                                       # Film grain, hairlines, dropcaps, dotted leaders
├── App.tsx                                         # Root canvas surfaces & theme integration
├── components/
│   ├── common/
│   │   ├── Header.tsx                              # Editorial masthead & archival telemetry strip
│   │   └── IucnBadge.tsx                           # Architectural IUCN Red List stamps
│   ├── discovery/
│   │   ├── AnimalCard.tsx                          # Full-bleed specimen plate with slide-up tray
│   │   └── ExploreSection.tsx                      # Taxonomic index bar & magazine grid rhythm
│   └── profile/
│       ├── SpeciesExpeditionPage.tsx               # Chapter-indexed field monograph layout
│       └── modules/
│           └── HeroImageChanger.tsx                # 35mm contact sheet filmstrip & museum caption
tailwind.config.js                                  # Obsidian Herbarium & Linnaean Parchment tokens
```

---

## Task Decomposition

### Task 1: Typography, Archival Hairlines & Tactile Film Grain (`index.html`, `src/index.css`, `tailwind.config.js`)

**Files:**
- Modify: `index.html:1-16`
- Modify: `src/index.css:1-33`
- Modify: `tailwind.config.js:1-28`

**Interfaces:**
- Consumes: Google Fonts API, Tailwind CSS layer directives.
- Produces: CSS utility classes (`.archival-grain`, `.hairline-grid`, `.specimen-stamp`, `.editorial-dropcap`, `.dotted-leader`) and theme color tokens (`canvas`, `surface`, `ink`, `muted`, `brass`, `botanical`).

- [ ] **Step 1: Update Google Fonts preloading in `index.html`**
  Add Cormorant Garamond (400, 500, 600, 700 + italic 400/600), JetBrains Mono (400, 500, 600), and Plus Jakarta Sans (400, 500, 600, 700). Maintain `Plus+Jakarta+Sans` in the link query to satisfy E2E verification assertions. Update `<body>` classes to use the warm Linnaean Parchment `#F5F2EB` and Obsidian Herbarium `#070A09` surfaces.

- [ ] **Step 2: Extend Tailwind color surfaces in `tailwind.config.js`**
  Configure the design tokens:
  ```javascript
  colors: {
    obsidian: {
      canvas: '#070A09',
      surface: '#0D1210',
      elevated: '#121917',
      ink: '#F2EFE9',
      muted: '#949E99',
      hairline: 'rgba(242, 239, 233, 0.08)'
    },
    parchment: {
      canvas: '#F5F2EB',
      surface: '#EBE6DC',
      elevated: '#FFFFFF',
      ink: '#141816',
      muted: '#5A625E',
      hairline: 'rgba(20, 24, 22, 0.12)'
    },
    monograph: {
      brass: '#D4A359',
      ochre: '#B8860B',
      emerald: '#2E6F54',
      forest: '#1B4D3E'
    }
  }
  ```

- [ ] **Step 3: Define tactile utilities and grain texture in `src/index.css`**
  Add zero-overhead SVG fractal noise texture (`.archival-grain`), architectural hairline utility classes (`.hairline-grid`, `.specimen-stamp`), editorial drop-cap rules (`.editorial-dropcap`), and museum plaque dotted leaders (`.dotted-leader`).

- [ ] **Step 4: Verify font loading and CSS compilation**
  Run: `npm.cmd run build`
  Expected: PASS with 0 TypeScript/CSS errors.

- [ ] **Step 5: Verify E2E assertions for typography and theme**
  Run: `node scripts/verify-animalia-e2e.js`
  Expected: Step 1 (Typography Preloaded, Root Container Mounted) passes.

---

### Task 2: Redesign `Header.tsx` into an Editorial Masthead & Expedition Instrument Bar

**Files:**
- Modify: `src/components/common/Header.tsx:1-126`

**Interfaces:**
- Consumes: `HeaderProps` (`activeTab`, `setActiveTab`, `comparedCount`, `savedCount`, `theme`, `toggleTheme`).
- Produces: Semantic masthead with archival telemetry strip, live GBIF/CoL status, editorial tab links with active bottom border indicators, and command-palette trigger.

- [ ] **Step 1: Implement archival status strip (Top Telemetry Bar)**
  Add a thin top bar (`border-b border-parchment-hairline dark:border-obsidian-hairline text-[11px] font-mono`) displaying:
  - `CATALOGUE OF LIFE // GBIF BACKBONE ACTIVE` with a pulsing botanical emerald indicator (`w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse`).
  - Active catalog count (`INDEX: 164 TAXA VERIFIED`).
  - Archival celestial theme switcher toggle with tooltip `Linnaean Parchment / Obsidian Herbarium`.

- [ ] **Step 2: Redesign Main Masthead & Editorial Typography**
  - Brand: Render `ANIMALIA` in monumental `Cormorant Garamond` serif (`text-2xl tracking-[0.2em] font-bold`) accompanied by an archival compass badge and `VOL. VI // FIELD MONOGRAPH` metadata stamp.
  - Search trigger: Add an expedition command-bar shortcut hint (`⌘K` / `/`) directing focus to the taxonomic search input.

- [ ] **Step 3: Replace SaaS Pill Buttons with Editorial Tabs**
  Replace rounded pill buttons with editorial tab links with crisp active bottom border indicators:
  - `EXPLORE`
  - `DISCOVERY & QUIZZES` (with Lucide icon and test-mandated text)
  - `COLLECTIONS` (with test-mandated text)
  - `COMPARE (${comparedCount})`
  - `ANTIGRAVITY HANDOFF`
  Preserve `role="banner"`, `role="navigation"`, `aria-current`, and the class `dark:bg-[#0B0F0E]` to maintain 100% compliance with `scripts/verify-animalia-e2e.js`.

- [ ] **Step 4: Verify Header compilation & E2E assertions**
  Run: `npm.cmd run build && node scripts/verify-animalia-e2e.js`
  Expected: PASS with Header checks confirmed.

---

### Task 3: Redesign `AnimalCard.tsx` & `ExploreSection.tsx` into Full-Bleed Specimen Plates

**Files:**
- Modify: `src/components/discovery/AnimalCard.tsx:1-244`
- Modify: `src/components/discovery/ExploreSection.tsx:1-737`

**Interfaces:**
- Consumes: `AnimalRecord`, `useVirtualizer`, `globalAudioBus`, `searchLiveBiodiversityGlobal`.
- Produces: Full-bleed specimen plate cards (`aspect-[4/5]`) with slide-up action bar, and an asymmetric magazine grid with a horizontal Taxonomic Index Bar.

- [ ] **Step 1: Transform `AnimalCard.tsx` into a Full-Bleed Specimen Plate**
  - Convert outer wrapper to `aspect-[4/5] relative overflow-hidden group cursor-pointer border border-parchment-hairline dark:border-obsidian-hairline rounded-2xl bg-obsidian-elevated`.
  - Image fills 100% frame with cinematic slow zoom on hover: `group-hover:scale-[1.04] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]`.
  - Top-left: Archival index stamp `NO. ${id.slice(-3)} // ${categoryGroup.toUpperCase()}` in monospace.
  - Top-right: Architectural IUCN stamp (`[VU]`, `[EN]`, `[LC]`) and quick collection/comparison pins.
  - Bottom vignette: Deep multi-stop gradient (`bg-gradient-to-t from-black/95 via-black/60 to-transparent`) holding:
    - Monumental common name in `Cormorant Garamond` (`text-2xl font-bold tracking-tight text-white`).
    - Italicized scientific binomial (`font-serif italic text-amber-200/90 text-sm`).
    - Distinguishing biological trait excerpt.
  - Slide-up action bar on hover (`opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300`):
    - Bioacoustic preview trigger (AudioWaveformIcon + Play/Pause).
    - `+ Compare` button.
    - `Open Monograph →` button.

- [ ] **Step 2: Build the Taxonomic Index Bar in `ExploreSection.tsx`**
  Replace bubbly category pills with a sleek horizontal **Taxonomic Index Bar**:
  - Render category labels in `font-serif text-sm tracking-wide` with monospace specimen counts `[21]`, `[15]`.
  - Crisp active bottom borders (`border-b-2 border-monograph-brass text-monograph-brass dark:text-[#D4A359]`).
  - Maintain all ARIA roles: `role="search"`, `role="region"`, `role="group"`, `aria-live="polite"`.

- [ ] **Step 3: Implement Magazine Grid Rhythm**
  In grid view, implement magazine rhythm by styling flagship featured cards (e.g. every 7th specimen plate on desktop `lg:` displays an expanded editorial plate stamp `lg:col-span-2 aspect-[16/10]` or prominent archival plate header), while maintaining strict row height measurement in `@tanstack/react-virtual`.

- [ ] **Step 4: Verify Card & Explore compilation and test suite**
  Run: `npm.cmd run build && node scripts/verify-animalia-e2e.js`
  Expected: Virtualization & Accessibility assertions pass with 90/90 checks.

---

### Task 4: Transform `SpeciesExpeditionPage.tsx` & `HeroImageChanger.tsx` to an Editorial Field Monograph

**Files:**
- Modify: `src/components/profile/SpeciesExpeditionPage.tsx:1-700`
- Modify: `src/components/profile/modules/HeroImageChanger.tsx:1-485`

**Interfaces:**
- Consumes: `animal: AnimalRecord`, `allAnimals`, `onUpdateAnimal`, `enrichAnimalWithGbif`, `GeospatialDistributionViewer`.
- Produces: Natural history monograph chapters with architectural hairlines, drop-cap opening narratives, museum plaque dotted-leader tables, and a 35mm contact sheet filmstrip.

- [ ] **Step 1: Polish `HeroImageChanger.tsx` into a 35mm Contact Sheet**
  - Frame the filmstrip like a **35mm Archival Contact Sheet** with crisp frame indicators (`FRAME 01`, `FRAME 02`, `FRAME 03`) and sprocket-style frame borders.
  - Style the caption bar as an **Archival Museum Plaque** with verified recordist credit, CC license stamp (`CC-BY-SA 4.0`), and source repository link.
  - Preserve keyboard shortcuts `[` and `]` and audio preview capsule.

- [ ] **Step 2: Restructure `SpeciesExpeditionPage.tsx` into Monograph Chapters**
  Eliminate boxed dashboard widgets in favor of chapter-indexed architectural dividers:
  - `CHAPTER 01 // MORPHOMETRIC SCALE & MASS BIOMETRICS`
  - `CHAPTER 02 // HABITAT & BIOME ENVELOPE`
  - `CHAPTER 03 // GEOSPATIAL OCCURRENCE & DISTRIBUTION RANGE`
  - `CHAPTER 04 // BIOLOGICAL ADAPTATIONS & DIAGNOSTIC TRAITS`
  - `CHAPTER 05 // TAXONOMIC LINEAGE & CLADISTIC DESCENT`
  - `CHAPTER 06 // BIOACOUSTIC VOCALIZATION SIGNATURE`
  Each chapter begins with a full-width architectural hairline (`border-t border-parchment-hairline dark:border-obsidian-hairline pt-8`), monospace index number, and monumental Cormorant Garamond serif title.

- [ ] **Step 3: Add Editorial Monograph Drop-Cap & Dotted Leader Plaque Tables**
  - Format the opening biological overview with an editorial drop-cap (`first-letter:font-serif first-letter:text-5xl first-letter:float-left first-letter:mr-3 first-letter:font-bold first-letter:text-monograph-brass`) and generous line height (`leading-relaxed font-serif text-lg`).
  - Format biometric and taxonomic data using museum-style dotted leaders (`Length ................................... 115 cm`, `Mass ....................................... 55 kg`, `IUCN Red List .................... Vulnerable [VU]`).

- [ ] **Step 4: Verify Species Expedition test suite**
  Run: `node scripts/verify-expedition-e2e.js`
  Expected: 34/34 checks pass.

---

### Task 5: Comprehensive Visual & Automated E2E Verification

**Files:**
- Test execution across all verification scripts and headless visual inspection.

- [ ] **Step 1: Run Full Production Build**
  Run: `npm.cmd run build`
  Expected: Exit code 0, clean build artifacts in `dist/`.

- [ ] **Step 2: Run All E2E Verification Scripts**
  Run:
  - `node scripts/verify-animalia-e2e.js`
  - `node scripts/verify-expedition-e2e.js`
  - `node scripts/verify-bioacoustics-e2e.js`
  - `node scripts/verify-gallery-expansion-e2e.js`
  Expected: All test suites report 100% passing status.

- [ ] **Step 3: Browser Visual Inspection**
  Inspect `http://localhost:5173`:
  - Check Dark Mode ("Obsidian Herbarium"): Rich `#070A09` canvas, tactile film grain, warm brass highlights (`#D4A359`), and botanical emerald accents.
  - Check Light Mode ("Linnaean Parchment"): Warm `#F5F2EB` museum cotton paper, crisp hairlines, and legible editorial typography.
  - Check AnimalCard hover transitions and audio quick-listen triggers.
  - Check SpeciesExpeditionPage chapter hairlines, drop-cap narrative, and 35mm contact sheet.
