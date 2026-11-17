<template>
  <el-dialog
    :model-value="modelValue"
    title="设置账户RTA"
    width="760px"
    class="batch-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="batch-body">
      <div class="rta-row">
        <span class="rta-label">RTAID</span>
        <el-input v-model="rtaId" placeholder="请输入RTAID" class="rta-input" />
      </div>
      <el-checkbox v-model="notifyFail" class="rta-check">操作失败通知我</el-checkbox>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :disabled="!rtaId.trim()" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  accounts: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const rtaId = ref('');
const notifyFail = ref(false);

function init() {
  rtaId.value = '';
  notifyFail.value = false;
}

function confirm() {
  ElMessage.success(`原型：已提交设置账户RTA（RTAID ${rtaId.value.trim()}，账户 ${props.accounts.length} 个）`);
  emit('confirm', { rtaId: rtaId.value.trim(), notifyFail: notifyFail.value, accounts: props.accounts });
  emit('update:modelValue', false);
}
</script>

<style scoped>
.batch-body {
  --el-font-size-base: 15px;
  --el-font-size-small: 14px;
  font-size: 15px;
  color: #1d2129;
}
.rta-row { display: flex; align-items: center; gap: 12px; }
.rta-label { flex: none; width: 76px; font-size: 15px; color: #4e5969; }
.rta-input { width: 420px; }
.rta-check { margin-top: 18px; }
</style>
