<template>
  <ReportPageShell
    class="people-page"
    v-model:period="period"
    v-model:date-range="dateRange"
    v-model:dimension="dataDim"
    title="人效管理"
    :selects="selects"
    :dimensions="dimOptions"
    :show-media="false"
    :show-search="false"
    :show-data-filter="false"
    @query="onQuery"
  >
    <!-- 页头二级页签：优化团队 / 创意团队 -->
    <template #subtabs>
      <div class="report-subtabs">
        <span
          v-for="t in subTabs"
          :key="t"
          class="report-subtab"
          :class="{ active: t === subTab }"
          @click="subTab = t"
        >{{ t }}</span>
      </div>
    </template>

    <!-- ① 趋势分析 -->
    <div class="report-card">
      <div class="report-card-head">
        <div class="report-card-title">
          趋势分析
          <el-popover placement="right" :width="250" trigger="click">
            <template #reference><el-icon><QuestionFilled /></el-icon></template>
            {{ tipText('趋势变化只展示Top5的数据 。') }}
          </el-popover>
        </div>
        <div class="report-card-actions">
          <a class="report-collapse-link" @click="toggleTrend">
            {{ trendCollapsed ? '展开' : '收起' }}
          </a>
        </div>
      </div>

      <div v-show="!trendCollapsed" class="report-card-body">
        <el-select v-model="trendMetric" size="small" class="trend-metric-select" placeholder="请选择">
          <el-option v-for="m in PEOPLE_TREND_METRICS" :key="m" :label="m" :value="m" />
        </el-select>
        <div ref="trendRef" class="report-chart people-trend-chart"></div>
      </div>
    </div>

    <!-- ② 详细数据 -->
    <div class="report-card">
      <div class="report-card-head">
        <div class="report-card-title">详细数据</div>
        <div class="report-card-actions">
          <el-select
            v-model="relationDim"
            size="small"
            class="relation-select"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="关联维度"
          >
            <el-option v-for="o in RELATION_DIM_PEOPLE" :key="o" :label="o" :value="o" />
          </el-select>
          <el-button size="small" plain @click="onExport">导出数据</el-button>
          <!-- 导出数据 ⓘ（线上：按钮右侧问号气泡，200px） -->
          <el-popover placement="bottom" :width="200" trigger="click">
            <template #reference>
              <el-icon class="card-help-icon" @click.stop><QuestionFilled /></el-icon>
            </template>
            {{ tipText('导出所有页面的数据') }}
          </el-popover>
        </div>
      </div>

      <div class="report-table-wrap">
        <el-table
          class="report-table"
          :data="pageRows"
          row-key="id"
          border
          show-summary
          :summary-method="summaryMethod"
        >
          <el-table-column
            v-for="col in tableColumns"
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
                <span class="people-col-title">{{ col.label }}</span>
              </el-tooltip>
              <span v-else>{{ col.label }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="report-pager">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="allRows.length"
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
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { QuestionFilled } from '@element-plus/icons-vue';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import ReportPageShell from '../components/ReportPageShell.vue';
import ExportResultDialog from '../components/ExportResultDialog.vue';
import { REPORT_TIPS } from '@/mock/reportTips';
import {
  DEPT_OPTIONS,
  MEDIA_OPTIONS,
  PEOPLE_COLUMNS,
  PEOPLE_TREND_METRICS,
  PRODUCT_OPTIONS,
  PROJECT_OPTIONS,
  RELATION_DIM_PEOPLE,
  peopleRows,
  singleDay,
} from '@/mock/reportData';

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

// 经营分析页「优化师」下拉：线上实测为「姓名 (邮箱)」格式
const OPTIMIZER_OPTIONS = [
  '北京央广时代文化传播有限公司 (liuziyuan01@ygsdmedia.com)',
  '张从浩 (zhangconghao@ygsdmedia.com)',
  '王春雷 (wangchunlei@ygsdmedia.com)',
  '郭峻宇 (guojunyu@ygsdmedia.com)',
  '孙诗源 (sunshiyuan@ygsdmedia.com)',
  'gongwenqing (gongwenqing@ygsdmedia.com)',
  'lixue (lixue@ygsdmedia.com)',
  'jiangxin (jiangxin@ygsdmedia.com)',
  'chenpeihua (chenpeihua@ygsdmedia.com)',
  '1304275504 (1304275504@qq.com)',
  '文清滨 (wenqingbin@ygsdmedia.com)',
  '李若涵 (liruohan@ygsdmedia.com)',
  '杨浩蒙 (yanghaomeng@ygsdmedia.com)',
  '刘松涵 (liusonghan01@ygsdmedia.com)',
  '申旭阳 (shenxuyang@ygsdmedia.com)',
];
// 去掉「(邮箱)」后缀，便于与明细表的姓名列匹配
const plainName = (s) => String(s).replace(/\s*\([^)]*\)\s*$/, '');

