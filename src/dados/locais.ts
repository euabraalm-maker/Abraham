import type { CategoriaId, Unidade } from './tipos';
import { CATEGORIAS } from './categorias';

export interface Grupo { anfitriao: Unidade; satelites: Unidade[] }

/** Ordem de destaque: quem fica no centro quando várias unidades dividem o mesmo ponto. */
const DESTAQUE: CategoriaId[] = ['base', 'comando', 'decea', 'escola', 'parque', 'ciencia', 'grupamento', 'dtcea', 'saude', 'prefeitura', 'administracao'];
const chave = (c: [number, number]) => `${c[0].toFixed(5)},${c[1].toFixed(5)}`;
const porSigla = (a: Unidade, b: Unidade) => a.sigla.localeCompare(b.sigla, 'pt-BR', { numeric: true });

/**
 * Agrupa as unidades visíveis por ponto: a de mais alto nível hierárquico (desempate: tipo) fica no centro (anfitrião) e as demais
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
  const porId = new Map(us.map((u) => [u.id, u]));
  /** Quantos superiores (diretos ou indiretos) a unidade tem dentro do próprio grupo. */
  const superioresNoGrupo = (u: Unidade, ids: Set<string>) => {
    let n = 0;
    const vistos = new Set<string>();
    for (let s = u.subordinadaA; s && !vistos.has(s); s = porId.get(s)?.subordinadaA ?? null) {
      vistos.add(s);
      if (ids.has(s)) n++;
    }
    return n;
  };
  return [...porPonto.values()].map((grupo) => {
    // no centro fica quem não tem superior no grupo; o tipo só desempata
    const idsGrupo = new Set(grupo.map((u) => u.id));
    const nivel = new Map(grupo.map((u) => [u.id, superioresNoGrupo(u, idsGrupo)]));
    // quantas unidades do ponto estão abaixo dela (quem chefia mais gente no local vem antes)
    const abaixo = new Map(grupo.map((u) => [u.id, 0]));
    for (const u of grupo) {
      const vistos = new Set<string>();
      for (let s = u.subordinadaA; s && !vistos.has(s); s = porId.get(s)?.subordinadaA ?? null) {
        vistos.add(s);
        if (abaixo.has(s)) abaixo.set(s, abaixo.get(s)! + 1);
      }
    }
    grupo.sort((a, b) => nivel.get(a.id)! - nivel.get(b.id)! || abaixo.get(b.id)! - abaixo.get(a.id)! || DESTAQUE.indexOf(a.categoria) - DESTAQUE.indexOf(b.categoria) || porSigla(a, b));
    const ids = new Set(grupo.map((u) => u.id));
    const sediados = esquadroes.filter((e) => ids.has(e.sediadoEm!)).sort(porSigla);
    return { anfitriao: grupo[0], satelites: [...grupo.slice(1).sort(porSigla), ...sediados] };
  });
}
