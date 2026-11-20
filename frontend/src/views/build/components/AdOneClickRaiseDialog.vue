<template>
  <el-dialog
    :model-value="modelValue"
    title="设置一键起量"
    width="820px"
    align-center
    class="mcr-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="mcr-body">
      <!-- 预算设置规则（广告独有字段） -->
      <div class="mcr-item">
        <span class="mcr-label">预算设置规则</span>
        <div class="mcr-content">
          <el-radio-group v-model="budgetRule" size="small" class="mcr-radio">
            <el-radio-button border value="all">统一设置</el-radio-button>
            <el-radio-button border value="each">分别设置</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 起量预算 -->
      <div class="mcr-item">
        <span class="mcr-label">起量预算</span>
        <div class="mcr-content mcr-content-inline">
          <el-input v-model="budget" placeholder="请输入起量预算" class="mcr-input-260" />
          <el-button type="primary" size="small" class="mcr-apply" @click="applyBudgetAll">应用到所有</el-button>
        </div>
      </div>

      <!-- 起量生效时间（广告独有字段） -->
      <div class="mcr-item">
        <span class="mcr-label">起量生效时间</span>
        <div class="mcr-content">
          <el-radio-group v-model="timeMode" size="small" class="mcr-radio">
            <el-radio-button border value="now">立即生效</el-radio-button>
            <el-radio-button border value="appoint">指定时间</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 指定投放时间 + 重复周期（广告独有字段） -->
      <template v-if="timeMode === 'appoint'">
        <div class="mcr-item">
          <span class="mcr-label">指定投放时间</span>
          <div class="mcr-content mcr-content-inline">
            <div class="mcr-date-260">
              <el-date-picker
                v-model="appointTime"
                type="datetime"
                placeholder="请选择起量时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                size="small"
                :prefix-icon="Clock"
              />
            </div>
            <el-button type="primary" size="small" class="mcr-apply" @click="applyTimeAll">应用到所有</el-button>
          </div>
        </div>

        <div class="mcr-item">
          <span class="mcr-label">重复周期</span>
          <div class="mcr-content">
            <el-select v-model="repeatedDay" placeholder="请选择重复周期" class="mcr-select-260" size="small">
              <el-option v-for="o in REPEATED_DAY" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
            <p class="mcr-tip">不传重复周期时起量时间精确到分；选择重复周期时起量时间精确到时分。</p>
          </div>
        </div>
      </template>

      <!-- 广告列表 -->
      <el-table :data="pageRows" border size="small" class="mcr-table" height="400">
        <el-table-column label="广告" min-width="313">
          <template #default="{ row }">
            <div class="mcr-cell">
              <div class="mcr-cell-title" :title="row.name">{{ row.name }}</div>
              <div class="mcr-cell-desc">ID：{{ row.pid }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="起量预算" width="229">
          <template #default="{ row }">
            <el-input v-model="row.budget" placeholder="请输入起量预算" size="small" class="mcr-cell-input" />
          </template>
        </el-table-column>
        <el-table-column label="起量生效时间" width="229">
          <template #default="{ row }">
            <div v-if="timeMode === 'appoint'" class="mcr-cell-date">
              <el-date-picker
                v-model="row.appointTime"
                type="datetime"
                placeholder="请选择起量时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                size="small"
                :prefix-icon="Clock"
              />
            </div>
            <span v-else class="mcr-dyn-text">立即生效</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        class="mcr-pager"
        layout="total, sizes, prev, pager, next, jumper"
        :total="rows.length"
        :current-page="page"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="onPageChange"
        @size-change="onSizeChange"
      />
    </div>

    <template #footer>
      <el-button size="small" @click="close">取消</el-button>
      <el-button size="small" type="primary" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Clock } from '@element-plus/icons-vue';
import { getBatchOpConfig } from '@/api/oceanengine';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  rows: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const OP = '开启一键起量';

/** 重复周期（广告独有字段） */
const REPEATED_DAY = [
  { label: '每天重复', value: 'EVERY_DAY' },
  { label: '每周一', value: 'PER_MONDAY' },
  { label: '每周二', value: 'PER_TUESDAY' },
  { label: '每周三', value: 'PER_WEDNESDAY' },
  { label: '每周四', value: 'PER_THURSDAY' },
  { label: '每周五', value: 'PER_FRIDAY' },
  { label: '每周六', value: 'PER_SATURDAY' },
  { label: '每周日', value: 'PER_SUNDAY' },
];

/** 可操作广告（去掉合计行） */
const rows = ref([]);

