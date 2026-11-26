// Baixa as divisas das UFs, simplifica e gera as 5 regiões.
// Fonte: brazil-states.geojson (Code for America, derivado da malha do IBGE) — a API do IBGE
// fica bloqueada em alguns ambientes. Uso: node scripts/baixar-geo.mjs
import { writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson';
const REGIAO = { 1: 'Norte', 2: 'Nordeste', 3: 'Sudeste', 4: 'Sul', 5: 'Centro-Oeste' };

const geo = await (await fetch(URL)).json();
geo.features = geo.features.map((f) => ({
  type: 'Feature',
  geometry: f.geometry,
  properties: { sigla: f.properties.sigla, nome: f.properties.name, regiao: REGIAO[String(f.properties.codigo_ibg)[0]] },
}));
const dir = mkdtempSync(join(tmpdir(), 'geo-'));
const entrada = join(dir, 'ufs.json');
writeFileSync(entrada, JSON.stringify(geo));
const ms = (args) => execFileSync('npx', ['mapshaper', ...args], { stdio: 'inherit' });
ms([entrada, '-simplify', '6%', 'keep-shapes', '-o', 'public/geo/ufs.json', 'precision=0.0001', 'format=geojson']);
ms(['public/geo/ufs.json', '-dissolve', 'regiao', '-o', 'public/geo/regioes.json', 'precision=0.0001', 'format=geojson']);
