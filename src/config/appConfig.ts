// ====================================================================
// NovaPulse HRMS — Centralized Application & Domain Configuration
// ====================================================================

const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

export const APP_BASE_URL: string =
  metaEnv.VITE_APP_BASE_URL || 'https://app.novapulse.co.in';

/**
 * Returns the standardized production login URL for a given tenant ID
 * Example: https://app.novapulse.co.in/t/NP-000001
 */
export const getTenantLoginUrl = (tenantId: string): string => {
  return `${APP_BASE_URL}/t/${tenantId}`;
};
