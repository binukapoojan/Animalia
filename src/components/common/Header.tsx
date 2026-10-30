import React, { useEffect, useMemo, useState } from 'react';
import { Compass, Terminal, Sun, Moon, BrainCircuit, Layers, Scale, Search, Sparkles, ShieldCheck } from 'lucide-react';
import { getDailyDayNumber } from '../../utils/taxonomicMysteryEngine';
import { getCommercialSafeMode, setCommercialSafeMode } from '../../services/mediaResolverService';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  comparedCount: number;
  savedCount: number;
  theme: string;
  toggleTheme: () => void;
  onOpenDailyMystery?: () => void;
  isCommercialSafe?: boolean;
  onToggleCommercialSafe?: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  comparedCount,
  savedCount,
  theme,
  toggleTheme,
  onOpenDailyMystery,
  isCommercialSafe: propCommSafe,
  onToggleCommercialSafe
}: HeaderProps) {
  const dayNumber = useMemo(() => getDailyDayNumber(), []);
  const [localCommSafe, setLocalCommSafe] = useState<boolean>(() => getCommercialSafeMode());

  const isCommSafe = propCommSafe !== undefined ? propCommSafe : localCommSafe;

  useEffect(() => {
    const handleLicenseChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ commercialSafe: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.commercialSafe === 'boolean') {
        setLocalCommSafe(customEvent.detail.commercialSafe);
      } else {
        setLocalCommSafe(getCommercialSafeMode());
      }
    };

    window.addEventListener('animalia:license-mode-changed', handleLicenseChange);
    return () => window.removeEventListener('animalia:license-mode-changed', handleLicenseChange);
  }, []);

  const handleToggleLicense = () => {
    if (onToggleCommercialSafe) {
      onToggleCommercialSafe();
    } else {
      const next = !isCommSafe;
      setLocalCommSafe(next);
      setCommercialSafeMode(next);
    }
  };
  // Global ⌘K / / keyboard shortcut listener to focus search or explore
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toUpperCase();
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveTab('EXPLORE');
        const input = document.querySelector('input[type="text"]') as HTMLInputElement | null;
        input?.focus();
      } else if (e.key === '/') {
        e.preventDefault();
        setActiveTab('EXPLORE');
        const input = document.querySelector('input[type="text"]') as HTMLInputElement | null;
        input?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 bg-[#F5F2EB]/95 dark:bg-[#070A09]/95 dark:bg-[#0B0F0E]/90 backdrop-blur-md border-b border-[#141816]/10 dark:border-white/10 transition-colors"
    >
      {/* 1. Archival Telemetry Strip (Expedition Instrument Bar) */}
      <div className="border-b border-[#141816]/10 dark:border-white/10 bg-[#EBE6DC]/60 dark:bg-[#0D1210]/80 px-4 sm:px-6 lg:px-8 py-1 text-[11px] font-mono tracking-wider text-[#5A625E] dark:text-[#949E99]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 truncate">
            <span className="flex items-center gap-1.5 shrink-0 text-[#2E6F54] dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>CATALOGUE OF LIFE // GBIF BACKBONE CONNECTED</span>
            </span>
            <span className="hidden md:inline text-slate-400 dark:text-slate-600">|</span>
            <span className="hidden md:inline truncate">
              ARCHIVAL LEDGER: 164 VERIFIED TAXA
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Daily Bioacoustic Mystery Trigger */}
            <button
              onClick={onOpenDailyMystery}
              className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-bold text-[#2E6F54] dark:text-emerald-400"
              title="Open Daily Bioacoustic & Taxonomic Mystery"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>DAILY MYSTERY // SPECIMEN #{dayNumber}</span>
            </button>
            <span className="hidden sm:inline text-slate-400 dark:text-slate-600">|</span>

            {/* Quick Command Palette Prompt */}
            <button
              onClick={() => {
                setActiveTab('EXPLORE');
                const input = document.querySelector('input[type="text"]') as HTMLInputElement | null;
                input?.focus();
              }}
              className="hidden sm:flex items-center gap-1.5 hover:text-amber-700 dark:hover:text-[#D4A359] transition-colors"
              title="Search reference taxa (Press ⌘K or /)"
            >
              <Search className="w-3 h-3 text-amber-600 dark:text-[#D4A359]" />
              <span>SEARCH</span>
              <kbd className="px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 text-[9px] font-mono border border-black/10 dark:border-white/15">
                ⌘K
              </kbd>
            </button>
            <span className="hidden sm:inline text-slate-400 dark:text-slate-600">|</span>

            {/* Commercial Media License Guard Toggle */}
            <button
              onClick={handleToggleLicense}
              className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-300 font-semibold text-[#2E6F54] dark:text-emerald-400 transition-colors"
              title={`Click to switch between Commercial Safe (CC0/BY/SA) and All CC licenses. Currently: ${isCommSafe ? 'Commercial Safe (CC0/BY/SA)' : 'All CC'}`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden xl:inline">LICENSE:</span>
              <span>{isCommSafe ? 'COMMERCIAL SAFE (CC0/BY/SA)' : 'ALL CC'}</span>
            </button>
            <span className="hidden sm:inline text-slate-400 dark:text-slate-600">|</span>

            {/* Archival Celestial Instrument Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="flex items-center gap-1.5 text-[11px] font-mono text-amber-700 dark:text-[#D4A359] hover:underline focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1"
              title={`Switch to ${theme === 'dark' ? 'Linnaean Parchment (Light)' : 'Obsidian Herbarium (Dark)'}`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden lg:inline">PARCHMENT</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#141816]" />
                  <span className="hidden lg:inline">OBSIDIAN</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Editorial Masthead */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand: Monumental Editorial Nomenclature */}
        <div
          onClick={() => setActiveTab('EXPLORE')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTab('EXPLORE');
            }
          }}
          aria-label="ANIMALIA Home, Explore Wildlife"
          className="flex items-center gap-3 cursor-pointer group shrink-0 focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg py-1"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#D4A359] via-amber-600 to-[#2E6F54] flex items-center justify-center text-[#070A09] shadow-sm group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold tracking-[0.2em] text-[#141816] dark:text-[#F2EFE9]">
                ANIMALIA
              </span>
              <span className="hidden sm:inline-block specimen-stamp text-amber-800 dark:text-[#D4A359] border-amber-600/30 dark:border-[#D4A359]/30 bg-amber-500/10">
                VOL. VI // FIELD MONOGRAPH
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDailyMystery?.();
                }}
                className="hidden lg:inline-flex items-center gap-1.5 specimen-stamp text-[#2E6F54] dark:text-emerald-400 border-emerald-600/30 dark:border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                title="Play Daily Bioacoustic Mystery Deduction"
              >
                <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                <span className="font-bold">DAILY MYSTERY // SPECIMEN #{dayNumber}</span>
              </button>
            </div>
            <span className="text-[9px] font-mono tracking-widest uppercase text-[#5A625E] dark:text-[#949E99] hidden sm:block">
              Archival Zoological Record & Wildlife Cinema
            </span>
          </div>
        </div>

        {/* Editorial Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <nav role="navigation" aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-4 h-16">
            {/* EXPLORE */}
            <button
              onClick={() => setActiveTab('EXPLORE')}
              aria-current={activeTab === 'EXPLORE' ? 'page' : undefined}
              className={`h-full px-2 sm:px-3 text-xs sm:text-sm font-serif tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 border-b-2 focus-visible:ring-2 focus-visible:ring-amber-500 ${
                activeTab === 'EXPLORE'
                  ? 'border-amber-600 dark:border-[#D4A359] text-[#141816] dark:text-[#F2EFE9] font-bold'
                  : 'border-transparent text-[#5A625E] dark:text-[#949E99] hover:text-[#141816] dark:hover:text-[#F2EFE9] font-medium'
              }`}
            >
              <span>Explore</span>
            </button>

            {/* DISCOVERY & QUIZZES */}
            <button
              onClick={() => setActiveTab('DISCOVERY_QUIZZES')}
              aria-current={activeTab === 'DISCOVERY_QUIZZES' ? 'page' : undefined}
              className={`h-full px-2 sm:px-3 text-xs sm:text-sm font-serif tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 border-b-2 focus-visible:ring-2 focus-visible:ring-amber-500 ${
                activeTab === 'DISCOVERY_QUIZZES'
                  ? 'border-amber-600 dark:border-[#D4A359] text-[#141816] dark:text-[#F2EFE9] font-bold'
                  : 'border-transparent text-[#5A625E] dark:text-[#949E99] hover:text-[#141816] dark:hover:text-[#F2EFE9] font-medium'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Discovery & Quizzes</span>
            </button>

            {/* COLLECTIONS */}
            <button
              onClick={() => setActiveTab('COLLECTIONS')}
              aria-current={activeTab === 'COLLECTIONS' ? 'page' : undefined}
              className={`h-full px-2 sm:px-3 text-xs sm:text-sm font-serif tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 border-b-2 focus-visible:ring-2 focus-visible:ring-amber-500 ${
                activeTab === 'COLLECTIONS'
                  ? 'border-amber-600 dark:border-[#D4A359] text-[#141816] dark:text-[#F2EFE9] font-bold'
                  : 'border-transparent text-[#5A625E] dark:text-[#949E99] hover:text-[#141816] dark:hover:text-[#F2EFE9] font-medium'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Collections</span>
              {savedCount > 0 && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-700 dark:text-[#D4A359]">
                  {savedCount}
                </span>
              )}
            </button>

            {/* COMPARE */}
            <button
              onClick={() => setActiveTab('COMPARE')}
              aria-current={activeTab === 'COMPARE' ? 'page' : undefined}
              className={`h-full px-2 sm:px-3 text-xs sm:text-sm font-serif tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 border-b-2 focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                activeTab === 'COMPARE'
                  ? 'border-[#2E6F54] dark:border-emerald-400 text-[#2E6F54] dark:text-emerald-400 font-bold'
                  : 'border-transparent text-[#5A625E] dark:text-[#949E99] hover:text-[#2E6F54] dark:hover:text-emerald-400 font-medium'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare ({comparedCount})</span>
            </button>

            {/* ANTIGRAVITY HANDOFF */}
            <button
              onClick={() => setActiveTab('ANTIGRAVITY')}
              aria-current={activeTab === 'ANTIGRAVITY' ? 'page' : undefined}
              className={`h-full px-2 sm:px-3 text-xs sm:text-sm font-mono tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap border-b-2 focus-visible:ring-2 focus-visible:ring-sky-400 ${
                activeTab === 'ANTIGRAVITY'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                  : 'border-transparent text-[#5A625E] dark:text-[#949E99] hover:text-sky-600 dark:hover:text-sky-400 font-medium'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Antigravity Handoff</span>
              <span className="sm:hidden">Handoff</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
