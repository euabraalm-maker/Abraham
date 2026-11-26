import { test, expect } from '@playwright/test';
import { abrirMapa } from './apoio';

const pitchApos = (page: import('@playwright/test').Page, id: string) =>
  page.evaluate(async (id) => {
    const api = (window as any).__mapa;
    api.voarPara(id);
    await new Promise((r) => api.map.once('idle', r));
    return Math.round(api.map.getPitch());
  }, id);

test('filtro só muda o mapa ao clicar em Aplicar', async ({ page }) => {
  await abrirMapa(page);
  await page.getByRole('button', { name: 'Filtros' }).click();
  await page.locator('[data-acao="nenhum"]').click();
  const total = () => page.evaluate(() => (window as any).__mapa.map.getSource('unidades').serialize().data.features.length);
  expect(await total()).toBeGreaterThan(100);
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page.locator('#painel-filtros')).toBeHidden();
  expect(await total()).toBe(0);
});

test('barra de cima sem faixa contínua', async ({ page }) => {
  await abrirMapa(page);
  const estilo = await page.locator('header.barra').evaluate((b) => {
    const c = getComputedStyle(b);
    return { fundo: c.backgroundColor, borda: c.borderTopWidth, filtro: c.backdropFilter };
  });
  expect(estilo.fundo).toBe('rgba(0, 0, 0, 0)');
  expect(estilo.borda).toBe('0px');
  expect(estilo.filtro === 'none' || estilo.filtro === '').toBe(true);
});

test('câmera: De cima, 3D e Automática', async ({ page }) => {
  await abrirMapa(page);
  await page.getByRole('button', { name: 'De cima' }).click();
  expect(await pitchApos(page, 'baan')).toBe(0);
  await page.getByRole('button', { name: '3D' }).click();
  expect(await pitchApos(page, 'bant')).toBe(55);
  await page.getByRole('button', { name: 'Automática' }).click();
  expect(await pitchApos(page, 'baco')).toBe(50);
});

test('a câmera escolhida é lembrada', async ({ page }) => {
  await abrirMapa(page);
  await page.getByRole('button', { name: 'De cima' }).click();
  await page.reload();
  await page.locator('#mapa[data-pronto="1"]').waitFor();
  await expect(page.getByRole('button', { name: 'De cima' })).toHaveAttribute('aria-pressed', 'true');
  expect(await pitchApos(page, 'baan')).toBe(0);
});
