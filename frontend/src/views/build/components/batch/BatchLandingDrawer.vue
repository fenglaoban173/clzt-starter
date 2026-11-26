<template>
  <!--
    落地页抽屉（1:1 复刻线上 cl.mobgi.com「程序化批量/巨量广告」→ 落地页列底「编辑」）
    线上基准：ClDrawer 1016×1080（右侧，非 el-drawer），头部标题「选择落地页」
      content：白底 padding 16px，表单 label 宽 140px
        「每个广告配置」输入框 + 「个落地页链接」
        「落地页类型」单选：橙子落地页 / 橙子建站模板 / 创量落地页模板(禁用) / 第三方落地页
                        / 动态链接生成 / 手动填写 / 商品库链接(禁用)
        「落地页分配方式」单选：全部相同 / 按账户分配（手动填写时只这两个）
        手动填写 → 「输入落地页」输入框（按每个广告配置数量给出）
        资产类类型 → 账户切换 + 关键词搜索 + 快速选择/清空所有资产 + 落地页勾选列表 + 已选面板 + 分页
      footer：取 消 / 确 定（右下角）
  -->
  <el-drawer
    :model-value="visible"
    size="1016px"
    direction="rtl"
    class="lpw-drawer"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <template #header>
      <span class="lpw-title">选择落地页</span>
    </template>

    <div class="lpw-body">
      <el-form :model="form.landing" label-position="left" label-width="140px" size="small" class="lpw-form">
        <!-- 每个广告配置 -->
        <el-form-item label="每个广告配置">
          <el-input-number v-model="form.landing.per_ad_count" :min="1" :max="10" :controls="false" size="small" class="lpw-count" />
          <span class="lpw-unit">个落地页链接</span>
        </el-form-item>

        <!-- 落地页类型 -->
        <el-form-item label="落地页类型" required>
          <el-radio-group v-model="form.landing.landing_page_type" size="small" class="lpw-types">
            <el-radio-button v-for="o in typeOptions" :key="o.value" :value="o.value" :disabled="!!o.disabled">
              <el-tooltip v-if="o.disabled" :content="o.tip" placement="top" :show-after="200">
                <span>{{ o.label }}</span>
              </el-tooltip>
              <template v-else>{{ o.label }}</template>
            </el-radio-button>
          </el-radio-group>
          <div class="lpw-tips">{{ typeTip }}</div>
        </el-form-item>

        <!-- 落地页分配方式 -->
        <el-form-item label="落地页分配方式" required>
          <el-radio-group v-model="form.landing.landing_page_rule" size="small">
            <el-radio-button value="ALL">全部相同</el-radio-button>
            <el-radio-button value="PER_ACCOUNT">按账户分配</el-radio-button>
            <template v-if="!isManualType">
              <el-radio-button value="PER_PROJECT">按项目分配</el-radio-button>
              <el-radio-button value="PER_AD">按广告分配</el-radio-button>
            </template>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <!-- 手动填写：输入落地页 -->
      <div v-if="isManualType" class="lpw-wrapper lpw-wrapper--hide-account">
        <el-form label-position="left" label-width="140px" size="small" class="lpw-form lpw-form--right">
          <el-form-item
            v-for="(u, i) in manualUrls"
            :key="i"
            :label="`输入落地页`"
            class="lpw-item--success"
          >
            <el-input v-model="manualUrls[i]" class="lpw-url" placeholder="请输入落地页" />
          </el-form-item>
        </el-form>
      </div>

      <!-- 动态链接生成 -->
      <div v-else-if="isDynamicType" class="lpw-wrapper">
        <el-alert type="info" :closable="false" show-icon
          title="动态链接生成：落地页链接将根据投放内容与监测链接自动生成，无需手动填写。" />
      </div>

      <!-- 资产类落地页：账户切换 + 搜索 + 列表 + 已选 -->
      <div v-else class="lpw-wrapper">
        <div class="lpw-flex">
          <!-- 账户面板（线上：按账户分配时显示） -->
          <div class="lpw-accounts" :style="{ opacity: isAccountMode ? 1 : 0 }">
            <div
              v-for="(a, i) in selectedAccounts"
              :key="a.id"
              class="lpw-account"
              :class="{ 'is-active': i === accountIndex }"
              @click="isAccountMode && (accountIndex = i)"
            >
              <span class="lpw-account__name" :title="a.name">{{ a.name }}</span>
            </div>
          </div>

          <div class="lpw-right">
            <!-- 资产头部：快速选择 / 清空所有资产 -->
            <div class="lpw-asset-head">
              <span class="lpw-asset-head__title">选择落地页</span>
              <el-button plain size="small" class="lpw-btn" @click="selectAll">快速选择</el-button>
              <el-button size="small" class="lpw-btn" @click="clearAll">清空所有资产</el-button>
            </div>

            <!-- 搜索行 -->
            <div class="lpw-search-row">
              <el-input v-model="keyword" placeholder="请输入关键词" size="small" class="lpw-search" @keyup.enter="onSearch">
                <template #suffix>
                  <el-icon class="lpw-search__icon" @click="onSearch"><Search /></el-icon>
                </template>
              </el-input>
              <el-button plain size="small" class="lpw-btn" @click="onSearch">查询</el-button>
            </div>

            <!-- 落地页列表 -->
            <div class="lpw-card">
              <div class="lpw-card__head">
                <span>项目数：0</span>
                <span class="lpw-card__mr">广告数：0</span>
              </div>
              <div class="lpw-list">
                <el-checkbox-group v-model="checkedIds" class="lpw-list__group">
                  <label v-for="lp in filteredPages" :key="lp.id" class="lpw-item">
                    <el-checkbox :label="lp.id">
                      <span class="lpw-item__name" :title="lp.title">{{ lp.title }}</span>
                      <span class="lpw-item__url" :title="lp.url">{{ lp.url }}</span>
                    </el-checkbox>
                  </label>
                </el-checkbox-group>
                <div v-if="!filteredPages.length" class="lpw-empty">暂无数据</div>
              </div>
              <div class="lpw-pager">
                <el-pagination
                  v-model:current-page="page"
                  :page-size="pageSize"
                  :total="filteredPages.length"
                  :pager-count="11"
                  small
                  layout="prev, pager, next"
                />
              </div>
            </div>

            <!-- 已选面板 -->
            <div class="lpw-card lpw-card--selected">
              <div class="lpw-card__head">
                <span>已选 <b class="lpw-card__num">{{ checkedIds.length }}/{{ maxCount }}</b></span>
                <el-button link type="primary" size="small" @click="clearAll">清空</el-button>
              </div>
              <div class="lpw-picked">
                <div v-for="id in checkedIds" :key="id" class="lpw-picked__row">
                  <span class="lpw-picked__name" :title="pageById(id)?.title">{{ pageById(id)?.title }}</span>
                  <el-icon class="lpw-picked__x" @click="removePicked(id)"><Close /></el-icon>
                </div>
                <div v-if="!checkedIds.length" class="lpw-empty">暂无数据</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="lpw-foot">
        <el-button size="small" @click="visible = false">取 消</el-button>
        <el-button type="primary" size="small" @click="onConfirm">确 定</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue';
