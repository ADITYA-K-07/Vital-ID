import { createClient } from "@supabase/supabase-js";

export const AUTH_COOKIE_NAME = "vital-id-access-token";
export const AUTH_ROLE_COOKIE_NAME = "vital-id-session-role";
export const AUTH_LICENSE_COOKIE_NAME = "vital-id-license-number";
export const AUTH_LICENSE_VERIFIED_COOKIE_NAME = "vital-id-license-verified";
export const DEMO_SESSION_TOKEN = "demo-session";

export function isSessionRole(value: string | undefined | null): value is "doctor" | "patient" {
  return value === "doctor" || value === "patient";
}

export function getSupabaseEnv() {
  return {
    url:
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY
  };
}

function isPlaceholderValue(value: string) {
  const normalized = value.trim().toLowerCase();

  return (
    normalized.length === 0 ||
    normalized.includes("your-project") ||
    normalized.includes("your-anon-key") ||
    normalized.includes("example")
  );
}

export function hasSupabaseEnv() {
  const { url, anonKey } = getSupabaseEnv();
  return Boolean(
    url &&
      anonKey &&
      !isPlaceholderValue(url) &&
      !isPlaceholderValue(anonKey)
  );
}

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

export function createServerSupabaseClient(accessToken?: string) {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      : undefined
  });
}
