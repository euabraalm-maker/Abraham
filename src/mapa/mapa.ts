import maplibregl, { type GeoJSONSource, type MapGeoJSONFeature } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CATEGORIAS } from '../dados/categorias';
import type { CategoriaId, Unidade } from '../dados/tipos';
import { criarEstilo, FONTE_NEGRITO, type Tema } from './estilo';
import { desenharIcone } from './icones';

export interface MapaApi {
  voarPara(id: string): void;
  filtrar(ids: Set<string> | null): void;
  definirTema(t: 'escuro' | 'claro'): void;
  aoSelecionar(cb: (id: string) => void): void;
  aoSelecionarGrupo(cb: (ids: string[]) => void): void;
  vistaDeCima(): void;
  map: maplibregl.Map;
  unidades: Unidade[];
}

const CENTRO_BRASIL: [number, number] = [-52, -14];
const ZOOM_INICIAL = 3.6;
const CLUSTER_MAX_ZOOM = 13;
const AVISO_TILES = 'Mapa detalhado indisponível no momento — exibindo divisas e unidades.';

const movimentoReduzido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function noMapa(u: Unidade) {
  return u.pais === 'Brasil' && CATEGORIAS[u.categoria].noMapa && !!u.coord;
}

function colecao(us: Unidade[], ids: Set<string> | null): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: us
      .filter((u) => noMapa(u) && (!ids || ids.has(u.id)))
      .map((u) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: u.coord! },
        properties: { id: u.id, sigla: u.sigla, categoria: u.categoria },
      })),
  };
}

