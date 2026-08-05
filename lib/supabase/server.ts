import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client. Never import this from a component.
 * UI talks to /app/api/* only — see docs/api-contract.md.
 */
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase server env vars are not configured');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
