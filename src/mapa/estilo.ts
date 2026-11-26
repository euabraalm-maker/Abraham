import type { StyleSpecification, LayerSpecification } from 'maplibre-gl';

export type Tema = 'escuro' | 'claro' | 'teste';

const TILES = 'https://tiles.openfreemap.org/planet';
const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
export const FONTE = ['Noto Sans Regular'];
export const FONTE_NEGRITO = ['Noto Sans Bold'];

interface Paleta {
  fundo: string; agua: string; regioes: [string, string, string, string, string]; regiaoOpacidade: number;
  uf: string; ufBrilho: string; pais: string; via: string; viaMenor: string; pista: string; area: string;
  rotulo: string; rotuloFraco: string; halo: string; rio: string;
}

const PALETAS: Record<'escuro' | 'claro', Paleta> = {
  escuro: {
    fundo: '#070b22', agua: '#0a1640', regioes: ['#2a4bd8', '#7a5cff', '#1fa6c9', '#3d7bff', '#5a46c9'], regiaoOpacidade: 0.16,
    uf: 'rgba(160,190,255,0.85)', ufBrilho: 'rgba(90,130,255,0.55)', pais: '#a9c1ff', via: 'rgba(130,165,255,0.45)',
    viaMenor: 'rgba(130,165,255,0.22)', pista: 'rgba(170,200,255,0.55)', area: 'rgba(120,150,255,0.10)',
    rotulo: '#dbe4ff', rotuloFraco: '#8ea3dd', halo: '#070b22', rio: '#1b3a8f',
  },
  claro: {
    fundo: '#eef2fb', agua: '#c6d6f4', regioes: ['#3a63f0', '#6a48e6', '#1593b8', '#2f7be0', '#5b44c4'], regiaoOpacidade: 0.10,
    uf: 'rgba(30,60,150,0.75)', ufBrilho: 'rgba(60,100,220,0.18)', pais: '#1e3c96', via: 'rgba(40,70,160,0.40)',
    viaMenor: 'rgba(40,70,160,0.18)', pista: 'rgba(30,60,150,0.45)', area: 'rgba(40,70,160,0.08)',
    rotulo: '#14224d', rotuloFraco: '#4a5a8a', halo: '#ffffff', rio: '#9db7ea',
  },
};

const REGIOES = ['Norte', 'Nordeste', 'Sudeste', 'Sul', 'Centro-Oeste'];

function camadasLocais(p: Paleta, comTexto: boolean): LayerSpecification[] {
  const corRegiao: unknown[] = ['match', ['get', 'regiao']];
  REGIOES.forEach((r, i) => corRegiao.push(r, p.regioes[i]));
  corRegiao.push(p.regioes[0]);
  const camadas: LayerSpecification[] = [
    {
      id: 'regioes-preenchimento', type: 'fill', source: 'regioes',
      paint: { 'fill-color': corRegiao as never, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 3, p.regiaoOpacidade, 7, p.regiaoOpacidade / 3] },
    },
    {
      id: 'ufs-brilho', type: 'line', source: 'ufs',
      paint: { 'line-color': p.ufBrilho, 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 3, 8, 6], 'line-blur': 3 },
    },
    {
      id: 'ufs-linha', type: 'line', source: 'ufs',
      paint: { 'line-color': p.uf, 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.8, 8, 1.6] },
    },
  ];
  if (comTexto) {
    camadas.push({
      id: 'ufs-rotulo', type: 'symbol', source: 'ufs', maxzoom: 6.5,
      layout: { 'text-field': ['get', 'sigla'], 'text-font': FONTE_NEGRITO, 'text-size': 13, 'text-letter-spacing': 0.2 },
      paint: { 'text-color': p.rotuloFraco, 'text-halo-color': p.halo, 'text-halo-width': 1.2, 'text-opacity': 0.8 },
    });
  }
  return camadas;
}

