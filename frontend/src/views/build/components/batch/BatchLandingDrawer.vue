<template>
  <!--
    落地页抽屉（1:1 复刻线上 cl.mobgi.com「程序化批量/巨量广告」→ 落地页列底「编辑」）

    线上基准（2026-11-26 实测，1920×1080；证据 C:/tmp/verify/diff/）：
      外壳  .cl-drawer  x=904 y=0 w=1016 h=1080  右侧固定  底色 #f0f2f5  阴影 -8px 0 8px #0003
      头部  .drawer-header  x=904 y=0 w=1016 h=49  白底  padding 0 16px  下边框 1px #e8eaec
            头部标题 .header-title「选择落地页」16px/700/#333 lh48
      内容  .drawer-content  x=920 y=65 w=984 h=932  白底 1px #e8eaec radius 3px padding 16px
      底部  .drawer-footer  x=904 y=1010 w=1016 h=70  白底 上边框 1px #e8eaec padding 12px 16px 24px
            按钮：取 消 / 确 定   各 88×32  12px/500
      关闭键 .drawer-close  x=872 y=10 32×32
      表单   form.el-form.content-table.el-form--label-left
            label 宽 140px（14px #666 lh32），右侧内容 margin-left 140px
      控件   el-radio-button__inner：min-width 80px / height 32px / padding 9px 12px / 12px

    依赖关系全部走 spec/landing.spec.js + spec/resolve.js，模板里不写散落的 v-if 判定。
  -->
  <BatchDrawer
    v-model="visible"
    :title="spec.headerTitle"
    :width="spec.geometry.drawer.width"
    :cancel-text="spec.footer.cancelText"
    :ok-text="spec.footer.okText"
    @close="onClose"
    @ok="onConfirm"
  >
    <template #footer>
      <div class="lp-footer">
        <button class="lp-btn lp-btn--plain" @click="onClose">取 消</button>
        <button class="lp-btn lp-btn--primary" @click="onConfirm">确 定</button>
      </div>
    </template>
    <template #content>
      <div class="lp-root">
        <div class="lp-form">
          <!-- 每个广告配置 -->
          <div class="lp-row" :style="rowStyle('per_ad_count')">
            <div class="lp-row__label">{{ fieldOf('per_ad_count').label }}</div>
            <div class="lp-row__content">
              <input v-model="v.per_ad_count" class="lp-num" type="text" />
              <span class="lp-unit">{{ fieldOf('per_ad_count').suffix }}</span>
            </div>
          </div>

          <!-- 落地页类型 -->
          <div class="lp-row" :style="rowStyle('landing_page_type')">
            <div class="lp-row__label lp-row__label--req">{{ fieldOf('landing_page_type').label }}</div>
            <div class="lp-row__content">
              <div class="lp-rgroup">
                <button
                  v-for="o in fieldOf('landing_page_type').options"
                  :key="o.value"
                  class="lp-rbtn"
                  :class="{ 'is-active': v.landing_page_type === o.value }"
                  :disabled="!!o.disabled"
                  @click="onTypeChange(o)"
                >{{ o.label }}</button>
              </div>
              <div v-if="typeTip" class="lp-tip">{{ typeTip }}</div>
            </div>
          </div>

          <!-- 落地页分配方式（选项随类型增减） -->
          <div class="lp-row" :style="rowStyle('landing_page_rule')">
            <div class="lp-row__label lp-row__label--req">{{ fieldOf('landing_page_rule').label }}</div>
            <div class="lp-row__content">
              <div class="lp-rgroup">
                <button
                  v-for="o in visibleRuleOptions"
                  :key="o.value"
                  class="lp-rbtn"
                  :class="{ 'is-active': v.landing_page_rule === o.value }"
                  @click="v.landing_page_rule = o.value"
                >{{ o.label }}</button>
              </div>
              <!-- 线上：分配方式 = 按账户分配 时出现「复制到其他账户」 -->
              <button
                v-if="isVisible('copy_to_other_account')"
                class="lp-btn lp-btn--copy"
                :disabled="isDisabled('copy_to_other_account')"
              >{{ fieldOf('copy_to_other_account').text }}</button>
            </div>
          </div>

          <!-- 落地页选择方式（仅第三方落地页） -->
          <div v-if="isVisible('landing_select_way')" class="lp-row" :style="rowStyle('landing_select_way')">
            <div class="lp-row__label">{{ fieldOf('landing_select_way').label }}</div>
            <div class="lp-row__content">
              <div class="lp-rgroup">
                <button
                  v-for="o in fieldOf('landing_select_way').options"
                  :key="o.value"
                  class="lp-rbtn"
                  :class="{ 'is-active': v.landing_select_way === o.value }"
                  @click="v.landing_select_way = o.value"
                >{{ o.label }}</button>
              </div>
            </div>
          </div>

          <!-- 选择链接模板（仅动态链接生成） -->
          <div v-if="isVisible('link_template')" class="lp-row">
            <div class="lp-row__label">{{ fieldOf('link_template').label }}</div>
            <div class="lp-row__content">
              <select v-model="v.link_template" class="lp-select lp-select--wide">
                <option value="">请选择链接模板</option>
                <option v-for="o in LINK_TEMPLATES" :key="o" :value="o">{{ o }}</option>
              </select>
              <div class="lp-panelbtns">
                <button
                  v-for="b in typePanel.panel"
                  :key="b"
                  class="lp-btn lp-btn--text"
                  @click="onPanelBtn(b)"
                >{{ b }}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 手动填写：输入落地页 -->
        <div v-if="isVisible('manual_url')" class="lp-manual">
          <div v-for="(u, i) in manualUrls" :key="i" class="lp-row" :style="rowStyle('manual_url')">
            <div class="lp-row__label">{{ fieldOf('manual_url').label }}</div>
            <div class="lp-row__content">
              <input
                class="lp-input lp-input--wide"
                type="text"
                :placeholder="fieldOf('manual_url').placeholder"
                :value="u"
                @input="onManualUrl(i, $event.target.value)"
              />
            </div>
          </div>
        </div>

        <!-- 资产类落地页面板 -->
        <div v-if="isVisible('asset_panel')" class="lp-asset">
          <div class="lp-asset__head">
            <!-- 线上：只有橙子落地页 / 第三方落地页 有 .head-title，且与抽屉标题同名 -->
            <span v-if="typePanel.headTitle" class="lp-asset__title">{{ typePanel.headTitle }}</span>
            <div class="lp-asset__ops">
              <button
                v-for="b in typePanel.head"
                :key="b"
                class="lp-btn"
                :class="headBtnClass(b)"
                @click="onPanelBtn(b)"
              >{{ b }}</button>
            </div>
          </div>

          <div class="lp-asset__right">
            <!-- 搜索行 -->
            <div class="lp-searchrow">
              <select v-model="filter.account" class="lp-select lp-select--acct">
                <option value="">所有账户</option>
                <option v-for="a in selectedAccounts" :key="a.id" :value="a.id">{{ a.name }}</option>
              </select>
              <input v-model="filter.keyword" class="lp-search" type="text" :placeholder="spec.assetSearch.placeholder" @keyup.enter="onSearch" />
              <button class="lp-btn lp-btn--plain" @click="onSearch">{{ spec.assetSearch.buttons[0] }}</button>
              <button class="lp-btn lp-btn--plain" @click="clearFilter">{{ spec.assetSearch.buttons[1] }}</button>
              <!-- 线上：搜索框右侧的跳转按钮 -->
              <button v-if="typePanel.jump" class="lp-btn lp-btn--text" @click="onPanelBtn(typePanel.jump)">{{ typePanel.jump }}</button>
            </div>

            <!-- 落地页列表 -->
            <div class="lp-list">
              <div class="lp-list__head">
                <span class="lp-table-header-title">落地页名称</span>
                <span class="lp-table-header-title">落地页地址</span>
                <span class="lp-table-header-title">状态</span>
                <span class="lp-table-header-title">操作</span>
                <div class="lp-list__ops">
                  <button
                    v-for="b in typePanel.panel"
                    :key="b"
                    class="lp-btn lp-btn--sm"
                    :class="b === '快速选择' ? 'lp-btn--quickselect' : 'lp-btn--text'"
                    @click="onPanelBtn(b)"
                  >
                    <ClIcon class="lp-ico" :d="panelIcon(b).d" :size="12" :color="panelIcon(b).color" />{{ b }}
                  </button>
                </div>
              </div>
              <div class="lp-list__body">
                <label v-for="lp in filteredPages" :key="lp.id" class="lp-item">
                  <input type="checkbox" :checked="checkedIds.includes(lp.id)" @change="toggleChecked(lp.id)" />
                  <span class="lp-item__name" :title="lp.title">{{ lp.title }}</span>
                  <span class="lp-item__url" :title="lp.url">{{ lp.url }}</span>
                  <span class="lp-item__status">{{ lp.platform_status === 'available' ? '可用' : '--' }}</span>
                  <span class="lp-item__preview">预览</span>
                </label>
                <div v-if="!filteredPages.length" class="lp-empty">暂无数据</div>
              </div>
            </div>

            <!-- 已选面板 -->
            <div class="lp-picked">
              <div class="lp-picked__head">
                <span>已选 <b class="lp-picked__num">{{ checkedIds.length }}/{{ maxCount }}</b></span>
                <button class="lp-link" @click="clearAll">清空</button>
              </div>
              <div class="lp-picked__body">
                <div v-for="id in checkedIds" :key="id" class="lp-picked__row">
                  <span class="lp-picked__name" :title="pageById(id)?.title">{{ pageById(id)?.title }}</span>
                  <el-icon class="lp-picked__x" @click="removePicked(id)"><Close /></el-icon>
                </div>
                <div v-if="!checkedIds.length" class="lp-empty">暂无数据</div>
              </div>
            </div>
          </div>

          <div v-if="typePanel.extraTip" class="lp-extra">{{ typePanel.extraTip }}</div>
        </div>
      </div>
    </template>
  </BatchDrawer>
