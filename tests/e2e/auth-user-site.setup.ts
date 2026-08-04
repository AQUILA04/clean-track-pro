import { test as setup } from '@playwright/test';
import path from 'path';
import { loginViaKeycloak } from '../support/helpers/keycloak-login';

const authFile = path.join(__dirname, '../.auth/user-site.json');

setup('authenticate as User_Site', async ({ page }) => {
    const username = process.env.E2E_USER_SITE_USERNAME || 'user_site';
    const password = process.env.E2E_USER_SITE_PASSWORD || 'password123';

    await loginViaKeycloak(page, { username, password });
    await page.context().storageState({ path: authFile });
});
