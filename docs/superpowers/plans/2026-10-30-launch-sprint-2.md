# Launch Sprint 2: Cloud & Commercial Production Readiness + Open-Source Flagship Release

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` (or `superpowers:subagent-driven-development`) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate ANIMALIA to commercial production readiness and premier open-source status with a Commercial-Safe Media License Guard, zero-error Cloud Serverless fallback, native PWA installability, and world-class repository documentation (`README.md`, `CONTRIBUTING.md`, `LICENSE`).

**Architecture:** 
- **Media & Audio Engine**: Configurable CC license filter (`ALL CC` vs `COMMERCIAL SAFE (CC0/BY/SA)`) with runtime hot-swapping of `-NC` seed photos via iNaturalist API v1 (`photo_license=cc0,cc-by,cc-by-sa`) and Wikimedia Commons CC-BY-SA/CC0 APIs.
- **Persistence & Cloud Fallback**: Zero-error browser runtime falling back to bundled 164-species archival handoff bundle + `localStorage` + live CORS streaming when Supabase Cloud credentials or local PGlite port 54322 are absent, with cleanly decoupled Node.js modules for warning-free Vite bundling.
- **Progressive Web App**: Obsidian Herbarium (`#070A09`) theme, standalone manifest, high-fidelity archival icons, and Vercel SPA routing/caching headers.
- **Open-Source Flagship Packaging**: Hacker News / Product Hunt caliber `README.md` with 3-tier architecture Mermaid diagram, `CONTRIBUTING.md` enforcing `GEMINI.md` scientific integrity rules, and MIT `LICENSE` with third-party biodiversity attribution.

**Tech Stack:** React 18, TypeScript 5.7, Vite 6.2, Tailwind CSS 3.4, Supabase / PostgreSQL 16 (PGlite), Web Audio API, iNaturalist v1, GBIF Species & Occurrence APIs, Wikimedia Commons API.

---

## Global Constraints
- **Zero Fabricated Biology**: Strictly adhere to `GEMINI.md`. Never invent body measurements, lifespans, diets, or IUCN statuses. Unverified fields must remain `null`.
- **Strict Media Provenance**: All media must retain `sourceUrl`, `attribution`, `licenseCode`, and `verifiedTaxonMatch`.
- **Commercial Safe Definition**: Commercial-safe licenses include `CC0`, `CC-BY`, `CC-BY-SA`, `PD`, and `PUBLIC DOMAIN` (and point releases like `CC-BY-4.0`, `CC-BY-SA-4.0`), strictly excluding `-NC`, `-ND`, and `ALL-RIGHTS-RESERVED`.
- **Zero Bundler Warnings**: `npm.cmd run build` must complete with zero TypeScript errors and zero Vite bundler/chunk warnings.

## Review Focus
1. Does toggling the License Filter in the UI header immediately update the displayed primary media and gallery without page refresh?
2. Does the application boot and navigate all tabs with zero console errors when running on static cloud hosts without a local database on port 54322?
3. Are all 164 taxa in `animalia-handoff-bundle.json` accessible with instant search and keyset pagination in serverless cloud mode?
4. Does `npm.cmd run build` produce a clean build with zero externalization warnings for Node built-in modules (`net`, `tls`, `fs`)?
5. Does the PWA install prompt / manifest validate with correct standalone configuration and `#070A09` theme color?

---

## Proposed Changes

### Component 1: Commercial Media License Guard

#### [MODIFY] `src/services/mediaResolverService.ts`
- Implement `isCommercialSafeLicense(licenseCode?: string | null): boolean` to strictly classify `CC0`, `CC-BY`, `CC-BY-SA`, `PD`, `PUBLIC DOMAIN` as safe, and reject `-NC`, `-ND`, and `ALL-RIGHTS-RESERVED`.
- Implement `getCommercialSafeMode(): boolean` and `setCommercialSafeMode(enabled: boolean): void` with `localStorage` persistence (`animalia_commercial_safe_media`) and fallback to `import.meta.env.VITE_COMMERCIAL_SAFE_MEDIA` (defaulting to `true` in production).
- Add event-driven listener `onCommercialSafeModeChange(callback: (enabled: boolean) => void): () => void` via `window.dispatchEvent(new CustomEvent('animalia-license-mode-change'))`.
- Update `resolveVerifiedTaxonMedia(options: MediaResolveOptions)`:
  - Accept optional `commercialSafeOnly?: boolean` in `MediaResolveOptions`.
  - When active, query iNaturalist with `&photo_license=cc0,cc-by,cc-by-sa`.
  - When inspecting `inatData.default_photo`, if its license contains `-NC`, scan `inatData.taxon_photos` for the first commercial-safe photo.
  - If iNaturalist yields no commercial-safe photo, fall back to Wikipedia REST API (which sources from Wikimedia Commons `CC-BY-SA` / `CC0`).
  - Namespace the cache keys so commercial-safe and non-commercial resolutions do not contaminate each other.
