import { CATEGORIAS, type Forma } from '../dados/categorias';
import type { CategoriaId } from '../dados/tipos';

type Ctx = CanvasRenderingContext2D;

/** Traça a forma num quadrado de -1..1 (já escalado). */
const FORMAS: Record<Forma, (c: Ctx) => void> = {
  aviao: (c) => {
    c.moveTo(0, -1); c.lineTo(0.18, -0.35); c.lineTo(0.95, 0.1); c.lineTo(0.95, 0.3); c.lineTo(0.18, 0.12);
    c.lineTo(0.14, 0.62); c.lineTo(0.42, 0.85); c.lineTo(0.42, 1); c.lineTo(0, 0.9); c.lineTo(-0.42, 1);
    c.lineTo(-0.42, 0.85); c.lineTo(-0.14, 0.62); c.lineTo(-0.18, 0.12); c.lineTo(-0.95, 0.3);
    c.lineTo(-0.95, 0.1); c.lineTo(-0.18, -0.35); c.closePath();
  },
  losango: (c) => { c.moveTo(0, -1); c.lineTo(0.85, 0); c.lineTo(0, 1); c.lineTo(-0.85, 0); c.closePath(); },
  quadrado: (c) => c.roundRect(-0.75, -0.75, 1.5, 1.5, 0.25),
  estrela: (c) => {
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.42 : 1;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
    }
    c.closePath();
  },
  circulo: (c) => c.arc(0, 0, 0.78, 0, Math.PI * 2),
  hexagono: (c) => {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 0.85, Math.sin(a) * 0.85);
    }
    c.closePath();
  },
  triangulo: (c) => { c.moveTo(0, -0.95); c.lineTo(0.9, 0.75); c.lineTo(-0.9, 0.75); c.closePath(); },
  cruz: (c) => {
    const a = 0.3, b = 0.85;
    c.moveTo(-a, -b); c.lineTo(a, -b); c.lineTo(a, -a); c.lineTo(b, -a); c.lineTo(b, a); c.lineTo(a, a);
    c.lineTo(a, b); c.lineTo(-a, b); c.lineTo(-a, a); c.lineTo(-b, a); c.lineTo(-b, -a); c.lineTo(-a, -a); c.closePath();
  },
  casa: (c) => {
    c.moveTo(0, -0.9); c.lineTo(0.85, -0.1); c.lineTo(0.62, -0.1); c.lineTo(0.62, 0.85);
    c.lineTo(-0.62, 0.85); c.lineTo(-0.62, -0.1); c.lineTo(-0.85, -0.1); c.closePath();
  },
  atomo: (c) => {
    c.arc(0, 0, 0.32, 0, Math.PI * 2);
    for (const rot of [0, Math.PI / 3, -Math.PI / 3]) {
      c.moveTo(Math.cos(rot) * 0.95, Math.sin(rot) * 0.95);
      c.ellipse(0, 0, 0.95, 0.3, rot, 0, Math.PI * 2);
    }
  },
  pilar: (c) => {
    c.moveTo(-0.9, -0.45); c.lineTo(0, -0.95); c.lineTo(0.9, -0.45); c.closePath();
    for (const x of [-0.6, -0.1, 0.4]) c.rect(x, -0.3, 0.2, 0.9);
    c.rect(-0.9, 0.7, 1.8, 0.2);
  },
};

/** Desenha o ícone colorido de uma categoria (com brilho no tema escuro). */
export function desenharIcone(cat: CategoriaId, tema: 'escuro' | 'claro', px: number): ImageData {
  const { forma, cor } = CATEGORIAS[cat];
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = px;
  const c = canvas.getContext('2d')!;
  const escala = px * 0.32;
  c.translate(px / 2, px / 2);
  c.scale(escala, escala);
  c.beginPath();
  FORMAS[forma](c);
  const corTema = cor[tema];
  if (tema === 'escuro') {
    c.shadowColor = corTema;
    c.shadowBlur = px * 0.18;
  }
  c.fillStyle = tema === 'escuro' ? corTema : '#ffffff';
  c.fill(forma === 'atomo' ? 'evenodd' : 'nonzero');
  c.shadowBlur = 0;
  c.lineWidth = (tema === 'escuro' ? 0.08 : 0.16);
  c.strokeStyle = tema === 'escuro' ? 'rgba(255,255,255,.75)' : corTema;
  c.stroke();
  return c.getImageData(0, 0, px, px);
}
