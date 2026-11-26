import { buscar, type Resultado } from '../busca/buscar';
import type { Unidade } from '../dados/tipos';
import { h } from './dom';

const MOTIVO: Record<Resultado['motivo'], string> = {
  sigla: '', nome: '', esquadrao: 'esquadrão sediado', cidade: 'cidade', aeronave: 'aeronave',
};

/** Campo de busca com sugestões enquanto digita (↑/↓/Enter/Esc). */
export function criarCaixaBusca(el: HTMLElement, us: Unidade[], aoEscolher: (r: Resultado) => void) {
  const input = h('input', {
    id: 'busca', type: 'search', role: 'combobox', 'aria-label': 'Buscar unidade', 'aria-expanded': 'false',
    'aria-controls': 'busca-sugestoes', 'aria-autocomplete': 'list', autocomplete: 'off', spellcheck: 'false',
    placeholder: 'Buscar unidade, sigla, esquadrão, cidade…',
  });
  const lista = h('ul', { id: 'busca-sugestoes', role: 'listbox', class: 'sugestoes', hidden: true });
  el.append(h('span', { class: 'lupa', 'aria-hidden': 'true' }, '⌕'), input, lista);

  let resultados: Resultado[] = [];
  let ativo = 0;
  let espera: number | undefined;

  const fechar = () => { lista.hidden = true; input.setAttribute('aria-expanded', 'false'); };
  const escolher = (r: Resultado) => { fechar(); input.value = r.unidade.sigla; input.blur(); aoEscolher(r); };
  const destacar = () => {
    [...lista.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === ativo)));
    if (resultados[ativo]) input.setAttribute('aria-activedescendant', `sug-${ativo}`);
  };
  const desenhar = () => {
    resultados = buscar(input.value, us, 8);
    ativo = 0;
    lista.replaceChildren(...resultados.map((r, i) => {
      const li = h('li', { id: `sug-${i}`, role: 'option', 'aria-selected': 'false' },
        h('strong', {}, r.unidade.sigla),
        h('span', { class: 'sug-nome' }, r.unidade.nome),
        MOTIVO[r.motivo] && h('span', { class: 'sug-motivo' }, MOTIVO[r.motivo]));
      li.addEventListener('mousedown', (e) => { e.preventDefault(); escolher(r); });
      return li;
    }));
    lista.hidden = resultados.length === 0;
    input.setAttribute('aria-expanded', String(!lista.hidden));
    destacar();
  };

  input.addEventListener('input', () => {
    window.clearTimeout(espera);
    espera = window.setTimeout(desenhar, 80);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (lista.hidden) desenhar();
      ativo = (ativo + (e.key === 'ArrowDown' ? 1 : -1) + resultados.length) % Math.max(resultados.length, 1);
      destacar();
      e.preventDefault();
    } else if (e.key === 'Enter') {
      window.clearTimeout(espera);
      if (lista.hidden || !resultados.length) desenhar();
      if (resultados[ativo]) escolher(resultados[ativo]);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      fechar();
    }
  });
  input.addEventListener('blur', () => window.setTimeout(fechar, 120));
}
