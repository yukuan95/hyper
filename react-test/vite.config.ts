import viteCompression from "vite-plugin-compression"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/hyper',
  plugins: [react(), viteCompression()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.slice(-2) === 'js') {
            if (id.includes('node_modules')) {
              if (id.includes('echarts')) {
                return 'echarts'
              } else if (id.includes('ant')) {
                return 'antd'
              }
            }
          }
          return null
        }
      }
    }
  }
})
