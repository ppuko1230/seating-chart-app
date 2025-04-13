// vite.config.js を編集
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/new-seating-chart-app/' // GitHubリポジトリ名に合わせて変更
})