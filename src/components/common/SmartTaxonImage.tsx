import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  resolveVerifiedTaxonMedia,
  ResolvedTaxonMedia,
  isCommercialSafeLicense,
  getCommercialSafeMode,
  sanitizeImageUrl
} from '../../services/mediaResolverService';
import { TaxonomicSilhouette } from './TaxonomicSilhouette';

// Fast session cache of decoded/loaded URLs to eliminate scroll flicker
const loadedUrlsCache = new Set<string>();

export interface SmartTaxonImageProps {
  scientificName: string;
  commonName?: string;
  inatTaxonId?: number | null;
  primaryUrl?: string | null;
  thumbnailUrl?: string | null;
  preferThumbnail?: boolean;
  licenseCode?: string | null;
  categoryGroup?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  loading?: 'lazy' | 'eager';
  onMediaResolved?: (media: ResolvedTaxonMedia) => void;
  showAttributionBadge?: boolean;
}

export function SmartTaxonImage({
  scientificName,
  commonName,
  inatTaxonId,
  primaryUrl,
  thumbnailUrl,
  preferThumbnail = false,
  licenseCode,
  categoryGroup = 'Animals',
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = 'relative w-full h-full overflow-hidden',
  loading = 'lazy',
  onMediaResolved,
  showAttributionBadge = false
}: SmartTaxonImageProps) {
  const onMediaResolvedRef = useRef(onMediaResolved);
  useEffect(() => {
    onMediaResolvedRef.current = onMediaResolved;
  }, [onMediaResolved]);

  const imageRef = useRef<HTMLImageElement>(null);
  const targetUrl = preferThumbnail ? (thumbnailUrl || primaryUrl) : (primaryUrl || thumbnailUrl);
  const initialSrc = sanitizeImageUrl(targetUrl || null);
  const isPreloaded = Boolean(initialSrc && loadedUrlsCache.has(initialSrc));

  const [currentSrc, setCurrentSrc] = useState<string | null>(initialSrc);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'resolving' | 'silhouette'>(
    initialSrc ? (isPreloaded ? 'loaded' : 'loading') : 'resolving'
  );
  const [resolvedMeta, setResolvedMeta] = useState<ResolvedTaxonMedia | null>(null);
  const [attemptedResolution, setAttemptedResolution] = useState(false);

  // Check if browser already decoded/cached the image on mount or src change
  useEffect(() => {
    if (imageRef.current && imageRef.current.complete && imageRef.current.naturalWidth > 0) {
      if (currentSrc) loadedUrlsCache.add(currentSrc);
      setStatus('loaded');
    }
  }, [currentSrc]);

  const performAutoHeal = useCallback(
    async (forceCommercialSafe?: boolean) => {
      setAttemptedResolution(true);
      if (!currentSrc) {
        setStatus('resolving');
      }

      try {
        const isCommSafe =
          forceCommercialSafe !== undefined ? forceCommercialSafe : getCommercialSafeMode();

        const resolved = await resolveVerifiedTaxonMedia({
          scientificName,
          inatTaxonId,
          primaryImageUrl: primaryUrl,
          commercialSafeOnly: isCommSafe
        });

        if (resolved && (resolved.thumbnailUrl || resolved.url)) {
          const workingSrc = sanitizeImageUrl(resolved.thumbnailUrl || resolved.url);
          setCurrentSrc(workingSrc);
          setResolvedMeta(resolved);
          loadedUrlsCache.add(workingSrc);
          onMediaResolvedRef.current?.(resolved);
          setStatus('loaded');
        } else {
          if (forceCommercialSafe) {
            setStatus('silhouette');
          } else if (!currentSrc) {
            setStatus('silhouette');
          }
        }
      } catch {
        if (!currentSrc) {
          setStatus('silhouette');
        }
      }
    },
    [scientificName, inatTaxonId, primaryUrl, currentSrc]
  );

  // Sync state if primaryUrl, scientificName, or licenseCode changes
  useEffect(() => {
    const isCommSafe = getCommercialSafeMode();
    if (isCommSafe && licenseCode && !isCommercialSafeLicense(licenseCode)) {
      performAutoHeal(true);
      return;
    }

    const nextTarget = preferThumbnail ? (thumbnailUrl || primaryUrl) : (primaryUrl || thumbnailUrl);
    const nextSrc = sanitizeImageUrl(nextTarget || null);
    if (nextSrc) {
      if (nextSrc !== currentSrc) {
        setCurrentSrc(nextSrc);
        const alreadyLoaded = loadedUrlsCache.has(nextSrc);
        setStatus(alreadyLoaded ? 'loaded' : 'loading');
        setAttemptedResolution(false);
      }
    } else {
      performAutoHeal(isCommSafe);
    }
  }, [primaryUrl, thumbnailUrl, scientificName, inatTaxonId, licenseCode, preferThumbnail]);

  // Listen for global license mode change events to hot-swap -NC photos
  useEffect(() => {
    const handleLicenseChange = (e: Event) => {
      const customEvt = e as CustomEvent<{ commercialSafe: boolean }>;
      const isCommSafe = customEvt.detail?.commercialSafe ?? getCommercialSafeMode();
      const currentLicense = resolvedMeta?.licenseCode || licenseCode;

      if (isCommSafe && currentLicense && !isCommercialSafeLicense(currentLicense)) {
        setAttemptedResolution(false);
        performAutoHeal(true);
      } else if (!isCommSafe && (thumbnailUrl || primaryUrl)) {
        const nextTarget = preferThumbnail ? (thumbnailUrl || primaryUrl) : (primaryUrl || thumbnailUrl);
        const clean = sanitizeImageUrl(nextTarget || null);
        setCurrentSrc(clean);
        setResolvedMeta(null);
        setStatus(clean && loadedUrlsCache.has(clean) ? 'loaded' : 'loading');
      }
    };

    window.addEventListener('animalia:license-mode-changed', handleLicenseChange);
    return () => window.removeEventListener('animalia:license-mode-changed', handleLicenseChange);
  }, [scientificName, inatTaxonId, licenseCode, resolvedMeta, thumbnailUrl, primaryUrl, preferThumbnail, performAutoHeal]);

  const handleError = () => {
    // If currentSrc failed and alternate thumbnail is available, attempt it first
    const cleanThumb = sanitizeImageUrl(thumbnailUrl);
    if (cleanThumb && currentSrc !== cleanThumb) {
      setCurrentSrc(cleanThumb);
      setStatus(loadedUrlsCache.has(cleanThumb) ? 'loaded' : 'loading');
      return;
    }

    // If currentSrc was the thumbnail and primary is available, attempt it
    const cleanPrimary = sanitizeImageUrl(primaryUrl);
    if (cleanPrimary && currentSrc !== cleanPrimary) {
      setCurrentSrc(cleanPrimary);
      setStatus(loadedUrlsCache.has(cleanPrimary) ? 'loaded' : 'loading');
      return;
    }

    if (!attemptedResolution) {
      performAutoHeal(getCommercialSafeMode());
    } else {
      setStatus('silhouette');
    }
  };

  const handleLoad = () => {
    if (currentSrc) {
      loadedUrlsCache.add(currentSrc);
    }
    setStatus('loaded');
  };

  if (status === 'silhouette' || (!currentSrc && status !== 'resolving' && status !== 'loading')) {
    return (
      <TaxonomicSilhouette
        categoryGroup={categoryGroup}
        scientificName={scientificName}
        className={className}
      />
    );
  }

  const effectiveAttribution = resolvedMeta?.attribution || 'Verified Zoological Record';
  const effectiveLicense = (resolvedMeta?.licenseCode || licenseCode || 'CC-BY-SA').toUpperCase();
  const effectiveProvider = resolvedMeta?.sourceProvider || 'Biodiversity Archive';

  const effectiveContainerClass = containerClassName
    ? (containerClassName.includes('relative') ? containerClassName : `relative ${containerClassName}`)
    : 'relative w-full h-full overflow-hidden';

  return (
    <div className={effectiveContainerClass}>
      {/* Loading Skeleton */}
      {status === 'loading' && !isPreloaded && (
        <div className="absolute inset-0 bg-stone-200 dark:bg-[#121715] animate-pulse" />
      )}

      {/* Resolving Spinner */}
      {status === 'resolving' && (
        <div className="absolute inset-0 bg-[#070A09]/80 flex flex-col items-center justify-center gap-2 p-4 text-center z-10">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-mono text-emerald-400 tracking-wider uppercase">
            Resolving Commercial Media...
          </span>
        </div>
      )}

      {currentSrc && (
        <img
          ref={imageRef}
          src={currentSrc}
          alt={alt || commonName || scientificName}
          className={`${className} ${status === 'loaded' || isPreloaded ? 'opacity-100' : 'opacity-90'} transition-opacity duration-150`}
          loading={loading}
          referrerPolicy="no-referrer"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Attribution Overlay Badge */}
      {showAttributionBadge && (status === 'loaded' || isPreloaded) && (
        <div className="absolute bottom-1 right-1 max-w-[85%] bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-mono text-white/90 truncate pointer-events-none">
          <span className="font-semibold text-emerald-400">{effectiveLicense}</span>
          <span className="mx-1 text-white/40">•</span>
          <span className="truncate">{effectiveAttribution}</span>
        </div>
      )}
    </div>
  );
}
