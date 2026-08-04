import { expect, Page } from '@playwright/test';

export async function scanHiddenInput(page: Page, label: string, value: string): Promise<void> {
    const input = page.getByLabel(label);
    await input.focus({ force: true });
    await input.pressSequentially(value, { delay: 30, force: true });
    await input.press('Enter', { force: true });
}

export async function scanWorkflowOrder(page: Page, orderId: string): Promise<void> {
    await scanHiddenInput(page, 'Scanner Input', orderId);
    await expect(page.getByText('Statut')).toBeVisible({ timeout: 15_000 });
}

export async function scanVisibleInput(page: Page, placeholder: string | RegExp, value: string): Promise<void> {
    const input = page.getByPlaceholder(placeholder);
    await input.fill('');
    await input.pressSequentially(value, { delay: 20 });
    await input.press('Enter');
}

export async function expectToast(page: Page, pattern: RegExp): Promise<void> {
    await expect(page.getByText(pattern).first()).toBeVisible({ timeout: 15_000 });
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const DEFAULT_SITE_ID = '660e8400-e29b-41d4-a716-446655440001';

export async function assignOrderToFreeSlot(
    page: Page,
    orderId: string,
    siteId = DEFAULT_SITE_ID,
    slotType: 'RECEPTION' | 'DELIVERY' = 'DELIVERY',
): Promise<string> {
    if (slotType === 'RECEPTION') {
        const freeSlotName = await page.evaluate(async ({ apiUrl, site, type }) => {
            const session = await fetch('/api/auth/session').then((res) => res.json());
            const response = await fetch(`${apiUrl}/storage/slots?site_id=${site}&slot_type=${type}`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const payload = await response.json();
            const slots = payload.data || payload;
            return slots.find((slot: { status: string }) => slot.status === 'FREE')?.name ?? null;
        }, { apiUrl: API_URL, site: siteId, type: slotType });

        expect(freeSlotName).toBeTruthy();

        await expect(page.getByText('Ranger en réception')).toBeVisible({ timeout: 10_000 });
        await scanVisibleInput(page, /Scan rayon réception/, freeSlotName!);
        await expectToast(page, /Rangement confirmé/i);
        return freeSlotName!;
    }

    await page.goto('/storage/scan');
    await page.waitForResponse((response) => response.url().includes('/storage/slots') && response.ok());

    const freeSlotName = await page.evaluate(async ({ apiUrl, site, type }) => {
        const session = await fetch('/api/auth/session').then((res) => res.json());
        const response = await fetch(`${apiUrl}/storage/slots?site_id=${site}&slot_type=${type}`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const payload = await response.json();
        const slots = payload.data || payload;
        return slots.find((slot: { status: string }) => slot.status === 'FREE')?.name ?? null;
    }, { apiUrl: API_URL, site: siteId, type: slotType });

    expect(freeSlotName).toBeTruthy();

    const assignResponse = page.waitForResponse(
        (response) => response.url().includes('/storage/assign') && response.request().method() === 'POST',
    );
    await scanVisibleInput(page, 'Scan ticket commande...', orderId);
    await expect(page.getByText('Détails commande')).toBeVisible();
    await scanVisibleInput(page, /Scan rayon livraison/, freeSlotName!);
    expect((await assignResponse).ok()).toBeTruthy();
    await expectToast(page, /Succès:.*rangée en livraison/i);

    return freeSlotName!;
}

export async function selectClientFromOmnibox(page: Page, query: string, fullName: string): Promise<void> {
    const searchClient = page.getByPlaceholder('Search Client (Name, Phone) or Create New...');
    const searchResponse = page.waitForResponse(
        (response) => response.url().includes('/clients/search') && response.ok(),
    );
    await searchClient.fill(query);
    await searchResponse;
    await searchClient.press('ArrowDown');
    await searchClient.press('Enter');
    await expect(searchClient).toHaveValue(fullName);
    await expect(page.getByRole('button', { name: 'Chemise' }).first()).toBeEnabled({ timeout: 15_000 });
}

export async function startProcessingFromWorkflow(page: Page): Promise<void> {
    await page.getByRole('button', { name: 'Déstocker et commencer le traitement' }).click();
    await expect(page.getByText('En traitement')).toBeVisible();
}

export async function markOrderReady(page: Page): Promise<void> {
    await page.getByRole('button', { name: 'Marquer comme prête (lavage terminé)' }).click();
    await expect(page.getByText(/^Prête$/)).toBeVisible();
}
