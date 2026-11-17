import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // 部署到 GitHub Pages 时用 VITE_BASE 指定仓库子路径（如 /clzt-starter/），本地默认 /
  base: process.env.VITE_BASE || '/',
  plugins: [vue()],
  server: {
    port: 5173,
    // 原型模式：所有数据来自前端本地 mock（src/mock/data.js），不代理后端
  },
  resolve: {
    alias: { '@': '/src' },
  },
  css: {
    preprocessorOptions: {
      less: { javascriptEnabled: true },
    },
  },
});
