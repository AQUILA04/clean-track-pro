import type { User } from '@/services/user.service';
import type { Site } from '@/services/site.service';

/** Prefer first+last name, then email/username. Never show a raw UUID as the primary label. */
export function formatOperatorLabel(
    user: Pick<User, 'firstName' | 'lastName' | 'email' | 'username'> | undefined | null,
    _operatorId?: string,
): string {
    if (!user) return 'Opérateur inconnu';
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return fullName || user.email || user.username || 'Opérateur inconnu';
}

export function formatSiteLabel(
    site: Pick<Site, 'name'> | undefined | null,
    _siteId?: string,
): string {
    if (!site?.name?.trim()) return 'Agence inconnue';
    return site.name.trim();
}

export function indexById<T extends { id: string }>(items: T[]): Record<string, T> {
    const map: Record<string, T> = {};
    for (const item of items) {
        map[item.id] = item;
    }
    return map;
}
