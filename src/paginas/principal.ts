import '../estilos/fontes';
import { manterAtualizado } from '../ui/atualizacao';

manterAtualizado();
import '../estilos/mapa.css';
import '../estilos/vidro.css';
import '../estilos/organograma.css';
import { carregar } from '../dados/carregar';
import { descendentes } from '../dados/hierarquia';
import { criarMapa, type ModoCamera } from '../mapa/mapa';
import type { Tema } from '../mapa/estilo';
import { h } from '../ui/dom';
import { renderizarFicha, type AcaoFicha } from '../ui/ficha';
import { criarFiltros } from '../ui/filtros';
import { criarCaixaBusca } from '../ui/caixaBusca';
import { criarExterior } from '../ui/exterior';
import { criarOrganograma } from '../ui/organograma';
import { iniciarTema } from '../ui/tema';
import { monitorarDesempenho } from '../ui/desempenho';

const params = new URLSearchParams(location.search);
const estilo = params.get('estilo');
let mapaRef: { definirTema(t: 'escuro' | 'claro'): void } | null = null;
const temaVisual = iniciarTema((t) => mapaRef?.definirTema(t));
const tema: Tema = estilo === 'teste' ? 'teste' : estilo === 'claro' || estilo === 'escuro' ? estilo : temaVisual.atual();
const { lista, porId } = carregar();
const palco = document.getElementById('palco')!;
document.querySelector('header.topo')?.remove();

const elMapa = h('div', { id: 'mapa' });
palco.appendChild(elMapa);
// Câmera escolhida (lembrada entre visitas, quando o navegador permite)
const CHAVE_CAMERA = 'mapa-om-camera';
const lerCamera = (): ModoCamera => {
  try { const v = localStorage.getItem(CHAVE_CAMERA); return v === '3d' || v === 'cima' ? v : 'auto'; } catch { return 'auto'; }
};
let cameraAtual = lerCamera();
const mapa = criarMapa(elMapa, lista, { tema, camera: cameraAtual });
mapaRef = mapa;
monitorarDesempenho(() => document.documentElement.classList.add('fx-leve'));

// Barra superior
const busca = h('div', { class: 'busca' });
const btFiltros = h('button', { type: 'button', class: 'botao', 'aria-expanded': 'false', 'aria-controls': 'painel-filtros' }, 'Filtros');
const btTema = h('button', { type: 'button', class: 'botao', 'aria-label': 'Alternar tema', title: 'Alternar tema claro/escuro' }, '◐');
btTema.addEventListener('click', () => temaVisual.alternar());
const btVerMapa = h('button', { type: 'button', class: 'botao', 'aria-pressed': 'true' }, 'Mapa');
const btVerOrg = h('button', { type: 'button', class: 'botao', 'aria-pressed': 'false' }, 'Organograma');
const barra = h('header', { class: 'barra vidro' },
  h('span', { class: 'marca' }, 'Mapa das OM da FAB', h('small', {}, 'Força Aérea Brasileira')),
  busca,
  h('div', { class: 'acoes-barra' }, h('div', { class: 'alternancia', role: 'group', 'aria-label': 'Visualização' }, btVerMapa, btVerOrg), btFiltros, btTema));
palco.appendChild(barra);
// Os painéis começam logo abaixo da barra, que pode quebrar em duas linhas no celular
new ResizeObserver(() => palco.style.setProperty('--altura-barra', `${barra.offsetHeight}px`)).observe(barra);

// Painéis
const painelFiltros = h('aside', { id: 'painel-filtros', class: 'vidro painel-filtros', hidden: true, 'aria-label': 'Filtros' });
const painelFicha = h('aside', { id: 'painel-ficha', class: 'vidro painel-ficha', hidden: true, 'aria-live': 'polite' });
const listaGrupo = h('ul', { id: 'lista-grupo' });
const btFecharGrupo = h('button', { type: 'button', class: 'botao fechar', 'aria-label': 'Fechar lista' }, '✕');
const painelGrupo = h('div', { class: 'vidro painel-grupo', hidden: true },
  h('div', { class: 'grupo-topo' }, h('strong', {}, 'Unidades neste ponto'), btFecharGrupo), listaGrupo);
btFecharGrupo.addEventListener('click', () => (painelGrupo.hidden = true));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') painelGrupo.hidden = true; });
const rodape = h('div', { class: 'rodape-esquerdo' });
const MODOS: [ModoCamera, string, string][] = [
  ['auto', 'Automática', 'Inclina nos voos; você pode girar e inclinar à vontade'],
  ['3d', '3D', 'Sempre inclinada (perspectiva 3D), inclusive nos voos'],
  ['cima', 'De cima', 'Sempre plana, como um mapa de papel'],
];
const botoesCamera = MODOS.map(([modo, rotulo, dica]) => {
  const b = h('button', { type: 'button', class: 'botao', 'aria-pressed': String(modo === cameraAtual), title: dica }, rotulo);
  b.addEventListener('click', () => {
    cameraAtual = modo;
    botoesCamera.forEach((x, i) => x.setAttribute('aria-pressed', String(MODOS[i][0] === modo)));
    try { localStorage.setItem(CHAVE_CAMERA, modo); } catch { /* sem armazenamento */ }
    mapa.definirCamera(modo);
  });
  return b;
});
const seletorCamera = h('div', { class: 'alternancia vidro seletor-camera', role: 'group', 'aria-label': 'Ângulo da câmera' },
  h('span', { class: 'rotulo-camera' }, 'Câmera'), botoesCamera);
