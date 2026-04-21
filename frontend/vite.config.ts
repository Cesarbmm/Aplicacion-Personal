import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const frontendRoot = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    strictPort: true,
    host: process.env.TAURI_DEV_HOST || '127.0.0.1',
    port: 5180,
    fs: {
      allow: [frontendRoot, projectRoot],
    },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
})
