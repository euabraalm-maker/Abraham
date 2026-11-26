import { describe, it, expect } from 'vitest';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { criarEstilo } from '../../src/mapa/estilo';

describe('criarEstilo', () => {
  for (const tema of ['escuro', 'claro', 'teste'] as const) {
    it(`estilo ${tema} é válido`, () => {
      expect(validateStyleMin(criarEstilo(tema)).map((e) => e.message)).toEqual([]);
    });
  }
  it('não desenha divisas municipais (admin_level ≥ 5)', () => {
    for (const tema of ['escuro', 'claro'] as const) {
      const texto = JSON.stringify(criarEstilo(tema).layers);
      const niveis = [...texto.matchAll(/"admin_level"\]?,(\d+)/g)].map((m) => Number(m[1]));
      expect(niveis.length).toBeGreaterThan(0);
      expect(niveis.every((n) => n < 5)).toBe(true);
    }
  });
  it('estilo de teste não usa rede', () => {
    expect(JSON.stringify(criarEstilo('teste'))).not.toMatch(/https?:/);
  });
  it('tem camadas de UFs e regiões', () => {
    const ids = criarEstilo('escuro').layers.map((l) => l.id);
    expect(ids).toContain('ufs-linha');
    expect(ids).toContain('regioes-preenchimento');
  });
});
