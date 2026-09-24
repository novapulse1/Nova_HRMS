// ====================================================================
// NovaPulse HRMS — Supabase Client Setup
// Single Project Multi-Tenant SaaS Connection
// ====================================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || process?.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || process?.env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    supabaseUrl.startsWith('http')
  );
};

// Polyfill minimal WebSocket for Node test runners if missing
if (typeof window === 'undefined' && typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class MockWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  };
}

// Create the Supabase client with safe fallback
export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://placeholder-novapulse.supabase.co', 'placeholder-anon-key', {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
