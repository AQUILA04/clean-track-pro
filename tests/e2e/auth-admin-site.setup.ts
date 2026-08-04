import { test as setup } from '@playwright/test';
import path from 'path';
import { loginViaKeycloak } from '../support/helpers/keycloak-login';

const authFile = path.join(__dirname, '../.auth/admin-site.json');

setup('authenticate as Admin_Site', async ({ page }) => {
    const username = process.env.E2E_ADMIN_SITE_USERNAME || 'admin_site';
    const password = process.env.E2E_ADMIN_SITE_PASSWORD || 'password123';

    await loginViaKeycloak(page, { username, password });
    await page.context().storageState({ path: authFile });
});