import { Close, Search } from '@element-plus/icons-vue';
import { LANDING_PAGE_TYPES as FALLBACK_LANDING_PAGE_TYPES } from '@/mock/data';

/* R110：整个 setup 作用域由 Create.vue 通过 provide('batch') 暴露，这里直接取用，不重复声明 */
const batch = inject('batch');
const {
  form,
  lpVisible,
  landingPages,
  selectedAccounts,
  onLandingSelect,
} = batch;

/* 常量：优先取 batch（Create.vue provide），未提供时回落到 @/mock/data 的同一份定义 */
const LANDING_PAGE_TYPES = batch.LANDING_PAGE_TYPES || FALLBACK_LANDING_PAGE_TYPES;

const props = defineProps({
  /** v-model：抽屉显隐；不传时直接用 Create.vue provide 的 lpVisible */
  modelValue: { type: Boolean, default: undefined },
});
const emit = defineEmits(['update:modelValue']);

/** 显隐：外部 v-model 优先；未传时回落 batch 内部状态 */
const visible = computed({
  get: () => (props.modelValue === undefined ? !!lpVisible.value : props.modelValue),
  set: (v) => {
    if (lpVisible) lpVisible.value = v;
    emit('update:modelValue', v);
  },
});

/** 线上实测：创量落地页模板 / 商品库链接 在当前投放内容下禁用，并给出悬浮说明 */
const DISABLED_TIPS = {
  CL_TEMPLATE: '当前投放内容不支持选择该落地页来源',
  COMMODITY: '当前推广目的不支持选择该落地页来源',
};

/** 落地页类型选项（标签取共享常量，禁用态按线上） */
const typeOptions = computed(() => (LANDING_PAGE_TYPES || []).map((o) => ({
  value: o.value,
  label: o.label,
  disabled: !!DISABLED_TIPS[o.value],
  tip: DISABLED_TIPS[o.value] || '',
})));

/** 线上：落地页类型下方说明行 */
const TYPE_TIPS = {
  ORANGE: '选择已有橙子落地页时，请尽量保证落地页中的应用分包和项目中选择的分包一致。',
  ORANGE_SITE: '选择模板后，系统将基于模板自动创建橙子建站落地页并替换应用下载链接，确保您每条广告的下载链接与对应落地页中的下载链接一致。',
  THIRDPARTY: '第三方落地页需要先在本地导入',
  DYNAMIC: '',
  MANUAL: '',
  CL_TEMPLATE: '',
  COMMODITY: '',
};
const typeTip = computed(() => TYPE_TIPS[form?.landing?.landing_page_type] || '');

