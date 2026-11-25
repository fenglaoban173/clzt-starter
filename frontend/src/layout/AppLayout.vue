<template>
  <el-container class="app-layout">
    <!-- 顶部一级导航 -->
    <el-header class="app-header">
      <div class="brand">
        <!-- R81：左侧图标替换为央广时代 logo（等比缩小） -->
        <img class="brand-logo" src="https://auth.ygsdmedia.cn/static/img/logo.b43d49ad.png" alt="央广时代" />
        <span>央广智投</span>
      </div>

      <nav class="top-nav">
        <div
          v-for="m in topMenus"
          :key="m.key"
          class="nav-item"
          :class="{ active: topActive === m.key }"
          @mouseenter="onHover(m)"
          @mouseleave="openPanel = ''"
          @click="onTopSelect(m.key)"
        >
          <span>{{ m.title }}</span>

          <!-- 资产：多列 mega 下拉（其余菜单无 hover 下拉，点击直接进入对应模块） -->
          <div v-if="openPanel === m.key && m.mega" class="nav-panel panel-mega">
            <div v-for="col in assetColumns" :key="col.head" class="panel-col">
              <div class="panel-group-title">
                <el-icon><component :is="col.icon" /></el-icon>{{ col.head }}
              </div>
              <div
                v-for="it in col.items"
                :key="it.title"
                class="panel-link"
                :class="{ disabled: it.placeholder }"
                @click.stop="jumpAsset(it)"
              >{{ it.title }}</div>
            </div>
          </div>
        </div>
      </nav>

      <div class="header-right">
        <el-badge :value="0" class="header-icon"><el-icon><Bell /></el-icon></el-badge>
        <el-dropdown @command="onUserMenu">
          <div class="user-wrap">
            <el-avatar :size="28" class="user-avatar">
              {{ (auth.user?.username || 'U').slice(0, 1).toUpperCase() }}
            </el-avatar>
            <span class="org-name">北京央广时代文化传播有限公司</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container class="body-wrap">
      <!-- 左侧二级菜单树 -->
      <el-aside v-if="sideMenus.length" width="160px" class="sider">
        <el-menu
          :default-active="sideActive"
          :default-openeds="sideOpeneds"
          class="side-menu"
          @select="onSideSelect"
        >
          <template v-for="g in sideMenus" :key="g.title">
            <el-sub-menu v-if="g.children" :index="g.title">
              <template #title>
                <!-- R81：移除分组标题前的文件夹图标 -->
                <span>{{ g.title }}</span>
              </template>
              <el-menu-item
                v-for="c in g.children"
                :key="c.title"
                :index="c.title"
                :disabled="c.placeholder"
              >
                <!-- R80：媒体图标（左侧菜单「巨量广告·标准」等） -->
                <img v-if="c.icon" :src="c.icon" class="side-item-icon" alt="" />
                <span>{{ c.title }}</span>
                <el-tag v-if="c.placeholder" size="small" type="info" effect="plain" class="side-tag">待开通</el-tag>
                <!-- R103：报表订阅标注「待开发」 -->
                <el-tag v-if="c.dev" size="small" type="info" effect="plain" class="side-tag">待开发</el-tag>
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="g.title" :disabled="g.placeholder">
              <el-icon><Tickets /></el-icon>
              <span>{{ g.title }}</span>
            </el-menu-item>
          </template>
        </el-menu>
      </el-aside>

      <!-- 主区 -->
      <el-main class="app-content">
        <!-- 推广·标准 下的三级页签，右侧为批量新建 / 策略新建 / 日期区间 -->
        <div v-if="showPromoTabs" class="sub-tabs">
          <div class="sub-tab-list">
            <div
              v-for="t in promoTabs"
              :key="t.name"
              class="sub-tab"
              :class="{ active: route.name === t.name }"
              @click="goTab(t.name)"
            >
              {{ t.title }}
            </div>
          </div>
          <PromoActionBar :media="media" />
        </div>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/store/auth';
import PromoActionBar from './components/PromoActionBar.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

