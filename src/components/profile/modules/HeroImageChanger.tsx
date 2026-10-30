import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Camera,
  ExternalLink,
  Sparkles,
  Layers
} from 'lucide-react';
import type { AnimalRecord } from '../../../types/taxonomy';
import { SmartTaxonImage } from '../../common/SmartTaxonImage';
import { DataSourceBadge } from '../../common/DataSourceBadge';
import { AudioWaveformIcon } from '../../common/AudioWaveformIcon';
import { globalAudioBus, type AudioPlaybackState } from '../../../services/audioCoordinator';
import { resolveTaxonBioacoustics, type BioacousticResolution } from '../../../services/bioacousticService';
import {
  fetchTaxonGallery,
  type TaxonMediaItem,
  type ResolvedTaxonMedia,
  getCommercialSafeMode,
  isCommercialSafeLicense,
  sanitizeImageUrl
} from '../../../services/mediaResolverService';

export interface HeroImageChangerProps {
  animal: AnimalRecord;
  onMediaResolved?: (media: ResolvedTaxonMedia) => void;
  onOpenTheatre?: (photoIndex: number) => void;
  activePhotoIndex?: number;
  onActivePhotoIndexChange?: (index: number) => void;
  onGalleryLoaded?: (items: TaxonMediaItem[]) => void;
  className?: string;
}

const SLIDESHOW_INTERVAL_MS = 5000;
const SLIDESHOW_TICK_MS = 50;

