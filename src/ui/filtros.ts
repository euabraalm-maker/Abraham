import { CATEGORIAS } from '../dados/categorias';
import { descendentes } from '../dados/hierarquia';
import type { CategoriaId, Unidade } from '../dados/tipos';
import { h } from './dom';

/** Painel de filtros. `aoMudar` recebe os ids visíveis (null = todas). */
export function criarFiltros(el: HTMLElement, us: Unidade[], aoMudar: (ids: Set<string> | null) => void) {
  const doMapa = us.filter((u) => u.pais === 'Brasil' && CATEGORIAS[u.categoria].noMapa);
  const cats = (Object.keys(CATEGORIAS) as CategoriaId[]).filter((c) => CATEGORIAS[c].noMapa);
  const contagem = (c: CategoriaId) => doMapa.filter((u) => u.categoria === c).length;
  const marcadas = new Set<CategoriaId>(cats);
  let raiz: string | null = null;

  const emitir = () => {
    if (raiz) aoMudar(descendentes(raiz, us));
    else if (marcadas.size === cats.length) aoMudar(null);
    else aoMudar(new Set(doMapa.filter((u) => marcadas.has(u.categoria)).map((u) => u.id)));
  };

  const caixas = cats.map((c) => {
    const input = h('input', { type: 'checkbox', id: `filtro-${c}`, checked: true });
    input.addEventListener('change', () => {
      if (input.checked) marcadas.add(c); else marcadas.delete(c);
      raiz = null; chip.hidden = true;
      emitir();
    });
    const amostra = h('i', { class: `amostra forma-${CATEGORIAS[c].forma}`, style: `--cor:${CATEGORIAS[c].cor.escuro};--cor-claro:${CATEGORIAS[c].cor.claro}` });
    return { c, input, label: h('label', { for: `filtro-${c}`, class: 'filtro' }, input, amostra, `${CATEGORIAS[c].rotulo} (${contagem(c)})`) };
  });
  const definirTodas = (sim: boolean) => {
    caixas.forEach(({ c, input }) => { input.checked = sim; if (sim) marcadas.add(c); else marcadas.delete(c); });
    raiz = null; chip.hidden = true;
    emitir();
  };
  const btTodos = h('button', { type: 'button', class: 'botao', 'data-acao': 'todos' }, 'Todos');
  const btNenhum = h('button', { type: 'button', class: 'botao', 'data-acao': 'nenhum' }, 'Nenhum');
  btTodos.addEventListener('click', () => definirTodas(true));
  btNenhum.addEventListener('click', () => definirTodas(false));
  const textoChip = h('span', {});
  const fecharChip = h('button', { type: 'button', class: 'chip-fechar', 'aria-label': 'Limpar' }, '✕');
  const chip = h('div', { class: 'chip', hidden: true }, textoChip, fecharChip);
  fecharChip.addEventListener('click', () => api.limpar());

  el.append(
    h('div', { class: 'filtros-topo' }, h('strong', {}, 'O que mostrar'), h('span', { class: 'filtros-botoes' }, btTodos, btNenhum)),
    chip,
    h('div', { class: 'filtros-lista' }, caixas.map((x) => x.label)),
  );

  const api = {
    mostrarSubordinados(id: string) {
      raiz = id;
      const u = us.find((x) => x.id === id);
      textoChip.textContent = `Subordinados a ${u?.sigla ?? id}`;
      chip.hidden = false;
      emitir();
    },
    limpar() {
      definirTodas(true);
    },
  };
  return api;
}
