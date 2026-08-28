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
    // No hardcoded fallback key — a baked-in key belongs to whichever Stripe
    // account issued it and would silently override the deployer's own.
    'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_STRIPE_PUBLISHABLE_KEY || '')
  }
})
