import type maplibregl from 'maplibre-gl';
import type { Grupo } from '../dados/locais';
import type { Unidade } from '../dados/tipos';
import { h } from '../ui/dom';

export const ZOOM_ORBITA = 9;
const MAX_ORBITAS = 6;
const POR_ANEL = [8, 12, 16];
const RAIOS = [105, 205, 285];

/** Rótulo curto do satélite: sigla e, se houver, o nome de guerra (ex.: "1º/14º GAV · Pampa"). */
export function rotuloSatelite(u: Unidade): string {
  const apelido = u.nome.split(' — ')[1]?.replace(/^Esquadrão\s+/i, '');
  return apelido ? `${u.sigla} · ${apelido}` : u.sigla;
}

/**
 * Desenha, sobre o mapa, as unidades que orbitam cada anfitrião visível (esquadrões sediados e
 * unidades no mesmo ponto), ligadas a ele por linhas finas. Só a partir de ZOOM_ORBITA.
 */
export function criarOrbita(map: maplibregl.Map, el: HTMLElement, grupos: () => Map<string, Grupo>, aoEscolher: (id: string) => void) {
  const camada = h('div', { class: 'orbitas', 'aria-label': 'Unidades associadas' });
  el.appendChild(camada);
  let ativas: { grupo: Grupo; no: HTMLElement }[] = [];
  let destaque: string | null = null;

  function montar(g: Grupo): HTMLElement {
    const n = g.satelites.length;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'orbita-linhas');
    svg.setAttribute('width', '1');
    svg.setAttribute('height', '1');
    const no = h('div', { class: 'orbita', 'data-anfitriao': g.anfitriao.id });
    no.append(svg);
    g.satelites.forEach((s, i) => {
      // anel e posição dentro do anel (anéis externos comportam mais etiquetas)
      let anel = 0, j = i;
      while (anel < POR_ANEL.length - 1 && j >= POR_ANEL[anel]) { j -= POR_ANEL[anel]; anel++; }
      const inicioAnel = POR_ANEL.slice(0, anel).reduce((a, b) => a + b, 0);
      const noAnel = Math.min(POR_ANEL[anel], n - inicioAnel);
      const ang = -Math.PI / 2 + (j / noAnel) * Math.PI * 2 + (anel % 2 ? Math.PI / noAnel : 0);
      const r = RAIOS[anel];
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r * 0.82;
      const linha = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      linha.setAttribute('x1', '0'); linha.setAttribute('y1', '0');
      linha.setAttribute('x2', String(x)); linha.setAttribute('y2', String(y));
      svg.append(linha);
      const b = h('button', {
        type: 'button', class: `satelite sat-${s.categoria}${s.id === destaque ? ' destaque' : ''}`,
        'data-id': s.id, title: s.nome, style: `--x:${x}px;--y:${y}px;--atraso:${i * 35}ms`,
      }, rotuloSatelite(s));
      b.addEventListener('click', (e) => { e.stopPropagation(); aoEscolher(s.id); });
      no.append(b);
    });
    return no;
  }

  function posicionar() {
    for (const { grupo, no } of ativas) {
      const p = map.project(grupo.anfitriao.coord!);
      no.style.transform = `translate(${p.x}px, ${p.y}px)`;
    }
  }

  function atualizar() {
    const gs = grupos();
    const visiveis: Grupo[] = [];
    if (map.getZoom() >= ZOOM_ORBITA && map.getLayer('unidades')) {
      const centro = map.project(map.getCenter());
      const fs = map.queryRenderedFeatures({ layers: ['unidades'] });
      const ids = [...new Set(fs.map((f) => String(f.properties.id)))];
      for (const id of ids) {
        const g = gs.get(id);
        if (g?.satelites.length) visiveis.push(g);
      }
      visiveis.sort((a, b) => {
        const pa = map.project(a.anfitriao.coord!), pb = map.project(b.anfitriao.coord!);
        return Math.hypot(pa.x - centro.x, pa.y - centro.y) - Math.hypot(pb.x - centro.x, pb.y - centro.y);
      });
    }
    const escolhidos = visiveis.slice(0, MAX_ORBITAS);
    const chave = (g: Grupo) => `${g.anfitriao.id}:${g.satelites.map((s) => s.id).join(',')}:${destaque}`;
    const atuais = new Map(ativas.map((a) => [chave(a.grupo), a]));
    ativas = escolhidos.map((g) => atuais.get(chave(g)) ?? { grupo: g, no: montar(g) });
    camada.replaceChildren(...ativas.map((a) => a.no));
    posicionar();
  }

  map.on('move', posicionar);
  map.on('moveend', atualizar);
  map.on('idle', atualizar);
  return {
    atualizar,
    destacar(id: string | null) {
      destaque = id;
      ativas = [];
      atualizar();
    },
  };
}
