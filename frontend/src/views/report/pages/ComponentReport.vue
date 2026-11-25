<template>
  <ReportPageShell
    v-model:period="period"
    v-model:date-range="dateRange"
    title="组件报表"
    :periods="PERIODS"
    :show-filter="false"
  >
    <!-- ============ 筛选区（.report-filter） ============ -->
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

        <!-- 筛选维度 -->
        <ReportFilterRow v-if="!collapsed" label="筛选维度：">
          <div class="filter-fields">
            <div class="report-search-box">
              <el-input v-model="keyword" size="small" placeholder="请输入关键词" :suffix-icon="Search" />
            </div>

            <div
              v-for="s in visibleSelects"
              :key="s.key"
              :class="{ 'select-account': s.key === 'account' }"
            >
              <ReportFilterSelect
                v-model="s.model"
                :label="s.label"
                :placeholder="s.placeholder"
                :options="s.options"
                :wide="s.wide"
              />
            </div>

            <!-- + 添加筛选（线上：已选筛选维度的多选清单，勾选即生效） -->
            <el-popover
              v-model:visible="addFilterVisible"
              placement="bottom-start"
              :width="190"
              trigger="click"
            >
              <template #reference>
                <button class="report-add-filter" type="button">+ 添加筛选</button>
              </template>
              <el-checkbox-group v-model="activeDims" class="cr-add-filter-group">
                <el-checkbox
                  v-for="d in ADD_FILTER_OPTIONS"
                  :key="d"
                  :label="d"
                  :value="d"
                />
              </el-checkbox-group>
            </el-popover>
          </div>

          <el-button type="primary" size="small" class="report-query-btn" @click="onQuery">
            查询
          </el-button>
        </ReportFilterRow>

        <!-- 数据筛选 -->
        <ReportFilterRow v-if="!collapsed" label="数据筛选：">
          <!-- 「数据筛选」弹层（线上 1:1） -->
          <DataFilterPopover
            v-model:visible="dataFilterVisible"
            v-model:filter="dataFilter"
            metric-key="component"
            @apply="onDataFilterApply"
          />
        </ReportFilterRow>
      </div>
    </template>

    <!-- ============ 告警条 ============ -->
    <div class="report-alert">
      <el-icon><WarningFilled /></el-icon>
      <span>当前仅拉取部分组件类型进行数据展示，如需核实汇总数据，请指定组件类型后再与投放端组件报表进行对比。</span>
    </div>

    <!-- ============ 详细数据 ============ -->
    <div class="report-card">
      <div class="report-card-head">
        <div class="report-card-title">详细数据</div>
        <div class="report-card-actions">
          <!-- 转化回传口径（上报时间）：线上每个选项都带一个 ⓘ 口径说明 -->
          <el-select v-model="caliber" size="small" class="caliber-select" placeholder="指标口径">
            <el-option
              v-for="o in CALIBER_OPTIONS"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            >
              <span class="caliber-option">
                {{ o.label }}
                <el-popover placement="top" :width="220" trigger="hover">
                  <template #reference>
                    <el-icon class="caliber-help" @click.stop><QuestionFilled /></el-icon>
                  </template>
                  {{ tipText('若需切换口径，请联系智投运营开通相关能力') }}
                </el-popover>
              </span>
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
            <el-option v-for="o in RELATION_DIM_COMPONENT" :key="o" :label="o" :value="o" />
          </el-select>

          <el-button size="small" @click="onCustomMetric">
            <el-icon><Operation /></el-icon>自定义指标
          </el-button>
          <!-- 自定义指标 ⓘ -->
          <el-popover placement="top" :width="200" trigger="hover">
            <template #reference>
              <el-icon class="export-help" @click.stop><QuestionFilled /></el-icon>
            </template>
            {{ tipText('自定义指标') }}
          </el-popover>

          <el-button size="small" @click="onExport">
            导出数据
          </el-button>
          <!-- 导出数据 ⓘ -->
          <el-popover placement="top" :width="200" trigger="hover">
            <template #reference>
              <el-icon class="export-help" @click.stop><QuestionFilled /></el-icon>
            </template>
            {{ tipText('导出所有页面的数据') }}
          </el-popover>

          <a class="report-collapse-link" @click="tableCollapsed = !tableCollapsed">
            {{ tableCollapsed ? '展开' : '收起' }}
          </a>
        </div>
      </div>

      <div v-show="!tableCollapsed" class="report-table-wrap">
        <el-table
          class="report-table"
          :data="pageRows"
          row-key="id"
          border
          show-summary
          :summary-method="summaryMethod"
          @sort-change="onSortChange"
        >
          <el-table-column type="selection" width="60" fixed="left" />

          <el-table-column
            v-for="(col, ci) in columns"
            :key="`${col.prop}_${ci}`"
            :prop="col.prop"
            :label="col.label"
            :min-width="col.width || col.minWidth"
            :align="col.align || 'left'"
            :sortable="col.sortable"
            :show-overflow-tooltip="col.type !== 'preview'"
          >
            <!-- 线上列头：文字本身即提示气泡锚点（hover 出现口径说明；关联维度列无线上口径说明） -->
            <template #header>
              <el-tooltip v-if="col.tip" :content="col.tip" placement="top" :show-after="150">
                <span class="cr-col-title">{{ col.label }}</span>
              </el-tooltip>
              <span v-else class="cr-col-title">{{ col.label }}</span>
            </template>

            <template v-if="col.type === 'preview'" #default="{ row }">
              <div class="component-wrapper clickable" @click="onPreview(row)">
                <img class="report-preview component-preview" :src="row.preview" alt="组件预览" />
                <div v-if="row.is_video" class="video-play">
                  <el-icon><VideoPlay /></el-icon>
                </div>
              </div>
            </template>

            <template v-else-if="col.money" #default="{ row }">
              {{ money(row[col.prop]) }}
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

  <!-- 组件预览：点缩略图打开大图预览层（线上点击预览图会放大查看） -->
  <el-dialog
    v-model="previewVisible"
    title="组件预览"
    width="520px"
    append-to-body
    class="component-preview-dialog"
  >
    <div class="cr-preview-body">
      <img
        v-if="previewRow"
        class="cr-preview-img"
        :src="previewRow.preview"
        :alt="previewRow.component_id"
      />
      <div v-if="previewRow" class="cr-preview-meta">
        组件ID：{{ previewRow.component_id }}
      </div>
    </div>
  </el-dialog>

  <!-- 自定义指标弹窗（线上 1:1：标题「自定义指标」/ 左分类 + 中指标 + 右已选） -->
  <CustomMetricDialog
    v-model="metricVisible"
    metric-key="component"
    @apply="onMetricApply"
  />

  <!-- 导出数据结果提示（线上：「任务创建成功，请前往工具—下载中心查看详情」） -->
  <ExportResultDialog v-model="exportVisible" mode="default" />
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import {
  Search, Operation, QuestionFilled, WarningFilled, VideoPlay,
} from '@element-plus/icons-vue';
import ReportPageShell from '../components/ReportPageShell.vue';
import ReportFilterRow from '../components/ReportFilterRow.vue';
import ReportFilterSelect from '../components/ReportFilterSelect.vue';
import CustomMetricDialog from '../components/CustomMetricDialog.vue';
import ExportResultDialog from '../components/ExportResultDialog.vue';
import DataFilterPopover, {
  matchDataFilter,
  demoMetricValue,
} from '../components/DataFilterPopover.vue';
import { REPORT_METRICS, REPORT_METRIC_DEFAULT_SELECTED } from '@/mock/reportMetrics';
import { REPORT_TIPS } from '@/mock/reportTips';
import {
  ADVERTISER_OPTIONS,
  PROJECT_OPTIONS,
  SUBJECT_OPTIONS,
  RELATION_DIM_COMPONENT,
  METRIC_CALIBER_OPTIONS,
} from '@/mock/reportData';

