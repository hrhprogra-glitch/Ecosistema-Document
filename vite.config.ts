// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- 1. IMPORTANTE: El plugin de la v4
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <-- 2. IMPORTANTE: Ejecutar el plugin
    nodePolyfills(), // Necesario para leer archivos .doc antiguos (word-extractor usa APIs de Node)
  ],
})