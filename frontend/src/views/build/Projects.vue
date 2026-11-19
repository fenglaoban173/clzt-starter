<template>
  <div v-loading="loading" class="page">
    <!-- 筛选区：标签内嵌在下拉框内，顺序与线上一致 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <!-- 项目名称 / 项目ID + 关键词 -->
        <div class="name-filter">
          <el-select v-model="filters.nameType" class="f-name-type">
            <el-option label="项目名称" value="name" />
            <el-option label="项目ID" value="id" />
          </el-select>
          <el-input v-model="filters.keyword" class="f-keyword" placeholder="请输入关键词" clearable @keyup.enter="onSearch" />
          <el-button class="f-search-btn" title="搜索" @click="onSearch"><el-icon><Search /></el-icon></el-button>
        </div>

        <!-- 筛选项（顺序与线上一致） -->
        <template v-for="d in FILTER_DEFS" :key="d.key">
          <div v-if="d.kind === 'select'" class="f-item">
            <el-select
              v-model="filters[d.key]"
              class="f-box"
              :style="{ '--f-w': d.width + 'px' }"
              :title="filters[d.key]"
            >
              <template #prefix><span class="f-prefix">{{ d.label }}：</span></template>
              <el-option v-for="o in filterOptions(d)" :key="o" :label="o" :value="o" />
            </el-select>
            <button class="f-x" title="清除" @click="clearFilter(d)"><el-icon><Close /></el-icon></button>
          </div>

          <!-- 媒体账户：与线上一致，点击打开「选择媒体账户」弹窗 -->
          <div v-else-if="d.kind === 'account'" class="f-item">
            <el-input
              v-model="filters[d.key]"
              class="f-box f-input f-account"
              :style="{ '--f-w': d.width + 'px' }"
              :placeholder="d.def"
              :title="filters[d.key]"
              readonly
              @click="openAccountPicker"
            >
              <template #prefix><span class="f-prefix">{{ d.label }}：</span></template>
            </el-input>
            <button class="f-x" title="清除" @click="clearFilter(d)"><el-icon><Close /></el-icon></button>
          </div>

          <!-- 创意素材：与线上一致，点击打开「素材查询」弹窗 -->
          <div v-else-if="d.kind === 'material'" class="f-item">
            <el-input
              v-model="filters[d.key]"
              class="f-box f-input f-material"
              :style="{ '--f-w': d.width + 'px' }"
              :placeholder="d.placeholder"
              :title="filters[d.key]"
              readonly
              @click="openMaterialPicker"
            >
              <template #prefix><span class="f-prefix">{{ d.label }}：</span></template>
            </el-input>
            <button class="f-x" title="清除" @click="clearFilter(d)"><el-icon><Close /></el-icon></button>
          </div>

          <el-date-picker
            v-else-if="d.kind === 'daterange'"
            v-model="filters[d.key]"
            type="daterange"
            unlink-panels
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="f-date"
            :style="{ '--f-w': d.width + 'px' }"
          />

          <el-input
            v-else
            v-model="filters[d.key]"
            class="f-box f-input"
            :style="{ '--f-w': d.width + 'px' }"
            :placeholder="d.placeholder"
            clearable
          />
        </template>

        <div class="filter-actions">
          <el-button link type="primary" @click="resetFilters">清空</el-button>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </div>
      </div>
    </el-card>

    <!-- 列表 -->
    <el-card class="table-card" shadow="never">
      <div class="op-row">
        <div class="op-left">
          <el-select v-model="batchOp" class="batch-select" placeholder="批量操作" :disabled="!selected.length" @change="onBatchOp">
            <el-option v-for="op in BATCH_OPS" :key="op" :label="op" :value="op" />
          </el-select>
          <span v-if="selected.length" class="sel-tip">已选择{{ selected.length }}条项目</span>
        </div>
        <div class="op-right">
          <el-button class="light-btn" @click="openSyncDialog">手动同步</el-button>
          <el-button @click="onExport">导出数据</el-button>
          <el-dropdown v-if="templates.length" trigger="hover" @command="onTplCommand">
            <el-button @click="openCustomMetric"><el-icon><Operation /></el-icon>自定义指标</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="tpl in templates" :key="tpl.id" :command="tpl.id">
                  <span class="tpl-name">{{ tpl.name }}</span>
                  <el-icon class="tpl-del" title="删除模板" @click.stop="delTemplate(tpl)"><Delete /></el-icon>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button v-else @click="openCustomMetric"><el-icon><Operation /></el-icon>自定义指标</el-button>
        </div>
      </div>

      <el-table
        ref="tableRef"
        :data="rows"
        row-key="id"
        border
        style="margin-top: 12px"
        :row-class-name="rowClassName"
        @selection-change="onSelectionChange"
        @sort-change="onSortChange"
      >
        <!-- 选择列：表头为「全选框 + 批量选择范围」 -->
        <el-table-column type="selection" width="52" :selectable="(row) => !row.__total">
          <template #header>
            <div class="sel-head">
              <el-checkbox :model-value="allChecked" :indeterminate="halfChecked" @change="toggleSelectAll" />
              <el-dropdown trigger="click" @command="onScopeCommand">
                <span class="scope-caret" title="选择范围"><el-icon><CaretBottom /></el-icon></span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="page">当前页</el-dropdown-item>
                    <el-dropdown-item command="50">前50页</el-dropdown-item>
                    <el-dropdown-item command="all">全选</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>

        <!-- 启停开关 -->
        <el-table-column width="58" align="center" fixed="left">
          <template #default="{ row }">
            <el-switch v-if="!row.__total" v-model="row.enabled" size="small" @change="onToggle(row)" />
          </template>
        </el-table-column>

        <!-- 项目名称 + 项目ID -->
        <el-table-column label="项目" fixed="left" min-width="250">
          <template #default="{ row }">
            <div v-if="row.__total" class="total-label">合计(缓存时间：{{ cacheTime }})</div>
            <div v-else class="proj-cell">
              <a class="link ellipsis" :title="row.name" @click="onDetail(row)">{{ row.name }}</a>
              <div class="proj-id">ID：{{ row.campaign_id }}</div>
            </div>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" fixed="left" width="90">
          <template #default="{ row }">
            <a v-if="!row.__total" class="link" @click="onDetail(row)">详情</a>
          </template>
        </el-table-column>

        <!-- 数据列：由「自定义指标」选中的指标及顺序驱动 -->
        <el-table-column
          v-for="col in tableColumns"
          :key="col.key"
          :label="col.label"
          :prop="col.prop"
          :width="col.width"
          :align="col.align"
          :sortable="col.sortable ? 'custom' : false"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <template v-if="col.type === 'status'">
              <span v-if="!row.__total" class="status-text" :class="row.status === 'enabled' ? 'st-green' : 'st-gray'">
                {{ row.status === 'enabled' ? '投放中' : '已暂停' }}
              </span>
            </template>
            <template v-else-if="col.type === 'number' || col.type === 'computed'">{{ fmtMetric(row, col) }}</template>
            <template v-else-if="col.type === 'dash'">{{ row.__total ? '' : '--' }}</template>
            <template v-else>{{ row.__total ? '' : (row[col.prop] || '--') }}</template>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pager"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        :current-page="pagination.current"
        :page-size="pagination.pageSize"
        :page-sizes="[20, 50, 100]"
        @current-change="onPage"
        @size-change="onSizeChange"
      />
    </el-card>

    <!-- 自定义指标 -->
    <CustomMetricDialog
      v-model="metricVisible"
      :catalog="PROJECT_METRIC_CATALOG"
      :model-keys="metricSel"
      @apply="onMetricApply"
      @save-template="onSaveTemplate"
    />

    <!-- 素材查询（创意素材选择器） -->
    <MaterialPickerDialog
      v-model="materialVisible"
      :selected-ids="materialIds"
      @submit="onMaterialSubmit"
    />

    <!-- 选择媒体账户（媒体账户查询条件选择器，版式对齐线上） -->
    <MediaAccountPickerDialog
      v-model="accountVisible"
      :accounts="accountList"
      :selected-ids="accountIds"
      @submit="onAccountSubmit"
    />

    <!-- 手动同步：同步项目与广告 -->
    <SyncProjectDialog v-model="syncVisible" @confirm="onSyncConfirm" />

    <!-- 项目详情（点击项目名称 / 「详情」打开，与线上一致） -->
    <ProjectDetailDrawer
      v-model="detailVisible"
      :row="detailRow"
      @toggle="onDetailToggle"
      @view-ads="onViewAds"
    />

    <!-- 批量操作弹窗（表单字段对齐巨量引擎开放平台接口） -->
    <BatchOpDialog v-model="batchVisible" scope="project" :op="batchOpName" :rows="batchRows" @confirm="onBatchConfirm" />

    <!-- 批量修改项目出价（版式对齐线上：修改规则 / 出价 / 项目列表） -->
    <ProjectBidDialog v-model="bidVisible" :projects="batchRows" @confirm="onBidConfirm" />

    <!-- 批量修改项目深度出价（版式对齐线上：修改规则 / 深度出价 / 项目列表） -->
    <ProjectDeepBidDialog v-model="deepBidVisible" :projects="batchRows" @confirm="onDeepBidConfirm" />

    <!-- 批量修改项目日预算（版式对齐线上：修改规则 / 预算 / 项目列表） -->
    <ProjectBudgetDialog v-model="budgetVisible" :projects="batchRows" @confirm="onBudgetConfirm" />

    <!-- 批量修改时段（版式对齐线上：修改规则 / 生效时间 / 投放时段栅格 + 已选择时段文字版） -->
    <ProjectScheduleDialog v-model="scheduleVisible" :projects="batchRows" @confirm="onScheduleConfirm" />

    <!-- 批量修改投放时间（版式对齐线上：投放时间 / 结束日期） -->
    <ProjectDeliveryTimeDialog v-model="deliveryTimeVisible" :projects="batchRows" @confirm="onDeliveryTimeConfirm" />

    <!-- 修改应用商店下载（版式对齐线上：开启提示 / 应用商店下载） -->
    <ProjectAppStoreDialog v-model="appStoreVisible" :projects="batchRows" @confirm="onAppStoreConfirm" />

    <!-- 修改直达链接（版式对齐线上：直达链接输入 + 字数统计） -->
    <ProjectDirectLinkDialog v-model="directLinkVisible" :projects="batchRows" @confirm="onDirectLinkConfirm" />

    <!-- 修改第三方监测链接（版式对齐线上：六类监测链接的开启开关 + 地址输入） -->
    <ProjectThirdTrackDialog v-model="thirdTrackVisible" :projects="batchRows" @confirm="onThirdTrackConfirm" />

    <!-- 修改定向（版式对齐线上：运营商定向 + 修改后定向包） -->
    <ProjectTargetingDialog v-model="targetingVisible" :projects="batchRows" @confirm="onTargetingConfirm" />
  </div>