/** 手动填写 / 动态链接生成 */
const isManualType = computed(() => form?.landing?.landing_page_type === 'MANUAL');
const isDynamicType = computed(() => form?.landing?.landing_page_type === 'DYNAMIC');

/** 落地页分配方式 = 按账户分配 */
const isAccountMode = computed(() => form?.landing?.landing_page_rule === 'PER_ACCOUNT');

const keyword = ref('');
const page = ref(1);
const pageSize = 50;
const accountIndex = ref(0);
const checkedIds = ref([]);
const manualUrls = ref([]);

/** 每个广告配置的落地页链接数量 */
const linkCount = computed(() => Math.max(1, Number(form?.landing?.per_ad_count) || 1));

/** 最多可选数量：每个广告配置数 × 账户数 */
const maxCount = computed(() => linkCount.value * Math.max(1, (selectedAccounts.value || []).length || 1));

/** 落地页资产列表 */
const filteredPages = computed(() => {
  const kw = String(keyword.value || '').trim().toLowerCase();
  const rows = landingPages.value || [];
  if (!kw) return rows;
  return rows.filter((p) => `${p.title || ''} ${p.url || ''}`.toLowerCase().includes(kw));
});

function pageById(id) {
  return (landingPages.value || []).find((p) => p.id === id);
}

watch(visible, (v) => {
  if (v) {
    keyword.value = '';
    page.value = 1;
    accountIndex.value = 0;
    checkedIds.value = form?.ad?.landing_page_id ? [form.ad.landing_page_id] : [];
    manualUrls.value = syncManualUrls();
  }
}, { immediate: true });

/** 依据「每个广告配置」数量补齐/裁剪手动填写的落地页输入框 */
function syncManualUrls() {
  const n = linkCount.value;
  const old = Array.isArray(manualUrls.value) ? manualUrls.value.slice() : [];
  const cur = old[0] || form?.landing?.landing_page_url || '';
  const out = [];
  for (let i = 0; i < n; i += 1) out.push(old[i] !== undefined ? old[i] : (i === 0 ? cur : ''));
  return out;
}

watch(() => form?.landing?.per_ad_count, () => {
  if (isManualType.value) manualUrls.value = syncManualUrls();
});

function onSearch() {
  page.value = 1;
}

function selectAll() {
  checkedIds.value = filteredPages.value.map((p) => p.id);
}

function clearAll() {
  checkedIds.value = [];
}

function removePicked(id) {
  checkedIds.value = checkedIds.value.filter((x) => x !== id);
}

function onConfirm() {
  if (isManualType.value) {
    const url = (manualUrls.value || []).find((u) => String(u || '').trim()) || '';
    form.landing.landing_page_url = url;
    form.landing.landing_page_name = url ? '手动填写落地页' : '';
    // 登记为本地落地页资产，保证列卡「落地页」能回显
    if (url) {
      const exist = (landingPages.value || []).find((p) => p.url === url);
      const id = exist ? exist.id : `lp_manual_${Date.now()}`;
      if (!exist) {
        landingPages.value.push({ id, type: 'landing_page', title: '手动填写落地页', url, platform_status: 'available' });
      }
      form.ad.landing_page_id = id;
    } else {
      form.ad.landing_page_id = null;
    }
  } else if (!isDynamicType.value) {
    const id = checkedIds.value[0] || null;
    form.ad.landing_page_id = id;
    if (id) onLandingSelect(id);
  }
  visible.value = false;
}
</script>

