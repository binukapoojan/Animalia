import React from 'react';
import { IucnRedListCode } from '../../types/taxonomy';
import { IUCN_CONFIG } from '../../constants/categories';

interface IucnBadgeProps {
  status?: IucnRedListCode | null;
  year?: number | null;
  showFullLabel?: boolean;
  className?: string;
}

export function IucnBadge({
  status = 'NE',
  year,
  showFullLabel = false,
  className = ''
}: IucnBadgeProps) {
  const code = (status || 'NE').toUpperCase() as IucnRedListCode;
  const config = IUCN_CONFIG[code] || IUCN_CONFIG.NE;

  return (
    <span
      title={`IUCN Red List Status: ${config.label} (${config.code}) — ${config.description}`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold tracking-wide border shadow-sm transition-all ${config.badgeBg} ${config.badgeBorder} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{config.code}</span>
      {showFullLabel && (
        <span className="text-[10px] font-sans font-normal opacity-90 hidden sm:inline">
          · {config.label}
        </span>
      )}
      {year && <span className="text-[9px] opacity-75 hidden md:inline">({year})</span>}
    </span>
  );
}