function camadasVetoriais(p: Paleta): LayerSpecification[] {
  const v = 'openmaptiles';
  return [
    { id: 'agua', type: 'fill', source: v, 'source-layer': 'water', paint: { 'fill-color': p.agua } },
    { id: 'rios', type: 'line', source: v, 'source-layer': 'waterway', minzoom: 5, filter: ['==', ['get', 'class'], 'river'],
      paint: { 'line-color': p.rio, 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 12, 2.5] } },
    { id: 'aeroporto-area', type: 'fill', source: v, 'source-layer': 'aeroway', minzoom: 11, filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'fill-color': p.area } },
    { id: 'aeroporto-pista', type: 'line', source: v, 'source-layer': 'aeroway', minzoom: 11,
      filter: ['all', ['==', ['geometry-type'], 'LineString'], ['in', ['get', 'class'], ['literal', ['runway', 'taxiway']]]],
      paint: { 'line-color': p.pista, 'line-width': ['interpolate', ['exponential', 2], ['zoom'], 11, 2, 16, 40] } },
    { id: 'ruas', type: 'line', source: v, 'source-layer': 'transportation', minzoom: 12,
      filter: ['in', ['get', 'class'], ['literal', ['secondary', 'tertiary', 'minor', 'service']]],
      paint: { 'line-color': p.viaMenor, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 16, 3] } },
    { id: 'rodovias', type: 'line', source: v, 'source-layer': 'transportation', minzoom: 6,
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary']]],
      paint: { 'line-color': p.via, 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.5, 14, 3] } },
    { id: 'pais-limite', type: 'line', source: v, 'source-layer': 'boundary', filter: ['==', ['get', 'admin_level'], 2],
      paint: { 'line-color': p.pais, 'line-width': 1.4 } },
    { id: 'bairros', type: 'symbol', source: v, 'source-layer': 'place', minzoom: 12,
      filter: ['in', ['get', 'class'], ['literal', ['suburb', 'neighbourhood']]],
      layout: { 'text-field': ['get', 'name'], 'text-font': FONTE, 'text-size': 11, 'text-transform': 'uppercase', 'text-letter-spacing': 0.1 },
      paint: { 'text-color': p.rotuloFraco, 'text-halo-color': p.halo, 'text-halo-width': 1 } },
    { id: 'cidades', type: 'symbol', source: v, 'source-layer': 'place', minzoom: 5,
      filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
      layout: { 'text-field': ['get', 'name'], 'text-font': FONTE, 'text-size': ['interpolate', ['linear'], ['zoom'], 5, 11, 10, 14] },
      paint: { 'text-color': p.rotulo, 'text-halo-color': p.halo, 'text-halo-width': 1.2 } },
    { id: 'capitais', type: 'symbol', source: v, 'source-layer': 'place', minzoom: 4, maxzoom: 5,
      filter: ['all', ['==', ['get', 'class'], 'city'], ['>=', ['coalesce', ['get', 'capital'], 0], 2]],
      layout: { 'text-field': ['get', 'name'], 'text-font': FONTE, 'text-size': 11 },
      paint: { 'text-color': p.rotulo, 'text-halo-color': p.halo, 'text-halo-width': 1.2 } },
  ];
}

/**
 * Estilo do mapa no tema pedido. "teste" e `soLocal` não usam rede (só fundo, regiões e UFs);
 * `soLocal` mantém as cores do tema e é usado quando o mapa base não responde.
 */
export function criarEstilo(tema: Tema, base: string = import.meta.env?.BASE_URL ?? '/', soLocal = false): StyleSpecification {
  const p = PALETAS[tema === 'claro' ? 'claro' : 'escuro'];
  const geo = (arq: string) => `${base}geo/${arq}`;
  const fontesLocais = {
    ufs: { type: 'geojson' as const, data: geo('ufs.json') },
    regioes: { type: 'geojson' as const, data: geo('regioes.json') },
  };
  const fundo: LayerSpecification = { id: 'fundo', type: 'background', paint: { 'background-color': p.fundo } };
  if (tema === 'teste' || soLocal) {
    return { version: 8, sources: fontesLocais, layers: [fundo, ...camadasLocais(p, false)] };
  }
  const vetoriais = camadasVetoriais(p);
  const [agua, ...resto] = vetoriais;
  return {
    version: 8,
    glyphs: GLYPHS,
    sources: { openmaptiles: { type: 'vector', url: TILES }, ...fontesLocais },
    layers: [fundo, agua, ...camadasLocais(p, false), ...resto, ...camadasLocais(p, true).slice(3)],
  };
}
