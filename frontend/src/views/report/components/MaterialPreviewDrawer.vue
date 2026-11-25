<template>
  <!-- 素材预览详情抽屉 —— 对齐线上 cl.mobgi.com 素材报表「素材预览」点击后的右侧抽屉
   * 线上实测：右侧滑出，宽 1128px，高=视口高
   *   头部：左「ID：0」+ ⓘ 说明，右「×」关闭
   *   页签行：素材详情 / 数据概览 / 素材数据，右侧「历史版本」下拉（默认「无数据」）
   *   素材详情：左素材预览（手机竖屏样式，右侧竖排 热点/同城/朋友/推荐），右指标卡
   *   数据概览：筛选行（媒体 + 日期区间 + 自定义指标）+ 指标卡 + 趋势图提示
   *   素材数据：筛选行（媒体 + 日期区间 + 自定义指标）+ 指标卡行（同步时间/大小/消耗/点击率/展示率）
   -->
  <el-drawer
    :model-value="modelValue"
    direction="rtl"
    :size="1128"
    append-to-body
    :show-close="false"
    class="mpd-drawer"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <!-- ============ 抽屉头部 ============ -->
    <template #header>
      <div class="mpd-header">
        <div class="mpd-header-left">
          <span class="mpd-header-id">ID：{{ materialId }}</span>
          <el-popover placement="bottom-start" :width="300" trigger="hover">
            <template #reference>
              <el-icon class="mpd-help"><QuestionFilled /></el-icon>
            </template>
            {{ TIP_ID }}
          </el-popover>
        </div>
        <button class="mpd-close" type="button" aria-label="关闭" @click="close">
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </template>

    <div class="mpd-body">
      <!-- ============ 页签行（+ 右侧历史版本） ============ -->
      <div class="mpd-tabbar">
        <el-tabs v-model="activeTab" class="mpd-tabs">
          <!-- 素材详情 -->
          <el-tab-pane name="detail">
            <template #label><span class="mpd-tab-label">素材详情</span></template>
            <div class="mpd-pane">
              <div class="mpd-detail">
                <!-- 左：素材预览（手机竖屏样式） -->
                <div class="mpd-preview-box">
                  <div class="mpd-phone" @click="openImageViewer">
                    <div class="mpd-phone-screen">
                      <img class="mpd-phone-img" :src="preview" alt="素材预览" />
                      <div class="mpd-phone-actions">
                        <span>热点</span>
                        <span>同城</span>
                        <span>朋友</span>
                        <span class="active">推荐</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 右：指标卡 -->
                <div class="mpd-cards mpd-cards-grid">
                  <div
                    v-for="m in mainMetrics"
                    :key="m.label"
                    class="mpd-card"
                    :style="{ backgroundColor: m.bg }"
                  >
                    <div class="mpd-card-title">
                      <span class="mpd-card-dot" :style="{ backgroundColor: m.color }" />
                      {{ m.label }}
                    </div>
                    <div class="mpd-card-value">{{ m.value }}</div>
                  </div>
                </div>
              </div>
              <div class="mpd-tip">{{ TIP_TREND }}</div>
            </div>
          </el-tab-pane>

          <!-- 数据概览 -->
          <el-tab-pane name="overview">
            <template #label><span class="mpd-tab-label">数据概览</span></template>
            <div class="mpd-pane">
              <div class="mpd-filter-row">
                <el-select
                  v-model="drawerMedia"
                  size="small"
                  class="mpd-media-select"
                  placeholder="全部媒体"
                >
                  <el-option v-for="o in MEDIA_OPTIONS" :key="o" :label="o" :value="o" />
                </el-select>

                <el-date-picker
                  v-model="drawerDateRange"
                  type="daterange"
                  size="small"
                  class="mpd-date-range"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                />

                <el-button size="small" class="mpd-metric-btn" @click="metricVisible = true">
                  <el-icon><Setting /></el-icon>自定义指标
                </el-button>
              </div>

              <div class="mpd-cards">
                <div
                  v-for="m in mainMetrics"
                  :key="m.label"
                  class="mpd-card"
                  :style="{ backgroundColor: m.bg }"
                >
                  <div class="mpd-card-title">
                    <span class="mpd-card-dot" :style="{ backgroundColor: m.color }" />
                    {{ m.label }}
                  </div>
                  <div class="mpd-card-value">{{ m.value }}</div>
                </div>
              </div>

              <div class="mpd-tip">{{ TIP_TREND }}</div>
            </div>
          </el-tab-pane>

          <!-- 素材数据 -->
          <el-tab-pane name="data">
            <template #label><span class="mpd-tab-label">素材数据</span></template>
            <div class="mpd-pane">
              <div class="mpd-filter-row">
                <el-select
                  v-model="drawerMedia"
                  size="small"
                  class="mpd-media-select"
                  placeholder="全部媒体"
                >
                  <el-option v-for="o in MEDIA_OPTIONS" :key="o" :label="o" :value="o" />
                </el-select>

                <el-date-picker
                  v-model="drawerDateRange"
                  type="daterange"
                  size="small"
                  class="mpd-date-range"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                />

                <el-button size="small" class="mpd-metric-btn" @click="metricVisible = true">
                  <el-icon><Setting /></el-icon>自定义指标
                </el-button>
              </div>

              <div class="mpd-cards">
                <div
                  v-for="m in dataMetrics"
                  :key="m.label"
                  class="mpd-card mpd-card-plain"
                >
                  <div class="mpd-card-title">
                    <span class="mpd-card-dot" :style="{ backgroundColor: m.color || '#3b9ff7' }" />
                    {{ m.label }}
                  </div>
                  <div class="mpd-card-value">{{ m.value }}</div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <!-- 历史版本 -->
        <el-select
          v-model="historyVersion"
          size="small"
          class="mpd-history-select"
          placeholder="历史版本"
        >
          <el-option label="无数据" value="none" />
        </el-select>
      </div>
    </div>

    <!-- 素材大图预览 -->
    <el-image-viewer
      v-if="imageVisible"
      :url-list="preview ? [preview] : []"
      teleported
      @close="imageVisible = false"
    />

    <!-- 「自定义指标」弹窗 -->
    <CustomMetricDialog
      v-model="metricVisible"
      metric-key="material"
      @apply="onMetricApply"
    />
  </el-drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { Close, QuestionFilled, Setting } from '@element-plus/icons-vue';
