// ====================================================================
// NovaPulse HRMS — Centralized Multi-Tenant Subdomain Resolver
// Resolves tenant context securely from Hostname or Legacy Path Routing
// ====================================================================
import { ROOT_DOMAIN } from '../config/appConfig';
import { Tenant, TenantStatus } from '../database/schema';
import { TenantService } from './tenantService';

export const RESERVED_SUBDOMAINS = new Set<string>([
  'www',
  'admin',
  'app',
  'api',
  'mail',
  'smtp',
  'ftp',
  'support',
  'help',
  'status',
  'billing',
  'login',
  'auth',
  'dashboard',
  'superadmin',
  'super-admin',
  'root',
  'system',
]);

/**
 * Validates whether a slug conforms to subdomain safety rules:
 * - Lowercase
 * - Only letters, numbers, and hyphens (no consecutive hyphens, no leading/trailing hyphens)
 * - Minimum 2 characters, maximum 63 characters
 */
export const isValidSlugFormat = (slug: string): boolean => {
  if (!slug || typeof slug !== 'string') return false;
  const trimmed = slug.trim().toLowerCase();
  if (trimmed.length < 2 || trimmed.length > 63) return false;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmed);
};

/**
 * Checks if a given slug is reserved for platform/system use
 */
export const isReservedSlug = (slug: string): boolean => {
  if (!slug) return false;
  return RESERVED_SUBDOMAINS.has(slug.trim().toLowerCase());
};

/**
 * Normalizes any company name or text into a clean URL-safe slug
 * Example: "Ignite Technologies Pvt Ltd" -> "ignite" or "ignite-technologies"
 */
export const normalizeSlug = (nameOrInput: string): string => {
  if (!nameOrInput) return '';
  return nameOrInput
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove special characters
    .replace(/\s+/g, '-')         // replace spaces with hyphens
    .replace(/-+/g, '-')          // replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');     // trim leading & trailing hyphens
};

export type TenantResolutionSource = 'subdomain' | 'path' | 'root' | 'none';

export interface ResolvedTenantContext {
  isRootDomain: boolean;
  source: TenantResolutionSource;
  subdomainSlug: string | null;
  pathIdentifier: string | null;
  tenant: Tenant | null;
  status: TenantStatus | 'NOT_FOUND' | null;
  error?: 'TENANT_NOT_FOUND' | 'RESERVED_SUBDOMAIN' | null;
}

export class TenantResolver {
  /**
   * Safely extracts the subdomain slug from a hostname.
   * Handles production domain (pulsebazar.shop), vercel fallback, and local dev (*.localhost).
   */
  public static extractSlugFromHostname(
    hostname?: string,
    customRootDomain: string = ROOT_DOMAIN
  ): string | null {
    const host = (
      hostname ||
      (typeof window !== 'undefined' ? window.location.hostname : '')
    )
      .toLowerCase()
      .trim()
      .split(':')[0]; // Remove port if present

    if (!host) return null;

    // Ignore pure localhost or raw IP addresses
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1'
    ) {
      return null;
    }

    // Localhost subdomain: e.g. "ignite.localhost" -> "ignite"
    if (host.endsWith('.localhost')) {
      const parts = host.split('.');
      if (parts.length >= 2) {
        const candidate = parts[0];
        if (candidate && !isReservedSlug(candidate)) {
          return candidate;
        }
      }
      return null;
    }

    // Secondary fallback domains like vercel preview
    const knownRoots = [
      customRootDomain.toLowerCase(),
      'makemypayroll.com',
      'pulsebazar.shop',
      'novapulse-hrms.vercel.app',
      'app.novapulse.co.in'
    ];

    for (const root of knownRoots) {
      if (host === root || host === `www.${root}`) {
        return null;
      }
      if (host.endsWith(`.${root}`)) {
        const prefix = host.slice(0, -(root.length + 1));
        const subParts = prefix.split('.');
        const candidate = subParts[subParts.length - 1];
        if (candidate && !isReservedSlug(candidate)) {
          return candidate;
        }
      }
    }

