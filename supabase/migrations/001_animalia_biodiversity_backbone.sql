-- ANIMALIA Phase 2-6 Production Biodiversity Schema (PostgreSQL / Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TYPE taxonomic_rank AS ENUM (
  'KINGDOM', 'PHYLUM', 'SUBPHYLUM', 'CLASS', 'ORDER', 'FAMILY', 'GENUS', 'SPECIES', 'SUBSPECIES'
);

CREATE TYPE taxonomic_status AS ENUM (
  'ACCEPTED', 'SYNONYM', 'HOMOTYPIC_SYNONYM', 'HETEROTYPIC_SYNONYM', 'DOUBTFUL'
);

CREATE TYPE iucn_red_list_code AS ENUM (
  'EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD', 'NE'
);

CREATE TABLE public.taxa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gbif_usage_key BIGINT UNIQUE,
  inat_taxon_id BIGINT UNIQUE,
  col_id TEXT,
  scientific_name TEXT NOT NULL,
  authorship TEXT,
  common_name TEXT,
  rank taxonomic_rank NOT NULL DEFAULT 'SPECIES',
  status taxonomic_status NOT NULL DEFAULT 'ACCEPTED',
  accepted_taxon_id UUID REFERENCES public.taxa(id) ON DELETE SET NULL,
  is_extinct BOOLEAN NOT NULL DEFAULT FALSE,
  category_group TEXT NOT NULL,
  lineage_path ltree,
  lineage_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  biology_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  iucn_status iucn_red_list_code NOT NULL DEFAULT 'NE',
  iucn_assessment_year INT,
  completeness_score INT NOT NULL DEFAULT 0,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.taxon_synonyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  accepted_taxon_id UUID NOT NULL REFERENCES public.taxa(id) ON DELETE CASCADE,
  synonym_scientific_name TEXT NOT NULL,
  authorship TEXT,
  status taxonomic_status NOT NULL DEFAULT 'SYNONYM',
  gbif_synonym_key BIGINT,
  UNIQUE(accepted_taxon_id, synonym_scientific_name)
);

CREATE TABLE public.taxon_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  taxon_id UUID NOT NULL REFERENCES public.taxa(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  attribution TEXT NOT NULL,
  license_code TEXT NOT NULL,
  source_provider TEXT NOT NULL,
  source_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  verified_taxon_match BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_taxa_scientific_trgm ON public.taxa USING GIN (scientific_name gin_trgm_ops);
CREATE INDEX idx_taxa_common_trgm ON public.taxa USING GIN (common_name gin_trgm_ops);
CREATE INDEX idx_taxa_lineage_gist ON public.taxa USING GIST (lineage_path);
CREATE INDEX idx_synonyms_name_trgm ON public.taxon_synonyms USING GIN (synonym_scientific_name gin_trgm_ops);