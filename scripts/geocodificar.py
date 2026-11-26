"""
Procura a posição real (OpenStreetMap/Nominatim) das unidades com posição aproximada.
Uso: python3 -I scripts/geocodificar.py <extracao.json> <saida.json>
Respeita o limite do Nominatim (1 consulta/s). Grava candidatos para revisão; não altera os dados.
"""
import json, re, sys, time, unicodedata, urllib.parse, urllib.request

AGENTE = 'mapa-om-fab-didatico/1.0 (material didatico)'
def norm(s):
    s = unicodedata.normalize('NFD', s or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()

def consultar(**p):
    p.update(format='jsonv2', countrycodes='br', addressdetails=1, limit=5, namedetails=1)
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(p)
    req = urllib.request.Request(url, headers={'User-Agent': AGENTE})
    time.sleep(1.1)
    try:
        return json.load(urllib.request.urlopen(req, timeout=30))
    except Exception as e:
        print('erro', e, file=sys.stderr)
        return []

PARADAS = {'de', 'da', 'do', 'dos', 'das', 'e', 'a', 'o'}
def tokens(s): return {t for t in norm(s).split() if t not in PARADAS and len(t) > 1}

def cidade_ok(r, cidade):
    a = r.get('address', {})
    alvo = norm(cidade)
    return any(norm(a.get(k, '')) == alvo for k in ('city', 'town', 'municipality', 'village', 'city_district', 'suburb'))

def limpar_endereco(e):
    e = re.split(r'\s+-\s+(?:Bloco|Pr[eé]dio|Ed|Edif|Sala|Andar|\d+º)', e or '')[0]
    return re.sub(r'\bs/?n[º°o]?\b', '', e, flags=re.I).strip(' ,-')

def main(extracao, saida):
    unidades = json.load(open('data/unidades.json'))
    brutos = {r['sigla'].strip().upper(): r for r in json.load(open(extracao))}
    alvos = [u for u in unidades if u['pais'] == 'Brasil' and u['categoria'] != 'esquadrao' and u['coordSituacao'] == 'aproximada']
    res = {}
    for u in alvos:
        cidade, uf = u['cidade'], u['uf']
        achado = None
        for r in consultar(q=f"{u['nome']}, {cidade}, {uf}"):
            nome_r = r.get('name') or r.get('display_name', '').split(',')[0]
            comum = tokens(u['nome']) & tokens(nome_r)
            if cidade_ok(r, cidade) and (len(comum) >= max(2, len(tokens(u['nome'])) // 2) or norm(u['sigla']) in norm(nome_r)):
                achado = dict(coord=[round(float(r['lon']), 5), round(float(r['lat']), 5)], por='nome', osm=nome_r, tipo=f"{r['category']}/{r['type']}")
                break
        if not achado:
            b = brutos.get(u['sigla'].upper()) or {}
            rua = limpar_endereco(b.get('addr'))
            if rua and re.search(r'[A-Za-z]{3}', rua):
                for r in consultar(street=rua, city=cidade, state=uf):
                    if cidade_ok(r, cidade) and r.get('addresstype') not in ('city', 'town', 'municipality', 'state', 'county', 'village'):
                        achado = dict(coord=[round(float(r['lon']), 5), round(float(r['lat']), 5)], por='endereço', osm=r.get('display_name', '')[:90], tipo=r.get('addresstype'), consulta=rua)
                        break
        res[u['id']] = achado
        print(u['sigla'], '→', achado and (achado['por'], achado['osm'][:60]), flush=True)
    json.dump(res, open(saida, 'w'), ensure_ascii=False, indent=1)

main(*sys.argv[1:])
