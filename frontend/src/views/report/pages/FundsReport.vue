<template>
  <!-- 资金使用率（经营分析）
   * 线上基准：https://cl.mobgi.com/report/fundsdata/fundsReport
   * 采集截图：C:/tmp/rpt/09_资金使用率.png
   * 结构：页头二级页签 → KPI 卡片行 → 筛选卡片 → 广告主账户分析（柱状图） → 详细数据
   * 本页特殊点：页头没有粒度 radio / 日期区间（日期在筛选卡片里）；
   *             筛选区没有「媒体」「数据筛选」行，也没有「查询」按钮。
   -->
  <ReportPageShell
    class="funds-page"
    title=""
    :periods="[]"
    :show-date="false"
    :show-filter="false"
  >
    <!-- ① 页头二级页签：巨量广告 / 腾讯广告 -->
    <template #subtabs>
      <div class="report-subtabs">
        <span
          v-for="t in MEDIA_TABS"
          :key="t.value"
          class="report-subtab"
          :class="{ active: tab === t.value }"
          @click="tab = t.value"
        >{{ t.label }}</span>
      </div>
    </template>

    <!-- ② KPI 卡片行（页头与筛选卡片之间） -->
    <template #before-filter>
      <div class="funds-kpi-wrap">
        <div class="report-kpi-row">
          <div class="report-kpi">
            <div class="report-kpi-value">{{ kpi.rate }}</div>
            <div class="report-kpi-label">
              昨日资金使用率
              <el-popover placement="right" :width="320" trigger="click">
                <template #reference>
                  <el-icon><QuestionFilled /></el-icon>
                </template>
                <div class="el-popover__title">{{ tipEntry('昨日资金使用率 = 昨日总消耗/(昨日总结余+昨日总消耗)').title }}</div>
                {{ tipText('昨日资金使用率 = 昨日总消耗/(昨日总结余+昨日总消耗)') }}
              </el-popover>
            </div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi-value plain">{{ kpi.balance }}</div>
            <div class="report-kpi-label">昨日总结余（元）</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi-value plain">{{ kpi.cost }}</div>
            <div class="report-kpi-label">昨日总消耗（元）</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi-value plain">{{ kpi.today }}</div>
            <div class="report-kpi-label">
              今日消耗
              <el-popover placement="right" :width="250" trigger="click">
                <template #reference>
                  <el-icon><QuestionFilled /></el-icon>
                </template>
                <div class="el-popover__title">{{ tipEntry('今日消耗每 15min 更新一次').title }}</div>
                {{ tipText('今日消耗每 15min 更新一次') }}
              </el-popover>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ③ 筛选卡片：数据维度 + 筛选维度 -->
    <div class="report-filter funds-filter">
      <!-- 数据维度：账户 / 合作商 / 项目 + 右侧日期区间 -->
      <div class="report-filter-row">
        <span class="report-dim-label">数据维度：</span>
        <div class="report-dim-body">
          <el-radio-group v-model="dimension" class="report-radio-group" size="small">
            <el-radio-button v-for="d in DIM_FUNDS" :key="d" :value="d">{{ d }}</el-radio-button>
          </el-radio-group>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            size="small"
            class="report-date funds-date"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :clearable="false"
          />
        </div>
      </div>

      <!-- 筛选维度：关键词 + 部门 / 优化师 / 合作商 / 项目 -->
      <div class="report-filter-row">
        <span class="report-dim-label">筛选维度：</span>
        <div class="report-dim-body">
          <div class="report-search-box funds-search">
            <el-input
              v-model="keyword"
              size="small"
              placeholder="支持搜索账户名称/ID"
              :suffix-icon="Search"
            />
          </div>

          <div v-for="s in filterSelects" :key="s.key" class="funds-select">
            <div class="report-select-box">
              <label>{{ s.label }}</label>
              <el-select
                v-model="s.model"
                class="cl-filter-select"
                multiple
                collapse-tags
                collapse-tags-tooltip
                :max-collapse-tags="2"
                filterable
                clearable
                :placeholder="s.placeholder"
              >
                <el-option
                  v-for="opt in s.options"
                  :key="opt"
                  :label="opt"
                  :value="opt"
                />
              </el-select>
            </div>
            <el-icon class="funds-clear" @click="s.model = []"><Close /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- ④ 广告主账户分析（柱状图） -->
    <div class="report-card">
      <div class="report-card-head">
        <div class="report-card-title">广告主账户分析</div>
        <div class="report-card-actions">
          <span class="report-collapse-link" @click="chartCollapsed = !chartCollapsed">
            {{ chartCollapsed ? '展开' : '收起' }}
          </span>
        </div>
      </div>
      <div v-show="!chartCollapsed" class="report-card-body">
        <div class="funds-chart-tools">
          <span class="report-chart-legend-note">注：数据来源为昨日数据</span>
          <el-button size="small" plain disabled>显示top10</el-button>
        </div>
        <div ref="chartRef" class="report-chart chart-container"></div>
      </div>
    </div>

    <!-- ⑤ 详细数据 -->
    <div class="report-card">
      <div class="report-card-head">
        <div class="report-card-title">详细数据</div>
        <div class="report-card-actions">
          <el-select
            v-model="relation"
            class="funds-relation"
            size="small"
            multiple
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="1"
          >
            <el-option v-for="o in RELATION_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
          <el-button size="small" plain @click="onExport">导出数据</el-button>
          <!-- 导出数据 ⓘ（线上：按钮右侧问号气泡；本页文案为「导出表格所有的数据」） -->
          <el-popover placement="bottom" :width="200" trigger="click">
            <template #reference>
              <el-icon class="funds-col-tip" @click.stop><QuestionFilled /></el-icon>
            </template>
            {{ tipText('导出表格所有的数据') }}
          </el-popover>
        </div>
      </div>

      <div class="report-table-wrap">
        <el-table
          class="report-table"
          :data="pagedRows"
          row-key="id"
          border
          show-summary
          :summary-method="summaryMethod"
        >
          <el-table-column
            v-for="col in visibleColumns"
            :key="col.prop"
            :prop="col.prop"
            :label="col.label"
            :width="col.width"
            :align="col.align || 'left'"
            :sortable="col.sortable"
            show-overflow-tooltip
          >
            <!-- 线上列头：文字本身即口径说明气泡的锚点（hover 出现提示） -->
            <template #header>
              <el-tooltip v-if="col.tip" :content="col.tip" placement="top" :show-after="150">
                <span class="funds-col-title">{{ col.label }}</span>
              </el-tooltip>
              <span v-else>{{ col.label }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="report-pager">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </div>
    </div>
  </ReportPageShell>

  <!-- 导出数据结果提示（线上：「任务创建成功，请前往工具—下载中心查看详情」+ 确定） -->
  <ExportResultDialog v-model="exportVisible" mode="default" />
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Close, QuestionFilled, Search } from '@element-plus/icons-vue';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  AxisPointerComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import ReportPageShell from '../components/ReportPageShell.vue';
import ExportResultDialog from '../components/ExportResultDialog.vue';
import { REPORT_TIPS } from '@/mock/reportTips';
import {
  buildRows,
  dateRangeLabel,
  fundsRows,
  FUNDS_COLUMNS,
  DIM_FUNDS,
  DEPT_OPTIONS,
  PROJECT_OPTIONS,
  OPTIMIZER_OPTIONS,
  PARTNER_OPTIONS,
} from '@/mock/reportData';

