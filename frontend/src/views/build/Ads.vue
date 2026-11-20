<template>
  <div v-loading="loading" class="page">
    <!-- 查询条件：标签内嵌在下拉框内，顺序与线上一致 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <div class="filter-main">
          <!-- 广告名称 / 广告ID + 关键词 -->
          <div class="name-filter">
            <el-select v-model="filters.nameType" class="f-name-type">
              <el-option label="广告名称" value="name" />
              <el-option label="广告ID" value="id" />
            </el-select>
            <el-input v-model="filters.keyword" class="f-keyword" placeholder="请输入关键词" clearable @keyup.enter="onSearch" />
            <el-button class="f-search-btn" title="搜索" @click="onSearch"><el-icon><Search /></el-icon></el-button>
          </div>

          <!-- 筛选项（顺序与线上一致） -->
          <template v-for="d in visibleFilters" :key="d.key">
            <!-- 多选下拉 -->
            <div v-if="d.kind === 'multi'" class="f-item">
              <el-select
                v-model="filters[d.key]"
                multiple
                collapse-tags
                collapse-tags-tooltip
                :filterable="!!d.filterable"
                class="f-box"
                :style="{ '--f-w': d.width + 'px' }"
                :placeholder="d.def"
                :title="multiTitle(d)"
              >
                <template #prefix><span class="f-prefix">{{ d.label }}：</span></template>
                <template v-if="d.searchIcon" #suffix><el-icon class="f-search-ico"><Search /></el-icon></template>
                <el-option v-for="o in filterOptions(d)" :key="o" :label="o" :value="o" />
              </el-select>
              <button class="f-x" title="清除" @click="clearFilter(d)"><el-icon><Close /></el-icon></button>
            </div>

            <!-- 单选下拉 -->
            <div v-else-if="d.kind === 'select'" class="f-item">
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

            <!-- 媒体账户：与项目页一致，点击打开「选择媒体账户」弹窗 -->
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

            <!-- 创意素材：与项目页一致，点击打开「素材查询」弹窗 -->
            <div v-else-if="d.kind === 'material'" class="f-item">
              <el-input
                v-model="filters[d.key]"
                class="f-box f-input f-material"
                :style="{ '--f-w': d.width + 'px' }"
                :placeholder="d.def"
                :title="filters[d.key]"
                readonly
                @click="openMaterialPicker"
              >
                <template #prefix><span class="f-prefix">{{ d.label }}：</span></template>
              </el-input>
              <button class="f-x" title="清除" @click="clearFilter(d)"><el-icon><Close /></el-icon></button>
            </div>

            <!-- 创建日期：标签 + 日期区间（同一外框内，与项目页一致） -->
            <div v-else-if="d.kind === 'daterange'" class="f-item f-date-item" :style="{ '--f-w': d.width + 'px' }">
              <span class="f-prefix">{{ d.label }}：</span>
              <el-date-picker
                v-model="filters[d.key]"
                type="daterange"
                unlink-panels
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                class="f-date"
              />
            </div>

            <!-- 输入框 -->
            <el-input
              v-else
              v-model="filters[d.key]"
              class="f-box f-input"
              :style="{ '--f-w': d.width + 'px' }"
              :placeholder="d.placeholder"
              clearable
            />
          </template>
        </div>

        <!-- 查询：靠右、垂直居中（与线上一致） -->
        <div class="filter-actions">
          <el-button type="primary" @click="onSearch">查询</el-button>
        </div>
      </div>
    </el-card>

    <!-- 列表 -->
    <el-card class="table-card" shadow="never">
      <div class="op-row">
        <div class="op-left">
          <el-select
            v-model="batchOp"
            class="batch-select"
            placeholder="批量操作"
            :disabled="!selected.length"
            @change="onBatchOp"
          >
            <el-option v-for="op in AD_BATCH_OPS" :key="op" :label="op" :value="op" />
          </el-select>
          <span v-if="selected.length" class="sel-tip">已选择{{ selected.length }}条广告计划</span>
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
        :data="tableData"
        row-key="id"
        border
        style="margin-top: 12px"
        :row-class-name="rowClassName"
        @selection-change="onSelectionChange"
        @sort-change="onSortChange"
      >
        <!-- 选择列：表头为「全选框 + 批量选择范围」 -->
        <el-table-column type="selection" width="60">
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

        <!-- 启停开关（线上为行内 el-switch，本地复刻该功能） -->
        <el-table-column width="72" align="center" fixed="left">
          <template #default="{ row }">
            <el-switch v-if="!row.__summary" v-model="row.enabled" size="small" @change="onToggle(row)" />
          </template>
        </el-table-column>

        <!-- 广告名称 + 广告ID（首行为「合计(缓存时间)」行） -->
        <el-table-column label="广告" fixed="left" width="220">
          <template #default="{ row }">
            <div class="ad-cell">
              <p v-if="row.__summary" class="ad-summary">合计</p>
              <template v-else>
                <p class="ad-name" :title="row.name">{{ row.name }}</p>
                <p class="ad-id" :title="row.ad_id">ID：{{ row.ad_id }}</p>
              </template>
            </div>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" fixed="left" width="120">
          <template #default="{ row }">
            <a v-if="!row.__summary" class="link" @click="onDetail(row)">详情</a>
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
              <span v-if="!row.__summary" class="status-text" :class="row.status === 'enabled' ? 'st-green' : 'st-gray'">
                {{ row.status === 'enabled' ? '投放中' : '已暂停' }}
              </span>
            </template>
            <template v-else-if="col.type === 'number' || col.type === 'computed'">
              <span class="num-cell">{{ row.__summary ? (summaryVals[col.key] || '') : fmtMetric(row, col) }}</span>
              <el-icon v-if="!row.__summary && editableCols.includes(col.key)" class="edit-icon" title="批量修改" @click="onEditCell(col, row)">
                <EditPen />
              </el-icon>
            </template>
            <template v-else-if="col.type === 'dash'">{{ '--' }}</template>
            <template v-else>{{ row.__summary ? '' : (row[col.prop] || '--') }}</template>
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
      :catalog="AD_METRIC_CATALOG"
      :model-keys="metricSel"
      @apply="onMetricApply"
      @save-template="onSaveTemplate"
    />

    <!-- 手动同步：同步项目与广告 -->
    <SyncProjectDialog v-model="syncVisible" @confirm="onSyncConfirm" />

    <!-- 批量操作弹窗（表单字段对齐巨量引擎开放平台接口） -->
    <BatchOpDialog v-model="batchVisible" scope="promotion" :op="batchOpName" :rows="batchRows" @confirm="onBatchConfirm" />

    <!-- 批量修改预算（按线上版式单独成弹窗：修改规则 / 预算 / 广告列表） -->
    <AdBudgetDialog v-model="budgetVisible" :rows="budgetRows" @confirm="onAdBudgetConfirm" />

    <AdBidDialog v-model="bidVisible" :rows="batchRows" @confirm="onAdBidConfirm" />
    <AdDeepBidDialog v-model="deepBidVisible" :rows="batchRows" @confirm="onAdDeepBidConfirm" />
    <AdRoiCoefficientDialog v-model="roiCoefficientVisible" :rows="batchRows" @confirm="onAdRoiCoefficientConfirm" />
    <AdDirectLinkDialog v-model="directLinkVisible" :rows="batchRows" @confirm="onAdDirectLinkConfirm" />
    <AdOneClickRaiseDialog v-model="oneClickRaiseVisible" :rows="batchRows" @confirm="onAdOneClickRaiseConfirm" />
    <AdNegativeWordDialog v-model="negativeWordVisible" :rows="batchRows" @confirm="onAdNegativeWordConfirm" />
    <AdRenameDialog v-model="renameVisible" :rows="batchRows" @confirm="onAdRenameConfirm" />
    <AdScheduleDialog v-model="scheduleVisible" :rows="batchRows" @confirm="onAdScheduleConfirm" />
    <AdLandingPageDialog v-model="landingPageVisible" :rows="batchRows" @confirm="onAdLandingPageConfirm" />

    <!-- 修改广告标题和素材（按线上版式单独成弹窗：修改创意标题 / 创意标题库 / 修改创意素材 / 选择素材） -->
    <AdTitleMaterialDialog v-model="titleMaterialVisible" :rows="batchRows" @confirm="onAdTitleMaterialConfirm" />

    <!-- 广告详情 -->
    <AdDetailDrawer v-model="detailVisible" :row="detailRow" @view-project="onViewProject" />

    <!-- 选择媒体账户（与项目页复用同一弹窗） -->
    <MediaAccountPickerDialog
      v-model="accountVisible"
      :accounts="accountList"
      :selected-ids="accountIds"
      @submit="onAccountSubmit"
    />

    <!-- 素材查询（与项目页复用同一弹窗） -->
    <MaterialPickerDialog
      v-model="materialVisible"
      :selected-ids="materialIds"
      @submit="onMaterialSubmit"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, reactive, computed } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { CaretBottom, Close, Delete, EditPen, Operation, Search } from '@element-plus/icons-vue';
