import type { Unidade } from '../dados/tipos';
import { normalizar } from './normalizar';

export interface Resultado {
  unidade: Unidade;
  motivo: 'sigla' | 'nome' | 'esquadrao' | 'cidade' | 'aeronave';
  alvo: Unidade;
}

const PENALIDADE_ESQUADRAO = 25;

function pontuarTexto(q: string, alvo: string, inicio: number, palavra: number, contem: number): number {
  if (!alvo) return 0;
  if (alvo.startsWith(q)) return inicio;
  if (alvo.split(' ').some((p, i, ps) => ps.slice(i).join(' ').startsWith(q))) return palavra;
  return alvo.includes(q) ? contem : 0;
}

/** Busca por sigla, nome, esquadrão sediado, cidade e aeronave; mais relevantes primeiro. */
export function buscar(consulta: string, us: Unidade[], limite = 8): Resultado[] {
  const q = normalizar(consulta);
  if (!q) return [];
  const porId = new Map(us.map((u) => [u.id, u]));
  const achados: { r: Resultado; pontos: number }[] = [];
  for (const u of us) {
    const sigla = normalizar(u.sigla);
    const nome = normalizar(u.nome);
    let pontos = 0;
    let motivo: Resultado['motivo'] = 'sigla';
    if (sigla === q) pontos = 100;
    else if (sigla.split(' ').includes(q)) pontos = 85;
    else pontos = pontuarTexto(q, sigla, 90, 85, 80);
    if (sigla.startsWith(q) && sigla !== q) pontos = Math.max(pontos, 90);
    const pNome = pontuarTexto(q, nome, 70, 65, 60);
    if (pNome > pontos) { pontos = pNome; motivo = 'nome'; }
    const esquadrao = u.categoria === 'esquadrao';
    if (esquadrao && pontos > 0) { pontos -= PENALIDADE_ESQUADRAO; motivo = 'esquadrao'; }
    if (!pontos) {
      const pCidade = pontuarTexto(q, normalizar(u.cidade), 40, 38, 0);
      if (pCidade) { pontos = pCidade; motivo = 'cidade'; }
    }
    if (!pontos && u.aeronaves?.some((a) => normalizar(a).includes(q))) { pontos = 30; motivo = 'aeronave'; }
    if (!pontos) continue;
    const alvo = (esquadrao && u.sediadoEm && porId.get(u.sediadoEm)) || u;
    achados.push({ r: { unidade: u, motivo, alvo }, pontos });
  }
  achados.sort((a, b) => b.pontos - a.pontos || a.r.unidade.sigla.localeCompare(b.r.unidade.sigla, 'pt-BR'));
  return achados.slice(0, limite).map((a) => a.r);
}
