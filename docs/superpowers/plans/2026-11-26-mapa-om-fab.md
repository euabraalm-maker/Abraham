# Mapa das OM da FAB — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Site estático com mapa interativo 3D ("holográfico") de todas as OMs da FAB no Brasil, com filtros, busca, ficha, página por unidade, organograma e modos claro/escuro — etapa 1 do lançamento.

**Architecture:** Vite multipágina em TypeScript puro (sem framework). Dados em `data/unidades.json`, validados por esquema e testes. MapLibre GL renderiza tiles vetoriais gratuitos (OpenFreeMap) com estilo próprio + camadas locais de UFs/regiões; unidades vêm de uma fonte GeoJSON com agrupamento (bolhas). Módulos puros (busca, hierarquia, categorias, validação) são testados com Vitest; telas com Vitest+jsdom; fluxo completo com Playwright usando um estilo de teste offline.

**Tech Stack:** Vite 5.4.11, TypeScript 5.6.3, maplibre-gl 4.7.1, @maplibre/maplibre-gl-style-spec 20.4.0, zod 3.23.8, vite-plugin-pwa 0.21.1, @fontsource/sora 5.1.0, @fontsource/manrope 5.1.0, Vitest 2.1.8, jsdom 25.0.1, @playwright/test 1.49.1, mapshaper 0.6.102 (só script). Hospedagem: GitHub Pages via GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-26-mapa-om-fab-design.md` (ler junto). Protótipo visual de referência: https://claude.ai/artifact/AhT3iYVjDqZ44CoQL9zU8z (painel C).

## Global Constraints

- Português do Brasil em toda a interface e nos dados.
- Aviso permanente e discreto em todas as páginas: `Material didático, não oficial`.
- Só informação pública. **Proibido** no site/dados: telefones, ramais, e-mails de protocolo, links `intraer`, qualquer conteúdo sobre atuação de especialidades (incl. BCO).
- O PDF `catalogo_comaer.pdf` **não** é versionado (só referência local, em `/root/.claude/uploads/.../catalogo_comaer.pdf`; pedir ao autor se ausente).
- Dado não confirmado é exibido como `a conferir`, nunca chutado. Coordenada não confirmada → posição da cidade + selo `posição aproximada`.
- Sítios isolados (radares) ficam no ponto exato quando a coordenada é pública (decisão do autor).
- Sem divisas municipais.
- Esquadrões/grupos sediados: sem ícone no mapa; registro próprio com `sediadoEm`, página própria, nó no organograma, encontrados pela busca; fora das contagens dos filtros.
- OMs no exterior: fora do mapa, listadas no painel "FAB no exterior".
- Imagens só com licença verificada + crédito; sem isso, sem imagem.
- Modo escuro padrão + modo claro (variante clara da mesma direção holográfica), alternáveis; escolha lembrada (try/catch no `localStorage`).
- Respeitar `prefers-reduced-motion`.
- Máquina de referência: Samsung Galaxy Book2 (Intel integrada), Chrome/Edge, espelhado numa TV 65".
- Custo zero, sem chave de API obrigatória.
- Playwright: lançar com `executablePath: '/opt/pw-browsers/chromium'` e rodar com `--trace off`.

## Review Focus

1. **Várias OMs no mesmo ponto** (ex.: BAGL, PAMA-GL, PAGL, DTCEA-GL no Galeão) — a bolha nunca se separa no zoom máximo; ao clicar nela no zoom máximo deve abrir uma lista das unidades ali. Teste na Task 8.
2. **Busca com grafias reais** — `cindacta 1` deve achar `CINDACTA I`; `1o gda`/`1º GDA`/`1 gda` iguais; `dtcea gw` acha `DTCEA-GW`; sem acento acha com acento. Testes na Task 5.
3. **Servidor de tiles fora do ar** — UFs, regiões e alfinetes (dados locais) continuam aparecendo e um aviso discreto informa que o mapa detalhado não carregou. Teste na Task 8.
4. **Vazamento do catálogo** — telefone, `intraer` ou e-mail em qualquer campo deve reprovar a validação. Teste na Task 2.
5. **Página de unidade com id inexistente/vazio** — mostra "Unidade não encontrada" com link para o mapa, sem erro. Teste na Task 10.

---

## Estrutura de arquivos

```
index.html                  mapa (página principal)
om.html                     página de uma unidade (?id=<id>)
data/unidades.json          todas as unidades (OMs, esquadrões, exterior)
public/geo/ufs.json         divisas estaduais simplificadas (IBGE)
public/geo/regioes.json     5 regiões (dissolvidas das UFs)
public/img/om/<id>-brasao.* / <id>-foto.*   imagens licenciadas
scripts/baixar-geo.mjs      baixa e simplifica UFs/regiões
scripts/coords-municipios.mjs  gera data/municipios.json (coord. das sedes municipais usadas)
src/dados/tipos.ts          tipos TS + esquema zod
src/dados/validar.ts        validação do conjunto
src/dados/categorias.ts     categorias de filtro, cores, formas
src/dados/hierarquia.ts     cadeia, descendentes, árvore
src/dados/carregar.ts       importa e indexa unidades
src/busca/normalizar.ts     normalização de texto
src/busca/buscar.ts         ranking de busca
src/mapa/estilo.ts          estilo MapLibre (escuro/claro/teste)
src/mapa/icones.ts          desenha ícones por categoria (canvas)
src/mapa/mapa.ts            cria e controla o mapa
src/mapa/aviao.ts           animação do aviãozinho
src/ui/filtros.ts  src/ui/caixaBusca.ts  src/ui/ficha.ts  src/ui/exterior.ts
src/ui/organograma.ts  src/ui/tema.ts  src/ui/desempenho.ts
src/paginas/principal.ts  src/paginas/unidade.ts
src/estilos/*.css           tokens, vidro, componentes
tests/unit/*.test.ts        Vitest
tests/e2e/*.spec.ts         Playwright
.github/workflows/deploy.yml
```

---

### Task 1: Esqueleto do projeto

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `index.html`, `om.html`, `src/paginas/principal.ts`, `src/paginas/unidade.ts`, `src/estilos/tokens.css`, `.gitignore`
- Test: `tests/e2e/esqueleto.spec.ts`

**Interfaces:**
- Produces: scripts npm `dev`, `build`, `test` (vitest run), `e2e` (playwright test --trace off), `validar` (vitest run tests/unit/dados.test.ts). Vite `base: '/Abraham/'` (GitHub Pages do repo), entradas `index.html` e `om.html`. `tokens.css` define as variáveis de cor dos dois temas (`:root[data-tema="escuro"]`, `:root[data-tema="claro"]`) a partir do painel C do protótipo, fontes Sora (títulos) e Manrope (texto) via @fontsource.

- [ ] **Step 1: Teste e2e falhando** — `tests/e2e/esqueleto.spec.ts`: abre `/Abraham/`; espera `<title>` = `Mapa das OM da FAB` e texto visível `Material didático, não oficial`; abre `/Abraham/om.html?id=x` e espera o mesmo aviso.
- [ ] **Step 2: Rodar** `npm run e2e` → FAIL (sem servidor/páginas). Playwright config: `webServer: npm run dev -- --port 5173`, `use.launchOptions.executablePath: '/opt/pw-browsers/chromium'`.
- [ ] **Step 3: Criar o esqueleto** com as versões do Tech Stack; páginas com cabeçalho mínimo e rodapé com o aviso.
- [ ] **Step 4: Rodar** `npm run e2e` → PASS; `npm run build` gera `dist/index.html` e `dist/om.html`.
- [ ] **Step 5: Commit** `chore: esqueleto Vite + testes`

### Task 2: Modelo de dados e validação

**Files:**
- Create: `src/dados/tipos.ts`, `src/dados/validar.ts`, `data/unidades.json` (3 registros de exemplo: BAAN, 1º GDA sediado na BAAN, CABW no exterior)
- Test: `tests/unit/validar.test.ts`, `tests/unit/dados.test.ts`

**Interfaces:**
- Produces (`tipos.ts`):
```ts
export type CategoriaId = 'base'|'comando'|'decea'|'dtcea'|'escola'|'grupamento'|'parque'|'saude'|'prefeitura'|'ciencia'|'administracao'|'esquadrao'|'exterior';
export type Situacao = 'confirmado'|'a-conferir';
export interface Fonte { titulo: string; url: string }
export interface Imagem { arquivo: string; credito: string; licenca: string; origem: string }
export interface Unidade {
  id: string;                 // slug minúsculo: 'baan', 'dtcea-gw', '1-gda'
  sigla: string; nome: string; categoria: CategoriaId;
  tipoCatalogo: string;       // categoria original do PDF ("Destacamento", ...)
  cidade: string; uf: string | null; pais: string;   // 'Brasil' ou país
  coord: [number, number] | null;  // [lon, lat]
  coordSituacao: 'exata'|'aproximada';
  subordinadaA: string | null;     // id
  sediadoEm?: string;              // id — obrigatório se categoria='esquadrao'
  site: string | null;
  ficha: 'basica'|'completa';
  historico?: string; aeronaves?: string[];
  brasao?: Imagem; foto?: Imagem;
  situacao: { nome: Situacao; localizacao: Situacao; subordinacao: Situacao };
  fontes: Fonte[]; revisadoEm: string;   // 'AAAA-MM-DD'
}
export const esquemaUnidade: z.ZodType<Unidade>;
```
- Produces (`validar.ts`): `validarConjunto(us: Unidade[]): string[]` — lista de erros (vazia = ok).

- [ ] **Step 1: Testes falhando** em `validar.test.ts`, um `it` por regra, cada um esperando erro contendo o id: ids duplicados; `subordinadaA`/`sediadoEm` apontando id inexistente; ciclo de subordinação (a→b→a); esquadrão sem `sediadoEm`; `pais==='Brasil'` sem `coord`; `coord` fora de lon[-74.5,-28.5]/lat[-34.5,5.8] no Brasil; `ficha==='completa'` sem `historico`; **vazamento** (Review Focus 4): qualquer string com `/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/`, `intraer` ou `@` → erro; `revisadoEm` fora do formato. Mais um `it` que o conjunto de exemplo válido retorna `[]`.
- [ ] **Step 2:** `npx vitest run tests/unit/validar.test.ts` → FAIL.
- [ ] **Step 3:** Implementar `tipos.ts` (zod) e `validarConjunto`.
- [ ] **Step 4:** `dados.test.ts`: parse de `data/unidades.json` com o esquema + `validarConjunto` = `[]`. Rodar `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: modelo de dados e validação`

### Task 3: Categorias e ícones

**Files:**
- Create: `src/dados/categorias.ts`, `src/mapa/icones.ts`
- Test: `tests/unit/categorias.test.ts`

**Interfaces:**
- Produces: `CATEGORIAS: Record<CategoriaId,{rotulo:string; forma:'aviao'|'losango'|'quadrado'|'estrela'|'circulo'|'hexagono'|'triangulo'|'cruz'|'casa'|'atomo'|'pilar'; cor:{escuro:string; claro:string}; noMapa:boolean}>` (`esquadrao` e `exterior` com `noMapa:false`); `categoriaDoCatalogo(tipoCatalogo: string, sigla: string): CategoriaId`; `desenharIcone(c: CategoriaId, tema:'escuro'|'claro', px:number): ImageData`.
- Rótulos: base "Bases Aéreas", comando "Comandos e COMAR", decea "Órgãos do DECEA", dtcea "Destacamentos (DTCEA)", escola "Escolas e ensino", grupamento "Grupamentos de Apoio", parque "Parques de Material", saude "Saúde", prefeitura "Prefeituras", ciencia "Ciência e Tecnologia", administracao "Diretorias, centros e serviços".
- Regras de `categoriaDoCatalogo` (por sigla primeiro, depois tipo): `CINDACTA*`, `CRCEA*`, `CGNA`, `DECEA`, `GEIV`, `1º GCC`, `ICEA`, `CISCEA`, `ASOCEA` → decea; `DTCEA*`, `DESTAE*`, `DTS*`, `DSM*`, `DASG` → dtcea; `PAMA*`, `PAMB*`, `PAME*` → parque; `GAP*`, `GAL`, `GALC` → grupamento; `COMAR`/`* COMAR`, `COMAER`, `COMAE`, `COMPREP`, `COMGEP`, `COMGAP`, `EMAER`, `GABAER`, `SEFA` → comando; `DCTA`, `IAE`, `IEAV`, `IFI`, `IPEV`, `IAOP`, `CLA`, `CLBI`, `CPBV` → ciencia; tipo Hospital/Odontoclinica, `CEMAL`, `IMAE`, `LAQFA` → saude; tipo Esquadrão, Grupo (exceto `1º GCC`) → esquadrao; tipo Escola/Academia/Universidade/Colegio, `ITA`, `CIAAR`, `CPORAER*` → escola; tipo Base → base; Prefeitura → prefeitura; tipos Adidância, Comissão no exterior, Missão → exterior quando `pais!=='Brasil'` (decidido no dado); demais → administracao.

- [ ] **Step 1: Testes falhando** com tabela: `('Centro','CINDACTA II')→decea`, `('Destacamento','DTCEA-GW')→dtcea`, `('Destacamento','DESTAE-CV')→dtcea`, `('Grupo','1º GCC')→decea`, `('Grupo','1° GDA')→esquadrao`, `('Hospital','HFAB')→saude`, `('Instituto','ITA')→escola`, `('Instituto','ICEA')→decea`, `('Base','BAAN')→base`, `('Servico','SERIPA I')→administracao`, `('Comando','II COMAR')→comando`; e que cada categoria com `noMapa` tem forma e duas cores distintas.
- [ ] **Step 2:** rodar → FAIL. **Step 3:** implementar (ícones: forma em branco + contorno, colorida por `icon-color` → registrar como SDF). **Step 4:** rodar → PASS. **Step 5: Commit** `feat: categorias e ícones`

### Task 4: Conjunto de dados v0 (lista completa do catálogo)

Tarefa de dados: transcrever o PDF para `data/unidades.json`. Sem código novo além de um script de coordenadas.

**Files:**
- Create: `scripts/coords-municipios.mjs`, `data/municipios.json`
- Modify: `data/unidades.json`

**Interfaces:**
- Consumes: esquema da Task 2, `categoriaDoCatalogo` da Task 3.
- Produces: todas as ~308 fichas do PDF (300 siglas) + CRCEA-SE, cada uma com `ficha:'basica'`, nome **completo** lido no PDF (corrige truncamentos do índice), cidade/UF do endereço, `site` só se não for `intraer`, `coord` = sede municipal (`coordSituacao:'aproximada'`), `subordinadaA:null` e `situacao.subordinacao:'a-conferir'` (preenchido na Task 13), `fontes:[{titulo:'Catálogo do COMAER (PDF)', url:'https://www.fab.mil.br/'}]`, `revisadoEm` = data do trabalho. Esquadrões/grupos com `sediadoEm` = base da cidade indicada (`a-conferir` quando ambíguo, ex.: 1º/1º GT). Duplicatas DESTAE-FN/DTCEA-FN e DESTAE-MQ/DTCEA-MQ: manter as duas fichas se o PDF as trata como OMs distintas; se forem a mesma, uma ficha e a sigla alternativa no `nome`. Exterior com `pais` e `coord:null`.
- `coords-municipios.mjs`: lê as cidades de `unidades.json`, busca as coordenadas na API do IBGE de localidades/malhas (ou no CSV público `kelvins/municipios-brasileiros`), grava `data/municipios.json` `{ "Anápolis/GO": [lon,lat], ... }` e preenche `coord` faltantes.

- [ ] **Step 1:** Ler o PDF em blocos de 20 páginas (Read com `pages`) e transcrever. Nada de telefone/e-mail/intraer.
- [ ] **Step 2:** Rodar o script de coordenadas.
- [ ] **Step 3:** `npm run validar` → PASS (a validação da Task 2 barra vazamentos).
- [ ] **Step 4:** Conferir contagens: `node -e` imprimindo total por categoria; esperado ~300 + CRCEA-SE, exterior ≈ 6–8, esquadrão ≈ 50.
- [ ] **Step 5: Commit** `data: lista completa de unidades a partir do catálogo`

### Task 5: Busca

**Files:**
- Create: `src/busca/normalizar.ts`, `src/busca/buscar.ts`
- Test: `tests/unit/buscar.test.ts`

**Interfaces:**
- Produces: `normalizar(s: string): string` (minúsculas, sem acento, `º`/`°`/`o` ordinal após dígito → nada, hífens/pontos/barras → espaço, romanos isolados I–VII → dígitos, espaços colapsados); `buscar(consulta: string, us: Unidade[], limite = 8): Resultado[]` com `interface Resultado { unidade: Unidade; motivo: 'sigla'|'nome'|'esquadrao'|'cidade'|'aeronave'; alvo: Unidade }` — para esquadrão, `alvo` é a unidade-sede (o mapa voa até ela).
- Ranking (maior primeiro): sigla igual > sigla começa com > sigla contém > nome começa com/palavra começa com > nome contém > esquadrão (sigla ou apelido) > cidade > aeronave. Empate: ordem alfabética da sigla. Consulta < 1 caractere útil → `[]`.

- [ ] **Step 1: Testes falhando** (Review Focus 2): `cindacta 1`→primeiro `CINDACTA I`; `CINDACTA IV` não aparece antes de `CINDACTA I` para `cindacta 1`; `1o gda`, `1º GDA`, `1 gda` → mesmo primeiro resultado; `dtcea gw` e `gw`→`DTCEA-GW` no topo; `anapolis`→`BAAN` presente; `pampa`→resultado com `motivo:'esquadrao'` e `alvo.id==='baco'`; `f-39`→`BAAN` com `motivo:'aeronave'` (usando dados de teste); `'  '`→`[]`; limite respeitado.
- [ ] **Step 2:** rodar → FAIL. **Step 3:** implementar. **Step 4:** PASS. **Step 5: Commit** `feat: busca por sigla, nome, esquadrão, cidade e aeronave`

### Task 6: Hierarquia

**Files:**
- Create: `src/dados/hierarquia.ts`, `src/dados/carregar.ts`
- Test: `tests/unit/hierarquia.test.ts`

**Interfaces:**
- Produces: `carregar(): { lista: Unidade[]; porId: Map<string,Unidade> }`; `cadeia(id, porId): Unidade[]` (do topo até a própria, ex. `[COMAER, DECEA, CINDACTA I, DTCEA-AN]`); `filhos(id, us): Unidade[]` (subordinadas + sediadas, ordenadas por sigla); `descendentes(id, us): Set<string>` (inclui o próprio); `arvore(us): No[]` com `interface No { unidade: Unidade; filhos: No[] }`, raízes = unidades sem `subordinadaA` no Brasil.

- [ ] **Step 1: Testes falhando**: cadeia de 4 níveis na ordem certa; `cadeia` de raiz = `[raiz]`; dado com ciclo não trava (`cadeia` para ao repetir); `descendentes('cindacta-1')` inclui DTCEA e esquadrão sediado; `arvore` coloca unidade com `subordinadaA` desconhecida como raiz.
- [ ] **Step 2–4:** FAIL → implementar → PASS. **Step 5: Commit** `feat: utilitários de hierarquia`

### Task 7: Estilo do mapa e camadas geográficas

**Files:**
- Create: `scripts/baixar-geo.mjs`, `public/geo/ufs.json`, `public/geo/regioes.json`, `src/mapa/estilo.ts`
- Test: `tests/unit/estilo.test.ts`

**Interfaces:**
- Produces: `criarEstilo(tema: 'escuro'|'claro'|'teste'): StyleSpecification`. `escuro`/`claro`: fonte vetorial `https://tiles.openfreemap.org/planet` (esquema OpenMapTiles), glyphs `https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf`, mais fontes GeoJSON locais `ufs` e `regioes` (URL relativa com `import.meta.env.BASE_URL`). `teste`: só fundo + `ufs` + `regioes`, sem rede (usado pelo e2e).
- Camadas por zoom (spec 5.2): z0+ fundo, água, `regioes` preenchidas (5 tons próximos da paleta), `ufs` linha (brilho no escuro); z4+ rótulos de capitais; z5+ cidades principais, rios; z6+ rodovias principais; z11+ `aeroway` (pista, pátio); z12+ ruas e bairros. Nenhuma camada de limite municipal (`boundary` admin_level ≥ 5 excluído).
- Cores: derivadas dos tokens do painel C (fundo `#070b22`→`#1d3a8a`, traços `rgba(160,190,255,.9)`); claro: fundo claro azulado, traços azul escuro, mesmo desenho.
- `baixar-geo.mjs`: baixa malha das UFs da API de malhas do IBGE (`servicodados.ibge.gov.br/api/v3/malhas/paises/BR?intrarregiao=UF&formato=application/vnd.geo+json&qualidade=minima`), anexa sigla/região, simplifica com mapshaper (≤ 400 KB) e dissolve por região em `regioes.json`.

- [ ] **Step 1: Testes falhando**: `validateStyleMin(criarEstilo(t))` sem erros para os três temas; nenhum layer com filtro de `admin_level` ≥ 5; `teste` não contém URL `http`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar e rodar o script (se a rede do ambiente bloquear o IBGE, pedir liberação do host via ferramentas de ambiente). **Step 4:** PASS. **Step 5: Commit** `feat: estilo holográfico e camadas de UFs/regiões`

### Task 8: Componente do mapa

**Files:**
- Create: `src/mapa/mapa.ts`
- Modify: `src/paginas/principal.ts`
- Test: `tests/e2e/mapa.spec.ts`

**Interfaces:**
- Consumes: `criarEstilo`, `desenharIcone`, `CATEGORIAS`, `carregar`.
- Produces:
```ts
export interface MapaApi {
  voarPara(id: string): void;                 // flyTo zoom 12, pitch 50, ~2.2s (instantâneo com reduced-motion)
  filtrar(ids: Set<string> | null): void;     // null = todas visíveis
  definirTema(t: 'escuro'|'claro'): void;
  aoSelecionar(cb: (id: string) => void): void;
  aoSelecionarGrupo(cb: (ids: string[]) => void): void; // bolha no zoom máximo
  vistaDeCima(): void;
  map: maplibregl.Map;
}
export function criarMapa(el: HTMLElement, us: Unidade[], o: { tema: 'escuro'|'claro'|'teste' }): MapaApi;
```
- Comportamento: centro Brasil `[-52, -14]`, zoom 3.6, pitch 30 inicial; `NavigationControl` (+/−/bússola) e duplo clique; arrastar com botão direito/Ctrl gira e inclina; fonte GeoJSON `unidades` só com `noMapa` e `pais==='Brasil'`, `cluster:true`, `clusterRadius:48`, `clusterMaxZoom:13`; bolha mostra contagem; clique na bolha → `getClusterExpansionZoom` + `easeTo`; **no zoom máximo ou se todos os pontos têm a mesma coordenada** → `aoSelecionarGrupo` com os ids (Review Focus 1); rótulo da sigla aparece a partir do zoom 7; `filtrar` usa `setFilter`/regeração da fonte com transição de opacidade; `map.on('error')` de tiles → banner `Mapa detalhado indisponível no momento — exibindo divisas e unidades.` (Review Focus 3); atributo `data-pronto="1"` no contêiner após `load`.

- [ ] **Step 1: e2e falhando** (página com `?estilo=teste`): contêiner fica `data-pronto="1"`; existe ao menos uma bolha com número; clicar numa unidade isolada dispara a ficha (stub: `#ficha` recebe o id); bolha de 4 unidades com coordenada idêntica, após zoom máximo, abre `#lista-grupo` com 4 itens; com a rota de tiles bloqueada (`page.route('**/tiles.openfreemap.org/**', r=>r.abort())`, estilo `escuro`) o banner aparece e as bolhas também.
- [ ] **Step 2:** FAIL. **Step 3:** implementar; `principal.ts` lê `?estilo=teste`. **Step 4:** PASS. **Step 5: Commit** `feat: mapa com bolhas, voo e seleção`

### Task 9: Painéis — filtros, busca, ficha, exterior

**Files:**
- Create: `src/ui/filtros.ts`, `src/ui/caixaBusca.ts`, `src/ui/ficha.ts`, `src/ui/exterior.ts`, `src/estilos/vidro.css`
- Modify: `src/paginas/principal.ts`
- Test: `tests/unit/ficha.test.ts`, `tests/unit/filtros.test.ts`, `tests/e2e/paineis.spec.ts`

**Interfaces:**
- Consumes: `MapaApi`, `buscar`, `cadeia`, `descendentes`, `CATEGORIAS`.
- Produces: `criarFiltros(el, us, aoMudar: (cats: Set<CategoriaId>) => void): { mostrarSubordinados(id: string): void; limpar(): void }`; `criarCaixaBusca(el, us, aoEscolher: (r: Resultado) => void): void`; `renderizarFicha(u: Unidade, porId: Map<string,Unidade>, modo: 'painel'|'pagina'): HTMLElement`; `criarExterior(el, us, aoEscolher:(id)=>void): void`.
- Filtros (spec 5.4): uma caixinha por categoria com `noMapa`, rótulo + contagem só de unidades no mapa (`Destacamentos (DTCEA) (75)`), botões `Todos` e `Nenhum`; "Mostrar subordinados no mapa" (vem da ficha) troca para modo hierarquia com chip `Subordinados a CINDACTA II ✕`.
- Busca (spec 5.5): sugestões a cada tecla (debounce 80 ms), até 8, navegação por ↑/↓/Enter/Esc, mostra sigla em destaque + nome + motivo ("esquadrão sediado", "cidade"…); escolher → `voarPara(alvo.id)` e abrir ficha do alvo.
- Ficha (spec 5.6): ordem — brasão (se houver), foto com crédito, tag `categoria · sigla`, nome, caminho de subordinação clicável (`›`), cidade/UF, selos `a conferir`/`posição aproximada` quando aplicável, histórico, esquadrões sediados (de `filhos`), aeronaves, botões `Site oficial ↗` (se `site`), `Abrir em nova aba` (`om.html?id=`, `target="_blank"`), `Mostrar subordinados no mapa`, `Ver no organograma`, rodapé `Revisado em DD/MM/AAAA`. Linhas sem dado **não** aparecem (sem rótulos vazios). Ficha no celular (< 720 px) sobe de baixo.
- Exterior: botão `FAB no exterior (N)` abre lista com sigla, nome, cidade/país e site.

- [ ] **Step 1: Testes unitários falhando** (`ficha.test.ts`, jsdom): ficha básica não tem histórico/aeronaves/imagem; completa tem; `situacao.localizacao==='a-conferir'` mostra selo; caminho tem um link por elo na ordem da `cadeia`; unidade sem `site` não tem botão site; sem campos vazios (nenhum `dd` vazio); link nova aba = `om.html?id=<id>` com `target=_blank`. `filtros.test.ts`: contagem exclui esquadrões e exterior; `Nenhum` emite conjunto vazio.
- [ ] **Step 2:** FAIL. **Step 3:** implementar + estilo vidro (blur 14px, borda translúcida, como o painel C). **Step 4:** PASS.
- [ ] **Step 5: e2e** `paineis.spec.ts` (estilo teste): digitar `gw` mostra `DTCEA-GW` e Enter abre a ficha; desmarcar todas e marcar só DTCEA deixa só ícones dessa categoria (via `map.queryRenderedFeatures` exposto em `window.__mapa` só quando `?estilo=teste`); clicar elo `COMAER` no caminho abre a ficha do COMAER. Rodar → PASS.
- [ ] **Step 6: Commit** `feat: filtros, busca, ficha e lista do exterior`

### Task 10: Página da unidade (nova aba)

**Files:**
- Modify: `src/paginas/unidade.ts`, `om.html`
- Test: `tests/e2e/unidade.spec.ts`

**Interfaces:**
- Consumes: `renderizarFicha(u, porId, 'pagina')`, `criarMapa` (mapa pequeno, não interativo além de zoom, centrado na unidade; esquadrão → sede; exterior → sem mapa).
- `document.title` = `<sigla> · Mapa das OM da FAB`. Link `← Voltar ao mapa` para `./#<id>`; `principal.ts` lê `location.hash` e abre a unidade ao carregar.

- [ ] **Step 1: e2e falhando**: `om.html?id=baan` mostra nome da BAAN e título certo; `om.html?id=inexistente` e `om.html` sem id mostram `Unidade não encontrada` e link para o mapa, sem erro no console (Review Focus 5); link voltar abre o mapa com a ficha da BAAN.
- [ ] **Step 2–4:** FAIL → implementar → PASS. **Step 5: Commit** `feat: página própria por unidade`

### Task 11: Organograma

**Files:**
- Create: `src/ui/organograma.ts`, `src/estilos/organograma.css`
- Modify: `src/paginas/principal.ts`
- Test: `tests/unit/organograma.test.ts`, `tests/e2e/organograma.spec.ts`

**Interfaces:**
- Consumes: `arvore`, `cadeia`, `MapaApi.voarPara`.
- Produces: `criarOrganograma(el, us, aoEscolher: (id: string) => void): { destacar(id: string): void }`.
- Alternância `[ Mapa | Organograma ]` no topo (botões com `aria-pressed`). Árvore com linhas de conexão, nós como cartões de vidro (sigla + nome curto + contagem de subordinados), abrir/recolher por nó, começa com COMAER e o primeiro nível aberto (topo do organograma oficial: COMANDO/órgãos de assessoramento, SEFA, COMPREP, DCTA, DECEA, COMGAP, COMAE, COMGEP). Esquadrões aparecem sob a sede com estilo distinto. `destacar(id)` abre a cadeia até o nó, rola até ele e o realça. Clique no nó → volta ao mapa e `voarPara`. Unidades com `subordinacao:'a-conferir'` ficam num grupo `Subordinação a conferir` no fim.

- [ ] **Step 1: Testes falhando**: unit — raiz renderizada é COMAER; `destacar('dtcea-gw')` deixa todos os ancestrais expandidos e o nó com classe `destaque`; grupo "a conferir" existe quando há unidade sem subordinação. e2e — botão `Ver no organograma` da ficha mostra a tela de organograma com o nó destacado; clicar no nó volta ao mapa.
- [ ] **Step 2–4:** FAIL → implementar → PASS. **Step 5: Commit** `feat: organograma interativo`

### Task 12: Tema, movimento e desempenho

**Files:**
- Create: `src/ui/tema.ts`, `src/mapa/aviao.ts`, `src/ui/desempenho.ts`
- Modify: `src/paginas/principal.ts`, `src/estilos/*.css`
- Test: `tests/unit/tema.test.ts`, `tests/e2e/tema.spec.ts`

**Interfaces:**
- Produces: `iniciarTema(aoMudar:(t)=>void): { alternar(): void; atual(): 'escuro'|'claro' }` (padrão escuro; lembra escolha com try/catch); `animarAviao(de:[number,number], para:[number,number], duracaoMs:number): void` (SVG de aviãozinho sobre o mapa, trajeto em arco, some ao chegar; não roda com reduced-motion); `monitorarDesempenho(aoBaixar: () => void): void` (média de FPS < 40 por 3 s → chama uma vez).
- Inclinação 3D "holograma" na abertura: começa pitch 45 e assenta em 30 durante a intro (~1.5 s) com o aviãozinho cruzando a tela; `voarPara` dispara `animarAviao` do centro atual até o destino. `aoBaixar` adiciona `html.fx-leve`: remove `backdrop-filter`, brilhos e o efeito de pulsar. Escala de fonte: base 16 px, 18 px quando `min-width: 1600px` (TV), títulos de ficha 1.35 rem.

- [ ] **Step 1: Testes falhando**: unit — sem armazenamento disponível (getItem lança) o tema é escuro e `alternar` funciona; e2e — botão de tema troca `data-tema` e as cores do estilo do mapa (`map.getStyle()` mudou o fundo); com `reducedMotion: 'reduce'` não existe `.aviao` no DOM após `voarPara`.
- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Medição** — script Playwright `tests/e2e/desempenho.spec.ts` com CDP `Emulation.setCPUThrottlingRate {rate:4}` (aproximação do Galaxy Book2), viewport 1920×1080, mede FPS por `requestAnimationFrame` durante 3 `voarPara` seguidos com estilo escuro real; esperado média ≥ 45 FPS ou `fx-leve` ativado. Registrar o número no commit.
- [ ] **Step 6: Commit** `feat: temas, aviãozinho e modo de efeitos leves`

### Task 13: Dados — subordinação e coordenadas exatas

Tarefa de dados (pesquisa). Usar Firecrawl (`firecrawl_scrape`) para fab.mil.br e decea.mil.br — o `curl` direto a fab.mil.br é bloqueado neste ambiente.

**Files:**
- Modify: `data/unidades.json`

- [ ] **Step 1: Subordinação** — transcrever os organogramas oficiais (https://www.fab.mil.br/a-forca-aerea/institucional/organograma/ — imagens por órgão; se não for possível obtê-las, pedir ao autor que salve as imagens e envie) e completar com regimentos internos e páginas de cada órgão (ex.: página do CINDACTA I lista seus DTCEAs). Preencher `subordinadaA`, `situacao.subordinacao:'confirmado'` e `fontes`. Sem fonte → fica `a-conferir`.
- [ ] **Step 2: Coordenadas exatas** — para cada unidade no Brasil, posição da instalação (aeródromo pelo indicador ICAO/AIP público, OpenStreetMap, páginas oficiais). Sítios isolados também, se a coordenada for pública. Marcar `coordSituacao:'exata'` e `situacao.localizacao:'confirmado'`.
- [ ] **Step 3:** `npm run validar` → PASS; imprimir quantas seguem `a-conferir` em cada campo.
- [ ] **Step 4: Commit** `data: subordinação e posições confirmadas`

### Task 14: Dados — fichas completas da etapa 1

**Files:**
- Modify: `data/unidades.json`; Create: `public/img/om/*`

- [ ] **Step 1:** Pedir ao autor a lista de 20–30 unidades prioritárias (o executor pergunta ao usuário; não inventar a lista).
- [ ] **Step 2:** Para cada uma: histórico resumido (3–5 frases, linguagem de aula), esquadrões sediados (registros `esquadrao` com `sediadoEm`), aeronaves operadas atualmente, `site` oficial, fontes. `ficha:'completa'`.
- [ ] **Step 3: Imagens** — verificar o Manual da Marca / Símbolos (fab.mil.br/downloads) e Wikimedia Commons; só baixar com licença explícita; preencher `brasao`/`foto` com `credito`, `licenca`, `origem`. Registrar em `docs/fontes/imagens.md` a regra de uso encontrada.
- [ ] **Step 4:** `npm run validar` → PASS. **Step 5: Commit** `data: fichas completas da etapa 1`

### Task 15: Uso offline e publicação

**Files:**
- Modify: `vite.config.ts`; Create: `.github/workflows/deploy.yml`, `README.md`
- Test: `tests/e2e/offline.spec.ts`

**Interfaces:**
- vite-plugin-pwa (`registerType:'autoUpdate'`): pré-cache do app, `data/` e `public/geo/`; cache em tempo de execução `CacheFirst` para `tiles.openfreemap.org` (máx. 4000 entradas, 30 dias) e `StaleWhileRevalidate` para imagens.
- `deploy.yml`: em push na `main` → `npm ci`, `npm test`, `npm run build`, publica `dist/` no GitHub Pages (`actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`).
- `README.md`: como rodar, como atualizar uma unidade (editar `data/unidades.json` + `npm run validar`), regras de dados (Global Constraints).

- [ ] **Step 1: e2e falhando** (build + `vite preview`): após primeira visita, `context.setOffline(true)` e recarregar → mapa carrega com UFs e bolhas, ficha da BAAN abre.
- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit** `feat: uso offline e publicação no GitHub Pages`
- [ ] **Step 6:** Avisar o autor que precisa ativar GitHub Pages (Settings → Pages → Source: GitHub Actions) e que a publicação acontece quando o trabalho for mesclado na `main`.