import { buildApi, mediaApi } from '@/api/media';
import CustomMetricDialog from '@/views/media/components/CustomMetricDialog.vue';
import BatchOpDialog from './components/BatchOpDialog.vue';
import AdBudgetDialog from './components/AdBudgetDialog.vue';
import AdBidDialog from './components/AdBidDialog.vue';
import AdDeepBidDialog from './components/AdDeepBidDialog.vue';
import AdRoiCoefficientDialog from './components/AdRoiCoefficientDialog.vue';
import AdDirectLinkDialog from './components/AdDirectLinkDialog.vue';
import AdOneClickRaiseDialog from './components/AdOneClickRaiseDialog.vue';
import AdNegativeWordDialog from './components/AdNegativeWordDialog.vue';
import AdRenameDialog from './components/AdRenameDialog.vue';
import AdScheduleDialog from './components/AdScheduleDialog.vue';
import AdLandingPageDialog from './components/AdLandingPageDialog.vue';
import AdTitleMaterialDialog from './components/AdTitleMaterialDialog.vue';
import AdDetailDrawer from './components/AdDetailDrawer.vue';
import SyncProjectDialog from './components/SyncProjectDialog.vue';
import MaterialPickerDialog from './components/MaterialPickerDialog.vue';
import MediaAccountPickerDialog from './components/MediaAccountPickerDialog.vue';
import { AD_FILTER_DEFS, AD_BATCH_OPS } from '@/mock/adFilters';
import {
  AD_METRIC_CATALOG,
  AD_METRIC_MAP,
  AD_DEFAULT_METRICS,
  loadAdTemplates,
  saveAdTemplates,
} from './adMetrics';

