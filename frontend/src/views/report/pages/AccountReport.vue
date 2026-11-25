<template>
  <ReportPageShell
    title="账户报表"
    :show-filter="false"
    v-model:period="period"
    v-model:date-range="dateRange"
  >
    <!-- ============ 筛选区（.report-filter） ============ -->
    <template #before-filter>
      <div class="report-filter">
        <!-- 媒体（收起时保留） -->
        <ReportFilterRow label="媒体：">
          <el-radio-group v-model="media" class="report-radio-group" size="small">
            <el-radio-button v-for="m in MEDIA_OPTIONS" :key="m.value" :value="m.value">
              {{ m.label }}
            </el-radio-button>
          </el-radio-group>
        </ReportFilterRow>

        <!-- 数据维度（收起时保留；收起态的「展开筛选配置」入口在这一行） -->
        <ReportFilterRow
          label="数据维度："
          :collapse-text="filterCollapsed ? '展开筛选配置' : ''"
          @toggle-collapse="filterCollapsed = !filterCollapsed"
        >
          <el-radio-group v-model="dimension" class="report-radio-group" size="small">
            <el-radio-button v-for="d in DIM_ACCOUNT" :key="d" :value="d">
              {{ d }}
            </el-radio-button>
          </el-radio-group>
        </ReportFilterRow>

        <!-- 筛选维度（线上实测：收起时整行隐藏） -->
        <ReportFilterRow v-if="!filterCollapsed" label="筛选维度：">
          <div class="filter-selects">
            <div class="report-search-box">
              <el-input
                v-model="keyword"
                size="small"
                placeholder="请输入关键词"
                :suffix-icon="Search"
              />
            </div>

            <ReportFilterSelect
              v-for="s in filterSelects"
              :key="s.uid"
              v-model="s.model"
              :label="s.label"
              :placeholder="s.placeholder"
              :options="s.options"
              :wide="s.wide"
            />

            <!-- 「+ 添加筛选」：线上是一个下拉菜单，选中维度后追加到筛选区 -->
            <el-popover
              v-model:visible="addFilterVisible"
              placement="bottom-start"
              :width="160"
              trigger="click"
            >
              <template #reference>
                <button class="report-add-filter" type="button">+ 添加筛选</button>
              </template>
              <div class="add-filter-menu">
                <div
                  v-for="d in ADD_FILTER_OPTIONS"
                  :key="d"
                  class="add-filter-item"
                  @click="onAddFilter(d)"
                >
                  {{ d }}
                </div>
              </div>
            </el-popover>
          </div>

          <el-button type="primary" class="report-query-btn" size="small" @click="handleQuery">
            查询
          </el-button>
        </ReportFilterRow>

        <!-- 数据筛选（线上实测：收起时整行隐藏；「收起筛选配置」入口在这一行） -->
        <ReportFilterRow
          v-if="!filterCollapsed"
          label="数据筛选："
          collapse-text="收起筛选配置"
          @toggle-collapse="filterCollapsed = !filterCollapsed"
        >
          <el-popover
            v-model:visible="dataFilterVisible"
            placement="bottom-start"
            :width="372"
            trigger="click"
          >
            <template #reference>
              <button class="report-filter-btn" type="button">
                <el-icon><Filter /></el-icon>筛选
              </button>
            </template>
            <div class="data-filter">
              <div class="data-filter-item">
                <span class="data-filter-label">消耗</span>
                <el-input v-model="costMin" size="small" placeholder="最小花费" />
                <span class="data-filter-split">—</span>
                <el-input v-model="costMax" size="small" placeholder="最大花费" />
              </div>
              <div class="data-filter-footer">
                <el-button size="small" @click="resetDataFilter">重置</el-button>
                <el-button type="primary" size="small" @click="applyDataFilter">确定</el-button>
              </div>
            </div>
          </el-popover>
        </ReportFilterRow>
      </div>
    </template>

    <!-- ============ 内容区 ============ -->
    <template #default>
      <!-- 趋势分析 / 占比分析（线上默认收起，展开后才渲染图表） -->
      <div class="report-analysis-tabs">
        <span
          class="report-analysis-tab"
          :class="{ active: analysisTab === 'trend' }"
          @click="analysisTab = 'trend'"
        >趋势分析</span>
        <span
          class="report-analysis-tab"
          :class="{ active: analysisTab === 'ratio' }"
          @click="analysisTab = 'ratio'"
        >占比分析</span>
        <span class="report-collapse-link" @click="analysisExpanded = !analysisExpanded">
          {{ analysisExpanded ? '收起' : '展开' }}
        </span>
      </div>

      <div v-if="analysisExpanded" class="report-analysis-chart">
        <!-- 线上：指标下拉 + 「对比」复选框 + 对比指标下拉 + 右侧汇总方式下拉
             趋势分析：只有「汇总」才能对比（Top5/Top10 时线上不显示「对比」）
             占比分析：Top5/Top10 下仍可对比
             两个 tab 的「对比」是各自独立的数据表，状态互不影响 -->
        <div class="report-analysis-bar">
          <el-select v-model="analysisMetric" size="small" class="analysis-metric-select" placeholder="请选择">
            <el-option v-for="m in ANALYSIS_METRICS" :key="m" :label="m" :value="m" />
          </el-select>
          <el-checkbox
            v-if="compareAvailable"
            v-model="compareEnabled"
            class="analysis-compare"
          >对比</el-checkbox>
          <el-select
            v-if="compareEnabled"
            v-model="analysisMetric2"
            size="small"
            class="analysis-metric-select"
            placeholder="请选择"
          >
            <el-option v-for="m in ANALYSIS_METRICS" :key="m" :label="m" :value="m" />
          </el-select>
          <el-select v-model="analysisTop" size="small" class="analysis-top-select" placeholder="请选择">
            <el-option v-for="t in analysisTopOptions" :key="t" :label="t" :value="t" />
          </el-select>
        </div>
        <!-- 线上：趋势分析/占比分析都是「一张图」，对比时是在同一张图上多一个指标 -->
        <div class="report-analysis-charts">
          <div ref="chartRef" class="report-chart"></div>
        </div>
      </div>

      <!-- 详细数据 -->
      <div class="report-card">
        <div class="report-card-head">
          <div class="report-card-title">
            详细数据
            <!-- 线上：标题右侧的 ⓘ 说明（文案取自线上采集） -->
            <el-popover placement="right" :width="600" trigger="hover">
              <template #reference>
                <el-icon class="card-help-icon"><QuestionFilled /></el-icon>
              </template>
              <div v-for="(line, i) in HELP_LINES" :key="i" class="help-text">{{ line }}</div>
            </el-popover>
          </div>

          <div class="report-card-actions">
            <!-- 关联维度 -->
            <el-select
              v-model="relation"
              size="small"
              class="relation-select"
              multiple
              collapse-tags
              placeholder="关联维度"
            >
              <el-option v-for="o in RELATION_DIM_ACCOUNT" :key="o" :label="o" :value="o" />
            </el-select>

            <!-- 自定义指标 -->
            <el-button size="small" @click="handleCustomMetric">
              <el-icon><Operation /></el-icon>自定义指标
              <el-popover placement="top" :width="200" trigger="hover">
                <template #reference>
                  <el-icon class="action-help"><QuestionFilled /></el-icon>
                </template>
                {{ TIPS.customMetric }}
              </el-popover>
            </el-button>

            <!-- 导出数据 -->
            <el-button size="small" @click="handleExport">
              <el-icon><Download /></el-icon>导出数据
              <el-popover placement="top" :width="200" trigger="hover">
                <template #reference>
                  <el-icon class="action-help"><QuestionFilled /></el-icon>
                </template>
                {{ TIPS.exportAll }}
              </el-popover>
            </el-button>

            <a class="report-collapse-link" @click="tableCollapsed = !tableCollapsed">
              {{ tableCollapsed ? '展开' : '收起' }}
            </a>
          </div>
        </div>

        <div v-show="!tableCollapsed" class="report-table-wrap">
          <el-table
            class="report-table"
            :data="rows"
            row-key="id"
            border
            show-summary
            :summary-method="summaryMethod"
          >
            <!-- 线上勾选列实测宽 60px -->
            <el-table-column type="selection" width="60" fixed="left" />

            <!-- key 带序号：数据维度列与关联维度列可能同名（如「优化师」），避免 key 重复 -->
            <template v-for="(col, ci) in columns" :key="`${col.prop}_${ci}`">
              <el-table-column
                :prop="col.prop"
                :label="col.label"
                :min-width="col.width || col.minWidth"
                :align="col.align || 'left'"
                :sortable="col.sortable"
                show-overflow-tooltip
              >
                <!-- 线上：列头文字本身是 ⓘ 气泡的触发点（点击列头弹出口径说明） -->
                <template #header>
                  <el-popover v-if="col.tip" placement="bottom" :width="300" trigger="hover">
                    <template #reference>
                      <span class="col-tip-label">{{ col.label }}</span>
                    </template>
                    {{ col.tip }}
                  </el-popover>
                  <span v-else>{{ col.label }}</span>
                </template>
                <template #default="{ row }">
                  <span v-if="col.prop === 'stat_cost'">{{ formatCost(row.stat_cost) }}</span>
                  <span v-else>{{ row[col.prop] }}</span>
                </template>
              </el-table-column>
            </template>
          </el-table>

          <div class="report-pager">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :total="rows.length"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              background
            />
          </div>
        </div>
      </div>

      <!-- 「自定义指标」弹窗（线上 1:1） -->
      <CustomMetricDialog
        v-model="metricVisible"
        metric-key="account"
        :default-selected="selectedMetrics"
        @apply="onMetricApply"
      />

      <!-- 「导出数据」结果提示（线上 1:1） -->
      <ExportResultDialog v-model="exportVisible" mode="default" />
    </template>
  </ReportPageShell>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { Search, Filter, QuestionFilled, Operation, Download } from '@element-plus/icons-vue';
