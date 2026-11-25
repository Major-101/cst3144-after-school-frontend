import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  // Relative base path ensures asset links work on GitHub Pages subfolder deployments
  base: './',
  plugins: [vue()],
  server: {
    port: 5173
  }
})