echarts.use([
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  AxisPointerComponent,
  CanvasRenderer,
]);

// ---------- 常量（线上实测） ----------
const MEDIA_TABS = [
  { value: 'toutiao', label: '巨量广告' },
  { value: 'tencent', label: '腾讯广告' },
];

// 详细数据「关联维度」下拉（线上 15 项，默认全选）
const RELATION_OPTIONS = [
  '优化师', '合作商', '部门', '项目名称',
  '日终结余', '消耗', '共享钱包消耗', '共享赠款支出',
  '账户总支出', '账户现金支出', '账户赠款支出',
  '账户总存入', '账户总转入', '账户总转出', '冻结',
];
// 关联维度 → 表格字段
const RELATION_PROP = {
  优化师: 'optimizer',
  合作商: 'partner',
  部门: 'dept',
  项目名称: 'project',
  日终结余: 'day_balance',
  消耗: 'stat_cost',
  共享钱包消耗: 'shared_wallet_cost',
  共享赠款支出: 'shared_gift_cost',
  账户总支出: 'total_cost',
  账户现金支出: 'cash_cost',
  账户赠款支出: 'gift_cost',
  账户总存入: 'total_income',
  账户总转入: 'total_transfer_in',
  账户总转出: 'total_transfer_out',
  冻结: 'frozen',
};
// 线上表头宽度
const COL_WIDTH = {
  date: 170, advertiser_name: 170, advertiser_id: 170,
  optimizer: 120, partner: 250, dept: 120, project: 250,
  day_balance: 150, stat_cost: 120, shared_wallet_cost: 150, shared_gift_cost: 150,
  total_cost: 135, cash_cost: 135, gift_cost: 135,
  total_income: 128, total_transfer_in: 120, total_transfer_out: 120, frozen: 120,
};
// 线上表头 tooltip 说明（文案全部取自线上采集结果：mock/reportTips.js）
const FUNDS_TIPS = REPORT_TIPS.funds || [];
/** 按原文取提示条目（命中则原样返回线上条目，未命中也原样返回，避免文案走样） */
function tipEntry(s) {
  return FUNDS_TIPS.find((t) => t.body === s) || { title: '', body: s };
}
/** 按原文取提示文案 */
function tipText(s) {
  return tipEntry(s).body;
}
const COL_TIP = {
  shared_gift_cost: tipText('共享赠款支出，共享赠款支出+账户总支出=账户报表消耗数据'),
  total_cost: tipText('广告计划总消耗，现金支出+赠款支出=总支出'),
  cash_cost: tipText('广告计划消耗中现金部分'),
  gift_cost: tipText('广告计划消耗中赠款部分'),
  total_income: tipText('当日充值减去扣款的汇总'),
  total_transfer_in: tipText('代理商、其他广告账号转入的总金额'),
  total_transfer_out: tipText('转出到代理商、其他广告账号的总金额'),
  frozen: tipText('冻结'),
};
const NUMERIC_PROPS = [
  'day_balance', 'stat_cost', 'shared_wallet_cost', 'shared_gift_cost',
  'total_cost', 'cash_cost', 'gift_cost', 'total_income',
  'total_transfer_in', 'total_transfer_out', 'frozen',
];
// 基础三列（始终展示）
const BASE_COLUMNS = [
  { prop: 'date', label: '时间', width: 170, align: 'left' },
  { prop: 'advertiser_name', label: '广告主账号', width: 170, align: 'left' },
  { prop: 'advertiser_id', label: '广告主ID', width: 170, align: 'left' },
];

