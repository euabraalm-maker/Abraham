// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderizarFicha } from '../../src/ui/ficha';
import { amostraValida, unidade } from './amostra';

const us = amostraValida();
us.push(unidade({ id: 'dtcea-x', sigla: 'DTCEA-X', categoria: 'dtcea', subordinadaA: 'baan', site: null }));
const porId = new Map(us.map((u) => [u.id, u]));
const ficha = (id: string, modo: 'painel' | 'pagina' = 'painel') => renderizarFicha(porId.get(id)!, porId, modo);

describe('renderizarFicha', () => {
  it('ficha básica não mostra histórico, aeronaves nem imagem', () => {
    const el = ficha('dtcea-x');
    expect(el.querySelector('.historico')).toBeNull();
    expect(el.querySelector('.aeronaves')).toBeNull();
    expect(el.querySelector('img')).toBeNull();
  });
  it('ficha completa mostra histórico e aeronaves', () => {
    const el = ficha('baan');
    expect(el.querySelector('.historico')?.textContent).toContain('Criada em 1972');
    expect(el.querySelector('.aeronaves')?.textContent).toContain('F-39E Gripen');
  });
  it('mostra selo de posição aproximada', () => {
    expect(ficha('baan').querySelector('.selo')?.textContent).toContain('posição aproximada');
  });
  it('caminho tem um link por elo da cadeia, em ordem', () => {
    const links = [...ficha('dtcea-x').querySelectorAll('.caminho a')].map((a) => a.textContent);
    expect(links).toEqual(['COMAER', 'BAAN', 'DTCEA-X']);
  });
  it('sem site, sem botão de site oficial', () => {
    expect(ficha('dtcea-x').querySelector('a.site-oficial')).toBeNull();
    expect(ficha('baan').querySelector('a.site-oficial')?.getAttribute('target')).toBe('_blank');
  });
  it('não deixa rótulos sem valor', () => {
    for (const id of porId.keys()) {
      const el = ficha(id);
      el.querySelectorAll('dd').forEach((dd) => expect(dd.textContent?.trim()).not.toBe(''));
    }
  });
  it('link de nova aba aponta para a página da unidade', () => {
    const a = ficha('baan').querySelector('a.nova-aba')!;
    expect(a.getAttribute('href')).toBe('om.html?id=baan');
    expect(a.getAttribute('target')).toBe('_blank');
  });
  it('na página própria não há botão de nova aba', () => {
    expect(ficha('baan', 'pagina').querySelector('a.nova-aba')).toBeNull();
  });
  it('base lista os esquadrões sediados', () => {
    expect(ficha('baan').querySelector('.esquadroes')?.textContent).toContain('1º GDA');
  });
  it('data de revisão em DD/MM/AAAA', () => {
    expect(ficha('baan').textContent).toContain('Revisado em 26/11/2026');
  });
});

describe('sede de esquadrão não confirmada', () => {
  it('ficha do esquadrão mostra "sede a conferir"', () => {
    const el = ficha('1-gda');
    expect([...el.querySelectorAll('.selo')].some((s) => s.textContent === 'sede a conferir')).toBe(true);
  });
  it('lista de esquadrões da base avisa que a sede está a conferir', () => {
    expect(ficha('baan').querySelector('.esquadroes')?.textContent).toContain('sede a conferir');
  });
});

describe('site oficial', () => {
  it('botão do site aparece logo abaixo do nome', () => {
    const el = ficha('baan');
    const titulo = el.querySelector('.titulo')!;
    expect(titulo.nextElementSibling?.querySelector('a.site-oficial')).not.toBeNull();
  });
  it('sem site próprio, aponta para a página do superior mais próximo que tenha site', () => {
    const a = ficha('dtcea-x').querySelector('a.site-superior');
    expect(a?.textContent).toContain('BAAN');
    expect(a?.getAttribute('href')).toBe('https://www.fab.mil.br/');
    expect(ficha('dtcea-x').textContent).toContain('Sem site próprio');
  });
});
