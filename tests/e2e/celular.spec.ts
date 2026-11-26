import { test, expect } from '@playwright/test';
import { abrirMapa } from './apoio';

for (const [largura, altura] of [[412, 915], [412, 640], [375, 667]] as const) {
  test(`filtros no celular ${largura}x${altura}: Aplicar e Cancelar visíveis e clicáveis`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: altura });
    await abrirMapa(page);
    await page.getByRole('button', { name: 'Filtros' }).click();
    for (const nome of ['Aplicar', 'Cancelar']) {
      const b = page.getByRole('button', { name: nome });
      const livre = await b.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const dentro = r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth;
        return dentro && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === el;
      });
      expect(livre, `${nome} encoberto ou fora da tela`).toBe(true);
    }
    await page.locator('[data-acao="nenhum"]').click();
    await page.getByRole('button', { name: 'Aplicar' }).click();
    await expect(page.locator('#painel-filtros')).toBeHidden();
    await expect(page.getByRole('group', { name: 'Ângulo da câmera' })).toBeVisible();
  });
}