// 预算设置规则：all 统一设置 / each 分别设置（广告独有字段）
const budgetRule = ref('all');
// 起量预算（批量值）
const budget = ref('');
// 起量生效时间：now 立即生效 / appoint 指定时间（广告独有字段）
const timeMode = ref('now');
// 指定投放时间
const appointTime = ref('');
// 重复周期
const repeatedDay = ref('');
// 分页
const page = ref(1);
const pageSize = ref(20);

const pageRows = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return rows.value.slice(start, start + pageSize.value);
});

function init() {
  budgetRule.value = 'all';
  budget.value = '';
  timeMode.value = 'now';
  appointTime.value = '';
  repeatedDay.value = '';
  page.value = 1;
  pageSize.value = 20;
  const list = (props.rows || []).filter((r) => !r.__summary);
  rows.value = list.map((r) => ({
    id: r.id,
    pid: r.ad_id || r.id,
    name: r.name,
    budget: '',
    appointTime: '',
  }));
}

/** 起量预算应用到所有广告 */
function applyBudgetAll() {
  rows.value.forEach((r) => {
    r.budget = budget.value;
  });
}

/** 指定投放时间应用到所有广告 */
function applyTimeAll() {
  if (timeMode.value !== 'appoint') return;
  rows.value.forEach((r) => {
    r.appointTime = appointTime.value;
  });
}

function onPageChange(p) {
  page.value = p;
}

function onSizeChange(s) {
  pageSize.value = s;
  page.value = 1;
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  const hasBudget = budget.value !== '' || rows.value.some((r) => r.budget !== '');
  if (!hasBudget) {
    ElMessage.warning('请输入起量预算');
    return;
  }
  if (timeMode.value === 'appoint') {
    const hasTime = appointTime.value !== '' || rows.value.some((r) => r.appointTime !== '');
    if (!hasTime) {
      ElMessage.warning('请选择指定投放时间');
      return;
    }
  }
  const form = {
    budgetRule: budgetRule.value,
    raise_budget: budget.value,
    is_effective_now: timeMode.value === 'now' ? '立即生效' : '指定时间',
    appointed_time: appointTime.value,
    repeated_day: repeatedDay.value,
  };
  const cfg = getBatchOpConfig('promotion', OP);
  let payload = null;
  if (cfg && typeof cfg.build === 'function') {
    try {
      payload = cfg.build(rows.value, form);
    } catch (e) {
      payload = { error: String(e) };
    }
  }
  const timeText = timeMode.value === 'now' ? '立即生效' : appointTime.value || '按广告分别设置';
  ElMessage.success(
    `原型：已提交设置一键起量任务（${rows.value.length} 条广告，起量预算：${
      budget.value || '按广告分别设置'
    }，起量生效时间：${timeText}）`
  );
  emit('confirm', { op: OP, rows: rows.value, form, payload });
  close();
}
</script>

<style scoped>
.mcr-body {
  --el-font-size-base: 14px;
  --el-font-size-small: 12px;
  font-size: 14px;
  color: #606266;
}

