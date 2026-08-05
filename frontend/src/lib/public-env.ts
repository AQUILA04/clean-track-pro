/**
 * Public (browser-visible) runtime config.
 *
 * NEXT_PUBLIC_* is inlined at Docker/CI build time — never rely on that alone for prod.
 * The root layout injects window.__CTP_PUBLIC_ENV__ from the container's runtime env
 * so one image can be promoted across environments safely.
 *
 * Intentionally no "localhost" string literals here — they must not appear in prod client bundles.
 * Local next dev uses frontend/.env (NEXT_PUBLIC_API_URL).
 */

export type CtpPublicEnv = {
    apiUrl: string;
};

declare global {
    interface Window {
        __CTP_PUBLIC_ENV__?: CtpPublicEnv;
    }
}

function normalizeApiUrl(url: string): string {
    return url.replace(/\/$/, '');
}

function readServerApiUrl(): string {
    return normalizeApiUrl(
        process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '',
    );
}

/** Absolute backend API base URL (no trailing slash). */
export function getPublicApiUrl(): string {
    if (typeof window !== 'undefined') {
        const fromWindow = window.__CTP_PUBLIC_ENV__?.apiUrl?.trim();
        if (fromWindow) {
            return normalizeApiUrl(fromWindow);
        }
    }

    const fromEnv = readServerApiUrl();
    if (fromEnv) {
        return fromEnv;
    }

    throw new Error(
        'API URL is not configured. Set NEXT_PUBLIC_API_URL (or API_URL) for the frontend.',
    );
}

/** Payload embedded in HTML by PublicEnvScript (server-rendered at request time). */
export function getPublicEnvForScript(): CtpPublicEnv {
    const apiUrl = readServerApiUrl();
    if (!apiUrl) {
        throw new Error(
            'NEXT_PUBLIC_API_URL (or API_URL) must be set (runtime env on the frontend container).',
        );
    }
    return { apiUrl };
}
