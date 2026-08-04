import { test, expect } from '@playwright/test';

test.describe('Admin — Agency Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/agencies');
    });

    test('[P0] should display agencies list page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Agencies Management' })).toBeVisible();
        await expect(page.getByText('Agencies Network Overview')).toBeVisible();
        await expect(page.getByPlaceholder('Rechercher une agence ou une ville...')).toBeVisible();
    });

    test('[P1] should open add agency modal', async ({ page }) => {
        await page.getByRole('button', { name: /Ajouter une agence/i }).click();

        await expect(page.getByText("Ajouter une nouvelle agence")).toBeVisible({ timeout: 10_000 });
    });

    test('[P1] should filter agencies by status', async ({ page }) => {
        await page.getByRole('button', { name: 'Actives' }).click();
        await expect(page.getByRole('button', { name: 'Actives' })).toHaveClass(/bg-primary/);

        await page.getByRole('button', { name: 'En maintenance' }).click();
        await expect(page.getByRole('button', { name: 'En maintenance' })).toHaveClass(/bg-primary/);
    });

    test('[P1] should search agencies', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Rechercher une agence ou une ville...');
        await searchInput.fill('Paris');
        await expect(searchInput).toHaveValue('Paris');
    });
});
