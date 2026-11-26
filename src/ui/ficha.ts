import { CATEGORIAS } from '../dados/categorias';
import { cadeia, filhos } from '../dados/hierarquia';
import type { Unidade } from '../dados/tipos';
import { h } from './dom';

export type AcaoFicha = 'abrir' | 'subordinados' | 'organograma' | 'fechar';

/** Evento disparado (com bubbles) pelos botões e links da ficha. */
export function emitirAcao(origem: Element, acao: AcaoFicha, id: string) {
  origem.dispatchEvent(new CustomEvent('acao-ficha', { bubbles: true, detail: { acao, id } }));
}

const dataBr = (iso: string) => iso.split('-').reverse().join('/');
const caminhoImagem = (arquivo: string) => `${import.meta.env?.BASE_URL ?? '/'}img/om/${arquivo}`;

function linkUnidade(u: Unidade, atual = false) {
  const a = h('a', { href: `#${u.id}`, 'data-id': u.id, 'aria-current': atual ? 'page' : undefined }, u.sigla);
  a.addEventListener('click', (e) => {
    e.preventDefault();
    emitirAcao(a, 'abrir', u.id);
  });
  return a;
}

export function renderizarFicha(u: Unidade, porId: Map<string, Unidade>, modo: 'painel' | 'pagina'): HTMLElement {
  const todas = [...porId.values()];
  const cat = CATEGORIAS[u.categoria];
  const elos = cadeia(u.id, porId);
  const sede = u.sediadoEm ? porId.get(u.sediadoEm) : undefined;
  const sediados = filhos(u.id, todas).filter((f) => f.categoria === 'esquadrao');
  const local = u.pais === 'Brasil' ? `${u.cidade}${u.uf ? ` · ${u.uf}` : ''}` : `${u.cidade} · ${u.pais}`;

  const selos: string[] = [];
  if (u.pais === 'Brasil' && u.categoria !== 'esquadrao' && u.coordSituacao === 'aproximada') selos.push('posição aproximada');
  if (u.situacao.subordinacao === 'a-conferir') selos.push('subordinação a conferir');
  if (u.situacao.nome === 'a-conferir') selos.push('nome a conferir');

  const linha = (rotulo: string, valor: Node | string | null | undefined, classe?: string) =>
    valor ? [h('dt', {}, rotulo), h('dd', { class: classe }, valor)] : [];

  const botao = (acao: AcaoFicha, texto: string) => {
    const b = h('button', { type: 'button', class: 'botao', 'data-acao': acao }, texto);
    b.addEventListener('click', () => emitirAcao(b, acao, u.id));
    return b;
  };

  return h('article', { class: `ficha ficha-${modo}`, 'data-id': u.id, 'aria-label': u.nome },
    modo === 'painel' && botao('fechar', '✕'),
    u.brasao && h('img', { class: 'brasao', src: caminhoImagem(u.brasao.arquivo), alt: `Brasão ${u.sigla}`, title: u.brasao.credito }),
    u.foto && h('figure', { class: 'foto' },
      h('img', { src: caminhoImagem(u.foto.arquivo), alt: u.nome, loading: 'lazy' }),
      h('figcaption', {}, u.foto.credito)),
    h('span', { class: 'tag' }, `${cat.rotulo} · ${u.sigla}`),
    h('h2', { class: 'titulo' }, u.nome),
    elos.length > 0 && h('nav', { class: 'caminho', 'aria-label': 'Subordinação' },
      elos.flatMap((e, i) => [i ? h('span', { class: 'sep', 'aria-hidden': 'true' }, '›') : null, linkUnidade(e, e.id === u.id)])),
    selos.length > 0 && h('div', { class: 'selos' }, selos.map((s) => h('span', { class: 'selo' }, s))),
    h('dl', { class: 'dados' },
      linha('Local', local),
      linha('Sediado em', sede ? linkUnidade(sede) : null),
      linha('Esquadrões', sediados.length ? h('span', {}, sediados.flatMap((s, i) => [i ? ', ' : '', linkUnidade(s)])) : null, 'esquadroes'),
      linha('Aeronaves', u.aeronaves?.length ? u.aeronaves.join(' · ') : null, 'aeronaves'),
    ),
    u.historico && h('p', { class: 'historico' }, u.historico),
    h('div', { class: 'acoes' },
      u.site && h('a', { class: 'botao site-oficial', href: u.site, target: '_blank', rel: 'noopener' }, 'Site oficial ↗'),
      modo === 'painel' && h('a', { class: 'botao nova-aba', href: `om.html?id=${u.id}`, target: '_blank', rel: 'noopener' }, 'Abrir em nova aba'),
      u.pais === 'Brasil' && botao('subordinados', 'Mostrar subordinados no mapa'),
      botao('organograma', 'Ver no organograma'),
    ),
    h('footer', { class: 'revisao' },
      `Revisado em ${dataBr(u.revisadoEm)}`,
      u.fontes.length ? h('span', {}, ' · Fontes: ', u.fontes.flatMap((f, i) => [i ? ', ' : '', h('a', { href: f.url, target: '_blank', rel: 'noopener' }, f.titulo)])) : null),
  );
}
