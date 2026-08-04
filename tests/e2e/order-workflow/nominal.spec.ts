import path from 'path';
import { expect, test } from '@playwright/test';
import {
    assignOrderToFreeSlot,
    expectToast,
    markOrderReady,
    scanVisibleInput,
    scanWorkflowOrder,
    selectClientFromOmnibox,
    startProcessingFromWorkflow,
} from '../../support/helpers/workflow';

const userSiteAuth = path.join(__dirname, '../../.auth/user-site.json');

test.describe('Order Workflow - nominal end-to-end', () => {
    test.use({ storageState: userSiteAuth });

    test('[P0] should process order from client registration to delivery', async ({ page }) => {
        const suffix = Date.now().toString().slice(-6);
        const firstName = `E2E${suffix}`;
        const lastName = 'Workflow';
        const phone = `+33677${suffix}`;

        await page.goto('/clients/new');
        await page.locator('#first_name').fill(firstName);
        await page.locator('#last_name').fill(lastName);
        await page.locator('#phone').fill(phone);

        const createClientResponse = page.waitForResponse((response) =>
            response.url().includes('/clients') && response.request().method() === 'POST'
        );
        await page.getByRole('button', { name: 'Create Client' }).click();
        expect((await createClientResponse).status()).toBe(201);
        await expect(page.getByText('Client Created Successfully!')).toBeVisible();

        await page.goto('/orders');
        await page.waitForResponse((response) => response.url().includes('/api/auth/session') && response.ok());
        await page.evaluate(() => {
            Object.keys(localStorage)
                .filter((key) => key.includes('draft'))
                .forEach((key) => localStorage.removeItem(key));
        });
        await selectClientFromOmnibox(page, phone, `${firstName} ${lastName}`);

        await page.getByRole('button', { name: 'Chemise' }).first().click();

        const createOrderResponse = page.waitForResponse((response) =>
            response.url().includes('/orders') && response.request().method() === 'POST' && response.status() === 201
        );
        await page.getByRole('button', { name: 'Validate & Pay' }).click();
        const createdOrderPayload = await (await createOrderResponse).json();
        const orderId = createdOrderPayload?.id ?? createdOrderPayload?.data?.id;
        expect(orderId).toBeTruthy();

        // Step 1: Store in reception shelf after creation
        await assignOrderToFreeSlot(page, orderId, undefined, 'RECEPTION');

        // Step 2: Workflow - destock and process
        await page.goto('/workflow');
        await scanWorkflowOrder(page, orderId);
        await expect(page.getByText('Créée')).toBeVisible();
        await startProcessingFromWorkflow(page);
        await markOrderReady(page);

        // Step 3: Store in delivery shelf after treatment
        await assignOrderToFreeSlot(page, orderId, undefined, 'DELIVERY');

        // Step 4: Deliver to client
        await page.goto('/storage/delivery');
        await scanVisibleInput(page, 'Scan Order ID...', orderId);
        await expect(page.getByText('Delivery Verification')).toBeVisible();
        await page.getByRole('button', { name: 'Confirmer la livraison' }).click();
        await expectToast(page, /Delivery Confirmed:.*slot released/i);
    });
});
