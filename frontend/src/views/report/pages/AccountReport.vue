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
        <!-- 媒体 -->
        <ReportFilterRow
          label="媒体："
          :collapse-text="filterCollapsed ? '展开筛选配置' : '收起筛选配置'"
          @toggle-collapse="filterCollapsed = !filterCollapsed"
        >
          <el-radio-group v-model="media" class="report-radio-group" size="small">
            <el-radio-button v-for="m in MEDIA_OPTIONS" :key="m.value" :value="m.value">
              {{ m.label }}
            </el-radio-button>
          </el-radio-group>
        </ReportFilterRow>

        <!-- 数据维度 -->
        <ReportFilterRow label="数据维度：">
          <el-radio-group v-model="dimension" class="report-radio-group" size="small">
            <el-radio-button v-for="d in DIM_ACCOUNT" :key="d" :value="d">
              {{ d }}
            </el-radio-button>
          </el-radio-group>
        </ReportFilterRow>

        <!-- 筛选维度 -->
        <ReportFilterRow label="筛选维度：">
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
              v-for="s in visibleFilterSelects"
              :key="s.uid"
              v-model="s.model"
              :label="s.label"
              :placeholder="s.placeholder"
              :options="s.options"
              :wide="s.wide"
            />

            <button class="report-add-filter" type="button" @click="handleAddFilter">
              + 添加筛选
            </button>
          </div>

          <el-button type="primary" class="report-query-btn" size="small" @click="handleQuery">
            查询
          </el-button>
        </ReportFilterRow>

        <!-- 数据筛选 -->
        <ReportFilterRow label="数据筛选：">
          <button class="report-filter-btn" type="button" @click="handleDataFilter">
            <el-icon><Filter /></el-icon>筛选
          </button>
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
        <div ref="chartRef" class="report-chart"></div>
      </div>

      <!-- 详细数据 -->
      <ReportDetailTable
        title="详细数据"
        :columns="columns"
        :rows="rows"
        :total="rows.length"
        :summary-method="summaryMethod"
        :collapsed="tableCollapsed"
        :help="HELP_TEXT"
        @custom-metric="handleCustomMetric"
        @export="handleExport"
        @toggle="tableCollapsed = !tableCollapsed"
      >
        <template #actions>
          <el-select v-model="relation" size="small" placeholder="关联维度" style="width: 120px">
            <el-option v-for="o in RELATION_DIM_ACCOUNT" :key="o" :label="o" :value="o" />
          </el-select>
        </template>
        <template #col-stat_cost="{ row }">{{ formatCost(row.stat_cost) }}</template>
      </ReportDetailTable>
    </template>
  </ReportPageShell>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Filter } from '@element-plus/icons-vue';
