<template>
  <!--
    选择媒体账户弹窗（1:1 复刻线上 cl.mobgi.com「批量新建（巨量）」→ 配置行「媒体账户 / 更改」）
    结构/文案/依赖全部来自 spec/account.spec.js；线上基准 1136×725 垂直居中。
  -->
  <el-dialog
    :model-value="modelValue"
    :title="spec.title"
    :width="spec.width + 'px'"
    class="cl-dialog--large acct-dialog"
    align-center
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="onAcctOpen"
  >
    <!-- 筛选区（线上：上下两行，行距 16px） -->
    <div class="acct-filter">
      <div v-for="(row, ri) in filterSpec.rows" :key="ri" class="acct-filter__row">
        <template v-for="field in row" :key="field.key">
          <!-- 下拉筛选项：标签在外 + 下拉 169px + ⨯ -->
          <div
            v-if="field.type === 'select'"
            class="acct-area"
            :style="{ width: field.areaWidth + 'px' }"
          >
            <span class="acct-f__label" :style="{ width: field.labelWidth + 'px' }">{{ field.label }}</span>
            <el-select
              v-model="acctFilter[field.key]"
              class="acct-f"
              :style="{ width: field.width + 'px' }"
              clearable
              :placeholder="field.placeholder"
            >
              <el-option v-for="o in optionList(field)" :key="o" :value="o" :label="o" />
            </el-select>
            <el-icon v-if="field.hasIcon" class="acct-close" title="清空" @click="acctFilter[field.key] = ''"><Close /></el-icon>
          </div>

          <!-- 关键词组：维度下拉 + 输入 + 批量搜索 + 放大镜 -->
          <div
            v-else-if="field.type === 'search'"
            class="acct-sg"
            :style="{ width: field.width + 'px' }"
          >
            <el-select v-model="acctFilter[field.dimension]" class="acct-sg__type" :style="{ width: field.dimensionWidth + 'px' }">
              <el-option v-for="d in field.dimensions" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
            <el-input
              v-model="acctFilter.keyword"
              class="acct-sg__input"
              :placeholder="field.placeholder"
              clearable
              @keyup.enter="onAcctSearch"
            >
              <template #suffix>
                <!-- 批量搜索：输入多个账户ID / 账户名称，一行一个 -->
                <el-popover
                  v-model:visible="batchVisible"
                  placement="bottom"
                  trigger="click"
                  :width="640"
                  :offset="8"
                  popper-class="acct-batch-pop"
                >
                  <template #reference>
                    <el-icon class="acct-search__batch" title="批量搜索">
                      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                        <path d="M2.6 4.2h8.2M2.6 7.6h8.2M2.6 11h5.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                        <circle cx="12.8" cy="12.8" r="4.4" fill="none" stroke="currentColor" stroke-width="1.5" />
                        <path d="M16.1 16.1 19.2 19.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                      </svg>
                    </el-icon>
                  </template>
                  <div class="acct-batch">
                    <div class="acct-batch__head">
                      <span class="acct-batch__title">请输入{{ batchTypeLabel }} ({{ batchCount }}/1000)</span>
                      <el-button link type="primary" class="acct-batch__clear" @click="clearBatch">清空</el-button>
                    </div>
                    <div class="acct-batch__hint">
                      每一行为一个关键词，批量搜索将执行<span class="acct-batch__link" title="批量搜索按整行内容做精确匹配">精确匹配</span>。
                    </div>
                    <div class="acct-batch__editor">
                      <div ref="batchGutterRef" class="acct-batch__gutter">
                        <div v-for="n in batchLineCount" :key="n" class="acct-batch__ln">{{ n }}</div>
                      </div>
                      <el-input
                        v-model="batchText"
                        type="textarea"
                        class="acct-batch__input"
                        :rows="9"
                        resize="none"
                        :placeholder="`请粘贴或输入${batchTypeLabel}，回车可换行`"
                        @scroll="onBatchScroll"
                      />
                    </div>
                    <div class="acct-batch__foot">
                      <el-button @click="clearBatch">清空</el-button>
                      <el-button type="primary" @click="applyBatchSearch">搜索</el-button>
                    </div>
                  </div>
                </el-popover>
              </template>
            </el-input>
            <button type="button" class="acct-sg__btn" title="搜索" @click="onAcctSearch">
              <el-icon><Search /></el-icon>
            </button>
          </div>

          <!-- 清空（线上是 <a class="clearall">，12px #197afb，24×28） -->
          <a v-else-if="field.type === 'clear'" class="acct-clear" @click="clearAcctFilter">{{ field.text }}</a>
        </template>
      </div>
    </div>

    <!-- 提示（线上：感叹号图标 + 「仅支持同个主体账户」） -->
    <div class="acct-tip">
      <el-icon class="acct-tip__icon"><Warning /></el-icon>{{ tipsSpec.text }}
    </div>

    <!-- 账户表 + 已选面板 -->
    <div class="acct-body">
      <el-table
        ref="acctTableRef"
        :data="acctPageRows"
        row-key="id"
        border
        size="small"
        :height="tableSpec.height"
        class="acct-table"
        @selection-change="onAcctSelection"
      >
        <template v-for="col in tableSpec.columns" :key="col.key">
          <el-table-column v-if="col.type === 'selection'" type="selection" :width="col.width" align="center" reserve-selection />
          <el-table-column
            v-else-if="col.slot === 'name'"
            :label="col.label"
            :prop="col.prop"
            :width="col.width"
            :sortable="col.sortable"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <div class="acct-name">
                <div v-if="!row.auto_fix_on" class="acct-guard" title="未设置防出错，存在跑飞风险。">
                  <el-icon class="acct-guard__icon"><InfoFilled /></el-icon><span>防出错</span>
                </div>
                <div>
                  <p class="ellipsis" :title="row.name">{{ row.name }}</p>
                  <p class="acct-id ellipsis">ID：{{ row.advertiser_id }}</p>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="col.slot === 'developer'"
            :label="col.label"
            :prop="col.prop"
            :width="col.width"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <p class="ellipsis" :title="row.developer_name">{{ row.developer_name || '--' }}</p>
              <p v-if="row.developer_id" class="acct-id ellipsis">ID：{{ row.developer_id }}</p>
            </template>
          </el-table-column>
          <el-table-column
            v-else
            :label="col.label"
            :prop="col.prop"
            :width="col.width"
            :sortable="col.sortable"
            show-overflow-tooltip
          >
            <template v-if="col.key === 'subject'" #default="{ row }">{{ row.subject || subject }}</template>
            <template v-else-if="col.key === 'balance'" #default="{ row }">{{ formatBalance(row.balance) }}</template>
            <template v-else #default="{ row }">{{ row[col.key] || '--' }}</template>
          </el-table-column>
        </template>
      </el-table>

      <!-- 已选面板（线上：200×402 卡片，头 48px + 体 352px） -->
      <div class="acct-picked" :style="{ width: pickedSpec.width + 'px', height: pickedSpec.height + 'px' }">
        <div class="acct-picked__head">
          <span class="acct-picked__title">
            {{ pickedSpec.title }}<span class="acct-picked__num">({{ acctTemp.length }}/{{ pickedSpec.limit }})</span>
          </span>
          <el-button link type="primary" class="acct-picked__clear" @click="clearAcctSelection">
            {{ pickedSpec.clearText }}<el-icon class="acct-picked__refresh"><RefreshRight /></el-icon>
          </el-button>
        </div>
        <div class="acct-picked__body">
          <div v-for="a in acctTemp" :key="a.id" class="acct-picked__item">
            <span class="acct-picked__name" :title="`${a.name}(${a.advertiser_id})`">{{ a.name }}({{ a.advertiser_id }})</span>
            <el-icon class="acct-picked__del" title="移除" @click="removeAccount(a)"><Close /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页（线上：共 N 条 + 每页条数 + 页码 + 前往 N 页） -->
    <el-pagination
      v-model:current-page="acctPage"
      v-model:page-size="acctPageSize"
      :page-sizes="pagerSpec.pageSizes"
      :total="filteredAccounts.length"
      :layout="pagerLayout"
      class="acct-pager"
    />

    <template #footer>
      <el-button
        v-for="btn in spec.footer.buttons"
        :key="btn.key"
        :type="btn.type"
        :plain="!!btn.plain"
        :disabled="isDisabled(btn, values)"
        @click="btn.key === 'cancel' ? (visible = false) : confirmAccounts()"
      >
        {{ btn.text }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, inject } from 'vue';
