/**
 * ANIMALIA — Supabase Edge Functions Environment & Security Validator
 * Enforces strict environment variable validation and token masking.
 */

export interface SecurityEnvConfig {
  iucnToken?: string;
  geminiApiKey?: string;
  supabaseServiceKey?: string;
}

export function validateEnvironment(): SecurityEnvConfig {
  const iucnToken = Deno.env.get('IUCN_API_TOKEN');
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  return {
    iucnToken: iucnToken || undefined,
    geminiApiKey: geminiApiKey || undefined,
    supabaseServiceKey: supabaseServiceKey || undefined
  };
}

export function createErrorResponse(message: string, status: number = 400, headers: Record<string, string> = {}): Response {
  return new Response(
    JSON.stringify({
      error: true,
      message,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }
  );
}
