// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { criarOrganograma } from '../../src/ui/organograma';
import { amostraValida, unidade } from './amostra';

const dados = () => {
  const us = amostraValida();
  us.push(unidade({ id: 'decea', sigla: 'DECEA', categoria: 'decea', subordinadaA: 'comaer' }));
  us.push(unidade({ id: 'cindacta-2', sigla: 'CINDACTA II', categoria: 'decea', subordinadaA: 'decea' }));
  us.push(unidade({ id: 'dtcea-gw', sigla: 'DTCEA-GW', categoria: 'dtcea', subordinadaA: 'cindacta-2' }));
  us.push(unidade({ id: 'orfa', sigla: 'ORFA' }));
  return us;
};

describe('criarOrganograma', () => {
  it('a raiz é o COMAER, com o primeiro nível visível', () => {
    const el = document.createElement('div');
    criarOrganograma(el, dados(), () => {});
    const raiz = el.querySelector('.arvore > li > .no');
    expect(raiz?.textContent).toContain('COMAER');
    expect(el.querySelector('[data-id="decea"]')).not.toBeNull();
    expect(el.querySelector('[data-id="cindacta-2"]')).toBeNull();
  });
  it('destacar abre toda a cadeia e marca o nó', () => {
    const el = document.createElement('div');
    const org = criarOrganograma(el, dados(), () => {});
    org.destacar('dtcea-gw');
    const no = el.querySelector('[data-id="dtcea-gw"]');
    expect(no?.classList.contains('destaque')).toBe(true);
    expect(el.querySelector('[data-id="cindacta-2"]')?.closest('li')?.getAttribute('aria-expanded')).toBe('true');
  });
  it('unidades sem subordinação ficam no grupo "Subordinação a conferir"', () => {
    const el = document.createElement('div');
    criarOrganograma(el, dados(), () => {});
    const grupo = el.querySelector('.grupo-conferir');
    expect(grupo?.textContent).toContain('Subordinação a conferir');
  });
  it('clicar num nó chama aoEscolher com o id', () => {
    const el = document.createElement('div');
    const escolhidos: string[] = [];
    criarOrganograma(el, dados(), (id) => escolhidos.push(id));
    (el.querySelector('[data-id="decea"]') as HTMLButtonElement).click();
    expect(escolhidos).toEqual(['decea']);
  });
});
