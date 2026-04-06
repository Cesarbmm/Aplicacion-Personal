import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    strictPort: true,
    host: process.env.TAURI_DEV_HOST || '127.0.0.1',
    port: 5173,
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
})