</template>

<script setup>
import { computed, h, inject, reactive, ref, watch } from 'vue';
import { Close } from '@element-plus/icons-vue';
import BatchDrawer from './BatchDrawer.vue';
import spec from './spec/landing.spec.js';
import {
  isVisible as specVisible,
  isDisabled as specDisabled,
  bubbleText,
  optionBubbleText,
} from './spec/resolve.js';

const props = defineProps({
  modelValue: { type: Boolean, default: undefined },
});
const emit = defineEmits(['update:modelValue']);

const batch = inject('batch');
const {
  form,
  lpVisible,
  landingPages,
  selectedAccounts,
  onLandingSelect,
} = batch;

const visible = computed({
  get: () => (props.modelValue === undefined ? !!lpVisible.value : props.modelValue),
  set: (v) => {
    if (lpVisible) lpVisible.value = v;
    emit('update:modelValue', v);
  },
});

/** 线上 iconfont 字形 → 内联 SVG（本地无 iconfont 字体文件） */
const ClIcon = (props) => h(
  'svg',
  {
    class: 'cl-ico',
    width: props.size,
    height: props.size,
    viewBox: '0 -128 1024 1024',
    style: { color: props.color || 'currentColor' },
  },
  [h('path', { d: props.d, fill: 'currentColor' })],
);
function icon(name) {
  return (spec.icons && spec.icons[name]) || { d: '', size: 12 };
}
/** 线上卡片区表头按钮的图标：快速选择 = mg-icon-quickselect，清空 = mg-icon-refresh-right */
function panelIcon(text) {
  if (text === '快速选择') return { d: icon('quickselect').d, color: '#606266' };
  return { d: icon('refreshRight').d, color: '#197afb' };
}

