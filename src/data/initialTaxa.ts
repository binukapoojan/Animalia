import handoffBundle from '../../animalia-handoff-bundle.json' with { type: 'json' };
import type { AnimalRecord } from '../types/taxonomy.ts';

export const INITIAL_TAXA: AnimalRecord[] = (handoffBundle.taxa as AnimalRecord[]).map((animal) => ({
  ...animal,
  provenance: animal.provenance || {
    completenessScore: 95,
    lastVerifiedAt: '2026-10-29T00:00:00Z',
    sources: ['GBIF', 'iNaturalist', 'IUCN']
  }
}));

export const DEFAULT_COMPARISON_IDS: string[] = handoffBundle.comparisonIds || [
  'demo-panthera-uncia',
  'demo-okapia-johnstoni'
];
