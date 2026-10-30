-- ==============================================================================
-- ANIMALIA MIGRATION 003: HIGH-PERFORMANCE KEYSET / CURSOR-BASED PAGINATION
-- ==============================================================================
-- Adds composite B-Tree indexes for O(1) seek times across millions of species
-- and provides stored keyset queries to eliminate OFFSET degradation at scale.

-- 1. Composite B-Tree Keyset Indexes
CREATE INDEX IF NOT EXISTS idx_taxa_keyset_name_id 
    ON public.taxa (scientific_name ASC, id ASC);

CREATE INDEX IF NOT EXISTS idx_taxa_keyset_group_name_id 
    ON public.taxa (category_group, scientific_name ASC, id ASC);

CREATE INDEX IF NOT EXISTS idx_taxa_keyset_iucn_name_id 
    ON public.taxa (iucn_status, scientific_name ASC, id ASC);

CREATE INDEX IF NOT EXISTS idx_taxa_keyset_composite 
    ON public.taxa (category_group, iucn_status, scientific_name ASC, id ASC);

-- 2. Stored Keyset Pagination Procedure
CREATE OR REPLACE FUNCTION public.get_taxa_cursor(
    p_limit INT DEFAULT 24,
    p_cursor_name TEXT DEFAULT NULL,
    p_cursor_id TEXT DEFAULT NULL,
    p_category_group TEXT DEFAULT NULL,
    p_iucn_status TEXT DEFAULT NULL,
    p_search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
    id TEXT,
    scientific_name TEXT,
    authorship TEXT,
    common_name TEXT,
    rank TEXT,
    status TEXT,
    is_extinct BOOLEAN,
    category_group TEXT,
    lineage_json JSONB,
    biology_profile JSONB,
    iucn_status TEXT,
    iucn_assessment_year INT,
    completeness_score INT,
    gbif_usage_key BIGINT,
    inat_taxon_id BIGINT,
    image_url TEXT,
    thumbnail_url TEXT,
    license_code TEXT,
    attribution TEXT
) 
LANGUAGE sql
STABLE
AS $$
    SELECT 
        t.id::TEXT,
        t.scientific_name,
        t.authorship,
        t.common_name,
        t.rank::TEXT,
        t.status::TEXT,
        t.is_extinct,
        t.category_group,
        t.lineage_json,
        t.biology_profile,
        t.iucn_status::TEXT,
        t.iucn_assessment_year,
        t.completeness_score,
        t.gbif_usage_key,
        t.inat_taxon_id,
        m.image_url,
        m.thumbnail_url,
        m.license_code,
        m.attribution
    FROM public.taxa t
    LEFT JOIN LATERAL (
        SELECT image_url, thumbnail_url, license_code, attribution
        FROM public.taxon_media
        WHERE taxon_id = t.id
        ORDER BY is_primary DESC, id ASC
        LIMIT 1
    ) m ON true
    WHERE 
        -- Keyset comparison: (scientific_name, id) > (cursor_name, cursor_id)
        (p_cursor_name IS NULL OR (t.scientific_name > p_cursor_name OR (t.scientific_name = p_cursor_name AND t.id::TEXT > p_cursor_id)))
        AND (p_category_group IS NULL OR p_category_group = 'ALL' OR t.category_group = p_category_group)
        AND (
            p_iucn_status IS NULL OR p_iucn_status = 'ALL' 
            OR (p_iucn_status = 'THREATENED' AND t.iucn_status::TEXT IN ('CR', 'EN', 'VU'))
            OR (p_iucn_status = 'LC' AND t.iucn_status::TEXT = 'LC')
            OR (p_iucn_status = 'EX' AND t.iucn_status::TEXT IN ('EX', 'EW'))
            OR t.iucn_status::TEXT = p_iucn_status
        )
        AND (
            p_search_query IS NULL OR length(trim(p_search_query)) = 0 
            OR t.scientific_name ILIKE '%' || p_search_query || '%'
            OR t.common_name ILIKE '%' || p_search_query || '%'
        )
    ORDER BY t.scientific_name ASC, t.id ASC
    LIMIT LEAST(GREATEST(p_limit, 1), 100);
$$;
