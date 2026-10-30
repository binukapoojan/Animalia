# Multi-Image Hero Changer & Mass Taxonomic Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the profile header into an interactive multi-photo gallery changer with filmstrip carousel, auto-cycle slideshow, and dynamic attribution, while expanding ANIMALIA's catalog with 100+ iconic living and extinct flagships and infinite global biodiversity streaming across 2.1M+ species.

**Architecture:**
1. A multi-photo harvester service in `mediaResolverService.ts` queries iNaturalist `taxon_photos`, Wikimedia Commons REST `page/media-list`, and GBIF media API to construct verified 4–10 photo galleries with persistent localStorage caching.
2. A responsive `HeroImageChanger.tsx` module integrated into `SpeciesExpeditionPage.tsx` with smooth crossfade transitions, keyboard controls (`[` and `]`), interactive thumbnail filmstrip, 5-second auto-cycle slideshow with visual timer bar, and live photographer attribution.
3. A mass harvesting script `scripts/mass-harvest-taxa.js` that enriches and inserts 100+ prehistoric, deep-sea, insect, reptile, and Sri Lankan endemic flagships directly into PostgreSQL (`public.taxa`, `public.taxon_media` on `127.0.0.1:54322`) and synchronizes `animalia-handoff-bundle.json`.
4. An infinite biodiversity streaming pagination bar in `ExploreSection.tsx` mapped to iNaturalist iconic clade IDs and GBIF extinct taxa, allowing seamless on-demand loading and auto-stream on scroll.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, PostgreSQL 16 (`pg`), iNaturalist API v1, Wikimedia REST API, GBIF Species & Media API, Lucide Icons.

**Spec:** User prompt requirements from 2026-10-30 session.

---

## Global Constraints

- **Zero Fabricated Biology (`GEMINI.md`)**: Morphometric measurements must never be fabricated; unrecorded values remain `null`.
- **Strict Image Provenance (`GEMINI.md`)**: Every photograph must preserve `sourceUrl`, `attribution`, `licenseCode`, and `verifiedTaxonMatch: true`.
- **No CORS Pitfalls on `<img>`**: Do NOT hardcode `crossOrigin="anonymous"` on standard `<img>` tags. Use `referrerPolicy="no-referrer"` and `loading="lazy"`.
- **Zero Decorative Controls**: Every button, slideshow toggle, thumbnail click, and "Load More" stream action must perform real state updates.
- **Node.js 24 TypeScript Compatibility**: Keep pure helper functions in `.ts` files rather than `.tsx` so standalone test scripts can import them cleanly.

---

## Review Focus

1. **Photo Deduplication & Bad URL Handling**: iNaturalist and Wikimedia might return identical URLs or thumbnail URLs with slight query parameter differences; ensure URLs are normalized and deduplicated before rendering.
2. **Slideshow Timer Leak on Unmount or Tab Switch**: When the user switches species, closes the profile, or pauses the slideshow, any active `setInterval` or `requestAnimationFrame` must be immediately cleared.
3. **Empty / Low-Photo Taxa Graceful Degradation**: For rare or obscure species with only 1 photo, the filmstrip and next/prev controls must gracefully adapt (hiding or disabling cycling while displaying the single verified photo).
4. **Infinite Stream Deduplication**: Loading global species into `ExploreSection` must avoid duplicating records already present in the catalog (`id` and `scientificName` matching).
5. **Database Transaction & Constraint Safety**: Inserting 100+ species into PostgreSQL must handle `ON CONFLICT` on `public.taxa(scientific_name)` and `public.taxon_media(taxon_id, image_url)`.

---

## File Structure

