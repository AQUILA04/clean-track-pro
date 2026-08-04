import path from 'path';
import { expect, test } from '@playwright/test';
import { scanWorkflowOrder } from '../../support/helpers/workflow';

const adminSiteAuth = path.join(__dirname, '../../.auth/admin-site.json');
const userSiteAuth = path.join(__dirname, '../../.auth/user-site.json');
const CREATED_ORDER_ID = '770e8400-e29b-41d4-a716-446655440001';

test.describe('Order Workflow - role-based access', () => {
    test.describe('User_Site', () => {
        test.use({ storageState: userSiteAuth });

        test('[P1] can access workflow scanner and see available actions', async ({ page }) => {
            await page.goto('/workflow');
            await scanWorkflowOrder(page, CREATED_ORDER_ID);
            await expect(page.locator('span').filter({ hasText: /^CREATED$/ })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Mark as IN_PROGRESS' })).toBeVisible();
        });
    });

    test.describe('Admin_Site', () => {
        test.use({ storageState: adminSiteAuth });

        test('[P1] can access storage assignment page', async ({ page }) => {
            await page.goto('/storage/scan');
            await expect(page.getByRole('heading', { name: 'Assign Order to Storage' })).toBeVisible();
            await expect(page.getByText('1. Scan Order Ticket')).toBeVisible();
        });
    });
});