export function HeroImageChanger({
  animal,
  onMediaResolved,
  onOpenTheatre,
  activePhotoIndex: externalIndex,
  onActivePhotoIndexChange,
  onGalleryLoaded,
  className = ''
}: HeroImageChangerProps) {
  const [internalIndex, setInternalIndex] = useState<number>(0);

  // Initialize gallery synchronously with available animal media
  const initialGallery = useMemo<TaxonMediaItem[]>(() => {
    const list: TaxonMediaItem[] = [];
    const isCommSafe = getCommercialSafeMode();
    if (animal.media?.url && (!isCommSafe || isCommercialSafeLicense(animal.media.licenseCode))) {
      list.push({
        url: sanitizeImageUrl(animal.media.url),
        thumbnailUrl: sanitizeImageUrl(animal.media.thumbnailUrl || animal.media.url),
        attribution: animal.media.attribution || 'Verified Zoological Record',
        licenseCode: animal.media.licenseCode || 'CC-BY-SA',
        sourceProvider: animal.media.sourceProvider || 'ANIMALIA Backbone',
        sourceUrl: animal.media.sourceUrl
      });
    }
    if (Array.isArray(animal.media?.additionalPhotos)) {
      for (const p of animal.media.additionalPhotos) {
        if (p?.url && (!isCommSafe || isCommercialSafeLicense(p.licenseCode))) {
          const cleanUrl = sanitizeImageUrl(p.url);
          if (!list.some((existing) => existing.url === cleanUrl)) {
            list.push({
              url: cleanUrl,
              thumbnailUrl: sanitizeImageUrl(p.thumbnailUrl || p.url),
              attribution: p.attribution || 'Community Observer',
              licenseCode: p.licenseCode || 'CC-BY-SA',
              sourceProvider: (p as any).sourceProvider || 'iNaturalist',
              sourceUrl: (p as any).sourceUrl || p.url
            });
          }
        }
      }
    }
    return list;
  }, [animal.id, animal.media]);

  const [gallery, setGallery] = useState<TaxonMediaItem[]>(initialGallery);
  const [isLoadingGallery, setIsLoadingGallery] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [audioResolution, setAudioResolution] = useState<BioacousticResolution | null>(null);
  const [audioState, setAudioState] = useState<AudioPlaybackState>(globalAudioBus.getState());

  const filmstripRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // Keep stable refs to callbacks
  const onActivePhotoIndexChangeRef = useRef(onActivePhotoIndexChange);
  useEffect(() => {
    onActivePhotoIndexChangeRef.current = onActivePhotoIndexChange;
  });

  const onMediaResolvedRef = useRef(onMediaResolved);
  useEffect(() => {
    onMediaResolvedRef.current = onMediaResolved;
  });

  const onGalleryLoadedRef = useRef(onGalleryLoaded);
  useEffect(() => {
    onGalleryLoadedRef.current = onGalleryLoaded;
  });

  const { identity, media, biology, dataSource } = animal;

  // Active index resolution with bounds guard
  const activeIndex = externalIndex !== undefined ? externalIndex : internalIndex;
  const safeIndex = gallery.length > 0 ? Math.min(Math.max(0, activeIndex), gallery.length - 1) : 0;
  const currentPhoto = gallery[safeIndex] || (gallery[0] ?? null);

  // Subscribe to audio coordinator
  useEffect(() => {
    return globalAudioBus.subscribe((s) => setAudioState(s));
  }, []);

  // Resolve audio for quick hero capsule
  useEffect(() => {
    let sub = true;
    resolveTaxonBioacoustics(animal).then((res) => {
      if (sub) setAudioResolution(res);
    }).catch(() => {});
    return () => { sub = false; };
  }, [animal.id]);

  // Handle active index change
  const setActiveIndex = useCallback(
    (indexOrUpdater: number | ((prev: number) => number)) => {
      setInternalIndex((prev) => {
        const current = externalIndex !== undefined ? externalIndex : prev;
        const next = typeof indexOrUpdater === 'function' ? indexOrUpdater(current) : indexOrUpdater;
        onActivePhotoIndexChangeRef.current?.(next);
        return next;
      });
    },
    [externalIndex]
  );

  // 1. Reset state and load gallery whenever animal.id or license mode changes
  const [licenseRefreshKey, setLicenseRefreshKey] = useState<number>(0);

  useEffect(() => {
    const handleLicenseChange = () => {
      setLicenseRefreshKey((k) => k + 1);
    };
    window.addEventListener('animalia:license-mode-changed', handleLicenseChange);
    return () => window.removeEventListener('animalia:license-mode-changed', handleLicenseChange);
  }, []);

  useEffect(() => {
    // Reset index to 0 ONLY when animal.id changes or license mode refreshes
    setInternalIndex(0);
    onActivePhotoIndexChangeRef.current?.(0);
    setIsPlaying(false);
    setProgressPercent(0);
    setGallery(initialGallery);
    if (initialGallery.length > 0) {
      onGalleryLoadedRef.current?.(initialGallery);
    }
    setIsLoadingGallery(true);

    let isSubscribed = true;
    const isCommSafe = getCommercialSafeMode();

    fetchTaxonGallery(animal, isCommSafe)
      .then((items) => {
        if (!isSubscribed) return;
        if (items && items.length > 0) {
          setGallery(items);
          onGalleryLoadedRef.current?.(items);
        } else if (initialGallery.length > 0) {
          setGallery(initialGallery);
          onGalleryLoadedRef.current?.(initialGallery);
        } else {
          setGallery([]);
        }
      })
      .catch(() => {
        if (!isSubscribed) return;
        if (initialGallery.length > 0) {
          setGallery(initialGallery);
          onGalleryLoadedRef.current?.(initialGallery);
        }
      })
      .finally(() => {
        if (isSubscribed) setIsLoadingGallery(false);
      });

    return () => {
      isSubscribed = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [animal.id, licenseRefreshKey]);

  // Propagate resolved attribution when photo changes
  useEffect(() => {
    if (currentPhoto && onMediaResolvedRef.current) {
      onMediaResolvedRef.current({
        url: currentPhoto.url,
        thumbnailUrl: currentPhoto.thumbnailUrl,
        attribution: currentPhoto.attribution,
        licenseCode: currentPhoto.licenseCode,
        sourceProvider: currentPhoto.sourceProvider || 'ANIMALIA Media Harvester',
        sourceUrl: currentPhoto.sourceUrl,
        verifiedTaxonMatch: true
      });
    }
  }, [currentPhoto?.url]);

  // 2. Navigation handlers
  const handleNextPhoto = useCallback(() => {
    if (gallery.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % gallery.length);
    setProgressPercent(0);
  }, [gallery.length, setActiveIndex]);

  const handlePrevPhoto = useCallback(() => {
    if (gallery.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
    setProgressPercent(0);
  }, [gallery.length, setActiveIndex]);

  // 3. Slideshow ticker
  useEffect(() => {
    if (!isPlaying || isHovered || gallery.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      return;
    }

    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) % SLIDESHOW_INTERVAL_MS;
      setProgressPercent((elapsed / SLIDESHOW_INTERVAL_MS) * 100);
    }, SLIDESHOW_TICK_MS);

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % gallery.length);
      setProgressPercent(0);
    }, SLIDESHOW_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isPlaying, isHovered, gallery.length, setActiveIndex]);

  // 4. Keyboard shortcuts `[` and `]` (ignoring input/textarea/select)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key === '[') {
        e.preventDefault();
        handlePrevPhoto();
      } else if (e.key === ']') {
        e.preventDefault();
        handleNextPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevPhoto, handleNextPhoto]);

  // 5. Scroll active filmstrip thumbnail into view
  useEffect(() => {
    if (!filmstripRef.current) return;
    const activeThumb = filmstripRef.current.children[safeIndex] as HTMLElement | undefined;
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [safeIndex]);

  const totalPhotos = gallery.length;

  return (
    <div
      className={`relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Aspect Ratio Container for Specimen Showcase */}
      <div className="aspect-[16/9] sm:aspect-[21/9] w-full relative overflow-hidden">
        {/* Active Specimen Photo with Smooth Key Transition */}
        {currentPhoto?.url ? (
          <div key={currentPhoto.url} className="w-full h-full animate-in fade-in duration-300">
            <SmartTaxonImage
              scientificName={identity.scientificName}
              commonName={identity.commonName}
              inatTaxonId={identity.externalIds?.inatTaxonId}
              primaryUrl={currentPhoto.url}
              thumbnailUrl={currentPhoto.thumbnailUrl}
              licenseCode={currentPhoto.licenseCode}
              categoryGroup={identity.categoryGroup}
              alt={`${identity.commonName} specimen view ${safeIndex + 1}`}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              containerClassName="w-full h-full"
              loading="eager"
            />
          </div>
        ) : (
          <SmartTaxonImage
            scientificName={identity.scientificName}
            commonName={identity.commonName}
            inatTaxonId={identity.externalIds?.inatTaxonId}
            primaryUrl={media?.url}
            thumbnailUrl={media?.thumbnailUrl}
            licenseCode={media?.licenseCode}
            categoryGroup={identity.categoryGroup}
            alt={identity.commonName}
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            loading="eager"
          />
        )}

        {/* Dark Vignette Overlay for Crisp Typography Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/35 pointer-events-none" />

        {/* Top Floating Badges & Photo Counter */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            <DataSourceBadge sourceType={dataSource} />
            <span className="text-[11px] font-mono uppercase bg-black/60 backdrop-blur-md text-amber-400 px-3 py-1 rounded-xl border border-white/10">
              {identity.categoryGroup}
            </span>
          </div>

          {/* Photo Counter Pill & Slideshow Indicator */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Quick Bioacoustic Sound Capsule */}
            {audioResolution?.primaryAudio && (
              <button
                onClick={() => globalAudioBus.toggle(audioResolution.primaryAudio!)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-medium backdrop-blur-md border transition-all ${
                  audioState.isPlaying && audioState.activeTrack?.audioUrl === audioResolution.primaryAudio.audioUrl
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-lg shadow-emerald-500/20'
                    : 'bg-black/60 text-emerald-300 border-white/10 hover:bg-black/80'
                }`}
                title={
                  audioState.isPlaying && audioState.activeTrack?.audioUrl === audioResolution.primaryAudio.audioUrl
                    ? 'Pause Animal Call'
                    : `Listen to ${audioResolution.primaryAudio.recordingType || 'Call'}`
                }
                aria-label="Toggle Animal Vocalization"
              >
                <AudioWaveformIcon
                  isPlaying={audioState.isPlaying && audioState.activeTrack?.audioUrl === audioResolution.primaryAudio.audioUrl}
                  barClassName={
                    audioState.isPlaying && audioState.activeTrack?.audioUrl === audioResolution.primaryAudio.audioUrl
                      ? 'bg-slate-950'
                      : 'bg-emerald-400'
                  }
                />
                <span className="hidden sm:inline">
                  {audioState.isPlaying && audioState.activeTrack?.audioUrl === audioResolution.primaryAudio.audioUrl
                    ? 'Pause Call'
                    : 'Listen Call'}
                </span>
              </button>
            )}

            {totalPhotos > 1 && (
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-medium backdrop-blur-md border transition-all ${
                  isPlaying
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                    : 'bg-black/60 text-slate-200 border-white/10 hover:bg-black/80'
                }`}
                title={isPlaying ? 'Pause Slideshow' : 'Play Auto-Slideshow (5s)'}
                aria-label={isPlaying ? 'Pause Slideshow' : 'Play Auto-Slideshow'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isPlaying ? 'Slideshow' : 'Slideshow'}</span>
              </button>
            )}

            <div className="px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono text-amber-300 font-semibold flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Photo {totalPhotos > 0 ? safeIndex + 1 : 1} of {Math.max(totalPhotos, 1)}
              </span>
            </div>
          </div>
        </div>

        {/* Floating Prev / Next Chevrons on Hover */}
        {totalPhotos > 1 && (
          <>
            <button
              onClick={handlePrevPhoto}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-black/60 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/15 backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110 shadow-xl"
              title="Previous Photo ([)"
              aria-label="Previous Photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNextPhoto}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-black/60 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/15 backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110 shadow-xl"
              title="Next Photo (])"
              aria-label="Next Photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Slideshow Linear Progress Bar */}
        {isPlaying && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/15 overflow-hidden z-10 pointer-events-none">
            <div
              className="h-full bg-amber-400 transition-all duration-75 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Hero Narrative Overlay & Lightbox Button */}
        <div className="absolute bottom-20 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-6 pointer-events-none">
          <div className="space-y-1.5 max-w-2xl">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-extrabold text-white tracking-tight drop-shadow-md">
              {identity.commonName}
            </h2>
            <p className="text-xs sm:text-base font-serif italic text-amber-200 drop-shadow">
              {identity.scientificName}{' '}
              {identity.authorship && (
                <span className="not-italic text-xs text-slate-300 font-sans">
                  {identity.authorship}
                </span>
              )}
            </p>
            <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed drop-shadow hidden sm:block">
              {biology.summary?.text || 'No biological summary available.'}
            </p>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            {onOpenTheatre && (
              <button
                onClick={() => onOpenTheatre(safeIndex)}
                className="px-4 py-2.5 rounded-2xl bg-black/75 hover:bg-black/95 text-white border border-white/20 backdrop-blur-md text-xs font-semibold flex items-center gap-2 transition-all shadow-lg hover:scale-105"
                title="Expand current photo to high-res Theatre Lightbox"
              >
                <Maximize2 className="w-4 h-4 text-amber-400" />
                <span>Theatre Lightbox</span>
              </button>
            )}
          </div>
        </div>

        {/* 35MM ARCHIVAL CONTACT SHEET / FILMSTRIP */}
        {totalPhotos > 1 && (
          <div className="absolute bottom-2 left-4 right-4 flex items-center gap-2 overflow-x-auto py-1.5 px-2 bg-black/85 backdrop-blur-md rounded-xl border border-white/15 scrollbar-none z-10 shadow-2xl">
            <div className="flex items-center gap-1 text-[9px] font-mono text-[#D4A359] uppercase tracking-widest px-1 border-r border-white/20 mr-1 shrink-0 select-none hidden sm:flex">
              <span>35mm Plate</span>
            </div>
            <div ref={filmstripRef} className="flex items-center gap-2.5 shrink-0">
              {gallery.map((photo, idx) => {
                const isActive = idx === safeIndex;
                const frameNo = String(idx + 1).padStart(2, '0');
                return (
                  <button
                    key={photo.url || idx}
                    onClick={() => {
                      setActiveIndex(idx);
                      setProgressPercent(0);
                    }}
                    className={`group/thumb relative rounded-md overflow-hidden shrink-0 border transition-all duration-300 flex flex-col items-center ${
                      isActive
                        ? 'border-[#D4A359] ring-2 ring-[#D4A359]/60 scale-105 shadow-md shadow-[#D4A359]/20'
                        : 'border-white/25 opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                    title={`View specimen frame ${frameNo}`}
                    aria-label={`Jump to photo ${idx + 1}`}
                  >
                    <div className="w-14 h-10 sm:w-16 sm:h-11 relative">
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={`specimen thumb ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      {/* Film sprocket frame indicator */}
                      <span className="absolute bottom-0 right-0 px-1 text-[8px] font-mono bg-black/80 text-white font-bold tracking-tighter">
                        {frameNo}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ARCHIVAL MUSEUM PLAQUE ATTRIBUTION & LICENSE BAR */}
      <div className="px-4 sm:px-6 py-3 bg-[#070A09]/95 border-t border-white/10 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[#949E99]">
        <div className="flex items-center gap-2 truncate">
          <Camera className="w-3.5 h-3.5 text-[#D4A359] shrink-0" />
          <span className="text-slate-500 uppercase tracking-wider text-[10px]">Archival Plate:</span>
          <span className="font-semibold text-[#F2EFE9] truncate">
            {currentPhoto?.attribution || 'Verified Zoological Record'}
          </span>
          <span className="specimen-stamp text-[#D4A359] border-[#D4A359]/40 bg-[#D4A359]/10 text-[9px] shrink-0">
            {currentPhoto?.licenseCode || 'CC-BY-SA'}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-[11px]">
          {currentPhoto?.sourceProvider && (
            <span className="text-emerald-400 font-medium">
              BACKBONE: {currentPhoto.sourceProvider}
            </span>
          )}
          {currentPhoto?.sourceUrl && (
            <a
              href={currentPhoto.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-[#D4A359] hover:underline flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider"
            >
              <span>Repository Source Record</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