</template>

<script setup>
import { onMounted, ref, reactive, computed } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { CaretBottom, Close, Delete, Operation, Search } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { buildApi, mediaApi } from '@/api/media';
import CustomMetricDialog from '@/views/media/components/CustomMetricDialog.vue';
import MaterialPickerDialog from './components/MaterialPickerDialog.vue';
import MediaAccountPickerDialog from './components/MediaAccountPickerDialog.vue';
import SyncProjectDialog from './components/SyncProjectDialog.vue';
import ProjectDetailDrawer from './components/ProjectDetailDrawer.vue';
import BatchOpDialog from './components/BatchOpDialog.vue';
import ProjectBidDialog from './components/ProjectBidDialog.vue';
import ProjectDeepBidDialog from './components/ProjectDeepBidDialog.vue';
import ProjectBudgetDialog from './components/ProjectBudgetDialog.vue';
import ProjectScheduleDialog from './components/ProjectScheduleDialog.vue';
import ProjectDeliveryTimeDialog from './components/ProjectDeliveryTimeDialog.vue';
import ProjectAppStoreDialog from './components/ProjectAppStoreDialog.vue';
import ProjectDirectLinkDialog from './components/ProjectDirectLinkDialog.vue';
import ProjectThirdTrackDialog from './components/ProjectThirdTrackDialog.vue';
import ProjectTargetingDialog from './components/ProjectTargetingDialog.vue';
import {
  CL_PROJECTS, OPTIMIZERS, OPT_GOALS, DEEP_OPT_GOALS, DEEP_OPT_MODES,
  ACCOUNT_SUBJECTS, PURPOSES, PROJECT_DELIVERY_MODES, PROJECT_STATUSES, PROJECT_AD_TYPES,
  STAR_FLAGS, PLATFORMS, BATCH_OPS,
} from '@/mock/projectFilters';
import {
  PROJECT_METRIC_CATALOG,
  PROJECT_METRIC_MAP,
  PROJECT_DEFAULT_METRICS,
  loadProjectTemplates,
  saveProjectTemplates,
} from './projectMetrics';

