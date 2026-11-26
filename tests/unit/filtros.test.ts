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
  it('"Nenhum" emite conjunto vazio e "Todos" volta a mostrar tudo', () => {
    const el = document.createElement('div');
    const emitidos: (Set<string> | null)[] = [];
    criarFiltros(el, amostraValida(), (ids) => emitidos.push(ids));
    (el.querySelector('[data-acao="nenhum"]') as HTMLButtonElement).click();
    expect(emitidos.at(-1)?.size).toBe(0);
    (el.querySelector('[data-acao="todos"]') as HTMLButtonElement).click();
    expect(emitidos.at(-1)).toBeNull();
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