- Update `fetchTaxonGallery(animal: any, commercialSafe?: boolean)`:
  - If commercial-safe is enabled, filter all candidate photos (`animal.media`, `additionalPhotos`, `inatTaxonData.taxon_photos`, and GBIF media) to strictly include `isCommercialSafeLicense(p.licenseCode)`.

#### [MODIFY] `src/services/bioacousticService.ts`
- In `fetchCommonsFileInfo`: verify that audio license satisfies `isCommercialSafeLicense(license)` when commercial-safe mode is enabled.
- In `resolveTaxonBioacoustics`: filter pre-seeded audio recordings to exclude non-commercial recordings if `commercialSafeOnly` is active.

#### [MODIFY] `src/components/common/Header.tsx`
- Add a clickable License Guard control in the Archival Telemetry Strip:
  ```tsx
  <button
    onClick={toggleLicenseFilter}
    className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors"
    title="Toggle Commercial Safe License Guard"
  >
    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
    <span>LICENSE: {isCommercialSafe ? 'COMMERCIAL SAFE (CC0/BY/SA)' : 'ALL CC'}</span>
  </button>
  ```
- Receive `isCommercialSafe` and `onToggleLicense` via props, or listen to the `animalia-license-mode-change` custom event.

#### [MODIFY] `src/App.tsx`
- Maintain state for `isCommercialSafe` initialized via `getCommercialSafeMode()`.
- Listen for mode changes and pass state down to Header and discovery components.
- In `allKnownAnimals` and `SpeciesExpeditionPage`: when `isCommercialSafe` is active and an animal carries a seed image with a `-NC` license, automatically call `resolveVerifiedTaxonMedia({ scientificName, inatTaxonId, commercialSafeOnly: true })` to hot-swap the primary photo with a verified commercial-safe photograph.

---

### Component 2: Cloud Serverless Mode & PWA Installability

#### [MODIFY] `src/services/supabaseRepository.ts`
- Separate the direct Node.js `pg` Pool import so that Vite's browser bundler does not analyze or bundle `pg`, `net`, `tls`, `fs`, `stream`, eliminating all externalization warnings.
- Implement Hosted Supabase Cloud connection when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided in `.env`:
  - Query taxa via Supabase REST API PostgREST (`${supabaseUrl}/rest/v1/taxa?...`).
- In `getTaxaCursor()`:
  - In browser runtime: check if Supabase Cloud credentials exist; if so, query Supabase Cloud PostgREST or RPC.
  - If credentials are not configured or the network request fails, seamlessly use client-side keyset cursor seek over `this.localCache` (seeded with 164 species from `animalia-handoff-bundle.json`).
  - Zero console connection errors: never attempt to connect to `127.0.0.1:54322` from the browser.

#### [MODIFY] `vite.config.ts`
- Configure `build.rollupOptions`:
  - Add `manualChunks` to split large vendor dependencies (`react`, `react-dom`, `leaflet`, `lucide-react`, `@tanstack/react-virtual`) into dedicated chunks, eliminating the `>500 kB` bundle warning.
  - Configure `external` or ignore patterns for server-only dependencies if needed.
- Set `build.chunkSizeWarningLimit: 1000`.

#### [NEW] `public/manifest.webmanifest`
- Create Web App Manifest specifying:
  - `name`: "ANIMALIA — Archival Field Monograph of the Animal Kingdom"
  - `short_name`: "ANIMALIA"
  - `theme_color`: "#070A09"
  - `background_color`: "#070A09"
  - `display`: "standalone"
  - `icons`: standard 192x192, 512x512 PNGs and vector SVG.

#### [NEW] `public/icons/icon.svg` & PNG icons
- Create archival gold-on-obsidian crest icon SVG (`#070A09` background with `#D4A359` golden lion emblem).
- Generate `public/icons/icon-192.png` and `public/icons/icon-512.png`.

#### [MODIFY] `index.html`
- Link `<link rel="manifest" href="/manifest.webmanifest" />`.
- Add `<meta name="theme-color" content="#070A09" />`.
- Add Apple mobile web app meta tags and touch icons.