```
src/
├── services/
│   ├── mediaResolverService.ts           # Add fetchTaxonGallery(), TaxonMediaItem interface, and gallery cache
│   └── inaturalistService.ts             # Add fetchGlobalCladeTaxaPage() for infinite streaming
├── components/
│   ├── profile/
│   │   ├── SpeciesExpeditionPage.tsx      # Embed HeroImageChanger into EXPEDITION and THEATRE view modes
│   │   └── modules/
│   │       └── HeroImageChanger.tsx       # Multi-photo changer, filmstrip carousel, auto-cycle slideshow
│   └── discovery/
│       └── ExploreSection.tsx             # Add Infinite Global Discovery pagination bar & auto-stream scroll
scripts/
├── mass-harvest-taxa.js                  # Automated enrichment & ingestion of 100+ iconic species
└── verify-gallery-expansion-e2e.js        # E2E test verifying gallery harvester, DB records, and bundle sync
```

---

## Task Decomposition

### Task 1: Multi-Photo Harvester Service (`src/services/mediaResolverService.ts`)

**Files:**
- Modify: `src/services/mediaResolverService.ts`
- Test: `scripts/verify-gallery-expansion-e2e.js`

**Interfaces:**
- Produces:
  ```ts
  export interface TaxonMediaItem {
    id?: string;
    url: string;
    thumbnailUrl?: string;
    attribution: string;
    licenseCode: string;
    sourceProvider?: string;
    sourceUrl?: string;
    originalDimensions?: { width?: number; height?: number };
  }
  export async function fetchTaxonGallery(animal: AnimalRecord): Promise<TaxonMediaItem[]>;
  ```

- [ ] **Step 1: Write the failing test in `scripts/verify-gallery-expansion-e2e.js`**
  Assert that calling `fetchTaxonGallery` for *Panthera uncia* returns $\ge 4$ items with valid URLs, attributions, and license codes.
- [ ] **Step 2: Run test to verify it fails**
  Run: `node scripts/verify-gallery-expansion-e2e.js`
  Expected: FAIL with "fetchTaxonGallery is not a function"
- [ ] **Step 3: Implement `fetchTaxonGallery` in `src/services/mediaResolverService.ts`**
  1. Check `localStorage` cache `animalia_gallery_cache_v1_${animal.id}`.
  2. Seed with existing `animal.media.url` and `animal.media.additionalPhotos`.
  3. Fetch `results[0].taxon_photos` from `https://api.inaturalist.org/v1/taxa/${inatTaxonId}` (or search by scientific name).
  4. For extinct species or taxa with $<4$ photos, query Wikipedia REST `/page/media-list/{title}` and GBIF `/v1/species/{gbifKey}/media`.
  5. Normalize URLs (`large.jpg`, `medium.jpg`, prepend `https:` to Wikimedia URLs), filter out SVGs and icons, deduplicate, and limit to 10 verified photos.
  6. Persist to `localStorage` and return.
- [ ] **Step 4: Run test to verify it passes**
  Run: `node scripts/verify-gallery-expansion-e2e.js`
  Expected: PASS for `fetchTaxonGallery`.

---

### Task 2: Interactive Hero Image Changer Module (`HeroImageChanger.tsx`)

**Files:**
- Create: `src/components/profile/modules/HeroImageChanger.tsx`
- Modify: `src/components/profile/SpeciesExpeditionPage.tsx:325-390`
- Modify: `src/components/profile/SpeciesExpeditionPage.tsx:620-660`

**Interfaces:**
- Consumes: `fetchTaxonGallery` from `src/services/mediaResolverService.ts`, `<SmartTaxonImage />` from `src/components/common/SmartTaxonImage.tsx`
- Produces:
  ```tsx
  export interface HeroImageChangerProps {
    animal: AnimalRecord;
    onMediaResolved?: (media: ResolvedTaxonMedia) => void;
    onOpenTheatre?: () => void;
    className?: string;
  }
  export function HeroImageChanger(props: HeroImageChangerProps): JSX.Element;
  ```

