<template>
  <!-- 广告报表 —— 创量线上 cl.mobgi.com/report/ad-report 1:1 复刻
   * 页头：广告报表 + 分日/分月/汇总（默认汇总）+ 日期区间
   * 筛选：媒体 / 数据维度 / 筛选维度（11 个组合盒）/ 数据筛选
   * 卡片：详细数据（关联维度 / 自定义指标 / 导出数据 / 收起）+ 明细表 + 合计行 + 分页
   *
   * 注：「详细数据」卡片按共享组件 ReportDetailTable.vue 的结构 1:1 复刻（同样的类名与 DOM），
   *     未直接引用共享组件，原因有三：
   *     ① 共享组件勾选列固定 50px，「合计」两字会被挤到竖排换行（线上该列约 60px）；
   *     ② 共享组件「关联维度」下拉固定 130px，线上是 120px 且占位文案为「关联维度」；
   *     ③ 共享组件不做分页切片，「分日」粒度下 60+ 行会一次性渲染、分页器翻页无效。
   *     共享组件修好这三点后，可直接换回 <ReportDetailTable> 引用。
   -->
  <ReportPageShell
    title="广告报表"
    v-model:period="period"
    v-model:date-range="dateRange"
    :show-filter="false"
  >
    <!-- 筛选区自绘：共享 ReportFilterToolbar 的「筛选维度」行只支持纯文本 label，
         承载不了线上「组合字段（组类型下拉 + 取值下拉）」结构 -->
    <template #before-filter>
      <div class="report-filter">
        <!-- 媒体 -->
        <ReportFilterRow
          label="媒体："
          :collapse-text="collapsed ? '展开筛选配置' : '收起筛选配置'"
          @toggle-collapse="collapsed = !collapsed"
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
            <el-radio-button v-for="d in DIM_AD" :key="d" :value="d">{{ d }}</el-radio-button>
          </el-radio-group>
        </ReportFilterRow>

        <!-- 筛选维度 -->
        <ReportFilterRow label="筛选维度：">
          <div class="report-search-box">
            <el-input
              v-model="keyword"
              size="small"
              placeholder="请输入关键词"
              :suffix-icon="Search"
            />
          </div>

          <!-- 纯文本 label 组合盒：优化师 / 合作商 / 部门 / 创量项目 / 产品 -->
          <ReportFilterSelect
            v-for="s in shownPlainSelects"
            :key="s.key"
            v-model="s.model"
            :label="s.label"
            :placeholder="s.placeholder"
            :options="s.options"
          />

          <!-- 组合字段：左侧「组类型」下拉 + 右侧「取值」下拉（线上 .combination-field） -->
          <div
            v-for="g in shownGroupedSelects"
            :key="g.key"
            class="report-select-box ad-combination"
          >
            <el-select v-model="g.group" class="ad-combination__group" placeholder="全部">
              <el-option v-for="o in g.groupOptions" :key="o" :label="o" :value="o" />
            </el-select>
            <el-select
              v-model="g.value"
              class="cl-filter-select ad-combination__value"
              multiple
              collapse-tags
              collapse-tags-tooltip
              filterable
              clearable
              :placeholder="'请选择' + g.group"
            >
              <el-option v-for="o in valueOptions(g)" :key="o" :label="o" :value="o" />
            </el-select>
          </div>

          <!-- + 添加筛选（线上是「已选筛选维度」多选，选项即维度清单） -->
          <el-popover placement="bottom-start" :width="200" trigger="click">
            <template #reference>
              <button class="report-add-filter" type="button">+ 添加筛选</button>
            </template>
            <el-checkbox-group v-model="activeDims" class="ad-add-filter-group">
              <el-checkbox
                v-for="d in ADD_FILTER_DIMS"
                :key="d"
                :label="d"
                :value="d"
              />
            </el-checkbox-group>
          </el-popover>

          <el-button type="primary" class="report-query-btn" size="small" @click="onQuery">
            查询
          </el-button>
        </ReportFilterRow>

        <!-- 数据筛选 -->
        <ReportFilterRow label="数据筛选：">
          <button class="report-filter-btn" type="button" @click="onDataFilter">
            <el-icon><Filter /></el-icon>筛选
          </button>
        </ReportFilterRow>
      </div>
    </template>

    <!-- 详细数据卡片 -->
    <div class="report-card">
      <div class="report-card-head">
        <div class="report-card-title">
          详细数据
          <el-popover
            v-model="helpVisible"
            :width="420"
            placement="right"
            trigger="click"
          >
            <template #reference>
              <el-icon><QuestionFilled /></el-icon>
            </template>
            <div class="ad-help-text">{{ HELP_TEXT }}</div>
          </el-popover>
        </div>
        <div class="report-card-actions">
          <!-- 关联维度：线上宽 120px、占位文案「关联维度」 -->
          <el-select
            v-model="relationDim"
            class="ad-relation-select"
            size="small"
            placeholder="关联维度"
          >
            <el-option v-for="o in RELATION_DIM_AD_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
          <el-button size="small" @click="onCustomMetric">
            <el-icon><Operation /></el-icon>自定义指标
          </el-button>
          <el-button size="small" @click="onExport">
            <el-icon><Download /></el-icon>导出数据
          </el-button>
          <a class="report-collapse-link" @click="cardCollapsed = !cardCollapsed">
            {{ cardCollapsed ? '展开' : '收起' }}
          </a>
        </div>
      </div>

      <div v-show="!cardCollapsed" class="report-table-wrap">
        <el-table
          class="report-table"
          :data="pagedRows"
          row-key="id"
          border
          show-summary
          :summary-method="summaryMethod"
        >
          <el-table-column type="selection" width="60" fixed="left" />

          <el-table-column
            v-for="col in columns"
            :key="col.prop"
            :prop="col.prop"
            :label="col.label"
            :width="col.width"
            :min-width="col.minWidth"
            :align="col.align || 'left'"
            :fixed="col.fixed"
            :sortable="col.sortable"
            show-overflow-tooltip
          />
        </el-table>

        <div class="report-pager">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="tableRows.length"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </div>
    </div>
  </ReportPageShell>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Filter, QuestionFilled, Operation, Download } from '@element-plus/icons-vue';
