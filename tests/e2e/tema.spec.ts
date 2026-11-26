import { test, expect } from '@playwright/test';
import { abrirMapa } from './apoio';

const fundoDoMapa = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as any).__mapa.map.getStyle().layers[0].paint['background-color']);

test('botão de tema troca o tema da página e do mapa', async ({ page }) => {
  await abrirMapa(page);
  const antes = await fundoDoMapa(page);
  await page.getByRole('button', { name: 'Alternar tema' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'claro');
  await page.waitForFunction((a) => (window as any).__mapa.map.getStyle().layers[0].paint['background-color'] !== a, antes);
  expect(await page.evaluate(() => !!(window as any).__mapa.map.getLayer('bolhas'))).toBe(true);
});

test('com movimento reduzido não há aviãozinho', async ({ page }) => {
  await abrirMapa(page);
  await page.evaluate(() => (window as any).__mapa.voarPara('baan'));
  await page.waitForTimeout(300);
  await expect(page.locator('.aviao')).toHaveCount(0);
});

test('sem movimento reduzido o voo mostra o aviãozinho', async ({ page }) => {
  await page.goto('/Abraham/?estilo=teste');
  await page.locator('#mapa[data-pronto="1"]').waitFor();
  await page.evaluate(() => (window as any).__mapa.voarPara('bant'));
  await expect(page.locator('.aviao')).toHaveCount(1);
});
