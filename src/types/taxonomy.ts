/**
 * ANIMALIA — Taxonomic, Morphological, Ecological & Provenance Type Definitions
 * Strict Nullable Biological Interfaces conforming to GEMINI.md Scientific Integrity Rules
 */

export type TaxonomicRank =
  | 'KINGDOM'
  | 'PHYLUM'
  | 'SUBPHYLUM'
  | 'CLASS'
  | 'ORDER'
  | 'FAMILY'
  | 'GENUS'
  | 'SPECIES'
  | 'SUBSPECIES';

export type TaxonomicStatus =
  | 'ACCEPTED'
  | 'SYNONYM'
  | 'HOMOTYPIC_SYNONYM'
  | 'HETEROTYPIC_SYNONYM'
  | 'DOUBTFUL';

export type IucnRedListCode =
  | 'EX' // Extinct
  | 'EW' // Extinct in the Wild
  | 'CR' // Critically Endangered
  | 'EN' // Endangered
  | 'VU' // Vulnerable
  | 'NT' // Near Threatened
  | 'LC' // Least Concern
  | 'DD' // Data Deficient
  | 'NE'; // Not Evaluated

export type DataSourceType =
  | 'LOCAL_DEMO_RECORD'
  | 'IMPORTED_REPOSITORY_RECORD'
  | 'LIVE_API_RESULT'
  | 'CACHED_RECORD';

export type MediaLicenseCode =
  | 'CC0'
  | 'CC-BY'
  | 'CC-BY-2.0'
  | 'CC-BY-2.5'
  | 'CC-BY-3.0'
  | 'CC-BY-4.0'
  | 'CC-BY-SA'
  | 'CC-BY-SA-2.0'
  | 'CC-BY-SA-2.5'
  | 'CC-BY-SA-3.0'
  | 'CC-BY-SA-4.0'
  | 'CC-BY-NC'
  | 'CC-BY-NC-2.0'
  | 'CC-BY-NC-4.0'
  | 'CC-BY-NC-SA'
  | 'PUBLIC_DOMAIN'
  | string;

export interface ExternalTaxonomicIds {
  gbifKey: number | null;
  inatTaxonId: number | null;
  colId?: string | null;
  wikidataQid?: string | null;
}

export interface TaxonomicLineage {
  kingdom: string | null;
  phylum: string | null;
  class: string | null;
  order: string | null;
  family: string | null;
  genus: string | null;
  species: string | null;
  subspecies?: string | null;
}

export interface TaxonSynonym {
  scientificName: string;
  authorship: string | null;
  status: TaxonomicStatus;
  gbifSynonymKey?: number | null;
}

export interface VernacularName {
  name: string;
  language: string;
  source: string;
}

export interface TaxonIdentity {
  commonName: string;
  scientificName: string;
  authorship: string | null;
  rank: TaxonomicRank;
  taxonomicStatus: TaxonomicStatus;
  isExtinct: boolean;
  categoryGroup: string;
  externalIds: ExternalTaxonomicIds;
  lineage: TaxonomicLineage;
  synonyms: TaxonSynonym[];
  vernacularNames: VernacularName[];
}

export interface AdditionalPhoto {
  url: string;
  thumbnailUrl?: string | null;
  attribution: string;
  licenseCode: MediaLicenseCode;
}

export interface TaxonAudioItem {
  id?: string;
  audioUrl: string;
  title?: string;
  recordist: string;
  licenseCode: MediaLicenseCode;
  sourceProvider: string;
  sourceUrl?: string;
  recordingType?: string; // 'Song' | 'Call' | 'Alarm' | 'Roar' | 'Howl' | 'Echolocation'
  durationSeconds?: number;
  locality?: string;
  format?: string; // 'ogg' | 'wav' | 'mp3' | 'flac'
}

