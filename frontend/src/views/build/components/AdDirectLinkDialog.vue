<template>
  <el-dialog
    :model-value="modelValue"
    title="修改广告直达链接"
    width="560px"
    class="pdl-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="pdl-body">
      <div class="pdl-count">已选中{{ rows.length }}个广告</div>

      <el-form label-width="100px" label-position="left" class="pdl-form">
        <el-form-item label="直达链接">
          <el-input
            v-model="openUrl"
            placeholder="请输入直达链接"
            maxlength="2000"
            class="pdl-input"
          >
            <template #suffix>
              <span class="pdl-num">{{ (openUrl || '').length }}/2000</span>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="close">取 消</el-button>
      <el-button type="primary" @click="confirm">保 存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getBatchOpConfig } from '@/api/oceanengine';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  rows: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const OP = '修改直达链接';

const openUrl = ref('');

/** 可操作广告（去掉合计行） */
const rows = computed(() => (props.rows || []).filter((r) => !r.__summary));

function init() {
  openUrl.value = '';
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  const form = { open_url: openUrl.value.trim() };
  const cfg = getBatchOpConfig('promotion', OP);
  let payload = null;
  if (cfg && typeof cfg.build === 'function') {
    try {
      payload = cfg.build(rows.value, form);
    } catch (e) {
      payload = { error: String(e) };
    }
  }
  ElMessage.success(`原型：已提交批量修改直达链接任务（${rows.value.length} 条广告）`);
  emit('confirm', { op: OP, rows: rows.value, form, payload });
  close();
}
</script>

<style scoped>
.pdl-body {
  --el-font-size-base: 14px;
  --el-font-size-small: 13px;
  font-size: 14px;
  color: #1d2129;
}
.pdl-count { font-size: 14px; color: #666; }

.pdl-form { margin-top: 20px; }
.pdl-form :deep(.el-form-item__label) { font-size: 14px; color: #666; }
.pdl-input { width: 100%; }
.pdl-input :deep(.el-input__wrapper) { border-radius: 2px; }
.pdl-input :deep(.el-input__inner) { font-size: 13px; }
.pdl-num { font-size: 12px; color: #909399; }
</style>

<style>
/* 弹窗外壳：与线上一致（560px 弹窗 / 标题 16px 700 #333 / body 24px 32px） */
.pdl-dialog { padding: 0; }
.pdl-dialog .el-dialog__header { margin-right: 0; padding: 16px 32px; border-bottom: 1px solid #e5e6eb; }
.pdl-dialog .el-dialog__title { font-size: 16px; font-weight: 700; color: #333; line-height: 18px; }
.pdl-dialog .el-dialog__body { padding: 24px 32px; }
.pdl-dialog .el-dialog__footer { padding: 11px 32px 30px; border-top: 1px solid #e5e6eb; }
.pdl-dialog .el-dialog__footer .el-button { width: 120px; }
</style>
