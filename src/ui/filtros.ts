import { CATEGORIAS } from '../dados/categorias';
import { descendentes } from '../dados/hierarquia';
import type { CategoriaId, Unidade } from '../dados/tipos';
import { h } from './dom';

/**
 * Painel de filtros. As caixinhas só valem ao clicar em "Aplicar"; "Cancelar" desfaz.
 * `aoMudar` recebe os ids visíveis (null = todas); `aoFechar` fecha o painel.
 */
export function criarFiltros(el: HTMLElement, us: Unidade[], aoMudar: (ids: Set<string> | null) => void, aoFechar: () => void = () => {}) {
  const doMapa = us.filter((u) => u.pais === 'Brasil' && CATEGORIAS[u.categoria].noMapa);
  const cats = (Object.keys(CATEGORIAS) as CategoriaId[]).filter((c) => CATEGORIAS[c].noMapa);
  const contagem = (c: CategoriaId) => doMapa.filter((u) => u.categoria === c).length;
  let aplicadas = new Set<CategoriaId>(cats);
  let raiz: string | null = null;

  const emitir = () => {
    if (raiz) aoMudar(descendentes(raiz, us));
    else if (aplicadas.size === cats.length) aoMudar(null);
    else aoMudar(new Set(doMapa.filter((u) => aplicadas.has(u.categoria)).map((u) => u.id)));
  };

  const caixas = cats.map((c) => {
    const input = h('input', { type: 'checkbox', id: `filtro-${c}`, checked: true });
    const amostra = h('i', { class: `amostra forma-${CATEGORIAS[c].forma}`, style: `--cor:${CATEGORIAS[c].cor.escuro};--cor-claro:${CATEGORIAS[c].cor.claro}` });
    return { c, input, label: h('label', { for: `filtro-${c}`, class: 'filtro' }, input, amostra, `${CATEGORIAS[c].rotulo} (${contagem(c)})`) };
  });
  const mostrarCaixas = (marcadas: Set<CategoriaId>) => caixas.forEach(({ c, input }) => (input.checked = marcadas.has(c)));
  const escolhidas = () => new Set(caixas.filter((x) => x.input.checked).map((x) => x.c));

  const botao = (acao: string, texto: string, classe = 'botao') => h('button', { type: 'button', class: classe, 'data-acao': acao }, texto);
  const btTodos = botao('todos', 'Todos');
  const btNenhum = botao('nenhum', 'Nenhum');
  const btCancelar = botao('cancelar', 'Cancelar');
  const btAplicar = botao('aplicar', 'Aplicar', 'botao botao-principal');
  btTodos.addEventListener('click', () => mostrarCaixas(new Set(cats)));
  btNenhum.addEventListener('click', () => mostrarCaixas(new Set()));
  btCancelar.addEventListener('click', () => { mostrarCaixas(aplicadas); aoFechar(); });
  btAplicar.addEventListener('click', () => {
    aplicadas = escolhidas();
    raiz = null; chip.hidden = true;
    emitir();
    aoFechar();
  });

  const textoChip = h('span', {});
  const fecharChip = h('button', { type: 'button', class: 'chip-fechar', 'aria-label': 'Limpar' }, '✕');
  const chip = h('div', { class: 'chip', hidden: true }, textoChip, fecharChip);
  fecharChip.addEventListener('click', () => api.limpar());

  el.append(
    h('div', { class: 'filtros-topo' }, h('strong', {}, 'O que mostrar'), h('span', { class: 'filtros-botoes' }, btTodos, btNenhum)),
    chip,
    h('div', { class: 'filtros-lista' }, caixas.map((x) => x.label)),
    h('div', { class: 'filtros-rodape' }, btCancelar, btAplicar),
  );

  const api = {
    /** Mostra só a subárvore da unidade (vem da ficha; vale na hora). */
    mostrarSubordinados(id: string) {
      raiz = id;
      const u = us.find((x) => x.id === id);
      textoChip.textContent = `Subordinados a ${u?.sigla ?? id}`;
      chip.hidden = false;
      emitir();
    },
    /** Volta a mostrar tudo. */
    limpar() {
      aplicadas = new Set(cats);
      mostrarCaixas(aplicadas);
      raiz = null; chip.hidden = true;
      emitir();
    },
    /** Desfaz o que não foi aplicado (ao fechar o painel por fora). */
    descartar() {
      mostrarCaixas(aplicadas);
    },
  };
  return api;
}
