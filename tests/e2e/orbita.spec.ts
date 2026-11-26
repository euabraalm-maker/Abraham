import { test, expect } from '@playwright/test';
import { abrirMapa } from './apoio';

const voar = (page: import('@playwright/test').Page, id: string) =>
  page.evaluate(async (id) => {
    const api = (window as any).__mapa;
    api.voarPara(id);
    await new Promise((r) => api.map.once('idle', r));
  }, id);

test('ao aproximar uma base, os esquadrões aparecem em órbita e abrem a própria ficha', async ({ page }) => {
  await abrirMapa(page);
  await voar(page, 'baan');
  const sat = page.locator('.orbita .satelite', { hasText: '1° GDA' });
  await expect(sat).toBeVisible();
  await sat.click();
  await expect(page.locator('#painel-ficha .ficha')).toHaveAttribute('data-id', '1-gda');
});

test('unidades no mesmo ponto orbitam a base em vez de virar uma bolha', async ({ page }) => {
  await abrirMapa(page);
  await voar(page, 'bagl');
  await expect(page.locator('.orbita .satelite', { hasText: 'PAGL' })).toBeVisible();
  const bolhasNoCentro = await page.evaluate(() => {
    const m = (window as any).__mapa.map;
    const c = m.project(m.getCenter());
    return m.queryRenderedFeatures([[c.x - 5, c.y - 5], [c.x + 5, c.y + 5]], { layers: ['bolhas'] }).length;
  });
  expect(bolhasNoCentro).toBe(0);
});

test('de longe, a base mostra um selo com o número de satélites', async ({ page }) => {
  await abrirMapa(page);
  const n = await page.evaluate(() => {
    const m = (window as any).__mapa.map;
    m.jumpTo({ center: [-48.96, -16.23], zoom: 8 });
    return new Promise((r) => m.once('idle', () => r(m.queryRenderedFeatures({ layers: ['selo-satelites'] }).length)));
  });
  expect(n).toBeGreaterThan(0);
  await expect(page.locator('.orbita')).toHaveCount(0);
});

test('buscar um esquadrão destaca o satélite dele na órbita', async ({ page }) => {
  await abrirMapa(page);
  await page.getByRole('combobox', { name: 'Buscar unidade' }).fill('1º/14ºGAV');
  await page.keyboard.press('Enter');
  await expect(page.locator('.orbita .satelite.destaque')).toContainText('Pampa');
});
