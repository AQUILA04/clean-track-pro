import Script from 'next/script';
import { getPublicEnvForScript } from '@/lib/public-env';

/**
 * Injects runtime public env before any client JS runs.
 * Reads container env at request time (not the Docker build-time NEXT_PUBLIC_* bake).
 */
export function PublicEnvScript() {
    const env = getPublicEnvForScript();
    return (
        <Script
            id="ctp-public-env"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
                __html: `window.__CTP_PUBLIC_ENV__=${JSON.stringify(env)};`,
            }}
        />
    );
}
