import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/chat': {
        target: 'https://token-plan.cn-beijing.maas.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chat/, '/compatible-mode/v1/chat/completions'),
      },
    },
  },
})
