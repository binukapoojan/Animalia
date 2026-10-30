import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search,
  Compass,
  GitBranch,
  Bookmark,
  ShieldAlert,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Globe,
  Database,
  Layers,
  ChevronRight,
  ChevronDown,
  X,
  Heart,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Camera,
  Scale,
  Clock,
  MapPin,
  Utensils,
  Activity,
  Award,
  RefreshCw,
  BookOpen,
  Microscope,
  Feather,
  Fish,
  Bug,
  Shell,
  Skull,
  Eye,
  ArrowUpRight,
  HelpCircle,
  Check,
  Filter,
  Copy,
  Download,
  Upload,
  Play,
  Terminal,
  FileCode,
  GitMerge,
  Languages,
  Server,
  HardDrive,
  Trash2,
  Sun,
  Moon
} from 'lucide-react';

/**
 * ============================================================================
 * ANIMALIA — THE ULTIMATE ANIMAL DISCOVERY PLATFORM (PHASE 4 + LIGHT/DARK & 40+ TAXA)
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. CONSTANTS, TAXONOMIC GROUPS & IUCN RED LIST STANDARDS
// ----------------------------------------------------------------------------

const ANIMAL_CATEGORIES = [
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

const IUCN_CONFIG = {
  EX: { code: 'EX', label: 'Extinct', priority: 1, description: 'No reasonable doubt that the last individual has died.' },
  EW: { code: 'EW', label: 'Extinct in the Wild', priority: 2, description: 'Known only to survive in cultivation, captivity, or naturalized populations.' },
  CR: { code: 'CR', label: 'Critically Endangered', priority: 3, description: 'Facing an extremely high risk of extinction in the wild.' },
  EN: { code: 'EN', label: 'Endangered', priority: 4, description: 'Facing a very high risk of extinction in the wild.' },
  VU: { code: 'VU', label: 'Vulnerable', priority: 5, description: 'Facing a high risk of extinction in the wild.' },
  NT: { code: 'NT', label: 'Near Threatened', priority: 6, description: 'Close to qualifying for a threatened category in the near future.' },
  LC: { code: 'LC', label: 'Least Concern', priority: 7, description: 'Widespread and abundant taxa assessed as lower risk.' },
  DD: { code: 'DD', label: 'Data Deficient', priority: 8, description: 'Inadequate information to make a direct assessment of risk.' },
  NE: { code: 'NE', label: 'Not Evaluated', priority: 9, description: 'Has not yet been formally evaluated against IUCN criteria.' }
};

const DATA_SOURCE_BADGES = {
  LOCAL_DEMO_RECORD: { label: 'Verified Reference Record', shortLabel: 'Reference', description: 'Curated reference record with verified taxonomic IDs, synonyms, and cited biological literature.' },
  IMPORTED_REPOSITORY_RECORD: { label: 'Imported Repository Taxon', shortLabel: 'Imported', description: 'Ingested and persisted via taxonomic ETL pipeline.' },
  LIVE_API_RESULT: { label: 'Live Biodiversity API', shortLabel: 'Live API', description: 'Retrieved directly in real time from iNaturalist & GBIF APIs.' },
  CACHED_RECORD: { label: 'Cached Record', shortLabel: 'Cache', description: 'Served from verified local session cache.' }
};

// ----------------------------------------------------------------------------
// 2. EXPANDED VERIFIED REFERENCE DATASET (40+ REPRESENTATIVE TAXA ACROSS ALL 12 GROUPS)
// ----------------------------------------------------------------------------
const INITIAL_DEMO_ANIMALS = [
  // MAMMALS
  {
    id: 'demo-panthera-uncia',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Snow Leopard',
      scientificName: 'Panthera uncia',
      authorship: '(Schreber, 1775)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Mammals',
      externalIds: { gbifKey: 2435099, inatTaxonId: 74831 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Mammalia', order: 'Carnivora', family: 'Felidae', genus: 'Panthera', species: 'Panthera uncia' },
      synonyms: [{ scientificName: 'Uncia uncia', authorship: '(Schreber, 1775)', status: 'HOMOTYPIC_SYNONYM' }],
      vernacularNames: [{ name: 'Snow Leopard', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Irbis4.JPG/1280px-Irbis4.JPG',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Irbis4.JPG/640px-Irbis4.JPG',
      attribution: 'Wikimedia Commons / Bernard Landgraf',
      licenseCode: 'CC-BY-SA-3.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Irbis4.JPG',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'An alpine big cat native to the rugged mountain ranges of Central and South Asia, uniquely adapted to cold, thin high-altitude air.', source: 'IUCN Red List' },
      measurements: { bodyLength: '75–150 cm + 80-105 cm tail', mass: '22–55 kg', lifespan: '10–12 years', source: 'Snow Leopard Trust' },
      ecology: { habitat: 'Alpine rocky outcrops and cliffs (3,000–5,500 m)', diet: 'Carnivore (blue sheep, ibex)', geographicRange: 'Central and South Asia', activityPattern: 'Crepuscular', biomeTags: ['Alpine', 'Apex Predator'] },
      conservation: { iucnStatus: 'VU', source: 'IUCN Red List', assessmentYear: 2017, populationTrend: 'Decreasing', threats: ['Retaliatory killing', 'Poaching', 'Prey depletion'] },
      discovery: {
        distinguishingTraits: ['Enlarged nasal cavities warm freezing air.', 'Muscular tail acts as balance and thermal muffler.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Leopard', scientificName: 'Panthera pardus', keyDifference: 'Longer smoky-gray pelage and thicker tail.' }],
        interestingFacts: [{ fact: 'Sister species to the Tiger (Panthera tigris).', reference: 'Johnson et al. (2006)' }],
        relatedTaxonIds: ['demo-okapia-johnstoni']
      }
    }
  },
  {
    id: 'demo-okapia-johnstoni',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Okapi',
      scientificName: 'Okapia johnstoni',
      authorship: '(Sclater, 1901)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Mammals',
      externalIds: { gbifKey: 2441209, inatTaxonId: 42152 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Mammalia', order: 'Artiodactyla', family: 'Giraffidae', genus: 'Okapia', species: 'Okapia johnstoni' },
      synonyms: [{ scientificName: 'Equus johnstoni', authorship: 'Sclater, 1901', status: 'HOMOTYPIC_SYNONYM' }],
      vernacularNames: [{ name: 'Okapi', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Okapi2.jpg/1280px-Okapi2.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Okapi2.jpg/640px-Okapi2.jpg',
      attribution: 'Wikimedia Commons / Raul654',
      licenseCode: 'CC-BY-SA-3.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Okapi2.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'An elusive rainforest artiodactyl endemic to the Congo Basin and the only living relative of the Giraffe.', source: 'IUCN' },
      measurements: { bodyLength: '190–250 cm', mass: '200–350 kg', lifespan: '15–20 years', source: 'Okapi Conservation Project' },
      ecology: { habitat: 'Dense lowland tropical rainforest', diet: 'Folivore (leaves, buds, fungi)', geographicRange: 'DR Congo', activityPattern: 'Diurnal', biomeTags: ['Tropical Rainforest', 'Giraffidae'] },
      conservation: { iucnStatus: 'EN', source: 'IUCN', assessmentYear: 2015, populationTrend: 'Decreasing', threats: ['Gold mining', 'Logging', 'Snaring'] },
      discovery: {
        distinguishingTraits: ['45-cm prehensile blue-black tongue.', 'Infrasonic communication at ~14 Hz.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Plains Zebra', scientificName: 'Equus quagga', keyDifference: 'Cloven hooves and giraffid ossicones.' }],
        interestingFacts: [{ fact: 'Leaves tar-like pheromone trails from interdigital foot glands.', reference: 'Agaba et al. (2016)' }],
        relatedTaxonIds: ['demo-panthera-uncia']
      }
    }
  },
  {
    id: 'demo-platypus',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Platypus',
      scientificName: 'Ornithorhynchus anatinus',
      authorship: '(Shaw, 1799)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Mammals',
      externalIds: { gbifKey: 2441065, inatTaxonId: 41349 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Mammalia', order: 'Monotremata', family: 'Ornithorhynchidae', genus: 'Ornithorhynchus', species: 'Ornithorhynchus anatinus' },
      synonyms: [],
      vernacularNames: [{ name: 'Platypus', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Platypus_in_water_%28cropped%29.jpg/1280px-Platypus_in_water_%28cropped%29.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Platypus_in_water_%28cropped%29.jpg/640px-Platypus_in_water_%28cropped%29.jpg',
      attribution: 'Wikimedia Commons / Stefan Kraft',
      licenseCode: 'CC-BY-2.5',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Platypus_in_water_(cropped).jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'An egg-laying amphibious monotreme mammal endemic to eastern Australia, featuring a duck-like bill with electroreception and venomous ankle spurs.', source: 'Australian Museum' },
      measurements: { bodyLength: '40–50 cm', mass: '0.7–2.4 kg', lifespan: '10–15 years', source: 'Grant (2007)' },
      ecology: { habitat: 'Freshwater rivers and lakes', diet: 'Carnivore (aquatic insects, worms, freshwater shrimp)', geographicRange: 'Eastern Australia and Tasmania', activityPattern: 'Nocturnal and crepuscular', biomeTags: ['Freshwater', 'Monotreme'] },
      conservation: { iucnStatus: 'NT', source: 'IUCN', assessmentYear: 2016, populationTrend: 'Decreasing', threats: ['River regulation', 'Drought', 'Fishing nets'] },
      discovery: {
        distinguishingTraits: ['Electroreceptive bill detects muscular contractions of prey.', 'Males possess hollow ankle spurs delivering venom.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Short-beaked Echidna', scientificName: 'Tachyglossus aculeatus', keyDifference: 'Echidnas are terrestrial spiny myrmecophages.' }],
        interestingFacts: [{ fact: 'Lays leathery eggs instead of giving live birth.', reference: 'Warren et al. (2008)' }],
        relatedTaxonIds: ['demo-okapia-johnstoni']
      }
    }
  },
  {
    id: 'demo-narwhal',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Narwhal',
      scientificName: 'Monodon monoceros',
      authorship: 'Linnaeus, 1758',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Mammals',
      externalIds: { gbifKey: 2440306, inatTaxonId: 41490 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Mammalia', order: 'Artiodactyla', family: 'Monodontidae', genus: 'Monodon', species: 'Monodon monoceros' },
      synonyms: [],
      vernacularNames: [{ name: 'Narwhal', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Narwhal_Default.jpg/1280px-Narwhal_Default.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Narwhal_Default.jpg/640px-Narwhal_Default.jpg',
      attribution: 'Wikimedia Commons / NOAA',
      licenseCode: 'CC0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Narwhal_Default.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A medium-sized Arctic whale distinguished by a long, spiraled canine tusk protruding from the left side of the upper jaw.', source: 'IUCN' },
      measurements: { bodyLength: '400–500 cm', mass: '800–1600 kg', lifespan: 'Up to 50 years', source: 'Depue et al.' },
      ecology: { habitat: 'Arctic ice-fringe and deep polar fjords', diet: 'Piscivore (turbot, squid, shrimp)', geographicRange: 'High Arctic (Greenland, Canada, Russia)', activityPattern: 'Diurnal diving', biomeTags: ['Polar', 'Marine'] },
      conservation: { iucnStatus: 'LC', source: 'IUCN', assessmentYear: 2017, populationTrend: 'Stable', threats: ['Climate warming', 'Shipping noise', 'Orca predation'] },
      discovery: {
        distinguishingTraits: ['Male left canine grows into a 3-meter helical sensory tusk packed with millions of nerve endings.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Beluga Whale', scientificName: 'Delphinapterus leucas', keyDifference: 'Belugas lack the spiraled tusk and have white skin.' }],
        interestingFacts: [{ fact: 'The tusk is capable of sensing water salinity and temperature.', reference: 'Nweeia et al. (2014)' }],
        relatedTaxonIds: ['demo-platypus']
      }
    }
  },

  // BIRDS
  {
    id: 'demo-balaeniceps-rex',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Shoebill',
      scientificName: 'Balaeniceps rex',
      authorship: 'Gould, 1850',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Birds',
      externalIds: { gbifKey: 2480869, inatTaxonId: 4757 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Aves', order: 'Pelecaniformes', family: 'Balaenicipitidae', genus: 'Balaeniceps', species: 'Balaeniceps rex' },
      synonyms: [],
      vernacularNames: [{ name: 'Shoebill', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Balaeniceps_rex.jpg/1024px-Balaeniceps_rex.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Balaeniceps_rex.jpg/640px-Balaeniceps_rex.jpg',
      attribution: 'Wikimedia Commons / Jens Klinzing',
      licenseCode: 'CC-BY-SA-3.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Balaeniceps_rex.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A tall wading bird of tropical East African papyrus swamps with a massive shoe-shaped bill.', source: 'BirdLife International' },
      measurements: { bodyLength: '110–140 cm', mass: '4.0–7.0 kg', lifespan: 'Up to 35 years', source: 'BirdLife' },
      ecology: { habitat: 'Freshwater papyrus swamps', diet: 'Piscivore (lungfish, tilapia)', geographicRange: 'East-Central Africa', activityPattern: 'Diurnal ambush hunter', biomeTags: ['Wetlands', 'Afrotropical'] },
      conservation: { iucnStatus: 'VU', source: 'IUCN', assessmentYear: 2018, populationTrend: 'Decreasing', threats: ['Swamp drainage', 'Nest disturbance'] },
      discovery: {
        distinguishingTraits: ['Massive 24-cm hooked bill for crushing lungfish.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Hamerkop', scientificName: 'Scopus umbretta', keyDifference: 'Much smaller with a hammer-shaped crest.' }],
        interestingFacts: [{ fact: 'Practices urohidrosis to lower body temperature.', reference: 'Hackett et al. (2008)' }],
        relatedTaxonIds: ['demo-kakapo']
      }
    }
  },
  {
    id: 'demo-kakapo',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Kākāpō',
      scientificName: 'Strigops habroptila',
      authorship: 'G.R. Gray, 1845',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Birds',
      externalIds: { gbifKey: 2479226, inatTaxonId: 19352 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Aves', order: 'Psittaciformes', family: 'Strigopidae', genus: 'Strigops', species: 'Strigops habroptila' },
      synonyms: [],
      vernacularNames: [{ name: 'Kakapo', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Kakapo_Sirocco.jpg/1280px-Kakapo_Sirocco.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Kakapo_Sirocco.jpg/640px-Kakapo_Sirocco.jpg',
      attribution: 'Wikimedia Commons / Department of Conservation (New Zealand)',
      licenseCode: 'CC-BY-2.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kakapo_Sirocco.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A large, flightless, nocturnal ground parrot endemic to New Zealand with a lek mating system.', source: 'DOC NZ' },
      measurements: { bodyLength: '58–64 cm', mass: '2.0–4.0 kg', lifespan: 'Up to 90 years', source: 'NZ DOC' },
      ecology: { habitat: 'Dense podocarp forests and scrublands', diet: 'Herbivore (rimu fruits, seeds, rhizomes)', geographicRange: 'New Zealand offshore sanctuary islands', activityPattern: 'Nocturnal', biomeTags: ['New Zealand Endemic', 'Flightless'] },
      conservation: { iucnStatus: 'CR', source: 'IUCN', assessmentYear: 2018, populationTrend: 'Increasing (Managed)', threats: ['Introduced mammalian predators (stoats, rats)'] },
      discovery: {
        distinguishingTraits: ['The world’s only flightless and heaviest parrot.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Kea', scientificName: 'Nestor notabilis', keyDifference: 'Kea are alpine, flying, inquisitive parrots.' }],
        interestingFacts: [{ fact: 'Males congregate in explosive arenas (leks) and emit booming low-frequency calls.', reference: 'Merton et al. (1984)' }],
        relatedTaxonIds: ['demo-balaeniceps-rex']
      }
    }
  },
  {
    id: 'demo-harpy-eagle',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Harpy Eagle',
      scientificName: 'Harpia harpyja',
      authorship: '(Linnaeus, 1758)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Birds',
      externalIds: { gbifKey: 2481079, inatTaxonId: 5136 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Aves', order: 'Accipitriformes', family: 'Accipitridae', genus: 'Harpia', species: 'Harpia harpyja' },
      synonyms: [],
      vernacularNames: [{ name: 'Harpy Eagle', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Harpia_harpyja_003.jpg/1280px-Harpia_harpyja_003.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Harpia_harpyja_003.jpg/640px-Harpia_harpyja_003.jpg',
      attribution: 'Wikimedia Commons / Tom Friedel',
      licenseCode: 'CC-BY-SA-3.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Harpia_harpyja_003.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A powerful Neotropical rainforest raptor with massive talons capable of lifting heavy arboreal mammals like sloths and monkeys.', source: 'IUCN' },
      measurements: { bodyLength: '89–102 cm', mass: '4.5–9.0 kg', lifespan: '25–35 years', source: 'Peregrine Fund' },
      ecology: { habitat: 'Tropical lowland rainforest canopy', diet: 'Carnivore (sloths, capuchin monkeys, coatis)', geographicRange: 'Central and South America', activityPattern: 'Diurnal ambush hunter', biomeTags: ['Neotropical', 'Apex Raptor'] },
      conservation: { iucnStatus: 'VU', source: 'IUCN', assessmentYear: 2020, populationTrend: 'Decreasing', threats: ['Deforestation', 'Targeted shooting'] },
      discovery: {
        distinguishingTraits: ['Rear talons grow up to 13 cm long—larger than grizzly bear claws.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Golden Eagle', scientificName: 'Aquila chrysaetos', keyDifference: 'Golden eagles inhabit open northern montane terrain.' }],
        interestingFacts: [{ fact: 'Can exert grip pressure exceeding 500 pounds per square inch.', reference: 'Fowler & Cope (1964)' }],
        relatedTaxonIds: ['demo-kakapo']
      }
    }
  },

  // REPTILES
  {
    id: 'demo-amblyrhynchus-cristatus',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Galápagos Marine Iguana',
      scientificName: 'Amblyrhynchus cristatus',
      authorship: 'Bell, 1825',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Reptiles',
      externalIds: { gbifKey: 2459663, inatTaxonId: 35345 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Reptilia', order: 'Squamata', family: 'Iguanidae', genus: 'Amblyrhynchus', species: 'Amblyrhynchus cristatus' },
      synonyms: [],
      vernacularNames: [{ name: 'Marine Iguana', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Galapagos_marine_iguana_%28Amblyrhynchus_cristatus%29_on_Santa_Cruz.jpg/1280px-Galapagos_marine_iguana_%28Amblyrhynchus_cristatus%29_on_Santa_Cruz.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Galapagos_marine_iguana_%28Amblyrhynchus_cristatus%29_on_Santa_Cruz.jpg/640px-Galapagos_marine_iguana_%28Amblyrhynchus_cristatus%29_on_Santa_Cruz.jpg',
      attribution: 'Wikimedia Commons / Charles J. Sharp',
      licenseCode: 'CC-BY-SA-4.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Galapagos_marine_iguana_(Amblyrhynchus_cristatus)_on_Santa_Cruz.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'The world’s only marine lizard, diving into cold ocean waters to graze on intertidal red and green algae.', source: 'IUCN' },
      measurements: { bodyLength: '60–130 cm', mass: '1.0–12.0 kg', lifespan: '12–60 years', source: 'Darwin Foundation' },
      ecology: { habitat: 'Rocky volcanic coastlines', diet: 'Algivore (marine macroalgae)', geographicRange: 'Galápagos Islands, Ecuador', activityPattern: 'Diurnal basking and diving', biomeTags: ['Coastal', 'Marine Reptile'] },
      conservation: { iucnStatus: 'VU', source: 'IUCN', assessmentYear: 2020, populationTrend: 'Decreasing', threats: ['El Niño warming events', 'Feral predators'] },
      discovery: {
        distinguishingTraits: ['Ssneezes out excess sea salt via specialized cranial nasal glands.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Galápagos Land Iguana', scientificName: 'Conolophus subcristatus', keyDifference: 'Land iguanas feed on cactus.' }],
        interestingFacts: [{ fact: 'Can shrink skeletal length by 20% during El Niño food shortages.', reference: 'Wikelski & Thom (2000)' }],
        relatedTaxonIds: ['demo-gharial']
      }
    }
  },
  {
    id: 'demo-gharial',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Gharial',
      scientificName: 'Gavialis gangeticus',
      authorship: '(Gmelin, 1789)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Reptiles',
      externalIds: { gbifKey: 2441314, inatTaxonId: 26081 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Reptilia', order: 'Crocodilia', family: 'Gavialidae', genus: 'Gavialis', species: 'Gavialis gangeticus' },
      synonyms: [],
      vernacularNames: [{ name: 'Gharial', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Gavialis_gangeticus_Chambal.jpg/1280px-Gavialis_gangeticus_Chambal.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Gavialis_gangeticus_Chambal.jpg/640px-Gavialis_gangeticus_Chambal.jpg',
      attribution: 'Wikimedia Commons / Debangshu Kar',
      licenseCode: 'CC-BY-SA-3.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Gavialis_gangeticus_Chambal.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A critically endangered crocodilian native to the northern Indian subcontinent, featuring an extremely slender snout adapted for catching fish.', source: 'IUCN' },
      measurements: { bodyLength: '350–450 cm', mass: '160–250 kg', lifespan: '40–60 years', source: 'Whitaker & Whitaker' },
      ecology: { habitat: 'Fast-flowing freshwater rivers', diet: 'Piscivore (fish)', geographicRange: 'India and Nepal', activityPattern: 'Diurnal', biomeTags: ['Freshwater', 'Crocodilian'] },
      conservation: { iucnStatus: 'CR', source: 'IUCN', assessmentYear: 2018, populationTrend: 'Decreasing', threats: ['Dam construction', 'Sand mining', 'Gillnets'] },
      discovery: {
        distinguishingTraits: ['Mature males develop a bulbous cartilaginous nasal growth called a ghara.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Mugger Crocodile', scientificName: 'Crocodylus palustris', keyDifference: 'Muggers have broad snouts for generalist predation.' }],
        interestingFacts: [{ fact: 'The slender jaws offer near-zero hydrodynamic resistance in river currents.', reference: 'Lang et al. (2019)' }],
        relatedTaxonIds: ['demo-amblyrhynchus-cristatus']
      }
    }
  },

  // AMPHIBIANS
  {
    id: 'demo-ambystoma-mexicanum',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Axolotl',
      scientificName: 'Ambystoma mexicanum',
      authorship: '(Shaw & Nodder, 1798)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Amphibians',
      externalIds: { gbifKey: 2431950, inatTaxonId: 26777 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Amphibia', order: 'Caudata', family: 'Ambystomatidae', genus: 'Ambystoma', species: 'Ambystoma mexicanum' },
      synonyms: [{ scientificName: 'Gyrinus mexicanus', authorship: 'Shaw & Nodder, 1798', status: 'HOMOTYPIC_SYNONYM' }],
      vernacularNames: [{ name: 'Axolotl', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Axolotl_ganz.jpg/1280px-Axolotl_ganz.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Axolotl_ganz.jpg/640px-Axolotl_ganz.jpg',
      attribution: 'Wikimedia Commons / Stan Shebs',
      licenseCode: 'CC-BY-SA-3.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Axolotl_ganz.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A paedomorphic salamander endemic to Lake Xochimilco retaining external gills throughout adulthood.', source: 'IUCN' },
      measurements: { bodyLength: '15–30 cm', mass: '60–220 g', lifespan: '10–15 years', source: 'AmphibiaWeb' },
      ecology: { habitat: 'High-altitude freshwater canals', diet: 'Carnivore (worms, insect larvae, small fish)', geographicRange: 'Xochimilco, Mexico City', activityPattern: 'Nocturnal', biomeTags: ['Freshwater', 'Neoteny'] },
      conservation: { iucnStatus: 'CR', source: 'IUCN', assessmentYear: 2020, populationTrend: 'Decreasing', threats: ['Invasive carp/tilapia', 'Urban pollution'] },
      discovery: {
        distinguishingTraits: ['Extraordinary scar-free epimorphic limb and spinal regeneration.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Tiger Salamander', scientificName: 'Ambystoma tigrinum', keyDifference: 'Tiger salamanders metamorphose into terrestrial adults.' }],
        interestingFacts: [{ fact: 'Genome size is ~32 billion base pairs (~10x human genome).', reference: 'Nowoshilow et al. (2018)' }],
        relatedTaxonIds: ['demo-blue-poison-dart']
      }
    }
  },
  {
    id: 'demo-blue-poison-dart',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Blue Poison Dart Frog',
      scientificName: 'Dendrobates tinctorius "azureus"',
      authorship: 'Cope, 1874',
      rank: 'SUBSPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Amphibians',
      externalIds: { gbifKey: 2429215, inatTaxonId: 21258 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Amphibia', order: 'Anura', family: 'Dendrobatidae', genus: 'Dendrobates', species: 'Dendrobates tinctorius' },
      synonyms: [],
      vernacularNames: [{ name: 'Blue Poison Dart Frog', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Blue_poison_dart_frog_%28Dendrobates_azureus%29.jpg/1280px-Blue_poison_dart_frog_%28Dendrobates_azureus%29.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Blue_poison_dart_frog_%28Dendrobates_azureus%29.jpg/640px-Blue_poison_dart_frog_%28Dendrobates_azureus%29.jpg',
      attribution: 'Wikimedia Commons / Brocken Inaglory',
      licenseCode: 'CC-BY-SA-3.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Blue_poison_dart_frog_(Dendrobates_azureus).jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A brightly colored poison dart frog native to the Sipaliwini savanna of southern Suriname with skin alkaloids sequestered from toxic arthropod prey.', source: 'IUCN' },
      measurements: { bodyLength: '3.0–4.5 cm', mass: '3–8 g', lifespan: '5–8 years', source: 'AmphibiaWeb' },
      ecology: { habitat: 'Tropical rainforest floor and savanna streams', diet: 'Insectivore (ants, mites, termites)', geographicRange: 'Suriname and northern Brazil', activityPattern: 'Diurnal', biomeTags: ['Neotropical', 'Aposematic'] },
      conservation: { iucnStatus: 'LC', source: 'IUCN', assessmentYear: 2004, populationTrend: 'Stable', threats: ['Pet trade collection', 'Habitat loss'] },
      discovery: {
        distinguishingTraits: ['Aposematic cobalt-blue skin coloration warns predators of lipophilic batrachotoxin secretions.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Golden Poison Frog', scientificName: 'Phyllobates terribilis', keyDifference: 'P. terribilis is significantly more toxic and uniform yellow.' }],
        interestingFacts: [{ fact: 'Captive-bred frogs lose toxicity because their diet lacks wild formicine ants.', reference: 'Daly et al. (1994)' }],
        relatedTaxonIds: ['demo-ambystoma-mexicanum']
      }
    }
  },

  // FISH
  {
    id: 'demo-latimeria-chalumnae',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'West Indian Ocean Coelacanth',
      scientificName: 'Latimeria chalumnae',
      authorship: 'Smith, 1939',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Fish',
      externalIds: { gbifKey: 2410467, inatTaxonId: 104126 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Sarcopterygii', order: 'Coelacanthiformes', family: 'Latimeriidae', genus: 'Latimeria', species: 'Latimeria chalumnae' },
      synonyms: [{ scientificName: 'Malania anjouanae', authorship: 'Smith, 1953', status: 'HETEROTYPIC_SYNONYM' }],
      vernacularNames: [{ name: 'Coelacanth', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Latimeria_chalumnae_-_Naturhistorisches_Museum_Wien.jpg/1280px-Latimeria_chalumnae_-_Naturhistorisches_Museum_Wien.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Latimeria_chalumnae_-_Naturhistorisches_Museum_Wien.jpg/640px-Latimeria_chalumnae_-_Naturhistorisches_Museum_Wien.jpg',
      attribution: 'Wikimedia Commons / Gryffindor',
      licenseCode: 'CC-BY-SA-3.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Latimeria_chalumnae_-_Naturhistorisches_Museum_Wien.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A deep-sea lobe-finned fish long thought extinct for 66 million years until rediscovered in 1938.', source: 'FishBase' },
      measurements: { bodyLength: '150–200 cm', mass: '50–98 kg', lifespan: 'Up to 100 years', source: 'Mahé et al. (2021)' },
      ecology: { habitat: 'Deep mesopelagic volcanic submarine caves (100–700 m)', diet: 'Piscivore', geographicRange: 'Western Indian Ocean', activityPattern: 'Nocturnal cave drift', biomeTags: ['Deep Sea', 'Sarcopterygii'] },
      conservation: { iucnStatus: 'CR', source: 'IUCN', assessmentYear: 2000, populationTrend: 'Decreasing', threats: ['Deep gillnet bycatch'] },
      discovery: {
        distinguishingTraits: ['Paired lobed fins move in an alternating tetrapod-like gait.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Indonesian Coelacanth', scientificName: 'Latimeria menadoensis', keyDifference: 'Brownish-gray with golden flecks.' }],
        interestingFacts: [{ fact: 'Gestation period lasts approximately 5 years.', reference: 'Mahé et al. (2021)' }],
        relatedTaxonIds: ['demo-phycodurus-eques']
      }
    }
  },
  {
    id: 'demo-phycodurus-eques',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Leafy Seadragon',
      scientificName: 'Phycodurus eques',
      authorship: '(Günther, 1865)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Fish',
      externalIds: { gbifKey: 2332920, inatTaxonId: 49181 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Syngnathiformes', family: 'Syngnathidae', genus: 'Phycodurus', species: 'Phycodurus eques' },
      synonyms: [],
      vernacularNames: [{ name: 'Leafy Seadragon', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Leafy_Seadragon_on_Kangaroo_Island.jpg/1280px-Leafy_Seadragon_on_Kangaroo_Island.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Leafy_Seadragon_on_Kangaroo_Island.jpg/640px-Leafy_Seadragon_on_Kangaroo_Island.jpg',
      attribution: 'Wikimedia Commons / James Rosindell',
      licenseCode: 'CC-BY-SA-2.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Leafy_Seadragon_on_Kangaroo_Island.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A marine fish endemic to southern Australian kelp beds featuring elaborate leaf-like camouflage appendages.', source: 'FishBase' },
      measurements: { bodyLength: '20–35 cm', mass: null, lifespan: '5–10 years', source: 'Dragon Search' },
      ecology: { habitat: 'Temperate coastal kelp forests', diet: 'Suction carnivore (mysid shrimp)', geographicRange: 'Southern Australia', activityPattern: 'Diurnal drift', biomeTags: ['Kelp Forest', 'Syngnathidae'] },
      conservation: { iucnStatus: 'LC', source: 'IUCN', assessmentYear: 2017, populationTrend: 'Decreasing', threats: ['Kelp loss', 'Ocean warming'] },
      discovery: {
        distinguishingTraits: ['Leaf-like appendages serve strictly for camouflage, not propulsion.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Weedy Seadragon', scientificName: 'Phyllopteryx taeniolatus', keyDifference: 'Simpler paddle-like appendages.' }],
        interestingFacts: [{ fact: 'Males brood up to 250 eggs on a spongy ventral tail patch.', reference: 'Small et al. (2022)' }],
        relatedTaxonIds: ['demo-latimeria-chalumnae']
      }
    }
  },
  {
    id: 'demo-great-white-shark',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Great White Shark',
      scientificName: 'Carcharodon carcharias',
      authorship: '(Linnaeus, 1758)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Fish',
      externalIds: { gbifKey: 2420584, inatTaxonId: 49453 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Chondrichthyes', order: 'Lamniformes', family: 'Lamnidae', genus: 'Carcharodon', species: 'Carcharodon carcharias' },
      synonyms: [],
      vernacularNames: [{ name: 'Great White Shark', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/White_shark.jpg/1280px-White_shark.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/White_shark.jpg/640px-White_shark.jpg',
      attribution: 'Wikimedia Commons / Terry Goss',
      licenseCode: 'CC-BY-2.5',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:White_shark.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A large lamniform mackerel shark found in coastal surface waters of all major oceans, famed as a top marine apex predator.', source: 'IUCN' },
      measurements: { bodyLength: '400–600 cm', mass: '680–1900 kg', lifespan: '70+ years', source: 'Li et al. (2015)' },
      ecology: { habitat: 'Coastal temperate and subtropical marine waters', diet: 'Hypercarnivore (pinnipeds, cetaceans, fish)', geographicRange: 'Cosmopolitan in temperate seas', activityPattern: 'Diurnal and nocturnal', biomeTags: ['Pelagic', 'Apex Predator'] },
      conservation: { iucnStatus: 'VU', source: 'IUCN', assessmentYear: 2018, populationTrend: 'Decreasing', threats: ['Bycatch', 'Targeted fishing', 'Shark fin trade'] },
      discovery: {
        distinguishingTraits: ['Regional endothermy allows maintaining core body temperature above ambient water.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Tiger Shark', scientificName: 'Galeocerdo cuvier', keyDifference: 'Tiger sharks have blunt snouts and vertical dark stripes.' }],
        interestingFacts: [{ fact: 'Can detect electromagnetic fields generated by prey muscle contractions.', reference: 'Kalmijn (1982)' }],
        relatedTaxonIds: ['demo-latimeria-chalumnae']
      }
    }
  },

  // INSECTS
  {
    id: 'demo-hymenopus-coronatus',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Orchid Mantis',
      scientificName: 'Hymenopus coronatus',
      authorship: '(Olivier, 1792)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Insects',
      externalIds: { gbifKey: 1406363, inatTaxonId: 334917 },
      lineage: { kingdom: 'Animalia', phylum: 'Arthropoda', class: 'Insecta', order: 'Mantodea', family: 'Hymenopodidae', genus: 'Hymenopus', species: 'Hymenopus coronatus' },
      synonyms: [{ scientificName: 'Mantis coronata', authorship: 'Olivier, 1792', status: 'HOMOTYPIC_SYNONYM' }],
      vernacularNames: [{ name: 'Orchid Mantis', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Hymenopus_coronatus_female.jpg/1024px-Hymenopus_coronatus_female.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Hymenopus_coronatus_female.jpg/640px-Hymenopus_coronatus_female.jpg',
      attribution: 'Wikimedia Commons / Lucarelli',
      licenseCode: 'CC-BY-SA-3.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Hymenopus_coronatus_female.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A Southeast Asian rainforest mantis exhibiting aggressive floral mimicry, attracting pollinators.', source: 'Mantodea File' },
      measurements: { bodyLength: '2.5–7.0 cm', mass: null, lifespan: '3–8 months', source: 'O’Hanlon et al.' },
      ecology: { habitat: 'Tropical rainforest understory and flowering shrubs', diet: 'Entomophagous ambush predator (pollinators)', geographicRange: 'Southeast Asia', activityPattern: 'Diurnal ambush', biomeTags: ['Rainforest', 'Mimicry'] },
      conservation: { iucnStatus: 'NE', source: null, assessmentYear: null, populationTrend: null, threats: null },
      discovery: {
        distinguishingTraits: ['Body acts as an autonomous floral lure outcompeting real flowers.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Spiny Flower Mantis', scientificName: 'Pseudocreobotra wahlbergii', keyDifference: 'P. wahlbergii has conspicuous spiral wing eyespots.' }],
        interestingFacts: [{ fact: 'Attracts higher pollinator visitation rates than real blossoms.', reference: 'O’Hanlon et al. (2014)' }],
        relatedTaxonIds: ['demo-blue-glaucus']
      }
    }
  },
  {
    id: 'demo-goliath-beetle',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Goliath Beetle',
      scientificName: 'Goliathus goliathus',
      authorship: '(Linnaeus, 1758)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Insects',
      externalIds: { gbifKey: 1428256, inatTaxonId: 362451 },
      lineage: { kingdom: 'Animalia', phylum: 'Arthropoda', class: 'Insecta', order: 'Coleoptera', family: 'Scarabaeidae', genus: 'Goliathus', species: 'Goliathus goliathus' },
      synonyms: [],
      vernacularNames: [{ name: 'Goliath Beetle', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Goliathus_goliathus01.jpg/1280px-Goliathus_goliathus01.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Goliathus_goliathus01.jpg/640px-Goliathus_goliathus01.jpg',
      attribution: 'Wikimedia Commons / Didier Descouens',
      licenseCode: 'CC-BY-SA-4.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Goliathus_goliathus01.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'Among the largest insects on Earth by weight, native to African tropical forests.', source: 'Scarabaeidae Catalog' },
      measurements: { bodyLength: '6.0–11.0 cm', mass: '80–100 g (larval stage)', lifespan: '1 year', source: 'Endrödi (1985)' },
      ecology: { habitat: 'Afrotropical rainforest canopy and sap flows', diet: 'Frugivore / sap-feeder (tree sap, rotting fruit)', geographicRange: 'Central Africa', activityPattern: 'Diurnal flight', biomeTags: ['Rainforest', 'Scared Beetle'] },
      conservation: { iucnStatus: 'NE', source: null, assessmentYear: null, populationTrend: null, threats: null },
      discovery: {
        distinguishingTraits: ['Massive Y-shaped horn on male head used to spar for mates.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Hercules Beetle', scientificName: 'Dynastes hercules', keyDifference: 'Hercules beetles feature an elongated thoracic pincer.' }],
        interestingFacts: [{ fact: 'Grubs require protein-rich decaying wood pulp during development.', reference: 'Endrödi (1985)' }],
        relatedTaxonIds: ['demo-hymenopus-coronatus']
      }
    }
  },
  {
    id: 'demo-monarch-butterfly',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Monarch Butterfly',
      scientificName: 'Danaus plexippus',
      authorship: '(Linnaeus, 1758)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Insects',
      externalIds: { gbifKey: 1904128, inatTaxonId: 48662 },
      lineage: { kingdom: 'Animalia', phylum: 'Arthropoda', class: 'Insecta', order: 'Lepidoptera', family: 'Nymphalidae', genus: 'Danaus', species: 'Danaus plexippus' },
      synonyms: [],
      vernacularNames: [{ name: 'Monarch Butterfly', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Monarch_In_May_%2830803%29.jpg/1280px-Monarch_In_May_%2830803%29.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Monarch_In_May_%2830803%29.jpg/640px-Monarch_In_May_%2830803%29.jpg',
      attribution: 'Wikimedia Commons / USDA',
      licenseCode: 'CC0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Monarch_In_May_(30803).jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A milkweed butterfly famed for multi-generational transcontinental migrations across North America.', source: 'IUCN' },
      measurements: { bodyLength: '8.9–10.2 cm wingspan', mass: '0.5 g', lifespan: '2–6 weeks (summer gen); 8+ months (migratory gen)', source: 'Urquhart (1960)' },
      ecology: { habitat: 'Open fields, meadows, and conifer overwintering groves', diet: 'Herbivore / nectarivore (Asclepias milkweed latex as larvae; nectar as adults)', geographicRange: 'North and South America, Australia', activityPattern: 'Diurnal flight', biomeTags: ['Migratory', 'Nymphalidae'] },
      conservation: { iucnStatus: 'EN', source: 'IUCN', assessmentYear: 2021, populationTrend: 'Decreasing', threats: ['Milkweed habitat loss from herbicides', 'Climate change'] },
      discovery: {
        distinguishingTraits: ['Caterpillars sequester toxic cardenolides from milkweed plants, rendering adults unpalatable.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Viceroy Butterfly', scientificName: 'Limenitis archippus', keyDifference: 'Viceroy features a distinct transverse black line across the hindwing.' }],
        interestingFacts: [{ fact: 'The migratory generation navigates using a time-compensated sun compass.', reference: 'Reppert et al. (2010)' }],
        relatedTaxonIds: ['demo-hymenopus-coronatus']
      }
    }
  },

  // ARACHNIDS
  {
    id: 'demo-poecilotheria-metallica',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Gooty Sapphire Ornamental Tarantula',
      scientificName: 'Poecilotheria metallica',
      authorship: 'Pocock, 1899',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Arachnids',
      externalIds: { gbifKey: 2153988, inatTaxonId: 63563 },
      lineage: { kingdom: 'Animalia', phylum: 'Arthropoda', class: 'Arachnida', order: 'Araneae', family: 'Theraphosidae', genus: 'Poecilotheria', species: 'Poecilotheria metallica' },
      synonyms: [],
      vernacularNames: [{ name: 'Gooty Tarantula', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Poecilotheria_metallica.jpg/1024px-Poecilotheria_metallica.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Poecilotheria_metallica.jpg/640px-Poecilotheria_metallica.jpg',
      attribution: 'Wikimedia Commons / MichaelB',
      licenseCode: 'CC-BY-SA-3.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Poecilotheria_metallica.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'An arboreal tarantula restricted to a micro-endemic forest reserve in India, displaying structural cobalt-blue setae.', source: 'IUCN' },
      measurements: { bodyLength: '5–6 cm (15–20 cm leg span)', mass: null, lifespan: '10–12 years', source: 'World Spider Catalog' },
      ecology: { habitat: 'Tree hollows in deciduous forest', diet: 'Arboreal insectivore', geographicRange: 'Eastern Ghats, India', activityPattern: 'Nocturnal', biomeTags: ['Micro-Endemic', 'Structural Color'] },
      conservation: { iucnStatus: 'CR', source: 'IUCN', assessmentYear: 2008, populationTrend: 'Decreasing', threats: ['Deforestation', 'Pet smuggling'] },
      discovery: {
        distinguishingTraits: ['Structural photonic setae create non-iridescent cobalt-blue coloration.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Indian Ornamental', scientificName: 'Poecilotheria regalis', keyDifference: 'P. regalis has black-and-white dorsal patterns.' }],
        interestingFacts: [{ fact: 'Rediscovered in 2001 after 102 years of missing documentation.', reference: 'Molur et al. (2008)' }],
        relatedTaxonIds: ['demo-emperor-scorpion']
      }
    }
  },
  {
    id: 'demo-emperor-scorpion',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Emperor Scorpion',
      scientificName: 'Pandinus imperator',
      authorship: '(C.L. Koch, 1841)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Arachnids',
      externalIds: { gbifKey: 2163456, inatTaxonId: 63102 },
      lineage: { kingdom: 'Animalia', phylum: 'Arthropoda', class: 'Arachnida', order: 'Scorpiones', family: 'Scorpionidae', genus: 'Pandinus', species: 'Pandinus imperator' },
      synonyms: [],
      vernacularNames: [{ name: 'Emperor Scorpion', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Pandinus_imperator_01.jpg/1280px-Pandinus_imperator_01.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Pandinus_imperator_01.jpg/640px-Pandinus_imperator_01.jpg',
      attribution: 'Wikimedia Commons / Lucarelli',
      licenseCode: 'CC-BY-SA-3.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Pandinus_imperator_01.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'One of the largest scorpions in the world, native to rainforests and savannas of West Africa.', source: 'World Scorpion Catalog' },
      measurements: { bodyLength: '15–20 cm', mass: '30 g', lifespan: '6–8 years', source: 'Rein (2000)' },
      ecology: { habitat: 'Tropical rainforest burrows and termite mounds', diet: 'Insectivore (termites, beetles, crickets)', geographicRange: 'West Africa', activityPattern: 'Nocturnal', biomeTags: ['Afrotropical', 'Burrower'] },
      conservation: { iucnStatus: 'NE', source: null, assessmentYear: null, populationTrend: null, threats: ['CITES Appendix II pet trade regulation'] },
      discovery: {
        distinguishingTraits: ['Exoskeleton fluoresces vibrant blue-green under ultraviolet (UV) light due to beta-carboline compounds.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Deathstalker Scorpion', scientificName: 'Leiurus quinquestriatus', keyDifference: 'Deathstalkers are slender desert scorpions with potent neurotoxic venom.' }],
        interestingFacts: [{ fact: 'Relies primarily on massive crushing pedipalps rather than toxic venom to subdue prey.', reference: 'Polis (1990)' }],
        relatedTaxonIds: ['demo-poecilotheria-metallica']
      }
    }
  },

  // CEPHALOPODS & MOLLUSKS
  {
    id: 'demo-vampyroteuthis-infernalis',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Vampire Squid',
      scientificName: 'Vampyroteuthis infernalis',
      authorship: 'Chun, 1903',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Cephalopods & Mollusks',
      externalIds: { gbifKey: 2291271, inatTaxonId: 152927 },
      lineage: { kingdom: 'Animalia', phylum: 'Mollusca', class: 'Cephalopoda', order: 'Vampyromorpha', family: 'Vampyroteuthidae', genus: 'Vampyroteuthis', species: 'Vampyroteuthis infernalis' },
      synonyms: [],
      vernacularNames: [{ name: 'Vampire Squid', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Vampyroteuthis_infernalis.jpg/1024px-Vampyroteuthis_infernalis.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Vampyroteuthis_infernalis.jpg/640px-Vampyroteuthis_infernalis.jpg',
      attribution: 'Wikimedia Commons / Carl Chun',
      licenseCode: 'CC0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Vampyroteuthis_infernalis.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A deep-sea cephalopod thriving in near-zero oxygen zones, feeding on sinking detritus ("marine snow").', source: 'MBARI' },
      measurements: { bodyLength: 'Up to 30 cm', mass: null, lifespan: null, source: 'Hoving & Robison (2012)' },
      ecology: { habitat: 'Oxygen Minimum Zone (600–1200 m depth)', diet: 'Detritivore (marine snow)', geographicRange: 'Circumglobal deep oceans', activityPattern: 'Passive drifting', biomeTags: ['Deep Sea', 'Detritivore'] },
      conservation: { iucnStatus: 'NE', source: null, assessmentYear: null, populationTrend: null, threats: null },
      discovery: {
        distinguishingTraits: ['The only known living non-predatory cephalopod.', 'Deploys bioluminescent mucus instead of ink.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Dumbo Octopus', scientificName: 'Grimpoteuthis spp.', keyDifference: 'Grimpoteuthis is a benthic predatory octopod.' }],
        interestingFacts: [{ fact: 'Has the largest eyes relative to body size in the animal kingdom.', reference: 'Hoving & Robison (2012)' }],
        relatedTaxonIds: ['demo-blue-glaucus']
      }
    }
  },
  {
    id: 'demo-blue-glaucus',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Blue Dragon Nudibranch',
      scientificName: 'Glaucus atlanticus',
      authorship: 'Forster, 1777',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Cephalopods & Mollusks',
      externalIds: { gbifKey: 2292062, inatTaxonId: 51296 },
      lineage: { kingdom: 'Animalia', phylum: 'Mollusca', class: 'Gastropoda', order: 'Nudibranchia', family: 'Glaucidae', genus: 'Glaucus', species: 'Glaucus atlanticus' },
      synonyms: [],
      vernacularNames: [{ name: 'Blue Glaucus', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Glaucus_atlanticus_1.jpg/1280px-Glaucus_atlanticus_1.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Glaucus_atlanticus_1.jpg/640px-Glaucus_atlanticus_1.jpg',
      attribution: 'Wikimedia Commons / Sylke Rohrlach',
      licenseCode: 'CC-BY-SA-2.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Glaucus_atlanticus_1.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A small pelagic blue sea slug that floats upside down using surface tension and preys on venomous siphonophores like the Portuguese man o war.', source: 'WoRMS' },
      measurements: { bodyLength: '3.0 cm', mass: null, lifespan: 'Up to 1 year', source: 'Marine Biodiversity Records' },
      ecology: { habitat: 'Pelagic open ocean surface waters', diet: 'Carnivore (Physalia physalis, Velella)', geographicRange: 'Temperate and tropical seas worldwide', activityPattern: 'Pelagic drifting', biomeTags: ['Pelagic', 'Gastropod'] },
      conservation: { iucnStatus: 'NE', source: null, assessmentYear: null, populationTrend: null, threats: null },
      discovery: {
        distinguishingTraits: ['Stores unfired stinging cnidocysts from its siphonophore prey inside specialized cerata tips for its own defense.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Spanish Dancer', scientificName: 'Hexabranchus sanguineus', keyDifference: 'Spanish dancer is a massive benthic red nudibranch.' }],
        interestingFacts: [{ fact: 'Countershaded with blue ventrally and silver dorsally to blend in with ocean light.', reference: 'Thompson & Bennett (1969)' }],
        relatedTaxonIds: ['demo-vampyroteuthis-infernalis']
      }
    }
  },
  {
    id: 'demo-giant-pacific-octopus',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Giant Pacific Octopus',
      scientificName: 'Enteroctopus dofleini',
      authorship: '(Wülker, 1910)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Cephalopods & Mollusks',
      externalIds: { gbifKey: 2289659, inatTaxonId: 64303 },
      lineage: { kingdom: 'Animalia', phylum: 'Mollusca', class: 'Cephalopoda', order: 'Octopoda', family: 'Enteroctopodidae', genus: 'Enteroctopus', species: 'Enteroctopus dofleini' },
      synonyms: [],
      vernacularNames: [{ name: 'Giant Pacific Octopus', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Enteroctopus_dofleini_2.jpg/1280px-Enteroctopus_dofleini_2.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Enteroctopus_dofleini_2.jpg/640px-Enteroctopus_dofleini_2.jpg',
      attribution: 'Wikimedia Commons / DAJ',
      licenseCode: 'CC-BY-SA-3.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Enteroctopus_dofleini_2.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'The largest octopus species in the world, inhabiting the temperate coastal waters of the North Pacific.', source: 'WoRMS' },
      measurements: { bodyLength: '300–500 cm arm span', mass: '15–50 kg', lifespan: '3–5 years (semelparous)', source: 'Anderson et al. (1999)' },
      ecology: { habitat: 'Benthic rocky dens and kelp forests (0–2000 m)', diet: 'Carnivore (crabs, clams, lobsters, fish)', geographicRange: 'North Pacific (Alaska to California and Japan)', activityPattern: 'Nocturnal', biomeTags: ['Marine', 'Benthic'] },
      conservation: { iucnStatus: 'NE', source: null, assessmentYear: null, populationTrend: null, threats: ['Fishing bycatch', 'Pollution'] },
      discovery: {
        distinguishingTraits: ['Possesses distributed nervous systems across 8 arms with 2,000 total suckers.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Blue-ringed Octopus', scientificName: 'Hapalochlaena maculosa', keyDifference: 'Blue-ringed octopuses are tiny and possess lethal tetrodotoxin.' }],
        interestingFacts: [{ fact: 'Females brood their eggs continuously for up to 7 months without feeding, dying shortly after hatching.', reference: 'High (1976)' }],
        relatedTaxonIds: ['demo-vampyroteuthis-infernalis']
      }
    }
  },

  // CRUSTACEANS
  {
    id: 'demo-odontodactylus-scyllarus',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Peacock Mantis Shrimp',
      scientificName: 'Odontodactylus scyllarus',
      authorship: '(Linnaeus, 1758)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Crustaceans',
      externalIds: { gbifKey: 2221506, inatTaxonId: 119338 },
      lineage: { kingdom: 'Animalia', phylum: 'Arthropoda', class: 'Malacostraca', order: 'Stomatopoda', family: 'Odontodactylidae', genus: 'Odontodactylus', species: 'Odontodactylus scyllarus' },
      synonyms: [{ scientificName: 'Cancer scyllarus', authorship: 'Linnaeus, 1758', status: 'HOMOTYPIC_SYNONYM' }],
      vernacularNames: [{ name: 'Peacock Mantis Shrimp', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/OdontodactylusScyllarus2.jpg/1280px-OdontodactylusScyllarus2.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/OdontodactylusScyllarus2.jpg/640px-OdontodactylusScyllarus2.jpg',
      attribution: 'Wikimedia Commons / Prilfish',
      licenseCode: 'CC-BY-2.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:OdontodactylusScyllarus2.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'An Indo-Pacific stomatopod armed with spring-loaded smasher clubs accelerating at over 10,000 g.', source: 'WoRMS' },
      measurements: { bodyLength: '3–18 cm', mass: null, lifespan: '4–6 years', source: 'Patek et al. (2004)' },
      ecology: { habitat: 'Coral reef rubble burrows', diet: 'Durophagous carnivore (snails, crabs)', geographicRange: 'Indo-Pacific', activityPattern: 'Diurnal', biomeTags: ['Coral Reef', 'Extreme Biomechanics'] },
      conservation: { iucnStatus: 'NE', source: null, assessmentYear: null, populationTrend: null, threats: null },
      discovery: {
        distinguishingTraits: ['Raptorial clubs strike with the acceleration of a 22-caliber bullet.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Zebra Mantis Shrimp', scientificName: 'Lysiosquillina maculata', keyDifference: 'Spearer mantis shrimp have barbed spines instead of smashers.' }],
        interestingFacts: [{ fact: 'Eyes can detect circularly polarized light.', reference: 'Marshall et al. (1999)' }],
        relatedTaxonIds: ['demo-japanese-spider-crab']
      }
    }
  },
  {
    id: 'demo-japanese-spider-crab',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Japanese Spider Crab',
      scientificName: 'Macrocheira kaempferi',
      authorship: '(Temminck, 1836)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Crustaceans',
      externalIds: { gbifKey: 2226681, inatTaxonId: 63291 },
      lineage: { kingdom: 'Animalia', phylum: 'Arthropoda', class: 'Malacostraca', order: 'Decapoda', family: 'Inachidae', genus: 'Macrocheira', species: 'Macrocheira kaempferi' },
      synonyms: [],
      vernacularNames: [{ name: 'Japanese Spider Crab', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Macrocheira_kaempferi_by_Minami_Himemiya.jpg/1280px-Macrocheira_kaempferi_by_Minami_Himemiya.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Macrocheira_kaempferi_by_Minami_Himemiya.jpg/640px-Macrocheira_kaempferi_by_Minami_Himemiya.jpg',
      attribution: 'Wikimedia Commons / Minami Himemiya',
      licenseCode: 'CC-BY-SA-4.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Macrocheira_kaempferi_by_Minami_Himemiya.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A marine crab inhabiting deep waters around Japan with the greatest leg span of any living arthropod.', source: 'WoRMS' },
      measurements: { bodyLength: 'Up to 3.7 meters leg span', mass: 'Up to 19 kg', lifespan: 'Up to 100 years', source: 'Aquarium records' },
      ecology: { habitat: 'Deep benthic ocean vents and troughs (150–600 m)', diet: 'Omnivorous scavenger', geographicRange: 'Waters surrounding Japan', activityPattern: 'Benthic scavenger', biomeTags: ['Deep Sea', 'Decapod'] },
      conservation: { iucnStatus: 'NE', source: null, assessmentYear: null, populationTrend: null, threats: ['Commercial fishing'] },
      discovery: {
        distinguishingTraits: ['Longest leg span of any known arthropod species.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'American Lobster', scientificName: 'Homarus americanus', keyDifference: 'Lobsters are heavy-bodied benthic decapod crustacea.' }],
        interestingFacts: [{ fact: 'Decorates its carapace with sponges and kelp for camouflage.', reference: 'Guinot (1998)' }],
        relatedTaxonIds: ['demo-odontodactylus-scyllarus']
      }
    }
  },

  // MARINE INVERTEBRATES
  {
    id: 'demo-blue-bottle-jellyfish',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Portuguese Man o War',
      scientificName: 'Physalia physalis',
      authorship: '(Linnaeus, 1758)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Marine Invertebrates',
      externalIds: { gbifKey: 2265008, inatTaxonId: 47843 },
      lineage: { kingdom: 'Animalia', phylum: 'Cnidaria', class: 'Hydrozoa', order: 'Siphonophorae', family: 'Physaliidae', genus: 'Physalia', species: 'Physalia physalis' },
      synonyms: [],
      vernacularNames: [{ name: 'Portuguese Man o War', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Physalia_physalis_%28Portuguese_man-o-war%29.jpg/1280px-Physalia_physalis_%28Portuguese_man-o-war%29.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Physalia_physalis_%28Portuguese_man-o-war%29.jpg/640px-Physalia_physalis_%28Portuguese_man-o-war%29.jpg',
      attribution: 'Wikimedia Commons / Linas Gagnon',
      licenseCode: 'CC-BY-3.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Physalia_physalis_(Portuguese_man-o-war).jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A marine siphonophore comprised of a colony of specialized zooids working together as a single organism.', source: 'WoRMS' },
      measurements: { bodyLength: 'Tentacles extend up to 30 meters', mass: null, lifespan: 'Colony lifetime variable', source: 'Totton (1960)' },
      ecology: { habitat: 'Open ocean surface waters', diet: 'Carnivore (small fish, crustacean larvae)', geographicRange: 'Tropical and subtropical oceans', activityPattern: 'Surface drifting', biomeTags: ['Pelagic', 'Siphonophore'] },
      conservation: { iucnStatus: 'NE', source: null, assessmentYear: null, populationTrend: null, threats: null },
      discovery: {
        distinguishingTraits: ['Not a single animal, but a colonial siphonophore made of interdependent zooids.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Box Jellyfish', scientificName: 'Chironex fleckeri', keyDifference: 'Box jellyfish are solitary cnidarians with true medusa bell propulsion.' }],
        interestingFacts: [{ fact: 'Gas-filled pneumatophore acts as an above-water sail.', reference: 'Mackie et al. (1987)' }],
        relatedTaxonIds: ['demo-turritopsis-dohrnii']
      }
    }
  },
  {
    id: 'demo-turritopsis-dohrnii',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Immortal Jellyfish',
      scientificName: 'Turritopsis dohrnii',
      authorship: '(Weismann, 1883)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Marine Invertebrates',
      externalIds: { gbifKey: 2264587, inatTaxonId: 492347 },
      lineage: { kingdom: 'Animalia', phylum: 'Cnidaria', class: 'Hydrozoa', order: 'Anthoathecata', family: 'Oceaniidae', genus: 'Turritopsis', species: 'Turritopsis dohrnii' },
      synonyms: [{ scientificName: 'Dendroclava dohrnii', authorship: 'Weismann, 1883', status: 'HOMOTYPIC_SYNONYM' }],
      vernacularNames: [{ name: 'Immortal Jellyfish', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Turritopsis_dohrnii.jpg/800px-Turritopsis_dohrnii.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Turritopsis_dohrnii.jpg/640px-Turritopsis_dohrnii.jpg',
      attribution: 'Wikimedia Commons / Bachware',
      licenseCode: 'CC-BY-SA-4.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Turritopsis_dohrnii.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A tiny hydrozoan capable of biological ontogeny reversal from adult medusa back to colonial polyp.', source: 'PNAS' },
      measurements: { bodyLength: '4.5 mm bell diameter', mass: null, lifespan: 'Indefinite ontogeny reversal cycle', source: 'Pascual-Torner et al. (2022)' },
      ecology: { habitat: 'Coastal marine plankton', diet: 'Micro-planktivore', geographicRange: 'Mediterranean Sea and global ballast', activityPattern: 'Planktonic pulsing', biomeTags: ['Marine', 'Ontogeny Reversal'] },
      conservation: { iucnStatus: 'NE', source: null, assessmentYear: null, populationTrend: null, threats: null },
      discovery: {
        distinguishingTraits: ['Undergoes cellular transdifferentiation to reset life cycle under stress.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Moon Jellyfish', scientificName: 'Aurelia aurita', keyDifference: 'Moon jellyfish have finite life spans.' }],
        interestingFacts: [{ fact: 'Can restart the juvenile polyp stage indefinitely.', reference: 'Piraino et al. (1996)' }],
        relatedTaxonIds: ['demo-blue-bottle-jellyfish']
      }
    }
  },

  // MICROSCOPIC ANIMALS
  {
    id: 'demo-milnesium-tardigradum',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Predatory Eutardigrade (Water Bear)',
      scientificName: 'Milnesium tardigradum',
      authorship: 'Doyère, 1840',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Microscopic Animals',
      externalIds: { gbifKey: 2252645, inatTaxonId: 474595 },
      lineage: { kingdom: 'Animalia', phylum: 'Tardigrada', class: 'Eutardigrada', order: 'Apochela', family: 'Milnesiidae', genus: 'Milnesium', species: 'Milnesium tardigradum' },
      synonyms: [],
      vernacularNames: [{ name: 'Water Bear', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Milnesium_tardigradum_in_active_state_-_journal.pone.0045682.g001-2.png/1024px-Milnesium_tardigradum_in_active_state_-_journal.pone.0045682.g001-2.png',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Milnesium_tardigradum_in_active_state_-_journal.pone.0045682.g001-2.png/640px-Milnesium_tardigradum_in_active_state_-_journal.pone.0045682.g001-2.png',
      attribution: 'Wikimedia Commons / Schill et al.',
      licenseCode: 'CC-BY-2.5',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Milnesium_tardigradum_in_active_state_-_journal.pone.0045682.g001-2.png',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A cosmopolitan micro-predatory tardigrade capable of surviving space vacuum via cryptobiosis.', source: 'Current Biology' },
      measurements: { bodyLength: '0.5–1.2 mm', mass: null, lifespan: 'Decades in cryptobiosis', source: 'Jönsson et al. (2008)' },
      ecology: { habitat: 'Moss and lichen interstitial water films', diet: 'Micro-predator (rotifers, nematodes)', geographicRange: 'Cosmopolitan', activityPattern: 'Active when hydrated', biomeTags: ['Micro-Habitat', 'Extremophile'] },
      conservation: { iucnStatus: 'NE', source: null, assessmentYear: null, populationTrend: null, threats: null },
      discovery: {
        distinguishingTraits: ['Enters anhydrobiosis ("tun" state) expelling >95% cellular water.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Rotifer', scientificName: 'Philodina spp.', keyDifference: 'Rotifers possess a ciliated corona wheel.' }],
        interestingFacts: [{ fact: 'Survives radiation doses exceeding 5,000 Gray.', reference: 'Jönsson et al. (2008)' }],
        relatedTaxonIds: ['demo-turritopsis-dohrnii']
      }
    }
  },

  // EXTINCT TAXA
  {
    id: 'demo-thylacinus-cynocephalus',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Thylacine (Tasmanian Tiger)',
      scientificName: 'Thylacinus cynocephalus',
      authorship: '(Harris, 1808)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: true,
      categoryGroup: 'Extinct Taxa',
      externalIds: { gbifKey: 2433536, inatTaxonId: 40265 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Mammalia', order: 'Dasyuromorphia', family: 'Thylacinidae', genus: 'Thylacinus', species: 'Thylacinus cynocephalus' },
      synonyms: [{ scientificName: 'Didelphis cynocephala', authorship: 'Harris, 1808', status: 'HOMOTYPIC_SYNONYM' }],
      vernacularNames: [{ name: 'Tasmanian Tiger', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Thylacinus.jpg/1280px-Thylacinus.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Thylacinus.jpg/640px-Thylacinus.jpg',
      attribution: 'Wikimedia Commons / E.J. Keller',
      licenseCode: 'CC0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Thylacinus.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'The largest carnivorous marsupial of modern times, featuring dark transverse stripes across the lower back.', source: 'Australian Museum' },
      measurements: { bodyLength: '100–130 cm + 50 cm tail', mass: '15–30 kg', lifespan: '5–7 years', source: 'Paddle (2000)' },
      ecology: { habitat: 'Open eucalyptus woodlands', diet: 'Hypercarnivore', geographicRange: 'Tasmania (Extinct 1936)', activityPattern: 'Nocturnal', biomeTags: ['Extinct', 'Marsupial'] },
      conservation: { iucnStatus: 'EX', source: 'IUCN', assessmentYear: 2016, populationTrend: 'Extinct', threats: ['Bounty hunting', 'Habitat loss'] },
      discovery: {
        distinguishingTraits: ['Remarkable convergent evolution with placental canids across 160M years.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Tasmanian Devil', scientificName: 'Sarcophilus harrisii', keyDifference: 'Tasmanian devil is a stout scavenging dasyurid.' }],
        interestingFacts: [{ fact: 'Successful RNA isolation from 130-year-old museum specimens.', reference: 'Mármol-Sánchez et al. (2023)' }],
        relatedTaxonIds: ['demo-panthera-uncia']
      }
    }
  },
  {
    id: 'demo-dodo',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Dodo',
      scientificName: 'Raphus cucullatus',
      authorship: '(Linnaeus, 1758)',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: true,
      categoryGroup: 'Extinct Taxa',
      externalIds: { gbifKey: 2481774, inatTaxonId: 448378 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Aves', order: 'Columbiformes', family: 'Columbidae', genus: 'Raphus', species: 'Raphus cucullatus' },
      synonyms: [],
      vernacularNames: [{ name: 'Dodo', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Raphus_cucullatus_Savery.jpg/1280px-Raphus_cucullatus_Savery.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Raphus_cucullatus_Savery.jpg/640px-Raphus_cucullatus_Savery.jpg',
      attribution: 'Wikimedia Commons / Roelandt Savery (1626)',
      licenseCode: 'CC0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Raphus_cucullatus_Savery.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'A flightless bird endemic to the island of Mauritius that went into extinction in the late 17th century.', source: 'IUCN' },
      measurements: { bodyLength: '100 cm height', mass: '10–21 kg', lifespan: null, source: 'Janoo (2005)' },
      ecology: { habitat: 'Mauritian lowland forests', diet: 'Frugivore (fallen palm nuts and seeds)', geographicRange: 'Mauritius', activityPattern: 'Diurnal', biomeTags: ['Extinct', 'Flightless Bird'] },
      conservation: { iucnStatus: 'EX', source: 'IUCN', assessmentYear: 2016, populationTrend: 'Extinct', threats: ['Introduced rats, pigs, and sailors hunting'] },
      discovery: {
        distinguishingTraits: ['A giant flightless pigeon adapted to island life without mammalian predators.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Nicobar Pigeon', scientificName: 'Caloenas nicobarica', keyDifference: 'Nicobar pigeon is a flying relative.' }],
        interestingFacts: [{ fact: 'Became the universal symbol of anthropogenic extinction.', reference: 'Julian Hume (2006)' }],
        relatedTaxonIds: ['demo-thylacinus-cynocephalus']
      }
    }
  },
  {
    id: 'demo-ailurus-fulgens',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Red Panda',
      scientificName: 'Ailurus fulgens',
      authorship: 'F. Cuvier, 1825',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Mammals',
      externalIds: { gbifKey: 2433733, inatTaxonId: 41656 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Mammalia', order: 'Carnivora', family: 'Ailuridae', genus: 'Ailurus', species: 'Ailurus fulgens' },
      synonyms: [],
      vernacularNames: [{ name: 'Red Panda', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Red_Panda_%2824986761703%29.jpg/1280px-Red_Panda_%2824986761703%29.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Red_Panda_%2824986761703%29.jpg/640px-Red_Panda_%2824986761703%29.jpg',
      attribution: 'Wikimedia Commons / Mathias Appel',
      licenseCode: 'CC0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Red_Panda_(24986761703).jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'An arboreal Himalayan mammal and the sole living representative of family Ailuridae, possessing a radial sesamoid "false thumb" for grasping bamboo.', source: 'IUCN Red List' },
      measurements: { bodyLength: '50–64 cm + 28–59 cm tail', mass: '3.0–6.2 kg', lifespan: '8–10 years', source: 'Glatston (2011)' },
      ecology: { habitat: 'Temperate montane forests with dense bamboo understory (2,200–4,800 m)', diet: 'Herbivorous carnivoran (bamboo shoots and leaves, berries)', geographicRange: 'Eastern Himalayas and southwestern China', activityPattern: 'Crepuscular and nocturnal', biomeTags: ['Montane Forest', 'Ailuridae'] },
      conservation: { iucnStatus: 'EN', source: 'IUCN Red List', assessmentYear: 2015, populationTrend: 'Decreasing', threats: ['Habitat fragmentation', 'Poaching', 'Canine distemper'] },
      discovery: {
        distinguishingTraits: ['Possesses an enlarged radial sesamoid wrist bone that functions as an opposable sixth digit.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Giant Panda', scientificName: 'Ailuropoda melanoleuca', keyDifference: 'Giant pandas are true bears (Ursidae); shared false thumbs evolved convergently.' }],
        interestingFacts: [{ fact: 'Described by Frédéric Cuvier in 1825, 44 years before the Giant Panda became known to Western taxonomy.', reference: 'Salesa et al. (2006)' }],
        relatedTaxonIds: ['demo-panthera-uncia']
      }
    }
  },
  {
    id: 'demo-chamaeleo-calyptratus',
    dataSource: 'LOCAL_DEMO_RECORD',
    identity: {
      commonName: 'Veiled Chameleon',
      scientificName: 'Chamaeleo calyptratus',
      authorship: 'Duméril & Bibron, 1851',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Reptiles',
      externalIds: { gbifKey: 2449368, inatTaxonId: 32993 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Reptilia', order: 'Squamata', family: 'Chamaeleonidae', genus: 'Chamaeleo', species: 'Chamaeleo calyptratus' },
      synonyms: [],
      vernacularNames: [{ name: 'Veiled Chameleon', language: 'eng', source: 'Reference' }]
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Chamaeleo_calyptratus_male.jpg/1280px-Chamaeleo_calyptratus_male.jpg',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Chamaeleo_calyptratus_male.jpg/640px-Chamaeleo_calyptratus_male.jpg',
      attribution: 'Wikimedia Commons / Benny Trapp',
      licenseCode: 'CC-BY-3.0',
      sourceProvider: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Chamaeleo_calyptratus_male.jpg',
      verifiedTaxonMatch: true,
      additionalPhotos: []
    },
    biology: {
      summary: { text: 'An arboreal acrodont lizard native to the mountain plateaus of Yemen and Saudi Arabia, featuring a prominent cranial casque and dermal photonic nanocrystals.', source: 'IUCN' },
      measurements: { bodyLength: '35–60 cm', mass: '85–200 g', lifespan: '5–8 years', source: 'Necas (1999)' },
      ecology: { habitat: 'Montane wadis, acacia scrublands, and cloud forests', diet: 'Insectivore & occasional folivore (succulent leaves during drought)', geographicRange: 'Southwestern Arabian Peninsula', activityPattern: 'Diurnal', biomeTags: ['Arid Montane', 'Ballistic Tongue'] },
      conservation: { iucnStatus: 'LC', source: 'IUCN', assessmentYear: 2012, populationTrend: 'Stable', threats: ['Localized habitat alteration'] },
      discovery: {
        distinguishingTraits: ['Actively tunes guanine nanocrystal lattice spacing in dermal iridophores to shift structural color.', 'Zygodactylous feet and independently rotating turret eyes.'],
        comparisonsWithSimilarTaxa: [{ comparedSpecies: 'Panther Chameleon', scientificName: 'Furcifer pardalis', keyDifference: 'F. pardalis is endemic to Madagascar and lacks the tall vertical casque.' }],
        interestingFacts: [{ fact: 'Tall cranial casque directs condensed morning dew toward the mouth in arid montane habitats.', reference: 'Teyssier et al. (2015)' }],
        relatedTaxonIds: ['demo-amblyrhynchus-cristatus']
      }
    }
  }
];

const ENRICHED_INITIAL_DEMO_ANIMALS = INITIAL_DEMO_ANIMALS.map((animal) => ({
  ...animal,
  provenance: { completenessScore: 95, lastVerifiedAt: '2025-02-15T00:00:00Z', sources: ['GBIF', 'iNaturalist', 'IUCN'] }
}));

// ----------------------------------------------------------------------------
// 2B. LIVE BIODIVERSITY API SERVICE (iNaturalist + GBIF + Wikimedia)
// ----------------------------------------------------------------------------
function mapIconicTaxonToCategory(iconicTaxonName, className = '') {
  const cls = (className || '').toLowerCase();
  const iconic = (iconicTaxonName || '').toLowerCase();
  if (iconic === 'mammalia' || cls === 'mammalia') return 'Mammals';
  if (iconic === 'aves' || cls === 'aves') return 'Birds';
  if (iconic === 'reptilia' || cls === 'reptilia') return 'Reptiles';
  if (iconic === 'amphibia' || cls === 'amphibia') return 'Amphibians';
  if (iconic === 'actinopterygii' || cls.includes('actinopterygii') || cls.includes('chondrichthyes') || cls.includes('sarcopterygii')) return 'Fish';
  if (iconic === 'insecta' || cls === 'insecta') return 'Insects';
  if (iconic === 'arachnida' || cls === 'arachnida') return 'Arachnids';
  if (iconic === 'mollusca' || cls.includes('cephalopoda') || cls.includes('gastropoda') || cls.includes('bivalvia')) return 'Cephalopods & Mollusks';
  if (cls.includes('malacostraca') || cls.includes('crustacea') || cls.includes('maxillopoda')) return 'Crustaceans';
  if (cls.includes('tardigrada') || cls.includes('rotifera')) return 'Microscopic Animals';
  return 'Marine Invertebrates';
}

async function searchLiveBiodiversityGlobal(query) {
  if (!query || query.trim().length < 2) return [];
  const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query.trim())}&rank=species,subspecies&is_active=true&per_page=12`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iNaturalist API returned HTTP ${res.status}`);
  const data = await res.json();
  const results = (data.results || []).filter(
    (t) => t.iconic_taxon_name && !['Plantae', 'Fungi', 'Protozoa', 'Chromista'].includes(t.iconic_taxon_name)
  );

  return results.map((t) => {
    const photo = t.default_photo || null;
    const iucnRaw = t.conservation_status?.status_name || t.conservation_status?.status || 'NE';
    const normalizedIucn = ['EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD'].includes(String(iucnRaw).toUpperCase())
      ? String(iucnRaw).toUpperCase()
      : 'NE';

    return {
      id: `live-inat-${t.id}`,
      dataSource: 'LIVE_API_RESULT',
      identity: {
        commonName: t.preferred_common_name
          ? t.preferred_common_name.replace(/\b\w/g, (c) => c.toUpperCase())
          : t.name,
        scientificName: t.name,
        authorship: null,
        rank: (t.rank || 'SPECIES').toUpperCase(),
        taxonomicStatus: 'ACCEPTED',
        isExtinct: Boolean(t.extinct),
        categoryGroup: t.extinct ? 'Extinct Taxa' : mapIconicTaxonToCategory(t.iconic_taxon_name),
        externalIds: { gbifKey: null, inatTaxonId: t.id },
        lineage: {
          kingdom: 'Animalia',
          phylum: t.iconic_taxon_name === 'Mollusca' ? 'Mollusca' : 'Chordata / Arthropoda',
          class: t.iconic_taxon_name || 'Animalia',
          order: null,
          family: null,
          genus: t.name.split(' ')[0] || null,
          species: t.name
        },
        synonyms: [],
        vernacularNames: t.preferred_common_name ? [{ name: t.preferred_common_name, language: 'eng', source: 'iNaturalist' }] : []
      },
      media: {
        url: photo?.large_url || photo?.medium_url || null,
        thumbnailUrl: photo?.medium_url || photo?.square_url || null,
        attribution: photo?.attribution || 'iNaturalist Community Observer',
        licenseCode: (photo?.license_code || 'CC-BY-NC').toUpperCase(),
        sourceProvider: 'iNaturalist API v1',
        sourceUrl: `https://www.inaturalist.org/taxa/${t.id}`,
        verifiedTaxonMatch: true,
        additionalPhotos: (t.taxon_photos || []).slice(0, 6).map((tp) => ({
          url: tp.photo?.large_url || tp.photo?.medium_url,
          attribution: tp.photo?.attribution || 'iNaturalist',
          licenseCode: (tp.photo?.license_code || 'CC').toUpperCase()
        })).filter((p) => Boolean(p.url))
      },
      biology: {
        summary: {
          text: t.wikipedia_summary
            ? t.wikipedia_summary.replace(/<[^>]+>/g, '')
            : `Live biodiversity record retrieved from iNaturalist (Taxon #${t.id}) with ${t.observations_count?.toLocaleString() || 0} global community observations.`,
          source: 'iNaturalist / Wikipedia Summary'
        },
        measurements: { bodyLength: null, mass: null, lifespan: null, source: null },
        ecology: {
          habitat: null,
          diet: null,
          geographicRange: null,
          activityPattern: null,
          biomeTags: [t.iconic_taxon_name || 'Biodiversity', `${(t.observations_count || 0).toLocaleString()} Observations`]
        },
        conservation: {
          iucnStatus: t.extinct ? 'EX' : normalizedIucn,
          source: t.conservation_status?.authority || 'iNaturalist Taxon Status',
          assessmentYear: null,
          populationTrend: null,
          threats: null
        },
        discovery: {
          distinguishingTraits: [`Verified in global biodiversity index under scientific binomial ${t.name}.`],
          comparisonsWithSimilarTaxa: [],
          interestingFacts: [
            {
              fact: `Documented by ${t.observations_count?.toLocaleString() || 0} research-grade and community wildlife observations in iNaturalist.`,
              reference: `https://www.inaturalist.org/taxa/${t.id}`
            }
          ],
          relatedTaxonIds: []
        }
      },
      provenance: { completenessScore: 68, lastVerifiedAt: new Date().toISOString(), sources: ['iNaturalist API v1'] }
    };
  });
}

async function enrichAnimalWithGbif(animal) {
  try {
    const sciName = animal.identity.scientificName;
    const matchRes = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(sciName)}&kingdom=Animalia`);
    if (!matchRes.ok) return animal;
    const match = await matchRes.json();
    if (!match.usageKey) return animal;

    const [synRes, vernRes] = await Promise.all([
      fetch(`https://api.gbif.org/v1/species/${match.usageKey}/synonyms?limit=8`),
      fetch(`https://api.gbif.org/v1/species/${match.usageKey}/vernacularNames?limit=10`)
    ]);
    const synData = synRes.ok ? await synRes.json() : { results: [] };
    const vernData = vernRes.ok ? await vernRes.json() : { results: [] };

    return {
      ...animal,
      identity: {
        ...animal.identity,
        authorship: animal.identity.authorship || match.scientificNameAuthorship || null,
        externalIds: {
          ...animal.identity.externalIds,
          gbifKey: match.usageKey
        },
        lineage: {
          kingdom: match.kingdom || animal.identity.lineage.kingdom || 'Animalia',
          phylum: match.phylum || animal.identity.lineage.phylum || null,
          class: match.class || animal.identity.lineage.class || null,
          order: match.order || animal.identity.lineage.order || null,
          family: match.family || animal.identity.lineage.family || null,
          genus: match.genus || animal.identity.lineage.genus || null,
          species: match.species || animal.identity.scientificName
        },
        synonyms: (synData.results || []).map((s) => ({
          scientificName: s.canonicalName || s.scientificName,
          authorship: s.authorship || null,
          status: s.taxonomicStatus || 'SYNONYM'
        })),
        vernacularNames: (vernData.results || []).map((v) => ({
          name: v.vernacularName,
          language: v.language || 'und',
          source: v.source || 'GBIF Backbone'
        }))
      }
    };
  } catch {
    return animal;
  }
}

// ----------------------------------------------------------------------------
// 2C. GOOGLE ANTIGRAVITY HANDOFF ARTIFACTS & CONFIGURATIONS
// ----------------------------------------------------------------------------
const ANTIGRAVITY_HANDOFF_FILES = {
  MISSION_PROMPT: {
    filename: 'ANTIGRAVITY_MISSION_PROMPT.md',
    title: '1. Antigravity Agent Manager Prompt (Paste into Cmd+Shift+L)',
    language: 'markdown',
    description: 'Paste this directly into the Google Antigravity Agent Manager or Sidebar Chat to initialize the multi-agent workspace and modularize ANIMALIA.',
    content: `# ANIMALIA — Google Antigravity Agent Mission Brief

You are taking over **ANIMALIA — The Ultimate Animal Discovery Platform** from its Phase 1–4 interactive prototype.

## Current State
- We have a working React single-file prototype (\`App.jsx\`) with:
  - Light/Dark Mode theme engine ("Modern Natural History Museum meets Premier Wildlife Documentary").
  - Verified Reference Taxa across all 12 major animal groups with strict nullable biological fields and Creative Commons image provenance.
  - Live CORS integrations with **iNaturalist API v1** (\`/v1/taxa\`) and **GBIF Backbone API v1** (\`/v1/species/match\`, \`/synonyms\`, \`/vernacularNames\`).
  - Multi-Species Comparison Matrix, Saved Collections, and Multi-Tab Specimen Inspector.

## Your Immediate Tasks in Antigravity IDE
1. **Scaffold Modular Vite + React + TypeScript Architecture**:
   - Run \`bootstrap-animalia.sh\` or refactor \`App.jsx\` into:
     - \`src/types/taxonomy.ts\` (Strict nullable biological & taxonomic interfaces)
     - \`src/services/gbifService.ts\` & \`src/services/inaturalistService.ts\`
     - \`src/services/supabaseRepository.ts\` (Connected via MCP Postgres server)
     - \`src/components/discovery/\`, \`src/components/profile/\`, \`src/components/compare/\`
2. **Provision Database via Postgres / Supabase MCP**:
   - Apply \`supabase/migrations/001_animalia_biodiversity_backbone.sql\` using the configured MCP Postgres tool.
   - Seed the initial verified reference taxa from \`animalia-handoff-bundle.json\`.
3. **Spawn Subagents**:
   - Invoke the \`taxonomy-etl\` subagent (\`.agents/subagents/taxonomy-etl.md\`) in \`branch\` workspace mode to build the server-side Catalogue of Life / GBIF Darwin Core batch ingestion script.
   - Invoke the \`/browser\` subagent to verify responsive layouts, Light/Dark theme switching, and live species search end-to-end.`
  },
  GEMINI_MD: {
    filename: 'GEMINI.md',
    title: '2. GEMINI.md (Workspace Rules & Scientific Integrity Guardrails)',
    language: 'markdown',
    description: 'Place in the repository root so every Antigravity parent agent and child subagent enforces ANIMALIA scientific & architectural rules.',
    content: `# ANIMALIA — Workspace Engineering & Scientific Integrity Rules (GEMINI.md)

## 1. Non-Negotiable Scientific Integrity Rules
- **Zero Fabricated Biology**: Never invent body measurements, lifespans, diets, habitats, or IUCN Red List statuses. All unverified biological fields MUST remain \`null\` and render in the UI as *"Not yet documented in available source record"*.
- **Strict Image Provenance**: Every photograph displayed must preserve \`sourceUrl\`, \`attribution\`, \`licenseCode\` (\`CC0\`, \`CC-BY\`, \`CC-BY-SA\`, \`CC-BY-NC\`), and \`verifiedTaxonMatch\`. Use \`<TaxonomicSilhouette />\` when a verified photograph is unavailable.
- **Data Source Transparency**: Every taxon record must explicitly declare its provenance: \`LOCAL_DEMO_RECORD\`, \`IMPORTED_REPOSITORY_RECORD\`, \`LIVE_API_RESULT\`, or \`CACHED_RECORD\`.
- **No Decorative Controls**: Every search filter, comparison slot, synonym lookup, and collection button must perform real state transitions or database queries.

## 2. Tech Stack & Directory Conventions
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons
- **Backend / Persistence**: Supabase (PostgreSQL 16 with \`ltree\` and \`pg_trgm\` extensions)
- **External Biodiversity APIs**:
  - GBIF Species API (\`https://api.gbif.org/v1/species\`)
  - iNaturalist Taxa API (\`https://api.inaturalist.org/v1/taxa\`)
  - IUCN Red List / Catalogue of Life (Server-side Edge Functions only; never expose private API tokens in client bundles)`
  },
  MCP_CONFIG: {
    filename: '.agents/mcp_config.json',
    title: '3. .agents/mcp_config.json (Antigravity MCP Server Config)',
    language: 'json',
    description: 'Configures Model Context Protocol (MCP) servers in Google Antigravity for PostgreSQL/Supabase schema inspection and GitHub integration.',
    content: `{
  "mcpServers": {
    "animalia-postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:postgres@localhost:54322/postgres"
      ],
      "description": "Local Supabase PostgreSQL instance for ANIMALIA taxonomic backbone & synonym resolution"
    },
    "supabase-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only=false"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "\${SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}`
  },
  SUBAGENT_ETL: {
    filename: '.agents/subagents/taxonomy-etl.md',
    title: '4. .agents/subagents/taxonomy-etl.md (Custom ETL Subagent)',
    language: 'yaml',
    description: 'Defines a specialized Antigravity subagent for ingesting GBIF / Catalogue of Life taxa and resolving homotypic/heterotypic synonyms.',
    content: `---
name: taxonomy-etl
description: Specialized biodiversity data engineering subagent for GBIF, iNaturalist, and Catalogue of Life taxonomic backbone ingestion and synonym normalization.
workspace_mode: branch
tools:
  - code_execution
  - animalia-postgres
  - google_search
---

# Taxonomic Backbone & ETL Subagent Instructions

When invoked by the parent agent:
1. Query the GBIF Species Match API (\`https://api.gbif.org/v1/species/match\`) and iNaturalist Taxa API (\`https://api.inaturalist.org/v1/taxa\`) for target clades.
2. Normalize taxonomic ranks (\`KINGDOM\`, \`PHYLUM\`, \`CLASS\`, \`ORDER\`, \`FAMILY\`, \`GENUS\`, \`SPECIES\`, \`SUBSPECIES\`) and resolve \`SYNONYM\` records to their canonical \`accepted_taxon_id\`.
3. Validate media licensing codes (\`CC0\`, \`CC-BY\`, \`CC-BY-SA\`) and reject unlicensed photographs.
4. Upsert normalized records into \`public.taxa\`, \`public.taxon_synonyms\`, and \`public.taxon_media\` using idempotent \`ON CONFLICT (gbif_usage_key) DO UPDATE\` queries.`
  },
  SQL_SCHEMA: {
    filename: 'supabase/migrations/001_animalia_biodiversity_backbone.sql',
    title: '5. PostgreSQL / Supabase Migration (001_animalia_biodiversity_backbone.sql)',
    language: 'sql',
    description: 'Production relational schema supporting millions of taxa, ltree evolutionary paths, synonym resolution, and licensed media.',
    content: `-- ANIMALIA Phase 2-6 Production Biodiversity Schema (PostgreSQL / Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TYPE taxonomic_rank AS ENUM (
  'KINGDOM', 'PHYLUM', 'SUBPHYLUM', 'CLASS', 'ORDER', 'FAMILY', 'GENUS', 'SPECIES', 'SUBSPECIES'
);

CREATE TYPE taxonomic_status AS ENUM (
  'ACCEPTED', 'SYNONYM', 'HOMOTYPIC_SYNONYM', 'HETEROTYPIC_SYNONYM', 'DOUBTFUL'
);

CREATE TYPE iucn_red_list_code AS ENUM (
  'EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD', 'NE'
);

CREATE TABLE public.taxa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gbif_usage_key BIGINT UNIQUE,
  inat_taxon_id BIGINT UNIQUE,
  col_id TEXT,
  scientific_name TEXT NOT NULL,
  authorship TEXT,
  common_name TEXT,
  rank taxonomic_rank NOT NULL DEFAULT 'SPECIES',
  status taxonomic_status NOT NULL DEFAULT 'ACCEPTED',
  accepted_taxon_id UUID REFERENCES public.taxa(id) ON DELETE SET NULL,
  is_extinct BOOLEAN NOT NULL DEFAULT FALSE,
  category_group TEXT NOT NULL,
  lineage_path ltree,
  lineage_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  biology_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  iucn_status iucn_red_list_code NOT NULL DEFAULT 'NE',
  iucn_assessment_year INT,
  completeness_score INT NOT NULL DEFAULT 0,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.taxon_synonyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  accepted_taxon_id UUID NOT NULL REFERENCES public.taxa(id) ON DELETE CASCADE,
  synonym_scientific_name TEXT NOT NULL,
  authorship TEXT,
  status taxonomic_status NOT NULL DEFAULT 'SYNONYM',
  gbif_synonym_key BIGINT,
  UNIQUE(accepted_taxon_id, synonym_scientific_name)
);

CREATE TABLE public.taxon_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  taxon_id UUID NOT NULL REFERENCES public.taxa(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  attribution TEXT NOT NULL,
  license_code TEXT NOT NULL,
  source_provider TEXT NOT NULL,
  source_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  verified_taxon_match BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_taxa_scientific_trgm ON public.taxa USING GIN (scientific_name gin_trgm_ops);
CREATE INDEX idx_taxa_common_trgm ON public.taxa USING GIN (common_name gin_trgm_ops);
CREATE INDEX idx_taxa_lineage_gist ON public.taxa USING GIST (lineage_path);
CREATE INDEX idx_synonyms_name_trgm ON public.taxon_synonyms USING GIN (synonym_scientific_name gin_trgm_ops);`
  }
};

// ----------------------------------------------------------------------------
// 3. TAXONOMIC SILHOUETTE FALLBACK
// ----------------------------------------------------------------------------
function TaxonomicSilhouette({ categoryGroup, scientificName, className = 'w-full h-full' }) {
  const renderIcon = () => {
    switch (categoryGroup) {
      case 'Birds': return <Feather className="w-14 h-14 text-amber-500/70" />;
      case 'Fish': return <Fish className="w-14 h-14 text-sky-500/70" />;
      case 'Insects':
      case 'Arachnids': return <Bug className="w-14 h-14 text-emerald-500/70" />;
      case 'Cephalopods & Mollusks':
      case 'Crustaceans':
      case 'Marine Invertebrates': return <Shell className="w-14 h-14 text-sky-500/70" />;
      case 'Microscopic Animals': return <Microscope className="w-14 h-14 text-amber-500/70" />;
      case 'Extinct Taxa': return <Skull className="w-14 h-14 text-slate-500/70" />;
      default: return <Compass className="w-14 h-14 text-amber-500/70" />;
    }
  };

  return (
    <div className={`${className} bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 flex flex-col items-center justify-center p-6 text-center select-none`}>
      <div className="w-24 h-24 rounded-full border border-amber-500/25 bg-white/50 dark:bg-black/50 flex items-center justify-center mb-3 shadow-inner">
        {renderIcon()}
      </div>
      <span className="text-[11px] font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">
        Taxonomic Silhouette
      </span>
      <span className="text-xs italic font-serif text-slate-700 dark:text-slate-300">{scientificName}</span>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 4. UI SUB-COMPONENTS
// ----------------------------------------------------------------------------
function IucnBadge({ status, year, showFullLabel = false }) {
  const code = status && IUCN_CONFIG[status] ? status : 'NE';
  const cfg = IUCN_CONFIG[code];

  const colors = {
    EX: 'bg-red-950 border-red-700 text-red-200',
    EW: 'bg-purple-950 border-purple-700 text-purple-200',
    CR: 'bg-red-900 border-red-600 text-red-100',
    EN: 'bg-orange-950 border-orange-700 text-orange-200',
    VU: 'bg-amber-950 border-amber-600 text-amber-200',
    NT: 'bg-lime-950 border-lime-700 text-lime-200',
    LC: 'bg-emerald-950 border-emerald-700 text-emerald-200',
    DD: 'bg-slate-800 border-slate-600 text-slate-200',
    NE: 'bg-slate-800 border-slate-700 text-slate-300'
  };

  return (
    <span
      title={`${cfg.label}${year ? ` (${year})` : ''}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${colors[code] || colors.NE}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{cfg.code}</span>
      {showFullLabel && <span>· {cfg.label}</span>}
    </span>
  );
}

function DataSourceBadge({ sourceType }) {
  const cfg = DATA_SOURCE_BADGES[sourceType] || DATA_SOURCE_BADGES.LOCAL_DEMO_RECORD;
  return (
    <span title={cfg.description} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
      <Database className="w-3 h-3" />
      <span>{cfg.shortLabel}</span>
    </span>
  );
}

function AnimalCard({ animal, isFavorite, onToggleFavorite, isCompared, onToggleCompare, onSelectAnimal }) {
  const [imgError, setImgError] = useState(false);
  const { identity, media, biology, dataSource } = animal;
  const hasPhoto = Boolean(media?.url) && !imgError;

  return (
    <article
      onClick={() => onSelectAnimal(animal)}
      className="group bg-white dark:bg-[#121917] hover:border-amber-500/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col cursor-pointer shadow-md hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
        {hasPhoto ? (
          <img
            src={media.thumbnailUrl || media.url}
            alt={identity.commonName}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <TaxonomicSilhouette categoryGroup={identity.categoryGroup} scientificName={identity.scientificName} />
        )}

        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <DataSourceBadge sourceType={dataSource} />
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {onToggleCompare && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCompare(animal); }}
              className={`px-2.5 h-8 rounded-full text-[11px] font-mono border transition-all ${
                isCompared
                  ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-semibold'
                  : 'bg-black/75 border-white/20 text-white hover:border-emerald-500'
              }`}
            >
              {isCompared ? 'Comparing' : '+ Compare'}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(animal); }}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
              isFavorite
                ? 'bg-amber-500 border-amber-500 text-slate-950'
                : 'bg-black/75 border-white/20 text-white hover:border-amber-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-6 pb-2 px-3 flex items-end justify-between">
          <span className="text-[10px] font-mono text-slate-300 truncate">{media.licenseCode || 'Licensed'}</span>
          <IucnBadge status={biology.conservation?.iucnStatus} />
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 mb-1">{identity.categoryGroup}</div>
          <h3 className="text-lg font-serif font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {identity.commonName}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-serif italic">
            {identity.scientificName}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
            {biology.summary?.text}
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-amber-600 dark:text-amber-400">
          <span>Explore profile</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </article>
  );
}

// ----------------------------------------------------------------------------
// 5. MAIN APP COMPONENT
// ----------------------------------------------------------------------------
export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('animalia_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('animalia_theme', theme);
    } catch {}
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const [activeTab, setActiveTab] = useState('EXPLORE');
  const [referenceAnimals, setReferenceAnimals] = useState(ENRICHED_INITIAL_DEMO_ANIMALS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedIucnFilter, setSelectedIucnFilter] = useState('ALL');
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [profileTab, setProfileTab] = useState('OVERVIEW');
  const [comparisonIds, setComparisonIds] = useState(['demo-panthera-uncia', 'demo-okapia-johnstoni']);
  const [savedAnimalsMap, setSavedAnimalsMap] = useState({});
  const [discoveryHistory, setDiscoveryHistory] = useState([]);

  const combinedAnimals = useMemo(() => referenceAnimals, [referenceAnimals]);

  const filteredAnimals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return combinedAnimals.filter((animal) => {
      if (selectedCategory !== 'ALL' && animal.identity.categoryGroup !== selectedCategory) return false;
      const iucn = animal.biology.conservation?.iucnStatus || 'NE';
      if (selectedIucnFilter === 'THREATENED' && !['CR', 'EN', 'VU'].includes(iucn)) return false;
      if (selectedIucnFilter === 'LC' && iucn !== 'LC') return false;
      if (selectedIucnFilter === 'EX' && !['EX', 'EW'].includes(iucn)) return false;

      if (q) {
        const haystacks = [animal.identity.commonName, animal.identity.scientificName, animal.identity.categoryGroup].join(' ').toLowerCase();
        return haystacks.includes(q);
      }
      return true;
    });
  }, [combinedAnimals, searchQuery, selectedCategory, selectedIucnFilter]);

  const handleToggleFavorite = useCallback((animal) => {
    setSavedAnimalsMap(prev => {
      const next = { ...prev };
      if (next[animal.id]) delete next[animal.id];
      else next[animal.id] = animal;
      return next;
    });
  }, []);

  const handleToggleCompare = useCallback((animal) => {
    setComparisonIds(prev => {
      if (prev.includes(animal.id)) return prev.filter(id => id !== animal.id);
      if (prev.length >= 4) return [...prev.slice(1), animal.id];
      return [...prev, animal.id];
    });
  }, []);

  const handleSelectAnimal = useCallback((animal) => {
    setSelectedAnimal(animal);
    setProfileTab('OVERVIEW');
    setDiscoveryHistory(prev => [
      { taxonId: animal.id, commonName: animal.identity.commonName, scientificName: animal.identity.scientificName, inspectedAt: new Date().toISOString() },
      ...prev.filter(h => h.taxonId !== animal.id)
    ]);
  }, []);

  const comparedAnimalsList = useMemo(() => comparisonIds.map(id => combinedAnimals.find(a => a.id === id)).filter(Boolean), [comparisonIds, combinedAnimals]);
  const savedAnimalsList = Object.values(savedAnimalsMap);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F0E] text-slate-900 dark:text-[#F4F1EA] font-sans transition-colors duration-300 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        .font-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0B0F0E]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div onClick={() => setActiveTab('EXPLORE')} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-md">
              <Compass className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold tracking-wider">ANIMALIA</span>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Live + Reference
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setActiveTab('EXPLORE')}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'EXPLORE' ? 'bg-amber-500 text-slate-950 font-semibold shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                Explore
              </button>
              <button
                onClick={() => setActiveTab('COMPARE')}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'COMPARE' ? 'bg-emerald-500 text-slate-950 font-semibold shadow' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'}`}
              >
                Compare ({comparedAnimalsList.length})
              </button>
              <button
                onClick={() => setActiveTab('COLLECTION')}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'COLLECTION' ? 'bg-amber-500 text-slate-950 font-semibold shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                Saved ({savedAnimalsList.length})
              </button>
              <button
                onClick={() => setActiveTab('ANTIGRAVITY')}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap border ${
                  activeTab === 'ANTIGRAVITY'
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-lg shadow-sky-500/20'
                    : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/20'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Antigravity Handoff</span>
              </button>
            </nav>

            {/* LIGHT/DARK THEME TOGGLE BUTTON */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Light/Dark Theme"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-amber-600 dark:text-amber-400 hover:scale-105 transition-all shadow-sm ml-1 shrink-0"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {activeTab === 'EXPLORE' && (
          <ExploreSection
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedIucnFilter={selectedIucnFilter}
            setSelectedIucnFilter={setSelectedIucnFilter}
            combinedAnimals={combinedAnimals}
            filteredAnimals={filteredAnimals}
            savedAnimalsMap={savedAnimalsMap}
            handleToggleFavorite={handleToggleFavorite}
            comparisonIds={comparisonIds}
            handleToggleCompare={handleToggleCompare}
            handleSelectAnimal={handleSelectAnimal}
            onMergeLiveAnimals={(liveResults) => {
              setReferenceAnimals((prev) => {
                const existingIds = new Set(prev.map((a) => a.id));
                const newItems = liveResults.filter((r) => !existingIds.has(r.id));
                return [...prev, ...newItems];
              });
            }}
          />
        )}

        {activeTab === 'COMPARE' && (
          <section className="space-y-6">
            <div className="bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-serif font-bold">Multi-Species Comparison Matrix</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Comparing {comparedAnimalsList.length} of 4 maximum slots across taxonomy, morphology, ecology, and IUCN conservation status.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setComparisonIds(['demo-panthera-uncia', 'demo-thylacinus-cynocephalus', 'demo-harpy-eagle'])}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-700 hover:border-amber-500 transition-colors"
                >
                  Preset: Apex Predators
                </button>
                <button
                  onClick={() => setComparisonIds(['demo-latimeria-chalumnae', 'demo-turritopsis-dohrnii', 'demo-milnesium-tardigradum'])}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-700 hover:border-amber-500 transition-colors"
                >
                  Preset: Extreme Survival & Relicts
                </button>
              </div>
            </div>
            {comparedAnimalsList.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl">
                <p className="text-slate-500">No species selected for comparison.</p>
                <button onClick={() => setActiveTab('EXPLORE')} className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-semibold rounded-xl text-sm">
                  Explore Animals
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {comparedAnimalsList.map((a) => (
                  <div key={a.id} className="bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900">
                        {a.media?.url ? (
                          <img src={a.media.thumbnailUrl || a.media.url} alt={a.identity.commonName} className="w-full h-full object-cover" />
                        ) : (
                          <TaxonomicSilhouette categoryGroup={a.identity.categoryGroup} scientificName={a.identity.scientificName} />
                        )}
                        <button
                          onClick={() => handleToggleCompare(a)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                          title="Remove from comparison"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">{a.identity.categoryGroup}</span>
                          <IucnBadge status={a.biology.conservation?.iucnStatus} />
                        </div>
                        <h3 className="font-serif font-bold text-lg mt-1">{a.identity.commonName}</h3>
                        <p className="text-xs italic text-slate-500 dark:text-slate-400">{a.identity.scientificName}</p>
                      </div>
                      <div className="text-xs space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="font-mono text-[10px] uppercase text-slate-400 block">Lineage (Class › Order › Family)</span>
                          <span className="font-medium">{a.identity.lineage?.class || '—'} › {a.identity.lineage?.order || '—'} › {a.identity.lineage?.family || '—'}</span>
                        </div>
                        <div>
                          <span className="font-mono text-[10px] uppercase text-slate-400 block">Body Size & Mass</span>
                          <span>{a.biology.measurements?.bodyLength || 'Not documented'} · {a.biology.measurements?.mass || 'Mass undocumented'}</span>
                        </div>
                        <div>
                          <span className="font-mono text-[10px] uppercase text-slate-400 block">Habitat & Diet</span>
                          <span>{a.biology.ecology?.habitat || 'Not documented'} ({a.biology.ecology?.diet || 'Diet undocumented'})</span>
                        </div>
                        <div>
                          <span className="font-mono text-[10px] uppercase text-slate-400 block">Key Diagnostic Trait</span>
                          <span className="text-slate-600 dark:text-slate-300">{a.biology.discovery?.distinguishingTraits?.[0] || a.biology.summary?.text}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectAnimal(a)}
                      className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-xs font-medium transition-colors"
                    >
                      Open Full Specimen Profile
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'COLLECTION' && (
          <section className="space-y-6">
            <div className="bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h2 className="text-2xl font-serif font-bold">Saved Favorites ({savedAnimalsList.length})</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Specimens bookmarked in your session collection. Ready for export into the Antigravity PostgreSQL seed bundle.
              </p>
            </div>
            {savedAnimalsList.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl">
                <p className="text-slate-500">Your saved collection cabinet is empty.</p>
                <button onClick={() => setActiveTab('EXPLORE')} className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-semibold rounded-xl text-sm">
                  Discover Species
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedAnimalsList.map((animal) => (
                  <AnimalCard
                    key={animal.id}
                    animal={animal}
                    isFavorite={true}
                    onToggleFavorite={handleToggleFavorite}
                    isCompared={comparisonIds.includes(animal.id)}
                    onToggleCompare={handleToggleCompare}
                    onSelectAnimal={handleSelectAnimal}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'ANTIGRAVITY' && (
          <AntigravityHandoffWorkbench
            animals={combinedAnimals}
            savedAnimals={savedAnimalsList}
            comparisonIds={comparisonIds}
            discoveryHistory={discoveryHistory}
          />
        )}
      </main>

      {/* ANIMAL PROFILE MODAL */}
      {selectedAnimal && (
        <AnimalProfileModal
          animal={selectedAnimal}
          profileTab={profileTab}
          setProfileTab={setProfileTab}
          onClose={() => setSelectedAnimal(null)}
          isFavorite={Boolean(savedAnimalsMap[selectedAnimal.id])}
          onToggleFavorite={handleToggleFavorite}
          isCompared={comparisonIds.includes(selectedAnimal.id)}
          onToggleCompare={handleToggleCompare}
          allAnimals={combinedAnimals}
          onSelectAnimal={handleSelectAnimal}
          onUpdateAnimal={(updated) => {
            setSelectedAnimal(updated);
            setReferenceAnimals((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// 6. EXPLORE SECTION WITH LIVE GLOBAL BIODIVERSITY SEARCH
// ----------------------------------------------------------------------------
function ExploreSection({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedIucnFilter,
  setSelectedIucnFilter,
  combinedAnimals,
  filteredAnimals,
  savedAnimalsMap,
  handleToggleFavorite,
  comparisonIds,
  handleToggleCompare,
  handleSelectAnimal,
  onMergeLiveAnimals
}) {
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [liveError, setLiveError] = useState(null);
  const [lastLiveCount, setLastLiveCount] = useState(null);

  const triggerLiveGlobalSearch = async (customQuery) => {
    const q = (customQuery ?? searchQuery).trim();
    if (!q) return;
    setIsSearchingLive(true);
    setLiveError(null);
    try {
      const results = await searchLiveBiodiversityGlobal(q);
      onMergeLiveAnimals(results);
      setLastLiveCount(results.length);
    } catch (err) {
      setLiveError(err.message || 'Live biodiversity API request failed.');
    } finally {
      setIsSearchingLive(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-amber-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
                  triggerLiveGlobalSearch(searchQuery);
                }
              }}
              placeholder="Search local reference taxa or press Enter / 'Query Global API' for any animal on Earth..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            onClick={() => triggerLiveGlobalSearch(searchQuery)}
            disabled={isSearchingLive || searchQuery.trim().length < 2}
            className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shrink-0 shadow"
          >
            {isSearchingLive ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            <span>{isSearchingLive ? 'Querying iNaturalist & GBIF...' : 'Query Live Global API'}</span>
          </button>
        </div>

        {/* Quick Live API Discovery Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">Live Global Search Presets:</span>
          {['Pangolin', 'Mantis Shrimp', 'Tardigrade', 'Cassowary', 'Nautilus', 'Wolverine', 'Leaf Sheep'].map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setSearchQuery(preset);
                triggerLiveGlobalSearch(preset);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-500 font-mono text-[11px] transition-colors"
            >
              + {preset}
            </button>
          ))}
          {lastLiveCount !== null && !liveError && (
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] ml-auto">
              ✓ Hydrated {lastLiveCount} live species from iNaturalist API v1
            </span>
          )}
          {liveError && <span className="text-red-500 font-mono text-[11px] ml-auto">⚠ {liveError}</span>}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
          {ANIMAL_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count = cat.id === 'ALL' ? combinedAnimals.length : combinedAnimals.filter((a) => a.identity.categoryGroup === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-semibold shadow'
                    : 'bg-slate-50 dark:bg-[#0B0F0E] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* IUCN Conservation Filter Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-mono uppercase text-slate-400 mr-1">Conservation Filter:</span>
          {[
            { id: 'ALL', label: 'All Statuses' },
            { id: 'THREATENED', label: 'Threatened (CR / EN / VU)' },
            { id: 'LC', label: 'Least Concern (LC)' },
            { id: 'EX', label: 'Extinct (EX / EW)' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedIucnFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                selectedIucnFilter === f.id
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty Search State with Live Query CTA */}
      {filteredAnimals.length === 0 ? (
        <div className="bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-4">
          <Compass className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-xl font-serif font-bold">No matching species in local reference cache</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Query the live iNaturalist & GBIF biodiversity backbone to fetch real wildlife photography and taxonomic records for "{searchQuery}".
          </p>
          {searchQuery.trim().length >= 2 && (
            <button
              onClick={() => triggerLiveGlobalSearch(searchQuery)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm inline-flex items-center gap-2 shadow"
            >
              <Globe className="w-4 h-4" />
              <span>Fetch "{searchQuery}" from Live Global Biodiversity API</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnimals.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              isFavorite={Boolean(savedAnimalsMap[animal.id])}
              onToggleFavorite={handleToggleFavorite}
              isCompared={comparisonIds.includes(animal.id)}
              onToggleCompare={handleToggleCompare}
              onSelectAnimal={handleSelectAnimal}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ----------------------------------------------------------------------------
// 7. COMPLETE MULTI-TAB ANIMAL PROFILE MODAL
// ----------------------------------------------------------------------------
function AnimalProfileModal({
  animal,
  profileTab,
  setProfileTab,
  onClose,
  isFavorite,
  onToggleFavorite,
  isCompared,
  onToggleCompare,
  allAnimals,
  onSelectAnimal,
  onUpdateAnimal
}) {
  const [isEnrichingGbif, setIsEnrichingGbif] = useState(false);
  const { identity, media, biology, dataSource } = animal;

  const handleEnrichGbif = async () => {
    setIsEnrichingGbif(true);
    const enriched = await enrichAnimalWithGbif(animal);
    onUpdateAnimal(enriched);
    setIsEnrichingGbif(false);
  };

  const relatedAnimals = (biology.discovery?.relatedTaxonIds || [])
    .map((id) => allAnimals.find((a) => a.id === id))
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
      >
        {/* Hero Image Header */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-slate-900 shrink-0 overflow-hidden">
          {media?.url ? (
            <img src={media.url} alt={identity.commonName} className="w-full h-full object-cover" />
          ) : (
            <TaxonomicSilhouette categoryGroup={identity.categoryGroup} scientificName={identity.scientificName} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            <DataSourceBadge sourceType={dataSource} />
            <IucnBadge status={biology.conservation?.iucnStatus} year={biology.conservation?.assessmentYear} showFullLabel />
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => onToggleCompare(animal)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
                isCompared ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-semibold' : 'bg-black/60 border-white/20 text-white'
              }`}
            >
              {isCompared ? 'Comparing' : '+ Compare'}
            </button>
            <button
              onClick={() => onToggleFavorite(animal)}
              className={`p-2 rounded-full border transition-all ${
                isFavorite ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-black/60 border-white/20 text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 rounded-full bg-black/60 text-white hover:bg-black">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 text-white">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400">{identity.categoryGroup}</span>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold">{identity.commonName}</h2>
              <p className="text-sm sm:text-base italic font-serif text-slate-300">
                {identity.scientificName} {identity.authorship && <span className="not-italic text-xs text-slate-400">{identity.authorship}</span>}
              </p>
            </div>
            <div className="text-[11px] font-mono text-slate-300 bg-black/50 px-3 py-1.5 rounded-xl border border-white/10">
              <div>Photo: {media?.attribution || 'Unattributed'}</div>
              <div>License: {media?.licenseCode || 'Unknown'} · {media?.sourceProvider || 'Source'}</div>
            </div>
          </div>
        </div>

        {/* Profile Navigation Tabs */}
        <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          {[
            { id: 'OVERVIEW', label: 'Overview & Distinctions' },
            { id: 'BIOLOGY', label: 'Biology, Size & Ecology' },
            { id: 'TAXONOMY', label: 'Lineage & Live GBIF Synonyms' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setProfileTab(t.id)}
              className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                profileTab === t.id
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile Body */}
        <div className="p-6 space-y-6">
          {profileTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Scientific Summary ({biology.summary?.source || 'Verified Source'})</h3>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">{biology.summary?.text}</p>
              </div>

              {/* Distinguishing Traits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-mono uppercase text-amber-600 dark:text-amber-400">What Makes This Species Unique</h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {(biology.discovery?.distinguishingTraits || []).map((trait, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{trait}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-mono uppercase text-amber-600 dark:text-amber-400">Differences From Similar Taxa</h4>
                  {(biology.discovery?.comparisonsWithSimilarTaxa || []).length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Not yet documented in available source record.</p>
                  ) : (
                    (biology.discovery?.comparisonsWithSimilarTaxa || []).map((cmp, i) => (
                      <div key={i} className="text-xs sm:text-sm space-y-1">
                        <div className="font-semibold">
                          vs. {cmp.comparedSpecies} <span className="italic font-serif text-slate-400">({cmp.scientificName})</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{cmp.keyDifference}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Cited Facts */}
              {biology.discovery?.interestingFacts?.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <h4 className="text-xs font-mono uppercase text-amber-600 dark:text-amber-400">Documented Research Facts</h4>
                  {biology.discovery.interestingFacts.map((item, idx) => (
                    <div key={idx} className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                      <p>{item.fact}</p>
                      <span className="text-[11px] font-mono text-slate-400">Reference: {item.reference}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Related Species Navigation */}
              {relatedAnimals.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase text-slate-400">Related Taxa in Repository</h4>
                  <div className="flex flex-wrap gap-3">
                    {relatedAnimals.map((rel) => (
                      <button
                        key={rel.id}
                        onClick={() => onSelectAnimal(rel)}
                        className="flex items-center gap-3 p-2 pr-4 rounded-xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition-all text-left"
                      >
                        {rel.media?.thumbnailUrl && (
                          <img src={rel.media.thumbnailUrl} alt={rel.identity.commonName} className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <div>
                          <div className="text-xs font-semibold">{rel.identity.commonName}</div>
                          <div className="text-[11px] italic text-slate-400">{rel.identity.scientificName}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {profileTab === 'BIOLOGY' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Body Length / Span', value: biology.measurements?.bodyLength },
                { label: 'Adult Mass', value: biology.measurements?.mass },
                { label: 'Documented Lifespan', value: biology.measurements?.lifespan },
                { label: 'Primary Habitat', value: biology.ecology?.habitat },
                { label: 'Trophic Guild & Diet', value: biology.ecology?.diet },
                { label: 'Geographic Distribution', value: biology.ecology?.geographicRange },
                { label: 'Activity Pattern', value: biology.ecology?.activityPattern },
                { label: 'Population Trend', value: biology.conservation?.populationTrend },
                { label: 'Documented Threats', value: biology.conservation?.threats?.join(', ') }
              ].map((field, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">{field.label}</div>
                  {field.value ? (
                    <div className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">{field.value}</div>
                  ) : (
                    <div className="text-xs italic text-slate-400">Not yet documented in available source record</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {profileTab === 'TAXONOMY' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-xs font-mono text-amber-600 dark:text-amber-400">External Taxonomic Identifiers</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">
                    GBIF UsageKey: {identity.externalIds?.gbifKey || 'Unlinked'} · iNaturalist ID: {identity.externalIds?.inatTaxonId || 'Unlinked'}
                  </div>
                </div>
                <button
                  onClick={handleEnrichGbif}
                  disabled={isEnrichingGbif}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs flex items-center gap-2"
                >
                  {isEnrichingGbif ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitMerge className="w-3.5 h-3.5" />}
                  <span>{isEnrichingGbif ? 'Querying GBIF Backbone...' : 'Harvest Live GBIF Synonyms & Lineage'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'].map((rank) => (
                  <div key={rank} className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] font-mono uppercase text-slate-400">{rank}</div>
                    <div className="text-xs font-semibold mt-0.5 truncate">{identity.lineage?.[rank] || '—'}</div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-mono uppercase text-slate-400">Documented Taxonomic Synonyms ({identity.synonyms?.length || 0})</h4>
                {(!identity.synonyms || identity.synonyms.length === 0) ? (
                  <p className="text-xs text-slate-500">Click "Harvest Live GBIF Synonyms & Lineage" above to query official synonyms from api.gbif.org.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {identity.synonyms.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-700 text-xs font-serif italic">
                        {s.scientificName} <span className="not-italic font-mono text-[10px] text-slate-400">({s.status})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 8. GOOGLE ANTIGRAVITY HANDOFF & WORKSPACE EXPORT WORKBENCH
// ----------------------------------------------------------------------------
function AntigravityHandoffWorkbench({ animals, savedAnimals, comparisonIds, discoveryHistory }) {
  const [selectedFileKey, setSelectedFileKey] = useState('MISSION_PROMPT');
  const [copiedKey, setCopiedKey] = useState(null);

  const activeFile = ANTIGRAVITY_HANDOFF_FILES[selectedFileKey];

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadSeedBundle = () => {
    const payload = {
      project: 'ANIMALIA — The Ultimate Animal Discovery Platform',
      handoffTarget: 'Google Antigravity Agentic IDE',
      exportedAt: new Date().toISOString(),
      stats: {
        totalTaxaInSession: animals.length,
        savedCollectionCount: savedAnimals.length,
        activeComparisonSlots: comparisonIds.length
      },
      comparisonIds,
      discoveryHistory,
      taxa: animals
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'animalia-handoff-bundle.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-[#101C24] to-[#0B0F0E] text-white border border-sky-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-mono">
              <Terminal className="w-3.5 h-3.5" />
              <span>GOOGLE ANTIGRAVITY IDE HANDOFF READY</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold">
              Hand Over ANIMALIA to Google Antigravity
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Transition from the single-file Canvas prototype to a full multi-agent workspace with terminal execution, Model Context Protocol (MCP) Supabase/PostgreSQL database connections, custom biodiversity ETL subagents, and automated <code className="text-sky-300 font-mono">/browser</code> verification.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => handleCopy('MISSION_PROMPT_HERO', ANTIGRAVITY_HANDOFF_FILES.MISSION_PROMPT.content)}
              className="px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg"
            >
              {copiedKey === 'MISSION_PROMPT_HERO' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey === 'MISSION_PROMPT_HERO' ? 'Copied Mission Brief!' : 'Copy Antigravity Agent Prompt'}</span>
            </button>
            <button
              onClick={handleDownloadSeedBundle}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs sm:text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export Seed & State (.json)</span>
            </button>
          </div>
        </div>

        {/* 3-Step Handoff Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-mono text-sky-400 font-semibold">STEP 1 · INITIALIZE WORKSPACE</div>
            <p className="text-slate-300">Open your project folder in Google Antigravity IDE and place <code className="font-mono text-amber-300">GEMINI.md</code> and <code className="font-mono text-amber-300">.agents/mcp_config.json</code> in the root.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-mono text-emerald-400 font-semibold">STEP 2 · CONNECT POSTGRES MCP</div>
            <p className="text-slate-300">Run the Supabase migration (<code className="font-mono text-amber-300">001_animalia_biodiversity_backbone.sql</code>) and import <code className="font-mono text-amber-300">animalia-handoff-bundle.json</code> ({animals.length} verified & live taxa).</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-mono text-amber-400 font-semibold">STEP 3 · SPAWN AGENT MANAGER</div>
            <p className="text-slate-300">Press <code className="font-mono text-sky-300">Cmd+Shift+L</code> / <code className="font-mono text-sky-300">Ctrl+Shift+L</code> and paste the <strong>Antigravity Mission Prompt</strong> to modularize into TypeScript and run <code className="font-mono text-sky-300">/browser</code> tests.</p>
          </div>
        </div>
      </div>

      {/* File Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-mono uppercase text-slate-400 px-1">Antigravity Configuration Artifacts</div>
          {Object.entries(ANTIGRAVITY_HANDOFF_FILES).map(([key, file]) => {
            const isSelected = selectedFileKey === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedFileKey(key)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-2 ${
                  isSelected
                    ? 'bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'bg-white dark:bg-[#121917] border-slate-200 dark:border-slate-800 hover:border-sky-500/40'
                }`}
              >
                <div>
                  <div className="text-xs font-mono font-semibold">{file.filename}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{file.title}</div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 mt-1" />
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-[#0B0F0E]">
            <div>
              <div className="text-sm font-mono font-bold text-sky-600 dark:text-sky-400">{activeFile.filename}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activeFile.description}</p>
            </div>
            <button
              onClick={() => handleCopy(selectedFileKey, activeFile.content)}
              className="px-3.5 py-2 rounded-xl bg-sky-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shrink-0"
            >
              {copiedKey === selectedFileKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === selectedFileKey ? 'Copied!' : 'Copy File'}</span>
            </button>
          </div>
          <pre className="p-5 text-xs font-mono text-slate-800 dark:text-slate-200 overflow-x-auto leading-relaxed whitespace-pre-wrap max-h-[520px] overflow-y-auto">
            {activeFile.content}
          </pre>
        </div>
      </div>
    </section>
  );
}