const route = useRoute();
const media = computed(() => route.query.media || 'upgrade');

const loading = ref(false);
const all = ref([]);
const rows = ref([]);
const selected = ref([]);
const batchOp = ref('');
const batchOpName = ref('');
const batchRows = ref([]);
const batchVisible = ref(false);
const bidVisible = ref(false);
const deepBidVisible = ref(false);
const budgetVisible = ref(false);
const scheduleVisible = ref(false);
const deliveryTimeVisible = ref(false);
const appStoreVisible = ref(false);
const directLinkVisible = ref(false);
const thirdTrackVisible = ref(false);
const targetingVisible = ref(false);
const tableRef = ref(null);
const page = ref(1);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });
const sortState = reactive({ prop: '', order: '' });
const cacheTime = ref(dayjs().format('HH:mm:ss'));

// ---------- 筛选项定义（顺序与线上一致） ----------
// kind: select 下拉 / input 输入框 / daterange 日期区间
// def：未选择时的默认展示文案（与线上一致，如「所有产品」「不限」）
// options：候选项（与创量项目列表页下拉内容一致）；缺省时从当前列表数据中去重取值
const FILTER_DEFS = [
  { key: 'clProject', label: '智投项目', kind: 'select', def: '全部', width: 200, source: 'project', options: CL_PROJECTS },
  { key: 'optimizer', label: '优化师', kind: 'select', def: '所有', width: 180, source: 'optimizer', options: OPTIMIZERS },
  { key: 'optGoal', label: '优化目标', kind: 'select', def: '所有', width: 200, source: 'opt_goal', options: OPT_GOALS },
  { key: 'deepGoal', label: '深度优化目标', kind: 'select', def: '所有', width: 220, source: 'deep_goal', options: DEEP_OPT_GOALS },
  { key: 'deepMode', label: '深度优化方式', kind: 'select', def: '所有', width: 220, source: 'deep_mode', options: DEEP_OPT_MODES },
  { key: 'subject', label: '账户主体', kind: 'select', def: '所有主体', width: 240, source: 'subject', options: ACCOUNT_SUBJECTS },
  { key: 'account', label: '媒体账户', kind: 'account', def: '所有账户', width: 240 },
  { key: 'purpose', label: '推广目的', kind: 'select', def: '所有推广目的', width: 240, source: 'purpose', options: PURPOSES },
  { key: 'deliveryMode', label: '投放模式', kind: 'select', def: '全部', width: 200, source: 'delivery_mode', options: PROJECT_DELIVERY_MODES },
  { key: 'status', label: '状态', kind: 'select', def: '不限', width: 180, source: 'status', options: PROJECT_STATUSES },
  { key: 'createTime', label: '创建时间', kind: 'daterange', width: 300 },
  { key: 'adType', label: '广告类型', kind: 'select', def: '不限', width: 200, source: 'ad_type', options: PROJECT_AD_TYPES },
  { key: 'star', label: '星广联投', kind: 'select', def: '全部', width: 180, source: 'star', options: STAR_FLAGS },
  { key: 'starTaskId', label: '星广联任务ID', kind: 'input', placeholder: '请输入星广联任务ID', width: 220 },
  { key: 'platform', label: '平台', kind: 'select', def: '不限', width: 180, source: 'platform', options: PLATFORMS },
  { key: 'material', label: '创意素材', kind: 'material', def: '请选择素材', placeholder: '请选择素材', width: 200, source: 'material' },
  { key: 'goods', label: '关联商品', kind: 'select', def: '全部商品', width: 200, source: 'goods' },
];

