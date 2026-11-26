import { registerSW } from 'virtual:pwa-register';

const INTERVALO_MS = 30 * 60 * 1000;

/**
 * Mantém o site sempre na versão publicada: procura atualização ao abrir, a cada 30 min e quando a
 * aba volta a ficar visível; ao encontrar, mostra um aviso rápido e recarrega sozinho.
 */
export function manterAtualizado() {
  if (!('serviceWorker' in navigator)) return;
  const jaControlado = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!jaControlado) return; // primeira visita: nada a avisar
    const aviso = document.createElement('div');
    aviso.className = 'aviso-atualizacao';
    aviso.setAttribute('role', 'status');
    aviso.textContent = 'Nova versão disponível — atualizando…';
    document.body.appendChild(aviso);
  });
  registerSW({
    immediate: true,
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      const verificar = () => reg.update().catch(() => {});
      setInterval(verificar, INTERVALO_MS);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') verificar(); });
    },
  });
}
