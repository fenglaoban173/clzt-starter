<template>
  <div class="event-page">
    <!-- ① 页面标题（线上 cl-minor-nav：高 48px、16px 粗体蓝字 + 3px 蓝色下划线） -->
    <div class="asset-title-bar event-title-bar">
      <span class="asset-title event-title">事件管理</span>
    </div>

    <!-- ② 查询条件 + 工具栏（线上 .mg-filter-wrapper.cl-filter：白底、padding 12px 8px 12px 16px、flex 居中） -->
    <div class="event-filter-row">
      <div class="filter-left">
        <!-- 媒体账户：单选 + 可搜索 + 独立清空 X + 下拉末尾「搜索更多(N)…」 -->
        <div class="filter-cell">
          <label class="filter-label">媒体账户：</label>
          <el-select
            v-model="accountId"
            class="filter-select"
            size="small"
            filterable
            placeholder="全部"
            @change="onAccountChange"
          >
            <el-option v-for="a in shownAccounts" :key="a.value" :label="a.label" :value="a.value" />
            <template #footer>
              <li
                v-if="hasMoreAccounts"
                class="el-select-dropdown__item el-select-dropdown__item--tips event-more-item"
                @click.stop="loadMoreAccounts"
              > 搜索更多({{ TOTAL_ACCOUNT_COUNT }})... </li>
            </template>
          </el-select>
          <el-icon class="event-icon-close" title="清空" @click="onClearAccount"><Close /></el-icon>
        </div>

        <!-- 关键词搜索：字段类型下拉（仅「资产名称」）+ 关键词输入 + 🔍（线上无「清空」链接 / 无「查询」按钮） -->
        <div class="event-search">
          <el-select v-model="searchType" class="event-search-field" size="small" placeholder="请选择">
            <el-option v-for="o in SEARCH_TYPES" :key="o.id" :label="o.label" :value="o.id" />
          </el-select>
          <el-input
            v-model="keyword"
            class="event-search-input"
            size="small"
            placeholder="请输入关键词"
            @keyup.enter="onSearch"
            @clear="onSearch"
          >
            <template #suffix>
              <el-icon class="el-input__icon" @click="onSearch"><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 工具栏：同步事件管理（primary，106×28）+ 橙色提示 -->
      <el-button
        type="primary"
        size="small"
        class="tool-btn event-sync-btn"
        :loading="syncing"
        @click="onSync"
      >同步事件管理</el-button>
      <span class="event-tips">因接口限制，橙子落地页资产需在 <a class="event-tips-link" :href="LANDING_PAGE_URL" target="_blank" rel="noopener">落地页管理页面</a> 同步，无需在此处同步。</span>
    </div>

    <!-- ③ 主体：左「资产列表」 + 右「事件列表」（线上 .list-dispaly，两栏之间无间距） -->
    <div class="event-body">
      <div class="event-left">
        <div class="event-left-title">
          <span class="event-left-title-text">资产列表</span>
        </div>
        <div class="event-left-list" v-loading="assetLoading">
          <div
            v-for="a in assetList"
            :key="a.asset_id"
            class="event-asset-item"
            :class="{ 'is-active': a.asset_id === currentAssetId }"
            @click="selectAsset(a)"
          >
            <el-icon class="event-asset-icon"><Box /></el-icon>
            <div class="event-asset-name" :title="a.asset_name">{{ a.asset_name }}</div>
            <div class="event-asset-id">{{ assetIdText(a) }}</div>
          </div>
          <div
            v-if="assetList.length < assetTotal"
            class="event-load-more"
            v-loading="loadingMore"
            @click="loadMoreAssets"
          > 加载更多 </div>
          <div v-else-if="!assetList.length" class="event-load-more">暂无数据</div>
        </div>
      </div>

      <div class="event-right">
        <el-table
          v-loading="tableLoading"
          :data="shownEvents"
          border
          size="mini"
          max-height="650"
          class="asset-table event-table"
          empty-text="暂无数据"
        >
          <el-table-column label="事件名称" prop="optimization_name" width="334" show-overflow-tooltip />
          <el-table-column label="优化目标" prop="external_action_title" width="249" show-overflow-tooltip>
            <template #default="{ row }">{{ row.external_action_title || '无' }}</template>
          </el-table-column>
          <el-table-column label="深度优化目标" prop="deep_external_action_str" width="249" show-overflow-tooltip>
            <template #default="{ row }">{{ row.deep_external_action_str || '无' }}</template>
          </el-table-column>
          <el-table-column label="价值类型" prop="value_type_title" width="249" show-overflow-tooltip />
          <el-table-column label="事件回传方式" prop="track_types" width="110" show-overflow-tooltip>
            <template #default="{ row }">{{ trackText(row.track_types) }}</template>
          </el-table-column>
          <el-table-column label="媒体账户" prop="advertiser_nick" width="249" show-overflow-tooltip />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Box, Close, Search } from '@element-plus/icons-vue';