const filters = reactive({
  nameType: 'name', keyword: '',
  clProject: '全部', optimizer: '所有',
  optGoal: '所有', deepGoal: '所有', deepMode: '所有',
  subject: '所有主体', account: '', purpose: '所有推广目的',
  deliveryMode: '全部', status: '不限', createTime: [], adType: '不限',
  star: '全部', starTaskId: '', platform: '不限', material: '', goods: '全部商品',
});

// 素材查询弹窗 + 已选素材
const materialVisible = ref(false);
const materialIds = ref([]);
const materialNames = ref([]);

// 选择媒体账户弹窗 + 已选媒体账户
const accountVisible = ref(false);
const accountIds = ref([]);
const accountNames = ref([]);
const accountList = ref([]);

// 状态：线上「未投放」下还有二级菜单（已暂停 / 项目超出预算 / 未达投放时间 / 不在投放时段）
const STATUS_MATCH = { 启用中: 'enabled', 未投放: 'disabled' };
const STATUS_EMPTY = ['已删除', '已完成'];
// 星广联投：是 / 否
const STAR_MATCH = { 是: 'yes', 否: 'no' };

function filterOptions(def) {
  if (def.options) return def.options;
  return [...new Set(all.value.map((p) => p[def.source]).filter((v) => v != null && v !== ''))];
}

function clearFilter(def) {
  if (def.kind === 'select') filters[def.key] = def.def;
  else if (def.kind === 'account') {
    filters[def.key] = '';
    accountIds.value = [];
    accountNames.value = [];
  } else if (def.kind === 'material') {
    filters[def.key] = '';
    materialIds.value = [];
    materialNames.value = [];
  } else if (def.kind === 'daterange') filters[def.key] = [];
  else filters[def.key] = '';
}

