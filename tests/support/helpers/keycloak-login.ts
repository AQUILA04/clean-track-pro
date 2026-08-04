import { Page, expect } from '@playwright/test';

export interface LoginCredentials {
    username: string;
    password: string;
}

/**
 * Authenticates via NextAuth → Keycloak OIDC flow.
 * Works against local Keycloak (localhost:9081 in dev) or remote issuer.
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

    // Redirect back to the app after successful auth
    await page.waitForURL(
        (url) => !url.pathname.includes('/realms/') && !url.pathname.includes('/api/auth/signin'),
        { timeout: 30_000 },
    );

    await expect(page).not.toHaveURL(/\/api\/auth\/signin/);
}
