/**
 * ANIMALIA — useInfiniteTaxaScroll Hook
 * 
 * Manages cursor-based keyset infinite pagination over public.taxa.
 * Stabilizes memory consumption, automatically triggers loadMore when scrolling,
 * and handles dynamic filter changes cleanly.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimalRecord } from '../types/taxonomy.ts';
import { repository, CursorPaginatedResult, getCanonicalBinomial } from '../services/supabaseRepository.ts';

export interface UseInfiniteTaxaScrollOptions {
  categoryGroup: string;
  iucnStatus: string;
  searchQuery: string;
  pageSize?: number;
}

export interface UseInfiniteTaxaScrollReturn {
  taxa: AnimalRecord[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  reset: () => void;
  sentinelRef: (node: HTMLElement | null) => void;
  mergeLiveResults: (liveResults: AnimalRecord[]) => void;
  updateTaxon: (updated: AnimalRecord) => void;
}

export function useInfiniteTaxaScroll({
  categoryGroup,
  iucnStatus,
  searchQuery,
  pageSize = 24
}: UseInfiniteTaxaScrollOptions): UseInfiniteTaxaScrollReturn {
  const [taxa, setTaxa] = useState<AnimalRecord[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<boolean>(false);
  const hasMoreRef = useRef<boolean>(true);
  const cursorRef = useRef<string | null>(null);

  loadingRef.current = isLoading || isLoadingMore;
  hasMoreRef.current = hasMore;
  cursorRef.current = cursor;

  // Initial fetch on filter change
  const fetchInitial = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result: CursorPaginatedResult<AnimalRecord> = await repository.getTaxaCursor({
        limit: pageSize,
        cursor: null,
        categoryGroup,
        iucnStatus,
        searchQuery
      });

      setTaxa(result.items);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch initial taxa page');
    } finally {
      setIsLoading(false);
    }
  }, [categoryGroup, iucnStatus, searchQuery, pageSize]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  // Load next keyset batch
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current || !cursorRef.current) return;

    setIsLoadingMore(true);
    setError(null);
    try {
      const result: CursorPaginatedResult<AnimalRecord> = await repository.getTaxaCursor({
        limit: pageSize,
        cursor: cursorRef.current,
        categoryGroup,
        iucnStatus,
        searchQuery
      });

      setTaxa((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const existingBinomials = new Set(
          prev.map((t) =>
            t.identity?.scientificName?.includes('"')
              ? t.identity.scientificName.toLowerCase()
              : getCanonicalBinomial(t.identity?.scientificName)
          ).filter(Boolean)
        );

        const deduplicated = result.items.filter((t) => {
          if (existingIds.has(t.id)) return false;
          const bin = t.identity?.scientificName?.includes('"')
            ? t.identity.scientificName.toLowerCase()
            : getCanonicalBinomial(t.identity?.scientificName);
          if (bin && existingBinomials.has(bin)) return false;
          return true;
        });
        return [...prev, ...deduplicated];
      });
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch next taxa batch');
    } finally {
      setIsLoadingMore(false);
    }
  }, [categoryGroup, iucnStatus, searchQuery, pageSize]);

  // Merge live search results from iNaturalist
  const mergeLiveResults = useCallback((liveResults: AnimalRecord[]) => {
    setTaxa((prev) => {
      const liveIds = new Set(liveResults.map((r) => r.id));
      const liveBinomials = new Set(
        liveResults.map((r) =>
          r.identity?.scientificName?.includes('"')
            ? r.identity.scientificName.toLowerCase()
            : getCanonicalBinomial(r.identity?.scientificName)
        ).filter(Boolean)
      );

      const remaining = prev.filter((r) => {
        if (liveIds.has(r.id)) return false;
        const bin = r.identity?.scientificName?.includes('"')
          ? r.identity.scientificName.toLowerCase()
          : getCanonicalBinomial(r.identity?.scientificName);
        if (bin && liveBinomials.has(bin)) return false;
        return true;
      });
      return [...liveResults, ...remaining];
    });
  }, []);

  // Update a single taxon in place (e.g. after GBIF enrichment)
  const updateTaxon = useCallback((updated: AnimalRecord) => {
    setTaxa((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  // IntersectionObserver sentinel for automatic infinite scroll
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
            loadMore();
          }
        },
        { rootMargin: '300px' }
      );

      observerRef.current.observe(node);
    },
    [loadMore]
  );

  return {
    taxa,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    reset: fetchInitial,
    sentinelRef,
    mergeLiveResults,
    updateTaxon
  };
}
