"""
Monta data/fontes/posicoes.json: posição real de cada unidade, com a fonte.
Entradas: resultado do geocodificar.py (OSM/Nominatim), extração do catálogo (endereços) e âncoras de complexos.
Uso: python3 -I scripts/curar-posicoes.py <geo.json> <extracao.json>
ATENÇÃO: rodar logo após importar-catalogo.ts e coords-municipios.mjs, ANTES de aplicar-pesquisa.mjs
(depois dele todas as posições já estão aplicadas e o arquivo sairia vazio). Na manutenção do dia a dia,
basta editar data/fontes/posicoes.json e rodar aplicar-pesquisa.mjs.
Regras: nome do lugar no OSM bate com a unidade → posição do lugar; endereço do catálogo num complexo
conhecido → posição do complexo; resultado só no nível da rua ou rodovia → descartado (fica aproximada).
"""
import json, re, sys

OSM = 'OpenStreetMap'
URL_OSM = 'https://www.openstreetmap.org/'
COMAER = [-47.87224, -15.79543]; LAGO_SUL = [-47.89598, -15.85714]; DCTA = [-45.86843, -23.2233]
II_COMAR = [-34.90954, -8.14716]; DECEA = [-43.16811, -22.90702]; MAL_CAMARA = None; CECAT = None
AER = {'SBAF': [-43.3847, -22.8751], 'SBMT': [-46.6378, -23.5091], 'SBMN': [-59.9863, -3.14604], 'SBCO': [-51.14441, -29.94593],
       'SBBE': [-48.47621, -1.37928], 'SBGL': [-43.25056, -22.81], 'SBSP': [-46.6546, -23.62766], 'SBGR': [-46.46995, -23.43127],
       'SBBI': [-49.232, -25.4051], 'SBBR': [-47.92083, -15.86917], 'SBLS': [-43.8974, -19.66175]}
REJEITAR_NOME = {'direns'}  # caiu numa diretoria de ensino a distância, não na DIRENS
MANUAL = {
    'vi-comar': (LAGO_SUL, 'Sexto Comando Aéreo Regional (OpenStreetMap)'),
    'crcea-se': (AER['SBSP'], 'Aeroporto de Congonhas, torre de controle (página do DECEA)'),
    'cindacta-iv': ([-60.05394, -3.02267], 'CINDACTA IV (OpenStreetMap)'),
    'dtcea-mdi': ([-49.47456, -28.12591], 'Cume do Morro da Igreja (OpenStreetMap)'),
    'cgtec': ([-43.21471, -22.87466], 'Dentro do PAME-RJ (informação do instrutor)'),
    'dirmab': ([-43.24005, -22.83261], 'DIRMAB (OpenStreetMap)'),
}

def main(geo_arq, ext_arq):
    geo = json.load(open(geo_arq))
    ext = {r['sigla'].strip().upper(): r for r in json.load(open(ext_arq))}
    us = {u['id']: u for u in json.load(open('data/unidades.json'))}
    mal_camara = geo.get('asocea') and geo['asocea']['coord']
    cecat = geo.get('cecat') and geo['cecat']['coord']
    ancoras = [
        (r'Esplanada dos Minist', r'Bras', COMAER, 'Esplanada dos Ministérios, Bloco M (Comando da Aeronáutica)'),
        (r'SHIS|Q\.?\s*I\.?\s*-?\s*0?5|VI COMAR', r'Bras', LAGO_SUL, 'Área Especial 12 do Lago Sul (complexo do VI COMAR)'),
        (r'Eduardo Gomes.*50|Campus do (D)?CTA', r'São José dos Campos', DCTA, 'Campus do DCTA'),
        (r'Fontenelle|Campo dos Afonsos|General Aranha', r'Rio de Janeiro', AER['SBAF'], 'Campo dos Afonsos'),
        (r'Olavo Fontoura|Br[aá]z Leme', r'São Paulo', AER['SBMT'], 'Campo de Marte'),
        (r'Armindo Moura', r'Recife', II_COMAR, 'Complexo do II COMAR (Boa Viagem)'),
        (r'Rodrigo Ot[aá]vio', r'Manaus', AER['SBMN'], 'Base Aérea de Manaus (Ponta Pelada)'),
        (r'Guilherme Schell', r'Canoas', AER['SBCO'], 'Base Aérea de Canoas'),
        (r'J[uú]lio C[eé]sar', r'Belém', AER['SBBE'], 'Base Aérea de Belém (Val de Cans)'),
        (r'Gale[aã]o|Alfredo Rocha|Biavati', r'Rio de Janeiro', AER['SBGL'], 'Ilha do Governador (complexo do Galeão)'),
        (r'General Justo', r'Rio de Janeiro', DECEA, 'Av. General Justo, 160 (DECEA)'),
        (r'Mal(\.|echal)?\s*C[aâ]mara', r'Rio de Janeiro', mal_camara, 'Av. Marechal Câmara, 233'),
        (r'Dom Pedro I', r'São Paulo', cecat, 'Av. Dom Pedro I, 100 (Cambuci)'),
        (r'Washington Lu[ií]s|Congonhas', r'São Paulo', AER['SBSP'], 'Aeroporto de Congonhas'),
        (r'Monteiro Lobato', r'Guarulhos|São Paulo', AER['SBGR'], 'Base Aérea de São Paulo (Cumbica)'),
        (r'Erasto Gaertner|Bacacheri', r'Curitiba', AER['SBBI'], 'Bacacheri'),
        (r'Aeroporto Internacional de Bras', r'Bras', AER['SBBR'], 'Área militar do Aeroporto de Brasília'),
        (r'Bairro CIAAR|Vila Asas', r'Lagoa Santa', AER['SBLS'], 'Lagoa Santa'),
    ]
    saida = {}
    for id_, u in us.items():
        if u['pais'] != 'Brasil' or u['categoria'] == 'esquadrao' or u['coordSituacao'] == 'exata':
            continue
        g = geo.get(id_)
        addr = (ext.get(u['sigla'].upper()) or {}).get('addr') or ''
        if id_ in MANUAL:
            c, f = MANUAL[id_]
            saida[id_] = {'coord': c, 'fonte': f}
        elif g and g['por'] == 'nome' and id_ not in REJEITAR_NOME:
            saida[id_] = {'coord': g['coord'], 'fonte': f"{g['osm']} ({OSM})"}
        else:
            for padrao, cidade, coord, nome in ancoras:
                if coord and re.search(padrao, addr, re.I) and re.search(cidade, u['cidade'], re.I):
                    saida[id_] = {'coord': coord, 'fonte': f'{nome} — endereço do catálogo'}
                    break
            else:
                if g and g['por'] == 'endereço' and g.get('tipo') in ('office', 'place', 'building', 'house', 'unclassified'):
                    saida[id_] = {'coord': g['coord'], 'fonte': f"{g['osm'][:60]} ({OSM})"}
    json.dump(dict(sorted(saida.items())), open('data/fontes/posicoes.json', 'w'), ensure_ascii=False, indent=1)
    faltam = [u['sigla'] for i, u in us.items() if u['pais'] == 'Brasil' and u['categoria'] != 'esquadrao' and u['coordSituacao'] != 'exata' and i not in saida]
    print('posições encontradas:', len(saida), '· seguem aproximadas:', len(faltam))
    print(', '.join(faltam))

main(*sys.argv[1:])
