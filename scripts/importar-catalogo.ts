/**
 * Importação única do catálogo do COMAER para data/unidades.json.
 * Uso: npx vite-node scripts/importar-catalogo.ts <extracao.json>
 * A extração (gerada do PDF, que não é versionado) traz por ficha: sigla, nomeIdx,
 * nomePdf, cat, loc, cep, site. Telefones, e-mails e links intraer não são lidos.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { categoriaDoCatalogo } from '../src/dados/categorias';
import type { Unidade } from '../src/dados/tipos';

interface Bruto { sigla: string; nomeIdx: string; nomePdf: string; cat: string; loc: string; cep: string | null; site: string | null }

const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos', 'a', 'o', 'ao', 'à', 'por', 'para']);
const ROMANOS = /^(I|II|III|IV|V|VI|VII|VIII|IX|X)$/;

export function tituloPt(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => {
      const up = p.toUpperCase();
      if (ROMANOS.test(up.replace(/[,.]/g, ''))) return up;
      if (/^\(?[a-z]{2,}-?[a-z]*\)?$/.test(p) && /^(\(?para-sar\)?|sar)$/.test(p)) return up;
      if (i > 0 && MINUSCULAS.has(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(' ');
}

export function slug(sigla: string): string {
  return sigla
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[º°ª]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const EXTERIOR: Record<string, { cidade: string; pais: string }> = {
  'ADIDÂNCIA INDONÉSIA': { cidade: 'Jacarta', pais: 'Indonésia' },
  'ADIDÂNCIA SUÉCIA': { cidade: 'Estocolmo', pais: 'Suécia' },
  CABW: { cidade: 'Washington', pais: 'Estados Unidos' },
  CABE: { cidade: 'Londres', pais: 'Reino Unido' },
  MTAB: { cidade: 'Assunção', pais: 'Paraguai' },
};

/** Base que hospeda esquadrões/grupos por cidade (Rio decidido pelo CEP). */
function baseSede(cidade: string, cep: string | null): string | null {
  const c = cidade.toLowerCase();
  if (c === 'rio de janeiro') {
    const d = (cep ?? '').replace(/\D/g, '');
    if (d.startsWith('23555') || d.startsWith('2355')) return 'basc';
    if (d.startsWith('2174') || d.startsWith('2173')) return 'baaf';
    return 'bagl';
  }
  const mapa: Record<string, string> = {
    'anápolis': 'baan', 'belém': 'babe', 'boa vista': 'babv', 'brasília': 'babr', 'campo grande': 'bacg',
    'canoas': 'baco', 'florianópolis': 'bafl', 'fortaleza': 'bafz', 'manaus': 'bamn', 'parnamirim': 'bant',
    'natal': 'bant', 'porto velho': 'bapv', 'recife': 'barf', 'salvador': 'basv', 'santa maria': 'basm',
    'guarujá': 'bast', 'guarulhos': 'basp', 'pirassununga': 'afa',
  };
  return mapa[c] ?? null;
}

function cidadeUf(b: Bruto): { cidade: string; uf: string | null; ok: boolean } {
  const m = b.cep?.match(/\s-\s*((?:(?!\s-\s).)+?)\s*,\s*([A-Z]{2})\s*$/);
  if (m) return { cidade: m[1].trim(), uf: m[2], ok: true };
  const l = b.loc.match(/^(.+?)\/([A-Z]{2})$/);
  if (l) return { cidade: l[1].replace(/.*- /, '').trim(), uf: l[2], ok: true };
  return { cidade: '', uf: null, ok: false };
}

const NOME_CORRIGIDO: Record<string, string> = {
  LAQFA: 'Laboratório Químico-Farmacêutico da Aeronáutica',
};
const CATEGORIA_CORRIGIDA: Record<string, Unidade['categoria']> = {
  BREVET: 'administracao', // não é base aérea operacional
};
const CIDADE_CORRIGIDA: Record<string, [string, string]> = {
  'ESG RIO': ['Rio de Janeiro', 'RJ'], 'SERIPA IV': ['São Paulo', 'SP'], BASC: ['Rio de Janeiro', 'RJ'],
};

const PADRAO_CIDADE: Record<string, [string, string]> = {
  // localidades "A conferir" no índice, completadas pelo endereço da ficha ou pela sede conhecida
  COMAE: ['Brasília', 'DF'], 'IV COMAR': ['São Paulo', 'SP'], CELOG: ['Rio de Janeiro', 'RJ'],
  CDCAER: ['Brasília', 'DF'], ASOCEA: ['Rio de Janeiro', 'RJ'], 'SRPV-SP': ['São Paulo', 'SP'],
  'SEREP-BE': ['Belém', 'PA'], 'SEREP-RF': ['Recife', 'PE'], 'SEREP-SP': ['São Paulo', 'SP'],
  'SEREP-RJ': ['Rio de Janeiro', 'RJ'], '1º/1º GT': ['Rio de Janeiro', 'RJ'],
};

