<template>
  <!--
    选择任务弹窗（1:1 复刻线上 cl.mobgi.com「批量新建（巨量）」→ 步骤区「选择任务」）
    结构/文案/依赖全部来自 spec/task.spec.js；线上基准 1025×710 垂直居中。
  -->
  <el-dialog
    :model-value="modelValue"
    :title="spec.title"
    :width="spec.width + 'px'"
    class="cl-dialog--large task-dialog"
    align-center
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="onOpen"
  >
    <!-- 筛选区：线上单行，标签在外 -->
    <div class="task-filter">
      <template v-for="(row, ri) in filterSpec.rows" :key="ri">
        <template v-for="field in row" :key="field.key">
          <!-- 媒体账户 -->
          <div
            v-if="field.type === 'select'"
            class="tf-area"
            :style="{ width: field.areaWidth + 'px' }"
          >
            <span class="tf-label" :style="{ width: field.labelWidth + 'px' }">{{ field.label }}</span>
            <el-select
              v-model="taskFilter[field.key]"
              class="tf-select"
              :style="{ width: field.width + 'px' }"
              clearable
              :placeholder="field.placeholder"
            >
              <el-option
                v-for="a in optionList(field)"
                :key="a.id"
                :value="a.id"
                :label="a.name"
              />
            </el-select>
            <el-icon v-if="field.hasIcon" class="tf-close" title="清空" @click="taskFilter[field.key] = ''"><Close /></el-icon>
          </div>

          <!-- 创建时间（日期区间） -->
          <div
            v-else-if="field.type === 'daterange'"
            class="tf-area"
            :style="{ width: field.areaWidth + 'px' }"
          >
            <span class="tf-label" :style="{ width: field.labelWidth + 'px' }">{{ field.label }}</span>
            <el-date-picker
              v-model="taskFilter[field.key]"
              type="daterange"
              unlink-panels
              :range-separator="field.rangeSeparator"
              :start-placeholder="field.startPlaceholder"
              :end-placeholder="field.endPlaceholder"
              value-format="YYYY-MM-DD"
              class="tf-date"
              :style="{ width: field.width + 'px' }"
            />
          </div>

          <!-- 关键词组：维度下拉 + 输入 + 放大镜 -->
          <div
            v-else-if="field.type === 'search'"
            class="tf-search"
            :style="{ width: field.width + 'px' }"
          >
            <el-select v-model="taskFilter[field.dimension]" class="tf-search__type" :style="{ width: field.dimensionWidth + 'px' }">
              <el-option v-for="d in field.dimensions" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
            <el-input
              v-model="taskFilter.keyword"
              class="tf-search__input"
              clearable
              :placeholder="field.placeholder"
              @keyup.enter="onSearch"
            />
            <button type="button" class="tf-search__btn" title="搜索" @click="onSearch">
              <el-icon><Search /></el-icon>
            </button>
          </div>

          <!-- 清空（线上 <a class="clearall">，12px #197afb，24×28） -->
          <a v-else-if="field.type === 'clear'" class="tf-clear" @click="onReset">{{ field.text }}</a>
        </template>
      </template>
    </div>

    <!-- 任务表 -->
    <el-table
      :data="taskPageRows"
      border
      size="small"
      :height="tableSpec.height"
      class="task-table"
      highlight-current-row
      @row-click="selectTask"
    >
      <template v-for="col in tableSpec.columns" :key="col.key">
        <el-table-column v-if="col.type === 'radio'" :width="col.width" align="center">
          <template #default="{ row }">
            <el-radio :model-value="taskSelectedId" :value="row.id" @change="selectTask(row)" @click.stop />
          </template>
        </el-table-column>
        <el-table-column
          v-else
          :label="col.label"
          :prop="col.prop"
          :width="col.width"
          :min-width="col.minWidth"
          :show-overflow-tooltip="col.showOverflowTooltip"
        />
      </template>
    </el-table>

    <!-- 分页（线上：无「每页条数」下拉） -->
    <el-pagination
      v-model:current-page="taskPage"
      :page-size="taskPageSize"
      :total="taskFiltered.length"
      :layout="pagerLayout"
      class="task-pager"
    />

    <template #footer>
      <el-button
        v-for="btn in spec.footer.buttons"
        :key="btn.key"
        :type="btn.type"
        :plain="!!btn.plain"
        :disabled="isDisabled(btn, values)"
        @click="btn.key === 'cancel' ? (visible = false) : confirmTask()"
      >
        {{ btn.text }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, inject } from 'vue';
import { Close, Search } from '@element-plus/icons-vue';
import spec from './spec/task.spec.js';
import { isDisabled } from './spec/resolve.js';

