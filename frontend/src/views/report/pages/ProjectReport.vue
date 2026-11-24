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
        <!-- 数据维度（线上只有一个「创量项目」选项） -->
        <ReportFilterRow
          label="数据维度："
          :collapse-text="filterCollapsed ? '展开筛选配置' : '收起筛选配置'"
          @toggle-collapse="filterCollapsed = !filterCollapsed"
        >
          <el-radio-group v-model="dimension" class="report-radio-group" size="small">
            <el-radio-button value="创量项目">创量项目</el-radio-button>
          </el-radio-group>
        </ReportFilterRow>

        <!-- 筛选维度 -->
        <ReportFilterRow label="筛选维度：">
          <div class="filter-selects">
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
      <!-- 详细数据 -->
      <ReportDetailTable
        title="详细数据"
        :columns="columns"
        :rows="rows"
        :total="rows.length"
        :summary-method="summaryMethod"
        :collapsed="tableCollapsed"
        @custom-metric="handleCustomMetric"
        @export="handleExport"
        @toggle="tableCollapsed = !tableCollapsed"
      >
        <template #actions>
          <!-- 归因时间类型（线上在操作区最左侧） -->
          <el-select v-model="attribution" size="small" class="attribution-select"
            placeholder="小红书-计费时间">
            <el-option
              v-for="o in ATTRIBUTION_TIME_OPTIONS"
              :key="o"
              :label="o"
              :value="o"
            />
          </el-select>
          <!-- 关联维度 -->
          <el-select v-model="relation" size="small" placeholder="关联维度" style="width: 120px">
            <el-option v-for="o in RELATION_DIM_PROJECT" :key="o" :label="o" :value="o" />
          </el-select>
        </template>
        <template #col-stat_cost="{ row }">{{ formatCost(row.stat_cost) }}</template>
      </ReportDetailTable>
    </template>
  </ReportPageShell>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Filter } from '@element-plus/icons-vue';
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
  ADVERTISER_OPTIONS,
  PROJECT_COLUMNS,
  RELATION_DIM_PROJECT,
  ATTRIBUTION_TIME_OPTIONS,
  projectRows,
  todayRange,
  dateRangeLabel,
} from '@/mock/reportData';

// 线上实测列宽
const COLUMN_WIDTH = { date: 135, project_name: 766, stat_cost: 766 };

// 筛选维度下拉（线上顺序：创量项目 / 账户 / 媒体 / 部门 / 人员 / 合作商）
const FILTER_DEFS = [
  {
    key: 'project',
    field: 'project',
    label: '创量项目',
    placeholder: '请选择创量项目',
    options: PROJECT_OPTIONS,
    model: [],
  },
  {
    key: 'account',
    field: 'account',
    label: '账户',
    wide: true,
    placeholder: '请选择账户',
    options: ADVERTISER_OPTIONS,
    model: [],
  },
  {
    key: 'media',
    field: 'media',
    label: '媒体',
    placeholder: '请选择媒体',
    options: MEDIA_OPTIONS.map((m) => m.label),
    model: ['不限'],
  },
  {
    key: 'dept',
    field: 'dept',
    label: '部门',
    placeholder: '请选择部门',
    options: DEPT_OPTIONS,
    model: [],
  },
  {
    key: 'staff',
    field: 'staff',
    label: '人员',
    placeholder: '请选择人员',
    options: OPTIMIZER_OPTIONS,
    model: [],
  },
  {
    key: 'partner',
    field: 'partner',
    label: '合作商',
    placeholder: '请选择合作商',
    options: PARTNER_OPTIONS,
    model: [],
  },
];

// ---------- 页面状态 ----------
const period = ref('汇总');
const dateRange = ref(todayRange());
const dimension = ref('创量项目');
const filterCollapsed = ref(false);
const tableCollapsed = ref(false);
const relation = ref('');
const attribution = ref('');
const filterSelects = ref(FILTER_DEFS.map((d, i) => ({ ...d, uid: `f${i}` })));

const visibleFilterSelects = computed(() =>
  filterCollapsed.value ? filterSelects.value.slice(0, 3) : filterSelects.value
);

// ---------- 表格列 ----------
// 末列「消耗」不设固定宽度，由 el-table 自适应铺满剩余空间（保证右对齐的数值不被裁切）
const columns = computed(() =>
  PROJECT_COLUMNS.map((c) => {
    if (c.prop === 'stat_cost') {
      return { prop: c.prop, label: c.label, align: c.align, sortable: c.sortable, minWidth: 120 };
    }
    return {
      prop: c.prop,
      label: c.label,
      align: c.align,
      sortable: c.sortable,
      width: COLUMN_WIDTH[c.prop] || 260,
    };
  })
);

// ---------- 表格行 ----------
const rows = computed(() => {
  const list = projectRows().map((r, i) => ({
    ...r,
    date: dateLabelFor(i),
    project: PROJECT_OPTIONS[i % PROJECT_OPTIONS.length],
    account: ADVERTISER_OPTIONS[i % ADVERTISER_OPTIONS.length],
    media: MEDIA_OPTIONS[(i % 4) + 1].label,
    dept: DEPT_OPTIONS[i % DEPT_OPTIONS.length],
    staff: OPTIMIZER_OPTIONS[i % OPTIMIZER_OPTIONS.length],
    partner: PARTNER_OPTIONS[i % PARTNER_OPTIONS.length],
    stat_cost: Number(r.stat_cost),
  }));
  return list.filter((r) => matchRow(r));
});

function matchRow(r) {
  for (const s of filterSelects.value) {
    // 「不限」表示不限制该维度
    const sel = (s.model || []).filter((v) => v !== '不限');
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
/* 归因时间类型下拉（线上宽 220px） */
.attribution-select {
  width: 220px;
}
/* 线上项目报表无分页条（线上 DOM 里没有 el-pagination） */
:deep(.report-card .report-pager) {
  display: none;
}
</style>
