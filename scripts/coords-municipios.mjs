// Preenche coord (sede municipal, "aproximada") das unidades no Brasil que ainda não têm posição.
// Fonte: tabela pública de municípios (kelvins/municipios-brasileiros, dados do IBGE).
// Uso: node scripts/coords-municipios.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const URL_CSV = 'https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/csv/municipios.csv';
const UF = { 11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO', 21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA', 31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS', 50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF' };
// Localidades que não são municípios: usar o município que as contém.
const APELIDOS = { 'gama/DF': 'brasilia/DF', 'cachimbo/PA': 'novo progresso/PA' };
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

const csv = await (await fetch(URL_CSV)).text();
const municipios = {};
for (const linha of csv.trim().split('\n').slice(1)) {
  const [, nome, lat, lon, , cuf] = linha.split(',');
  municipios[`${norm(nome)}/${UF[cuf]}`] = [Number(Number(lon).toFixed(4)), Number(Number(lat).toFixed(4))];
}
const unidades = JSON.parse(readFileSync('data/unidades.json', 'utf8'));
const usadas = {};
const faltando = [];
for (const u of unidades) {
  if (u.pais !== 'Brasil') continue;
  let chave = `${norm(u.cidade)}/${u.uf}`;
  chave = APELIDOS[chave] ?? chave;
  const c = municipios[chave];
  if (!c) { faltando.push(`${u.sigla} (${u.cidade}/${u.uf})`); continue; }
  usadas[`${u.cidade}/${u.uf}`] = c;
  if (!u.coord && u.categoria !== 'esquadrao') { u.coord = c; u.coordSituacao = 'aproximada'; }
}
writeFileSync('data/unidades.json', JSON.stringify(unidades, null, 1) + '\n');
writeFileSync('data/municipios.json', JSON.stringify(Object.fromEntries(Object.entries(usadas).sort()), null, 1) + '\n');
console.log('municípios usados:', Object.keys(usadas).length);
if (faltando.length) console.log('sem município:', faltando.join(', '));
