# Mapa das OM da FAB

Mapa interativo e didático das Organizações Militares da Força Aérea Brasileira, para uso em aula na
EEAR e para estudo dos alunos. **Material didático, não oficial.**

- Mapa 3D com zoom e arraste (como o Google Maps), divisas estaduais e as 5 regiões.
- Todas as OMs do catálogo do COMAER no Brasil, com ícone por tipo e bolhas que agrupam unidades próximas.
- Filtros por tipo, busca por sigla/nome/esquadrão/cidade/aeronave, ficha da unidade, página própria por unidade.
- Organograma interativo e "mostrar subordinados no mapa".
- Modo escuro e claro; funciona sem internet depois da primeira visita.

## Rodar no computador

```bash
npm install
npm run dev
```

Abra o endereço que aparecer (termina em `/Abraham/`).

## Testes

```bash
npm test          # testes de unidade (inclui a validação dos dados)
npm run e2e       # testes no navegador
```

## Atualizar uma unidade

1. Edite a unidade em `data/unidades.json`.
2. Atualize `fontes` (de onde veio a informação) e `revisadoEm` (AAAA-MM-DD).
3. Rode `npm run validar`. A validação recusa dados inconsistentes e também telefones, e-mails e links `intraer`.

### Regras dos dados

- Só informação pública. Nada sobre a atuação de especialidades em cada unidade.
- O que não foi confirmado fica `a-conferir` e aparece assim no site, nunca como certo.
- Posição: `exata` só quando confirmada (ex.: aeródromo da unidade); senão, sede do município como `aproximada`.
- Esquadrões e grupos têm `sediadoEm` (a base onde ficam) e não aparecem como ícone próprio.
- Imagens (brasão, foto) só com licença verificada e crédito.

## Scripts de dados

- `scripts/importar-catalogo.ts` — importação única do catálogo do COMAER (o PDF não fica no repositório).
- `scripts/coords-municipios.mjs` — posição aproximada pela sede do município.
- `scripts/aplicar-pesquisa.mjs` — subordinação e posições confirmadas, com as fontes.
- `scripts/baixar-geo.mjs` — divisas das UFs e regiões.

## Publicação

Cada envio para a branch `main` publica o site no GitHub Pages
(Settings → Pages → Source: **GitHub Actions**).
