import '../estilos/fontes';
import '../estilos/vidro.css';
import '../estilos/pagina.css';
import { carregar } from '../dados/carregar';
import { h } from '../ui/dom';
import { renderizarFicha, type AcaoFicha } from '../ui/ficha';
import type { Tema } from '../mapa/estilo';

const params = new URLSearchParams(location.search);
const id = params.get('id') ?? '';
const estilo = params.get('estilo');
const tema: Tema = estilo === 'teste' ? 'teste' : estilo === 'claro' ? 'claro' : 'escuro';
const sufixoEstilo = estilo ? `?estilo=${encodeURIComponent(estilo)}` : '';
const { porId } = carregar();
const conteudo = document.getElementById('conteudo')!;
conteudo.className = 'pagina-unidade';

const linkMapa = (alvo?: string) =>
  h('a', { class: 'botao voltar', href: `./${sufixoEstilo}${alvo ? `#${alvo}` : ''}` }, '← Voltar ao mapa');

const u = porId.get(id);
if (!u) {
  document.title = 'Unidade não encontrada · Mapa das OM da FAB';
  conteudo.append(h('div', { class: 'vidro nao-encontrada' },
    h('h1', {}, 'Unidade não encontrada'),
    h('p', {}, 'O endereço pode estar incompleto ou a unidade pode ter mudado de nome.'),
    linkMapa()));
} else {
  document.title = `${u.sigla} · Mapa das OM da FAB`;
  const ficha = h('div', { class: 'vidro ficha-pagina' }, renderizarFicha(u, porId, 'pagina'));
  conteudo.append(linkMapa(u.id), ficha);
  const sede = u.categoria === 'esquadrao' && u.sediadoEm ? porId.get(u.sediadoEm) : u;
  if (sede?.coord) {
    const caixa = h('div', { class: 'mapa-pequeno' });
    const alvo = h('div', {});
    caixa.append(alvo);
    conteudo.append(caixa);
    const coord = sede.coord;
    void import('../mapa/mapa').then(({ criarMapa }) => {
      const mapa = criarMapa(alvo, [sede], { tema });
      mapa.map.jumpTo({ center: coord, zoom: 12, pitch: 0 });
      mapa.map.dragRotate.disable();
      mapa.map.touchZoomRotate.disableRotation();
    });
  }
  document.addEventListener('acao-ficha', (e) => {
    const { acao, id: alvo } = (e as CustomEvent<{ acao: AcaoFicha; id: string }>).detail;
    if (acao === 'abrir') location.href = `om.html?id=${encodeURIComponent(alvo)}${estilo ? `&estilo=${estilo}` : ''}`;
    else location.href = `./${sufixoEstilo}#${alvo}`;
  });
}
