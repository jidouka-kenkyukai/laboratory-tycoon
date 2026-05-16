import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// GitHub Pages 用にビルド時 VITE_BASE_PATH 環境変数で base パスを指定する。
// 例: VITE_BASE_PATH=/lab-automation-tycoon/ npm run build
// dev サーバや通常ビルドでは '/' のまま。
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
