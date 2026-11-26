import { test, expect } from '@playwright/test';
import { abrirMapa } from './apoio';

test('abrir pelo endereço (#babe) termina o voo na unidade, mesmo com a abertura animada', async ({ page }) => {
  await page.goto('/Abraham/?estilo=teste#babe');
  await page.locator('#mapa[data-pronto="1"]').waitFor();
  await page.waitForTimeout(3500);
  const z = await page.evaluate(() => (window as any).__mapa.map.getZoom());
  expect(z).toBeGreaterThan(11.5);
});

test('buscar apelido de esquadrão abre a ficha da base sede', async ({ page }) => {
  await abrirMapa(page);
  await page.getByRole('combobox', { name: 'Buscar unidade' }).fill('pampa');
  await page.keyboard.press('Enter');
  await expect(page.locator('#painel-ficha .ficha')).toHaveAttribute('data-id', 'baco');
});

test('no celular, cabeçalho dos filtros e botão de tema ficam acessíveis', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await abrirMapa(page);
  await page.getByRole('button', { name: 'Filtros' }).click();
  const todos = page.locator('[data-acao="todos"]');
  const alvo = await todos.evaluate((b) => {
    const r = b.getBoundingClientRect();
    return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === b;
  });
  expect(alvo).toBe(true);
  const tema = await page.getByRole('button', { name: 'Alternar tema' }).boundingBox();
  expect(tema!.x + tema!.width).toBeLessThanOrEqual(375);
});

test('ações da página da unidade chegam ao mapa', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/Abraham/om.html?id=dtcea-gw&estilo=teste');
  await page.locator('[data-acao="organograma"]').click();
  await expect(page.locator('#tela-organograma .no.destaque')).toHaveAttribute('data-id', 'dtcea-gw');
  await page.goto('/Abraham/om.html?id=crcea-se&estilo=teste');
  await page.locator('[data-acao="subordinados"]').click();
  await expect(page.locator('.chip')).toContainText('Subordinados a CRCEA-SE');
});

test('página da unidade respeita o tema claro escolhido', async ({ page }) => {
  await page.goto('/Abraham/?estilo=teste');
  await page.evaluate(() => localStorage.setItem('mapa-om-tema', 'claro'));
  await page.goto('/Abraham/om.html?id=baan&estilo=teste');
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'claro');
});
