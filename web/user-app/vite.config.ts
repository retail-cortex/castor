import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const workspaceDir = process.env.BUILD_WORKSPACE_DIRECTORY
  ? path.resolve(process.env.BUILD_WORKSPACE_DIRECTORY, 'web/user-app')
  : __dirname;

// https://vite.dev/config/
export default defineConfig({
  root: workspaceDir,
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(workspaceDir, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      allow: [workspaceDir, path.resolve(workspaceDir, '..'), process.cwd()],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/mcp': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