const route = useRoute();

const loading = ref(false);
const all = ref([]);
const rows = ref([]);
const selected = ref([]);
const batchOp = ref('');
const batchOpName = ref('');
const batchRows = ref([]);
const batchVisible = ref(false);
const budgetVisible = ref(false);
const budgetRows = ref([]);
const bidVisible = ref(false);
const deepBidVisible = ref(false);
const roiCoefficientVisible = ref(false);
const directLinkVisible = ref(false);
const oneClickRaiseVisible = ref(false);
const negativeWordVisible = ref(false);
const renameVisible = ref(false);
const scheduleVisible = ref(false);
const landingPageVisible = ref(false);
const titleMaterialVisible = ref(false);
const tableRef = ref(null);
const page = ref(1);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });
const sortState = reactive({ prop: '', order: '' });

// 全部展示的筛选项（默认全部 21 项，与线上一致）
const visibleFilters = computed(() => AD_FILTER_DEFS);

// 多选筛选项的初值
const filters = reactive({
  nameType: 'name',
  keyword: '',
  clProject: [],
  optimizer: [],
  account: '',
  subject: [],
  purpose: '所有推广目的',
  deliveryMode: '全部',
  campaign: [],
  status: '不限',
  diagnosis: [],
  strategy: [],
  createTime: [],
  adType: '不限',
  learn: '不限',
  star: '全部',
  starTaskId: '',
  platform: '不限',
  optGoal: [],
  deepGoal: [],
  deepMode: [],
  material: '',
});

