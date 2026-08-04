import { test as setup } from '@playwright/test';
import path from 'path';
import { loginViaKeycloak } from '../support/helpers/keycloak-login';

const authFile = path.join(__dirname, '../.auth/admin-tenant.json');

setup('authenticate as Admin_Tenant', async ({ page }) => {
    const username = process.env.E2E_ADMIN_USERNAME || 'admin_tenant';
    const password = process.env.E2E_ADMIN_PASSWORD || 'password123';

    await loginViaKeycloak(page, { username, password });
    await page.context().storageState({ path: authFile });
});