function main() {
  const brutos: Bruto[] = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const hoje = new Date().toISOString().slice(0, 10);
  const saida = new Map<string, Unidade>();
  const siglas = new Set(brutos.map((b) => b.sigla.trim().toUpperCase()));
  for (const b of brutos) {
    if (/COMANDO AÉREO REGIONAL/i.test(b.sigla)) [b.sigla, b.nomeIdx] = [b.nomeIdx, b.sigla];
    let sigla = b.sigla.trim();
    let apelido = '';
    const esq = sigla.match(/^(.+?)\s+-\s+(.+)$/);
    if (esq) { sigla = esq[1].trim(); apelido = tituloPt(esq[2]); }
    const id = slug(sigla);
    if (saida.has(id)) continue; // SERIPA IV aparece duas vezes
    const pdfOk = b.nomePdf && b.nomePdf.toUpperCase() !== sigla.toUpperCase() ? b.nomePdf : '';
    let bruto = (pdfOk || b.nomeIdx).replace(/\s*\([^)]*\)\s*$/, '');
    // sobra da sigla da ficha anterior no início do nome
    const palavras = bruto.split(/\s+/);
    while (palavras.length > 2 && siglas.has(palavras[0].toUpperCase()) && palavras[0] !== palavras[0].toLowerCase()
      && !/^(BASE|CENTRO|ESCOLA|HOSPITAL|INSTITUTO|PARQUE|GRUPAMENTO|SERVIÇO|COMANDO)$/i.test(palavras[0])) palavras.shift();
    bruto = palavras.join(' ');
    const dest = bruto.match(/^DESTACAMENTO AÉREO\s*(?::\s*|DE |DO |DOS )(.+)$/i);
    if (dest) {
      const lugar = dest[1].trim();
      const prep = /^(GALEÃO)$/i.test(lugar) ? 'do' : /^(AFONSOS)$/i.test(lugar) ? 'dos' : 'de';
      bruto = `DESTACAMENTO DE CONTROLE DO ESPAÇO AÉREO ${prep.toUpperCase()} ${lugar}`;
    }
    const nomeBase = tituloPt(bruto).replace(/\s+-\s+Esquadrão .+$/, '');
    const nome = NOME_CORRIGIDO[sigla] ? NOME_CORRIGIDO[sigla] : apelido ? `${nomeBase} — ${apelido}` : nomeBase;
    const ext = EXTERIOR[sigla];
    let { cidade, uf, ok } = cidadeUf(b);
    const padrao = PADRAO_CIDADE[sigla];
    if (padrao && (!ok || b.loc === 'A conferir')) { [cidade, uf] = padrao; ok = false; }
    if (CIDADE_CORRIGIDA[sigla]) [cidade, uf] = CIDADE_CORRIGIDA[sigla];
    let categoria = CATEGORIA_CORRIGIDA[sigla] ?? categoriaDoCatalogo(b.cat, sigla);
    if (ext) categoria = 'exterior';
    const u: Unidade = {
      id, sigla, nome, categoria, tipoCatalogo: b.cat,
      cidade: ext ? ext.cidade : cidade, uf: ext ? null : uf, pais: ext ? ext.pais : 'Brasil',
      coord: null, coordSituacao: 'aproximada', subordinadaA: null,
      site: b.site && !/intraer/i.test(b.site) ? b.site.replace(/^http:\/\/(www\.)?/, 'https://$1') : null,
      ficha: 'basica',
      situacao: { nome: 'confirmado', localizacao: 'a-conferir', subordinacao: 'a-conferir' },
      fontes: [{ titulo: 'Catálogo do COMAER (PDF)', url: 'https://www.fab.mil.br/' }],
      revisadoEm: hoje,
    };
    if (!ok && !ext) u.situacao.nome = 'confirmado';
    if (categoria === 'esquadrao') {
      const sede = baseSede(u.cidade, b.cep);
      if (sede) u.sediadoEm = sede;
    }
    saida.set(id, u);
  }
  // CRCEA-SE não está no índice do catálogo
  saida.set('crcea-se', {
    id: 'crcea-se', sigla: 'CRCEA-SE', nome: 'Centro Regional de Controle do Espaço Aéreo Sudeste', categoria: 'decea',
    tipoCatalogo: 'Centro', cidade: 'São Paulo', uf: 'SP', pais: 'Brasil', coord: null, coordSituacao: 'aproximada',
    subordinadaA: null, site: 'https://www.decea.mil.br/', ficha: 'basica',
    situacao: { nome: 'confirmado', localizacao: 'a-conferir', subordinacao: 'a-conferir' },
    fontes: [{ titulo: 'DECEA — CRCEA-SE', url: 'https://www.decea.mil.br/index.cfm?i=unidades&p=crcea-se' }],
    revisadoEm: hoje,
  });
  // COMGAP (órgão de direção setorial no Decreto 11.237/2022) não tem ficha no catálogo
  saida.set('comgap', {
    id: 'comgap', sigla: 'COMGAP', nome: 'Comando-Geral de Apoio', categoria: 'comando',
    tipoCatalogo: 'Comando', cidade: 'Brasília', uf: 'DF', pais: 'Brasil', coord: null, coordSituacao: 'aproximada',
    subordinadaA: null, site: null, ficha: 'basica',
    situacao: { nome: 'confirmado', localizacao: 'a-conferir', subordinacao: 'a-conferir' },
    fontes: [{ titulo: 'Decreto nº 11.237/2022 — estrutura do Comando da Aeronáutica', url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/decreto/D11237.htm' }],
    revisadoEm: hoje,
  });
  // esquadrões sem sede identificável: usar a primeira base existente da UF? Não: ficam sem sediadoEm e são listados.
  const semSede = [...saida.values()].filter((u) => u.categoria === 'esquadrao' && (!u.sediadoEm || !saida.has(u.sediadoEm)));
  if (semSede.length) console.warn('Esquadrões sem sede:', semSede.map((u) => `${u.sigla} (${u.cidade})`).join(', '));
  writeFileSync('data/unidades.json', JSON.stringify([...saida.values()], null, 1) + '\n');
  console.log('unidades:', saida.size);
}
main();
