import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// vite.config.js
export default defineConfig({
  base: '/seating-chart-app/',  // GitHub Pagesで使うサブディレクトリ名
  plugins: [react()],
});