#### [NEW] `vercel.json`
- Configure SPA rewrite rules directing non-asset routes to `/index.html`.
- Add immutable caching headers for `/assets/*`.
- Add security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`).

---

### Component 3: Flagship Open-Source Repository Packaging

#### [NEW] `README.md`
- Monumental field monograph design:
  - Hero banner and project mission statement.
  - Live demo, deployment, and test status badges.
  - Comprehensive Mermaid architecture diagram illustrating the 3-Tier Hybrid Biodiversity Engine.
  - Detailed feature showcase:
    - Interactive Species Expedition Page (circadian biome clock, biometric seesaw, 3D taxonomic card flip).
    - 60fps Bioacoustic Spectrogram Studio (dual-buffer FFT, pitch-drop playback).
    - Daily Specimen Mystery (deterministic UTC seed, clade warm/cold feedback, shareable dispatches).
    - Commercial-Safe CC License Guard.
    - Archival Monograph Plate Exporter (print-isolated PDF and PNG canvas).
  - Quickstart guide:
    - 1-Click local launch (`launch.bat` / `npm start`).
    - Cloud deployment guide (Vercel, Cloudflare Pages, Netlify, Supabase Cloud).
  - Scientific integrity pledge (`GEMINI.md`).

#### [NEW] `CONTRIBUTING.md`
- Open-source contributor guidelines:
  - The 4 Non-Negotiable Scientific Integrity Rules from `GEMINI.md`.
  - Guidelines for adding new taxa to `animalia-handoff-bundle.json`.
  - Automated testing workflow and verification scripts.
  - Pull request template and code style.

#### [NEW] `LICENSE`
- Standard MIT License for ANIMALIA application code.
- Explicit Third-Party Biodiversity Data Licensing & Attribution Notice:
  - GBIF data attribution (CC-BY 4.0 / CC0).
  - iNaturalist community photography licenses (CC-BY, CC-BY-SA, CC0, CC-BY-NC).
  - Wikimedia Commons & Wikipedia media attribution (CC-BY-SA 4.0 / CC0).

---

### Component 4: Final Full-System Verification

#### [NEW] `scripts/verify-commercial-license-e2e.js`
- Test suite verifying:
  1. `isCommercialSafeLicense` correctly validates `CC0`, `CC-BY`, `CC-BY-SA`, `PD`, and rejects `-NC`, `-ND`, `ARR`.
  2. Live iNaturalist query with `photo_license=cc0,cc-by,cc-by-sa` returns 100% commercial-safe results.
  3. `resolveVerifiedTaxonMedia` with `commercialSafeOnly: true` hot-swaps a `-NC` species to a commercial-safe photo.
  4. UI license mode toggle persists state to `localStorage` and triggers event dispatch.
  5. Bioacoustic service respects commercial license filter.

#### [MODIFY] `scripts/verify-animalia-e2e.js`
- Ensure database check handles both local PGlite port 54322 and cloud serverless fallback mode gracefully.

---

## Verification Plan

### Automated Tests
1. **Commercial License Guard Suite**:
   `node scripts/verify-commercial-license-e2e.js`
2. **Platform E2E Verification**:
   `node scripts/verify-animalia-e2e.js`
3. **Expedition & Interactive Modules Suite**:
   `node scripts/verify-expedition-e2e.js`
4. **Bioacoustic Engine Suite**:
   `node scripts/verify-bioacoustics-e2e.js`
5. **Gallery Expansion Suite**:
   `node scripts/verify-gallery-expansion-e2e.js`
6. **Viral Features & Mystery Suite**:
   `node scripts/verify-viral-features-e2e.js`
7. **Production Build & Bundler Warning Verification**:
   `npm.cmd run build` (Must complete with 0 errors and 0 bundler warnings)

### Manual Verification
1. Open http://localhost:5173 and inspect the telemetry strip in the header. Click `LICENSE: COMMERCIAL SAFE (CC0/BY/SA)` / `LICENSE: ALL CC` and observe the mode toggle.
2. In commercial-safe mode, inspect a species that had a `-NC` license in the seed bundle (e.g., Cheetah or Lion) and verify that its displayed image hot-swaps to a verified CC0 / CC-BY / CC-BY-SA photograph.
3. Open Chrome DevTools > Application > Manifest and verify the PWA manifest is loaded, valid, and displays the Obsidian Herbarium `#070A09` theme color and archival icon.
4. Verify that installing or viewing the app in standalone mode functions seamlessly.
