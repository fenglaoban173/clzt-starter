<template>
  <div class="page dash-page" v-loading="loading">
    <!-- ① 广告数据概览 -->
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">
          <span class="title-main">广告数据概览</span>
          <span class="detail-link" @click="goReport('account')">查看详情</span>
        </div>
        <div class="panel-tools">
          <el-select v-model="media" size="small" class="tool-select">
            <el-option v-for="o in mediaOptions" :key="o.key" :label="o.label" :value="o.key" />
          </el-select>
          <el-select v-model="date" size="small" class="tool-select">
            <el-option label="今天" value="today" />
            <el-option label="昨天" value="yesterday" />
            <el-option label="近7天" value="last7" />
          </el-select>
          <el-popover placement="bottom-end" :width="210" trigger="click" popper-class="metric-popover">
            <template #reference>
              <button class="tool-btn">
                自定义指标
                <el-icon class="tool-caret"><ArrowDown /></el-icon>
              </button>
            </template>
            <div class="metric-check">
              <el-checkbox-group v-model="visibleKeys">
                <el-checkbox v-for="m in overview" :key="m.key" :value="m.key">{{ m.label }}</el-checkbox>
              </el-checkbox-group>
            </div>
          </el-popover>
        </div>
      </div>

      <div v-if="shownOverview.length" class="metric-grid">
        <div v-for="m in shownOverview" :key="m.key" class="metric-card" :class="`tone-${m.tone}`">
          <div class="metric-label">{{ m.label }}</div>
          <div class="metric-value">
            {{ formatValue(m.value, m.digits) }}<span v-if="m.suffix" class="metric-suffix">{{ m.suffix }}</span>
          </div>
          <div class="metric-compare">
            <span class="cmp-tag">环比</span>
            <span class="cmp-val" :class="deltaClass(m, m.mom)">{{ deltaArrow(m.mom) }} {{ percentText(m.mom) }}</span>
          </div>
          <div class="metric-compare">
            <span class="cmp-tag">同时段环比</span>
            <span class="cmp-val" :class="deltaClass(m, m.same)">{{ deltaArrow(m.same) }} {{ percentText(m.same) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="metric-empty">请至少选择一个指标</div>
    </section>

    <!-- ② 项目分析 -->
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">
          <span class="head-tab" @click="goReport('project')">项目分析</span>
          <el-icon class="head-tab-link" @click="goReport('project')"><TopRight /></el-icon>
        </div>
        <div class="panel-tools">
          <el-select v-model="metric" size="small" class="tool-select">
            <el-option v-for="o in metricOptions" :key="o.key" :label="o.label" :value="o.key" />
          </el-select>
          <el-select v-model="project" size="small" class="tool-select">
            <el-option v-for="o in projectOptions" :key="o.key" :label="o.label" :value="o.key" />
          </el-select>
          <el-select v-model="media" size="small" class="tool-select">
            <el-option v-for="o in mediaOptions" :key="o.key" :label="o.label" :value="o.key" />
          </el-select>
          <el-select v-model="date" size="small" class="tool-select">
            <el-option label="今天" value="today" />
            <el-option label="昨天" value="yesterday" />
            <el-option label="近7天" value="last7" />
          </el-select>
        </div>
      </div>
      <div ref="trendRef" class="trend-chart"></div>
    </section>

    <!-- ③ 项目分布 / 媒体分布 -->
    <div class="dist-row">
      <section class="panel">
        <div class="panel-head">
          <div class="panel-title">
            <span class="title-main">项目分布</span>
            <span class="detail-link" @click="goReport('project')">查看详情</span>
          </div>
          <div class="panel-tools">
            <el-select
              v-model="projectDate"
              size="small"
              class="tool-select tool-select-date"
              popper-class="dash-date-popper"
            >
              <el-option v-for="o in periodOptions" :key="o.key" :label="o.label" :value="o.key" />
            </el-select>
          </div>
        </div>
        <div class="panel-sub">
          <el-select v-model="projectMetric" size="small" class="tool-select tool-select-sm">
            <el-option v-for="o in distMetricOptions" :key="o.key" :label="o.label" :value="o.key" />
          </el-select>
        </div>
        <div class="dist-body">
          <div ref="projectDonutRef" class="donut-chart"></div>
          <ul class="dist-legend">
            <li v-for="it in projectDist.items" :key="it.name">
              <i class="lg-dot" :style="{ background: it.color }"></i>
              <span class="lg-name">{{ it.name }}</span>
              <span class="lg-sep">|</span>
              <span class="lg-pct">{{ pctText(it.pct) }}</span>
              <span class="lg-val">{{ formatValue(it.value, projectDist.digits) }}</span>
            </li>
          </ul>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div class="panel-title">
            <span class="title-main">媒体分布</span>
            <span class="detail-link" @click="goReport('account')">查看详情</span>
          </div>
          <div class="panel-tools">
            <el-select
              v-model="mediaDate"
              size="small"
              class="tool-select tool-select-date"
              popper-class="dash-date-popper"
            >
              <el-option v-for="o in periodOptions" :key="o.key" :label="o.label" :value="o.key" />
            </el-select>
          </div>
        </div>
        <div class="panel-sub">
          <el-select v-model="mediaMetric" size="small" class="tool-select tool-select-sm">
            <el-option v-for="o in distMetricOptions" :key="o.key" :label="o.label" :value="o.key" />
          </el-select>
        </div>
        <div class="dist-body">
          <div ref="mediaDonutRef" class="donut-chart"></div>
          <ul class="dist-legend">
            <li v-for="it in mediaDist.items" :key="it.name">
              <i class="lg-dot" :style="{ background: it.color }"></i>
              <span class="lg-name">{{ it.name }}</span>
              <span class="lg-sep">|</span>
              <span class="lg-pct">{{ pctText(it.pct) }}</span>
              <span class="lg-val">{{ formatValue(it.value, mediaDist.digits) }}</span>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <!-- ④ 优化师分布 / 剪辑分布 -->
    <div class="dist-row">
      <section class="panel">
        <div class="panel-head">
          <div class="panel-title">
            <span class="title-main">优化师分布</span>
            <span class="detail-link" @click="goReport('account')">查看详情</span>
          </div>
          <div class="panel-tools">
            <el-select
              v-model="optimizerDate"
              size="small"
              class="tool-select tool-select-date"
              popper-class="dash-date-popper"
            >
              <el-option v-for="o in periodOptions" :key="o.key" :label="o.label" :value="o.key" />
            </el-select>
          </div>
        </div>
        <div class="panel-sub">
          <el-select v-model="optimizerMetric" size="small" class="tool-select tool-select-sm">
            <el-option v-for="o in distMetricOptions" :key="o.key" :label="o.label" :value="o.key" />
          </el-select>
        </div>
        <div class="dist-body">
          <div ref="optimizerDonutRef" class="donut-chart"></div>
          <ul class="dist-legend">
            <li v-for="it in optimizerDist.items" :key="it.name">
              <i class="lg-dot" :style="{ background: it.color }"></i>
              <span class="lg-name" :title="it.name">{{ it.name }}</span>
              <span class="lg-sep">|</span>
              <span class="lg-pct">{{ pctText(it.pct) }}</span>
              <span class="lg-val">{{ formatValue(it.value, optimizerDist.digits) }}</span>
            </li>
          </ul>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div class="panel-title">
            <span class="title-main">剪辑分布</span>
            <span class="detail-link" @click="goReport('material')">查看详情</span>
          </div>
          <div class="panel-tools">
            <el-select
              v-model="editorDate"
              size="small"
              class="tool-select tool-select-date"
              popper-class="dash-date-popper"
            >
              <el-option v-for="o in periodOptions" :key="o.key" :label="o.label" :value="o.key" />
            </el-select>
          </div>
        </div>
        <div class="panel-sub">
          <el-select v-model="editorMetric" size="small" class="tool-select tool-select-sm">
            <el-option v-for="o in editorMetricOptions" :key="o.key" :label="o.label" :value="o.key" />
          </el-select>
        </div>
        <div v-if="editorDist.items.length" class="dist-body">
          <div ref="editorDonutRef" class="donut-chart"></div>
          <ul class="dist-legend">
            <li v-for="it in editorDist.items" :key="it.name">
              <i class="lg-dot" :style="{ background: it.color }"></i>
              <span class="lg-name" :title="it.name">{{ it.name }}</span>
              <span class="lg-sep">|</span>
              <span class="lg-pct">{{ pctText(it.pct) }}</span>
              <span class="lg-val">{{ formatValue(it.value, editorDist.digits) }}</span>
            </li>
          </ul>
        </div>
        <div v-else class="dist-empty">
          <el-empty description="暂无数据" :image-size="60" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts/core';
import { LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  GraphicComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { dashboardApi } from '@/api/media';

echarts.use([
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  GraphicComponent,
  CanvasRenderer,
]);

const router = useRouter();

const loading = ref(false);
const overview = ref([]);
const mediaOptions = ref([]);
const projectOptions = ref([]);
const metricOptions = ref([]);
const trend = ref(null);
const projectDist = ref({ total: 0, items: [] });
const mediaDist = ref({ total: 0, items: [] });
const optimizerDist = ref({ total: 0, items: [] });
const editorDist = ref({ total: 0, items: [] });

// 筛选状态
const media = ref('all');
const date = ref('today');
const metric = ref('cost');
const project = ref('all');
// R110：项目分布 / 媒体分布 是两个独立板块，指标互不影响
const projectMetric = ref('cost');
const mediaMetric = ref('cost');
const projectDate = ref('lastWeek');
const mediaDate = ref('today');
const optimizerDate = ref('yesterday');
const optimizerMetric = ref('cost');
const editorDate = ref('yesterday');
const editorMetric = ref('new_material');
const visibleKeys = ref(['cost', 'show', 'cpm', 'convert', 'convertCost', 'rate']);

// 分布卡片的指标口径（消耗 / 展示数 / 转化数）
const distMetricOptions = [
  { key: 'cost', label: '消耗' },
  { key: 'show', label: '展示数' },
  { key: 'convert', label: '转化数' },
];

// 各分布卡片的查询周期（统一口径）
const periodOptions = [
  { key: 'today', label: '今天' },
  { key: 'yesterday', label: '昨天' },
  { key: 'past7', label: '过去7天(不含今天)' },
  { key: 'past30', label: '过去30天(不含今天)' },
  { key: 'thisWeek', label: '本周' },
  { key: 'lastWeek', label: '上周' },
  { key: 'thisMonth', label: '本月' },
  { key: 'lastMonth', label: '上月' },
];

// 剪辑分布的指标口径（原型暂无数据）
const editorMetricOptions = [
  { key: 'new_material', label: '上新素材数量' },
  { key: 'edit_material', label: '剪辑素材数量' },
  { key: 'cost', label: '消耗' },
];

const shownOverview = computed(() => overview.value.filter((m) => visibleKeys.value.includes(m.key)));

const trendRef = ref(null);
const projectDonutRef = ref(null);
const mediaDonutRef = ref(null);
const optimizerDonutRef = ref(null);
const editorDonutRef = ref(null);
let trendChart = null;
let projectChart = null;
let mediaChart = null;
let optimizerChart = null;
let editorChart = null;

// ---------- 数值格式化 ----------
function formatValue(v, digits = 2) {
  if (v == null || Number.isNaN(v)) return '-';
  return Number(v).toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function percentText(v) {
  if (v == null) return '-';
  return `${Math.abs(v).toFixed(2)}%`;
}

// 图例占比：0 显示 0%，其余保留两位小数
function pctText(v) {
  if (!v) return '0%';
  return `${v.toFixed(2)}%`;
}

function deltaArrow(v) {
  if (!v) return '→';
  return v > 0 ? '↑' : '↓';
}

// 上涨是否为正向：由指标定义决定（成本类指标下降为正向）
function deltaClass(metricDef, v) {
  if (!v) return 'flat';
  const positive = v > 0;
  const good = metricDef.good === 'up' ? positive : !positive;
  return good ? 'good' : 'bad';
}

function goReport(tab) {
  router.push({ name: 'reports', query: { tab } });
}

// ---------- 图表 ----------
// 纵轴取整：步长取 1/2/2.5/5 × 10^n，保证刻度均匀
function niceAxis(maxValue, targetTicks = 7) {
  const v = Math.max(maxValue || 0, 0);
  if (!v) return { max: 1000, step: 1000 };
  const raw = v / targetTicks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  let step;
  if (norm <= 1) step = 1;
  else if (norm <= 2) step = 2;
  else if (norm <= 2.5) step = 2.5;
  else if (norm <= 5) step = 5;
  else step = 10;
  step *= mag;
  return { max: Math.ceil(v / step) * step, step };
}

function trendOption() {
  const t = trend.value;
  if (!t) return {};
  const { max, step: interval } = niceAxis(t.max);
  const isHour = t.curLabels.length === 24;
  return {
    animationDuration: 420,
    color: ['#7486F6', '#F2B431'],
    grid: { left: 64, right: 30, top: 58, bottom: 66 },
    legend: {
      top: 14,
      left: 'center',
      icon: 'roundRect',
      itemWidth: 22,
      itemHeight: 11,
      itemGap: 26,
      textStyle: { color: '#4e5969', fontSize: 12 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: '#c9cdd4', width: 1 } },
      backgroundColor: 'rgba(29,33,41,0.92)',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
    },
    xAxis: [
      {
        type: 'category',
        data: t.curLabels,
        boundaryGap: false,
        axisLabel: { color: '#86909c', fontSize: 11, interval: isHour ? 2 : 0 },
        axisLine: { lineStyle: { color: '#e5e6eb' } },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      {
        type: 'category',
        data: t.prevLabels,
        position: 'bottom',
        offset: 24,
        boundaryGap: false,
        axisLabel: { color: '#86909c', fontSize: 11, interval: isHour ? 2 : 0 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
    ],
    yAxis: {
      type: 'value',
      min: 0,
      max,
      interval,
      axisLabel: { color: '#86909c', fontSize: 11, formatter: (v) => v.toLocaleString('zh-CN') },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f2f3f5' } },
    },
    series: [
      {
        name: t.series[0].name,
        type: 'line',
        xAxisIndex: 1,
        data: t.series[0].data,
        smooth: false,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 1.5, color: '#7486F6' },
        itemStyle: { color: '#7486F6', borderColor: '#fff', borderWidth: 1 },
        z: 2,
      },
      {
        name: t.series[1].name,
        type: 'line',
        xAxisIndex: 0,
        data: t.series[1].data,
        smooth: false,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 1.5, color: '#F2B431' },
        itemStyle: { color: '#F2B431', borderColor: '#fff', borderWidth: 1 },
        z: 3,
      },
    ],
  };
}

function donutOption(dist) {
  const items = dist?.items || [];
  const total = dist?.total || 0;
  const digits = dist?.digits ?? 2;
  return {
    animationDuration: 420,
    tooltip: {
      trigger: 'item',
      formatter: (p) => `${p.name}<br/>${formatValue(p.value, digits)} (${p.percent}%)`,
    },
    series: [
      {
        type: 'pie',
        radius: ['62%', '85%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        data: items.map((it) => ({
          name: it.name,
          value: it.value,
          itemStyle: { color: it.color },
        })),
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '36%',
        style: { text: '汇总', fill: '#86909c', fontSize: 13, textAlign: 'center' },
      },
      {
        type: 'text',
        left: 'center',
        top: '45%',
        style: {
          text: formatValue(total, digits),
          fill: '#1d2129',
          fontSize: 20,
          fontWeight: 600,
          textAlign: 'center',
        },
      },
    ],
  };
}

function renderCharts() {
  if (trendRef.value) {
    if (!trendChart) trendChart = echarts.init(trendRef.value);
    trendChart.setOption(trendOption(), true);
  }
  if (projectDonutRef.value) {
    if (!projectChart) projectChart = echarts.init(projectDonutRef.value);
    projectChart.setOption(donutOption(projectDist.value), true);
  }
  if (mediaDonutRef.value) {
    if (!mediaChart) mediaChart = echarts.init(mediaDonutRef.value);
    mediaChart.setOption(donutOption(mediaDist.value), true);
  }
  if (optimizerDonutRef.value) {
    if (!optimizerChart) optimizerChart = echarts.init(optimizerDonutRef.value);
    optimizerChart.setOption(donutOption(optimizerDist.value), true);
  }
  if (editorDonutRef.value) {
    if (!editorChart) editorChart = echarts.init(editorDonutRef.value);
    editorChart.setOption(donutOption(editorDist.value), true);
  }
}

function resizeCharts() {
  [trendChart, projectChart, mediaChart, optimizerChart, editorChart].forEach((c) => c && c.resize());
}

// ---------- 数据 ----------
async function load() {
  loading.value = true;
  try {
    const [main, projectDistData, mediaDistData, optimizer, editor] = await Promise.all([
      dashboardApi.load({
        media: media.value,
        date: date.value,
        metric: metric.value,
        project: project.value,
      }),
      dashboardApi.distribution({
        type: 'project',
        metric: projectMetric.value,
        date: projectDate.value,
      }),
      dashboardApi.distribution({
        type: 'media',
        metric: mediaMetric.value,
        date: mediaDate.value,
      }),
      dashboardApi.distribution({
        type: 'optimizer',
        metric: optimizerMetric.value,
        date: optimizerDate.value,
      }),
      dashboardApi.distribution({
        type: 'editor',
        metric: editorMetric.value,
        date: editorDate.value,
      }),
    ]);
    const d = main.data || {};
    overview.value = d.overview || [];
    mediaOptions.value = d.mediaOptions || [];
    projectOptions.value = d.projectOptions || [];
    metricOptions.value = d.metricOptions || [];
    trend.value = d.trend || null;
    projectDist.value = projectDistData.data || { total: 0, items: [] };
    mediaDist.value = mediaDistData.data || { total: 0, items: [] };
    optimizerDist.value = optimizer.data || { total: 0, items: [] };
    editorDist.value = editor.data || { total: 0, items: [] };
    await nextTick();
    renderCharts();
  } finally {
    loading.value = false;
  }
}

watch([media, date, metric, project, projectMetric, mediaMetric, projectDate, mediaDate, optimizerDate, optimizerMetric, editorDate, editorMetric], load);

onMounted(() => {
  load();
  window.addEventListener('resize', resizeCharts);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts);
  [trendChart, projectChart, mediaChart, optimizerChart, editorChart].forEach((c) => c && c.dispose());
});
</script>

<style scoped>
.dash-page { gap: 16px; }

.panel {
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 16px 20px 20px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.panel-title { display: flex; align-items: center; gap: 12px; }
.title-main { font-size: 16px; font-weight: 600; color: #1d2129; }
.detail-link { font-size: 13px; color: #2563eb; cursor: pointer; }
.detail-link:hover { opacity: 0.85; }

.panel-tools { display: flex; align-items: center; gap: 12px; }

/* 顶部筛选控件（浅灰底、无边框） */
.tool-select { width: 120px; }
.tool-select-sm { width: 96px; }
.tool-select-date { width: 150px; }
.tool-select :deep(.el-select__wrapper) {
  background: #f2f3f5;
  border: 1px solid transparent;
  box-shadow: none;
  border-radius: 4px;
  min-height: 28px;
  padding: 0 8px 0 10px;
}
.tool-select :deep(.el-select__wrapper.is-focused) { box-shadow: none; }
.tool-select :deep(.el-select__placeholder),
.tool-select :deep(.el-select__selected-item) { color: #4e5969; font-size: 13px; }
.tool-select :deep(.el-select__caret) { color: #86909c; }

.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  font-size: 13px;
  color: #4e5969;
  background: #f2f3f5;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
}
.tool-btn:hover { color: #2563eb; }
.tool-caret { font-size: 12px; color: #86909c; }

.metric-check { display: flex; flex-direction: column; gap: 6px; }
.metric-check :deep(.el-checkbox) { margin-right: 0; height: 24px; }
.metric-check :deep(.el-checkbox__label) { font-size: 13px; color: #4e5969; }

/* 概览指标卡 */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}
.metric-card { padding: 14px 16px 16px; border-radius: 8px; }
.tone-green { background: #eaf7ef; }
.tone-cream { background: #fdf6e9; }
.tone-blue { background: #eff3fe; }
.metric-label { font-size: 13px; color: #86909c; }
.metric-value {
  margin: 8px 0 10px;
  font-size: 26px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.2;
}
.metric-suffix { font-size: 18px; font-weight: 600; margin-left: 0; }
.metric-compare { display: flex; align-items: center; gap: 6px; font-size: 12px; line-height: 20px; }
.cmp-tag { color: #86909c; }
.cmp-val.good { color: #00b42a; }
.cmp-val.bad { color: #f53f3f; }
.cmp-val.flat { color: #86909c; }
.metric-empty { padding: 40px 0; text-align: center; color: #86909c; font-size: 13px; }

/* 分析页签 */
.head-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  cursor: pointer;
  padding-bottom: 2px;
}
.head-tab:hover { color: #2563eb; }
.head-tab-link { font-size: 13px; color: #86909c; cursor: pointer; }
.head-tab-link:hover { color: #2563eb; }

.trend-chart { width: 100%; height: 400px; }

/* 分布卡片 */
.dist-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.panel-sub { margin-bottom: 12px; }
.dist-body { display: flex; align-items: center; gap: 28px; padding: 6px 8px 40px; min-height: 320px; }
.donut-chart { width: 260px; height: 260px; flex: none; }
.dist-empty { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 320px; }
.dist-empty :deep(.el-empty__description) { margin-top: 8px; }
.dist-empty :deep(.el-empty__description p) { font-size: 13px; color: #86909c; }
.dist-legend { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 20px; }
.dist-legend li { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.lg-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.lg-name {
  color: #1d2129;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lg-sep { color: #c9cdd4; }
.lg-pct { color: #1d2129; }
.lg-val { color: #86909c; margin-left: 6px; }

/* 周期下拉（选项文案较长，弹层允许超出触发器宽度） */
:global(.dash-date-popper) { min-width: 172px !important; }
:global(.dash-date-popper .el-select-dropdown__item) { font-size: 13px; }

@media (max-width: 1440px) {
  .metric-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 1080px) {
  .dist-row { grid-template-columns: minmax(0, 1fr); }
}
</style>
