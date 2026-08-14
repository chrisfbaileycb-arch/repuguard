import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: true
  },
  define: {
    global: 'globalThis',
    'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51U47WR4Pr8vJAOFfPiN9C20v5hT7LlSU1HwczRmCoVamPfxQTXiKmMvjVQamzZbn3mVmx4D8kxXsw8lbgPt0iXIH00esj8oP7d')
  }
})