export function criarMapa(el: HTMLElement, us: Unidade[], o: { tema: Tema }): MapaApi {
  let tema: Tema = o.tema;
  let filtroAtual: Set<string> | null = null;
  const porId = new Map(us.map((u) => [u.id, u]));
  const cbSelecionar: ((id: string) => void)[] = [];
  const cbGrupo: ((ids: string[]) => void)[] = [];

  const map = new maplibregl.Map({
    container: el,
    style: criarEstilo(tema),
    center: CENTRO_BRASIL,
    zoom: ZOOM_INICIAL,
    pitch: 30,
    maxPitch: 70,
    attributionControl: { compact: true },
    fadeDuration: movimentoReduzido() ? 0 : 300,
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

  const temaIcone = () => (tema === 'claro' ? 'claro' : 'escuro');

  function instalarCamadas() {
    const t = temaIcone();
    for (const cat of Object.keys(CATEGORIAS) as CategoriaId[]) {
      const nome = `ic-${cat}`;
      if (map.hasImage(nome)) map.removeImage(nome);
      map.addImage(nome, desenharIcone(cat, t, 56), { pixelRatio: 2 });
    }
    if (!map.getSource('unidades')) {
      map.addSource('unidades', {
        type: 'geojson',
        data: colecao(us, filtroAtual),
        cluster: true,
        clusterRadius: 48,
        clusterMaxZoom: CLUSTER_MAX_ZOOM,
      });
    }
    const corBolha = t === 'escuro' ? 'rgba(79,125,255,0.55)' : 'rgba(58,99,240,0.75)';
    const bordaBolha = t === 'escuro' ? 'rgba(190,210,255,0.95)' : '#ffffff';
    map.addLayer({
      id: 'bolhas-brilho', type: 'circle', source: 'unidades', filter: ['has', 'point_count'],
      paint: {
        'circle-color': corBolha, 'circle-blur': 1,
        'circle-radius': ['step', ['get', 'point_count'], 26, 10, 32, 40, 40],
      },
    });
    map.addLayer({
      id: 'bolhas', type: 'circle', source: 'unidades', filter: ['has', 'point_count'],
      paint: {
        'circle-color': corBolha,
        'circle-stroke-color': bordaBolha, 'circle-stroke-width': 1.5,
        'circle-radius': ['step', ['get', 'point_count'], 15, 10, 19, 40, 24],
      },
    });
    const temTexto = !!map.getStyle().glyphs;
    if (temTexto) {
      map.addLayer({
        id: 'bolhas-numero', type: 'symbol', source: 'unidades', filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': FONTE_NEGRITO, 'text-size': 13, 'text-allow-overlap': true },
        paint: { 'text-color': '#ffffff' },
      });
    }
    map.addLayer({
      id: 'unidades', type: 'symbol', source: 'unidades', filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': ['concat', 'ic-', ['get', 'categoria']],
        'icon-size': ['interpolate', ['linear'], ['zoom'], 3, 0.8, 10, 1.1],
        'icon-allow-overlap': true,
      },
    });
    if (temTexto) {
      map.addLayer({
        id: 'unidades-rotulo', type: 'symbol', source: 'unidades', minzoom: 7, filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['get', 'sigla'], 'text-font': FONTE_NEGRITO, 'text-size': 12,
          'text-offset': [0, 1.4], 'text-anchor': 'top', 'text-optional': true,
        },
        paint: {
          'text-color': t === 'escuro' ? '#e6ecff' : '#14224d',
          'text-halo-color': t === 'escuro' ? '#070b22' : '#ffffff', 'text-halo-width': 1.4,
        },
      });
    }
  }

  // Aviso quando o mapa base (tiles/fontes) não carrega; unidades e divisas são locais.
  let avisoMostrado = false;
  function mostrarAviso() {
    if (avisoMostrado) return;
    avisoMostrado = true;
    const aviso = document.createElement('div');
    aviso.className = 'mapa-aviso';
    aviso.setAttribute('role', 'status');
    aviso.textContent = AVISO_TILES;
    el.appendChild(aviso);
  }
  let soLocal = false;
  map.on('error', (e: { error?: Error; sourceId?: string }) => {
    const msg = String(e.error?.message ?? '');
    const doMapaBase = e.sourceId === 'openmaptiles' || /tiles\.openfreemap|glyph|fetch|NetworkError|Failed/i.test(msg);
    if (!doMapaBase) return;
    mostrarAviso();
    // Se o mapa base falha antes de carregar, o estilo nunca termina: troca por um só com dados locais.
    if (!soLocal && !map.loaded() && e.sourceId === 'openmaptiles') {
      soLocal = true;
      map.setStyle(criarEstilo(tema, undefined, true), { diff: false });
    }
  });

  map.on('style.load', () => {
    instalarCamadas();
  });
  const pronto = () => el.setAttribute('data-pronto', '1');
  map.once('load', pronto);
  map.once('idle', pronto);

  // Clique numa bolha: aproxima, ou lista o grupo se não dá para separar.
  map.on('click', 'bolhas', async (e) => {
    const f = e.features?.[0] as MapGeoJSONFeature | undefined;
    if (!f) return;
    const fonte = map.getSource('unidades') as GeoJSONSource;
    const clusterId = f.properties.cluster_id as number;
    const folhas = (await fonte.getClusterLeaves(clusterId, Infinity, 0)) as GeoJSON.Feature<GeoJSON.Point>[];
    const mesmaPosicao = folhas.every(
      (x) => x.geometry.coordinates[0] === folhas[0].geometry.coordinates[0] && x.geometry.coordinates[1] === folhas[0].geometry.coordinates[1],
    );
    const zoom = await fonte.getClusterExpansionZoom(clusterId);
    if (mesmaPosicao || zoom > CLUSTER_MAX_ZOOM || map.getZoom() >= map.getMaxZoom() - 0.5) {
      const ids = folhas.map((x) => String(x.properties?.id));
      cbGrupo.forEach((cb) => cb(ids));
      return;
    }
    map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom, duration: movimentoReduzido() ? 0 : 900 });
  });

  map.on('click', 'unidades', (e) => {
    const fs = e.features ?? [];
    if (!fs.length) return;
    const ids = [...new Set(fs.map((f) => String(f.properties.id)))];
    if (ids.length > 1) cbGrupo.forEach((cb) => cb(ids));
    else cbSelecionar.forEach((cb) => cb(ids[0]));
  });
  for (const camada of ['bolhas', 'unidades']) {
    map.on('mouseenter', camada, () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', camada, () => (map.getCanvas().style.cursor = ''));
  }

  const api: MapaApi = {
    map,
    unidades: us,
    voarPara(id) {
      let u = porId.get(id);
      if (u?.categoria === 'esquadrao' && u.sediadoEm) u = porId.get(u.sediadoEm);
      if (!u?.coord) return;
      map.flyTo({ center: u.coord, zoom: 12, pitch: 50, duration: movimentoReduzido() ? 0 : 2200, essential: true });
    },
    filtrar(ids) {
      filtroAtual = ids;
      (map.getSource('unidades') as GeoJSONSource | undefined)?.setData(colecao(us, ids));
    },
    definirTema(t) {
      tema = t;
      map.setStyle(criarEstilo(t, undefined, soLocal), { diff: false });
    },
    aoSelecionar(cb) { cbSelecionar.push(cb); },
    aoSelecionarGrupo(cb) { cbGrupo.push(cb); },
    vistaDeCima() {
      map.easeTo({ pitch: 0, bearing: 0, duration: movimentoReduzido() ? 0 : 800 });
    },
  };
  return api;
}
