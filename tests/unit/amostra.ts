import type { Unidade } from '../../src/dados/tipos';

const base = (o: Partial<Unidade> & Pick<Unidade, 'id' | 'sigla'>): Unidade => ({
  nome: o.sigla,
  categoria: 'administracao',
  tipoCatalogo: 'Centro',
  cidade: 'Brasília',
  uf: 'DF',
  pais: 'Brasil',
  coord: [-47.9, -15.8],
  coordSituacao: 'aproximada',
  subordinadaA: null,
  site: null,
  ficha: 'basica',
  situacao: { nome: 'confirmado', localizacao: 'a-conferir', subordinacao: 'a-conferir' },
  fontes: [{ titulo: 'Catálogo do COMAER (PDF)', url: 'https://www.fab.mil.br/' }],
  revisadoEm: '2026-11-26',
  ...o,
});

export const unidade = base;

export function amostraValida(): Unidade[] {
  return [
    base({ id: 'comaer', sigla: 'COMAER', nome: 'Comando da Aeronáutica', categoria: 'comando' }),
    base({
      id: 'baan', sigla: 'BAAN', nome: 'Base Aérea de Anápolis', categoria: 'base', tipoCatalogo: 'Base',
      cidade: 'Anápolis', uf: 'GO', coord: [-48.97, -16.23], subordinadaA: 'comaer',
      ficha: 'completa', historico: 'Criada em 1972.', aeronaves: ['F-39E Gripen'],
      site: 'https://www.fab.mil.br/',
    }),
    base({
      id: '1-gda', sigla: '1º GDA', nome: 'Primeiro Grupo de Defesa Aérea', categoria: 'esquadrao',
      tipoCatalogo: 'Grupo', cidade: 'Anápolis', uf: 'GO', coord: null, sediadoEm: 'baan', subordinadaA: 'baan',
    }),
    base({
      id: 'cabw', sigla: 'CABW', nome: 'Comissão Aeronáutica Brasileira em Washington', categoria: 'exterior',
      tipoCatalogo: 'Comissão / Missão', cidade: 'Washington', uf: null, pais: 'Estados Unidos', coord: null,
    }),
  ];
}