import { Close, InfoFilled, RefreshRight, Search, Warning } from '@element-plus/icons-vue';
import spec from './spec/account.spec.js';
import { isDisabled } from './spec/resolve.js';

const props = defineProps({
  /** v-model：弹窗显隐；不传时直接用 Create.vue provide 的 acctVisible */
  modelValue: { type: Boolean, default: undefined },
});
const emit = defineEmits(['update:modelValue']);

/* R110：整个 setup 作用域由 Create.vue 通过 provide('batch') 暴露，这里直接取用，不重复声明 */
const batch = inject('batch');
const {
  subject,
  acctVisible,
  acctFilter,
  acctTemp,
  acctTableRef,
  acctPage,
  acctPageSize,
  acctJumpPage,
  batchVisible,
  batchText,
  batchGutterRef,
  batchTypeLabel,
  batchCount,
  batchLineCount,
  projectOptions,
  developerOptions,
  filteredAccounts,
  acctPageRows,
  onAcctOpen,
  onAcctSearch,
  clearAcctFilter,
  applyBatchSearch,
  clearBatch,
  onBatchScroll,
  formatBalance,
  clearAcctSelection,
  confirmAccounts,
  onAcctSelection,
  removeAccount,
} = batch;

const filterSpec = spec.sections.find((s) => s.type === 'filter');
const tipsSpec = spec.sections.find((s) => s.type === 'tips');
const tableSpec = spec.sections.find((s) => s.type === 'table');
const pickedSpec = spec.sections.find((s) => s.type === 'panel');
const pagerSpec = spec.sections.find((s) => s.type === 'pager');

