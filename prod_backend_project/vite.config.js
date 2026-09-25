import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://music-backend-app-4cv8.onrender.com',
        changeOrigin: true,
      },
      '/media': {
        target: 'https://music-backend-app-4cv8.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
