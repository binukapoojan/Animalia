import React, { useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  Lock,
  GitBranch,
  Layers,
  Sparkles,
  ShieldAlert,
  Compass,
  ArrowRight,
  Clock
} from 'lucide-react';
import { AnimalRecord, DiscoveryHistoryEntry, EducationalMilestone } from '../../types/taxonomy';

interface DiscoveryMilestoneTrackerProps {
  discoveryHistory: DiscoveryHistoryEntry[];
  allAnimals: AnimalRecord[];
  onSelectAnimal: (animal: AnimalRecord) => void;
}

export function DiscoveryMilestoneTracker({
  discoveryHistory,
  allAnimals,
  onSelectAnimal
}: DiscoveryMilestoneTrackerProps) {
  // Compute unique explored taxonomic ranks from history
  const exploredMetrics = useMemo(() => {
    const inspectedTaxa = discoveryHistory
      .map((h) => allAnimals.find((a) => a.id === h.taxonId))
      .filter(Boolean) as AnimalRecord[];

    const uniquePhyla = new Set(
      inspectedTaxa.map((t) => t.identity.lineage?.phylum).filter(Boolean)
    );
    const uniqueClasses = new Set(
      inspectedTaxa.map((t) => t.identity.lineage?.class).filter(Boolean)
    );
    const uniqueGroups = new Set(inspectedTaxa.map((t) => t.identity.categoryGroup));
    const threatenedCount = inspectedTaxa.filter((t) =>
      ['CR', 'EN', 'VU'].includes(t.biology.conservation?.iucnStatus || '')
    ).length;
    const livingFossilsCount = inspectedTaxa.filter(
      (t) =>
        t.identity.scientificName.includes('Latimeria') ||
        t.identity.scientificName.includes('Sphenodon') ||
        t.identity.scientificName.includes('Nautilus') ||
        t.identity.scientificName.includes('Triops') ||
        t.identity.categoryGroup === 'Extinct Taxa'
    ).length;

    return {
      totalInspected: inspectedTaxa.length,
      phylaCount: uniquePhyla.size,
      classesCount: uniqueClasses.size,
      groupsCount: uniqueGroups.size,
      threatenedCount,
      livingFossilsCount,
      uniquePhylaList: Array.from(uniquePhyla),
      uniqueClassesList: Array.from(uniqueClasses)
    };
  }, [discoveryHistory, allAnimals]);

  // Define educational milestones
  const milestones: EducationalMilestone[] = useMemo(() => [
    {
      id: 'first-step',
      title: 'Initiate Discovery',
      description: 'Inspect your first specimen profile in the natural history museum.',
      iconName: 'Compass',
      requiredCount: 1,
      currentCount: exploredMetrics.totalInspected,
      unlocked: exploredMetrics.totalInspected >= 1,
      category: 'SPECIES'
    },
    {
      id: 'phyla-explorer',
      title: 'Architectures of Life',
      description: 'Explore species from at least 3 distinct animal phyla (e.g. Chordata, Arthropoda, Mollusca).',
      iconName: 'GitBranch',
      requiredCount: 3,
      currentCount: exploredMetrics.phylaCount,
      unlocked: exploredMetrics.phylaCount >= 3,
      category: 'PHYLA'
    },
    {
      id: 'class-surveyor',
      title: 'Taxonomic Polymath',
      description: 'Encounter organisms spanning 5 different taxonomic classes.',
      iconName: 'Layers',
      requiredCount: 5,
      currentCount: exploredMetrics.classesCount,
      unlocked: exploredMetrics.classesCount >= 5,
      category: 'CLASSES'
    },
    {
      id: 'conservation-steward',
      title: 'Conservation Sentinel',
      description: 'Study at least 3 threatened species facing extinction risks (CR, EN, or VU).',
      iconName: 'ShieldAlert',
      requiredCount: 3,
      currentCount: exploredMetrics.threatenedCount,
      unlocked: exploredMetrics.threatenedCount >= 3,
      category: 'SPECIES'
    },
    {
      id: 'ancient-relics',
      title: 'Deep Time Paleontologist',
      description: 'Investigate at least 2 living fossils or ancient relict lineages.',
      iconName: 'Sparkles',
      requiredCount: 2,
      currentCount: exploredMetrics.livingFossilsCount,
      unlocked: exploredMetrics.livingFossilsCount >= 2,
      category: 'SPECIES'
    },
    {
      id: 'master-naturalist',
      title: 'Grand Naturalist Portfolio',
      description: 'Build a comprehensive research history of 12+ verified species.',
      iconName: 'Award',
      requiredCount: 12,
      currentCount: exploredMetrics.totalInspected,
      unlocked: exploredMetrics.totalInspected >= 12,
      category: 'SPECIES'
    }
  ], [exploredMetrics]);

  const unlockedCount = milestones.filter((m) => m.unlocked).length;
  const progressPercent = Math.round((unlockedCount / milestones.length) * 100);

  return (
    <section className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>EDUCATIONAL MILESTONES & DISCOVERY LOG</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold">Naturalist Journey Tracker</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Track taxonomic diversity explored across phyla, classes, and conservation vulnerability without manipulative streaks or artificial points.
            </p>
          </div>

          {/* Progress gauge */}
          <div className="w-full md:w-64 bg-slate-50 dark:bg-[#0B0F0E] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 uppercase">Milestones Unlocked</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {unlockedCount} / {milestones.length} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>{exploredMetrics.phylaCount} Phyla</span>
              <span>{exploredMetrics.classesCount} Classes</span>
              <span>{exploredMetrics.totalInspected} Species</span>
            </div>
          </div>
        </div>
      </div>

      {/* Milestones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {milestones.map((m) => {
          return (
            <div
              key={m.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                m.unlocked
                  ? 'bg-white dark:bg-[#121917] border-amber-500/50 shadow-md'
                  : 'bg-slate-50/60 dark:bg-[#0E1413]/60 border-slate-200/60 dark:border-slate-800/60 opacity-80'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`p-2.5 rounded-xl ${
                      m.unlocked
                        ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {m.unlocked ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                    {m.category}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {m.description}
                  </p>
                </div>
              </div>

              {/* Progress pill */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Progress</span>
                <span className={`font-semibold ${m.unlocked ? 'text-emerald-500' : 'text-slate-500'}`}>
                  {Math.min(m.currentCount, m.requiredCount)} / {m.requiredCount} {m.unlocked ? '✓ UNLOCKED' : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Exploration History Log */}
      <div className="bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="font-serif font-bold text-lg">Specimen Exploration Chronology</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {discoveryHistory.length} total inspection sessions logged
          </span>
        </div>

        {discoveryHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">
            No specimen inspection history logged yet. Explore species to build your chronology.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {discoveryHistory.slice(0, 9).map((entry, idx) => {
              const matchedTaxon = allAnimals.find((a) => a.id === entry.taxonId);
              return (
                <div
                  key={`${entry.taxonId}-${idx}`}
                  onClick={() => matchedTaxon && onSelectAnimal(matchedTaxon)}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate group-hover:text-amber-500 transition-colors">
                      {entry.commonName}
                    </div>
                    <div className="text-[11px] font-serif italic text-slate-400 truncate">
                      {entry.scientificName}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">
                      {new Date(entry.inspectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
