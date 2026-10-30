import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  X,
  Volume2,
  Ruler,
  Sparkles,
  Eye,
  Check,
  Share2,
  Trophy,
  Flame,
  Search,
  ArrowRight,
  RotateCcw,
  HelpCircle,
  Compass,
  Radio,
  BookOpen,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import type { AnimalRecord } from '../../types/taxonomy';
import {
  getDailyDayNumber,
  getDailyMysteryTaxon,
  getTaxonLineage,
  compareClades,
  redactSpecimenText,
  generateDispatchShareText,
  type DailyMysteryState,
  type CladeMatchResult
} from '../../utils/taxonomicMysteryEngine';
import { BioacousticVocalizationDeck } from '../profile/modules/BioacousticVocalizationDeck';
import { parseLengthToCm } from '../../utils/biometricParser';
import { IucnBadge } from '../common/IucnBadge';
import { TaxonomicSilhouette } from '../common/TaxonomicSilhouette';

export interface DailySpecimenMysteryProps {
  isOpen: boolean;
  onClose: () => void;
  allAnimals: AnimalRecord[];
  onSelectAnimal: (animal: AnimalRecord) => void;
}

const STORAGE_KEY = 'animalia_daily_mystery_v1';

export function DailySpecimenMystery({
  isOpen,
  onClose,
  allAnimals,
  onSelectAnimal
}: DailySpecimenMysteryProps) {
  // Practice Archive Mode toggle
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);
  const [practiceDateStr, setPracticeDateStr] = useState<string>('2026-10-29');

  // Today's UTC date & Day number
  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const activeDateStr = isPracticeMode ? practiceDateStr : todayDateStr;

  // Selected Daily Target Taxon
  const { taxon: targetTaxon, dayNumber } = useMemo(() => {
    return getDailyMysteryTaxon(allAnimals, activeDateStr);
  }, [allAnimals, activeDateStr]);

  // Mystery Player State
  const [revealedClues, setRevealedClues] = useState<number>(1);
  const [activeClueTab, setActiveClueTab] = useState<number>(1);
  const [guesses, setGuesses] = useState<{
    taxonId: string;
    commonName: string;
    scientificName: string;
    cladeMatches: CladeMatchResult;
  }[]>([]);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const [totalSolved, setTotalSolved] = useState<number>(0);

  // Search & Autocomplete State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGuessTaxon, setSelectedGuessTaxon] = useState<AnimalRecord | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Load persistence from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: DailyMysteryState = JSON.parse(raw);
        setStreak(saved.streak || 0);
        setTotalSolved(saved.totalSolved || 0);

        if (!isPracticeMode && saved.lastPlayedDate === todayDateStr) {
          setGuesses(saved.guessHistory || []);
          setIsSolved(saved.todaySolved || false);
          setRevealedClues(saved.todayRevealedClues || 1);
          if (saved.todaySolved || (saved.guessHistory && saved.guessHistory.length >= 5)) {
            setIsGameOver(true);
          }
        }
      }
    } catch {
      // Fallback cleanly
    }
  }, [todayDateStr, isPracticeMode]);

  // Synchronize state when switching between Practice and Daily
  useEffect(() => {
    if (isPracticeMode) {
      setGuesses([]);
      setIsSolved(false);
      setIsGameOver(false);
      setRevealedClues(1);
      setActiveClueTab(1);
    }
  }, [isPracticeMode, practiceDateStr]);

  // Persist official daily state
  const saveDailyProgress = useCallback(
    (
      newGuesses: typeof guesses,
      solved: boolean,
      clueStage: number
    ) => {
      if (isPracticeMode) return;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const prev: Partial<DailyMysteryState> = raw ? JSON.parse(raw) : {};

        const newStreak = solved
          ? (prev.lastPlayedDate === todayDateStr ? prev.streak || 1 : (prev.streak || 0) + 1)
          : prev.streak || 0;

        const newTotalSolved = solved
          ? (prev.lastPlayedDate === todayDateStr ? prev.totalSolved || 1 : (prev.totalSolved || 0) + 1)
          : prev.totalSolved || 0;

        const state: DailyMysteryState = {
          lastPlayedDate: todayDateStr,
          dayNumber,
          streak: newStreak,
          totalSolved: newTotalSolved,
          totalPlayed: (prev.totalPlayed || 0) + (newGuesses.length === 1 ? 1 : 0),
          todayGuesses: newGuesses.map((g) => g.taxonId),
          todaySolved: solved,
          todayRevealedClues: clueStage,
          guessHistory: newGuesses
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setStreak(newStreak);
        setTotalSolved(newTotalSolved);
      } catch {}
    },
    [isPracticeMode, todayDateStr, dayNumber]
  );

  // Autocomplete filtering
  const autocompleteSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase().trim();
    return allAnimals
      .filter((a) => {
        const common = (a.identity?.commonName || '').toLowerCase();
        const sci = (a.identity?.scientificName || '').toLowerCase();
        return common.includes(q) || sci.includes(q);
      })
      .slice(0, 8);
  }, [allAnimals, searchQuery]);

  // Submit a taxonomic deduction guess
  const handleSubmitGuess = () => {
    if (!selectedGuessTaxon || isGameOver) return;

    const matches = compareClades(selectedGuessTaxon, targetTaxon);
    const newGuesses = [
      ...guesses,
      {
        taxonId: selectedGuessTaxon.id,
        commonName: selectedGuessTaxon.identity.commonName,
        scientificName: selectedGuessTaxon.identity.scientificName,
        cladeMatches: matches
      }
    ];

    setGuesses(newGuesses);
    setSearchQuery('');
    setSelectedGuessTaxon(null);
    setIsSearchOpen(false);

    if (matches.isExactMatch) {
      setIsSolved(true);
      setIsGameOver(true);
      setRevealedClues(5);
      saveDailyProgress(newGuesses, true, Math.min(5, revealedClues));
    } else {
      const nextClue = Math.min(5, revealedClues + 1);
      setRevealedClues(nextClue);
      setActiveClueTab(nextClue);

      if (newGuesses.length >= 5) {
        setIsGameOver(true);
        saveDailyProgress(newGuesses, false, 5);
      } else {
        saveDailyProgress(newGuesses, false, nextClue);
      }
    }
  };

  // Skip / Reveal Next Clue manually
  const handleSkipClue = () => {
    if (isGameOver || revealedClues >= 5) return;
    const nextClue = revealedClues + 1;
    setRevealedClues(nextClue);
    setActiveClueTab(nextClue);
    saveDailyProgress(guesses, false, nextClue);
  };

  // Wordle-Style Clipboard Share
  const handleCopyDispatch = async () => {
    const text = generateDispatchShareText(
      dayNumber,
      activeDateStr,
      isSolved,
      isSolved ? revealedClues : 5,
      guesses.map((g) => ({ matchCount: g.cladeMatches.matchCount }))
    );

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Clue 4 Diagnostic Trait (Redacted)
  const redactedTrait = useMemo(() => {
    if (!targetTaxon) return '';
    const bio = targetTaxon.biology;
    const trait =
      bio?.discovery?.distinguishingTraits?.[0] ||
      bio?.discovery?.interestingFacts?.[0]?.fact ||
      bio?.summary?.text ||
      (bio as any)?.description ||
      'A highly specialized ecological niche adaptation documented in field expeditions.';
    return redactSpecimenText(trait, targetTaxon);
  }, [targetTaxon]);

  // Morphometric height computation for Clue 3
  const targetLengthCm = useMemo(() => {
    if (!targetTaxon) return 100;
    const rawLen =
      targetTaxon.biology?.measurements?.bodyLength ||
      (targetTaxon.biology as any)?.length ||
      (targetTaxon.biology as any)?.size;
    return parseLengthToCm(rawLen) || 120;
  }, [targetTaxon]);

  // Human standard reference = 175cm
  const humanHeightCm = 175;
  const targetScaleRatio = Math.max(0.2, Math.min(2.5, targetLengthCm / humanHeightCm));

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Daily Bioacoustic & Taxonomic Mystery"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-[#F5F2EB] dark:bg-[#070A09] text-[#141816] dark:text-[#F2EFE9] border border-[#141816]/15 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col archival-grain">
        {/* ========================================================================= */}
        {/* 1. ARCHIVAL HEADER & EXPEDITION INSTRUMENT TELEMETRY                      */}
        {/* ========================================================================= */}
        <header className="p-4 sm:p-6 border-b border-[#141816]/10 dark:border-white/10 bg-[#EBE6DC]/60 dark:bg-[#0D1210]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A359] via-amber-600 to-[#2E6F54] flex items-center justify-center text-[#070A09] shadow-sm shrink-0">
              <Compass className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="specimen-stamp text-amber-800 dark:text-[#D4A359] border-amber-600/30 dark:border-[#D4A359]/30 bg-amber-500/10">
                  SPECIMEN #{dayNumber} // {activeDateStr}
                </span>
                {isPracticeMode && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 uppercase">
                    Practice Archive
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-2xl font-serif font-bold tracking-tight text-[#141816] dark:text-[#F2EFE9] mt-0.5">
                ANIMALIA Daily Bioacoustic Mystery
              </h2>
            </div>
          </div>

          {/* Top Actions: Streak Counter, Practice Toggle & Close */}
          <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center">
            {/* Daily Streak Indicator */}
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-800 dark:text-[#D4A359]"
              title={`Daily Streak: ${streak} | Total Solved: ${totalSolved}`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
              <span>{streak}d STREAK</span>
            </div>

            {/* Practice Archive Mode Toggle */}
            <button
              onClick={() => {
                if (isPracticeMode) {
                  setIsPracticeMode(false);
                } else {
                  setIsPracticeMode(true);
                  // Pick a previous day
                  const d = new Date();
                  d.setDate(d.getDate() - Math.floor(Math.random() * 60 + 1));
                  setPracticeDateStr(d.toISOString().slice(0, 10));
                }
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-mono border border-[#141816]/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Toggle Practice Archive Mode to play past mysteries"
            >
              {isPracticeMode ? 'Back to Today' : 'Practice Archive Mode'}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Close Daily Specimen Mystery"
            >
              <X className="w-5 h-5 text-[#5A625E] dark:text-[#949E99]" />
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. PROGRESSIVE 5-STAGE ARCHIVAL CLUE DOSSIER                               */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Clue Navigation Stepper Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#5A625E] dark:text-[#949E99]">
              <span className="uppercase tracking-wider">
                Progressive Clue Dossier ({revealedClues}/5 Unlocked)
              </span>
              <span className="font-semibold text-amber-700 dark:text-[#D4A359]">
                {5 - guesses.length} Deduction Attempts Remaining
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {[1, 2, 3, 4, 5].map((stage) => {
                const isUnlocked = stage <= revealedClues || isGameOver;
                const isActive = stage === activeClueTab;
                return (
                  <button
                    key={stage}
                    disabled={!isUnlocked}
                    onClick={() => setActiveClueTab(stage)}
                    className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between h-14 sm:h-16 ${
                      isActive
                        ? 'border-amber-600 dark:border-[#D4A359] bg-amber-500/10 font-bold'
                        : isUnlocked
                        ? 'border-[#141816]/10 dark:border-white/10 bg-[#EBE6DC]/40 dark:bg-[#0D1210]/40 hover:bg-black/5 dark:hover:bg-white/5'
                        : 'border-[#141816]/5 dark:border-white/5 opacity-40 cursor-not-allowed bg-black/5 dark:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full text-[10px] font-mono">
                      <span>CLUE 0{stage}</span>
                      {isUnlocked ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <span className="opacity-60">LOCKED</span>
                      )}
                    </div>
                    <span className="text-[11px] sm:text-xs font-serif truncate">
                      {stage === 1 && 'Taxonomy & Realm'}
                      {stage === 2 && 'Bioacoustics'}
                      {stage === 3 && 'Scale Silhouette'}
                      {stage === 4 && 'Superpower'}
                      {stage === 5 && 'Specimen Plate'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Clue Viewport Spread */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[#EBE6DC]/30 dark:bg-[#0D1210]/50 border border-[#141816]/10 dark:border-white/10 min-h-[220px]">
            {/* STAGE 1: Kingdom / Phylum / Realm / Elevation */}
            {activeClueTab === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#2E6F54] dark:text-emerald-400 font-bold tracking-wider">
                  <Compass className="w-4 h-4" />
                  <span>Clue 01 // Biogeographic Realm & Taxonomic Envelope</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F5F2EB] dark:bg-[#070A09] border border-[#141816]/10 dark:border-white/10 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#5A625E] dark:text-[#949E99]">
                      Taxonomic Kingdom & Phylum
                    </span>
                    <div className="font-serif text-lg font-bold text-[#141816] dark:text-[#F2EFE9]">
                      Kingdom {getTaxonLineage(targetTaxon).kingdom || 'Animalia'} // Phylum {getTaxonLineage(targetTaxon).phylum || 'Chordata'}
                    </div>
                    <p className="text-xs text-[#5A625E] dark:text-[#949E99] leading-relaxed">
                      Fundamental evolutionary blueprint and body symmetry established.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F5F2EB] dark:bg-[#070A09] border border-[#141816]/10 dark:border-white/10 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#5A625E] dark:text-[#949E99]">
                      Biogeographic Realm & Habitat Elevation
                    </span>
                    <div className="font-serif text-lg font-bold text-amber-700 dark:text-[#D4A359]">
                      {targetTaxon.biology?.ecology?.geographicRange || targetTaxon.biology?.ecology?.habitat || 'Global Distribution'}
                    </div>
                    <p className="text-xs text-[#5A625E] dark:text-[#949E99] leading-relaxed">
                      Elevation / Depth envelope: {targetTaxon.biology?.ecology?.habitat || 'Undisclosed Field Biome'}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 2: Bioacoustic Signature Sonogram */}
            {activeClueTab === 2 && (
              <div className="space-y-3">
                <BioacousticVocalizationDeck
                  animal={targetTaxon}
                  mysteryMode={!isGameOver}
                  className="!p-4 sm:!p-5"
                />
              </div>
            )}

            {/* STAGE 3: Morphometric Scale Silhouette vs Human 1.75m */}
            {activeClueTab === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono uppercase text-amber-700 dark:text-[#D4A359] font-bold tracking-wider">
                  <Ruler className="w-4 h-4" />
                  <span>Clue 03 // Morphometric Scale Silhouette vs Adult Human (1.75m)</span>
                </div>

                <div className="p-6 rounded-xl bg-[#060a09] border border-slate-800 text-white flex flex-col sm:flex-row items-end justify-center gap-8 sm:gap-16 min-h-[180px] shadow-inner select-none">
                  {/* Mystery Specimen Silhouette */}
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                      Mystery Specimen
                    </span>
                    <div
                      className="w-20 rounded-xl bg-gradient-to-t from-emerald-600 to-emerald-400 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all duration-500"
                      style={{ height: `${Math.max(48, Math.min(180, 100 * targetScaleRatio))}px` }}
                    >
                      <span className="text-[11px] font-mono">
                        {targetLengthCm >= 100 ? `${(targetLengthCm / 100).toFixed(1)}m` : `${targetLengthCm}cm`}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      Length: {targetTaxon.biology?.measurements?.bodyLength || `${targetLengthCm} cm`}
                    </span>
                  </div>

                  <span className="font-mono text-xs text-amber-400 pb-8">VS</span>

                  {/* Standard Human 1.75m Reference */}
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
                      Adult Human (1.75m)
                    </span>
                    <div
                      className="w-20 rounded-xl bg-gradient-to-t from-amber-600 to-amber-400 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-amber-500/20"
                      style={{ height: '100px' }}
                    >
                      <span className="text-[11px] font-mono">1.75m</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      WHO Reference Anthropometry
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 4: Diagnostic Adaptation Superpower */}
            {activeClueTab === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono uppercase text-sky-600 dark:text-sky-400 font-bold tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Clue 04 // Diagnostic Adaptation Superpower</span>
                </div>

                <div className="p-5 sm:p-6 rounded-xl bg-[#F5F2EB] dark:bg-[#070A09] border border-[#141816]/10 dark:border-white/10 space-y-3">
                  <div className="specimen-stamp text-sky-700 dark:text-sky-400 border-sky-500/30 bg-sky-500/10">
                    VERIFIED BIOLOGICAL SUPERPOWER // [REDACTED TAXON]
                  </div>
                  <p className="font-serif text-base sm:text-lg leading-relaxed text-[#141816] dark:text-[#F2EFE9] italic">
                    "{redactedTrait}"
                  </p>
                  <p className="text-xs font-mono text-[#5A625E] dark:text-[#949E99]">
                    Identity tokens sanitized via taxonomic redactor. Preserves authentic morphological adaptation.
                  </p>
                </div>
              </div>
            )}

            {/* STAGE 5: Macro Specimen Plate + Order & Family */}
            {activeClueTab === 5 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono uppercase text-rose-600 dark:text-rose-400 font-bold tracking-wider">
                  <Eye className="w-4 h-4" />
                  <span>Clue 05 // Macro Specimen Plate & Final Clade Level</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  {/* Blurred / Cropped Macro Plate */}
                  <div className="relative rounded-xl overflow-hidden aspect-video border border-[#141816]/15 dark:border-white/15 bg-black">
                    {targetTaxon.media?.url || (targetTaxon as any).images?.[0]?.sourceUrl ? (
                      <img
                        src={targetTaxon.media?.url || (targetTaxon as any).images?.[0]?.sourceUrl}
                        alt="Macro Specimen Plate"
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover transition-all duration-700 ${
                          isGameOver ? 'filter-none scale-100' : 'filter blur-md contrast-125 scale-125'
                        }`}
                      />
                    ) : (
                      <TaxonomicSilhouette
                        categoryGroup={targetTaxon.identity.categoryGroup}
                        scientificName={targetTaxon.identity.scientificName}
                      />
                    )}
                    {!isGameOver && (
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center pointer-events-none">
                        <span className="specimen-stamp bg-black/70 text-amber-400 border-amber-500/40 backdrop-blur-sm">
                          OPTICAL MACRO BLUR ACTIVE
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Taxonomic Order & Family Plaque */}
                  <div className="p-4 rounded-xl bg-[#F5F2EB] dark:bg-[#070A09] border border-[#141816]/10 dark:border-white/10 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#5A625E] dark:text-[#949E99]">
                      Terminal Taxonomic Lineage
                    </span>
                    <div className="font-serif text-lg font-bold text-[#141816] dark:text-[#F2EFE9]">
                      Order: <span className="text-amber-700 dark:text-[#D4A359]">{getTaxonLineage(targetTaxon).order || '—'}</span>
                    </div>
                    <div className="font-serif text-lg font-bold text-[#141816] dark:text-[#F2EFE9]">
                      Family: <span className="text-amber-700 dark:text-[#D4A359]">{getTaxonLineage(targetTaxon).family || '—'}</span>
                    </div>
                    <p className="text-xs text-[#5A625E] dark:text-[#949E99] leading-relaxed">
                      Final evolutionary branch preceding genus segregation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 3. TAXONOMIC AUTOCOMPLETE & DEDUCTION INPUT                                */}
          {/* ========================================================================= */}
          {!isGameOver && (
            <div className="space-y-3">
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A625E] dark:text-[#949E99]" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={selectedGuessTaxon ? selectedGuessTaxon.identity.commonName : searchQuery}
                      onChange={(e) => {
                        setSelectedGuessTaxon(null);
                        setSearchQuery(e.target.value);
                        setIsSearchOpen(true);
                      }}
                      onFocus={() => setIsSearchOpen(true)}
                      placeholder="Search catalog taxa by common name or scientific binomial..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#EBE6DC]/60 dark:bg-[#0D1210] border border-[#141816]/15 dark:border-white/15 text-sm font-serif text-[#141816] dark:text-[#F2EFE9] placeholder-[#5A625E] dark:placeholder-[#949E99] focus:outline-none focus:border-amber-600 dark:focus:border-[#D4A359]"
                    />
                  </div>

                  <button
                    onClick={handleSubmitGuess}
                    disabled={!selectedGuessTaxon}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-serif font-bold text-sm shadow-sm transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <span>Submit Deduction</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {revealedClues < 5 && (
                    <button
                      onClick={handleSkipClue}
                      className="px-3.5 py-2.5 rounded-xl bg-[#EBE6DC] dark:bg-[#0D1210] hover:bg-black/10 dark:hover:bg-white/10 border border-[#141816]/10 dark:border-white/10 text-xs font-mono transition-colors shrink-0"
                      title="Skip and reveal next progressive clue"
                    >
                      Skip Clue (+1)
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {isSearchOpen && autocompleteSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#F5F2EB] dark:bg-[#0D1210] border border-[#141816]/15 dark:border-white/15 rounded-xl shadow-2xl p-1.5 z-40 max-h-56 overflow-y-auto space-y-1">
                    {autocompleteSuggestions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedGuessTaxon(item);
                          setSearchQuery(item.identity.commonName);
                          setIsSearchOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left rounded-lg hover:bg-amber-500/10 dark:hover:bg-amber-500/20 flex items-center justify-between transition-colors group"
                      >
                        <span className="font-serif font-bold text-sm text-[#141816] dark:text-[#F2EFE9] group-hover:text-amber-700 dark:group-hover:text-[#D4A359]">
                          {item.identity.commonName}
                        </span>
                        <span className="font-serif italic text-xs text-[#5A625E] dark:text-[#949E99]">
                          {item.identity.scientificName}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. EVOLUTIONARY CLADE MATCHING FEEDBACK TABLE                             */}
          {/* ========================================================================= */}
          {guesses.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#5A625E] dark:text-[#949E99]">
                <span className="uppercase tracking-wider">Evolutionary Clade Feedback</span>
                <span>Warm / Cold Phylogenetic Proximity</span>
              </div>

              <div className="space-y-2">
                {guesses.map((g, idx) => {
                  const m = g.cladeMatches;
                  return (
                    <div
                      key={g.taxonId + idx}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono transition-all ${
                        m.isExactMatch
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300'
                          : 'border-[#141816]/10 dark:border-white/10 bg-[#EBE6DC]/40 dark:bg-[#0D1210]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-serif font-bold text-sm text-[#141816] dark:text-[#F2EFE9]">
                          {g.commonName}
                        </span>
                        <span className="font-serif italic opacity-75 hidden sm:inline">
                          ({g.scientificName})
                        </span>
                      </div>

                      {/* Rank by Rank Match Plaque */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className={`px-2 py-0.5 rounded border ${m.phylum ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}>
                          Phylum {m.phylum ? '✓' : '✗'}
                        </span>
                        <span className={`px-2 py-0.5 rounded border ${m.class ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}>
                          Class {m.class ? '✓' : '✗'}
                        </span>
                        <span className={`px-2 py-0.5 rounded border ${m.order ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}>
                          Order {m.order ? '✓' : '✗'}
                        </span>
                        <span className={`px-2 py-0.5 rounded border ${m.family ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}>
                          Family {m.family ? '✓' : '✗'}
                        </span>
                        <span className={`px-2 py-0.5 rounded border ${m.genus ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}>
                          Genus {m.genus ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. VICTORY / COMPLETION DOSSIER & SHARE DISPATCH                           */}
          {/* ========================================================================= */}
          {isGameOver && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-transparent border border-amber-500/30 space-y-5 animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase text-amber-700 dark:text-[#D4A359] font-bold">
                    <Trophy className="w-4 h-4" />
                    <span>{isSolved ? 'Specimen Mystery Solved' : 'Deduction Concluded'}</span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#141816] dark:text-[#F2EFE9]">
                    {targetTaxon.identity.commonName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-serif italic text-[#5A625E] dark:text-[#949E99]">
                    <span>{targetTaxon.identity.scientificName}</span>
                    <IucnBadge status={targetTaxon.biology.conservation?.iucnStatus} />
                  </div>
                </div>

                {/* 1-Click Share Button */}
                <button
                  onClick={handleCopyDispatch}
                  className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-serif font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 shrink-0 group"
                >
                  <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>{copiedShare ? 'Copied to Clipboard!' : 'Copy Field Dispatch'}</span>
                </button>
              </div>

              {/* Action Buttons: Inspect Dossier or Play Another Practice */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#141816]/10 dark:border-white/10">
                <button
                  onClick={() => {
                    onClose();
                    onSelectAnimal(targetTaxon);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#2E6F54] hover:bg-[#255742] text-white font-serif font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Inspect Full Species Monograph Dossier</span>
                </button>

                {isPracticeMode && (
                  <button
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - Math.floor(Math.random() * 90 + 1));
                      setPracticeDateStr(d.toISOString().slice(0, 10));
                    }}
                    className="px-4 py-2 rounded-xl bg-[#EBE6DC] dark:bg-[#0D1210] hover:bg-black/10 dark:hover:bg-white/10 text-xs font-mono border border-[#141816]/10 dark:border-white/10 transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Play Another Practice Mystery</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
