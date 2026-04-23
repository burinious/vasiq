import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('firebase')) {
            return 'firebase-vendor';
          }

          if (id.includes('react-router') || id.includes('@remix-run/router')) {
            return 'router-vendor';
          }

          if (id.includes('react') || id.includes('scheduler')) {
            return 'react-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
  resolve: {
    alias: {
      'react-router-dom': path.resolve(
        __dirname,
        'node_modules/react-router-dom/dist/main.js',
      ),
    },
  },
});