// 路由 → 一级模块
const moduleOf = {
  dashboard: 'home',
  accounts: 'promo', projects: 'promo', ads: 'promo',
  'auto-plans': 'promo', 'play-assistant': 'promo', 'build-create': 'promo',
  reports: 'report', assets: 'material', 'asset-list': 'asset',
  tasks: 'task', 'accounts-manage': 'admin', users: 'admin',
  // R89：报表 9 个页面（效果分析 6 + 经营分析 3）
  'report-account': 'report', 'report-project': 'report', 'report-ad': 'report',
  'report-component': 'report', 'report-material': 'report', 'report-subscribe': 'report',
  'report-people': 'report', 'report-finance': 'report', 'report-funds': 'report',
};
const module = computed(() => moduleOf[route.name] || 'home');

// 顶部一级
const topMenus = [
  { key: 'home', title: '首页', mod: 'home' },
  { key: 'promo', title: '推广', mod: 'promo' },
  { key: 'report', title: '报表', mod: 'report' },
  { key: 'material', title: '素材', mod: 'material' },
  { key: 'asset', title: '资产', mod: 'asset', mega: true },
  { key: 'task', title: '任务', mod: 'task' },
  { key: 'tool', title: '工具', mod: 'tool', placeholder: true },
  { key: 'admin', title: '管理', mod: 'admin', admin: true },
];

// 左侧二级菜单（对照创量，仅巨量；其他媒体置灰待开通）
const sideMenuConfig = {
  promo: [
    {
      title: '广告管理', children: [
        // R80：菜单左侧加媒体图标（头条面板图标）
        { title: '巨量广告·标准', name: 'accounts', query: { media: 'upgrade' }, icon: 'https://tos.mobgi.com/web/image/panel/toutiao-panel-icon.png' },
        { title: '巨量广告·全域', name: 'accounts', query: { media: 'uni' }, hidden: true },
        { title: '巨量广告·智擎', name: 'accounts', query: { media: 'oc' }, hidden: true },
      ],
    },
    // 「账户管理 / 媒体账户」按需求在左侧隐藏（hidden 的分组不渲染）
    { title: '账户管理', children: [{ title: '媒体账户', name: 'accounts-manage', admin: true }], hidden: true },
    // 「任务中心」按需求从推广模块的左侧菜单移除（顶部「任务」模块仍保留）
  ],
  report: [
    {
      // R89：对齐创量线上「报表 → 效果分析」6 项
      title: '效果分析', children: [
        { title: '账户报表', name: 'report-account' },
        { title: '项目报表', name: 'report-project' },
        { title: '广告报表', name: 'report-ad' },
        { title: '组件报表', name: 'report-component' },
        { title: '素材报表', name: 'report-material' },
        { title: '报表订阅', name: 'report-subscribe', dev: true },
      ],
    },
    {
      // R89：对齐创量线上「报表 → 经营分析」3 项
      title: '经营分析', children: [
        { title: '人效管理', name: 'report-people' },
        { title: '财务管理', name: 'report-finance' },
        { title: '资金使用率', name: 'report-funds' },
      ],
    },
  ],
  material: [
    { title: '素材库', name: 'assets' },
  ],
  asset: [
    {
      // 顺序与创量标准版「巨量广告·标准 → 资产」侧栏一致
      // R82：移除 资产组 / 小程序·小游戏 / 短剧推广链接 / 监测活动 / 穿山甲媒体包 / 试玩·直玩素材 / 创意组件 / 原生锚点模板 / 评论管理
      title: '巨量资产-标准', children: [
        { title: '巨量商品库', name: 'asset-list', query: { kind: 'product' } },
        { title: '巨量应用', name: 'asset-list', query: { kind: 'app' } },
        { title: '事件管理', name: 'asset-list', query: { kind: 'event' } },
        { title: '自定义人群包', name: 'asset-list', query: { kind: 'audience' } },
        { title: '定向包', name: 'asset-list', query: { kind: 'orientation' } },
        { title: '落地页', name: 'asset-list', query: { kind: 'landing_page' } },
        { title: '直达链接', name: 'asset-list', query: { kind: 'deep_link' } },
      ],
    },
  ],
  task: [{ title: '任务中心', name: 'tasks' }],
  admin: [
    { title: '账户管理', name: 'accounts-manage' },
    { title: '用户管理', name: 'users' },
  ],
};