/* ------------------------------------------------------------------ *
 * 线上实测常量（采集自 cl.mobgi.com/report/component-report）
 * ------------------------------------------------------------------ */
const PERIODS = ['分日', '分月', '汇总'];
// 组件报表线上媒体只有一个：腾讯广告3.0
const MEDIA_OPTIONS = [{ value: 'gdt_upgrade', label: '腾讯广告3.0' }];
// 线上「+ 添加筛选」下拉
const ADD_FILTER_OPTIONS = ['账户', '组件类型', '智投项目', '编导', '剪辑'];
// 线上「组件类型」下拉实测选项
const COMPONENT_TYPE_OPTIONS = [
  '未知', '图片组件', '图片列表组件', '视频组件', '卖点图组件', '轮播组件',
  '视频结束页组件', '短视频组件', '集装箱创意组合组件', '小游戏试玩页组件',
  'ott 视频组件', '橱窗视频组件', '橱窗图片组件', '单图 1:1', '图集 1:1',
  '图文 1:1', '大图 20:7', '视频 16:9,封面图 16:9', '视频 16:9,封面图 4:3',
  '视频 16:9,封面图 1:1', '跳转组件', '16:9 单图', '图集 3:2', '9:16 图集',
];
// 线上「编导 / 剪辑」下拉实测选项
const STAFF_OPTIONS = [
  '黄莹曦', '马学泰', '张浩', '王研', '张瑞凯', '裴心怡', '李玉玲', '冯逸',
  '李倩', '田博文', '汪玲丽', '邓艺爽', '倪秀云', '申旭阳', '吕瑶',
  '李杉杉', '杜浩', '魏然', '刘松涵', '杨新宇', '搜索更多(25)...',
];
// 指标口径下拉：线上每个选项右侧带 ⓘ，hover 显示「若需切换口径，请联系智投运营开通相关能力」
const CALIBER_OPTIONS = [
  { label: '广告播放口径', value: METRIC_CALIBER_OPTIONS[0] },
  { label: '转化回传口径（上报时间）', value: METRIC_CALIBER_OPTIONS[1] },
  { label: '转化回传口径（激活时间）', value: METRIC_CALIBER_OPTIONS[2] },
];

