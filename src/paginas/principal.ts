import '../estilos/fontes';
import '../estilos/mapa.css';
import { carregar } from '../dados/carregar';
import { criarMapa } from '../mapa/mapa';
import type { Tema } from '../mapa/estilo';

const params = new URLSearchParams(location.search);
const estilo = params.get('estilo');
const tema: Tema = estilo === 'teste' ? 'teste' : estilo === 'claro' ? 'claro' : 'escuro';
const { lista } = carregar();

const palco = document.getElementById('palco')!;
const elMapa = document.createElement('div');
elMapa.id = 'mapa';
palco.appendChild(elMapa);

const mapa = criarMapa(elMapa, lista, { tema });

// Painéis provisórios (substituídos pela ficha e pela lista reais)
const ficha = document.createElement('div');
ficha.id = 'ficha';
const grupo = document.createElement('ul');
grupo.id = 'lista-grupo';
palco.append(ficha, grupo);
mapa.aoSelecionar((id) => ficha.setAttribute('data-id', id));
mapa.aoSelecionarGrupo((ids) => {
  grupo.replaceChildren(...ids.map((id) => Object.assign(document.createElement('li'), { textContent: id })));
});

if (tema === 'teste' || params.has('depurar')) (window as unknown as { __mapa: unknown }).__mapa = mapa;
