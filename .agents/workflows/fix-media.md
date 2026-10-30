---
name: fix-media
description: Check all taxa in public.taxa and public.taxon_media, test image URLs, and auto-heal broken/missing image URLs using iNaturalist API and Wikipedia REST API.
tools:
  - run_command
  - animalia-postgres
  - read_file
  - write_file
---

# Fix Media Workflow (`/fix-media`)

This workflow inspects all animal records in the ANIMALIA PostgreSQL database (`public.taxa` and `public.taxon_media`) and the local seed bundle (`animalia-handoff-bundle.json`), identifies broken or missing image URLs, and auto-heals them with verified, high-resolution wildlife photographs from the iNaturalist API v1 and Wikipedia REST API.

## Workflow Execution Steps

### 1. Database Connection & Audit
1. Query `public.taxa` and `public.taxon_media` via the `animalia-postgres` MCP server or `pg` client connected to `127.0.0.1:54322`.
2. Retrieve the total count of taxa and examine existing media URLs:
   ```sql
   SELECT t.id, t.scientific_name, t.inat_taxon_id, tm.image_url, tm.thumbnail_url, tm.attribution, tm.license_code
   FROM public.taxa t
   LEFT JOIN public.taxon_media tm ON tm.taxon_id = t.id AND tm.is_primary = true;
   ```
3. Test URL reachability with HTTP HEAD requests (using `User-Agent: AnimaliaMediaHealer/1.0`).

### 2. Auto-Healing Strategy
For every taxon missing a valid media record or returning HTTP 403, 404, or network timeout:
1. **iNaturalist API v1 Lookup**:
   - If `inat_taxon_id` exists: `https://api.inaturalist.org/v1/taxa/${inat_taxon_id}`
   - Else fallback query: `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(scientific_name)}&rank=species`
   - Extract `default_photo`:
     - High-Res URL: replace `/medium.` with `/large.` in `medium_url`
     - Thumbnail URL: `medium_url`
     - Attribution: `photo.attribution` (e.g. `(c) Photographer, CC-BY`)
     - License code: `photo.license_code` (`CC0`, `CC-BY`, `CC-BY-SA`, `CC-BY-NC`)
     - Source provider: `iNaturalist API v1`
     - Source URL: `https://www.inaturalist.org/taxa/${taxon_id}`
2. **Wikipedia REST API Fallback**:
   - If iNaturalist returns no photo, query: `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scientific_name.replace(/\s+/g, '_'))}`
   - Extract:
     - High-Res URL: `originalimage.source`
     - Thumbnail URL: `thumbnail.source`
     - Attribution: `Wikimedia Commons / Wikipedia REST API`
     - License code: `CC-BY-SA`
     - Source provider: `Wikipedia REST API`

### 3. Dual-Persistence Synchronization
1. **Update PostgreSQL**:
   ```sql
   INSERT INTO public.taxon_media (
     taxon_id, image_url, thumbnail_url, attribution, license_code,
     source_provider, source_url, is_primary, verified_taxon_match
   ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, true)
   ON CONFLICT (taxon_id, image_url) DO UPDATE SET
     thumbnail_url = EXCLUDED.thumbnail_url,
     attribution = EXCLUDED.attribution,
     license_code = EXCLUDED.license_code,
     source_provider = EXCLUDED.source_provider,
     source_url = EXCLUDED.source_url,
     is_primary = true,
     verified_taxon_match = true;
   ```
2. **Update Seed Bundle**:
   - Update `animalia-handoff-bundle.json` in place so offline cached records and initial client state match the database.

### 4. Verification
1. Run `node scripts/heal-db-media.js`.
2. Confirm 100% of taxa have valid, verified media records with non-empty attributions.