- [ ] **Step 1: Create `HeroImageChanger.tsx` with full interactive controls**
  - **State**: `gallery` (array of `TaxonMediaItem`), `activeIndex`, `isPlaying`, `progress` (0–100%), `isLoaded`.
  - **Effects**:
    - Load gallery via `fetchTaxonGallery(animal)` on `animal.id` change. Reset `activeIndex` to 0.
    - 5-second slideshow interval when `isPlaying` is true, with 50ms interval updating `progress` bar. Automatically pause on hover or user interaction.
    - Keyboard listener for `[` (previous photo) and `]` (next photo).
  - **UI Layout**:
    - Aspect ratio container (`16/9` to `21/9`) with `<SmartTaxonImage />` for active photo.
    - Floating glassmorphism Prev/Next chevron buttons appearing on hover.
    - Top badges: DataSource badge, Category badge, and photo counter pill (`Photo 2 of 8`).
    - Slideshow play/pause button with circular/linear timer progress bar.
    - Bottom filmstrip: Horizontally scrollable row of thumbnail previews with active border highlight (`ring-2 ring-amber-400`).
    - Dynamic Attribution Bar: Display current photographer name, source link, and Creative Commons license code based on `gallery[activeIndex]`.
    - Lightbox trigger button linking to Theatre mode.
- [ ] **Step 2: Integrate `HeroImageChanger` into `SpeciesExpeditionPage.tsx`**
  - Replace the static hero container in Mode 1 (Expedition Mode) with `<HeroImageChanger />`.
  - Pass resolved attribution changes back so the Scientific Dossier provenance tab stays in sync.
- [ ] **Step 3: Run TypeScript build check**
  Run: `npm.cmd run build`
  Expected: Clean build with 0 errors.

---

### Task 3: Mass Database Expansion Script (`scripts/mass-harvest-taxa.js`)

**Files:**
- Create: `scripts/mass-harvest-taxa.js`
- Modify: PostgreSQL database `public.taxa` and `public.taxon_media` on `127.0.0.1:54322`
- Modify: `animalia-handoff-bundle.json`

**Interfaces:**
- Consumes: GBIF Species API (`https://api.gbif.org/v1/species/match`), iNaturalist API (`https://api.inaturalist.org/v1/taxa`), Wikipedia REST API.
- Produces:
  - 100+ enriched taxon records added into PostgreSQL and `animalia-handoff-bundle.json`.

- [ ] **Step 1: Author `scripts/mass-harvest-taxa.js`**
  - Define targeted list of iconic species:
    - Prehistoric Flagships: *Tyrannosaurus rex*, *Triceratops horridus*, *Velociraptor mongoliensis*, *Spinosaurus aegyptiacus*, *Archaeopteryx lithographica*, *Mammuthus primigenius*, *Smilodon fatalis*, *Raphus cucullatus*, *Pinguinus impennis*, *Hydrodamalis gigas*, *Dunkleosteus terrelli*, *Anomalocaris canadensis*, *Otodus megalodon*, *Quetzalcoatlus northropi*.
    - Extreme & Deep-Sea: *Grimpoteuthis*, *Psychrolutes marcidus*, *Bathynomus giganteus*, *Physalia physalis*, *Architeuthis dux*.
    - Arthropods: *Dynastes hercules*, *Morpho menelaus*, *Latrodectus mactans*, *Maratus volans*, *Theraphosa blondi*.
    - Amphibians & Reptiles: *Phyllobates terribilis*, *Draco volans*, *Gavialis gangeticus*, *Varanus komodoensis*, *Ambystoma mexicanum*.
    - Sri Lankan Endemics: *Prionailurus rubiginosus phillipsi*, *Loris tardigradus*, *Gallus lafayettii*, *Uropeltis melanogaster*, *Troides darsius*.
    - Additional iconic mammals, birds, and marine life across all 12 categories.
  - Implement concurrent fetching with rate limiting (200ms delay):
    - Match GBIF for accepted classification, rank, authorship, and GBIF usage key.
    - Query iNaturalist for common name, photos, taxon photos, and observations.
    - Query Wikipedia REST for verified summary description.
  - Insert into PostgreSQL `public.taxa` and `public.taxon_media` with `ON CONFLICT DO UPDATE`.
  - Update `animalia-handoff-bundle.json` with the new taxa and updated stats.
