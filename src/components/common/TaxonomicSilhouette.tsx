import React from 'react';
import {
  Compass,
  Fish,
  Bug,
  Feather,
  Shell,
  Skull,
  Eye,
  Microscope,
  Activity
} from 'lucide-react';

interface TaxonomicSilhouetteProps {
  categoryGroup: string;
  scientificName: string;
  className?: string;
}

export function TaxonomicSilhouette({
  categoryGroup,
  scientificName,
  className = 'w-full h-full'
}: TaxonomicSilhouetteProps) {
  const getIcon = () => {
    switch (categoryGroup) {
      case 'Mammals':
        return <Compass className="w-12 h-12 stroke-[1.5] text-amber-500/80" />;
      case 'Birds':
        return <Feather className="w-12 h-12 stroke-[1.5] text-sky-400/80" />;
      case 'Reptiles':
      case 'Amphibians':
        return <Eye className="w-12 h-12 stroke-[1.5] text-emerald-400/80" />;
      case 'Fish':
        return <Fish className="w-12 h-12 stroke-[1.5] text-cyan-400/80" />;
      case 'Insects':
      case 'Arachnids':
        return <Bug className="w-12 h-12 stroke-[1.5] text-orange-400/80" />;
      case 'Cephalopods & Mollusks':
      case 'Crustaceans':
      case 'Marine Invertebrates':
        return <Shell className="w-12 h-12 stroke-[1.5] text-teal-400/80" />;
      case 'Microscopic Animals':
        return <Microscope className="w-12 h-12 stroke-[1.5] text-indigo-400/80" />;
      case 'Extinct Taxa':
        return <Skull className="w-12 h-12 stroke-[1.5] text-rose-400/80" />;
      default:
        return <Activity className="w-12 h-12 stroke-[1.5] text-amber-500/80" />;
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-400 select-none ${className}`}
    >
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-inner mb-3">
        {getIcon()}
      </div>
      <span className="text-xs font-mono tracking-wider uppercase text-slate-300">
        {categoryGroup}
      </span>
      <span className="text-[11px] font-serif italic text-slate-400 mt-0.5 max-w-[200px] truncate text-center">
        {scientificName}
      </span>
      <span className="text-[10px] font-mono text-amber-500/80 mt-2 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
        Taxonomic Silhouette
      </span>
    </div>
  );
}