const sideMenus = computed(() => {
  const list = sideMenuConfig[module.value] || [];
  return list.filter((g) => !g.hidden).map((g) => {
    if (g.children) {
      return { ...g, children: g.children.filter((c) => !c.hidden && (!c.admin || auth.role === 'admin')) };
    }
    return g;
  }).filter((g) => !g.admin || auth.role === 'admin');
});

const sideOpeneds = computed(() => sideMenus.value.filter((g) => g.children).map((g) => g.title));

// ---- 顶部 hover 下拉（仅「资产」有下拉面板，其余菜单点击直接跳转） ----
const openPanel = ref('');
function onHover(m) { if (m.mega) openPanel.value = m.key; }

// 资产 mega 下拉（对照创量标准版，仅巨量相关；腾讯列置灰待开通）
const assetColumns = [
  {
    head: '通用资产',
    icon: 'Box',
    items: [
      { title: '文案库', kind: 'copywrite' },
      { title: '动态链接', kind: 'deep_link' },
    ],
  },
  {
    head: '巨量广告·标准',
    icon: 'Promotion',
    // R82：与左侧「巨量资产-标准」保持一致，移除同类菜单项
    items: [
      { title: '巨量商品库', kind: 'product' },
      { title: '巨量应用', kind: 'app' },
      { title: '事件管理', kind: 'event' },
      { title: '自定义人群包', kind: 'audience' },
      { title: '定向包', kind: 'orientation' },
      { title: '落地页', kind: 'landing_page' },
      { title: '直达链接', kind: 'deep_link' },
      { title: '文案库', kind: 'copywrite' },
      { title: '动态链接', kind: 'deep_link' },
    ],
  },
  {
    head: '巨量广告·全域',
    icon: 'DataAnalysis',
    items: [
      { title: '专辑链接', kind: 'album' },
      { title: '定向包', kind: 'orientation' },
    ],
  },
  {
    head: '巨量广告·智擎',
    icon: 'MagicStick',
    items: [{ title: '定向包', kind: 'orientation' }],
  },
  {
    head: '腾讯广告',
    icon: 'Cellphone',
    items: [
      { title: '定向模板', placeholder: true },
      { title: '监测活动', placeholder: true },
      { title: '小游戏监控', placeholder: true },
      { title: '直达链接', placeholder: true },
      { title: '微信原生页', placeholder: true },
      { title: '官方落地页', placeholder: true },
      { title: '自定义落地页', placeholder: true },
      { title: '微信小店商品页', placeholder: true },
      { title: '微信小程序', placeholder: true },
      { title: '微信客服', placeholder: true },
      { title: '快应用链接', placeholder: true },
      { title: '资产组管理', placeholder: true },
      { title: '账户资产共享', placeholder: true },
      { title: '微信生态授权', placeholder: true },
      { title: '组图管理', placeholder: true },
      { title: '评论管理', placeholder: true },
      { title: '标签管理', placeholder: true },
    ],
  },
];

function jumpAsset(it) {
  if (it.placeholder) { ElMessage.info('原型暂未开放该功能'); return; }
  router.push({ name: 'asset-list', query: { kind: it.kind } });
}

