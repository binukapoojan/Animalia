import { IucnRedListCode, DataSourceType } from '../types/taxonomy';

export interface AnimalCategory {
  id: string;
  label: string;
  scientific: string;
  countLabel?: string;
}

export const ANIMAL_CATEGORIES: AnimalCategory[] = [
  { id: 'ALL', label: 'All Kingdom', scientific: 'Animalia', countLabel: 'All Taxa' },
  { id: 'Mammals', label: 'Mammals', scientific: 'Mammalia' },
  { id: 'Birds', label: 'Birds', scientific: 'Aves' },
  { id: 'Reptiles', label: 'Reptiles', scientific: 'Reptilia' },
  { id: 'Amphibians', label: 'Amphibians', scientific: 'Amphibia' },
  { id: 'Fish', label: 'Fish', scientific: 'Actinopterygii & Sarcopterygii' },
  { id: 'Insects', label: 'Insects', scientific: 'Insecta' },
  { id: 'Arachnids', label: 'Arachnids', scientific: 'Arachnida' },
  { id: 'Cephalopods & Mollusks', label: 'Cephalopods & Mollusks', scientific: 'Mollusca' },
  { id: 'Crustaceans', label: 'Crustaceans', scientific: 'Crustacea' },
  { id: 'Marine Invertebrates', label: 'Marine Invertebrates', scientific: 'Cnidaria & Echinodermata' },
  { id: 'Microscopic Animals', label: 'Microscopic Animals', scientific: 'Tardigrada & Rotifera' },
  { id: 'Extinct Taxa', label: 'Extinct Taxa', scientific: 'Extinct Lineages' }
];

export interface IucnMeta {
  code: IucnRedListCode;
  label: string;
  priority: number;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const IUCN_CONFIG: Record<IucnRedListCode, IucnMeta> = {
  EX: {
    code: 'EX',
    label: 'Extinct',
    priority: 1,
    description: 'No reasonable doubt that the last individual has died.',
    badgeBg: 'bg-black text-white dark:bg-black dark:text-red-400',
    badgeText: 'text-red-400',
    badgeBorder: 'border-red-500/40'
  },
  EW: {
    code: 'EW',
    label: 'Extinct in the Wild',
    priority: 2,
    description: 'Known only to survive in cultivation, captivity, or naturalized populations.',
    badgeBg: 'bg-purple-950 text-purple-200 dark:bg-purple-900/60 dark:text-purple-300',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/40'
  },
  CR: {
    code: 'CR',
    label: 'Critically Endangered',
    priority: 3,
    description: 'Facing an extremely high risk of extinction in the wild.',
    badgeBg: 'bg-red-600 text-white dark:bg-red-900/80 dark:text-red-200',
    badgeText: 'text-red-400',
    badgeBorder: 'border-red-500/50'
  },
  EN: {
    code: 'EN',
    label: 'Endangered',
    priority: 4,
    description: 'Facing a very high risk of extinction in the wild.',
    badgeBg: 'bg-orange-600 text-white dark:bg-orange-900/80 dark:text-orange-200',
    badgeText: 'text-orange-400',
    badgeBorder: 'border-orange-500/50'
  },
  VU: {
    code: 'VU',
    label: 'Vulnerable',
    priority: 5,
    description: 'Facing a high risk of extinction in the wild.',
    badgeBg: 'bg-amber-500 text-slate-950 dark:bg-amber-900/70 dark:text-amber-200',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/50'
  },
  NT: {
    code: 'NT',
    label: 'Near Threatened',
    priority: 6,
    description: 'Close to qualifying for a threatened category in the near future.',
    badgeBg: 'bg-teal-700 text-white dark:bg-teal-900/60 dark:text-teal-200',
    badgeText: 'text-teal-300',
    badgeBorder: 'border-teal-500/40'
  },
  LC: {
    code: 'LC',
    label: 'Least Concern',
    priority: 7,
    description: 'Widespread and abundant taxa assessed as lower risk.',
    badgeBg: 'bg-emerald-600 text-white dark:bg-emerald-900/60 dark:text-emerald-200',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40'
  },
  DD: {
    code: 'DD',
    label: 'Data Deficient',
    priority: 8,
    description: 'Inadequate information to make a direct assessment of risk.',
    badgeBg: 'bg-slate-600 text-white dark:bg-slate-800 dark:text-slate-300',
    badgeText: 'text-slate-400',
    badgeBorder: 'border-slate-500/30'
  },
  NE: {
    code: 'NE',
    label: 'Not Evaluated',
    priority: 9,
    description: 'Has not yet been formally evaluated against IUCN criteria.',
    badgeBg: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
    badgeText: 'text-slate-400',
    badgeBorder: 'border-slate-400/30'
  }
};

export interface DataSourceBadgeMeta {
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
}

export const DATA_SOURCE_BADGES: Record<DataSourceType, DataSourceBadgeMeta> = {
  LOCAL_DEMO_RECORD: {
    label: 'Verified Reference Record',
    shortLabel: 'Reference',
    description: 'Curated reference record with verified taxonomic IDs, synonyms, and cited biological literature.',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
  },
  IMPORTED_REPOSITORY_RECORD: {
    label: 'Imported Repository Taxon',
    shortLabel: 'Imported',
    description: 'Ingested and persisted via taxonomic ETL pipeline.',
    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
  },
  LIVE_API_RESULT: {
    label: 'Live Biodiversity API',
    shortLabel: 'Live API',
    description: 'Retrieved directly in real time from iNaturalist & GBIF APIs.',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  },
  CACHED_RECORD: {
    label: 'Cached Record',
    shortLabel: 'Cache',
    description: 'Served from verified local session cache.',
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
  }
};
