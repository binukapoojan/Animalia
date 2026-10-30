import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Bookmark, Scale, ChevronRight, Camera, Loader2 } from 'lucide-react';
import { AnimalRecord, TaxonAudioItem } from '../../types/taxonomy';
import { IucnBadge } from '../common/IucnBadge';
import { DataSourceBadge } from '../common/DataSourceBadge';
import { SmartTaxonImage } from '../common/SmartTaxonImage';
import type { ResolvedTaxonMedia } from '../../services/mediaResolverService';
import { AudioWaveformIcon } from '../common/AudioWaveformIcon';
import { globalAudioBus, type AudioPlaybackState } from '../../services/audioCoordinator';
import { resolveTaxonBioacoustics } from '../../services/bioacousticService';

const NON_VOCAL_PHYLA = new Set([
  'porifera',
  'cnidaria',
  'tardigrada',
  'echinodermata',
  'platyhelminthes',
  'rotifera',
  'bryozoa',
  'nematoda'
]);

interface AnimalCardProps {
  animal: AnimalRecord;
  isFavorite: boolean;
  onToggleFavorite: (animal: AnimalRecord) => void;
  isCompared: boolean;
  onToggleCompare: (animal: AnimalRecord) => void;
  onSelectAnimal: (animal: AnimalRecord) => void;
  className?: string;
}