const sideActive = computed(() => {
  const flat = {};
  sideMenus.value.forEach((g) => {
    if (g.children) g.children.forEach((c) => { if (c.name) flat[c.name] = c.title; });
    else if (g.name) flat[g.name] = g.title;
  });
  // 推广按 query.media 回标（全域 / 智擎在左侧已隐藏，统一回落到「巨量广告·标准」）
  if (['accounts', 'projects', 'ads', 'auto-plans', 'play-assistant'].includes(route.name)) {
    return '巨量广告·标准';
  }
  // 报表按 query.tab 回标
  if (route.name === 'reports') {
    const map = { account: '账户报表', project: '项目报表', ad: '广告报表', component: '组件报表', material: '素材报表' };
    return map[route.query.tab] || '账户报表';
  }
  // R89：报表各页按 route.name 回标（report-* → 账户报表/…/资金使用率）
  if (typeof route.name === 'string' && route.name.startsWith('report-')) {
    return flat[route.name] || '';
  }
  if (route.name === 'asset-list') {
    const map = {
      asset_group: '资产组', product: '巨量商品库', app: '巨量应用', mini_game: '小程序/小游戏',
      drama_link: '短剧推广链接', monitor: '监测活动', event: '事件管理', audience: '自定义人群包',
      csj_package: '穿山甲媒体包', orientation: '定向包', landing_page: '落地页', interactive: '试玩/直玩素材',
      deep_link: '直达链接', component: '创意组件', anchor: '原生锚点模板', comment: '评论管理',
      copywrite: '文案库', album: '专辑链接',
    };
    return map[route.query.kind] || '资产组';
  }
  return flat[route.name] || '';
});

const topActive = computed(() => {
  const t = topMenus.find((m) => m.mod === module.value);
  return t ? t.key : 'home';
});

// 推广·标准 三级页签（全域 / 智擎仅账户、项目）
const media = computed(() => route.query.media || 'upgrade');
const allPromoTabs = [
  { name: 'accounts', title: '账户' },
  { name: 'projects', title: '项目' },
  { name: 'ads', title: '广告' },
];
const promoTabs = computed(() => {
  if (media.value === 'uni' || media.value === 'oc') {
    return allPromoTabs.filter((t) => ['accounts', 'projects'].includes(t.name));
  }
  return allPromoTabs;
});
// 仅账户 / 项目 / 广告三个页签展示页签行（含批量新建等操作）
const showPromoTabs = computed(() => allPromoTabs.some((t) => t.name === route.name));

function goTab(name) { router.push({ name, query: { media: media.value } }); }

function onTopSelect(key) {
  const m = topMenus.find((x) => x.key === key);
  if (!m) return;
  openPanel.value = '';
  if (m.placeholder) { ElMessage.info('原型暂未开放该功能'); return; }
  const first = (sideMenuConfig[m.mod] || [])[0];
  const target = first?.children?.[0]?.name || first?.name;
  if (target) router.push({ name: target, query: first.children?.[0]?.query || {} });
  else router.push({ name: 'dashboard' });
}

function onSideSelect(title) {
  let target = null;
  let query = {};
  sideMenus.value.forEach((g) => {
    const kids = g.children || [g];
    const hit = kids.find((c) => c.title === title);
    if (hit) { target = hit.name; query = hit.query || {}; }
  });
  if (!target) { ElMessage.info('原型暂未开放该功能（待开通媒体）'); return; }
  router.push({ name: target, query });
}

// 资产模块（asset-list）整站切到创量设计令牌：
// 主色 #197afb、圆角 3px、次按钮 #666/#d0d0d0、表头 12px/700 #333、表格边框 #ebeef5 等。
// 用 body 上的类承载，弹窗/抽屉 teleport 到 body 也能继承到令牌。
const ASSET_ROUTES = new Set(['asset-list']);
// R89：报表模块各页同样挂 report-scope（创量报表设计令牌）
const REPORT_ROUTES = new Set([
  'report-account', 'report-project', 'report-ad', 'report-component',
  'report-material', 'report-subscribe', 'report-people', 'report-finance', 'report-funds',
]);
function syncAssetScope(name) {
  const on = ASSET_ROUTES.has(name);
  if (on) document.body.classList.add('asset-scope');
  else document.body.classList.remove('asset-scope');
  const ron = REPORT_ROUTES.has(name);
  if (ron) document.body.classList.add('report-scope');
  else document.body.classList.remove('report-scope');
}
onMounted(() => syncAssetScope(route.name));
watch(() => route.name, syncAssetScope);