/** 分页布局（线上：总数 + 每页条数 + 页码 + 前往） */
const pagerLayout = computed(() => (
  ['total', pagerSpec.showSizes ? 'sizes' : null, 'prev', 'pager', 'next', pagerSpec.jump ? 'jumper' : null]
    .filter(Boolean)
    .join(', ')
));

/** 依赖求值用的当前值集合 */
const values = computed(() => ({ pickedCount: acctTemp.value.length }));

/** 显隐：外部 v-model 优先；未传时回落 batch 内部状态 */
const visible = computed({
  get: () => (props.modelValue === undefined ? !!acctVisible.value : props.modelValue),
  set: (v) => {
    if (acctVisible) acctVisible.value = v;
    emit('update:modelValue', v);
  },
});

/** 下拉数据源 */
function optionList(field) {
  if (field.source === 'projectOptions') return projectOptions.value || [];
  if (field.source === 'developerOptions') return developerOptions.value || [];
  if (field.source === 'subjectOptions') return subjectOptions.value;
  return [];
}

/** 账户主体下拉（线上为多选列表，本地按主体过滤） */
const subjectOptions = computed(() => {
  const accs = Array.isArray(batch.mediaAccounts) ? batch.mediaAccounts : (batch.mediaAccounts?.value || []);
  const list = accs.map((a) => a.subject).filter(Boolean);
  return [...new Set([subject, ...list])];
});
</script>

<style scoped>
/* 筛选区（线上：12px 16px 12px 0 内边距，两行，行距 16px） */
.acct-filter { padding: 12px 16px 12px 0; }
.acct-filter__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0;
}
.acct-filter__row + .acct-filter__row { margin-top: 16px; }