import * as echarts from 'echarts/core';
import { LineChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import ReportPageShell from '../components/ReportPageShell.vue';
import ReportFilterRow from '../components/ReportFilterRow.vue';
import ReportFilterSelect from '../components/ReportFilterSelect.vue';
import ReportDetailTable from '../components/ReportDetailTable.vue';
import {
  MEDIA_OPTIONS,
  OPTIMIZER_OPTIONS,
  PARTNER_OPTIONS,
  DEPT_OPTIONS,
  PROJECT_OPTIONS,
  PRODUCT_OPTIONS,
  ADVERTISER_OPTIONS,
  ACCOUNT_COLUMNS,
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

// 「详细数据」右侧问号说明（线上实测文案）
const HELP_TEXT =
  '1.每天上午10点可以查看前一天数据，当天数据每15分钟同步一次；' +
  '2.账户若当日授权失效，次日数据会少于当日数据甚至缺失；您可通过再授权的方式重新获取账户数据。' +
  '重新授权当天，只会拉取近2天数据，后续会逐步拉取历史30天的数据；';

// 线上实测列宽
const COLUMN_WIDTH = { date: 135, advertiser_name: 471, stat_cost: 471 };
// 默认媒体（账户主媒体，默认不过滤）
const DEFAULT_MEDIA = 'toutiao_upgrade';
// 「数据维度」对应的维度列（第二列随数据维度切换）
const DIM_COLUMN = {
  账户: { prop: 'advertiser_id', label: '账户ID' },
  优化师: { prop: 'optimizer', label: '优化师' },
  媒体: { prop: 'media', label: '媒体' },
  创量项目: { prop: 'project', label: '创量项目' },
  合作商: { prop: 'partner', label: '合作商' },
  部门: { prop: 'dept', label: '部门' },
};

// 筛选维度下拉（线上顺序：优化师 / 合作商 / 部门 / 创量项目 / 账户 / 商品）
const FILTER_DEFS = [
  { key: 'optimizer', field: 'optimizer', label: '优化师', placeholder: '请选择优化师', options: OPTIMIZER_OPTIONS },
  { key: 'partner', field: 'partner', label: '合作商', placeholder: '请选择合作商', options: PARTNER_OPTIONS },
  { key: 'dept', field: 'dept', label: '部门', placeholder: '请选择部门', options: DEPT_OPTIONS },
  { key: 'project', field: 'project', label: '创量项目', placeholder: '请选择创量项目', options: PROJECT_OPTIONS },
  { key: 'account', field: 'advertiser_name', label: '账户', placeholder: '请选择账户', options: ADVERTISER_OPTIONS, wide: true },
  { key: 'product', field: 'product', label: '商品', placeholder: '请选择商品', options: PRODUCT_OPTIONS },
];

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
const relation = ref('');
const filterSelects = ref(FILTER_DEFS.map((d, i) => ({ ...d, uid: `f${i}`, model: [] })));

const visibleFilterSelects = computed(() =>
  filterCollapsed.value ? filterSelects.value.slice(0, 3) : filterSelects.value
);

// ---------- 表格列 ----------
// 第二列跟随「数据维度」切换，列宽取线上实测值；
// 末列「消耗」不设固定宽度，由 el-table 自适应铺满剩余空间（保证右对齐的数值不被裁切）
const columns = computed(() => {
  const dim = DIM_COLUMN[dimension.value] || DIM_COLUMN['账户'];
  return ACCOUNT_COLUMNS.map((c) => {
    if (c.prop === 'advertiser_id') {
      return { prop: dim.prop, label: dim.label, width: 590 };
    }
    if (c.prop === 'stat_cost') {
      return { prop: c.prop, label: c.label, align: c.align, sortable: c.sortable, minWidth: 120 };
    }
    const width = COLUMN_WIDTH[c.prop] || 590;
    return { prop: c.prop, label: c.label, align: c.align, sortable: c.sortable, width };
  });
});

// ---------- 表格行 ----------
const mediaLabel = computed(
  () => (MEDIA_OPTIONS.find((m) => m.value === media.value) || {}).label || ''
);

const rows = computed(() => {
  const list = accountRows().map((r, i) => ({
    ...r,
    date: dateLabelFor(i),
    optimizer: OPTIMIZER_OPTIONS[i % OPTIMIZER_OPTIONS.length],
    partner: PARTNER_OPTIONS[i % PARTNER_OPTIONS.length],
    dept: DEPT_OPTIONS[i % DEPT_OPTIONS.length],
    project: PROJECT_OPTIONS[i % PROJECT_OPTIONS.length],
    product: PRODUCT_OPTIONS[i % PRODUCT_OPTIONS.length],
    media: MEDIA_OPTIONS[(i % 4) + 1].label,
    stat_cost: Number(r.stat_cost),
  }));
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
  return true;
}

// 合计行：首列「合计」，末列累计消耗
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
function handleQuery() {
  ElMessage.success('查询完成');
}

function handleAddFilter() {
  // 线上「添加筛选」可重复选择同一维度，这里按顺序追加一个筛选维度
  const def = FILTER_DEFS[filterSelects.value.length % FILTER_DEFS.length];
  filterSelects.value.push({ ...def, uid: `f${Date.now()}`, model: [] });
  ElMessage.success(`已添加「${def.label}」筛选条件`);
}

function handleDataFilter() {
  ElMessage.info('数据筛选：暂无可用条件');
}

function handleCustomMetric() {
  ElMessage.info('自定义指标功能开发中');
}

function handleExport() {
  ElMessage.success('导出任务已提交，请稍后下载');
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

function trendOption() {
  const days = daysOfRange();
  return {
    animationDuration: 300,
    color: ['#197afb'],
    grid: { left: 76, right: 30, top: 40, bottom: 40 },
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
    yAxis: {
      type: 'value',
      name: '消耗',
      nameTextStyle: { color: '#909399', fontSize: 12, align: 'right' },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#909399',
        fontSize: 12,
        formatter: (v) => Number(v).toLocaleString('zh-CN'),
      },
      splitLine: { lineStyle: { color: '#f2f3f5' } },
    },
    series: [
      {
        name: '消耗',
        type: 'line',
        data: days.map((d) => trendValue(d)),
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2, color: '#197afb' },
        itemStyle: { color: '#197afb' },
        areaStyle: { color: 'rgba(25,122,251,0.08)' },
      },
    ],
  };
}

function ratioOption() {
  const map = new Map();
  rows.value.forEach((r) => {
    const name = r.advertiser_name || '--';
    map.set(name, (map.get(name) || 0) + (Number(r.stat_cost) || 0));
  });
  const data = Array.from(map.entries()).map(([name, value]) => ({
    name,
    value: +value.toFixed(2),
  }));
  return {
    animationDuration: 300,
    tooltip: {
      trigger: 'item',
      formatter: (p) =>
        `${p.name}<br/>${Number(p.value).toLocaleString('zh-CN')} (${p.percent}%)`,
    },
    legend: { type: 'scroll', bottom: 0, textStyle: { color: '#909399', fontSize: 12 } },
    series: [
      {
        name: '账户消耗占比',
        type: 'pie',
        radius: '62%',
        center: ['50%', '45%'],
        label: { color: '#333333', fontSize: 12, formatter: '{b}\n{d}%' },
        labelLine: { lineStyle: { color: '#e5e6eb' } },
        data,
      },
    ],
  };
}

function renderChart() {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value);
  chart.setOption(analysisTab.value === 'trend' ? trendOption() : ratioOption(), true);
  chart.resize();
}

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
</style>
