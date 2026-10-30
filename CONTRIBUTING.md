# Contributing to ANIMALIA

Thank you for your interest in contributing to **ANIMALIA — The Archival Field Monograph of the Animal Kingdom**! 

ANIMALIA is a museum-grade digital natural history project designed to make biodiversity science accessible, beautiful, and verifiable. Because this project is used by researchers, educators, and wildlife enthusiasts, **scientific integrity and data accuracy take precedence over aesthetic convenience**.

---

## 🏛️ The Four Non-Negotiable Scientific Integrity Rules (`GEMINI.md`)

Every pull request must strictly honor the four non-negotiable laws defined in `GEMINI.md`:

### 1. Zero Fabricated Biology
- **Never invent** body lengths, weights, lifespans, diets, habitats, or IUCN Red List statuses.
- If a measurement or biological trait is unverified or absent from authoritative records, its value **MUST remain `null`**.
- Unverified fields render in the user interface as:
  > *"Not yet documented in available source record"*
- Never generate synthetic biological metrics with LLMs unless explicitly tagged as speculative paleo-reconstruction in the provenance layer.

### 2. Strict Image & Audio Provenance
- Every photograph and bioacoustic recording displayed in the platform **MUST retain full attribution**:
  - `sourceUrl`: Direct link to the source repository (e.g., iNaturalist observation, Wikimedia Commons file page, GBIF occurrence).
  - `attribution`: Author / photographer name or recording institution.
  - `licenseCode`: Creative Commons license code (`CC0`, `CC-BY`, `CC-BY-SA`, `CC-BY-NC`, `PUBLIC_DOMAIN`).
  - `verifiedTaxonMatch`: Boolean certifying that the media matches the scientific taxon.
- When a verified photograph is unavailable, use `<TaxonomicSilhouette />` rather than a generic or unverified stock image.

### 3. Data Source Transparency
Every taxon record must explicitly declare its provenance through the `dataSource` attribute:
- `LOCAL_DEMO_RECORD`: Pre-curated specimen bundled with the application.
- `IMPORTED_REPOSITORY_RECORD`: Sourced from the local PostgreSQL biodiversity ledger.
- `LIVE_API_RESULT`: Dynamically fetched at runtime via GBIF or iNaturalist APIs.
- `CACHED_RECORD`: Stored in local cache with timestamped verification.

### 4. No Decorative Controls
- Every button, slider, filter, comparison slot, and search bar must perform real state transitions or database queries.
- Do not add mock UI widgets or placeholder controls that do not have functional implementations.

---

## 🛠️ Tech Stack & Directory Structure

- **Frontend**: React 18.3 + TypeScript 5.7 + Vite 6.2 + Tailwind CSS 3.4
- **Icons**: Lucide React (`lucide-react`)
- **Database / Storage**: Supabase & PostgreSQL 16 (PGlite for local zero-config server)
- **Signal Processing**: Web Audio API (60fps canvas spectrogram visualizer)
- **Mapping**: Leaflet + GBIF / iNaturalist density and point vector tile layers

### Directory Layout
```
├── public/                 # Static PWA manifest, archival icons, web assets
├── scripts/                # Database server, ETL pipelines, and E2E verification suites
│   ├── pg-server.js        # Embedded PGlite PostgreSQL socket server (port 54322)
│   ├── taxonomy-etl-pipeline.js  # Automated GBIF / iNaturalist taxonomic harvester
│   └── verify-*.js         # Automated E2E verification suites
├── src/
│   ├── components/         # React UI modules (common, compare, discovery, engagement, profile)
│   ├── data/               # Initial taxa definitions and handoff bundle bindings
│   ├── hooks/              # Custom hooks (keyset infinite scroll, audio subscriptions)
│   ├── services/           # Data services (GBIF, iNaturalist, Bioacoustics, Media Resolver, Supabase)
│   ├── types/              # Strict nullable taxonomic, morphological, and ecological interfaces
│   └── utils/              # Deterministic mystery engines, biometric parsers, clade calculators
└── supabase/               # SQL migrations and edge functions
```

---

## 📥 Adding New Taxa to the Catalog

To contribute new species records to the bundled catalog (`animalia-handoff-bundle.json`):

1. **Verify Taxonomic Authority**:
   - Ensure the scientific name is an accepted binomial in the **Catalogue of Life** or **GBIF Backbone Taxonomy**.
   - Locate the canonical `gbifKey` from [gbif.org](https://www.gbif.org) and `inatTaxonId` from [inaturalist.org](https://www.inaturalist.org).
2. **Run the ETL Pipeline**:
   ```bash
   node scripts/taxonomy-etl-pipeline.js --species "Panthera onca"
   ```
3. **Verify Licenses**:
   - Ensure the primary photograph has a verified Creative Commons license (`CC0`, `CC-BY`, or `CC-BY-SA` preferred for commercial safety).

---

## 🧪 Testing & Quality Assurance

Before submitting a Pull Request, run the full verification test matrix:

```bash
# 1. Typecheck and build verification (zero warnings required)
npm run build

# 2. Run launch readiness and commercial license guard suite
node scripts/verify-launch-readiness-e2e.js

# 3. Run platform E2E verification suite
node scripts/verify-animalia-e2e.js

# 4. Run expedition page & interactive modules suite
node scripts/verify-expedition-e2e.js

# 5. Run bioacoustic engine suite
node scripts/verify-bioacoustics-e2e.js

# 6. Run gallery expansion suite
node scripts/verify-gallery-expansion-e2e.js

# 7. Run viral engagement & mystery suite
node scripts/verify-viral-features-e2e.js
```

All 6 test suites must pass with **100% success** before code can be merged.

---

## 📝 Pull Request Guidelines

1. **Title**: Follow conventional commit guidelines (e.g., `feat(media): add commercial safe license filter`, `fix(taxonomy): correct order for Spheniscus magellanicus`).
2. **Description**: Detail what changes were made, cite scientific sources for biological updates, and confirm that all automated tests pass.
3. **Review**: A maintainer will verify compliance with the `GEMINI.md` scientific integrity charter before merging.

Thank you for helping build an accurate, archival record of Earth's living tapestry!
