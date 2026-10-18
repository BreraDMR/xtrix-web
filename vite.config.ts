import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const nodeMajor = Number(process.versions.node.split('.')[0])

export default defineConfig(({ command, mode }) => {
  // a build without the API address would quietly call /api on whatever host serves it
  if (command === 'build' && !loadEnv(mode, process.cwd(), '').VITE_API_URL) {
    throw new Error('VITE_API_URL is not set - the build needs the API address, e.g. VITE_API_URL=https://api.example.com')
  }

  return {
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
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      // Node 25+ ships its own localStorage global (undefined without a file) and it
      // shadows the jsdom one, so turn it off for the test workers
      pool: 'forks',
      poolOptions: {
        forks: { execArgv: nodeMajor >= 25 ? ['--no-experimental-webstorage'] : [] },
      },
    },
  }
})
