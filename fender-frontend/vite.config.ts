import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Allow external access
    port: 5173,        // Fixed port
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? 'http://backend:8005'  // Docker service name
          : 'http://localhost:8005',  // Local development
        changeOrigin: true
      }
    }
  }
})
