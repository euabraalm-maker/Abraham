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
  comar2: { titulo: 'II COMAR — Unidades Subordinadas', url: 'https://www2.fab.mil.br/comar2/index.php/unidades-subordinadas' },
  bacg: { titulo: 'Base Aérea de Campo Grande (página oficial)', url: 'https://www2.fab.mil.br/bacg/' },
  aerodromo: { titulo: 'OurAirports — coordenadas do aeródromo', url: 'https://ourairports.com/countries/BR/' },
  comgap: { titulo: 'Organograma oficial do COMGAP (fab.mil.br)', url: 'https://www.fab.mil.br/a-forca-aerea/institucional/organograma/' },
  deceaOrg: { titulo: 'Organograma do DECEA, atualizado em 28/10/2026 (enviado pelo instrutor)' },
  instrutor: { titulo: 'Informação do instrutor (página institucional do CGTEC/PAME-RJ)' },
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
  ['ii-comar', ['bant', 'barf', 'basv', 'bafz'], F.comar2],
  ['pame-rj', ['dtceatm-rj', 'cgtec'], F.instrutor],
  ['pame-rj', ['dtceatm-rj'], F.deceaOrg],
  ['decea', ['ciscea', 'cindacta-i', 'cindacta-ii', 'cindacta-iii', 'cindacta-iv', 'cgna', 'crcea-se', 'pame-rj', 'icea', 'ica',
    'cimaer', 'geiv', '1-gcc', 'asocea'], F.deceaOrg],
  ['1-gcc', ['1-1-gcc', '2-1-gcc', '3-1-gcc', '4-1-gcc', '5-1-gcc'], F.deceaOrg],
  ['comgap', ['dirmab', 'mtab', 'ila', 'cecat', 'celog', 'dti'], F.comgap],
  ['dirmab', ['pama-ls', 'pama-gl', 'pama-sp', 'pamb-rj'], F.comgap],
  ['celog', ['cabe', 'ctla'], F.comgap],
  ['dti', ['cca-rj', 'cca-br', 'cca-sj', 'cdcaer'], F.comgap],
  ['iv-comar', ['bacg'], F.bacg],
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

/**
 * Sites oficiais confirmados (página no ar, verificada em 26/11/2026). Toda unidade fora desta lista
 * fica sem site próprio e a ficha aponta para a página do superior mais próximo.
 */
const W2 = (p) => `https://www2.fab.mil.br/${p}/`;
const DECEA_UN = (p) => `https://www.decea.mil.br/index.cfm?i=unidades&p=${p}`;
const SITES = {
  comaer: 'https://www.fab.mil.br/', decea: 'https://www.decea.mil.br/', ita: 'https://www.ita.br/',
  'cca-rj': W2('sti'), brevet: W2('brevet'), 'serep-br': W2('serepbr'), ciaar: W2('ciaar'), cenipa: W2('cenipa'),
  eda: W2('eda'), eear: W2('eear'), cendoc: W2('cendoc'), ipa: W2('ipa'), cfiae: W2('cfiae'), dirsa: W2('dirsa'),
  cbnb: W2('cbnb'), hamn: W2('hamn'), afa: W2('afa'), cabe: W2('cabe'), unifa: W2('unifa'), 'cindacta-ii': W2('cindacta2'),
  'serep-rj': W2('sereprj'), 'pama-ls': W2('pamals'), laqfa: W2('laqfa'), musal: W2('musal'), hfasp: W2('hfasp'),
  hca: W2('hca'), haaf: W2('haaf'), cpbv: W2('cpbv'), bacg: W2('bacg'), 'ii-comar': W2('comar2'), bafz: W2('bafz'),
  cimaer: W2('cimaer'), ila: W2('ila'), incaer: W2('incaer'), 'iii-comar': W2('comar3'), 'cca-sj': W2('ccasj'),
  'gap-be': W2('gapbe'), dirmab: W2('dirmab'), dirap: W2('dirap'), 'cindacta-iv': W2('cindacta4'),
  bant: 'https://www2.fab.mil.br/comar2/index.php/unidades-subordinadas/74-unidades-sobordinadas',
  barf: 'https://www2.fab.mil.br/comar2/index.php/unidades-subordinadas/137-om',
  basv: 'https://www2.fab.mil.br/comar2/index.php/unidades-subordinadas/134-teste-02',
  'cindacta-i': DECEA_UN('cindacta-i'), 'cindacta-iii': DECEA_UN('cindacta-iii'), 'crcea-se': DECEA_UN('crcea-se'),
  '1-gcc': 'https://www.decea.mil.br/?i=unidades&p=1o-gcc',
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
const addFonte = (u, f) => { if (!u.fontes.some((x) => x.url === f.url && x.titulo === f.titulo)) u.fontes.push(f); };

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
// Posições reais curadas (OpenStreetMap e complexos pelo endereço do catálogo)
const posicoes = JSON.parse(readFileSync('data/fontes/posicoes.json', 'utf8'));
for (const [id, p] of Object.entries(posicoes)) {
  const u = porId.get(id);
  if (!u) { faltam.push(`posicao:${id}`); continue; }
  u.coord = p.coord;
  u.coordSituacao = 'exata';
  u.situacao.localizacao = 'confirmado';
  addFonte(u, { titulo: `Posição: ${p.fonte}`, url: 'https://www.openstreetmap.org/' });
  u.revisadoEm = HOJE;
}
for (const u of unidades) {
  u.site = SITES[u.id] ?? null;
  if (u.site) addFonte(u, { titulo: 'Site oficial', url: u.site });
}
for (const id of Object.keys(SITES)) if (!porId.has(id)) faltam.push(`site:${id}`);

writeFileSync('data/unidades.json', JSON.stringify(unidades, null, 1) + '\n');
const conta = (f) => unidades.filter((u) => u.pais === 'Brasil' && f(u)).length;
console.log('subordinação confirmada:', conta((u) => u.situacao.subordinacao === 'confirmado'));
console.log('subordinação a conferir:', conta((u) => u.situacao.subordinacao === 'a-conferir'));
console.log('posição exata:', conta((u) => u.coordSituacao === 'exata'), '· aproximada:', conta((u) => u.categoria !== 'esquadrao' && u.coordSituacao === 'aproximada'));
if (faltam.length) console.log('não encontrados:', faltam.join(', '));
