// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { iniciarTema } from '../../src/ui/tema';

afterEach(() => vi.restoreAllMocks());

describe('iniciarTema', () => {
  it('sem armazenamento disponível começa escuro e alterna mesmo assim', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado'); });
    const mudancas: string[] = [];
    const t = iniciarTema((x) => mudancas.push(x));
    expect(t.atual()).toBe('escuro');
    expect(document.documentElement.dataset.tema).toBe('escuro');
    t.alternar();
    expect(t.atual()).toBe('claro');
    expect(document.documentElement.dataset.tema).toBe('claro');
    expect(mudancas).toEqual(['claro']);
  });
  it('lembra a escolha salva', () => {
    localStorage.setItem('mapa-om-tema', 'claro');
    expect(iniciarTema(() => {}).atual()).toBe('claro');
    localStorage.clear();
  });
});