// ---------- 页头状态 ----------
const subTabs = ['优化团队', '创意团队'];
const subTab = ref('优化团队');
const period = ref('分日');
const dateRange = ref(singleDay());
const dimOptions = ['人员', '部门', '账户主体'];
const dataDim = ref('人员');
const trendMetric = ref('新建广告（创意）数');
const trendCollapsed = ref(false);
const relationDim = ref([]);
const exportVisible = ref(false);   // 「导出数据」结果提示

// ---------- 筛选维度（组合盒下拉） ----------
const selects = reactive([
  { key: 'optimizer', label: '优化师', placeholder: '请选择优化师', options: OPTIMIZER_OPTIONS, model: [] },
  { key: 'product', label: '产品', placeholder: '全部产品', options: PRODUCT_OPTIONS, model: [] },
  { key: 'project', label: '项目', placeholder: '全部项目', options: PROJECT_OPTIONS, model: [] },
  { key: 'dept', label: '部门', placeholder: '请选择部门', options: DEPT_OPTIONS, model: [] },
  { key: 'media', label: '媒体', placeholder: '不限', options: MEDIA_OPTIONS.map((m) => m.label), model: [] },
]);

// ---------- 列定义（线上列宽 + 指标口径说明） ----------
const PEOPLE_WIDTH = {
  date: 171, optimizer: 121, new_ad_cnt: 177, cost_ad_cnt: 177, learned_ad_cnt: 152,
  stat_cost: 121, show_cnt: 121, click_cnt: 121, convert_cnt: 121,
  cpm: 162, cpc: 162, convert_cost: 121,
};
/* 问号提示文案：全部取自线上采集结果（mock/reportTips.js） */
const PEOPLE_TIPS = REPORT_TIPS.people || [];
/** 按原文取提示文案（命中则原样返回线上文案，未命中也原样返回，避免文案走样） */
function tipText(s) {
  const hit = PEOPLE_TIPS.find((t) => t.body === s);
  return hit ? hit.body : s;
}
const PEOPLE_TIP = {
  new_ad_cnt: tipText('所选时间范围内创建的广告(腾讯广告3.0为创意层级)的数量(包含已删除)。统计对象包含普通广告、巨量广告·智擎项目、巨量广告·全域项目、磁力金牛(全站)计划及小红书计划等不同投放单元。'),
  cost_ad_cnt: tipText('所选时间范围内创建且消耗大于0的广告(腾讯广告3.0为创意层级)的数量(包含已删除)。统计对象包含普通广告、巨量广告·智擎项目、巨量广告·全域项目、磁力金牛(全站)计划及小红书计划等有消耗的不同投放单元。'),
  learned_ad_cnt: tipText('所选时间范围内，通过学习期的广告数量，汇总数据为所选数据范围内排重后的广告总数，不会从分日数据累加；(包含已删除)'),
  stat_cost: tipText('所选时间范围内所有广告的消耗总和。汇总具备有效消费字段的媒体；巨量广告·全域的GMV不计入消费，小红书计划消费纳入统计。'),
  show_cnt: tipText('所选时间范围内所有广告的展示数总和。汇总各媒体有效展现数据，小红书计划展现量纳入统计。'),
  click_cnt: tipText('所选时间范围内所有广告的点击数总和。汇总各媒体有效点击数据，小红书计划点击量纳入统计。'),
  convert_cnt: tipText('所选时间范围内所有广告的转化数总和。巨量广告·全域、磁力金牛(全站)官方接口未提供转化数，不参与转化相关指标计算。'),
  cpm: tipText('广告平均每一千次展现所付出的费用，计算公式是：总花费/展示数*1000'),
  cpc: tipText('总消耗/点击数'),
  convert_cost: tipText('总消耗/转化数。巨量广告·全域、磁力金牛(全站)不参与转化相关指标计算，其消耗与转化数均不计入分子分母。'),
};
// 第二列随「数据维度 / 关联维度」切换
const DIM_COLUMN = {
  人员: { prop: 'optimizer', label: '优化师' },
  部门: { prop: 'dept', label: '部门' },
  账户主体: { prop: 'subject', label: '账户主体' },
  项目: { prop: 'project', label: '项目' },
  产品: { prop: 'product', label: '产品' },
};
const dimColumn = computed(() => {
  const rel = relationDim.value.length ? relationDim.value[0] : '';
  return DIM_COLUMN[rel] || DIM_COLUMN[dataDim.value] || DIM_COLUMN.人员;
});
const tableColumns = computed(() =>
  PEOPLE_COLUMNS.map((c) => {
    const col = { ...c, width: PEOPLE_WIDTH[c.prop] || c.width };
    if (c.prop === 'optimizer') {
      col.prop = dimColumn.value.prop;
      col.label = dimColumn.value.label;
      col.width = PEOPLE_WIDTH.optimizer;
    }
    if (PEOPLE_TIP[c.prop]) col.tip = PEOPLE_TIP[c.prop];
    return col;
  })
);

