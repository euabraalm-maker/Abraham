# Mapa das Organizações Militares da FAB — Design

Data: 2026-11-26 · Status: rascunho para aprovação

## 1. Intenção e porquê

O autor é militar da Especialidade de Comunicações (BCO) e instrutor na Escola de Especialistas de Aeronáutica (EEAR), em Guaratinguetá/SP. Os alunos estudam 2 anos, formam-se Sargentos e são classificados em OMs por todo o Brasil — e chegam lá sem noção de como a FAB está organizada: o que é uma Base Aérea, um DTCEA, um GAP, quem é subordinado a quem, onde cada coisa fica.

O produto é um **mapa interativo do Brasil com todas as OMs da FAB**, bonito, moderno, com cara de "holograma", usado pelo instrutor **em aula** (notebook espelhado numa TV de 65" ou num projetor) e pelos **alunos por conta própria** (celular, casa). O instrutor navega livremente, abre uma unidade, mostra a ficha e explica oralmente o que a sua especialidade faz ali.

Embora nasça para o BCO, a EEAR forma muitas especialidades (enfermagem, obras, eletricidade, administração…). O site **não pode ser voltado a uma especialidade**: mostra OMs e informação pública; a leitura de cada especialidade fica com quem está dando a aula.

Sucesso, para o autor: abrir o mapa em aula e navegar "como no Google Maps", suave, sem travar; os alunos saírem entendendo onde ficam as unidades, que tipos existem e como se encadeiam na hierarquia.

## 2. Objetivos, não-objetivos, anti-objetivos

**Objetivos (v1)**
- Mapa real do Brasil, navegável como o Google Maps: arrastar, zoom pela rodinha (centrado no cursor), pinça no celular, duplo clique, botões +/−; inclinar/girar em 3D e botão para voltar à vista de cima.
- Todas as OMs da FAB **no território nacional** (~290) como ícones por tipo.
- Filtros por tipo (liga/desliga), busca com sugestões, ficha da unidade, página própria por unidade (abrir em nova aba), cadeia de subordinação e tela de organograma.
- Funcionar bem em TV 65", projetor e celular. Modo escuro e modo claro.

**Não-objetivos (v1)**
- Conteúdo sobre o que qualquer especialidade (incl. BCO) faz em cada unidade — isso é dito em aula.
- Atualização automática a partir dos sites da FAB (decidido: atualização manual, poucas vezes por ano, a pedido do autor).
- Área de login/edição, banco de dados.
- Divisas municipais (só nomes de cidades).
- OMs no exterior no mapa (vão numa lista à parte).

**Anti-objetivos (falharia mesmo "funcionando")**
- Informação não pública, sensível, ou que sugira detalhes operacionais internos. Só o que a FAB publica.
- Parecer site oficial da FAB. É material didático pessoal — aviso discreto e permanente "Material didático, não oficial".
- Dados chutados apresentados como certos. O que não foi confirmado aparece marcado "a conferir".
- Travar, engasgar ou "pular" de zoom durante a aula. Animações exageradas que distraiam.
- Imagens usadas sem permissão de uso.

## 3. Restrições

- **Site pessoal**, publicado na internet, custo zero ou próximo de zero, sem chaves/senhas a manter se possível. Pode virar institucional no futuro — não precisa estar pronto para isso, mas não deve impedir (ex.: dados separados do código).
- **Rede da escola é boa**; ainda assim, depois de aberto uma vez, o site deve continuar funcionando com rede instável (cache no navegador do que já foi carregado). Isso não pode degradar animações.
- **Público e legibilidade:** letras legíveis do fundo da sala numa TV de 65", sem exagero. Deve funcionar em celular (alunos).
- **Idioma:** português do Brasil.
- **Imagens (brasões/fotos):** só com uso permitido verificado — material que a FAB libera explicitamente (ver *Manual da Marca* e área *Símbolos* em fab.mil.br/downloads) ou Wikimedia Commons com licença explícita; sempre com crédito. Sem confirmação → sem imagem, só link para a página oficial.

## 4. Abordagens consideradas

Em todas, a parte visual (mapa vetorial real, 3D, bolhas, busca, ficha) é a mesma; muda onde moram os dados e quem os edita.

1. **Site estático com dados em arquivo** — fichas num arquivo de dados versionado no repositório; site publicado gratuitamente. Mais rápido, mais leve, quase nada quebra; para editar, o autor pede ao Claude ou edita o arquivo.
2. **Site estático lendo de uma planilha Google** — o autor edita sozinho; dependência externa e risco de um erro de digitação quebrar fichas.
3. **Sistema com banco e painel de login** — só faria sentido se virasse institucional, com vários editores. Exagero agora.

**Escolhida: 1.** Motivo do autor: as unidades mudam poucas vezes por ano; quando algo estiver desatualizado, ele pede ao Claude para pesquisar e atualizar. Migrar para 2 depois não exige refazer o visual.

## 5. O que foi decidido

### 5.1 Visual — direção "Holográfico" (opção C do protótipo)
Protótipo de referência: https://claude.ai/artifact/AhT3iYVjDqZ44CoQL9zU8z (painel C). Mapa escuro azulado, levemente inclinado em 3D como holograma sobre a mesa; ícones com brilho suave; ficha num painel de vidro fosco (blur); botões arredondados translúcidos.
- **Modo escuro (padrão) e modo claro**, com botão para alternar. O claro é uma variante clara da mesma direção (não a "Carta Aeronáutica"), pensada para projetor em sala iluminada.
- **Tipografia** legível à distância, sem exagero.
- **Animações** suaves e discretas no geral. Liberdade criativa em momentos pontuais — ex.: um aviãozinho cruzando a tela na abertura, ou fazendo o trajeto quando o mapa "voa" até uma unidade. Respeitar `prefers-reduced-motion`.
- Aviso discreto e permanente: "Material didático, não oficial".

### 5.2 Mapa e camadas geográficas
Detalhe progressivo conforme o zoom, como o Google, mas no estilo holográfico próprio:
- **Brasil inteiro:** contorno do país, **divisas estaduais**, as **5 regiões** em tons levemente diferentes.
- **Estado:** capitais e principais cidades, rios e rodovias principais.
- **Perto de uma base:** bairros, ruas, desenho do aeródromo e pista.
- **Sem divisas municipais** (decidido com o autor: poluiria o mapa).

### 5.3 Unidades no mapa
- **Escopo:** todas as OMs da FAB no Brasil (~290), a partir de `docs/fontes/indice-catalogo-comaer.md`. Incluir hospitais, prefeituras, odontoclínicas, diretorias, institutos etc. (decidido: a EEAR forma especialidades que trabalham nesses lugares).
- **Ícone:** um formato + cor por tipo de unidade, com legenda.
- **Posição:** sobre a própria base/aeródromo/instalação, não no centro da cidade.
- **Esquadrões e grupos sediados** (1º GDA, 2º/6º GAV, esquadrões do GCC etc., ~50 no catálogo) **não têm ícone próprio**: aparecem na ficha da unidade onde estão sediados, e a **busca os encontra** (buscar "Pampa" voa para Canoas e abre a ficha da BACO). *Decisão do Claude:* no modelo de dados, são registros próprios com vínculo "sediado em"; têm página própria (endereço compartilhável), nó próprio no organograma e entram no "tudo subordinado a X"; não entram nas contagens de ícones dos filtros. A nota do índice sugerindo ícone próprio para o 1º GDA não vale — prevalece a decisão do autor. Sede não confirmada → "a conferir". Com isso, são ~250 ícones no mapa + ~50 esquadrões/grupos.
- **Bolhas com número** agrupam unidades próximas quando afastado; clicar na bolha voa até lá e as separa.
- **Exterior** (adidâncias, CABW, CABE, MTAB…): lista à parte "FAB no exterior", fora do mapa do Brasil.

### 5.4 Filtros
Painel com caixinhas por tipo (Bases Aéreas, CINDACTAs, DTCEAs, Hospitais, GAPs, Prefeituras, Escolas…), cada uma com a contagem ("DTCEA (75)"), botões "Todos" e "Nenhum". Marcar/desmarcar anima a entrada/saída dos ícones. Também: **"mostrar no mapa tudo que é subordinado a X"** (ex.: acende toda a área do CINDACTA II).

### 5.5 Busca
Campo no topo com sugestões enquanto digita. Encontra por **sigla, parte da sigla, nome ou parte do nome**, sem exigir acento nem maiúsculas, e também por esquadrão sediado, cidade e aeronave (ex.: "F-39"). Escolher um resultado faz o mapa voar até a unidade e abrir a ficha.

### 5.6 Ficha da unidade (pop-up)
Clique num ícone → o mapa voa até a unidade (zoom + inclinação suaves) e a ficha de vidro abre ao lado; no celular, sobe de baixo.
- **Ficha completa** (Bases, DECEA, Escolas, Comandos, GAPs, Parques — ~150): brasão (se permitido), foto com crédito, nome, sigla, tipo, cidade/UF, **cadeia de subordinação**, histórico resumido, esquadrões sediados, aeronaves que operam lá, link "Site oficial", botão "Abrir em nova aba", data da última revisão.
- **Ficha básica** (demais): nome, sigla, tipo, cidade/UF, subordinação, site oficial, data de revisão. Ganham conteúdo completo aos poucos, a pedido do autor.
- **Cadeia de subordinação** como caminho clicável: `COMAER › DECEA › CINDACTA I › DTCEA-AN`; cada elo abre a ficha daquela OM.
- Nenhum campo sobre atuação de especialidades.

### 5.7 Página própria (abrir em nova aba)
Cada unidade tem endereço próprio, compartilhável (o instrutor pode mandar o link aos alunos). A página mostra a mesma ficha em tela cheia, com um mapa pequeno da localização.

### 5.8 Organograma
Segunda tela, alternada com o mapa por `[ Mapa | Organograma ]`. Árvore expansível a partir do COMAER. Topo conforme o organograma oficial (https://www.fab.mil.br/a-forca-aerea/institucional/organograma/, Decreto nº 11.237/2022, atualizado pelo EMAER em nov/2026): COMANDO, SEFA, COMPREP, DCTA, DECEA, COMGAP, COMAE, COMGEP. Clicar numa caixa → volta ao mapa e voa até a unidade. Da ficha, é possível abrir o organograma já destacando a unidade.

### 5.9 Dados e fontes
- Lista base: `docs/fontes/indice-catalogo-comaer.md` (índice do catálogo do COMAER fornecido pelo autor, ~300 siglas). Problemas conhecidos que precisam ser tratados: nomes truncados na extração (ex.: DECEA como "DEPARTAMENTO AÉREO", vários "CENTRO AERONÁUTICA"), 12 localidades "a conferir", possíveis duplicatas (DESTAE-FN/DTCEA-FN, DESTAE-MQ/DTCEA-MQ), CRCEA-SE ausente do índice, e as observações "BCO" do arquivo **não** entram no site.
- Subordinação: organograma oficial (imagens, a transcrever) + regimentos internos e páginas do DECEA/órgãos.
- Fichas completas: páginas oficiais (fab.mil.br, decea.mil.br) e fontes públicas confiáveis.
- *Decisão do Claude:* escopo v1 = índice do PDF; quando a edição online de 2026 (322 OMs) estiver acessível, reconciliar e acrescentar as que faltam (CRCEA-SE incluído).
- *Decisão do Claude:* "confirmado" = ao menos uma fonte oficial (fab.mil.br, decea.mil.br, regimento interno, catálogo do COMAER) que sustente o dado.
- Cada unidade registra fonte(s), situação (confirmado / a conferir) e data de revisão. O que não foi confirmado fica marcado "a conferir" e é exibido assim — nunca chutado.

### 5.10 Manutenção
Atualizações manuais, poucas vezes ao ano: o autor aponta a unidade desatualizada, o Claude pesquisa e edita o arquivo de dados. Os dados ficam separados do código e em formato legível por humanos.

## 6. Decisões do Claude (o autor pode corrigir)
- **Tecnologia:** site estático; mapa vetorial renderizado pela placa de vídeo (MapLibre GL JS ou equivalente) com estilo próprio "holográfico"; base cartográfica vetorial gratuita (ex.: OpenFreeMap / OpenStreetMap), sem chave obrigatória; hospedagem gratuita (GitHub Pages ou Vercel); dados em arquivo(s) JSON no repositório.
- Cache offline do que já foi visitado (site, fichas, áreas de mapa vistas).
- Ícones distintos por tipo, com forma + cor (não só cor) por acessibilidade.
- Escala de fonte pensada para 65" a ~5 m, testada também no celular.
- Fluidez verificada no cenário real: notebook comum espelhado em TV.

## 7. Deixado para o construtor
- Framework/ferramentas de build, estrutura do código, formato exato do JSON, roteamento das páginas por unidade.
- Provedor exato dos tiles e desenho do estilo do mapa dentro da direção 5.1.
- Agrupamento exato dos ~40 tipos do catálogo em categorias de filtro e ícones (ex.: juntar "Prefeitura", "Odontoclínica" etc. de forma sensata).
- Ordem de levantamento do conteúdo (sugestão: posição e subordinação de todas → fichas completas dos ~150 prioritários).
- Coreografia exata das animações de destaque.
