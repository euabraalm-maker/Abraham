import type { Unidade } from './tipos';

export interface No { unidade: Unidade; filhos: No[] }

const superior = (u: Unidade) => u.subordinadaA ?? (u.categoria === 'esquadrao' ? u.sediadoEm ?? null : null);

/** Do topo da hierarquia até a própria unidade. */
export function cadeia(id: string, porId: Map<string, Unidade>): Unidade[] {
  const saida: Unidade[] = [];
  const vistos = new Set<string>();
  let atual = porId.get(id);
  while (atual && !vistos.has(atual.id)) {
    vistos.add(atual.id);
    saida.unshift(atual);
    const sup = superior(atual);
    atual = sup ? porId.get(sup) : undefined;
  }
  return saida;
}

const porSigla = (a: Unidade, b: Unidade) => a.sigla.localeCompare(b.sigla, 'pt-BR', { numeric: true });

/** Subordinadas diretas e esquadrões sediados (sem superior próprio), ordenados por sigla. */
export function filhos(id: string, us: Unidade[]): Unidade[] {
  return us.filter((u) => superior(u) === id && u.id !== id).sort(porSigla);
}

/** A própria unidade e tudo abaixo dela. */
export function descendentes(id: string, us: Unidade[]): Set<string> {
  const saida = new Set<string>([id]);
  const fila = [id];
  while (fila.length) {
    const atual = fila.shift()!;
    for (const f of filhos(atual, us)) {
      if (!saida.has(f.id)) { saida.add(f.id); fila.push(f.id); }
    }
  }
  return saida;
}

/** Árvore completa; raízes = unidades no Brasil sem superior conhecido. */
export function arvore(us: Unidade[]): No[] {
  const ids = new Set(us.map((u) => u.id));
  const montar = (u: Unidade, vistos: Set<string>): No => ({
    unidade: u,
    filhos: filhos(u.id, us).filter((f) => !vistos.has(f.id)).map((f) => montar(f, new Set([...vistos, f.id]))),
  });
  return us
    .filter((u) => u.pais === 'Brasil' && !(superior(u) && ids.has(superior(u)!)))
    .sort(porSigla)
    .map((u) => montar(u, new Set([u.id])));
}
