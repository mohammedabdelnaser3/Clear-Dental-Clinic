import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  build: {
    sourcemap: true,
    // Reduce chunk size warnings
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    host: true,
    // Improve hot module replacement
    hmr: {
      port: 5173,
      overlay: true,
      clientPort: 5173
    },
    // Increase timeout for slow connections
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
