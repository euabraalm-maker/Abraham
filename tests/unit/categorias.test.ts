import { describe, it, expect } from 'vitest';
import { CATEGORIAS, categoriaDoCatalogo } from '../../src/dados/categorias';

describe('categoriaDoCatalogo', () => {
  it.each([
    ['Centro', 'CINDACTA II', 'decea'],
    ['Destacamento', 'DTCEA-GW', 'dtcea'],
    ['Destacamento', 'DESTAE-CV', 'dtcea'],
    ['Grupo', '1º GCC', 'decea'],
    ['Grupo', '1° GDA', 'esquadrao'],
    ['Esquadrão', '1º/14º GAV - ESQUADRÃO PAMPA', 'esquadrao'],
    ['Hospital', 'HFAB', 'saude'],
    ['Odontoclinica', 'OABR', 'saude'],
    ['Instituto', 'ITA', 'escola'],
    ['Instituto', 'ICEA', 'decea'],
    ['Instituto', 'IAE', 'ciencia'],
    ['Base', 'BAAN', 'base'],
    ['Servico', 'SERIPA I', 'administracao'],
    ['Comando', 'II COMAR', 'comando'],
    ['Departamento', 'DCTA', 'ciencia'],
    ['Parque', 'PAMA-LS', 'parque'],
    ['Grupamento', 'GAP-BR', 'grupamento'],
    ['Prefeitura', 'PAAN', 'prefeitura'],
    ['Academia', 'AFA', 'escola'],
  ])('(%s, %s) → %s', (tipo, sigla, esperado) => {
    expect(categoriaDoCatalogo(tipo, sigla)).toBe(esperado);
  });
});

describe('CATEGORIAS', () => {
  it('esquadrão e exterior não aparecem no mapa', () => {
    expect(CATEGORIAS.esquadrao.noMapa).toBe(false);
    expect(CATEGORIAS.exterior.noMapa).toBe(false);
  });
  it('cada categoria do mapa tem forma e cores distintas', () => {
    const doMapa = Object.values(CATEGORIAS).filter((c) => c.noMapa);
    expect(doMapa.length).toBe(11);
    for (const tema of ['escuro', 'claro'] as const) {
      const cores = new Set(doMapa.map((c) => c.cor[tema]));
      expect(cores.size).toBe(doMapa.length);
    }
    const formas = new Set(doMapa.map((c) => c.forma));
    expect(formas.size).toBe(doMapa.length);
  });
});
