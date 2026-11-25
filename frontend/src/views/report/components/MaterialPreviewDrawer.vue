<template>
  <!-- 素材预览详情抽屉 —— 对齐线上 cl.mobgi.com 素材报表「素材预览」点击后的右侧抽屉
   * 线上实测（cl.mobgi.com/report/material-report，右抽屉 1128px）：
   *   头部：左「ID：0」+ ⓘ 说明气泡 + ｜ 同步于：{时间}，右「×」关闭
   *   上半区：左侧素材预览（来源图标栏 + 黑色圆角手机竖屏，顶部横排 热点/同城/朋友/推荐，
   *            框内右侧竖排 5 个互动图标，每个图标下面跟一个 0），
   *            右侧「素材详情」页签（选中态：蓝字 + 蓝色下划线）+ 同行最右侧的「历史版本」下拉，
   *            页签行下方是素材详情字段清单（两列：左 同步时间/大小/创建人，右 素材来源/尺寸）
   *   下半区：另起一行的「数据概览 / 素材数据」页签
   *            数据概览：筛选行（全部媒体 + 日期区间 + 自定义指标）+ 一行 6 张指标卡 + 趋势图提示
   *            素材数据：「最近7天创建的广告」+ 铅笔图标 → 媒体子页签（全部媒体/巨量广告/腾讯广告3.0，带计数）
   *                     → 广告列表表格（10 列）→ 空态「暂无数据」→ 底部链接「查看更多详细数据」
   *   指标卡底色/圆点（线上采样）：
   *     消耗 #ebf5ff / #41a2f7、点击率 #ebfffb / #41f7d3、
   *     转化成本 #efffeb / #66f741、转化率 #fffbeb / #f7d13b
   *   指标值（线上原文）：897.46 / 10.61% / 8.47 / 23.61%
   *   素材详情字段（线上原文）：同步时间 2026-11-11 11:35:21、素材来源 头条广告后台上传、
   *     大小 469412、尺寸 1280*720、创建人 --
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
          <!-- 线上头部：ID + ⓘ ｜ 同步于：{时间} -->
          <span class="mpd-header-sep">|</span>
          <span class="mpd-header-sync">同步于：{{ syncTime }}</span>
        </div>
        <button class="mpd-close" type="button" aria-label="关闭" @click="close">
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </template>

    <div class="mpd-body">
      <!-- ============ 上半区：素材预览 + 「素材详情」页签 + 「历史版本」 ============ -->
      <div class="mpd-top">
        <!-- 左：素材预览（来源图标栏 + 手机竖屏预览框） -->
        <div class="mpd-preview">
          <!-- 线上左侧竖排预览来源图标（无边框 / 抖音 / 千川 / 视频号） -->
          <div class="mpd-src-rail">
            <div
              v-for="s in PREVIEW_SOURCES"
              :key="s.key"
              class="mpd-src-item"
              :class="{ active: s.key === previewSource }"
              :title="s.name"
              @click="previewSource = s.key"
            >
              <svg class="mpd-src-ico" viewBox="0 0 24 24" v-html="s.icon" />
            </div>
          </div>

          <!-- 手机竖屏预览框（黑色圆角边框，线上实测约 250 × 450） -->
          <div class="mpd-phone" @click="openImageViewer">
            <div class="mpd-phone-screen">
              <img class="mpd-phone-img" :src="preview" alt="素材预览" />

              <!-- 顶部/右侧压暗层：保证白色图标在浅色封面上也可读 -->
              <div class="mpd-phone-scrim" />

              <!-- 顶部一行：☰ 菜单 —— 热点 同城 朋友 推荐 —— 🔍 搜索 -->
              <div class="mpd-phone-topbar">
                <svg class="mpd-phone-ico" viewBox="0 0 24 24" v-html="ICON_MENU" />
                <div class="mpd-phone-tabs">
                  <span
                    v-for="t in PHONE_TABS"
                    :key="t.text"
                    class="mpd-phone-tab"
                    :class="{ active: t.active }"
                  >{{ t.text }}</span>
                </div>
                <svg class="mpd-phone-ico" viewBox="0 0 24 24" v-html="ICON_SEARCH" />
              </div>

              <!-- 右侧竖排 5 个互动图标，每个图标下面跟一个 0 -->
              <div class="mpd-phone-rail">
                <svg class="mpd-rail-avatar" viewBox="0 0 24 24" v-html="ICON_AVATAR" />
                <div v-for="i in PHONE_ICONS" :key="i.key" class="mpd-rail-item">
                  <svg class="mpd-rail-ico" viewBox="0 0 24 24" v-html="i.icon" />
                  <span class="mpd-rail-count">{{ i.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右：「素材详情」页签 + 同一行最右侧的「历史版本」下拉；其下方是素材详情字段清单（两列） -->
        <div class="mpd-top-right">
          <div class="mpd-top-head">
            <el-tabs v-model="topTab" class="mpd-top-tabs">
              <el-tab-pane name="detail" label="素材详情" />
            </el-tabs>

            <el-select
              v-model="historyVersion"
              size="small"
              class="mpd-history-select"
              placeholder="历史版本"
              clearable
            >
              <el-option label="无数据" value="none" />
            </el-select>
          </div>

          <!-- 线上：手机预览右侧的字段清单（两列：同步时间/素材来源、大小/尺寸、创建人） -->
          <ul class="mpd-meta">
            <li v-for="f in materialMeta" :key="f.label" class="mpd-meta-row">
              <span class="mpd-meta-label">{{ f.label }}</span>
              <span class="mpd-meta-value">{{ f.value }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- ============ 下半区：「数据概览 / 素材数据」页签 ============ -->
      <el-tabs v-model="activeTab" class="mpd-tabs">
        <!-- 数据概览 -->
        <el-tab-pane name="overview" label="数据概览">
          <div class="mpd-pane">
            <div class="mpd-filter-row">
              <el-select
                v-model="drawerMedia"
                class="mpd-media-select"
                placeholder="全部媒体"
              >
                <el-option v-for="o in MEDIA_OPTIONS" :key="o" :label="o" :value="o" />
              </el-select>

              <el-date-picker
                v-model="drawerDateRange"
                type="daterange"
                class="mpd-date-range"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
              />

              <el-button class="mpd-metric-btn" @click="metricVisible = true">
                <svg class="mpd-metric-ico" viewBox="0 0 24 24" v-html="ICON_TUNE" />
                自定义指标
              </el-button>
            </div>

            <div class="mpd-cards">
              <div
                v-for="m in overviewMetrics"
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

        <!-- 素材数据：线上是「最近7天创建的广告」列表（媒体子页签 + 表格 + 底部链接） -->
        <el-tab-pane name="data" label="素材数据">
          <div class="mpd-pane mpd-data-pane">
            <!-- 标题 + 铅笔编辑图标（线上为斜着的铅笔） -->
            <div class="mpd-data-title">
              <span class="mpd-data-title-text">最近7天创建的广告</span>
              <el-tooltip :content="TIP_AD_LIST" placement="top">
                <el-icon class="mpd-data-help"><EditPen /></el-icon>
              </el-tooltip>
            </div>

            <!-- 媒体子页签（带计数） -->
            <div class="mpd-media-tabs">
              <button
                v-for="m in DATA_MEDIA_TABS"
                :key="m.key"
                type="button"
                class="mpd-media-tab"
                :class="{ active: m.key === dataMedia }"
                @click="dataMedia = m.key"
              >{{ m.name }}（{{ m.count }}）</button>
            </div>

            <!-- 广告列表（本地 mock 无广告数据 → 空态「暂无数据」） -->
            <el-table :data="adRows" class="mpd-ad-table" border>
              <el-table-column
                v-for="c in AD_COLUMNS"
                :key="c.prop"
                :prop="c.prop"
                :label="c.label"
                :min-width="c.width || c.minWidth"
                :sortable="c.sortable"
              />
              <template #empty>
                <div class="mpd-ad-empty">暂无数据</div>
              </template>
            </el-table>

            <!-- 底部链接 -->
            <div class="mpd-more">
              <a class="mpd-more-link" href="#" @click.prevent>查看更多详细数据</a>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
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
import { Close, EditPen, QuestionFilled } from '@element-plus/icons-vue';
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
const TIP_TREND = '请筛选大于3天的时间以展示完整的趋势图';
const TIP_AD_LIST = '展示该素材最近 7 天内创建的关联广告及其投放数据，点击可查看广告明细。';

/* 抽屉内「媒体」下拉（线上实测选项） */
const MEDIA_OPTIONS = [
  '全部媒体', '巨量广告', '腾讯广告3.0', '巨量广告·全域', '巨量广告·智擎',
];

/* ------------------------------------------------------------------ *
 * 素材详情字段清单（线上：手机预览右侧的字段区）
 *   同步时间 = 素材创建时间 / 素材来源 = 头条广告后台上传 /
 *   大小 = 素材字节数 / 尺寸 = 1280*720 / 创建人 = --
 * ------------------------------------------------------------------ */
const MATERIAL_SOURCE = '头条广告后台上传';
const MATERIAL_SIZE = '469412';
const MATERIAL_DIMENSION = '1280*720';
const MATERIAL_CREATOR = '--';

/* 指标卡（线上原值 + 线上采样底色/圆点色） */
const mainMetrics = [
  { label: '消耗', value: '897.46', color: '#41a2f7', bg: '#ebf5ff' },
  { label: '平均千次展现费用', value: '212.12', color: '#9b7bf7', bg: '#f5f0ff' },
  { label: '点击率', value: '10.61%', color: '#41f7d3', bg: '#ebfffb' },
  { label: '平均点击单价', value: '2.00', color: '#f77bb8', bg: '#fff0f5' },
  { label: '转化成本', value: '8.47', color: '#66f741', bg: '#efffeb' },
  { label: '转化率', value: '23.61%', color: '#f7d13b', bg: '#fffbeb' },
];

/* ------------------------------------------------------------------ *
 * 「素材数据」页签：媒体子页签（带计数）+ 广告列表表头
 * ------------------------------------------------------------------ */
const DATA_MEDIA_TABS = [
  { key: 'all', name: '全部媒体', count: 0 },
  { key: 'douyin', name: '巨量广告', count: 0 },
  { key: 'tencent', name: '腾讯广告3.0', count: 0 },
];

const AD_COLUMNS = [
  { prop: 'ad_name', label: '广告名称和ID', width: 160 },
  { prop: 'ad_account', label: '广告账户', width: 160 },
  { prop: 'operation', label: '操作', width: 60 },
  { prop: 'creator', label: '创建人', width: 86 },
  { prop: 'create_time', label: '创建时间', width: 100, sortable: true },
  { prop: 'cost', label: '消耗', width: 90, sortable: true },
  { prop: 'show_cnt', label: '展示数', width: 90, sortable: true },
  { prop: 'click_cnt', label: '点击数', width: 90, sortable: true },
  { prop: 'convert_cost', label: '转化成本', width: 100, sortable: true },
  { prop: 'convert_rate', label: '转化率', width: 100, sortable: true },
];

/* ------------------------------------------------------------------ *
 * 素材预览区（线上：左侧来源图标栏 + 手机竖屏预览框）
 * ------------------------------------------------------------------ */
const ICON_MENU = '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">'
  + '<path d="M3.5 6.5h17M3.5 12h12M3.5 17.5h8"/></g>';
const ICON_SEARCH = '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">'
  + '<circle cx="11" cy="11" r="6.2"/><path d="M15.6 15.6L21 21"/></g>';
const ICON_TUNE = '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">'
  + '<path d="M3.5 7h6M13.5 7h7M3.5 12h10M17.5 12h3M3.5 17h3M10.5 17h10"/>'
  + '<circle cx="11" cy="7" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="17" r="2"/></g>';
const ICON_AVATAR = '<circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.6"/>';
const ICON_HEART = '<path fill="currentColor" d="M12 20.4s-7.4-4.5-7.4-9.3A4.1 4.1 0 0 1 12 8.5'
  + 'a4.1 4.1 0 0 1 7.4 2.6c0 4.8-7.4 9.3-7.4 9.3z"/>';
const ICON_COMMENT = '<path fill="currentColor" d="M12 4.4c4.2 0 7.6 2.8 7.6 6.4 0 3.6-3.4 6.4-7.6 6.4'
  + '-.8 0-1.6-.1-2.4-.3l-4.2 2.1 1.3-3.2c-1.5-1.2-2.3-3-2.3-5 0-3.6 3.4-6.4 7.6-6.4z"/>';
const ICON_STAR = '<path fill="currentColor" d="M12 3.8l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7'
  + ' 1-5.8-4.2-4.1 5.8-.8L12 3.8z"/>';
const ICON_SHARE = '<g fill="currentColor"><path d="M12 3.2l5.2 5.2h-3.3v6.4h-3.8V8.4H6.8L12 3.2z"/>'
  + '</g><path d="M4.8 13.4v6.4h14.4v-6.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';

/* 线上左侧竖排预览来源图标 */
const PREVIEW_SOURCES = [
  {
    key: 'noborder',
    name: '无边框',
    icon: '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">'
      + '<path d="M2.6 12S6.6 5.6 12 5.6c1.9 0 3.6.6 5 1.5"/>'
      + '<path d="M21.4 12s-4 6.4-9.4 6.4c-1.9 0-3.6-.6-5-1.5"/>'
      + '<circle cx="12" cy="12" r="2.6"/><path d="M3.4 3.4l17.2 17.2"/></g>',
  },
  {
    key: 'douyin',
    name: '抖音',
    icon: '<path fill="currentColor" d="M16.2 2.6c.4 2.4 2 4.1 4.4 4.5v2.9c-1.7 0-3.3-.5-4.7-1.5v6.6'
      + 'c0 3.7-2.6 6.2-6.1 6.2-3.2 0-5.8-2.6-5.8-5.8 0-3.4 2.8-6 6.2-5.7v3c-1.7-.2-3.2 1.1-3.2 2.8 0 1.5 1.3 2.7 2.9 2.7'
      + '1.7 0 3-1.3 3-3.1V2.6h3.3z"/>',
  },
  {
    key: 'qianchuan',
    name: '千川',
    icon: '<g fill="currentColor"><rect x="2.6" y="12.4" width="5" height="9" rx="1.2"/>'
      + '<rect x="9.5" y="5.6" width="5" height="15.8" rx="1.2"/>'
      + '<rect x="16.4" y="9.2" width="5" height="12.2" rx="1.2"/></g>',
  },
  {
    key: 'shipinhao',
    name: '视频号',
    icon: '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M4.6 5.4v6.2l3.1 6.4 4.3-12.2 4.3 12.2 3.1-6.4V5.4"/></g>',
  },
];

/* 手机预览框顶部横排页签（线上：热点 / 同城 / 朋友 / 推荐，「推荐」选中） */
const PHONE_TABS = [
  { text: '热点' },
  { text: '同城' },
  { text: '朋友' },
  { text: '推荐', active: true },
];

/* 手机预览框右侧竖排互动图标（线上：圆形 / 爱心 / 评论 / 星星 / 转发，计数均为 0） */
const PHONE_ICONS = [
  { key: 'like', count: '0', icon: ICON_HEART },
  { key: 'comment', count: '0', icon: ICON_COMMENT },
  { key: 'collect', count: '0', icon: ICON_STAR },
  { key: 'share', count: '0', icon: ICON_SHARE },
];

/* ------------------------------------------------------------------ *
 * 抽屉状态
 * ------------------------------------------------------------------ */
const topTab = ref('detail');
const activeTab = ref('overview');
// 线上该下拉未选中任何值，显示灰色占位「历史版本」
const historyVersion = ref('');
const drawerMedia = ref('巨量广告');
const drawerDateRange = ref(['2026-11-24', '2026-11-24']);
const metricVisible = ref(false);
const imageVisible = ref(false);
const customMetrics = ref([]);
const previewSource = ref('douyin');
/* 「素材数据」页签当前媒体子页签（线上默认选中「巨量广告」） */
const dataMedia = ref('douyin');
/* 「最近7天创建的广告」列表（本地 mock 无广告数据 → 空表） */
const adRows = ref([]);

const materialId = computed(() => {
  const v = props.row && props.row.material_id;
  return v === undefined || v === null || v === '' ? '0' : String(v);
});
const preview = computed(() => (props.row && props.row.preview) || '');

/** 同步时间：取素材的创建日期（本地 mock 行上的「时间」列），时分秒按行序稳定生成 */
const syncTime = computed(() => {
  const raw = String((props.row && props.row.date) || '').trim();
  let day = '';
  if (/^\d{8}$/.test(raw)) day = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) day = raw;
  if (!day) day = '2026-11-24';
  const seed = Number((props.row && props.row.id) || 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${day} ${pad(8 + (seed % 12))}:${pad((seed * 7) % 60)}:${pad((seed * 13) % 60)}`;
});

/** 素材详情字段清单（线上：手机预览右侧的字段区） */
const materialMeta = computed(() => [
  { label: '同步时间', value: syncTime.value },
  { label: '素材来源', value: MATERIAL_SOURCE },
  { label: '大小', value: MATERIAL_SIZE },
  { label: '尺寸', value: MATERIAL_DIMENSION },
  { label: '创建人', value: MATERIAL_CREATOR },
]);

/** 「数据概览」指标卡行：固定指标 + 「自定义指标」里勾选的指标 */
const overviewMetrics = computed(() => {
  const extra = customMetrics.value
    .filter((n) => !mainMetrics.some((m) => m.label === n))
    .map((n) => ({ label: n, value: metricText(n), color: '#3b9ff7', bg: '#f7f8fa' }));
  return [...mainMetrics, ...extra];
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
      topTab.value = 'detail';
      activeTab.value = 'overview';
      historyVersion.value = '';
      customMetrics.value = [];
      previewSource.value = 'douyin';
      dataMedia.value = 'douyin';
      adRows.value = [];
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
  padding: 12px 16px;
  border-bottom: none;
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
  font-size: 14px;
  font-weight: 500;
  color: #333333;
}
/* 线上头部：ID + ⓘ ｜ 同步于：{时间} */
.mpd-header-sep {
  margin: 0 8px;
  font-size: 14px;
  color: #999999;
}
.mpd-header-sync {
  font-size: 14px;
  color: #333333;
}
.mpd-help {
  font-size: 16px;
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

/* 抽屉主体 */
.mpd-body {
  padding: 0 16px 16px;
  box-sizing: border-box;
}

/* ============ 上半区：素材预览 + 素材详情页签 + 历史版本 ============ */
.mpd-top {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.mpd-top-right {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 470px;
  padding-top: 6px;
}
/* 「素材详情」页签 + 字段清单 + 「历史版本」下拉 同一行 */
.mpd-top-head {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
}
.mpd-top-tabs {
  flex: 0 0 auto;
}
.mpd-top-tabs .el-tabs__header {
  margin-bottom: 0;
}
.mpd-top-tabs .el-tabs__item {
  height: 40px;
  font-size: 14px;
  color: #303133;
}
/* 线上「素材详情」是选中态（蓝字 + 蓝色下划线，取线上采样色） */
.mpd-top-tabs .el-tabs__item.is-active {
  color: #507ffb;
}
.mpd-top-tabs .el-tabs__active-bar {
  background-color: #546ef7;
}
.mpd-top-tabs .el-tabs__content {
  display: none;
}

/* 素材详情字段清单（线上：两列 —— 左 同步时间/大小/创建人，右 素材来源/尺寸） */
.mpd-meta {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 24px;
  row-gap: 6px;
}
.mpd-meta-row {
  display: flex;
  align-items: center;
  min-width: 0;
  line-height: 24px;
}
.mpd-meta-label {
  flex: 0 0 64px;
  font-size: 12px;
  color: #909399;
}
.mpd-meta-value {
  font-size: 13px;
  color: #333333;
}

.mpd-history-select {
  margin-left: auto;
  flex: 0 0 240px;
  width: 240px;
}

/* 左：来源图标栏 + 手机竖屏预览 */
.mpd-preview {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 0 0 auto;
}
.mpd-src-rail {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 5px;
  border-radius: 4px;
  background: #f5f5f5;
}
.mpd-src-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  color: #8a94a6;
  cursor: pointer;
}
.mpd-src-item:hover {
  color: #197afb;
}
.mpd-src-item.active {
  background: #ffffff;
  color: #333333;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}
.mpd-src-ico {
  width: 20px;
  height: 20px;
  display: block;
}
.mpd-src-item:last-child .mpd-src-ico {
  color: #ff8f1f;
}

/* 手机竖屏预览框（黑色圆角边框，线上实测约 250 × 450） */
.mpd-phone {
  box-sizing: border-box;
  width: 250px;
  height: 450px;
  padding: 6px;
  border-radius: 30px;
  background: #0f0f0f;
  cursor: zoom-in;
}
.mpd-phone-screen {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  background: #000000;
}
.mpd-phone-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
/* 顶部 / 右侧压暗层（线上封面为纯黑时不可见，保证浅色封面上白色图标可读） */
.mpd-phone-scrim {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0, rgba(0, 0, 0, 0) 60px),
    linear-gradient(270deg, rgba(0, 0, 0, 0.4) 0, rgba(0, 0, 0, 0) 70px);
}
/* 顶部一行：菜单 —— 热点 同城 朋友 推荐 —— 搜索 */
.mpd-phone-topbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 38px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  color: #ffffff;
}
.mpd-phone-ico {
  width: 20px;
  height: 20px;
  display: block;
  flex: 0 0 auto;
}
.mpd-phone-tabs {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 13px;
}
.mpd-phone-tab {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}
.mpd-phone-tab.active {
  text-decoration: underline;
}
/* 右侧竖排 5 个互动图标（每个图标下面跟一个 0） */
.mpd-phone-rail {
  position: absolute;
  right: 10px;
  top: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #ffffff;
}
.mpd-rail-avatar {
  width: 34px;
  height: 34px;
  display: block;
  margin-bottom: 2px;
}
.mpd-rail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
.mpd-rail-ico {
  width: 23px;
  height: 23px;
  display: block;
}
.mpd-rail-count {
  font-size: 12px;
  line-height: 1.2;
  color: #ffffff;
}

/* ============ 下半区：数据概览 / 素材数据 ============ */
.mpd-tabs .el-tabs__header {
  margin-bottom: 0;
}
.mpd-tabs .el-tabs__item {
  height: 46px;
  font-size: 14px;
  color: #606266;
}
.mpd-tabs .el-tabs__item.is-active {
  color: #197afb;
}
.mpd-pane {
  padding-top: 8px;
}

/* 指标卡（一行 6 张：按抽屉宽度自适应等分） */
.mpd-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.mpd-card {
  box-sizing: border-box;
  flex: 1 1 0;
  min-width: 0;
  max-width: 205px;
  border-radius: 8px;
  padding: 16px 12px;
}
/* 素材数据：标题 + 媒体子页签 + 广告列表 + 底部链接 */
.mpd-data-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 12px;
}
.mpd-data-title-text {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}
.mpd-data-help {
  font-size: 14px;
  color: #999999;
  cursor: pointer;
}
.mpd-data-help:hover {
  color: #197afb;
}
.mpd-media-tabs {
  display: inline-flex;
  margin-bottom: 12px;
}
.mpd-media-tab {
  box-sizing: border-box;
  position: relative;
  height: 32px;
  padding: 0 16px;
  margin-left: -1px;
  border: 1px solid #dcdfe6;
  background: #ffffff;
  color: #909399;
  font-size: 13px;
  line-height: 30px;
  cursor: pointer;
}
.mpd-media-tab:first-child {
  margin-left: 0;
}
.mpd-media-tab:hover {
  color: #409eff;
}
.mpd-media-tab.active {
  z-index: 1;
  border-color: #409eff;
  color: #409eff;
}
.mpd-ad-table {
  width: 100%;
}
.el-drawer.mpd-drawer .mpd-ad-table th.el-table__cell {
  background: #fafafa;
  color: #333333;
  font-size: 12px;
  font-weight: 700;
  border-color: #e8eaec;
}
.el-drawer.mpd-drawer .mpd-ad-table td.el-table__cell {
  font-size: 12px;
  color: #606266;
  border-color: #e8eaec;
}
.mpd-ad-empty {
  padding: 70px 0;
  font-size: 13px;
  color: #909399;
}
.mpd-more {
  margin-top: 12px;
  padding: 12px 0;
  border-radius: 8px;
  background: #f2f2f2;
  text-align: center;
}
.mpd-more-link {
  font-size: 13px;
  color: #409eff;
  text-decoration: underline;
  cursor: pointer;
}
.mpd-more-link:hover {
  color: #197afb;
}
.mpd-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}
.mpd-card-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: 0 0 auto;
}
.mpd-card-value {
  margin-top: 6px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  color: #333333;
}

/* 趋势图提示 */
.mpd-tip {
  margin-top: 16px;
  text-align: center;
  font-size: 13px;
  color: #909399;
}

/* 筛选行（线上实测：媒体下拉 120px / 日期区间 230px / 自定义指标按钮） */
.mpd-filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0 16px;
}
.mpd-media-select {
  width: 120px;
  flex: 0 0 120px;
}
.mpd-date-range {
  width: 230px;
  min-width: 0;
  flex: 0 0 230px;
}
.mpd-metric-btn {
  margin-left: 4px;
  border-color: transparent;
  background: transparent;
  color: #333333;
  padding-left: 8px;
  padding-right: 8px;
}
.mpd-metric-btn:hover {
  color: #197afb;
  border-color: transparent;
  background: transparent;
}
.mpd-metric-ico {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  vertical-align: -3px;
}
.el-drawer.mpd-drawer .mpd-media-select .el-select__wrapper {
  background: #f5f5f5;
  box-shadow: none;
}
.el-drawer.mpd-drawer .mpd-date-range.el-range-editor {
  width: 230px;
  min-width: 0;
  background: #f5f5f5;
  box-shadow: none;
}
.el-drawer.mpd-drawer .mpd-date-range .el-range-input {
  font-size: 13px;
}
.el-drawer.mpd-drawer .mpd-history-select .el-select__wrapper {
  background: #fafafa;
  box-shadow: none;
}
</style>