/* ------------------------------------------------------------------
 * 创量标准版「巨量广告·标准 → 资产 → 事件管理」
 * 线上：https://cl.mobgi.com/property/toutiao/eventmanagement/index
 * 采集自线上 DOM / 线上构建产物（assets/event-management-*.js）：
 *   - 页面由「查询条件条 + 左资产列表 + 右事件列表」三块组成
 *   - 媒体账户为单选（filter-select，末尾「搜索更多(N)…」），带独立清空 X
 *   - 关键词搜索的字段类型只有「资产名称」，语义是过滤左侧资产列表
 *   - 工具栏只有「同步事件管理」一个按钮（无新建/导出/批量操作）
 *   - 右侧 6 列，无多选框、无操作列、无固定列
 *   - 右侧「事件列表」整表铺开，**没有分页条**（线上实测：1 条数据、页面底部无「共 N 条 / 前往 页」）
 * ------------------------------------------------------------------ */

const props = defineProps({ kind: { type: String, default: '' } });

const LANDING_PAGE_URL = 'https://cl.mobgi.com/property/toutiao/landingpage/index';

/** 线上 toutiao-D6ZGs52g.js 的 track_types 映射 */
const TRACK_TYPE_MAP = {
  APPLICATION_SDK: '应用SDK回传',
  APPLICATION_API: '应用API回传',
  QUICK_APP_API: '快应用API',
  XPATH: 'XPath圈选',
  JSSDK: 'JS埋码',
  EXTERNAL_API: 'API回传',
  MINI_PROGRAME_SDK: '小程序埋码',
  MINI_PROGRAME_API: '小程序API回传',
};

/** 关键词搜索的字段类型（线上只有「资产名称」一项） */
const SEARCH_TYPES = [{ id: 'asset', label: '资产名称' }];

/** 媒体账户下拉每次展示 10 条，可「搜索更多」继续展开（线上 showLimit = 10） */
const ACCOUNT_PAGE_SIZE = 10;
/** 线上媒体账户总数（实测下拉末尾显示「搜索更多(302)…」） */
const TOTAL_ACCOUNT_COUNT = 302;
/** 左侧资产列表每页 20 条（线上 assetSearchData.page_size = 20） */
const ASSET_PAGE_SIZE = 20;

/* ------------------------------ mock 数据 ------------------------------ */

const MOCK_ACCOUNTS = [
  { id: 'ma_01', nick: '北京高途云集教育科技有限公司--1', advertiser_id: '1861811345880074' },
  { id: 'ma_02', nick: '百度文库-央广时代-拉新-搜索-01', advertiser_id: '1866877399870663' },
  { id: 'ma_03', nick: '百度文库-央广时代-拉新-搜索-02', advertiser_id: '1866877399203047' },
  { id: 'ma_04', nick: '百度文库-央广时代-拉新-搜索-03', advertiser_id: '1866849651765706' },
  { id: 'ma_05', nick: '任意门-央广-代运营-36-安卓-UBA', advertiser_id: '1866489873996443' },
  { id: 'ma_06', nick: '任意门-央广-代运营-22-安卓-UBA', advertiser_id: '1866489858950211' },
  { id: 'ma_07', nick: '任意门-央广-代运营-23-安卓-UBA', advertiser_id: '1866489859578696' },
  { id: 'ma_08', nick: '任意门-央广-代运营-10-ios-UBA', advertiser_id: '1866489860302024' },
  { id: 'ma_09', nick: '任意门-央广-代运营-25-ios-UBA', advertiser_id: '1866489860976135' },
  { id: 'ma_10', nick: '任意门-央广-代运营-30-ios-UBA', advertiser_id: '1866489864776836' },
  { id: 'ma_11', nick: '央广智投-巨量引擎官方演示', advertiser_id: '1888888888888888' },
  { id: 'ma_12', nick: '央广智投-教育行业-巨量广告-01', advertiser_id: '1866010000000001' },
  { id: 'ma_13', nick: '央广智投-教育行业-巨量广告-02', advertiser_id: '1866010000000002' },
  { id: 'ma_14', nick: '央广智投-本地生活-巨量广告-01', advertiser_id: '1866010000000003' },
];

