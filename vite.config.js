import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  const plugins = [react()];

  return {
    base: './',
    plugins,
    build: {
      outDir: 'docs',
      chunkSizeWarningLimit: 1000
    },
    server: {
      port: 3000,
      host: true,
      watch: {
        ignored: ['**/android/**']
      }
    }
  };
})