// ---------- 工具 ----------
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// 时间列：分日 → 20261124；分月 → 202611；汇总 → 20261118-20261124
const timeLabel = computed(() => {
  const [s, e] = dateRange.value || [];
  if (!s || !e) return '';
  if (period.value === '分月') {
    const sm = s.slice(0, 7).replace('-', '');
    const em = e.slice(0, 7).replace('-', '');
    return sm === em ? sm : `${sm}-${em}`;
  }
  const sc = s.replace(/-/g, '');
  const ec = e.replace(/-/g, '');
  return sc === ec ? sc : `${sc}-${ec}`;
});

const CREATIVE_POOL = ['黄莹曦', '马学泰', '张浩', '王研', '张瑞凯', '裴心怡', '李玉玲', '冯逸'];
// 线上明细表首屏优化师顺序
const PEOPLE_NAMES = [
  '申旭阳', '孙诗源', 'lixue', 'chenpeihua', '1304275504', '文清滨', '刘松涵',
  '北京央广时代文化传播有限公司', '杨浩蒙', 'gongwenqing', 'jiangxin',
];
const SUBJECT_POOL = [
  '北京央广时代文化传播有限公司', '北京智者天下科技有限公司', '北京雷盟盛通文化发展有限公司',
  '上海博物知库集团有限公司', '北京笔墨留香科技有限公司',
];

const stateKey = computed(() => JSON.stringify({
  p: period.value,
  d: dateRange.value,
  s: subTab.value,
  dim: dataDim.value,
  rel: relationDim.value,
  f: {
    o: selects[0].model, p: selects[1].model, j: selects[2].model, d: selects[3].model, m: selects[4].model,
  },
}));