/** 线上：动态链接生成的链接模板（本地 mock） */
const LINK_TEMPLATES = ['通用链接模板', '618大促模板', '直播间跳转模板'];

/* 抽屉内表单值（默认值统一来自 spec.values） */
const v = reactive(Object.assign({}, spec.values));

const filter = reactive({ account: '', keyword: '' });
const checkedIds = ref([]);
const manualUrls = ref([]);

/** 当前 spec 字段表 */
const fieldMap = computed(() => {
  const m = {};
  (spec.sections || []).forEach((s) => (s.fields || []).forEach((f) => { m[f.key] = f; }));
  return m;
});
function fieldOf(key) {
  return fieldMap.value[key] || {};
}
/** 行间距 / 行高（线上实测） */
function gapOf(key) {
  const f = fieldOf(key);
  return f.gapAfter !== undefined ? f.gapAfter : 20;
}
function rowH(key) {
  const f = fieldOf(key);
  return f.rowHeight !== undefined ? f.rowHeight : 0;
}
/**
 * 线上「落地页类型」行高会随说明行出现而变（33 → 57 = 33 + tipHeight 24）
 */
function rowStyle(key) {
  const f = fieldOf(key);
  let h = f.rowHeight !== undefined ? f.rowHeight : 0;
  if (key === 'landing_page_type' && typeTip.value && f.tipHeight) h += f.tipHeight;
  return {
    marginBottom: gapOf(key) + 'px',
    minHeight: h ? h + 'px' : '0',
  };
}
/** 依赖判定统一走 resolve.js */
function isVisible(key) {
  return specVisible(fieldOf(key), v);
}
function isDisabled(key) {
  return specDisabled(fieldOf(key), v);
}
function bubbleOf(key) {
  return bubbleText(fieldOf(key), v);
}
function optionBubbleOf(key, ov) {
  return optionBubbleText(fieldOf(key), v, ov);
}