/* ------------------------------------------------------------------ *
 * 日期工具
 * ------------------------------------------------------------------ */
const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// 线上默认区间：2026-11-17 至 2026-11-23（截至昨天往前 7 天）
const DEFAULT_END = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return fmtDate(d);
})();
const DEFAULT_START = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return fmtDate(d);
})();
const compact = (s) => String(s || '').replace(/-/g, '');

function daysInRange(range) {
  if (!range || range.length !== 2) return [];
  const out = [];
  const cur = new Date(`${range[0]}T00:00:00`);
  const end = new Date(`${range[1]}T00:00:00`);
  while (cur <= end && out.length < 31) {
    out.push(fmtDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out.length ? out : [range[1]];
}

/* ------------------------------------------------------------------ *
 * 页面状态
 * ------------------------------------------------------------------ */
const period = ref('汇总');
const dateRange = ref([DEFAULT_START, DEFAULT_END]);
const media = ref('gdt_upgrade');
const keyword = ref('');
const collapsed = ref(false);
const tableCollapsed = ref(false);
const caliber = ref(METRIC_CALIBER_OPTIONS[1]);
const relation = ref([]);
const addFilterVisible = ref(false);
const dataFilterVisible = ref(false);
/* 「数据筛选」已生效的条件：{ logic: 'all'|'any', conditions: [{ metric, operator, value }] } */
const dataFilter = ref({ logic: 'all', conditions: [] });
const page = ref(1);
const pageSize = ref(20);
// 线上默认按花费倒序
const sortProp = ref('stat_cost');
const sortOrder = ref('descending');

/* ------------------------------------------------------------------ *
 * 问号提示文案（全部取自线上采集：mock/reportTips.js）
 * ------------------------------------------------------------------ */
const CR_TIPS = REPORT_TIPS.component || [];
/** 按原文取提示文案（命中则原样返回，未命中也原样返回，避免文案走样） */
function tipText(s) {
  const hit = CR_TIPS.find((t) => t.body === s);
  return hit ? hit.body : s;
}

/* ------------------------------------------------------------------ *
 * 自定义指标 / 导出数据 / 组件预览
 * ------------------------------------------------------------------ */
const metricVisible = ref(false);    // 「自定义指标」弹窗
const exportVisible = ref(false);    // 「导出数据」结果提示
const previewVisible = ref(false);   // 「组件预览」大图预览层
const previewRow = ref(null);
/* 已选指标：线上默认「花费」 */
const selectedMetrics = ref([...(REPORT_METRIC_DEFAULT_SELECTED.component || [])]);

const selects = ref([
  { key: 'account', label: '账户', placeholder: '请选择账户', options: ADVERTISER_OPTIONS, model: [], wide: true },
  { key: 'component_type', label: '组件类型', placeholder: '请选择组件类型', options: COMPONENT_TYPE_OPTIONS, model: [] },
  { key: 'project', label: '智投项目', placeholder: '请选择智投项目', options: PROJECT_OPTIONS, model: [] },
  { key: 'director', label: '编导', placeholder: '请选择编导', options: STAFF_OPTIONS, model: [] },
  { key: 'editor', label: '剪辑', placeholder: '请选择剪辑', options: STAFF_OPTIONS, model: [] },
]);
/* 「+ 添加筛选」：已选筛选维度（线上默认 5 个全选，勾选即生效） */
const activeDims = ref(selects.value.map((s) => s.label));
const visibleSelects = computed(() =>
  selects.value.filter((s) => activeDims.value.includes(s.label))
);

/* ------------------------------------------------------------------ *
 * 预览占位图（data-URI SVG，方形缩略图）
 * ------------------------------------------------------------------ */
const PREVIEW_COLORS = [
  ['#ffd9b0', '#fd7e4f'],
  ['#c6e2ff', '#409eff'],
  ['#d9f0d3', '#67c23a'],
  ['#ecd9ff', '#9254de'],
  ['#ffe6a8', '#e6a23c'],
  ['#dfe6ec', '#8a94a6'],
];
// 线上组件预览为竖版广告素材（80 × 120），占位图按竖版构图
const PREVIEWS = PREVIEW_COLORS.map(([c1, c2]) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="120" viewBox="0 0 80 120">`
    + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
    + `<stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>`
    + `</linearGradient></defs>`
    + `<rect width="80" height="120" fill="url(#g)"/>`
    + `<circle cx="40" cy="40" r="15" fill="rgba(255,255,255,.72)"/>`
    + `<rect x="14" y="66" width="52" height="9" rx="4.5" fill="rgba(255,255,255,.66)"/>`
    + `<rect x="22" y="82" width="36" height="7" rx="3.5" fill="rgba(255,255,255,.5)"/>`
    + `<rect x="16" y="100" width="48" height="7" rx="3.5" fill="rgba(255,255,255,.38)"/>`
    + `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
});

/* ------------------------------------------------------------------ *
 * 明细数据（线上首屏 20 行原样 + 其余按总数补齐）
 * ------------------------------------------------------------------ */
const TOTAL_COUNT = 1309;      // 线上「共 1309 条」
const TOTAL_COST = 243533.05;  // 线上合计 243,533.05
// 线上首屏 20 行（组件ID / 花费）
const HEAD_ROWS = [
  ['1940452378085', 7501.22], ['1957435171273', 7401.26], ['1940282532959', 6579.95],
  ['1973088609928', 6376.55], ['1946144298375', 6212.29], ['1945380447146', 6077.72],
  ['1964762629829', 4386.39], ['1965870252034', 4249.96], ['1973088605017', 4229.34],
  ['1951795450337', 3601.36], ['1974575938795', 3324.67], ['1963392594038', 3097.27],
  ['1953199968535', 3072.71], ['1942981548418', 2998.53], ['1945392512981', 2962.52],
  ['1973023971337', 2745.40], ['1953139597922', 2645.05], ['1933290423713', 2546.55],
  ['1976260878098', 2514.58], ['1938379536508', 2434.42],
];

function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const round2 = (n) => Math.round(n * 100) / 100;
const money = (n) => (Number(n) || 0).toFixed(2);
const moneyComma = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ------------------------------------------------------------------ *
 * 表格列 = 固定列（时间 / 组件ID / 组件预览）+ 「自定义指标」选中的指标列
 * ------------------------------------------------------------------ */
const FIXED_COLUMNS = [
  { prop: 'date', label: '时间', width: 135, sortable: 'custom', tip: tipText('时间') },
  { prop: 'component_id', label: '组件ID', minWidth: 300, tip: tipText('组件ID') },
  {
    prop: 'preview',
    label: '组件预览',
    width: 130,
    align: 'center',
    tip: tipText('组件预览'),
    type: 'preview',
  },
];
/* 与 mock 行字段绑定的指标列（线上默认只有「花费」） */
const COMPONENT_METRIC_META = {
  花费: {
    prop: 'stat_cost',
    minWidth: 200,
    align: 'right',
    sortable: 'custom',
    money: true,
  },
};
/* 指标口径说明（列头 ⓘ 文案，取自线上采集的指标集 mock/reportMetrics.js） */
const METRIC_DESC = (() => {
  const map = {};
  ((REPORT_METRICS.component || {}).blocks || []).forEach((b) => {
    (b.metrics || []).forEach((m) => {
      map[m.name] = m.desc;
    });
  });
  return map;
})();

/* 关联维度 → 表格列（线上实测：勾选后插在固定列之后、指标列之前） */
const RELATION_COLUMN_MAP = {
  账户: { prop: 'account', width: 220 },
  广告ID: { prop: 'ad_id', width: 200 },
  创意ID: { prop: 'creative_id', width: 200 },
  组件类型: { prop: 'comp_type', width: 180 },
  账户主体: { prop: 'subject', width: 220 },
  账户备注: { prop: 'account_note', width: 180 },
  编导: { prop: 'director', width: 160 },
  剪辑: { prop: 'editor', width: 160 },
};
/* 关联维度列（线上：勾选后表格多出对应列） */
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

const columns = computed(() => {
  const list = [...FIXED_COLUMNS, ...relationColumns.value];
  selectedMetrics.value.forEach((name) => {
    const tip = METRIC_DESC[name] || name;
    const meta = COMPONENT_METRIC_META[name];
    if (meta) {
      list.push({ ...meta, label: name, tip });
    } else {
      /* 没有 mock 字段的指标：仍然成列（数值为 0 占位），保证「列增减生效」 */
      list.push({
        prop: name,
        label: name,
        width: 160,
        align: 'right',
        money: true,
        tip,
        placeholder: true,
      });
    }
  });
  return list;
});

/** 当前筛选条件签名：任何筛选变化都会重新生成一份数据 */
const signature = computed(() => JSON.stringify([
  period.value,
  (dateRange.value || []).join('~'),
  media.value,
  keyword.value,
  visibleSelects.value.map((s) => `${s.key}:${(s.model || []).join(',')}`).join('|'),
]));
const DEFAULT_SIGNATURE = computed(() => JSON.stringify([
  '汇总',
  `${DEFAULT_START}~${DEFAULT_END}`,
  'gdt_upgrade',
  '',
  visibleSelects.value.map((s) => `${s.key}:`).join('|'),
]));

const allRows = computed(() => {
  const isDefault = signature.value === DEFAULT_SIGNATURE.value;
  const seed = hash(signature.value);
  const factor = isDefault ? 1 : 1 + ((seed % 13) - 6) / 100;
  const r = rng(seed || 1);

  const rows = [];
  for (let i = 0; i < TOTAL_COUNT; i++) {
    const head = isDefault ? HEAD_ROWS[i] : null;
    rows.push({
      id: i + 1,
      component_id: head ? head[0] : String(1930000000000 + Math.floor(r() * 4999999999)),
      preview: PREVIEWS[i % PREVIEWS.length],
      is_video: i % 4 !== 3,
      stat_cost: head ? head[1] : 0,
      /* 关联维度列取值 */
      account: ADVERTISER_OPTIONS[i % ADVERTISER_OPTIONS.length],
      ad_id: String(1869584152800000 + i * 13),
      creative_id: String(1940452378000 + i * 7),
      comp_type: COMPONENT_TYPE_OPTIONS[i % COMPONENT_TYPE_OPTIONS.length],
      subject: SUBJECT_OPTIONS[i % SUBJECT_OPTIONS.length],
      account_note: `备注-${i % 5 + 1}`,
      director: STAFF_OPTIONS[i % STAFF_OPTIONS.length],
      editor: STAFF_OPTIONS[(i + 3) % STAFF_OPTIONS.length],
    });
  }

  // 花费：默认态沿用线上首屏 20 行原值 + 其余按权重补齐；其它态整表按权重生成
  const targetTotal = TOTAL_COST * factor;
  if (isDefault) {
    const headSum = rows.slice(0, HEAD_ROWS.length).reduce((a, b) => a + b.stat_cost, 0);
    const tailTarget = targetTotal - headSum;
    const tail = rows.slice(HEAD_ROWS.length);
    // 偏斜权重：少量大额 + 大量小额，贴近线上消耗分布
    const weights = tail.map(() => 0.02 + Math.pow(r(), 2.2) * 3);
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    tail.forEach((row, i) => {
      row.stat_cost = round2(tailTarget * (weights[i] / sum));
    });
    // 修正四舍五入误差，保证合计精确
    const tailSum = tail.reduce((a, b) => a + b.stat_cost, 0);
    if (tail.length) {
      tail[tail.length - 1].stat_cost = round2(tail[tail.length - 1].stat_cost + (tailTarget - tailSum));
    }
  } else {
    const weights = rows.map(() => 0.02 + Math.pow(r(), 2.2) * 3);
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    rows.forEach((row, i) => {
      row.stat_cost = round2(targetTotal * (weights[i] / sum));
    });
    const cur = rows.reduce((a, b) => a + b.stat_cost, 0);
    const last = rows[rows.length - 1];
    last.stat_cost = round2(last.stat_cost + (targetTotal - cur));
  }

  // 时间列随粒度 / 日期区间变化
  const days = daysInRange(dateRange.value);
  rows.forEach((row, i) => {
    if (period.value === '汇总') {
      row.date = `${compact(dateRange.value[0])}-${compact(dateRange.value[1])}`;
    } else if (period.value === '分月') {
      row.date = compact(dateRange.value[1]).slice(0, 6);
    } else {
      row.date = compact(days[i % days.length]);
    }
    row.stat_cost_text = money(row.stat_cost);
  });
  return rows;
});

/** 关键词 / 数据筛选后的结果集 */
const filteredRows = computed(() => {
  const kw = keyword.value.trim();
  return allRows.value.filter((row) => {
    if (kw && !row.component_id.includes(kw)) return false;
    // 数据筛选：指标 + 运算符 + 值 的组合条件（所有 = AND，任一 = OR）
    if (!matchDataFilter(row, dataFilter.value, resolveMetricValue)) return false;
    return true;
  });
});

/** 「数据筛选」取指标值：花费取 stat_cost，其余指标按名称生成演示值 */
function resolveMetricValue(row, name) {
  if (name === '花费' || name === '消耗') return Number(row.stat_cost) || 0;
  const col = columns.value.find((c) => c.label === name);
  if (col && col.prop && row[col.prop] !== undefined && row[col.prop] !== null && row[col.prop] !== '') {
    return row[col.prop];
  }
  return demoMetricValue(row, name, Number(row.stat_cost) || 0);
}

const sortedRows = computed(() => {
  const list = filteredRows.value.slice();
  if (!sortProp.value) return list;
  const dir = sortOrder.value === 'ascending' ? 1 : -1;
  list.sort((a, b) => {
    const va = a[sortProp.value];
    const vb = b[sortProp.value];
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
    return String(va).localeCompare(String(vb)) * dir;
  });
  return list;
});

const total = computed(() => sortedRows.value.length);
const totalCost = computed(() => round2(filteredRows.value.reduce((a, b) => a + b.stat_cost, 0)));
const pageRows = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  const list = sortedRows.value.slice(start, start + pageSize.value);
  /* 自定义指标里新增的、无 mock 字段的指标列：数值 0 占位 */
  const blanks = columns.value.filter((c) => c.placeholder);
  if (!blanks.length) return list;
  return list.map((r) => {
    const o = { ...r };
    blanks.forEach((c) => {
      o[c.prop] = 0;
    });
    return o;
  });
});

