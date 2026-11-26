import { describe, it, expect } from 'vitest';
import { validarConjunto } from '../../src/dados/validar';
import { amostraValida, unidade } from './amostra';

const erros = (mudar: (us: ReturnType<typeof amostraValida>) => void) => {
  const us = amostraValida();
  mudar(us);
  return validarConjunto(us);
};
const algumCom = (es: string[], txt: string) => es.some((e) => e.includes(txt));

describe('validarConjunto', () => {
  it('aceita a amostra válida', () => {
    expect(validarConjunto(amostraValida())).toEqual([]);
  });
  it('rejeita id duplicado', () => {
    expect(algumCom(erros((us) => us.push(unidade({ id: 'baan', sigla: 'X' }))), 'baan')).toBe(true);
  });
  it('rejeita subordinadaA inexistente', () => {
    expect(algumCom(erros((us) => (us[1].subordinadaA = 'nada')), 'baan')).toBe(true);
  });
  it('rejeita sediadoEm inexistente', () => {
    expect(algumCom(erros((us) => (us[2].sediadoEm = 'nada')), '1-gda')).toBe(true);
  });
  it('rejeita ciclo de subordinação', () => {
    expect(algumCom(erros((us) => (us[0].subordinadaA = 'baan')), 'ciclo')).toBe(true);
  });
  it('rejeita esquadrão sem sediadoEm', () => {
    expect(algumCom(erros((us) => delete us[2].sediadoEm), '1-gda')).toBe(true);
  });
  it('rejeita OM no Brasil sem coordenada', () => {
    expect(algumCom(erros((us) => (us[1].coord = null)), 'baan')).toBe(true);
  });
  it('rejeita coordenada fora do Brasil', () => {
    expect(algumCom(erros((us) => (us[1].coord = [-10, -16])), 'baan')).toBe(true);
  });
  it('rejeita ficha completa sem histórico', () => {
    expect(algumCom(erros((us) => delete us[1].historico), 'baan')).toBe(true);
  });
  it('rejeita telefone em qualquer campo', () => {
    expect(algumCom(erros((us) => (us[1].historico = 'Protocolo: (12) 3947-6679')), 'baan')).toBe(true);
  });
  it('rejeita link intraer', () => {
    expect(algumCom(erros((us) => (us[1].site = 'http://www.cojaer.intraer')), 'baan')).toBe(true);
  });
  it('rejeita e-mail', () => {
    expect(algumCom(erros((us) => (us[1].historico = 'protocolo.decea@fab.mil.br')), 'baan')).toBe(true);
  });
  it('rejeita revisadoEm em formato errado', () => {
    expect(algumCom(erros((us) => (us[1].revisadoEm = '26/11/2026')), 'baan')).toBe(true);
  });
});
