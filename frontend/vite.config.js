import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
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
