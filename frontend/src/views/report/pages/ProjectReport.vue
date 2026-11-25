<template>
  <ReportPageShell
    title="项目报表"
    :show-filter="false"
    v-model:period="period"
    v-model:date-range="dateRange"
  >
    <!-- ============ 筛选区（.report-filter） ============ -->
    <template #before-filter>
      <div class="report-filter">
        <!-- 数据维度（线上只有一个「智投项目」选项；收起时保留这一行） -->
        <ReportFilterRow
          label="数据维度："
          :collapse-text="filterCollapsed ? '展开筛选配置' : ''"
          @toggle-collapse="filterCollapsed = !filterCollapsed"
        >
          <el-radio-group v-model="dimension" class="report-radio-group" size="small">
            <el-radio-button value="智投项目">智投项目</el-radio-button>
          </el-radio-group>
        </ReportFilterRow>

        <!-- 筛选维度（线上实测：收起时整行隐藏） -->
        <ReportFilterRow v-if="!filterCollapsed" label="筛选维度：">
          <div class="filter-selects">
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
      <!-- 详细数据 -->
      <div class="report-card">
        <div class="report-card-head">
          <div class="report-card-title">详细数据</div>

          <div class="report-card-actions">
            <!-- 归因时间类型（线上：每个选项都带「若需切换归因时间类型，请联系运营」提示） -->
            <el-select
              v-model="attribution"
              size="small"
              class="attribution-select"
              placeholder="小红书-归因时间类型"
            >
              <el-option
                v-for="o in ATTRIBUTION_OPTIONS"
                :key="o.value"
                :label="o.label"
                :value="o.value"
                :disabled="o.disabled"
              >
                <el-popover placement="top" :width="260" trigger="click">
                  <template #reference>
                    <span class="attribution-option">{{ o.label }}</span>
                  </template>
                  {{ TIPS.attribution }}
                </el-popover>
              </el-option>
            </el-select>

            <!-- 关联维度 -->
            <el-select
              v-model="relation"
              size="small"
              class="relation-select"
              multiple
              collapse-tags
              placeholder="关联维度"
            >
              <el-option v-for="o in RELATION_DIM_PROJECT" :key="o" :label="o" :value="o" />
            </el-select>

            <!-- 自定义指标 -->
            <el-button size="small" @click="handleCustomMetric">
              <el-icon><Operation /></el-icon>自定义指标
              <el-popover placement="top" :width="200" trigger="click">
                <template #reference>
                  <el-icon class="action-help"><QuestionFilled /></el-icon>
                </template>
                {{ TIPS.customMetric }}
              </el-popover>
            </el-button>

            <!-- 导出数据 -->
            <el-button size="small" @click="handleExport">
              <el-icon><Download /></el-icon>导出数据
              <el-popover placement="top" :width="200" trigger="click">
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

            <template v-for="col in columns" :key="col.prop">
              <el-table-column
                :prop="col.prop"
                :label="col.label"
                :width="col.width"
                :min-width="col.minWidth"
                :align="col.align || 'left'"
                :sortable="col.sortable"
                show-overflow-tooltip
              >
                <!-- 线上：列头文字本身是 ⓘ 气泡的触发点（点击列头弹出口径说明） -->
                <template #header>
                  <el-popover v-if="col.tip" placement="bottom" :width="300" trigger="click">
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
        </div>
      </div>

      <!-- 「自定义指标」弹窗（线上 1:1） -->
      <CustomMetricDialog
        v-model="metricVisible"
        metric-key="project"
        :default-selected="selectedMetrics"
        @apply="onMetricApply"
      />

      <!-- 「导出数据」结果提示（线上 1:1） -->
      <ExportResultDialog v-model="exportVisible" mode="default" />
    </template>
  </ReportPageShell>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Filter, QuestionFilled, Operation, Download } from '@element-plus/icons-vue';
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
  ADVERTISER_OPTIONS,
  RELATION_DIM_PROJECT,
  projectRows,
  todayRange,
  dateRangeLabel,
} from '@/mock/reportData';

// ---------- 线上实测文案（ⓘ 提示 / 口径说明） ----------
/** 从线上采集的提示列表里取文案 */
function findTip(key, matcher) {
  const list = REPORT_TIPS[key] || [];
  const hit = list.find((t) => matcher(t.body || ''));
  return hit ? hit.body : '';
}

const TIPS = {
  attribution: findTip('project', (b) => b === '若需切换归因时间类型，请联系运营'),
  customMetric: findTip('project', (b) => b === '自定义指标'),
  exportAll: findTip('project', (b) => b === '导出所有页面的数据'),
  time: findTip('project', (b) => b === '时间'),
  projectName: findTip('project', (b) => b === '智投项目'),
  cost: findTip('project', (b) => b.indexOf('表示广告在投放期内的预估花费金额') === 0),
};

// 归因时间类型（线上：小红书-计费时间 选中，小红书-转化时间 置灰）
const ATTRIBUTION_OPTIONS = [
  { value: '小红书-计费时间', label: '小红书-计费时间', disabled: false },
  { value: '小红书-转化时间', label: '小红书-转化时间', disabled: true },
];

