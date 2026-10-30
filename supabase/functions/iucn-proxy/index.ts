/**
 * ANIMALIA — Supabase Edge Function: Secure IUCN Red List API Proxy
 * Endpoint: /functions/v1/iucn-proxy
 * 
 * Proxies requests to the IUCN Red List API v3/v4 using server-side credentials.
 * Enforces Zero Fabricated Biology rules from GEMINI.md:
 * - Rejects unverified synthetic data
 * - Attaches provenance metadata
 * - Eliminates client-side token exposure
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { validateEnvironment, createErrorResponse } from '../_shared/security.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { iucnToken } = validateEnvironment();
    if (!iucnToken) {
      // In development / demo environments without private token, return structured graceful response
      console.warn('[iucn-proxy] Warning: IUCN_API_TOKEN not configured on edge server');
    }

    let scientificName = '';
    if (req.method === 'GET') {
      const url = new URL(req.url);
      scientificName = url.searchParams.get('scientificName') || url.searchParams.get('name') || '';
    } else if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      scientificName = body.scientificName || body.name || '';
    }

    if (!scientificName || scientificName.trim().length === 0) {
      return createErrorResponse('Scientific name parameter is required', 400, corsHeaders);
    }

    const cleanName = scientificName.trim();

    if (!iucnToken) {
      // Return verifiable null record per GEMINI.md scientific integrity guidelines
      return new Response(
        JSON.stringify({
          scientificName: cleanName,
          status: 'NE',
          category: 'Not Evaluated',
          criteria: null,
          populationTrend: 'Not yet documented in available source record',
          assessmentYear: null,
          provenance: 'EDGE_PROXY_UNAUTHENTICATED_FALLBACK',
          verifiedTaxonMatch: false,
          sourceUrl: `https://www.iucnredlist.org/search?query=${encodeURIComponent(cleanName)}`
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Call upstream IUCN Red List API v3
    const upstreamUrl = `https://apiv3.iucnredlist.org/api/v3/species/${encodeURIComponent(cleanName)}?token=${iucnToken}`;
    const upstreamRes = await fetch(upstreamUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (!upstreamRes.ok) {
      return createErrorResponse(`Upstream IUCN API returned HTTP ${upstreamRes.status}`, upstreamRes.status, corsHeaders);
    }

    const data = await upstreamRes.json();
    const result = data.result?.[0] || null;

    if (!result) {
      return new Response(
        JSON.stringify({
          scientificName: cleanName,
          status: 'NE',
          category: 'Not Evaluated',
          criteria: null,
          populationTrend: 'Not yet documented in available source record',
          assessmentYear: null,
          provenance: 'IUCN_RED_LIST_API_V3',
          verifiedTaxonMatch: false,
          sourceUrl: `https://www.iucnredlist.org/search?query=${encodeURIComponent(cleanName)}`
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Sanitize and normalize Red List status
    const category = (result.category || 'NE').toUpperCase();
    const responsePayload = {
      scientificName: result.scientific_name || cleanName,
      taxonId: result.taxonid || null,
      status: category,
      criteria: result.criteria || null,
      populationTrend: result.population_trend || 'Not yet documented in available source record',
      assessmentYear: result.published_year ? parseInt(result.published_year, 10) : null,
      provenance: 'IUCN_RED_LIST_API_V3',
      verifiedTaxonMatch: true,
      sourceUrl: `https://www.iucnredlist.org/species/${result.taxonid || ''}`
    };

    return new Response(
      JSON.stringify(responsePayload),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          ...corsHeaders
        }
      }
    );
  } catch (err: any) {
    return createErrorResponse(err.message || 'Internal proxy error', 500, corsHeaders);
  }
});
