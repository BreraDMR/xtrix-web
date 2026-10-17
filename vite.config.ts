import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const nodeMajor = Number(process.versions.node.split('.')[0])

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Node 25+ ships its own localStorage global (undefined without a file) and it
    // shadows the jsdom one, so turn it off for the test workers
    pool: 'forks',
    poolOptions: {
      forks: { execArgv: nodeMajor >= 25 ? ['--no-experimental-webstorage'] : [] },
    },
  },
})