export interface TaxonMedia {
  url: string | null;
  thumbnailUrl: string | null;
  attribution: string;
  licenseCode: MediaLicenseCode;
  sourceProvider: string;
  sourceUrl: string;
  verifiedTaxonMatch: boolean;
  additionalPhotos?: AdditionalPhoto[];
  audio?: TaxonAudioItem | null;
  additionalRecordings?: TaxonAudioItem[];
}

export interface MorphologicalMeasurements {
  bodyLength: string | null;
  mass: string | null;
  lifespan: string | null;
  source: string | null;
}

export interface EcologicalProfile {
  habitat: string | null;
  diet: string | null;
  geographicRange: string | null;
  activityPattern: string | null;
  biomeTags: string[];
}

export interface ConservationProfile {
  iucnStatus: IucnRedListCode;
  source: string | null;
  assessmentYear: number | null;
  populationTrend: 'Increasing' | 'Decreasing' | 'Stable' | 'Unknown' | null;
  threats: string[] | null;
}

export interface SimilarTaxonComparison {
  comparedSpecies: string;
  scientificName: string;
  keyDifference: string;
}

export interface InterestingFact {
  fact: string;
  reference: string;
}

export interface DiscoveryMetadata {
  distinguishingTraits: string[];
  comparisonsWithSimilarTaxa: SimilarTaxonComparison[];
  interestingFacts: InterestingFact[];
  relatedTaxonIds: string[];
}

export interface BiologicalProfile {
  summary: {
    text: string;
    source: string;
  };
  measurements: MorphologicalMeasurements;
  ecology: EcologicalProfile;
  conservation: ConservationProfile;
  discovery: DiscoveryMetadata;
}

export interface ProvenanceMetadata {
  completenessScore: number;
  lastVerifiedAt: string;
  sources: string[];
}

export interface AnimalRecord {
  id: string;
  dataSource: DataSourceType;
  identity: TaxonIdentity;
  media: TaxonMedia;
  biology: BiologicalProfile;
  provenance: ProvenanceMetadata;
}

export interface DiscoveryHistoryEntry {
  taxonId: string;
  commonName: string;
  scientificName: string;
  inspectedAt: string;
}

export interface HandoffBundleStats {
  totalTaxaInSession: number;
  savedCollectionCount: number;
  activeComparisonSlots: number;
}

export interface HandoffBundle {
  project: string;
  handoffTarget: string;
  exportedAt: string;
  stats: HandoffBundleStats;
  comparisonIds: string[];
  discoveryHistory: DiscoveryHistoryEntry[];
  taxa: AnimalRecord[];
}

// ============================================================================
// PHASE 4: ENGAGEMENT SUITE, QUIZZES & THEMATIC COLLECTIONS
// ============================================================================

export interface UserCollection {
  id: string;
  name: string;
  description: string | null;
  icon_name: string;
  created_at: string;
  taxonIds?: string[];
}

export interface CollectionTaxonEntry {
  collection_id: string;
  taxon_id: string;
  notes: string | null;
  added_at: string;
  taxon?: AnimalRecord;
}

export type QuizMode =
  | 'VISUAL_IDENTIFICATION'
  | 'CLADE_CLASSIFICATION'
  | 'CONSERVATION_STATUS';

export interface QuizQuestion {
  id: string;
  mode: QuizMode;
  targetTaxon: AnimalRecord;
  prompt: string;
  options: {
    id: string;
    label: string;
    sublabel?: string;
    isCorrect: boolean;
  }[];
  explanation: string;
  clue?: string;
}

export interface QuizAttempt {
  id?: string;
  quiz_mode: QuizMode;
  taxon_id: string;
  is_correct: boolean;
  attempted_at: string;
}

export interface EducationalMilestone {
  id: string;
  title: string;
  description: string;
  iconName: string;
  requiredCount: number;
  currentCount: number;
  unlocked: boolean;
  category: 'PHYLA' | 'CLASSES' | 'SPECIES' | 'QUIZ';
}