import ReportPageShell from '../components/ReportPageShell.vue';
import ReportFilterRow from '../components/ReportFilterRow.vue';
import ReportFilterSelect from '../components/ReportFilterSelect.vue';
import {
  MEDIA_OPTIONS,
  OPTIMIZER_OPTIONS,
  PARTNER_OPTIONS,
  DEPT_OPTIONS,
  PROJECT_OPTIONS,
  PRODUCT_OPTIONS,
  CONVERT_GOAL_OPTIONS,
  DEEP_CONVERT_OPTIONS,
  OUYAN_PRODUCT_OPTIONS,
  ANDROID_APP_OPTIONS,
  MINI_APP_OPTIONS,
  DOUYIN_NO_OPTIONS,
  DRAMA_ALBUM_OPTIONS,
  AD_COLUMNS,
  DIM_AD,
  adRows,
  todayRange,
  dateRangeLabel,
} from '@/mock/reportData';

/* ---------------- 基础状态 ---------------- */
const period = ref('汇总');            // 分日 / 分月 / 汇总
const dateRange = ref(todayRange());   // 近 7 天，如 2026-11-18 ~ 2026-11-24
const media = ref('toutiao_upgrade');  // 媒体，默认「巨量广告」
const dimension = ref('账户');          // 数据维度，默认「账户」
const keyword = ref('');
const collapsed = ref(false);          // 收起筛选配置
const cardCollapsed = ref(false);      // 卡片收起 / 展开
const relationDim = ref('');           // 关联维度
const helpVisible = ref(false);

const HELP_TEXT =
  '表示广告在投放期内的预估花费金额。当天数据可能会有波动，次日稳定消耗';

/* ---------------- 筛选维度：11 个组合盒 ---------------- */
/* 5 个纯文本 label 组合盒（优化师 / 合作商 / 部门 / 创量项目 / 产品） */
const plainSelects = reactive([
  {
    key: 'optimizer', dim: '优化师', label: '优化师', placeholder: '请选择优化师',
    options: OPTIMIZER_OPTIONS, model: [],
  },
  {
    key: 'partner', dim: '合作商', label: '合作商', placeholder: '请选择合作商',
    options: PARTNER_OPTIONS, model: [],
  },
  {
    key: 'dept', dim: '部门', label: '部门', placeholder: '请选择部门',
    options: DEPT_OPTIONS, model: [],
  },
  {
    key: 'project', dim: '创量项目', label: '创量项目', placeholder: '请选择创量项目',
    options: PROJECT_OPTIONS, model: [],
  },
  {
    key: 'product', dim: '产品', label: '产品', placeholder: '请选择产品',
    options: PRODUCT_OPTIONS, model: [],
  },
]);