    // Generic fallback for any other 2+ level domains (e.g., custom domains in testing)
    const parts = host.split('.');
    if (parts.length >= 3) {
      const candidate = parts[0];
      if (candidate && !isReservedSlug(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Extracts tenant identifier from pathname (legacy /t/:tenantId fallback)
   */
  public static extractTenantFromPath(pathname?: string): string | null {
    const path =
      pathname !== undefined
        ? pathname
        : typeof window !== 'undefined'
        ? window.location.pathname
        : '';
    const match = path.match(/^\/t\/([A-Za-z0-9_-]+)/);
    return match ? match[1].trim() : null;
  }

  /**
   * Conceptual helper resolveTenantFromHostname()
   * Returns normalized mode and tenant context
   */
  public static resolveTenantFromHostname(
    hostname?: string,
    pathname?: string,
    customRootDomain: string = ROOT_DOMAIN
  ): {
    mode: 'platform' | 'tenant' | 'legacy' | 'development';
    tenantId?: string;
    subdomain?: string;
    tenant?: Tenant | null;
    status?: TenantStatus | 'NOT_FOUND' | null;
    error?: 'TENANT_NOT_FOUND' | 'RESERVED_SUBDOMAIN' | null;
    isRootDomain: boolean;
  } {
    const res = this.resolveTenant(hostname, pathname, customRootDomain);
    const host = (hostname || (typeof window !== 'undefined' ? window.location.hostname : '')).toLowerCase().split(':')[0];
    const isDev = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';

    let mode: 'platform' | 'tenant' | 'legacy' | 'development' = 'platform';
    if (res.source === 'subdomain') mode = 'tenant';
    else if (res.source === 'path') mode = 'legacy';
    else if (isDev) mode = 'development';

    return {
      mode,
      tenantId: res.tenant?.tenantId,
      subdomain: res.subdomainSlug || undefined,
      tenant: res.tenant,
      status: res.status,
      error: res.error,
      isRootDomain: res.isRootDomain,
    };
  }

  /**
   * Main tenant resolution method:
   * Priority:
   * 1. Subdomain (e.g. ignite.makemypayroll.com)
   * 2. Legacy path (/t/NP-000001 or /t/ignite)
   * 3. Root platform domain (makemypayroll.com / localhost)
   */
  public static resolveTenant(
    hostname?: string,
    pathname?: string,
    customRootDomain: string = ROOT_DOMAIN
  ): ResolvedTenantContext {
    const slug = this.extractSlugFromHostname(hostname, customRootDomain);
    const pathTenant = this.extractTenantFromPath(pathname);

    // 1. Hostname Subdomain Resolution (Preferred)
    if (slug) {
      // Find tenant by slug/subdomain first, fallback by id or code
      const tenant =
        TenantService.getBySubdomain(slug) ||
        TenantService.getBySlug(slug) ||
        TenantService.getById(slug) ||
        TenantService.getByCode(slug);

      if (tenant) {
        return {
          isRootDomain: false,
          source: 'subdomain',
          subdomainSlug: slug,
          pathIdentifier: null,
          tenant,
          status: tenant.status,
        };
      }

      // Subdomain provided but no matching tenant registered
      return {
        isRootDomain: false,
        source: 'subdomain',
        subdomainSlug: slug,
        pathIdentifier: null,
        tenant: null,
        status: 'NOT_FOUND',
        error: 'TENANT_NOT_FOUND',
      };
    }

    // 2. Legacy Path-based Resolution (/t/:idOrSlug)
    if (pathTenant) {
      const tenant =
        TenantService.getById(pathTenant) ||
        TenantService.getBySubdomain(pathTenant) ||
        TenantService.getBySlug(pathTenant) ||
        TenantService.getByCode(pathTenant);

      if (tenant) {
        return {
          isRootDomain: false,
          source: 'path',
          subdomainSlug: tenant.subdomain || tenant.slug || null,
          pathIdentifier: pathTenant,
          tenant,
          status: tenant.status,
        };
      }

      return {
        isRootDomain: false,
        source: 'path',
        subdomainSlug: null,
        pathIdentifier: pathTenant,
        tenant: null,
        status: 'NOT_FOUND',
        error: 'TENANT_NOT_FOUND',
      };
    }

    // 3. Root Domain (Super Admin / Platform entry)
    return {
      isRootDomain: true,
      source: 'root',
      subdomainSlug: null,
      pathIdentifier: null,
      tenant: null,
      status: null,
    };
  }
}

