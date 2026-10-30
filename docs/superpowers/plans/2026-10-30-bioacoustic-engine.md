# Bioacoustic Engine & Audio Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive, scientifically verified wildlife Bioacoustic Vocalization Engine featuring 60fps real-time frequency spectrograms, slow-motion playback (0.5x / 0.25x), dual-tier keyless audio resolution, profile hero triggers, animal card previews, and a Comparison Matrix duet player.

**Architecture:**
1. **Global Audio Bus Coordinator (`src/services/audioCoordinator.ts`)**: A singleton managing audio playback state, Web Audio API nodes (`AudioContext`, `AnalyserNode`), mutual exclusion across components, and dual-track duet synchronization for the Comparison Matrix.
2. **Dual-Tier Bioacoustic Harvester (`src/services/bioacousticService.ts`)**: A multi-source resolver querying Wikipedia parsed audio files and Wikimedia Commons Audio search (`filetype:audio`), with persistent `localStorage` caching (`animalia_audio_cache_v1_${id}`) and strict honest fallbacks for non-vocal and extinct taxa.
3. **Interactive Visualizer Deck (`src/components/profile/modules/BioacousticVocalizationDeck.tsx`)**: A full 60fps HTML5 Canvas visualizer rendering real-time FFT frequency spectrograms and time-domain oscillograms with slow-motion scrubbers, loop toggles, and recordist licensing.
4. **Card & Matrix Integration**: Ambient sound pills on `AnimalCard.tsx`, quick-listen capsules in `HeroImageChanger.tsx`, and a synchronized side-by-side "Compare Calls" duet tool in `ComparisonMatrix.tsx`.

**Tech Stack:** React 18, TypeScript, Web Audio API (`AudioContext`, `AnalyserNode`), HTML5 Canvas, Tailwind CSS, Lucide Icons.

**Spec:** Agreed requirements from the 2026-10-30 `/grill-me` alignment session.

---

## Global Constraints

- **Zero Fabricated Biology (`GEMINI.md`)**: Audio recordings must never be invented for mute or extinct species; unrecorded taxa display honest scientific communication profiles.
- **Strict Audio Provenance (`GEMINI.md`)**: Every audio file must preserve `audioUrl`, `recordist`, `licenseCode` (`CC-BY`, `CC-BY-SA`, `Public Domain`), and `sourceUrl`.
- **CORS-Safe Audio Streaming**: Stream audio through standard `<audio>` elements with `crossOrigin="anonymous"` enabled only when piped into Web Audio `MediaElementAudioSourceNode`, with a fallback to direct audio playback if CORS headers are restricted.
- **No Audio Overlaps**: Playback across cards and profile modals must coordinate through the global audio bus to prevent dissonant overlapping animal sounds.
- **Clean Component Unmount**: Any active audio stream or animation frame loop must cancel immediately on unmount or navigation.

---

## Review Focus

1. **Web Audio API Autoplay & User Gesture Policies**: Browsers require a user gesture before starting `AudioContext.resume()`; ensure clicking any play button resumes the context cleanly.
2. **Audio Collision & Memory Leaks**: Switching species or closing modals while audio is playing must cleanly pause playback and detach audio nodes.
3. **Non-Vocal and Extinct Taxa Graceful Rendering**: Verify that corals, tardigrades, jellyfish, and extinct dinosaurs suppress card play pills and render scientific communication notes instead of broken players.
4. **Slow-Motion Audio Pitch Preservation**: When setting `playbackRate = 0.5` or `0.25` for bird trills and bats, verify that `preservesPitch = false` (or configurable) allows hearing rapid ultrasonic modulations.
5. **Slow Network / 404 Resilience**: When an external audio stream times out or fails, the UI must display a clear retry notice without breaking page rendering.

---

## File Structure

```
src/
├── types/
│   └── taxonomy.ts                                # Add TaxonAudioItem and BioacousticStatus types
├── services/
│   ├── audioCoordinator.ts                       # Global Web Audio API singleton & bus coordinator
│   └── bioacousticService.ts                     # Dual-tier harvester (Wikipedia + Commons) & cache
├── components/
│   ├── common/
│   │   └── AudioWaveformIcon.tsx                 # Animated SVG audio pill for cards & hero
│   ├── discovery/
│   │   └── AnimalCard.tsx                        # Add sound preview chip
│   ├── profile/
│   │   ├── SpeciesExpeditionPage.tsx             # Mount BioacousticVocalizationDeck as Module 5
│   │   └── modules/
│   │       ├── HeroImageChanger.tsx              # Add quick sound capsule in hero overlay
│   │       └── BioacousticVocalizationDeck.tsx   # 60fps Canvas Spectrogram, slow-mo, call switcher
│   └── compare/
│       └── ComparisonMatrix.tsx                  # Dual-track acoustic comparator with duet mode
scripts/
├── seed-flagship-audio.js                        # Pre-seeds verified audio in bundle & PostgreSQL
└── verify-bioacoustics-e2e.js                     # Comprehensive test suite for resolver and audio bus
```