const props = defineProps({
  /** v-model：弹窗显隐；不传时直接用 Create.vue provide 的 taskVisible */
  modelValue: { type: Boolean, default: undefined },
});
const emit = defineEmits(['update:modelValue']);

/* R110：整个 setup 作用域由 Create.vue 通过 provide('batch') 暴露，这里直接取用，不重复声明 */
const batch = inject('batch');
const {
  accounts,
  taskVisible,
  taskFilter,
  taskPage,
  taskPageSize,
  taskJumpPage,
  taskSelectedId,
  taskSelected,
  taskFiltered,
  taskPageRows,
  resetTaskFilter,
  selectTask,
  confirmTask,
} = batch;

const filterSpec = spec.sections.find((s) => s.type === 'filter');
const tableSpec = spec.sections.find((s) => s.type === 'table');
const pagerSpec = spec.sections.find((s) => s.type === 'pager');

/** 分页布局（线上：总数 + 页码 + 前往，无每页条数） */
const pagerLayout = computed(() => (
  ['total', pagerSpec.showSizes ? 'sizes' : null, 'prev', 'pager', 'next', pagerSpec.jump ? 'jumper' : null]
    .filter(Boolean)
    .join(', ')
));

/** 依赖求值用的当前值集合 */
const values = computed(() => ({ selected: !!taskSelected.value }));

/** 显隐：外部 v-model 优先；未传时回落 batch 内部状态 */
const visible = computed({
  get: () => (props.modelValue === undefined ? !!taskVisible.value : props.modelValue),
  set: (v) => {
    if (taskVisible) taskVisible.value = v;
    emit('update:modelValue', v);
  },
});

/** 下拉数据源 */
function optionList(field) {
  if (field.source === 'accounts') return accounts.value || [];
  return [];
}

