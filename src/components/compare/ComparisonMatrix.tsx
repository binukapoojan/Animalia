import React, { useState, useEffect } from 'react';
import { X, Scale, Compass, Volume2, VolumeX, Play, Pause, Music, Sparkles } from 'lucide-react';
import { AnimalRecord, TaxonAudioItem } from '../../types/taxonomy';
import { IucnBadge } from '../common/IucnBadge';
import { SmartTaxonImage } from '../common/SmartTaxonImage';
import { AudioWaveformIcon } from '../common/AudioWaveformIcon';
import { globalAudioBus, AudioPlaybackState } from '../../services/audioCoordinator';
import { resolveTaxonBioacoustics, BioacousticResolution } from '../../services/bioacousticService';

interface ComparisonMatrixProps {
  comparedAnimals: AnimalRecord[];
  onRemoveAnimal: (animal: AnimalRecord) => void;
  onSetPreset: (ids: string[]) => void;
  onSelectAnimal: (animal: AnimalRecord) => void;
  onNavigateToExplore: () => void;
}

export function ComparisonMatrix({
  comparedAnimals,
  onRemoveAnimal,
  onSetPreset,
  onSelectAnimal,
  onNavigateToExplore
}: ComparisonMatrixProps) {
  const [audioResolutions, setAudioResolutions] = useState<Record<string, BioacousticResolution>>({});
  const [audioState, setAudioState] = useState<AudioPlaybackState>(globalAudioBus.getState());

  useEffect(() => {
    const unsubscribe = globalAudioBus.subscribe(setAudioState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    let isMounted = true;
    for (const animal of comparedAnimals) {
      if (!audioResolutions[animal.id]) {
        resolveTaxonBioacoustics(animal).then(res => {
          if (isMounted) {
            setAudioResolutions(prev => ({ ...prev, [animal.id]: res }));
          }
        });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [comparedAnimals]);

  const vocalAnimals = comparedAnimals.filter(a => !!audioResolutions[a.id]?.primaryAudio);
  const isDuetActive = audioState.isPlaying && audioState.isDuet;

  const handleToggleDuet = () => {
    if (isDuetActive) {
      globalAudioBus.pause();
    } else if (vocalAnimals.length >= 2) {
      const trackA = audioResolutions[vocalAnimals[0].id]?.primaryAudio;
      const trackB = audioResolutions[vocalAnimals[1].id]?.primaryAudio;
      if (trackA && trackB) {
        globalAudioBus.playDuet(trackA, trackB);
      }
    }
  };

  const handleToggleTrack = (track: TaxonAudioItem) => {
    globalAudioBus.toggle(track);
  };

  return (
    <section role="region" aria-label="Multi-Species Comparison Matrix" className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold">Multi-Species Comparison Matrix</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Comparing {comparedAnimals.length} of 4 maximum slots across taxonomy, morphology, ecology, and IUCN conservation status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              onSetPreset([
                'demo-panthera-uncia',
                'demo-thylacinus-cynocephalus',
                'demo-harpy-eagle'
              ])
            }
            className="px-3 py-1.5 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-700 hover:border-amber-500 transition-colors"
          >
            Preset: Apex Predators
          </button>
          <button
            onClick={() =>
              onSetPreset([
                'demo-latimeria-chalumnae',
                'demo-turritopsis-dohrnii',
                'demo-milnesium-tardigradum'
              ])
            }
            className="px-3 py-1.5 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-700 hover:border-amber-500 transition-colors"
          >
            Preset: Extreme Survival & Relicts
          </button>
        </div>
      </div>

      {/* Acoustic Bioacoustics & Resonant Duet Studio */}
      {comparedAnimals.length >= 2 && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 text-white rounded-3xl p-6 border border-amber-500/30 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Bioacoustic Resonance Studio
                </span>
                <span className="text-xs text-slate-400">
                  {vocalAnimals.length} of {comparedAnimals.length} species with vocal recordings
                </span>
              </div>
              <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-amber-400" />
                Acoustic Ecology & Interspecies Vocalization Duet
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl">
                Compare individual calls or synthesize a simultaneous multi-species acoustic duet to examine resonance, pitch overlap, and ecological niches side-by-side.
              </p>
            </div>

            {vocalAnimals.length >= 2 && (
              <div className="flex-shrink-0">
                <button
                  onClick={handleToggleDuet}
                  className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold tracking-wide transition-all shadow-md active:scale-95 ${
                    isDuetActive
                      ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 ring-2 ring-amber-400/50'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500 ring-1 ring-emerald-400/40'
                  }`}
                  title="Simultaneously play the first two vocal species to compare resonance"
                >
                  {isDuetActive ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Stop Duet ({vocalAnimals[0].identity.commonName} + {vocalAnimals[1].identity.commonName})</span>
                      <AudioWaveformIcon isPlaying={true} className="w-4 h-4 text-slate-950" />
                    </>
                  ) : (
                    <>
                      <Music className="w-4 h-4" />
                      <span>Play Vocalization Duet ({vocalAnimals[0].identity.commonName} + {vocalAnimals[1].identity.commonName})</span>
                      <AudioWaveformIcon isPlaying={false} className="w-4 h-4 text-emerald-200" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Quick-listen tracks strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-white/10">
            {comparedAnimals.map((animal) => {
              const res = audioResolutions[animal.id];
              const track = res?.primaryAudio;
              const isPlayingThis = audioState.isPlaying && audioState.activeTrack?.audioUrl === track?.audioUrl;
              const isDuetParticipant = isDuetActive && (
                audioState.activeTrack?.audioUrl === track?.audioUrl || 
                audioState.duetTrack?.audioUrl === track?.audioUrl
              );

              return (
                <div
                  key={animal.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                    isPlayingThis || isDuetParticipant
                      ? 'bg-amber-500/15 border-amber-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate text-white">
                        {animal.identity.commonName}
                      </div>
                      <div className="text-[10px] italic text-slate-400 truncate">
                        {animal.identity.scientificName}
                      </div>
                    </div>
                    {track ? (
                      <button
                        onClick={() => handleToggleTrack(track)}
                        className={`p-1.5 rounded-xl transition-all ${
                          isPlayingThis
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-white/10 text-amber-300 hover:bg-amber-500 hover:text-slate-950'
                        }`}
                        title={isPlayingThis ? 'Pause vocalization' : 'Play vocalization'}
                      >
                        {isPlayingThis ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      </button>
                    ) : (
                      <span className="p-1.5 rounded-xl bg-white/5 text-slate-500">
                        <VolumeX className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-300">
                    {!res ? (
                      <span className="text-slate-400 animate-pulse">Loading bioacoustics...</span>
                    ) : track ? (
                      <div className="space-y-0.5">
                        <div className="text-amber-200/90 truncate font-mono text-[9px]">
                          {track.title || 'Field Vocalization'}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[9px]">
                          <span className="uppercase">{track.format || 'AUDIO'}</span>
                          <span>·</span>
                          <span className="truncate">{track.licenseCode || 'CC'}</span>
                        </div>
                      </div>
                    ) : res.status === 'NON_VOCAL_ORGANISM' ? (
                      <span className="text-slate-400 font-mono text-[9px]">Non-vocal clade (No acoustic apparatus)</span>
                    ) : res.status === 'EXTINCT_PALEO_ACOUSTIC' ? (
                      <span className="text-amber-300/80 font-mono text-[9px]">Extinct fossil (Acoustics unrecorded)</span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[9px]">No recording yet documented</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      {comparedAnimals.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
          <Scale className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-xl font-serif font-bold">No species selected for comparison</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Select up to 4 species from the discovery feed to compare biological measurements, taxonomic lineages, and conservation statuses side-by-side.
          </p>
          <button
            onClick={onNavigateToExplore}
            className="px-5 py-2.5 bg-amber-500 text-slate-950 font-semibold rounded-xl text-sm shadow hover:bg-amber-400 transition-colors"
          >
            Explore Animals
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {comparedAnimals.map((a) => (
            <div
              key={a.id}
              className="bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Image */}
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900">
                  <SmartTaxonImage
                    scientificName={a.identity.scientificName}
                    commonName={a.identity.commonName}
                    inatTaxonId={a.identity.externalIds?.inatTaxonId}
                    primaryUrl={a.media?.url}
                    thumbnailUrl={a.media?.thumbnailUrl}
                    categoryGroup={a.identity.categoryGroup}
                    alt={a.identity.commonName}
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full"
                  />
                  <button
                    onClick={() => onRemoveAnimal(a)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                    title="Remove from comparison"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Identity */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                      {a.identity.categoryGroup}
                    </span>
                    <IucnBadge status={a.biology.conservation?.iucnStatus} />
                  </div>
                  <h3 className="font-serif font-bold text-lg mt-1">{a.identity.commonName}</h3>
                  <p className="text-xs italic text-slate-500 dark:text-slate-400">
                    {a.identity.scientificName}
                  </p>
                </div>

                {/* Comparison Details */}
                <div className="text-xs space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="font-mono text-[10px] uppercase text-slate-400 block">
                      Lineage (Class › Order › Family)
                    </span>
                    <span className="font-medium">
                      {a.identity.lineage?.class || '—'} › {a.identity.lineage?.order || '—'} ›{' '}
                      {a.identity.lineage?.family || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase text-slate-400 block">
                      Body Size & Mass
                    </span>
                    <span>
                      {a.biology.measurements?.bodyLength || 'Not yet documented'} ·{' '}
                      {a.biology.measurements?.mass || 'Mass undocumented'}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase text-slate-400 block">
                      Habitat & Diet
                    </span>
                    <span>
                      {a.biology.ecology?.habitat || 'Not yet documented'} (
                      {a.biology.ecology?.diet || 'Diet undocumented'})
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase text-slate-400 block">
                      Key Diagnostic Trait
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {a.biology.discovery?.distinguishingTraits?.[0] || a.biology.summary?.text}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase text-slate-400 block">
                      Bioacoustic Vocalization
                    </span>
                    {(() => {
                      const res = audioResolutions[a.id];
                      const track = res?.primaryAudio;
                      const isPlayingThis = audioState.isPlaying && audioState.activeTrack?.audioUrl === track?.audioUrl;

                      if (!res) {
                        return <span className="text-slate-400 text-[11px] animate-pulse">Checking records...</span>;
                      }
                      if (track) {
                        return (
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => handleToggleTrack(track)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all ${
                                isPlayingThis
                                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                              }`}
                            >
                              {isPlayingThis ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                              <span>{isPlayingThis ? 'Pause' : 'Listen'}</span>
                              <AudioWaveformIcon isPlaying={isPlayingThis} className="w-3 h-3" />
                            </button>
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={track.title}>
                              {track.title}
                            </span>
                          </div>
                        );
                      }
                      if (res.status === 'NON_VOCAL_ORGANISM') {
                        return <span className="text-slate-400 text-[11px] italic">Non-vocal organism</span>;
                      }
                      if (res.status === 'EXTINCT_PALEO_ACOUSTIC') {
                        return <span className="text-amber-600/70 dark:text-amber-400/70 text-[11px] italic">Extinct fossil record</span>;
                      }
                      return <span className="text-slate-400 text-[11px] italic">Undocumented recording</span>;
                    })()}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectAnimal(a)}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-xs font-medium transition-colors"
              >
                Open Full Specimen Profile
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