<style scoped>
.lpw-title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.lpw-body { padding: 16px; background: #fff; }
/* 线上：label 宽 140、左对齐、14px #666 */
.lpw-form :deep(.el-form-item__label) {
  width: 140px;
  padding-bottom: 0;
  font-size: 14px;
  line-height: 32px;
  color: #666;
  text-align: left;
}
.lpw-form :deep(.el-form-item) { margin-bottom: 20px; }
.lpw-form :deep(.el-radio-button__inner) {
  padding: 9px 12px;
  font-size: 12px;
  color: #606266;
  background: #fff;
  border-color: #dcdfe6;
  border-radius: 0;
  box-shadow: none;
}
.lpw-form :deep(.el-radio-button:first-child .el-radio-button__inner) { border-radius: 3px 0 0 3px; }
.lpw-form :deep(.el-radio-button:last-child .el-radio-button__inner) { border-radius: 0 3px 3px 0; }
.lpw-form :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  color: #197afb;
  background: #d6eaff;
  border-color: #197afb;
  box-shadow: -1px 0 0 0 #197afb;
}
.lpw-form :deep(.el-radio-button.is-disabled .el-radio-button__inner) { color: #c0c4cc; background: #f5f7fa; border-color: #e4e7ed; }
/* 线上：每个广告配置 输入框 w80 + 单位文案 */
.lpw-count { width: 80px; }
.lpw-count :deep(.el-input__inner) { text-align: left; }
.lpw-unit { margin-left: 8px; font-size: 14px; color: #606266; }
/* 线上：说明行 12px #999 */
.lpw-tips { width: 100%; margin-top: 4px; font-size: 12px; line-height: 18px; color: #999; }

.lpw-wrapper { margin-top: 4px; }
.lpw-flex { display: flex; align-items: flex-start; }
/* 线上：左侧账户面板 148px */
.lpw-accounts { flex: 0 0 148px; width: 148px; padding-right: 12px; transition: opacity .15s; }
.lpw-account {
  padding: 6px 8px;
  font-size: 12px;
  line-height: 18px;
  color: #4e5969;
  cursor: pointer;
  border-radius: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lpw-account.is-active { color: #197afb; background: #f2f7ff; }
.lpw-right { flex: 1; min-width: 0; }

/* 资产头部 */
.lpw-asset-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.lpw-asset-head__title { font-size: 14px; font-weight: 600; color: #1d2129; }
.lpw-btn { font-size: 12px; }

/* 搜索行 */
.lpw-search-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.lpw-search { width: 360px; }
.lpw-search__icon { cursor: pointer; color: #c0c4cc; }

/* 列表卡片 */
.lpw-card { border: 1px solid #e5e6eb; border-radius: 4px; margin-bottom: 12px; }
.lpw-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  font-size: 13px;
  color: #4e5969;
  border-bottom: 1px solid #f2f3f5;
}
.lpw-card__mr { margin-right: 16px; }
.lpw-card__num { color: #197afb; }
.lpw-list { max-height: 260px; overflow-y: auto; padding: 8px 16px; }
.lpw-list__group { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.lpw-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #1d2129; }
.lpw-item__name { margin-right: 12px; }
.lpw-item__url { color: #86909c; }
.lpw-empty { padding: 24px 0; text-align: center; font-size: 13px; color: #86909c; }
.lpw-pager { display: flex; justify-content: flex-start; padding: 8px 16px; }

/* 已选面板 */
.lpw-card--selected .lpw-card__head { border-bottom: none; }
.lpw-picked { max-height: 180px; overflow-y: auto; padding: 0 16px 12px; }
.lpw-picked__row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #1d2129; }
.lpw-picked__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lpw-picked__x { cursor: pointer; color: #86909c; }

/* 底部按钮 */
.lpw-foot { display: flex; justify-content: flex-end; gap: 16px; }
</style>

<style>
/* 抽屉外壳（teleport 到 body，需全局样式）
   线上实测：抽屉 1016px 固定右侧；抽屉底 #f0f2f5；header/footer #fff + 下/上边线 #e8eaec */
.lpw-drawer { background: #f0f2f5; }
.lpw-drawer .el-drawer__header {
  height: 50px;
  margin-bottom: 0;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e8eaec;
}
.lpw-drawer.rtl .el-drawer__close-btn {
  order: -1;
  width: 30px;
  height: 30px;
  margin: 0 12px 0 0;
  font-size: 14px;
  color: #fff;
  background: #197afb;
  border-radius: 4px;
}
.lpw-drawer .el-drawer__body { padding: 0; background: #fff; }
.lpw-drawer .el-drawer__footer {
  padding: 12px 16px 24px;
  background: #fff;
  border-top: 1px solid #e8eaec;
}
/* 线上页脚按钮 80×32（12px/500，圆角 3px） */
.lpw-drawer .el-drawer__footer .el-button {
  width: 80px;
  height: 32px;
  padding: 9px 15px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 3px;
}
.lpw-drawer .el-button--primary:not(.is-link) { background: #197afb; border-color: #197afb; }
.lpw-drawer .el-button--primary:not(.is-link):hover { background: #4a9bff; border-color: #4a9bff; }
/* 小尺寸控件统一 32px（EP 的 small 为 24px，线上为 32px） */
.lpw-drawer .el-button--small { height: 32px; }
.lpw-drawer .el-radio-button--small .el-radio-button__inner { height: 32px; }
.lpw-drawer .el-input--small .el-input__wrapper { min-height: 32px; }
.lpw-drawer .el-input-number--small { width: 80px; }
.lpw-drawer .el-input-number--small .el-input__inner { height: 30px; font-size: 12px; text-align: left; }
</style>
