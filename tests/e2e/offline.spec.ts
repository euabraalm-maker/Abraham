import { test, expect } from '@playwright/test';

const PUBLICADO = 'http://localhost:4173/Abraham/?estilo=teste';

test('depois da primeira visita o mapa abre sem internet', async ({ page, context }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(PUBLICADO);
  await page.locator('#mapa[data-pronto="1"]').waitFor({ timeout: 20_000 });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await page.locator('#mapa[data-pronto="1"]').waitFor({ timeout: 20_000 });
  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await page.locator('#mapa[data-pronto="1"]').waitFor({ timeout: 20_000 });
  await page.waitForFunction(() => (window as any).__mapa.map.queryRenderedFeatures({ layers: ['bolhas'] }).length > 0);
  await page.getByRole('combobox', { name: 'Buscar unidade' }).fill('BAAN');
  await page.keyboard.press('Enter');
  await expect(page.locator('#painel-ficha .ficha')).toHaveAttribute('data-id', 'baan');
});
