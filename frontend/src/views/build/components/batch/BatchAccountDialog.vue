<template>
  <!--
    选择媒体账户弹窗（1:1 复刻线上 cl.mobgi.com「程序化批量/巨量广告」→ 配置行「媒体账户 / 更改」）
    线上基准：el-dialog.cl-dialog--large 1136×725，垂直居中（align-center）
    线上筛选：创量项目：/ 账户主体：/ 开发者： + [账户ID ▾][搜索媒体账户][放大镜][清空]
    线上表格列：[选择框(50), 账户名称(240, 可排序), 账户主体(140, 可排序), 账户备注(创量)(140),
                 账户备注(巨量)(140), 创量项目(140), 账户余额(100, 可排序), 账户所属开发者(120)]
    线上右侧「已选(0/50)」面板 200px；页脚 取消 / 确定（各 120×32，未选时确定置灰）
  -->
  <el-dialog
    :model-value="modelValue"
    title="选择媒体账户"
    width="1136px"
    class="acct-dialog"
    align-center
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="onAcctOpen"
  >
    <!-- 筛选区（线上：上下两行 + 底部 1px 分隔线） -->
    <div class="acct-filter">
      <div class="acct-filter__row">
        <el-select v-model="acctFilter.project" class="acct-f acct-f--project" clearable placeholder="全部">
          <template #prefix><span class="acct-f__label">创量项目：</span></template>
          <el-option v-for="p in projectOptions" :key="p" :value="p">{{ p }}</el-option>
        </el-select>
        <el-select v-model="acctFilter.subject" class="acct-f acct-f--subject" clearable placeholder="全部">
          <template #prefix><span class="acct-f__label">账户主体：</span></template>
          <el-option v-for="s in subjectOptions" :key="s" :value="s">{{ s }}</el-option>
        </el-select>
        <el-select v-model="acctFilter.developer" class="acct-f acct-f--developer" clearable placeholder="全部">
          <template #prefix><span class="acct-f__label">开发者：</span></template>
          <el-option v-for="d in developerOptions" :key="d" :value="d">{{ d }}</el-option>
        </el-select>
      </div>

      <div class="acct-filter__row">
        <!-- 搜索组（线上：[账户ID ▾] | [搜索媒体账户 + 批量搜索] | [搜索按钮]） -->
        <div class="acct-sg">
          <el-select v-model="acctFilter.id_type" class="acct-sg__type" placeholder="请选择">
            <el-option label="账户ID" value="id" />
            <el-option label="账户名称" value="name" />
            <el-option label="账户备注(创量)" value="remark_cy" />
            <el-option label="账户备注(巨量)" value="remark_jl" />
          </el-select>
          <el-input
            v-model="acctFilter.keyword"
            class="acct-sg__input"
            placeholder="搜索媒体账户"
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
        <el-button link type="primary" class="acct-clear" @click="clearAcctFilter">清空</el-button>
      </div>
    </div>

    <!-- 提示（线上：橙色感叹号 + 「仅支持同个主体账户」） -->
    <div class="acct-tip">
      <el-icon class="acct-tip__icon"><Warning /></el-icon> 仅支持同个主体账户
    </div>

    <!-- 账户表 + 已选面板 -->
    <div class="acct-body">
      <el-table
        ref="acctTableRef"
        :data="acctPageRows"
        row-key="id"
        border
        size="small"
        height="383"
        class="acct-table"
        @selection-change="onAcctSelection"
      >
        <el-table-column type="selection" width="50" reserve-selection />
        <el-table-column label="账户名称" prop="name" width="240" sortable show-overflow-tooltip>
          <template #default="{ row }">
            <div class="acct-name">
              <div v-if="!row.auto_fix_on" class="acct-guard" title="未设置防出错，存在跑飞风险。">
                <el-icon class="acct-guard__icon"><InfoFilled /></el-icon> 防出错
              </div>
              <p class="ellipsis" :title="row.name">{{ row.name }}</p>
              <p class="acct-id ellipsis">ID：{{ row.advertiser_id }}</p>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="账户主体" prop="subject" width="140" sortable show-overflow-tooltip>
          <template #default="{ row }">{{ row.subject || subject }}</template>
        </el-table-column>
        <el-table-column label="账户备注(创量)" prop="remark_cy" width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark_cy || '--' }}</template>
        </el-table-column>
        <el-table-column label="账户备注(巨量)" prop="remark_jl" width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark_jl || '--' }}</template>
        </el-table-column>
        <el-table-column label="创量项目" prop="project" width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.project || '--' }}</template>
        </el-table-column>
        <el-table-column label="账户余额" prop="balance" width="100" sortable>
          <template #default="{ row }">{{ formatBalance(row.balance) }}</template>
        </el-table-column>
        <el-table-column label="账户所属开发者" prop="developer_name" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <p class="ellipsis" :title="row.developer_name">{{ row.developer_name || '--' }}</p>
            <p v-if="row.developer_id" class="acct-id ellipsis">ID：{{ row.developer_id }}</p>
          </template>
        </el-table-column>
      </el-table>

      <!-- 已选面板（线上：200px 卡片，顶部「已选(0/50)」+ 清空） -->
      <div class="acct-picked">
        <div class="acct-picked__head">
          <span class="acct-picked__title">已选<span class="acct-picked__num">({{ acctTemp.length }}/50)</span></span>
          <el-button link type="primary" class="acct-picked__clear" @click="clearAcctSelection">清空</el-button>
        </div>
        <div class="acct-picked__body">
          <div v-for="a in acctTemp" :key="a.id" class="acct-picked__item">
            <span class="acct-picked__name" :title="a.name">{{ a.name }}</span>
            <el-icon class="acct-picked__del" title="移除" @click="removeAccount(a)"><Close /></el-icon>
          </div>
          <el-empty v-if="!acctTemp.length" description="暂无" :image-size="48" />
        </div>
      </div>
    </div>

    <!-- 分页（线上：共 N 条 + 每页条数 + 页码 + 前往 N 页） -->
    <div class="acct-pager">
      <span class="acct-total">共 {{ filteredAccounts.length }} 条</span>
      <el-select v-model="acctPageSize" class="acct-size" size="small">
        <el-option v-for="s in [10, 20, 50, 100, 200]" :key="s" :label="`${s}条/页`" :value="s" />
      </el-select>
      <el-pagination
        v-model:current-page="acctPage"
        :page-size="acctPageSize"
        :total="filteredAccounts.length"
        layout="prev, pager, next"
        size="small"
      />
      <span class="acct-jump">前往</span>
      <el-input v-model="acctJumpPage" class="acct-jump__input" size="small" />
      <span class="acct-jump">页</span>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="!acctTemp.length" @click="confirmAccounts">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, inject } from 'vue';

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

