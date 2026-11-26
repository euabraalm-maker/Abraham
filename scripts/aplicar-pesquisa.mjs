// Aplica a pesquisa de subordinação e de posições a data/unidades.json.
// Só entra o que tem fonte; o resto continua "a conferir".
// Uso: node scripts/aplicar-pesquisa.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const HOJE = new Date().toISOString().slice(0, 10);
const F = {
  decreto: { titulo: 'Decreto nº 11.237/2022 — estrutura do Comando da Aeronáutica', url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/decreto/D11237.htm' },
  decea: { titulo: 'DECEA — Nossas Unidades', url: 'https://www.decea.mil.br/index.cfm?i=unidades' },
  cindacta1: { titulo: 'DECEA — CINDACTA I', url: 'https://www.decea.mil.br/index.cfm?i=unidades&p=cindacta-i' },
  cindacta2: { titulo: 'DECEA — CINDACTA II', url: 'https://www.decea.mil.br/index.cfm?i=unidades&p=cindacta-ii' },
  cindacta3: { titulo: 'DECEA — CINDACTA III', url: 'https://www.decea.mil.br/index.cfm?i=unidades&p=cindacta-iii' },
  cindacta4: { titulo: 'DECEA — CINDACTA IV', url: 'https://www.decea.mil.br/index.cfm?i=unidades&p=cindacta-iv' },
  crceaSe: { titulo: 'DECEA — CRCEA-SE', url: 'https://www.decea.mil.br/index.cfm?i=unidades&p=crcea-se' },
  gcc: { titulo: 'DECEA — 1º GCC', url: 'https://www.decea.mil.br/?i=unidades&p=1o-gcc' },
  aerodromo: { titulo: 'OurAirports — coordenadas do aeródromo', url: 'https://ourairports.com/countries/BR/' },
};

const dt = (...xs) => xs.map((x) => `dtcea-${x}`);
/** [superior, subordinadas, fonte] */
const SUBORDINACAO = [
  ['comaer', ['emaer', 'gabaer', 'aspaer', 'cecomsaer', 'cenciar', 'ciaer', 'cenipa', 'incaer', 'secprom',
    'comgap', 'comae', 'comprep', 'comgep', 'dcta', 'decea', 'sefa'], F.decreto],
  ['incaer', ['musal'], F.decreto],
  ['comgap', ['celog', 'dti'], F.decreto],
  ['comprep', ['ii-comar', 'iii-comar', 'iv-comar', 'v-comar', 'vi-comar', 'vii-comar'], F.decreto],
  ['comgep', ['cda', 'dirap', 'direns', 'dirsa'], F.decreto],
  ['direns', ['afa', 'ciaar', 'eear', 'epcar', 'unifa'], F.decreto],
  ['unifa', ['ecemar'], F.decreto],
  ['dirsa', ['hca', 'hfab', 'hfasp', 'hfag'], F.decreto],
  ['dcta', ['copac', 'iae'], F.decreto],
  ['decea', ['ciscea', 'cindacta-i', 'cindacta-iv'], F.decreto],
  ['decea', ['cimaer', 'cgna', 'ica', 'geiv', 'pame-rj', '1-gcc', 'cindacta-ii', 'cindacta-iii', 'crcea-se', 'icea'], F.decea],
  ['sefa', ['dirad', 'diref'], F.decreto],
  ['dirad', ['cae'], F.decreto],
  ['1-gcc', ['1-1-gcc', '2-1-gcc', '3-1-gcc', '4-1-gcc', '5-1-gcc'], F.gcc],
  ['cindacta-i', dt('an', 'bq', 'br', 'bw', 'cc', 'cf', 'cy', 'ga', 'gi', 'ls', 'pco', 'sro', 'sta', 'tnb', 'trm', 'ys'), F.cindacta1],
  ['cindacta-ii', dt('bi', 'co', 'fi', 'ct', 'fl', 'sm', 'ug', 'mdi', 'cgu', 'sti', 'cdt', 'cg', 'cr'), F.cindacta2],
  // a página do CINDACTA III chama de DTCEA-PE o destacamento de Petrolina (DTCEA-PL no catálogo)
  ['cindacta-iii', dt('ar', 'fn', 'fz', 'lp', 'mo', 'nt', 'pl', 'rf', 'sv', 'sl', 'iz'), F.cindacta3],
  ['cindacta-iv', dt('eg', 'mn', 'sn', 'pv', 'cz', 'tf', 'rb', 'tt', 'mq', 'aa', 'bv', 'vh', 'gm', 'si', 'fa', 'ua', 'fx',
    'oi', 'ei', 'my', 'ep', 'ek', 'be'), F.cindacta4],
  ['crcea-se', dt('mt', 'st', 'sj', 'gw', 'gl', 'af', 'sc'), F.crceaSe],
];

/** Unidades instaladas no próprio aeródromo → indicador ICAO (conferidos um a um). */
const AERODROMO = {
  baan: 'SBAN', babe: 'SBBE', babv: 'SBBV', babr: 'SBBR', bacg: 'SBCG', baco: 'SBCO', bafl: 'SBFL', bafz: 'SBFZ',
  bamn: 'SBMN', bant: 'SBNT', bapv: 'SBPV', barf: 'SBRF', basv: 'SBSV', basc: 'SBSC', basm: 'SBSM', bast: 'SBST',
  basp: 'SBGR', bagl: 'SBGL', baaf: 'SBAF',
  'dtcea-gw': 'SBGW', 'dtcea-mt': 'SBMT', 'dtcea-sc': 'SBSC', 'dtcea-sm': 'SBSM', 'dtcea-st': 'SBST', 'dtcea-fa': 'SWFX',
  'dtcea-si': 'SBSI', 'dtcea-gl': 'SBGL', 'dtcea-af': 'SBAF', 'dtcea-bv': 'SBBV', 'dtcea-ek': 'SBEK', 'dtcea-an': 'SBAN',
  'dtcea-ar': 'SBAR', 'dtcea-bw': 'SBBW', 'dtcea-be': 'SBBE', 'dtcea-lp': 'SBLP', 'dtcea-br': 'SBBR', 'dtcea-cc': 'SBCC',
  'dtcea-cg': 'SBCG', 'dtcea-co': 'SBCO', 'dtcea-cf': 'SBCF', 'dtcea-cr': 'SBCR', 'dtcea-cz': 'SBCZ', 'dtcea-cy': 'SBCY',
  'dtcea-ct': 'SBCT', 'dtcea-eg': 'SBEG', 'dtcea-ei': 'SWEI', 'dtcea-fn': 'SBFN', 'dtcea-fl': 'SBFL', 'dtcea-fz': 'SBFZ',
  'dtcea-fi': 'SBFI', 'dtcea-gm': 'SBGM', 'dtcea-iz': 'SBIZ', 'dtcea-ls': 'SBLS', 'dtcea-mq': 'SBMQ', 'dtcea-mo': 'SBMO',
  'dtcea-mn': 'SBMN', 'dtcea-my': 'SBMY', 'dtcea-nt': 'SBNT', 'dtcea-oi': 'SBOI', 'dtcea-pl': 'SBPL', 'dtcea-ys': 'SBYS',
  'dtcea-pv': 'SBPV', 'dtcea-rf': 'SBRF', 'dtcea-rb': 'SBRB', 'dtcea-sv': 'SBSV', 'dtcea-sn': 'SBSN', 'dtcea-fx': 'SNFX',
  'dtcea-ua': 'SBUA', 'dtcea-sj': 'SBSJ', 'dtcea-sl': 'SBSL', 'dtcea-tt': 'SBTT', 'dtcea-tf': 'SBTF', 'dtcea-ug': 'SBUG',
  'dtcea-vh': 'SBVH', 'dtcea-bq': 'SBBQ', 'dtcea-bi': 'SBBI', 'dtcea-aa': 'SBAA',
  'destae-cv': 'SBCV', 'destae-fn': 'SBFN', 'destae-mq': 'SBMQ', 'destae-ms': 'SBMS', dasg: 'SBUA',
  paan: 'SBAN', pabe: 'SBBE', pabv: 'SBBV', pabr: 'SBBR', paco: 'SBCO', pagw: 'SBGW', pals: 'SBLS', pamn: 'SBMN',
  pant: 'SBNT', pays: 'SBYS', papv: 'SBPV', parf: 'SBRF', pasc: 'SBSC', pasm: 'SBSM', past: 'SBST', pasj: 'SBSJ',
  pagl: 'SBGL', paaf: 'SBAF',
  'pama-ls': 'SBLS', 'pama-sp': 'SBMT', 'pama-gl': 'SBGL', 'pama-af': 'SBAF',
  afa: 'SBYS', eear: 'SBGW', epcar: 'SBBQ', cpbv: 'SBCC', cla: 'SNCW',
};

function lerCsv(texto) {
  const linhas = [];
  let campo = '', linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ',') { linha.push(campo); campo = ''; }
    else if (c === '\n') { linha.push(campo); linhas.push(linha); linha = []; campo = ''; }
    else if (c !== '\r') campo += c;
  }
  return linhas;
}

