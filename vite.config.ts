import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = dirname(fileURLToPath(import.meta.url));
// GitHub Pages publica em /Abraham/; na Vercel (VERCEL=1 no build) o site fica na raiz.
const base = process.env.VERCEL ? '/' : '/Abraham/';

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      input: {
        principal: resolve(raiz, 'index.html'),
        unidade: resolve(raiz, 'om.html'),
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Mapa das OM da FAB',
        short_name: 'Mapa OM FAB',
        description: 'Mapa didático das Organizações Militares da Força Aérea Brasileira (não oficial).',
        lang: 'pt-BR',
        theme_color: '#070b22',
        background_color: '#070b22',
        display: 'standalone',
        icons: [],
      },
      workbox: {
        // app, dados das unidades (no código), divisas e regiões
        globPatterns: ['**/*.{js,css,html,json,woff,woff2,svg,png,webp}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallbackDenylist: [new RegExp(`^${base}om\\.html`)],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === 'tiles.openfreemap.org',
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapa-base',
              expiration: { maxEntries: 4000, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'imagens', expiration: { maxEntries: 300 } },
          },
        ],
      },
    }),
  ],
});
