import type { CategoriaId, Unidade } from './tipos';
import { CATEGORIAS } from './categorias';

export interface Grupo { anfitriao: Unidade; satelites: Unidade[] }

/** Ordem de destaque: quem fica no centro quando várias unidades dividem o mesmo ponto. */
const DESTAQUE: CategoriaId[] = ['base', 'comando', 'decea', 'escola', 'parque', 'ciencia', 'grupamento', 'dtcea', 'saude', 'prefeitura', 'administracao'];
const chave = (c: [number, number]) => `${c[0].toFixed(5)},${c[1].toFixed(5)}`;
const porSigla = (a: Unidade, b: Unidade) => a.sigla.localeCompare(b.sigla, 'pt-BR', { numeric: true });

/**
 * Agrupa as unidades visíveis por ponto: a de maior destaque fica no centro (anfitrião) e as demais
 * do mesmo ponto, mais os esquadrões sediados em qualquer uma delas, orbitam ao redor (satélites).
 */
export function agruparPorLocal(us: Unidade[], visiveis: Set<string> | null): Grupo[] {
  const noMapa = us.filter((u) => u.pais === 'Brasil' && CATEGORIAS[u.categoria].noMapa && u.coord && (!visiveis || visiveis.has(u.id)));
  const porPonto = new Map<string, Unidade[]>();
  for (const u of noMapa) {
    const k = chave(u.coord!);
    porPonto.set(k, [...(porPonto.get(k) ?? []), u]);
  }
  const esquadroes = us.filter((u) => u.categoria === 'esquadrao' && u.sediadoEm);
  return [...porPonto.values()].map((grupo) => {
    grupo.sort((a, b) => DESTAQUE.indexOf(a.categoria) - DESTAQUE.indexOf(b.categoria) || porSigla(a, b));
    const ids = new Set(grupo.map((u) => u.id));
    const sediados = esquadroes.filter((e) => ids.has(e.sediadoEm!)).sort(porSigla);
    return { anfitriao: grupo[0], satelites: [...grupo.slice(1).sort(porSigla), ...sediados] };
  });
}