// ---------- 合计行 ----------
const summaryVals = computed(() => {
  const list = rows.value;
  const sum = (k) => list.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const stat_cost = sum('stat_cost');
  const show_cnt = sum('show_cnt');
  const click_cnt = sum('click_cnt');
  const convert_cnt = sum('convert_cnt');
  const deep_cnt = sum('deep_cnt');
  return {
    stat_cost: stat_cost.toFixed(2),
    show_cnt: String(show_cnt),
    cpm: show_cnt ? (stat_cost / show_cnt * 1000).toFixed(2) : '0.00',
    click_cnt: String(click_cnt),
    ctr: show_cnt ? `${(click_cnt / show_cnt * 100).toFixed(2)}%` : '0.00%',
    cpc: click_cnt ? (stat_cost / click_cnt).toFixed(2) : '0.00',
    convert_cnt: String(convert_cnt),
    convert_cost: convert_cnt ? (stat_cost / convert_cnt).toFixed(2) : '0.00',
    convert_rate: click_cnt ? `${(convert_cnt / click_cnt * 100).toFixed(2)}%` : '0.00%',
    deep_cnt: String(deep_cnt),
    deep_cost: deep_cnt ? (stat_cost / deep_cnt).toFixed(2) : '0.00',
    deep_rate: click_cnt ? `${(deep_cnt / click_cnt * 100).toFixed(2)}%` : '0.00%',
  };
});

// 表格数据：首行为合计行
const tableData = computed(() => ([
  { id: '__summary__', __summary: true },
  ...rows.value,
]));

function rowClassName({ row }) {
  return row.__summary ? 'ad-summary-row' : '';
}

// 状态：线上「投放中 / 未投放」为启停状态
const STATUS_MATCH = { 投放中: 'enabled', 未投放: 'disabled' };
const STATUS_EMPTY = ['已终止', '已完成', '已删除'];
// 星广联投：是 / 否
const STAR_MATCH = { 是: 'yes', 否: 'no' };

function filterOptions(def) {
  if (def.options) return def.options;
  if (def.source === 'campaign_name') {
    return [...new Set(all.value.map((a) => a.campaign_name).filter(Boolean))];
  }
  return [];
}

function multiTitle(def) {
  const v = filters[def.key];
  return Array.isArray(v) && v.length ? v.join('、') : def.def;
}

function clearFilter(def) {
  if (def.kind === 'multi') filters[def.key] = [];
  else if (def.kind === 'daterange') filters[def.key] = [];
  else if (def.kind === 'account') {
    filters[def.key] = '';
    accountIds.value = [];
    accountNames.value = [];
  } else if (def.kind === 'material') {
    filters[def.key] = '';
    materialIds.value = [];
    materialNames.value = [];
  } else filters[def.key] = def.def;
}

