import path from 'path';
import { expect, test } from '@playwright/test';
import { expectToast, scanVisibleInput } from '../../support/helpers/workflow';

const userSiteAuth = path.join(__dirname, '../../.auth/user-site.json');
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const READY_ORDER_ID = '770e8400-e29b-41d4-a716-446655440002';
const DELIVERED_ORDER_ID = '770e8400-e29b-41d4-a716-446655440004';

test.describe('Order Workflow - alternative scenarios', () => {
    test.use({ storageState: userSiteAuth });

    test('[P1] should reject invalid status transition CREATED -> STORED', async ({ page }) => {
        await page.goto('/workflow');

        const responseStatus = await page.evaluate(async ({ apiUrl }) => {
            const session = await fetch('/api/auth/session').then((res) => res.json());
            const token = session?.accessToken;
            const response = await fetch(`${apiUrl}/orders/770e8400-e29b-41d4-a716-446655440001/status`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'STORED' }),
            });
            return response.status;
        }, { apiUrl: API_URL });

        expect(responseStatus).toBe(400);
    });

    test('[P1] should block slot assignment on occupied slot', async ({ page }) => {
        await page.goto('/storage/scan');
        await page.getByPlaceholder('Scan ticket commande...').fill(READY_ORDER_ID);
        await page.getByPlaceholder('Scan ticket commande...').press('Enter');
        await expect(page.getByText('Détails commande')).toBeVisible();
        await page.getByPlaceholder(/Scan rayon livraison/).fill('B-01');
        await page.getByPlaceholder(/Scan rayon livraison/).press('Enter');

        await expectToast(page, /Assignment Failed:.*Storage slot is not FREE/i);
    });

    test('[P1] should show already delivered warning for delivered order', async ({ page }) => {
        await page.goto('/storage/delivery');
        await scanVisibleInput(page, 'Scan Order ID...', DELIVERED_ORDER_ID);

        await expect(page.getByText('Delivery Verification')).toBeVisible();
        await expectToast(page, /Already Delivered/i);
    });
});