/** 左侧「资产列表」：media_account_id → 资产数组 */
const MOCK_ASSETS = {
  ma_01: [
    { asset_id: '1862067192524939', mini_program_id: '1862067192524939', asset_name: '毛豆爱古诗', asset_type: 'MINI_PROGRAME' },
    { asset_id: '1862067192524940', mini_program_id: '1862067192524940', asset_name: '智学苑课堂', asset_type: 'MINI_PROGRAME' },
    { asset_id: '1862067192524941', asset_name: '高途直播大班', asset_type: 'LANDING_PAGE' },
  ],
  ma_02: [{ asset_id: '1867140923472907', asset_name: '百度文库', asset_type: 'LANDING_PAGE' }],
  ma_03: [{ asset_id: '1867140923472908', asset_name: '百度文库-搜索02', asset_type: 'LANDING_PAGE' }],
  ma_04: [{ asset_id: '1867140923472909', asset_name: '百度文库-搜索03', asset_type: 'LANDING_PAGE' }],
  ma_05: [{ asset_id: '1867137877164233', mini_program_id: '1867137877164233', asset_name: 'Soul', asset_type: 'MINI_PROGRAME' }],
  ma_06: [{ asset_id: '1867137877164234', mini_program_id: '1867137877164234', asset_name: 'Soul-22', asset_type: 'MINI_PROGRAME' }],
  ma_07: [{ asset_id: '1867137877164235', mini_program_id: '1867137877164235', asset_name: 'Soul-23', asset_type: 'MINI_PROGRAME' }],
  ma_08: [{ asset_id: '1867137877164236', mini_program_id: '1867137877164236', asset_name: 'Soul-ios', asset_type: 'MINI_PROGRAME' }],
  ma_09: [{ asset_id: '1867137877164237', mini_program_id: '1867137877164237', asset_name: 'Soul-25', asset_type: 'MINI_PROGRAME' }],
  ma_10: [{ asset_id: '1867137877164238', mini_program_id: '1867137877164238', asset_name: 'Soul-30', asset_type: 'MINI_PROGRAME' }],
  ma_11: [
    { asset_id: '1869000000000001', asset_name: '演示落地页A', asset_type: 'LANDING_PAGE' },
    { asset_id: '1869000000000002', mini_program_id: '1869000000000002', asset_name: '演示小程序B', asset_type: 'MINI_PROGRAME' },
  ],
  ma_12: [{ asset_id: '1869000000000003', asset_name: '教育行业落地页01', asset_type: 'LANDING_PAGE' }],
  ma_13: [{ asset_id: '1869000000000004', asset_name: '教育行业落地页02', asset_type: 'LANDING_PAGE' }],
  ma_14: [{ asset_id: '1869000000000005', asset_name: '本地生活落地页01', asset_type: 'LANDING_PAGE' }],
};

