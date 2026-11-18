<template>
  <el-drawer
    :model-value="modelValue"
    direction="rtl"
    size="min(1000px, 96vw)"
    :with-header="false"
    :close-on-click-modal="false"
    append-to-body
    class="ad-detail-drawer"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <div class="ad-wrap">
      <!-- 关闭按钮：贴附在抽屉左边缘（与线上一致） -->
      <button class="ad-close" title="关闭" @click="close">
        <el-icon><Close /></el-icon>
      </button>

      <div class="ad-scroll">
        <!-- 顶部：广告名称 -->
        <div class="ad-head">
          <div class="ad-title" :title="d.name">{{ d.name }}</div>
        </div>

        <!-- 广告摘要：状态 / 广告ID / 预算 / 出价 / 深度出价 / ROI系数 -->
        <div class="ad-meta">
          <span class="ad-state" :class="d.enabled ? 'is-on' : 'is-off'">{{ d.stateText }}</span>
          <span class="ad-kv"><i>广告ID:&nbsp;</i>{{ d.adId }}</span>
          <span class="ad-kv"><i>预算:&nbsp;</i>{{ d.budget }}</span>
          <span class="ad-kv"><i>出价:&nbsp;</i>{{ d.bid }}</span>
          <span class="ad-kv"><i>深度出价:&nbsp;</i>{{ d.deepBid }}</span>
          <span class="ad-kv"><i>ROI系数:&nbsp;</i>{{ d.roi }}</span>
          <!-- 行内启停（线上详情页右上角同样有开关，本地复刻） -->
          <el-switch v-model="enabled" class="ad-switch" />
        </div>

        <!-- 页签：广告 / 项目 -->
        <div class="ad-tabs">
          <span class="ad-tab" :class="{ active: tab === 'ad' }" @click="tab = 'ad'">广告</span>
          <span class="ad-tab" :class="{ active: tab === 'project' }" @click="tab = 'project'">项目</span>
        </div>

        <!-- 广告详情 -->
        <div v-show="tab === 'ad'" class="ad-body">
          <section class="ad-sec">
            <div class="ad-sec-hd ad-hd-base">
              <span class="ad-sec-title">基础信息</span>
              <a class="ad-link" @click="onViewProject">查看项目广告</a>
            </div>
          </section>

          <div class="ad-cols">
            <div class="ad-col">
              <section v-for="sec in d.adLeft" :key="sec.title" class="ad-sec">
                <div class="ad-sec-hd"><span class="ad-sec-title">{{ sec.title }}</span></div>
                <div class="ad-rows">
                  <div v-for="row in sec.rows" :key="row.label" class="ad-row">
                    <div class="ad-label">{{ row.label }}</div>
                    <div class="ad-value" :class="{ 'is-link': row.link }" :title="row.link ? row.value : ''" @click="row.link && onLink(row)">
                      {{ row.value }}
                    </div>
                  </div>
                </div>
              </section>

              <section class="ad-sec">
                <div class="ad-sec-hd"><span class="ad-sec-title">标题</span></div>
                <div class="ad-rows">
                  <div class="ad-row">
                    <div class="ad-label">总计</div>
                    <div class="ad-value">{{ d.titles.length }}</div>
                  </div>
                  <div v-for="(t, i) in d.titles" :key="i" class="ad-row">
                    <div class="ad-label">标题</div>
                    <div class="ad-value">{{ t }}</div>
                  </div>
                </div>
              </section>
            </div>

            <div class="ad-col">
              <section v-for="sec in d.adRight" :key="sec.title" class="ad-sec">
                <div class="ad-sec-hd"><span class="ad-sec-title">{{ sec.title }}</span></div>
                <div class="ad-rows">
                  <div v-for="row in sec.rows" :key="row.label" class="ad-row">
                    <div class="ad-label">{{ row.label }}</div>
                    <div class="ad-value" :class="{ 'is-link': row.link }" :title="row.link ? row.value : ''" @click="row.link && onLink(row)">
                      {{ row.value }}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <!-- 项目详情 -->
        <div v-show="tab === 'project'" class="ad-body">
          <section class="ad-sec">
            <div class="ad-sec-hd ad-hd-base">
              <span class="ad-sec-title">基础信息</span>
              <a class="ad-link" @click="onViewProject">查看项目下广告</a>
            </div>
          </section>
          <div class="ad-cols">
            <div class="ad-col">
              <section v-for="sec in d.projectLeft" :key="sec.title" class="ad-sec">
                <div class="ad-sec-hd"><span class="ad-sec-title">{{ sec.title }}</span></div>
                <div class="ad-rows">
                  <div v-for="row in sec.rows" :key="row.label" class="ad-row">
                    <div class="ad-label">{{ row.label }}</div>
                    <div class="ad-value" :class="{ 'is-link': row.link }" :title="row.link ? row.value : ''" @click="row.link && onLink(row)">
                      {{ row.value }}
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <div class="ad-col">
              <section v-for="sec in d.projectRight" :key="sec.title" class="ad-sec">
                <div class="ad-sec-hd"><span class="ad-sec-title">{{ sec.title }}</span></div>
                <div class="ad-rows">
                  <div v-for="row in sec.rows" :key="row.label" class="ad-row">
                    <div class="ad-label">{{ row.label }}</div>
                    <div class="ad-value" :class="{ 'is-link': row.link }" :title="row.link ? row.value : ''" @click="row.link && onLink(row)">
                      {{ row.value }}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Close } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: Boolean,
  // 广告列表行
  row: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['update:modelValue', 'view-project']);