/* 表单行：标签 150px，行间距 18px（与线上一致） */
.mcr-item { display: flex; align-items: flex-start; margin-bottom: 18px; }
.mcr-label { flex: none; width: 150px; font-size: 14px; line-height: 32px; color: #666; }
.mcr-content { flex: 1; min-width: 0; }
.mcr-content-inline { display: flex; align-items: center; }

/* 固定宽度输入框（与线上一致：260px / 80px / 32px 高） */
.mcr-input-260 { width: 260px; --el-input-height: 32px; }
.mcr-select-260 { width: 260px; }
.mcr-select-260 :deep(.el-select__wrapper) { min-height: 32px; }
.mcr-input-80 { width: 80px; --el-input-height: 32px; }

/* 日期选择器（线上为 260px / 32px，EP 默认 220px / 24px，需强制覆盖） */
.mcr-date-260 { width: 260px; }
.mcr-date-260 :deep(.el-date-editor) { width: 260px; --el-input-height: 32px; }
.mcr-cell-date { width: 100%; }
.mcr-cell-date :deep(.el-date-editor) { width: 100%; --el-input-height: 32px; }

/* 动态时间行（14px #606266） */
.mcr-dyn-row { display: flex; align-items: center; gap: 8px; font-size: 14px; line-height: 32px; color: #606266; }

/* 动态时间说明（12px #999，与线上一致） */
.mcr-tip { margin: 8px 0 0; font-size: 12px; line-height: 18px; color: #999; }

/* 项目表格（与线上一致：表头 48px / 行高 48px / 边框 #ebeef5） */
.mcr-table { --el-table-border-color: #ebeef5; --el-table-header-text-color: #333; width: 100%; }
.mcr-table :deep(.el-table__header-wrapper th.el-table__cell) { height: 48px; padding: 0; background: #fff; }
.mcr-table :deep(.el-table__body-wrapper td.el-table__cell) { height: 48px; padding: 5.5px 0; }
.mcr-table :deep(th.el-table__cell .cell) { font-size: 12px; font-weight: 700; color: #333; }
.mcr-table :deep(td.el-table__cell .cell) { font-size: 12px; line-height: 18px; color: #333; }

/* 单元格内的项目名称 / 项目ID（与线上一致） */
.mcr-cell-title { font-size: 12px; line-height: 18px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mcr-cell-desc { font-size: 12px; line-height: 18px; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 单元格内的输入框（占满单元格，32px 高） */
.mcr-cell-input { width: 100%; --el-input-height: 32px; }

/* 动态时间单元格文案（12px #999，与线上一致） */
.mcr-dyn-text { font-size: 12px; line-height: 18px; color: #999; }

/* 分页（13px #999，与线上一致） */
.mcr-pager { margin-top: 16px; --el-pagination-font-size: 13px; --el-pagination-button-disabled-bg-color: #fff; }
.mcr-pager :deep(.el-pagination__total) { color: #999; }
.mcr-pager :deep(.el-select) { width: 100px; }
.mcr-pager :deep(.el-input__wrapper) { height: 32px; box-sizing: border-box; --el-input-height: 32px; }
.mcr-pager :deep(.el-pagination__editor) { width: 46px; }

/* 分段按钮（选中为蓝字 + 浅蓝底 + 蓝框，80×32，与线上一致） */
.mcr-radio :deep(.el-radio-button__inner) {
  min-width: 80px;
  padding: 9px 12px;
  font-size: 12px;
  line-height: 12px;
  font-weight: 500;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  outline: none;
  box-shadow: none;
}
.mcr-radio :deep(.el-radio-button.is-active .el-radio-button__inner) {
  color: #197afb;
  background: #d6eaff;
  border-color: #197afb;
  box-shadow: none;
}
.mcr-radio :deep(.el-radio-button__original-radio:disabled + .el-radio-button__inner) {
  color: #c0c4cc;
  background: #fff;
  border-color: #ebeef5;
}
</style>

<style>
/* 弹窗外壳：与线上一致（820px 弹窗 / 标题 16px 700 #333 / body 20px 24px） */
.mcr-dialog { padding: 0; }
.mcr-dialog .el-dialog__header { margin-right: 0; padding: 14px 24px; border-bottom: 1px solid #e8eaec; }
.mcr-dialog .el-dialog__title { font-size: 16px; font-weight: 700; line-height: 18px; color: #333; }
.mcr-dialog .el-dialog__body { padding: 20px 24px; }
.mcr-dialog .el-dialog__footer { padding: 0 24px 20px; }
.mcr-dialog .el-dialog__footer .el-button { width: 80px; height: 32px; }
.mcr-dialog .el-dialog__footer .el-button + .el-button { margin-left: 16px; }

/* 小尺寸按钮统一 32px（EP 的 small 为 24px，线上为 32px） */
.mcr-dialog .el-button--small { height: 32px; }

/* 「应用到所有」按钮（92×32，主色 #197afb，与线上一致） */
.mcr-dialog .mcr-apply {
  width: 92px;
  margin-left: 16px;
  padding: 0;
  font-size: 12px;
  background: #197afb;
  border-color: #197afb;
}
.mcr-dialog .mcr-apply:hover { background: #4a9bff; border-color: #4a9bff; }

/* 页脚主按钮配色与线上一致 */
.mcr-dialog .el-dialog__footer .el-button--primary { background: #197afb; border-color: #197afb; }
.mcr-dialog .el-dialog__footer .el-button--primary:hover { background: #4a9bff; border-color: #4a9bff; }
/* 页脚次按钮（线上边框 #d0d0d0） */
.mcr-dialog .el-dialog__footer .el-button:not(.el-button--primary) { border-color: #d0d0d0; color: #666; }

/* 「指定素材」禁用态仍保留气泡 */
.mcr-radio-text { display: inline-block; }

/* 气泡（白底 + 1px #ebeef5 边框 + 12px 内边距，与线上一致） */
.mcr-pop { padding: 12px !important; font-size: 12px !important; line-height: 18px !important; color: #606266 !important; }
</style>
