/**
 * Mede a taxa de quadros; se a média ficar abaixo de 40 FPS por 3 s seguidos
 * (com a aba visível), chama `aoBaixar` uma única vez e para de medir.
 */
export function monitorarDesempenho(aoBaixar: () => void, limiteFps = 40, janelaMs = 3000) {
  const quadros: number[] = [];
  let ativo = true;
  const passo = (agora: number) => {
    if (!ativo) return;
    if (document.hidden) { quadros.length = 0; requestAnimationFrame(passo); return; }
    quadros.push(agora);
    while (quadros.length && agora - quadros[0] > janelaMs) quadros.shift();
    const cobertura = quadros.length > 1 ? agora - quadros[0] : 0;
    if (cobertura >= janelaMs * 0.95) {
      const fps = ((quadros.length - 1) * 1000) / cobertura;
      if (fps < limiteFps) { ativo = false; aoBaixar(); return; }
    }
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
  return { parar: () => { ativo = false; } };
}
