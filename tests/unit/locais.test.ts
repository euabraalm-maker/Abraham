import { describe, it, expect } from 'vitest';
import { agruparPorLocal } from '../../src/dados/locais';
import { unidade } from './amostra';

const P: [number, number] = [-43.25, -22.81];
const us = [
  unidade({ id: 'bagl', sigla: 'BAGL', categoria: 'base', coord: P }),
  unidade({ id: 'pagl', sigla: 'PAGL', categoria: 'prefeitura', coord: P }),
  unidade({ id: 'dtcea-gl', sigla: 'DTCEA-GL', categoria: 'dtcea', coord: P }),
  unidade({ id: 'esq', sigla: '1º/2º GT', categoria: 'esquadrao', coord: null, sediadoEm: 'bagl' }),
  unidade({ id: 'sozinha', sigla: 'SOZ', categoria: 'administracao', coord: [-50, -10] }),
];

describe('agruparPorLocal', () => {
  it('unidades no mesmo ponto orbitam a de maior destaque, junto com os esquadrões sediados', () => {
    const g = agruparPorLocal(us, null);
    const gl = g.find((x) => x.anfitriao.id === 'bagl')!;
    expect(gl.satelites.map((s) => s.id).sort()).toEqual(['dtcea-gl', 'esq', 'pagl']);
    expect(g.find((x) => x.anfitriao.id === 'sozinha')!.satelites).toEqual([]);
    expect(g.length).toBe(2);
  });
  it('com filtro, o anfitrião é a unidade visível de maior destaque', () => {
    const g = agruparPorLocal(us, new Set(['pagl', 'dtcea-gl']));
    expect(g.length).toBe(1);
    expect(g[0].anfitriao.id).toBe('dtcea-gl');
    expect(g[0].satelites.map((s) => s.id)).toEqual(['pagl']);
  });
  it('esquadrão só aparece se a sede estiver visível', () => {
    const g = agruparPorLocal(us, new Set(['sozinha']));
    expect(g.flatMap((x) => x.satelites)).toEqual([]);
  });
});

describe('hierarquia manda no centro da órbita', () => {
  it('a unidade superior fica no centro, mesmo sendo de um tipo de menor destaque', () => {
    const Q: [number, number] = [-43.21, -22.87];
    const lista = [
      unidade({ id: 'pame-rj', sigla: 'PAME-RJ', categoria: 'parque', coord: Q }),
      unidade({ id: 'cgtec', sigla: 'CGTEC', categoria: 'decea', coord: Q, subordinadaA: 'pame-rj' }),
    ];
    const [g] = agruparPorLocal(lista, null);
    expect(g.anfitriao.id).toBe('pame-rj');
    expect(g.satelites.map((s) => s.id)).toEqual(['cgtec']);
  });
  it('vale também para subordinação indireta (neto)', () => {
    const Q: [number, number] = [-43.21, -22.87];
    const lista = [
      unidade({ id: 'avo', sigla: 'AVO', categoria: 'prefeitura', coord: Q }),
      unidade({ id: 'pai', sigla: 'PAI', categoria: 'administracao', coord: [-40, -10], subordinadaA: 'avo' }),
      unidade({ id: 'neto', sigla: 'NETO', categoria: 'base', coord: Q, subordinadaA: 'pai' }),
    ];
    const g = agruparPorLocal(lista, null).find((x) => x.satelites.length)!;
    expect(g.anfitriao.id).toBe('avo');
  });
});
