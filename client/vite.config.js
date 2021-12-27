import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    hmr: {
      host: 'eve-angelx.localhost', // TODO: Move to config/env
      port: 443,
      protocol: 'wss'
    }
  },
  plugins: [vue()]
})