/** 线上：落地页类型下方的说明行 */
const typeTip = computed(() => {
  const tips = fieldOf('landing_page_type').tip || {};
  return tips[v.landing_page_type] || '';
});

/** 线上：落地页分配方式的选项随类型增减（optionVisibleWhen） */
const visibleRuleOptions = computed(() => {
  const f = fieldOf('landing_page_rule');
  const opts = f.options || [];
  const ov = f.optionVisibleWhen || {};
  return opts.filter((o) => {
    const cond = ov[o.value];
    if (!cond) return true;
    const actual = v[cond.field];
    if ('eq' in cond) return actual === cond.eq;
    if ('neq' in cond) return actual !== cond.neq;
    if ('in' in cond) return (cond.in || []).indexOf(actual) >= 0;
    if ('notIn' in cond) return (cond.notIn || []).indexOf(actual) < 0;
    return true;
  });
});

/** 线上：各落地页类型对应的面板 */
const typePanel = computed(() => (spec.typePanels || {})[v.landing_page_type]
  || { headTitle: '', head: [], jump: '', panel: [], extraTip: '' });

/** 每个广告配置的落地页链接数量 */
const linkCount = computed(() => Math.max(1, Number(v.per_ad_count) || 1));

/** 最多可选数量 */
const maxCount = computed(() => linkCount.value * Math.max(1, (selectedAccounts.value || []).length || 1));

/** 落地页资产列表 */
const filteredPages = computed(() => {
  const kw = String(filter.keyword || '').trim().toLowerCase();
  const rows = landingPages.value || [];
  if (!kw) return rows;
  return rows.filter((p) => `${p.title || ''} ${p.url || ''}`.toLowerCase().includes(kw));
});

function pageById(id) {
  return (landingPages.value || []).find((p) => p.id === id);
}

function onTypeChange(o) {
  if (o.disabled) return;
  v.landing_page_type = o.value;
  // 线上：类型变化后，分配方式里被隐藏的选项自动回退
  const allowed = visibleRuleOptions.value.map((x) => x.value);
  if (allowed.indexOf(v.landing_page_rule) < 0) {
    v.landing_page_rule = allowed[0] || 'ALL';
  }
  if (o.value === 'MANUAL') syncManualUrls();
}

function onManualUrl(i, val) {
  manualUrls.value[i] = val;
}
function syncManualUrls() {
  const n = linkCount.value;
  const old = Array.isArray(manualUrls.value) ? manualUrls.value.slice() : [];
  const cur = old[0] || form?.landing?.landing_page_url || '';
  const out = [];
  for (let i = 0; i < n; i += 1) out.push(old[i] !== undefined ? old[i] : (i === 0 ? cur : ''));
  manualUrls.value = out;
}

function onSearch() { /* 线上：查询后刷新列表 */ }
function clearFilter() {
  filter.account = '';
  filter.keyword = '';
}
function toggleChecked(id) {
  const i = checkedIds.value.indexOf(id);
  if (i >= 0) checkedIds.value.splice(i, 1);
  else checkedIds.value.push(id);
}
function removePicked(id) {
  checkedIds.value = checkedIds.value.filter((x) => x !== id);
}
function clearAll() {
  checkedIds.value = [];
}

/** 线上按钮的视觉分类（线上 .operate-button 内 el-button 变体） */
function headBtnClass(b) {
  if (b === '多账户刷新' || b === '多账户快速选择') return 'lp-btn--primary';
  if (b === '获取共享建站' || b === '清空所有资产') return 'lp-btn--border';
  return '';
}
function onPanelBtn(b) {
  if (b === '快速选择') {
    checkedIds.value = filteredPages.value.map((p) => p.id);
  } else if (b === '清空' || b === '清空所有资产') {
    checkedIds.value = [];
  }
}

watch(() => v.per_ad_count, () => {
  if (isVisible('manual_url')) syncManualUrls();
});

/** 已确认过的抽屉值（回显用）；未确认过时用线上默认值 */
const confirmed = { done: false };

