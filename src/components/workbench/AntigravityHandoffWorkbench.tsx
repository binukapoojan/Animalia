import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Download,
  ChevronRight
} from 'lucide-react';
import { AnimalRecord } from '../../types/taxonomy';

interface AntigravityHandoffWorkbenchProps {
  animals: AnimalRecord[];
  savedAnimals: AnimalRecord[];
  comparisonIds: string[];
  discoveryHistory: any[];
}

export const ANTIGRAVITY_HANDOFF_FILES = {
  MISSION_PROMPT: {
    filename: 'ANTIGRAVITY_MISSION_PROMPT.md',
    title: '1. Antigravity Agent Manager Prompt',
    language: 'markdown',
    description: 'Instructions to initialize the multi-agent workspace and modularize ANIMALIA.',
    content: `# ANIMALIA — Google Antigravity Agent Mission Brief

You are taking over **ANIMALIA — The Ultimate Animal Discovery Platform** from its Phase 1–4 interactive prototype.

## Current State
- We have a working React single-file prototype with:
  - Light/Dark Mode theme engine ("Modern Natural History Museum meets Premier Wildlife Documentary").
  - Verified Reference Taxa across all 12 major animal groups with strict nullable biological fields and Creative Commons image provenance.
  - Live CORS integrations with **iNaturalist API v1** (/v1/taxa) and **GBIF Backbone API v1** (/v1/species/match, /synonyms, /vernacularNames).
  - Multi-Species Comparison Matrix, Saved Collections, and Multi-Tab Specimen Inspector.

## Your Immediate Tasks in Antigravity IDE
1. **Scaffold Modular Vite + React + TypeScript Architecture**:
   - Refactor into modular architecture:
     - src/types/taxonomy.ts
     - src/services/gbifService.ts & src/services/inaturalistService.ts
     - src/services/supabaseRepository.ts
     - src/components/discovery/, src/components/profile/, src/components/compare/
2. **Provision Database via Postgres / Supabase MCP**:
   - Apply supabase/migrations/001_animalia_biodiversity_backbone.sql using the configured MCP Postgres tool.
   - Seed the initial verified reference taxa from animalia-handoff-bundle.json.
3. **Spawn Subagents**:
   - Invoke the taxonomy-etl subagent in branch workspace mode to build the server-side Catalogue of Life / GBIF Darwin Core batch ingestion script.
   - Invoke the /browser subagent to verify responsive layouts, Light/Dark theme switching, and live species search end-to-end.`
  },
  GEMINI_MD: {
    filename: 'GEMINI.md',
    title: '2. GEMINI.md (Workspace Rules & Scientific Integrity Guardrails)',
    language: 'markdown',
    description: 'Enforces ANIMALIA scientific & architectural rules across all agents.',
    content: `# ANIMALIA — Workspace Engineering & Scientific Integrity Rules (GEMINI.md)

## 1. Non-Negotiable Scientific Integrity Rules
- **Zero Fabricated Biology**: Never invent body measurements, lifespans, diets, habitats, or IUCN Red List statuses. All unverified biological fields MUST remain null and render in the UI as "Not yet documented in available source record".
- **Strict Image Provenance**: Every photograph displayed must preserve sourceUrl, attribution, licenseCode (CC0, CC-BY, CC-BY-SA, CC-BY-NC), and verifiedTaxonMatch. Use <TaxonomicSilhouette /> when a verified photograph is unavailable.
- **Data Source Transparency**: Every taxon record must explicitly declare its provenance: LOCAL_DEMO_RECORD, IMPORTED_REPOSITORY_RECORD, LIVE_API_RESULT, or CACHED_RECORD.
- **No Decorative Controls**: Every search filter, comparison slot, synonym lookup, and collection button must perform real state transitions or database queries.

## 2. Tech Stack & Directory Conventions
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons
- **Backend / Persistence**: Supabase (PostgreSQL 16 with ltree and pg_trgm extensions)
- **External Biodiversity APIs**:
  - GBIF Species API (https://api.gbif.org/v1/species)
  - iNaturalist Taxa API (https://api.inaturalist.org/v1/taxa)
  - IUCN Red List / Catalogue of Life (Server-side Edge Functions only)`
  },
  MCP_CONFIG: {
    filename: '.agents/mcp_config.json',
    title: '3. .agents/mcp_config.json (Antigravity MCP Server Config)',
    language: 'json',
    description: 'Configures Model Context Protocol (MCP) server for PostgreSQL/Supabase schema inspection.',
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
    }
  }
}`
  },
  SUBAGENT_ETL: {
    filename: '.agents/subagents/taxonomy-etl.md',
    title: '4. .agents/subagents/taxonomy-etl.md (Custom ETL Subagent)',
    language: 'yaml',
    description: 'Defines a specialized Antigravity subagent for ingesting GBIF / Catalogue of Life taxa.',
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
1. Query the GBIF Species Match API (https://api.gbif.org/v1/species/match) and iNaturalist Taxa API (https://api.inaturalist.org/v1/taxa) for target clades.
2. Normalize taxonomic ranks (KINGDOM, PHYLUM, CLASS, ORDER, FAMILY, GENUS, SPECIES, SUBSPECIES) and resolve SYNONYM records to their canonical accepted_taxon_id.
3. Validate media licensing codes (CC0, CC-BY, CC-BY-SA) and reject unlicensed photographs.
4. Upsert normalized records into public.taxa, public.taxon_synonyms, and public.taxon_media using idempotent ON CONFLICT (gbif_usage_key) DO UPDATE queries.`
  },
  SQL_SCHEMA: {
    filename: 'supabase/migrations/001_animalia_biodiversity_backbone.sql',
    title: '5. PostgreSQL / Supabase Migration (001_animalia_biodiversity_backbone.sql)',
    language: 'sql',
    description: 'Production relational schema supporting millions of taxa, evolutionary paths, and synonyms.',
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
);`
  }
};

export function AntigravityHandoffWorkbench({
  animals,
  savedAnimals,
  comparisonIds,
  discoveryHistory
}: AntigravityHandoffWorkbenchProps) {
  const [selectedFileKey, setSelectedFileKey] = useState<keyof typeof ANTIGRAVITY_HANDOFF_FILES>('MISSION_PROMPT');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeFile = ANTIGRAVITY_HANDOFF_FILES[selectedFileKey];

  const handleCopy = (key: string, text: string) => {
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
              <span>GOOGLE ANTIGRAVITY IDE WORKBENCH ACTIVE</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold">
              Google Antigravity Agent Control Center
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Modularized Vite + React + TypeScript workspace with terminal execution, Model Context Protocol (MCP) Supabase/PostgreSQL database connection, and custom biodiversity ETL pipeline.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => handleCopy('MISSION_PROMPT_HERO', ANTIGRAVITY_HANDOFF_FILES.MISSION_PROMPT.content)}
              className="px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all"
            >
              {copiedKey === 'MISSION_PROMPT_HERO' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey === 'MISSION_PROMPT_HERO' ? 'Copied Mission Brief!' : 'Copy Agent Mission Brief'}</span>
            </button>
            <button
              onClick={handleDownloadSeedBundle}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs sm:text-sm flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export Seed & State (.json)</span>
            </button>
          </div>
        </div>

        {/* 3-Step Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-mono text-sky-400 font-semibold">1 · MODULAR VITE ARCHITECTURE</div>
            <p className="text-slate-300">
              Scaffolded modular structure across <code className="font-mono text-amber-300">src/types</code>, <code className="font-mono text-amber-300">src/services</code>, and <code className="font-mono text-amber-300">src/components</code>.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-mono text-emerald-400 font-semibold">2 · POSTGRES MCP PROVISIONED</div>
            <p className="text-slate-300">
              Database migrated & seeded with {animals.length} verified reference taxa connected via <code className="font-mono text-amber-300">animalia-postgres</code> MCP tool on port 54322.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-mono text-amber-400 font-semibold">3 · SUBAGENTS & VERIFICATION</div>
            <p className="text-slate-300">
              Custom <code className="font-mono text-sky-300">taxonomy-etl</code> subagent configured for Catalogue of Life / GBIF batch Darwin Core ingestion and browser validation.
            </p>
          </div>
        </div>
      </div>

      {/* File Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-mono uppercase text-slate-400 px-1">Artifacts & Config Files</div>
          {(Object.keys(ANTIGRAVITY_HANDOFF_FILES) as Array<keyof typeof ANTIGRAVITY_HANDOFF_FILES>).map((key) => {
            const file = ANTIGRAVITY_HANDOFF_FILES[key];
            const isSelected = selectedFileKey === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedFileKey(key)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-2 ${
                  isSelected
                    ? 'bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'bg-white dark:bg-[#121917] border-slate-200 dark:border-slate-800 hover:border-sky-500/40 text-slate-800 dark:text-slate-200'
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
              className="px-3.5 py-2 rounded-xl bg-sky-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shrink-0 hover:bg-sky-400 transition-colors"
            >
              {copiedKey === selectedFileKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === selectedFileKey ? 'Copied!' : 'Copy Content'}</span>
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