// ---------- 筛选 ----------
function applyFilter() {
  let list = all.value;
  AD_FILTER_DEFS.forEach((d) => {
    if (d.kind === 'multi') {
      const v = filters[d.key];
      if (!Array.isArray(v) || !v.length) return;
      list = list.filter((a) => v.includes(a[d.source] || a[d.key]));
      return;
    }
    // 媒体账户：按账户 ID（与项目页一致，选中账户后按 advertiser_id 过滤）
    if (d.kind === 'account') {
      if (!accountIds.value.length) return;
      list = list.filter((a) => accountIds.value.includes(String(a.advertiser_id)));
      return;
    }
    // 创意素材：按素材名过滤
    if (d.kind === 'material') {
      if (!materialNames.value.length) return;
      list = list.filter((a) => materialNames.value.includes(a.material));
      return;
    }
    if (d.kind !== 'select') return;
    const v = filters[d.key];
    if (!v || v === d.def) return;
    if (d.key === 'status') {
      if (STATUS_MATCH[v]) list = list.filter((a) => a.status === STATUS_MATCH[v]);
      else if (STATUS_EMPTY.includes(v)) list = [];
      return;
    }
    if (d.key === 'star') {
      if (STAR_MATCH[v]) list = list.filter((a) => a.star === STAR_MATCH[v]);
      return;
    }
    if (d.key === 'deliveryMode') {
      list = list.filter((a) => a.delivery_mode === v);
      return;
    }
    if (d.key === 'learn') {
      list = list.filter((a) => a.learn === v);
      return;
    }
    list = list.filter((a) => (d.source ? a[d.source] : a[d.key]) === v);
  });
  // 关键词（广告名称 / 广告ID）
  if (filters.keyword) {
    const kw = filters.keyword.trim().toLowerCase();
    list = list.filter((a) => (filters.nameType === 'id'
      ? String(a.ad_id || '').toLowerCase().includes(kw)
      : String(a.name || '').toLowerCase().includes(kw)));
  }
  // 创建时间区间
  if (filters.createTime && filters.createTime.length === 2) {
    const [from, to] = filters.createTime;
    list = list.filter((a) => {
      const d = String(a.created_at || '').slice(0, 10);
      return d >= from && d <= to;
    });
  }
  // 星广联任务ID
  if (filters.starTaskId) {
    const kw = filters.starTaskId.trim().toLowerCase();
    list = list.filter((a) => String(a.star_task_id || '').toLowerCase().includes(kw));
  }
  // 排序
  if (sortState.prop && sortState.order) {
    const dir = sortState.order === 'ascending' ? 1 : -1;
    list = [...list].sort((x, y) => ((Number(x[sortState.prop]) || 0) - (Number(y[sortState.prop]) || 0)) * dir);
  }
  return list;
}

// ---------- 数据 ----------
// 「查看广告」跳转过来时：URL 携带 account_id，自动定位到该媒体账户并过滤
const accountQueryDone = ref(false);
async function applyAccountQuery() {
  const id = route.query.account_id;
  if (!id || accountQueryDone.value) return;
  accountQueryDone.value = true;
  const res = await mediaApi.accounts();
  const acc = (res.data?.list || []).find((a) => String(a.advertiser_id) === String(id));
  if (acc) {
    accountIds.value = [acc.advertiser_id];
    accountNames.value = [acc.name];
    filters.account = acc.name;
  }
}

async function load() {
  loading.value = true;
  try {
    await applyAccountQuery();
    const res = await buildApi.ads();
    all.value = (res.data?.list || []).map((a) => ({ ...a, enabled: a.status === 'enabled' }));
    const filtered = applyFilter();
    pagination.total = filtered.length;
    rows.value = filtered
      .slice((page.value - 1) * pagination.pageSize, page.value * pagination.pageSize)
      .map((a) => ({ ...a }));
  } finally {
    loading.value = false;
  }
}

function onPage(p) { page.value = p; load(); }
function onSizeChange(s) { pagination.pageSize = s; page.value = 1; load(); }
function onSearch() { page.value = 1; load(); }
function onSelectionChange(list) { selected.value = list.filter((r) => !r.__summary); }
function onSortChange({ prop, order }) {
  sortState.prop = prop || '';
  sortState.order = order || '';
  load();
}

// ---------- 选择 ----------
const allChecked = computed(() => rows.value.length > 0 && rows.value.every((r) => selected.value.includes(r)));
const halfChecked = computed(() => !allChecked.value && rows.value.some((r) => selected.value.includes(r)));

function toggleSelectAll(val) {
  tableRef.value?.toggleAllSelection(val);
}

function onScopeCommand(cmd) {
  if (cmd === 'page') {
    tableRef.value?.clearSelection();
    rows.value.forEach((r) => tableRef.value?.toggleRowSelection(r, true));
    ElMessage.info('已选择当前页广告');
  } else if (cmd === '50') {
    ElMessage.info('原型：已选择前 50 页广告');
  } else {
    ElMessage.info('原型：已选择全部广告');
  }
}

