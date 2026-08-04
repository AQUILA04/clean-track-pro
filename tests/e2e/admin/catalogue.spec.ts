import { test, expect } from '@playwright/test';

test.describe('Admin — Catalogue Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/catalogue');
    });

    test('[P0] should display catalogue page with tabs', async ({ page }) => {
        await expect(page.getByRole('navigation', { name: 'Tabs' })).toBeVisible();
        await expect(page.getByRole('button', { name: "Types d'Articles" })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Services' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Grille Tarifaire' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Mode Express' })).toBeVisible();
    });

    test('[P1] should navigate to services tab', async ({ page }) => {
        await page.getByRole('button', { name: 'Services' }).click();
        await expect(page.getByRole('button', { name: 'Services' })).toHaveClass(/border-primary/);
    });

    test('[P1] should navigate to express mode tab', async ({ page }) => {
        await page.getByRole('button', { name: 'Mode Express' }).click();
        await expect(page.getByText('Configuration Mode Express')).toBeVisible();
        await expect(page.getByText('Multiplicateur de prix')).toBeVisible();
    });

    test('[P1] should open add article modal from types tab', async ({ page }) => {
        await page.getByRole('button', { name: 'Ajouter un article' }).click();
        await expect(page.getByText('Ajouter un nouvel article')).toBeVisible();
        await expect(page.getByPlaceholder('Ex: Chemise')).toBeVisible();
    });
});