// 线上 KPI 基准值（巨量广告 / 账户维度 / 昨日 / 无筛选）
const KPI_BASE = {
  toutiao: { rate: 5.8, balance: 115944.54, cost: 28398.14, today: 0 },
  tencent: { rate: 3.12, balance: 64820.3, cost: 9126.48, today: 0 },
};
// 数据维度对统计口径的影响系数
const DIM_FACTOR = { 账户: 1, 合作商: 0.84, 项目: 0.72 };
// 明细总条数（线上共 62 条）
const TOTAL_ROWS = 62;

// ---------- 状态 ----------
const tab = ref('toutiao');
const dimension = ref(DIM_FUNDS[0]);
const dateRange = ref(defaultRange());
const keyword = ref('');
const deptModel = ref([]);
const optimizerModel = ref([]);
const partnerModel = ref([]);
const projectModel = ref([]);
const relation = ref([...RELATION_OPTIONS]);
const chartCollapsed = ref(false);
const page = ref(1);
const pageSize = ref(20);
const exportVisible = ref(false);   // 「导出数据」结果提示

function fmtDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
// 线上默认展示昨日（2026-11-23）数据
function defaultRange() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const s = fmtDate(d);
  return [s, s];
}

const filterSelects = computed(() => [
  { key: 'dept', label: '部门：', placeholder: '全部', options: DEPT_OPTIONS, model: deptModel },
  { key: 'optimizer', label: '优化师：', placeholder: '全部', options: OPTIMIZER_OPTIONS, model: optimizerModel },
  { key: 'partner', label: '合作商：', placeholder: '全部', options: PARTNER_OPTIONS, model: partnerModel },
  { key: 'project', label: '项目：', placeholder: '全部', options: PROJECT_OPTIONS, model: projectModel },
]);