/* 6 个「组合字段」组合盒：左侧组类型下拉 + 右侧取值下拉
   顺序与线上「全部下拉汇总」一致：转化目标 / 巨量商品 / 巨量应用 / 小程序小游戏 / 抖音号 / 剧目专辑ID */
const groupedSelects = reactive([
  {
    key: 'goal', dim: '优化目标', group: '转化目标',
    groupOptions: ['转化目标', '深度转化目标'],
    options: CONVERT_GOAL_OPTIONS, value: [],
  },
  {
    key: 'ouyan', dim: '巨量商品', group: '巨量商品-通用版',
    groupOptions: OUYAN_PRODUCT_OPTIONS,
    options: OUYAN_PRODUCT_OPTIONS, value: [],
  },
  {
    key: 'android', dim: '巨量应用', group: '安卓应用',
    groupOptions: ANDROID_APP_OPTIONS,
    options: ANDROID_APP_OPTIONS, value: [],
  },
  {
    key: 'mini', dim: '小程序/小游戏', group: '微信小程序',
    groupOptions: MINI_APP_OPTIONS,
    options: MINI_APP_OPTIONS, value: [],
  },
  {
    key: 'douyin', dim: '抖音号', group: '抖音号',
    groupOptions: DOUYIN_NO_OPTIONS,
    options: DOUYIN_NO_OPTIONS, value: [],
  },
  {
    key: 'drama', dim: '剧目/专辑ID', group: '剧目/专辑ID',
    groupOptions: DRAMA_ALBUM_OPTIONS,
    options: DRAMA_ALBUM_OPTIONS, value: [],
  },
]);

/* 优化目标随左侧组类型切换取值清单（转化目标 / 深度转化目标） */
const GOAL_OPTIONS = {
  转化目标: CONVERT_GOAL_OPTIONS,
  深度转化目标: DEEP_CONVERT_OPTIONS,
};
function valueOptions(g) {
  if (g.key === 'goal') return GOAL_OPTIONS[g.group] || [];
  return g.options;
}

/* 「+ 添加筛选」可选的维度清单（线上 add-filter 下拉选项） */
const ADD_FILTER_DIMS = [
  '优化师', '合作商', '部门', '创量项目', '产品', '优化目标',
  '巨量商品', '巨量应用', '小程序/小游戏', '抖音号', '剧目/专辑ID',
];
const activeDims = ref([...ADD_FILTER_DIMS]);

const visiblePlainSelects = computed(() =>
  plainSelects.filter((s) => activeDims.value.includes(s.dim))
);
const visibleGroupedSelects = computed(() =>
  groupedSelects.filter((g) => activeDims.value.includes(g.dim))
);

/* 「收起筛选配置」时只保留前 3 个筛选条件（与线上、共享 ReportFilterToolbar 一致） */
const shownKeys = computed(() => {
  const all = [
    ...visiblePlainSelects.value.map((s) => s.key),
    ...visibleGroupedSelects.value.map((g) => g.key),
  ];
  return new Set(collapsed.value ? all.slice(0, 3) : all);
});
const shownPlainSelects = computed(() =>
  visiblePlainSelects.value.filter((s) => shownKeys.value.has(s.key))
);
const shownGroupedSelects = computed(() =>
  visibleGroupedSelects.value.filter((g) => shownKeys.value.has(g.key))
);

/* 关联维度下拉（线上广告报表 14 项） */
const RELATION_DIM_AD_OPTIONS = [
  '媒体', '优化师', '合作商', '部门', '产品', '创量项目', '账户主体', '账户备注',
  '剧目/专辑ID', '巨量商品', '巨量应用', '优化目标', '小程序/小游戏', '抖音号',
];

/* ---------------- 行数据 ---------------- */
const MEDIA_ROW_TAG = [
  'toutiao_upgrade', 'toutiao_upgrade', 'toutiao_upgrade',
  'toutiao_uni', 'toutiao_oc', 'gdt_upgrade',
];
const MEDIA_LABELS = MEDIA_OPTIONS.reduce((m, o) => {
  m[o.value] = o.label;
  return m;
}, {});
const CARRIER_OPTIONS = ['安卓应用', 'iOS应用', '小程序', 'Web端'];

