import '../estilos/fontes';
import '../estilos/mapa.css';
import '../estilos/vidro.css';
import { carregar } from '../dados/carregar';
import { descendentes } from '../dados/hierarquia';
import { criarMapa } from '../mapa/mapa';
import type { Tema } from '../mapa/estilo';
import { h } from '../ui/dom';
import { renderizarFicha, type AcaoFicha } from '../ui/ficha';
import { criarFiltros } from '../ui/filtros';
import { criarCaixaBusca } from '../ui/caixaBusca';
import { criarExterior } from '../ui/exterior';

const params = new URLSearchParams(location.search);
const estilo = params.get('estilo');
const tema: Tema = estilo === 'teste' ? 'teste' : estilo === 'claro' ? 'claro' : 'escuro';
const { lista, porId } = carregar();
const palco = document.getElementById('palco')!;
document.querySelector('header.topo')?.remove();

const elMapa = h('div', { id: 'mapa' });
palco.appendChild(elMapa);
const mapa = criarMapa(elMapa, lista, { tema });

// Barra superior
const busca = h('div', { class: 'busca' });
const btFiltros = h('button', { type: 'button', class: 'botao', 'aria-expanded': 'false', 'aria-controls': 'painel-filtros' }, 'Filtros');
const barra = h('header', { class: 'barra vidro' },
  h('span', { class: 'marca' }, 'Mapa das OM da FAB', h('small', {}, 'Força Aérea Brasileira')),
  busca,
  h('div', { class: 'acoes-barra' }, btFiltros));
palco.appendChild(barra);

// Painéis
const painelFiltros = h('aside', { id: 'painel-filtros', class: 'vidro painel-filtros', hidden: true, 'aria-label': 'Filtros' });
const painelFicha = h('aside', { id: 'painel-ficha', class: 'vidro painel-ficha', hidden: true, 'aria-live': 'polite' });
const listaGrupo = h('ul', { id: 'lista-grupo' });
const painelGrupo = h('div', { class: 'vidro painel-grupo', hidden: true }, h('strong', {}, 'Unidades neste ponto'), listaGrupo);
const rodape = h('div', { class: 'rodape-esquerdo' });
const btVistaCima = h('button', { type: 'button', class: 'botao vidro' }, 'Vista de cima');
btVistaCima.addEventListener('click', () => mapa.vistaDeCima());
palco.append(painelFiltros, painelFicha, painelGrupo, rodape);

const filtros = criarFiltros(painelFiltros, lista, (ids) => mapa.filtrar(ids));
btFiltros.addEventListener('click', () => {
  painelFiltros.hidden = !painelFiltros.hidden;
  btFiltros.setAttribute('aria-expanded', String(!painelFiltros.hidden));
});

function abrirUnidade(id: string, voar = true) {
  const u = porId.get(id);
  if (!u) return;
  painelGrupo.hidden = true;
  painelFicha.replaceChildren(renderizarFicha(u, porId, 'painel'));
  painelFicha.hidden = false;
  painelFicha.scrollTop = 0;
  if (voar) mapa.voarPara(id);
}

function mostrarSubordinados(id: string) {
  filtros.mostrarSubordinados(id);
  painelFiltros.hidden = false;
  btFiltros.setAttribute('aria-expanded', 'true');
  const coords = [...descendentes(id, lista)].map((x) => porId.get(x)?.coord).filter((c): c is [number, number] => !!c);
  if (coords.length > 1) {
    const lons = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    mapa.map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], { padding: 80, maxZoom: 9 });
  } else mapa.voarPara(id);
}

criarCaixaBusca(busca, lista, (r) => abrirUnidade(r.unidade.id));
criarExterior(rodape, lista, (id) => abrirUnidade(id, false));
rodape.appendChild(btVistaCima);

mapa.aoSelecionar((id) => abrirUnidade(id, false));
mapa.aoSelecionarGrupo((ids) => {
  const us = ids.map((id) => porId.get(id)!).filter(Boolean).sort((a, b) => a.sigla.localeCompare(b.sigla, 'pt-BR'));
  listaGrupo.replaceChildren(...us.map((u) => {
    const b = h('button', { type: 'button', class: 'item-lista' }, h('strong', {}, u.sigla), h('span', {}, u.nome));
    b.addEventListener('click', () => abrirUnidade(u.id, false));
    return h('li', {}, b);
  }));
  painelGrupo.hidden = false;
});

document.addEventListener('acao-ficha', (e) => {
  const { acao, id } = (e as CustomEvent<{ acao: AcaoFicha; id: string }>).detail;
  if (acao === 'abrir') abrirUnidade(id);
  else if (acao === 'fechar') painelFicha.hidden = true;
  else if (acao === 'subordinados') mostrarSubordinados(id);
});

// Endereço com #id (vindo da página da unidade) abre a ficha
const abrirDoEndereco = () => {
  const alvo = decodeURIComponent(location.hash.slice(1));
  if (alvo && porId.has(alvo)) abrirUnidade(alvo);
};
window.addEventListener('hashchange', abrirDoEndereco);
abrirDoEndereco();

if (tema === 'teste' || params.has('depurar')) (window as unknown as { __mapa: unknown }).__mapa = mapa;
