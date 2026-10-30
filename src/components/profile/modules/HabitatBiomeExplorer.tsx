import React, { useState, useMemo } from 'react';
import {
  Compass,
  Mountain,
  Sun,
  Moon,
  Clock,
  Layers,
  Utensils,
  Eye,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { AnimalRecord } from '../../../types/taxonomy';
import { SmartTaxonImage } from '../../common/SmartTaxonImage';

export interface HabitatBiomeExplorerProps {
  animal: AnimalRecord;
  allAnimals?: AnimalRecord[];
  onSelectAnimal?: (animal: AnimalRecord) => void;
}

type EcologicalTab = 'ELEVATION' | 'CIRCADIAN' | 'TROPHIC';

export function HabitatBiomeExplorer({ animal, allAnimals = [], onSelectAnimal }: HabitatBiomeExplorerProps) {
  const [activeTab, setActiveTab] = useState<EcologicalTab>('ELEVATION');
  const [scrubberHour, setScrubberHour] = useState<number>(14); // 2:00 PM default
  const [selectedBiomeDrawer, setSelectedBiomeDrawer] = useState<string | null>(null);

  const { biology, identity } = animal;
  const habitatText = biology.ecology?.habitat || 'Undocumented habitat profile';
  const dietText = biology.ecology?.diet || 'Undocumented dietary regime';
  const activityPattern = (biology.ecology?.activityPattern || 'Unknown').trim();
  const biomeTags = biology.ecology?.biomeTags || [];

  // Parse altitude/depth ranges from habitat text
  const altitudeZone = useMemo(() => {
    const text = (habitatText + ' ' + (identity.categoryGroup || '')).toLowerCase();
    if (text.includes('abyssal') || text.includes('hydrothermal') || text.includes('deep sea') || text.includes('hadal')) {
      return { label: 'Abyssal Zone (-4,000m to -6,000m)', range: [-4000, -6000], isMarine: true };
    }
    if (text.includes('mesopelagic') || text.includes('twilight') || text.includes('bathypelagic')) {
      return { label: 'Twilight Zone (-200m to -1,000m)', range: [-200, -1000], isMarine: true };
    }
    if (text.includes('coral') || text.includes('marine') || text.includes('ocean') || text.includes('pelagic') || text.includes('coastal') || identity.categoryGroup === 'Fish') {
      return { label: 'Epipelagic / Coastal (0m to -200m)', range: [0, -200], isMarine: true };
    }
    if (text.includes('alpine') || text.includes('mountain') || text.includes('himalaya') || text.includes('andes') || text.includes('3,000') || text.includes('4,000') || text.includes('5,000')) {
      return { label: 'High Alpine Summit (+3,000m to +5,500m)', range: [3000, 5500], isMarine: false };
    }
    if (text.includes('montane') || text.includes('highland') || text.includes('plateau') || text.includes('subalpine')) {
      return { label: 'Montane Highland (+1,200m to +3,000m)', range: [1200, 3000], isMarine: false };
    }
    return { label: 'Lowland Forest & Biomes (0m to +1,000m)', range: [0, 1000], isMarine: false };
  }, [habitatText, identity.categoryGroup]);

  // Determine Circadian Status at Scrubber Hour
  const circadianInfo = useMemo(() => {
    const pattern = activityPattern.toLowerCase();
    const isDiurnal = pattern.includes('diurnal');
    const isNocturnal = pattern.includes('nocturnal');
    const isCrepuscular = pattern.includes('crepuscular');
    const isCathemeral = pattern.includes('cathemeral');

    const isDay = scrubberHour >= 6 && scrubberHour <= 18;
    const isDawnOrDusk = (scrubberHour >= 5 && scrubberHour <= 7) || (scrubberHour >= 17 && scrubberHour <= 19);

    let status = 'Resting / Inactive';
    let detail = 'Conserving metabolic energy during non-primary activity phase.';

    if (isCathemeral) {
      status = 'Intermittently Active';
      detail = 'Sporadic feeding and locomotion bursts throughout 24-hour cycle.';
    } else if (isCrepuscular && isDawnOrDusk) {
      status = 'Peak Crepuscular Activity';
      detail = 'Optimally foraging or hunting under low-angle ambient twilight.';
    } else if (isNocturnal && !isDay) {
      status = 'Peak Nocturnal Hunting & Foraging';
      detail = 'Active under cover of darkness with specialized scotopic sensory adaptations.';
    } else if (isDiurnal && isDay) {
      status = 'Peak Diurnal Activity';
      detail = 'High-visibility feeding, territorial patrol, and social interactions.';
    }

    return { pattern: activityPattern, isDiurnal, isNocturnal, isCrepuscular, isCathemeral, status, detail, isDay };
  }, [activityPattern, scrubberHour]);

  // Determine Trophic Tier
  const trophicTier = useMemo(() => {
    const text = (dietText + ' ' + biomeTags.join(' ')).toLowerCase();
    if (text.includes('apex') || text.includes('killer whale') || text.includes('tiger') || text.includes('lion') || text.includes('shark')) {
      return {
        level: 'Apex Predator (Quaternary Consumer)',
        description: 'Occupies top trophic position with no natural wild predators.',
        tier: 4,
        color: 'text-rose-500'
      };
    }
    if (text.includes('carnivore') || text.includes('predator') || text.includes('fish') || text.includes('squid') || text.includes('insectivore')) {
      return {
        level: 'Secondary Consumer / Mesopredator',
        description: 'Consumes primary herbivores and smaller intermediate fauna.',
        tier: 3,
        color: 'text-amber-500'
      };
    }
    if (text.includes('herbivore') || text.includes('graz') || text.includes('leaves') || text.includes('nectar') || text.includes('folivore')) {
      return {
        level: 'Primary Consumer (Herbivore)',
        description: 'Directly converts primary producer biomass into animal protein.',
        tier: 2,
        color: 'text-emerald-500'
      };
    }
    if (text.includes('filter') || text.includes('plankton') || text.includes('detrit') || text.includes('sponge')) {
      return {
        level: 'Filter Feeder / Detritivore',
        description: 'Extracts microscopic nutrients and recycles benthic organic matter.',
        tier: 1,
        color: 'text-sky-500'
      };
    }
    return {
      level: 'Heterotrophic Consumer',
      description: 'Documented wild diet detailed below.',
      tier: 2,
      color: 'text-amber-500'
    };
  }, [dietText, biomeTags]);

  // Find other animals in the selected biome drawer
  const siblingBiomeTaxa = useMemo(() => {
    if (!selectedBiomeDrawer) return [];
    return allAnimals.filter(
      (a) =>
        a.id !== animal.id &&
        (a.biology?.ecology?.biomeTags?.includes(selectedBiomeDrawer) ||
          a.biology?.ecology?.habitat?.toLowerCase().includes(selectedBiomeDrawer.toLowerCase()))
    );
  }, [allAnimals, animal.id, selectedBiomeDrawer]);

  return (
    <div className="bg-[#EBE6DC]/35 dark:bg-[#0D1210]/60 border border-[#141816]/10 dark:border-white/10 rounded-xl p-6 sm:p-8 space-y-8 transition-colors">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#141816]/10 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#2E6F54] dark:text-emerald-400 font-bold tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Ecological Envelope & Biome Explorer</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-[#F4F1EA] mt-1">
            Habitat & Niches
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Elevation strata, 24-hour circadian clock, and food web trophic positioning.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('ELEVATION')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'ELEVATION'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Elevation / Depth</span>
          </button>
          <button
            onClick={() => setActiveTab('CIRCADIAN')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'CIRCADIAN'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>24h Clock</span>
          </button>
          <button
            onClick={() => setActiveTab('TROPHIC')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'TROPHIC'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Trophic Role</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: ELEVATION & DEPTH PROFILE */}
      {activeTab === 'ELEVATION' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Visual Altitude & Ocean Depth Gauge */}
            <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-6 relative overflow-hidden space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Vertical Biosphere Strata
              </span>

              {/* Strata Stack */}
              <div className="space-y-2 text-xs font-mono">
                {/* Alpine Summit */}
                <div
                  className={`p-3 rounded-xl border transition-all ${
                    altitudeZone.label.includes('High Alpine')
                      ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold ring-2 ring-emerald-500/40'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Mountain className="w-4 h-4 text-sky-400" />
                      Alpine & Cryosphere (+3,000m to +6,000m)
                    </span>
                    {altitudeZone.label.includes('High Alpine') && (
                      <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-sans">
                        Documented Range
                      </span>
                    )}
                  </div>
                </div>

                {/* Montane & High Forests */}
                <div
                  className={`p-3 rounded-xl border transition-all ${
                    altitudeZone.label.includes('Montane Highland')
                      ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold ring-2 ring-emerald-500/40'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Montane & Temperate Woodlands (+1,000m to +3,000m)</span>
                    {altitudeZone.label.includes('Montane Highland') && (
                      <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-sans">
                        Documented Range
                      </span>
                    )}
                  </div>
                </div>

                {/* Lowland Terrestrial */}
                <div
                  className={`p-3 rounded-xl border transition-all ${
                    altitudeZone.label.includes('Lowland Forest')
                      ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold ring-2 ring-emerald-500/40'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Lowland Canopies, Grasslands & Coasts (0m to +1,000m)</span>
                    {altitudeZone.label.includes('Lowland Forest') && (
                      <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-sans">
                        Documented Range
                      </span>
                    )}
                  </div>
                </div>

                {/* Sea Level Divider */}
                <div className="py-0.5 text-center text-[10px] font-mono text-cyan-400/80 tracking-widest border-y border-cyan-500/30">
                  ─── MEAN SEA LEVEL (0m) ───
                </div>

                {/* Epipelagic Marine */}
                <div
                  className={`p-3 rounded-xl border transition-all ${
                    altitudeZone.label.includes('Epipelagic')
                      ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold ring-2 ring-cyan-500/40'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Sunlit Marine Epipelagic (0m to -200m)</span>
                    {altitudeZone.label.includes('Epipelagic') && (
                      <span className="text-[10px] bg-cyan-400 text-slate-950 px-2 py-0.5 rounded font-sans">
                        Documented Range
                      </span>
                    )}
                  </div>
                </div>

                {/* Mesopelagic / Abyssal */}
                <div
                  className={`p-3 rounded-xl border transition-all ${
                    altitudeZone.label.includes('Abyssal') || altitudeZone.label.includes('Twilight')
                      ? 'bg-indigo-500/20 border-indigo-500 text-white font-bold ring-2 ring-indigo-500/40'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Twilight & Abyssal Depths (-200m to -6,000m)</span>
                    {(altitudeZone.label.includes('Abyssal') || altitudeZone.label.includes('Twilight')) && (
                      <span className="text-[10px] bg-indigo-400 text-slate-950 px-2 py-0.5 rounded font-sans">
                        Documented Range
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Habitat Summary & Biome Tags */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0E1513] border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400">Documented Habitat Range</span>
                <p className="text-sm font-serif italic text-slate-800 dark:text-slate-200 leading-relaxed">
                  "{habitatText}"
                </p>
                <div className="pt-2">
                  <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    Zone: {altitudeZone.label}
                  </span>
                </div>
              </div>

              {/* Clickable Biome Tags */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  Associated Biome Tags (Click to surf clade):
                </span>
                <div className="flex flex-wrap gap-2">
                  {biomeTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedBiomeDrawer(selectedBiomeDrawer === tag ? null : tag)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                        selectedBiomeDrawer === tag
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: 24-HOUR CIRCADIAN CLOCK */}
      {activeTab === 'CIRCADIAN' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-6 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
                  Chronobiological Dial
                </span>
                <h4 className="text-lg font-serif font-bold text-white">
                  Activity Rhythm: {circadianInfo.pattern}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-3 py-1 rounded-xl bg-slate-800 text-emerald-400 font-bold border border-slate-700">
                  Current Scrubber: {scrubberHour.toString().padStart(2, '0')}:00 hrs
                </span>
              </div>
            </div>

            {/* 24-Hour Interactive Timeline Bar */}
            <div className="space-y-3">
              <div className="relative h-10 rounded-xl overflow-hidden flex border border-slate-700">
                {/* Night 00-06 */}
                <div className="w-[25%] bg-indigo-950/80 flex items-center justify-center text-[10px] font-mono text-indigo-300 border-r border-slate-700">
                  <Moon className="w-3 h-3 mr-1" /> Night (00:00–06:00)
                </div>
                {/* Day 06-18 */}
                <div className="w-[50%] bg-amber-500/20 flex items-center justify-center text-[10px] font-mono text-amber-300 border-r border-slate-700">
                  <Sun className="w-3 h-3 mr-1" /> Day (06:00–18:00)
                </div>
                {/* Night 18-24 */}
                <div className="w-[25%] bg-indigo-950/80 flex items-center justify-center text-[10px] font-mono text-indigo-300">
                  <Moon className="w-3 h-3 mr-1" /> Night (18:00–24:00)
                </div>

                {/* Scrubber Pin */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg transition-all"
                  style={{ left: `${(scrubberHour / 24) * 100}%` }}
                />
              </div>

              {/* Slider Input */}
              <input
                type="range"
                min="0"
                max="23"
                value={scrubberHour}
                onChange={(e) => setScrubberHour(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>00:00 (Midnight)</span>
                <span>06:00 (Dawn)</span>
                <span>12:00 (Solar Noon)</span>
                <span>18:00 (Dusk)</span>
                <span>23:00</span>
              </div>
            </div>

            {/* Simulated Hourly Behavior Card */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-3">
              {circadianInfo.isDay ? (
                <Sun className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 text-xs">
                <div className="font-bold text-white flex items-center gap-2">
                  <span>At {scrubberHour.toString().padStart(2, '0')}:00 Hours:</span>
                  <span className="text-amber-400 font-mono">[{circadianInfo.status}]</span>
                </div>
                <p className="text-slate-300">{circadianInfo.detail}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: TROPHIC ROLE & FOOD WEB POSITION */}
      {activeTab === 'TROPHIC' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0E1513] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-mono uppercase text-slate-400">Trophic Pyramid Tier</span>
              </div>
              <span className={`text-xs font-mono font-bold ${trophicTier.color}`}>
                {trophicTier.level}
              </span>
            </div>

            {/* Pyramid Steps */}
            <div className="space-y-2 pt-2">
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  trophicTier.tier === 4
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                    : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400 opacity-50'
                }`}
              >
                <span>Apex Predators (Trophic Level 4)</span>
                <span>Top of marine/terrestrial food web</span>
              </div>

              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  trophicTier.tier === 3
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400 opacity-50'
                }`}
              >
                <span>Secondary Consumers / Carnivores (Trophic Level 3)</span>
                <span>Intermediate predators</span>
              </div>

              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  trophicTier.tier === 2
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400 opacity-50'
                }`}
              >
                <span>Primary Consumers / Herbivores (Trophic Level 2)</span>
                <span>Plant, seed, and algae consumers</span>
              </div>

              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  trophicTier.tier === 1
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                    : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400 opacity-50'
                }`}
              >
                <span>Filter Feeders & Detritivores (Trophic Level 1)</span>
                <span>Benthic recyclers & plankton strainers</span>
              </div>
            </div>

            {/* Documented Diet Description */}
            <div className="pt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              <span className="font-bold text-slate-900 dark:text-white">Documented Diet: </span>
              {dietText}
            </div>
          </div>
        </div>
      )}

      {/* Sibling Biome Species Drawer Modal (When user clicks a Biome Tag) */}
      {selectedBiomeDrawer && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-mono uppercase font-bold text-amber-900 dark:text-amber-200">
                Species Sharing Biome #{selectedBiomeDrawer} ({siblingBiomeTaxa.length})
              </h4>
            </div>
            <button
              onClick={() => setSelectedBiomeDrawer(null)}
              className="text-xs font-mono text-amber-700 dark:text-amber-400 hover:underline"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {siblingBiomeTaxa.slice(0, 6).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onSelectAnimal?.(t);
                  setSelectedBiomeDrawer(null);
                }}
                className="p-2.5 rounded-xl bg-white dark:bg-[#161F1D] border border-amber-500/20 hover:border-amber-500 flex items-center gap-2.5 text-left transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                  <SmartTaxonImage
                    scientificName={t.identity.scientificName}
                    commonName={t.identity.commonName}
                    primaryUrl={t.media?.url}
                    thumbnailUrl={t.media?.thumbnailUrl}
                    categoryGroup={t.identity.categoryGroup}
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate text-slate-900 dark:text-slate-100 group-hover:text-amber-500">
                    {t.identity.commonName}
                  </div>
                  <div className="text-[10px] font-serif italic text-slate-400 truncate">
                    {t.identity.scientificName}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
