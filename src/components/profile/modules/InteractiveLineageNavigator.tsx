import React, { useState, useMemo } from 'react';
import { GitBranch, ChevronRight, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { AnimalRecord, TaxonomicLineage } from '../../../types/taxonomy';
import { SmartTaxonImage } from '../../common/SmartTaxonImage';

export interface InteractiveLineageNavigatorProps {
  animal: AnimalRecord;
  allAnimals?: AnimalRecord[];
  onSelectAnimal?: (animal: AnimalRecord) => void;
}

interface CladeNode {
  rank: 'Kingdom' | 'Phylum' | 'Class' | 'Order' | 'Family' | 'Genus' | 'Species';
  name: string;
  field: keyof TaxonomicLineage;
}

const CLADE_RANKS: { rank: CladeNode['rank']; field: keyof TaxonomicLineage }[] = [
  { rank: 'Kingdom', field: 'kingdom' },
  { rank: 'Phylum', field: 'phylum' },
  { rank: 'Class', field: 'class' },
  { rank: 'Order', field: 'order' },
  { rank: 'Family', field: 'family' },
  { rank: 'Genus', field: 'genus' },
  { rank: 'Species', field: 'species' }
];

export function InteractiveLineageNavigator({
  animal,
  allAnimals = [],
  onSelectAnimal
}: InteractiveLineageNavigatorProps) {
  const [selectedClade, setSelectedClade] = useState<CladeNode | null>(null);

  const lineage = animal.identity.lineage || {};

  // Find sibling species sharing the selected clade rank
  const siblingCladeTaxa = useMemo(() => {
    if (!selectedClade || !selectedClade.name) return [];

    const field = selectedClade.field;
    const targetVal = selectedClade.name.toLowerCase().trim();

    return allAnimals.filter((a) => {
      const aVal = (a.identity?.lineage?.[field] || '').toLowerCase().trim();
      return aVal === targetVal && a.id !== animal.id;
    });
  }, [allAnimals, animal.id, selectedClade]);

  return (
    <div className="bg-[#EBE6DC]/35 dark:bg-[#0D1210]/60 border border-[#141816]/10 dark:border-white/10 rounded-xl p-6 sm:p-8 space-y-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#141816]/10 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#2E6F54] dark:text-emerald-400 font-bold tracking-wider">
            <GitBranch className="w-4 h-4" />
            <span>Phylogenetic Clade Surfer</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-[#F4F1EA] mt-1">
            Evolutionary Lineage & Sibling Taxa
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Click any taxonomic rank to inspect all shared sibling species across the Tree of Life.
          </p>
        </div>

        <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 self-start sm:self-auto">
          Rank: SPECIES
        </span>
      </div>

      {/* Horizontal Clade Breadcrumb Pipeline */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center gap-1.5 min-w-max py-1">
          {CLADE_RANKS.map((cr, idx) => {
            const rawVal = lineage[cr.field];
            const cladeName = rawVal || (cr.rank === 'Kingdom' ? 'Animalia' : cr.rank === 'Species' ? animal.identity.scientificName : null);
            const isSpecies = cr.rank === 'Species';
            const isSelected = selectedClade?.rank === cr.rank;

            // Count siblings in this clade
            const cladeCount = cladeName
              ? allAnimals.filter((a) => (a.identity?.lineage?.[cr.field] || '').toLowerCase() === cladeName.toLowerCase()).length
              : 0;

            return (
              <React.Fragment key={cr.rank}>
                <button
                  onClick={() => {
                    if (cladeName) {
                      setSelectedClade(isSelected ? null : { rank: cr.rank, name: cladeName, field: cr.field });
                    }
                  }}
                  disabled={!cladeName}
                  className={`px-3.5 py-2 rounded-2xl border text-left transition-all group ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-md shadow-amber-500/20 ring-2 ring-amber-500/30'
                      : isSpecies
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : cladeName
                      ? 'bg-slate-50 dark:bg-[#0E1513] border-slate-200 dark:border-slate-800 hover:border-amber-500/60 text-slate-700 dark:text-slate-300'
                      : 'bg-slate-100 dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-800 text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[9px] font-mono uppercase tracking-wider ${
                        isSelected ? 'text-slate-900' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {cr.rank}
                    </span>
                    {cladeCount > 0 && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                          isSelected
                            ? 'bg-slate-950 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {cladeCount}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold truncate max-w-[130px] mt-0.5">
                    {cladeName || 'Undocumented'}
                  </div>
                </button>

                {idx < CLADE_RANKS.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Sibling Taxa Drawer (When a Clade is Selected) */}
      {selectedClade && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="text-xs font-mono uppercase font-bold text-amber-900 dark:text-amber-200">
                Sibling Species in {selectedClade.rank}: <em>{selectedClade.name}</em> ({siblingCladeTaxa.length})
              </h4>
            </div>
            <button
              onClick={() => setSelectedClade(null)}
              className="text-xs font-mono text-amber-700 dark:text-amber-400 hover:underline"
            >
              Close
            </button>
          </div>

          {siblingCladeTaxa.length === 0 ? (
            <p className="text-xs text-amber-800 dark:text-amber-300 italic">
              No other species in the current active catalogue share this exact {selectedClade.rank.toLowerCase()} record.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {siblingCladeTaxa.slice(0, 8).map((sibling) => (
                <button
                  key={sibling.id}
                  onClick={() => {
                    onSelectAnimal?.(sibling);
                    setSelectedClade(null);
                  }}
                  className="p-3 rounded-xl bg-white dark:bg-[#161F1D] border border-amber-500/20 hover:border-amber-500 flex items-center gap-3 text-left transition-all hover:-translate-y-0.5 shadow-sm group"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                    <SmartTaxonImage
                      scientificName={sibling.identity.scientificName}
                      commonName={sibling.identity.commonName}
                      primaryUrl={sibling.media?.url}
                      thumbnailUrl={sibling.media?.thumbnailUrl}
                      categoryGroup={sibling.identity.categoryGroup}
                      className="w-full h-full object-cover"
                      containerClassName="w-full h-full"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors">
                      {sibling.identity.commonName}
                    </div>
                    <div className="text-[10px] font-serif italic text-slate-400 truncate">
                      {sibling.identity.scientificName}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