// ---------- 数值格式化 ----------
function fmtMetric(row, col) {
  const v = row[col.prop];
  if (v == null || Number.isNaN(Number(v))) return '';
  const digits = col.digits ?? 2;
  const text = digits ? Number(v).toFixed(digits) : String(Math.round(Number(v)));
  return text + (col.suffix || '');
}

// ---------- 自定义指标 ----------
const metricVisible = ref(false);
const templates = ref(loadAdTemplates());
const metricSel = ref([...AD_DEFAULT_METRICS]);

// 当前展示的列：按已选指标顺序渲染（广告名称 / 广告ID 由左侧固定列承载）
const tableColumns = computed(() => metricSel.value
  .map((k) => AD_METRIC_MAP[k])
  .filter(Boolean));

function openCustomMetric() { metricVisible.value = true; }

function onMetricApply(keys) {
  metricSel.value = [...keys];
  ElMessage.success(`原型：已应用自定义指标（${metricSel.value.length} 个指标）`);
}

function onSaveTemplate({ name, keys }) {
  const list = [...templates.value];
  const exist = list.find((t) => t.name === name);
  if (exist) exist.keys = [...keys];
  else list.push({ id: `tpl_${Date.now()}`, name, keys: [...keys] });
  templates.value = list;
  saveAdTemplates(list);
  ElMessage.success(`原型：已保存自定义指标模板「${name}」`);
}

function onTplCommand(id) {
  const tpl = templates.value.find((t) => t.id === id);
  if (!tpl) return;
  metricSel.value = [...tpl.keys];
  ElMessage.success(`原型：已应用自定义指标模板「${tpl.name}」`);
}

function delTemplate(tpl) {
  templates.value = templates.value.filter((t) => t.id !== tpl.id);
  saveAdTemplates(templates.value);
  ElMessage.success(`原型：已删除自定义指标模板「${tpl.name}」`);
}

// ---------- 手动同步（同步项目与广告） ----------
const syncVisible = ref(false);
function openSyncDialog() { syncVisible.value = true; }
function onSyncConfirm({ accounts, range }) {
  const from = range && range.length === 2 ? range[0] : '不限';
  const to = range && range.length === 2 ? range[1] : '不限';
  ElMessage.success(`原型：已对 ${accounts.length} 个媒体账户同步项目与广告（${from} 至 ${to}）`);
  load();
}

function onExport() { ElMessage.info('原型：导出当前筛选结果（异步报表）'); }

// ---------- 选择媒体账户（与项目页复用同一弹窗） ----------
const accountVisible = ref(false);
const accountIds = ref([]);
const accountNames = ref([]);
const accountList = ref([]);

async function loadAccounts() {
  if (accountList.value.length) return;
  const res = await mediaApi.accounts();
  accountList.value = res.data?.list || [];
}

function openAccountPicker() {
  loadAccounts();
  accountVisible.value = true;
}

function onAccountSubmit(picked) {
  accountIds.value = (picked || []).map((a) => String(a.advertiser_id));
  accountNames.value = (picked || []).map((a) => a.name);
  filters.account = accountNames.value.length ? accountNames.value.join('、') : '';
  page.value = 1;
  load();
}

// ---------- 素材查询（与项目页复用同一弹窗） ----------
const materialVisible = ref(false);
const materialIds = ref([]);
const materialNames = ref([]);

function openMaterialPicker() {
  materialVisible.value = true;
}

function onMaterialSubmit(picked) {
  materialIds.value = (picked || []).map((m) => m.id);
  materialNames.value = (picked || []).map((m) => m.name);
  filters.material = materialNames.value.length ? materialNames.value.join('、') : '';
  page.value = 1;
  load();
}

