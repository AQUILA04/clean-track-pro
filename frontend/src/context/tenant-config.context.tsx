'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSession } from 'next-auth/react';
import { Tenant, TenantService } from '@/services/tenant.service';
import { Site, SiteService } from '@/services/site.service';
import {
  DEFAULT_TENANT_CURRENCY,
  getCurrencySymbol,
  normalizeCurrencyCode,
} from '@/lib/currencies';
import { formatCurrency } from '@/lib/format-currency';
import { getSessionRoles, getSiteIdFromSession, hasAnyRole } from '@/lib/roles';
import { TENANT_DEACTIVATED_HINT, TENANT_DEACTIVATED_MESSAGE } from '@/lib/tenant-access';

interface TenantConfigContextValue {
  tenant: Tenant | null;
  /** Current agency for Admin_Site / User_Site / Livreur; null for Manager général. */
  currentSite: Site | null;
  /** True when the user is scoped to an agency (not pure tenant admin). */
  isAgencyUser: boolean;
  currency: string;
  currencySymbol: string;
  loading: boolean;
  formatMoney: (amount: number | string | null | undefined) => string;
  refresh: () => Promise<void>;
  /** Optimistically update currency after a successful save. */
  setCurrency: (code: string) => void;
}

const TenantConfigContext = createContext<TenantConfigContextValue | null>(null);

function applyFavicon(url: string | null | undefined) {
  if (typeof document === 'undefined') return;
  const existing = document.querySelector<HTMLLinkElement>('link[data-tenant-favicon="true"]');
  if (!url) {
    existing?.remove();
    return;
  }
  let link = existing;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    link.setAttribute('data-tenant-favicon', 'true');
    document.head.appendChild(link);
  }
  link.href = url;
}

export function TenantConfigProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [currentSite, setCurrentSite] = useState<Site | null>(null);
  const [currency, setCurrencyState] = useState(DEFAULT_TENANT_CURRENCY);
  const [loading, setLoading] = useState(true);

  const roles = getSessionRoles(session?.user);
  const isAgencyUser = hasAnyRole(roles, ['Admin_Site', 'User_Site', 'Livreur'])
    && !hasAnyRole(roles, ['Admin_Tenant', 'Superadmin', 'Super_Admin']);
  // Tenant admins who also have site roles: treat as tenant (network) for branding secondary line.
  const siteScoped = hasAnyRole(roles, ['Admin_Site', 'User_Site', 'Livreur'])
    && !hasAnyRole(roles, ['Admin_Tenant', 'Superadmin', 'Super_Admin']);

  const refresh = useCallback(async () => {
    try {
      const data = await TenantService.getCurrentTenant();
      setTenant(data);
      setCurrencyState(normalizeCurrencyCode(data.currency));
      applyFavicon(data.faviconUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.toLowerCase().includes(TENANT_DEACTIVATED_HINT)
        || message.toLowerCase().includes('pas active')
      ) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('auth_flash', TENANT_DEACTIVATED_MESSAGE);
        }
        const { logout } = await import('@/lib/logout');
        logout();
        return;
      }
      setTenant(null);
      setCurrencyState(DEFAULT_TENANT_CURRENCY);
      applyFavicon(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const siteId = getSiteIdFromSession(session?.user as Record<string, unknown> | undefined);
    if (!siteId || !siteScoped) {
      setCurrentSite(null);
      return;
    }
    let cancelled = false;
    SiteService.getById(siteId)
      .then((site) => {
        if (!cancelled) setCurrentSite(site);
      })
      .catch(() => {
        if (!cancelled) setCurrentSite(null);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user, siteScoped]);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(normalizeCurrencyCode(code));
  }, []);

  const value = useMemo<TenantConfigContextValue>(
    () => ({
      tenant,
      currentSite,
      isAgencyUser,
      currency,
      currencySymbol: getCurrencySymbol(currency),
      loading,
      formatMoney: (amount) => formatCurrency(amount, currency),
      refresh,
      setCurrency,
    }),
    [tenant, currentSite, isAgencyUser, currency, loading, refresh, setCurrency],
  );

  return (
    <TenantConfigContext.Provider value={value}>
      {children}
    </TenantConfigContext.Provider>
  );
}

export function useTenantConfig(): TenantConfigContextValue {
  const ctx = useContext(TenantConfigContext);
  if (!ctx) {
    return {
      tenant: null,
      currentSite: null,
      isAgencyUser: false,
      currency: DEFAULT_TENANT_CURRENCY,
      currencySymbol: getCurrencySymbol(DEFAULT_TENANT_CURRENCY),
      loading: false,
      formatMoney: (amount) => formatCurrency(amount, DEFAULT_TENANT_CURRENCY),
      refresh: async () => undefined,
      setCurrency: () => undefined,
    };
  }
  return ctx;
}

/** Shorthand when only formatting is needed. */
export function useFormatMoney() {
  return useTenantConfig().formatMoney;
}
