/**
 * null or -1 means no limit enforced for that window.
 */
export function isUnlimitedLimit(limit: number | null | undefined): boolean {
    return limit === null || limit === undefined || limit < 0;
}

export function normalizeQuotaLimit(limit: number | null | undefined): number | null {
    if (isUnlimitedLimit(limit)) {
        return null;
    }
    return limit!;
}