// ---------- 筛选 ----------
function applyFilter() {
  let list = all.value;
  // 下拉类筛选
  FILTER_DEFS.forEach((d) => {
    if (d.kind !== 'select') return;
    const v = filters[d.key];
    if (!v || v === d.def) return;
    if (d.source === 'status') {
      if (STATUS_MATCH[v]) list = list.filter((p) => p.status === STATUS_MATCH[v]);
      else if (STATUS_EMPTY.includes(v)) list = [];
      return;
    }
    if (d.source === 'star') {
      if (STAR_MATCH[v]) list = list.filter((p) => p.star === STAR_MATCH[v]);
      return;
    }
    list = list.filter((p) => p[d.source] === v);
  });
  // 关键词
  if (filters.keyword) {
    const kw = filters.keyword.trim().toLowerCase();
    list = list.filter((p) => {
      if (filters.nameType === 'id') return String(p.campaign_id || '').toLowerCase().includes(kw);
      return String(p.name || '').toLowerCase().includes(kw);
    });
  }
  // 创建时间区间
  if (filters.createTime && filters.createTime.length === 2) {
    const [from, to] = filters.createTime;
    list = list.filter((p) => {
      const d = String(p.created_at || '').slice(0, 10);
      return d >= from && d <= to;
    });
  }
  // 星广联任务ID
  if (filters.starTaskId) {
    const kw = filters.starTaskId.trim().toLowerCase();
    list = list.filter((p) => String(p.star_task_id || '').toLowerCase().includes(kw));
  }
  // 创意素材（素材查询弹窗选择）
  if (materialNames.value.length) {
    list = list.filter((p) => materialNames.value.includes(p.material));
  }
  // 媒体账户（选择媒体账户弹窗选择）
  if (accountNames.value.length) {
    list = list.filter((p) => accountNames.value.includes(p.account_name));
  }
  // 排序
  if (sortState.prop && sortState.order) {
    const dir = sortState.order === 'ascending' ? 1 : -1;
    list = [...list].sort((x, y) => ((Number(x[sortState.prop]) || 0) - (Number(y[sortState.prop]) || 0)) * dir);
  }
  return list;
}

// ---------- 合计行 ----------
function buildTotal(list) {
  const sum = (k) => list.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const avg = (k) => (list.length ? +(list.reduce((s, r) => s + (Number(r[k]) || 0), 0) / list.length).toFixed(2) : 0);
  const cost = sum('stat_cost');
  const show = sum('show_cnt');
  const click = sum('click_cnt');
  const convert = sum('convert_cnt');
  const deep = sum('deep_cnt');
  return {
    __total: true,
    id: '__total',
    stat_cost: cost,
    pay_roi: avg('pay_roi'),
    game_roi: avg('game_roi'),
    cpm: show ? +((cost / show) * 1000).toFixed(2) : 0,
    cpc: click ? +(cost / click).toFixed(2) : 0,
    deep_bid: avg('deep_bid'),
    budget: sum('budget'),
    bid: avg('bid'),
    show_cnt: show,
    click_cnt: click,
    ctr: show ? +((click / show) * 100).toFixed(2) : 0,
    convert_cnt: convert,
    convert_cost: convert ? +(cost / convert).toFixed(2) : 0,
    convert_rate: click ? +((convert / click) * 100).toFixed(2) : 0,
    deep_cnt: deep,
    deep_cost: deep ? +(cost / deep).toFixed(2) : 0,
    deep_rate: click ? +((deep / click) * 100).toFixed(2) : 0,
  };
}

// ---------- 数据 ----------
// 媒体账户列表（选择媒体账户弹窗用）
async function loadAccounts() {
  if (accountList.value.length) return;
  const res = await mediaApi.accounts();
  accountList.value = (res.data?.list || []).filter((a) => (a.media || 'upgrade') === media.value);
}

// 「查看项目」跳转过来时：URL 携带 account_id，自动定位到该媒体账户并过滤
const accountQueryDone = ref(false);
async function applyAccountQuery() {
  const id = route.query.account_id;
  if (!id || accountQueryDone.value) return;
  accountQueryDone.value = true;
  await loadAccounts();
  const acc = accountList.value.find((a) => String(a.advertiser_id) === String(id));
  if (acc) {
    filters.account = acc.name;
    accountIds.value = [acc.advertiser_id];
    accountNames.value = [acc.name];
  }
}