---

## Task Decomposition

### Task 1: Bioacoustic Types & Global Audio Bus Coordinator

**Files:**
- Modify: `src/types/taxonomy.ts`
- Create: `src/services/audioCoordinator.ts`
- Test: `scripts/verify-bioacoustics-e2e.js`

**Interfaces:**
- Produces:
  ```ts
  export interface TaxonAudioItem {
    id?: string;
    audioUrl: string;
    title?: string;
    recordist: string;
    licenseCode: string;
    sourceProvider: string;
    sourceUrl?: string;
    recordingType?: string; // 'Song' | 'Call' | 'Alarm' | 'Roar' | 'Howl' | 'Echolocation'
    durationSeconds?: number;
    locality?: string;
  }

  export class AudioCoordinator {
    play(id: string, url: string, metadata: TaxonAudioItem, onEnded?: () => void): Promise<void>;
    pause(): void;
    toggle(id: string, url: string, metadata: TaxonAudioItem): Promise<void>;
    seek(timeSeconds: number): void;
    setPlaybackRate(rate: number): void;
    setVolume(volume: number): void;
    setLoop(loop: boolean): void;
    getAnalyserNode(): AnalyserNode | null;
    getActiveTrackId(): string | null;
    subscribe(callback: (state: AudioPlaybackState) => void): () => void;
  }
  export const globalAudioBus: AudioCoordinator;
  ```

- [ ] **Step 1: Write failing test in `scripts/verify-bioacoustics-e2e.js`**
  Assert that `globalAudioBus.play` sets active track and switches tracks mutually exclusively.
- [ ] **Step 2: Run test to verify failure**
  Run: `node scripts/verify-bioacoustics-e2e.js`
  Expected: FAIL with "module not found"
- [ ] **Step 3: Implement `TaxonAudioItem` in `src/types/taxonomy.ts` and `audioCoordinator.ts`**
  - Implement Web Audio API integration: create `AudioContext`, `AnalyserNode` with `fftSize = 1024`, and link to internal `Audio` element.
  - Implement single-active-track mutual exclusion with state subscriber pattern.
  - Provide fallback if browser restricts CORS on `createMediaElementSource`.
- [ ] **Step 4: Run test to verify it passes**
  Run: `node scripts/verify-bioacoustics-e2e.js`
  Expected: PASS for Task 1 tests.

---

### Task 2: Dual-Tier Bioacoustic Harvester & Resolver Service

**Files:**
- Create: `src/services/bioacousticService.ts`
- Test: `scripts/verify-bioacoustics-e2e.js`

**Interfaces:**
- Produces:
  ```ts
  export interface BioacousticResolution {
    status: 'VOCAL_RECORDINGS_FOUND' | 'NON_VOCAL_ORGANISM' | 'EXTINCT_PALEO_ACOUSTIC' | 'UNDOCUMENTED';
    primaryAudio: TaxonAudioItem | null;
    recordings: TaxonAudioItem[];
    scientificNote: string;
  }
  export async function resolveTaxonBioacoustics(animal: AnimalRecord): Promise<BioacousticResolution>;
  ```

- [ ] **Step 1: Write failing test in `scripts/verify-bioacoustics-e2e.js`**
  Assert that `resolveTaxonBioacoustics` returns audio for *Canis lupus* and honest non-vocal status for jellyfish/sponges.
- [ ] **Step 2: Run test to verify failure**
  Run: `node scripts/verify-bioacoustics-e2e.js`
  Expected: FAIL with "resolveTaxonBioacoustics not defined"
- [ ] **Step 3: Implement `bioacousticService.ts`**
  - Read `localStorage` cache `animalia_audio_cache_v1_${id}`.
  - Check non-vocal taxa: Porifera, Cnidaria (except specialized), Tardigrada, Microscopic.
  - Check extinct taxa: Return paleo-acoustic note regarding syrinx/hyoid fossil anatomy.
  - Tier 1: Query Wikipedia `parse&prop=images` filtering audio files (`\.(ogg|oga|mp3|wav|flac)$`).
  - Tier 2: Query Wikimedia Commons `list=search&srsearch=${name}+filetype:audio&srnamespace=6`.
  - Extract recordist and license from `extmetadata` (`Artist`, `LicenseShortName`).
  - Cache results in memory and `localStorage`.
- [ ] **Step 4: Run test to verify it passes**
  Run: `node scripts/verify-bioacoustics-e2e.js`
  Expected: PASS for Task 2 tests.

---

### Task 3: Interactive Bioacoustic Vocalization Deck Module

**Files:**
- Create: `src/components/profile/modules/BioacousticVocalizationDeck.tsx`
- Modify: `src/components/profile/SpeciesExpeditionPage.tsx:430-445`

