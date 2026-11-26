import { test, expect } from '@playwright/test';
import { abrirMapa } from './apoio';

test('"Ver no organograma" mostra o organograma com o nó destacado e o nó volta ao mapa', async ({ page }) => {
  await abrirMapa(page);
  await page.getByRole('combobox', { name: 'Buscar unidade' }).fill('BAAN');
  await page.keyboard.press('Enter');
  await page.locator('#painel-ficha [data-acao="organograma"]').click();
  await expect(page.locator('#tela-organograma')).toBeVisible();
  const no = page.locator('#tela-organograma .no.destaque');
  await expect(no).toHaveAttribute('data-id', 'baan');
  await no.click();
  await expect(page.locator('#tela-organograma')).toBeHidden();
  await expect(page.locator('#painel-ficha .ficha')).toHaveAttribute('data-id', 'baan');
});

test('alternância Mapa | Organograma', async ({ page }) => {
  await abrirMapa(page);
  await page.getByRole('button', { name: 'Organograma' }).click();
  await expect(page.locator('#tela-organograma')).toBeVisible();
  await page.getByRole('button', { name: 'Mapa', exact: true }).click();
  await expect(page.locator('#tela-organograma')).toBeHidden();
});
