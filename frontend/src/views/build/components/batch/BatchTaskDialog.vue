<template>
  <!--
    选择任务弹窗（1:1 复刻线上 cl.mobgi.com「程序化批量/巨量广告」→ 步骤区「选择任务」）
    线上基准：el-dialog.cl-dialog--large 1025×710，垂直居中（align-center）
    线上筛选行：媒体账户：/ 创建时间：（日期区间）/ 维度 select（80px）/ 关键词输入（带放大镜）/ 清空
    线上表格列：[单选框(45), 任务ID(159), 任务名称(596), 创建时间(160)]，底部 取 消 / 确 认（各 120px）
  -->
  <el-dialog
    :model-value="modelValue"
    title="选择任务"
    width="1025px"
    class="task-dialog"
    align-center
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="onOpen"
  >
    <div class="task-filter">
      <!-- 媒体账户 -->
      <el-select v-model="taskFilter.account_id" class="tf tf--account" clearable placeholder="全部">
        <template #prefix><span class="tf__label">媒体账户：</span></template>
        <el-option v-for="a in accounts" :key="a.id" :value="a.id" :label="a.name" />
      </el-select>

      <!-- 创建时间（线上：标签在日期框内，日期框 330px） -->
      <div class="tf tf--date">
        <span class="tf__label">创建时间：</span>
        <el-date-picker
          v-model="taskFilter.date_range"
          type="daterange"
          unlink-panels
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="tf__date"
        />
      </div>

      <!-- 关键词维度 -->
      <el-select v-model="taskFilter.name_type" class="tf tf--dim" placeholder="请选择">
        <el-option label="任务名称" value="name" />
        <el-option label="任务ID" value="id" />
      </el-select>

      <!-- 关键词 -->
      <el-input v-model="taskFilter.keyword" class="tf tf--kw" clearable placeholder="请输入关键词">
        <template #suffix>
          <el-icon class="tf-kw__icon" title="搜索" @click="onSearch"><Search /></el-icon>
        </template>
      </el-input>

      <el-button link type="primary" class="task-clear" @click="onReset">清空</el-button>
    </div>

    <el-table
      :data="taskPageRows"
      border
      size="small"
      height="447"
      class="task-table"
      highlight-current-row
      @row-click="selectTask"
    >
      <el-table-column width="45" align="center">
        <template #default="{ row }">
          <el-radio :model-value="taskSelectedId" :value="row.id" @change="selectTask(row)" @click.stop />
        </template>
      </el-table-column>
      <el-table-column label="任务ID" prop="task_no" width="159" />
      <el-table-column label="任务名称" prop="name" min-width="320" show-overflow-tooltip />
      <el-table-column label="创建时间" prop="created_at" width="160" />
    </el-table>

    <div class="task-pager">
      <span class="task-total">共 {{ taskFiltered.length }} 条</span>
      <el-pagination
        v-model:current-page="taskPage"
        :page-size="taskPageSize"
        :total="taskFiltered.length"
        layout="prev, pager, next"
        size="small"
      />
      <span class="task-jump">前往</span>
      <el-input v-model="taskJumpPage" class="task-jump__input" size="small" />
      <span class="task-jump">页</span>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="!taskSelected" @click="confirmTask">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, inject } from 'vue';

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

/** 显隐：外部 v-model 优先；未传时回落 batch 内部状态 */
const visible = computed({
  get: () => (props.modelValue === undefined ? !!taskVisible.value : props.modelValue),
  set: (v) => {
    if (taskVisible) taskVisible.value = v;
    emit('update:modelValue', v);
  },
});

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
/* 筛选行：线上单行，媒体账户 261 / 日期 330 / 维度 80 / 关键词 217，控件高 28px */
.task-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.tf { flex: none; }
.tf--account { width: 255px; }
.tf--date {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  width: 330px;
  height: 28px;
  padding: 0 10px 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  background: #fff;
}
.tf--date :deep(.tf__date) {
  flex: 1 1 auto;
  min-width: 0;
  width: auto;
  height: 26px;
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}
.tf--date :deep(.tf__date .el-range-input) { width: 90px; }
.tf--dim { width: 80px; }
.tf--dim :deep(.el-select__wrapper) { padding-left: 8px; padding-right: 18px; }
.tf--kw { width: 217px; }
.tf__label { font-size: 12px; color: #4e5969; white-space: nowrap; }
.tf-kw__icon { cursor: pointer; color: #86909c; }
.tf-kw__icon:hover { color: #197afb; }
.task-clear { padding: 0 4px; font-size: 13px; }

/* 表格：线上行高 40px、表头 #fff + 下边线 #ebeff5 */
.task-table :deep(.el-table__cell) { padding: 8px 0; height: 40px; }
.task-table :deep(.cell) { font-size: 12px; line-height: 20px; }

/* 分页 */
.task-pager { display: flex; align-items: center; gap: 10px; margin-top: 16px; }
.task-total { font-size: 13px; color: #606266; }
.task-jump { font-size: 13px; color: #606266; }
.task-jump__input { width: 46px; }
</style>

<style>
/* 弹窗外壳（teleport 到 body，需全局样式）
   线上实测：header padding 16px 32px + 下边线 #e8eaec；body padding 24px 32px；footer padding 11px 32px 30px + 上边线 */
.el-dialog.task-dialog { max-width: calc(100vw - 40px); padding: 0; }
.el-dialog.task-dialog .el-dialog__header { margin-right: 0; padding: 16px 32px; line-height: 18px; border-bottom: 1px solid #e8eaec; }
.el-dialog.task-dialog .el-dialog__title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.el-dialog.task-dialog .el-dialog__body { padding: 24px 32px; color: #606266; }
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
.el-dialog.task-dialog .el-select .el-input__inner,
.el-dialog.task-dialog .el-input--small .el-input__inner { height: 28px; line-height: 28px; font-size: 12px; }
.el-dialog.task-dialog .el-select__wrapper { min-height: 28px; }
.el-dialog.task-dialog .el-input__wrapper { min-height: 28px; }
.el-dialog.task-dialog .el-range-input { font-size: 13px; }
.el-dialog.task-dialog .el-button--small { height: 28px; }
.el-dialog.task-dialog .el-pagination { font-size: 13px; }
.el-dialog.task-dialog .el-pagination__total,
.el-dialog.task-dialog .el-pagination__jump { font-size: 13px; color: #606266; }
</style>
