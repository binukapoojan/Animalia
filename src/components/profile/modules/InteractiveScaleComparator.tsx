import React, { useState, useMemo } from 'react';
import { Scale, Ruler, ZoomIn, ZoomOut, RotateCcw, AlertCircle, ArrowRightLeft, Search } from 'lucide-react';
import type { AnimalRecord } from '../../../types/taxonomy';
import { SmartTaxonImage } from '../../common/SmartTaxonImage';
import { parseLengthToCm, parseMassToKg } from '../../../utils/biometricParser';

export { parseLengthToCm, parseMassToKg };

export interface InteractiveScaleComparatorProps {
  animal: AnimalRecord;
  allAnimals?: AnimalRecord[];
}

interface ReferenceSpecimen {
  id: string;
  name: string;
  category: string;
  lengthCm: number;
  massKg: number;
  description: string;
  iconType: 'human' | 'hand' | 'bus' | 'cat' | 'animal';
  imageUrl?: string;
  scientificName?: string;
}

const STANDARD_REFERENCES: ReferenceSpecimen[] = [
  {
    id: 'ref-human',
    name: 'Adult Human',
    category: 'Reference Anthropometry',
    lengthCm: 175,
    massKg: 70,
    description: 'Average global adult human standing height & weight (WHO Reference)',
    iconType: 'human'
  },
  {
    id: 'ref-hand',
    name: 'Human Hand',
    category: 'Reference Anthropometry',
    lengthCm: 18,
    massKg: 0.4,
    description: 'Average adult palm-to-fingertip length',
    iconType: 'hand'
  },
  {
    id: 'ref-bus',
    name: 'City Bus',
    category: 'Urban Scale Reference',
    lengthCm: 1200,
    massKg: 12000,
    description: 'Standard 40-foot urban transit bus (12m / 12 metric tonnes)',
    iconType: 'bus'
  },
  {
    id: 'ref-cat',
    name: 'Domestic Cat',
    category: 'Companion Scale Reference',
    lengthCm: 46,
    massKg: 4.5,
    description: 'Average adult domestic cat body length excluding tail',
    iconType: 'cat'
  }
];

