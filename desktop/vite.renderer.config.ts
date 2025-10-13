import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    root: path.resolve(__dirname, 'src/renderer'),
    base: './',
    plugins: [react()],
    define: {
      'process.env': {
        VITE_BACKEND_URL: env.VITE_BACKEND_URL || '',
        VITE_APP_ELECTRON_TOKEN: env.VITE_APP_ELECTRON_TOKEN || ''
      }
    },
    build: {
      outDir: path.resolve(__dirname, 'dist/renderer'),
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@/renderer': path.resolve(__dirname, 'src/renderer'),
        '@/shared': path.resolve(__dirname, 'src/shared')
      }
    },
  };
});

