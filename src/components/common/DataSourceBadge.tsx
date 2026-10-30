import React from 'react';
import { DataSourceType } from '../../types/taxonomy';
import { DATA_SOURCE_BADGES } from '../../constants/categories';

interface DataSourceBadgeProps {
  sourceType: DataSourceType;
  className?: string;
}

export function DataSourceBadge({ sourceType, className = '' }: DataSourceBadgeProps) {
  const config = DATA_SOURCE_BADGES[sourceType] || DATA_SOURCE_BADGES.CACHED_RECORD;

  return (
    <span
      title={config.description}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] uppercase font-semibold border ${config.badgeClass} ${className}`}
    >
      <span className="w-1 h-1 rounded-full bg-current" />
      <span>{config.shortLabel}</span>
    </span>
  );
}
