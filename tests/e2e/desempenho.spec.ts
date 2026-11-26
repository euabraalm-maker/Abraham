import { test, expect } from '@playwright/test';

// Aproximação do Galaxy Book2: CPU 4x mais lenta, tela Full HD (TV). O WebGL aqui é por software,
// então o número é pessimista; o que se exige é fluidez ou o modo de efeitos leves ligado.
test('voos seguidos mantêm fluidez ou ativam o modo leve', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('/Abraham/?estilo=escuro&depurar=1');
  await page.locator('#mapa[data-pronto="1"]').waitFor({ timeout: 40_000 });
  const fps = await page.evaluate(async () => {
    const api = (window as any).__mapa;
    const quadros: number[] = [];
    let medir = true;
    const loop = (t: number) => { quadros.push(t); if (medir) requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    for (const id of ['bant', 'baco', 'bamn']) {
      api.voarPara(id);
      await new Promise((r) => api.map.once('moveend', r));
    }
    medir = false;
    return ((quadros.length - 1) * 1000) / (quadros.at(-1)! - quadros[0]);
  });
  const leve = await page.evaluate(() => document.documentElement.classList.contains('fx-leve'));
  console.log(`FPS médio nos voos: ${fps.toFixed(1)} · modo leve: ${leve}`);
  expect(fps >= 45 || leve).toBe(true);
});
