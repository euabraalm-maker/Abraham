import { describe, it, expect } from 'vitest';
import { cadeia, filhos, descendentes, arvore } from '../../src/dados/hierarquia';
import { carregar } from '../../src/dados/carregar';
import { unidade } from './amostra';

const us = [
  unidade({ id: 'comaer', sigla: 'COMAER' }),
  unidade({ id: 'decea', sigla: 'DECEA', subordinadaA: 'comaer' }),
  unidade({ id: 'cindacta-1', sigla: 'CINDACTA I', subordinadaA: 'decea' }),
  unidade({ id: 'dtcea-an', sigla: 'DTCEA-AN', subordinadaA: 'cindacta-1' }),
  unidade({ id: 'esq', sigla: 'ESQ', categoria: 'esquadrao', coord: null, sediadoEm: 'cindacta-1' }),
  unidade({ id: 'orfa', sigla: 'ORFA', subordinadaA: 'nao-existe' }),
  unidade({ id: 'fora', sigla: 'FORA', pais: 'Suécia', coord: null, categoria: 'exterior' }),
];
const porId = new Map(us.map((u) => [u.id, u]));
const ids = (xs: { id: string }[]) => xs.map((x) => x.id);

describe('hierarquia', () => {
  it('cadeia vai do topo até a própria unidade', () => {
    expect(ids(cadeia('dtcea-an', porId))).toEqual(['comaer', 'decea', 'cindacta-1', 'dtcea-an']);
  });
  it('cadeia da raiz é só ela', () => {
    expect(ids(cadeia('comaer', porId))).toEqual(['comaer']);
  });
  it('cadeia não trava em ciclo', () => {
    const a = unidade({ id: 'a', sigla: 'A', subordinadaA: 'b' });
    const b = unidade({ id: 'b', sigla: 'B', subordinadaA: 'a' });
    const m = new Map([[a.id, a], [b.id, b]]);
    expect(cadeia('a', m).length).toBeLessThanOrEqual(2);
  });
  it('filhos inclui subordinadas e sediadas, por sigla', () => {
    expect(ids(filhos('cindacta-1', us))).toEqual(['dtcea-an', 'esq']);
  });
  it('descendentes inclui a própria, DTCEA e esquadrão sediado', () => {
    expect([...descendentes('cindacta-1', us)].sort()).toEqual(['cindacta-1', 'dtcea-an', 'esq']);
  });
  it('árvore: raízes são unidades sem superior conhecido, no Brasil', () => {
    const raizes = arvore(us).map((n) => n.unidade.id);
    expect(raizes).toContain('comaer');
    expect(raizes).toContain('orfa');
    expect(raizes).not.toContain('fora');
    const comaer = arvore(us).find((n) => n.unidade.id === 'comaer')!;
    expect(comaer.filhos[0].filhos[0].filhos.map((n) => n.unidade.id)).toEqual(['dtcea-an', 'esq']);
  });
  it('carregar indexa os dados reais', () => {
    const { lista, porId: m } = carregar();
    expect(lista.length).toBeGreaterThan(250);
    expect(m.get('eear')?.sigla).toBe('EEAR');
  });
});
