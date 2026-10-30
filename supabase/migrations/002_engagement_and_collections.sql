-- ANIMALIA Phase 4 Migration: Engagement Suite & Collections Persistence
-- Tables: user_collections, collection_taxa, discovery_history, quiz_attempts

CREATE TABLE IF NOT EXISTS public.user_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'Bookmark',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.collection_taxa (
  collection_id UUID NOT NULL REFERENCES public.user_collections(id) ON DELETE CASCADE,
  taxon_id UUID NOT NULL REFERENCES public.taxa(id) ON DELETE CASCADE,
  notes TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_id, taxon_id)
);

CREATE TABLE IF NOT EXISTS public.discovery_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxon_id UUID REFERENCES public.taxa(id) ON DELETE CASCADE,
  inspected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_mode TEXT NOT NULL DEFAULT 'EXPLORE'
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_mode TEXT NOT NULL, -- 'VISUAL_IDENTIFICATION', 'CLADE_CLASSIFICATION', 'CONSERVATION_STATUS'
  taxon_id UUID REFERENCES public.taxa(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for rapid lookup & analytics
CREATE INDEX IF NOT EXISTS idx_collection_taxa_taxon ON public.collection_taxa (taxon_id);
CREATE INDEX IF NOT EXISTS idx_discovery_history_taxon ON public.discovery_history (taxon_id);
CREATE INDEX IF NOT EXISTS idx_discovery_history_inspected ON public.discovery_history (inspected_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_mode ON public.quiz_attempts (quiz_mode);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_date ON public.quiz_attempts (attempted_at DESC);