palco.append(painelFiltros, painelFicha, painelGrupo, rodape);

/** Abre ou fecha o painel de filtros; aberto, a barra de baixo some para não cobrir Aplicar/Cancelar. */
function mostrarFiltros(abrir: boolean) {
  painelFiltros.hidden = !abrir;
  btFiltros.setAttribute('aria-expanded', String(abrir));
  rodape.classList.toggle('sob-filtros', abrir);
}
const fecharFiltros = () => mostrarFiltros(false);
const filtros = criarFiltros(painelFiltros, lista, (ids) => mapa.filtrar(ids), fecharFiltros);
btFiltros.addEventListener('click', () => {
  if (!painelFiltros.hidden) filtros.descartar();
  mostrarFiltros(painelFiltros.hidden);
});

function abrirUnidade(id: string, voar = true) {
  const u = porId.get(id);
  if (!u) return;
  if (!telaOrg.hidden) mostrarMapa();
  painelGrupo.hidden = true;
  painelFicha.replaceChildren(renderizarFicha(u, porId, 'painel'));
  painelFicha.hidden = false;
  painelFicha.scrollTop = 0;
  if (voar) mapa.voarPara(id);
}

function mostrarSubordinados(id: string) {
  filtros.mostrarSubordinados(id);
  mostrarFiltros(true);
  const coords = [...descendentes(id, lista)].map((x) => porId.get(x)?.coord).filter((c): c is [number, number] => !!c);
  if (coords.length > 1) {
    const lons = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    mapa.map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], { padding: 80, maxZoom: 9 });
  } else mapa.voarPara(id);
}

criarCaixaBusca(busca, lista, (r) => {
  abrirUnidade(r.alvo.id);
  mapa.destacarSatelite(r.alvo.id !== r.unidade.id ? r.unidade.id : null);
});
criarExterior(rodape, lista, (id) => abrirUnidade(id, false));
rodape.appendChild(seletorCamera);

mapa.aoSelecionar((id) => abrirUnidade(id, false));
mapa.map.on('click', (e) => {
  const sob = mapa.map.queryRenderedFeatures(e.point, { layers: ['bolhas', 'unidades'].filter((l) => mapa.map.getLayer(l)) });
  if (!sob.length) painelGrupo.hidden = true;
});
mapa.aoSelecionarGrupo((ids) => {
  const us = ids.map((id) => porId.get(id)!).filter(Boolean).sort((a, b) => a.sigla.localeCompare(b.sigla, 'pt-BR'));
  listaGrupo.replaceChildren(...us.map((u) => {
    const b = h('button', { type: 'button', class: 'item-lista' }, h('strong', {}, u.sigla), h('span', {}, u.nome));
    b.addEventListener('click', () => abrirUnidade(u.id, false));
    return h('li', {}, b);
  }));
  painelGrupo.hidden = false;
});

// Organograma
const telaOrg = h('section', { id: 'tela-organograma', class: 'vidro tela-organograma', hidden: true, 'aria-label': 'Organograma' });
palco.appendChild(telaOrg);
let organograma: ReturnType<typeof criarOrganograma> | null = null;
function mostrarOrganograma(destaque?: string) {
  organograma ??= criarOrganograma(telaOrg, lista, (id) => { mostrarMapa(); abrirUnidade(id); });
  telaOrg.hidden = false;
  painelFicha.hidden = true;
  mostrarFiltros(false);
  painelGrupo.hidden = true;
  rodape.hidden = true;
  btVerMapa.setAttribute('aria-pressed', 'false');
  btVerOrg.setAttribute('aria-pressed', 'true');
  if (destaque) organograma.destacar(destaque);
}
function mostrarMapa() {
  telaOrg.hidden = true;
  rodape.hidden = false;
  btVerMapa.setAttribute('aria-pressed', 'true');
  btVerOrg.setAttribute('aria-pressed', 'false');
}
btVerMapa.addEventListener('click', mostrarMapa);
btVerOrg.addEventListener('click', () => mostrarOrganograma());

document.addEventListener('acao-ficha', (e) => {
  const { acao, id } = (e as CustomEvent<{ acao: AcaoFicha; id: string }>).detail;
  if (acao === 'abrir') abrirUnidade(id);
  else if (acao === 'fechar') painelFicha.hidden = true;
  else if (acao === 'subordinados') mostrarSubordinados(id);
  else if (acao === 'organograma') mostrarOrganograma(id);
});

// Endereço com #id (vindo da página da unidade) abre a ficha
// Formatos: #id, #id/subordinados, #id/organograma
const abrirDoEndereco = () => {
  const [alvo, acao] = decodeURIComponent(location.hash.slice(1)).split('/');
  if (!alvo || !porId.has(alvo)) return;
  if (acao === 'organograma') mostrarOrganograma(alvo);
  else if (acao === 'subordinados') { abrirUnidade(alvo, false); mostrarSubordinados(alvo); }
  else abrirUnidade(alvo);
};
window.addEventListener('hashchange', abrirDoEndereco);
abrirDoEndereco();

if (tema === 'teste' || params.has('depurar')) (window as unknown as { __mapa: unknown }).__mapa = mapa;
