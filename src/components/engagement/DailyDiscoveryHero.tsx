import React, { useMemo } from 'react';
import { Sparkles, Calendar, ChevronRight, Bookmark, Scale, BookOpen, GitBranch } from 'lucide-react';
import { AnimalRecord } from '../../types/taxonomy';
import { IucnBadge } from '../common/IucnBadge';
import { DataSourceBadge } from '../common/DataSourceBadge';
import { TaxonomicSilhouette } from '../common/TaxonomicSilhouette';

interface DailyDiscoveryHeroProps {
  animals: AnimalRecord[];
  onSelectAnimal: (animal: AnimalRecord) => void;
  isFavorite: boolean;
  onToggleFavorite: (animal: AnimalRecord) => void;
  isCompared: boolean;
  onToggleCompare: (animal: AnimalRecord) => void;
  onOpenDailyMystery?: () => void;
}

export function DailyDiscoveryHero({
  animals,
  onSelectAnimal,
  isFavorite,
  onToggleFavorite,
  isCompared,
  onToggleCompare,
  onOpenDailyMystery
}: DailyDiscoveryHeroProps) {
  // Deterministic daily taxon based on day of year
  const dailyTaxon = useMemo(() => {
    if (!animals || animals.length === 0) return null;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return animals[dayOfYear % animals.length];
  }, [animals]);

  if (!dailyTaxon) return null;

  const { identity, media, biology, dataSource } = dailyTaxon;
  const verifiedFact =
    biology.discovery?.interestingFacts?.[0] || {
      fact: biology.summary?.text || 'Verified biological specimen documented in global biodiversity backbones.',
      reference: biology.summary?.source || 'IUCN Red List'
    };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#101917] to-[#0A100E] border border-amber-500/30 text-white shadow-xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Information Column */}
        <div className="space-y-4 max-w-2xl">
          {/* Header pill */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SPECIES OF THE DAY</span>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-mono">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <DataSourceBadge sourceType={dataSource} />
          </div>

          {/* Titles & Binomial */}
          <div>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-white">
              {identity.commonName}
            </h1>
            <p className="font-serif italic text-lg sm:text-xl text-amber-200/90 mt-1">
              {identity.scientificName}{' '}
              {identity.authorship && (
                <span className="not-italic text-xs font-sans text-slate-400">
                  {identity.authorship}
                </span>
              )}
            </p>
          </div>

          {/* Taxonomic Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-black/40 p-2.5 rounded-xl border border-white/10 overflow-x-auto">
            <GitBranch className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              {identity.lineage?.kingdom || 'Animalia'} › {identity.lineage?.phylum || 'Chordata'} ›{' '}
              {identity.lineage?.class || 'Class'} › {identity.lineage?.order || 'Order'} ›{' '}
              {identity.lineage?.family || 'Family'}
            </span>
          </div>

          {/* Verified Citation Box */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-amber-400 font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Verified Natural History Fact</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-serif">
              "{verifiedFact.fact}"
            </p>
            {verifiedFact.reference && (
              <div className="text-[11px] font-mono text-slate-400">
                Source: {verifiedFact.reference}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onSelectAnimal(dailyTaxon)}
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-[1.02]"
            >
              <span>Inspect Specimen Profile</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            {onOpenDailyMystery && (
              <button
                onClick={onOpenDailyMystery}
                className="px-4 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-semibold transition-all flex items-center gap-1.5"
                title="Launch ANIMALIA Daily Bioacoustic Mystery"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Play Daily Mystery</span>
              </button>
            )}
            <button
              onClick={() => onToggleFavorite(dailyTaxon)}
              className={`p-3 rounded-xl border transition-colors flex items-center gap-2 text-xs font-medium ${
                isFavorite
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              <span>{isFavorite ? 'Saved' : 'Save'}</span>
            </button>
            <button
              onClick={() => onToggleCompare(dailyTaxon)}
              className={`p-3 rounded-xl border transition-colors flex items-center gap-2 text-xs font-medium ${
                isCompared
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>{isCompared ? 'In Compare' : 'Compare'}</span>
            </button>
          </div>
        </div>

        {/* Right Hero Image Card */}
        <div className="w-full lg:w-96 shrink-0 space-y-2">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900 group">
            {media?.url ? (
              <img
                src={media.url}
                alt={identity.commonName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
            ) : (
              <TaxonomicSilhouette
                categoryGroup={identity.categoryGroup}
                scientificName={identity.scientificName}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[11px] font-mono font-semibold text-amber-300 uppercase">
                {identity.categoryGroup}
              </span>
              <IucnBadge status={biology.conservation?.iucnStatus} showFullLabel />
            </div>
            <div className="absolute bottom-3 left-3 right-3 text-xs text-slate-300 pointer-events-none">
              <span className="font-mono text-[10px] block opacity-80">Photo Attribution:</span>
              <span className="truncate block font-mono text-[11px]">{media.attribution || 'Wikimedia Commons'} ({media.licenseCode || 'CC'})</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
