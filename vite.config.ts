import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/Reddy_Loan_Helper/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('recharts')) return 'vendor-charts'
          if (id.includes('lucide-react')) return 'vendor-icons'
        },
      },
    },
  },
})
