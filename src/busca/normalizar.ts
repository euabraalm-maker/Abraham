const ROMANOS: Record<string, string> = { i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6', vii: '7' };

/** Forma comparável: minúsculas, sem acento, ordinais e pontuação removidos, romanos I–VII viram dígitos. */
export function normalizar(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/(\d)\s*[º°ªo]/g, '$1')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((p) => ROMANOS[p] ?? p)
    .join(' ');
}
