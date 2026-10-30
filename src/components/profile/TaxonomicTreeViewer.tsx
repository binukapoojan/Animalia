import React from 'react';
import { GitBranch, ChevronRight, CheckCircle2 } from 'lucide-react';
import { TaxonomicLineage } from '../../types/taxonomy';

interface TaxonomicTreeViewerProps {
  lineage: TaxonomicLineage;
  scientificName: string;
  categoryGroup: string;
}

export function TaxonomicTreeViewer({
  lineage,
  scientificName,
  categoryGroup
}: TaxonomicTreeViewerProps) {
  const ranks = [
    { rank: 'Kingdom', value: lineage.kingdom || 'Animalia', desc: 'All multicellular animals' },
    { rank: 'Phylum', value: lineage.phylum || 'Chordata', desc: 'Major body architecture' },
    { rank: 'Class', value: lineage.class, desc: 'Major taxonomic class' },
    { rank: 'Order', value: lineage.order, desc: 'Evolutionary order' },
    { rank: 'Family', value: lineage.family, desc: 'Family lineage grouping' },
    { rank: 'Genus', value: lineage.genus, desc: 'Generic grouping' },
    { rank: 'Species', value: lineage.species || scientificName, desc: 'Binomial taxon unit' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs font-mono uppercase text-slate-400">
            Evolutionary Lineage & Taxonomic Hierarchy
          </h4>
        </div>
        <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          Rank: SPECIES
        </span>
      </div>

      <div className="space-y-2">
        {ranks.map((node, i) => {
          const isSpecies = node.rank === 'Species';
          const isDocumented = Boolean(node.value);

          return (
            <div
              key={node.rank}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                isSpecies
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200 font-medium'
                  : 'bg-slate-50 dark:bg-[#0B0F0E] border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                  isSpecies
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {i + 1}
              </div>

              <div className="min-w-[80px]">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">{node.rank}</span>
                <span className={`text-xs font-serif ${isSpecies ? 'italic font-bold' : 'font-semibold'}`}>
                  {node.value || 'Not documented'}
                </span>
              </div>

              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto hidden sm:block" />

              <span className="text-[11px] text-slate-400 hidden sm:block truncate max-w-[240px]">
                {node.desc}
              </span>

              {isDocumented && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-auto sm:ml-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
