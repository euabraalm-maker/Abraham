import { test, expect } from '@playwright/test';
import { abrirMapa } from './apoio';

test('busca "gw" sugere DTCEA-GW e Enter abre a ficha', async ({ page }) => {
  await abrirMapa(page);
  await page.getByRole('combobox', { name: 'Buscar unidade' }).fill('gw');
  await expect(page.getByRole('option').first()).toContainText('DTCEA-GW');
  await page.keyboard.press('Enter');
  await expect(page.locator('#painel-ficha .ficha')).toHaveAttribute('data-id', 'dtcea-gw');
  await expect(page.locator('#painel-ficha h2')).toContainText('Guaratinguetá');
});

test('filtrar só DTCEA deixa só destacamentos no mapa', async ({ page }) => {
  await abrirMapa(page);
  await page.getByRole('button', { name: 'Filtros' }).click();
  await page.locator('[data-acao="nenhum"]').click();
  await page.getByLabel(/Destacamentos \(DTCEA\)/).check();
  const cats = await page.evaluate(() => {
    const dados = (window as any).__mapa.map.getSource('unidades').serialize().data;
    return [...new Set(dados.features.map((f: any) => f.properties.categoria))];
  });
  expect(cats).toEqual(['dtcea']);
});

test('elo do caminho abre a ficha daquela unidade', async ({ page }) => {
  await abrirMapa(page);
  await page.getByRole('combobox', { name: 'Buscar unidade' }).fill('BAAN');
  await page.keyboard.press('Enter');
  await page.locator('#painel-ficha .esquadroes a', { hasText: '1° GDA' }).click();
  await expect(page.locator('#painel-ficha .ficha')).toHaveAttribute('data-id', '1-gda');
  await page.locator('#painel-ficha .caminho a', { hasText: 'BAAN' }).click();
  await expect(page.locator('#painel-ficha .ficha')).toHaveAttribute('data-id', 'baan');
});

test('lista do grupo abre a ficha escolhida', async ({ page }) => {
  await abrirMapa(page);
  await page.evaluate(async () => {
    const api = (window as any).__mapa;
    api.voarPara('bagl');
    await new Promise((r) => api.map.once('idle', r));
  });
  const box = await page.locator('#mapa').boundingBox();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.locator('#lista-grupo button', { hasText: 'PAMA-GL' }).click();
  await expect(page.locator('#painel-ficha .ficha')).toHaveAttribute('data-id', 'pama-gl');
});

test('FAB no exterior lista as unidades fora do Brasil', async ({ page }) => {
  await abrirMapa(page);
  await page.getByRole('button', { name: /FAB no exterior/ }).click();
  await expect(page.locator('#painel-exterior')).toContainText('CABW');
});
