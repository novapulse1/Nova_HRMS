// ====================================================================
// NovaPulse HRMS — Centralized Application & Domain Configuration
// ====================================================================

const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

export const PLATFORM_DOMAIN: string =
  metaEnv.VITE_PLATFORM_DOMAIN || metaEnv.VITE_ROOT_DOMAIN || 'makemypayroll.com';

export const ROOT_DOMAIN: string = PLATFORM_DOMAIN;

export const APP_BASE_URL: string =
  metaEnv.VITE_APP_BASE_URL || `https://${PLATFORM_DOMAIN}`;

/**
 * Returns the production subdomain URL for a given tenant subdomain / slug
 * Example: https://ignite.makemypayroll.com
 */
export const getTenantSubdomainUrl = (
  subdomainOrSlug: string,
  platformDomain: string = PLATFORM_DOMAIN
): string => {
  if (!subdomainOrSlug) return `https://${platformDomain}`;
  return `https://${subdomainOrSlug.toLowerCase().trim()}.${platformDomain}`;
};

/**
 * Returns the tenant URL for a given tenant ID or subdomain
 * Uses subdomain as primary, path-based /t/ as legacy fallback
 */
export const getTenantLoginUrl = (
  tenantIdOrSlug: string,
  subdomainOrSlug?: string
): string => {
  if (subdomainOrSlug) {
    return getTenantSubdomainUrl(subdomainOrSlug);
  }
  return `${APP_BASE_URL}/t/${tenantIdOrSlug}`;
};