/* 组合盒取值 -> 行字段 */
const FILTER_FIELDS = {
  optimizer: 'optimizer',
  partner: 'partner',
  dept: 'dept',
  project: 'project',
  product: 'product',
  goal: 'convert_goal',
  ouyan: 'ouyan_product',
  android: 'ouyan_app',
  mini: 'mini_app',
  douyin: 'douyin_no',
  drama: 'drama',
};

/* 数据维度 -> 表格「账户名称」列展示的实体 */
const DIM_ENTITY = {
  账户: (r) => r.advertiser_name,
  广告: (r) => `${r.advertiser_name}-广告${r.id}`,
  优化师: (r) => r.optimizer,
  产品: (r) => r.product,
  创量项目: (r) => r.project,
  媒体: (r) => MEDIA_LABELS[r.media] || r.media,
  合作商: (r) => r.partner,
  部门: (r) => r.dept,
  投放载体: (r) => r.carrier,
};

/* 给 mock 行补齐各维度字段 */
function enrichRows() {
  return adRows().map((r, i) => ({
    ...r,
    optimizer: OPTIMIZER_OPTIONS[i % OPTIMIZER_OPTIONS.length],
    partner: PARTNER_OPTIONS[i % PARTNER_OPTIONS.length],
    dept: DEPT_OPTIONS[i % DEPT_OPTIONS.length],
    project: PROJECT_OPTIONS[i % PROJECT_OPTIONS.length],
    product: PRODUCT_OPTIONS[i % PRODUCT_OPTIONS.length],
    media: MEDIA_ROW_TAG[i % MEDIA_ROW_TAG.length],
    carrier: CARRIER_OPTIONS[i % CARRIER_OPTIONS.length],
    convert_goal: CONVERT_GOAL_OPTIONS[i % CONVERT_GOAL_OPTIONS.length],
    ouyan_product: OUYAN_PRODUCT_OPTIONS[i % OUYAN_PRODUCT_OPTIONS.length],
    ouyan_app: ANDROID_APP_OPTIONS[i % ANDROID_APP_OPTIONS.length],
    mini_app: MINI_APP_OPTIONS[i % MINI_APP_OPTIONS.length],
    douyin_no: DOUYIN_NO_OPTIONS[0],
    drama: DRAMA_ALBUM_OPTIONS[0],
  }));
}

