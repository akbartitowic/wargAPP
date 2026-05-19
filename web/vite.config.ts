import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Capacitor butuh path relatif di bundle produksi; di dev pakai "/" agar HMR & modul Vite stabil (hindari layar putih).
  base: command === 'build' ? './' : '/',
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      /* SW hanya saat build; di dev tidak register (hindari cache / layar putih di preview) */
      devOptions: { enabled: false },
      injectRegister: command === 'build' ? 'auto' : false,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Warga App',
        short_name: 'Warga',
        description: 'Info warga, UMKM, berita, dan tagihan.',
        theme_color: '#002366',
        background_color: '#F5EEDC',
        display: 'standalone',
        lang: 'id',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
}))
