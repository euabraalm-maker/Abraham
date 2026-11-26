export type TemaVisual = 'escuro' | 'claro';
const CHAVE = 'mapa-om-tema';

function ler(): TemaVisual | null {
  try {
    const v = localStorage.getItem(CHAVE);
    return v === 'claro' || v === 'escuro' ? v : null;
  } catch {
    return null;
  }
}
function gravar(t: TemaVisual) {
  try { localStorage.setItem(CHAVE, t); } catch { /* sem armazenamento: só não lembra */ }
}

/** Tema escuro por padrão; lembra a escolha quando o navegador permite. */
export function iniciarTema(aoMudar: (t: TemaVisual) => void) {
  let atual: TemaVisual = ler() ?? 'escuro';
  document.documentElement.dataset.tema = atual;
  return {
    atual: () => atual,
    alternar() {
      atual = atual === 'escuro' ? 'claro' : 'escuro';
      document.documentElement.dataset.tema = atual;
      gravar(atual);
      aoMudar(atual);
    },
  };
}
