import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台' },
      },

      // 推广 · 巨量广告·标准
      {
        path: 'media/accounts',
        name: 'accounts',
        component: () => import('@/views/media/Accounts.vue'),
        meta: { title: '账户', group: '推广' },
      },
      {
        path: 'build/projects',
        name: 'projects',
        component: () => import('@/views/build/Projects.vue'),
        meta: { title: '项目', group: '推广' },
      },
      {
        path: 'build/ads',
        name: 'ads',
        component: () => import('@/views/build/Ads.vue'),
        meta: { title: '广告', group: '推广' },
      },
      {
        path: 'build/auto-plans',
        name: 'auto-plans',
        component: () => import('@/views/build/AutoPlans.vue'),
        meta: { title: '托管方案', group: '推广' },
      },
      {
        path: 'build/play-assistant',
        name: 'play-assistant',
        component: () => import('@/views/build/PlayAssistant.vue'),
        meta: { title: '铺剧助手', group: '推广' },
      },
      {
        path: 'build/create',
        name: 'build-create',
        component: () => import('@/views/build/Create.vue'),
        meta: { title: '批量搭建', group: '推广' },
      },

      // 素材
      {
        path: 'material/assets',
        name: 'assets',
        component: () => import('@/views/media/Assets.vue'),
        meta: { title: '素材库', group: '素材' },
      },

      // 资产
      {
        path: 'asset/list',
        name: 'asset-list',
        component: () => import('@/views/asset/AssetList.vue'),
        meta: { title: '资产库', group: '资产' },
      },

      // 任务中心
      {
        path: 'build/tasks',
        name: 'tasks',
        component: () => import('@/views/build/Tasks.vue'),
        meta: { title: '任务中心', group: '任务' },
      },

      // 报表
      {
        path: 'build/reports',
        name: 'reports',
        component: () => import('@/views/build/Reports.vue'),
        meta: { title: '数据看板', group: '报表' },
      },

      // 管理
      {
        path: 'admin/accounts',
        name: 'accounts-manage',
        component: () => import('@/views/admin/AccountsManage.vue'),
        meta: { title: '账户管理', group: '管理', roles: ['admin'] },
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/Users.vue'),
        meta: { title: '用户管理', group: '管理', roles: ['admin'] },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  // BASE_URL 跟随 vite base，本地为 '/'，GitHub Pages 为 '/<仓库名>/'
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth !== false && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.name === 'login' && auth.isLoggedIn) {
    return { name: 'dashboard' };
  }
  if (to.meta.roles && !to.meta.roles.includes(auth.user?.role)) {
    return { name: 'dashboard' };
  }
  return true;
});

export default router;
