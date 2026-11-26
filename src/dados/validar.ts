import type { Unidade } from './tipos';

// número com separador (2101-6000, (21) 2101 6000, 21 2101.6000) ou sequência longa de dígitos
const TELEFONE = /(\(?\d{2}\)?[\s.-]?)?\d{4,5}[\s.-]\d{4}\b|\(?\d{2}\)?\s?\d{8,9}\b|\bramal\b/gi;
const INTERVALO_DE_ANOS = /^(19|20)\d{2}[\s.-](19|20)\d{2}$/;
const temTelefone = (t: string) => [...t.matchAll(TELEFONE)].some((m) => !INTERVALO_DE_ANOS.test(m[0].trim()));
const REDE_INTERNA = /^https?:\/\/(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;
const BRASIL = { lon: [-74.5, -28.5], lat: [-34.5, 5.8] };

function textos(v: unknown, saida: string[] = []): string[] {
  if (typeof v === 'string') saida.push(v);
  else if (Array.isArray(v)) v.forEach((x) => textos(x, saida));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => textos(x, saida));
  return saida;
}

/** Retorna a lista de problemas do conjunto; vazia = válido. */
export function validarConjunto(us: Unidade[]): string[] {
  const erros: string[] = [];
  const porId = new Map<string, Unidade>();
  for (const u of us) {
    if (porId.has(u.id)) erros.push(`${u.id}: id duplicado`);
    porId.set(u.id, u);
  }
  for (const u of us) {
    if (u.subordinadaA && !porId.has(u.subordinadaA))
      erros.push(`${u.id}: subordinadaA "${u.subordinadaA}" não existe`);
    if (u.sediadoEm && !porId.has(u.sediadoEm))
      erros.push(`${u.id}: sediadoEm "${u.sediadoEm}" não existe`);
    if (u.categoria === 'esquadrao' && !u.sediadoEm) erros.push(`${u.id}: esquadrão sem sediadoEm`);
    const noMapa = u.pais === 'Brasil' && u.categoria !== 'esquadrao';
    if (noMapa && !u.coord) erros.push(`${u.id}: sem coordenada`);
    if (u.coord && u.pais === 'Brasil') {
      const [lon, lat] = u.coord;
      if (lon < BRASIL.lon[0] || lon > BRASIL.lon[1] || lat < BRASIL.lat[0] || lat > BRASIL.lat[1])
        erros.push(`${u.id}: coordenada fora do Brasil`);
    }
    if (u.ficha === 'completa' && !u.historico) erros.push(`${u.id}: ficha completa sem histórico`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(u.revisadoEm)) erros.push(`${u.id}: revisadoEm deve ser AAAA-MM-DD`);
    for (const t of textos(u)) {
      if (temTelefone(t)) erros.push(`${u.id}: contém telefone ("${t.slice(0, 40)}")`);
      if (/intraer/i.test(t)) erros.push(`${u.id}: contém link intraer`);
      if (REDE_INTERNA.test(t)) erros.push(`${u.id}: contém link de rede interna (${t})`);
      if (t.includes('@')) erros.push(`${u.id}: contém e-mail`);
    }
  }
  for (const u of us) {
    const vistos = new Set<string>();
    let atual: Unidade | undefined = u;
    while (atual?.subordinadaA) {
      if (vistos.has(atual.id)) {
        erros.push(`${u.id}: ciclo de subordinação`);
        break;
      }
      vistos.add(atual.id);
      atual = porId.get(atual.subordinadaA);
    }
  }
  return erros;
}
