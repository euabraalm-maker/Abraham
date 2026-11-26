import { test, expect } from '@playwright/test';

test('página principal tem título e aviso', async ({ page }) => {
  await page.goto('/Abraham/');
  await expect(page).toHaveTitle('Mapa das OM da FAB');
  await expect(page.getByText('Material didático, não oficial')).toBeVisible();
});

test('página da unidade tem o aviso', async ({ page }) => {
  await page.goto('/Abraham/om.html?id=x');
  await expect(page.getByText('Material didático, não oficial')).toBeVisible();
});
