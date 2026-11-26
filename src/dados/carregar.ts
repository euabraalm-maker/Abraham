import bruto from '../../data/unidades.json';
import type { Unidade } from './tipos';

/** Unidades do arquivo de dados, com índice por id. */
export function carregar(): { lista: Unidade[]; porId: Map<string, Unidade> } {
  const lista = bruto as Unidade[];
  return { lista, porId: new Map(lista.map((u) => [u.id, u])) };
}
