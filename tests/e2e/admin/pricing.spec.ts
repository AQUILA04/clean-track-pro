import { test, expect } from '@playwright/test';

test.describe('Admin — Pricing Matrix', () => {
    test.beforeEach(async ({ page }) => {
        const suffix = Date.now().toString();
        await page.goto('/catalogue');

        // Seed article via UI
        await page.getByRole('button', { name: 'Ajouter un article' }).click();
        await page.getByPlaceholder('Ex: Chemise').fill(`E2E Article ${suffix}`);
        await page.locator('select').first().selectOption('VÊTEMENTS');
        await page.getByRole('button', { name: "Ajouter l'article" }).click();

        // Seed service via UI
        await page.getByRole('button', { name: 'Services' }).click();
        await page.getByRole('button', { name: 'Ajouter un service' }).click();
        await page.getByPlaceholder('Ex: Repassage').fill(`E2E Service ${suffix}`);
        await page.getByPlaceholder('Décrivez le service...').fill('Service seed pour tests E2E');
        await page.getByRole('button', { name: 'Ajouter le service' }).click();

        // Go to pricing and ensure at least one editable cell exists.
        await page.getByRole('button', { name: 'Grille Tarifaire' }).click();
        await expect(page.locator('input[type="number"]').first()).toBeVisible();
    });

    test('[P0] should display pricing matrix', async ({ page }) => {
        await expect(page.getByText('Grille Tarifaire').first()).toBeVisible();
        await expect(page.getByText("Type d'article")).toBeVisible();
    });

    test('[P1] should show save button after editing a price', async ({ page }) => {
        const priceInput = page.locator('input[type="number"]').first();
        await priceInput.fill('9.99');
        await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeVisible();
    });

    test('[P1] should warn when leaving pricing tab with unsaved changes', async ({ page }) => {
        const priceInput = page.locator('input[type="number"]').first();
        await priceInput.fill('12.50');
        await page.getByRole('button', { name: 'Mode Express' }).click();

        await expect(
            page.getByRole('heading', { name: 'Modifications non enregistrées' }),
        ).toBeVisible({ timeout: 10_000 });
    });
});
