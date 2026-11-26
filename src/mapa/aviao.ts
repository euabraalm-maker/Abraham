const SVG_AVIAO =
  '<svg viewBox="-12 -12 24 24" width="30" height="30" aria-hidden="true"><path d="M12 0 L4 -1.6 L-2 -9 L-4 -9 L-1 -1.6 L-7 -1.4 L-9.5 -4 L-11 -4 L-9.5 0 L-11 4 L-9.5 4 L-7 1.4 L-1 1.6 L-4 9 L-2 9 L4 1.6 Z" fill="currentColor"/></svg>';

const reduzido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Aviãozinho que cruza a tela em arco de `de` até `para` (pixels relativos ao contêiner) e some.
 * Não faz nada com movimento reduzido.
 */
export function animarAviao(conteiner: HTMLElement, de: [number, number], para: [number, number], duracaoMs: number) {
  if (reduzido()) return;
  conteiner.querySelectorAll('.aviao').forEach((a) => a.remove());
  const el = document.createElement('div');
  el.className = 'aviao';
  el.innerHTML = SVG_AVIAO;
  conteiner.appendChild(el);
  const [x0, y0] = de;
  const [x1, y1] = para;
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const cx = (x0 + x1) / 2;
  const cy = Math.min(y0, y1) - Math.max(60, dist * 0.35); // arco para cima
  const ponto = (t: number) => [
    (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1,
    (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1,
  ];
  const inicio = performance.now();
  const passo = (agora: number) => {
    const t = Math.min(1, (agora - inicio) / duracaoMs);
    const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    const [x, y] = ponto(e);
    const [xa, ya] = ponto(Math.min(1, e + 0.01));
    const ang = Math.atan2(ya - y, xa - x);
    el.style.transform = `translate(${x}px, ${y}px) rotate(${ang}rad) scale(${0.8 + Math.sin(e * Math.PI) * 0.5})`;
    el.style.opacity = String(t > 0.85 ? (1 - t) / 0.15 : Math.min(1, t * 6));
    if (t < 1) requestAnimationFrame(passo);
    else el.remove();
  };
  requestAnimationFrame(passo);
}