- [ ] **Step 2: Run `node scripts/mass-harvest-taxa.js`**
  Verify console logs report successful enrichment and database insertion.
- [ ] **Step 3: Query Postgres count**
  Verify count of `public.taxa` is $\ge 180$ and `animalia-handoff-bundle.json` has updated records.

---

### Task 4: Infinite Global Biodiversity Stream in `ExploreSection.tsx`

**Files:**
- Modify: `src/services/inaturalistService.ts`
- Modify: `src/components/discovery/ExploreSection.tsx`

**Interfaces:**
- Produces:
  ```ts
  export async function fetchGlobalCladeTaxaPage(
    categoryGroup: string,
    page: number,
    perPage: number = 24
  ): Promise<AnimalRecord[]>;
  ```

- [ ] **Step 1: Implement `fetchGlobalCladeTaxaPage` in `src/services/inaturalistService.ts`**
  - Map `categoryGroup` to iNaturalist iconic taxa IDs:
    - `Mammals`: 40151
    - `Birds`: 3
    - `Reptiles`: 26036
    - `Amphibians`: 20978
    - `Fish`: 47178
    - `Insects`: 47158
    - `Arachnids`: 47119
    - `Cephalopods & Mollusks`: 47115
    - `Crustaceans`: 47125
    - `Extinct Taxa`: query `extinct=true`
    - `ALL` or others: iconic animalia query.
  - Call `https://api.inaturalist.org/v1/taxa?taxon_id=${iconicId}&rank=species&is_active=true&per_page=${perPage}&page=${page}&order=desc&order_by=observations_count`.
  - Map each result to `AnimalRecord` with strict provenance, preserving images and summaries.
- [ ] **Step 2: Enhance `ExploreSection.tsx` with Infinite Global Discovery UI**
  - Add state: `streamingPage`, `isStreaming`, `autoStreamOnScroll`, `streamError`, `totalStreamedCount`.
  - Render an "Infinite Global Discovery" control bar below the virtualized grid:
    - Status badge: `"Streaming live from 2.1M+ species global biodiversity catalog"`.
    - Button: `"Load 24 More Species"` with loading spinner.
    - Toggle checkbox/pill: `"Auto-stream on scroll"`.
  - Attach scroll listener to `scrollContainerRef` that triggers stream loading when scroll offset reaches within 300px of bottom and `autoStreamOnScroll` is active.
  - Call `onMergeLiveAnimals(newRecords)` to seamlessly integrate into app state, search filter, comparison matrix, and expedition pages.
- [ ] **Step 3: Run TypeScript build check**
  Run: `npm.cmd run build`
  Expected: Clean build.

---

### Task 5: Verification & Zero-Regression Test Suite

**Files:**
- Create: `scripts/verify-gallery-expansion-e2e.js`

- [ ] **Step 1: Implement complete test suite `scripts/verify-gallery-expansion-e2e.js`**
  - Check 1: Multi-Photo Harvester returns $\ge 4$ photos for living species (*Panthera uncia*, *Acinonyx jubatus*) with proper attribution and license.
  - Check 2: Multi-Photo Harvester returns fallback reconstructed/fossil plates for extinct species (*Tyrannosaurus rex*, *Mammuthus primigenius*).
  - Check 3: Database `public.taxa` has $\ge 180$ records, and `animalia-handoff-bundle.json` matches.
  - Check 4: Sample 20 random media URLs across database and confirm HTTP 200 responses with zero broken links.
  - Check 5: `fetchGlobalCladeTaxaPage` successfully returns 24 live species for clades (e.g., Mammals, Birds, Insects).
- [ ] **Step 2: Run `node scripts/verify-gallery-expansion-e2e.js`**
  Run: `node scripts/verify-gallery-expansion-e2e.js`
  Expected: All 5 test suites PASS with 100% assertions green.
- [ ] **Step 3: Run full TypeScript and Vite build**
  Run: `npm.cmd run build`
  Expected: Build succeeds with 0 errors.