watch(visible, (val) => {
  if (val) {
    const l = confirmed.done ? (form?.landing || {}) : {};
    v.per_ad_count = String(l.per_ad_count ?? 1);
    v.landing_page_type = l.landing_page_type || 'MANUAL';
    v.landing_page_rule = l.landing_page_rule || 'ALL';
    filter.account = '';
    filter.keyword = '';
    checkedIds.value = l.landing_page_id ? [l.landing_page_id] : [];
    syncManualUrls();
  }
}, { immediate: true });

function onConfirm() {
  confirmed.done = true;
  const l = form.landing;
  l.per_ad_count = Number(v.per_ad_count) || 1;
  l.landing_page_type = v.landing_page_type;
  l.landing_page_rule = v.landing_page_rule;
  if (v.landing_page_type === 'MANUAL') {
    const url = (manualUrls.value || []).find((u) => String(u || '').trim()) || '';
    l.landing_page_url = url;
    l.landing_page_name = url ? '手动填写落地页' : '';
    if (url) {
      const exist = (landingPages.value || []).find((p) => p.url === url);
      const id = exist ? exist.id : `lp_manual_${Date.now()}`;
      if (!exist) {
        landingPages.value.push({ id, type: 'landing_page', title: '手动填写落地页', url, platform_status: 'available' });
      }
      l.landing_page_id = id;
    } else {
      l.landing_page_id = null;
    }
  } else if (v.landing_page_type === 'DYNAMIC') {
    l.landing_page_id = null;
  } else {
    const id = checkedIds.value[0] || null;
    l.landing_page_id = id;
    if (id) onLandingSelect(id);
  }
  visible.value = false;
}
function onClose() {
  visible.value = false;
}
</script>

<style>
/* ===== 线上 cl-drawer 外壳微调（BatchDrawer.vue 提供基础版式） =====
   线上实测（落地页抽屉）：
     .drawer-header   h=49；标题 .header-title「选择落地页」16px/700/#333 lh48
     .drawer-content  x=920 y=65 w=984 h=932  margin 16px padding 16px 白底 1px #e8eaec radius 3px
     .drawer-footer   x=904 y=1010 w=1016 h=70  absolute bottom:0  padding 12px 16px 24px
     页脚按钮 88×32 12px/500；取 消 x=1712 确 定 x=1816（间距 16） */
.cl-drawer:has(.lp-root) .cl-drawer__header {
  box-sizing: border-box;
  height: 49px;
  padding: 0 16px;
}
.cl-drawer:has(.lp-root) .cl-drawer__title {
  font-size: 16px;
  font-weight: 700;
  line-height: 48px;
  color: #333;
}
.cl-drawer:has(.lp-root) .cl-drawer__content {
  margin: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e8eaec;
  border-radius: 3px;
  box-sizing: border-box;
  height: calc(100vh - 148px);
  flex: none;
}
.cl-drawer:has(.lp-root) .cl-drawer__footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 70px;
  padding: 12px 16px 24px;
  align-items: flex-start;
}
.cl-drawer:has(.lp-root) .cl-drawer__footer .lp-btn {
  width: 88px;
  height: 32px;
  padding: 9px 15px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 3px;
}
</style>

<style scoped>
/* ===== 表单行（线上 el-form content-table el-form--label-left） =====
   线上：label 宽 140px 14px #666 lh32 padding-right 12px；内容 margin-left 140px */