// ---------- 批量操作 ----------
// 表单字段全部对齐巨量引擎开放平台接口（见 src/api/oceanengine.js）
// 启用 / 暂停 / 删除：与项目列表一致，用二次确认弹窗
const AD_CONFIRM_OPS = {
  启用: {
    title: '启用广告',
    message: (n) => `确定要启用所选的 ${n} 个广告吗？`,
    done: (n) => `原型：已启用 ${n} 个广告`,
  },
  暂停: {
    title: '暂停广告',
    message: (n) => `确定要暂停所选的 ${n} 个广告吗？暂停后广告将不再投放。`,
    done: (n) => `原型：已暂停 ${n} 个广告`,
  },
  删除: {
    title: '删除广告',
    message: (n) => `确定要删除所选的 ${n} 个广告吗？删除后不可恢复。`,
    type: 'warning',
    done: (n) => `原型：已删除 ${n} 个广告`,
  },
};

async function onBatchOp(op) {
  batchOp.value = '';
  if (!selected.value.length) {
    ElMessage.warning('请先选择广告');
    return;
  }
  const conf = AD_CONFIRM_OPS[op];
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
  // 「修改预算」按线上版式单独成弹窗（修改规则 / 预算 / 广告列表）
  if (op === '修改预算') {
    budgetRows.value = selected.value.map((r) => ({ ...r }));
    budgetVisible.value = true;
    return;
  }
  // 「修改出价」按线上版式单独成弹窗（修改规则 / 出价 / 广告列表）
  if (op === '修改出价') {
    bidVisible.value = true;
    return;
  }
  // 「修改深度出价」按出价弹窗版式单独成弹窗（修改规则 / 深度出价 / 广告列表）
  if (op === '修改深度出价') {
    deepBidVisible.value = true;
    return;
  }
  // 「修改ROI系数」按列表形式单独成弹窗（每个广告单独填写 ROI 系数 / 首日ROI系数）
  if (op === '修改ROI系数') {
    roiCoefficientVisible.value = true;
    return;
  }
  // 「修改直达链接」按线上版式单独成弹窗（直达链接输入 + 字数统计）
  if (op === '修改直达链接') {
    directLinkVisible.value = true;
    return;
  }
  // 「开启一键起量」按线上版式单独成弹窗（预算设置规则 / 起量预算 / 起量生效时间 + 广告列表）
  if (op === '开启一键起量') {
    oneClickRaiseVisible.value = true;
    return;
  }
  // 「修改广告否定词」按线上版式单独成弹窗（修改方式 / 短语否定词 / 精确否定词）
  if (op === '修改广告否定词') {
    negativeWordVisible.value = true;
    return;
  }
  // 「批量修改广告名称」按线上版式单独成弹窗（自定义 / 关键词替换 / 表格导入）
  if (op === '批量修改广告名称') {
    renameVisible.value = true;
    return;
  }
  // 「修改时段」按线上版式单独成「批量修改广告时段」弹窗（修改规则 / 生效时间 / 投放时段栅格）
  if (op === '修改时段') {
    scheduleVisible.value = true;
    return;
  }
  // 「修改落地页」按线上版式单独成弹窗（统一修改 / 分别修改 + 导入模板）
  if (op === '修改落地页') {
    landingPageVisible.value = true;
    return;
  }
  // 「修改广告标题和素材」按线上版式单独成弹窗（修改创意标题 / 创意标题库 / 修改创意素材 / 选择素材）
  if (op === '修改广告标题和素材') {
    titleMaterialVisible.value = true;
    return;
  }
  batchVisible.value = true;
}

function onBatchConfirm({ op, rows: list }) {
  ElMessage.success(`原型：已对 ${list.length} 条广告执行「${op}」`);
  load();
}

// 「批量修改预算」弹窗确认
function onAdBudgetConfirm({ rows: list }) {
  ElMessage.success(`原型：已对 ${list.length} 条广告执行「修改预算」`);
  load();
}

// 批量修改广告出价提交
function onAdBidConfirm() {
  load();
}

// 批量修改广告深度出价提交
function onAdDeepBidConfirm() {
  load();
}

// 批量修改广告 ROI 系数提交
function onAdRoiCoefficientConfirm() {
  load();
}

// 修改广告直达链接提交
function onAdDirectLinkConfirm() {
  load();
}