// ---------- 明细数据 ----------
const allRows = computed(() => {
  const base = peopleRows();
  const rand = mulberry32(hashStr(stateKey.value));
  const factor = 0.55 + rand() * 1.05;
  const isCreative = subTab.value === '创意团队';

  let rows = base.map((r, i) => {
    const name = isCreative ? CREATIVE_POOL[i % CREATIVE_POOL.length] : PEOPLE_NAMES[i % PEOPLE_NAMES.length];
    return {
      ...r,
      optimizer: name,
      dept: DEPT_OPTIONS[i % DEPT_OPTIONS.length],
      project: PROJECT_OPTIONS[i % PROJECT_OPTIONS.length],
      product: PRODUCT_OPTIONS[i % PRODUCT_OPTIONS.length],
      subject: SUBJECT_POOL[i % SUBJECT_POOL.length],
      media: MEDIA_OPTIONS[i % MEDIA_OPTIONS.length].label,
      new_ad_cnt: Math.round(r.new_ad_cnt * factor),
      cost_ad_cnt: Math.round(r.cost_ad_cnt * factor),
      learned_ad_cnt: Math.round(r.learned_ad_cnt * factor),
      stat_cost: +(r.stat_cost * factor).toFixed(2),
      show_cnt: Math.round(r.show_cnt * factor),
      click_cnt: Math.round(r.click_cnt * factor),
      convert_cnt: Math.round(r.convert_cnt * factor),
    };
  });

  const [optSel, prodSel, projSel, deptSel, mediaSel] = selects.map((s) => s.model);
  if (optSel.length) {
    const picked = optSel.map(plainName);
    rows = rows.filter((r) => picked.includes(r.optimizer));
  }
  if (prodSel.length) rows = rows.filter((r) => prodSel.includes(r.product));
  if (projSel.length) rows = rows.filter((r) => projSel.includes(r.project));
  if (deptSel.length) rows = rows.filter((r) => deptSel.includes(r.dept));
  if (mediaSel.length) rows = rows.filter((r) => mediaSel.includes(r.media));

  return rows.map((r) => ({ ...r, date: timeLabel.value }));
});

const page = ref(1);
const pageSize = ref(20);
const pageRows = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return allRows.value.slice(start, start + pageSize.value);
});
watch(allRows, () => { page.value = 1; });

// ---------- 合计行 ----------
function summaryMethod({ columns }) {
  const data = allRows.value;
  const sum = (key) => data.reduce((a, r) => a + (Number(r[key]) || 0), 0);
  const cost = sum('stat_cost');
  const show = sum('show_cnt');
  const click = sum('click_cnt');
  const conv = sum('convert_cnt');
  const map = {
    date: '合计',
    optimizer: '--',
    dept: '--',
    project: '--',
    product: '--',
    subject: '--',
    new_ad_cnt: sum('new_ad_cnt'),
    cost_ad_cnt: sum('cost_ad_cnt'),
    learned_ad_cnt: sum('learned_ad_cnt'),
    stat_cost: +cost.toFixed(2),
    show_cnt: show,
    click_cnt: click,
    convert_cnt: conv,
    cpm: show ? +(cost / show * 1000).toFixed(2) : 0,
    cpc: click ? +(cost / click).toFixed(2) : 0,
    convert_cost: conv ? +(cost / conv).toFixed(2) : 0,
  };
  return columns.map((col) => {
    const prop = col.property || col.prop;
    const v = map[prop];
    if (v === undefined) return '';
    return typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(2)) : v;
  });
}

// ---------- 趋势图 ----------
const TREND_PROP = {
  '新建广告（创意）数': 'new_ad_cnt',
  总消耗: 'stat_cost',
  展示数: 'show_cnt',
  点击数: 'click_cnt',
  转化数: 'convert_cnt',
};
const trendData = computed(() => {
  const prop = TREND_PROP[trendMetric.value] || 'new_ad_cnt';
  const map = new Map();
  allRows.value.forEach((r) => {
    const key = r.optimizer;
    map.set(key, (map.get(key) || 0) + (Number(r[prop]) || 0));
  });
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value: +Number(value).toFixed(2) }));
});

