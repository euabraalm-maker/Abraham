import maplibregl, { type GeoJSONSource, type MapGeoJSONFeature } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CATEGORIAS } from '../dados/categorias';
import type { CategoriaId, Unidade } from '../dados/tipos';
import { criarEstilo, FONTE_NEGRITO, type Tema } from './estilo';
import { desenharIcone } from './icones';
import { animarAviao } from './aviao';
import { agruparPorLocal, type Grupo } from '../dados/locais';
import { criarOrbita, ZOOM_ORBITA } from './orbita';

export type ModoCamera = 'auto' | '3d' | 'cima';
const PITCH: Record<ModoCamera, number> = { auto: 50, '3d': 55, cima: 0 };

export interface MapaApi {
  voarPara(id: string): void;
  filtrar(ids: Set<string> | null): void;
  definirTema(t: 'escuro' | 'claro'): void;
  aoSelecionar(cb: (id: string) => void): void;
  aoSelecionarGrupo(cb: (ids: string[]) => void): void;
  /** Realça um satélite na órbita (ex.: esquadrão escolhido na busca); null limpa. */
  destacarSatelite(id: string | null): void;
  /** Ângulo da câmera: automática (inclina nos voos), 3D fixa (55°) ou de cima (plana, sem girar). */
  definirCamera(modo: ModoCamera): void;
  map: maplibregl.Map;
  unidades: Unidade[];
}

const CENTRO_BRASIL: [number, number] = [-52, -14];
const ZOOM_INICIAL = 3.6;
const CLUSTER_MAX_ZOOM = 13;
const AVISO_TILES = 'Mapa detalhado indisponível no momento — exibindo divisas e unidades.';

const movimentoReduzido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Um ponto por local: o anfitrião, com quantos satélites orbitam ao redor dele. */
function colecao(grupos: Grupo[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: grupos.map(({ anfitriao: u, satelites }) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: u.coord! },
      properties: { id: u.id, sigla: u.sigla, categoria: u.categoria, satelites: satelites.length, peso: 1 + satelites.length },
    })),
  };
}

export function criarMapa(el: HTMLElement, us: Unidade[], o: { tema: Tema; camera?: ModoCamera }): MapaApi {
  let tema: Tema = o.tema;
  let camera: ModoCamera = o.camera ?? 'auto';
  const semRede = o.tema === 'teste';
  const intro = !movimentoReduzido() && camera === 'auto';
  let vooPedido = false;
  let filtroAtual: Set<string> | null = null;
  const porId = new Map(us.map((u) => [u.id, u]));
  const cbSelecionar: ((id: string) => void)[] = [];
  const cbGrupo: ((ids: string[]) => void)[] = [];
  let grupos = new Map<string, Grupo>();
  const reagrupar = () => {
    const gs = agruparPorLocal(us, filtroAtual);
    grupos = new Map(gs.map((g) => [g.anfitriao.id, g]));
    return colecao(gs);
  };

  const map = new maplibregl.Map({
    container: el,
    style: criarEstilo(tema),
    center: CENTRO_BRASIL,
    zoom: ZOOM_INICIAL,
    pitch: camera === 'auto' ? (intro ? 45 : 30) : PITCH[camera],
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
        data: reagrupar(),
        cluster: true,
        clusterProperties: { total: ['+', ['get', 'peso']] },
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
        layout: { 'text-field': ['get', 'total'], 'text-font': FONTE_NEGRITO, 'text-size': 13, 'text-allow-overlap': true },
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
    // Selo com o número de unidades que orbitam o anfitrião (visível de longe)
    const semCluster = ['all', ['!', ['has', 'point_count']], ['>', ['get', 'satelites'], 0]];
    map.addLayer({
      id: 'selo-satelites', type: 'circle', source: 'unidades', maxzoom: ZOOM_ORBITA, filter: semCluster as never,
      paint: { 'circle-radius': 8, 'circle-color': t === 'escuro' ? '#7a5cff' : '#5b44c4', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.2, 'circle-translate': [12, -12] },
    });
    if (temTexto) {
      map.addLayer({
        id: 'selo-satelites-numero', type: 'symbol', source: 'unidades', maxzoom: ZOOM_ORBITA, filter: semCluster as never,
        layout: { 'text-field': ['to-string', ['get', 'satelites']], 'text-font': FONTE_NEGRITO, 'text-size': 10, 'text-allow-overlap': true, 'text-offset': [1, -1] },
        paint: { 'text-color': '#ffffff' },
      });
    }
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
  // Abertura: o mapa "assenta" de 45° para 30° enquanto o aviãozinho cruza a tela.
  map.once('load', () => {
    if (!intro || vooPedido) return; // não interrompe um voo já pedido (ex.: endereço com #unidade)
    map.easeTo({ pitch: 30, duration: 1500 });
    const { clientWidth: w, clientHeight: hgt } = el;
    animarAviao(el, [-40, hgt * 0.7], [w + 40, hgt * 0.35], 2200);
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

  /** De cima: trava plano e sem giro. 3D: trava a inclinação em 55°. Automática: livre. */
  function aplicarLimitesCamera() {
    const fixo = camera === 'auto' ? null : PITCH[camera];
    map.setMinPitch(0); // solta os limites antes, para nunca ficar mínimo > máximo
    map.setMaxPitch(70);
    if (fixo !== null) { map.setMaxPitch(fixo); map.setMinPitch(fixo); }
    if (camera === 'cima') { map.dragRotate.disable(); map.touchZoomRotate.disableRotation(); map.keyboard.disableRotation(); }
    else { map.dragRotate.enable(); map.touchZoomRotate.enableRotation(); map.keyboard.enableRotation(); }
  }
  aplicarLimitesCamera();

  const orbita = criarOrbita(map, el, () => grupos, (id) => cbSelecionar.forEach((cb) => cb(id)));

  const api: MapaApi = {
    map,
    unidades: us,
    voarPara(id) {
      let u = porId.get(id);
      if (u?.categoria === 'esquadrao' && u.sediadoEm) u = porId.get(u.sediadoEm);
      if (!u?.coord) return;
      vooPedido = true;
      const { clientWidth: w, clientHeight: hgt } = el;
      const destino = map.project(u.coord);
      const limitar = (v: number, max: number) => Math.min(max * 0.9, Math.max(max * 0.1, v));
      animarAviao(el, [w / 2, hgt / 2], [limitar(destino.x, w), limitar(destino.y, hgt)], 2000);
      map.flyTo({ center: u.coord, zoom: 12, pitch: PITCH[camera], duration: movimentoReduzido() ? 0 : 2200, essential: true });
    },
    filtrar(ids) {
      filtroAtual = ids;
      (map.getSource('unidades') as GeoJSONSource | undefined)?.setData(reagrupar());
      orbita.atualizar();
    },
    definirTema(t) {
      tema = t;
      map.setStyle(criarEstilo(t, undefined, soLocal || semRede), { diff: false });
    },
    aoSelecionar(cb) { cbSelecionar.push(cb); },
    aoSelecionarGrupo(cb) { cbGrupo.push(cb); },
    destacarSatelite(id) { orbita.destacar(id); },
    definirCamera(modo) {
      camera = modo;
      aplicarLimitesCamera();
      const duracao = movimentoReduzido() ? 0 : 800;
      if (modo === 'cima') map.easeTo({ pitch: 0, bearing: 0, duration: duracao });
      else if (modo === '3d') map.easeTo({ pitch: PITCH['3d'], duration: duracao });
    },
  };
  return api;
}