async function load() {
  loading.value = true;
  try {
    await loadAccounts();
    await applyAccountQuery();
    const res = await buildApi.projects({ media: media.value });
    all.value = (res.data?.list || []).map((p) => ({ ...p, enabled: p.status === 'enabled' }));
    const filtered = applyFilter();
    pagination.total = filtered.length;
    const pageRows = filtered.slice((page.value - 1) * pagination.pageSize, page.value * pagination.pageSize)
      .map((p) => ({ ...p }));
    cacheTime.value = dayjs().format('HH:mm:ss');
    rows.value = [buildTotal(filtered), ...pageRows];
  } finally {
    loading.value = false;
  }
}

function onPage(p) { page.value = p; load(); }
function onSizeChange(s) { pagination.pageSize = s; page.value = 1; load(); }
function onSearch() { page.value = 1; load(); }
function onSelectionChange(list) { selected.value = list; }
function rowClassName({ row }) { return row.__total ? 'total-row' : ''; }
function onSortChange({ prop, order }) {
  sortState.prop = prop || '';
  sortState.order = order || '';
  load();
}

// ---------- 选择 ----------
const pageRows = computed(() => rows.value.filter((r) => !r.__total));
const allChecked = computed(() => pageRows.value.length > 0 && pageRows.value.every((r) => selected.value.includes(r)));
const halfChecked = computed(() => !allChecked.value && pageRows.value.some((r) => selected.value.includes(r)));

function toggleSelectAll(val) {
  tableRef.value?.toggleAllSelection(val);
}

function onScopeCommand(cmd) {
  if (cmd === 'page') {
    tableRef.value?.clearSelection();
    pageRows.value.forEach((r) => tableRef.value?.toggleRowSelection(r, true));
    ElMessage.info('已选择当前页项目');
  } else if (cmd === '50') {
    ElMessage.info('原型：已选择前 50 页项目');
  } else {
    ElMessage.info('原型：已选择全部项目');
  }
}

// ---------- 数值格式化 ----------
function fmtMetric(row, col) {
  const v = row[col.prop];
  if (v == null || Number.isNaN(Number(v))) return '';
  const digits = col.digits ?? 2;
  return digits ? Number(v).toFixed(digits) : String(Math.round(Number(v)));
}

// ---------- 自定义指标 ----------
const metricVisible = ref(false);
const templates = ref(loadProjectTemplates());
const metricSel = ref([...PROJECT_DEFAULT_METRICS]);

// 当前展示的列：按已选指标顺序渲染（项目名称 / 项目ID 由左侧固定列承载）
const tableColumns = computed(() => metricSel.value
  .map((k) => PROJECT_METRIC_MAP[k])
  .filter(Boolean));

function openCustomMetric() { metricVisible.value = true; }

function onMetricApply(keys) {
  metricSel.value = keys.filter((k) => !['name', 'campaign_id'].includes(k));
  ElMessage.success(`原型：已应用自定义指标（${metricSel.value.length} 个指标）`);
}

function onSaveTemplate({ name, keys }) {
  const list = [...templates.value];
  const exist = list.find((t) => t.name === name);
  if (exist) exist.keys = [...keys];
  else list.push({ id: `tpl_${Date.now()}`, name, keys: [...keys] });
  templates.value = list;
  saveProjectTemplates(list);
  ElMessage.success(`原型：已保存自定义指标模板「${name}」`);
}

function onTplCommand(id) {
  const tpl = templates.value.find((t) => t.id === id);
  if (!tpl) return;
  metricSel.value = tpl.keys.filter((k) => !['name', 'campaign_id'].includes(k));
  ElMessage.success(`原型：已应用自定义指标模板「${tpl.name}」`);
}

function delTemplate(tpl) {
  templates.value = templates.value.filter((t) => t.id !== tpl.id);
  saveProjectTemplates(templates.value);
  ElMessage.success(`原型：已删除自定义指标模板「${tpl.name}」`);
}

// ---------- 其他 ----------
function resetFilters() {
  FILTER_DEFS.forEach((d) => {
    if (d.kind === 'select') filters[d.key] = d.def;
    else if (d.kind === 'account') {
      filters[d.key] = '';
      accountIds.value = [];
      accountNames.value = [];
    } else if (d.kind === 'material') {
      filters[d.key] = '';
      materialIds.value = [];
      materialNames.value = [];
    } else if (d.kind === 'daterange') filters[d.key] = [];
    else filters[d.key] = '';
  });
  filters.nameType = 'name';
  filters.keyword = '';
  page.value = 1;
  load();
}

// ---------- 选择媒体账户 ----------
function openAccountPicker() {
  accountVisible.value = true;
}
function onAccountSubmit(picked) {
  accountIds.value = picked.map((a) => a.advertiser_id);
  accountNames.value = picked.map((a) => a.name);
  filters.account = accountNames.value.length ? accountNames.value.join('、') : '';
  page.value = 1;
  load();
}