/** 显隐：外部 v-model 优先；未传时回落 batch 内部状态 */
const visible = computed({
  get: () => (props.modelValue === undefined ? !!acctVisible.value : props.modelValue),
  set: (v) => {
    if (acctVisible) acctVisible.value = v;
    emit('update:modelValue', v);
  },
});

/** 账户主体下拉（线上为多选列表，本地按主体过滤） */
const subjectOptions = computed(() => {
  const accs = Array.isArray(batch.mediaAccounts) ? batch.mediaAccounts : (batch.mediaAccounts?.value || []);
  const list = accs.map((a) => a.subject).filter(Boolean);
  return [...new Set([subject, ...list])];
});
</script>

<style scoped>
/* 筛选区（线上：白底 + 12px 16px 内边距 + 底部 1px #e8eaec 分隔线） */
.acct-filter {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e8eaec;
}
.acct-filter__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.acct-filter__row + .acct-filter__row { margin-top: 12px; }
.acct-f { flex: none; }
.acct-f--project { width: 261px; }
.acct-f--subject { width: 261px; }
.acct-f--developer { width: 233px; }
.acct-f__label { font-size: 12px; color: #4e5969; white-space: nowrap; }

/* 搜索组（线上：[账户ID ▾] | [搜索媒体账户 + 批量搜索] | [搜索按钮]，三者共用一个外框） */
.acct-sg {
  display: inline-flex;
  align-items: stretch;
  height: 28px;
  flex: none;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  background: #fff;
  overflow: hidden;
  transition: border-color .2s;
}
.acct-sg:hover { border-color: #c0c4cc; }
.acct-sg:focus-within { border-color: #197afb; }
.acct-sg__type { width: 110px !important; flex: 0 0 110px; }
.acct-sg__type :deep(.el-select__wrapper) {
  height: 26px;
  padding-left: 12px;
  padding-right: 26px;
  border-radius: 2px 0 0 2px;
  background: transparent;
  box-shadow: none !important;
  border-right: 1px solid #dcdfe6;
}
.acct-sg__type :deep(.el-select__caret) { color: #c0c4cc; }
.acct-sg__input { width: 208px !important; flex: 0 0 208px; }
.acct-sg__input :deep(.el-input__wrapper) {
  height: 26px;
  padding-left: 12px;
  background: transparent;
  box-shadow: none !important;
}
.acct-sg__btn {
  flex: none;
  width: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-left: 1px solid #dcdfe6;
  background: transparent;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  transition: color .15s;
}
.acct-sg__btn:hover { color: #197afb; }
.acct-search__batch { cursor: pointer; color: #86909c; transition: color .15s; }
.acct-search__batch:hover { color: #197afb; }
.acct-clear { padding: 0 4px; font-size: 13px; }

/* 提示 */
.acct-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 0 8px;
  font-size: 12px;
  color: #86909c;
}
.acct-tip__icon { color: #f77234; font-size: 14px; }

/* 账户表 + 已选面板 */
.acct-body { display: flex; align-items: flex-start; gap: 8px; }
.acct-table { flex: 1; min-width: 0; }
/* 线上行高 56px、表头 #fafafa */
.acct-table :deep(.el-table__cell) { padding: 0; height: 56px; }
.acct-table :deep(th.el-table__cell) { background: #fafafa; }
.acct-table :deep(.cell) { padding: 0 12px; font-size: 12px; line-height: 1.5; }
.acct-name {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-right: 78px;
}
.acct-name p { margin: 0; }
.acct-id { color: #86909c; }
.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.acct-guard {
  position: absolute;
  right: 0;
  top: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  height: 20px;
  font-size: 12px;
  color: #86909c;
  background: #f2f3f5;
  border-radius: 10px;
}
.acct-guard__icon { font-size: 12px; }

/* 已选面板（线上：200px 卡片，48px 头 + 352px 体） */
.acct-picked {
  box-sizing: border-box;
  flex: 0 0 200px;
  width: 200px;
  height: 400px;
  background: #fff;
  border: 1px solid #dcdde2;
  border-radius: 4px;
  overflow: hidden;
}
.acct-picked__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 8px 0 12px;
  color: #333;
  background: #f2f2f2;
  border-bottom: 1px solid #dcdde2;
}
.acct-picked__title { font-size: 13px; }
.acct-picked__num { margin-left: 2px; }
.acct-picked__clear { padding: 0; font-size: 12px; }
.acct-picked__body { flex: 1 1 0; min-height: 0; overflow: hidden auto; padding: 8px 12px; }
.acct-picked__item {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 6px 0 10px;
  margin-bottom: 6px;
  background: #f7f8fa;
  border-radius: 4px;
}
.acct-picked__name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: #4e5969;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.acct-picked__del { flex: none; cursor: pointer; font-size: 13px; color: #86909c; transition: color .15s; }
.acct-picked__del:hover { color: #197afb; }

/* 分页 */
.acct-pager { display: flex; align-items: center; gap: 10px; margin-top: 16px; }
.acct-total { font-size: 13px; color: #4e5969; }
.acct-size { width: 110px; }
.acct-jump { font-size: 13px; color: #4e5969; }
.acct-jump__input { width: 46px; }

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
.el-dialog.acct-dialog .el-dialog__body { flex: 1; min-height: 0; overflow: hidden; }
.el-dialog.acct-dialog .el-dialog__header { margin-right: 0; padding: 16px 32px; line-height: 18px; border-bottom: 1px solid #e8eaec; }
.el-dialog.acct-dialog .el-dialog__title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.el-dialog.acct-dialog .el-dialog__body { padding: 24px 32px; color: #606266; }
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
.el-dialog.acct-dialog .el-select .el-input__inner,
.el-dialog.acct-dialog .el-input--small .el-input__inner { height: 28px; line-height: 28px; font-size: 12px; }
.el-dialog.acct-dialog .el-select--small .el-select__wrapper { min-height: 28px; }
.el-dialog.acct-dialog .el-button--small { height: 28px; }
.el-dialog.acct-dialog .el-pagination { font-size: 13px; }
.el-dialog.acct-dialog .el-pagination__total,
.el-dialog.acct-dialog .el-pagination__jump { font-size: 13px; color: #606266; }
/* 批量搜索浮层外壳（teleport 到 body，需全局样式） */
.acct-batch-pop.el-popover { --el-popover-padding: 0; border-radius: 6px; }
</style>