function summaryMethod({ columns }) {
  return columns.map((col, i) => {
    if (i === 0) return '合计';
    if ((col.property || col.prop) === 'stat_cost') return moneyComma(totalCost.value);
    return '--';
  });
}

function onSortChange({ prop, order }) {
  sortProp.value = prop || '';
  sortOrder.value = order || '';
}

watch([signature, pageSize], () => { page.value = 1; });
watch(total, () => {
  const maxPage = Math.max(1, Math.ceil(total.value / pageSize.value));
  if (page.value > maxPage) page.value = maxPage;
});

/* ------------------------------------------------------------------ *
 * 交互
 * ------------------------------------------------------------------ */
/* 「查询」：线上不弹任何提示，仅回到第一页 */
function onQuery() {
  page.value = 1;
}

/* 数据筛选：确定后条件写回 dataFilter，表格回到第一页 */
function onDataFilterApply() {
  page.value = 1;
}

/* 「自定义指标」：打开线上同款弹窗 */
function onCustomMetric() {
  metricVisible.value = true;
}

/* 「应 用」：把弹窗里选中的指标应用到表格（列增减生效） */
function onMetricApply(payload = {}) {
  selectedMetrics.value = Array.isArray(payload.selected)
    ? [...payload.selected]
    : [...(REPORT_METRIC_DEFAULT_SELECTED.component || [])];
  page.value = 1;
}