import CustomMetricDialog from './CustomMetricDialog.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 表格行数据（素材信息）
  row: { type: Object, default: null },
});
const emit = defineEmits(['update:modelValue']);

/* ------------------------------------------------------------------ *
 * 线上实测文案
 * ------------------------------------------------------------------ */
const TIP_ID = '素材ID为该素材在媒体平台侧的标识，部分素材由创量生成素材后回传媒体，ID为 0 表示该素材未在媒体平台创建。';
const TIP_TREND = '请选择大于3天的时间以展示完整的趋势图';

/* 抽屉内「媒体」下拉（线上实测选项） */
const MEDIA_OPTIONS = [
  '全部媒体', '巨量广告', '腾讯广告3.0', '巨量广告·全域', '巨量广告·智擎',
];

/* 指标卡（线上实测值） */
const mainMetrics = [
  { label: '消耗', value: '897.46', color: '#3b9ff7', bg: '#ebf5ff' },
  { label: '点击率', value: '10.61%', color: '#3bf7d1', bg: '#ebfffb' },
  { label: '转化成本', value: '8.47', color: '#61f73b', bg: '#efffeb' },
  { label: '转化率', value: '23.61%', color: '#f7d13b', bg: '#fffbeb' },
];

const BASE_DATA_METRICS = [
  { label: '同步时间', value: '2026-11-24 09:45' },
  { label: '大小', value: '2.36 MB' },
  { label: '消耗', value: '897.46' },
  { label: '点击率', value: '10.61%' },
  { label: '展示率', value: '98.72%' },
];

/* ------------------------------------------------------------------ *
 * 抽屉状态
 * ------------------------------------------------------------------ */
const activeTab = ref('detail');
const historyVersion = ref('none');
const drawerMedia = ref('全部媒体');
const drawerDateRange = ref(['2026-11-24', '2026-11-24']);
const metricVisible = ref(false);
const imageVisible = ref(false);
const customMetrics = ref([]);

const materialId = computed(() => {
  const v = props.row && props.row.material_id;
  return v === undefined || v === null || v === '' ? '0' : String(v);
});
const preview = computed(() => (props.row && props.row.preview) || '');

