import type { Page } from '@playwright/test';

/** Abre o mapa no estilo de teste (sem rede) e espera ficar pronto. */
export async function abrirMapa(page: Page, extra = '') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/Abraham/?estilo=teste${extra}`);
  await page.locator('#mapa[data-pronto="1"]').waitFor({ timeout: 20_000 });
}

/** Voa até a unidade e retorna o ponto dela na tela (relativo à página). */
export async function pontoDaUnidade(page: Page, id: string) {
  return page.evaluate(async (id) => {
    const api = (window as any).__mapa;
    api.voarPara(id);
    await new Promise((r) => api.map.once('idle', r));
    const u = api.unidades.find((x: any) => x.id === id);
    const p = api.map.project(u.coord);
    const r = api.map.getContainer().getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y };
  }, id);
}