/* 「导出数据」：线上弹出「任务创建成功，请前往工具—下载中心查看详情」 */
function onExport() {
  exportVisible.value = true;
}

/* 「组件预览」：打开大图预览层 */
function onPreview(row) {
  previewRow.value = row;
  previewVisible.value = true;
}
</script>

<style scoped>
/* 筛选维度控件组：换行后「查询」按钮保持在右侧并垂直居中（与线上一致）
 * max-width 对齐线上 .filter-dim-list 的可用宽度（100vw - 450px），
 * 以保证筛选条件的换行位置与线上一致 */
.filter-fields {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1 1 0;
  min-width: 0;
  max-width: calc(100vw - 450px);
}
/* 组合盒内的 select 不重复描边（EP 2.14 的 border 在 wrapper 上） */
.filter-fields :deep(.report-select-box .el-input__wrapper),
.filter-fields :deep(.report-search-box .el-input__wrapper) {
  box-shadow: none !important;
}
.filter-fields :deep(.report-select-box .el-input),
.filter-fields :deep(.report-search-box .el-input) {
  width: 100%;
}
/* 线上组合盒：固定 label 区 84px + 下拉 181px（合计 265px） */
.filter-fields :deep(.report-select-box > label) {
  box-sizing: border-box;
  width: 84px;
  justify-content: center;
}
.filter-fields :deep(.report-select-box .el-select) {
  width: 181px;
}
/* 线上「账户」为远程下拉，字段更宽（合计 425px） */
.filter-fields .select-account :deep(.report-select-box .el-select) {
  width: 341px;
}
/* 线上关键词搜索框宽 246px */
.filter-fields :deep(.report-search-box) {
  width: 246px;
}
/* 线上筛选行 label 区宽度（控件起点与线上一致） */
:deep(.report-dim-label) {
  min-width: 115px;
}

