import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/Abraham/',
  build: {
    rollupOptions: {
      input: {
        principal: resolve(raiz, 'index.html'),
        unidade: resolve(raiz, 'om.html'),
      },
    },
  },
});
