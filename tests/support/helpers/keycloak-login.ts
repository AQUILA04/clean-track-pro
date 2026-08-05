import { Page, expect } from '@playwright/test';

export interface LoginCredentials {
    username: string;
    password: string;
}

async function readKeycloakLoginError(page: Page): Promise<string | null> {
    const selectors = [
        '#kc-error-message',
        '#input-error',
        '.alert-error',
        '.pf-c-alert__title',
        '[data-testid="login-error"]',
    ];
    for (const selector of selectors) {
        const locator = page.locator(selector).first();
        if (await locator.isVisible().catch(() => false)) {
            const text = (await locator.innerText().catch(() => '')).trim();
            if (text) {
                return text;
            }
        }
    }
    return null;
}

/**
 * Keycloak 24+ may interrupt login with VERIFY_PROFILE even when users already have names/email.
 * Submit the form as-is so the OIDC flow can continue.
 */
async function dismissVerifyProfileIfPresent(page: Page): Promise<boolean> {
    if (!page.url().includes('required-action') || !page.url().includes('VERIFY_PROFILE')) {
        return false;
    }

    const submit = page.locator(
        '#kc-form-buttons input[type="submit"], #kc-submit, button[type="submit"], input[name="login"]',
    ).first();
    await expect(submit).toBeVisible({ timeout: 10_000 });
    await submit.click();
    return true;
}

/**
 * Authenticates via NextAuth → Keycloak OIDC flow.
 * Works against local Keycloak (localhost:8080 in CI, 9081 in local E2E) or remote issuer.
 */
export async function loginViaKeycloak(
    page: Page,
    credentials: LoginCredentials,
): Promise<void> {
    await page.goto('/auth/signin?callbackUrl=/dashboard');
    await page.waitForURL(/\/realms\//, { timeout: 30_000 });

    await page.locator('#username, input[name="username"]').fill(credentials.username);
    await page.locator('#password, input[name="password"]').fill(credentials.password);
    await page.getByRole('button', { name: /sign in|se connecter|connexion/i }).click();

    // Allow either a required-action interstitial or a return to the app.
    await page.waitForURL(
        (url) =>
            url.pathname.includes('/login-actions/required-action') ||
            (!url.pathname.includes('/realms/') && !url.pathname.includes('/api/auth/signin')),
        { timeout: 60_000, waitUntil: 'commit' },
    );

    if (await dismissVerifyProfileIfPresent(page)) {
        await page.waitForURL(
            (url) => !url.pathname.includes('/realms/') && !url.pathname.includes('/api/auth/signin'),
            { timeout: 60_000, waitUntil: 'commit' },
        );
    }

    if (page.url().includes('/realms/')) {
        const keycloakError = await readKeycloakLoginError(page);
        throw new Error(
            keycloakError
                ? `Keycloak login failed: ${keycloakError}`
                : `Keycloak login stuck on ${page.url()}`,
        );
    }

    if (page.url().includes('/auth/signin')) {
        const bodyText = (await page.locator('body').innerText().catch(() => '')).trim();
        throw new Error(`Application sign-in failed: ${bodyText.slice(0, 400)}`);
    }

    await page.waitForURL(/\/dashboard(?:\/|$|\?)/, { timeout: 30_000, waitUntil: 'commit' });
    await expect(page).toHaveURL(/\/dashboard/);
}