export function AnimalCard({
  animal,
  isFavorite,
  onToggleFavorite,
  isCompared,
  onToggleCompare,
  onSelectAnimal,
  className = ''
}: AnimalCardProps) {
  const { id, identity, media, biology, dataSource } = animal;
  const [currentAttribution, setCurrentAttribution] = useState<string>(
    media.attribution ? `${media.attribution}${media.licenseCode ? ` (${media.licenseCode})` : ''}` : 'Wikimedia'
  );

  const handleMediaResolved = useCallback((resolved: ResolvedTaxonMedia) => {
    setCurrentAttribution(`${resolved.attribution} (${resolved.licenseCode})`);
  }, []);

  const [audioState, setAudioState] = useState<AudioPlaybackState>(globalAudioBus.getState());
  const [isResolvingAudio, setIsResolvingAudio] = useState<boolean>(false);
  const [resolvedAudio, setResolvedAudio] = useState<TaxonAudioItem | null>(() => {
    if (media?.audio?.audioUrl) return media.audio;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem(`animalia_audio_cache_v1_${(animal.id || identity.scientificName).toLowerCase()}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          return parsed.primaryAudio || null;
        }
      } catch {}
    }
    return null;
  });

  // Deterministic Specimen Number formatting for archival catalog plate
  const specimenNo = useMemo(() => {
    const rawNum = id.replace(/\D/g, '');
    if (rawNum.length >= 3) return rawNum.slice(-3);
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    return String(Math.abs(hash) % 900 + 100);
  }, [id]);

  // Determine if animal is non-vocal or extinct (suppress audio preview)
  const phylum = (identity.lineage?.phylum || '').toLowerCase();
  const category = (identity.categoryGroup || '').toLowerCase();
  const isSilentOrExtinct =
    identity.isExtinct ||
    category === 'extinct taxa' ||
    category === 'microscopic animals' ||
    NON_VOCAL_PHYLA.has(phylum);

  // Subscribe to audio bus
  useEffect(() => {
    return globalAudioBus.subscribe((s) => setAudioState(s));
  }, []);

  const isCurrentAudioPlaying =
    audioState.isPlaying &&
    resolvedAudio !== null &&
    audioState.activeTrack?.audioUrl === resolvedAudio.audioUrl;

  const handleAudioPillClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (resolvedAudio) {
      globalAudioBus.toggle(resolvedAudio);
      return;
    }

    // Lazy on-click resolution to avoid N+1 API flood
    setIsResolvingAudio(true);
    try {
      const res = await resolveTaxonBioacoustics(animal);
      if (res.primaryAudio) {
        setResolvedAudio(res.primaryAudio);
        globalAudioBus.play(res.primaryAudio);
      }
    } catch (err) {
      console.warn('Lazy audio resolution notice:', err);
    } finally {
      setIsResolvingAudio(false);
    }
  };

  return (
    <article
      onClick={() => onSelectAnimal(animal)}
      className={`group relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer border border-[#141816]/15 dark:border-white/10 bg-[#070A09] shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 select-none flex flex-col justify-between ${className}`}
    >
      {/* 1. FULL-BLEED PHOTOGRAPHIC SPECIMEN FRAME */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#070A09]">
        <SmartTaxonImage
          scientificName={identity.scientificName}
          commonName={identity.commonName}
          inatTaxonId={identity.externalIds?.inatTaxonId}
          primaryUrl={media?.url}
          thumbnailUrl={media?.thumbnailUrl}
          licenseCode={media?.licenseCode}
          categoryGroup={identity.categoryGroup}
          alt={identity.commonName}
          className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
          containerClassName="w-full h-full"
          loading="eager"
          onMediaResolved={handleMediaResolved}
        />

        {/* Top Vignette Scrim for Contrast */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#070A09]/80 via-[#070A09]/30 to-transparent pointer-events-none" />

        {/* Permanent Multi-Stop Bottom Scrim (Ensures 100% Legibility over Snow / White Images) */}
        <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-[#070A09] via-[#070A09]/85 via-45% to-transparent pointer-events-none" />
      </div>

      {/* 2. TOP ARCHIVAL INDEX & SPECIMEN CONTROLS */}
      <div className="relative z-10 p-3.5 sm:p-4 flex items-start justify-between gap-2 pointer-events-auto">
        {/* Monospace Archival Index Stamp */}
        <div className="flex flex-col gap-1 items-start">
          <div className="specimen-stamp bg-[#070A09]/80 backdrop-blur-md text-[#D4A359] border-[#D4A359]/40 shadow-sm">
            <span>NO. {specimenNo} // {identity.categoryGroup.toUpperCase()}</span>
          </div>
          <DataSourceBadge sourceType={dataSource} />
        </div>

        {/* IUCN Stamp & Quick Action Pins */}
        <div className="flex items-center gap-1.5 bg-[#070A09]/80 backdrop-blur-md rounded-xl p-1 border border-white/10 shadow-sm">
          <IucnBadge status={biology.conservation?.iucnStatus} />

          {/* Quick Collection Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(animal);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              isFavorite ? 'text-amber-400 bg-amber-400/20' : 'text-slate-300 hover:text-white'
            }`}
            title={isFavorite ? 'Remove from Saved Collection' : 'Save to Field Notebook'}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Quick Compare Matrix Pin */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(animal);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              isCompared ? 'text-emerald-400 bg-emerald-400/20' : 'text-slate-300 hover:text-white'
            }`}
            title={isCompared ? 'Remove from Comparison Matrix' : 'Add to Comparison Matrix'}
          >
            <Scale className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. BOTTOM EDITORIAL NARRATIVE & HOVER ACTION TRAY */}
      <div className="relative z-10 p-4 sm:p-5 flex flex-col justify-end text-white space-y-2 pointer-events-auto">
        {/* Attribution Micro-Plaque */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#949E99] truncate max-w-[240px]" title={currentAttribution}>
          <Camera className="w-3 h-3 text-[#D4A359] shrink-0" />
          <span className="truncate">{currentAttribution}</span>
        </div>

        {/* Taxonomic Nomenclature */}
        <div>
          <h3 className="font-serif text-2xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-[#D4A359] transition-colors line-clamp-1">
            {identity.commonName}
          </h3>
          <p className="font-serif italic text-xs sm:text-sm text-amber-200/90 line-clamp-1">
            {identity.scientificName}{' '}
            {identity.authorship && (
              <span className="not-italic text-[11px] text-[#949E99] font-sans">
                {identity.authorship}
              </span>
            )}
          </p>
        </div>

        {/* Diagnostic Field Trait Excerpt */}
        <p className="text-xs text-[#F2EFE9]/85 line-clamp-2 leading-relaxed font-sans">
          {biology.discovery?.distinguishingTraits?.[0] || biology.summary?.text || 'No biological summary available.'}
        </p>

        {/* Slide-Up Editorial Action Bar on Hover */}
        <div className="pt-2.5 border-t border-white/15 flex items-center justify-between gap-2 transition-all duration-300 transform opacity-90 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0">
          <div className="flex items-center gap-2">
            {!isSilentOrExtinct && (
              <button
                type="button"
                onClick={handleAudioPillClick}
                disabled={isResolvingAudio}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 backdrop-blur-md transition-all ${
                  isCurrentAudioPlaying
                    ? 'bg-emerald-500 text-[#070A09] font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-[#070A09]/75 text-emerald-300 hover:text-white border border-white/15 hover:bg-[#070A09]'
                }`}
                title={isCurrentAudioPlaying ? 'Pause Call' : `Listen to ${identity.commonName} Call`}
                aria-label="Toggle Animal Vocalization Preview"
              >
                {isResolvingAudio ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                ) : (
                  <AudioWaveformIcon
                    isPlaying={isCurrentAudioPlaying}
                    className="w-3.5 h-3.5"
                    barClassName={isCurrentAudioPlaying ? 'bg-[#070A09]' : 'bg-emerald-400'}
                  />
                )}
                <span>
                  {isCurrentAudioPlaying ? 'Pause' : 'Call'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(animal);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors border ${
                isCompared
                  ? 'bg-emerald-500 text-[#070A09] font-semibold border-emerald-400'
                  : 'bg-[#070A09]/75 text-slate-300 hover:text-white border-white/15'
              }`}
            >
              {isCompared ? '✓ Compared' : '+ Compare'}
            </button>
          </div>

          <div className="flex items-center gap-1 text-[#D4A359] font-serif text-xs font-semibold group-hover:translate-x-1 transition-transform">
            <span>Open Monograph</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </article>
  );
}