/** 右侧「事件列表」：asset_id → 事件数组 */
const MOCK_EVENTS = {
  '1862067192524939': [
    { optimization_name: '付费', external_action_title: '付费', deep_external_action_str: '', value_type_title: '', track_types: ['APPLICATION_API'] },
    { optimization_name: '激活', external_action_title: '激活', deep_external_action_str: '', value_type_title: '', track_types: ['APPLICATION_API'] },
    { optimization_name: '次留', external_action_title: '激活且次留', deep_external_action_str: '', value_type_title: '', track_types: ['APPLICATION_API'] },
    { optimization_name: '注册', external_action_title: '注册', deep_external_action_str: '', value_type_title: '', track_types: ['APPLICATION_SDK'] },
    { optimization_name: '付费', external_action_title: '付费', deep_external_action_str: '多次付费', value_type_title: '高价值客户', track_types: ['APPLICATION_SDK', 'JSSDK'] },
    { optimization_name: '表单提交', external_action_title: '表单提交', deep_external_action_str: '', value_type_title: '销售线索', track_types: ['JSSDK'] },
    { optimization_name: '电话拨打', external_action_title: '电话拨打', deep_external_action_str: '', value_type_title: '', track_types: ['APPLICATION_API'] },
    { optimization_name: '点击量', external_action_title: '点击量', deep_external_action_str: '', value_type_title: '', track_types: ['EXTERNAL_API'] },
    { optimization_name: '下载完成', external_action_title: '下载完成', deep_external_action_str: '', value_type_title: '', track_types: ['QUICK_APP_API'] },
    { optimization_name: '小程序访问', external_action_title: '小程序访问', deep_external_action_str: '', value_type_title: '', track_types: ['MINI_PROGRAME_API'] },
    { optimization_name: '小程序埋码', external_action_title: '小程序埋码', deep_external_action_str: '', value_type_title: '', track_types: ['MINI_PROGRAME_SDK'] },
    { optimization_name: '圈选转化', external_action_title: '圈选转化', deep_external_action_str: '', value_type_title: '', track_types: ['XPATH'] },
    { optimization_name: '激活', external_action_title: '激活', deep_external_action_str: '激活且升级', value_type_title: '关键行为', track_types: ['APPLICATION_SDK'] },
    { optimization_name: '加购', external_action_title: 'app内加购', deep_external_action_str: '', value_type_title: '引流电商种草', track_types: ['JSSDK'] },
  ],
  '1862067192524940': [
    { optimization_name: '激活', external_action_title: '激活', deep_external_action_str: '', value_type_title: '', track_types: ['MINI_PROGRAME_API'] },
    { optimization_name: '付费', external_action_title: '付费', deep_external_action_str: '', value_type_title: '', track_types: ['MINI_PROGRAME_API'] },
    { optimization_name: '到课', external_action_title: '到课', deep_external_action_str: '', value_type_title: '', track_types: ['MINI_PROGRAME_SDK'] },
  ],
  '1862067192524941': [],
  '1867140923472907': [],
  '1867140923472908': [],
  '1867140923472909': [],
  '1867137877164233': [
    { optimization_name: '激活', external_action_title: '激活', deep_external_action_str: '', value_type_title: '', track_types: ['APPLICATION_API'] },
    { optimization_name: '次留', external_action_title: '激活且次留', deep_external_action_str: '', value_type_title: '', track_types: ['APPLICATION_API'] },
  ],
  '1869000000000001': [
    { optimization_name: '表单提交', external_action_title: '表单提交', deep_external_action_str: '', value_type_title: '销售线索', track_types: ['JSSDK'] },
    { optimization_name: '咨询', external_action_title: '在线咨询', deep_external_action_str: '', value_type_title: '有效获客', track_types: ['JSSDK'] },
    { optimization_name: '点击量', external_action_title: '点击量', deep_external_action_str: '', value_type_title: '', track_types: ['EXTERNAL_API'] },
    { optimization_name: '商品购买', external_action_title: '商品购买', deep_external_action_str: '', value_type_title: '', track_types: ['JSSDK'] },
    { optimization_name: '激活', external_action_title: '激活', deep_external_action_str: '', value_type_title: '', track_types: ['APPLICATION_SDK'] },
    { optimization_name: '付费', external_action_title: '付费', deep_external_action_str: '', value_type_title: '', track_types: ['APPLICATION_SDK'] },
  ],
};

/* ------------------------------ 状态 ------------------------------ */

const accountId = ref('');
const accountPage = ref(1);
const searchType = ref('asset');
const keyword = ref('');

const assetList = ref([]);
const assetTotal = ref(0);
const assetPage = ref(1);
const currentAssetId = ref('');

const eventList = ref([]);

const assetLoading = ref(false);
const loadingMore = ref(false);
const tableLoading = ref(false);
const syncing = ref(false);