/** 「素材数据」页签的指标卡行：基础指标 + 「自定义指标」里勾选的指标 */
const dataMetrics = computed(() => {
  const extra = customMetrics.value
    .filter((n) => !BASE_DATA_METRICS.some((b) => b.label === n))
    .map((n) => ({ label: n, value: metricText(n) }));
  return [...BASE_DATA_METRICS, ...extra];
});

/** 自定义指标取值（本地 mock，按指标名稳定生成） */
function metricText(name) {
  if (/率$/.test(name)) return '12.34%';
  if (/(成本|费用|单价|花费|金额)/.test(name)) return '18.90';
  return '1,234';
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      activeTab.value = 'detail';
      historyVersion.value = 'none';
      customMetrics.value = [];
    } else {
      // 抽屉关闭时同步关掉大图预览
      imageVisible.value = false;
    }
  }
);

function onMetricApply({ selected }) {
  customMetrics.value = [...(selected || [])];
}

function openImageViewer() {
  if (!preview.value) return;
  imageVisible.value = true;
}

function close() {
  emit('update:modelValue', false);
}
</script>

<style>
/* el-drawer 会 teleport 到 body，样式不能用 scoped */
.el-drawer.mpd-drawer {
  background: #ffffff;
}
.el-drawer.mpd-drawer .el-drawer__header {
  margin-bottom: 0;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f2f5;
}
.el-drawer.mpd-drawer .el-drawer__body {
  padding: 0;
  overflow: auto;
}

/* 抽屉头部 */
.mpd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}
.mpd-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.mpd-header-id {
  font-size: 16px;
  font-weight: 500;
  color: #333333;
}
.mpd-help {
  color: #c0c4cc;
  cursor: pointer;
}
.mpd-help:hover {
  color: #197afb;
}
.mpd-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  color: #909399;
  font-size: 18px;
  cursor: pointer;
}
.mpd-close:hover {
  color: #197afb;
}

/* 页签行 */
.mpd-body {
  padding: 0 24px 24px;
  box-sizing: border-box;
}
.mpd-tabbar {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.mpd-tabs {
  flex: 1 1 auto;
  min-width: 0;
}
.mpd-tabs .el-tabs__header {
  margin-bottom: 0;
}
.mpd-tabs .el-tabs__nav-wrap::after {
  display: none;
}
.mpd-tabs .el-tabs__item {
  height: 46px;
  font-size: 14px;
  color: #606266;
}
.mpd-tabs .el-tabs__item.is-active {
  color: #197afb;
}
.mpd-tab-label {
  font-size: 14px;
}
.mpd-history-select {
  flex: 0 0 200px;
  margin-top: 9px;
}
.mpd-pane {
  padding-top: 8px;
}

/* 素材详情：左预览 + 右指标卡 */
.mpd-detail {
  display: flex;
  align-items: flex-start;
  gap: 32px;
}
.mpd-preview-box {
  flex: 0 0 300px;
  display: flex;
  justify-content: center;
  padding-top: 8px;
}
.mpd-phone {
  box-sizing: border-box;
  width: 240px;
  height: 420px;
  padding: 8px;
  border-radius: 20px;
  background: #111111;
  cursor: zoom-in;
}
.mpd-phone-screen {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 13px;
  overflow: hidden;
  background: #000000;
}
.mpd-phone-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.mpd-phone-actions {
  position: absolute;
  top: 12px;
  right: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.mpd-phone-actions span {
  font-size: 12px;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}
.mpd-phone-actions span.active {
  font-weight: 700;
}
.mpd-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.mpd-cards-grid {
  flex: 1 1 auto;
  align-content: flex-start;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.mpd-card {
  box-sizing: border-box;
  flex: 1 1 200px;
  min-width: 190px;
  border-radius: 8px;
  padding: 16px 20px;
}
.mpd-card-plain {
  background: #f7f8fa;
}
.mpd-card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}
.mpd-card-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.mpd-card-value {
  margin-top: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #333333;
}

/* 趋势图提示 */
.mpd-tip {
  margin-top: 16px;
  text-align: center;
  font-size: 13px;
  color: #909399;
}

/* 筛选行 */
.mpd-filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0 16px;
}
.mpd-media-select {
  width: 130px;
}
.mpd-date-range {
  width: 300px;
}
.mpd-metric-btn {
  margin-left: 4px;
}
</style>