const tab = ref('ad');
// 行内启停（详情页开关）
const enabled = ref(false);

watch(
  () => props.row,
  (r) => { enabled.value = r?.status === 'enabled'; },
  { immediate: true }
);

watch(enabled, (v) => {
  if (!props.modelValue) return;
  if (props.row) props.row.status = v ? 'enabled' : 'disabled';
  ElMessage.info(`原型：${v ? '启用' : '暂停'}广告（不提交真实接口）`);
});

const dash = (v) => (v === '' || v == null ? '-' : v);

const d = computed(() => {
  const r = props.row || {};
  const enabled = r.status === 'enabled';
  return {
    name: r.name || '',
    stateText: enabled ? '启用中' : '已暂停',
    enabled,
    adId: r.ad_id || '-',
    budget: dash(r.budget),
    bid: dash(r.bid),
    deepBid: dash(r.deep_bid),
    roi: dash(r.roi_coefficient),
    titles: r.titles || [],
    adLeft: [
      {
        title: '推广身份',
        rows: [
          { label: '推广身份', value: r.identity || '推广身份' },
          { label: '广告主', value: '-' },
        ],
      },
      {
        title: '原生锚点',
        rows: [
          { label: '原生锚点', value: dash(r.anchor_id) },
          { label: '锚点ID', value: dash(r.anchor_id) },
        ],
      },
      {
        title: '落地页',
        rows: [
          { label: r.landing_type || '小程序链接', value: '-' },
          { label: '落地页链接', value: r.landing_url || '-', link: true },
        ],
      },
      {
        title: '直达链接',
        rows: [
          { label: '直达链接', value: r.direct_url || '-', link: true },
          { label: '直达备用链接', value: dash(r.backup_url) },
        ],
      },
    ],
    adRight: [
      {
        title: '产品信息',
        rows: [
          { label: '产品名称', value: r.product_name || '-' },
          { label: '产品卖点', value: r.selling_points || '-' },
          { label: '行动号召', value: r.action_call || '-' },
        ],
      },
      {
        title: '广告设置',
        rows: [
          { label: '来源', value: dash(r.source) },
          { label: '广告评论', value: r.comment_enabled || '启用' },
        ],
      },
    ],
    projectLeft: [
      {
        title: '营销目标与场景',
        rows: [
          { label: '推广目标', value: dash(r.promo_target) },
          { label: '广告类型', value: dash(r.ad_type) },
          { label: '投放类型', value: dash(r.delivery_type) },
          { label: '投放模式', value: dash(r.delivery_mode) },
          { label: '营销场景', value: dash(r.marketing_scene) },
        ],
      },
      {
        title: '关联产品投放',
        rows: [
          { label: '关联产品ID', value: dash(r.related_product_id) },
        ],
      },
      {
        title: '投放内容与目标',
        rows: [
          { label: '关联星广联投任务', value: r.star_task_id ? r.star_task_id : '-' },
          { label: '应用名', value: dash(r.app_name) },
          { label: '应用包名', value: dash(r.app_package) },
          { label: '下载方式', value: dash(r.download_type) },
          { label: '调起方式', value: dash(r.launch_type) },
          { label: '优先应用商店下载', value: dash(r.store_first) },
          { label: '下载链接', value: dash(r.download_link), link: true },
          { label: '优化目标', value: dash(r.opt_goal) },
          { label: '深度优化目标', value: dash(r.deep_goal) },
          { label: '深度优化方式', value: dash(r.deep_mode) },
          { label: '投放内容', value: dash(r.ad_content) },
          { label: '事件资产ID', value: dash(r.event_asset_id) },
          { label: '备用资产ID', value: dash(r.backup_asset_id) },
        ],
      },
      {
        title: '受众倾向与过滤',
        rows: [
          { label: '区域', value: dash(r.region) },
          { label: '性别', value: dash(r.gender) },
          { label: '年龄', value: dash(r.age) },
          { label: '媒体定向', value: dash(r.media_target) },
          { label: '平台', value: dash(r.platform) },
          { label: '设备类型', value: dash(r.device_type) },
          { label: '网络', value: dash(r.network) },
          { label: '运营商', value: dash(r.carrier) },
          { label: '手机品牌', value: dash(r.phone_brand) },
          { label: '手机价格', value: dash(r.phone_price) },
        ],
      },
      {
        title: '排期与预算',
        rows: [
          { label: '竞价策略', value: dash(r.bid_strategy) },
          { label: '投放时间', value: dash(r.delivery_time) },
          { label: '项目预算', value: dash(r.project_budget) },
          { label: '项目ROI', value: dash(r.project_roi) },
          { label: '项目出价', value: dash(r.project_bid) },
          { label: '深度优化出价', value: dash(r.project_deep_bid) },
        ],
      },
    ],
    projectRight: [
      {
        title: '投放版位',
        rows: [
          { label: '投放位置', value: dash(r.placements) },
        ],
      },
      {
        title: '搜索快投',
        rows: [
          { label: '关键词', value: dash(r.keyword) },
          { label: '出价系数', value: dash(r.bid_factor) },
          { label: '定向拓展', value: dash(r.target_expand) },
        ],
      },
      {
        title: '监测链接',
        rows: [
          { label: '监测链接组', value: dash(r.monitor_group) },
          { label: '展示', value: dash(r.monitor_show) },
          { label: '有效触点', value: dash(r.monitor_valid_point), link: true },
          { label: '视频播放', value: dash(r.monitor_video_play) },
          { label: '视频播完', value: dash(r.monitor_video_finish) },
          { label: '视频有效播放', value: dash(r.monitor_video_valid) },
        ],
      },
      {
        title: '直达链接',
        rows: [
          { label: '直达链接', value: dash(r.direct_url), link: true },
          { label: '直达备用链接', value: dash(r.backup_url) },
        ],
      },
    ],
  };
});