// ---------- 数据集（线上 62 条：15 条来自共享 mock，其余同口径补齐） ----------
const ADVERTISER_NAMES = [
  '央广-雷盟-知于-APP...', '央广-雷盟-知乎-AR...', '央广-上海潮信信息科技...',
  '央广-亦芯-95分-投...', '上海潮信信息科技...', '上海博物知库集团有限公...',
  '央广-智看-下二分-刘...',
];
const EXTRA_FIELDS = [
  { key: 'date', build: () => '' },
  { key: 'advertiser_name', build: (r, i) => ADVERTISER_NAMES[i % ADVERTISER_NAMES.length] },
  { key: 'advertiser_id', build: (r, i) => `1879830${569464202 - (15 + i) * 100}` },
  { key: 'optimizer', build: (r, i) => OPTIMIZER_OPTIONS[i % OPTIMIZER_OPTIONS.length] },
  { key: 'partner', build: (r, i) => (i % 3 === 0 ? '头条默认合作商' : '--') },
  { key: 'dept', build: (r, i) => DEPT_OPTIONS[i % DEPT_OPTIONS.length] },
  { key: 'project', build: (r, i) => PROJECT_OPTIONS[i % PROJECT_OPTIONS.length] },
  { key: 'day_balance', build: (r) => +(r() * 27000 + 1500).toFixed(2) },
  { key: 'stat_cost', build: (r) => +(r() * 900 + 100).toFixed(2) },
  { key: 'shared_wallet_cost', build: (r) => +(r() * 120).toFixed(2) },
  { key: 'shared_gift_cost', build: () => 0 },
  { key: 'total_cost', build: (r) => +(r() * 1100).toFixed(2) },
  { key: 'cash_cost', build: (r) => +(r() * 700).toFixed(2) },
  { key: 'gift_cost', build: (r) => +(r() * 400).toFixed(2) },
  { key: 'total_income', build: (r) => +(r() * 2500).toFixed(2) },
  { key: 'total_transfer_in', build: (r) => +(r() * 1800).toFixed(2) },
  { key: 'total_transfer_out', build: (r) => +(r() * 1400).toFixed(2) },
  { key: 'frozen', build: () => 0 },
];

const DATASET = (() => {
  const base = fundsRows();
  const extra = buildRows({ count: TOTAL_ROWS - base.length, seed: 137, fields: EXTRA_FIELDS });
  return base.concat(extra).map((r, i) => ({ ...r, id: i + 1 }));
})();

// 日期区间 → 明细「时间」列（线上格式 20261123-20261123）
const dateLabel = computed(() => {
  const [s, e] = dateRange.value || [];
  if (!s || !e) return '';
  return dateRangeLabel(s, e);
});
// 日期区间天数（多天/今天会改变统计口径）
const rangeDays = computed(() => {
  const [s, e] = dateRange.value || [];
  if (!s || !e) return 1;
  const diff = Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1;
  return Math.max(1, diff);
});
const isTodayRange = computed(() => {
  const [s, e] = dateRange.value || [];
  return s === fmtDate(new Date()) && e === fmtDate(new Date());
});

// 页面级系数：页签 × 数据维度 × 日期区间
const dimFactor = computed(() => DIM_FACTOR[dimension.value] ?? 1);
const dateFactor = computed(() => {
  if (isTodayRange.value) return 0.42;
  if (rangeDays.value > 1) return Math.min(2.2, 0.9 + (rangeDays.value - 1) * 0.55);
  return 1;
});
const tabFactor = computed(() => (tab.value === 'toutiao' ? 1 : 0.61));
const scopeFactor = computed(() => tabFactor.value * dimFactor.value * dateFactor.value);

// 当前口径下的全量明细
const scopedRows = computed(() => {
  const k = scopeFactor.value;
  return DATASET.map((r) => {
    const row = { ...r, date: dateLabel.value };
    NUMERIC_PROPS.forEach((p) => { row[p] = +(Number(r[p] || 0) * k).toFixed(2); });
    return row;
  });
});

// 筛选后的明细（关键词 / 部门 / 优化师 / 合作商 / 项目）
const filteredRows = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return scopedRows.value.filter((r) => {
    if (kw && !(String(r.advertiser_name).toLowerCase().includes(kw) || String(r.advertiser_id).toLowerCase().includes(kw))) return false;
    if (deptModel.value.length && !deptModel.value.includes(r.dept)) return false;
    if (optimizerModel.value.length && !optimizerModel.value.includes(r.optimizer)) return false;
    if (partnerModel.value.length && !partnerModel.value.includes(r.partner)) return false;
    if (projectModel.value.length && !projectModel.value.includes(r.project)) return false;
    return true;
  });
});

const total = computed(() => filteredRows.value.length);
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filteredRows.value.slice(start, start + pageSize.value);
});