// y 轴上限：实际最大值向上对齐到 50 的整数倍（线上 0~300 / 间隔 50）
const AXIS_STEP = 50;
const axisMax = computed(() => {
  const m = trendData.value.reduce((a, b) => Math.max(a, b.value), 0);
  return Math.max(AXIS_STEP, Math.ceil(m / AXIS_STEP) * AXIS_STEP);
});

function trendOption() {
  const items = trendData.value;
  const max = axisMax.value;
  return {
    animationDuration: 300,
    // grid 用 echarts 默认值（left/right 10%、top/bottom 60），与线上一致
    // 注意：不传 legend 字段（线上该图无图例；传空 legend 会要求注册 LegendComponent）
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(29,33,41,0.92)',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
    },
    xAxis: {
      type: 'category',
      data: items.map((i) => i.name),
      // 线上：分类名直接显示、不换行不重叠（宽度不足时截断）
      axisLabel: { color: '#333333', fontSize: 12, interval: 0, width: 90, overflow: 'truncate' },
      axisLine: { lineStyle: { color: '#333333' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max,
      interval: AXIS_STEP,
      axisLabel: { color: '#333333', fontSize: 12 },
      axisLine: { lineStyle: { color: '#333333' } },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#cccccc' } },
    },
    series: [
      {
        // 灰色通高底柱（轨道）
        name: 'max',
        type: 'bar',
        barWidth: '18%',
        barGap: '-100%',
        silent: true,
        z: 1,
        data: items.map(() => max),
        itemStyle: { color: '#e3e3e3' },
      },
      {
        // 蓝色实际值柱（叠在底柱之上）
        name: trendMetric.value,
        type: 'bar',
        barWidth: '18%',
        z: 2,
        data: items.map((i) => i.value),
        itemStyle: { color: '#3398db' },
      },
    ],
  };
}

const trendRef = ref(null);
let trendChart = null;

function renderTrend() {
  if (!trendRef.value) return;
  if (!trendChart) trendChart = echarts.init(trendRef.value);
  trendChart.setOption(trendOption(), true);
}
function resizeTrend() {
  if (trendChart) trendChart.resize();
}
function toggleTrend() {
  trendCollapsed.value = !trendCollapsed.value;
  if (!trendCollapsed.value) nextTick(resizeTrend);
}

watch([trendData, trendMetric], async () => {
  await nextTick();
  renderTrend();
});

onMounted(async () => {
  await nextTick();
  renderTrend();
  window.addEventListener('resize', resizeTrend);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeTrend);
  if (trendChart) trendChart.dispose();
  trendChart = null;
});

// ---------- 操作 ----------
// 「查询」：线上无提示，仅按当前筛选条件重算并回到第一页
function onQuery() {
  page.value = 1;
}
// 「导出数据」：线上弹出「任务创建成功，请前往工具—下载中心查看详情」
function onExport() {
  exportVisible.value = true;
}
</script>

<style scoped>
/* 线上本页没有「+ 添加筛选」按钮 */
.people-page :deep(.report-add-filter) { display: none; }
/* 趋势图容器高度对齐线上（400px） */
.people-page :deep(.report-card-body .report-chart) { height: 400px; }
.trend-metric-select { width: 185px; }
.relation-select { width: 120px; }
.card-help-icon {
  color: #c0c4cc;
  cursor: pointer;
  vertical-align: middle;
  margin-left: 4px;
}
.card-help-icon:hover { color: #197afb; }
/* 列头提示锚点（线上：列头文字 hover 出现口径说明） */
.people-col-title {
  border-bottom: 1px dashed transparent;
  cursor: help;
}
.people-col-title:hover { color: #197afb; }
</style>
