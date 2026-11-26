import { it, expect } from 'vitest';
import bruto from '../../data/unidades.json';
import { esquemaUnidade } from '../../src/dados/tipos';
import { validarConjunto } from '../../src/dados/validar';

it('data/unidades.json segue o esquema e passa na validação', () => {
  const us = (bruto as unknown[]).map((u) => esquemaUnidade.parse(u));
  expect(validarConjunto(us)).toEqual([]);
});