async function onUserMenu(command) {
  if (command === 'logout') {
    auth.clear();
    router.push({ name: 'login' });
  }
}
</script>

<style scoped>
.app-layout { height: 100%; }
.app-header {
  /* 线上创量标准版顶栏实测高 64px */
  height: 64px;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #e5e6eb;
}
.brand { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 18px; color: #1d2129; white-space: nowrap; }
/* R81：央广时代 logo，等比缩小（原始 209×67） */
.brand-logo { display: block; height: 22px; width: auto; max-width: 80px; object-fit: contain; }
.top-nav { flex: 1; display: flex; height: 56px; }
.nav-item { position: relative; height: 56px; line-height: 56px; padding: 0 18px; font-size: 17px; color: #4e5969; cursor: pointer; }
.nav-item.active { color: #2563eb; font-weight: 600; }
.nav-panel {
  position: absolute; top: 64px; left: 0; background: #fff; border: 1px solid #e5e6eb;
  border-radius: 6px; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12); padding: 12px; z-index: 2000; min-width: 180px;
  line-height: 1.5; /* 面板在导航项内，需重置导航的 56px 行高 */
}
.panel-group + .panel-group { margin-top: 12px; }
.panel-group-title { font-size: 13px; color: #86909c; margin-bottom: 6px; }
.panel-link { padding: 6px 10px; font-size: 14px; color: #4e5969; border-radius: 4px; white-space: nowrap; }
.panel-link:hover { background: #f2f3f5; color: #2563eb; }
.panel-link.disabled { color: #c9cdd4; cursor: not-allowed; }
/* 资产 mega 下拉：定宽悬浮面板（左缘与内容区对齐），列标题带图标 */
.nav-panel.panel-mega {
  position: fixed;
  top: 64px;
  left: 188px;
  width: 904px;
  max-width: calc(100vw - 188px - 24px);
  box-sizing: border-box;
  display: flex;
  gap: 0;
  align-items: flex-start;
  padding: 16px 30px 24px 56px;
  border: none;
  border-bottom: 1px solid #e5e6eb;
  border-radius: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  max-height: calc(100vh - 64px);
  overflow: auto;
  min-width: 0;
}
.panel-mega .panel-group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 10px;
}
.panel-mega .panel-group-title .el-icon { color: #4e5969; }
.panel-mega .panel-link { padding: 6px 0; font-size: 14px; }
.panel-mega .panel-link:hover { background: transparent; color: #2563eb; }
.panel-col { width: 162px; flex: none; }
.header-right { display: flex; align-items: center; gap: 18px; }
.header-icon { color: #4e5969; cursor: pointer; }
.user-wrap { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.org-name { font-size: 14px; color: #1d2129; white-space: nowrap; }
.user-avatar { background: #2563eb; }

.body-wrap { height: calc(100% - 64px); }
.sider { background: #fff; border-right: 1px solid #e5e6eb; overflow-y: auto; }
/* 左侧菜单字号放大（Element Plus 菜单字号跟随 --el-menu-item-font-size） */
.side-menu { border-right: none; --el-menu-item-font-size: 15px; }
.side-menu :deep(.el-menu-item [class^=el-icon]),
.side-menu :deep(.el-sub-menu [class^=el-icon]) { font-size: 19px; }
/* R80：菜单项左侧的媒体图标 */
.side-item-icon { flex: none; width: 18px; height: 18px; margin-right: 8px; object-fit: contain; }
.side-tag { margin-left: 6px; transform: scale(0.9); font-size: 13px; }

.app-content { padding: 0; overflow: auto; background: #f7f8fa; }

.sub-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  height: 56px;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #e5e6eb;
}
.sub-tab-list { display: flex; align-items: center; gap: 28px; height: 56px; }
.sub-tab {
  position: relative;
  height: 56px;
  line-height: 56px;
  font-size: 16px;
  color: #4e5969;
  cursor: pointer;
}
.sub-tab.active { color: #2563eb; font-weight: 600; }
.sub-tab.active::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 2px;
  background: #2563eb;
}
</style>
