import { test, expect } from '@playwright/test';

test('página da BAAN mostra a ficha e o título certo', async ({ page }) => {
  await page.goto('/Abraham/om.html?id=baan&estilo=teste');
  await expect(page).toHaveTitle('BAAN · Mapa das OM da FAB');
  await expect(page.locator('.ficha h2')).toContainText('Base Aérea de Anápolis');
  await expect(page.locator('a.nova-aba')).toHaveCount(0);
});

for (const busca of ['?id=inexistente', '']) {
  test(`id ausente/inválido (${busca || 'sem id'}) mostra "Unidade não encontrada"`, async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await page.goto(`/Abraham/om.html${busca}`);
    await expect(page.getByText('Unidade não encontrada')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Voltar ao mapa' })).toBeVisible();
    expect(erros).toEqual([]);
  });
}

test('voltar ao mapa abre o mapa com a ficha da unidade', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/Abraham/om.html?id=baan&estilo=teste');
  await page.getByRole('link', { name: 'Voltar ao mapa' }).click();
  await expect(page.locator('#painel-ficha .ficha')).toHaveAttribute('data-id', 'baan');
});
