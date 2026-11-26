import { arvore, cadeia, descendentes, type No } from '../dados/hierarquia';
import type { Unidade } from '../dados/tipos';
import { h } from './dom';

const RAIZ = 'comaer';

/** Árvore expansível da hierarquia. Clicar num nó chama `aoEscolher(id)`. */
export function criarOrganograma(el: HTMLElement, us: Unidade[], aoEscolher: (id: string) => void) {
  const porId = new Map(us.map((u) => [u.id, u]));
  const raizes = arvore(us);
  const principal = raizes.find((n) => n.unidade.id === RAIZ);
  const aConferir = raizes.filter((n) => n !== principal);
  const nos = new Map<string, No>();
  const indexar = (n: No) => { nos.set(n.unidade.id, n); n.filhos.forEach(indexar); };
  raizes.forEach(indexar);
  const itens = new Map<string, HTMLLIElement>();

  function item(n: No): HTMLLIElement {
    const u = n.unidade;
    const total = descendentes(u.id, us).size - 1;
    const no = h('button', { type: 'button', class: `no no-${u.categoria}`, 'data-id': u.id, title: u.nome },
      h('strong', {}, u.sigla),
      h('span', { class: 'no-nome' }, u.nome),
      total > 0 && h('small', {}, `${total} abaixo`));
    no.addEventListener('click', () => aoEscolher(u.id));
    const li = h('li', {}, no);
    if (n.filhos.length) {
      li.setAttribute('aria-expanded', 'false');
      const alternar = h('button', { type: 'button', class: 'alternar', 'aria-label': `Abrir ${u.sigla}` }, '▸');
      alternar.addEventListener('click', () => expandir(li, n, li.getAttribute('aria-expanded') !== 'true'));
      li.prepend(alternar);
    }
    itens.set(u.id, li);
    return li;
  }

  function expandir(li: HTMLLIElement, n: No, abrir: boolean) {
    li.setAttribute('aria-expanded', String(abrir));
    const alternar = li.querySelector(':scope > .alternar');
    if (alternar) alternar.textContent = abrir ? '▾' : '▸';
    let ul = li.querySelector(':scope > ul');
    if (abrir && !ul) {
      ul = h('ul', {}, n.filhos.map(item));
      li.append(ul);
    }
    if (ul) (ul as HTMLElement).hidden = !abrir;
  }

  const arv = h('ul', { class: 'arvore' });
  if (principal) {
    const li = item(principal);
    arv.append(li);
    expandir(li, principal, true);
  }
  const listaConferir = h('ul', { class: 'arvore' });
  const grupo = h('details', { class: 'grupo-conferir' },
    h('summary', {}, `Subordinação a conferir (${aConferir.length})`), listaConferir);
  let conferirMontado = false;
  const montarConferir = () => {
    if (conferirMontado) return;
    conferirMontado = true;
    listaConferir.append(...aConferir.map(item));
  };
  grupo.addEventListener('toggle', () => { if (grupo.open) montarConferir(); });

  el.append(
    h('p', { class: 'organograma-dica' }, 'Clique numa unidade para vê-la no mapa. Use ▸ para abrir os níveis abaixo.'),
    arv,
    ...(aConferir.length > 0 ? [grupo] : []),
  );

  return {
    destacar(id: string) {
      el.querySelectorAll('.no.destaque').forEach((x) => x.classList.remove('destaque'));
      const elos = cadeia(id, porId);
      if (elos[0]?.id !== RAIZ) { grupo.open = true; montarConferir(); }
      for (const elo of elos.slice(0, -1)) {
        const li = itens.get(elo.id);
        const n = nos.get(elo.id);
        if (li && n) expandir(li, n, true);
      }
      const alvo = itens.get(id)?.querySelector(':scope > .no');
      alvo?.classList.add('destaque');
      (alvo as HTMLElement | undefined)?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    },
  };
}
