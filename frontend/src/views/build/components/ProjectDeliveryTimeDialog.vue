<template>
  <el-dialog
    :model-value="modelValue"
    title="批量修改投放时间"
    width="520px"
    class="pdt-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="pdt-body">
      <div class="pdt-count">已选 {{ rows.length }} 条可操作项目</div>

      <!-- 投放时间 -->
      <div class="pdt-row">
        <span class="pdt-label">投放时间</span>
        <el-radio-group v-model="scheduleType" class="pdt-radio">
          <el-radio value="SCHEDULE_FROM_NOW">长期投放</el-radio>
          <el-radio value="SCHEDULE_START_END">指定起止时间</el-radio>
        </el-radio-group>
      </div>

      <!-- 结束日期（仅「指定起止时间」时出现） -->
      <div v-if="scheduleType === 'SCHEDULE_START_END'" class="pdt-row">
        <span class="pdt-label">结束日期</span>
        <el-date-picker
          v-model="endTime"
          type="date"
          placeholder="请选择结束日期"
          value-format="YYYY-MM-DD"
          class="pdt-date"
        />
      </div>
    </div>

    <template #footer>
      <el-button @click="close">关 闭</el-button>
      <el-button type="primary" @click="confirm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getBatchOpConfig } from '@/api/oceanengine';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projects: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const OP = '批量修改投放时间';

// 默认「指定起止时间」（与线上一致）
const scheduleType = ref('SCHEDULE_START_END');
const endTime = ref('');

/** 可操作项目（去掉合计行） */
const rows = computed(() => (props.projects || []).filter((p) => !p.__total));

function init() {
  scheduleType.value = 'SCHEDULE_START_END';
  endTime.value = '';
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  const form = {
    schedule_type: scheduleType.value,
    end_time: scheduleType.value === 'SCHEDULE_START_END' ? endTime.value : undefined,
  };
  const cfg = getBatchOpConfig('project', OP);
  let payload = null;
  if (cfg && typeof cfg.build === 'function') {
    try {
      payload = cfg.build(rows.value, form);
    } catch (e) {
      payload = { error: String(e) };
    }
  }
  ElMessage.success(
    `原型：已提交批量修改投放时间任务（${rows.value.length} 个项目，${scheduleType.value === 'SCHEDULE_FROM_NOW' ? '长期投放' : '指定起止时间'}）`
  );
  emit('confirm', { op: OP, rows: rows.value, form, payload });
  close();
}
</script>

<style scoped>
.pdt-body {
  --el-font-size-base: 14px;
  --el-font-size-small: 13px;
  font-size: 14px;
  color: #1d2129;
}
.pdt-count { font-size: 14px; color: #86909c; }

.pdt-row { display: flex; align-items: center; gap: 12px; margin-top: 22px; }
.pdt-label { flex: none; width: 84px; font-size: 14px; color: #1d2129; }
.pdt-radio { display: flex; align-items: center; }
.pdt-radio :deep(.el-radio) { margin-right: 28px; }
.pdt-radio :deep(.el-radio__label) { font-size: 14px; color: #1d2129; }
.pdt-radio :deep(.el-radio__input.is-checked + .el-radio__label) { color: #165dff; }
.pdt-date { width: 240px; }
</style>

<style>
/* 弹窗外壳：与线上一致 */
.pdt-dialog .el-dialog__header { margin-right: 0; padding: 18px 20px 14px; border-bottom: 1px solid #e5e6eb; }
.pdt-dialog .el-dialog__title { font-size: 18px; font-weight: 600; color: #1d2129; }
.pdt-dialog .el-dialog__body { padding: 18px 40px 24px; }
.pdt-dialog .el-dialog__footer { padding: 12px 20px 20px; }
</style>