// ---------- KPI ----------
function money(v) {
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
const kpi = computed(() => {
  const base = KPI_BASE[tab.value] || KPI_BASE.toutiao;
  const all = scopedRows.value;
  const hit = filteredRows.value;
  const sum = (rows, p) => rows.reduce((s, r) => s + (Number(r[p]) || 0), 0);
  const allCost = sum(all, 'stat_cost');
  const hitCost = sum(hit, 'stat_cost');
  const ratio = allCost > 0 ? hitCost / allCost : 0;
  // 页签切换用各自的基准值；数据维度 / 日期区间 / 筛选条件按占比缩放
  const f = dimFactor.value * dateFactor.value * ratio;
  return {
    rate: `${(base.rate * f).toFixed(2)}%`,
    balance: money(base.balance * f),
    cost: money(base.cost * f),
    today: money(base.today),
  };
});

// ---------- 详细数据表格 ----------
const visibleColumns = computed(() => {
  const props = new Set(relation.value.map((r) => RELATION_PROP[r]).filter(Boolean));
  const optional = FUNDS_COLUMNS
    .filter((c) => props.has(c.prop))
    .map((c) => ({
      ...c,
      width: COL_WIDTH[c.prop] ?? c.width,
      sortable: NUMERIC_PROPS.includes(c.prop),
      tip: COL_TIP[c.prop] || '',
    }));
  return BASE_COLUMNS.concat(optional);
});

function summaryMethod({ columns, data }) {
  return columns.map((_, i) => {
    const col = visibleColumns.value[i];
    if (!col) return '';
    if (i === 0) return '合计';
    if (!NUMERIC_PROPS.includes(col.prop)) return '--';
    const s = data.reduce((acc, row) => acc + (Number(row[col.prop]) || 0), 0);
    return s.toFixed(2);
  });
}

function onExport() {
  exportVisible.value = true;
}

// ---------- 图表（广告主账户分析） ----------
const chartRef = ref(null);
let chart = null;

const chartRows = computed(() =>
  [...filteredRows.value]
    .sort((a, b) => (Number(b.day_balance) || 0) - (Number(a.day_balance) || 0))
    .slice(0, 10)
);

function chartOption() {
  const rows = chartRows.value;
  const maxVal = rows.reduce((m, r) => Math.max(m, Number(r.day_balance) || 0), 0);
  const yMax = Math.max(30000, Math.ceil(maxVal / 5000) * 5000);
  return {
    animationDuration: 400,
    color: ['#ff6a00', '#2b7fff', '#8b5cf6'],
    grid: { left: 78, right: 190, top: 26, bottom: 46 },
    legend: {
      orient: 'vertical',
      right: 34,
      top: 6,
      icon: 'roundRect',
      itemWidth: 22,
      itemHeight: 11,
      itemGap: 14,
      textStyle: { color: '#333333', fontSize: 12 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(29,33,41,0.92)',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
    },
    xAxis: {
      type: 'category',
      data: rows.map((r) => r.advertiser_name),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e5e6eb' } },
      axisLabel: {
        interval: 0,
        color: '#666666',
        fontSize: 11,
        width: 86,
        overflow: 'break',
        lineHeight: 14,
      },
    },
    yAxis: {
      type: 'value',
      name: '单位（元）',
      min: 0,
      max: yMax,
      interval: 5000,
      nameTextStyle: { color: '#333333', fontSize: 12, align: 'center' },
      nameGap: 14,
      axisLine: { lineStyle: { color: '#e5e6eb' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#666666',
        fontSize: 12,
        formatter: (v) => Number(v).toLocaleString('zh-CN'),
      },
      splitLine: { lineStyle: { color: '#f0f2f5' } },
    },
    series: [
      {
        name: '消耗',
        type: 'bar',
        barMaxWidth: 26,
        data: rows.map((r) => Number(r.stat_cost) || 0),
        itemStyle: { color: '#ff6a00' },
      },
      {
        name: '共享钱包消耗',
        type: 'bar',
        barMaxWidth: 26,
        data: rows.map((r) => Number(r.shared_wallet_cost) || 0),
        itemStyle: { color: '#2b7fff' },
      },
      {
        name: '日终结余',
        type: 'bar',
        barMaxWidth: 26,
        data: rows.map((r) => Number(r.day_balance) || 0),
        itemStyle: { color: '#8b5cf6' },
      },
    ],
  };
}

function renderChart() {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value);
  chart.setOption(chartOption(), true);
}

function resizeChart() {
  if (chart) chart.resize();
}

watch(
  () => [chartRows.value, chartCollapsed.value],
  () => nextTick(() => { renderChart(); resizeChart(); }),
  { deep: true }
);
watch([page, pageSize], () => { page.value = Math.min(page.value, Math.max(1, Math.ceil(total.value / pageSize.value))); });
watch(
  [tab, dimension, dateRange, keyword, deptModel, optimizerModel, partnerModel, projectModel],
  () => { page.value = 1; },
  { deep: true }
);

onMounted(() => {
  nextTick(renderChart);
  window.addEventListener('resize', resizeChart);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart);
  if (chart) chart.dispose();
});
</script>

<style>
/* 资金使用率页局部样式（挂在 .funds-page 根节点下，不影响其它报表页）
 * 注意：reportPage.css 里是 `body.report-scope .xxx` 选择器，特异性高于本页的
 * `.funds-page .xxx`，因此这里的覆盖规则统一写成 `body.report-scope .funds-page .xxx`。 */
body.report-scope .funds-page .report-head-left { gap: 0; }

/* KPI 卡片行宽度/日期区间宽度已由 reportPage.css 统一处理，此处不再覆盖 */
.funds-page .funds-kpi-wrap { padding: 16px 20px 10px; }

/* 筛选卡片：白底圆角卡片 + 两行筛选 */
body.report-scope .funds-page .funds-filter {
  border: 1px solid #e8eaec;
  border-radius: 4px;
  padding: 16px 20px;
}
body.report-scope .funds-page .funds-filter .report-dim-label {
  text-align: left;
  min-width: 100px;
}
/* 数据维度：线上三个按钮彼此独立（不是连体 radio-button） */
.funds-page .report-radio-group .el-radio-button { margin-right: 12px; }
.funds-page .report-radio-group .el-radio-button:last-child { margin-right: 0; }
.funds-page .report-radio-group .el-radio-button__inner {
  border: 1px solid #d0d0d0 !important;
  border-radius: 3px !important;
  box-shadow: none !important;
}
.funds-page .report-radio-group .el-radio-button__original:checked + .el-radio-button__inner {
  background: #197afb;
  border-color: #197afb !important;
  box-shadow: none !important;
}
/* 日期区间靠行尾（宽度由 reportPage.css 的 .report-date 统一锁定 260px）
 * EP 2.14 的 .el-input__wrapper 是 content-box + 左右 10px padding，
 * 且 flex item 的 min-width:auto 会按 min-content 撑到 280px，故本页补两条收口 */
.funds-page .funds-date { margin-left: auto; }
body.report-scope .funds-page .report-date {
  box-sizing: border-box !important;
  min-width: 0 !important;
}

/* 关键词搜索框：线上为「输入段 + 放大镜段」两段式 */
body.report-scope .funds-page .report-search-box { width: 190px; }
body.report-scope .funds-page .report-search-box .el-input__suffix-inner {
  border-left: 1px solid #dcdfe6;
  margin: 0 -10px 0 0;
  padding: 0 8px 0 6px;
  align-self: stretch;
  align-items: center;
}
/* 组合盒：线上 label 无底色、无分隔线 */
body.report-scope .funds-page .report-select-box > label {
  background: transparent;
  border-right: none;
  padding: 0 6px 0 0;
}
/* 选择框右侧的清除图标 */
.funds-page .funds-select {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.funds-page .funds-clear {
  color: #c0c4cc;
  cursor: pointer;
  font-size: 14px;
}
.funds-page .funds-clear:hover { color: #197afb; }

/* 图表卡片：注记 + 显示top10 */
.funds-page .funds-chart-tools {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 8px;
}
.funds-page .funds-chart-tools .report-chart-legend-note { margin-bottom: 0; }
/* 线上 chart-container 实测 1730 × 550 */
body.report-scope .funds-page .report-chart { height: 550px; }

/* 详细数据：关联维度下拉 + 导出数据 ⓘ */
.funds-page .funds-relation { width: 120px; }
.funds-page .funds-col-tip {
  color: #c0c4cc;
  cursor: pointer;
  margin-left: 4px;
  vertical-align: middle;
}
.funds-page .funds-col-tip:hover { color: #197afb; }
/* 列头提示锚点（线上：列头文字 hover 出现口径说明） */
.funds-page .funds-col-title {
  border-bottom: 1px dashed transparent;
  cursor: help;
}
.funds-page .funds-col-title:hover { color: #197afb; }
</style>
