/**
 * Order reference format: REF-{SS}-{YYMM}-{NNNNNN}
 * Example: REF-01-2507-000136
 */
export function formatOrderReference(siteCode: number, createdAt: Date, sequence: number): string {
    const ss = String(siteCode).padStart(2, '0');
    const year = createdAt.getFullYear() % 100;
    const month = createdAt.getMonth() + 1;
    const yymm = `${String(year).padStart(2, '0')}${String(month).padStart(2, '0')}`;
    const seq = String(sequence).padStart(6, '0');
    return `REF-${ss}-${yymm}-${seq}`;
}

export function getOrderPeriodKey(date: Date): string {
    const year = date.getFullYear() % 100;
    const month = date.getMonth() + 1;
    return `${String(year).padStart(2, '0')}${String(month).padStart(2, '0')}`;
}

const FULL_UUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isFullUuid(value: string): boolean {
    return FULL_UUID.test(value.trim());
}

/** Hex fragment suitable as UUID prefix (at least 4 hex chars). */
export function isUuidPrefix(value: string): boolean {
    const hexOnly = value.trim().replace(/-/g, '');
    return /^[0-9a-f]+$/i.test(hexOnly) && hexOnly.length >= 4;
}

/** Normalize a typed reference fragment for ILIKE matching. */
export function normalizeReferenceQuery(value: string): string {
    return value
        .trim()
        .toUpperCase()
        .replace(/^REF-?/i, '')
        .replace(/\s+/g, '');
}