/* 下拉筛选组：标签在外（左缩进 9px）+ 下拉 169px + ⨯ */
.acct-area {
  display: flex;
  align-items: center;
  flex: none;
  height: 28px;
  margin-right: 8px;
}
.acct-f__label {
  flex: none;
  margin-left: 9px;
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  text-align: left;
}
.acct-f { flex: none; }
.acct-close {
  flex: none;
  width: 16px;
  height: 16px;
  margin-left: 3px;
  font-size: 16px;
  color: #c1c6d0;
  cursor: pointer;
}
.acct-close:hover { color: #197afb; }

/* 搜索组：[维度下拉 110px] | [关键词 + 批量搜索] | [放大镜按钮 40×26] */
.acct-sg {
  display: inline-flex;
  align-items: stretch;
  box-sizing: border-box;
  height: 28px;
  flex: none;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  background: #fff;
  overflow: hidden;
}
.acct-sg:hover { border-color: #c0c4cc; }
.acct-sg:focus-within { border-color: #197afb; }
.acct-sg__type { flex: 0 0 auto; }
.acct-sg__type :deep(.el-select__wrapper) {
  height: 26px;
  padding-left: 8px;
  padding-right: 26px;
  font-size: 12px;
  border-radius: 2px 0 0 2px;
  background: transparent;
  box-shadow: none !important;
  border-right: 1px solid #dcdfe6;
}
.acct-sg__type :deep(.el-select__caret) { color: #c0c4cc; }
.acct-sg__input { flex: 1 1 auto; min-width: 0; }
.acct-sg__input :deep(.el-input__wrapper) {
  height: 26px;
  padding-left: 8px;
  background: transparent;
  box-shadow: none !important;
}
.acct-sg__btn {
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
.acct-sg__btn:hover { color: #197afb; }
.acct-search__batch { cursor: pointer; color: #86909c; transition: color .15s; }
.acct-search__batch:hover { color: #197afb; }
/* 清空（线上 <a class="clearall">：12px #197afb，24×28） */
.acct-clear {
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

/* 提示（线上 12px #666 + 感叹号图标，行高 15px） */
.acct-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 15px;
  color: #666;
}
.acct-tip__icon { color: #e6a23c; font-size: 14px; }

/* 账户表 + 已选面板 */
.acct-body { display: flex; align-items: flex-start; }
.acct-table { flex: 1 1 auto; min-width: 0; }
/* 线上行高 56px、表头 #fafafa */
.acct-table :deep(.el-table__cell) { padding: 0; }
.acct-table :deep(.el-table__row) { height: 56px; }
.acct-table :deep(th.el-table__cell) { height: 56px; background: #fafafa; }
.acct-table :deep(th.el-table__cell .cell) { color: #333; }
.acct-table :deep(.cell) { padding: 0 12px; font-size: 12px; line-height: 18px; color: #333; }
/* 线上单元格里的 <p> 没有默认外边距（否则行高会被撑到 73px） */
.acct-table :deep(.cell p) { margin: 0; }
.acct-name p { margin: 0; }
.acct-id { color: #86909c; }
.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* 防出错标记（线上 .error-prevention-info：右浮动、70×20、margin-top 8px、无底色） */
.acct-guard {
  float: right;
  display: flex;
  align-items: center;
  gap: 4px;
  box-sizing: border-box;
  width: 70px;
  height: 20px;
  margin-top: 8px;
  font-size: 12px;
  color: #333;
}
.acct-guard__icon { font-size: 12px; }

/* 已选面板（线上 200×402，头 48px + 体 352px） */
.acct-picked {
  box-sizing: border-box;
  flex: 0 0 auto;
  margin-left: 8px;
  background: #fff;
  border: 1px solid #dcdee2;
  border-radius: 4px;
  overflow: hidden;
}
.acct-picked__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 8px;
  color: #333;
  background: #f2f2f2;
  border-bottom: 1px solid #dcdee2;
}
.acct-picked__title { font-size: 14px; }
.acct-picked__num { margin-left: 0; }
.acct-picked__clear { padding: 7px 0; font-size: 12px; }
.acct-picked__refresh { margin-left: 2px; }
.acct-picked__body { height: 352px; overflow: hidden auto; padding: 0; }
/* 条目：线上 .select-item（166×32、#fafafa、外边距 8px 16px） */
.acct-picked__item {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  height: 32px;
  padding: 0 8px;
  margin: 8px 16px;
  background: #fafafa;
}
.acct-picked__name {
  flex: 1;
  min-width: 0;
  padding-right: 8px;
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.acct-picked__del { flex: none; cursor: pointer; font-size: 16px; color: #c1c6d0; }
.acct-picked__del:hover { color: #197afb; }

/* 批量搜索浮层内容 */
.acct-batch { width: 100%; }
.acct-batch__head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 10px; }
.acct-batch__title { font-size: 15px; font-weight: 600; color: #1d2129; }
.acct-batch__clear { padding: 0; font-size: 13px; }
.acct-batch__hint { padding: 10px 16px; font-size: 13px; color: #4e5969; background: #f7f8fa; }
.acct-batch__link { color: #197afb; cursor: pointer; }
.acct-batch__editor {
  display: flex;
  margin: 0 16px;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  overflow: hidden;
  height: 320px;
}
.acct-batch__gutter {
  width: 46px;
  flex: 0 0 46px;
  overflow: hidden;
  background: #fff;
  border-right: 1px solid #e5e6eb;
  padding: 10px 0;
  text-align: right;
}
.acct-batch__ln { font-size: 13px; line-height: 20px; color: #86909c; padding-right: 10px; }
.acct-batch__input { flex: 1; min-width: 0; }
.acct-batch__input :deep(.el-textarea__inner) {
  height: 100%;
  border: none;
  box-shadow: none;
  border-radius: 0;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 20px;
  color: #1d2129;
}
.acct-batch__foot { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 16px 16px; }
</style>

<style>
/* 弹窗外壳（teleport 到 body，需全局样式）
   线上实测：header padding 16px 32px + 下边线 #e8eaec；body padding 24px 32px；footer padding 11px 32px 30px + 上边线 */
.el-dialog.acct-dialog { max-width: calc(100vw - 40px); padding: 0; height: 725px; display: flex; flex-direction: column; }
.el-dialog.acct-dialog .el-dialog__header { margin-right: 0; padding: 16px 32px; line-height: 18px; border-bottom: 1px solid #e8eaec; }
.el-dialog.acct-dialog .el-dialog__title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.el-dialog.acct-dialog .el-dialog__body { flex: 1; min-height: 0; overflow: hidden; padding: 24px 32px; color: #606266; }
.el-dialog.acct-dialog .el-dialog__footer { padding: 11px 32px 30px; border-top: 1px solid #e8eaec; }
/* 线上页脚按钮 120×32（14px/500，圆角 2px） */
.el-dialog.acct-dialog .el-dialog__footer .el-button {
  width: 120px;
  height: 32px;
  padding: 8px 15px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 2px;
}
.el-dialog.acct-dialog .el-dialog__footer .el-button + .el-button { margin-left: 16px; }
.el-dialog.acct-dialog .el-dialog__footer .el-button--primary { background: #197afb; border-color: #197afb; }
.el-dialog.acct-dialog .el-dialog__footer .el-button--primary:hover { background: #4a9bff; border-color: #4a9bff; }
/* 筛选控件 28px（线上实测） */
.el-dialog.acct-dialog .el-select__wrapper,
.el-dialog.acct-dialog .el-input__wrapper { min-height: 28px; }
.el-dialog.acct-dialog .el-select__wrapper { height: 28px; }
.el-dialog.acct-dialog .el-select .el-input__inner,
.el-dialog.acct-dialog .el-input--small .el-input__inner { height: 28px; font-size: 12px; }
.el-dialog.acct-dialog .el-button--small { height: 28px; }
/* 分页（线上：13px 字号，按钮 35.5×32，页码 35.5×28，padding 2px 5px，margin-top 16px） */
.el-dialog.acct-dialog .acct-pager {
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
.el-dialog.acct-dialog .acct-pager .el-pagination__total { margin-left: 0; margin-right: 10px; font-size: 13px; color: #606266; }
.el-dialog.acct-dialog .acct-pager .el-pagination__sizes { margin: 0 10px 0 0; }
.el-dialog.acct-dialog .acct-pager .el-select { width: 110px; }
.el-dialog.acct-dialog .acct-pager .el-pager li { min-width: 35.5px; height: 28px; line-height: 28px; font-size: 13px; }
.el-dialog.acct-dialog .acct-pager .el-pagination__jump { margin-left: 0; font-size: 13px; color: #606266; }
.el-dialog.acct-dialog .acct-pager .el-pagination__jump .el-input { --el-input-height: 32px; }
.el-dialog.acct-dialog .acct-pager .el-pagination__jump .el-input__wrapper { box-sizing: border-box; height: 32px; min-height: 32px; }
.el-dialog.acct-dialog .acct-pager .el-pagination__jump .el-input__inner { height: 32px; font-size: 12px; }
.el-dialog.acct-dialog .acct-pager .el-pagination__jump .el-pagination__editor { width: 46px; }
/* 批量搜索浮层外壳（teleport 到 body，需全局样式） */
.acct-batch-pop.el-popover { --el-popover-padding: 0; border-radius: 6px; }
</style>