const csv = lerCsv(await (await fetch('https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv')).text());
const cab = csv[0];
const [iIdent, iLat, iLon] = ['ident', 'latitude_deg', 'longitude_deg'].map((k) => cab.indexOf(k));
const icao = new Map(csv.slice(1).map((l) => [l[iIdent], [Number(Number(l[iLon]).toFixed(5)), Number(Number(l[iLat]).toFixed(5))]]));

const unidades = JSON.parse(readFileSync('data/unidades.json', 'utf8'));
const porId = new Map(unidades.map((u) => [u.id, u]));
const faltam = [];
const addFonte = (u, f) => { if (!u.fontes.some((x) => x.url === f.url)) u.fontes.push(f); };

for (const [sup, subs, fonte] of SUBORDINACAO) {
  if (!porId.has(sup)) { faltam.push(sup); continue; }
  for (const id of subs) {
    const u = porId.get(id);
    if (!u) { faltam.push(id); continue; }
    u.subordinadaA = sup;
    u.situacao.subordinacao = 'confirmado';
    addFonte(u, fonte);
    u.revisadoEm = HOJE;
  }
}
for (const [id, codigo] of Object.entries(AERODROMO)) {
  const u = porId.get(id);
  const c = icao.get(codigo);
  if (!u || !c) { faltam.push(`${id}:${codigo}`); continue; }
  u.coord = c;
  u.coordSituacao = 'exata';
  u.situacao.localizacao = 'confirmado';
  addFonte(u, { ...F.aerodromo, titulo: `${F.aerodromo.titulo} (${codigo})` });
  u.revisadoEm = HOJE;
}
writeFileSync('data/unidades.json', JSON.stringify(unidades, null, 1) + '\n');
const conta = (f) => unidades.filter((u) => u.pais === 'Brasil' && f(u)).length;
console.log('subordinação confirmada:', conta((u) => u.situacao.subordinacao === 'confirmado'));
console.log('subordinação a conferir:', conta((u) => u.situacao.subordinacao === 'a-conferir'));
console.log('posição exata:', conta((u) => u.coordSituacao === 'exata'), '· aproximada:', conta((u) => u.categoria !== 'esquadrao' && u.coordSituacao === 'aproximada'));
if (faltam.length) console.log('não encontrados:', faltam.join(', '));