import * as echarts from 'echarts/core';
import { LineChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import ReportPageShell from '../components/ReportPageShell.vue';
import ReportFilterRow from '../components/ReportFilterRow.vue';
import ReportFilterSelect from '../components/ReportFilterSelect.vue';
import CustomMetricDialog from '../components/CustomMetricDialog.vue';
import ExportResultDialog from '../components/ExportResultDialog.vue';
import { REPORT_METRICS, REPORT_METRIC_DEFAULT_SELECTED } from '@/mock/reportMetrics';
import { REPORT_TIPS } from '@/mock/reportTips';
import {
  MEDIA_OPTIONS,
  OPTIMIZER_OPTIONS,
  PARTNER_OPTIONS,
  DEPT_OPTIONS,
  PROJECT_OPTIONS,
  PRODUCT_OPTIONS,
  SUBJECT_OPTIONS,
  ADVERTISER_OPTIONS,
  RELATION_DIM_ACCOUNT,
  DIM_ACCOUNT,
  accountRows,
  todayRange,
  dateRangeLabel,
} from '@/mock/reportData';

echarts.use([
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

// ---------- 线上实测文案（ⓘ 提示 / 口径说明） ----------
/** 从线上采集的提示列表里取文案 */
function findTip(key, matcher) {
  const list = REPORT_TIPS[key] || [];
  const hit = list.find((t) => matcher(t.body || ''));
  return hit ? hit.body : '';
}

const TIPS = {
  help: findTip('account', (b) => b.indexOf('1.每天上午10点') === 0),
  customMetric: findTip('account', (b) => b === '自定义指标'),
  exportAll: findTip('account', (b) => b === '导出所有页面的数据'),
  time: findTip('account', (b) => b === '时间'),
  advertiserId: findTip('account', (b) => b === '账户ID'),
  advertiserName: findTip('account', (b) => b === '账户名称'),
  cost: findTip('account', (b) => b.indexOf('表示广告在投放期内的预估花费金额') === 0),
};

// 线上把「详细数据」标题的说明拆成两行展示
const HELP_LINES = TIPS.help
  .split(/\s(?=2\.)/)
  .map((s) => s.trim())
  .filter(Boolean);

// 线上实测列宽
const COLUMN_WIDTH = { date: 135, advertiser_name: 471 };
// 默认媒体（账户主媒体，默认不过滤）
const DEFAULT_MEDIA = 'toutiao_upgrade';
// 「数据维度」对应的维度列（第二列随数据维度切换）
const DIM_COLUMN = {
  账户: { prop: 'advertiser_id', label: '账户ID', tip: TIPS.advertiserId },
  优化师: { prop: 'optimizer', label: '优化师' },
  媒体: { prop: 'media', label: '媒体' },
  智投项目: { prop: 'project', label: '智投项目' },
  合作商: { prop: 'partner', label: '合作商' },
  部门: { prop: 'dept', label: '部门' },
};

// 筛选维度下拉（线上顺序：优化师 / 合作商 / 部门 / 智投项目 / 账户 / 商品）
const FILTER_DEFS = [
  { key: 'optimizer', field: 'optimizer', label: '优化师', placeholder: '请选择优化师', options: OPTIMIZER_OPTIONS },
  { key: 'partner', field: 'partner', label: '合作商', placeholder: '请选择合作商', options: PARTNER_OPTIONS },
  { key: 'dept', field: 'dept', label: '部门', placeholder: '请选择部门', options: DEPT_OPTIONS },
  { key: 'project', field: 'project', label: '智投项目', placeholder: '请选择智投项目', options: PROJECT_OPTIONS },
  { key: 'account', field: 'advertiser_name', label: '账户', placeholder: '请选择账户', options: ADVERTISER_OPTIONS, wide: true },
  { key: 'product', field: 'product', label: '商品', placeholder: '请选择商品', options: PRODUCT_OPTIONS },
];

// 线上「+ 添加筛选」下拉里的维度（与筛选维度一致）
const ADD_FILTER_OPTIONS = FILTER_DEFS.map((d) => d.label);

// ---------- 页面状态 ----------
const period = ref('汇总');
const dateRange = ref(todayRange());
const media = ref(DEFAULT_MEDIA);
const dimension = ref('账户');
const keyword = ref('');
const filterCollapsed = ref(false);
const tableCollapsed = ref(false);
const analysisTab = ref('trend');
const analysisExpanded = ref(false);
const relation = ref([]);
const filterSelects = ref(FILTER_DEFS.map((d, i) => ({ ...d, uid: `f${i}`, model: [] })));
const addFilterVisible = ref(false);
const dataFilterVisible = ref(false);
const costMin = ref('');
const costMax = ref('');
const metricVisible = ref(false);
const exportVisible = ref(false);
const page = ref(1);
const pageSize = ref(20);
// 已选自定义指标（线上默认已选「消耗」）
const selectedMetrics = ref([...(REPORT_METRIC_DEFAULT_SELECTED.account || [])]);

// ---------- 表格列 ----------
// 基础列：时间 + 数据维度列 + 账户名称；其余由「自定义指标」决定
const baseColumns = computed(() => {
  const dim = DIM_COLUMN[dimension.value] || DIM_COLUMN['账户'];
  return [
    { prop: 'date', label: '时间', width: COLUMN_WIDTH.date, sortable: true, tip: TIPS.time },
    { prop: dim.prop, label: dim.label, width: 590, tip: dim.tip || '' },
    {
      prop: 'advertiser_name',
      label: '账户名称',
      width: COLUMN_WIDTH.advertiser_name,
      tip: TIPS.advertiserName,
    },
  ];
});

// 自定义指标列（线上「消耗」是内置列，其余指标由弹窗勾选后追加）
const metricColumns = computed(() =>
  selectedMetrics.value.map((name, i) => ({
    prop: name === '消耗' ? 'stat_cost' : `metric_${i}`,
    label: name,
    minWidth: 140,
    align: 'right',
    sortable: name === '消耗',
    tip: name === '消耗' ? TIPS.cost : metricDesc(name),
    metric: name,
  }))
);

// 关联维度：线上勾选后表格多出对应列（实测列序：固定列之后、指标列之前）
const RELATION_COLUMN_MAP = {
  媒体: { prop: 'media', width: 160 },
  优化师: { prop: 'optimizer', width: 200 },
  合作商: { prop: 'partner', width: 180 },
  部门: { prop: 'dept', width: 160 },
  智投项目: { prop: 'project', width: 160 },
  商品: { prop: 'product', width: 160 },
  账户主体: { prop: 'subject', width: 220 },
  账户备注: { prop: 'account_note', width: 180 },
};
const relationColumns = computed(() =>
  relation.value
    .filter((k) => RELATION_COLUMN_MAP[k])
    .map((k) => ({
      prop: RELATION_COLUMN_MAP[k].prop,
      label: k,
      width: RELATION_COLUMN_MAP[k].width,
      align: 'left',
      tip: '',
    }))
);

const columns = computed(() => [
  ...baseColumns.value,
  ...relationColumns.value,
  ...metricColumns.value,
]);

/** 指标口径说明（取自线上采集的指标集） */
function metricDesc(name) {
  const blocks = (REPORT_METRICS.account || {}).blocks || [];
  for (const b of blocks) {
    const hit = (b.metrics || []).find((m) => m.name === name);
    if (hit) return hit.desc || '';
  }
  return '';
}

// ---------- 表格行 ----------
const mediaLabel = computed(
  () => (MEDIA_OPTIONS.find((m) => m.value === media.value) || {}).label || ''
);

const rows = computed(() => {
  const list = accountRows().map((r, i) => {
    const row = {
      ...r,
      date: dateLabelFor(i),
      trendKey: trendKeyFor(i),
      optimizer: OPTIMIZER_OPTIONS[i % OPTIMIZER_OPTIONS.length],
      partner: PARTNER_OPTIONS[i % PARTNER_OPTIONS.length],
      dept: DEPT_OPTIONS[i % DEPT_OPTIONS.length],
      project: PROJECT_OPTIONS[i % PROJECT_OPTIONS.length],
      product: PRODUCT_OPTIONS[i % PRODUCT_OPTIONS.length],
      media: MEDIA_OPTIONS[(i % 4) + 1].label,
      // 关联维度列取值（账户主体 / 账户备注）
      subject: SUBJECT_OPTIONS[i % SUBJECT_OPTIONS.length],
      account_note: `备注-${i % 5 + 1}`,
      stat_cost: Number(r.stat_cost),
    };
    metricColumns.value.forEach((col) => {
      if (col.metric === '消耗') return;
      row[col.prop] = metricValue(row, col.metric);
    });
    return row;
  });
  return list.filter((r) => matchRow(r));
});

function matchRow(r) {
  // 媒体：默认「巨量广告」为账户主媒体（不过滤），切到其它媒体才按媒体过滤
  if (media.value && media.value !== 'aggregate' && media.value !== DEFAULT_MEDIA) {
    if (r.media !== mediaLabel.value) return false;
  }
  const kw = (keyword.value || '').trim();
  if (kw && !(String(r.advertiser_id).includes(kw) || String(r.advertiser_name).includes(kw))) {
    return false;
  }
  for (const s of filterSelects.value) {
    const sel = s.model || [];
    if (!sel.length) continue;
    if (!sel.includes(r[s.field])) return false;
  }
  // 数据筛选：消耗区间
  const min = Number(costMin.value);
  const max = Number(costMax.value);
  if (costMin.value !== '' && Number.isFinite(min) && r.stat_cost < min) return false;
  if (costMax.value !== '' && Number.isFinite(max) && r.stat_cost > max) return false;
  return true;
}

// 合计行：首列「合计」，消耗列累计
function summaryMethod({ columns: cols, data }) {
  const total = data.reduce((acc, r) => acc + (Number(r.stat_cost) || 0), 0);
  return cols.map((col, i) => {
    if (i === 0) return '合计';
    if (col.property === 'stat_cost') {
      return total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return '--';
  });
}

// 消耗列：固定两位小数（与线上一致）
function formatCost(v) {
  return Number(v || 0).toFixed(2);
}

// ---------- 自定义指标取值（mock 数据按指标名稳定生成演示值） ----------
function metricValue(row, name) {
  const cost = Number(row.stat_cost) || 0;
  const h = hash(`${name}|${row.id}|${row.date}`);
  switch (name) {
    case '展示数':
      return String(Math.round(cost * 22 + (h % 5000)));
    case '点击数':
      return String(Math.round(cost * 0.45 + (h % 200)));
    case '点击率':
      return '2.05%';
    case '平均千次展现费用':
      return (cost / 22).toFixed(2);
    case '平均点击单价':
      return (cost / 0.45).toFixed(2);
    case '转化数':
      return String(Math.round(cost * 0.02 + (h % 50)));
    case '转化成本':
      return (cost / 0.02).toFixed(2);
    case '转化率':
      return '4.44%';
    default:
      if (/率$/.test(name)) return `${((h % 1000) / 100).toFixed(2)}%`;
      if (/(成本|费用|单价|花费|消耗|金额|均价)/.test(name)) {
        return ((h % 100000) / 100).toFixed(2);
      }
      return String(h % 100000);
  }
}

// ---------- 日期工具 ----------
const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function daysOfRange() {
  const [s, e] = dateRange.value || [];
  if (!s || !e) return [];
  const out = [];
  const end = new Date(`${e}T00:00:00`);
  const cur = new Date(`${s}T00:00:00`);
  let guard = 0;
  while (cur <= end && guard < 400) {
    out.push(fmtDate(cur));
    cur.setDate(cur.getDate() + 1);
    guard += 1;
  }
  return out;
}

function monthsOfRange() {
  const days = daysOfRange();
  const seen = [];
  days.forEach((d) => {
    const m = d.slice(0, 7);
    if (!seen.includes(m)) seen.push(m);
  });
  return seen;
}

// 趋势图 x 轴分类：汇总=整个区间(一个分类)，分日=每天，分月=每月
function trendKeys() {
  const [s, e] = dateRange.value || [];
  if (!s || !e) return [];
  if (period.value === '分日') return daysOfRange();
  if (period.value === '分月') return monthsOfRange();
  return [dateRangeLabel(s, e)];
}

// 行与趋势图的关联键（与时间列文案格式不同，故单独一份）
function trendKeyFor(index) {
  const keys = trendKeys();
  if (!keys.length) return '';
  return keys[index % keys.length];
}

// 时间列文案：汇总=区间，分日=单日，分月=年月
function dateLabelFor(index) {
  const [s, e] = dateRange.value || [];
  if (!s || !e) return '';
  if (period.value === '分日') {
    const days = daysOfRange();
    if (!days.length) return dateRangeLabel(s, e);
    return days[index % days.length].replace(/-/g, '');
  }
  if (period.value === '分月') {
    const months = monthsOfRange();
    if (!months.length) return dateRangeLabel(s, e);
    return months[index % months.length].replace(/-/g, '');
  }
  return dateRangeLabel(s, e);
}

// ---------- 交互 ----------
// 线上「查询」只是重新拉数据，不弹任何提示
function handleQuery() {
  // 数据由本地 mock 派生，无需额外处理
}

// 「+ 添加筛选」：把选中的维度追加到筛选区（线上可重复选择同一维度）
function onAddFilter(label) {
  const def = FILTER_DEFS.find((d) => d.label === label) || FILTER_DEFS[0];
  filterSelects.value.push({ ...def, uid: `f${Date.now()}`, model: [] });
  addFilterVisible.value = false;
}

// 数据筛选浮层
function applyDataFilter() {
  dataFilterVisible.value = false;
}

function resetDataFilter() {
  costMin.value = '';
  costMax.value = '';
}

// 「自定义指标」：打开线上 1:1 的弹窗
function handleCustomMetric() {
  metricVisible.value = true;
}

// 「应 用」：把选中的指标应用到表格（新增对应列）
function onMetricApply(payload) {
  selectedMetrics.value = [...(payload && payload.selected ? payload.selected : [])];
}

// 「导出数据」：弹线上 1:1 的「任务创建成功」提示框
function handleExport() {
  exportVisible.value = true;
}

// ---------- 趋势分析 / 占比分析 图表 ----------
const chartRef = ref(null);
let chart = null;

function disposeChart() {
  if (chart) {
    chart.dispose();
    chart = null;
  }
}

// FNV-1a + 雪崩混合：保证相邻日期得到差异明显的消耗值
function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

function trendValue(day) {
  const h = hash(day);
  return +(2000 + (h % 38000) + (h % 100) / 100).toFixed(2);
}

// 线上分析面板：指标下拉 11 项（实测）
const ANALYSIS_METRICS = [
  '消耗', '展示数', '平均千次展现费用', '点击数', '点击率', '平均点击单价',
  '转化数', '转化成本', '转化率', '激活数', '注册数',
];
// 线上：趋势分析 / 占比分析是两个独立的数据表，各自维护「对比」状态
const trendState = reactive({
  metric: '消耗', metric2: '展示数', compare: false, top: '汇总',
});
const ratioState = reactive({
  metric: '消耗', metric2: '展示数', compare: false, top: 'Top5数据',
});
const analysisState = computed(() => (analysisTab.value === 'trend' ? trendState : ratioState));
const analysisMetric = computed({
  get: () => analysisState.value.metric,
  set: (v) => { analysisState.value.metric = v; },
});
const analysisMetric2 = computed({
  get: () => analysisState.value.metric2,
  set: (v) => { analysisState.value.metric2 = v; },
});
const compareEnabled = computed({
  get: () => analysisState.value.compare,
  set: (v) => { analysisState.value.compare = v; },
});
const analysisTop = computed({
  get: () => analysisState.value.top,
  set: (v) => {
    analysisState.value.top = v;
    // 趋势分析切到 Top5/Top10 时线上不提供「对比」→ 自动取消
    if (analysisTab.value === 'trend' && v !== '汇总') analysisState.value.compare = false;
  },
});
// 趋势分析：只有「汇总」才能对比（Top5/Top10 时线上不显示「对比」）
const compareAvailable = computed(() =>
  analysisTab.value === 'trend' ? analysisTop.value === '汇总' : true
);
// 趋势分析：汇总 / Top5数据 / Top10数据；占比分析：Top5数据 / Top10数据
const analysisTopOptions = computed(() =>
  analysisTab.value === 'trend' ? ['汇总', 'Top5数据', 'Top10数据'] : ['Top5数据', 'Top10数据']
);

/** 取某个指标在明细行上的数值 */
function metricNumber(row, metric) {
  const v = metricValue(row, metric);
  const n = parseFloat(String(v).replace('%', '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** 按当前「Top5/Top10/汇总」取参与统计的行 */
function topRows() {
  const list = [...rows.value];
  if (analysisTop.value === 'Top5数据') return list.slice(0, 5);
  if (analysisTop.value === 'Top10数据') return list.slice(0, 10);
  return list;
}

function trendOption() {
  const days = trendKeys();
  const cmp = compareEnabled.value;
  const m1 = analysisMetric.value;
  const m2 = analysisMetric2.value;
  const agg = (metric) => {
    const byDay = new Map();
    topRows().forEach((r) => {
      const k = r.trendKey;
      byDay.set(k, (byDay.get(k) || 0) + metricNumber(r, metric));
    });
    return days.map((d) => byDay.get(d) || 0);
  };
  const mkSeries = (name, metric, color, yAxisIndex) => ({
    name,
    type: 'line',
    yAxisIndex,
    data: agg(metric),
    smooth: true,
    symbol: 'circle',
    symbolSize: 5,
    lineStyle: { width: 2, color },
    itemStyle: { color },
    areaStyle: { color: `${color}14` },
  });
  // 线上：对比时是一张图两条线，左轴=指标A、右轴=指标B，图例在右上
  const series = cmp
    ? [mkSeries(m1, m1, '#409eff', 0), mkSeries(m2, m2, '#52c41a', 1)]
    : [mkSeries(m1, m1, '#409eff', 0)];
  const yAxis = cmp
    ? [
        {
          type: 'value',
          name: m1,
          nameTextStyle: { color: '#909399', fontSize: 12, align: 'left' },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#909399', fontSize: 12, formatter: (v) => Number(v).toLocaleString('zh-CN') },
          splitLine: { lineStyle: { color: '#f2f3f5' } },
        },
        {
          type: 'value',
          name: m2,
          nameTextStyle: { color: '#909399', fontSize: 12, align: 'right' },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#909399', fontSize: 12, formatter: (v) => Number(v).toLocaleString('zh-CN') },
          splitLine: { show: false },
        },
      ]
    : [
        {
          type: 'value',
          name: m1,
          nameTextStyle: { color: '#909399', fontSize: 12, align: 'left' },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#909399', fontSize: 12, formatter: (v) => Number(v).toLocaleString('zh-CN') },
          splitLine: { lineStyle: { color: '#f2f3f5' } },
        },
      ];
  return {
    animationDuration: 300,
    color: ['#409eff', '#52c41a'],
    grid: { left: 76, right: cmp ? 76 : 30, top: 40, bottom: 40 },
    legend: cmp
      ? { orient: 'vertical', right: 8, top: 10, itemGap: 10, textStyle: { color: '#909399', fontSize: 12 } }
      : { show: false },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    xAxis: {
      type: 'category',
      data: days,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#e5e6eb' } },
      axisTick: { show: false },
      axisLabel: { color: '#909399', fontSize: 12 },
    },
    yAxis,
    series,
  };
}

function ratioOption() {
  const cmp = compareEnabled.value;
  const build = (metric) => {
    const map = new Map();
    topRows().forEach((r) => {
      const name = r.advertiser_name || '--';
      map.set(name, (map.get(name) || 0) + metricNumber(r, metric));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: +value.toFixed(2) }));
  };
  const d1 = build(analysisMetric.value);
  const d2 = cmp ? build(analysisMetric2.value) : [];
  const mkPie = (name, data, center) => ({
    name,
    type: 'pie',
    radius: '58%',
    center,
    label: { color: '#333333', fontSize: 12, formatter: '{b}\n{d}%' },
    labelLine: { lineStyle: { color: '#e5e6eb' } },
    data,
  });
  // 线上：对比时是「一张图里两个环形图」，左右分列；图例在右上
  return {
    animationDuration: 300,
    tooltip: {
      trigger: 'item',
      formatter: (p) =>
        `${p.name}<br/>${Number(p.value).toLocaleString('zh-CN')} (${p.percent}%)`,
    },
    legend: {
      orient: 'vertical',
      right: 8,
      top: 10,
      itemGap: 10,
      textStyle: { color: '#909399', fontSize: 12 },
      data: d1.map((x) => x.name),
    },
    series: cmp
      ? [mkPie(analysisMetric.value, d1, ['25%', '52%']), mkPie(analysisMetric2.value, d2, ['75%', '52%'])]
      : [mkPie(analysisMetric.value, d1, ['50%', '52%'])],
  };
}

function renderChart() {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value);
  chart.setOption(analysisTab.value === 'trend' ? trendOption() : ratioOption(), true);
  chart.resize();
}

// 指标 / 对比 / 汇总方式 / 页签变化都重绘
watch([analysisMetric, analysisMetric2, compareEnabled, analysisTop, analysisTab], async () => {
  if (!analysisExpanded.value) return;
  await nextTick();
  renderChart();
});

watch(analysisExpanded, async (v) => {
  if (!v) {
    disposeChart();
    return;
  }
  await nextTick();
  renderChart();
});

watch([analysisTab, dateRange, period, rows], async () => {
  if (!analysisExpanded.value) return;
  await nextTick();
  renderChart();
});

function onResize() {
  if (chart) chart.resize();
}

onMounted(() => {
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  disposeChart();
});
</script>

<style scoped>
/* 筛选维度控件区：内部换行，「查询」按钮在右侧垂直居中（与线上一致） */
.filter-selects {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1 1 auto;
  min-width: 0;
}

/* 「+ 添加筛选」下拉菜单 */
.add-filter-menu {
  display: flex;
  flex-direction: column;
  max-height: 240px;
  overflow: auto;
}
.add-filter-item {
  font-size: 13px;
  color: #333333;
  padding: 7px 12px;
  cursor: pointer;
  white-space: nowrap;
}
.add-filter-item:hover {
  color: #197afb;
  background: #f7f8fa;
}

/* 数据筛选浮层 */
.data-filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.data-filter-label {
  font-size: 13px;
  color: #333333;
  width: 34px;
}
.data-filter-split {
  color: #c0c4cc;
}
.data-filter-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

/* 卡片头 */
.relation-select {
  width: 130px;
}
.card-help-icon,
.action-help {
  color: #c0c4cc;
  cursor: pointer;
}
.action-help {
  margin-left: 4px;
  vertical-align: middle;
}
.card-help-icon:hover,
.action-help:hover {
  color: #197afb;
}

/* 标题 ⓘ 说明 */
.help-text {
  font-size: 13px;
  line-height: 1.7;
  color: #666666;
}

/* 表头列名（线上：列头文字即口径说明的触发点） */
.col-tip-label {
  cursor: pointer;
}
.col-tip-label:hover {
  color: #197afb;
}

/* 分析面板（趋势分析 / 占比分析）—— 线上：指标下拉 + 对比 + 右侧汇总方式 */
.report-analysis-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0 12px;
}
.analysis-metric-select { width: 185px; }
.analysis-top-select { width: 150px; margin-left: auto; }
.analysis-compare { margin-right: 0; }
.analysis-compare .el-checkbox__label { font-size: 13px; color: #606266; }
.report-analysis-charts { display: flex; gap: 16px; }
.report-analysis-charts .report-chart { flex: 1 1 0; min-width: 0; }
</style>