// ---------- 素材查询 ----------
function openMaterialPicker() {
  materialVisible.value = true;
}
function onMaterialSubmit(picked) {
  materialIds.value = picked.map((m) => m.id);
  materialNames.value = picked.map((m) => m.name);
  filters.material = materialNames.value.length ? materialNames.value.join('、') : '';
  page.value = 1;
  load();
}

// ---------- 手动同步（同步项目与广告） ----------
const syncVisible = ref(false);
function openSyncDialog() {
  syncVisible.value = true;
}
function onSyncConfirm({ accounts, range }) {
  const from = range && range.length === 2 ? range[0] : '不限';
  const to = range && range.length === 2 ? range[1] : '不限';
  ElMessage.success(`原型：已对 ${accounts.length} 个媒体账户同步项目与广告（${from} 至 ${to}）`);
  load();
}
function onExport() { ElMessage.info('原型：导出当前筛选结果（异步报表）'); }

// 批量操作：
// · 启用 / 暂停 / 删除 没有可填参数 → 前端框架标准二次确认弹窗（ElMessageBox）
// · 其余 15 项按表单弹窗处理（字段见 src/api/oceanengine.js）
const PROJECT_CONFIRM_OPS = {
  启用: {
    title: '启用项目',
    message: (n) => `确定要启用所选的 ${n} 个项目吗？`,
    done: (n) => `原型：已启用 ${n} 个项目`,
  },
  暂停: {
    title: '暂停项目',
    message: (n) => `确定要暂停所选的 ${n} 个项目吗？暂停后项目将不再投放。`,
    done: (n) => `原型：已暂停 ${n} 个项目`,
  },
  删除: {
    title: '删除项目',
    message: (n) => `确定要删除所选的 ${n} 个项目吗？删除后不可恢复。`,
    type: 'warning',
    done: (n) => `原型：已删除 ${n} 个项目`,
  },
};

async function onBatchOp(op) {
  batchOp.value = '';
  if (!selected.value.length) {
    ElMessage.warning('请先选择项目');
    return;
  }
  const conf = PROJECT_CONFIRM_OPS[op];
  if (conf) {
    const n = selected.value.length;
    try {
      await ElMessageBox.confirm(conf.message(n), conf.title, {
        type: conf.type || 'info',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        closeOnClickModal: false,
      });
    } catch (e) {
      return; // 取消
    }
    ElMessage.success(conf.done(n));
    load();
    return;
  }
  batchOpName.value = op;
  batchRows.value = selected.value.map((r) => ({ ...r }));
  // 「修改出价」按线上版式单独成弹窗（修改规则 / 出价 / 项目列表）
  if (op === '修改出价') {
    bidVisible.value = true;
    return;
  }
  // 「修改深度出价」按出价弹窗版式单独成弹窗（修改规则 / 深度出价 / 项目列表）
  if (op === '修改深度出价') {
    deepBidVisible.value = true;
    return;
  }
  // 「修改预算」按线上版式单独成弹窗（修改规则 / 预算 / 项目列表）
  if (op === '修改预算') {
    budgetVisible.value = true;
    return;
  }
  // 「修改项目排期」按线上版式单独成「批量修改时段」弹窗（修改规则 / 生效时间 / 投放时段栅格）
  if (op === '修改项目排期') {
    scheduleVisible.value = true;
    return;
  }
  // 「批量修改投放时间」按线上版式单独成弹窗（投放时间 / 结束日期）
  if (op === '批量修改投放时间') {
    deliveryTimeVisible.value = true;
    return;
  }
  // 「修改应用商店下载」按线上版式单独成弹窗（开启提示 / 应用商店下载）
  if (op === '修改应用商店下载') {
    appStoreVisible.value = true;
    return;
  }
  // 「修改直达链接」按线上版式单独成弹窗（直达链接输入 + 字数统计）
  if (op === '修改直达链接') {
    directLinkVisible.value = true;
    return;
  }
  // 「修改监测活动」按线上版式单独成「修改第三方监测链接」弹窗（六类链接开关 + 地址）
  if (op === '修改监测活动') {
    thirdTrackVisible.value = true;
    return;
  }
  // 「修改定向包」按线上版式单独成「修改定向」弹窗（运营商定向 + 修改后定向）
  if (op === '修改定向包') {
    targetingVisible.value = true;
    return;
  }
  batchVisible.value = true;
}

/** 批量修改项目出价提交 */
function onBidConfirm() {
  load();
}

/** 批量修改项目深度出价提交 */
function onDeepBidConfirm() {
  load();
}