.report-query-btn {
  margin-left: auto;
}

/* 「+ 添加筛选」弹层里的维度清单 */
.cr-add-filter-group {
  display: flex;
  flex-direction: column;
  max-height: 240px;
  overflow: auto;
}
.cr-add-filter-group :deep(.el-checkbox) {
  margin-right: 0;
}


/* 卡片头 */
.caliber-select {
  width: 220px;
}
.relation-select {
  width: 120px;
}
.caliber-option {
  font-size: 13px;
}
.export-help {
  color: #c0c4cc;
  cursor: pointer;
  margin-left: 4px;
  vertical-align: middle;
}
.export-help:hover {
  color: #197afb;
}
/* 指标口径下拉里的 ⓘ */
.caliber-option {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}
.caliber-help {
  color: #c0c4cc;
  cursor: pointer;
}
.caliber-help:hover {
  color: #197afb;
}
/* 列头提示锚点 */
.cr-col-title {
  border-bottom: 1px dashed transparent;
  cursor: help;
}
.cr-col-title:hover {
  color: #197afb;
}
/* 组件预览大图 */
.cr-preview-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.cr-preview-img {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 3px;
  background: #f2f3f5;
}
.cr-preview-meta {
  font-size: 13px;
  color: #606266;
}

/* 组件预览：线上为竖版广告素材缩略图（80 × 120），列内居中 */
.component-wrapper {
  position: relative;
  display: inline-block;
  line-height: 0;
}
.report-preview.component-preview {
  width: 80px;
  height: 120px;
  margin: 0 auto;
  object-fit: cover;
}
.video-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 22px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  pointer-events: none;
}
</style>