/* ---------------- 日期工具 ---------------- */
const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function parseDate(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function eachDay(start, end) {
  const out = [];
  let cur = parseDate(start);
  const last = parseDate(end);
  let guard = 0;
  while (cur <= last && guard < 92) {
    out.push(fmtDate(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
    guard += 1;
  }
  return out;
}
function eachMonth(start, end) {
  const out = [];
  const s = parseDate(start);
  const e = parseDate(end);
  let y = s.getFullYear();
  let m = s.getMonth();
  let guard = 0;
  while ((y < e.getFullYear() || (y === e.getFullYear() && m <= e.getMonth())) && guard < 24) {
    out.push(`${y}${pad(m + 1)}`);
    m += 1;
    if (m > 11) { m = 0; y += 1; }
    guard += 1;
  }
  return out;
}

/* ---------------- 过滤 -> 展开粒度 -> 按数据维度聚合 ---------------- */
const filteredRows = computed(() => {
  let list = enrichRows();

  // 媒体（默认「巨量广告」；「不限」不过滤）
  if (media.value && media.value !== 'aggregate') {
    list = list.filter((r) => r.media === media.value);
  }

  // 关键词
  const kw = keyword.value.trim();
  if (kw) {
    list = list.filter(
      (r) =>
        String(r.advertiser_name || '').includes(kw) ||
        String(r.advertiser_id || '').includes(kw)
    );
  }

  // 筛选维度（组合盒之间 AND，盒内 OR）
  plainSelects.forEach((s) => {
    if (s.model.length) {
      list = list.filter((r) => s.model.includes(r[FILTER_FIELDS[s.key]]));
    }
  });
  groupedSelects.forEach((g) => {
    if (g.value.length) {
      list = list.filter((r) => g.value.includes(r[FILTER_FIELDS[g.key]]));
    }
  });

  return list;
});

const expandedRows = computed(() => {
  const list = filteredRows.value;
  const [start, end] =
    dateRange.value && dateRange.value.length === 2 ? dateRange.value : todayRange();

  if (period.value === '分日') {
    const days = eachDay(start, end);
    const out = [];
    list.forEach((r) => {
      days.forEach((d) => {
        out.push({ ...r, id: `${r.id}-${d.replace(/-/g, '')}`, date: d.replace(/-/g, '') });
      });
    });
    return out;
  }

  if (period.value === '分月') {
    const months = eachMonth(start, end);
    const out = [];
    list.forEach((r) => {
      months.forEach((m) => {
        out.push({ ...r, id: `${r.id}-${m}`, date: m });
      });
    });
    return out;
  }

  // 汇总：线上时间列格式 20261118-20261124
  const label = dateRangeLabel(start, end);
  return list.map((r) => ({ ...r, date: label }));
});

const tableRows = computed(() => {
  const rows = expandedRows.value;
  const entity = DIM_ENTITY[dimension.value];
  if (!entity || dimension.value === '账户') return rows;

  // 非「账户」维度：按该维度实体聚合消耗
  const buckets = new Map();
  rows.forEach((r) => {
    const name = entity(r);
    const key = `${r.date}__${name}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        id: key,
        date: r.date,
        advertiser_id: '--',
        advertiser_name: name,
        douyin_id: '--',
        douyin_nick: '--',
        is_native: '--',
        stat_cost: 0,
      });
    }
    buckets.get(key).stat_cost += Number(r.stat_cost) || 0;
  });
  return Array.from(buckets.values()).map((r) => ({
    ...r,
    stat_cost: +r.stat_cost.toFixed(2),
  }));
});

/* ---------------- 分页 ---------------- */
const page = ref(1);
const pageSize = ref(20);
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return tableRows.value.slice(start, start + pageSize.value);
});
watch(
  () => [tableRows.value.length, pageSize.value],
  () => {
    const max = Math.max(1, Math.ceil(tableRows.value.length / pageSize.value));
    if (page.value > max) page.value = max;
  }
);

/* ---------------- 表格列（严格按 spec） ---------------- */
/* spec：勾选列 / 时间 / 账户ID / 账户名称 / 抖音号 / 抖音昵称 / 是否原生广告 / 消耗
   「是否原生广告」线上为右对齐，这里覆盖共享 AD_COLUMNS 的居中对齐 */
const columns = AD_COLUMNS.map((c) =>
  c.prop === 'is_native' ? { ...c, align: 'right' } : c
);

/* 合计行：首格「合计」，中间「--」，末列消耗合计（对全量数据求和） */
function summaryMethod({ columns: cols }) {
  const total = tableRows.value.reduce((s, r) => s + (Number(r.stat_cost) || 0), 0);
  return (cols || []).map((c, i) => {
    if (i === 0) return '合计';
    if (c && c.property === 'stat_cost') return total.toFixed(2);
    return '--';
  });
}

/* ---------------- 交互 ---------------- */
function onQuery() {
  ElMessage.success('查询成功');
}
function onExport() {
  ElMessage.success('导出成功');
}
function onCustomMetric() {
  ElMessage.info('自定义指标');
}
function onDataFilter() {
  ElMessage.info('数据筛选');
}
</script>

<style scoped>
/* 组合字段：左侧组类型下拉 + 右侧取值下拉（线上 .combination-field 两个 el-select） */
.report-page .report-select-box.ad-combination .el-select.ad-combination__group {
  width: 146px;
}
/* 左侧组类型是单选，收紧内边距，保证「巨量商品-通用版」等文案完整显示 */
.report-page .report-select-box.ad-combination .ad-combination__group .el-select__wrapper {
  padding-left: 8px;
  padding-right: 4px;
}
.report-page .report-select-box.ad-combination .el-select.ad-combination__value {
  width: 168px;
}
/* EP 2.14 的 select 不再使用 .el-input__inner，共享样式里的 13px 字号选择器失效，
   这里按线上筛选区的 13px 字号补齐 */
.report-filter :deep(.el-select__wrapper) {
  font-size: 13px;
}
.ad-relation-select :deep(.el-select__wrapper) {
  font-size: 13px;
}
/* 「+ 添加筛选」弹层里的维度清单 */
.ad-add-filter-group {
  display: flex;
  flex-direction: column;
  max-height: 240px;
  overflow: auto;
}
.ad-add-filter-group :deep(.el-checkbox) {
  margin-right: 0;
}
/* 卡片头「关联维度」下拉：线上宽 120px */
.ad-relation-select {
  width: 120px;
}
/* 卡片标题旁的说明气泡 */
.ad-help-text {
  font-size: 13px;
  line-height: 1.7;
  color: #666;
}
</style>