// 线上实测列宽
const COLUMN_WIDTH = { date: 135, project_name: 766 };

// 筛选维度下拉（线上顺序：智投项目 / 账户 / 媒体 / 部门 / 人员 / 合作商）
const FILTER_DEFS = [
  {
    key: 'project',
    field: 'project',
    label: '智投项目',
    placeholder: '请选择智投项目',
    options: PROJECT_OPTIONS,
  },
  {
    key: 'account',
    field: 'account',
    label: '账户',
    wide: true,
    placeholder: '请选择账户',
    options: ADVERTISER_OPTIONS,
  },
  {
    key: 'media',
    field: 'media',
    label: '媒体',
    placeholder: '请选择媒体',
    options: MEDIA_OPTIONS.map((m) => m.label),
  },
  {
    key: 'dept',
    field: 'dept',
    label: '部门',
    placeholder: '请选择部门',
    options: DEPT_OPTIONS,
  },
  {
    key: 'staff',
    field: 'staff',
    label: '人员',
    placeholder: '请选择人员',
    options: OPTIMIZER_OPTIONS,
  },
  {
    key: 'partner',
    field: 'partner',
    label: '合作商',
    placeholder: '请选择合作商',
    options: PARTNER_OPTIONS,
  },
];

// 线上「+ 添加筛选」下拉里的维度（与筛选维度一致）
const ADD_FILTER_OPTIONS = FILTER_DEFS.map((d) => d.label);

// ---------- 页面状态 ----------
const period = ref('汇总');
const dateRange = ref(todayRange());
const dimension = ref('智投项目');
const filterCollapsed = ref(false);
const tableCollapsed = ref(false);
const relation = ref([]);
const attribution = ref('小红书-计费时间');
const filterSelects = ref(FILTER_DEFS.map((d, i) => ({ ...d, uid: `f${i}`, model: [] })));
const addFilterVisible = ref(false);
const dataFilterVisible = ref(false);
const costMin = ref('');
const costMax = ref('');
const metricVisible = ref(false);
const exportVisible = ref(false);
// 已选自定义指标（线上默认已选「消耗」）
const selectedMetrics = ref([...(REPORT_METRIC_DEFAULT_SELECTED.project || [])]);

// ---------- 表格列 ----------
// 基础列：时间 + 智投项目；其余由「自定义指标」决定
const baseColumns = computed(() => [
  { prop: 'date', label: '时间', width: COLUMN_WIDTH.date, sortable: true, tip: TIPS.time },
  {
    prop: 'project_name',
    label: '智投项目',
    width: COLUMN_WIDTH.project_name,
    tip: TIPS.projectName,
  },
]);

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

// 关联维度：线上勾选后表格会多出对应列（如「部门」「媒体」「人员」「账户」「合作商」「账户备注」）
const RELATION_COLUMN_MAP = {
  部门: { prop: 'dept', width: 160 },
  媒体: { prop: 'media', width: 160 },
  人员: { prop: 'staff', width: 140 },
  账户: { prop: 'account', width: 220 },
  合作商: { prop: 'partner', width: 180 },
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
  const blocks = (REPORT_METRICS.project || {}).blocks || [];
  for (const b of blocks) {
    const hit = (b.metrics || []).find((m) => m.name === name);
    if (hit) return hit.desc || '';
  }
  return '';
}

// ---------- 表格行 ----------
const rows = computed(() => {
  const list = projectRows().map((r, i) => {
    const row = {
      ...r,
      date: dateLabelFor(i),
      project: PROJECT_OPTIONS[i % PROJECT_OPTIONS.length],
      account: ADVERTISER_OPTIONS[i % ADVERTISER_OPTIONS.length],
      media: MEDIA_OPTIONS[(i % 4) + 1].label,
      dept: DEPT_OPTIONS[i % DEPT_OPTIONS.length],
      staff: OPTIMIZER_OPTIONS[i % OPTIMIZER_OPTIONS.length],
      partner: PARTNER_OPTIONS[i % PARTNER_OPTIONS.length],
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
  for (const s of filterSelects.value) {
    // 「不限」表示不限制该维度
    const sel = (s.model || []).filter((v) => v !== '不限');
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
    case '在投账户数':
      return String(1 + (h % 9));
    case '新建广告（创意）数':
      return String(3 + (h % 60));
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
  const seen = [];
  daysOfRange().forEach((d) => {
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

// FNV-1a + 雪崩混合：保证同一指标在同一行得到稳定值
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
.attribution-select {
  width: 220px;
}
.relation-select {
  width: 130px;
}
.attribution-option {
  cursor: pointer;
}
.action-help {
  color: #c0c4cc;
  cursor: pointer;
  margin-left: 4px;
  vertical-align: middle;
}
.action-help:hover {
  color: #197afb;
}

/* 表头列名（线上：列头文字即口径说明的触发点） */
.col-tip-label {
  cursor: pointer;
}
.col-tip-label:hover {
  color: #197afb;
}
</style>
