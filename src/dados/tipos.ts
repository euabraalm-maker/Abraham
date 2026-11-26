import { z } from 'zod';

export type CategoriaId =
  | 'base' | 'comando' | 'decea' | 'dtcea' | 'escola' | 'grupamento' | 'parque'
  | 'saude' | 'prefeitura' | 'ciencia' | 'administracao' | 'esquadrao' | 'exterior';
export type Situacao = 'confirmado' | 'a-conferir';
export interface Fonte { titulo: string; url: string }
export interface Imagem { arquivo: string; credito: string; licenca: string; origem: string }
export interface Unidade {
  id: string;
  sigla: string;
  nome: string;
  categoria: CategoriaId;
  tipoCatalogo: string;
  cidade: string;
  uf: string | null;
  pais: string;
  coord: [number, number] | null;
  coordSituacao: 'exata' | 'aproximada';
  subordinadaA: string | null;
  sediadoEm?: string;
  site: string | null;
  ficha: 'basica' | 'completa';
  historico?: string;
  aeronaves?: string[];
  brasao?: Imagem;
  foto?: Imagem;
  situacao: { nome: Situacao; localizacao: Situacao; subordinacao: Situacao };
  fontes: Fonte[];
  revisadoEm: string;
}

const situacao = z.enum(['confirmado', 'a-conferir']);
const imagem = z.object({ arquivo: z.string(), credito: z.string(), licenca: z.string(), origem: z.string() });

export const CATEGORIA_IDS = [
  'base', 'comando', 'decea', 'dtcea', 'escola', 'grupamento', 'parque',
  'saude', 'prefeitura', 'ciencia', 'administracao', 'esquadrao', 'exterior',
] as const satisfies readonly CategoriaId[];

export const esquemaUnidade: z.ZodType<Unidade> = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  sigla: z.string().min(1),
  nome: z.string().min(1),
  categoria: z.enum(CATEGORIA_IDS),
  tipoCatalogo: z.string(),
  cidade: z.string(),
  uf: z.string().length(2).nullable(),
  pais: z.string(),
  coord: z.tuple([z.number(), z.number()]).nullable(),
  coordSituacao: z.enum(['exata', 'aproximada']),
  subordinadaA: z.string().nullable(),
  sediadoEm: z.string().optional(),
  site: z.string().url().nullable(),
  ficha: z.enum(['basica', 'completa']),
  historico: z.string().optional(),
  aeronaves: z.array(z.string()).optional(),
  brasao: imagem.optional(),
  foto: imagem.optional(),
  situacao: z.object({ nome: situacao, localizacao: situacao, subordinacao: situacao }),
  fontes: z.array(z.object({ titulo: z.string(), url: z.string().url() })),
  revisadoEm: z.string(),
}).strict();
