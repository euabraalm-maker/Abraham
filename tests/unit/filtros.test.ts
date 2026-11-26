// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { criarFiltros } from '../../src/ui/filtros';
import { amostraValida } from './amostra';

describe('criarFiltros', () => {
  it('contagem exclui esquadrões e exterior', () => {
    const el = document.createElement('div');
    criarFiltros(el, amostraValida(), () => {});
    const rotulos = [...el.querySelectorAll('label')].map((l) => l.textContent ?? '');
    expect(rotulos.some((t) => t.includes('Bases Aéreas (1)'))).toBe(true);
    expect(rotulos.some((t) => /Esquadr|exterior/i.test(t))).toBe(false);
  });
  it('escolhas só valem ao clicar em "Aplicar"', () => {
    const el = document.createElement('div');
    const emitidos: (Set<string> | null)[] = [];
    let fechou = 0;
    criarFiltros(el, amostraValida(), (ids) => emitidos.push(ids), () => fechou++);
    (el.querySelector('[data-acao="nenhum"]') as HTMLButtonElement).click();
    expect(emitidos).toEqual([]);
    (el.querySelector('[data-acao="aplicar"]') as HTMLButtonElement).click();
    expect(emitidos.at(-1)?.size).toBe(0);
    expect(fechou).toBe(1);
    (el.querySelector('[data-acao="todos"]') as HTMLButtonElement).click();
    (el.querySelector('[data-acao="aplicar"]') as HTMLButtonElement).click();
    expect(emitidos.at(-1)).toBeNull();
  });
  it('"Cancelar" fecha e desfaz as escolhas não aplicadas', () => {
    const el = document.createElement('div');
    const emitidos: (Set<string> | null)[] = [];
    let fechou = 0;
    criarFiltros(el, amostraValida(), (ids) => emitidos.push(ids), () => fechou++);
    (el.querySelector('[data-acao="nenhum"]') as HTMLButtonElement).click();
    (el.querySelector('[data-acao="cancelar"]') as HTMLButtonElement).click();
    expect(emitidos).toEqual([]);
    expect(fechou).toBe(1);
    expect((el.querySelector('#filtro-base') as HTMLInputElement).checked).toBe(true);
  });
  it('mostrarSubordinados emite só a subárvore e mostra o chip', () => {
    const el = document.createElement('div');
    const emitidos: (Set<string> | null)[] = [];
    const f = criarFiltros(el, amostraValida(), (ids) => emitidos.push(ids));
    f.mostrarSubordinados('comaer');
    expect([...(emitidos.at(-1) ?? [])].sort()).toEqual(['1-gda', 'baan', 'comaer']);
    expect(el.textContent).toContain('Subordinados a COMAER');
    f.limpar();
    expect(emitidos.at(-1)).toBeNull();
  });
});
