# ANIMALIA — Workspace Engineering & Scientific Integrity Rules (GEMINI.md)

## 1. Non-Negotiable Scientific Integrity Rules
- **Zero Fabricated Biology**: Never invent body measurements, lifespans, diets, habitats, or IUCN Red List statuses. All unverified biological fields MUST remain `null` and render in the UI as *"Not yet documented in available source record"*.
- **Strict Image Provenance**: Every photograph displayed must preserve `sourceUrl`, `attribution`, `licenseCode` (`CC0`, `CC-BY`, `CC-BY-SA`, `CC-BY-NC`), and `verifiedTaxonMatch`. Use `<TaxonomicSilhouette />` when a verified photograph is unavailable.
- **Data Source Transparency**: Every taxon record must explicitly declare its provenance: `LOCAL_DEMO_RECORD`, `IMPORTED_REPOSITORY_RECORD`, `LIVE_API_RESULT`, or `CACHED_RECORD`.
- **No Decorative Controls**: Every search filter, comparison slot, synonym lookup, and collection button must perform real state transitions or database queries.

## 2. Tech Stack & Directory Conventions
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons
- **Backend / Persistence**: Supabase (PostgreSQL 16 with `ltree` and `pg_trgm` extensions)
- **External Biodiversity APIs**:
  - GBIF Species API (`https://api.gbif.org/v1/species`)
  - iNaturalist Taxa API (`https://api.inaturalist.org/v1/taxa`)
  - IUCN Red List / Catalogue of Life (Server-side Edge Functions only; never expose private API tokens in client bundles)