function pad(n) { return String(n).padStart(2, '0'); }
function ymd(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

/** 线上默认带最近 7 天（实测 2026-11-19 ~ 2026-11-26） */
function defaultRange() {
  const end = new Date();
  const start = new Date(end.getTime() - 6 * 86400000);
  return [ymd(start), ymd(end)];
}

function onOpen() {
  if (!taskFilter.date_range || !taskFilter.date_range.length) {
    taskFilter.date_range = defaultRange();
  }
}

/** 关键词变化后回到第一页 */
function onSearch() {
  taskPage.value = 1;
}

/** 清空筛选（线上「清空」为蓝色文字按钮） */
function onReset() {
  resetTaskFilter();
  taskPage.value = 1;
}
</script>

<style scoped>
/* 筛选行：线上单行，标签在外；媒体账户 263 / 创建时间 329 / 关键词 300，控件高 28px
   线上间距：下拉组之间 8px（下拉组自带 margin-right），清空按钮左侧 12px */
.task-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0;
  padding-bottom: 16px;
}
.tf-area {
  display: flex;
  align-items: center;
  flex: none;
  height: 28px;
  margin-right: 8px;
}
.tf-label {
  flex: none;
  margin-left: 9px;
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  text-align: left;
}
.tf-select { flex: none; }
.tf-close {
  flex: none;
  width: 16px;
  height: 16px;
  margin-left: 3px;
  font-size: 16px;
  color: #c1c6d0;
  cursor: pointer;
}
.tf-close:hover { color: #197afb; }

/* 创建时间：日期区间框 240×28 */
.tf-date { flex: none; }

/* 关键词组：维度下拉 + 输入 + 放大镜按钮（整组 300px） */
.tf-search {
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
.tf-search:focus-within { border-color: #197afb; }
.tf-search__type { flex: 0 0 auto; }
/* 线上维度下拉 80px，需完整显示「任务名称」：压缩左右留白与 caret 间距 */
.tf-search__type :deep(.el-select__wrapper) {
  height: 26px;
  gap: 2px;
  padding-left: 4px;
  padding-right: 8px;
  font-size: 12px;
  border-radius: 2px 0 0 2px;
  background: transparent;
  box-shadow: none !important;
  border-right: 1px solid #dcdfe6;
}
.tf-search__input { flex: 1 1 auto; min-width: 0; }
.tf-search__input :deep(.el-input__wrapper) {
  height: 26px;
  padding-left: 8px;
  background: transparent;
  box-shadow: none !important;
}
.tf-search__btn {
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
.tf-search__btn:hover { color: #197afb; }
/* 清空（线上 <a class="clearall">） */
.tf-clear {
  display: inline-block;
  box-sizing: border-box;
  height: 28px;
  line-height: 28px;
  margin-left: 12px;
  padding: 0;
  font-size: 12px;
  color: #197afb;
  text-decoration: none;
  cursor: pointer;
}

/* 表格：线上行高 40px */
.task-table :deep(.el-table__cell) { padding: 0; }
.task-table :deep(.el-table__row) { height: 40px; }
.task-table :deep(th.el-table__cell) { height: 40px; }
.task-table :deep(.cell) { padding: 0 10px; font-size: 12px; line-height: 23px; color: #606266; }
.task-table :deep(th.el-table__cell .cell) { color: #909399; }
</style>

<style>
/* 弹窗外壳（teleport 到 body，需全局样式）
   线上实测：header padding 16px 32px + 下边线 #e8eaec；body padding 24px 32px；footer padding 11px 32px 30px + 上边线 */
.el-dialog.task-dialog { max-width: calc(100vw - 40px); padding: 0; height: 710px; display: flex; flex-direction: column; }
.el-dialog.task-dialog .el-dialog__header { margin-right: 0; padding: 16px 32px; line-height: 18px; border-bottom: 1px solid #e8eaec; }
.el-dialog.task-dialog .el-dialog__title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.el-dialog.task-dialog .el-dialog__body { flex: 1; min-height: 0; overflow: hidden; padding: 24px 32px; color: #606266; }
.el-dialog.task-dialog .el-dialog__footer { padding: 11px 32px 30px; border-top: 1px solid #e8eaec; }
/* 线上「取 消 / 确 认」各 120×32（14px/500，圆角 2px） */
.el-dialog.task-dialog .el-dialog__footer .el-button {
  width: 120px;
  height: 32px;
  padding: 8px 15px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 2px;
}
.el-dialog.task-dialog .el-dialog__footer .el-button + .el-button { margin-left: 16px; }
.el-dialog.task-dialog .el-dialog__footer .el-button--primary { background: #197afb; border-color: #197afb; }
.el-dialog.task-dialog .el-dialog__footer .el-button--primary:hover { background: #4a9bff; border-color: #4a9bff; }
/* 筛选控件 28px（线上实测） */
.el-dialog.task-dialog .el-select__wrapper,
.el-dialog.task-dialog .el-input__wrapper { min-height: 28px; }
.el-dialog.task-dialog .el-select__wrapper { height: 28px; }
.el-dialog.task-dialog .el-select .el-input__inner,
.el-dialog.task-dialog .el-input--small .el-input__inner { height: 28px; font-size: 12px; }
.el-dialog.task-dialog .el-range-input { font-size: 13px; color: #606266; text-align: center; }
.el-dialog.task-dialog .el-range-separator { font-size: 13px; color: #303133; padding: 0 5px; }
.el-dialog.task-dialog .el-range__icon { font-size: 14px; color: #c0c4cc; }
/* 日期区间框：线上 240×28，内边距 3px 0 3px 10px，圆角 2px */
.el-dialog.task-dialog .el-date-editor.el-input__wrapper {
  height: 28px;
  min-height: 28px;
  padding: 3px 0 3px 10px;
  border-radius: 2px;
  font-size: 12px;
}
.el-dialog.task-dialog .el-date-editor .el-range-input { width: 90px; }
/* 分页（线上：13px 字号，按钮 35.5×32，页码 35.5×28，padding 2px 5px，margin-top 16px） */
.el-dialog.task-dialog .task-pager {
  --el-pagination-font-size: 13px;
  --el-pagination-button-width: 35.5px;
  --el-pagination-button-height: 32px;
  --el-pagination-item-gap: 0px;
  box-sizing: border-box;
  width: 100%;
  margin-top: 16px;
  padding: 2px 5px;
  font-size: 13px;
  justify-content: flex-start;
}
.el-dialog.task-dialog .task-pager .el-pagination__total { margin-left: 0; margin-right: 10px; font-size: 13px; color: #606266; }
.el-dialog.task-dialog .task-pager .el-pager li { min-width: 35.5px; height: 28px; line-height: 28px; font-size: 13px; }
.el-dialog.task-dialog .task-pager .el-pagination__jump { margin-left: 0; font-size: 13px; color: #606266; }
.el-dialog.task-dialog .task-pager .el-pagination__jump .el-input { --el-input-height: 32px; }
.el-dialog.task-dialog .task-pager .el-pagination__jump .el-input__wrapper { box-sizing: border-box; height: 32px; min-height: 32px; }
.el-dialog.task-dialog .task-pager .el-pagination__jump .el-input__inner { height: 32px; font-size: 12px; }
.el-dialog.task-dialog .task-pager .el-pagination__jump .el-pagination__editor { width: 46px; }
</style>
