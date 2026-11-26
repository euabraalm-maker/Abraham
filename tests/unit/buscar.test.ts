import { describe, it, expect } from 'vitest';
import { buscar } from '../../src/busca/buscar';
import { normalizar } from '../../src/busca/normalizar';
import { unidade } from './amostra';

const us = [
  unidade({ id: 'cindacta-1', sigla: 'CINDACTA I', nome: 'Primeiro Centro Integrado de Defesa Aérea e Controle de Tráfego Aéreo', categoria: 'decea' }),
  unidade({ id: 'cindacta-4', sigla: 'CINDACTA IV', nome: 'Quarto Centro Integrado de Defesa Aérea e Controle de Tráfego Aéreo', categoria: 'decea', cidade: 'Manaus', uf: 'AM' }),
  unidade({ id: 'dtcea-gw', sigla: 'DTCEA-GW', nome: 'Destacamento de Controle do Espaço Aéreo de Guaratinguetá', categoria: 'dtcea', cidade: 'Guaratinguetá', uf: 'SP' }),
  unidade({ id: 'pagw', sigla: 'PAGW', nome: 'Prefeitura de Aeronáutica de Guaratinguetá', categoria: 'prefeitura', cidade: 'Guaratinguetá', uf: 'SP' }),
  unidade({ id: 'baan', sigla: 'BAAN', nome: 'Base Aérea de Anápolis', categoria: 'base', cidade: 'Anápolis', uf: 'GO', aeronaves: ['F-39E Gripen', 'E-99'] }),
  unidade({ id: '1-gda', sigla: '1º GDA', nome: 'Primeiro Grupo de Defesa Aérea', categoria: 'esquadrao', cidade: 'Anápolis', uf: 'GO', coord: null, sediadoEm: 'baan' }),
  unidade({ id: 'baco', sigla: 'BACO', nome: 'Base Aérea de Canoas', categoria: 'base', cidade: 'Canoas', uf: 'RS' }),
  unidade({ id: '1-14-gav', sigla: '1º/14º GAV', nome: 'Primeiro Esquadrão do Décimo Quarto Grupo de Aviação — Esquadrão Pampa', categoria: 'esquadrao', cidade: 'Canoas', uf: 'RS', coord: null, sediadoEm: 'baco' }),
];
const primeiro = (q: string) => buscar(q, us)[0]?.unidade.id;

describe('normalizar', () => {
  it('remove acento, ordinal, hífen e converte romano', () => {
    expect(normalizar('CINDACTA IV')).toBe('cindacta 4');
    expect(normalizar('1º/14º GAV')).toBe('1 14 gav');
    expect(normalizar('Anápolis')).toBe('anapolis');
    expect(normalizar('DTCEA-GW')).toBe('dtcea gw');
  });
});

describe('buscar', () => {
  it('cindacta 1 acha CINDACTA I primeiro', () => {
    const r = buscar('cindacta 1', us);
    expect(r[0].unidade.id).toBe('cindacta-1');
    expect(r.findIndex((x) => x.unidade.id === 'cindacta-4')).not.toBe(0);
  });
  it('variações de ordinal dão o mesmo primeiro resultado', () => {
    expect(primeiro('1o gda')).toBe('1-gda');
    expect(primeiro('1º GDA')).toBe('1-gda');
    expect(primeiro('1 gda')).toBe('1-gda');
  });
  it('dtcea gw e gw trazem DTCEA-GW no topo', () => {
    expect(primeiro('dtcea gw')).toBe('dtcea-gw');
    expect(primeiro('gw')).toBe('dtcea-gw');
  });
  it('busca sem acento encontra nome com acento', () => {
    expect(buscar('anapolis', us).some((r) => r.unidade.id === 'baan')).toBe(true);
  });
  it('apelido de esquadrão leva à base sede', () => {
    const r = buscar('pampa', us)[0];
    expect(r.motivo).toBe('esquadrao');
    expect(r.unidade.id).toBe('1-14-gav');
    expect(r.alvo.id).toBe('baco');
  });
  it('aeronave encontra a base', () => {
    const r = buscar('f-39', us).find((x) => x.unidade.id === 'baan');
    expect(r?.motivo).toBe('aeronave');
  });
  it('consulta vazia não retorna nada', () => {
    expect(buscar('  ', us)).toEqual([]);
  });
  it('respeita o limite', () => {
    expect(buscar('a', us, 3).length).toBeLessThanOrEqual(3);
  });
});