/* 线上元素尺寸按 border-box 计（输入框 32px / 标签 140px） */
.lp-root, .lp-root *, .lp-root *::before, .lp-root *::after { box-sizing: border-box; }
/* 内联 iconfont 复刻图标 */
.cl-ico { vertical-align: -2px; flex: none; }
.lp-root { width: 100%; }
.lp-form { width: 100%; }
.lp-row { display: flex; align-items: flex-start; }
.lp-row__label {
  flex: 0 0 140px;
  width: 140px;
  padding-right: 12px;
  font-size: 14px;
  line-height: 32px;
  color: #666;
}
.lp-row__label--req::before { content: '*'; margin-right: 4px; color: #f53f3f; }
.lp-row__content { flex: 1; min-width: 0; }

/* 单选按钮组（线上 el-radio-button：min-width 80px / padding 9px 12px） */
.lp-rgroup { display: flex; align-items: center; flex-wrap: wrap; }
.lp-rbtn {
  min-width: 80px;
  height: 32px;
  padding: 9px 12px;
  font-size: 12px;
  line-height: 12px;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  cursor: pointer;
  margin-right: 0;
  position: relative;
  top: 1px;
}
.lp-rbtn:first-child { border-radius: 3px 0 0 3px; }
/* 线上 Element UI：非首项 border-left:0（宽 0），相邻项紧贴无负 margin */
.lp-rbtn + .lp-rbtn { border-left-width: 0; }
.lp-rbtn:last-child { border-radius: 0 3px 3px 0; }
.lp-rbtn.is-active { color: #197afb; background: #d6eaff; border-color: #197afb; z-index: 1; }
.lp-rbtn:disabled { color: #c0c4cc; background: #fff; border-color: #ebeef5; cursor: not-allowed; }

/* 说明行（线上 .form-item-tips：12px #999，行高 24px） */
.lp-tip { width: 100%; margin-top: 1px; font-size: 12px; line-height: 24px; color: #999; }

/* 每个广告配置 */
.lp-num {
  width: 80px;
  height: 32px;
  margin-right: 8px;
  padding: 0 15px;
  font-size: 13px;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
}
.lp-unit { font-size: 14px; color: #606266; }

/* 手动填写 */
/* 线上右侧面板 form.right-panel 实测宽 640 */
.lp-manual { margin-top: 0; width: 640px; }
.lp-input {
  height: 32px;
  padding: 0 15px;
  font-size: 13px;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
}
.lp-input--wide { width: 500px; }

/* 选择 */
.lp-select {
  height: 32px;
  padding: 0 10px;
  font-size: 14px;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
  background: #fff;
}
.lp-select--wide { width: 480px; }
.lp-select--acct { width: 480px; }

/* 按钮 */
.lp-btn {
  height: 32px;
  padding: 0 15px;
  font-size: 12px;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.lp-btn--primary { color: #fff; background: #197afb; border-color: #197afb; }
.lp-btn--plain { color: #606266; background: #fff; border-color: #d0d0d0; }
.lp-btn--border { color: #197afb; background: #fff; border-color: #197afb; }
.lp-btn--text { color: #197afb; background: transparent; border-color: transparent; }
.lp-btn--quickselect { color: #606266; background: #fff; border-color: #dcdfe6; }
.lp-btn--copy { margin-left: 8px; }
.lp-btn--sm { height: 28px; font-size: 12px; }
.lp-btn:disabled { color: #c0c4cc; background: #f5f7fa; border-color: #e4e7ed; cursor: not-allowed; }
.lp-link { font-size: 12px; color: #197afb; background: none; border: none; padding: 0; cursor: pointer; }
.lp-ico { margin-right: 4px; }

/* 资产面板 */
.lp-asset { margin-top: 16px; }
.lp-asset__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.lp-asset__title { font-size: 14px; font-weight: 600; color: #1d2129; }
.lp-asset__ops { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.lp-asset__right { width: 100%; }
.lp-panelbtns { display: flex; gap: 8px; margin-top: 8px; }

.lp-searchrow { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.lp-search {
  width: 360px;
  height: 32px;
  padding: 0 15px;
  font-size: 13px;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
}

.lp-list { border: 1px solid #e5e6eb; border-radius: 4px; margin-bottom: 12px; }
.lp-list__head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  font-size: 13px;
  color: #4e5969;
  border-bottom: 1px solid #f2f3f5;
}
.lp-table-header-title { width: 220px; color: #86909c; font-size: 12px; }
.lp-list__ops { margin-left: auto; display: flex; gap: 8px; }
.lp-list__body { max-height: 260px; overflow-y: auto; padding: 8px 16px; }
.lp-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #1d2129; padding: 4px 0; }
.lp-item__name { width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lp-item__url { width: 320px; color: #86909c; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lp-item__status { width: 120px; }
.lp-item__preview { font-size: 12px; color: #197afb; cursor: pointer; }
.lp-empty { padding: 24px 0; text-align: center; font-size: 13px; color: #86909c; }

.lp-picked { border: 1px solid #e5e6eb; border-radius: 4px; }
.lp-picked__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  font-size: 13px;
  color: #4e5969;
}
.lp-picked__num { color: #197afb; }
.lp-picked__body { max-height: 180px; overflow-y: auto; padding: 0 16px 12px; }
.lp-picked__row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #1d2129; }
.lp-picked__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lp-picked__x { cursor: pointer; color: #86909c; }

.lp-extra { margin-top: 12px; font-size: 12px; color: #999; }

/* 页脚（线上 .dialog-footer：按钮右对齐 88×32，间距 16） */
.lp-footer { display: flex; justify-content: flex-end; gap: 16px; width: 100%; }
</style>
