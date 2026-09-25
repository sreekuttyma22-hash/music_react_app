import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://sreekuttyma22.pythonanywhere.com',
        changeOrigin: true,
      },
      '/media': {
        target: 'https://sreekuttyma22.pythonanywhere.com',
        changeOrigin: true,
      },
    },
  },
})
