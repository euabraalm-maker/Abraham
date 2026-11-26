import type { CategoriaId } from './tipos';

export type Forma =
  | 'aviao' | 'losango' | 'quadrado' | 'estrela' | 'circulo' | 'hexagono'
  | 'triangulo' | 'cruz' | 'casa' | 'atomo' | 'pilar';

export interface Categoria {
  rotulo: string;
  forma: Forma;
  cor: { escuro: string; claro: string };
  noMapa: boolean;
}

export const CATEGORIAS: Record<CategoriaId, Categoria> = {
  base: { rotulo: 'Bases Aéreas', forma: 'aviao', cor: { escuro: '#7ee0ff', claro: '#0b6fa8' }, noMapa: true },
  comando: { rotulo: 'Comandos e COMAR', forma: 'estrela', cor: { escuro: '#ff8ac8', claro: '#b3266f' }, noMapa: true },
  decea: { rotulo: 'Órgãos do DECEA', forma: 'losango', cor: { escuro: '#ffcf6e', claro: '#a86a00' }, noMapa: true },
  dtcea: { rotulo: 'Destacamentos (DTCEA)', forma: 'triangulo', cor: { escuro: '#ffa25e', claro: '#b5470f' }, noMapa: true },
  escola: { rotulo: 'Escolas e ensino', forma: 'quadrado', cor: { escuro: '#b19bff', claro: '#5b3fd1' }, noMapa: true },
  grupamento: { rotulo: 'Grupamentos de Apoio', forma: 'hexagono', cor: { escuro: '#6effd8', claro: '#0b8a6c' }, noMapa: true },
  parque: { rotulo: 'Parques de Material', forma: 'circulo', cor: { escuro: '#8dffb5', claro: '#2e7d32' }, noMapa: true },
  saude: { rotulo: 'Saúde', forma: 'cruz', cor: { escuro: '#ff6b7d', claro: '#c62839' }, noMapa: true },
  prefeitura: { rotulo: 'Prefeituras', forma: 'casa', cor: { escuro: '#d6e0ff', claro: '#4a5578' }, noMapa: true },
  ciencia: { rotulo: 'Ciência e Tecnologia', forma: 'atomo', cor: { escuro: '#59a8ff', claro: '#1f4fbf' }, noMapa: true },
  administracao: { rotulo: 'Diretorias, centros e serviços', forma: 'pilar', cor: { escuro: '#e8d28a', claro: '#7a6420' }, noMapa: true },
  esquadrao: { rotulo: 'Esquadrões e grupos', forma: 'aviao', cor: { escuro: '#7ee0ff', claro: '#0b6fa8' }, noMapa: false },
  exterior: { rotulo: 'FAB no exterior', forma: 'circulo', cor: { escuro: '#d6e0ff', claro: '#4a5578' }, noMapa: false },
};

const DECEA = new Set(['CGNA', 'DECEA', 'GEIV', '1º GCC', '1° GCC', 'ICEA', 'CISCEA', 'ASOCEA', 'CIMAER']);
const COMANDO = new Set(['COMAER', 'COMAE', 'COMPREP', 'COMGEP', 'COMGAP', 'EMAER', 'GABAER', 'SEFA']);
const CIENCIA = new Set(['DCTA', 'IAE', 'IEAV', 'IFI', 'IPEV', 'IAOP', 'CLA', 'CLBI', 'CPBV']);
const SAUDE = new Set(['CEMAL', 'IMAE', 'LAQFA']);
const ESCOLA = new Set(['ITA', 'CIAAR']);

/** Mapeia a categoria do catálogo do COMAER (e a sigla) para a categoria de filtro do mapa. */
export function categoriaDoCatalogo(tipoCatalogo: string, sigla: string): CategoriaId {
  const s = sigla.trim().toUpperCase();
  const t = tipoCatalogo.trim().toLowerCase();
  if (/^(CINDACTA|CRCEA)/.test(s) || DECEA.has(s)) return 'decea';
  if (/^(DTCEA|DESTAE|DTS|DSM)/.test(s) || s === 'DASG') return 'dtcea';
  if (/^PAM[ABE]-/.test(s)) return 'parque';
  if (/^GAP-/.test(s) || s === 'GAL' || s === 'GALC') return 'grupamento';
  if (/(^|\s)COMAR$/.test(s) || /COMANDO AÉREO REGIONAL/.test(s) || COMANDO.has(s)) return 'comando';
  if (CIENCIA.has(s)) return 'ciencia';
  if (t === 'hospital' || t === 'odontoclinica' || SAUDE.has(s)) return 'saude';
  if (t === 'esquadrão' || t === 'esquadrao' || t === 'grupo') return 'esquadrao';
  if (['escola', 'academia', 'universidade', 'colegio', 'colégio'].includes(t) || ESCOLA.has(s) || /^CPORAER/.test(s))
    return 'escola';
  if (t === 'instituto') return 'ciencia';
  if (t === 'base') return 'base';
  if (t === 'prefeitura') return 'prefeitura';
  return 'administracao';
}
