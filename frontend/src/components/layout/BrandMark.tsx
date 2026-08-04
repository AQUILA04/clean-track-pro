'use client';

import React from 'react';
import { useTenantConfig } from '@/context/tenant-config.context';

interface BrandMarkProps {
  /** Compact variant for mobile header. */
  compact?: boolean;
  className?: string;
}

/**
 * White-label brand mark for the shell.
 * - Primary: organization (tenant) name + logo (or initial)
 * - Secondary: agency name for site users, else "CleanTrack Pro"
 */
export function BrandMark({ compact = false, className = '' }: BrandMarkProps) {
  const { tenant, currentSite, isAgencyUser, loading } = useTenantConfig();

  const orgName = tenant?.name?.trim() || (loading ? '…' : 'CleanTrack Pro');
  const hasTenantIdentity = Boolean(tenant?.name?.trim());
  const logoUrl = tenant?.logoUrl || null;
  const initial = orgName.charAt(0).toUpperCase() || 'C';

  const secondary = isAgencyUser
    ? (currentSite?.name?.trim() || 'Agence')
    : hasTenantIdentity
      ? 'CleanTrack Pro'
      : 'Plateforme';

  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={orgName}
          className={`rounded-lg object-contain bg-muted/40 border border-border shrink-0 ${
            compact ? 'h-8 w-8' : 'h-8 w-8'
          }`}
        />
      ) : (
        <div
          className={`bg-primary rounded-lg flex items-center justify-center shrink-0 ${
            compact ? 'h-8 w-8' : 'h-8 w-8'
          }`}
        >
          <span className="text-white font-bold text-sm leading-none">{initial}</span>
        </div>
      )}
      <div className="min-w-0">
        <h1
          className={`font-bold text-foreground tracking-tight leading-tight truncate ${
            compact ? 'text-base' : 'text-base'
          }`}
          title={orgName}
        >
          {hasTenantIdentity ? (
            orgName
          ) : (
            <>
              CleanTrack <span className="text-primary">Pro</span>
            </>
          )}
        </h1>
        {!compact && (
          <p
            className="text-[10px] uppercase tracking-widest text-muted-foreground truncate"
            title={secondary}
          >
            {secondary}
          </p>
        )}
      </div>
    </div>
  );
}