/* ------------------------------ 计算 ------------------------------ */

const accounts = computed(() =>
  MOCK_ACCOUNTS.map((a) => ({
    value: a.id,
    label: `${a.nick} ${a.advertiser_id ? `(${a.advertiser_id})` : ''}`,
    nick: a.nick,
  })),
);

/** 下拉当前展示的账户（每次 10 条，「搜索更多」后 +10） */
const shownAccounts = computed(() => accounts.value.slice(0, accountPage.value * ACCOUNT_PAGE_SIZE));
const hasMoreAccounts = computed(() => accountPage.value * ACCOUNT_PAGE_SIZE < accounts.value.length);

/** 右侧「事件列表」数据：线上该表**不分页**（整表直接铺开，无分页条） */
const shownEvents = computed(() => eventList.value);

/* ------------------------------ 方法 ------------------------------ */

/** 资产 ID 文案：线上 asset_type === 'MINI_PROGRAME' 时显示 mini_program_id */
function assetIdText(asset) {
  return asset.asset_type === 'MINI_PROGRAME' ? asset.mini_program_id : asset.asset_id;
}

/** 事件回传方式：映射后用「、」连接，空则「无」 */
function trackText(types) {
  const arr = Array.isArray(types) ? types : [];
  return arr.map((t) => TRACK_TYPE_MAP[t] || t || '').join('、') || '无';
}

function assetsOf(account) {
  return MOCK_ASSETS[account] || [];
}

function eventsOf(assetId) {
  const rows = MOCK_EVENTS[assetId] || [];
  const acc = MOCK_ACCOUNTS.find((a) => a.id === accountId.value);
  return rows.map((r) => ({ ...r, advertiser_nick: acc ? acc.nick : '' }));
}

/** 重新加载左侧资产列表（keyword 过滤的是资产名称，不是右侧事件） */
function loadAssets() {
  const all = assetsOf(accountId.value);
  const kw = keyword.value.trim();
  const filtered = kw ? all.filter((a) => a.asset_name.indexOf(kw) !== -1) : all;
  assetTotal.value = filtered.length;
  assetPage.value = 1;
  assetList.value = filtered.slice(0, ASSET_PAGE_SIZE);
  if (assetList.value.length) {
    selectAsset(assetList.value[0]);
  } else {
    currentAssetId.value = '';
    eventList.value = [];
  }
}

/** 加载更多资产（线上 .load-more「加载更多」） */
function loadMoreAssets() {
  assetPage.value += 1;
  const all = assetsOf(accountId.value);
  const kw = keyword.value.trim();
  const filtered = kw ? all.filter((a) => a.asset_name.indexOf(kw) !== -1) : all;
  assetList.value = filtered.slice(0, assetPage.value * ASSET_PAGE_SIZE);
}

/** 下拉「搜索更多(N)…」：继续展开下一批账户 */
function loadMoreAccounts() {
  accountPage.value += 1;
}

/** 切换媒体账户 */
function onAccountChange() {
  keyword.value = '';
  loadAssets();
}

/** 清空媒体账户：线上会回落到第一个账户 */
function onClearAccount() {
  accountId.value = accounts.value.length ? accounts.value[0].value : '';
  keyword.value = '';
  loadAssets();
}

/** 关键词搜索（回车 / 🔍 / 清空） */
function onSearch() {
  loadAssets();
}

/** 选中左侧资产 → 右侧切换为该资产的事件 */
function selectAsset(asset) {
  currentAssetId.value = asset.asset_id;
  eventList.value = eventsOf(asset.asset_id);
}

/** 同步事件管理（线上：按钮 loading → 轮询任务 → 「同步成功」→ 重新拉资产列表） */
async function onSync() {
  if (syncing.value) return;
  syncing.value = true;
  assetLoading.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    ElMessage.success('同步成功');
    loadAssets();
  } finally {
    syncing.value = false;
    assetLoading.value = false;
  }
}

onMounted(() => {
  accountId.value = accounts.value.length ? accounts.value[0].value : '';
  loadAssets();
});
</script>

