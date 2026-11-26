import type { Unidade } from '../dados/tipos';
import { h } from './dom';

/** Botão "FAB no exterior (N)" que abre a lista das OMs fora do Brasil. */
export function criarExterior(el: HTMLElement, us: Unidade[], aoEscolher: (id: string) => void) {
  const fora = us.filter((u) => u.pais !== 'Brasil').sort((a, b) => a.pais.localeCompare(b.pais, 'pt-BR'));
  const painel = h('div', { id: 'painel-exterior', class: 'vidro painel-exterior', hidden: true },
    h('strong', {}, 'FAB no exterior'),
    h('ul', {}, fora.map((u) => {
      const b = h('button', { type: 'button', class: 'item-lista' },
        h('strong', {}, u.sigla), h('span', {}, u.nome), h('small', {}, `${u.cidade} · ${u.pais}`));
      b.addEventListener('click', () => { painel.hidden = true; aoEscolher(u.id); });
      return h('li', {}, b);
    })));
  const botao = h('button', { type: 'button', class: 'botao vidro', 'aria-expanded': 'false' }, `FAB no exterior (${fora.length})`);
  botao.addEventListener('click', () => {
    painel.hidden = !painel.hidden;
    botao.setAttribute('aria-expanded', String(!painel.hidden));
  });
  el.append(botao, painel);
}