// 设置广告一键起量提交
function onAdOneClickRaiseConfirm() {
  load();
}

// 批量修改广告否定词提交
function onAdNegativeWordConfirm() {
  load();
}

// 批量修改广告名称提交
function onAdRenameConfirm() {
  load();
}

// 批量修改广告时段提交
function onAdScheduleConfirm() {
  load();
}

// 修改广告落地页提交
function onAdLandingPageConfirm() {
  load();
}

// 修改广告标题和素材提交
function onAdTitleMaterialConfirm() {
  load();
}

// 行内编辑（预算 / 出价）：打开对应的批量修改弹窗
const editableCols = ['budget', 'bid'];
function onEditCell(col, row) {
  // 预算走「批量修改预算」专用弹窗；出价仍走通用批量操作弹窗
  if (col.key === 'budget') {
    budgetRows.value = [{ ...row }];
    budgetVisible.value = true;
    return;
  }
  batchOpName.value = '修改出价';
  batchRows.value = [{ ...row }];
  bidVisible.value = true;
}

// ---------- 广告详情 ----------
const detailVisible = ref(false);
const detailRow = ref({});
function onDetail(record) {
  detailRow.value = record;
  detailVisible.value = true;
}

// 详情页「查看项目广告」：按该项目过滤当前广告列表
function onViewProject(row) {
  if (!row || !row.campaign_name) {
    ElMessage.info('原型：该广告未关联项目');
    return;
  }
  filters.campaign = [row.campaign_name];
  detailVisible.value = false;
  page.value = 1;
  load();
}

// ---------- 行内启停 ----------
function onToggle(record) {
  record.status = record.enabled ? 'enabled' : 'disabled';
  ElMessage.info(`原型：${record.enabled ? '启用' : '暂停'}广告（不提交真实接口）`);
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
.filter-row { flex-wrap: nowrap !important; gap: 16px !important; margin-bottom: 0 !important; }
/* 左侧筛选项自行换行；右侧「查询」垂直居中（与线上一致） */
.filter-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.f-prefix { font-size: 15px; color: #4e5969; white-space: nowrap; }
.filter-card .f-box { width: var(--f-w, 220px) !important; min-width: 0; }
/* 创建日期：查询条件名称 + 日期区间同处一个外框（线上一致：label 在前、区间在后） */
.f-date-item {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: var(--f-w, 300px) !important;
  padding: 0 8px 0 10px;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  background: #fff;
}
.f-date-item:focus-within { border-color: var(--el-color-primary); }
.f-date-item :deep(.el-date-editor) { flex: 1; min-width: 0; width: auto !important; border: none !important; box-shadow: none !important; }
.f-date-item :deep(.el-range-input) { min-width: 0; }
.f-search-ico { color: #86909c; }
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
.filter-actions { margin-left: auto; display: flex; align-items: center; gap: 12px; flex: none; }

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
/* 表头字段不换行 */
.table-card :deep(.el-table__header-wrapper th .cell) { white-space: nowrap; }
.scope-caret { color: #86909c; cursor: pointer; }
.scope-caret:hover { color: #4e5969; }
/* 表格内链接：「详情」统一为蓝色 */
.table-card .link { color: #2563eb; cursor: pointer; }
/* 广告名称 + 广告ID */
.ad-cell { min-width: 0; }
.ad-name { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-id { margin: 2px 0 0; font-size: 13px; color: #86909c; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* 合计行 */
.ad-summary { margin: 0; font-size: 15px; font-weight: 600; color: #1d2129; }
.table-card :deep(.ad-summary-row .el-table-column--selection .el-checkbox) { display: none; }
.num-cell { display: inline-block; }
.edit-icon { margin-left: 4px; color: #86909c; cursor: pointer; vertical-align: middle; }
.edit-icon:hover { color: #165dff; }
.status-text { font-size: 15px; }
.st-green { color: #00b42a; }
.st-gray { color: #86909c; }
.pager { margin-top: 16px; justify-content: flex-start; }
</style>
