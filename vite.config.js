import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // または使用している他のフレームワークプラグイン

export default defineConfig({
  plugins: [react()],
  base: '/seating-chart-app/',
  root: './', // プロジェクトルートを明示的に指定
  build: {
    outDir: 'dist' // ビルド出力先ディレクトリ
  }
})
