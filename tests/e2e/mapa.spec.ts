import { test, expect } from '@playwright/test';
import { abrirMapa, pontoDaUnidade } from './apoio';

test('mapa carrega e mostra bolhas com contagem', async ({ page }) => {
  await abrirMapa(page);
  const bolhas = await page.evaluate(() => {
    const m = (window as any).__mapa.map;
    return m.queryRenderedFeatures({ layers: ['bolhas'] }).map((f: any) => f.properties.point_count);
  });
  expect(bolhas.length).toBeGreaterThan(0);
  expect(bolhas.every((n: number) => n > 1)).toBe(true);
});

test('clicar numa unidade isolada seleciona a unidade', async ({ page }) => {
  await abrirMapa(page);
  const p = await pontoDaUnidade(page, 'dtcea-oi');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('#painel-ficha .ficha')).toHaveAttribute('data-id', 'dtcea-oi');
});

test('sem servidor de tiles: aviso aparece e as bolhas continuam', async ({ page }) => {
  await page.route('**/tiles.openfreemap.org/**', (r) => r.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/Abraham/?estilo=escuro&depurar=1');
  await page.locator('#mapa[data-pronto="1"]').waitFor({ timeout: 20_000 });
  await expect(page.getByText('Mapa detalhado indisponível no momento')).toBeVisible();
  await page.waitForFunction(() => (window as any).__mapa.map.queryRenderedFeatures({ layers: ['bolhas'] }).length > 0);
});