<style scoped>
/* ---------- 页面标题（线上 cl-minor-nav：48px、16px 粗体蓝字 + 3px 蓝色下划线） ---------- */
.event-title-bar { height: 48px; padding: 0; display: flex; align-items: flex-end; }
.event-title {
  display: inline-block; height: 48px; line-height: 45px;
  font-size: 16px; font-weight: 700; color: #197afb;
  border-bottom: 3px solid #197afb;
}

/* ---------- 查询条件条（线上 .mg-filter-wrapper.cl-filter） ---------- */
.event-filter-row {
  display: flex; align-items: center; flex-wrap: nowrap;
  padding: 12px 8px 12px 16px; background: #fff;
}
.event-filter-row .filter-left { align-items: center; }
.event-filter-row .filter-cell { margin-bottom: 0; }
.event-icon-close {
  margin: 0 0 0 4px; font-size: 16px; color: #999; cursor: pointer;
}
.event-icon-close:hover { color: #197afb; }

/* 关键词搜索：字段类型下拉 + 关键词输入 + 🔍（无线上「清空」链接 / 「查询」按钮） */
.event-search { display: flex; align-items: center; height: 28px; margin: 0 8px 0 0; }
.event-search-field { width: 88px; flex: none; }
.event-search-field :deep(.el-input__inner) { height: 28px; font-size: 12px; border-radius: 3px 0 0 3px; }
.event-search-input { width: 188px; }
.event-search-input :deep(.el-input__inner) { height: 28px; font-size: 12px; border-radius: 0 3px 3px 0; }
.event-search-input :deep(.el-input__icon) { cursor: pointer; color: #c0c4cc; }
.event-search-input :deep(.el-input__icon:hover) { color: #909399; }

/* 下拉末尾「搜索更多(N)…」 */
.event-more-item { font-size: 12px; cursor: pointer; color: #606266; }
.event-more-item:hover { color: #197afb; }

/* 工具栏 */
.event-sync-btn { width: 106px; height: 28px; padding: 0; font-size: 12px; border-radius: 3px; margin-left: 12px; }
.event-tips { font-size: 12px; color: #ff9b48; margin-left: 8px; white-space: nowrap; }
.event-tips-link { color: #197afb; text-decoration: none; }
.event-tips-link:hover { text-decoration: underline; }

/* ---------- 主体两栏（线上 .list-dispaly） ---------- */
.event-body { display: flex; margin: 16px 0 28px; }

.event-left {
  width: 260px; flex: none;
  background: #fff; border: 1px solid #d0d0d0; border-radius: 2px 2px 0 0;
}
.event-left-title {
  display: flex; align-items: center; justify-content: space-between;
  height: 56px; padding: 0 14px 0 16px; border-bottom: 1px solid #e8eaec;
}
.event-left-title-text { font-size: 12px; color: #333; }
.event-left-list { max-height: 670px; overflow-y: auto; }

.event-asset-item {
  height: 72px; padding: 21px 15px 9px 16px;
  font-size: 12px; color: #333; cursor: pointer; border-bottom: 1px solid #ddd;
}
.event-asset-item:hover { color: #197afb; }
.event-asset-item.is-active { background: #f3f9ff; color: #197afb; }
.event-asset-icon { float: left; margin-top: 1px; margin-right: 8px; font-size: 16px; }
.event-asset-name {
  height: 18px; line-height: 18px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.event-asset-id { height: 18px; line-height: 18px; color: inherit; }
.event-load-more {
  margin: 16px 0; font-size: 14px; color: #333; text-align: center; cursor: pointer;
}

.event-right {
  width: calc(100% - 260px); min-height: 400px; padding: 12px 13px;
  background: #fff; border: 1px solid #e8eaec; border-left: none;
}

/* ---------- 事件列表（线上 cl-table：表头 #fafafa / 12px #333 粗体 / 行高 56px） ---------- */
.event-table :deep(.el-table__header th) {
  background: #fafafa; color: #909399; font-size: 12px; height: 56px; padding: 0;
}
.event-table :deep(.el-table__header th .cell) { color: #333; font-weight: 700; padding: 0 12px; }
.event-table :deep(.el-table__cell) { font-size: 12px; color: #606266; padding: 0; height: 56px; }
.event-table :deep(.el-table__cell .cell) { color: #333; padding: 0 12px; line-height: 20px; }
</style>
