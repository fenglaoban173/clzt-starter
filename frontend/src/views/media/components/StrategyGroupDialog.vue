<template>
  <!--
    选择策略（策略组）弹窗（1:1 复刻线上 cl.mobgi.com「批量新建（巨量）」→ 步骤区「选择策略」）
    结构/文案/依赖全部来自 build/components/batch/spec/strategy.spec.js；线上基准 990×728 垂直居中。
  -->
  <el-dialog
    :model-value="modelValue"
    :width="spec.width + 'px'"
    class="cl-modal sg-dialog"
    align-center
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <!-- R110：线上无标题栏，页签直接置于弹窗顶部；R111：按用户要求移除「铺剧策略」页签 -->
    <template #header>
      <el-tabs v-model="tab" class="sg-tabs">
        <el-tab-pane v-for="t in spec.tabs.options" :key="t.value" :label="t.label" :name="t.value" />
      </el-tabs>
    </template>

    <div class="sg-body">
      <!-- 查询条件（线上 2 行 × 3 组；第 2 行第 3 组为「名称维度 + 关键词 + 放大镜」） -->
      <div class="sg-filter">
        <div class="sg-filter__rows">
          <div v-for="(row, ri) in filterSpec.rows" :key="ri" class="sg-filter__row">
            <template v-for="field in row" :key="field.key">
              <!-- 下拉筛选项：标签在外 + 下拉 169px -->
              <div
                v-if="field.type === 'select'"
                class="sg-field"
                :style="{ width: field.areaWidth + 'px' }"
              >
                <span class="sg-label" :style="{ width: field.labelWidth + 'px' }">{{ field.label }}</span>
                <el-select
                  v-model="filters[field.key]"
                  class="sg-f"
                  :style="{ width: field.width + 'px' }"
                  clearable
                  :placeholder="field.placeholder || '全部'"
                >
                  <el-option v-for="o in field.options" :key="o" :label="o" :value="o" />
                </el-select>
              </div>

              <!-- 关键词组：维度下拉 60px + 输入 + 放大镜按钮 40×26 -->
              <div
                v-else-if="field.type === 'search'"
                class="sg-search-group"
                :style="{ width: field.areaWidth + 'px' }"
              >
                <el-select v-model="filters[field.dimension]" class="sg-name-type" :style="{ width: field.dimensionWidth + 'px' }">
                  <el-option v-for="d in field.dimensions" :key="d.value" :label="d.label" :value="d.value" />
                </el-select>
                <el-input
                  v-model="filters.keyword"
                  class="sg-search"
                  :placeholder="field.placeholder"
                  clearable
                  @keyup.enter="onSearch"
                >
                  <template #suffix>
                    <!-- 批量搜索：输入多个策略组名称 / ID，一行一个（线上搜索框内右侧的图标） -->
                    <el-popover
                      v-model:visible="batchVisible"
                      placement="bottom"
                      trigger="click"
                      :width="640"
                      :offset="8"
                      popper-class="sg-batch-pop"
                    >
                      <template #reference>
                        <el-icon class="sg-search__batch" title="批量搜索">
                          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                            <path d="M2.6 4.2h8.2M2.6 7.6h8.2M2.6 11h5.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                            <circle cx="12.8" cy="12.8" r="4.4" fill="none" stroke="currentColor" stroke-width="1.5" />
                            <path d="M16.1 16.1 19.2 19.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                          </svg>
                        </el-icon>
                      </template>
                      <div class="sg-batch">
                        <div class="sg-batch__head">
                          <span class="sg-batch__title">请输入{{ batchTypeLabel }} ({{ batchCount }}/1000)</span>
                          <el-button link type="primary" class="sg-batch__clear" @click="clearBatch">清空</el-button>
                        </div>
                        <div class="sg-batch__hint">每一行为一个关键词，批量搜索将执行精确匹配。</div>
                        <el-input
                          v-model="batchText"
                          type="textarea"
                          class="sg-batch__input"
                          :rows="9"
                          resize="none"
                          :placeholder="`请粘贴或输入${batchTypeLabel}，回车可换行`"
                        />
                        <div class="sg-batch__foot">
                          <el-button size="small" @click="clearBatch">清空</el-button>
                          <el-button size="small" type="primary" @click="applyBatchSearch">搜索</el-button>
                        </div>
                      </div>
                    </el-popover>
                  </template>
                </el-input>
                <button type="button" class="sg-search-btn" title="搜索" @click="onSearch">
                  <el-icon><Search /></el-icon>
                </button>
              </div>

              <!-- 清空（线上 <a class="clearall">，12px #197afb，24×28） -->
              <a v-else-if="field.type === 'clear'" class="sg-clear" @click="resetFilters">{{ field.text }}</a>
            </template>
          </div>
        </div>

        <!-- 右侧「自定义列」按钮 -->
        <el-button
          class="sg-col-btn"
          :style="{ width: filterSpec.customColumn.width + 'px', height: filterSpec.customColumn.height + 'px' }"
          @click="colVisible = true"
        >
          <svg class="sg-col-btn__icon" viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
            <path d="M2 0h2v14H2V0zM6 0h2v14H6V0zM10 0h2v14h-2V0z" fill="currentColor" />
          </svg>
          <span>{{ filterSpec.customColumn.text }}</span>
        </el-button>
      </div>

      <!-- 策略组列表 -->
      <div class="sg-table-wrap">
        <el-table
          :data="pageRows"
          border
          size="small"
          :height="tableSpec.height"
          class="sg-table"
          highlight-current-row
          @row-click="onRowClick"
        >
          <template v-for="col in tableSpec.columns" :key="col.key">
            <el-table-column v-if="col.type === 'radio'" :width="col.width" align="center" fixed="left">
              <template #default="{ row }">
                <el-radio :model-value="selectedId" :value="row.id" @change="select(row)" @click.stop />
              </template>
            </el-table-column>
            <el-table-column
              v-else-if="col.key === 'action'"
              v-if="colVisibleKeys.includes('action')"
              :label="col.label"
              :width="col.width"
              :fixed="col.fixed"
              align="center"
            >
              <template #default="{ row }">
                <a class="sg-table-link" @click.stop="onCopy(row)">复制</a>
                <span class="sg-table-link"><a @click.stop="onDelete(row)">删除</a></span>
              </template>
            </el-table-column>
            <el-table-column
              v-else
              v-if="col.customizable ? colVisibleKeys.includes(col.key) : true"
              :label="col.label"
              :prop="col.prop"
              :width="col.width"
              :fixed="col.fixed"
              :show-overflow-tooltip="col.showOverflowTooltip"
            />
          </template>
        </el-table>
      </div>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="filtered.length"
        :layout="pagerLayout"
        class="sg-pager"
      />
    </div>

    <template #footer>
      <el-button
        v-for="btn in spec.footer.buttons"
        :key="btn.key"
        :type="btn.type"
        :plain="!!btn.plain"
        :disabled="isDisabled(btn, values)"
        @click="btn.key === 'cancel' ? close() : confirm()"
      >
        {{ btn.text }}
      </el-button>
    </template>
  </el-dialog>

  <!-- 「自定义指标」二级弹窗（线上 560×288） -->
  <el-dialog
    v-model="colVisible"
    :title="colSpec.title"
    :width="colSpec.width + 'px'"
    class="sg-col-dialog"
    align-center
    :close-on-click-modal="false"
    destroy-on-close
    @open="initColumns"
  >
    <div class="sg-col-body">
      <el-checkbox
        class="sg-col-all"
        :model-value="allChecked"
        :indeterminate="someChecked"
        @change="onToggleAll"
      >{{ colSpec.allLabel }}</el-checkbox>
      <div class="sg-col-gap" :style="{ height: colSpec.gap + 'px' }"></div>
      <div class="sg-col-group">
        <el-checkbox
          v-for="c in colSpec.columns"
          :key="c.key"
          class="sg-col-item"
          :style="{ width: colSpec.itemWidth + 'px', marginRight: colSpec.itemMarginRight + 'px', marginBottom: colSpec.itemMarginBottom + 'px' }"
          :model-value="!!colChecked[c.key]"
          @change="(v) => onToggle(c.key, v)"
        >{{ c.label }}</el-checkbox>
      </div>
    </div>

    <template #footer>
      <el-button
        v-for="btn in colSpec.footerButtons"
        :key="btn.key"
        :type="btn.type"
        :plain="!!btn.plain"
        @click="btn.key === 'cancel' ? (colVisible = false) : confirmColumns()"
      >
        {{ btn.text }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { strategyGroups } from '@/mock/strategyGroups';
import spec from '@/views/build/components/batch/spec/strategy.spec.js';
import { isDisabled } from '@/views/build/components/batch/spec/resolve.js';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const filterSpec = spec.sections.find((s) => s.type === 'filter');
const tableSpec = spec.sections.find((s) => s.type === 'table');
const pagerSpec = spec.sections.find((s) => s.type === 'pager');
const colSpec = spec.customColumnDialog;

/** 分页布局（线上：总数 + 页码 + 前往，无每页条数） */
const pagerLayout = computed(() => (
  ['total', pagerSpec.showSizes ? 'sizes' : null, 'prev', 'pager', 'next', pagerSpec.jump ? 'jumper' : null]
    .filter(Boolean)
    .join(', ')
));

// 列表数据（原型本地模拟，复制 / 删除在本地生效）
const tab = ref('group');
const list = ref([...strategyGroups]);
const selectedId = ref('');
const page = ref(1);
const pageSize = 10;
const jumpPage = ref('1');
const filters = reactive({
  objective: '', delivery_mode: '', marketing_goal: '', ad_type: '', delivery_type: '', keyword: '', nameType: 'name',
});

/* 批量搜索（搜索框内右侧图标）：每行一个关键词，整行精确匹配 */
const batchVisible = ref(false);
const batchText = ref('');
const batchKeywords = ref([]);
const batchTypeLabel = computed(() => (filters.nameType === 'id' ? '策略组ID' : '策略组名称'));
const batchCount = computed(() => batchText.value.split('\n').filter((l) => l.trim()).length);

function clearBatch() {
  batchText.value = '';
  batchKeywords.value = [];
}

function applyBatchSearch() {
  batchKeywords.value = batchText.value.split('\n').map((l) => l.trim()).filter(Boolean);
  filters.keyword = '';
  batchVisible.value = false;
  page.value = 1;
}

/* 自定义指标（列表列显示设置）：
 * R110 线上「策略组」表含「描述」列，「操作」列固定在最右并可单独勾选。 */
const colVisible = ref(false);
const colVisibleKeys = ref(tableSpec.columns.filter((c) => c.customizable).map((c) => c.key));
const colChecked = reactive({});

const allChecked = computed(() => (
  colSpec.columns.length > 0 && colSpec.columns.every((c) => colChecked[c.key])
));
const someChecked = computed(() => {
  const n = colSpec.columns.filter((c) => colChecked[c.key]).length;
  return n > 0 && n < colSpec.columns.length;
});

const filtered = computed(() => list.value.filter((s) => {
  if (filters.objective && s.objective !== filters.objective) return false;
  if (filters.delivery_mode && s.delivery_mode !== filters.delivery_mode) return false;
  if (filters.marketing_goal && s.marketing_goal !== filters.marketing_goal) return false;
  if (filters.ad_type && s.ad_type !== filters.ad_type) return false;
  if (filters.delivery_type && s.delivery_type !== filters.delivery_type) return false;
  // 批量搜索：每行一个关键词，整行精确匹配（线上语义）
  if (batchKeywords.value.length) {
    const set = batchKeywords.value.map((k) => k.toLowerCase());
    const hit = filters.nameType === 'id'
      ? set.includes(String(s.id).toLowerCase())
      : set.includes(String(s.name).toLowerCase());
    if (!hit) return false;
    return true;
  }
  const kw = String(filters.keyword || '').trim().toLowerCase();
  if (kw) {
    const hit = filters.nameType === 'id'
      ? String(s.id).toLowerCase().includes(kw)
      : s.name.toLowerCase().includes(kw);
    if (!hit) return false;
  }
  return true;
}));

const pageRows = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const selected = computed(() => list.value.find((s) => String(s.id) === String(selectedId.value)) || null);

/** 依赖求值用的当前值集合 */
const values = computed(() => ({ selected: !!selected.value }));

// 筛选条件变化后回到第一页
watch(() => ({ ...filters }), () => { page.value = 1; });

function init() {
  list.value = [...strategyGroups];
  selectedId.value = '';
  page.value = 1;
  jumpPage.value = '1';
  resetFilters();
}

function initColumns() {
  colSpec.columns.forEach((c) => { colChecked[c.key] = colVisibleKeys.value.includes(c.key); });
}

function onSearch() { page.value = 1; }
function resetFilters() {
  Object.assign(filters, {
    objective: '', delivery_mode: '', marketing_goal: '', ad_type: '', delivery_type: '', keyword: '', nameType: 'name',
  });
  batchKeywords.value = [];
  batchText.value = '';
  page.value = 1;
}

function select(row) { selectedId.value = row.id; }
function onRowClick(row) { selectedId.value = row.id; }

function onCopy(row) {
  const copy = {
    ...row,
    id: String(Date.now()),
    name: `${row.name}-副本`,
    updated_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
  list.value = [copy, ...list.value];
  ElMessage.success(`已复制策略组「${row.name}」`);
}

function onDelete(row) {
  list.value = list.value.filter((s) => s.id !== row.id);
  if (selectedId.value === row.id) selectedId.value = '';
  ElMessage.success(`已删除策略组「${row.name}」`);
}

/** 自定义指标确认：按勾选结果显示列表列 */
function confirmColumns() {
  colVisibleKeys.value = colSpec.columns.filter((c) => colChecked[c.key]).map((c) => c.key);
  colVisible.value = false;
}

/** 全选：未全选时全选，已全选时全部取消 */
function onToggleAll() {
  const next = !allChecked.value;
  colSpec.columns.forEach((c) => { colChecked[c.key] = next; });
}

function onToggle(key, v) {
  colChecked[key] = v;
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  if (!selected.value) {
    ElMessage.warning('请选择一个策略组');
    return;
  }
  emit('confirm', selected.value);
  close();
}
</script>

<style scoped>
.sg-body {
  --el-font-size-base: 14px;
  font-size: 14px;
  color: #1d2129;
}
/* R110：线上页签贴在弹窗顶部（页签高 40px，16px 字号）
   线上 header 高 47px = padding-top 14px + 页签 40px - 7px（上移），故页签整体上移 7px */
.sg-tabs { margin-top: -7px; }
.sg-tabs :deep(.el-tabs__header) { margin: 0; }
.sg-tabs :deep(.el-tabs__nav-wrap) { height: 40px; }
.sg-tabs :deep(.el-tabs__nav-wrap::after) { display: none; }
.sg-tabs :deep(.el-tabs__item) {
  height: 40px;
  line-height: 40px;
  padding: 0 20px 0 0;
  font-size: 16px;
  color: #666;
}
.sg-tabs :deep(.el-tabs__item + .el-tabs__item) { padding: 0 0 0 20px; }
.sg-tabs :deep(.el-tabs__item.is-active) { color: #197afb; }
.sg-tabs :deep(.el-tabs__active-bar) { height: 2px; background-color: #197afb; }

/* 查询条件（线上：每组 252px = 标签 60px + 下拉 169px，行距 8px） */
.sg-filter {
  display: flex;
  align-items: flex-end;
  padding: 12px 16px;
}
.sg-filter__rows { flex: 1 1 auto; min-width: 0; }
.sg-filter__row { display: flex; align-items: center; gap: 0; }
.sg-filter__row + .sg-filter__row { margin-top: 8px; }
.sg-field { display: flex; align-items: center; flex: none; margin-right: 8px; }
.sg-f { flex: none; }
.sg-label {
  flex: none;
  margin-left: 9px;
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  text-align: left;
}
/* 名称检索组：维度下拉 60px + 关键词 + 放大镜按钮 40×26 —— 线上整组 244px */
.sg-search-group {
  display: flex;
  align-items: stretch;
  box-sizing: border-box;
  flex: none;
  height: 28px;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  background: #fff;
  overflow: hidden;
}
.sg-search-group:focus-within { border-color: #197afb; }
.sg-name-type { flex: 0 0 auto; }
.sg-name-type :deep(.el-select__wrapper) {
  height: 26px;
  padding-left: 8px;
  padding-right: 26px;
  font-size: 12px;
  border-radius: 2px 0 0 2px;
  background: transparent;
  box-shadow: none !important;
  border-right: 1px solid #dcdfe6;
}
.sg-search { flex: 1 1 auto; min-width: 0; }
.sg-search :deep(.el-input__wrapper) {
  height: 26px;
  padding-left: 8px;
  background: transparent;
  box-shadow: none !important;
}
.sg-search-btn {
  flex: none;
  width: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-left: 1px solid #dcdfe6;
  background: #fff;
  color: #606266;
  font-size: 13px;
  cursor: pointer;
}
.sg-search-btn:hover { color: #197afb; }
/* 批量搜索图标（线上搜索框内右侧） */
.sg-search__batch { cursor: pointer; color: #86909c; transition: color .15s; }
.sg-search__batch:hover { color: #197afb; }
.sg-batch { width: 100%; }
.sg-batch__head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 10px; }
.sg-batch__title { font-size: 15px; font-weight: 600; color: #1d2129; }
.sg-batch__clear { padding: 0; font-size: 13px; }
.sg-batch__hint { padding: 10px 16px; font-size: 13px; color: #4e5969; background: #f7f8fa; }
.sg-batch__input :deep(.el-textarea__inner) {
  margin: 16px;
  width: calc(100% - 32px);
  font-size: 13px;
  line-height: 20px;
  color: #1d2129;
}
.sg-batch__foot { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 16px 16px; }
/* 清空（线上 <a class="clearall">） */
.sg-clear {
  display: inline-block;
  box-sizing: border-box;
  height: 28px;
  line-height: 28px;
  margin-left: 20px;
  padding: 0;
  font-size: 12px;
  color: #197afb;
  text-decoration: none;
  cursor: pointer;
}
.sg-col-btn {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-right: 16px;
  padding: 9px 15px;
  font-size: 12px;
  color: #666;
  background: #fff;
  border-color: #d0d0d0;
  border-radius: 3px;
}
.sg-col-btn:hover { color: #197afb; border-color: #197afb; }
.sg-col-btn__icon { flex: none; }

/* 表格容器（线上 margin 16px 16px 0） */
.sg-table-wrap { margin: 16px 16px 0; }
.sg-table { width: 100%; }
.sg-table :deep(.el-table__cell) { padding: 0; }
.sg-table :deep(.el-table__row) { height: 40px; }
.sg-table :deep(th.el-table__cell) { height: 40px; }
.sg-table :deep(.cell) { padding: 0 10px; font-size: 12px; line-height: 23px; color: #606266; }
.sg-table :deep(th.el-table__cell .cell) { color: #909399; }
.sg-table-link { color: #197afb; cursor: pointer; }

/* 自定义指标子弹窗（线上 body padding 24px） */
.sg-col-all { height: 19px; font-size: 14px; color: #606266; }
.sg-col-group { display: flex; flex-wrap: wrap; align-items: flex-start; }
.sg-col-item { height: 19px; font-size: 14px; color: #606266; }
.sg-col-item :deep(.el-checkbox__inner) { margin-top: 0; }
.sg-col-item :deep(.el-checkbox__label) { font-size: 14px; color: #606266; }
.sg-col-all :deep(.el-checkbox__label) { font-size: 14px; color: #606266; }
</style>

<style>
/* 弹窗外壳（teleport 到 body，需全局样式）
   R110：线上选择策略弹窗实测 990×728 垂直居中；无标题栏，页签即顶部；
 * 弹窗自身 padding=0，表格左沿 481（=弹窗左沿+16），页签左沿 489（=+24）。 */
/* 注意：不要覆写 margin —— Element Plus 的 align-center 依赖 `.el-overlay-dialog.is-align-center
 * .el-dialog { margin: auto }` 做垂直居中；一旦把 margin-bottom 改成 0，margin-top:auto 会
 * 吃掉全部剩余空间，弹窗反而贴到视口底部。 */
/* 线上「选择策略」弹窗 class=cl-modal：border-radius 2px + box-shadow 0 1px 3px rgba(0,0,0,.3)
   （见 build/components/batch/batchDialog.css 的全局覆盖） */
.sg-dialog.el-dialog { height: 728px; padding: 0; display: flex; flex-direction: column; }
.sg-dialog .el-dialog__header { flex: none; padding: 14px 24px 0; margin-right: 0; border-bottom: 1px solid #e8eaec; }
.sg-dialog .el-dialog__body { flex: 1 1 auto; min-height: 0; overflow: hidden; padding: 0; }
/* footer 必须 flex:none —— 否则被 body(flex:1) 挤压成 0 高，取消/确定按钮不可见 */
.sg-dialog .el-dialog__footer { flex: none; padding: 14px 24px; border-top: 1px solid #e8eaec; }
.sg-dialog .el-dialog__footer .el-button { width: 80px; height: 32px; font-size: 12px; border-radius: 3px; }
.sg-dialog .el-dialog__headerbtn { top: 14px; right: 12px; }
/* 筛选控件 28px（线上实测） */
.sg-dialog .el-select__wrapper,
.sg-dialog .el-input__wrapper { min-height: 28px; }
.sg-dialog .el-select__wrapper { height: 28px; }
.sg-dialog .el-select .el-input__inner,
.sg-dialog .el-input--small .el-input__inner { height: 28px; font-size: 12px; }
/* 分页（线上：13px 字号，按钮 35.5×32，页码 35.5×28，padding 8px，左右 16px 外边距） */
.sg-dialog .sg-pager {
  --el-pagination-font-size: 13px;
  --el-pagination-button-width: 35.5px;
  --el-pagination-button-height: 32px;
  --el-pagination-item-gap: 0px;
  width: auto;
  margin: 0 16px;
  padding: 8px;
  font-size: 13px;
  justify-content: flex-start;
}
.sg-dialog .sg-pager .el-pagination__total { margin-left: 0; margin-right: 10px; font-size: 13px; color: #606266; }
.sg-dialog .sg-pager .el-pager li { min-width: 35.5px; height: 28px; line-height: 28px; font-size: 13px; }
.sg-dialog .sg-pager .el-pagination__jump { margin-left: 0; font-size: 13px; color: #606266; }
.sg-dialog .sg-pager .el-pagination__jump .el-input { --el-input-height: 32px; }
.sg-dialog .sg-pager .el-pagination__jump .el-input__wrapper { box-sizing: border-box; height: 32px; min-height: 32px; }
.sg-dialog .sg-pager .el-pagination__jump .el-input__inner { height: 32px; font-size: 12px; }
.sg-dialog .sg-pager .el-pagination__jump .el-pagination__editor { width: 46px; }

/* 自定义指标子弹窗（线上 560×288） */
.sg-col-dialog.el-dialog { height: 288px; padding: 0; display: flex; flex-direction: column; }
.sg-col-dialog .el-dialog__header { box-sizing: border-box; height: 51px; padding: 16px 32px; margin-right: 0; border-bottom: 1px solid #e8eaec; }
.sg-col-dialog .el-dialog__title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.sg-col-dialog .el-dialog__body { flex: 1; min-height: 0; overflow: hidden; padding: 24px; }
.sg-col-dialog .el-dialog__footer { padding: 11px 32px 30px; border-top: 1px solid #e8eaec; }
.sg-col-dialog .el-dialog__footer .el-button {
  width: 120px;
  height: 32px;
  padding: 8px 15px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 2px;
}
.sg-col-dialog .el-dialog__footer .el-button + .el-button { margin-left: 16px; }
.sg-col-dialog .el-dialog__footer .el-button--primary { background: #197afb; border-color: #197afb; }
</style>