**Interfaces:**
- Consumes: `globalAudioBus` from `src/services/audioCoordinator.ts`, `resolveTaxonBioacoustics` from `src/services/bioacousticService.ts`
- Produces:
  ```tsx
  export interface BioacousticVocalizationDeckProps {
    animal: AnimalRecord;
    className?: string;
  }
  export function BioacousticVocalizationDeck(props: BioacousticVocalizationDeckProps): JSX.Element;
  ```

- [ ] **Step 1: Build `BioacousticVocalizationDeck.tsx`**
  - **Canvas Visualizer (60fps)**:
    - Spectrogram mode: draws FFT frequency bins with glowing heat gradient (`#f59e0b` to `#10b981`).
    - Oscillogram mode: draws smooth wave line representing time-domain audio data.
    - Animation loop driven by `requestAnimationFrame`, pausing when audio stops.
  - **Controls Deck**:
    - Play / Pause button with progress scrub slider and time remaining.
    - Speed selector pills: `1x (Standard)`, `0.5x (Slow-Mo Trill)`, `0.25x (Deep Infrasound)`.
    - Loop toggle and volume control slider.
    - Call switcher pills if multiple recordings exist (e.g. Song vs. Call vs. Roar).
    - Dynamic recordist credit, license badge, and external source link.
  - **Scientific Fallback Cards**:
    - Non-vocal organism card (chemical & bioluminescent communication badge).
    - Extinct paleo-acoustics card (fossil resonance and syrinx morphology note).
- [ ] **Step 2: Mount into `SpeciesExpeditionPage.tsx`**
  - Add `<BioacousticVocalizationDeck animal={animal} />` as Module 5 right below Lineage Navigator in Expedition Mode.
- [ ] **Step 3: Run TypeScript compiler check**
  Run: `npm.cmd run build`
  Expected: Clean build with 0 errors.

---

### Task 4: Surface Integration (Hero Sound Capsule, Card Previews, Comparison Duet)

**Files:**
- Create: `src/components/common/AudioWaveformIcon.tsx`
- Modify: `src/components/profile/modules/HeroImageChanger.tsx`
- Modify: `src/components/discovery/AnimalCard.tsx`
- Modify: `src/components/compare/ComparisonMatrix.tsx`

**Interfaces:**
- Consumes: `globalAudioBus`, `resolveTaxonBioacoustics`

- [ ] **Step 1: Create `AudioWaveformIcon.tsx`**
  - Sleek animated SVG with 4 vertical equalizer bars that animate during playback and stay static when paused.
- [ ] **Step 2: Add quick-listen sound capsule to `HeroImageChanger.tsx`**
  - Place a floating glassmorphism sound capsule in the top overlay next to the photo counter: `♫ Listen Call`.
  - Clicking toggles the primary audio track via `globalAudioBus`.
  - Hides automatically for non-vocal and extinct organisms.
- [ ] **Step 3: Add sound preview pill to `AnimalCard.tsx`**
  - Render an unobtrusive sound trigger button in the card footer next to the inspect button.
  - Suppressed for non-vocal organisms and extinct species without audio.
- [ ] **Step 4: Add "Compare Duet" mode to `ComparisonMatrix.tsx`**
  - For compared species, render side-by-side audio cards.
  - Include an interactive "Play Vocalization Duet" button that triggers simultaneous synchronized audio for direct acoustic comparison.
- [ ] **Step 5: Run TypeScript build check**
  Run: `npm.cmd run build`
  Expected: Clean build with 0 errors.

---

### Task 5: Pre-Seeding Flagships & E2E Verification Suite

**Files:**
- Create: `scripts/seed-flagship-audio.js`
- Create: `scripts/verify-bioacoustics-e2e.js`
- Modify: `animalia-handoff-bundle.json`

- [ ] **Step 1: Write and run `scripts/seed-flagship-audio.js`**
  - Seeds verified audio recordings into `animalia-handoff-bundle.json` and PostgreSQL for 25+ flagship taxa (Lion, Wolf, Blue Whale, Orca, Snowy Owl, Cheetah, Red Slender Loris, Chimpanzee, Poison Dart Frog, Cricket, etc.).
  - Run: `node scripts/seed-flagship-audio.js`
- [ ] **Step 2: Expand `scripts/verify-bioacoustics-e2e.js` with all 6 verification checks**
  - Check 1: Audio coordinator singleton maintains exclusive playback.
  - Check 2: Bioacoustic harvester resolves verified recordings for vocal taxa.
  - Check 3: Non-vocal taxa (corals, tardigrades) return honest scientific non-vocal status.
  - Check 4: Extinct taxa (*T. rex*, Mammoth) return honest paleo-acoustic notes with no fake audio.
  - Check 5: Web Audio API frequency buffer calculations and pitch rate bounds.
  - Check 6: Bundle and database records contain verified audio URLs with CC licenses.
- [ ] **Step 3: Run full verification suite**
  Run: `node scripts/verify-bioacoustics-e2e.js`
  Expected: 6/6 test suites PASS with 100% assertions green.
- [ ] **Step 4: Run full production build**
  Run: `npm.cmd run build`
  Expected: `tsc && vite build` completes with 0 errors.