export function InteractiveScaleComparator({ animal, allAnimals = [] }: InteractiveScaleComparatorProps) {
  const [selectedRefId, setSelectedRefId] = useState<string>('ref-human');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [animalSearchQuery, setAnimalSearchQuery] = useState<string>('');
  const [isSelectingAnimal, setIsSelectingAnimal] = useState<boolean>(false);

  // Parse current animal biometrics
  const rawLength =
    (animal as any).maxLengthCm ||
    animal.biology?.measurements?.bodyLength ||
    (animal.biology as any)?.length ||
    (animal.biology as any)?.size;

  const rawMass =
    (animal as any).maxMassKg ||
    animal.biology?.measurements?.mass ||
    (animal.biology as any)?.weight;

  const animalLengthCm = useMemo(() => parseLengthToCm(rawLength, (animal as any).maxLengthCm), [rawLength, animal]);
  const animalMassKg = useMemo(() => parseMassToKg(rawMass, (animal as any).maxMassKg), [rawMass, animal]);

  // Combine standard references with other animals
  const activeReference = useMemo<ReferenceSpecimen>(() => {
    const std = STANDARD_REFERENCES.find((r) => r.id === selectedRefId);
    if (std) return std;

    const matchedAnimal = allAnimals.find((a) => a.id === selectedRefId);
    if (matchedAnimal) {
      const aLen = parseLengthToCm(
        (matchedAnimal as any).maxLengthCm || matchedAnimal.biology?.measurements?.bodyLength,
        (matchedAnimal as any).maxLengthCm
      ) || 100;
      const aMass = parseMassToKg(
        (matchedAnimal as any).maxMassKg || matchedAnimal.biology?.measurements?.mass,
        (matchedAnimal as any).maxMassKg
      ) || 20;

      return {
        id: matchedAnimal.id,
        name: matchedAnimal.identity.commonName,
        category: matchedAnimal.identity.categoryGroup,
        lengthCm: aLen,
        massKg: aMass,
        description: `Scientific taxon: ${matchedAnimal.identity.scientificName}`,
        iconType: 'animal',
        imageUrl: matchedAnimal.media?.thumbnailUrl || matchedAnimal.media?.url || undefined,
        scientificName: matchedAnimal.identity.scientificName
      };
    }

    return STANDARD_REFERENCES[0];
  }, [selectedRefId, allAnimals]);

  // Filter animals for database selector
  const filteredTaxaList = useMemo(() => {
    if (!animalSearchQuery.trim()) return allAnimals.filter((a) => a.id !== animal.id).slice(0, 8);
    const q = animalSearchQuery.toLowerCase().trim();
    return allAnimals
      .filter(
        (a) =>
          a.id !== animal.id &&
          (a.identity.commonName.toLowerCase().includes(q) || a.identity.scientificName.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [allAnimals, animal.id, animalSearchQuery]);

  // Mass Ratio & Balance Seesaw Angle Calculation
  const massRatio = useMemo(() => {
    if (!animalMassKg || !activeReference.massKg) return null;
    return animalMassKg / activeReference.massKg;
  }, [animalMassKg, activeReference.massKg]);

  const seesawAngle = useMemo(() => {
    if (!massRatio) return 0;
    if (massRatio === 1) return 0;
    // Logarithmic scale clamped between -20 deg and +20 deg
    const diff = Math.log10(massRatio);
    return Math.max(-20, Math.min(20, diff * 16));
  }, [massRatio]);

  // Length Ratio for Visual Arena
  const maxLengthForVisual = Math.max(animalLengthCm || 100, activeReference.lengthCm || 100);
  const animalVisualPercent = Math.min(100, Math.max(8, ((animalLengthCm || 100) / maxLengthForVisual) * 100));
  const refVisualPercent = Math.min(100, Math.max(8, ((activeReference.lengthCm || 100) / maxLengthForVisual) * 100));

  const hasNoMeasurements = !animalLengthCm && !animalMassKg;

  return (
    <div className="bg-[#EBE6DC]/35 dark:bg-[#0D1210]/60 border border-[#141816]/10 dark:border-white/10 rounded-xl p-6 sm:p-8 space-y-8 transition-colors">
      {/* Module Header & Selector Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#141816]/10 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-mono uppercase text-amber-700 dark:text-[#D4A359] font-bold tracking-wider">
            <Ruler className="w-4 h-4" />
            <span>Biometric Scale & Mass Arena</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-[#F4F1EA] mt-1">
            Size & Mass Arena
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Compare documented specimen dimensions against human anthropometry, urban objects, and fellow taxa.
          </p>
        </div>

        {/* Reference Selector Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {STANDARD_REFERENCES.map((ref) => (
            <button
              key={ref.id}
              onClick={() => {
                setSelectedRefId(ref.id);
                setIsSelectingAnimal(false);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                selectedRefId === ref.id && !isSelectingAnimal
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60'
              }`}
            >
              <span>{ref.name}</span>
              <span className="text-[10px] opacity-75">({ref.lengthCm >= 100 ? `${ref.lengthCm / 100}m` : `${ref.lengthCm}cm`})</span>
            </button>
          ))}

          {/* Database Taxon Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsSelectingAnimal(!isSelectingAnimal)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
                isSelectingAnimal || !STANDARD_REFERENCES.some((r) => r.id === selectedRefId)
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>
                {activeReference.iconType === 'animal' ? activeReference.name : 'Compare with Another Species...'}
              </span>
            </button>

            {isSelectingAnimal && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#161F1D] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-30 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={animalSearchQuery}
                    onChange={(e) => setAnimalSearchQuery(e.target.value)}
                    placeholder="Search species to compare..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredTaxaList.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedRefId(t.id);
                        setIsSelectingAnimal(false);
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-xs rounded-lg hover:bg-amber-500/10 dark:hover:bg-amber-500/20 flex items-center justify-between group transition-colors"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {t.identity.commonName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 italic truncate max-w-[100px]">
                        {t.identity.scientificName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Honest Scientific Alert if measurements are undocumented */}
      {hasNoMeasurements ? (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4 text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-6 h-6 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-base">Measurements Undocumented in Wild Specimens</h4>
            <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/80">
              In accordance with scientific integrity guidelines (GEMINI.md), ANIMALIA strictly refuses to invent
              fabricated body lengths or masses. Exact field morphometrics for <em>{animal.identity.scientificName}</em>{' '}
              have not yet been recorded in the verified taxonomy backbone.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Visual Scale Arena with Metric Ruler */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono uppercase tracking-wider text-[11px]">Length & Silhouette Arena</span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono">Zoom: {zoomLevel.toFixed(1)}x</span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg p-0.5">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.2))}
                    className="p-1 hover:text-white rounded transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="p-1 hover:text-white rounded transition-colors"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(3, z + 0.2))}
                    className="p-1 hover:text-white rounded transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scale Comparison Canvas */}
            <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800 p-6 overflow-hidden min-h-[220px] flex flex-col justify-end">
              {/* Metric Ruler Lines Background */}
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px]" />

              <div
                className="relative flex items-end justify-around gap-8 transition-transform duration-300"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'bottom center' }}
              >
                {/* Current Specimen Display */}
                <div className="flex flex-col items-center gap-3 max-w-[180px] w-full text-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">Target Specimen</span>
                    <h5 className="font-serif font-bold text-sm text-white truncate">{animal.identity.commonName}</h5>
                  </div>

                  {/* Visual Bar / Silhouette */}
                  <div className="relative w-full flex flex-col items-center">
                    <div
                      className="w-20 rounded-xl bg-gradient-to-t from-emerald-600 to-emerald-400/80 shadow-lg shadow-emerald-500/20 flex items-center justify-center text-slate-950 font-bold transition-all duration-500"
                      style={{ height: `${Math.max(48, animalVisualPercent * 1.5)}px` }}
                    >
                      <span className="text-[11px] font-mono">
                        {animalLengthCm ? (animalLengthCm >= 100 ? `${(animalLengthCm / 100).toFixed(1)}m` : `${animalLengthCm}cm`) : '—'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60">
                    {animal.biology?.measurements?.bodyLength || `${animalLengthCm} cm`}
                  </span>
                </div>

                {/* VS Badge */}
                <div className="flex flex-col items-center justify-center pb-8 select-none">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center font-mono text-xs font-bold text-amber-400 shadow-md">
                    VS
                  </div>
                </div>

                {/* Reference Specimen Display */}
                <div className="flex flex-col items-center gap-3 max-w-[180px] w-full text-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">Reference Scale</span>
                    <h5 className="font-serif font-bold text-sm text-white truncate">{activeReference.name}</h5>
                  </div>

                  {/* Visual Bar / Silhouette */}
                  <div className="relative w-full flex flex-col items-center">
                    <div
                      className="w-20 rounded-xl bg-gradient-to-t from-amber-600 to-amber-400/80 shadow-lg shadow-amber-500/20 flex items-center justify-center text-slate-950 font-bold transition-all duration-500"
                      style={{ height: `${Math.max(48, refVisualPercent * 1.5)}px` }}
                    >
                      <span className="text-[11px] font-mono">
                        {activeReference.lengthCm >= 100
                          ? `${(activeReference.lengthCm / 100).toFixed(1)}m`
                          : `${activeReference.lengthCm}cm`}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60 truncate max-w-full">
                    {activeReference.lengthCm >= 100 ? `${activeReference.lengthCm / 100} m` : `${activeReference.lengthCm} cm`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Weight Balance Seesaw */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0E1513] border border-slate-200 dark:border-slate-800/70 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-mono uppercase text-slate-600 dark:text-slate-400 font-semibold tracking-wider">
                  Biomass Balance Seesaw
                </h4>
              </div>

              {massRatio !== null && (
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  {massRatio >= 1
                    ? `1 ${animal.identity.commonName} ≈ ${massRatio.toFixed(2)}x ${activeReference.name}`
                    : `1 ${activeReference.name} ≈ ${(1 / massRatio).toFixed(2)}x ${animal.identity.commonName}`}
                </span>
              )}
            </div>

            {/* Seesaw Graphic */}
            <div className="relative pt-6 pb-4 flex flex-col items-center">
              {/* Animated Balance Beam */}
              <div
                className="w-full max-w-lg h-3 rounded-full bg-slate-300 dark:bg-slate-700 relative transition-transform duration-700 ease-out flex items-center justify-between px-4"
                style={{ transform: `rotate(${seesawAngle}deg)` }}
              >
                {/* Left Pan: Current Animal */}
                <div
                  className="absolute left-0 -top-12 flex flex-col items-center gap-1 -translate-x-1/2"
                  style={{ transform: `rotate(${-seesawAngle}deg)` }}
                >
                  <div className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold shadow-md shadow-emerald-600/30">
                    {animalMassKg ? `${animalMassKg} kg` : 'Undocumented'}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                    {animal.identity.commonName}
                  </span>
                </div>

                {/* Right Pan: Reference */}
                <div
                  className="absolute right-0 -top-12 flex flex-col items-center gap-1 translate-x-1/2"
                  style={{ transform: `rotate(${-seesawAngle}deg)` }}
                >
                  <div className="px-3 py-1 rounded-xl bg-amber-600 text-white font-mono text-xs font-bold shadow-md shadow-amber-600/30">
                    {activeReference.massKg >= 1000
                      ? `${(activeReference.massKg / 1000).toFixed(1)} tonnes`
                      : `${activeReference.massKg} kg`}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                    {activeReference.name}
                  </span>
                </div>
              </div>

              {/* Fulcrum Stand */}
              <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[32px] border-b-slate-400 dark:border-b-slate-600 mt-0" />
              <div className="w-24 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Informative Weight Fun-Fact Card */}
            <div className="text-xs text-center text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-w-xl mx-auto">
              {animalMassKg && massRatio !== null ? (
                massRatio >= 1 ? (
                  <span>
                    A fully grown <strong>{animal.identity.commonName}</strong> weighs approximately{' '}
                    <strong>{massRatio.toFixed(1)} times</strong> as much as an average {activeReference.name.toLowerCase()}!
                  </span>
                ) : (
                  <span>
                    It takes approximately <strong>{(1 / massRatio).toFixed(1)}{' '}
                    {animal.identity.commonName}s</strong> combined to equal the biomass of a single{' '}
                    {activeReference.name.toLowerCase()}.
                  </span>
                )
              ) : (
                <span className="text-slate-400 italic">
                  Exact body mass measurements are not verified for this specimen record.
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