/** 批量修改项目日预算提交 */
function onBudgetConfirm() {
  load();
}

/** 批量修改时段提交 */
function onScheduleConfirm() {
  load();
}

/** 批量修改投放时间提交 */
function onDeliveryTimeConfirm() {
  load();
}

/** 修改应用商店下载提交 */
function onAppStoreConfirm() {
  load();
}

/** 修改直达链接提交 */
function onDirectLinkConfirm() {
  load();
}

/** 修改第三方监测链接提交 */
function onThirdTrackConfirm() {
  load();
}

/** 修改定向提交 */
function onTargetingConfirm() {
  load();
}

function onBatchConfirm({ op, rows: list }) {
  ElMessage.success(`原型：已对 ${list.length} 个项目执行「${op}」`);
  load();
}

// ---------- 项目详情 ----------
const detailVisible = ref(false);
const detailRow = ref({});
function onDetail(record) {
  detailRow.value = record;
  detailVisible.value = true;
}
function onDetailToggle(record, enabled) {
  if (!record) return;
  record.status = enabled ? 'enabled' : 'disabled';
  record.enabled = enabled;
  ElMessage.info(`原型：${enabled ? '启用' : '暂停'}项目（不提交真实接口）`);
}
function onViewAds(record) {
  ElMessage.info(`原型：查看项目「${record?.name || ''}」下广告`);
}
function onToggle(record) {
  record.status = record.enabled ? 'enabled' : 'disabled';
  ElMessage.info(`原型：${record.enabled ? '启用' : '暂停'}项目（不提交真实接口）`);
}

onMounted(load);
</script>

<style scoped>
.page {
  --el-font-size-base: 15px;
  --el-font-size-small: 14px;
  --el-font-size-extra-small: 13px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 15px;
}

/* 筛选行：标签内嵌在下拉框内 */
.filter-card { border-radius: 4px; }
.filter-row { gap: 8px !important; margin-bottom: 0 !important; }
.f-prefix { font-size: 15px; color: #4e5969; white-space: nowrap; }
.filter-card .f-box { width: var(--f-w, 220px) !important; min-width: 0; }
.filter-card .f-date { width: var(--f-w, 300px) !important; }
.f-item { display: flex; align-items: center; }
.f-x {
  width: 24px;
  height: 32px;
  margin-left: -1px;
  padding: 0;
  border: 1px solid #e5e6eb;
  border-left: none;
  border-radius: 0 4px 4px 0;
  background: #fff;
  color: #86909c;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.f-x:hover { color: #4e5969; }
.name-filter { display: flex; align-items: center; }
.filter-card .f-name-type { width: 120px !important; border-radius: 4px 0 0 4px; }
.filter-card .f-keyword { width: 220px !important; border-radius: 0; border-left: none; }
.f-search-btn {
  width: 40px;
  padding: 8px 0;
  margin-left: 0;
  border-radius: 0 4px 4px 0;
  border-left: none;
  color: #4e5969;
}
.filter-actions { margin-left: auto; display: flex; align-items: center; gap: 12px; }

/* 操作行 */
.op-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.op-left, .op-right { display: flex; align-items: center; gap: 12px; }
.batch-select { width: 160px !important; }
.sel-tip { font-size: 14px; color: #86909c; }
.light-btn {
  --el-button-bg-color: #edf4ff;
  --el-button-border-color: #edf4ff;
  --el-button-hover-bg-color: #dce9ff;
  --el-button-hover-border-color: #dce9ff;
  --el-button-text-color: #546ef7;
  --el-button-hover-text-color: #3b5bdb;
}
.tpl-name { margin-right: 8px; }
.tpl-del { color: #c9cdd4; }
.tpl-del:hover { color: #f53f3f; }

/* 表格 */
.sel-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
/* 表头字段不换行：排序箭头（.caret-wrapper）与字段名同行，列宽已按实测宽度加宽 */
.table-card :deep(.el-table__header-wrapper th .cell) { white-space: nowrap; }
.scope-caret { color: #86909c; cursor: pointer; }
.scope-caret:hover { color: #4e5969; }
/* 表格内链接：项目名称与「详情」统一为蓝色 */
.table-card .link { color: #2563eb; cursor: pointer; }
.proj-cell .ellipsis { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.proj-id { font-size: 13px; color: #86909c; margin-top: 2px; }
.total-label { font-size: 15px; font-weight: 600; color: #1d2129; }
.page :deep(.total-row .el-checkbox) { visibility: hidden; }
.status-text { font-size: 15px; }
.st-green { color: #00b42a; }
.st-gray { color: #86909c; }
.pager { margin-top: 16px; justify-content: flex-start; }
</style>