watch(
  () => props.modelValue,
  (v) => { if (v) tab.value = 'ad'; }
);

function close() { emit('update:modelValue', false); }

function onViewProject() {
  emit('view-project', props.row);
}

function onLink(row) {
  ElMessage.info(`原型：打开链接 ${row.value}`);
}
</script>

<style scoped>
.ad-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 14px 20px 20px;
}

/* 抽屉外壳：相对定位，关闭按钮贴附在左边缘 */
.ad-wrap {
  --ad-blue: #546ef7;
  --ad-text: #333;
  --ad-text-weak: #999;
  --ad-bar: #f2f2f2;
  --ad-line: #e5e7ed;
  position: absolute;
  inset: 0;
  color: var(--ad-text);
  font-size: 13px;
}

.ad-head { display: flex; align-items: center; gap: 12px; }
.ad-close {
  position: absolute;
  left: -36px;
  top: 8px;
  z-index: 2;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background: var(--ad-blue);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.ad-close:hover { opacity: 0.85; }
.ad-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ad-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 广告摘要行 */
.ad-meta { display: flex; align-items: center; gap: 20px; margin-top: 14px; }
.ad-state { padding: 2px 8px; border-radius: 3px; font-size: 12px; color: #fff; }
.ad-state.is-on { background: #60c344; }
.ad-state.is-off { background: var(--ad-text-weak); }
.ad-kv { font-size: 13px; color: var(--ad-text); white-space: nowrap; }
.ad-kv i { font-style: normal; color: var(--ad-text-weak); }
.ad-switch { margin-left: auto; }
.ad-link { color: var(--ad-blue); font-size: 13px; font-weight: 400; cursor: pointer; }

/* 页签 */
.ad-tabs { margin-top: 16px; border-bottom: 1px solid var(--ad-line); }
.ad-tab {
  display: inline-block;
  padding: 0 12px 8px;
  font-size: 15px;
  color: var(--ad-text-weak);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
}
.ad-tab.active { color: var(--ad-blue); border-bottom-color: var(--ad-blue); }

/* 内容 */
.ad-body { padding-top: 14px; }
.ad-cols { display: flex; gap: 20px; margin-top: 14px; }
.ad-col { flex: 1; min-width: 0; }
.ad-sec + .ad-sec { margin-top: 16px; }

.ad-sec-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--ad-bar);
  font-size: 14px;
  font-weight: 600;
  color: var(--ad-text);
}
.ad-hd-base { padding: 12px 16px; font-size: 16px; }
.ad-sec-title { font-weight: 600; }

.ad-row { display: flex; align-items: flex-start; padding: 8px 16px; }
.ad-label { width: 114px; flex: none; font-size: 13px; line-height: 20px; color: var(--ad-text-weak); }
.ad-value {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 20px;
  color: var(--ad-text);
  word-break: break-all;
}
.ad-value.is-link {
  color: var(--ad-blue);
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
</style>

<!-- 抽屉本体：去掉内边距并允许溢出，使关闭按钮能贴附在抽屉左边缘外侧 -->
<style>
.ad-detail-drawer .el-drawer__body { padding: 0; overflow: visible; min-height: 0; }
</style>
