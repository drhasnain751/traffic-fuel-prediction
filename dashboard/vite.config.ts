import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://127.0.0.1:8000',
      '/predict-congestion': 'http://127.0.0.1:8000',
      '/predict-fuel': 'http://127.0.0.1:8000',
      '/compare-routes': 'http://127.0.0.1:8000',
      '/analytics': 'http://127.0.0.1:8000',
      '/sources': 'http://127.0.0.1:8000',
      '/models': 'http://127.0.0.1:8000',
      '/docs': 'http://127.0.0.1:8000',
      '/openapi.json': 'http://127.0.0.1:8000',
    }
  }
})

