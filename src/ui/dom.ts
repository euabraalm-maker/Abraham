type Filho = Node | string | null | undefined | false;

/** Cria um elemento com atributos e filhos (texto sempre como texto, nunca HTML). */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean | undefined> = {},
  ...filhos: (Filho | Filho[])[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    el.setAttribute(k, v === true ? '' : v);
  }
  for (const f of filhos.flat()) {
    if (f === null || f === undefined || f === false) continue;
    el.append(typeof f === 'string' ? document.createTextNode(f) : f);
  }
  return el;
}
