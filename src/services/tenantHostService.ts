// ====================================================================
// NovaPulse HRMS — Tenant Host Service
// Centralized Hostname, Subdomain & Environment-Aware Tenant Resolution
// ====================================================================
import { PLATFORM_DOMAIN, ROOT_DOMAIN } from '../config/appConfig';
import { Tenant, TenantStatus } from '../database/schema';
import { TenantService } from './tenantService';
import {
  RESERVED_SUBDOMAINS,
  isReservedSlug,
  normalizeSlug,
  isValidSlugFormat,
} from './tenantResolver';

export type TenantHostMode = 'platform' | 'tenant' | 'legacy' | 'development';

export interface TenantHostContext {
  mode: TenantHostMode;
  isRootDomain: boolean;
  apexDomain: string;
  subdomain?: string;
  tenantId?: string;
  tenant?: Tenant | null;
  status?: TenantStatus | 'NOT_FOUND' | null;
  error?: 'TENANT_NOT_FOUND' | 'RESERVED_SUBDOMAIN' | null;
  pathTenantId?: string | null;
}

export class TenantHostService {
  /**
   * Known apex/platform domains that should be treated as root platform entry
   */
  public static readonly KNOWN_ROOTS = [
    PLATFORM_DOMAIN.toLowerCase(),
    'makemypayroll.com',
    'pulsebazar.shop',
    'novapulse-hrms.vercel.app',
    'app.novapulse.co.in',
  ];

  /**
   * Safely reads and normalizes the current hostname
   */
  public static getNormalizedHostname(hostname?: string): string {
    const raw =
      hostname ||
      (typeof window !== 'undefined' ? window.location.hostname : '');
    return raw.toLowerCase().trim().split(':')[0];
  }

  /**
   * Extracts legacy /t/:tenantId from pathname
   */
  public static extractPathTenant(pathname?: string): string | null {
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
   * Extracts subdomain from hostname
   * Returns null if apex domain, www, or raw localhost/IP
   */
  public static extractSubdomain(
    hostname?: string,
    platformDomain: string = PLATFORM_DOMAIN
  ): string | null {
    const host = this.getNormalizedHostname(hostname);
    if (!host) return null;

    // Pure localhost or IP
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
        const sub = normalizeSlug(parts[0]);
        if (sub && !isReservedSlug(sub)) {
          return sub;
        }
      }
      return null;
    }

    // Check against known platform root domains
    const allRoots = Array.from(
      new Set([platformDomain.toLowerCase(), ...this.KNOWN_ROOTS])
    );

    for (const root of allRoots) {
      if (host === root || host === `www.${root}`) {
        return null;
      }
      if (host.endsWith(`.${root}`)) {
        const prefix = host.slice(0, -(root.length + 1));
        const subParts = prefix.split('.');
        const candidate = normalizeSlug(subParts[subParts.length - 1]);
        if (candidate && !isReservedSlug(candidate)) {
          return candidate;
        }
      }
    }

    // Generic 3-part hostname fallback (e.g. ignite.somecustomdomain.com)
    const parts = host.split('.');
    if (parts.length >= 3) {
      const candidate = normalizeSlug(parts[0]);
      if (candidate && !isReservedSlug(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Resolves the full TenantHostContext from hostname and pathname
   */
  public static resolve(
    hostname?: string,
    pathname?: string,
    platformDomain: string = PLATFORM_DOMAIN
  ): TenantHostContext {
    const host = this.getNormalizedHostname(hostname);
    const pathTenant = this.extractPathTenant(pathname);
    const subdomain = this.extractSubdomain(host, platformDomain);

    // 1. Tenant Subdomain Mode (*.makemypayroll.com or *.localhost)
    if (subdomain) {
      const tenant =
        TenantService.getBySubdomain(subdomain) ||
        TenantService.getBySlug(subdomain) ||
        TenantService.getById(subdomain) ||
        TenantService.getByCode(subdomain);

      if (tenant) {
        return {
          mode: 'tenant',
          isRootDomain: false,
          apexDomain: platformDomain,
          subdomain,
          tenantId: tenant.tenantId,
          tenant,
          status: tenant.status,
        };
      }

      // Subdomain was requested but no matching organization exists
      return {
        mode: 'tenant',
        isRootDomain: false,
        apexDomain: platformDomain,
        subdomain,
        tenant: null,
        status: 'NOT_FOUND',
        error: 'TENANT_NOT_FOUND',
      };
    }

    // 2. Legacy /t/:tenantId Route Mode
    if (pathTenant) {
      const tenant =
        TenantService.getById(pathTenant) ||
        TenantService.getBySubdomain(pathTenant) ||
        TenantService.getBySlug(pathTenant) ||
        TenantService.getByCode(pathTenant);

      if (tenant) {
        return {
          mode: 'legacy',
          isRootDomain: false,
          apexDomain: platformDomain,
          pathTenantId: pathTenant,
          tenantId: tenant.tenantId,
          tenant,
          status: tenant.status,
        };
      }

      return {
        mode: 'legacy',
        isRootDomain: false,
        apexDomain: platformDomain,
        pathTenantId: pathTenant,
        tenant: null,
        status: 'NOT_FOUND',
        error: 'TENANT_NOT_FOUND',
      };
    }

    // 3. Development Mode (raw localhost / 127.0.0.1)
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1'
    ) {
      return {
        mode: 'development',
        isRootDomain: true,
        apexDomain: 'localhost',
        tenant: null,
        status: null,
      };
    }

    // 4. Platform Mode (makemypayroll.com, www.makemypayroll.com)
    return {
      mode: 'platform',
      isRootDomain: true,
      apexDomain: platformDomain,
      tenant: null,
      status: null,
    };
  }
}
